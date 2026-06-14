<template>
  <div class="services-page">
    <div class="page-header">
      <h1>我的服务</h1>
      <a-button type="primary" @click="$router.push('/products')">
        <PlusOutlined /> 购买新服务
      </a-button>
    </div>
    
    <a-tabs v-model:activeKey="activeTab" @change="fetchServices">
      <a-tab-pane key="all" tab="全部服务" />
      <a-tab-pane key="running" tab="运行中" />
      <a-tab-pane key="stopped" tab="已停止" />
      <a-tab-pane key="suspended" tab="已暂停" />
    </a-tabs>
    
    <a-spin v-if="loading" />
    <template v-else>
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="8" v-for="service in services" :key="service.id">
          <div class="service-card">
            <div class="service-header">
              <span class="service-name">{{ service.name }}</span>
              <a-tag :color="getStatusColor(service.status)">
                {{ getStatusText(service.status) }}
              </a-tag>
            </div>
            
            <div class="service-info">
              <div class="info-item">
                <span class="label">IP</span>
                <span class="value">{{ service.ipv4 || '未分配' }}</span>
              </div>
              <div class="info-item">
                <span class="label">IPv6</span>
                <span class="value">{{ service.ipv6 || '未分配' }}</span>
              </div>
              <div class="info-item">
                <span class="label">配置</span>
                <span class="value">{{ service.cpu }}核 / {{ service.memory }}MB / {{ service.disk }}GB</span>
              </div>
              <div class="info-item">
                <span class="label">到期时间</span>
                <span class="value" :class="{ 'text-error': isExpiringSoon(service.expire_time) }">
                  {{ formatDate(service.expire_time) }}
                </span>
              </div>
            </div>
            
            <div class="service-actions">
              <a-button-group>
                <a-button v-if="service.status !== 'running'" type="primary" @click="handleAction(service.id, 'start')">
                  <PlayCircleOutlined /> 开机
                </a-button>
                <a-button v-if="service.status === 'running'" @click="handleAction(service.id, 'stop')">
                  <PauseCircleOutlined /> 关机
                </a-button>
                <a-button @click="handleAction(service.id, 'restart')">
                  <ReloadOutlined /> 重启
                </a-button>
              </a-button-group>
              <a-button @click="$router.push(`/services/${service.id}`)">
                <EyeOutlined /> 管理
              </a-button>
            </div>
          </div>
        </a-col>
      </a-row>
      
      <a-empty v-if="services.length === 0" description="暂无服务">
        <a-button type="primary" @click="$router.push('/products')">立即购买</a-button>
      </a-empty>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getServices, startService, stopService, restartService } from '@/api/service'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

const loading = ref(false)
const services = ref([])
const activeTab = ref('all')

const getStatusColor = (status) => {
  const colors = {
    running: 'success',
    stopped: 'error',
    suspended: 'warning',
    pending: 'processing'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    running: '运行中',
    stopped: '已停止',
    suspended: '已暂停',
    pending: '开通中'
  }
  return texts[status] || status
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const isExpiringSoon = (date) => {
  return dayjs(date).diff(dayjs(), 'day') <= 7
}

const handleAction = async (id, action) => {
  const actions = {
    start: startService,
    stop: stopService,
    restart: restartService
  }
  
  try {
    await actions[action](id)
    message.success('操作成功')
    fetchServices()
  } catch (error) {
    message.error(error.message)
  }
}

const fetchServices = async () => {
  loading.value = true
  try {
    const params = activeTab.value !== 'all' ? { status: activeTab.value } : {}
    const res = await getServices(params)
    services.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchServices()
})
</script>

<style lang="scss" scoped>
.services-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h1 {
      margin: 0;
    }
  }
}

.service-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  .service-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .service-name {
      font-weight: 600;
      font-size: 16px;
    }
  }
  
  .service-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    
    .info-item {
      .label {
        display: block;
        color: #999;
        font-size: 12px;
        margin-bottom: 4px;
      }
      
      .value {
        font-size: 13px;
        word-break: break-all;
      }
    }
  }
  
  .service-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>
