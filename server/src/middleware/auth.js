const jwt = require('jsonwebtoken')
const { User } = require('../models')

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token
    
    if (!token) {
      return res.status(401).json({ code: 401, message: '请先登录' })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.id)
    
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' })
    }
    
    if (user.status === 'disabled') {
      return res.status(403).json({ code: 403, message: '账户已被禁用' })
    }
    
    req.user = user
    req.userId = user.id
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '登录已过期' })
    }
    return res.status(401).json({ code: 401, message: '认证失败' })
  }
}

const admin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '权限不足' })
  }
  next()
}

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findByPk(decoded.id)
      if (user) {
        req.user = user
        req.userId = user.id
      }
    }
  } catch (error) {
    // ignore
  }
  next()
}

module.exports = { auth, admin, optionalAuth }
