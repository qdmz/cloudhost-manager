/**
 * 数据库迁移脚本
 * 添加节点表的缺失字段
 * 运行方式: node src/migrations/001_add_node_fields.js
 */

const { sequelize } = require('../models')

async function migrate() {
  try {
    console.log('开始执行数据库迁移...')
    
    // 添加节点表的字段
    await sequelize.query(`
      ALTER TABLE nodes 
      ADD COLUMN IF NOT EXISTS ipv4_range_start VARCHAR(50) DEFAULT NULL AFTER max_ports_per_vm,
      ADD COLUMN IF NOT EXISTS ipv4_range_end VARCHAR(50) DEFAULT NULL AFTER ipv4_range_start,
      ADD COLUMN IF NOT EXISTS ipv6_prefix VARCHAR(100) DEFAULT NULL AFTER ipv4_range_end,
      ADD COLUMN IF NOT EXISTS ssh_host VARCHAR(255) DEFAULT NULL AFTER host,
      ADD COLUMN IF NOT EXISTS ssh_port INT DEFAULT 22 AFTER ssh_host,
      ADD COLUMN IF NOT EXISTS ssh_username VARCHAR(50) DEFAULT 'root' AFTER ssh_port,
      ADD COLUMN IF NOT EXISTS ssh_password VARCHAR(255) DEFAULT NULL AFTER ssh_username,
      ADD COLUMN IF NOT EXISTS ssh_enabled TINYINT(1) DEFAULT 0 AFTER ssh_password
    `)
    
    console.log('✓ 节点表字段添加完成')
    
    // 添加镜像表的 type 字段
    await sequelize.query(`
      ALTER TABLE images 
      ADD COLUMN IF NOT EXISTS type ENUM('lxc', 'vm') DEFAULT 'lxc' AFTER arch
    `)
    
    console.log('✓ 镜像表 type 字段添加完成')
    
    // 添加 products 表的 image_id 字段（如果不存在）
    await sequelize.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS image_id INT DEFAULT NULL AFTER node_id
    `)
    
    console.log('✓ 产品表 image_id 字段添加完成')
    
    console.log('数据库迁移完成！')
  } catch (error) {
    console.error('迁移失败:', error.message)
    throw error
  } finally {
    await sequelize.close()
  }
}

migrate()
