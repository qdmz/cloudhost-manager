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
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="默认节点">
              <a-select v-model:value="productForm.node_id" placeholder="选择默认节点">
                <a-select-option v-for="node in availableNodes" :key="node.id" :value="node.id">
                  {{ node.name }} ({{ node.ip }})
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="默认虚拟化类型">
              <a-select v-model:value="productForm.default_type" placeholder="选择虚拟化类型">
                <a-select-option value="kvm">KVM</a-select-option>
                <a-select-option value="docker">Docker</a-select-option>
                <a-select-option value="lxc">LXC</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="默认操作系统">
          <a-select v-model:value="productForm.default_os" placeholder="选择默认操作系统">
            <a-select-option v-for="os in osOptions" :key="os.value" :value="os.value">{{ os.label }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="plansModalVisible" title="管理配置方案" width="800px">
      <div style="margin-bottom: 16px;">
        <a-button type="primary" @click="openAddPlanModal">
          <PlusOutlined /> 添加配置方案
        </a-button>
      </div>
      <a-table :columns="planColumns" :data-source="plans" size="small" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'price'">
            <span class="text-primary">¥{{ record.price_monthly || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="openEditPlanModal(record)">编辑</a-button>
              <a-popconfirm title="确定删除？" @confirm="handleDeletePlan(record.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-modal>
    
    <a-modal v-model:open="addPlanModalVisible" title="添加配置方案" width="600px" @ok="handleSavePlan">
      <a-form :model="planForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="配置名称" name="name">
              <a-input v-model:value="planForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="月价格" name="price_monthly">
              <a-input-number v-model:value="planForm.price_monthly" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="CPU" name="cpu">
              <a-input-number v-model:value="planForm.cpu" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="内存(MB)" name="memory">
              <a-input-number v-model:value="planForm.memory" :min="128" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="磁盘(GB)" name="disk">
              <a-input-number v-model:value="planForm.disk" :min="5" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="季度价格" name="price_quarterly">
              <a-input-number v-model:value="planForm.price_quarterly" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="年价格" name="price_yearly">
              <a-input-number v-model:value="planForm.price_yearly" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="网络带宽" name="bandwidth">
          <a-input-number v-model:value="planForm.bandwidth" :min="1" :addonBefore="'Mbps'" style="width: 100%" />
        </a-form-item>
        <a-form-item label="流量限制(GB)" name="traffic">
          <a-input-number v-model:value="planForm.traffic" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getProducts, createProduct, updateProduct, deleteProduct, getPlans, createPlan, updatePlan, deletePlan } from '@/api/admin'
import { getNodes } from '@/api/product'

const loading = ref(false)
const products = ref([])
const addModalVisible = ref(false)
const plansModalVisible = ref(false)
const addPlanModalVisible = ref(false)
const currentProduct = ref(null)
const plans = ref([])
const editingProductId = ref(null)
const editingPlanId = ref(null)

const productForm = reactive({
  name: '',
  type: 'kvm',
  description: '',
  features: '',
  cpu_range: '1-8',
  memory_range: '512-16384',
  disk_range: '10-500',
  status: 'online',
  node_id: null,
  default_type: 'kvm',
  default_os: 'ubuntu-22.04'
})

const availableNodes = ref([])
const osOptions = ref([
  { label: 'Ubuntu 22.04', value: 'ubuntu-22.04' },
  { label: 'Ubuntu 24.04', value: 'ubuntu-24.04' },
  { label: 'Debian 12', value: 'debian-12' },
  { label: 'CentOS 9', value: 'centos-9' },
  { label: 'Windows Server 2022', value: 'windows-2022' },
  { label: 'AlmaLinux 9', value: 'almalinux-9' },
  { label: 'RockyLinux 9', value: 'rockylinux-9' }
])

const fetchAvailableNodes = async () => {
  try {
    const res = await getNodes({ status: 'online' })
    availableNodes.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
  } catch (error) {
    console.error('Failed to fetch nodes:', error)
  }
}

const planForm = reactive({
  name: '',
  cpu: 1,
  memory: 1024,
  disk: 20,
  bandwidth: 100,
  traffic: 0,
  price_monthly: 10,
  price_quarterly: 27,
  price_yearly: 100
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
  { title: '带宽(Mbps)', dataIndex: 'bandwidth' },
  { title: '月价', key: 'price' },
  { title: '操作', key: 'action', width: 150 }
]

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await getProducts()
    products.value = res.data?.list || []
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
    disk_range: '10-500',
    status: 'online'
  })
  addModalVisible.value = true
}

const openEditModal = (product) => {
  editingProductId.value = product.id
  Object.assign(productForm, {
    name: product.name || '',
    type: product.type || 'kvm',
    description: product.description || '',
    features: product.features || '',
    cpu_range: product.cpu_range || '1-8',
    memory_range: product.memory_range || '512-16384',
    disk_range: product.disk_range || '10-500',
    status: product.status || 'online',
    node_id: product.node_id || null,
    default_type: product.default_type || 'kvm',
    default_os: product.default_os || 'ubuntu-22.04'
  })
  // Fetch available nodes when editing
  fetchAvailableNodes()
  addModalVisible.value = true
}

const openPlansModal = async (product) => {
  currentProduct.value = product
  plansModalVisible.value = true
  try {
    const res = await getPlans(product.id)
    plans.value = res.data || []
  } catch (error) {
    console.error(error)
  }
}

const openAddPlanModal = () => {
  editingPlanId.value = null
  Object.assign(planForm, {
    name: '',
    cpu: 1,
    memory: 1024,
    disk: 20,
    bandwidth: 100,
    traffic: 0,
    price_monthly: 10,
    price_quarterly: 27,
    price_yearly: 100
  })
  addPlanModalVisible.value = true
}

const openEditPlanModal = (plan) => {
  editingPlanId.value = plan.id
  Object.assign(planForm, plan)
  addPlanModalVisible.value = true
}

const handleSaveProduct = async () => {
  try {
    if (editingProductId.value) {
      await updateProduct(editingProductId.value, productForm)
    } else {
      await createProduct(productForm)
    }
    message.success('保存成功')
    addModalVisible.value = false
    fetchProducts()
  } catch (error) {
    message.error(error.message)
  }
}

const handleSavePlan = async () => {
  try {
    if (!currentProduct.value) return
    
    if (editingPlanId.value) {
      await updatePlan(editingPlanId.value, planForm)
    } else {
      await createPlan(currentProduct.value.id, planForm)
    }
    message.success('保存成功')
    addPlanModalVisible.value = false
    openPlansModal(currentProduct.value)
  } catch (error) {
    message.error(error.message)
  }
}

const handleDelete = async (id) => {
  try {
    await deleteProduct(id)
    message.success('删除成功')
    fetchProducts()
  } catch (error) {
    message.error(error.message)
  }
}

const handleDeletePlan = async (id) => {
  try {
    await deletePlan(id)
    message.success('删除成功')
    if (currentProduct.value) openPlansModal(currentProduct.value)
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchProducts()
  fetchAvailableNodes()
})
</script>
