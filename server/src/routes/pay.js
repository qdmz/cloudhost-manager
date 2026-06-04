const express = require('express')
const router = express.Router()
const { Recharge, User, BalanceLog } = require('../models')

router.post('/notify', async (req, res) => {
  try {
    const { out_trade_no, trade_no, amount, status } = req.body
    
    if (status === '1') {
      const recharge = await Recharge.findOne({ where: { trade_no: out_trade_no } })
      
      if (recharge && recharge.status === 'pending') {
        const user = await User.findByPk(recharge.user_id)
        
        await recharge.update({ status: 'completed', paid_at: new Date() })
        
        const oldBalance = user.balance
        await user.update({ balance: user.balance + parseFloat(amount) })
        
        await BalanceLog.create({
          user_id: user.id,
          type: 'recharge',
          amount: parseFloat(amount),
          balance_before: oldBalance,
          balance_after: user.balance,
          note: `在线充值: ${trade_no || out_trade_no}`,
          related_id: recharge.id,
          related_type: 'recharge'
        })
      }
    }
    
    res.send('success')
  } catch (error) {
    console.error(error)
    res.send('fail')
  }
})

module.exports = router
