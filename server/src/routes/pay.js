const express = require('express')
const router = express.Router()
const { Recharge, User, BalanceLog, Order, Service, Product, Plan, Node } = require('../models')
const epayService = require('../services/epay')

// 处理异步通知（notify）
router.get('/notify', async (req, res) => {
    try {
        console.log('[Payment Notify] Received (GET):', req.query)
        await handlePayment(req.query, res)
    } catch (error) {
        console.error('[Payment Notify] Error:', error)
        res.send('fail')
    }
})

// 处理异步通知（也兼容 POST）
router.post('/notify', async (req, res) => {
    try {
        console.log('[Payment Notify] Received (POST):', req.body)
        const params = { ...req.query, ...req.body }
        await handlePayment(params, res)
    } catch (error) {
        console.error('[Payment Notify] Error:', error)
        res.send('fail')
    }
})

// 处理跳转通知（return）
router.get('/return', async (req, res) => {
    try {
        console.log('[Payment Return] Received:', req.query)
        const params = req.query
        
        // 验证签名
        const isValid = await epayService.verifyNotify(params)
        if (!isValid) {
            return res.send('验签失败')
        }
        
        const outTradeNo = params.out_trade_no
        const isPaid = params.trade_status === 'TRADE_SUCCESS' || params.trade_status === '1' || params.trade_status === 'success'
        
        if (isPaid) {
            // 支付成功，跳转回订单页
            res.redirect('/#/orders')
        } else {
            res.redirect('/#/')
        }
    } catch (error) {
        console.error('[Payment Return] Error:', error)
        res.redirect('/#/')
    }
})

// 处理支付逻辑
async function handlePayment(params, res) {
    const outTradeNo = params.out_trade_no
    const tradeNo = params.trade_no
    const money = params.money
    const tradeStatus = params.trade_status
    
    // 验证签名
    const isValid = await epayService.verifyNotify(params)
    if (!isValid) {
        console.log('[Payment Notify] Sign verification failed')
        return res.send('fail')
    }
    
    const isPaid = tradeStatus === 'TRADE_SUCCESS' || tradeStatus === '1' || tradeStatus === 'success'
    
    if (isPaid) {
        const amount = parseFloat(money)
        
        // 先检查是否是充值订单
        const recharge = await Recharge.findOne({ where: { trade_no: outTradeNo } })
        
        if (recharge && recharge.status === 'pending') {
            console.log(`[Payment Notify] Processing recharge ${outTradeNo}, amount: ${amount}`)
            
            const user = await User.findByPk(recharge.user_id)
            
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
                note: `在线充值: ${tradeNo || outTradeNo}`,
                related_id: recharge.id,
                related_type: 'recharge'
            })
            
            console.log(`[Payment Notify] Recharge ${outTradeNo} completed`)
        } else {
            // 检查是否是商品订单
            const order = await Order.findOne({ where: { order_no: outTradeNo } })
            
            if (order && order.status === 'pending') {
                console.log(`[Payment Notify] Processing order ${outTradeNo}, amount: ${amount}`)
                
                await order.update({ status: 'paid', paid_at: new Date(), trade_no: tradeNo })
                
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
                
                console.log(`[Payment Notify] Order ${outTradeNo} completed, services created`)
            }
        }
    }
    
    res.send('success')
}

module.exports = router
