<template>
  <div class="port-forwards-page">
    <div class="page-header">
      <h2>端口转发</h2>
      <a-button type="primary" @click="showCreateModal = true">
        <PlusOutlined /> 新增转发
      </a-button>
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

    <a-modal v-model:open="showCreateModal" title="新增端口转发" @ok="handleCreate" :confirmLoading="submitting">
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="选择服务" required>
          <a-select v-model:value="createForm.service_id" placeholder="请选择服务">
            <a-select-option v-for="service in services" :key="service.id" :value="service.id">
              {{ service.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="协议">
          <a-select v-model:value="createForm.protocol">
            <a-select-option value="tcp">TCP</a-select-option>
            <a-select-option value="udp">UDP</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="外部端口" required>
          <a-input-number v-model:value="createForm.external_port" :min="1" :max="65535" style="width: 100%" />
        </a-form-item>
        <a-form-item label="内部IP">
          <a-input v-model:value="createForm.internal_ip" placeholder="留空则使用服务IP" />
        </a-form-item>
        <a-form-item label="内部端口" required>
          <a-input-number v-model:value="createForm.internal_port" :min="1" :max="65535" style="width: 100%" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="createForm.note" :rows="2" placeholder="可选备注" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="showEditModal" title="编辑端口转发" @ok="handleEdit" :confirmLoading="submitting">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="协议">
          <a-select v-model:value="editForm.protocol">
            <a-select-option value="tcp">TCP</a-select-option>
            <a-select-option value="udp">UDP</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="外部端口">
          <a-input-number v-model:value="editForm.external_port" :min="1" :max="65535" style="width: 100%" />
        </a-form-item>
        <a-form-item label="内部IP">
          <a-input v-model:value="editForm.internal_ip" placeholder="留空则使用服务IP" />
        </a-form-item>
        <a-form-item label="内部端口">
          <a-input-number v-model:value="editForm.internal_port" :min="1" :max="65535" style="width: 100%" />
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
import { PlusOutlined } from '@ant-design/icons-vue'
import { getPortForwards, createPortForward, updatePortForward, deletePortForward } from '@/api/domain'
import { getServices } from '@/api/service'

const loading = ref(false)
const submitting = ref(false)
const forwards = ref([])
const services = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const createForm = ref({
  service_id: null,
  protocol: 'tcp',
  external_port: null,
  internal_ip: '',
  internal_port: null,
  note: ''
})

const editForm = ref({
  id: null,
  protocol: 'tcp',
  external_port: null,
  internal_ip: '',
  internal_port: null,
  note: ''
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '服务', dataIndex: ['service', 'name'] },
  { title: '协议', key: 'protocol', width: 80 },
  { title: '外部端口', dataIndex: 'external_port', width: 100 },
  { title: '内部端口', dataIndex: 'internal_port', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', width: 180 },
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

const fetchServices = async () => {
  try {
    const res = await getServices()
    services.value = res.data.list || []
  } catch (error) {
    console.error(error)
  }
}

const handleCreate = async () => {
  if (!createForm.value.service_id || !createForm.value.external_port || !createForm.value.internal_port) {
    message.warning('请填写完整信息')
    return
  }

  submitting.value = true
  try {
    await createPortForward(createForm.value)
    message.success('创建成功')
    showCreateModal.value = false
    resetCreateForm()
    fetchForwards()
  } catch (error) {
    message.error(error.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

const editForward = (record) => {
  editForm.value = {
    id: record.id,
    protocol: record.protocol,
    external_port: record.external_port,
    internal_ip: record.internal_ip || '',
    internal_port: record.internal_port,
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

const resetCreateForm = () => {
  createForm.value = {
    service_id: null,
    protocol: 'tcp',
    external_port: null,
    internal_ip: '',
    internal_port: null,
    note: ''
  }
}

onMounted(() => {
  fetchForwards()
  fetchServices()
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
