<template>
  <div class="announcements-page">
    <div class="page-header">
      <h2>公告管理</h2>
      <a-button type="primary" @click="showAddModal = true"><PlusOutlined /> 发布公告</a-button>
    </div>
    
    <a-table :columns="columns" :data-source="announcements" :loading="loading" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'title'">
          {{ record.title }}
          <a-tag v-if="record.is_top" color="red" size="small">置顶</a-tag>
          <a-tag v-if="record.is_important" color="orange" size="small">重要</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="editAnnouncement(record)">编辑</a-button>
            <a-popconfirm title="确定删除？" @confirm="deleteAnnouncement(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <a-modal v-model:open="showAddModal" title="发布公告" width="700px" @ok="handleAdd">
      <a-form :model="announcementForm" layout="vertical">
        <a-form-item label="公告标题" name="title">
          <a-input v-model:value="announcementForm.title" />
        </a-form-item>
        <a-form-item label="公告内容" name="content">
          <a-textarea v-model:value="announcementForm.content" :rows="10" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="置顶" name="is_top">
              <a-switch v-model:checked="announcementForm.is_top" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="重要" name="is_important">
              <a-switch v-model:checked="announcementForm.is_important" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement as apiDeleteAnnouncement } from '@/api/admin'
import { message } from 'ant-design-vue'

const loading = ref(false)
const announcements = ref([])
const showAddModal = ref(false)

const announcementForm = ref({ id: null, title: '', content: '', is_top: false, is_important: false })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '标题', key: 'title' },
  { title: '浏览量', dataIndex: 'views' },
  { title: '发布时间', dataIndex: 'created_at' },
  { title: '操作', key: 'action' }
]

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

const editAnnouncement = (item) => {
  announcementForm.value = { ...item }
  showAddModal.value = true
}

const handleAdd = async () => {
  try {
    if (announcementForm.value.id) {
      await updateAnnouncement(announcementForm.value.id, announcementForm.value)
    } else {
      await createAnnouncement(announcementForm.value)
    }
    message.success('保存成功')
    showAddModal.value = false
    announcementForm.value = { id: null, title: '', content: '', is_top: false, is_important: false }
    fetchAnnouncements()
  } catch (error) {
    message.error(error.message)
  }
}

const deleteAnnouncement = async (id) => {
  try {
    await apiDeleteAnnouncement(id)
    message.success('删除成功')
    fetchAnnouncements()
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchAnnouncements()
})
</script>
