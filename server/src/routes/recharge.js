const express = require('express')
const router = express.Router()
const { Recharge, User, BalanceLog } = require('../models')
const { auth } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20 } = req.query
    
    const { count, rows } = await Recharge.findAndCountAll({
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

router.post('/', auth, async (req, res) => {
  try {
    const { amount, payment_method } = req.body
    
    if (amount < 1) {
      return res.json({ code: 400, message: '充值金额不能少于1元' })
    }
    
    const tradeNo = `RCH${Date.now()}${uuidv4().substring(0, 8).toUpperCase()}`
    
    const recharge = await Recharge.create({
      user_id: req.userId,
      amount,
      payment_method,
      trade_no: tradeNo,
      status: 'pending'
    })
    
    const epayUrl = process.env.EPAY_URL
    const epayPid = process.env.EPAY_PID
    const epayKey = process.env.EPAY_KEY
    
    if (epayUrl && epayPid && epayKey) {
      const sign = require('crypto')
        .createHash('md5')
        .update(`pid=${epayPid}&type=${payment_method}&out_trade_no=${tradeNo}&notify_url=${process.env.SITE_URL}/api/pay/notify&return_url=${process.env.SITE_URL}&amount=${amount}&subject=充值`)
        .digest('hex')
      
      const payUrl = `${epayUrl}?pid=${epayPid}&type=${payment_method}&out_trade_no=${tradeNo}&notify_url=${process.env.SITE_URL}/api/pay/notify&return_url=${process.env.SITE_URL}&amount=${amount}&subject=充值&sign=${sign}&sign_type=MD5`
      
      res.json({ code: 200, message: '正在跳转支付', data: { pay_url: payUrl } })
    } else {
      res.json({ code: 200, message: '充值记录已创建', data: { trade_no: tradeNo } })
    }
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '创建失败' })
  }
})

router.get('/records', auth, async (req, res) => {
  try {
    const { page = 1, page_size = 20 } = req.query
    
    const { count, rows } = await Recharge.findAndCountAll({
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
