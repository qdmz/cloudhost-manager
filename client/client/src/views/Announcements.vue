<template>
  <div class="announcements-page">
    <h1>公告中心</h1>
    
    <div class="announcements-list">
      <a-spin v-if="loading" />
      <template v-else>
        <div v-for="item in announcements" :key="item.id" class="announcement-card" @click="viewAnnouncement(item)">
          <div class="announcement-header">
            <a-tag v-if="item.is_top" color="red">置顶</a-tag>
            <a-tag v-if="item.is_important" color="orange">重要</a-tag>
            <span class="title">{{ item.title }}</span>
          </div>
          <div class="announcement-meta">
            <span><CalendarOutlined /> {{ formatDate(item.createdAt) }}</span>
            <span><EyeOutlined /> {{ item.views || 0 }} 次阅读</span>
          </div>
          <div class="announcement-content">{{ item.summary }}</div>
        </div>
        <a-empty v-if="announcements.length === 0" description="暂无公告" />
      </template>
    </div>
    
    <a-modal v-model:open="showModal" :title="currentAnnouncement?.title" width="800px" :footer="null">
      <div class="modal-content" v-html="currentAnnouncement?.content"></div>
      <div class="modal-footer">
        <span>发布时间：{{ formatDate(currentAnnouncement?.createdAt) }}</span>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAnnouncements } from '@/api/announcement'
import dayjs from 'dayjs'
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const announcements = ref([])
const showModal = ref(false)
const currentAnnouncement = ref(null)

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const res = await getAnnouncements()
    announcements.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const viewAnnouncement = (item) => {
  currentAnnouncement.value = item
  showModal.value = true
}

onMounted(() => {
  fetchAnnouncements()
})
</script>

<style lang="scss" scoped>
.announcements-page {
  h1 {
    margin-bottom: 24px;
  }
}

.announcements-list {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.announcement-card {
  padding: 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.3s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f5f7fa;
  }
  
  .announcement-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }
  
  .announcement-meta {
    display: flex;
    gap: 16px;
    color: #999;
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .announcement-content {
    color: #666;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.modal-content {
  font-size: 14px;
  line-height: 1.8;
  
  :deep(img) {
    max-width: 100%;
  }
}

.modal-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  color: #999;
  font-size: 13px;
}
</style>
