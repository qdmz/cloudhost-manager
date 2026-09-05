const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { Order, User, Product, Plan, Node, Service, BalanceLog, Ticket, TicketMessage } = require('../models')
const { auth } = require('../middleware/auth')
const epayService = require('../services/epay')
const dayjs = require('dayjs')

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, plan_id, node_id, cycle, quantity = 1 } = req.body
    
    if (!product_id || !plan_id) {
      return res.json({ code: 400, message: '请提供产品和配置方案' })
    }
    
    const product = await Product.findByPk(product_id)
    if (!product) return res.json({ code: 404, message: '产品不存在' })
    
    const plan = await Plan.findByPk(plan_id)
    if (!plan) return res.json({ code: 404, message: '配置方案不存在' })
    
    // 未指定节点时，使用产品默认节点（智简魔方等单节点产品必须能直接下单）
    const effectiveNodeId = node_id || product.node_id || null
    let node
    if (effectiveNodeId) {
      node = await Node.findByPk(effectiveNodeId)
      if (!node) return res.json({ code: 404, message: '节点不存在' })
    }
    
    let price = plan.price_monthly
    if (cycle === 'quarterly') price = plan.price_quarterly || plan.price_monthly * 3
    if (cycle === 'yearly') price = plan.price_yearly || plan.price_monthly * 12
    
    const totalAmount = price * quantity
    
    const orderNo = 'ORD' + Date.now() + uuidv4().substring(0, 8).toUpperCase()
    
    const order = await Order.create({
      user_id: req.userId,
      order_no: orderNo,
      product_id,
      plan_id,
      node_id: effectiveNodeId,
      cycle,
      quantity,
      amount: totalAmount,
      status: 'pending'
    })
    
    res.json({ code: 200, message: '订单创建成功', data: order })
  } catch (error) {
    console.error('[Orders] Create error:', error)
    res.json({ code: 500, message: '创建失败: ' + error.message })
  }
})

// List orders
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status } = req.query
    
    const where = { user_id: req.userId }
    if (status) where.status = status
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name', 'type'] },
        { model: Plan, as: 'plan', attributes: ['name', 'cpu', 'memory', 'disk', 'bandwidth', 'traffic', 'price_monthly'] },
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
    console.error('[Orders] List error:', error)
    res.json({ code: 500, message: '获取订单失败: ' + error.message })
  }
})

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [
        { model: Product, as: 'product' },
        { model: Plan, as: 'plan' },
        { model: Node, as: 'node' }
      ]
    })
    
    if (!order) return res.json({ code: 404, message: '订单不存在' })
    
    res.json({ code: 200, data: order })
  } catch (error) {
    console.error('[Orders] Get error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

// Cancel order
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!order) return res.json({ code: 404, message: '订单不存在' })
    
    if (order.status !== 'pending') {
      return res.json({ code: 400, message: '只有待支付的订单可以取消' })
    }
    
    await order.update({ status: 'cancelled' })
    res.json({ code: 200, message: '订单已取消' })
  } catch (error) {
    console.error('[Orders] Cancel error:', error)
    res.json({ code: 500, message: '取消失败' })
  }
})

// Pay order
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const { payment_method = 'alipay' } = req.body
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!order) return res.json({ code: 404, message: '订单不存在' })
    
    if (order.status !== 'pending') {
      return res.json({ code: 400, message: '只有待支付的订单可以支付' })
    }
    
    // Balance payment
    if (payment_method === 'balance') {
      const user = await User.findByPk(req.userId)
      const orderAmount = parseFloat(order.amount)
      const userBalance = parseFloat(user.balance)
      
      if (userBalance < orderAmount) {
        return res.json({ code: 400, message: '余额不足' })
      }
      
      const newBalance = userBalance - orderAmount
      
      await user.sequelize.transaction(async (t) => {
        await user.update({ balance: newBalance }, { transaction: t })
        await order.update({
          status: 'paid',
          payment_method: 'balance',
          paid_at: new Date()
        }, { transaction: t })
        await BalanceLog.create({
          user_id: req.userId,
          type: 'consume',
          amount: -orderAmount,
          balance_before: userBalance,
          balance_after: newBalance,
          note: '订单支付: ' + order.order_no,
          related_id: order.id,
          related_type: 'order'
        }, { transaction: t })
      })
      
      // Auto-create service（余额支付成功后自动开通，支持 PVE/Incus 与 智简魔方 节点）
      if (order.plan_id && order.node_id && order.product_id) {
        const provisioning = require('../services/provisioning')
        const result = await provisioning.provisionOrderServices(order)
        if (result.errors && result.errors.length) {
          console.warn(`[Orders] Order ${order.order_no} 开通部分失败:`, result.errors)
        }
      }
      
      res.json({ code: 200, message: '支付成功' })
      return
    }
    
    // External payment via EPAY
    const payName = order.product_id ? '订购产品' : '订单' + order.order_no
    const payUrl = await epayService.createPayment(order.order_no, payName, order.amount, payment_method)
    
    if (payUrl) {
      res.json({ code: 200, message: '正在跳转支付', data: { pay_url: payUrl } })
    } else {
      // EPAY not configured, mark as created
      res.json({ code: 200, data: { order_no: order.order_no, message: '支付配置未就绪，请联系管理员' } })
    }
  } catch (error) {
    console.error('[Orders] Pay error:', error)
    res.json({ code: 500, message: '创建支付失败: ' + error.message })
  }
})

// Query order
router.get('/:id/query', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    if (!order) return res.json({ code: 404, message: '订单不存在' })
    
    res.json({ code: 200, data: { status: order.status, order_no: order.order_no } })
  } catch (error) {
    console.error('[Orders] Query error:', error)
    res.json({ code: 500, message: '查询失败' })
  }
})


// Use voucher
router.post('/use-voucher', auth, async (req, res) => {
  try {
    const { voucher_code } = req.body
    if (!voucher_code) {
      return res.json({ code: 400, message: '请输入兑换码' })
    }
    
    const { Voucher, User, BalanceLog } = require('../models')
    const voucher = await Voucher.findOne({ 
      where: { code: voucher_code, used: false } 
    })
    
    if (!voucher) {
      return res.json({ code: 404, message: '兑换码无效或已使用' })
    }
    
    if (voucher.expire_time && new Date(voucher.expire_time) < new Date()) {
      return res.json({ code: 400, message: '兑换码已过期' })
    }
    
    const user = await User.findByPk(req.userId)
    const amount = parseFloat(voucher.value) || 0
    const oldBalance = parseFloat(user.balance) || 0
    const newBalance = oldBalance + amount

    // 原子占用兑换码，避免并发重复使用
    const [affected] = await Voucher.update(
      { used: true, used_by: req.userId, used_at: new Date() },
      { where: { id: voucher.id, used: false } }
    )
    if (!affected) {
      return res.json({ code: 400, message: '兑换码已被使用' })
    }
    
    await user.update({ balance: newBalance })
    
    await BalanceLog.create({
      user_id: req.userId,
      type: 'recharge',
      amount,
      balance_before: oldBalance,
      balance_after: newBalance,
      note: '兑换码充值: ' + voucher_code,
      related_id: voucher.id,
      related_type: 'voucher'
    })
    
    res.json({ code: 200, message: '兑换成功，账户余额已增加' })
  } catch (error) {
    console.error('[Orders] Use voucher error:', error)
    res.json({ code: 500, message: '兑换失败: ' + error.message })
  }
})

module.exports = router
