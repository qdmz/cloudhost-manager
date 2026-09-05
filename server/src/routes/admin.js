const express = require('express')
const router = express.Router()
const { User, Service, Product, Plan, Order, Node, Ticket, TicketMessage, Announcement, Recharge, Voucher, BalanceLog, AuthRequest, Image, Config, DomainBinding, PortForward } = require('../models')
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
    const { email, phone, qq, status, password } = req.body
    const updateData = { email, phone, qq, status }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    await User.update(updateData, { where: { id: req.params.id } })
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
    const amt = parseFloat(amount) || 0
    const user = await User.findByPk(req.params.id)
    
    const oldBalance = user.balance
    let newBalance = oldBalance
    
    if (type === 'add') newBalance = oldBalance + amt
    else if (type === 'reduce') newBalance = oldBalance - amt
    else if (type === 'set') newBalance = amount
    
    await user.update({ balance: newBalance })
    
    await BalanceLog.create({
      user_id: user.id,
      type: 'adjust',
      amount: parseFloat(newBalance - oldBalance) || 0,
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
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      return res.json({ code: 404, message: '用户不存在' })
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'cloudhost-secret-key',
      { expiresIn: '1h' }
    )
    res.json({
      code: 200,
      message: '代登录Token已生成，请在浏览器控制台使用',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('[Admin] Impersonate error:', error)
    res.json({ code: 500, message: '操作失败: ' + error.message })
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

// 手动处理订单（补开）：先按已支付处理，再走统一自动开通逻辑（PVE/Incus/智简魔方 均支持）
router.post('/orders/:id/process', auth, admin, async (req, res) => {
  try {
    const provisioning = require('../services/provisioning')
    
    const order = await Order.findByPk(req.params.id)
    if (!order) return res.json({ code: 404, message: '订单不存在' })
    
    // 验证节点是否存在
    const node = await Node.findByPk(order.node_id)
    if (!node) {
      return res.json({ code: 404, message: '订单中指定的节点不存在' })
    }
    
    // 若订单尚未支付，则标记为已支付后开通
    if (order.status === 'pending') {
      await order.update({
        status: 'paid',
        paid_at: new Date(),
        payment_method: order.payment_method || 'balance'
      })
    }
    
    const result = await provisioning.provisionOrderServices(order)
    const errorsText = result.errors.length ? `（失败 ${result.errors.length} 条: ${result.errors[0]}）` : ''
    res.json({
      code: 200,
      message: `订单处理成功，共开通 ${result.services.length} 台${errorsText}`,
      data: {
        count: result.services.length,
        errors: result.errors,
        first: result.services[0] ? { vmid: result.services[0].vmid, node: node.name } : null
      }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '处理失败: ' + error.message })
  }
})


// Cancel order (admin)
router.post('/orders/:id/cancel', auth, admin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id)
    if (!order) return res.json({ code: 404, message: '订单不存在' })
    
    if (!['pending'].includes(order.status)) {
      return res.json({ code: 400, message: '只有待支付状态的订单可以取消' })
    }
    
    order.status = 'cancelled'
    await order.save()
    
    res.json({ code: 200, message: '订单已取消' })
  } catch (error) {
    console.error('[Admin] Cancel order error:', error)
    res.json({ code: 500, message: '取消订单失败: ' + error.message })
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
    const data = { ...req.body }
    // 智简魔方等上游节点的 provider_config 仅接受合法 JSON 字符串
    if (data.provider_config && typeof data.provider_config === 'string') {
      try { data.provider_config = JSON.stringify(JSON.parse(data.provider_config)) }
      catch (e) { data.provider_config = null }
    }
    const node = await Node.create(data)
    res.json({ code: 200, message: '添加成功', data: node })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '添加失败: ' + error.message })
  }
})

router.put('/nodes/:id', auth, admin, async (req, res) => {
  try {
    const updateData = { ...req.body }
    
    // 不允许直接修改密码为空
    if (updateData.ssh_password === '' || updateData.ssh_password === undefined) {
      delete updateData.ssh_password
    }
    
    // 不允许直接修改api_token为空
    if (updateData.api_token === '' || updateData.api_token === undefined) {
      delete updateData.api_token
    }
    
    // 不允许直接修改ssh_key为空
    if (updateData.ssh_key === '' || updateData.ssh_key === undefined) {
      delete updateData.ssh_key
    }
    
    // 智简魔方等上游节点的 provider_config 仅接受合法 JSON 字符串
    if (updateData.provider_config && typeof updateData.provider_config === 'string') {
      try { updateData.provider_config = JSON.stringify(JSON.parse(updateData.provider_config)) }
      catch (e) { updateData.provider_config = null }
    }
    
    await Node.update(updateData, { where: { id: req.params.id } })
    res.json({ code: 200, message: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.post('/nodes/:id/test-ssh', auth, admin, async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id)
    if (!node) {
      return res.json({ code: 404, message: '节点不存在' })
    }
    
    const sshService = require('../services/ssh')
    const result = await sshService.testConnection(node.id)
    
    res.json({
      code: result.success ? 200 : 400,
      message: result.message,
      data: result
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: `SSH 测试失败: ${error.message}` })
  }
})

router.delete('/nodes/:id', auth, admin, async (req, res) => {
  try {
    // 关闭 SSH 连接
    const sshService = require('../services/ssh')
    await sshService.closeConnection(req.params.id)
    
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
const { createAutoPortForwards } = require('../services/portForward')
    const node = await Node.findByPk(req.params.id)
    await vmService.syncNode(node)
    res.json({ code: 200, message: '同步成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '同步失败' })
  }
})


// 节点连通性测试（PVE/Incus 直接调用节点 API；智简魔方调用上游开放 API）
router.post("/nodes/:id/test-pve", auth, admin, async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) return res.json({ code: 404, message: "节点不存在" });
    
    if (node.type === 'zjmf') {
      const zjmf = require('../services/zjmf');
      try {
        const result = await zjmf.getClient(node).testConnection();
        return res.json({ success: true, message: "智简魔方 API 连接成功", data: result.data });
      } catch (err) {
        return res.json({ success: false, message: "智简魔方 API 连接失败: " + err.message });
      }
    }
    
    const { vmService, PVEClient } = require("../services/vm");
    const client = new PVEClient(node);
    
    try {
      const status = await client.getNodeStatus();
      res.json({ success: true, message: "PVE API 连接成功", data: status });
    } catch (err) {
      res.json({ success: false, message: "PVE API 连接失败: " + err.message });
    }
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "测试 PVE 连接失败" });
  }
});

// 智简魔方：拉取上游可售产品列表（用于本地产品映射）
router.post('/nodes/:id/zjmf-products', auth, admin, async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id)
    if (!node) return res.json({ code: 404, message: '节点不存在' })
    if (node.type !== 'zjmf') return res.json({ code: 400, message: '该节点不是智简魔方节点' })
    const zjmf = require('../services/zjmf')
    const list = await zjmf.getClient(node).listProducts()
    res.json({ code: 200, message: `获取到 ${list.length} 个上游产品`, data: list })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '获取失败' })
  }
})

// 智简魔方：获取上游商品配置（可开通镜像/周期），可一键导入本地镜像
router.post('/nodes/:id/zjmf-product-config', auth, admin, async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id)
    if (!node) return res.json({ code: 404, message: '节点不存在' })
    if (node.type !== 'zjmf') return res.json({ code: 400, message: '该节点不是智简魔方节点' })

    const { upstream_product_id: upId, import_images } = req.body
    if (!upId) return res.json({ code: 400, message: '请填写上游产品ID' })

    const zjmf = require('../services/zjmf')
    const { vmService } = require('../services/vm')
    const cfg = await zjmf.getClient(node).getProductConfig(upId)

    let imported = []
    if (import_images) {
      const Product = require('../models').Product
      const product = await Product.findOne({ where: { node_id: node.id, upstream_product_id: String(upId) } })
      if (product) {
        // 已映射产品：调用镜像同步（会同时更新 upstream_data 缓存）
        imported = await vmService.syncZJMFImages(node)
      } else {
        // 未映射产品：直接把上游商品中的可开通系统写为本地镜像（key=上游模板ID）
        const { Image } = require('../models')
        let imgList = Array.isArray(cfg) ? cfg : (cfg.os_list || cfg.os || cfg.images || cfg.templates)
        if (!Array.isArray(imgList) && typeof imgList === 'object') {
          // 兼容 { list: [...] } 或 { os: [...] }
          imgList = imgList.list || imgList.data || imgList.items || []
        }
        if (Array.isArray(imgList)) {
          for (const img of imgList) {
            const template = String(img.id ?? img.template ?? img.value ?? '')
            const label = img.name || img.label || img.os_name || ''
            if (!template) continue
            const exist = await Image.findOne({ where: { node_id: node.id, template } })
            if (exist) await exist.update({ name: label || exist.name, status: 'active' })
            else await Image.create({ node_id: node.id, name: label || template, os: label || template, version: '', arch: 'amd64', type: 'vm', template, status: 'active' })
            imported.push({ template, name: label })
          }
        }
      }
    }
    res.json({ code: 200, data: { config: cfg, imported } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '获取失败' })
  }
})

router.post('/nodes/:id/sync-images', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
    const node = await Node.findByPk(req.params.id)
    if (!node) return res.json({ code: 404, message: '节点不存在' })
    
    const images = await vmService.syncImagesFromNode(node)
    res.json({ code: 200, message: `成功同步 ${images.length} 个镜像/系统`, data: images })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '同步失败' })
  }
})

router.get('/images', auth, admin, async (req, res) => {
  try {
    const { node_id, type } = req.query
    const where = {}
    if (node_id) where.node_id = node_id
    
    // Filter by type: lxc only shows container templates
    if (type === 'lxc') {
      where.template = { [require('sequelize').Op.like]: '%vztmpl%' }
    }
    
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

router.get('/tickets/:id', auth, admin, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      where: { id: req.params.id },
      include: [
        { model: User, as: 'user', attributes: ['username', 'email'] },
        {
          model: TicketMessage,
          include: [{ model: User, as: 'user', attributes: ['username'] }],
          order: [['created_at', 'ASC']]
        }
      ]
    })
    if (!ticket) return res.json({ code: 404, message: '工单不存在' })
    const ticketData = ticket.toJSON()
    res.json({ code: 200, data: ticketData })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
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

router.post('/services/:id/transfer', auth, admin, async (req, res) => {
  try {
    const { target_user_id } = req.body
    const service = await Service.findByPk(req.params.id)
    
    if (!service) {
      return res.json({ code: 404, message: '服务不存在' })
    }
    
    const targetUser = await User.findByPk(target_user_id)
    if (!targetUser) {
      return res.json({ code: 404, message: '目标用户不存在' })
    }
    
    await service.update({ user_id: target_user_id })
    res.json({ code: 200, message: '转移成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '转移失败' })
  }
})

// 管理后台服务操作
router.post('/services/:id/start', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
const { createAutoPortForwards } = require('../services/portForward')
    const service = await Service.findByPk(req.params.id)
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    if (!service.vmid) return res.json({ code: 400, message: '服务没有关联真实虚拟机' })
    
    await vmService.startVM(service)
    res.json({ code: 200, message: '开机成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '开机失败' })
  }
})

router.post('/services/:id/stop', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
const { createAutoPortForwards } = require('../services/portForward')
    const service = await Service.findByPk(req.params.id)
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    if (!service.vmid) return res.json({ code: 400, message: '服务没有关联真实虚拟机' })
    
    await vmService.stopVM(service)
    res.json({ code: 200, message: '关机成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '关机失败' })
  }
})

router.post('/services/:id/restart', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
const { createAutoPortForwards } = require('../services/portForward')
    const service = await Service.findByPk(req.params.id)
    
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    if (!service.vmid) return res.json({ code: 400, message: '服务没有关联真实虚拟机' })
    
    await vmService.restartVM(service)
    res.json({ code: 200, message: '重启成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '重启失败' })
  }
})

// 重试开通：针对开通失败/开通中的服务重新执行自动开通（智简魔方节点建议先同步远端主机）
router.post('/services/:id/retry-provision', auth, admin, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id)
    if (!service) return res.json({ code: 404, message: '服务不存在' })

    const provisioning = require('../services/provisioning')
    const svc = await provisioning.retryProvisionService(service)
    res.json({ code: 200, message: '重试开通成功', data: { vmid: svc.vmid, status: svc.status } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: error.message || '重试开通失败' })
  }
})

router.delete('/services/:id', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
const { createAutoPortForwards } = require('../services/portForward')
    
    const service = await Service.findByPk(req.params.id)
    
    if (!service) {
      return res.json({ code: 404, message: '服务不存在' })
    }
    
    // 如果有关联的真实VMID，先在PVE上删除虚拟机
    if (service.vmid) {
      try {
        await vmService.deleteVM(service)
        console.log(`[Admin] Deleted VM ${service.vmid} from PVE for service ${service.id}`)
      } catch (vmError) {
        console.error('[Admin] Failed to delete VM from PVE:', vmError)
        // 即使PVE删除失败，也继续删除数据库记录
      }
    }
    
    // 删除数据库记录
    await service.destroy()
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

router.post('/services/custom-create', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
const { createAutoPortForwards } = require('../services/portForward')
    
    const {
      user_id, node_id, name, type, cpu, memory, disk,
      ipv4, ipv6, os, template, iso, clone_from_vmid, os_type,
      price, amount
    } = req.body
    
    // 验证节点是否存在
    const node = await Node.findByPk(node_id)
    if (!node) {
      return res.json({ code: 404, message: '节点不存在' })
    }
    
    // 验证用户是否存在
    const user = await User.findByPk(user_id)
    if (!user) {
      return res.json({ code: 404, message: '用户不存在' })
    }
    
    // 智简魔方节点不支持“自定义开虚拟机”，请走“产品 + 订单支付”或“节点同步主机”
    if (node.type === 'zjmf') {
      return res.json({ code: 400, message: '智简魔方节点不支持自定义开虚拟机，请先创建绑定该节点的“产品/套餐”，让用户下单后自动开通' })
    }
    
    // 在PVE上创建虚拟机
    const createOptions = {
      name: name,
      type: type || 'kvm',
      cpu: cpu || 1,
      memory: memory || 1024,
      disk: disk || 20,
      template: template,
      iso: iso,
      clone_from_vmid: clone_from_vmid,
      os_type: os_type
    }
    
    let pveResult
    try {
      pveResult = await vmService.createVM(node_id, createOptions)
    } catch (pveError) {
      console.error('PVE创建失败:', pveError)
      return res.json({ code: 500, message: `PVE节点创建失败: ${pveError.message}` })
    }
    
    // 在数据库中创建服务记录
    // Auto-assign IPv4 and IPv6 from node network config if not specified
    let assignedIpv4 = ipv4 || '';
    let assignedIpv6 = ipv6 || '';
    
    if (!assignedIpv4 && node.nat_subnet) {
      const provisioning = require('../services/provisioning')
      assignedIpv4 = await provisioning.allocateIPv4(node.id, node.nat_subnet)
      if (!assignedIpv4) console.error('No available IPv4 in subnet', node.nat_subnet)
    }
    
    if (!assignedIpv6 && node.ipv6_subnet) {
      const provisioning = require('../services/provisioning')
      assignedIpv6 = await provisioning.allocateIPv6(node.id, node.ipv6_subnet)
      if (!assignedIpv6) console.error('No available IPv6 in subnet', node.ipv6_subnet)
    }
    
    const service = await Service.create({
      user_id: user_id,
      node_id: node_id,
      name: name || pveResult.message,
      type: type || 'kvm',
      status: 'running',
      cpu: cpu || 1,
      memory: memory || 1024,
      disk: disk || 20,
      vmid: String(pveResult.vmid),
      ipv4: assignedIpv4 || '',
      ipv6: assignedIpv6 || '',
      os: os || 'Unknown',
      price: price != null ? parseFloat(price) : (amount != null ? parseFloat(amount) : 0.00),
      expire_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    })
    
    // Auto-assign port forwards
    let pfResult = null
    try {
      pfResult = await createAutoPortForwards(service, node_id)
      console.log('Auto-assigned ports for service', service.id, JSON.stringify(pfResult))
    } catch (pfError) {
      console.error('Port forward assignment failed:', pfError.message)
    }
    
    res.json({
      code: 200,
      message: `虚拟机创建成功 (${pveResult.message})`,
      data: {
        service: service,
        port_forwards: pfResult || null,
        pve_result: {
          vmid: pveResult.vmid,
          type: pveResult.type,
          node: pveResult.node
        }
      }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '开通失败: ' + error.message })
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
      await emailService.initTransporter()
    }
    res.json({ code: 200, message: '保存成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '保存失败' })
  }
})

// 更新单个配置项
router.put("/configs/update-single", auth, admin, async (req, res) => {
  try {
    const { key, value, type } = req.body
    if (!key) {
      return res.json({ code: 400, message: "缺少配置键" })
    }
    let strValue
    if (typeof value === "boolean") {
      strValue = value ? "true" : "false"
    } else if (value === null || value === undefined) {
      strValue = ""
    } else {
      strValue = String(value)
    }
    const configType = type || "string"
    const existing = await Config.findOne({ where: { key } })
    if (existing) {
      await existing.update({ value: strValue, type: configType })
    } else {
      await Config.create({ key, value: strValue, type: configType })
    }
    const { clearCache } = require("../services/config")
    clearCache()
    const smtpKeys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_secure", "smtp_from"]
    const hasSmtpChange = smtpKeys.includes(key)
    if (hasSmtpChange) {
      const emailService = require("../services/email")
      // Reload SMTP config from DB
      const configs = await Config.findAll({ where: { key: { [require('sequelize').Op.in]: smtpKeys } } })
      const cfg = {}
      for (const c of configs) {
        if (c.key === 'smtp_port') cfg.port = parseInt(c.value) || 465
        else if (c.key === 'smtp_secure') cfg.secure = c.value === 'true'
        else if (c.key === 'smtp_user') cfg.user = c.value
        else if (c.key === 'smtp_pass') cfg.pass = c.value
        else if (c.key === 'smtp_host') cfg.host = c.value
        else if (c.key === 'smtp_from') cfg.from = c.value
      }
      if (cfg.host) {
        await emailService.initTransporter(cfg)
      }
    }
    res.json({ code: 200, message: "保存成功" })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: "保存失败" })
  }
})

// 测试邮件发送
router.post("/configs/test-template-email", auth, admin, async (req, res) => {
  try {
    const { to, template, template_name, variables } = req.body
    if (!to) {
      return res.json({ code: 400, message: "请提供收件人邮箱" })
    }
    const tplName = template_name || template
    if (!tplName) {
      return res.json({ code: 400, message: "请提供模板名称" })
    }
    const emailService = require("../services/email")
    // Load SMTP config from DB
    const configs = await Config.findAll({ where: { key: { [require('sequelize').Op.in]: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure'] } } })
    const cfg = {}
    for (const c of configs) {
      if (c.key === 'smtp_port') cfg.port = parseInt(c.value) || 465
      else if (c.key === 'smtp_secure') cfg.secure = c.value === 'true'
      else if (c.key === 'smtp_user') cfg.user = c.value
      else if (c.key === 'smtp_pass') cfg.pass = c.value
      else if (c.key === 'smtp_host') cfg.host = c.value
    }
    if (cfg.host) {
      await emailService.initTransporter(cfg)
    }
    
    if (!emailService.templates[tplName]) {
      return res.json({ code: 400, message: "模板不存在: " + tplName })
    }
    
    const result = await emailService.sendTemplate(to, tplName, { site_name: "CloudHost", ...(variables || {}) })
    res.json({ code: 200, message: "模板邮件发送成功" })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: "发送失败: " + error.message })
  }
})

router.post("/configs/test-smtp", auth, admin, async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure } = req.body
    const emailService = require("../services/email")
    await emailService.initTransporter({
      host: smtp_host || process.env.SMTP_HOST,
      port: smtp_port ? parseInt(smtp_port) : parseInt(process.env.SMTP_PORT) || 465,
      user: smtp_user || process.env.SMTP_USER,
      pass: smtp_pass || process.env.SMTP_PASS,
      secure: smtp_secure !== undefined ? smtp_secure === true : process.env.SMTP_SECURE === 'true'
    })
    res.json({ code: 200, message: "SMTP 连接测试成功" })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: "SMTP 连接失败: " + error.message })
  }
})

router.post("/configs/test-email", auth, admin, async (req, res) => {
  try {
    const { to } = req.body
    if (!to) {
      return res.json({ code: 400, message: "请提供收件人邮箱" })
    }
    const emailService = require("../services/email")
    // Load SMTP config from DB
    const configs = await Config.findAll({ where: { key: { [require('sequelize').Op.in]: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure'] } } })
    const cfg = {}
    for (const c of configs) {
      if (c.key === 'smtp_port') cfg.port = parseInt(c.value) || 465
      else if (c.key === 'smtp_secure') cfg.secure = c.value === 'true'
      else if (c.key === 'smtp_user') cfg.user = c.value
      else if (c.key === 'smtp_pass') cfg.pass = c.value
      else if (c.key === 'smtp_host') cfg.host = c.value
    }
    if (cfg.host) {
      await emailService.initTransporter(cfg)
    }
    const html = `<h1>测试邮件</h1><p>如果您看到这封邮件，说明邮件服务配置正确。</p>`
    const result = await emailService.send(to, "CloudHost 测试邮件", html)
    res.json({ code: 200, message: "邮件发送成功" })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: "发送失败: " + error.message })
  }
})

// 域名绑定管理
router.get('/domain-bindings', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20, service_id, status } = req.query
    
    const where = {}
    if (service_id) where.service_id = service_id
    if (status) where.status = status
    
    const { count, rows } = await DomainBinding.findAndCountAll({
      where,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'username'] }
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

router.put('/domain-bindings/:id', auth, admin, async (req, res) => {
  try {
    const { status, ssl_enabled, ssl_cert, ssl_key } = req.body
    
    const binding = await DomainBinding.findByPk(req.params.id)
    
    if (!binding) {
      return res.json({ code: 404, message: '绑定不存在' })
    }
    
    await binding.update({
      status: status || binding.status,
      ssl_enabled: ssl_enabled !== undefined ? ssl_enabled : binding.ssl_enabled,
      ssl_cert: ssl_cert !== undefined ? ssl_cert : binding.ssl_cert,
      ssl_key: ssl_key !== undefined ? ssl_key : binding.ssl_key
    })
    
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '更新失败' })
  }
})

router.delete('/domain-bindings/:id', auth, admin, async (req, res) => {
  try {
    const binding = await DomainBinding.findByPk(req.params.id)
    
    if (!binding) {
      return res.json({ code: 404, message: '绑定不存在' })
    }
    
    await binding.destroy()
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

// 端口转发管理
router.get('/port-forwards', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20, service_id, status } = req.query
    
    const where = {}
    if (service_id) where.service_id = service_id
    if (status) where.status = status
    
    const { count, rows } = await PortForward.findAndCountAll({
      where,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'username'] }
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

router.put('/port-forwards/:id', auth, admin, async (req, res) => {
  try {
    const { status } = req.body
    
    const forward = await PortForward.findByPk(req.params.id)
    
    if (!forward) {
      return res.json({ code: 404, message: '转发不存在' })
    }
    
    await forward.update({
      status: status || forward.status
    })
    
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '更新失败' })
  }
})

router.delete('/port-forwards/:id', auth, admin, async (req, res) => {
  try {
    const forward = await PortForward.findByPk(req.params.id)
    
    if (!forward) {
      return res.json({ code: 404, message: '转发不存在' })
    }
    
    await forward.destroy()
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

// 充值记录管理
router.get('/recharges', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status } = req.query
    
    const where = {}
    if (status) where.status = status
    
    const { count, rows } = await Recharge.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] }
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

router.put('/recharges/:id/process', auth, admin, async (req, res) => {
  try {
    const recharge = await Recharge.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    })
    
    if (!recharge) {
      return res.json({ code: 404, message: '充值记录不存在' })
    }
    
    if (recharge.status !== 'pending') {
      return res.json({ code: 400, message: '该充值记录已处理' })
    }
    
    // 更新充值状态
    await recharge.update({ status: 'completed' })
    
    // 更新用户余额
    const user = recharge.user
    const oldBalance = user.balance
    const newBalance = oldBalance + parseFloat(recharge.amount)
    
    await user.update({ balance: newBalance })
    
    // 创建余额变动日志
    await BalanceLog.create({
      user_id: user.id,
      type: 'recharge',
      amount: recharge.amount,
      balance_before: oldBalance,
      balance_after: newBalance,
      note: `管理员手动处理充值: ${recharge.trade_no}`
    })
    
    res.json({ code: 200, message: '处理成功，余额已更新' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '处理失败' })
  }
})

router.delete('/recharges/:id', auth, admin, async (req, res) => {
  try {
    const recharge = await Recharge.findByPk(req.params.id)
    
    if (!recharge) {
      return res.json({ code: 404, message: '充值记录不存在' })
    }
    
    await recharge.destroy()
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败' })
  }
})

// 余额变动日志
router.get('/balance-logs', auth, admin, async (req, res) => {
  try {
    const { page = 1, page_size = 20, user_id } = req.query
    
    const where = {}
    if (user_id) where.user_id = user_id
    
    const { count, rows } = await BalanceLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] }
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

// 备份恢复管理
router.get('/backups', auth, admin, async (req, res) => {
  try {
    const backupService = require('../services/backup')
    const backups = await backupService.getBackupList()
    const dirSize = await backupService.getBackupDirSize()
    
    res.json({
      code: 200,
      data: {
        list: backups,
        total_size: dirSize
      }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取备份列表失败: ' + error.message })
  }
})

router.post('/backups/create', auth, admin, async (req, res) => {
  try {
    const backupService = require('../services/backup')
    const result = await backupService.createFullBackup()
    
    res.json({
      code: 200,
      message: '备份创建成功',
      data: result
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '备份创建失败: ' + error.message })
  }
})

router.post('/backups/:name/restore', auth, admin, async (req, res) => {
  try {
    const { name } = req.params
    const { restore_database = true, restore_files = false } = req.body
    
    // 重要提示：恢复前应该先备份当前数据
    res.json({
      code: 200,
      message: '恢复任务已提交，请等待完成',
      data: {
        name,
        status: 'restoring'
      }
    })
    
    const backupService = require('../services/backup')
    await backupService.restoreFullBackup(name, {
      restoreDatabase: restore_database,
      restoreFiles: restore_files
    })
    
    console.log(`[Backup] Restore completed for: ${name}`)
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '恢复失败: ' + error.message })
  }
})

router.delete('/backups/:name', auth, admin, async (req, res) => {
  try {
    const { name } = req.params
    const backupService = require('../services/backup')
    await backupService.deleteBackup(name)
    
    res.json({ code: 200, message: '备份已删除' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '删除失败: ' + error.message })
  }
})

router.get('/backups/:name/download', auth, admin, async (req, res) => {
  try {
    const { name } = req.params
    const { type = 'database' } = req.query
    
    const backupService = require('../services/backup')
    const file = await backupService.downloadBackup(name, type)
    
    res.download(file.path, file.name)
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '下载失败: ' + error.message })
  }
})

// ==================== 实名认证审核 ====================
router.get('/auth-requests', auth, admin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query
    const where = {}
    if (status !== 'all') {
      where.status = status
    }
    
    const authRequests = await AuthRequest.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'phone']
      }]
    })
    
    res.json({ code: 200, data: authRequests })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

router.post('/auth-requests/:id/approve', auth, admin, async (req, res) => {
  try {
    const { id } = req.params
    const authRequest = await AuthRequest.findByPk(id)
    if (!authRequest) {
      return res.json({ code: 404, message: '申请不存在' })
    }
    
    authRequest.status = 'approved'
    authRequest.reviewed_by = req.user.id
    authRequest.reviewed_at = new Date()
    await authRequest.save()
    
    // 更新用户的认证状态
    const user = await require('../models').User.findByPk(authRequest.user_id)
    if (user) {
      user.auth_status = 'approved'
      await user.save()
    }
    
    res.json({ code: 200, message: '审核通过' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '操作失败: ' + error.message })
  }
})

router.post('/auth-requests/:id/reject', auth, admin, async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    const authRequest = await AuthRequest.findByPk(id)
    if (!authRequest) {
      return res.json({ code: 404, message: '申请不存在' })
    }
    
    authRequest.status = 'rejected'
    authRequest.reject_reason = reason || '审核未通过'
    authRequest.reviewed_by = req.user.id
    authRequest.reviewed_at = new Date()
    await authRequest.save()
    
    // 更新用户的认证状态
    const user = await require('../models').User.findByPk(authRequest.user_id)
    if (user) {
      user.auth_status = 'rejected'
      await user.save()
    }
    
    res.json({ code: 200, message: '已拒绝' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '操作失败: ' + error.message })
  }
})

// VM 转模板
router.post('/services/:id/convert-to-template', auth, admin, async (req, res) => {
  try {
    const { vmService } = require('../services/vm')
    const service = await Service.findByPk(req.params.id)
    if (!service) return res.json({ code: 404, message: '服务不存在' })
    
    const node = await Node.findByPk(service.node_id)
    if (!node) return res.json({ code: 404, message: '节点不存在' })
    
    const client = vmService.getClient(node)
    const result = await client.convertToTemplate(service.vmid, service.type)
    res.json({ code: 200, message: result.message, data: result })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '操作失败: ' + error.message })
  }
})

module.exports = router
