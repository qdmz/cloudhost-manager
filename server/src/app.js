require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") })

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const http = require('http')
const path = require('path')

const app = express()
const PORT = process.env.APP_PORT || 8080

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}))

app.use((req, res, next) => {
  res.set({
    'Cross-Origin-Opener-Policy': 'unsafe-none',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cross-Origin-Allow-Mixed': 'anonymous'
  })
  next()
})
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const CLIENT_DIST = path.join(__dirname, '../../client/dist')
app.use(express.static(CLIENT_DIST))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/captcha', require('./routes/captcha'))
app.use('/api/user', require('./routes/user'))
app.use('/api/products', require('./routes/products'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/services', require('./routes/services'))
app.use('/api/nodes', require('./routes/nodes'))
app.use('/api/recharge', require('./routes/recharge'))
app.use('/api/tickets', require('./routes/tickets'))
app.use('/api/announcements', require('./routes/announcements'))
app.use('/api/vouchers', require('./routes/vouchers'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/pay', require('./routes/pay'))
app.use('/api/domain-bindings', require('./routes/domain_bindings'))
app.use('/api/port-forwards', require('./routes/port_forwards'))
app.use('/api/console', require('./routes/console'))
app.use('/api/backup', require('./routes/admin_backups'))

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'OK' })
})

app.get('/api/test-auth', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    res.json({ code: 200, message: 'Test auth endpoint', token: token ? 'provided' : 'not provided' })
  } catch (error) {
    res.json({ code: 500, message: error.message })
  }
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ code: 500, message: '服务器错误' })
})

app.get('*', (req, res) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'))
})

// Create HTTP server and mount WebSocket
const server = http.createServer(app)
const { init } = require('./routes/consoleWs')
init(server)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})

module.exports = app
