<template>
  <div class="ticket-detail-page">
    <div class="page-header">
      <a-button @click="$router.push('/admin/tickets')">
        <ArrowLeftOutlined /> 返回
      </a-button>
      <h1>{{ ticket?.title }}</h1>
      <a-tag :color="getStatusColor(ticket?.status)">{{ getStatusText(ticket?.status) }}</a-tag>
    </div>
    
    <a-spin v-if="loading" />
    <template v-else>
      <div class="ticket-info">
        <a-descriptions :column="3" :data="ticketInfo" bordered />
      </div>
      
      <div class="ticket-messages">
        <div v-for="msg in messages" :key="msg.id" :class="['message', msg.is_admin ? 'admin' : 'user']">
          <div class="message-avatar">
            <a-avatar :icon="msg.is_admin ? 'user' : 'robot'" />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender">{{ msg.is_admin ? '客服' : msg.user?.username || '用户' }}</span>
              <span class="time">{{ formatDate(msg.created_at) }}</span>
            </div>
            <div class="message-body" v-html="formatContent(msg.content)"></div>
          </div>
        </div>
      </div>
      
      <div v-if="ticket?.status !== 'closed'" class="reply-form">
        <a-textarea v-model:value="replyContent" :rows="4" placeholder="请输入回复内容..." />
        <div class="reply-actions">
          <a-space>
            <a-select v-model:value="statusSelect" style="width: 120px">
              <a-select-option value="pending">处理中</a-select-option>
              <a-select-option value="answered">已回复</a-select-option>
            </a-select>
          </a-space>
          <a-space>
            <a-button @click="closeTicket">关闭工单</a-button>
            <a-button type="primary" @click="handleReply" :loading="replying">发送回复</a-button>
          </a-space>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTicket, replyTicket, closeTicket as apiCloseTicket } from '@/api/admin'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const replying = ref(false)
const ticket = ref(null)
const messages = ref([])
const replyContent = ref('')
const statusSelect = ref('answered')

const ticketInfo = computed(() => {
  if (!ticket.value) return []
  return [
    { label: '工单ID', value: ticket.value.id },
    { label: '用户', value: ticket.value.user?.username || '未知' },
    { label: '分类', value: getCategoryText(ticket.value.category) },
    { label: '状态', value: getStatusText(ticket.value.status) },
    { label: '创建时间', value: formatDate(ticket.value.created_at) },
    { label: '更新时间', value: formatDate(ticket.value.updated_at) }
  ]
})

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

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const formatContent = (content) => content?.replace(/\n/g, '<br>')

const fetchTicket = async () => {
  loading.value = true
  try {
    const res = await getTicket(route.params.id)
    ticket.value = res.data
    messages.value = res.data?.ticket_messages || []
  } catch (error) {
    message.error(error.message)
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
    await replyTicket(route.params.id, { content: replyContent.value, status: statusSelect.value })
    message.success('回复成功')
    replyContent.value = ''
    fetchTicket()
  } catch (error) {
    message.error(error.message)
  } finally {
    replying.value = false
  }
}

const closeTicket = async () => {
  try {
    await apiCloseTicket(route.params.id)
    message.success('工单已关闭')
    fetchTicket()
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchTicket()
})
</script>

<style lang="scss" scoped>
.ticket-detail-page {
  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    
    h1 {
      margin: 0;
      flex: 1;
    }
  }
}

.ticket-info {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 24px;
}

.ticket-messages {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  min-height: 400px;
}

.message {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  
  &.admin {
    flex-direction: row;
  }
  
  &.user {
    flex-direction: row-reverse;
    
    .message-content {
      background: var(--primary-color);
      color: #fff;
    }
  }
  
  .message-content {
    max-width: 70%;
    background: #f5f7fa;
    padding: 12px 16px;
    border-radius: 8px;
    
    .message-header {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 12px;
      
      .sender {
        font-weight: 600;
      }
      
      .time {
        color: #999;
      }
    }
    
    .message-body {
      font-size: 14px;
      line-height: 1.6;
    }
  }
}

.reply-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  
  .reply-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
  }
}
</style>
