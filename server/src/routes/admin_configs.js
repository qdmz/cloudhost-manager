const express = require('express');
const router = express.Router();
const { Config } = require('../models');
const { sendTemplateEmail, getSiteUrl, getConfigs, initTransporter } = require('../services/email');
const nodemailer = require('nodemailer');

router.get('/', async (req, res) => {
  try {
    const configs = await Config.findAll();
    res.json({ code: 200, data: configs });
  } catch (error) {
    res.json({ code: 500, message: error.message });
  }
});

router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type } = req.body;
    
    let config = await Config.findOne({ where: { key } });
    if (!config) {
      config = await Config.create({ key, value: value || '', type: type || 'string' });
    } else {
      config.value = value || '';
      config.type = type || config.type;
      await config.save();
    }
    
    if (key.startsWith('smtp_') || key === 'smtp_from') {
      await initTransporter();
    }
    
    res.json({ code: 200, message: '配置已更新', data: config });
  } catch (error) {
    res.json({ code: 500, message: error.message });
  }
});

router.post('/test-smtp', async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure } = req.body;
    const transport = nodemailer.createTransport({
      host: smtp_host,
      port: parseInt(smtp_port) || 465,
      secure: smtp_secure === 'true' || smtp_secure === true,
      auth: { user: smtp_user, pass: smtp_pass }
    });
    await transport.verify();
    res.json({ code: 200, message: 'SMTP 连接成功' });
  } catch (error) {
    res.json({ code: 500, message: 'SMTP 连接失败: ' + error.message });
  }
});

router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.json({ code: 400, message: '请输入测试邮箱' });
    
    const siteUrl = await getSiteUrl();
    const result = await sendTemplateEmail(to, 'password_reset', {
      username: '测试用户', new_password: 'Test@123',
      site_name: 'CloudHost', site_url: siteUrl
    });
    
    res.json(result ? { code: 200, message: '测试邮件已发送' } : { code: 500, message: '邮件发送失败' });
  } catch (error) {
    res.json({ code: 500, message: '邮件发送失败: ' + error.message });
  }
});

module.exports = router;
