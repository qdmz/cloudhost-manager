const express = require('express')
const router = express.Router()
const { DomainBinding, Service, User } = require('../models')
const { auth } = require('../middleware/auth')
const networkService = require('../services/network')

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, service_id } = req.query
    
    const where = { user_id: req.userId }
    if (service_id) where.service_id = service_id
    
    const { count, rows } = await DomainBinding.findAndCountAll({
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
    const { service_id, domain, protocol, external_port, internal_ip, internal_port, note } = req.body
    
    const service = await Service.findOne({
      where: { id: service_id, user_id: req.userId }
    })
    
    if (!service) {
      return res.json({ code: 404, message: '服务不存在' })
    }
    
    if (!service.vmid) {
      return res.json({ code: 400, message: '服务没有关联真实虚拟机，无法配置域名绑定' })
    }
    
    const existing = await DomainBinding.findOne({
      where: { domain }
    })
    
    if (existing) {
      return res.json({ code: 400, message: '域名已被绑定' })
    }
    
    // 创建域名绑定记录
    const binding = await DomainBinding.create({
      user_id: req.userId,
      service_id,
      domain,
      protocol: protocol || 'http',
      external_port,
      internal_ip: internal_ip || service.ipv4,
      internal_port,
      status: 'pending',
      note
    })
    
    // 尝试在节点上配置域名绑定
    try {
      await networkService.setupDomainBinding(service, binding)
      await binding.update({ status: 'active' })
    } catch (configError) {
      console.error('Domain binding configuration failed:', configError)
      // 配置失败，但仍然创建记录
      await binding.update({ status: 'pending' })
    }
    
    res.json({ code: 200, message: '创建成功', data: binding })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '创建失败' })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const binding = await DomainBinding.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] }
      ]
    })
    
    if (!binding) {
      return res.json({ code: 404, message: '绑定不存在' })
    }
    
    res.json({ code: 200, data: binding })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const { domain, protocol, external_port, internal_ip, internal_port, note, ssl_cert, ssl_key } = req.body
    
    const binding = await DomainBinding.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{ model: Service, as: 'service' }]
    })
    
    if (!binding) {
      return res.json({ code: 404, message: '绑定不存在' })
    }
    
    const oldDomain = binding.domain
    
    // 更新配置
    await binding.update({
      domain: domain || binding.domain,
      protocol: protocol || binding.protocol,
      external_port: external_port || binding.external_port,
      internal_ip: internal_ip || binding.internal_ip,
      internal_port: internal_port || binding.internal_port,
      note: note !== undefined ? note : binding.note,
      ssl_cert: ssl_cert !== undefined ? ssl_cert : binding.ssl_cert,
      ssl_key: ssl_key !== undefined ? ssl_key : binding.ssl_key,
      status: 'pending'
    })
    
    // 重新配置域名绑定
    try {
      // 先删除旧的
      if (oldDomain && oldDomain !== binding.domain) {
        await networkService.removeDomainBinding(binding.service.node_id, oldDomain)
      }
      // 再创建新的
      await networkService.setupDomainBinding(binding.service, binding)
      await binding.update({ status: 'active' })
    } catch (configError) {
      console.error('Domain binding reconfiguration failed:', configError)
    }
    
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '更新失败' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const binding = await DomainBinding.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{ model: Service, as: 'service' }]
    })
    
    if (!binding) {
      return res.json({ code: 404, message: '绑定不存在' })
    }
    
    // 尝试删除节点上的配置
    try {
      await networkService.removeDomainBinding(binding.service.node_id, binding.domain)
    } catch (configError) {
      console.error('Domain binding removal failed:', configError)
    }
    
    await binding.destroy()
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

module.exports = router
