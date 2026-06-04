const express = require('express')
const router = express.Router()
const { Recharge, User, BalanceLog } = require('../models')
const { auth } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')
const epayService = require('../services/epay')

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
        const { amount, payment_method = 'alipay' } = req.body
        
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
        
        const payUrl = await epayService.createPayment(tradeNo, '账户充值', amount, payment_method)
        
        if (payUrl) {
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
