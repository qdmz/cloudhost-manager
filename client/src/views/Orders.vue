<template>
  <div class="orders-page">
    <h1>我的订单</h1>
    
    <a-table
      :columns="columns"
      :data-source="orders"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'order_no'">
          <strong>{{ record.order_no }}</strong>
        </template>
        <template v-else-if="column.key === 'product'">
          {{ record.product?.name || '' }} × {{ record.quantity }}
        </template>
        <template v-else-if="column.key === 'amount'">
          <span class="text-error">¥{{ record.amount }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'created_at'">
          {{ formatDate(record.created_at) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="viewOrder(record)">详情</a-button>
            <a-button v-if="record.status === 'pending'" size="small" type="primary" @click="payOrder(record)">
              去支付
            </a-button>
            <a-button v-if="record.status === 'pending'" size="small" type="dashed" @click="cancelOrder(record)">
              取消
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 支付选择弹窗 -->
    <a-modal
      v-model:open="showPaymentModal"
      title="选择支付方式"
      :footer="null"
      width="500px"
    >
      <div class="payment-modal-content">
        <a-form layout="vertical">
          <a-form-item label="支付方式">
            <a-radio-group v-model:value="selectedPaymentMethod">
              <a-radio value="alipay">支付宝</a-radio>
              <a-radio value="wechat">微信支付</a-radio>
              <a-radio value="balance">余额支付 (当前: ¥{{ userInfo?.balance || 0 }})</a-radio>
              <a-radio value="qqpay">QQ钱包</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-form>
        <div class="modal-actions">
          <a-button @click="showPaymentModal = false">取消</a-button>
          <a-button type="primary" @click="confirmPay" :loading="paying">
            立即支付
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrders, cancelOrder as apiCancelOrder, getPayUrl } from '@/api/order'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const orders = ref([])
const showPaymentModal = ref(false)
const selectedPaymentMethod = ref('alipay')
const paying = ref(false)
const currentOrder = ref(null)

const columns = [
  { title: '订单号', key: 'order_no' },
  { title: '产品', dataIndex: ['product', 'name'] },
  { title: '金额', dataIndex: 'amount' },
  { title: '状态', key: 'status' },
  { title: '时间', key: 'created_at' },
  { title: '操作', key: 'action' }
]

const getStatusColor = (status) => {
  const colors = { pending: 'processing', paid: 'success', completed: 'success', cancelled: 'default', refunded: 'warning' }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = { pending: '待支付', paid: '已支付', completed: '已完成', cancelled: '已取消', refunded: '已退款' }
  return texts[status] || status
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders()
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

const payOrder = (order) => {
  currentOrder.value = order
  selectedPaymentMethod.value = 'alipay'
  showPaymentModal.value = true
}

const confirmPay = async () => {
  paying.value = true
  try {
    message.info('正在跳转支付页面...')
    const res = await getPayUrl(currentOrder.value.id, { payment_method: selectedPaymentMethod.value })
    if (res.data && res.data.pay_url) {
      window.location.href = res.data.pay_url
    } else {
      message.error('支付链接获取失败')
    }
    showPaymentModal.value = false
  } catch (error) {
    message.error(error.message || '支付失败')
  } finally {
    paying.value = false
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

<style lang="scss" scoped>
.payment-modal-content {
  padding: 16px 0;
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
}
</style>
