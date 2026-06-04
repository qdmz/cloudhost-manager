const express = require('express')
const router = express.Router()
const { Node, Image } = require('../models')

router.get('/', async (req, res) => {
  try {
    const nodes = await Node.findAll({ 
      where: { status: 'online' },
      order: [['id', 'ASC']]
    })
    
    res.json({ code: 200, data: nodes })
  } catch (error) {
    console.error('Nodes list error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

router.get('/:id/images', async (req, res) => {
  try {
    const images = await Image.findAll({ 
      where: { node_id: req.params.id, status: 'active' }
    })
    
    res.json({ code: 200, data: images })
  } catch (error) {
    console.error('Node images error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

module.exports = router
