<template>
  <div class="recharges-page">
    <div class="page-header">
      <h2>充值记录管理</h2>
    </div>

    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="recharges" tab="充值记录">
        <a-table :columns="rechargeColumns" :data-source="recharges" :loading="loading" row-key="id" :pagination="pagination" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button v-if="record.status === 'pending'" size="small" type="primary" @click="processRecharge(record)">
                  处理
                </a-button>
                <a-popconfirm title="确定删除此记录？" @confirm="deleteRecord(record.id)">
                  <a-button size="small" danger>删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      
      <a-tab-pane key="balance-logs" tab="余额变动日志">
        <a-table :columns="balanceLogColumns" :data-source="balanceLogs" :loading="logsLoading" row-key="id" :pagination="logsPagination" @change="handleLogsTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'amount'">
              <span :style="{ color: record.amount > 0 ? '#52c41a' : '#f5222d' }">
                {{ record.amount > 0 ? '+' : '' }}{{ record.amount }}
              </span>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getRecharges, processRecharge as apiProcessRecharge, deleteRecharge, getBalanceLogs } from '@/api/admin'

const activeTab = ref('recharges')
const loading = ref(false)
const logsLoading = ref(false)
const recharges = ref([])
const balanceLogs = ref([])
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})
const logsPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

const rechargeColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '用户', dataIndex: ['user', 'username'] },
  { title: '金额', dataIndex: 'amount', width: 100 },
  { title: '支付方式', dataIndex: 'payment_method', width: 100 },
  { title: '交易号', dataIndex: 'trade_no', width: 200 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 160 }
]

const balanceLogColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '用户', dataIndex: ['user', 'username'] },
  { title: '类型', key: 'type', width: 100 },
  { title: '变动金额', key: 'amount', width: 120 },
  { title: '变动前余额', dataIndex: 'balance_before', width: 120 },
  { title: '变动后余额', dataIndex: 'balance_after', width: 120 },
  { title: '备注', dataIndex: 'note' },
  { title: '时间', dataIndex: 'created_at', width: 180 }
]

const getStatusColor = (status) => {
  const colors = { pending: 'processing', completed: 'success', failed: 'error' }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = { pending: '待处理', completed: '已完成', failed: '已失败' }
  return texts[status] || status
}

const getTypeColor = (type) => {
  const colors = { recharge: 'success', consume: 'warning', refund: 'blue', adjust: 'purple' }
  return colors[type] || 'default'
}

const getTypeText = (type) => {
  const texts = { recharge: '充值', consume: '消费', refund: '退款', adjust: '调整' }
  return texts[type] || type
}

const fetchRecharges = async () => {
  loading.value = true
  try {
    const res = await getRecharges({
      page: pagination.value.current,
      page_size: pagination.value.pageSize
    })
    recharges.value = res.data.list || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchBalanceLogs = async () => {
  logsLoading.value = true
  try {
    const res = await getBalanceLogs({
      page: logsPagination.value.current,
      page_size: logsPagination.value.pageSize
    })
    balanceLogs.value = res.data.list || []
    logsPagination.value.total = res.data.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    logsLoading.value = false
  }
}

const processRechargeRecord = async (record) => {
  try {
    await apiProcessRecharge(record.id)
    message.success('处理成功，余额已更新')
    fetchRecharges()
    fetchBalanceLogs()
  } catch (error) {
    message.error(error.message || '处理失败')
  }
}

const deleteRecord = async (id) => {
  try {
    await deleteRecharge(id)
    message.success('删除成功')
    fetchRecharges()
  } catch (error) {
    message.error(error.message || '删除失败')
  }
}

const handleTableChange = (page) => {
  pagination.value.current = page.current
  pagination.value.pageSize = page.pageSize
  fetchRecharges()
}

const handleLogsTableChange = (page) => {
  logsPagination.value.current = page.current
  logsPagination.value.pageSize = page.pageSize
  fetchBalanceLogs()
}

onMounted(() => {
  fetchRecharges()
  fetchBalanceLogs()
})
</script>

<style scoped lang="scss">
.recharges-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}
</style>
