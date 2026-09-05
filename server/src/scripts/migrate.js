/**
 * 数据库迁移执行器
 * 运行方式: 在 server/ 目录执行  node src/scripts/migrate.js
 * 会按文件名顺序执行 src/migrations/ 下所有导出 { up } 的迁移（幂等）。
 */

const fs = require('fs')
const path = require('path')
const sequelize = require('../config/database')

async function run() {
  const dir = path.join(__dirname, '..', 'migrations')
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d+_.+\.js$/.test(f))
    .sort()

  try {
    await sequelize.authenticate()
    console.log(`数据库连接成功，共发现 ${files.length} 个迁移文件`)
  } catch (err) {
    console.error('数据库连接失败，请检查 server/.env 或根目录 .env 配置:', err.message)
    process.exit(1)
  }

  for (const file of files) {
    const filePath = path.join(dir, file)
    delete require.cache[require.resolve(filePath)]
    const mod = require(filePath)
    if (mod && typeof mod.up === 'function') {
      try {
        await mod.up(sequelize)
      } catch (err) {
        console.error(`迁移 ${file} 执行失败:`, err.message)
        process.exit(1)
      }
    }
  }

  await sequelize.close()
  console.log('全部迁移执行完成')
}

run()
