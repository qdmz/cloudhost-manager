<template>
  <div class="services-page">
    <div class="page-header">
      <h2>服务管理</h2>
    </div>
    
    <a-table :columns="columns" :data-source="services" :loading="loading" row-key="id" :pagination="pagination" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="viewDetail(record)">详情</a-button>
            <a-button size="small" @click="openEditModal(record)">编辑</a-button>
            <a-button size="small" type="dashed" @click="openTransferModal(record)">转移</a-button>
            <a-popconfirm title="确定转换为模板？" @confirm="convertToTemplate(record)">
              <a-button size="small" ghost>转模板</a-button>
            </a-popconfirm>
            <a-popconfirm title="确定删除？" @confirm="handleDelete(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 编辑服务弹窗 -->
    <a-modal v-model:open="showEditModal" title="编辑服务" @ok="handleEditOk" @cancel="showEditModal = false" :confirmLoading="editLoading">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="服务名称">
          <a-input v-model:value="editForm.name" placeholder="请输入服务名称" />
        </a-form-item>
        <a-form-item label="CPU">
          <a-input-number v-model:value="editForm.cpu" :min="1" />
        </a-form-item>
        <a-form-item label="内存(MB)">
          <a-input-number v-model:value="editForm.memory" :min="128" />
        </a-form-item>
        <a-form-item label="磁盘(GB)">
          <a-input-number v-model:value="editForm.disk" :min="1" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="editForm.status" style="width: 100%">
            <a-select-option value="running">运行中</a-select-option>
            <a-select-option value="stopped">已停止</a-select-option>
            <a-select-option value="pending">待开通</a-select-option>
            <a-select-option value="error">异常</a-select-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="IPv4 地址">
              <a-input v-model:value="editForm.ipv4" placeholder="如: 192.168.1.100" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="IPv6 地址">
              <a-input v-model:value="editForm.ipv6" placeholder="如: 2001:db8::1" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="SSH 端口">
              <a-input-number v-model:value="editForm.ssh_port" :min="1" :max="65535" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="VNC 端口">
              <a-input-number v-model:value="editForm.vnc_port" :min="1" :max="65535" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="MAC 地址">
          <a-input v-model:value="editForm.mac" placeholder="如: BC:24:11:00:00:01" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="月价格 (元)">
              <a-input-number v-model:value="editForm.price_monthly" :min="0" :precision="2" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="季价格 (元)">
              <a-input-number v-model:value="editForm.price_quarterly" :min="0" :precision="2" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="年价格 (元)">
              <a-input-number v-model:value="editForm.price_yearly" :min="0" :precision="2" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="到期时间">
              <a-date-picker v-model:value="editForm.expire_time" show-time style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
    
    <!-- 转移服务弹窗 -->
    <a-modal v-model:open="showTransferModal" title="转移虚拟机" @ok="handleTransferOk" @cancel="showTransferModal = false" :confirmLoading="transferLoading">
      <a-form :model="transferForm" layout="vertical">
        <a-form-item label="目标用户">
          <a-select v-model:value="transferForm.target_user_id" placeholder="请选择目标用户" show-search :filter-option="filterUserOption">
            <a-select-option v-for="user in userList" :key="user.id" :value="user.id">
              {{ user.username }} (ID: {{ user.id }})
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getServices, deleteService, updateService, transferService, getUsers, convertServiceToTemplate } from '@/api/admin'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const services = ref([])
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

// 编辑相关
const showEditModal = ref(false)
const editLoading = ref(false)
const editingService = ref(null)
const editForm = ref({
  name: '',
  cpu: 1,
  memory: 1024,
  disk: 20,
  status: 'running',
  ipv4: '',
  ipv6: '',
  ssh_port: null,
  vnc_port: null,
  mac: '',
  price_monthly: 0,
  price_quarterly: 0,
  price_yearly: 0,
  expire_time: null
})

// 转移相关
const showTransferModal = ref(false)
const transferLoading = ref(false)
const transferringService = ref(null)
const transferForm = ref({
  target_user_id: null
})
const userList = ref([])

const filterUserOption = (input, option) => {
  return option.children[0].children.toLowerCase().includes(input.toLowerCase())
}

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '服务名称', dataIndex: 'name' },
  { title: '用户', dataIndex: ['user', 'username'] },
  { title: '节点', dataIndex: ['node', 'name'] },
  { title: 'CPU', dataIndex: 'cpu' },
  { title: '内存(MB)', dataIndex: 'memory' },
  { title: '磁盘(GB)', dataIndex: 'disk' },
  { title: '状态', key: 'status' },
  { title: '到期时间', dataIndex: 'expire_time' },
  { title: '操作', key: 'action', width: 300 }
]

const getStatusColor = (status) => {
  const colors = {
    running: 'success',
    stopped: 'default',
    pending: 'processing',
    error: 'error'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    running: '运行中',
    stopped: '已停止',
    pending: '待开通',
    error: '异常'
  }
  return texts[status] || status
}

const fetchServices = async () => {
  loading.value = true
  try {
    const res = await getServices({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    })
    services.value = res.data.list
    pagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const viewDetail = (record) => {
  router.push(`/services/${record.id}`)
}

const openEditModal = (record) => {
  editingService.value = record
  editForm.value = {
    name: record.name || '',
    cpu: record.cpu || 1,
    memory: record.memory || 1024,
    disk: record.disk || 20,
    status: record.status || 'running',
    ipv4: record.ipv4 || '',
    ipv6: record.ipv6 || '',
    ssh_port: record.ssh_port || null,
    vnc_port: record.vnc_port || null,
    mac: record.mac || '',
    price_monthly: record.price_monthly || 0,
    price_quarterly: record.price_quarterly || 0,
    price_yearly: record.price_yearly || 0,
    expire_time: record.expire_time ? record.expire_time : null
  }
  showEditModal.value = true
}

const handleEditOk = async () => {
  editLoading.value = true
  try {
    await updateService(editingService.value.id, editForm.value)
    message.success('更新成功')
    showEditModal.value = false
    fetchServices()
  } catch (error) {
    message.error(error.message || '更新失败')
  } finally {
    editLoading.value = false
  }
}

const openTransferModal = async (record) => {
  transferringService.value = record
  transferForm.value.target_user_id = null
  showTransferModal.value = true
  // 加载用户列表
  try {
    const res = await getUsers({ page: 1, pageSize: 100 })
    userList.value = res.data?.list || res.data || []
  } catch (e) {
    console.error('Failed to load users:', e)
    userList.value = []
  }
}

const handleTransferOk = async () => {
  if (!transferForm.value.target_user_id) {
    message.warning('请选择目标用户')
    return
  }
  transferLoading.value = true
  try {
    await transferService(transferringService.value.id, transferForm.value)
    message.success('转移成功')
    showTransferModal.value = false
    fetchServices()
  } catch (error) {
    message.error(error.message || '转移失败')
  } finally {
    transferLoading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await deleteService(id)
    message.success('删除成功')
    fetchServices()
  } catch (error) {
    message.error(error.message)
  }
}

const convertToTemplate = async (record) => {
  try {
    await convertServiceToTemplate(record.id)
    message.success('转换成功')
    fetchServices()
  } catch (error) {
    message.error(error.message || '转换失败')
  }
}

const handleTableChange = (page) => {
  pagination.value.current = page.current
  pagination.value.pageSize = page.pageSize
  fetchServices()
}

onMounted(() => {
  fetchServices()
})
</script>

<style scoped>
.services-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
