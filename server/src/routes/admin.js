const express = require('express')
const router = express.Router()
const { User, Service, Product, Plan, Order, Node, Ticket, TicketMessage, Announcement, Recharge, Voucher, BalanceLog, AuthRequest, Image, Config } = require('../models')
const { auth, admin } = require('../middleware/auth')
const { Op } = require('sequelize')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')

router.get('/dashboard/stats', auth, admin, async (req, res) => {
  try {
    const [userCount, orderCount, serviceCount, ticketCount] = await Promise.all([
      User.count(),
      Order.count({ where: { status: 'completed' } }),
      Service.count(),
      Ticket.count({ where: { status: { [Op.ne]: 'closed' } } })
    ])
    
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['username'] }]
    })
    
    const pendingTickets = await Ticket.findAll({
      limit: 5,
      where: { status: { [Op.ne]: 'closed' } },
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['username'] }]
    })
    
    const nodes = await Node.findAll({ limit: 5 })
    
    res.json({
      code: 200,
      data: {
        stats: [
          { key: 'users', label: '用户数', value: userCount, icon: 'UserOutlined', color: '#1890ff' },
          { key: 'orders', label: '订单数', value: orderCount, icon: 'ShoppingOutlined', color: '#52c41a' },
          { key: 'services', label: '服务数', value: serviceCount, icon: 'CloudServerOutlined', color: '#faad14' },
          { key: 'tickets', label: '待处理工单', value: ticketCount, icon: 'MessageOutlined', color: '#f5222d' }
        ],
        recent_orders: recentOrders,
        pending_tickets: pendingTickets,
        nodes
      }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/users', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20, keyword } = req.query
    
    const where = {}
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } }
      ]
    }
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
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

router.put('/users/:id', auth, admin, async (req, res) => {
  try {
    const { email, phone, qq, status } = req.body
    await User.update({ email, phone, qq, status }, { where: { id: req.params.id } })
    res.json({ code: 200, message: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.delete('/users/:id', auth, admin, async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.post('/users/:id/reset-balance', auth, admin, async (req, res) => {
  try {
    const { type, amount, note } = req.body
    const user = await User.findByPk(req.params.id)
    
    const oldBalance = user.balance
    let newBalance = oldBalance
    
    if (type === 'add') newBalance = oldBalance + amount
    else if (type === 'reduce') newBalance = oldBalance - amount
    else if (type === 'set') newBalance = amount
    
    await user.update({ balance: newBalance })
    
    await BalanceLog.create({
      user_id: user.id,
      type: 'adjust',
      amount: newBalance - oldBalance,
      balance_before: oldBalance,
      balance_after: newBalance,
      note: note || '管理员调整'
    })
    
    res.json({ code: 200, message: '余额调整成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '调整失败' })
  }
})

router.post('/users/:id/impersonate', auth, admin, async (req, res) => {
  try {
    const jwt = require('jsonwebtoken')
    const user = await User.findByPk(req.params.id)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })
    res.json({ code: 200, data: { token } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '操作失败' })
  }
})

router.get('/orders', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status, keyword } = req.query
    
    const where = {}
    if (status) where.status = status
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }],
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

router.post('/orders/:id/process', auth, admin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Plan, as: 'plan' }]
    })
    
    if (!order) return res.json({ code: 404, message: '订单不存在' })
    
    await order.update({ status: 'completed', paid_at: new Date() })
    
    let days = 30
    if (order.cycle === 'quarterly') days = 90
    if (order.cycle === 'yearly') days = 365
    
    const expireTime = dayjs().add(days, 'day').toDate()
    
    await Service.create({
      user_id: order.user_id,
      node_id: order.node_id,
      product_id: order.product_id,
      plan_id: order.plan_id,
      name: `VPS-${Date.now()}`,
      type: 'kvm',
      status: 'running',
      cpu: 1,
      memory: 1024,
      disk: 20,
      price: order.amount / order.quantity,
      expire_time: expireTime
    })
    
    res.json({ code: 200, message: '订单处理成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '处理失败' })
  }
})

router.get('/products', auth, admin, async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['sort', 'ASC']] })
    res.json({ code: 200, data: { list: products } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/products', auth, admin, async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.json({ code: 200, message: '添加成功', data: product })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '添加失败' })
  }
})

router.put('/products/:id', auth, admin, async (req, res) => {
  try {
    await Product.update(req.body, { where: { id: req.params.id } })
    res.json({ code: 200, message: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.delete('/products/:id', auth, admin, async (req, res) => {
  try {
    await Product.destroy({ where: { id: req.params.id } })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.get('/products/:id/plans', auth, admin, async (req, res) => {
  try {
    const plans = await Plan.findAll({ where: { product_id: req.params.id } })
    res.json({ code: 200, data: plans })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/products/:id/plans', auth, admin, async (req, res) => {
  try {
    const plan = await Plan.create({ ...req.body, product_id: req.params.id })
    res.json({ code: 200, message: '添加成功', data: plan })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '添加失败' })
  }
})

router.put('/plans/:id', auth, admin, async (req, res) => {
  try {
    await Plan.update(req.body, { where: { id: req.params.id } })
    res.json({ code: 200, message: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.delete('/plans/:id', auth, admin, async (req, res) => {
  try {
    await Plan.destroy({ where: { id: req.params.id } })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.get('/nodes', auth, admin, async (req, res) => {
  try {
    const nodes = await Node.findAll()
    res.json({ code: 200, data: { list: nodes } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/nodes', auth, admin, async (req, res) => {
  try {
    const node = await Node.create(req.body)
    res.json({ code: 200, message: '添加成功', data: node })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '添加失败' })
  }
})

router.put('/nodes/:id', auth, admin, async (req, res) => {
  try {
    await Node.update(req.body, { where: { id: req.params.id } })
    res.json({ code: 200, message: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.delete('/nodes/:id', auth, admin, async (req, res) => {
  try {
    await Node.destroy({ where: { id: req.params.id } })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.post('/nodes/:id/sync', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
    const node = await Node.findByPk(req.params.id)
    await vmService.syncNode(node)
    res.json({ code: 200, message: '同步成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '同步失败' })
  }
})

router.post('/nodes/:id/sync-images', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
    const node = await Node.findByPk(req.params.id)
    if (!node) return res.json({ code: 404, message: '节点不存在' })
    
    const images = await vmService.syncImagesFromNode(node)
    res.json({ code: 200, message: `成功同步 ${images.length} 个镜像`, data: images })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '同步失败' })
  }
})

router.get('/images', auth, admin, async (req, res) => {
  try {
    const { node_id } = req.query
    const where = {}
    if (node_id) where.node_id = node_id
    const images = await Image.findAll({ where })
    res.json({ code: 200, data: { list: images } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/images', auth, admin, async (req, res) => {
  try {
    const image = await Image.create(req.body)
    res.json({ code: 200, message: '添加成功', data: image })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '添加失败' })
  }
})

router.put('/images/:id', auth, admin, async (req, res) => {
  try {
    await Image.update(req.body, { where: { id: req.params.id } })
    res.json({ code: 200, message: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.delete('/images/:id', auth, admin, async (req, res) => {
  try {
    await Image.destroy({ where: { id: req.params.id } })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.get('/tickets', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status } = req.query
    const where = {}
    if (status) where.status = status
    
    const { count, rows } = await Ticket.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }],
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

router.get('/tickets/:id', auth, admin, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      where: { id: req.params.id },
      include: [
        { model: User, as: 'user', attributes: ['username', 'email'] },
        {
          model: TicketMessage,
          include: [{ model: User, as: 'user', attributes: ['username'] }]
        }
      ]
    })
    
    if (!ticket) return res.json({ code: 404, message: '工单不存在' })
    
    res.json({ code: 200, data: ticket })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/tickets/:id/reply', auth, admin, async (req, res) => {
  try {
    const { content, status = 'answered' } = req.body
    const ticket = await Ticket.findByPk(req.params.id)
    
    await TicketMessage.create({
      ticket_id: ticket.id,
      user_id: req.userId,
      content,
      is_admin: true
    })
    
    await ticket.update({ status })
    
    res.json({ code: 200, message: '回复成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '回复失败' })
  }
})

router.post('/tickets/:id/close', auth, admin, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id)
    
    if (!ticket) return res.json({ code: 404, message: '工单不存在' })
    
    await ticket.update({ status: 'closed' })
    
    res.json({ code: 200, message: '工单已关闭' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '操作失败' })
  }
})

router.get('/announcements', auth, admin, async (req, res) => {
  try {
    const announcements = await Announcement.findAll({ order: [['created_at', 'DESC']] })
    res.json({ code: 200, data: { list: announcements } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/announcements', auth, admin, async (req, res) => {
  try {
    const announcement = await Announcement.create(req.body)
    res.json({ code: 200, message: '添加成功', data: announcement })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '添加失败' })
  }
})

router.put('/announcements/:id', auth, admin, async (req, res) => {
  try {
    await Announcement.update(req.body, { where: { id: req.params.id } })
    res.json({ code: 200, message: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.delete('/announcements/:id', auth, admin, async (req, res) => {
  try {
    await Announcement.destroy({ where: { id: req.params.id } })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.get('/vouchers', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20 } = req.query
    const { count, rows } = await Voucher.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size)
    })
    res.json({ code: 200, data: { list: rows, total: count } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/vouchers', auth, admin, async (req, res) => {
  try {
    const { value, quantity = 1, expire_days = 30 } = req.body
    
    const expireTime = new Date()
    expireTime.setDate(expireTime.getDate() + expire_days)
    
    const vouchers = []
    for (let i = 0; i < quantity; i++) {
      const code = `V${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`
      vouchers.push({ code, value, expire_time: expireTime })
    }
    
    await Voucher.bulkCreate(vouchers)
    res.json({ code: 200, message: `成功生成 ${quantity} 张代金券` })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '生成失败' })
  }
})

router.delete('/vouchers/:id', auth, admin, async (req, res) => {
  try {
    await Voucher.destroy({ where: { id: req.params.id } })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.get('/services', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20 } = req.query
    const { count, rows } = await Service.findAndCountAll({
      include: [
        { model: User, as: 'user', attributes: ['username', 'email'] },
        { model: Node, as: 'node', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size)
    })
    res.json({ code: 200, data: { list: rows, total: count } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/services/:id', auth, admin, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['username', 'email'] },
        { model: Node, as: 'node' }
      ]
    })
    res.json({ code: 200, data: service })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.put('/services/:id', auth, admin, async (req, res) => {
  try {
    await Service.update(req.body, { where: { id: req.params.id } })
    res.json({ code: 200, message: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.delete('/services/:id', auth, admin, async (req, res) => {
  try {
    await Service.destroy({ where: { id: req.params.id } })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.post('/services/custom-create', auth, admin, async (req, res) => {
  try {
    const service = await Service.create({
      ...req.body,
      status: 'running'
    })
    res.json({ code: 200, message: '开通成功', data: service })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '开通失败' })
  }
})

router.get('/configs', auth, admin, async (req, res) => {
  try {
    const configs = await Config.findAll()
    const result = {}
    configs.forEach(c => {
      try {
        result[c.key] = c.type === 'json' ? JSON.parse(c.value) : c.value
      } catch {
        result[c.key] = c.value
      }
    })
    res.json({ code: 200, data: result })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.put('/configs', auth, admin, async (req, res) => {
  try {
    const configs = req.body
    for (const [key, value] of Object.entries(configs)) {
      const existing = await Config.findOne({ where: { key } })
      const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
      
      if (existing) {
        await existing.update({ value: strValue })
      } else {
        await Config.create({ key, value: strValue })
      }
    }
    // 清除配置缓存
    const { clearCache } = require('../services/config')
    clearCache()
    
    // 如果修改了SMTP配置，重新初始化邮件服务
    const smtpKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_from']
    const hasSmtpChange = Object.keys(configs).some(k => smtpKeys.includes(k))
    if (hasSmtpChange) {
      const { initTransporter } = require('../services/email')
      await initTransporter()
    }
    res.json({ code: 200, message: '保存成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '保存失败' })
  }
})

module.exports = router
