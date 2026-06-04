<template>
  <div class="products-page">
    <div class="page-header">
      <h2>产品管理</h2>
      <a-button type="primary" @click="openAddModal">
        <PlusOutlined /> 添加产品
      </a-button>
    </div>
    
    <a-table :columns="columns" :data-source="products" :loading="loading" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'price'">
          <span class="text-primary">¥{{ record.min_price || 0 }}~{{ record.max_price || 0 }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'online' ? 'success' : 'default'">
            {{ record.status === 'online' ? '上架' : '下架' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="openEditModal(record)">编辑</a-button>
            <a-button size="small" @click="openPlansModal(record)">配置</a-button>
            <a-popconfirm title="确定删除？" @confirm="handleDelete(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <a-modal v-model:open="addModalVisible" title="添加产品" width="800px" @ok="handleSaveProduct">
      <a-form :model="productForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="产品名称" name="name">
              <a-input v-model:value="productForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="产品类型" name="type">
              <a-select v-model:value="productForm.type">
                <a-select-option value="kvm">KVM</a-select-option>
                <a-select-option value="lxc">LXC</a-select-option>
                <a-select-option value="lxd">LXD</a-select-option>
                <a-select-option value="incus">Incus</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="产品描述" name="description">
          <a-textarea v-model:value="productForm.description" :rows="3" />
        </a-form-item>
        <a-form-item label="产品特点" name="features">
          <a-textarea v-model:value="productForm.features" placeholder="每行一个特点" :rows="3" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="CPU范围" name="cpu_range">
              <a-input v-model:value="productForm.cpu_range" placeholder="如: 1-8" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="内存范围(MB)" name="memory_range">
              <a-input v-model:value="productForm.memory_range" placeholder="如: 512-16384" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="磁盘范围(GB)" name="disk_range">
              <a-input v-model:value="productForm.disk_range" placeholder="如: 10-500" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="plansModalVisible" title="管理配置方案" width="800px">
      <a-table :columns="planColumns" :data-source="plans" size="small" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'price'">
            <span class="text-primary">¥{{ record.price_monthly || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-popconfirm title="确定删除？" @confirm="handleDeletePlan(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const products = ref([])
const addModalVisible = ref(false)
const plansModalVisible = ref(false)
const currentProduct = ref(null)
const plans = ref([])
const editingProductId = ref(null)

const productForm = reactive({
  name: '',
  type: 'kvm',
  description: '',
  features: '',
  cpu_range: '1-8',
  memory_range: '512-16384',
  disk_range: '10-500'
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '产品名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: '价格范围', key: 'price' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'action', width: 250 }
]

const planColumns = [
  { title: '配置名称', dataIndex: 'name' },
  { title: 'CPU', dataIndex: 'cpu' },
  { title: '内存(MB)', dataIndex: 'memory' },
  { title: '磁盘(GB)', dataIndex: 'disk' },
  { title: '月价', key: 'price' },
  { title: '操作', key: 'action', width: 100 }
]

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await res.json()
    products.value = data.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingProductId.value = null
  Object.assign(productForm, {
    name: '',
    type: 'kvm',
    description: '',
    features: '',
    cpu_range: '1-8',
    memory_range: '512-16384',
    disk_range: '10-500'
  })
  addModalVisible.value = true
}

const openEditModal = (product) => {
  editingProductId.value = product.id
  Object.assign(productForm, product)
  addModalVisible.value = true
}

const openPlansModal = async (product) => {
  currentProduct.value = product
  plansModalVisible.value = true
  try {
    const res = await fetch(`/api/admin/products/${product.id}/plans`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await res.json()
    plans.value = data.data || []
  } catch (error) {
    console.error(error)
  }
}

const handleSaveProduct = async () => {
  try {
    const url = editingProductId.value 
      ? `/api/admin/products/${editingProductId.value}` 
      : '/api/admin/products'
    const method = editingProductId.value ? 'PUT' : 'POST'
    
    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(productForm)
    })
    
    message.success('保存成功')
    addModalVisible.value = false
    fetchProducts()
  } catch (error) {
    message.error(error.message)
  }
}

const handleDelete = async (id) => {
  try {
    await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    message.success('删除成功')
    fetchProducts()
  } catch (error) {
    message.error(error.message)
  }
}

const handleDeletePlan = async (id) => {
  try {
    await fetch(`/api/admin/plans/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    message.success('删除成功')
    if (currentProduct.value) openPlansModal(currentProduct.value)
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchProducts()
})
</script>
