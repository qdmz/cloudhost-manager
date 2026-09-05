/**
 * 数据库迁移脚本
 * 添加节点表 / 镜像表 / 产品表的缺失字段（兼容 MySQL 与 MariaDB，幂等可重复执行）
 * 运行方式: node src/scripts/migrate.js   （通过迁移统一执行）
 */

const { addColumnIfMissing } = require('./_utils')

async function up(sequelize) {
  console.log('== [001] 节点/镜像/产品基础字段 ==')

  // 节点表字段
  await addColumnIfMissing(sequelize, 'nodes', 'ipv4_range_start', 'ipv4_range_start VARCHAR(50) DEFAULT NULL')
  await addColumnIfMissing(sequelize, 'nodes', 'ipv4_range_end', 'ipv4_range_end VARCHAR(50) DEFAULT NULL')
  await addColumnIfMissing(sequelize, 'nodes', 'ipv6_prefix', 'ipv6_prefix VARCHAR(100) DEFAULT NULL')
  await addColumnIfMissing(sequelize, 'nodes', 'ssh_host', 'ssh_host VARCHAR(255) DEFAULT NULL')
  await addColumnIfMissing(sequelize, 'nodes', 'ssh_port', 'ssh_port INT DEFAULT 22')
  await addColumnIfMissing(sequelize, 'nodes', 'ssh_username', "ssh_username VARCHAR(50) DEFAULT 'root'")
  await addColumnIfMissing(sequelize, 'nodes', 'ssh_password', 'ssh_password VARCHAR(255) DEFAULT NULL')
  await addColumnIfMissing(sequelize, 'nodes', 'ssh_enabled', 'ssh_enabled TINYINT(1) DEFAULT 0')

  // 镜像表 type 字段
  await addColumnIfMissing(sequelize, 'images', 'type', "type ENUM('lxc','vm') DEFAULT 'lxc'")

  // 产品表 image_id 字段
  await addColumnIfMissing(sequelize, 'products', 'image_id', 'image_id INT DEFAULT NULL')

  console.log('== [001] 完成 ==')
}

module.exports = { up }
