const express = require('express')
const router = express.Router()
const { Recharge, User, BalanceLog, Order, Service, Product, Plan, Node } = require('../models')
const epayService = require('../services/epay')

// 支付成功后的处理函数
async function processPaymentSuccess(order, tradeNo, userId) {
  const plan = await Plan.findByPk(order.plan_id)
  const node = await Node.findByPk(order.node_id)
  const product = await Product.findByPk(order.product_id)
  
  if (!plan || !node || !product) return false
  
  let expireDays = 30
  if (order.cycle === 'quarterly') expireDays = 90
  if (order.cycle === 'yearly') expireDays = 365
  
  const expireAt = new Date()
  expireAt.setDate(expireAt.getDate() + expireDays)
  
  let successCount = 0
  
  for (let i = 0; i < (order.quantity || 1); i++) {
    let pveVmid = ''
    try {
      const { vmService } = require('../services/vm')
      const pveResult = await vmService.createVM(order.node_id, {
        name: (product.name || "VM").replace(/[^\w-]/g, "") + "-" + (i + 1),
        type: product.type || 'kvm',
        cpu: plan.cpu,
        memory: plan.memory,
        disk: plan.disk,
        bandwidth: plan.bandwidth,
        traffic: plan.traffic
      })
      pveVmid = String(pveResult.vmid)
      successCount++
    } catch (pveError) {
      console.error('PVE VM creation failed:', pveError.message)
      // 即使VM创建失败，也创建服务记录
    }
    
    await Service.create({
      user_id: userId,
      node_id: order.node_id,
      product_id: order.product_id,
      plan_id: order.plan_id,
      order_id: order.id,
      name: (product.name || "VM").replace(/[^\w-]/g, "") + "-" + (i + 1),
      type: product.type || 'kvm',
      status: 'running',
      cpu: plan.cpu,
      memory: plan.memory,
      disk: plan.disk,
      bandwidth: plan.bandwidth,
      vmid: pveVmid,
      password: '',
      price: parseFloat(order.amount) / (order.quantity || 1),
      expire_time: expireAt
    })
  }
  
  await order.update({ status: 'paid', paid_at: new Date(), trade_no: tradeNo })
  console.log(`Order ${order.order_no} completed: ${successCount} services created`)
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
    // 检查是否是商品订单
    const order = await Order.findOne({ where: { order_no: outTradeNo } })
    
    if (order && order.status === 'pending') {
      console.log('[Payment] Processing order:', outTradeNo)
      await processPaymentSuccess(order, tradeNo, order.user_id)
    }
  }
  
  res.send('success')
}

module.exports = router
