<template>
  <div class="ticket-detail-page">
    <div class="page-header">
      <a-button @click="$router.push('/tickets')">
        <ArrowLeftOutlined /> 返回
      </a-button>
      <h1>{{ ticket?.title }}</h1>
      <a-tag :color="getStatusColor(ticket?.status)">{{ getStatusText(ticket?.status) }}</a-tag>
    </div>
    
    <a-spin v-if="loading" />
    <template v-else>
      <div class="ticket-messages">
        <div v-for="msg in messages" :key="msg.id" :class="['message', msg.is_admin ? 'admin' : 'user']">
          <div class="message-avatar">
            <a-avatar :icon="msg.is_admin ? 'user' : 'robot'" />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender">{{ msg.is_admin ? '客服' : '我' }}</span>
              <span class="time">{{ formatDate(msg.createdAt) }}</span>
            </div>
            <div class="message-body" v-html="formatContent(msg.content)"></div>
            <div v-if="msg.attachments?.length" class="message-attachments">
              <a v-for="att in msg.attachments" :key="att" :href="att" target="_blank">附件</a>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="ticket?.status !== 'closed'" class="reply-form">
        <a-textarea v-model:value="replyContent" :rows="4" placeholder="请输入回复内容..." />
        <div class="reply-actions">
          <a-space>
            <a-button @click="showTicketInfo = true">工单信息</a-button>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTicket, replyTicket, closeTicket as apiCloseTicket } from '@/api/ticket'
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
const showTicketInfo = ref(false)

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
    // 后端返回的是TicketMessage数组，我们需要确保正确映射
    messages.value = (res.data?.TicketMessages || []).map(msg => ({
      id: msg.id,
      content: msg.content || "",
      is_admin: msg.is_admin || false,
      created_at: msg.createdAt,
      user: msg.user
    }))
    console.log('Ticket data:', res.data)
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
    await replyTicket(route.params.id, { content: replyContent.value })
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
