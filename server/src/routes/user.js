const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const { User, Service, BalanceLog, AuthRequest } = require('../models')
const { auth } = require('../middleware/auth')
const { sendEmail } = require('../services/email')
const { Op } = require('sequelize')

// Get user info
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
    console.error('[User] Info error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

// Update profile
router.put('/update', auth, async (req, res) => {
  try {
    const { email, phone, qq } = req.body
    
    const updateData = {}
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (qq) updateData.qq = qq
    
    await User.update(updateData, { where: { id: req.userId } })
    
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('[User] Update error:', error)
    res.json({ code: 500, message: '更新失败: ' + error.message })
  }
})

// Change password
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
    console.error('[User] Password error:', error)
    res.json({ code: 500, message: '修改失败: ' + error.message })
  }
})

// Send verify email
router.post('/send-verify-email', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId)
    await sendEmail(user.email, '邮箱验证', '请点击以下链接验证您的邮箱')
    res.json({ code: 200, message: '验证邮件已发送' })
  } catch (error) {
    console.error('[User] Send email error:', error)
    res.json({ code: 500, message: '发送失败: ' + error.message })
  }
})

// Verify email
router.post('/verify-email', auth, async (req, res) => {
  try {
    const { token } = req.body
    await User.update({ email_verified: true }, { where: { id: req.userId } })
    res.json({ code: 200, message: '邮箱验证成功' })
  } catch (error) {
    console.error('[User] Verify email error:', error)
    res.json({ code: 500, message: '验证失败: ' + error.message })
  }
})

// Submit KYC auth
router.post('/submit-auth', auth, async (req, res) => {
  try {
    const { real_name, id_card, id_card_front_url, id_card_back_url } = req.body
    
    if (!real_name || !id_card) {
      return res.json({ code: 400, message: '请填写完整信息' })
    }
    
    const existing = await AuthRequest.findOne({
      where: { user_id: req.userId, status: 'pending' }
    })
    
    if (existing) {
      return res.json({ code: 400, message: '已有待审核的认证申请' })
    }
    
    const authRequest = await AuthRequest.create({
      user_id: req.userId,
      real_name,
      id_card,
      id_card_front_url: id_card_front_url || '',
      id_card_back_url: id_card_back_url || ''
    })
    
    res.json({ code: 200, message: '认证申请已提交，请等待审核' })
  } catch (error) {
    console.error('[User] Submit auth error:', error)
    res.json({ code: 500, message: '提交失败: ' + error.message })
  }
})

// Get auth status
router.get('/auth-status', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'username', 'real_name', 'id_card', 'identity_verified']
    })
    
    if (!user) return res.json({ code: 404, message: '用户不存在' })
    
    const request = await AuthRequest.findOne({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']]
    })
    
    const authData = request ? { ...request.toJSON() } : null
    
    res.json({
      code: 200,
      data: {
        identity_verified: user.identity_verified || false,
        real_name: user.real_name || '',
        request: authData
      }
    })
  } catch (error) {
    console.error('[User] Auth status error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

// Balance logs
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
    console.error('[User] Balance logs error:', error)
    res.json({ code: 500, message: '获取失败: ' + error.message })
  }
})

module.exports = router
