<template>
  <div class="tickets-page">
    <div class="page-header">
      <h2>工单管理</h2>
      <a-space>
        <a-select v-model:value="statusFilter" style="width: 120px" @change="fetchTickets">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="open">待处理</a-select-option>
          <a-select-option value="pending">处理中</a-select-option>
          <a-select-option value="answered">已回复</a-select-option>
          <a-select-option value="closed">已关闭</a-select-option>
        </a-select>
      </a-space>
    </div>
    
    <a-table :columns="columns" :data-source="tickets" :loading="loading" :pagination="{ pageSize: 20 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'title'">
          <router-link :to="`/admin/tickets/${record.id}`">{{ record.title }}</router-link>
        </template>
        <template v-else-if="column.key === 'category'">
          {{ getCategoryText(record.category) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <router-link :to="`/admin/tickets/${record.id}`">
            <a-button size="small">处理</a-button>
          </router-link>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTickets as getAdminTickets } from '@/api/admin'

const loading = ref(false)
const tickets = ref([])
const statusFilter = ref('')

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '标题', key: 'title' },
  { title: '用户', dataIndex: 'username' },
  { title: '分类', key: 'category' },
  { title: '状态', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt' },
  { title: '操作', key: 'action' }
]

const getCategoryText = (category) => {
  const texts = { pre_sales: '售前', after_sales: '售后', technical: '技术', billing: '账单', suggestion: '建议', other: '其他' }
  return texts[category] || category
}

const getStatusColor = (status) => {
  const colors = { open: 'processing', pending: 'warning', answered: 'success', closed: 'default' }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = { open: '待处理', pending: '处理中', answered: '已回复', closed: '已关闭' }
  return texts[status] || status
}

const fetchTickets = async () => {
  loading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const res = await getAdminTickets(params)
    tickets.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTickets()
})
</script>
