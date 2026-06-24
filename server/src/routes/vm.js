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
    
    console.log('[VNC] Checking VM', vmid, 'on node', node.name)
    
    // Try QEMU first
    try {
      console.log('[VNC] Trying qemu path...')
      const qemuResp = await pve.request('GET', '/nodes/' + node.name + '/qemu/' + vmid + '/config')
      if (qemuResp && qemuResp.data) {
        endpoint = 'qemu'
        vmExists = true
        console.log('[VNC] Found as QEMU')
      }
    } catch (e) {
      console.log('[VNC] QEMU check failed:', e.message?.substring(0, 100))
      // Not a QEMU VM, try LXC
      try {
        console.log('[VNC] Trying lxc path...')
        const lxcResp = await pve.request('GET', '/nodes/' + node.name + '/lxc/' + vmid + '/config')
        if (lxcResp && lxcResp.data) {
          endpoint = 'lxc'
          vmExists = true
          console.log('[VNC] Found as LXC')
        }
      } catch (e2) {
        console.log('[VNC] LXC also failed:', e2.message?.substring(0, 100))
        return res.json({ code: 404, message: '虚拟机不存在' })
      }
    }
    
    if (!vmExists) {
      console.log('[VNC] VM not found at all')
      return res.json({ code: 404, message: '虚拟机不存在' })
    }
    
    // Get VNC spiceproxy ticket
    console.log('[VNC] Getting VNC ticket for', endpoint, vmid)
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
