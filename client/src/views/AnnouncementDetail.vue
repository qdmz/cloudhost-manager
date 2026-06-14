<template>
  <div class="announcement-detail-page">
    <a-spin v-if="loading" />
    <template v-else-if="announcement">
      <div class="announcement-header">
        <a-tag v-if="announcement.is_top" color="red">置顶</a-tag>
        <a-tag v-if="announcement.is_important" color="orange">重要</a-tag>
        <h1>{{ announcement.title }}</h1>
        <div class="meta">
          <span><CalendarOutlined /> {{ formatDate(announcement.createdAt) }}</span>
          <span><EyeOutlined /> {{ announcement.views || 0 }} 次阅读</span>
        </div>
      </div>
      <div class="announcement-content" v-html="announcement.content"></div>
      <div class="back-btn">
        <a-button @click="$router.back()">返回</a-button>
      </div>
    </template>
    <a-empty v-else description="公告不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAnnouncement } from '@/api/announcement'
import dayjs from 'dayjs'
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const loading = ref(false)
const announcement = ref(null)

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchAnnouncement = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const res = await getAnnouncement(id)
    announcement.value = res.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAnnouncement()
})
</script>

<style lang="scss" scoped>
.announcement-detail-page {
  background: #fff;
  border-radius: 8px;
  padding: 24px;

  .announcement-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;

    h1 {
      margin: 16px 0;
      font-size: 24px;
    }

    .meta {
      display: flex;
      gap: 16px;
      color: #999;
      font-size: 14px;
    }
  }

  .announcement-content {
    font-size: 15px;
    line-height: 1.8;

    :deep(img) {
      max-width: 100%;
    }
  }

  .back-btn {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
}
</style>
