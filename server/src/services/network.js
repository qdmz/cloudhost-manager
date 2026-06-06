/**
 * 网络配置服务
 * 处理端口转发、域名绑定等网络配置
 */

const { Node } = require('../models')
const sshService = require('./ssh')

class NetworkService {
  constructor() {
    this.timeout = 10000 // 10秒超时
  }

  /**
   * 配置端口转发
   * 在节点上使用 iptables 配置端口转发
   */
  async setupPortForward(service, portForward) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')

    if (!node.ssh_enabled) {
      throw new Error('节点未启用 SSH，无法配置端口转发')
    }

    // 获取服务的内部IP
    const internalIp = portForward.internal_ip || service.ipv4
    const internalPort = portForward.internal_port
    const externalPort = portForward.external_port
    const protocol = portForward.protocol || 'tcp'

    try {
      // 在节点上执行 iptables 命令配置端口转发
      const commands = [
        // 添加 DNAT 规则（外部访问转换为内部IP）
        `iptables -t nat -C PREROUTING -p ${protocol} --dport ${externalPort} -j DNAT --to-destination ${internalIp}:${internalPort} 2>/dev/null || iptables -t nat -A PREROUTING -p ${protocol} --dport ${externalPort} -j DNAT --to-destination ${internalIp}:${internalPort}`,
        // 添加 SNAT/MASQUERADE 规则（返回流量转换）
        `iptables -t nat -C POSTROUTING -p ${protocol} -d ${internalIp} --dport ${internalPort} -j MASQUERADE 2>/dev/null || iptables -t nat -A POSTROUTING -p ${protocol} -d ${internalIp} --dport ${internalPort} -j MASQUERADE`
      ]

      // 使用 SSH 连接执行命令
      for (const cmd of commands) {
        try {
          await sshService.execCommand(node.id, cmd)
        } catch (execError) {
          console.error('Command execution error:', execError.message)
          // 继续执行其他命令
        }
      }

      // 保存 iptables 规则到文件，确保重启后生效
      await this.saveIptablesRules(node.id)

      return {
        success: true,
        message: '端口转发配置成功',
        details: {
          internalIp,
          internalPort,
          externalPort,
          protocol
        }
      }
    } catch (error) {
      console.error('Port forward setup error:', error)
      throw new Error(`端口转发配置失败: ${error.message}`)
    }
  }

  /**
   * 删除端口转发
   */
  async removePortForward(service, portForward) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')

    if (!node.ssh_enabled) {
      throw new Error('节点未启用 SSH')
    }

    const internalIp = portForward.internal_ip || service.ipv4
    const internalPort = portForward.internal_port
    const externalPort = portForward.external_port
    const protocol = portForward.protocol || 'tcp'

    try {
      // 删除 iptables 规则
      const commands = [
        `iptables -t nat -D PREROUTING -p ${protocol} --dport ${externalPort} -j DNAT --to-destination ${internalIp}:${internalPort}`,
        `iptables -t nat -D POSTROUTING -p ${protocol} -d ${internalIp} --dport ${internalPort} -j MASQUERADE`
      ]

      for (const cmd of commands) {
        try {
          await sshService.execCommand(node.id, cmd)
        } catch (execError) {
          console.error('Command execution error:', execError.message)
        }
      }

      // 更新保存的规则
      await this.saveIptablesRules(node.id)

      return {
        success: true,
        message: '端口转发已删除'
      }
    } catch (error) {
      console.error('Port forward removal error:', error)
      throw new Error(`删除端口转发失败: ${error.message}`)
    }
  }

  /**
   * 保存 iptables 规则
   */
  async saveIptablesRules(nodeId) {
    try {
      // 确保目录存在
      await sshService.execCommand(nodeId, 'mkdir -p /etc/iptables')
      
      // 导出当前规则
      await sshService.execCommand(nodeId, 'iptables-save > /etc/iptables/rules.v4')
      
      console.log(`[Network] iptables rules saved for node ${nodeId}`)
    } catch (error) {
      console.error('Failed to save iptables rules:', error.message)
    }
  }

  /**
   * 配置域名绑定
   * 在 Nginx 上配置反向代理
   */
  async setupDomainBinding(service, domainBinding) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')

    if (!node.ssh_enabled) {
      throw new Error('节点未启用 SSH，无法配置域名绑定')
    }

    const domain = domainBinding.domain
    const protocol = domainBinding.protocol || 'http'
    const internalIp = domainBinding.internal_ip || service.ipv4
    const internalPort = domainBinding.internal_port

    try {
      // 生成 Nginx 配置文件
      const nginxConfig = this.generateNginxConfig(domain, protocol, internalIp, internalPort, domainBinding)

      // 将配置写入文件
      const configPath = `/etc/nginx/sites-available/${domain}`
      const enabledPath = `/etc/nginx/sites-enabled/${domain}`

      // 创建目录
      await sshService.execCommand(node.id, 'mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled')

      // 写入配置文件
      await sshService.writeFile(node.id, configPath, nginxConfig)

      // 创建软链接
      await sshService.execCommand(node.id, `ln -sf ${configPath} ${enabledPath}`)

      // 测试并重载 Nginx
      const testResult = await sshService.execCommand(node.id, 'nginx -t')
      if (testResult.code === 0) {
        await sshService.execCommand(node.id, 'nginx -s reload')
      } else {
        throw new Error(`Nginx 配置测试失败: ${testResult.stderr}`)
      }

      return {
        success: true,
        message: '域名绑定配置成功',
        details: {
          domain,
          protocol,
          internalIp,
          internalPort
        }
      }
    } catch (error) {
      console.error('Domain binding setup error:', error)
      throw new Error(`域名绑定配置失败: ${error.message}`)
    }
  }

  /**
   * 删除域名绑定
   */
  async removeDomainBinding(nodeId, domain) {
    const node = await Node.findByPk(nodeId)
    if (!node) throw new Error('节点不存在')

    if (!node.ssh_enabled) {
      throw new Error('节点未启用 SSH')
    }

    try {
      const configPath = `/etc/nginx/sites-available/${domain}`
      const enabledPath = `/etc/nginx/sites-enabled/${domain}`

      // 删除配置文件和软链接
      await sshService.execCommand(nodeId, `rm -f ${configPath} ${enabledPath}`)

      // 重载 Nginx
      await sshService.execCommand(nodeId, 'nginx -s reload')

      return {
        success: true,
        message: '域名绑定已删除'
      }
    } catch (error) {
      console.error('Domain binding removal error:', error)
      throw new Error(`删除域名绑定失败: ${error.message}`)
    }
  }

  /**
   * 生成 Nginx 配置
   */
  generateNginxConfig(domain, protocol, internalIp, internalPort, options = {}) {
    let sslConfig = ''

    if (protocol === 'https') {
      sslConfig = `
    # SSL 配置
    ssl_certificate /etc/ssl/certs/${domain}.pem;
    ssl_certificate_key /etc/ssl/private/${domain}.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;`
    }

    return `
# ${domain} - Generated by CloudHost Manager
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    
    # 重定向到 HTTPS（如果是 HTTPS 协议）
    ${protocol === 'https' ? `return 301 https://$server_name$request_uri;` : `
    location / {
        proxy_pass http://${internalIp}:${internalPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_http_version 1.1;
    }`}
    
    ${protocol !== 'https' ? `access_log /var/log/nginx/${domain}_access.log;
    error_log /var/log/nginx/${domain}_error.log;` : ''}
}

${protocol === 'https' ? `
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};${sslConfig}
    
    location / {
        proxy_pass http://${internalIp}:${internalPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    access_log /var/log/nginx/${domain}_access.log;
    error_log /var/log/nginx/${domain}_error.log;
}` : ''}`
  }

  /**
   * 检查节点 SSH 连通性
   */
  async checkNodeConnection(nodeId) {
    const node = await Node.findByPk(nodeId)
    if (!node) throw new Error('节点不存在')

    if (!node.ssh_enabled) {
      return { success: false, message: 'SSH 未启用' }
    }

    try {
      const result = await sshService.testConnection(nodeId)
      return result
    } catch (error) {
      return { success: false, message: `SSH 连接失败: ${error.message}` }
    }
  }
}

module.exports = new NetworkService()
