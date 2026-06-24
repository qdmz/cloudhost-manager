<template>
  <div class="ssh-terminal-modal">
    <a-modal
      :open="visible"
      title="SSH 终端"
      :width="'90%'"
      :footer="null"
      @cancel="handleClose"
      destroyOnClose
    >
      <div class="terminal-header">
        <span>连接: {{ sshInfo.host }}:{{ sshInfo.port }} (用户: {{ sshInfo.user }})</span>
        <a-space>
          <a-tag v-if="connected" color="green">已连接</a-tag>
          <a-tag v-else color="red">未连接</a-tag>
          <a-button size="small" @click="handleClose">关闭</a-button>
        </a-space>
      </div>
      <div ref="terminalContainer" class="terminal-container"></div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, nextTick, watch } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { message } from 'ant-design-vue'

const props = defineProps({
  visible: Boolean,
  sshInfo: {
    type: Object,
    default: () => ({ host: '', port: 22, user: 'root', password: '' })
  }
})

const emit = defineEmits(['update:visible', 'close'])

const terminalContainer = ref(null)
let terminal = null
let fitAddon = null
let ws = null
let sessionId = null
let connected = ref(false)
let reconnectTimer = null

const initTerminal = () => {
  nextTick(() => {
    if (!terminalContainer.value) return
    
    terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Courier New", Consolas, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad'
      },
      allowProposedApi: true
    })

    fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new WebLinksAddon())
    terminal.open(terminalContainer.value)
    fitAddon.fit()

    // Start SSH session
    startSession()
  })
}

const startSession = async () => {
  try {
    // Create console session via API
    const token = localStorage.getItem('token')
    const resp = await fetch('/api/console/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nodeId: 1 }) // Use first node for now
    })
    
    const data = await resp.json()
    if (data.code !== 200 || !data.data?.sessionId) {
      message.error(data.message || '创建终端会话失败')
      return
    }

    sessionId = data.data.sessionId
    connected.value = true

    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.host}/api/console/ws?sessionId=${sessionId}`
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      fitAddon.fit()
      terminal.focus()
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'output') {
          const decoded = atob(msg.data)
          terminal.write(decoded)
        } else if (msg.type === 'stderr') {
          const decoded = atob(msg.data)
          terminal.write(decoded, (err) => {
            if (err) console.error('Write error:', err)
          })
        }
      } catch (e) {
        // Raw text message
        terminal.write(event.data)
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    ws.onclose = () => {
      connected.value = false
      message.warning('终端连接已断开')
      cleanup()
    }

    // Forward terminal input to WebSocket
    terminal.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data: btoa(data) }))
      }
    })

    terminal.onBinary((binary) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data: binary }))
      }
    })

  } catch (error) {
    message.error('连接失败: ' + error.message)
    cleanup()
  }
}

const cleanup = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
  if (terminal) {
    terminal.dispose()
    terminal = null
  }
  fitAddon = null
  sessionId = null
  connected.value = false
}

const handleClose = () => {
  cleanup()
  emit('update:visible', false)
  emit('close')
}

watch(() => props.visible, (val) => {
  if (val) {
    initTerminal()
  } else {
    cleanup()
  }
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style scoped>
.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  color: #666;
}

.terminal-container {
  width: 100%;
  height: 500px;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;
}
</style>
