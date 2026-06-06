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
                
                // 验证节点是否存在
                const node = await Node.findByPk(order.node_id)
                if (!node) {
                    console.error(`[Payment Notify] Node not found for order ${outTradeNo}`)
                    return res.send('fail')
                }
                
                // 获取产品信息
                const product = await Product.findByPk(order.product_id)
                const plan = await Plan.findByPk(order.plan_id)
                
                // 计算到期时间
                let expireDays = 30
                if (order.cycle === 'quarterly') expireDays = 90
                if (order.cycle === 'yearly') expireDays = 365
                
                const expireAt = new Date()
                expireAt.setDate(expireAt.getDate() + expireDays)
                
                // 创建服务（真正在PVE上创建虚拟机）
                for (let i = 0; i < order.quantity; i++) {
                    try {
                        const { vmService } = require('../services/vm')
                        
                        // 在PVE上创建虚拟机
                        const pveResult = await vmService.createVM(order.node_id, {
                            name: `${product.name}-${i + 1}`,
                            type: product.type || 'kvm',
                            cpu: plan.cpu || 1,
                            memory: plan.memory || 1024,
                            disk: plan.disk || 20
                        })
                        
                        // 创建服务记录
                        await Service.create({
                            user_id: order.user_id,
                            product_id: product.id,
                            plan_id: plan.id,
                            node_id: node.id,
                            order_id: order.id,
                            name: `${product.name}-${pveResult.vmid}`,
                            type: product.type || 'kvm',
                            cpu: plan.cpu || 1,
                            memory: plan.memory || 1024,
                            disk: plan.disk || 20,
                            bandwidth: plan.bandwidth,
                            status: 'running',
                            vmid: String(pveResult.vmid),
                            expire_time: expireAt
                        })
                        
                        console.log(`[Payment Notify] Service ${i + 1}/${order.quantity} created, VMID: ${pveResult.vmid}`)
                    } catch (vmError) {
                        console.error(`[Payment Notify] Failed to create VM for order ${outTradeNo}:`, vmError)
                        // 即使VM创建失败，仍然更新订单状态
                    }
                }
                
                // 更新订单状态
                await order.update({ status: 'paid', paid_at: new Date(), trade_no: tradeNo })
                
                console.log(`[Payment Notify] Order ${outTradeNo} completed, services created`)
            }
        }
    }
    
    res.send('success')
}

module.exports = router
