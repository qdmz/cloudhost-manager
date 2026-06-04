const express = require('express')
const router = express.Router()
const { Recharge, User, BalanceLog, Order, Service, Product, Plan, Node } = require('../models')
const { getConfigs } = require('../services/config')

router.post('/notify', async (req, res) => {
  try {
    console.log('[Payment Notify] Received:', req.body)
    
    const { out_trade_no, trade_no, money, trade_status, sign, pid, ...otherParams } = req.body
    
    // 验证签名
    const configs = await getConfigs()
    const epayKey = configs.epay_key || process.env.EPAY_KEY
    
    if (epayKey && sign) {
      // 构建签名字符串 - 不包含sign和sign_type
      const allParams = { ...req.body }
      delete allParams.sign
      delete allParams.sign_type
      
      const sortedKeys = Object.keys(allParams).sort()
      let signStr = ''
      sortedKeys.forEach(key => {
        if (allParams[key] !== undefined && allParams[key] !== '') {
          signStr += `${key}=${allParams[key]}&`
        }
      })
      signStr = signStr.slice(0, -1) + epayKey
      
      const calculatedSign = require('crypto')
        .createHash('md5')
        .update(signStr)
        .digest('hex')
      
      if (calculatedSign !== sign) {
        console.log('[Payment Notify] Sign verification failed')
        return res.send('fail')
      }
    }
    
    const isPaid = trade_status === 'TRADE_SUCCESS' || trade_status === '1' || trade_status === 'success'
    
    if (isPaid) {
      const amount = money || req.body.amount
      
      // 先检查是否是充值订单
      const recharge = await Recharge.findOne({ where: { trade_no: out_trade_no } })
      
      if (recharge && recharge.status === 'pending') {
        console.log(`[Payment Notify] Processing recharge ${out_trade_no}, amount: ${amount}`)
        
        const user = await User.findByPk(recharge.user_id)
        
        await recharge.update({ status: 'completed', paid_at: new Date(), trade_no: trade_no })
        
        const oldBalance = parseFloat(user.balance)
        const addAmount = parseFloat(amount)
        await user.update({ balance: oldBalance + addAmount })
        
        await BalanceLog.create({
          user_id: user.id,
          type: 'recharge',
          amount: addAmount,
          balance_before: oldBalance,
          balance_after: oldBalance + addAmount,
          note: `在线充值: ${trade_no || out_trade_no}`,
          related_id: recharge.id,
          related_type: 'recharge'
        })
        
        console.log(`[Payment Notify] Recharge ${out_trade_no} completed`)
      } else {
        // 检查是否是商品订单
        const order = await Order.findOne({ where: { order_no: out_trade_no } })
        
        if (order && order.status === 'pending') {
          console.log(`[Payment Notify] Processing order ${out_trade_no}, amount: ${amount}`)
          
          await order.update({ status: 'paid', paid_at: new Date(), trade_no: trade_no })
          
          const user = await User.findByPk(order.user_id)
          const product = await Product.findByPk(order.product_id)
          const plan = await Plan.findByPk(order.plan_id)
          const node = await Node.findByPk(order.node_id)
          
          // 计算到期时间
          let expireDays = 30
          if (order.cycle === 'quarterly') expireDays = 90
          if (order.cycle === 'yearly') expireDays = 365
          
          const expireAt = new Date()
          expireAt.setDate(expireAt.getDate() + expireDays)
          
          // 创建服务
          for (let i = 0; i < order.quantity; i++) {
            await Service.create({
              user_id: user.id,
              product_id: product.id,
              plan_id: plan.id,
              node_id: node.id,
              order_id: order.id,
              name: `${product.name}-${i + 1}`,
              cpu: plan.cpu,
              memory: plan.memory,
              disk: plan.disk,
              bandwidth: plan.bandwidth,
              status: 'pending',
              expire_at: expireAt
            })
          }
          
          console.log(`[Payment Notify] Order ${out_trade_no} completed, services created`)
        }
      }
    }
    
    res.send('success')
  } catch (error) {
    console.error('[Payment Notify] Error:', error)
    res.send('fail')
  }
})

module.exports = router
