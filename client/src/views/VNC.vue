<template>
  <div class="vnc-page">
    <div class="vnc-header">
      <div class="header-left">
        <a-button @click="$router.back()">
          <ArrowLeftOutlined /> 返回
        </a-button>
        <span>VNC 连接 - {{ serviceName }}</span>
      </div>
      <div class="header-actions">
        <a-button @click="reconnect">
          <ReloadOutlined /> 重连
        </a-button>
        <a-button @click="toggleFullscreen">
          <ExpandOutlined /> 全屏
        </a-button>
      </div>
    </div>
    
    <div class="vnc-container" ref="terminalRef">
      <div v-if="!connected" class="connecting">
        <a-spin tip="正在连接..." />
        <p>正在建立 VNC 连接...</p>
      </div>
      <div v-else class="terminal" ref="terminalEl"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getServiceConsole } from '@/api/service'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined, ReloadOutlined, ExpandOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const terminalRef = ref(null)
const terminalEl = ref(null)
const connected = ref(false)
const serviceName = ref('')
let ws = null

const connect = async () => {
  try {
    const res = await getServiceConsole(route.params.id)
    const { vnc_url, token } = res.data
    
    serviceName.value = res.data?.name || 'VNC'
    
    ws = new WebSocket(vnc_url)
    
    ws.onopen = () => {
      connected.value = true
      ws.send(token)
    }
    
    ws.onmessage = (event) => {
      if (terminalEl.value) {
        terminalEl.value.textContent += event.data
        terminalEl.value.scrollTop = terminalEl.value.scrollHeight
      }
    }
    
    ws.onerror = () => {
      message.error('VNC 连接失败')
      connected.value = false
    }
    
    ws.onclose = () => {
      connected.value = false
    }
  } catch (error) {
    message.error('无法获取 VNC 连接信息')
  }
}

const reconnect = () => {
  if (ws) ws.close()
  connected.value = false
  setTimeout(connect, 500)
}

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    terminalRef.value?.requestFullscreen()
  }
}

const sendKey = (key) => {
  if (ws && connected.value) {
    ws.send(key)
  }
}

onMounted(() => {
  connect()
  
  document.addEventListener('keydown', (e) => {
    if (ws && connected.value) {
      let key = ''
      if (e.ctrlKey && e.key === 'c') key = '\x03'
      else if (e.ctrlKey && e.key === 'd') key = '\x04'
      else if (e.ctrlKey && e.key === 'z') key = '\x1a'
      else if (e.key === 'Enter') key = '\r'
      else if (e.key === 'Backspace') key = '\x7f'
      else if (e.key.length === 1) key = e.key
      
      if (key) {
        e.preventDefault()
        ws.send(key)
      }
    }
  })
})

onUnmounted(() => {
  if (ws) ws.close()
})
</script>

<style lang="scss" scoped>
.vnc-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  
  .vnc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #2d2d2d;
    color: #fff;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .vnc-container {
    flex: 1;
    overflow: hidden;
    
    .connecting {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      
      p {
        margin-top: 16px;
      }
    }
    
    .terminal {
      height: 100%;
      padding: 16px;
      color: #ccc;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 14px;
      line-height: 1.5;
      overflow: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: #1e1e1e;
    }
  }
}
</style>
