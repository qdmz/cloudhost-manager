<template>
  <div class="service-detail-page">
    <a-spin v-if="loading" />
    <template v-else-if="service">
      <div class="page-header">
        <div class="header-left">
          <a-button @click="$router.push('/my-services')">
            <ArrowLeftOutlined /> 返回
          </a-button>
          <h1>{{ service.name }}</h1>
          <a-tag :color="getStatusColor(service.status)">{{ getStatusText(service.status) }}</a-tag>
        </div>
        <div class="header-right">
          <a-button v-if="service.status !== 'running'" type="primary" @click="handleAction('start')">
            <PlayCircleOutlined /> 开机
          </a-button>
          <a-button v-if="service.status === 'running'" @click="handleAction('stop')">
            <PauseCircleOutlined /> 关机
          </a-button>
          <a-button @click="handleAction('restart')">
            <ReloadOutlined /> 重启
          </a-button>
        </div>
      </div>
      
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :lg="16">
          <div class="card">
            <div class="card-title">服务信息</div>
            <a-descriptions :column="2" bordered>
              <a-descriptions-item label="服务器ID">{{ service.id }}</a-descriptions-item>
              <a-descriptions-item label="节点">{{ service.node_name }}</a-descriptions-item>
              <a-descriptions-item label="IP地址">{{ service.ipv4 || '未分配' }}</a-descriptions-item>
              <a-descriptions-item label="IPv6地址">{{ service.ipv6 || '未分配' }}</a-descriptions-item>
              <a-descriptions-item label="CPU">{{ service.cpu }} 核心</a-descriptions-item>
              <a-descriptions-item label="内存">{{ service.memory }} MB</a-descriptions-item>
              <a-descriptions-item label="磁盘">{{ service.disk }} GB</a-descriptions-item>
              <a-descriptions-item label="流量">{{ service.bandwidth || '无限制' }}</a-descriptions-item>
              <a-descriptions-item label="操作系统">{{ service.os || '未知' }}</a-descriptions-item>
              <a-descriptions-item label="到期时间">
                <span :class="{ 'text-error': isExpiringSoon }">{{ formatDate(service.expire_time) }}</span>
              </a-descriptions-item>
            </a-descriptions>
          </div>
          
          <div class="card">
            <div class="card-title">在线管理</div>
            <div class="action-grid">
              <div class="action-item" @click="handleAction('vnc')">
                <VideoCameraOutlined />
                <span>VNC连接</span>
              </div>
              <div class="action-item" @click="handleAction('ssh')">
                <ConsoleSqlOutlined />
                <span>SSH终端</span>
              </div>
              <div class="action-item" @click="showResetPasswordModal = true">
                <KeyOutlined />
                <span>重置密码</span>
              </div>
              <div class="action-item" @click="showReinstallModal = true">
                <ReloadOutlined />
                <span>重装系统</span>
              </div>
              <div class="action-item" @click="syncService">
                <SyncOutlined />
                <span>同步状态</span>
              </div>
              <div class="action-item" @click="showRenewModal = true">
                <ClockCircleOutlined />
                <span>续费服务</span>
              </div>
            </div>
          </div>
        </a-col>
        
        <a-col :xs="24" :lg="8">
          <div class="card">
            <div class="card-title">使用统计</div>
            <div class="stats">
              <div class="stat-item">
                <span class="label">CPU使用</span>
                <a-progress :percent="stats.cpu" size="small" />
              </div>
              <div class="stat-item">
                <span class="label">内存使用</span>
                <a-progress :percent="stats.memory" size="small" :format="p => `${p}%`" />
              </div>
              <div class="stat-item">
                <span class="label">磁盘使用</span>
                <a-progress :percent="stats.disk" size="small" />
              </div>
              <div class="stat-item">
                <span class="label">网络流量</span>
                <span class="value">{{ service.network_usage || '0 GB' }} / {{ service.bandwidth || '无限制' }}</span>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-title">快捷操作</div>
            <a-space direction="vertical" style="width: 100%">
              <a-button block @click="showRenewModal = true">
                <DollarOutlined /> 续费服务
              </a-button>
              <a-button block @click="showResetPasswordModal = true">
                <KeyOutlined /> 重置密码
              </a-button>
              <a-button block type="dashed" @click="showReinstallModal = true">
                <ReloadOutlined /> 重装系统
              </a-button>
            </a-space>
          </div>
        </a-col>
      </a-row>
    </template>
    
    <a-modal v-model:open="showResetPasswordModal" title="重置密码" @ok="handleResetPassword">
      <a-form :model="passwordForm">
        <a-form-item label="新密码" name="password" :rules="[{ required: true, message: '请输入新密码' }]">
          <a-input-password v-model:value="passwordForm.password" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirm_password" :rules="[{ required: true, message: '请确认密码' }]">
          <a-input-password v-model:value="passwordForm.confirm_password" placeholder="再次输入密码" />
        </a-form-item>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="showReinstallModal" title="重装系统" @ok="handleReinstall">
      <a-form :model="reinstallForm">
        <a-form-item label="选择系统" name="image_id">
          <a-select v-model:value="reinstallForm.image_id" placeholder="请选择系统镜像">
            <a-select-option v-for="img in images" :key="img.id" :value="img.id">
              {{ img.name }} ({{ img.os }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-alert type="warning" show-icon>
          <template #message>警告</template>
          <template #description>
            重装系统将清除所有数据，请提前备份重要数据！
          </template>
        </a-alert>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="showRenewModal" title="续费服务">
      <a-form :model="renewForm">
        <a-form-item label="续费时长">
          <a-radio-group v-model:value="renewForm.cycle">
            <a-radio value="monthly">1个月</a-radio>
            <a-radio value="quarterly">3个月</a-radio>
            <a-radio value="yearly">1年</a-radio>
          </a-radio-group>
        </a-form-item>
        <div class="renew-summary">
          <p>续费费用：<strong>¥{{ renewPrice }}</strong></p>
          <p>到期时间将延长至：<strong>{{ newExpireDate }}</strong></p>
        </div>
      </a-form>
      <template #footer>
        <a-button @click="showRenewModal = false">取消</a-button>
        <a-button type="primary" @click="handleRenew">确认续费</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getService, startService, stopService, restartService, resetPassword, reinstallSystem, renewService, getServiceStats } from '@/api/service'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  ConsoleSqlOutlined,
  KeyOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  DollarOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const service = ref(null)
const stats = ref({ cpu: 0, memory: 0, disk: 0 })
const showResetPasswordModal = ref(false)
const showReinstallModal = ref(false)
const showRenewModal = ref(false)
const images = ref([])

const passwordForm = ref({ password: '', confirm_password: '' })
const reinstallForm = ref({ image_id: null })
const renewForm = ref({ cycle: 'monthly' })

const isExpiringSoon = computed(() => {
  if (!service.value) return false
  return dayjs(service.value.expire_time).diff(dayjs(), 'day') <= 7
})

const renewPrice = computed(() => {
  return renewForm.value.cycle === 'monthly' ? 50 :
         renewForm.value.cycle === 'quarterly' ? 140 : 480
})

const newExpireDate = computed(() => {
  if (!service.value) return ''
  const days = renewForm.value.cycle === 'monthly' ? 30 :
               renewForm.value.cycle === 'quarterly' ? 90 : 365
  return dayjs(service.value.expire_time).add(days, 'day').format('YYYY-MM-DD')
})

const getStatusColor = (status) => {
  const colors = { running: 'success', stopped: 'error', suspended: 'warning', pending: 'processing' }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = { running: '运行中', stopped: '已停止', suspended: '已暂停', pending: '开通中' }
  return texts[status] || status
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchService = async () => {
  loading.value = true
  try {
    const res = await getService(route.params.id)
    service.value = res.data
    images.value = res.data?.images || []
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getServiceStats(route.params.id)
    stats.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleAction = async (action) => {
  try {
    if (action === 'vnc') {
      window.open(`#/vnc/${service.value.id}`, '_blank')
      return
    }
    
    const actions = { start: startService, stop: stopService, restart: restartService }
    await actions[action](route.params.id)
    message.success('操作成功')
    fetchService()
  } catch (error) {
    message.error(error.message)
  }
}

const handleResetPassword = async () => {
  if (passwordForm.value.password !== passwordForm.value.confirm_password) {
    message.error('两次密码不一致')
    return
  }
  try {
    await resetPassword(route.params.id, { password: passwordForm.value.password })
    message.success('密码重置成功')
    showResetPasswordModal.value = false
  } catch (error) {
    message.error(error.message)
  }
}

const handleReinstall = async () => {
  if (!reinstallForm.value.image_id) {
    message.warning('请选择系统镜像')
    return
  }
  try {
    await reinstallSystem(route.params.id, reinstallForm.value)
    message.success('系统重装请求已提交')
    showReinstallModal.value = false
    fetchService()
  } catch (error) {
    message.error(error.message)
  }
}

const handleRenew = async () => {
  try {
    await renewService(route.params.id, renewForm.value)
    message.success('续费成功')
    showRenewModal.value = false
    fetchService()
  } catch (error) {
    message.error(error.message)
  }
}

const syncService = async () => {
  try {
    await getService(route.params.id)
    message.success('同步成功')
    fetchService()
    fetchStats()
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchService()
  fetchStats()
})
</script>

<style lang="scss" scoped>
.service-detail-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      h1 {
        margin: 0;
      }
    }
    
    .header-right {
      display: flex;
      gap: 8px;
    }
  }
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    
    .anticon {
      font-size: 32px;
      margin-bottom: 8px;
      color: var(--primary-color);
    }
    
    span {
      font-size: 13px;
    }
    
    &:hover {
      background: var(--primary-color);
      color: #fff;
      
      .anticon {
        color: #fff;
      }
    }
  }
}

.stats {
  .stat-item {
    margin-bottom: 16px;
    
    .label {
      display: block;
      margin-bottom: 4px;
      color: #666;
    }
    
    .value {
      font-weight: 500;
    }
  }
}

.renew-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  
  p {
    margin: 8px 0;
  }
}
</style>
