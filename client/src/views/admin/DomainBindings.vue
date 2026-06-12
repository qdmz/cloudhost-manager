<template>
  <div class="domain-bindings-page">
    <div class="page-header">
      <h2>域名绑定管理</h2>
    </div>

    <a-table :columns="columns" :data-source="bindings" :loading="loading" row-key="id" :pagination="pagination" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'ssl_enabled'">
          <a-tag :color="record.ssl_enabled ? 'green' : 'default'">
            {{ record.ssl_enabled ? '已启用' : '未启用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="editBinding(record)">编辑</a-button>
            <a-popconfirm title="确定删除此绑定吗？" @confirm="deleteBinding(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="showEditModal" title="编辑域名绑定" @ok="handleEdit" :confirmLoading="submitting">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="状态">
          <a-select v-model:value="editForm.status">
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="active">已激活</a-select-option>
            <a-select-option value="inactive">未激活</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="启用SSL">
          <a-switch v-model:checked="editForm.ssl_enabled" />
        </a-form-item>
        <a-form-item label="SSL证书" v-if="editForm.ssl_enabled">
          <a-textarea v-model:value="editForm.ssl_cert" :rows="4" placeholder="SSL证书内容" />
        </a-form-item>
        <a-form-item label="SSL私钥" v-if="editForm.ssl_enabled">
          <a-textarea v-model:value="editForm.ssl_key" :rows="4" placeholder="SSL私钥内容" />
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
import { getDomainBindings, updateDomainBinding, deleteDomainBinding } from '@/api/admin'

const loading = ref(false)
const submitting = ref(false)
const bindings = ref([])
const showEditModal = ref(false)
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const editForm = ref({
  id: null,
  status: 'pending',
  ssl_enabled: false,
  ssl_cert: '',
  ssl_key: '',
  note: ''
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '用户', dataIndex: ['user', 'username'] },
  { title: '服务', dataIndex: ['service', 'name'] },
  { title: '域名', dataIndex: 'domain' },
  { title: '协议', dataIndex: 'protocol', width: 80 },
  { title: '外部端口', dataIndex: 'external_port', width: 100 },
  { title: '内部端口', dataIndex: 'internal_port', width: 100 },
  { title: 'SSL', key: 'ssl_enabled', width: 80 },
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

const fetchBindings = async () => {
  loading.value = true
  try {
    const res = await getDomainBindings({
      page: pagination.value.current,
      page_size: pagination.value.pageSize
    })
    bindings.value = res.data.list || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const editBinding = (record) => {
  editForm.value = {
    id: record.id,
    status: record.status,
    ssl_enabled: record.ssl_enabled || false,
    ssl_cert: record.ssl_cert || '',
    ssl_key: record.ssl_key || '',
    note: record.note || ''
  }
  showEditModal.value = true
}

const handleEdit = async () => {
  submitting.value = true
  try {
    await updateDomainBinding(editForm.value.id, editForm.value)
    message.success('更新成功')
    showEditModal.value = false
    fetchBindings()
  } catch (error) {
    message.error(error.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

const deleteBinding = async (id) => {
  try {
    await deleteDomainBinding(id)
    message.success('删除成功')
    fetchBindings()
  } catch (error) {
    message.error(error.message || '删除失败')
  }
}

const handleTableChange = (page) => {
  pagination.value.current = page.current
  pagination.value.pageSize = page.pageSize
  fetchBindings()
}

onMounted(() => {
  fetchBindings()
})
</script>

<style scoped lang="scss">
.domain-bindings-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}
</style>
