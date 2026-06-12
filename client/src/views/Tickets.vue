<template>
  <div class="tickets-page">
    <div class="page-header">
      <h1>工单系统</h1>
      <a-button type="primary" @click="showCreateModal">
        新建工单
      </a-button>
    </div>
    
    <a-tabs v-model:activeKey="activeTab" @change="fetchTickets">
      <a-tab-pane key="" tab="全部" />
      <a-tab-pane key="open" tab="待处理" />
      <a-tab-pane key="pending" tab="处理中" />
      <a-tab-pane key="answered" tab="已回复" />
      <a-tab-pane key="closed" tab="已关闭" />
    </a-tabs>
    
    <a-table 
      :columns="columns" 
      :data-source="tickets" 
      :loading="loading"
      :pagination="{ pageSize: 10, showTotal: t => `共 ${t} 条` }"
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
        <template v-else-if="column.key === 'last_reply'">
          {{ record.messages?.length || 0 }} 条
        </template>
        <template v-else-if="column.key === 'action'">
          <router-link :to="`/tickets/${record.id}`">
            <a-button size="small">查看</a-button>
          </router-link>
          <a-button 
            size="small" 
            v-if="record.status !== 'closed'" 
            @click="handleClose(record)" 
            style="margin-left:8px"
          >
            关闭
          </a-button>
        </template>
      </template>
    </a-table>
    
    <!-- Create Modal -->
    <a-modal v-model:open="createModal" title="新建工单" @ok="handleCreate" :confirm-loading="creating">
      <a-form :model="createForm" layout="vertical" v-if="true">
        <a-form-item label="分类" required>
          <a-select v-model:value="createForm.category">
            <a-select-option value="pre_sales">售前咨询</a-select-option>
            <a-select-option value="after_sales">售后服务</a-select-option>
            <a-select-option value="technical">技术支持</a-select-option>
            <a-select-option value="billing">账单问题</a-select-option>
            <a-select-option value="suggestion">建议反馈</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="标题" required>
          <a-input v-model:value="createForm.title" placeholder="请输入工单标题" />
        </a-form-item>
        <a-form-item label="内容" required>
          <a-textarea v-model:value="createForm.content" :rows="5" placeholder="请详细描述您的问题..." />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTickets, createTicket, closeTicket } from '@/api/ticket'
import { message } from 'ant-design-vue'

const router = useRouter()

const tickets = ref([])
const loading = ref(false)
const activeTab = ref('')
const createModal = ref(false)
const creating = ref(false)

const createForm = ref({
  category: 'technical',
  title: '',
  content: ''
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '标题', key: 'title' },
  { title: '分类', key: 'category', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '最后回复', key: 'last_reply', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 120 }
]

const getCategoryText = (category) => {
  const texts = { pre_sales: '售前', after_sales: '售后', technical: '技术支持', billing: '账单', suggestion: '建议', other: '其他' }
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
    const params = {}
    if (activeTab.value) params.status = activeTab.value
    const res = await getTickets(params)
    tickets.value = res.data?.list || []
  } catch (error) {
    console.error('加载工单失败:', error)
    message.error('加载工单失败')
  } finally {
    loading.value = false
  }
}

const showCreateModal = () => {
  createForm.value = { category: 'technical', title: '', content: '' }
  createModal.value = true
}

const handleCreate = async () => {
  if (!createForm.value.title.trim() || !createForm.value.content.trim()) {
    message.warning('请填写标题和内容')
    return
  }
  creating.value = true
  try {
    const res = await createTicket(createForm.value)
    message.success('工单创建成功')
    createModal.value = false
    await fetchTickets()
    // 跳转到刚创建的工单详情
    if (res.data?.id) {
      router.push(`/tickets/${res.data.id}`)
    }
  } catch (error) {
    console.error('创建工单失败:', error)
    message.error(error.response?.data?.message || '创建工单失败')
  } finally {
    creating.value = false
  }
}

const handleClose = async (ticket) => {
  try {
    await closeTicket(ticket.id)
    message.success('工单已关闭')
    await fetchTickets()
  } catch (error) {
    message.error(error.response?.data?.message || '关闭失败')
  }
}

onMounted(() => {
  fetchTickets()
})
</script>

<style lang="scss" scoped>
.tickets-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    h1 { font-size: 24px; }
  }
}
</style>
