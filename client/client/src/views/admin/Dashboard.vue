<template>
  <div class="dashboard">
    <h1>控制台</h1>
    
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :sm="12" :lg="6" v-for="stat in stats" :key="stat.key">
        <div class="stat-card" :style="{ background: stat.color }">
          <div class="stat-header">
            <component :is="stat.icon" class="stat-icon" style="color: #fff" />
          </div>
          <div class="stat-value" style="color: #fff">{{ stat.value }}</div>
          <div class="stat-label" style="color: rgba(255,255,255,0.8)">{{ stat.label }}</div>
        </div>
      </a-col>
    </a-row>
    
    <a-row :gutter="[16, 16]" style="margin-top: 24px">
      <a-col :xs="24" :lg="12">
        <div class="card">
          <div class="card-title">最近订单</div>
          <a-table :columns="orderColumns" :data-source="recentOrders" size="small" :pagination="false" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'completed' ? 'success' : 'processing'">{{ record.status }}</a-tag>
              </template>
            </template>
          </a-table>
        </div>
      </a-col>
      
      <a-col :xs="24" :lg="12">
        <div class="card">
          <div class="card-title">待处理工单</div>
          <a-table :columns="ticketColumns" :data-source="pendingTickets" size="small" :pagination="false" row-key="id" />
        </div>
      </a-col>
    </a-row>
    
    <a-row :gutter="[16, 16]" style="margin-top: 24px">
      <a-col :span="24">
        <div class="card">
          <div class="card-title">节点状态</div>
          <a-table :columns="nodeColumns" :data-source="nodes" size="small" :pagination="false" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'online' ? 'success' : 'error'">{{ record.status === 'online' ? '在线' : '离线' }}</a-tag>
              </template>
              <template v-else-if="column.key === 'usage'">
                <a-progress :percent="record.cpu_usage" size="small" />
              </template>
            </template>
          </a-table>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDashboardStats } from '@/api/admin'
import { UserOutlined, ShoppingOutlined, CloudServerOutlined, DollarOutlined } from '@ant-design/icons-vue'

const stats = ref([])
const recentOrders = ref([])
const pendingTickets = ref([])
const nodes = ref([])

const orderColumns = [
  { title: '订单号', dataIndex: 'order_no' },
  { title: '用户', dataIndex: 'username' },
  { title: '金额', dataIndex: 'amount' },
  { title: '状态', key: 'status' }
]

const ticketColumns = [
  { title: '标题', dataIndex: 'title' },
  { title: '用户', dataIndex: 'username' },
  { title: '状态', dataIndex: 'status' }
]

const nodeColumns = [
  { title: '节点', dataIndex: 'name' },
  { title: '位置', dataIndex: 'location' },
  { title: '状态', key: 'status' },
  { title: 'CPU使用', key: 'usage' },
  { title: '内存', dataIndex: 'memory_usage' }
]

const fetchData = async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data?.stats || []
    recentOrders.value = res.data?.recent_orders || []
    pendingTickets.value = res.data?.pending_tickets || []
    nodes.value = res.data?.nodes || []
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  h1 {
    margin-bottom: 24px;
  }
}

.stat-card {
  border-radius: 8px;
  padding: 20px;
  
  .stat-header {
    margin-bottom: 12px;
    
    .stat-icon {
      font-size: 32px;
    }
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
  }
  
  .stat-label {
    font-size: 14px;
  }
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }
}
</style>
