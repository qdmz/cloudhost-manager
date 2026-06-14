<template>
  <div class="custom-create-page">
    <h2>自定义开通</h2>
    <p class="subtitle">手动为用户开通自定义配置的虚拟机或容器</p>
    
    <a-form :model="form" layout="vertical" style="max-width: 900px">
      <a-card title="用户信息" class="mb-16">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="选择用户" name="user_id" :rules="[{ required: true, message: '请选择用户' }]">
              <a-select v-model:value="form.user_id" show-search filterable placeholder="搜索用户名或邮箱">
                <a-select-option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.username }} ({{ user.email }})
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="当前余额">
              <span class="text-primary">¥{{ selectedUser?.balance || 0 }}</span>
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>
      
      <a-card title="产品配置" class="mb-16">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="选择节点" name="node_id" :rules="[{ required: true, message: '请选择节点' }]">
              <a-select v-model:value="form.node_id" placeholder="选择节点">
                <a-select-option v-for="node in nodes" :key="node.id" :value="node.id">
                  {{ node.name }} ({{ node.type }})
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="虚拟化类型" name="type">
              <a-select v-model:value="form.type">
                <a-select-option value="kvm">KVM</a-select-option>
                <a-select-option value="lxc">LXC</a-select-option>
                <a-select-option value="lxd">LXD</a-select-option>
                <a-select-option value="incus">Incus</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="CPU核心数" name="cpu" :rules="[{ required: true, message: '请输入CPU核心数' }]">
              <a-input-number v-model:value="form.cpu" :min="1" :max="64" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="内存(MB)" name="memory" :rules="[{ required: true, message: '请输入内存大小' }]">
              <a-input-number v-model:value="form.memory" :min="128" :max="131072" :step="128" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="磁盘(GB)" name="disk" :rules="[{ required: true, message: '请输入磁盘大小' }]">
              <a-input-number v-model:value="form.disk" :min="1" :max="1000" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="带宽(Mbps)" name="bandwidth">
              <a-input-number v-model:value="form.bandwidth" :min="1" :max="10000" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="流量限制(GB/月)" name="traffic_limit">
              <a-input-number v-model:value="form.traffic_limit" :min="0" style="width: 100%" placeholder="0表示不限" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>
      
      <a-card title="网络配置" class="mb-16">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="IPv4地址" name="ipv4">
              <a-input v-model:value="form.ipv4" placeholder="如: 10.0.1.100" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="IPv6地址" name="ipv6">
              <a-input v-model:value="form.ipv6" placeholder="如: 2001:db8::100" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="MAC地址" name="mac">
              <a-input v-model:value="form.mac" placeholder="留空自动生成" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="端口转发规则" name="port_forwards">
          <a-textarea v-model:value="form.port_forwards" :rows="3" placeholder="格式: 外部端口:内部端口&#10;示例:&#10;22022:22&#10;3389:3389" />
        </a-form-item>
      </a-card>
      
      <a-card title="系统配置" class="mb-16">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="选择镜像" name="image_id">
              <a-select v-model:value="form.image_id" placeholder="选择系统镜像">
                <a-select-option v-for="img in images" :key="img.id" :value="img.id">
                  {{ img.name }} ({{ img.os }})
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="主机名" name="hostname">
              <a-input v-model:value="form.hostname" placeholder="如: vps-01" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="初始密码" name="password">
              <a-input-password v-model:value="form.password" placeholder="留空随机生成" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>
      
      <a-card title="计费配置" class="mb-16">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="单价(元/月)" name="price">
              <a-input-number v-model:value="form.price" :min="0" :precision="2" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="服务名称" name="name">
              <a-input v-model:value="form.name" placeholder="如: 我的VPS-01" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="到期时间" name="expire_time">
              <a-date-picker v-model:value="form.expire_time" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" name="note">
          <a-textarea v-model:value="form.note" :rows="2" placeholder="管理员备注" />
        </a-form-item>
      </a-card>
      
      <div class="form-actions">
        <a-space>
          <a-button @click="form = { user_id: null, node_id: null, type: 'kvm', cpu: 1, memory: 1024, disk: 20, bandwidth: 10, traffic_limit: 0, ipv4: '', ipv6: '', mac: '', port_forwards: '', image_id: null, hostname: '', password: '', price: 20, name: '', expire_time: dayjs().add(1, 'month'), note: '' }">重置</a-button>
          <a-button type="primary" size="large" @click="handleCreate" :loading="loading">确认开通</a-button>
        </a-space>
      </div>
    </a-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUsers, getNodes, getImages, customCreateService } from '@/api/admin'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const users = ref([])
const nodes = ref([])
const images = ref([])

const form = ref({
  user_id: null,
  node_id: null,
  type: 'kvm',
  cpu: 1,
  memory: 1024,
  disk: 20,
  bandwidth: 10,
  traffic_limit: 0,
  ipv4: '',
  ipv6: '',
  mac: '',
  port_forwards: '',
  image_id: null,
  hostname: '',
  password: '',
  price: 20,
  name: '',
  expire_time: dayjs().add(1, 'month'),
  note: ''
})

const selectedUser = computed(() => users.value.find(u => u.id === form.value.user_id))

const fetchData = async () => {
  try {
    const [usersRes, nodesRes, imagesRes] = await Promise.all([
      getUsers(),
      getNodes(),
      getImages()
    ])
    users.value = usersRes.data?.list || []
    nodes.value = Array.isArray(nodesRes.data) ? nodesRes.data : (nodesRes.data?.list || [])
    images.value = Array.isArray(imagesRes.data) ? imagesRes.data : (imagesRes.data?.list || [])
  } catch (error) {
    console.error(error)
  }
}

const handleCreate = async () => {
  if (!form.value.user_id) {
    message.warning('请选择用户')
    return
  }
  if (!form.value.node_id) {
    message.warning('请选择节点')
    return
  }
  
  loading.value = true
  try {
    const data = {
      ...form.value,
      expire_time: form.value.expire_time.format('YYYY-MM-DD HH:mm:ss')
    }
    await customCreateService(data)
    message.success('开通成功')
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.custom-create-page {
  h2 {
    margin-bottom: 4px;
  }
  
  .subtitle {
    color: #666;
    margin-bottom: 24px;
  }
}

.form-actions {
  text-align: center;
  padding: 24px 0;
}
</style>
