<template>
  <div class="admin-orders-page">
    <div class="page-header">
      <h2>订单管理</h2>
      <a-space>
        <a-select v-model:value="statusFilter" style="width: 120px" @change="fetchOrders">
          <a-select-option value="">全部状态</a-select-option>
          <a-select-option value="pending">待支付</a-select-option>
          <a-select-option value="paid">已支付</a-select-option>
          <a-select-option value="completed">已完成</a-select-option>
          <a-select-option value="cancelled">已取消</a-select-option>
        </a-select>
        <a-input-search v-model:value="keyword" placeholder="订单号/用户名" style="width: 200px" @search="fetchOrders" />
      </a-space>
    </div>
    
    <a-table :columns="columns" :data-source="orders" :loading="loading" :pagination="{ pageSize: 20 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'amount'">
          <span class="text-error">¥{{ record.amount }}</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="viewOrder(record)">详情</a-button>
            <a-button v-if="record.status === 'paid'" size="small" type="primary" @click="processOrder(record)">
              处理
            </a-button>
            <a-button v-if="record.status === 'pending'" size="small" danger @click="cancelOrder(record)">
              取消
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrders as getAdminOrders, processOrder as apiProcessOrder, cancelOrder as apiCancelOrder } from '@/api/admin'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const orders = ref([])
const statusFilter = ref('')
const keyword = ref('')

const columns = [
  { title: '订单号', dataIndex: 'order_no' },
  { title: '用户名', dataIndex: 'username' },
  { title: '产品', dataIndex: 'product_name' },
  { title: '配置', dataIndex: 'plan_name' },
  { title: '金额', key: 'amount' },
  { title: '状态', key: 'status' },
  { title: '时间', dataIndex: 'created_at' },
  { title: '操作', key: 'action', width: 200 }
]

const getStatusColor = (status) => {
  const colors = { pending: 'processing', paid: 'warning', completed: 'success', cancelled: 'default' }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = { pending: '待支付', paid: '已支付', completed: '已完成', cancelled: '已取消' }
  return texts[status] || status
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (keyword.value) params.keyword = keyword.value
    const res = await getAdminOrders(params)
    orders.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const viewOrder = (order) => {
  message.info('订单详情：' + order.order_no)
}

const processOrder = async (order) => {
  try {
    await apiProcessOrder(order.id)
    message.success('订单已处理')
    fetchOrders()
  } catch (error) {
    message.error(error.message)
  }
}

const cancelOrder = async (order) => {
  try {
    await apiCancelOrder(order.id)
    message.success('订单已取消')
    fetchOrders()
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchOrders()
})
</script>
