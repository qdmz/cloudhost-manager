const express = require('express')
const router = express.Router()
const { Service, Product, Plan, Node } = require('../models')
const { auth } = require('../middleware/auth')
const vmService = require('../services/vm')

// List user services
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status } = req.query
    
    const where = { user_id: req.userId }
    if (status) where.status = status
    
    const { count, rows } = await Service.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'type'] },
        { model: Plan, as: 'plan', attributes: ['name', 'cpu', 'memory', 'disk', 'bandwidth', 'traffic'] },
        { model: Node, as: 'node', attributes: ['name', 'ip'] }
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
    console.error('[Services] List error:', error)
    res.json({ code: 500, message: '获取服务失败: ' + error.message })
  }
})

// Get single service
router.get('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [
        { model: Product, as: 'product' },
        { model: Plan, as: 'plan' },
        { model: Node, as: 'node' }
      ]
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    res.json({ code: 200, data: service })
  } catch (error) {
    console.error('[Services] Get error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

// Start service
router.post('/:id/start', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.startService(service)
    await service.update({ status: 'running' })
    res.json({ code: 200, message: '服务已启动' })
  } catch (error) {
    console.error('[Services] Start error:', error)
    res.json({ code: 500, message: '启动失败: ' + error.message })
  }
})

// Stop service
router.post('/:id/stop', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.stopService(service)
    await service.update({ status: 'stopped' })
    res.json({ code: 200, message: '服务已停止' })
  } catch (error) {
    console.error('[Services] Stop error:', error)
    res.json({ code: 500, message: '停止失败: ' + error.message })
  }
})

// Restart service
router.post('/:id/restart', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.restartService(service)
    res.json({ code: 200, message: '服务已重启' })
  } catch (error) {
    console.error('[Services] Restart error:', error)
    res.json({ code: 500, message: '重启失败: ' + error.message })
  }
})

// Reset password
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.resetPassword(service, req.body)
    res.json({ code: 200, message: '密码重置成功', data: result })
  } catch (error) {
    console.error('[Services] Reset password error:', error)
    res.json({ code: 500, message: '重置失败: ' + error.message })
  }
})

// Reinstall system
router.post('/:id/reinstall', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.reinstall(service, req.body)
    res.json({ code: 200, message: '系统重装中，请稍候...' })
  } catch (error) {
    console.error('[Services] Reinstall error:', error)
    res.json({ code: 500, message: '重装失败: ' + error.message })
  }
})

// Renew service
router.post('/:id/renew', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const { days } = req.body
    await service.update({
      expire_time: new Date(service.expire_time.getTime() + days * 86400000)
    })
    
    res.json({ code: 200, message: '续期成功' })
  } catch (error) {
    console.error('[Services] Renew error:', error)
    res.json({ code: 500, message: '续期失败: ' + error.message })
  }
})

// Get VNC URL
router.get('/:id/vnc', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.getVNCUrl(service)
    res.json({ code: 200, data: result })
  } catch (error) {
    console.error('[Services] VNC error:', error)
    res.json({ code: 500, message: '获取VNC失败: ' + error.message })
  }
})

// Get service stats
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.getServiceStats(service)
    res.json({ code: 200, data: result })
  } catch (error) {
    console.error('[Services] Stats error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

// Get service console
router.get('/:id/console', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.getServiceConsole(service)
    res.json({ code: 200, data: result })
  } catch (error) {
    console.error('[Services] Console error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

// Sync service
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const result = await vmService.syncService(service)
    res.json({ code: 200, message: '同步成功', data: result })
  } catch (error) {
    console.error('[Services] Sync error:', error)
    res.json({ code: 500, message: '同步失败: ' + error.message })
  }
})

module.exports = router
