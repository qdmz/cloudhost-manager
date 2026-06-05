<template>
  <div class="nodes-page">
    <div class="page-header">
      <h2>节点管理</h2>
      <a-button type="primary" @click="showAddModal = true"><PlusOutlined /> 添加节点</a-button>
    </div>
    
    <a-table :columns="columns" :data-source="nodes" :loading="loading" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'online' ? 'success' : 'error'">
            {{ record.status === 'online' ? '在线' : '离线' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'resources'">
          <a-progress :percent="record.cpu_usage" size="small" />
          <div class="text-muted">内存: {{ record.memory_usage }}/{{ record.memory_total }}GB</div>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="editNode(record)">编辑</a-button>
            <a-button size="small" @click="syncNode(record)"><SyncOutlined /> 同步</a-button>
            <a-button size="small" @click="syncImages(record)"><DownloadOutlined /> 同步镜像</a-button>
            <a-button size="small" @click="manageImages(record)">镜像</a-button>
            <a-popconfirm title="确定删除？" @confirm="deleteNode(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <a-modal v-model:open="showAddModal" title="添加节点" width="700px" @ok="handleAdd">
      <a-form :model="nodeForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="节点名称" name="name">
              <a-input v-model:value="nodeForm.name" placeholder="如: 洛杉矶节点1" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="节点类型" name="type">
              <a-select v-model:value="nodeForm.type">
                <a-select-option value="pve">Proxmox VE</a-select-option>
                <a-select-option value="incus">Incus</a-select-option>
                <a-select-option value="lxd">LXD</a-select-option>
                <a-select-option value="kvm">KVM</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="节点地址" name="host">
          <a-input v-model:value="nodeForm.host" placeholder="如: https://pve.example.com:8006" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="API用户名" name="api_user">
              <a-input v-model:value="nodeForm.api_user" placeholder="如: root@pam" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="API令牌" name="api_token">
              <a-input-password v-model:value="nodeForm.api_token" placeholder="PVE API Token" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="节点位置" name="location">
          <a-input v-model:value="nodeForm.location" placeholder="如: 洛杉矶" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="NAT网桥" name="nat_bridge">
              <a-input v-model:value="nodeForm.nat_bridge" placeholder="如: vmbr1" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="IPV6网桥" name="ipv6_bridge">
              <a-input v-model:value="nodeForm.ipv6_bridge" placeholder="如: vmbr2" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="NAT子网" name="nat_subnet">
          <a-input v-model:value="nodeForm.nat_subnet" placeholder="如: 10.0.1.0/24" />
        </a-form-item>
        <a-form-item label="IPv6子网" name="ipv6_subnet">
          <a-input v-model:value="nodeForm.ipv6_subnet" placeholder="如: 2001:db8::/64" />
        </a-form-item>
        <a-form-item label="备注" name="note">
          <a-textarea v-model:value="nodeForm.note" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="showImagesModal" title="管理镜像" width="800px">
      <a-button type="primary" size="small" @click="showAddImageModal = true" style="margin-bottom: 16px">
        <PlusOutlined /> 添加镜像
      </a-button>
      <a-table :columns="imageColumns" :data-source="images" size="small" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="editImage(record)">编辑</a-button>
              <a-popconfirm title="确定删除？" @confirm="deleteImage(record.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-modal>
    
    <a-modal v-model:open="showAddImageModal" title="添加镜像" width="600px" @ok="handleAddImage">
      <a-form :model="imageForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="镜像名称" name="name">
              <a-input v-model:value="imageForm.name" placeholder="如: Ubuntu 22.04" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="操作系统" name="os">
              <a-select v-model:value="imageForm.os">
                <a-select-option value="ubuntu">Ubuntu</a-select-option>
                <a-select-option value="debian">Debian</a-select-option>
                <a-select-option value="centos">CentOS</a-select-option>
                <a-select-option value="windows">Windows</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="版本" name="version">
              <a-input v-model:value="imageForm.version" placeholder="如: 22.04" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="架构" name="arch">
              <a-select v-model:value="imageForm.arch">
                <a-select-option value="amd64">amd64</a-select-option>
                <a-select-option value="i386">i386</a-select-option>
                <a-select-option value="arm64">arm64</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="模板路径" name="template">
          <a-input v-model:value="imageForm.template" placeholder="如: local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getNodes, createNode, updateNode, deleteNode as apiDeleteNode, syncNode as apiSyncNode, syncNodeImages as apiSyncNodeImages, getImages, createImage, updateImage, deleteImage as apiDeleteImage } from '@/api/admin'
import { message } from 'ant-design-vue'

const loading = ref(false)
const nodes = ref([])
const showAddModal = ref(false)
const showImagesModal = ref(false)
const showAddImageModal = ref(false)
const currentNode = ref(null)
const images = ref([])

const nodeForm = ref({
  id: null, name: '', type: 'pve', host: '', api_user: '', api_token: '',
  location: '', nat_bridge: 'vmbr1', ipv6_bridge: 'vmbr2',
  nat_subnet: '', ipv6_subnet: '', note: ''
})

const imageForm = ref({ id: null, node_id: null, name: '', os: '', version: '', arch: 'amd64', template: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '节点名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: '位置', dataIndex: 'location' },
  { title: '状态', key: 'status' },
  { title: '资源使用', key: 'resources' },
  { title: '操作', key: 'action', width: 280 }
]

const imageColumns = [
  { title: '名称', dataIndex: 'name' },
  { title: '系统', dataIndex: 'os' },
  { title: '版本', dataIndex: 'version' },
  { title: '架构', dataIndex: 'arch' },
  { title: '操作', key: 'action' }
]

const fetchNodes = async () => {
  loading.value = true
  try {
    const res = await getNodes()
    nodes.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  try {
    if (nodeForm.value.id) {
      await updateNode(nodeForm.value.id, nodeForm.value)
      message.success('更新成功')
    } else {
      await createNode(nodeForm.value)
      message.success('添加成功')
    }
    showAddModal.value = false
    fetchNodes()
  } catch (error) {
    message.error(error.message)
  }
}

const editNode = (node) => {
  nodeForm.value = { ...node }
  showAddModal.value = true
}

const syncNode = async (node) => {
  try {
    message.loading('正在同步节点...', 0)
    await apiSyncNode(node.id)
    message.success('节点同步成功')
    fetchNodes()
  } catch (error) {
    message.error(error.message)
  } finally {
    message.destroy()
  }
}

const syncImages = async (node) => {
  try {
    message.loading('正在同步镜像...', 0)
    await apiSyncNodeImages(node.id)
    message.success('镜像同步成功')
  } catch (error) {
    message.error(error.message)
  } finally {
    message.destroy()
  }
}

const manageImages = async (node) => {
  currentNode.value = node
  showImagesModal.value = true
  try {
    const res = await getImages({ node_id: node.id })
    images.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  }
}

const editImage = (image) => {
  imageForm.value = { ...image }
  showAddImageModal.value = true
}

const handleAddImage = async () => {
  try {
    imageForm.value.node_id = currentNode.value.id
    if (imageForm.value.id) {
      await updateImage(imageForm.value.id, imageForm.value)
      message.success('更新成功')
    } else {
      await createImage(imageForm.value)
      message.success('添加成功')
    }
    showAddImageModal.value = false
    if (currentNode.value) manageImages(currentNode.value)
  } catch (error) {
    message.error(error.message)
  }
}

const deleteImage = async (id) => {
  try {
    await apiDeleteImage(id)
    message.success('删除成功')
    if (currentNode.value) manageImages(currentNode.value)
  } catch (error) {
    message.error(error.message)
  }
}

const deleteNode = async (id) => {
  try {
    await apiDeleteNode(id)
    message.success('删除成功')
    fetchNodes()
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchNodes()
})
</script>
