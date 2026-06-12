const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Backup, Config } = require('../models');

const BACKUP_DIR = '/root/cloudhost-manager/backups';

// Get backups list
router.get('/', async (req, res) => {
  try {
    const backups = await Backup.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ code: 200, data: { list: backups } });
  } catch (error) {
    res.json({ code: 500, message: error.message });
  }
});

// Create backup
router.post('/', async (req, res) => {
  try {
    const { type } = req.body || {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `backup_${type || 'full'}_${timestamp}`;
    
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const backupPath = path.join(BACKUP_DIR, `${name}.sql.gz`);
    
    // Get DB config
    const configs = await Config.findAll();
    const configMap = {};
    configs.forEach(c => { configMap[c.key] = c.value; });
    
    const dbHost = configMap.db_host || 'localhost';
    const dbPort = configMap.db_port || 3306;
    const dbName = configMap.db_name;
    const dbUser = configMap.db_user;
    const dbPass = configMap.db_pass;
    
    if (!dbName || !dbUser || !dbPass) {
      return res.json({ code: 400, message: '数据库配置不完整' });
    }
    
    // Create MySQL dump
    const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} | gzip > ${backupPath}`;
    execSync(command, { timeout: 300000 }); // 5 min timeout
    
    const stats = fs.statSync(backupPath);
    const backup = await Backup.create({
      name: `${name}.sql.gz`,
      type: type || 'full',
      size: stats.size,
      status: 'completed'
    });
    
    res.json({ code: 200, message: '备份创建成功', data: backup });
  } catch (error) {
    res.json({ code: 500, message: '备份失败: ' + error.message });
  }
});

// Download backup
router.get('/:name/download', (req, res) => {
  const name = req.params.name;
  const filePath = path.join(BACKUP_DIR, name);
  
  if (!fs.existsSync(filePath)) {
    return res.json({ code: 404, message: '备份文件不存在' });
  }
  
  res.download(filePath, name);
});

// Restore from backup
router.post('/:name/restore', async (req, res) => {
  try {
    const name = req.params.name;
    const filePath = path.join(BACKUP_DIR, name);
    
    if (!fs.existsSync(filePath)) {
      return res.json({ code: 404, message: '备份文件不存在' });
    }
    
    const backup = await Backup.findOne({ where: { name } });
    if (!backup) {
      return res.json({ code: 404, message: '备份记录不存在' });
    }
    
    // Get DB config
    const configs = await Config.findAll();
    const configMap = {};
    configs.forEach(c => { configMap[c.key] = c.value; });
    
    const dbHost = configMap.db_host || 'localhost';
    const dbPort = configMap.db_port || 3306;
    const dbName = configMap.db_name;
    const dbUser = configMap.db_user;
    const dbPass = configMap.db_pass;
    
    if (!dbName || !dbUser || !dbPass) {
      return res.json({ code: 400, message: '数据库配置不完整' });
    }
    
    // Restore database
    const command = `gunzip -c ${filePath} | mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName}`;
    execSync(command, { timeout: 300000 });
    
    // Update backup status
    backup.status = 'restored';
    backup.restoredAt = new Date();
    await backup.save();
    
    res.json({ code: 200, message: '恢复成功' });
  } catch (error) {
    res.json({ code: 500, message: '恢复失败: ' + error.message });
  }
});

// Delete backup
router.delete('/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const filePath = path.join(BACKUP_DIR, name);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await Backup.destroy({ where: { name } });
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    res.json({ code: 500, message: error.message });
  }
});

module.exports = router;
