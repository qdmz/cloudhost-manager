const express = require('express')
const router = express.Router()
const { Service, Node, Product, Plan, User, BalanceLog, Order } = require('../models')
const { auth } = require('../middleware/auth')
const { vmService } = require('../services/vm')

// Helper: check if service is expired and auto-stop if needed
async function checkServiceExpired(service) {
  if (!service) return null
  
  // Check expiration
  if (new Date(service.expire_time) < new Date()) {
    // Auto-stop the VM if running
    if (service.status === 'running') {
      try {
        await vmService.stop(service)
        await service.update({ status: 'suspended' })
      } catch (e) {
        console.error('[Services] Auto-stop failed for service', service.id, ':', e.message)
        await service.update({ status: 'suspended' })
      }
    }
    return new Date(service.expire_time)
  }
  return null
}

// List user services
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status } = req.query
    
    const where = { user_id: req.userId }
    if (status) where.status = status
    
    const { count, rows } = await Service.findAndCountAll({
      where,
      include: [
        
        
        { model: Node, as: 'node', attributes: ['name', 'server_ip'] }
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
    
    // Check expiration
    const expiredAt = await checkServiceExpired(service)
    if (expiredAt) {
      return res.json({ code: 400, message: `服务已过期（${expiredAt.toLocaleString()}），已自动停机。请续费后使用。` })
    }
    
    const result = await vmService.start(service)
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
    
    const result = await vmService.stop(service)
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
    
    // Check expiration
    const expiredAt = await checkServiceExpired(service)
    if (expiredAt) {
      return res.json({ code: 400, message: `服务已过期（${expiredAt.toLocaleString()}），已自动停机。请续费后使用。` })
    }
    
    const result = await vmService.restart(service)
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
    
    // Check expiration
    const expiredAt = await checkServiceExpired(service)
    if (expiredAt) {
      return res.json({ code: 400, message: `服务已过期（${expiredAt.toLocaleString()}），已自动停机。请续费后使用。` })
    }
    
    const result = await vmService.resetPassword(service, req.body.password)
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
    
    // Check expiration
    const expiredAt = await checkServiceExpired(service)
    if (expiredAt) {
      return res.json({ code: 400, message: `服务已过期（${expiredAt.toLocaleString()}），已自动停机。请续费后使用。` })
    }
    
    // Support both imageId and image_id
    const imageId = req.body.imageId || req.body.image_id
    if (!imageId) {
      return res.json({ code: 400, message: '请选择要重装的系统镜像' })
    }
    
    const result = await vmService.reinstall(service, imageId)
    res.json({ code: 200, message: '系统重装中，请稍候...' })
  } catch (error) {
    console.error('[Services] Reinstall error:', error)
    res.json({ code: 500, message: '重装失败: ' + error.message })
  }
})

// Renew service
router.post('/:id/renew', auth, async (req, res) => {
  try {
    const { User, BalanceLog, Order } = require('../models')
    const service = await Service.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{ model: Product, as: 'product' }, { model: Plan, as: 'plan' }, { model: Node, as: 'node' }]
    })
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    // Check if service is expired
    if (new Date(service.expire_time) < new Date()) {
      return res.json({ code: 400, message: '服务已过期，无法续费，请联系客服' })
    }
    
    const { cycle, payment_method } = req.body
    
    // Calculate days based on cycle
    let days = 30
    if (cycle === 'quarterly') days = 90
    if (cycle === 'yearly') days = 365
    if (cycle === 'monthly') days = 30
    if (cycle === 'week') days = 7
    if (cycle === 'day') days = 1
    
    // Calculate price
    let price = 0
    if (service.plan) {
      price = parseFloat(service.plan.price_monthly)
      if (cycle === 'quarterly') price = parseFloat(service.plan.price_quarterly || service.plan.price_monthly * 3)
      if (cycle === 'yearly') price = parseFloat(service.plan.price_yearly || service.plan.price_monthly * 12)
    }
    // Fallback: if no plan price, use a default
    if (price <= 0) price = 10
    
    // Apply 5% discount for quarterly/yearly
    if (cycle === 'quarterly') price = price * 0.95
    if (cycle === 'yearly') price = price * 0.9
    
    const user = await User.findByPk(req.userId)
    
    // Balance payment - direct renewal with balance deduction
    if (payment_method === 'balance') {
      if (parseFloat(user.balance) < price) {
        return res.json({ code: 400, message: '余额不足，需要 ¥' + price.toFixed(2) })
      }
      
      const newBalance = parseFloat(user.balance) - price
      
      await user.sequelize.transaction(async (t) => {
        await user.update({ balance: newBalance }, { transaction: t })
        await service.update({
          expire_time: new Date(service.expire_time.getTime() + days * 86400000)
        }, { transaction: t })
        await BalanceLog.create({
          user_id: req.userId,
          type: 'consume',
          amount: -price,
          balance_before: parseFloat(user.balance),
          balance_after: newBalance,
          note: '服务续费: ' + service.name,
          related_id: service.id,
          related_type: 'service'
        }, { transaction: t })
      })
      
      return res.json({ code: 200, message: '续费成功，已使用余额 ¥' + price.toFixed(2) })
    }
    
    // External payment - create order
    const { v4: uuidv4 } = require('uuid')
    const epayService = require('../services/epay')
    
    const orderNo = 'ORD' + Date.now() + uuidv4().substring(0, 8).toUpperCase()
    const order = await Order.create({
      user_id: req.userId,
      order_no: orderNo,
      service_id: service.id,
      product_id: service.product_id,
      plan_id: service.plan_id,
      node_id: service.node_id,
      cycle: cycle,
      quantity: 1,
      amount: price,
      status: 'pending',
      payment_method: payment_method
    })
    
    // Create payment URL
    const payUrl = await epayService.createPayment(
      orderNo,
      '续费 ' + service.name,
      price.toString(),
      payment_method
    )
    
    if (payUrl) {
      res.json({ code: 200, message: '正在跳转支付', data: { pay_url: payUrl, order_no: orderNo, amount: price } })
    } else {
      // EPAY not configured - still deduct balance and extend
      if (parseFloat(user.balance) < price) {
        await order.update({ status: 'failed', fail_reason: '余额不足' })
        return res.json({ code: 400, message: '余额不足，需要 ¥' + price.toFixed(2) })
      }
      
      const newBalance = parseFloat(user.balance) - price
      await user.sequelize.transaction(async (t) => {
        await order.update({ status: 'paid', paid_at: new Date(), payment_method: 'manual' }, { transaction: t })
        await user.update({ balance: newBalance }, { transaction: t })
        await service.update({
          expire_time: new Date(service.expire_time.getTime() + days * 86400000)
        }, { transaction: t })
        await BalanceLog.create({
          user_id: req.userId,
          type: 'consume',
          amount: -price,
          balance_before: parseFloat(user.balance),
          balance_after: newBalance,
          note: '服务续费（EPAY未配置，手动处理）: ' + service.name,
          related_id: service.id,
          related_type: 'service'
        }, { transaction: t })
      })
      
      return res.json({ code: 200, message: '续费成功（支付配置未就绪，已手动扣费处理）' })
    }
  } catch (error) {
    console.error('[Services] Renew error:', error)
    res.json({ code: 500, message: '续费失败: ' + error.message })
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
    
    const result = await vmService.getStats(service)
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
    
    const result = await vmService.getConsole(service)
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
    
    const result = await vmService.syncNode(await Node.findByPk(service.node_id))
    res.json({ code: 200, message: '同步成功', data: result })
  } catch (error) {
    console.error('[Services] Sync error:', error)
    res.json({ code: 500, message: '同步失败: ' + error.message })
  }
})


// Get available images for reinstall (by node)
router.get("/:id/images", auth, async (req, res) => {
  try {
    const { Image } = require("../models")
    const service = await Service.findByPk(req.params.id)
    if (!service) return res.json({ code: 404, message: "服务不存在" })
    
    // Filter images by service type (KVM services need qcow2/iso, LXC needs container templates)
    let whereCondition = { node_id: service.node_id, status: "active" }
    if (service.type === 'lxc' || service.type === 'lxd' || service.type === 'incus') {
      // LXC services can only use container templates
      whereCondition.template = { [require('sequelize').Op.like]: '%vztmpl%' }
    }
    
    const images = await Image.findAll({ where: whereCondition })
    
    // Add type field based on template extension
    const imagesWithType = images.map(img => {
      const data = img.toJSON()
      const tpl = (data.template || '').toLowerCase()
      if (tpl.endsWith('.tar') || tpl.endsWith('.tar.zst') || tpl.endsWith('.tar.xz') || tpl.includes('vztmpl')) {
        data.type = 'LXC'
      } else if (tpl.endsWith('.qcow2') || tpl.includes('import')) {
        data.type = 'KVM(qcow2)'
      } else if (tpl.endsWith('.iso')) {
        data.type = 'ISO'
      } else {
        data.type = 'Unknown'
      }
      return data
    })
    
    res.json({ code: 200, data: imagesWithType })
  } catch (error) {
    console.error("[Services] Images error:", error)
    res.json({ code: 500, message: "获取失败: " + error.message })
  }
})

module.exports = router
