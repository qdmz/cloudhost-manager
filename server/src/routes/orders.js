const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { Order, User, Product, Plan, Node, Service, BalanceLog } = require('../models')
const { auth } = require('../middleware/auth')
const epayService = require('../services/epay')
const dayjs = require('dayjs')

router.post('/', auth, async (req, res) => {
  try {
    const { product_id, plan_id, node_id, cycle, quantity = 1 } = req.body
    
    const product = await Product.findByPk(product_id)
    if (!product) return res.json({ code: 404, message: '产品不存在' })
    
    const plan = await Plan.findByPk(plan_id)
    if (!plan) return res.json({ code: 404, message: '配置方案不存在' })
    
    const node = await Node.findByPk(node_id)
    if (!node) return res.json({ code: 404, message: '节点不存在' })
    
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
      node_id,
      cycle,
      quantity,
      amount: totalAmount,
      status: 'pending'
    })
    
    res.json({ code: 200, message: '订单创建成功', data: order })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '创建失败' })
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status } = req.query
    
    const where = { user_id: req.userId }
    if (status) where.status = status
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['name'] },
        { model: Plan, as: 'plan', attributes: ['name'] }
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
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

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
    console.error(error)
    res.json({ code: 500, message: '取消失败' })
  }
})

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
          status: 'completed',
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
      
      // Auto-create service if order has plan and node
      if (order.plan_id && order.node_id && order.product_id) {
        const plan = await Plan.findByPk(order.plan_id)
        const node = await Node.findByPk(order.node_id)
        
        if (plan && node) {
          let days = 30
          if (order.cycle === 'quarterly') days = 90
          if (order.cycle === 'yearly') days = 365
          
          const expireTime = dayjs().add(days, 'day').toDate()
          
          await Service.create({
            user_id: req.userId,
            node_id: order.node_id,
            product_id: order.product_id,
            plan_id: order.plan_id,
            name: 'VPS-' + order.order_no,
            type: 'kvm',
            status: 'running',
            cpu: plan.cpu,
            memory: plan.memory,
            disk: plan.disk,
            price: parseFloat(order.amount) / (order.quantity || 1),
            expire_time: expireTime
          })
        }
      }
      
      res.json({ code: 200, message: '支付成功' })
      return
    }
    
    // External payment
    const payUrl = await epayService.createPayment(order.order_no, '订单' + order.order_no, order.amount, payment_method)
    
    if (payUrl) {
      console.log('[Payment] Creating payment URL for order ' + order.order_no)
      res.json({ code: 200, message: '正在跳转支付', data: { pay_url: payUrl } })
    } else {
      res.json({ code: 200, message: '订单创建成功', data: { order_no: order.order_no } })
    }
  } catch (error) {
    console.error('[Payment] Error:', error)
    res.json({ code: 500, message: '创建失败' })
  }
})

// Query order
router.get('/:id/query', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!order) return res.json({ code: 404, message: '订单不存在' })
    
    const result = await epayService.queryOrder(order.order_no)
    res.json({ code: 200, data: result })
  } catch (error) {
    console.error('[Payment] Error:', error)
    res.json({ code: 500, message: '查询失败' })
  }
})

module.exports = router
