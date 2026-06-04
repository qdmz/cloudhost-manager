const express = require('express')
const router = express.Router()
const { Recharge, User, BalanceLog } = require('../models')
const { auth } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')
const { getConfigs } = require('../services/config')

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
    
    const configs = await getConfigs()
    const epayUrl = configs.epay_url || process.env.EPAY_URL
    const epayPid = configs.epay_pid || process.env.EPAY_PID
    const epayKey = configs.epay_key || process.env.EPAY_KEY
    const siteUrl = configs.site_url || process.env.SITE_URL || `http://${req.headers.host}`
    
    if (epayUrl && epayPid && epayKey) {
      const notifyUrl = `${siteUrl}/api/pay/notify`
      const returnUrl = siteUrl
      const subject = '账户充值'
      
      // 计算签名 - 确保参数顺序正确
      const params = {
        pid: epayPid,
        type: payment_method,
        out_trade_no: tradeNo,
        notify_url: notifyUrl,
        return_url: returnUrl,
        name: subject,
        money: amount
      }
      
      // 排序参数生成签名字符串
      const sortedKeys = Object.keys(params).sort()
      let signStr = ''
      sortedKeys.forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          signStr += `${key}=${params[key]}&`
        }
      })
      signStr = signStr.slice(0, -1) + epayKey
      
      const sign = require('crypto')
        .createHash('md5')
        .update(signStr)
        .digest('hex')
      
      // 构建支付链接
      let payUrl = epayUrl
      payUrl += (epayUrl.includes('?') ? '&' : '?')
      payUrl += `pid=${epayPid}`
      payUrl += `&type=${payment_method}`
      payUrl += `&out_trade_no=${tradeNo}`
      payUrl += `&notify_url=${encodeURIComponent(notifyUrl)}`
      payUrl += `&return_url=${encodeURIComponent(returnUrl)}`
      payUrl += `&name=${encodeURIComponent(subject)}`
      payUrl += `&money=${amount}`
      payUrl += `&sign=${sign}`
      payUrl += `&sign_type=MD5`
      
      console.log(`[Payment] Creating payment URL for recharge ${tradeNo}: ${payUrl}`)
      
      res.json({ code: 200, message: '正在跳转支付', data: { pay_url: payUrl } })
    } else {
      console.log('[Payment] EPAY not configured')
      res.json({ code: 200, message: '充值记录已创建', data: { trade_no: tradeNo } })
    }
  } catch (error) {
    console.error('[Payment] Error:', error)
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
