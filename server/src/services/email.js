const nodemailer = require('nodemailer')
const { Config } = require('../models')

let transporter = null

const initTransporter = async () => {
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
    
    const smtpHost = configMap.smtp_host || process.env.SMTP_HOST
    const smtpPort = configMap.smtp_port || process.env.SMTP_PORT
    const smtpUser = configMap.smtp_user || process.env.SMTP_USER
    const smtpPass = configMap.smtp_pass || process.env.SMTP_PASS
    let smtpSecure = false
    if (configMap.smtp_secure !== undefined) {
      smtpSecure = configMap.smtp_secure === true || configMap.smtp_secure === 'true'
    } else if (process.env.SMTP_SECURE) {
      smtpSecure = process.env.SMTP_SECURE === true || process.env.SMTP_SECURE === 'true'
    }
    
    if (smtpHost && smtpUser) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort) || 465,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass }
      })
      console.log('[Email] Transporter initialized with host: ' + smtpHost)
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

// Email template system
const emailTemplates = {}

emailTemplates.order_confirmation = {
  subject: '订单确认 - {site_name}',
  getText: (v) => {
    return '订单号: ' + v.order_no + '\n金额: ¥' + v.amount + '\n产品: ' + v.product_name + '\n配置: ' + v.plan_name + '\n支付方式: ' + v.payment_method + '\n\n感谢您的使用！'
  },
  getHtml: (v) => {
    return '<div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">' +
      '<h2 style="color:#1890ff;">订单确认</h2>' +
      '<p>您好 ' + (v.username || '') + '，</p>' +
      '<p>您的订单已成功创建：</p>' +
      '<table style="border-collapse:collapse;width:100%;margin:15px 0;">' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>订单号</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.order_no + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>金额</strong></td><td style="padding:8px;border:1px solid #ddd;">¥' + v.amount + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>产品</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.product_name + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>配置</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.plan_name + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>支付方式</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.payment_method + '</td></tr>' +
      '</table>' +
      '<p>感谢您的使用！</p>' +
      '<p style="color:#999;font-size:12px;">—— ' + (v.site_name || 'CloudHost') + '</p>' +
    '</div>'
  }
}

emailTemplates.payment_success = {
  subject: '支付成功 - {site_name}',
  getText: (v) => {
    return '订单号: ' + v.order_no + '\n支付金额: ¥' + v.amount + '\n支付方式: ' + v.payment_method + '\n\n感谢您的使用！'
  },
  getHtml: (v) => {
    return '<div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">' +
      '<h2 style="color:#52c41a;">支付成功</h2>' +
      '<p>您好 ' + (v.username || '') + '，</p>' +
      '<p>您的订单支付已成功：</p>' +
      '<table style="border-collapse:collapse;width:100%;margin:15px 0;">' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>订单号</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.order_no + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>支付金额</strong></td><td style="padding:8px;border:1px solid #ddd;">¥' + v.amount + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>支付方式</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.payment_method + '</td></tr>' +
      '</table>' +
      '<p>感谢您的使用！</p>' +
      '<p style="color:#999;font-size:12px;">—— ' + (v.site_name || 'CloudHost') + '</p>' +
    '</div>'
  }
}

emailTemplates.service_activation = {
  subject: '服务已激活 - {site_name}',
  getText: (v) => {
    return '服务名称: ' + v.service_name + '\nIP地址: ' + v.ip_address + '\n用户名: ' + v.username + '\n到期时间: ' + v.expire_time + '\n\n请妥善保管您的登录信息！'
  },
  getHtml: (v) => {
    return '<div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">' +
      '<h2 style="color:#faad14;">服务已激活</h2>' +
      '<p>您好 ' + (v.user_name || v.username || '') + '，</p>' +
      '<p>您的服务已成功激活：</p>' +
      '<table style="border-collapse:collapse;width:100%;margin:15px 0;">' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>服务名称</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.service_name + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>IP地址</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.ip_address + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>用户名</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.username + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>到期时间</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.expire_time + '</td></tr>' +
      '</table>' +
      '<p>请妥善保管您的登录信息！</p>' +
      '<p style="color:#999;font-size:12px;">—— ' + (v.site_name || 'CloudHost') + '</p>' +
    '</div>'
  }
}

emailTemplates.password_reset = {
  subject: '密码重置 - {site_name}',
  getText: (v) => {
    return '您的密码已成功重置。\n新密码: ' + v.new_password + '\n\n如果不是您本人操作，请立即联系管理员。'
  },
  getHtml: (v) => {
    return '<div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">' +
      '<h2 style="color:#722ed1;">密码重置</h2>' +
      '<p>您好 ' + (v.username || '') + '，</p>' +
      '<p>您的密码已成功重置：</p>' +
      '<p><strong>新密码：</strong><code style="background:#f5f5f5;padding:2px 8px;border-radius:4px;">' + v.new_password + '</code></p>' +
      '<p style="color:#ff4d4f;">如果不是您本人操作，请立即联系管理员。</p>' +
      '<p style="color:#999;font-size:12px;">—— ' + (v.site_name || 'CloudHost') + '</p>' +
    '</div>'
  }
}

emailTemplates.voucher_redemption = {
  subject: '代金券兑换成功 - {site_name}',
  getText: (v) => {
    return '代金券编号: ' + v.voucher_code + '\n兑换金额: ¥' + v.amount + '\n余额: ¥' + v.balance + '\n\n感谢您的使用！'
  },
  getHtml: (v) => {
    return '<div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">' +
      '<h2 style="color:#1890ff;">代金券兑换成功</h2>' +
      '<p>您好 ' + (v.username || '') + '，</p>' +
      '<p>您的代金券兑换成功：</p>' +
      '<table style="border-collapse:collapse;width:100%;margin:15px 0;">' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>代金券编号</strong></td><td style="padding:8px;border:1px solid #ddd;">' + v.voucher_code + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>兑换金额</strong></td><td style="padding:8px;border:1px solid #ddd;">¥' + v.amount + '</td></tr>' +
        '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>当前余额</strong></td><td style="padding:8px;border:1px solid #ddd;">¥' + v.balance + '</td></tr>' +
      '</table>' +
      '<p>感谢您的使用！</p>' +
      '<p style="color:#999;font-size:12px;">—— ' + (v.site_name || 'CloudHost') + '</p>' +
    '</div>'
  }
}

const renderTemplate = (templateName, variables) => {
  const template = emailTemplates[templateName]
  if (!template) {
    return { subject: '通知', text: '', html: '' }
  }
  const siteName = variables.site_name || 'CloudHost'
  let subject = template.subject.replace('{site_name}', siteName)
  let text = template.getText(variables).replace(/{site_name}/g, siteName)
  let html = template.getHtml(variables).replace(/{site_name}/g, siteName)
  return { subject, text, html }
}

const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    await initTransporter()
  }
  
  if (!transporter) {
    console.log('[Email] ' + to + ' - ' + subject + ': ' + text)
    return true
  }
  
  try {
    const config = await getConfig()
    const fromEmail = config.smtp_from || process.env.SMTP_FROM || config.smtp_user || process.env.SMTP_USER
    
    await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: subject,
      text: text,
      html: html || text.replace(/\n/g, '<br>')
    })
    
    console.log('[Email] Sent to ' + to + ': ' + subject)
    return true
  } catch (error) {
    console.error('Email send failed:', error)
    return false
  }
}

const sendTemplateEmail = async (to, templateName, variables) => {
  const { subject, text, html } = renderTemplate(templateName, variables)
  return await sendEmail(to, subject, text, html)
}

// 初始化时尝试读取配置
initTransporter()

module.exports = { sendEmail, sendTemplateEmail, initTransporter, renderTemplate, emailTemplates }
