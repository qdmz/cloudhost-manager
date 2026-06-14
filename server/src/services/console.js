/**
 * Console 服务
 * 通过 SSH 提供 Web 终端会话管理
 */

const SSHService = require('./ssh')
const { Node, Service } = require('../models')
const jwt = require('jsonwebtoken')

class ConsoleService {
  constructor() {
    // sessionId -> { node, session }
    this.sessions = new Map()
  }

  /**
   * 创建 SSH 终端会话
   * @param {string} userId - 用户ID
   * @param {Object} options - { serviceId?, nodeId?, command? }
   * @returns {Object} { sessionId, expiresAt }
   */
  async createSession(userId, options = {}) {
    let node = null
    let service = null

    // 确定目标节点
    if (options.serviceId) {
      service = await Service.findByPk(options.serviceId)
      if (!service) throw new Error('服务不存在')
      node = await Node.findByPk(service.node_id)
    } else if (options.nodeId) {
      node = await Node.findByPk(options.nodeId)
    } else {
      // 获取第一个可用的 SSH 节点
      node = await Node.findOne({
        where: { ssh_enabled: true }
      })
    }

    if (!node) throw new Error('没有可用的节点')
    if (!node.ssh_enabled) throw new Error('节点 SSH 未启用')

    // 获取 SSH 连接
    const sshConn = await SSHService.getConnection(node.id)

    // 创建终端会话
    const sessionId = this.generateSessionId()
    const expiresAt = new Date(Date.now() + 3600 * 1000) // 1小时过期

    return new Promise((resolve, reject) => {
      sshConn.shell({
        width: 80,
        height: 24,
        term: 'xterm'
      }, (err, stream) => {
        if (err) {
          reject(err)
          return
        }

        this.sessions.set(sessionId, {
          node,
          stream,
          userId,
          serviceId: service?.id || null,
          createdAt: new Date(),
          expiresAt
        })

        stream.on('close', () => {
          this.sessions.delete(sessionId)
        })

        stream.stderr.on('data', (data) => {
          console.error(`[Console ${sessionId}] stderr:`, data.toString())
        })

        resolve({
          sessionId,
          expiresAt
        })
      })
    })
  }

  /**
   * 向会话发送输入
   * @param {string} sessionId 
   * @param {Buffer|string} data 
   */
  sendData(sessionId, data) {
    const session = this.sessions.get(sessionId)
    if (!session || !session.stream.writable) {
      throw new Error('会话不存在或已关闭')
    }
    session.stream.write(data)
  }

  /**
   * 从会话读取输出
   */
  readData(sessionId) {
    // 实时流式会话不支持同步读取，
    // 数据通过 WebSocket 推送
    return null
  }

  /**
   * 关闭会话
   */
  closeSession(sessionId) {
    const session = this.sessions.get(sessionId)
    if (session) {
      if (session.stream.writable) {
        session.stream.end()
      }
      this.sessions.delete(sessionId)
    }
  }

  /**
   * 清理所有过期会话
   */
  cleanupExpired() {
    const now = new Date()
    for (const [sessionId, session] of this.sessions) {
      if (now >= session.expiresAt) {
        this.closeSession(sessionId)
      }
    }
  }

  generateSessionId() {
    return `console_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

module.exports = new ConsoleService()
