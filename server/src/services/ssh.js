/**
 * SSH 服务
 * 提供通过 SSH 连接到节点执行命令的功能
 */

const { Node } = require('../models')
const ssh2 = require('ssh2')

class SSHService {
  constructor() {
    this.connections = new Map() // 缓存连接
  }

  /**
   * 获取或创建 SSH 连接
   */
  async getConnection(nodeId) {
    // 检查缓存的连接
    if (this.connections.has(nodeId)) {
      const conn = this.connections.get(nodeId)
      if (conn && conn._stream && !conn._stream.destroyed) {
        return conn
      }
      this.connections.delete(nodeId)
    }

    const node = await Node.findByPk(nodeId)
    if (!node) throw new Error('节点不存在')

    if (!node.ssh_enabled) {
      throw new Error('SSH 未启用')
    }

    const sshHost = node.ssh_host || node.host.replace('https://', '').replace('http://', '')
    const sshPort = node.ssh_port || 22
    const sshUsername = node.ssh_username || 'root'

    return new Promise((resolve, reject) => {
      const conn = new ssh2.Client()

      const connectConfig = {
        host: sshHost,
        port: sshPort,
        username: sshUsername,
        readyTimeout: 30000,
        keepaliveInterval: 60000
      }

      // 优先使用私钥认证
      if (node.ssh_key) {
        connectConfig.privateKey = node.ssh_key
      } else if (node.ssh_password) {
        connectConfig.password = node.ssh_password
      } else {
        reject(new Error('未配置 SSH 认证信息'))
        return
      }

      conn.on('ready', () => {
        console.log(`[SSH] Connected to ${sshHost}:${sshPort}`)
        this.connections.set(nodeId, conn)
        resolve(conn)
      })

      conn.on('error', (err) => {
        console.error(`[SSH] Connection error:`, err.message)
        this.connections.delete(nodeId)
        reject(err)
      })

      conn.on('close', () => {
        console.log(`[SSH] Connection closed: ${sshHost}`)
        this.connections.delete(nodeId)
      })

      conn.connect(connectConfig)
    })
  }

  /**
   * 在节点上执行命令
   */
  async execCommand(nodeId, command) {
    const conn = await this.getConnection(nodeId)

    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          reject(err)
          return
        }

        let stdout = ''
        let stderr = ''

        stream.on('close', (code, signal) => {
          resolve({
            code: code,
            signal: signal,
            stdout: stdout,
            stderr: stderr
          })
        })

        stream.on('data', (data) => {
          stdout += data.toString()
        })

        stream.stderr.on('data', (data) => {
          stderr += data.toString()
        })
      })
    })
  }

  /**
   * 在节点上写入文件
   */
  async writeFile(nodeId, filePath, content) {
    const conn = await this.getConnection(nodeId)

    return new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) {
          reject(err)
          return
        }

        const writeStream = sftp.createWriteStream(filePath)

        writeStream.on('error', reject)
        writeStream.on('close', () => {
          resolve({ success: true, path: filePath })
        })

        writeStream.write(content)
        writeStream.end()
      })
    })
  }

  /**
   * 在节点上读取文件
   */
  async readFile(nodeId, filePath) {
    const conn = await this.getConnection(nodeId)

    return new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) {
          reject(err)
          return
        }

        let content = ''
        const readStream = sftp.createReadStream(filePath)

        readStream.on('error', reject)
        readStream.on('data', (data) => {
          content += data.toString()
        })
        readStream.on('close', () => {
          resolve(content)
        })
      })
    })
  }

  /**
   * 在节点上创建目录
   */
  async mkdir(nodeId, dirPath) {
    return this.execCommand(nodeId, `mkdir -p ${dirPath}`)
  }

  /**
   * 在节点上检查文件是否存在
   */
  async fileExists(nodeId, filePath) {
    try {
      const result = await this.execCommand(nodeId, `test -e ${filePath} && echo 'exists' || echo 'not exists'`)
      return result.stdout.trim() === 'exists'
    } catch (error) {
      return false
    }
  }

  /**
   * 测试 SSH 连接
   */
  async testConnection(nodeId) {
    try {
      await this.execCommand(nodeId, 'echo "test"')
      return { success: true, message: 'SSH 连接成功' }
    } catch (error) {
      return { success: false, message: `SSH 连接失败: ${error.message}` }
    }
  }

  /**
   * 关闭指定节点的连接
   */
  async closeConnection(nodeId) {
    if (this.connections.has(nodeId)) {
      const conn = this.connections.get(nodeId)
      conn.end()
      this.connections.delete(nodeId)
    }
  }

  /**
   * 关闭所有连接
   */
  async closeAllConnections() {
    for (const [nodeId, conn] of this.connections) {
      conn.end()
    }
    this.connections.clear()
  }
}

module.exports = new SSHService()
