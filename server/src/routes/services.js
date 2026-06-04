const express = require('express')
const router = express.Router()
const { Service, Node, Image, User, BalanceLog } = require('../models')
const { auth } = require('../middleware/auth')
const { vmService } = require('../services/vm')

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status } = req.query
    
    const where = { user_id: req.userId }
    if (status) where.status = status
    
    const services = await Service.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size)
    })
    
    const count = await Service.count({ where })
    
    res.json({
      code: 200,
      data: { list: services, total: count, page: parseInt(page), page_size: parseInt(page_size) }
    })
  } catch (error) {
    console.error('Services list error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const images = await Image.findAll({ where: { node_id: service.node_id } })
    
    res.json({ code: 200, data: { ...service.toJSON(), images } })
  } catch (error) {
    console.error('Service detail error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/:id/start', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    await service.update({ status: 'running' })
    
    res.json({ code: 200, message: '开机成功' })
  } catch (error) {
    console.error('Start service error:', error.message)
    res.json({ code: 500, message: error.message || '开机失败' })
  }
})

router.post('/:id/stop', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    await service.update({ status: 'stopped' })
    
    res.json({ code: 200, message: '关机成功' })
  } catch (error) {
    console.error('Stop service error:', error.message)
    res.json({ code: 500, message: error.message || '关机失败' })
  }
})

router.post('/:id/restart', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    res.json({ code: 200, message: '重启成功' })
  } catch (error) {
    console.error('Restart service error:', error.message)
    res.json({ code: 500, message: error.message || '重启失败' })
  }
})

router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    const { password } = req.body
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const hashedPassword = require('bcryptjs').hashSync(password, 10)
    await service.update({ password: hashedPassword })
    
    res.json({ code: 200, message: '密码重置成功' })
  } catch (error) {
    console.error('Reset password error:', error.message)
    res.json({ code: 500, message: error.message || '重置失败' })
  }
})

router.post('/:id/reinstall', auth, async (req, res) => {
  try {
    const { image_id } = req.body
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    res.json({ code: 200, message: '系统重装请求已提交' })
  } catch (error) {
    console.error('Reinstall service error:', error.message)
    res.json({ code: 500, message: error.message || '重装失败' })
  }
})

router.post('/:id/renew', auth, async (req, res) => {
  try {
    const { cycle } = req.body
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const user = await User.findByPk(req.userId)
    
    let days = 30
    if (cycle === 'quarterly') days = 90
    if (cycle === 'yearly') days = 365
    
    const price = service.price * (days / 30)
    
    if (user.balance < price) {
      return res.json({ code: 400, message: '余额不足' })
    }
    
    await user.update({ balance: user.balance - price })
    
    await BalanceLog.create({
      user_id: req.userId,
      type: 'consume',
      amount: -price,
      balance_before: user.balance,
      balance_after: user.balance - price,
      note: `续费服务 ${service.name}`,
      related_id: service.id,
      related_type: 'service'
    })
    
    const newExpireTime = new Date(service.expire_time)
    newExpireTime.setDate(newExpireTime.getDate() + days)
    await service.update({ expire_time: newExpireTime })
    
    res.json({ code: 200, message: '续费成功' })
  } catch (error) {
    console.error('Renew service error:', error.message)
    res.json({ code: 500, message: error.message || '续费失败' })
  }
})

router.get('/:id/stats', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    res.json({ code: 200, data: { cpu: 0, memory: 0, disk: 0, network_usage: 'N/A' } })
  } catch (error) {
    console.error('Get stats error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/:id/vnc', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    res.json({ code: 200, data: { vnc_url: '', token: '' } })
  } catch (error) {
    console.error('Get VNC error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/:id/console', auth, async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    res.json({ code: 200, data: { vnc_url: '', token: '' } })
  } catch (error) {
    console.error('Get console error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

module.exports = router