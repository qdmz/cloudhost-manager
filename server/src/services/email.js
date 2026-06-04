const nodemailer = require('nodemailer')
const { Config } = require('../models')

let transporter = null

// 从数据库读取配置并初始化 transporter
const initTransporter = async () => {
  try {
    // 读取所有配置
    const configs = await Config.findAll()
    const configMap = {}
    configs.forEach(c => {
      try {
        configMap[c.key] = c.type === 'json' ? JSON.parse(c.value) : c.value
      } catch {
        configMap[c.key] = c.value
      }
    })
    
    const smtpHost = configMap.smtp_host || process.env.SMTP_HOST
    const smtpPort = configMap.smtp_port || process.env.SMTP_PORT
    const smtpUser = configMap.smtp_user || process.env.SMTP_USER
    const smtpPass = configMap.smtp_pass || process.env.SMTP_PASS
    const smtpSecure = configMap.smtp_secure !== undefined ? configMap.smtp_secure : process.env.SMTP_SECURE === 'true'
    
    if (smtpHost && smtpUser) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort) || 465,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })
      console.log(`[Email] Transporter initialized with host: ${smtpHost}`)
    } else {
      console.log('[Email] SMTP not configured, will log emails instead')
    }
  } catch (error) {
    console.error('[Email] Failed to initialize transporter:', error)
  }
}

const getConfig = async () => {
  try {
    const configs = await Config.findAll()
    const configMap = {}
    configs.forEach(c => {
      try {
        configMap[c.key] = c.type === 'json' ? JSON.parse(c.value) : c.value
      } catch {
        configMap[c.key] = c.value
      }
    })
    return configMap
  } catch {
    return {}
  }
}

const sendEmail = async (to, subject, text, html) => {
  // 如果 transporter 未初始化，尝试初始化一次
  if (!transporter) {
    await initTransporter()
  }
  
  if (!transporter) {
    console.log(`[Email] ${to} - ${subject}: ${text}`)
    return true
  }
  
  try {
    const config = await getConfig()
    const fromEmail = config.smtp_from || process.env.SMTP_FROM || config.smtp_user || process.env.SMTP_USER
    
    await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    })
    
    console.log(`[Email] Sent to ${to}: ${subject}`)
    return true
  } catch (error) {
    console.error('Email send failed:', error)
    return false
  }
}

// 初始化时尝试读取配置
initTransporter()

module.exports = { sendEmail, initTransporter }
