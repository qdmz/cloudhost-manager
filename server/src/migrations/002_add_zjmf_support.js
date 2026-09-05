/**
 * 数据库迁移 002：智简魔方(zjmf) 节点 + 自动开通/支付回写所需字段
 * 幂等：基于 information_schema 守卫，MySQL/MariaDB 均可重复执行。
 *   - nodes.type 扩展 'zjmf'；nodes 增加 provider_config
 *   - products.type / default_type 扩展 'zjmf'；products 增加上游映射字段
 *   - services.type 扩展 'zjmf'；services 增加 order_id / image_id
 *   - orders 增加 trade_no（支付回调回写）
 */

const { addColumnIfMissing, extendEnum } = require('./_utils')

async function up(sequelize) {
  console.log('== [002] 智简魔方节点/自动开通字段 ==')

  // nodes
  await extendEnum(sequelize, 'nodes', 'type', ['zjmf'])
  await addColumnIfMissing(sequelize, 'nodes', 'provider_config', 'provider_config TEXT')

  // products
  await extendEnum(sequelize, 'products', 'type', ['zjmf'])
  await extendEnum(sequelize, 'products', 'default_type', ['zjmf'])
  await addColumnIfMissing(sequelize, 'products', 'upstream_product_id', 'upstream_product_id VARCHAR(64) DEFAULT NULL')
  await addColumnIfMissing(sequelize, 'products', 'upstream_data', 'upstream_data TEXT')

  // services
  await extendEnum(sequelize, 'services', 'type', ['zjmf'])
  await addColumnIfMissing(sequelize, 'services', 'order_id', 'order_id INT DEFAULT NULL')
  await addColumnIfMissing(sequelize, 'services', 'image_id', 'image_id INT DEFAULT NULL')

  // orders
  await addColumnIfMissing(sequelize, 'orders', 'trade_no', 'trade_no VARCHAR(64) DEFAULT NULL')

  console.log('== [002] 完成 ==')
}

module.exports = { up }
