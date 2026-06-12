<template>
  <div class="ticket-detail">
    <a-page-header title="工单详情" @back="$router.push('/tickets')" />
    
    <a-descriptions v-if="ticket" bordered :column="2" size="small" style="margin-bottom:24px">
      <a-descriptions-item label="工单ID">{{ ticket.id }}</a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag :color="getStatusColor(ticket.status)">{{ getStatusText(ticket.status) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="标题" :span="2">{{ ticket.title }}</a-descriptions-item>
      <a-descriptions-item label="分类">{{ getCategoryText(ticket.category) }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ ticket.createdAt }}</a-descriptions-item>
    </a-descriptions>
    
    <a-card title="对话记录">
      <div v-if="messages.length === 0" style="text-align:center;padding:40px;color:#999">
        暂无对话记录
      </div>
      <div v-for="msg in messages" :key="msg.id" class="message-item" :class="{ 'admin-msg': msg.is_admin }">
        <div class="message-header">
          <a-tag :color="msg.is_admin ? 'blue' : 'green'">
            {{ msg.is_admin ? '管理员' : msg.user?.username || '我' }}
          </a-tag>
          <span class="message-time">{{ msg.createdAt }}</span>
        </div>
        <div class="message-content" v-html="formatContent(msg.content)"></div>
      </div>
    </a-card>
    
    <a-card v-if="ticket?.status !== 'closed'" title="回复工单" style="margin-top:24px">
      <a-form>
        <a-form-item>
          <a-textarea v-model:value="replyContent" :rows="4" placeholder="输入回复内容..." />
        </a-form-item>
        <a-space>
          <a-button type="primary" @click="handleReply" :loading="replying">发送回复</a-button>
          <a-button @click="handleClose" danger>关闭工单</a-button>
        </a-space>
      </a-form>
    </a-card>
    
    <a-card v-else style="margin-top:24px">
      <a-alert message="此工单已关闭" type="info" show-icon />
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTicket, replyTicket, closeTicket } from '@/api/ticket'
import { message } from 'ant-design-vue'

const route = useRoute()

const ticket = ref(null)
const messages = ref([])
const replyContent = ref('')
const loading = ref(true)
const replying = ref(false)

const isOwner = computed(() => {
  return ticket.value && !ticket.value.messages?.some(m => m.is_admin)
})

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

const formatContent = (content) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

const fetchTicket = async () => {
  loading.value = true
  try {
    const res = await getTicket(route.params.id)
    ticket.value = res.data
    messages.value = res.data?.messages || []
  } catch (error) {
    console.error('加载工单失败:', error)
    message.error('加载工单失败')
  } finally {
    loading.value = false
  }
}

const handleReply = async () => {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }
  replying.value = true
  try {
    await replyTicket(route.params.id, { content: replyContent.value })
    message.success('回复成功')
    replyContent.value = ''
    await fetchTicket()
  } catch (error) {
    message.error(error.response?.data?.message || '回复失败')
  } finally {
    replying.value = false
  }
}

const handleClose = async () => {
  try {
    await closeTicket(route.params.id)
    message.success('工单已关闭')
    await fetchTicket()
  } catch (error) {
    message.error(error.response?.data?.message || '关闭失败')
  }
}

onMounted(() => {
  fetchTicket()
})
</script>

<style lang="scss" scoped>
.ticket-detail {
  .message-item {
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    background: #fafafa;
    
    &.admin-msg {
      background: #e6f7ff;
      border-left: 3px solid #1890ff;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      .message-time { font-size: 12px; color: #999; }
    }
    
    .message-content {
      white-space: pre-wrap;
      line-height: 1.6;
    }
  }
}
</style>
