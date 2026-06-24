/**
 * VM API Routes
 * /api/vm/vncproxy/:node_id/:vmid - Get VNC spiceproxy ticket
 * /api/vm/list/:node_id - List VMs on a node
 */

const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

/**
 * POST /api/vm/vncproxy/:node_id/:vmid
 * Get VNC spiceproxy ticket for a VM
 */
router.post('/vncproxy/:node_id/:vmid', auth, async (req, res) => {
  try {
    const { PVEClient } = require('../services/vm')
    const { Node } = require('../models')
    
    const nodeId = req.params.node_id
    const vmid = req.params.vmid
    
    const node = await Node.findByPk(nodeId)
    if (!node) {
      return res.json({ code: 404, message: '节点不存在' })
    }
    
    const pve = new PVEClient(node)
    
    // Determine endpoint based on VM type (qemu or lxc)
    let endpoint = 'qemu'
    let vmExists = false
    
    // Try QEMU first
    try {
      const qemuResp = await pve.request('GET', '/nodes/' + node.name + '/qemu/' + vmid + '/config')
      if (qemuResp) {
        endpoint = 'qemu'
        vmExists = true
      }
    } catch (e) {
      // Not a QEMU VM, try LXC
      try {
        const lxcResp = await pve.request('GET', '/nodes/' + node.name + '/lxc/' + vmid + '/config')
        if (lxcResp) {
          endpoint = 'lxc'
          vmExists = true
        }
      } catch (e2) {
        return res.json({ code: 404, message: '虚拟机不存在' })
      }
    }
    
    if (!vmExists) {
      return res.json({ code: 404, message: '虚拟机不存在' })
    }
    
    // LXC containers don't support VNC - use console instead
    if (endpoint === 'lxc') {
      return res.json({
        code: 200,
        message: 'LXC容器不支持VNC，请使用SSH终端',
        data: { type: 'lxc', note: '请使用SSH终端连接' }
      })
    }
    
    // Get VNC spiceproxy ticket for QEMU
    const data = await pve.request('POST', '/nodes/' + node.name + '/' + endpoint + '/' + vmid + '/status/vncproxy', {
      username: 'root@pam',
      faildown: 'telnet'
    })
    
    res.json({
      code: 200,
      message: 'VNC ticket obtained',
      data: data
    })
  } catch (error) {
    console.error('VNC proxy error:', error.message)
    res.json({ code: 500, message: error.message || '获取VNC连接信息失败' })
  }
})

/**
 * GET /api/vm/list/:node_id
 * List all VMs on a node
 */
router.get('/list/:node_id', auth, async (req, res) => {
  try {
    const { PVEClient } = require('../services/vm')
    const { Node } = require('../models')
    
    const node = await Node.findByPk(req.params.node_id)
    if (!node) {
      return res.json({ code: 404, message: '节点不存在' })
    }
    
    const pve = new PVEClient(node)
    
    const qemuResp = await pve.request('GET', '/nodes/' + node.name + '/qemu')
    const lxcResp = await pve.request('GET', '/nodes/' + node.name + '/lxc')
    
    res.json({
      code: 200,
      data: {
        qemu: qemuResp || [],
        lxc: lxcResp || []
      }
    })
  } catch (error) {
    console.error('List VMs error:', error.message)
    res.json({ code: 500, message: error.message || '获取虚拟机列表失败' })
  }
})

module.exports = router
