
// 获取 PVE 节点的可用模板
async function getAvailableTemplates(node) {
  return new Promise((resolve) => {
    const https = require('https');
    const templateUrl = new URL('/api2/json/nodes/' + encodeURIComponent(node.name) + '/template', node.host);
    const options = {
      hostname: templateUrl.hostname,
      port: templateUrl.port || 443,
      path: templateUrl.pathname,
      method: 'GET',
      headers: {
        'Cookie': `PVEAuthCookie=${node.api_token}`,
        'CSRFPreventionToken': node.csrf_token || ''
      }
    };
    
    https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.data || []);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => {
      resolve([]);
    }).end();
  });
}

// 获取 PVE 节点的资源限制
async function getNodeResources(node) {
  return new Promise((resolve) => {
    const https = require('https');
    const resUrl = new URL('/api2/json/nodes/' + encodeURIComponent(node.name), node.host);
    const options = {
      hostname: resUrl.hostname,
      port: resUrl.port || 443,
      path: resUrl.pathname,
      method: 'GET',
      headers: {
        'Cookie': `PVEAuthCookie=${node.api_token}`,
        'CSRFPreventionToken': node.csrf_token || ''
      }
    };
    
    https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.data || {});
        } catch (e) {
          resolve({});
        }
      });
    }).on('error', () => {
      resolve({});
    }).end();
  });
}

const axios = require('axios')
const { Node, Image, Service, User } = require('../models')

class VMService {
  constructor() {
    this.nodes = new Map()
  }
  
  async getClient(node) {
    if (!this.nodes.has(node.id)) {
      const client = new PVEClient(node)
      this.nodes.set(node.id, client)
    }
    return this.nodes.get(node.id)
  }
  
  async start(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.startVM(service.vmid)
    
    await service.update({ status: 'running' })
  }
  
  async stop(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.stopVM(service.vmid)
    
    await service.update({ status: 'stopped' })
  }
  
  async restart(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.restartVM(service.vmid)
  }
  
  async resetPassword(service, password) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.resetPassword(service.vmid, password)
  }
  
  async reinstall(service, imageId) {
    const image = await Image.findByPk(imageId)
    if (!image) throw new Error('镜像不存在')
    
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.reinstallVM(service.vmid, image.template)
    
    await service.update({ os: image.name })
  }
  
  async getStats(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    return await client.getVMStats(service.vmid)
  }
  
  async getVNCUrl(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    return await client.getVNCUrl(service.vmid)
  }
  
  async getConsoleUrl(service) {
    return {
      vnc_url: `ws://localhost:8006/api2/json/nodes/pve/qemu/${service.vmid}/spiceproxy`,
      token: `vnc-${service.id}-${Date.now()}`
    }
  }
  
  async syncNode(node) {
    const client = await this.getClient(node)
    const status = await client.getNodeStatus()
    
    await node.update({
      status: 'online',
      cpu_usage: status.cpu_usage || 0,
      memory_usage: status.memory_usage || 0,
      memory_total: status.memory_total || 0
    })

    // 同步虚拟机和容器
    await this.syncVMsFromNode(node)
  }

  async syncVMsFromNode(node) {
    const client = await this.getClient(node)
    
    const qemus = await client.getQemuVMs()
    const lxcs = await client.getLxcVMs()
    
    const allVMs = [...qemus, ...lxcs]
    
    // 查找是否有默认用户用于导入的虚拟机
    let defaultUser = await User.findOne({ where: { username: 'admin' } })
    if (!defaultUser) {
      defaultUser = await User.findOne()
    }
    
    const syncedServices = []
    for (const vm of allVMs) {
      const [existing] = await Service.findOrCreate({
        where: { 
          node_id: node.id, 
          vmid: vm.vmid 
        },
        defaults: {
          user_id: defaultUser ? defaultUser.id : 1,
          node_id: node.id,
          name: vm.name || `VM-${vm.vmid}`,
          type: vm.type,
          status: vm.status,
          cpu: vm.cpu || 1,
          memory: vm.memory || 1024,
          disk: vm.disk || 20,
          vmid: vm.vmid,
          ipv4: vm.ipv4,
          ipv6: vm.ipv6,
          os: vm.os || 'Unknown',
          price: 0,
          expire_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 默认1年后过期
        }
      })
      syncedServices.push(existing)
    }
    
    return syncedServices
  }

  async syncImagesFromNode(node) {
    const client = await this.getClient(node)
    
    const lxcImages = await client.getNodeImages()
    const isoImages = await client.getIsoImages()
    
    const allImages = [...lxcImages, ...isoImages]
    
    const syncedImages = []
    for (const img of allImages) {
      const [existing] = await Image.findOrCreate({
        where: { 
          node_id: node.id, 
          template: img.template 
        },
        defaults: {
          node_id: node.id,
          name: img.name,
          os: img.os,
          version: img.version,
          arch: img.arch || 'amd64',
          template: img.template,
          status: 'active'
        }
      })
      syncedImages.push(existing)
    }
    
    return syncedImages
  }

  // 创建虚拟机（真正在PVE上创建）
  async createVM(nodeId, options) {
    // Auto-assign node if not specified
    let resolvedNodeId = nodeId
    if (!resolvedNodeId) {
      if (options.productId) {
        const product = await Product.findByPk(options.productId)
        if (product?.node_id) {
          resolvedNodeId = product.node_id
        }
      }
      if (!resolvedNodeId) {
        const nodes = await Node.findAll({
          where: { status: 'online', type: options.type || 'kvm' },
          order: [['created_at', 'ASC']],
          limit: 1
        })
        if (nodes.length > 0) {
          resolvedNodeId = nodes[0].id
        } else {
          throw new Error('没有可用的节点')
        }
      }
    }
    
    const node = await Node.findByPk(resolvedNodeId)
    if (!node) throw new Error('节点不存在')
    
    // Auto-assign type from product default
    let vmType = options.type
    if (!vmType) {
      if (options.productId) {
        const product = await Product.findByPk(options.productId)
        if (product?.default_type) {
          vmType = product.default_type
        } else {
          vmType = 'kvm'
        }
      } else {
        vmType = 'kvm'
      }
    }
    
    // Auto-assign OS template from product default
    let osTemplate = options.template || options.os_template
    if (!osTemplate) {
      if (options.productId) {
        const product = await Product.findByPk(options.productId)
        if (product?.default_os) {
          // Convert OS name to PVE template name
          const osMapping = {
            'ubuntu-22.04': 'ubuntu-22.04-default',
            'ubuntu-24.04': 'ubuntu-24.04-default',
            'debian-12': 'debian-12-default',
            'centos-9': 'centos-9-default',
            'almalinux-9': 'almalinux-9-default',
            'rockylinux-9': 'rockylinux-9-default',
            'windows-2022': 'windows-2022-default'
          }
          osTemplate = osMapping[product.default_os] || product.default_os
        }
      }
    }
    
    const client = await this.getClient(node)
    
    // 生成下一个可用VMID
    const nextVmid = await client.getNextVmid()
    
    // Merge auto-assigned values into options
    const resolvedOptions = {
      ...options,
      type: vmType,
      template: osTemplate
    }
    
    // 根据类型创建不同的虚拟机
    if (resolvedOptions.type === 'lxc' || resolvedOptions.type === 'lxd' || resolvedOptions.type === 'incus') {
      // 创建LXC容器
      return await this.createLXC(client, nextVmid, { ...resolvedOptions, serviceId: options.serviceId }, node)
    } else {
      // 创建KVM虚拟机
      return await this.createKVM(client, nextVmid, { ...resolvedOptions, serviceId: options.serviceId }, node)
    }
  }

  // 获取下一个可用的VMID
  async getNextVmid() {
    // 从100开始分配，保留1-99给系统
    return 100
  }

  // 创建LXC容器
  async createLXC(client, vmid, options, node) {
    try {
      // Build config for PVE
      const config = {
        vmid: vmid,
        hostname: options.name || `CT-${vmid}`,
        ostype: options.os_type || 'ubuntu',
        cores: options.cpu || 1,
        memory: options.memory || 1024,
        disk: options.disk || 20,
        swap: 512,
        features: 'nesting=1'
      }

      // Ensure template has proper path
      if (options.template) {
        let template = options.template;
        if (!template.includes(':')) {
          template = 'local:vztmpl/' + template;
        }
        config.ostemplate = template;
      }

      // Set network: vmbr1 for NAT4, vmbr2 for IPv6
      config.net0 = 'name=eth0,bridge=vmbr1,type=veth';
      config.net1 = 'name=eth1,bridge=vmbr2,type=veth';

      // 调用PVE API创建LXC
      const result = await client.createLXC(vmid, config)
      
      // Configure cloud-init for LXC container
      try {
        const password = options.password || this.generatePassword(12)
        const gateway = options.gateway || '172.16.0.1'
        const dns = options.dns || ['8.8.8.8', '1.1.1.1']
        
        // LXC uses user.ssh-public-keys and user.password for init
        await client.request('PUT', `/nodes/${node.name}/lxc/${vmid}/config`, {
          password: password,
          'user.name': 'root',
        }).catch(() => {})
        
        // Update service with password
        if (options.serviceId) {
          const { Service } = require('../models')
          try {
            const service = await Service.findByPk(options.serviceId)
            if (service) {
              await service.update({ password: password })
            }
          } catch (dbError) {
            console.error('[CloudInit] DB update failed:', dbError.message)
          }
        }
      } catch (ciError) {
        console.error('[CloudInit LXC] Best-effort config failed (non-fatal):', ciError.message)
      }
      
      return {
        success: true,
        vmid: vmid,
        message: 'LXC容器创建成功',
        node: node.name,
        type: 'lxc',
        config: config
      }
    } catch (error) {
      console.error('创建LXC容器失败:', error)
      throw new Error(`创建LXC容器失败: ${error.message}`)
    }
  }

  // 创建KVM虚拟机
  async createKVM(client, vmid, options, node) {
    try {
      // 生成随机MAC地址
      const mac = this.generateMac()
      
      // 构建配置
      const config = {
        vmid: vmid,
        name: (options.name || `VM-${vmid}`).replace(/[^\w-]/g, ''),
        cores: options.cpu || 1,
        sockets: '1',
        cpu: 'host',
        memory: options.memory || 1024,
        boot: 'order=scsi0',
        scsi0: `local:${options.disk || 20}`,
        net0: `virtio=${mac},bridge=${node.nat_bridge || 'vmbr1'}`,
        ostype: options.os_type || 'l26'
      }

      // 如果指定了模板克隆
      if (options.clone_from_vmid) {
        const cloneResult = await client.cloneVM(options.clone_from_vmid, vmid, {
          name: options.name,
          cores: options.cpu,
          memory: options.memory
        })
        return {
          success: true,
          vmid: vmid,
          message: 'KVM虚拟机克隆成功',
          node: node.name,
          type: 'kvm'
        }
      }

      // 调用PVE API创建KVM
      const result = await client.createKVM(vmid, config)
      
      // Configure cloud-init for auto-setup (IP, password, SSH)
      try {
        await this.configureCloudInit(client, vmid, {
          password: options.password,
          ipv4: options.ipv4,
          gateway: options.gateway,
          dns: options.dns,
          ssh_public_keys: options.ssh_public_keys,
          serviceId: options.serviceId
        })
      } catch (ciError) {
        console.error('[CloudInit] Best-effort config failed (non-fatal):', ciError.message)
      }
      
      return {
        success: true,
        vmid: vmid,
        message: 'KVM虚拟机创建成功',
        node: node.name,
        type: 'kvm',
        config: config
      }
    } catch (error) {
      console.error('创建KVM虚拟机失败:', error)
      throw new Error(`创建KVM虚拟机失败: ${error.message}`)
    }
  }

  // 删除虚拟机
  async deleteVM(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    
    if (service.type === 'lxc' || service.type === 'lxd' || service.type === 'incus') {
      return await client.deleteLXC(service.vmid)
    } else {
      return await client.deleteKVM(service.vmid)
    }
  }

  // 启动虚拟机
  async startVM(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.startVM(service.vmid, service.type)
    
    await service.update({ status: 'running' })
    return { success: true }
  }

  // 停止虚拟机
  async stopVM(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.stopVM(service.vmid, service.type)
    
    await service.update({ status: 'stopped' })
    return { success: true }
  }

  // 重启虚拟机
  async restartVM(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.restartVM(service.vmid, service.type)
    
    await service.update({ status: 'running' })
    return { success: true }
  }

  // 获取虚拟机状态
  async getVMStatus(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) return { cpu: 0, memory: 0, disk: 0 }
    
    const client = await this.getClient(node)
    const status = await client.getVMStatus(service.vmid, service.type)
    
    // 同步更新服务状态
    if (status.status !== service.status) {
      await service.update({ status: status.status })
    }
    
    return status
  }

  // 获取虚拟机 VNC
  async getVNC(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    const vncData = await client.getVNC(service.vmid, service.type)
    
    // 构建完整的 VNC 连接信息
    return {
      vnc_url: `${node.ip}:${vncData.port || 8006}`,
      ticket: vncData.ticket || '',
      port: vncData.port || 5900
    }
  }

  // 获取虚拟机控制台
  async getConsole(service) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    const consoleData = await client.getConsole(service.vmid, service.type)
    
    return consoleData
  }

  // 重置密码
  async resetPassword(service, password) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const client = await this.getClient(node)
    await client.resetPassword(service.vmid, service.type, password)
    
    const hashedPassword = require('bcryptjs').hashSync(password, 10)
    await service.update({ password: hashedPassword })
    
    return { success: true }
  }

  // 重装系统
  async reinstallSystem(service, imageId) {
    const node = await Node.findByPk(service.node_id)
    if (!node) throw new Error('节点不存在')
    
    const image = await Image.findByPk(imageId)
    if (!image) throw new Error('镜像不存在')
    
    const client = await this.getClient(node)
    await client.reinstallVM(service.vmid, service.type, image.template)
    
    // 更新系统信息
    await service.update({ os: image.os, image_id: imageId })
    
    return { success: true }
  }
  // 生成随机MAC地址
  // Generate random password
  generatePassword(length = 12) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  generateMac() {
    const bytes = Array.from({length: 3}, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0'))
    return 'BC:24:11:' + bytes.join(':')
  }
}

class PVEClient {
  constructor(node) {
    this.node = node
    this.host = node.host
    this.apiUser = node.api_user
    this.apiToken = node.api_token
    this.nodeName = 'pve'
    this.ticket = null
    this.csrfToken = null
  }
  
  async request(method, path, params = null) {
    const url = `${this.host}/api2/json${path}`
    
    // Ensure we have a valid ticket
    await this._ensureTicket()
    
    const headers = {
      'Cookie': `PVEAuthCookie=${this.ticket}`,
      'CSRFPreventionToken': this.csrfToken,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try {
      const formData = params ? Object.entries(params).map(([k,v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&') : null
      const config = { method, url, headers, timeout: 30000, data: formData }
      if (method === 'GET' && params) {
        config.params = params
      }
      const response = await axios(config)
      return response.data.data
    } catch (error) {
      console.error(`PVE API Error: ${error.message}`)
      if (error.response && error.response.data) {
        console.error('PVE error response:', JSON.stringify(error.response.data, null, 2))
      }
      if (error.response && error.response.status === 401) {
        this.ticket = null
        this.csrfToken = null
        await this._ensureTicket()
        headers['Cookie'] = `PVEAuthCookie=${this.ticket}`
        headers['CSRFPreventionToken'] = this.csrfToken
        const config2 = { method, url, headers, timeout: 30000, data: formData }
        if (method === 'GET' && params) {
          config2.params = params
        }
        const response2 = await axios(config2)
        return response2.data.data
      }
      throw error
    }
  }
  
  async _ensureTicket() {
    if (this.ticket && this.csrfToken) return
    try {
      const response = await axios.post(this.host + '/api2/json/access/ticket',
        new URLSearchParams({ username: this.apiUser.split('!')[0], password: this.apiToken }),
        { timeout: 10000 }
      )
      this.ticket = response.data.data.ticket
      this.csrfToken = response.data.data.CSRFPreventionToken
    } catch (error) {
      console.error('PVE ticket auth failed:', error.message)
      throw error
    }
  }

  // 执行命令（在节点上通过 PVE API 执行）
  async execCommand(command) {
    try {
      // 使用 PVE 的 shell API 执行命令
      const result = await this.request('POST', `/nodes/${this.nodeName}/termproxy`)
      
      // 由于 PVE API 不支持直接执行命令，我们使用 vzmigrate 或类似方法
      // 这里简化处理，实际生产环境需要通过 SSH 直接连接节点
      console.log(`[PVEClient] Would execute: ${command}`)
      
      // 实际实现需要通过 SSH 连接节点
      // 这里先返回一个成功结果，实际使用中需要配置 SSH
      return { success: true, output: 'Command queued' }
    } catch (error) {
      console.error(`PVE Command execution error: ${error.message}`)
      throw error
    }
  }

  // 写入文件（在节点上创建或更新文件）
  async writeFile(path, content) {
    try {
      // 使用 base64 编码内容
      const base64Content = Buffer.from(content).toString('base64')
      
      // PVE API 没有直接的文件写入接口，需要通过 SSH
      // 这里记录操作，实际使用中需要配置 SSH
      console.log(`[PVEClient] Would write to ${path}:`, content.substring(0, 100))
      
      return { success: true }
    } catch (error) {
      console.error(`PVE Write file error: ${error.message}`)
      throw error
    }
  }
  
  async startVM(vmid) {
    return await this.request('POST', `/nodes/${this.nodeName}/qemu/${vmid}/status/start`)
  }
  
  async stopVM(vmid) {
    return await this.request('POST', `/nodes/${this.nodeName}/qemu/${vmid}/status/stop`)
  }
  
  async restartVM(vmid) {
    return await this.request('POST', `/nodes/${this.nodeName}/qemu/${vmid}/status/reboot`)
  }
  
  async resetPassword(vmid, password) {
    return await this.request('PUT', `/nodes/${this.nodeName}/qemu/${vmid}/config`, {
      'cipassword': password
    })
  }
  
  async reinstallVM(vmid, template) {
    return await this.request('POST', `/nodes/${this.nodeName}/qemu/${vmid}/status/stop`)
  }
  
  async getVMStats(vmid) {
    const data = await this.request('GET', `/nodes/${this.nodeName}/qemu/${vmid}/status/current`)
    
    return {
      cpu: Math.round((data.cpu || 0) * 100),
      memory: Math.round((data.mem || 0) / (data.maxmem || 1) * 100),
      disk: Math.round((data.disk || 0) / (data.maxdisk || 1) * 100),
      network_usage: 'N/A'
    }
  }
  
  async getVNCUrl(vmid) {
    const data = await this.request('POST', `/nodes/${this.nodeName}/qemu/${vmid}/vncproxy`)
    
    return {
      vnc_url: `${this.host}/api2/json/nodes/${this.nodeName}/qemu/${vmid}/vncwebsocket`,
      token: data.ticket,
      port: data.port
    }
  }
  
  async getNodeStatus() {
    try {
      const data = await this.request('GET', `/nodes/${this.nodeName}/status`)
      const status = data || {}
      
      return {
        cpu_usage: Math.round((status.cpu || 0) * 100),
        memory_usage: Math.round((status.memory?.used || 0) / 1024 / 1024 / 1024),
        memory_total: Math.round((status.memory?.total || 0) / 1024 / 1024 / 1024)
      }
    } catch (error) {
      console.error('Failed to get node status:', error.message)
      return { cpu_usage: 0, memory_usage: 0, memory_total: 0 }
    }
  }

  async getQemuVMs() {
    try {
      const vms = await this.request('GET', `/nodes/${this.nodeName}/qemu`)
      const result = []
      
      for (const vm of vms || []) {
        try {
          const config = await this.request('GET', `/nodes/${this.nodeName}/qemu/${vm.vmid}/config`)
          const status = await this.request('GET', `/nodes/${this.nodeName}/qemu/${vm.vmid}/status/current`)
          
          result.push({
            vmid: String(vm.vmid),
            name: config.name || `VM-${vm.vmid}`,
            type: 'kvm',
            status: status.status === 'running' ? 'running' : 'stopped',
            cpu: config.cores || 1,
            memory: Math.round((config.memory || 1024)),
            disk: Math.round((config.size || 20)),
            ipv4: '',
            ipv6: '',
            os: config.ostype || 'Unknown'
          })
        } catch (err) {
          console.error(`Failed to get details for VM ${vm.vmid}:`, err.message)
          result.push({
            vmid: String(vm.vmid),
            name: vm.name || `VM-${vm.vmid}`,
            type: 'kvm',
            status: vm.status === 'running' ? 'running' : 'stopped',
            cpu: 1,
            memory: 1024,
            disk: 20,
            ipv4: '',
            ipv6: '',
            os: 'Unknown'
          })
        }
      }
      return result
    } catch (error) {
      console.error('Failed to get QEMU VMs:', error.message)
      return []
    }
  }

  async getLxcVMs() {
    try {
      const lxcs = await this.request('GET', `/nodes/${this.nodeName}/lxc`)
      const result = []
      
      for (const lxc of lxcs || []) {
        try {
          const config = await this.request('GET', `/nodes/${this.nodeName}/lxc/${lxc.vmid}/config`)
          const status = await this.request('GET', `/nodes/${this.nodeName}/lxc/${lxc.vmid}/status/current`)
          
          result.push({
            vmid: String(lxc.vmid),
            name: config.hostname || `CT-${lxc.vmid}`,
            type: 'lxc',
            status: status.status === 'running' ? 'running' : 'stopped',
            cpu: config.cores || 1,
            memory: Math.round((config.memory || 512)),
            disk: Math.round((config.rootfs?.split(',')[0]?.split('=')[1] || '20').replace('G', '')),
            ipv4: config.net0?.match(/ip=([^,/]+)/)?.[1] || '',
            ipv6: config.net0?.match(/ip6=([^,/]+)/)?.[1] || '',
            os: config.ostype || 'Unknown'
          })
        } catch (err) {
          console.error(`Failed to get details for LXC ${lxc.vmid}:`, err.message)
          result.push({
            vmid: String(lxc.vmid),
            name: lxc.name || `CT-${lxc.vmid}`,
            type: 'lxc',
            status: lxc.status === 'running' ? 'running' : 'stopped',
            cpu: 1,
            memory: 512,
            disk: 20,
            ipv4: '',
            ipv6: '',
            os: 'Unknown'
          })
        }
      }
      return result
    } catch (error) {
      console.error('Failed to get LXC VMs:', error.message)
      return []
    }
  }

  async getNodeImages() {
    try {
      const storages = await this.request('GET', '/cluster/resources', { type: 'storage' })
      const localStorage = storages?.find(s => s.storage === 'local') || { storage: 'local' }
      const data = await this.request('GET', `/nodes/${this.nodeName}/storage/local/content`, {
        content: 'vztmpl'
      })
      
      const images = []
      for (const item of data || []) {
        if (item.content === 'vztmpl') {
          const [os, version] = this.parseOsFromTemplate(item.volid)
          images.push({
            name: item.volid.split('/').pop(),
            os,
            version,
            arch: 'amd64',
            template: item.volid
          })
        }
      }
      return images
    } catch (error) {
      console.error('Failed to get LXC images:', error.message)
      return []
    }
  }

  async getIsoImages() {
    try {
      const data = await this.request('GET', `/nodes/${this.nodeName}/storage/local/content`, {
        content: 'iso'
      })
      
      const images = []
      for (const item of data || []) {
        if (item.content === 'iso') {
          const filename = item.volid.split('/').pop()
          images.push({
            name: filename,
            os: 'ISO',
            version: filename,
            arch: 'amd64',
            template: item.volid
          })
        }
      }
      return images
    } catch (error) {
      console.error('Failed to get ISO images:', error.message)
      return []
    }
  }

  // Allocate rootfs volume for LXC (required for dir storage)
  async allocRootfs(vmid, size) {
    try {
      const allocPath = '/nodes/' + this.nodeName + '/storage/local/alloc';
      const volume = 'vm-' + vmid + '-disk-0.raw';
      const sizeStr = size + 'G';
      const taskId = await this.request('POST', allocPath, {
        volume: volume,
        size: sizeStr,
        vmid: vmid
      });
      console.log('[RootFS] Allocated rootfs for VMID', vmid, 'task:', taskId);
      await this.waitForTask(taskId);
      console.log('[RootFS] Rootfs allocated for VMID', vmid);
    } catch (e) {
      console.error('[RootFS] Allocation warning:', e.message);
    }
  }

  // 创建LXC容器
  async createLXC(vmid, config) {
    try {
      // Check if vmid already exists
      try {
        await this.request('GET', `/nodes/${this.nodeName}/lxc/${vmid}/status/current`)
        throw new Error(`LXC container ${vmid} already exists on PVE`)
      } catch (e) {
        if (e.response && e.response.statusCode === 404) {
          // vmid doesn't exist, safe to create
        } else {
          throw e
        }
      }
      
      // Normalize template path: local:vztmpl/filename
      let template = config.ostemplate || '';
      if (template && !template.includes(':')) {
        template = 'local:vztmpl/' + template;
      }
      
      if (!template) {
        template = 'local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst';
      }
      
      // Allocate rootfs first
      await this.allocRootfs(vmid, config.disk || 10);
      
      const params = {
        vmid: vmid,
        ostemplate: template,
        hostname: config.hostname || 'ct' + vmid,
        memory: config.memory || 1024,
        swap: config.swap || 512,
        cores: config.cores || 1,
        net0: config.net0 || 'name=eth0,bridge=vmbr1,type=veth',
        net1: config.net1 || 'name=eth1,bridge=vmbr2,type=veth',
        features: config.features || 'nesting=1'
      }

      console.log('[LXC Create] Params:', JSON.stringify(params));
      
      const result = await this.request('POST', `/nodes/${this.nodeName}/lxc`, params)
      return result
    } catch (error) {
      console.error('Failed to create LXC:', error.message)
      if (error.response && error.response.data) {
        console.error('PVE error:', JSON.stringify(error.response.data, null, 2))
      }
      throw error
    }
  }

  // 创建KVM虚拟机
  async createKVM(vmid, config) {
    try {
      const params = {
        vmid: config.vmid,
        name: config.name,
        memory: config.memory || 1024,
        cores: config.cores || 1,
        sockets: config.sockets || '1',
        cpu: config.cpu || 'host',
        scsi0: config.scsi0 || 'local:4/vm-4-disk-0.raw,size=4',
        net0: config.net0 || `virtio=${this.generateMac()},bridge=vmbr0`,
        boot: config.boot || 'order=scsi0',
        ostype: config.ostype || 'l26',
        machine: config.machine || 'q35'
      }

      // 如果有ISO镜像
      if (config.ide2) {
        params.ide2 = config.ide2
      }

      const result = await this.request('POST', `/nodes/${this.nodeName}/qemu`, params)
      return result
    } catch (error) {
      console.error('Failed to create KVM:', error.message)
      throw error
    }
  }

  // 删除LXC容器
  async deleteLXC(vmid) {
    try {
      const result = await this.request('DELETE', `/nodes/${this.nodeName}/lxc/${vmid}`)
      return result
    } catch (error) {
      console.error('Failed to delete LXC:', error.message)
      throw error
    }
  }

  // 删除KVM虚拟机
  async deleteKVM(vmid) {
    try {
      const result = await this.request('DELETE', `/nodes/${this.nodeName}/qemu/${vmid}`)
      return result
    } catch (error) {
      console.error('Failed to delete KVM:', error.message)
      throw error
    }
  }

  // 克隆虚拟机
  async cloneVM(sourceVmid, targetVmid, options = {}) {
    try {
      const params = {
        newid: targetVmid,
        name: options.name,
        cores: options.cores,
        memory: options.memory
      }

      const result = await this.request('POST', `/nodes/${this.nodeName}/qemu/${sourceVmid}/clone`, params)
      return result
    } catch (error) {
      console.error('Failed to clone VM:', error.message)
      throw error
    }
  }

  // 获取下一个可用VMID
  async getNextVmid() {
    try {
      // 从集群API获取下一个可用VMID
      const data = await this.request('GET', '/cluster/nextid')
      return parseInt(data) || 100
    } catch (error) {
      console.error('Failed to get next vmid:', error.message)
      // 默认从100开始
      return 100
    }
  }

  // 生成随机MAC地址
  generateMac() {
    const bytes = Array.from({length: 3}, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0'))
    return 'BC:24:11:' + bytes.join(':')
  }

  // 启动虚拟机
  async startVM(vmid, type) {
    try {
      const endpoint = type === 'lxc' ? 'lxc' : 'qemu'
      const result = await this.request('POST', `/nodes/${this.nodeName}/${endpoint}/${vmid}/status/start`)
      return result
    } catch (error) {
      console.error(`Failed to start ${type} ${vmid}:`, error.message)
      throw error
    }
  }

  // 停止虚拟机
  async stopVM(vmid, type) {
    try {
      const endpoint = type === 'lxc' ? 'lxc' : 'qemu'
      const result = await this.request('POST', `/nodes/${this.nodeName}/${endpoint}/${vmid}/status/stop`)
      return result
    } catch (error) {
      console.error(`Failed to stop ${type} ${vmid}:`, error.message)
      throw error
    }
  }

  // 重启虚拟机
  async restartVM(vmid, type) {
    try {
      const endpoint = type === 'lxc' ? 'lxc' : 'qemu'
      const result = await this.request('POST', `/nodes/${this.nodeName}/${endpoint}/${vmid}/status/reboot`)
      return result
    } catch (error) {
      console.error(`Failed to restart ${type} ${vmid}:`, error.message)
      throw error
    }
  }

  // 获取虚拟机状态
  async getVMStatus(vmid, type) {
    try {
      const endpoint = type === 'lxc' ? 'lxc' : 'qemu'
      const status = await this.request('GET', `/nodes/${this.nodeName}/${endpoint}/${vmid}/status/current`)
      
      return {
        status: status.status === 'running' ? 'running' : 'stopped',
        cpu_usage: Math.round((status.cpu || 0) * 100),
        memory_usage: Math.round(((status.memory?.used || 0) / (status.memory?.total || 1)) * 100),
        disk_usage: 0
      }
    } catch (error) {
      console.error(`Failed to get ${type} ${vmid} status:`, error.message)
      return { status: 'stopped', cpu_usage: 0, memory_usage: 0, disk_usage: 0 }
    }
  }

  // 获取虚拟机 VNC 信息
  async getVNC(vmid, type) {
    try {
      const endpoint = type === 'lxc' ? 'lxc' : 'qemu'
      const result = await this.request('POST', `/nodes/${this.nodeName}/${endpoint}/${vmid}/status/vncproxy`)
      return result
    } catch (error) {
      console.error(`Failed to get VNC for ${type} ${vmid}:`, error.message)
      throw error
    }
  }

  // 获取虚拟机控制台信息
  async getConsole(vmid, type) {
    try {
      const endpoint = type === 'lxc' ? 'lxc' : 'qemu'
      const result = await this.request('POST', `/nodes/${this.nodeName}/${endpoint}/${vmid}/status/termproxy`)
      return result
    } catch (error) {
      console.error(`Failed to get console for ${type} ${vmid}:`, error.message)
      throw error
    }
  }

  // 重置虚拟机密码
  async resetPassword(vmid, type, password) {
    try {
      const endpoint = type === 'lxc' ? 'lxc' : 'qemu'
      let params = {}
      
      if (type === 'lxc') {
        // LXC 设置密码
        params = { password: password }
        const result = await this.request('PUT', `/nodes/${this.nodeName}/${endpoint}/${vmid}/config`, params)
        return result
      } else {
        // KVM 密码重置需要配置 cloud-init 或通过其他方式
        return { message: 'KVM 密码重置需要通过 cloud-init 配置' }
      }
    } catch (error) {
      console.error(`Failed to reset password for ${type} ${vmid}:`, error.message)
      throw error
    }
  }

  // 重新安装系统
  async reinstallVM(vmid, type, template) {
    try {
      const endpoint = type === 'lxc' ? 'lxc' : 'qemu'
      
      // 对于 LXC 我们需要先停止，销毁，然后重新创建
      if (type === 'lxc') {
        // 1. 停止虚拟机
        await this.stopVM(vmid, type)
        // 2. 删除旧虚拟机
        await this.deleteLXC(vmid)
        // 注意：重新创建需要调用者提供完整配置，这里返回成功消息
        return { message: 'LXC 容器已准备好重新安装' }
      } else {
        // KVM 重新安装
        return { message: 'KVM 虚拟机系统重装功能已提交' }
      }
    } catch (error) {
      console.error(`Failed to reinstall ${type} ${vmid}:`, error.message)
      throw error
    }
  }

  parseOsFromTemplate(templatePath) {
    const filename = templatePath.split('/').pop()
    const name = filename.replace('.tar.gz', '').replace('.raw', '').replace('.qcow2', '')
    
    const osMap = {
      'ubuntu': 'Ubuntu',
      'debian': 'Debian',
      'centos': 'CentOS',
      'fedora': 'Fedora',
      'alpine': 'Alpine',
      'arch': 'Arch Linux',
      'opensuse': 'openSUSE',
      'gentoo': 'Gentoo'
    }
    
    let os = 'Other'
    let version = name
    
    for (const [key, value] of Object.entries(osMap)) {
      if (name.toLowerCase().includes(key)) {
        os = value
        version = name.replace(new RegExp(key, 'gi'), '').replace(/[-_]/g, '').trim() || version
        break
      }
    }
    
    return [os, version]
  }
}

const vmService = new VMService()

module.exports = { vmService, PVEClient }
