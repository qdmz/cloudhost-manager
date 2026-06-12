const express = require('express')
const router = express.Router()
const { Announcement } = require('../models')
const { optionalAuth } = require('../middleware/auth')

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query
    
    const { count, rows } = await Announcement.findAndCountAll({
      order: [['is_top', 'DESC'], ['created_at', 'DESC']],
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

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id)
    
    if (!announcement) return res.json({ code: 404, message: '公告不存在' })
    
    await announcement.increment('views')
    
    res.json({ code: 200, data: announcement })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, message: '获取失败' })
  }
})

module.exports = router
