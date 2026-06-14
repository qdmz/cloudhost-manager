<template>
  <div class="orders-page">
    <div class="page-header">
      <h1>我的订单</h1>
    </div>
    
    <a-tabs v-model:activeKey="activeTab" @change="fetchOrders">
      <a-tab-pane key="" tab="全部" />
      <a-tab-pane key="pending" tab="待支付" />
      <a-tab-pane key="paid" tab="已支付" />
      <a-tab-pane key="completed" tab="已完成" />
      <a-tab-pane key="cancelled" tab="已取消" />
    </a-tabs>
    
    <a-table 
      :columns="columns" 
      :data-source="orders" 
      :loading="loading"
      :pagination="{ pageSize: 10, showTotal: t => `共 ${t} 条` }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'order_no'">
          <span style="font-family:monospace;font-size:12px">{{ record.order_no }}</span>
        </template>
        <template v-else-if="column.key === 'product'">
          <span>{{ record.product?.name || record.product_id || '-' }}</span>
          <div style="font-size:12px;color:#999">{{ record.plan?.name || '' }}</div>
        </template>
        <template v-else-if="column.key === 'amount'">
          <span style="color:red;font-weight:600">¥{{ parseFloat(record.amount).toFixed(2) }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'cycle'">
          {{ getCycleText(record.cycle) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <template v-if="record.status === 'pending'">
            <a-button size="small" type="primary" @click="handlePay(record)">支付</a-button>
            <a-button size="small" danger @click="handleCancel(record)" style="margin-left:8px">取消</a-button>
          </template>
          <template v-else-if="record.status === 'paid'">
            <a-tag color="green">已支付</a-tag>
          </template>
          <template v-else>
            <span style="color:#999">-</span>
          </template>
        </template>
      </template>
    </a-table>
    
    <!-- Pay Modal -->
    <a-modal v-model:open="payModalVisible" title="选择支付方式" @ok="handlePayConfirm" :confirm-loading="payLoading">
      <a-radio-group v-model:value="payMethod" style="display:flex;flex-direction:column">
        <a-radio value="alipay">支付宝</a-radio>
        <a-radio value="wechat">微信支付</a-radio>
        <a-radio value="balance">余额支付</a-radio>
      </a-radio-group>
      <div v-if="payMethod === 'balance'">
        <p>当前余额: <strong style="color:red">¥{{ userBalance }}</strong></p>
      </div>
      <div v-if="payResult">
        <a-result status="success" title="正在跳转支付页面..." :sub-title="payResult">
          <template #extra>
            <a-button type="primary" @click="() => { $router.push('/orders'); payResult = '' }">返回订单列表</a-button>
          </template>
        </a-result>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrders, cancelOrder, getPayUrl } from '@/api/order'
import { getUserInfo } from '@/api/user'
import { message } from 'ant-design-vue'

const orders = ref([])
const loading = ref(false)
const activeTab = ref('')
const userBalance = ref(0)

const payModalVisible = ref(false)
const payMethod = ref('alipay')
const payLoading = ref(false)
const payResult = ref('')
let currentPayOrder = null

const columns = [
  { title: '订单号', key: 'order_no', width: 200 },
  { title: '产品/配置', key: 'product' },
  { title: '数量', key: 'quantity', width: 60 },
  { title: '周期', key: 'cycle', width: 70 },
  { title: '金额', key: 'amount', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 150 }
]

const getStatusColor = (status) => {
  const colors = { pending: 'warning', paid: 'success', completed: 'processing', cancelled: 'default' }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = { pending: '待支付', paid: '已支付', completed: '已完成', cancelled: '已取消' }
  return texts[status] || status
}

const getCycleText = (cycle) => {
  const texts = { monthly: '月付', quarterly: '季付', yearly: '年付' }
  return texts[cycle] || cycle
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {}
    if (activeTab.value) params.status = activeTab.value
    const res = await getOrders(params)
    orders.value = res.data?.list || []
  } catch (error) {
    console.error('加载订单失败:', error)
    message.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

const fetchBalance = async () => {
  try {
    const res = await getUserInfo()
    userBalance.value = parseFloat(res.data?.balance || 0)
  } catch (e) {}
}

const handlePay = (order) => {
  currentPayOrder = order
  payMethod.value = 'alipay'
  payResult.value = ''
  payModalVisible.value = true
}

const handlePayConfirm = async () => {
  if (!currentPayOrder) return
  payLoading.value = true
  try {
    const res = await getPayUrl(currentPayOrder.id, { payment_method: payMethod.value })
    payResult.value = res.data?.message || '支付成功'
    
    if (res.data?.pay_url) {
      window.location.href = res.data.pay_url
    } else if (payMethod.value === 'balance') {
      message.success('余额支付成功')
      payModalVisible.value = false
      fetchOrders()
      fetchBalance()
    }
  } catch (error) {
    console.error('支付失败:', error)
    message.error(error.response?.data?.message || '支付失败')
  } finally {
    payLoading.value = false
  }
}

const handleCancel = async (order) => {
  try {
    await cancelOrder(order.id)
    message.success('订单已取消')
    fetchOrders()
  } catch (error) {
    message.error(error.response?.data?.message || '取消失败')
  }
}

onMounted(() => {
  fetchOrders()
  fetchBalance()
})
</script>

<style lang="scss" scoped>
.orders-page {
  .page-header {
    margin-bottom: 24px;
    h1 { font-size: 24px; }
  }
}
</style>
