<template>
  <div class="nodes-page">
    <div class="page-header">
      <h2>节点管理</h2>
      <a-button type="primary" @click="openAddModal"><PlusOutlined /> 添加节点</a-button>
    </div>
    
    <a-table :columns="columns" :data-source="nodes" :loading="loading" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'online' ? 'success' : 'error'">
            {{ record.status === 'online' ? '在线' : '离线' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'ssh_status'">
          <a-tag :color="record.ssh_enabled ? 'success' : 'default'">
            {{ record.ssh_enabled ? '已启用' : '未启用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'resources'">
          <a-progress :percent="record.cpu_usage" size="small" />
          <div class="text-muted">内存: {{ record.memory_usage || 0 }}/{{ record.memory_total || 0 }}GB</div>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="handleEditNode(record)">编辑</a-button>
            <a-button size="small" @click="handleSyncNode(record)"><SyncOutlined /> 同步</a-button>
            <a-button size="small" @click="handleTestPve(record)"><CheckOutlined /> 测试</a-button>
            <a-button size="small" @click="syncImages(record)"><DownloadOutlined /> 同步镜像</a-button>
            <a-button size="small" @click="manageImages(record)">镜像</a-button>
            <a-popconfirm title="确定删除？" @confirm="handleDeleteNode(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <a-modal v-model:open="showAddModal" :title="nodeForm.id ? '编辑节点' : '添加节点'" width="800px" @ok="handleAddNode">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="basic" tab="基础配置">
          <a-form :model="nodeForm" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="节点名称" name="name" :rules="[{ required: true, message: '请输入节点名称' }]">
                  <a-input v-model:value="nodeForm.name" placeholder="如: 洛杉矶节点1" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="节点类型" name="type" :rules="[{ required: true, message: '请选择节点类型' }]">
                  <a-select v-model:value="nodeForm.type">
                    <a-select-option value="pve">Proxmox VE</a-select-option>
                    <a-select-option value="incus">Incus</a-select-option>
                    <a-select-option value="lxd">LXD</a-select-option>
                    <a-select-option value="kvm">KVM</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="节点地址 (PVE Web UI)" name="host" :rules="[{ required: true, message: '请输入节点地址' }]">
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
          </a-form>
        </a-tab-pane>
        
        <a-tab-pane key="network" tab="网络配置">
          <a-form :model="nodeForm" layout="vertical">
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
            <a-divider style="margin: 12px 0" />
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="端口转发起始" name="port_range_start">
                  <a-input-number v-model:value="nodeForm.port_range_start" :min="1024" :max="65535" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="端口转发结束" name="port_range_end">
                  <a-input-number v-model:value="nodeForm.port_range_end" :min="1024" :max="65535" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="每VM最大端口数" name="max_ports_per_vm">
                  <a-input-number v-model:value="nodeForm.max_ports_per_vm" :min="1" :max="50" style="width: 100%" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-tab-pane>
        
        <a-tab-pane key="ssh" tab="SSH配置">
          <a-form :model="nodeForm" layout="vertical">
            <a-form-item>
              <a-checkbox v-model:checked="nodeForm.ssh_enabled">启用SSH连接</a-checkbox>
              <div class="form-help">启用后可进行端口转发、域名绑定等网络配置</div>
            </a-form-item>
            
            <template v-if="nodeForm.ssh_enabled">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="SSH地址" name="ssh_host">
                    <a-input v-model:value="nodeForm.ssh_host" placeholder="留空则使用节点地址" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="SSH端口" name="ssh_port">
                    <a-input-number v-model:value="nodeForm.ssh_port" :min="1" :max="65535" style="width: 100%" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="SSH用户名" name="ssh_username">
                <a-input v-model:value="nodeForm.ssh_username" placeholder="如: root" />
              </a-form-item>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="SSH密码" name="ssh_password">
                    <a-input-password v-model:value="nodeForm.ssh_password" placeholder="留空则不修改" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="SSH私钥" name="ssh_key">
                    <a-textarea v-model:value="nodeForm.ssh_key" :rows="3" placeholder="使用私钥认证时填写" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item>
                <a-button type="primary" @click="handleTestSshLocal" :loading="sshTesting">
                  <ThunderboltOutlined /> 测试SSH连接
                </a-button>
                <span v-if="sshTestResult" :class="sshTestResult.success ? 'text-success' : 'text-error'" style="margin-left: 12px">
                  {{ sshTestResult.message }}
                </span>
              </a-form-item>
            </template>
          </a-form>
        </a-tab-pane>
        
        <a-tab-pane key="note" tab="备注">
          <a-form :model="nodeForm" layout="vertical">
            <a-form-item label="备注" name="note">
              <a-textarea v-model:value="nodeForm.note" :rows="4" placeholder="可选备注信息" />
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
    
    <a-modal v-model:open="showImagesModal" title="管理镜像" width="800px">
      <a-button type="primary" size="small" @click="openAddImageModal" style="margin-bottom: 16px">
        <PlusOutlined /> 添加镜像
      </a-button>
      <a-table :columns="imageColumns" :data-source="images" size="small" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="editImage(record)">编辑</a-button>
              <a-popconfirm title="确定删除？" @confirm="handleDeleteImage(record.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-modal>
    
    <a-modal v-model:open="showAddImageModal" title="添加镜像" width="600px" @ok="handleAddImageLocal">
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
 import { getNodes as apiGetNodes, createNode, updateNode, deleteNode, syncNode, syncNodeImages, testSshConnection as apiTestSsh, testPVEConnection as apiTestPVE, getDomainBindings, updateDomainBinding, deleteDomainBinding, getPortForwards, updatePortForward, deletePortForward, importVM, getImages, createImage, updateImage, deleteImage } from "@/api/admin";
import { message } from 'ant-design-vue'

const loading = ref(false)
const nodes = ref([])
const showAddModal = ref(false)
const showImagesModal = ref(false)
const showAddImageModal = ref(false)
const currentNode = ref(null)
const images = ref([])
const activeTab = ref('basic')
const sshTesting = ref(false)
const sshTestResult = ref(null)

const nodeForm = ref({
  id: null, name: '', type: 'pve', host: '', api_user: '', api_token: '',
  location: '', nat_bridge: 'vmbr1', ipv6_bridge: 'vmbr2',
  nat_subnet: '', ipv6_subnet: '', note: '',
  port_range_start: 30000, port_range_end: 31000, max_ports_per_vm: 5,
  ssh_enabled: false, ssh_host: '', ssh_port: 22, ssh_username: 'root', ssh_password: '', ssh_key: ''
})

const imageForm = ref({ id: null, node_id: null, name: '', os: '', version: '', arch: 'amd64', template: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '节点名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: '位置', dataIndex: 'location' },
  { title: '状态', key: 'status' },
  { title: 'SSH', key: 'ssh_status', width: 100 },
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
    const res = await apiGetNodes()
    nodes.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  nodeForm.value = {
    id: null, name: '', type: 'pve', host: '', api_user: '', api_token: '',
    location: '', nat_bridge: 'vmbr1', ipv6_bridge: 'vmbr2',
    nat_subnet: '', ipv6_subnet: '', note: '',
    port_range_start: 30000, port_range_end: 31000, max_ports_per_vm: 5,
    ssh_enabled: false, ssh_host: '', ssh_port: 22, ssh_username: 'root', ssh_password: '', ssh_key: ''
  }
  activeTab.value = 'basic'
  sshTestResult.value = null
  showAddModal.value = true
}

const handleAddNode = async () => {
  try {
    if (!nodeForm.value.name || !nodeForm.value.host) {
      message.warning('请填写必填项')
      return
    }
    
    // 清理空密码
    const submitData = { ...nodeForm.value }
    if (!submitData.ssh_password) {
      delete submitData.ssh_password
    }
    if (!submitData.ssh_key) {
      delete submitData.ssh_key
    }
    
    if (nodeForm.value.id) {
      await updateNode(nodeForm.value.id, submitData)
      message.success('更新成功')
    } else {
      await createNode(submitData)
      message.success('添加成功')
    }
    showAddModal.value = false
    fetchNodes()
  } catch (error) {
    message.error(error.message || '操作失败')
  }
}

const handleEditNode = (node) => {
  nodeForm.value = { 
    id: node.id,
    name: node.name || '',
    type: node.type || 'pve',
    host: node.host || '',
    api_user: node.api_user || '',
    api_token: node.api_token || '',
    api_token_visible: !!node.api_token,
    location: node.location || '',
    nat_bridge: node.nat_bridge || 'vmbr1',
    ipv6_bridge: node.ipv6_bridge || 'vmbr2',
    nat_subnet: node.nat_subnet || '',
    ipv6_subnet: node.ipv6_subnet || '',
    note: node.note || '',
    port_range_start: node.port_range_start || 30000,
    port_range_end: node.port_range_end || 31000,
    max_ports_per_vm: node.max_ports_per_vm || 5,
    ssh_enabled: node.ssh_enabled || false,
    ssh_host: node.ssh_host || '',
    ssh_port: node.ssh_port || 22,
    ssh_username: node.ssh_username || 'root',
    ssh_password: '',
    ssh_key: node.ssh_key || ''
  }
  activeTab.value = 'basic'
  sshTestResult.value = null
  showAddModal.value = true
}

const handleTestSsh = async () => {
  if (!nodeForm.value.id) {
    message.warning('请先保存节点后再测试SSH连接')
    return
  }
  
  sshTesting.value = true
  sshTestResult.value = null
  
  try {
    const res = await apiTestSsh(nodeForm.value.id)
    sshTestResult.value = res.data || res
    if (res.data?.success) {
      message.success('SSH连接成功')
    } else {
      message.error(res.data?.message || 'SSH连接失败')
    }
  } catch (error) {
    sshTestResult.value = { success: false, message: error.message || 'SSH连接失败' }
    message.error(error.message || 'SSH连接失败')
  } finally {
    sshTesting.value = false
  }
}

const handleSyncNode = async (node) => {
  try {
    message.loading('正在同步节点...')
    await apiSyncNode(node.id)
    message.success('节点同步成功')
    fetchNodes()
  } catch (error) {
    message.error(error.message)
  }
}

const handleTestPve = async (node) => {
  try {
    const res = await apiTestPVE(node.id)
    if (res.data?.success) {
      message.success("PVE API 连接成功")
    } else {
      message.error(res.data?.message || "PVE API 连接失败")
    }
  } catch (error) {
    message.error(error.message || "PVE API 连接失败")
  }
}

const syncImages = async (node) => {
  try {
    message.loading('正在同步镜像...')
    const res = await syncNodeImages(node.id)
    const count = res.data?.list?.length || res.data?.length || 0
    message.success(`镜像同步成功，共 ${count} 个`)
    // 刷新镜像列表
    if (currentNode.value && currentNode.value.id === node.id) {
      try {
        const imgRes = await getImages({ node_id: node.id })
        images.value = imgRes.data?.list || imgRes.data || []
      } catch {}
    }
  } catch (error) {
    message.error('镜像同步失败: ' + (error.message || '未知错误'))
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

const openAddImageModal = () => {
  imageForm.value = { id: null, node_id: currentNode.value.id, name: '', os: '', version: '', arch: 'amd64', template: '' }
  showAddImageModal.value = true
}

const editImage = (image) => {
  imageForm.value = { ...image }
  showAddImageModal.value = true
}

const handleAddImageLocal = async () => {
  try {
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

const handleDeleteImage = async (id) => {
  try {
    await apiDeleteImage(id)
    message.success('删除成功')
    if (currentNode.value) manageImages(currentNode.value)
  } catch (error) {
    message.error(error.message)
  }
}

const handleDeleteNode = async (id) => {
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

<style lang="scss" scoped>
.nodes-page {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}

.text-muted {
  color: #999;
  font-size: 12px;
}

.form-help {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.text-success {
  color: #52c41a;
}

.text-error {
  color: #f5222d;
}
</style>
