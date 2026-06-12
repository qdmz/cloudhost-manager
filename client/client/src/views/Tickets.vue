<template>
  <div class="tickets-page">
    <div class="page-header">
      <h1>我的工单</h1>
      <a-button type="primary" @click="showCreateModal = true">
        <PlusOutlined /> 创建工单
      </a-button>
    </div>
    
    <a-table
      :columns="columns"
      :data-source="tickets"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'title'">
          <router-link :to="`/tickets/${record.id}`">{{ record.title }}</router-link>
        </template>
        <template v-else-if="column.key === 'category'">
          {{ getCategoryText(record.category) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <router-link :to="`/tickets/${record.id}`">
            <a-button size="small">查看详情</a-button>
          </router-link>
        </template>
      </template>
    </a-table>
    
    <a-modal v-model:open="showCreateModal" title="创建工单" @ok="handleCreate" :loading="creating">
      <a-form :model="ticketForm" layout="vertical">
        <a-form-item label="工单类别" name="category">
          <a-select v-model:value="ticketForm.category" placeholder="请选择工单类别">
            <a-select-option value="pre_sales">售前咨询</a-select-option>
            <a-select-option value="after_sales">售后支持</a-select-option>
            <a-select-option value="technical">技术问题</a-select-option>
            <a-select-option value="billing">账单问题</a-select-option>
            <a-select-option value="suggestion">建议反馈</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="工单标题" name="title">
          <a-input v-model:value="ticketForm.title" placeholder="请输入工单标题" />
        </a-form-item>
        
        <a-form-item label="工单内容" name="content">
          <a-textarea v-model:value="ticketForm.content" :rows="6" placeholder="请详细描述您的问题..." />
        </a-form-item>
        
        <a-form-item label="附件">
          <a-upload :before-upload="() => false" :max-count="3">
            <a-button><UploadOutlined /> 上传附件</a-button>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTickets, createTicket } from '@/api/ticket'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)
const tickets = ref([])

const ticketForm = ref({
  category: undefined,
  title: '',
  content: ''
})

const columns = [
  { title: '工单标题', key: 'title' },
  { title: '类别', key: 'category' },
  { title: '状态', key: 'status' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'action' }
]

const getCategoryText = (category) => {
  const texts = { pre_sales: '售前咨询', after_sales: '售后支持', technical: '技术问题', billing: '账单问题', suggestion: '建议反馈', other: '其他' }
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

const formatDate = (date) => dayjs(date).format('MM-DD HH:mm')

const fetchTickets = async () => {
  loading.value = true
  try {
    const res = await getTickets()
    tickets.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!ticketForm.value.category || !ticketForm.value.title || !ticketForm.value.content) {
    message.warning('请填写完整信息')
    return
  }
  
  creating.value = true
  try {
    await createTicket(ticketForm.value)
    message.success('工单创建成功')
    showCreateModal.value = false
    ticketForm.value = { category: undefined, title: '', content: '' }
    fetchTickets()
  } catch (error) {
    message.error(error.message)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  fetchTickets()
})
</script>
