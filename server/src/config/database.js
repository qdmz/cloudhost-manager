const { Sequelize } = require('sequelize')
require('dotenv').config()

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'cloudhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: { timestamps: true, underscored: true }
})

module.exports = sequelize
