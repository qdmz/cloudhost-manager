const express = require('express')
const router = express.Router()
const { Voucher, User, BalanceLog } = require('../models')
const { auth } = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      where: { used_by: req.userId },
      order: [['created_at', 'DESC']]
    })
    
    res.json({ code: 200, data: vouchers })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/use', auth, async (req, res) => {
  try {
    const { code } = req.body
    
    const voucher = await Voucher.findOne({ where: { code } })
    
    if (!voucher) {
      return res.json({ code: 400, message: '代金券不存在' })
    }
    
    if (voucher.used) {
      return res.json({ code: 400, message: '代金券已被使用' })
    }
    
    if (voucher.expire_time && new Date(voucher.expire_time) < new Date()) {
      return res.json({ code: 400, message: '代金券已过期' })
    }
    
    const user = await User.findByPk(req.userId)
    const oldBalance = user.balance
    
    await user.update({ balance: user.balance + voucher.value })
    await voucher.update({ used: true, used_by: req.userId, used_at: new Date() })
    
    await BalanceLog.create({
      user_id: req.userId,
      type: 'recharge',
      amount: voucher.value,
      balance_before: oldBalance,
      balance_after: user.balance,
      note: `代金券兑换: ${code}`,
      related_id: voucher.id,
      related_type: 'voucher'
    })
    
    res.json({ code: 200, message: `充值成功，获得 ${voucher.value} 元` })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '兑换失败' })
  }
})

module.exports = router
