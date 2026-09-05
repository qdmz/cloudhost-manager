/**
 * 迁移工具函数：MySQL 兼容的幂等 DDL（information_schema 守卫）
 */

async function hasColumn(sequelize, table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    { replacements: [table, column] }
  )
  return parseInt(rows[0] && rows[0].cnt, 10) > 0
}

async function addColumnIfMissing(sequelize, table, column, ddl) {
  if (await hasColumn(sequelize, table, column)) {
    console.log(`  · ${table}.${column} 已存在，跳过`)
    return
  }
  await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
  console.log(`  ✓ ${table}.${column} 已添加`)
}

async function enumValuesOf(sequelize, table, column) {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_TYPE FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    { replacements: [table, column] }
  )
  if (!rows[0]) return null
  const m = String(rows[0].COLUMN_TYPE).match(/^enum\((.*)\)$/)
  if (!m) return null
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^'|'$/g, ''))
}

/** 将 ENUM 列扩展为包含新值（保持原有顺序、仅追加） */
async function extendEnum(sequelize, table, column, newValues, notNullDefault = null) {
  const existing = await enumValuesOf(sequelize, table, column)
  if (!existing) {
    console.warn(`  ! ${table}.${column} 不是 ENUM 或不存在，跳过`)
    return
  }
  const need = newValues.filter((v) => !existing.includes(v))
  if (!need.length) {
    console.log(`  · ${table}.${column} 已包含新值，跳过`)
    return
  }
  const merged = [...existing, ...need]
  const enumSql = merged.map((v) => `'${v}'`).join(',')
  let sql = `ALTER TABLE ${table} MODIFY COLUMN ${column} ENUM(${enumSql})`
  if (notNullDefault) sql += ` NOT NULL DEFAULT '${notNullDefault}'`
  await sequelize.query(sql)
  console.log(`  ✓ ${table}.${column} 枚举扩展为: ${merged.join(',')}`)
}

module.exports = { hasColumn, addColumnIfMissing, enumValuesOf, extendEnum }
