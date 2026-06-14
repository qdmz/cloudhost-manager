/**
 * Console API 路由
 * POST /api/console/open — 创建 SSH 终端会话
 * POST /api/console/close — 关闭 SSH 终端会话
 */

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const consoleService = require('../services/console')
const { auth } = require('../middleware/auth')

/**
 * 创建终端会话
 * POST /api/console/open
 * Body: { serviceId? | nodeId?, command? }
 */
router.post('/open', auth, async (req, res) => {
  try {
    const { serviceId, nodeId, command } = req.body

    // 验证用户是否有权限访问目标
    if (serviceId) {
      const Service = require('../models').Service
      const service = await Service.findByPk(serviceId)
      if (!service) {
        return res.json({ code: 404, message: '服务不存在' })
      }
      if (service.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.json({ code: 403, message: '无权访问此服务' })
      }
    }

    const result = await consoleService.createSession(req.user.id, {
      serviceId,
      nodeId,
      command
    })

    res.json({
      code: 200,
      message: '终端会话创建成功',
      data: {
        sessionId: result.sessionId,
        expiresAt: result.expiresAt
      }
    })
  } catch (error) {
    console.error('Create console session error:', error)
    res.json({ code: 500, message: error.message || '创建终端会话失败' })
  }
})

/**
 * 关闭终端会话
 * POST /api/console/close
 * Body: { sessionId }
 */
router.post('/close', auth, async (req, res) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.json({ code: 400, message: '缺少 sessionId' })
    }

    consoleService.closeSession(sessionId)

    res.json({ code: 200, message: '终端会话已关闭' })
  } catch (error) {
    console.error('Close console session error:', error)
    res.json({ code: 500, message: error.message || '关闭终端会话失败' })
  }
})

module.exports = router
