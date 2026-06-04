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
            <a-button size="small" @click="editService(record)">编辑</a-button>
            <a-popconfirm title="确定删除？" @confirm="handleDelete(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getServices, deleteService } from '@/api/admin'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const services = ref([])
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

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
  { title: '操作', key: 'action', width: 200 }
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
      page_size: pagination.value.pageSize
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
  router.push(`/service/${record.id}`)
}

const editService = (record) => {
  message.info('编辑功能开发中')
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
