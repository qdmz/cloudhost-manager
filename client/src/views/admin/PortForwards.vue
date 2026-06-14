<template>
  <div class="port-forwards-page">
    <div class="page-header">
      <h2>端口转发管理</h2>
    </div>

    <a-table :columns="columns" :data-source="forwards" :loading="loading" row-key="id" :pagination="pagination" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'protocol'">
          <a-tag color="green">{{ record.protocol }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="editForward(record)">编辑</a-button>
            <a-popconfirm title="确定删除此转发吗？" @confirm="deleteForward(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="showEditModal" title="编辑端口转发" @ok="handleEdit" :confirmLoading="submitting">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="状态">
          <a-select v-model:value="editForm.status">
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="active">已激活</a-select-option>
            <a-select-option value="inactive">未激活</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="editForm.note" :rows="2" placeholder="可选备注" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getPortForwards, updatePortForward, deletePortForward } from '@/api/admin'

const loading = ref(false)
const submitting = ref(false)
const forwards = ref([])
const showEditModal = ref(false)
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const editForm = ref({
  id: null,
  status: 'pending',
  note: ''
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '用户', dataIndex: ['user', 'username'] },
  { title: '服务', dataIndex: ['service', 'name'] },
  { title: '协议', key: 'protocol', width: 80 },
  { title: '外部端口', dataIndex: 'external_port', width: 100 },
  { title: '内部端口', dataIndex: 'internal_port', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 160 }
]

const getStatusColor = (status) => {
  const colors = { active: 'success', pending: 'processing', inactive: 'default' }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = { active: '已激活', pending: '待处理', inactive: '未激活' }
  return texts[status] || status
}

const fetchForwards = async () => {
  loading.value = true
  try {
    const res = await getPortForwards({
      page: pagination.value.current,
      page_size: pagination.value.pageSize
    })
    forwards.value = res.data.list || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const editForward = (record) => {
  editForm.value = {
    id: record.id,
    status: record.status,
    note: record.note || ''
  }
  showEditModal.value = true
}

const handleEdit = async () => {
  submitting.value = true
  try {
    await updatePortForward(editForm.value.id, editForm.value)
    message.success('更新成功')
    showEditModal.value = false
    fetchForwards()
  } catch (error) {
    message.error(error.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

const deleteForward = async (id) => {
  try {
    await deletePortForward(id)
    message.success('删除成功')
    fetchForwards()
  } catch (error) {
    message.error(error.message || '删除失败')
  }
}

const handleTableChange = (page) => {
  pagination.value.current = page.current
  pagination.value.pageSize = page.pageSize
  fetchForwards()
}

onMounted(() => {
  fetchForwards()
})
</script>

<style scoped lang="scss">
.port-forwards-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}
</style>
