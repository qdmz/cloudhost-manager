/**
 * 邮件发送服务 - 支持模板
 */

const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs')
const dayjs = require('dayjs')

class EmailService {
  constructor() {
    this.transporter = null
    this.templates = {}
    this.initTransporter()
    this.loadTemplates()
  }

  initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.qq.com',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      })
    } catch (error) {
      console.error('[Email] Transporter init failed:', error.message)
    }
  }

  loadTemplates() {
    // 内置邮件模板
    this.templates = {
      email_verify: {
        subject: '邮箱验证 - CloudHost',
        html: (data) => `
          <div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">
            <h2 style="color:#1890ff;">邮箱验证</h2>
            <p>您正在验证邮箱 ${data.email}，请输入以下验证码：</p>
            <div style="text-align:center;padding:20px;background:#f0f5ff;border-radius:8px;margin:20px 0;">
              <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1890ff;">${data.code}</span>
            </div>
            <p>验证码有效期为 10 分钟，请尽快验证。</p>
            <p style="color:#999;font-size:12px;">如果您没有请求验证邮箱，请忽略此邮件。</p>
          </div>`
      },
      password_reset: {
        subject: '重置密码 - CloudHost',
        html: (data) => `
          <div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">
            <h2 style="color:#1890ff;">重置密码</h2>
            <p>您正在重置 CloudHost 账户密码。</p>
            <div style="text-align:center;padding:20px;background:#f0f5ff;border-radius:8px;margin:20px 0;">
              <a href="${data.resetUrl}" style="display:inline-block;padding:12px 30px;background:#1890ff;color:#fff;text-decoration:none;border-radius:4px;">重置密码</a>
            </div>
            <p>链接有效期为 30 分钟，请尽快操作。</p>
            <p style="color:#999;font-size:12px;">如果您没有请求重置密码，请忽略此邮件。</p>
          </div>`
      },
      login_notify: {
        subject: '登录通知 - CloudHost',
        html: (data) => `
          <div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">
            <h2 style="color:#52c41a;">登录通知</h2>
            <p>您的账户 ${data.email} 于 ${data.time} 成功登录。</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;border:1px solid #eee;">登录地点</td><td style="padding:8px;border:1px solid #eee;">${data.location || '未知'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">IP 地址</td><td style="padding:8px;border:1px solid #eee;">${data.ip || '未知'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">浏览器</td><td style="padding:8px;border:1px solid #eee;">${data.browser || '未知'}</td></tr>
            </table>
            <p style="color:#999;font-size:12px;">如非本人操作，请立即修改密码。</p>
          </div>`
      },
      order_notify: {
        subject: '订单通知 - CloudHost',
        html: (data) => `
          <div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">
            <h2 style="color:#1890ff;">订单通知</h2>
            <p>您的订单 <strong>${data.orderNo}</strong> 已${data.status}。</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;border:1px solid #eee;">商品</td><td style="padding:8px;border:1px solid #eee;">${data.productName}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">配置</td><td style="padding:8px;border:1px solid #eee;">${data.planName}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">金额</td><td style="padding:8px;border:1px solid #eee;">¥${data.amount}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">时间</td><td style="padding:8px;border:1px solid #eee;">${data.time}</td></tr>
            </table>
          </div>`
      },
      product_activated: {
        subject: '服务已开通 - CloudHost',
        html: (data) => `
          <div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">
            <h2 style="color:#52c41a;">服务已开通</h2>
            <p>您的服务 <strong>${data.serviceName}</strong> 已开通成功！</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;border:1px solid #eee;">服务器 IP</td><td style="padding:8px;border:1px solid #eee;">${data.ipv4 || '—'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">IPv6</td><td style="padding:8px;border:1px solid #eee;">${data.ipv6 || '—'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">SSH 命令</td><td style="padding:8px;border:1px solid #eee;">ssh root@${data.ipv4}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">密码</td><td style="padding:8px;border:1px solid #eee;">${data.password || '—'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">到期时间</td><td style="padding:8px;border:1px solid #eee;">${data.expireTime}</td></tr>
            </table>
            <p style="color:#999;font-size:12px;">请及时登录控制台管理您的服务。</p>
          </div>`
      },
      expiration_reminder: {
        subject: '到期提醒 - CloudHost',
        html: (data) => `
          <div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">
            <h2 style="color:#faad14;">服务到期提醒</h2>
            <p>您的服务 <strong>${data.serviceName}</strong> 将在 <strong>${data.daysLeft} 天</strong> 后到期。</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;border:1px solid #eee;">到期时间</td><td style="padding:8px;border:1px solid #eee;">${data.expireTime}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;">服务器 IP</td><td style="padding:8px;border:1px solid #eee;">${data.ipv4 || '—'}</td></tr>
            </table>
            <p>请及时续费，以免影响服务使用。</p>
          </div>`
      },
      order_expire: {
        subject: '服务已到期 - CloudHost',
        html: (data) => `
          <div style="max-width:600px;margin:0 auto;padding:20px;font-family:sans-serif;">
            <h2 style="color:#ff4d4f;">服务已到期</h2>
            <p>您的服务 <strong>${data.serviceName}</strong> 已于 ${data.expireTime} 到期。</p>
            <p>请尽快续费以继续使用您的服务。</p>
          </div>`
      }
    }
  }

  // 获取所有模板
  getTemplates() {
    return Object.keys(this.templates).map(key => ({
      key,
      name: key,
      subject: this.templates[key].subject
    }))
  }

  // 根据模板 key 和变量生成 HTML
  renderTemplate(key, data) {
    const template = this.templates[key]
    if (!template) {
      throw new Error(`模板不存在: ${key}`)
    }
    return {
      subject: template.subject,
      html: template.html(data)
    }
  }

  // 发送模板邮件
  async sendTemplate(to, templateKey, data) {
    try {
      const { subject, html } = this.renderTemplate(templateKey, data)
      
      if (!this.transporter) {
        this.initTransporter()
        if (!this.transporter) throw new Error('邮件服务未配置')
      }

      const info = await this.transporter.sendMail({
        from: `"CloudHost" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html
      })

      console.log('[Email] Template sent:', templateKey, 'to', to)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('[Email] Send template error:', error.message)
      throw new Error('发送失败: ' + error.message)
    }
  }

  // 发送普通邮件
  async send(to, subject, html) {
    try {
      if (!this.transporter) {
        this.initTransporter()
        if (!this.transporter) throw new Error('邮件服务未配置')
      }

      const info = await this.transporter.sendMail({
        from: `"CloudHost" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html
      })

      console.log('[Email] Sent to:', to)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('[Email] Send error:', error.message)
      throw new Error('发送失败: ' + error.message)
    }
  }

  // 测试 SMTP 连接
  async testConnection() {
    if (!this.transporter) {
      this.initTransporter()
    }
    if (!this.transporter) throw new Error('邮件服务未配置')
    
    try {
      await this.transporter.verify()
      return { success: true, message: 'SMTP 连接成功' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 添加自定义模板
  addTemplate(key, subject, htmlFn) {
    this.templates[key] = { subject, html: htmlFn }
  }
}

module.exports = new EmailService()

// Alias for backward compatibility
module.exports.emailTemplates = new EmailService().templates
module.exports.sendTemplateEmail = (to, key, data) => { const s = new EmailService(); return s.sendTemplate(to, key, data) }
module.exports.sendEmail = (to, subject, html) => { const s = new EmailService(); return s.send(to, subject, html) }
module.exports.initTransporter = (cfg) => { const s = new EmailService(); return s.initTransporter() }

