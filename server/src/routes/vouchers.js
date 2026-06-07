const express = require('express')
const router = express.Router()
const { Voucher, User, BalanceLog } = require('../models')
const { auth } = require('../middleware/auth')
const { sequelize } = require('../models')

router.get('/', auth, async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      where: { used_by: req.userId },
      order: [['created_at', 'DESC']]
    })
    res.json({ code: 200, data: vouchers })
  } catch (error) {
    console.error('Get vouchers error:', error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.post('/use', auth, async (req, res) => {
  const transaction = await sequelize.transaction()
  try {
    const { code } = req.body
    const voucher = await Voucher.findOne({ where: { code } })

    if (!voucher) {
      await transaction.rollback()
      return res.json({ code: 400, message: '代金券不存在' })
    }

    if (voucher.used) {
      await transaction.rollback()
      return res.json({ code: 400, message: '代金券已被使用' })
    }

    if (voucher.expire_time && new Date(voucher.expire_time) < new Date()) {
      await transaction.rollback()
      return res.json({ code: 400, message: '代金券已过期' })
    }

    const user = await User.findByPk(req.userId)
    const oldBalance = parseFloat(user.balance) || 0
    const voucherValue = parseFloat(voucher.value) || 0

    await user.update({ balance: oldBalance + voucherValue }, { transaction })
    await voucher.update({ used: true, used_by: req.userId, used_at: new Date() }, { transaction })
    await BalanceLog.create({
      user_id: req.userId,
      type: 'recharge',
      amount: voucherValue,
      balance_before: oldBalance,
      balance_after: oldBalance + voucherValue,
      note: '代金券兑换: ' + code,
      related_id: voucher.id,
      related_type: 'voucher'
    }, { transaction })

    await transaction.commit()
    res.json({ code: 200, message: '充值成功，获得 ' + voucherValue + ' 元' })
  } catch (error) {
    await transaction.rollback()
    console.error('Voucher use error:', error)
    res.json({ code: 500, message: '兑换失败: ' + error.message })
  }
})

module.exports = router
