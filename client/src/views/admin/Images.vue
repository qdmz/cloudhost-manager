<template>
  <div class="admin-images">
    <h2>镜像管理</h2>
    <a-alert message="同步镜像会从PVE节点自动扫描模板和ISO文件，请确保节点SSH配置正确" type="info" show-icon style="margin-bottom: 16px" />
    
    <!-- 节点选择 + 同步按钮 -->
    <a-card style="margin-bottom: 16px">
      <a-row :gutter="16" align="middle">
        <a-col>
          <span style="font-weight: bold;">选择节点：</span>
        </a-col>
        <a-col>
          <a-select v-model:value="selectedNodeId" style="width: 300px" @change="fetchImages">
            <a-select-option v-for="node in nodes" :key="node.id" :value="node.id">
              {{ node.name }} ({{ node.host }})
            </a-select-option>
          </a-select>
        </a-col>
        <a-col>
          <a-button type="primary" @click="syncImages" :loading="syncLoading" :disabled="!selectedNodeId">
            <ReloadOutlined /> 同步镜像
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 镜像列表 -->
    <a-card>
      <a-button type="primary" @click="openAddModal" style="margin-bottom: 16px">
        <PlusOutlined /> 添加镜像
      </a-button>
      <a-table
        :columns="columns"
        :data-source="images"
        :loading="loading"
        row-key="id"
        :pagination="{ pageSize: 20 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'os'">
            <a-tag>{{ record.os }}</a-tag>
          </template>
          <template v-if="column.key === 'type'">
            <a-tag v-if="record.type === 'qcow2'" color="blue">qcow2</a-tag>
            <a-tag v-else-if="record.template.includes('.iso')" color="orange">ISO</a-tag>
            <a-tag v-else color="green">LXC</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="editImage(record)">编辑</a-button>
              <a-popconfirm title="确定删除？" @confirm="handleDelete(record.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑模态框 -->
    <a-modal
      v-model:open="showModal"
      :title="imageForm.id ? '编辑镜像' : '添加镜像'"
      width="600px"
      @ok="handleSubmit"
    >
      <a-form :model="imageForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="镜像名称">
              <a-input v-model:value="imageForm.name" placeholder="如: ubuntu-22.04" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="操作系统">
              <a-input v-model:value="imageForm.os" placeholder="如: Ubuntu" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="版本">
              <a-input v-model:value="imageForm.version" placeholder="如: 22.04" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="架构">
              <a-select v-model:value="imageForm.arch">
                <a-select-option value="amd64">amd64</a-select-option>
                <a-select-option value="i386">i386</a-select-option>
                <a-select-option value="arm64">arm64</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="模板路径">
          <a-input v-model:value="imageForm.template" placeholder="如: local:vztmpl/ubuntu-22.04.tar.zst" />
        </a-form-item>
        <a-form-item label="节点">
          <a-input-number v-model:value="imageForm.node_id" :min="1" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getNodes } from '@/api/admin'
import { getImages, createImage, updateImage, deleteImage, syncNodeImages } from '@/api/admin'
import { message } from 'ant-design-vue'
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const syncLoading = ref(false)
const nodes = ref([])
const selectedNodeId = ref(null)
const images = ref([])
const showModal = ref(false)

const imageForm = ref({
  id: null, node_id: null, name: '', os: '', version: '', arch: 'amd64', template: ''
})

const columns = [
  { title: '名称', dataIndex: 'name', width: 250 },
  { title: '系统', dataIndex: 'os', width: 100 },
  { title: '版本', dataIndex: 'version', width: 150 },
  { title: '架构', dataIndex: 'arch', width: 80 },
  { title: '类型', key: 'type', width: 80 },
  { title: '模板路径', dataIndex: 'template' },
  { title: '操作', key: 'action', width: 120 }
]

// 加载节点列表
const fetchNodes = async () => {
  try {
    const res = await getNodes()
    nodes.value = res.data?.list || []
    if (nodes.value.length > 0) {
      selectedNodeId.value = nodes.value[0].id
      fetchImages()
    }
  } catch (error) {
    console.error('Failed to fetch nodes:', error)
  }
}

// 加载镜像列表
const fetchImages = async () => {
  if (!selectedNodeId.value) return
  loading.value = true
  try {
    const res = await getImages({ node_id: selectedNodeId.value })
    images.value = res.data?.list || []
  } catch (error) {
    console.error('Failed to fetch images:', error)
    message.error('获取镜像列表失败')
  } finally {
    loading.value = false
  }
}

// 同步镜像
const syncImages = async () => {
  if (!selectedNodeId.value) return
  syncLoading.value = true
  try {
    const res = await syncNodeImages(selectedNodeId.value)
    message.success(res.message || '同步成功')
    fetchImages()
  } catch (error) {
    console.error('Sync failed:', error)
    message.error(error.message || '同步失败')
  } finally {
    syncLoading.value = false
  }
}

// 打开添加模态框
const openAddModal = () => {
  imageForm.value = { id: null, node_id: selectedNodeId.value, name: '', os: '', version: '', arch: 'amd64', template: '' }
  showModal.value = true
}

// 编辑镜像
const editImage = (record) => {
  imageForm.value = { ...record }
  showModal.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    if (imageForm.value.id) {
      await updateImage(imageForm.value.id, imageForm.value)
      message.success('更新成功')
    } else {
      await createImage(imageForm.value)
      message.success('添加成功')
    }
    showModal.value = false
    fetchImages()
  } catch (error) {
    console.error(error)
    message.error(error.message || '操作失败')
  }
}

// 删除镜像
const handleDelete = async (id) => {
  try {
    await deleteImage(id)
    message.success('删除成功')
    fetchImages()
  } catch (error) {
    console.error(error)
    message.error(error.message || '删除失败')
  }
}

onMounted(() => {
  fetchNodes()
})
</script>

<style scoped>
.admin-images {
  padding: 16px;
}
</style>
