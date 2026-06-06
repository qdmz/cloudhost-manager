const express = require('express')
const router = express.Router()
const { PortForward, Service, User } = require('../models')
const { auth } = require('../middleware/auth')
const networkService = require('../services/network')

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, service_id } = req.query
    
    const where = { user_id: req.userId }
    if (service_id) where.service_id = service_id
    
    const { count, rows } = await PortForward.findAndCountAll({
      where,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size)
    })
    
    res.json({
      code: 200,
      data: { list: rows, total: count, page: parseInt(page), page_size: parseInt(page_size) }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { service_id, protocol, external_port, internal_ip, internal_port, note } = req.body
    
    const service = await Service.findOne({
      where: { id: service_id, user_id: req.userId }
    })
    
    if (!service) {
      return res.json({ code: 404, message: '服务不存在' })
    }
    
    if (!service.vmid) {
      return res.json({ code: 400, message: '服务没有关联真实虚拟机，无法配置端口转发' })
    }
    
    const existing = await PortForward.findOne({
      where: { protocol: protocol || 'tcp', external_port }
    })
    
    if (existing) {
      return res.json({ code: 400, message: '端口已被占用' })
    }
    
    // 创建端口转发记录
    const forward = await PortForward.create({
      user_id: req.userId,
      service_id,
      protocol: protocol || 'tcp',
      external_port,
      internal_ip: internal_ip || service.ipv4,
      internal_port,
      status: 'pending',
      note
    })
    
    // 尝试在节点上配置端口转发
    try {
      await networkService.setupPortForward(service, forward)
      await forward.update({ status: 'active' })
    } catch (configError) {
      console.error('Port forward configuration failed:', configError)
      // 配置失败，但仍然创建记录
      await forward.update({ status: 'pending' })
    }
    
    res.json({ code: 200, message: '创建成功', data: forward })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '创建失败' })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const forward = await PortForward.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] }
      ]
    })
    
    if (!forward) {
      return res.json({ code: 404, message: '转发不存在' })
    }
    
    res.json({ code: 200, data: forward })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const { protocol, external_port, internal_ip, internal_port, note } = req.body
    
    const forward = await PortForward.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{ model: Service, as: 'service' }]
    })
    
    if (!forward) {
      return res.json({ code: 404, message: '转发不存在' })
    }
    
    // 更新配置
    await forward.update({
      protocol: protocol || forward.protocol,
      external_port: external_port || forward.external_port,
      internal_ip: internal_ip || forward.internal_ip,
      internal_port: internal_port || forward.internal_port,
      note: note !== undefined ? note : forward.note,
      status: 'pending'
    })
    
    // 重新配置端口转发
    try {
      // 先删除旧的
      await networkService.removePortForward(forward.service, forward)
      // 再创建新的
      await networkService.setupPortForward(forward.service, forward)
      await forward.update({ status: 'active' })
    } catch (configError) {
      console.error('Port forward reconfiguration failed:', configError)
    }
    
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '更新失败' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const forward = await PortForward.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{ model: Service, as: 'service' }]
    })
    
    if (!forward) {
      return res.json({ code: 404, message: '转发不存在' })
    }
    
    // 尝试删除节点上的配置
    try {
      await networkService.removePortForward(forward.service, forward)
    } catch (configError) {
      console.error('Port forward removal failed:', configError)
    }
    
    await forward.destroy()
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

module.exports = router
