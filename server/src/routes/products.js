const express = require('express')
const router = express.Router()
const { Product, Plan } = require('../models')
const { auth, optionalAuth } = require('../middleware/auth')

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, page_size = 20, type } = req.query
    
    const where = { status: 'online' }
    if (type) where.type = type
    
    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [['sort', 'ASC'], ['id', 'DESC']],
      limit: parseInt(page_size),
      offset: (parseInt(page) - 1) * parseInt(page_size)
    })
    
    const products = await Promise.all(rows.map(async (p) => {
      const plans = await Plan.findAll({ where: { product_id: p.id } })
      return {
        ...p.toJSON(),
        features: p.features ? p.features.split('\n') : [],
        min_price: plans.length ? Math.min(...plans.map(pl => pl.price_monthly)) : p.min_price,
        plans
      }
    }))
    
    res.json({
      code: 200,
      data: { list: products, total: count, page: parseInt(page), page_size: parseInt(page_size) }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    
    if (!product || product.status !== 'online') {
      return res.json({ code: 404, message: '产品不存在' })
    }
    
    const plans = await Plan.findAll({ where: { product_id: product.id } })
    
    res.json({
      code: 200,
      data: {
        ...product.toJSON(),
        features: product.features ? product.features.split('\n') : [],
        plans
      }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/:id/plans', async (req, res) => {
  try {
    const plans = await Plan.findAll({ where: { product_id: req.params.id } })
    res.json({ code: 200, data: plans })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

module.exports = router
