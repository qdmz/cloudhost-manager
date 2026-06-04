const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User } = require('../models')
const { auth } = require('../middleware/auth')
const { sendEmail } = require('../services/email')
const { Op } = require('sequelize')

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body
    
    const existing = await User.findOne({ 
      where: { 
        [Op.or]: [{ username }, { email }] 
      } 
    })
    if (existing) {
      return res.json({ code: 400, message: '用户名或邮箱已存在' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone
    })
    
    res.json({ code: 200, message: '注册成功', data: { id: user.id } })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '注册失败' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ username }, { email: username }] 
      } 
    })
    if (!user) {
      return res.json({ code: 400, message: '用户不存在' })
    }
    
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.json({ code: 400, message: '密码错误' })
    }
    
    if (user.status === 'disabled') {
      return res.json({ code: 403, message: '账户已被禁用' })
    }
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
    
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
    
    res.json({
      code: 200,
      message: '登录成功',
      data: { token, user: { id: user.id, username: user.username, role: user.role } }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '登录失败' })
  }
})

router.post('/logout', auth, async (req, res) => {
  res.clearCookie('token')
  res.json({ code: 200, message: '已退出登录' })
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ where: { email } })
    
    if (!user) {
      return res.json({ code: 400, message: '邮箱不存在' })
    }
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    await sendEmail(email, '密码重置验证码', `您的验证码是: ${code}`)
    
    res.json({ code: 200, message: '验证码已发送到邮箱' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '发送失败' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body
    
    const hashedPassword = await bcrypt.hash(password, 10)
    await User.update({ password: hashedPassword }, { where: { email } })
    
    res.json({ code: 200, message: '密码重置成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '重置失败' })
  }
})

module.exports = router
