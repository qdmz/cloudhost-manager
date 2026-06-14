/**
 * Console WebSocket 路由
 * WS /api/console/ws?sessionId=xxx — 建立 SSH 终端 WebSocket 连接
 */

const http = require('http')
const url = require('url')
const { ConsoleService } = require('../services/console')

let wss = null

/**
 * 初始化 WebSocket 服务器
 */
function init(server) {
  const WebSocket = require('ws')
  wss = new WebSocket.Server({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname

    if (pathname === '/api/console/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
      return
    }

    // 其他路径关闭连接
    socket.destroy()
  })

  wss.on('connection', (ws, request) => {
    const params = new URLSearchParams(request.url.split('?')[1])
    const sessionId = params.get('sessionId')

    if (!sessionId) {
      ws.send(JSON.stringify({ type: 'error', message: '缺少 sessionId' }))
      ws.close(4000, 'Missing sessionId')
      return
    }

    const session = ConsoleService.sessions?.get(sessionId)
    if (!session || !session.stream) {
      ws.send(JSON.stringify({ type: 'error', message: '会话不存在' }))
      ws.close(4000, 'Session not found')
      return
    }

    // 前端发送的数据 → SSH 流
    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'input' && parsed.data) {
          session.stream.write(Buffer.from(parsed.data, 'base64'))
        }
      } catch (e) {
        // 忽略格式错误
      }
    })

    // SSH 流数据 → 前端
    session.stream.on('data', (chunk) => {
      if (ws.readyState === 1) { // OPEN
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString('base64') }))
      }
    })

    session.stream.stderr.on('data', (chunk) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'stderr', data: chunk.toString('base64') }))
      }
    })

    // 前端断开 → 关闭 SSH 会话
    ws.on('close', () => {
      session.stream.end()
      ConsoleService.sessions.delete(sessionId)
    })

    ws.on('error', (err) => {
      console.error('[Console WS] Error:', err.message)
      session.stream.end()
      ConsoleService.sessions.delete(sessionId)
    })
  })
}

module.exports = { init }
