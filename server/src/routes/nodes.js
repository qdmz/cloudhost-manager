const express = require('express');
const router = express.Router();
const { Node, Image } = require('../models');
const { auth, admin } = require('../middleware/auth');

// 获取节点列表
router.get('/', auth, async (req, res) => {
  try {
    const nodes = await Node.findAll({ order: [['id', 'ASC']] });
    res.json({ code: 200, data: nodes });
  } catch (error) {
    console.error('Nodes list error:', error.message);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取节点统计
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) return res.json({ code: 404, message: '节点不存在' });
    res.json({ code: 200, data: { ...node.toJSON() } });
  } catch (error) {
    res.json({ code: 500, message: error.message });
  }
});

// 获取节点镜像
router.get('/:id/images', auth, async (req, res) => {
  try {
    const images = await Image.findAll({ where: { node_id: req.params.id, status: 'active' } });
    res.json({ code: 200, data: images });
  } catch (error) {
    res.json({ code: 500, message: error.message });
  }
});

module.exports = router;
