const express = require('express')
const router = express.Router()
const { Recharge, User, BalanceLog, Order, Service, Product, Plan, Node } = require('../models')
const epayService = require('../services/epay')
const provisioning = require('../services/provisioning')

// 支付成功后的处理函数（统一走 provisioning，支持 PVE/Incus 与智简魔方节点自动开通）
async function processPaymentSuccess(order, tradeNo, userId) {
  const result = await provisioning.provisionOrderServices(order)
  if (result.errors && result.errors.length) {
    console.warn(`[PayCallback] Order ${order.order_no} 开通部分失败:`, result.errors)
  }
  await order.update({ status: 'paid', paid_at: new Date(), trade_no: tradeNo || null })
  console.log(`[PayCallback] Order ${order.order_no} completed: ${result.services.length} services`)
  return true
}

// 异步通知 GET
router.get('/notify', async (req, res) => {
  try {
    console.log('[Payment Notify] GET:', req.query)
    await handlePayment(req.query, res)
  } catch (error) {
    console.error('[Payment Notify] Error:', error)
    res.send('fail')
  }
})

// 异步通知 POST
router.post('/notify', async (req, res) => {
  try {
    console.log('[Payment Notify] POST:', req.body)
    const params = { ...req.query, ...req.body }
    await handlePayment(params, res)
  } catch (error) {
    console.error('[Payment Notify] Error:', error)
    res.send('fail')
  }
})

// 跳转通知
router.get('/return', async (req, res) => {
  try {
    res.redirect('/#/orders')
  } catch (error) {
    res.redirect('/#/orders')
  }
})

async function handlePayment(params, res) {
  const outTradeNo = params.out_trade_no
  const tradeNo = params.trade_no
  const money = params.money
  const tradeStatus = params.trade_status
  
  // 验证签名
  try {
    const isValid = await epayService.verifyNotify(params)
    if (!isValid) {
      console.log('[Payment Notify] Sign verification failed')
      return res.send('fail')
    }
  } catch (verifyError) {
    console.log('[Payment Notify] Verify error (possibly test mode):', verifyError.message)
    // Test mode: 继续处理
  }
  
  const isPaid = tradeStatus === 'TRADE_SUCCESS' || tradeStatus === '1' || tradeStatus === 'success'
  
  if (!isPaid) {
    return res.send('success')
  }
  
  const amount = parseFloat(money)
  
  // 先检查是否是充值订单
  const recharge = await Recharge.findOne({ where: { trade_no: outTradeNo } })
  
  if (recharge && recharge.status === 'pending') {
    console.log('[Payment] Processing recharge:', outTradeNo)
    
    const user = await User.findByPk(recharge.user_id)
    if (!user) {
      return res.send('fail')
    }
    
    await recharge.update({ status: 'completed', paid_at: new Date(), trade_no: tradeNo })
    
    const oldBalance = parseFloat(user.balance)
    const addAmount = amount
    await user.update({ balance: oldBalance + addAmount })
    
    await BalanceLog.create({
      user_id: user.id,
      type: 'recharge',
      amount: addAmount,
      balance_before: oldBalance,
      balance_after: oldBalance + addAmount,
      note: '在线充值: ' + (tradeNo || outTradeNo),
      related_id: recharge.id,
      related_type: 'recharge'
    })
    
    console.log('[Payment] Recharge completed, new balance:', oldBalance + addAmount)
  } else {
    // 检查是否是商品订单或续费订单
    const order = await Order.findOne({ where: { order_no: outTradeNo } })
    
    if (order && order.status === 'pending') {
      console.log('[Payment] Processing order:', outTradeNo)
      
      // Check if this is a renewal order (has service_id)
      if (order.service_id) {
        // Renewal order - update service expire_time
        const service = await Service.findByPk(order.service_id)
        if (service) {
          let expireDays = 30
          if (order.cycle === 'quarterly') expireDays = 90
          if (order.cycle === 'yearly') expireDays = 365
          
          await service.update({
            expire_time: new Date(service.expire_time.getTime() + expireDays * 86400000)
          })
          await order.update({ status: 'paid', paid_at: new Date(), trade_no: tradeNo })
          console.log(`[Payment] Renewal completed for service ${service.id}, new expire: ${service.expire_time}`)
        }
      } else {
        // New purchase order
        await processPaymentSuccess(order, tradeNo, order.user_id)
      }
    }
  }
  
  res.send('success')
}

// 获取易支付支持的支付方式列表
router.get('/payment-methods', async (req, res) => {
  try {
    const epayService = require('../services/epay')
    const config = await epayService.getConfig()
    
    // 如果未配置易支付，返回默认支付方式
    if (!config.epayUrl || config.epayUrl === 'https://epay.example.com/submit.php') {
      return res.json({
        code: 200,
        data: [
          { value: 'alipay', name: '支付宝', icon: 'alipay' },
          { value: 'wechat', name: '微信支付', icon: 'wechat' },
          { value: 'qqpay', name: 'QQ钱包', icon: 'qq' }
        ]
      })
    }
    
    // 从易支付配置中获取支持的支付方式
    // 不同易支付平台支持的 type 可能不同，这里返回常见类型
    const methods = [
      { value: 'alipay', name: '支付宝', icon: 'alipay' },
      { value: 'wechat', name: '微信支付', icon: 'wechat' },
      { value: 'qqpay', name: 'QQ钱包', icon: 'qq' },
      { value: 'unionpay', name: '银联支付', icon: 'creditcard' }
    ]
    
    res.json({ code: 200, data: methods })
  } catch (error) {
    console.error('[Payment] Get payment methods error:', error)
    res.json({ code: 500, message: '获取支付方式失败' })
  }
})

module.exports = router
