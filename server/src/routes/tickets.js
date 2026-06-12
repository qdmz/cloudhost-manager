const express = require('express')
const router = express.Router()
const { Ticket, TicketMessage, User } = require('../models')
const { auth } = require('../middleware/auth')

// List user tickets
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, status } = req.query
    
    const where = { user_id: req.userId }
    if (status) where.status = status
    
    const { count, rows } = await Ticket.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size)
    })
    
    res.json({
      code: 200,
      data: { list: rows, total: count, page: parseInt(page), page_size: parseInt(page_size) }
    })
  } catch (error) {
    console.error('[Tickets] List error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

// Create ticket
router.post('/', auth, async (req, res) => {
  try {
    const { category, title, content } = req.body
    
    if (!title || !content) {
      return res.json({ code: 400, message: '请填写标题和内容' })
    }
    
    const ticket = await Ticket.create({
      user_id: req.userId,
      category: category || 'other',
      title,
      status: 'open'
    })
    
    await TicketMessage.create({
      ticket_id: ticket.id,
      user_id: req.userId,
      content,
      is_admin: false
    })
    
    const ticketWithMessages = await Ticket.findByPk(ticket.id, {
      include: [{
        model: TicketMessage,
        include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
        order: [['created_at', 'ASC']]
      }]
    })
    
    res.json({ code: 200, message: '工单创建成功', data: ticketWithMessages })
  } catch (error) {
    console.error('[Tickets] Create error:', error)
    res.json({ code: 500, message: '创建失败: ' + error.message })
  }
})

// Get single ticket
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{
        model: TicketMessage,
        include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
        order: [['created_at', 'ASC']]
      }]
    })
    
    if (!ticket) return res.json({ code: 404, message: '工单不存在' })
    
    res.json({ code: 200, data: ticket })
  } catch (error) {
    console.error('[Tickets] Get error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

// Reply to ticket
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { content } = req.body
    
    if (!content) {
      return res.json({ code: 400, message: '回复内容不能为空' })
    }
    
    const ticket = await Ticket.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!ticket) return res.json({ code: 404, message: '工单不存在' })
    
    if (ticket.status === 'closed') {
      return res.json({ code: 400, message: '工单已关闭，无法回复' })
    }
    
    await TicketMessage.create({
      ticket_id: ticket.id,
      user_id: req.userId,
      content,
      is_admin: false
    })
    
    await ticket.update({ status: 'open' })
    
    res.json({ code: 200, message: '回复成功' })
  } catch (error) {
    console.error('[Tickets] Reply error:', error)
    res.json({ code: 500, message: '回复失败: ' + error.message })
  }
})

// Close ticket
router.post('/:id/close', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    
    if (!ticket) return res.json({ code: 404, message: '工单不存在' })
    
    await ticket.update({ status: 'closed' })
    
    res.json({ code: 200, message: '工单已关闭' })
  } catch (error) {
    console.error('[Tickets] Close error:', error)
    res.json({ code: 500, message: '操作失败: ' + error.message })
  }
})

module.exports = router
