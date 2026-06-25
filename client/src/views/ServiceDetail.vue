<template>
  <div class="service-detail-page">
    <a-spin v-if="loading" />
    <template v-else-if="service">
      <div class="page-header">
        <div class="header-left">
          <a-button @click="$router.push('/services')">
            <ArrowLeftOutlined /> 返回
          </a-button>
          <h1>{{ service.name }}</h1>
          <a-tag :color="getStatusColor(service.status)">{{ getStatusText(service.status) }}</a-tag>
        </div>
        <div class="header-right">
          <a-button v-if="service.status !== 'running'" type="primary" @click="handleAction('start')">
            <PlayCircleOutlined /> 开机
          </a-button>
          <a-button v-if="service.status === 'running'" @click="handleAction('stop')">
            <PauseCircleOutlined /> 关机
          </a-button>
          <a-button @click="handleAction('restart')">
            <ReloadOutlined /> 重启
          </a-button>
        </div>
      </div>
      
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :lg="16">
          <div class="card">
            <div class="card-title">服务信息</div>
            <a-descriptions :column="2" bordered>
              <a-descriptions-item label="服务器ID">{{ service.id }}</a-descriptions-item>
              <a-descriptions-item label="端口信息" :span="2">
                <template v-if="service.node">
                  <div style="line-height:1.8">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                      <a-tag color="blue">
                        <Icon type="md-cloud" /> {{ service.node.name }}
                      </a-tag>
                      <a-tag color="default">
                        {{ service.node?.ssh_host || service.ssh_host || 'pve.ypvps.com' }}
                      </a-tag>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                      <a-tag v-if="service.ssh_port" color="green" @click="copyToClipboard((service.node?.ssh_host || service.ssh_host || 'pve.ypvps.com') + ':' + service.ssh_port + ' root@' + (service.node?.ssh_host || service.ssh_host || 'pve.ypvps.com') + ' -p ' + service.ssh_port, 'SSH连接')" style="cursor:pointer" title="点击复制SSH命令">
                        🖥 SSH:{{ service.ssh_port }}
                      </a-tag>
                      <a-tag v-if="service.http_port" color="cyan">
                        🌐 HTTP:{{ service.http_port }}
                      </a-tag>
                      <a-tag v-if="service.https_port" color="purple">
                        🔒 HTTPS:{{ service.https_port }}
                      </a-tag>
                      <a-tag v-if="service.vnc_port" color="orange" @click="copyToClipboard((service.node?.ssh_host || service.ssh_host || 'pve.ypvps.com') + ':' + service.vnc_port + ' (VNC)', 'VNC')" style="cursor:pointer" title="点击复制VNC信息">
                        🖱 VNC:{{ service.vnc_port }}
                      </a-tag>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
                      <a-tag v-if="service.ipv4" color="default">
                        📍 {{ service.ipv4 }}
                      </a-tag>
                      <a-tag v-if="service.custom_ports && service.custom_ports.length" color="geekblue">
                        🔧 {{ service.custom_ports.length }}个自定义
                      </a-tag>
                    </div>
                  </div>
                </template>
                <span v-else>未分配</span>
              </a-descriptions-item>
              <a-descriptions-item label="IP地址">{{ service.ipv4 || '未分配' }}</a-descriptions-item>
              <a-descriptions-item label="IPv6地址">{{ service.ipv6 || '未分配' }}</a-descriptions-item>
              <a-descriptions-item label="CPU">{{ service.cpu }} 核心</a-descriptions-item>
              <a-descriptions-item label="内存">{{ service.memory }} MB</a-descriptions-item>
              <a-descriptions-item label="磁盘">{{ service.disk }} GB</a-descriptions-item>
              <a-descriptions-item label="流量">{{ service.bandwidth || '无限制' }}</a-descriptions-item>
              <a-descriptions-item label="操作系统">{{ service.os || '未知' }}</a-descriptions-item>
              <a-descriptions-item label="到期时间">
                <span :class="{ 'text-error': isExpiringSoon }">{{ formatDate(service.expire_time) }}</span>
              </a-descriptions-item>
            </a-descriptions>
          </div>
          
          <div class="card">
            <div class="card-title">在线管理</div>
            <div class="action-grid">
              <div class="action-item" @click="handleAction('vnc')">
                <VideoCameraOutlined />
                <span>VNC连接</span>
              </div>
              <div class="action-item" @click="handleAction('ssh')">
                <ConsoleSqlOutlined />
                <span>SSH终端</span>
              </div>
              <div class="action-item" @click="showResetPasswordModal = true">
                <KeyOutlined />
                <span>重置密码</span>
              </div>
              <div class="action-item" @click="showReinstallModal = true">
                <ReloadOutlined />
                <span>重装系统</span>
              </div>
              <div class="action-item" @click="syncService">
                <SyncOutlined />
                <span>同步状态</span>
              </div>
              <div class="action-item" @click="showRenewModal = true">
                <ClockCircleOutlined />
                <span>续费服务</span>
              </div>
            </div>
          </div>
        </a-col>
        
        <a-col :xs="24" :lg="8">
          <div class="card">
            <div class="card-title">使用统计</div>
            <div class="stats">
              <div class="stat-item">
                <span class="label">CPU使用</span>
                <a-progress :percent="stats.cpu" size="small" />
              </div>
              <div class="stat-item">
                <span class="label">内存使用</span>
                <a-progress :percent="stats.memory" size="small" :format="p => `${p}%`" />
              </div>
              <div class="stat-item">
                <span class="label">磁盘使用</span>
                <a-progress :percent="stats.disk" size="small" />
              </div>
              <div class="stat-item">
                <span class="label">网络流量</span>
                <span class="value">{{ service.network_usage || '0 GB' }} / {{ service.bandwidth || '无限制' }}</span>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-title">快捷操作</div>
            <a-space direction="vertical" style="width: 100%">
              <a-button block @click="showRenewModal = true">
                <DollarOutlined /> 续费服务
              </a-button>
              <a-button block @click="showResetPasswordModal = true">
                <KeyOutlined /> 重置密码
              </a-button>
              <a-button block type="dashed" @click="showReinstallModal = true">
                <ReloadOutlined /> 重装系统
              </a-button>
            </a-space>
          </div>
        </a-col>
      </a-row>
    </template>
    
    <a-modal v-model:open="showResetPasswordModal" title="重置密码" @ok="handleResetPassword">
      <a-form :model="passwordForm">
        <a-form-item label="新密码" name="password" :rules="[{ required: true, message: '请输入新密码' }]">
          <a-input-password v-model:value="passwordForm.password" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirm_password" :rules="[{ required: true, message: '请确认密码' }]">
          <a-input-password v-model:value="passwordForm.confirm_password" placeholder="再次输入密码" />
        </a-form-item>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="showReinstallModal" title="重装系统" @ok="handleReinstall">
      <a-form :model="reinstallForm">
        <a-form-item label="选择系统" name="image_id">
          <a-select v-model:value="reinstallForm.image_id" placeholder="请选择系统镜像">
            <a-select-option v-for="img in images" :key="img.id" :value="img.id">
              {{ img.name }} ({{ img.os }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-alert type="warning" show-icon>
          <template #message>警告</template>
          <template #description>
            重装系统将清除所有数据，请提前备份重要数据！
          </template>
        </a-alert>
      </a-form>
    </a-modal>
    
    <a-modal v-model:open="showRenewModal" title="续费服务">
      <a-form :model="renewForm">
        <a-form-item label="续费时长">
          <a-radio-group v-model:value="renewForm.cycle">
            <a-radio value="monthly">1个月</a-radio>
            <a-radio value="quarterly">3个月</a-radio>
            <a-radio value="yearly">1年</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="支付方式">
          <a-radio-group v-model:value="renewForm.payment_method">
            <a-radio value="balance">余额支付</a-radio>
            <a-radio value="qqpay">QQ钱包</a-radio>
            <a-radio value="alipay">支付宝</a-radio>
            <a-radio value="wechat">微信支付</a-radio>
          </a-radio-group>
        </a-form-item>
        <div class="renew-summary">
          <p>续费费用：<strong>¥{{ renewPrice }}</strong></p>
          <p>到期时间将延长至：<strong>{{ newExpireDate }}</strong></p>
        </div>
      </a-form>
      <template #footer>
        <a-button @click="showRenewModal = false">取消</a-button>
        <a-button type="primary" @click="handleRenew">确认续费</a-button>
      </template>
    </a-modal>
    
    <!-- SSH Terminal Component -->
    <SshTerminal
      v-model:visible="showSshModal"
      :ssh-info="sshConnectionInfo"
      @close="sshConnectionInfo = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { getService, startService, stopService, restartService, resetPassword, reinstallSystem, renewService, getServiceStats } from '@/api/service'
import SshTerminal from '@/components/SshTerminal.vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  ConsoleSqlOutlined,
  KeyOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  FolderOpenOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const service = ref(null)

// SSH connection info modal
const showSshModal = ref(false)
const sshConnectionInfo = ref(null)
const stats = ref({ cpu: 0, memory: 0, disk: 0 })
const showResetPasswordModal = ref(false)
const showReinstallModal = ref(false)
const showRenewModal = ref(false)
const images = ref([])

const passwordForm = ref({ password: '', confirm_password: '' })
const reinstallForm = ref({ image_id: null })

watch(() => showReinstallModal.value, async (val) => {
  if (val && service.value) {
    try {
      const { request } = await import('@/utils/request')
      const res = await request.get('/services/' + service.value.id + '/images')
      images.value = res?.data || []
    } catch (e) {
      console.error('Load images error:', e)
    }
  }
})
const renewForm = ref({ cycle: 'monthly', payment_method: 'balance' })

const isExpiringSoon = computed(() => {
  if (!service.value) return false
  return dayjs(service.value.expire_time).diff(dayjs(), 'day') <= 7
})

const renewPrice = computed(() => {
  if (!service.value || !service.value.price) return 0
  const basePrice = parseFloat(service.value.price) || 0
  if (renewForm.value.cycle === 'yearly') return basePrice * 12 * 0.9
  if (renewForm.value.cycle === 'quarterly') return basePrice * 3 * 0.95
  return basePrice
})

const newExpireDate = computed(() => {
  if (!service.value) return ''
  const days = renewForm.value.cycle === 'monthly' ? 30 :
               renewForm.value.cycle === 'quarterly' ? 90 : 365
  return dayjs(service.value.expire_time).add(days, 'day').format('YYYY-MM-DD')
})

const getStatusColor = (status) => {
  const colors = { running: 'success', stopped: 'error', suspended: 'warning', pending: 'processing' }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = { running: '运行中', stopped: '已停止', suspended: '已暂停', pending: '开通中' }
  return texts[status] || status
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const getNodeDisplay = () => {
  if (!service.value) return ''
  const nodeName = (service.node && service.node.name) || service.node_name || ''
  if (!nodeName) return '未分配'
  const isDomain = /^[\w.-]+$/.test(nodeName) && (nodeName.includes('.') || /^[\d.]+$/.test(nodeName))
  if (isDomain) return nodeName
  return nodeName
}

const getNodeSSH = () => {
  if (!service.value) return 'N/A'
  const nodeName = (service.node && service.node.name) || service.node_name || ''
  if (!nodeName) return 'N/A'
  const isDomain = /^[\w.-]+$/.test(nodeName) && (nodeName.includes('.') || /^[\d.]+$/.test(nodeName))
  if (isDomain) {
    const sshPort = service.ssh_port || 22
    return nodeName + ':' + sshPort
  }
  const addr = service.ipv4 || 'N/A'
  const sshPort = service.ssh_port || 22
  return addr + ':' + sshPort
}

const fetchService = async () => {
  loading.value = true
  try {
    const res = await getService(route.params.id)
    service.value = res.data
    images.value = res.data?.images || []
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getServiceStats(route.params.id)
    stats.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleAction = async (action) => {
  try {
    if (action === 'vnc') {
      // Use PVE spiceproxy for VNC - this works through PVE's web interface
      if (service.value.node?.id) {
        message.loading({ content: '正在打开VNC控制台...', duration: 0 })
        const resp = await axios.post(`/api/vm/vncproxy/${service.value.node_id}/${service.value.vmid}`, {
          username: 'root@pam'
        })
        message.destroy()
        if (resp.data && resp.data.data) {
          // Open PVE VNC console
          window.open(`https://${service.value.node.ssh_host || window.location.hostname}:8006/vnc.html?server=${service.value.node.ssh_host}&port=8006&vnccoinfo=${encodeURIComponent(JSON.stringify(resp.data.data))}`, '_blank')
        } else {
          // Fallback: open PVE node page
          window.open(`https://${service.value.node.ssh_host || window.location.hostname}:8006/`, '_blank')
        }
      }
      return
    }
    
    if (action === 'ssh') {
      openWebSSH()
      return
    }
    
    const actions = { start: startService, stop: stopService, restart: restartService }
    await actions[action](route.params.id)
    message.success('操作成功')
    fetchService()
  } catch (error) {
    message.error(error.message)
  }
}

const handleResetPassword = async () => {
  if (passwordForm.value.password !== passwordForm.value.confirm_password) {
    message.error('两次密码不一致')
    return
  }
  try {
    await resetPassword(route.params.id, { password: passwordForm.value.password })
    message.success('密码重置成功')
    showResetPasswordModal.value = false
  } catch (error) {
    message.error(error.message)
  }
}

const handleReinstall = async () => {
  if (!reinstallForm.value.image_id) {
    message.warning('请选择系统镜像')
    return
  }
  try {
    await reinstallSystem(route.params.id, reinstallForm.value)
    message.success('系统重装请求已提交')
    showReinstallModal.value = false
    fetchService()
  } catch (error) {
    message.error(error.message)
  }
}

const handleRenew = async () => {
  if (renewForm.value.payment_method === 'balance') {
    try {
      const res = await renewService(route.params.id, {
        cycle: renewForm.value.cycle,
        payment_method: 'balance'
      })
      if (res.data && res.data.message) {
        message.success(res.data.message)
      } else {
        message.success('续费成功')
      }
    } catch (error) {
      message.error(error.message)
    }
  } else {
    try {
      const res = await renewService(route.params.id, {
        cycle: renewForm.value.cycle,
        payment_method: renewForm.value.payment_method
      })
      if (res.data && res.data.data && res.data.data.pay_url) {
        // 有支付链接，跳转到易支付页面
        window.location.href = res.data.data.pay_url
      } else if (res.data && res.data.data) {
        message.success('已创建续费订单，金额 ¥' + res.data.data.amount + '，请前往订单页支付')
      } else {
        message.success('续费成功')
      }
    } catch (error) {
      message.error(error.message)
    }
  }
  showRenewModal.value = false
  fetchService()
}


const openWebSSH = () => {
  if (!service.value?.node?.ssh_host && !service.value?.ssh_host && !service.value?.ipv4) {
    message.warning('连接信息未配置')
    return
  }
  const hostname = service.value.node?.ssh_host || service.value.ssh_host || service.value.ipv4 || 'unknown'
  const sshHost = hostname
  const sshPort = service.value.ssh_port || 22
  const user = service.value.ssh_username || 'root'
  const password = service.value.ssh_password || ''
  
  // Build SSH command for clipboard copy
  const sshCmd = `ssh ${user}@${sshHost} -p ${sshPort}`
  
  // Try to open web terminal first
  // Check if websockify is available on this host
  const wsUrl = `wss://${window.location.hostname}:${window.location.port || 443}/ws/ssh/${service.value.id}`
  
  // Fallback: copy SSH command and show connection info
  if (password) {
    message.success('已复制 SSH 连接命令到剪贴板，请在终端中粘贴执行')
    navigator.clipboard.writeText(sshCmd).catch(() => {})
  } else {
    message.success('已复制 SSH 连接命令到剪贴板')
    navigator.clipboard.writeText(sshCmd).catch(() => {})
  }
  
  // Open a modal with connection info
  sshConnectionInfo.value = {
    command: sshCmd,
    host: sshHost,
    port: sshPort,
    user: user,
    password: password,
    sftpCmd: `sftp ${user}@${sshHost} -P ${sshPort}`,
    vncCmd: password ? `vnc://<node-ip>[:port]` : '需要通过PVE控制台访问'
  }
  showSshModal.value = true
}

const openSFTP = () => {
  openWebSSH()
}

const openVNC = () => {
  const hostname = service.value.node?.ssh_host || service.value.ssh_host || window.location.hostname
  console.log('Opening VNC for:', hostname, 'port:', service.value.vnc_port)
  window.open(`https://${hostname}:8006/?console=novnc`, '_blank')
}

const copyToClipboard = (text, label) => {
  navigator.clipboard.writeText(text).then(() => {
    message.success(label + ' 已复制到剪贴板')
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    message.success(label + ' 已复制')
  })
}

const syncService = async () => {
  try {
    await getService(route.params.id)
    message.success('同步成功')
    fetchService()
    fetchStats()
  } catch (error) {
    message.error(error.message)
  }
}

onMounted(() => {
  fetchService()
  fetchStats()
})
</script>

<style lang="scss" scoped>
.service-detail-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      h1 {
        margin: 0;
      }
    }
    
    .header-right {
      display: flex;
      gap: 8px;
    }
  }
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    
    .anticon {
      font-size: 32px;
      margin-bottom: 8px;
      color: var(--primary-color);
    }
    
    span {
      font-size: 13px;
    }
    
    &:hover {
      background: var(--primary-color);
      color: #fff;
      
      .anticon {
        color: #fff;
      }
    }
  }
}

.stats {
  .stat-item {
    margin-bottom: 16px;
    
    .label {
      display: block;
      margin-bottom: 4px;
      color: #666;
    }
    
    .value {
      font-weight: 500;
    }
  }
}

.renew-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  
  p {
    margin: 8px 0;
  }
}
</style>
