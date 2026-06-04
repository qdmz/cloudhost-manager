const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { Order, User, Product, Plan, Node, Service, BalanceLog } = require('../models')
const { auth } = require('../middleware/auth')

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
    
    const orderNo = `ORD${Date.now()}${uuidv4().substring(0, 8).toUpperCase()}`
    
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

module.exports = router
