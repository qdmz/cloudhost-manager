const axios = require('axios')
const { Node, Image } = require('../models')

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
}

class PVEClient {
  constructor(node) {
    this.node = node
    this.host = node.host
    this.apiUser = node.api_user
    this.apiToken = node.api_token
    this.nodeName = 'pve'
  }
  
  async request(method, path, data = null) {
    const url = `${this.host}/api2/json${path}`
    
    const headers = {
      'Authorization': `PVEAPIToken=${this.apiUser}=${this.apiToken}`
    }
    
    try {
      const response = await axios({
        method,
        url,
        data,
        headers,
        timeout: 30000
      })
      return response.data.data
    } catch (error) {
      console.error(`PVE API Error: ${error.message}`)
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
    const data = await this.request('GET', `/nodes/${this.nodeName}/status`)
    const status = data[0] || {}
    
    return {
      cpu_usage: Math.round((status.cpu || 0) * 100),
      memory_usage: Math.round((status.memory?.used || 0) / 1024 / 1024),
      memory_total: Math.round((status.memory?.total || 0) / 1024 / 1024)
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
