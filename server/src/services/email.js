const nodemailer = require('nodemailer')

let transporter = null

const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }
}

const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    console.log(`[Email] ${to} - ${subject}: ${text}`)
    return true
  }
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    })
    return true
  } catch (error) {
    console.error('Email send failed:', error)
    return false
  }
}

initTransporter()

module.exports = { sendEmail }
