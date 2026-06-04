const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const { User, Service, BalanceLog, AuthRequest } = require('../models')
const { auth } = require('../middleware/auth')
const { sendEmail } = require('../services/email')
const { Op } = require('sequelize')

router.get('/info', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    })
    const serviceCount = await Service.count({ where: { user_id: req.userId } })
    
    res.json({
      code: 200,
      data: { ...user.toJSON(), service_count: serviceCount }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.put('/update', auth, async (req, res) => {
  try {
    const { email, phone, qq } = req.body
    
    await User.update({ email, phone, qq }, { where: { id: req.userId } })
    
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '更新失败' })
  }
})

router.post('/change-password', auth, async (req, res) => {
  try {
    const { old_password, new_password } = req.body
    
    const user = await User.findByPk(req.userId)
    const validPassword = await bcrypt.compare(old_password, user.password)
    
    if (!validPassword) {
      return res.json({ code: 400, message: '原密码错误' })
    }
    
    const hashedPassword = await bcrypt.hash(new_password, 10)
    await User.update({ password: hashedPassword }, { where: { id: req.userId } })
    
    res.json({ code: 200, message: '密码修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '修改失败' })
  }
})

router.post('/send-verify-email', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId)
    
    await sendEmail(user.email, '邮箱验证', '请点击以下链接验证您的邮箱')
    
    res.json({ code: 200, message: '验证邮件已发送' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '发送失败' })
  }
})

router.post('/verify-email', auth, async (req, res) => {
  try {
    const { token } = req.body
    
    await User.update({ email_verified: true }, { where: { id: req.userId } })
    
    res.json({ code: 200, message: '邮箱验证成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '验证失败' })
  }
})

router.post('/submit-auth', auth, async (req, res) => {
  try {
    const { real_name, id_card } = req.body
    
    const existing = await AuthRequest.findOne({
      where: { user_id: req.userId, status: 'pending' }
    })
    
    if (existing) {
      return res.json({ code: 400, message: '已有待审核的认证申请' })
    }
    
    await AuthRequest.create({
      user_id: req.userId,
      real_name,
      id_card
    })
    
    res.json({ code: 200, message: '认证申请已提交' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '提交失败' })
  }
})

router.get('/auth-status', auth, async (req, res) => {
  try {
    const request = await AuthRequest.findOne({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']]
    })
    
    if (request) {
      res.json({ code: 200, data: { status: request.status, ...request.toJSON() } })
    } else {
      res.json({ code: 200, data: { status: 'none' } })
    }
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/balance-logs', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20 } = req.query
    
    const { count, rows } = await BalanceLog.findAndCountAll({
      where: { user_id: req.userId },
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

module.exports = router
