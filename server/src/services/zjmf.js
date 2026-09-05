/**
 * 智简魔方（IDCsmart / 魔方财务 / 魔方云）上游 API 驱动
 * ------------------------------------------------------------------
 * 用途：把“上游智简魔方平台”作为一个 cloudhost-manager 的节点(node.type='zjmf')，
 *      从而代理销售上游智简魔方产品（云服务器等）。
 *
 * 节点配置字段：
 *   host      上游站点地址，例如 https://mofang.example.com （不含末尾 /）
 *   api_user  上游 API 登录账号（手机号 / 邮箱）
 *   api_token 上游 API 密钥（在用户中心 -> API 管理 中生成）
 *   provider_config (JSON，可选)
 *     {
 *       "actions": { "login": "login_api", "products": "products", ... },  // 按上游文档覆盖默认动作名
 *       "auto_pay": true,   // 下单后是否使用上游账户余额自动支付（默认 true）
 *       "os_field": "os",   // 开通参数中镜像/操作系统字段名（默认 "os"）
 *       "hostname_field": "name" // 开通参数中主机名（备注名）字段名
 *     }
 *
 * 说明：
 *  - 上游智简魔方站点在“用户中心 -> API 管理”启用 API 登录后，提供开放 API，
 *    接口文档位于 {host}/document，动作名遵循 /v1/{action} 风格。
 *    已实测并采用官方规范：POST /v1/login_api {account,password} -> {jwt}，
 *    后续请求 Header：authorization: JWT <jwt>。
 *  - 不同部署安装的“云服务器/虚拟主机”模块不同，产品下单与主机管理的动作名
 *    会存在差异。下方 DEFAULT_ACTIONS 是常用约定值，可在 provider_config.actions
 *    中针对本节点覆盖（字段名见注释），无需改动代码。
 * ------------------------------------------------------------------
 */

const axios = require('axios')

// 默认动作名（可在节点 provider_config.actions 覆盖）。
// 若上游为魔方财务/魔方云，请在 {host}/document 文档中按模块核对下列动作路径。
const DEFAULT_ACTIONS = {
  // 登录：POST {host}/v1/{login}，body {account, password}
  login: 'login_api',
  // 会员信息：GET，用于连接测试/展示账户
  account: 'user',
  // 上游可售商品列表：GET，用于管理员映射本地产品
  products: 'products',
  // 商品详情/可开通配置：GET，query: { id, billing_cycle }
  productConfig: 'products_config',
  // 创建订单（购物车结算）：POST body { product_id, billing_cycle, qty, ... }
  createOrder: 'cart_checkout',
  // 使用余额支付订单：POST body { id, type:'balance' }
  payOrder: 'order_pay',
  // 订单详情：GET query { id }
  orderDetail: 'orders_detail',
  // ---- 主机(已开通产品) 管理 ----
  hostList: 'hosts',             // GET    我的主机/产品列表
  hostDetail: 'hosts_detail',    // GET    query { id }
  hostStatus: 'host_status',     // GET    query { id }
  hostStart: 'host_start',       // POST   body { id }
  hostStop: 'host_stop',         // POST   body { id }
  hostRestart: 'host_restart',   // POST   body { id }
  hostReinstall: 'host_reinstall', // POST body { id, os, password? }
  hostPassword: 'host_password', // POST   body { id, password }
  hostDestroy: 'host_destroy'    // POST   body { id }
}

const jwtCache = new Map() // nodeId -> { jwt, at }

function getNodeConfig(node) {
  let cfg = {}
  if (node.provider_config) {
    try { cfg = JSON.parse(node.provider_config) || {} } catch (e) { cfg = {} }
  }
  return cfg
}

function pick(obj, keys) {
  if (obj == null) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]
  }
  return undefined
}

// 上游统一响应体解析：兼容 {code/status/status:0/1|success} + {data}
function unwrap(response) {
  if (!response) return { ok: false, message: '上游返回为空' }
  if (response.ok !== undefined) return response
  const statusVal = pick(response, ['status', 'code', 'ret', 'success'])
  const data = pick(response, ['data', 'result'])
  // 兼容布尔 / 数值 / 字符串
  let ok = false
  if (typeof statusVal === 'boolean') ok = statusVal
  else if (typeof statusVal === 'number') ok = statusVal === 1 || statusVal === 200 || statusVal === 0
  else if (typeof statusVal === 'string') ok = ['1', '200', 'success', 'true'].includes(String(statusVal).toLowerCase())
  if (!ok) {
    const message = pick(response, ['message', 'msg', 'error', 'errorMessage']) || '上游返回错误'
    return { ok: false, message: String(message), raw: response }
  }
  return { ok: true, data, raw: response }
}

class ZJMFClient {
  constructor(node) {
    this.node = node
    this.cfg = getNodeConfig(node)
    this.base = String(node.host || '').replace(/\/+$/, '')
  }

  action(name) {
    const overrides = this.cfg.actions || {}
    return overrides[name] || DEFAULT_ACTIONS[name] || ''
  }

  /**
   * 发送上游请求
   * @param {string} actionName DEFAULT_ACTIONS 的键
   * @param {object} opts { method, query, body, auth, contentType }
   */
  async request(actionName, opts = {}) {
    const action = this.action(actionName)
    if (!action) {
      const err = new Error(`[智简魔方] 动作 ${actionName} 未配置，请在上游 {host}/document 文档中查找并写入节点 provider_config.actions.${actionName}`)
      err.code = 'ZJMF_NO_ACTION'
      throw err
    }
    const method = (opts.method || 'GET').toUpperCase()
    let url
    if (/^https?:\/\//i.test(action)) url = action
    else url = `${this.base}/v1/${action}`
    const headers = { 'Content-Type': 'application/json' }
    if (opts.auth !== false) {
      const jwt = await this.login()
      headers['authorization'] = 'JWT ' + jwt
    }
    const config = { method, url, headers, timeout: 60000 }
    if (method === 'GET') config.params = opts.query
    else config.data = opts.body || {}

    let res
    try {
      res = await axios(config)
    } catch (e) {
      const detail = e.response?.data ? JSON.stringify(e.response.data).slice(0, 500) : e.message
      const err = new Error(`[智简魔方] 请求 ${url} 失败: ${detail}`)
      err.code = 'ZJMF_HTTP'
      throw err
    }
    const parsed = unwrap(res.data)
    if (!parsed.ok) {
      const err = new Error(`[智简魔方] 接口 ${url} 返回错误: ${parsed.message}`)
      err.code = 'ZJMF_API'
      err.raw = parsed.raw
      throw err
    }
    return parsed.data
  }

  /** 登录获取 JWT（缓存 2 小时内复用，超时自动重登） */
  async login() {
    const key = this.node.id
    const cached = jwtCache.get(key)
    if (cached && cached.at && Date.now() - cached.at < 110 * 60 * 1000) return cached.jwt

    const action = this.action('login') || 'login_api'
    const url = /^https?:\/\//i.test(action) ? action : `${this.base}/v1/${action}`
    const body = {
      account: this.node.api_user,
      password: this.node.api_token
    }
    let res
    try {
      res = await axios.post(url, body, { timeout: 30000 })
    } catch (e) {
      const detail = e.response?.data ? JSON.stringify(e.response.data).slice(0, 400) : e.message
      throw new Error(`[智简魔方] 登录失败（请检查 站点地址/API账号/API密钥）: ${detail}`)
    }
    const parsed = unwrap(res.data)
    if (!parsed.ok) {
      throw new Error(`[智简魔方] 登录失败: ${parsed.message}`)
    }
    const jwt = pick(parsed, ['jwt', 'token', 'access_token']) || pick(parsed.data, ['jwt', 'token', 'access_token'])
    if (!jwt) {
      throw new Error(`[智简魔方] 登录接口未返回 jwt/token，请核对上游文档`)
    }
    jwtCache.set(key, { jwt, at: Date.now() })
    return jwt
  }

  /** 连接测试 */
  async testConnection() {
    const jwt = await this.login()
    let account = null
    try {
      account = await this.request('account', { auth: true })
    } catch (e) {
      // 获取会员信息失败不阻断（部分部署不允许该动作）
      if (e.code === 'ZJMF_NO_ACTION') account = null
    }
    return {
      success: true,
      message: `智简魔方 API 连接成功`,
      data: { jwt_expires_in: '约2小时(自动续期)', account }
    }
  }

  /** 上游可售产品列表（供管理员创建本地产品映射） */
  async listProducts() {
    const data = await this.request('products', { auth: true })
    // 兼容 data 直接为数组或 data.list/rows
    const list = Array.isArray(data) ? data : (data?.list || data?.rows || [])
    return list.map((p) => ({
      id: String(pick(p, ['id', 'product_id', 'pid']) ?? ''),
      name: pick(p, ['name', 'product_name', 'title']) || '',
      group: pick(p, ['group_name', 'group', 'category']) || '',
      type: pick(p, ['type', 'module', 'module_name']) || '',
      cycles: pick(p, ['billing_cycles', 'cycles', 'pay_type']) || [],
      os_list: pick(p, ['os_list', 'images', 'system', 'templates']) || [],
      raw: p
    }))
  }

  /** 上游某商品可开通配置（周期/镜像/参数），用于创建本地镜像表 */
  async getProductConfig(upstreamProductId) {
    const data = await this.request('productConfig', {
      auth: true,
      query: { id: upstreamProductId, product_id: upstreamProductId }
    })
    return data
  }

  /**
   * 代理开通：向上游下订单并支付，等待开通后返回远端主机信息。
   * @returns {Promise<{orderId, hostId, host}>}
   */
  async provisionUpstreamHost({ upstreamProductId, billingCycle, quantity = 1, name, os, password, extra = {} }) {
    if (!upstreamProductId) throw new Error('缺少上游产品ID（请先在管理后台为产品填写“上游产品ID”）')
    const cycle = billingCycle || 'monthly'
    const body = {
      product_id: upstreamProductId,
      billing_cycle: cycle,
      qty: quantity || 1,
      [this.cfg.hostname_field || 'name']: name || 'vps'
    }
    if (os) body[this.cfg.os_field || 'os'] = os
    if (password) body.password = password
    Object.assign(body, extra || {})

    const orderData = await this.request('createOrder', { auth: true, method: 'POST', body })
    const orderId = String(pick(orderData, ['id', 'order_id', 'invoice_id']) ?? '')
    let autoPay = this.cfg.auto_pay !== false
    if (autoPay && orderId) {
      try {
        await this.request('payOrder', {
          auth: true,
          method: 'POST',
          body: { id: orderId, order_id: orderId, type: 'balance' }
        })
      } catch (e) {
        if (e.code !== 'ZJMF_NO_ACTION') throw e
      }
    }
    return { orderId, upstreamProductId, cycle }
  }

  /** 查询远端主机/订单开通结果（hostId 或 orderId 二选一） */
  async fetchRemoteHost({ hostId, orderId }) {
    let data
    if (hostId) {
      data = await this.request('hostDetail', { auth: true, query: { id: hostId, host_id: hostId } })
    } else if (orderId) {
      try {
        data = await this.request('orderDetail', { auth: true, query: { id: orderId } })
      } catch (e) {
        data = null
      }
    }
    if (!data) return null
    // 兼容返回体包含 host / product / order 等
    const rawHost = pick(data, ['host', 'product', 'data', 'order']) || data
    return this.normalizeHost(rawHost)
  }

  normalizeHost(h) {
    if (!h) return null
    const hostId = pick(h, ['id', 'host_id', 'hostid', 'cloud_id', 'server_id', 'vmid']) ?? ''
    return {
      id: String(hostId),
      name: pick(h, ['name', 'hostname', 'remark', 'label']) || '',
      os: pick(h, ['os', 'os_name', 'system', 'template']) || '',
      ipv4: pick(h, ['ip', 'ipv4', 'ip_address', 'main_ip', 'dedicatedip']) || '',
      ipv6: pick(h, ['ipv6', 'ipv6_address']) || '',
      status: pick(h, ['status', 'power_status', 'state']) || '',
      password: pick(h, ['password', 'vnc_password']) || '',
      username: pick(h, ['username', 'user', 'root_password']) || '',
      raw: h
    }
  }

  /** 远端账户下的主机列表（用于节点同步） */
  async listRemoteHosts() {
    const data = await this.request('hostList', { auth: true })
    const list = Array.isArray(data) ? data : (data?.list || data?.rows || [])
    return list.map((h) => this.normalizeHost(h)).filter(Boolean)
  }

  /** 获取账户概况（节点状态展示） */
  async getNodeStatus() {
    let account = {}
    try { account = await this.request('account', { auth: true }) } catch (e) { /* 忽略 */ }
    let hosts = []
    try {
      hosts = await this.listRemoteHosts()
    } catch (e) {
      // 部分部署不允许直接拉取主机列表
      if (e.code !== 'ZJMF_NO_ACTION') console.warn('[ZJMF] 拉取远端主机列表失败:', e.message)
    }
    return {
      cpu_usage: 0,
      memory_usage: 0,
      memory_total: 0,
      account,
      remote_hosts: hosts.length
    }
  }

  // ---- 下面方法与 PVEClient 保持同名，便于 VMService 无差别调用 ----
  async startVM(vmid, type) {
    await this.request('hostStart', { auth: true, method: 'POST', body: { id: vmid, host_id: vmid } })
    return { vmid }
  }
  async stopVM(vmid, type) {
    await this.request('hostStop', { auth: true, method: 'POST', body: { id: vmid, host_id: vmid } })
    return { vmid }
  }
  async restartVM(vmid, type) {
    await this.request('hostRestart', { auth: true, method: 'POST', body: { id: vmid, host_id: vmid } })
    return { vmid }
  }
  async resetPassword(vmid, password, type) {
    await this.request('hostPassword', { auth: true, method: 'POST', body: { id: vmid, host_id: vmid, password } })
    return { vmid }
  }
  async reinstallVM(vmid, template, type) {
    await this.request('hostReinstall', { auth: true, method: 'POST', body: { id: vmid, host_id: vmid, os: template, image: template } })
    return { vmid }
  }
  async getVMStatus(vmid, type) {
    let data = {}
    try {
      data = await this.request('hostStatus', { auth: true, query: { id: vmid, host_id: vmid } })
    } catch (e) {
      if (e.code === 'ZJMF_NO_ACTION') {
        return { status: 'unknown', cpu_usage: 0, memory_usage: 0, disk_usage: 0 }
      }
      throw e
    }
    const h = this.normalizeHost(data) || {}
    const status = String(h.status || '').toLowerCase()
    let mapped = 'stopped'
    if (['running', 'active', '1', 'on', 'online', '开机'].includes(status)) mapped = 'running'
    else if (['stopped', '0', 'off', 'suspend', 'paused'].includes(status)) mapped = 'stopped'
    return { status: mapped, cpu_usage: 0, memory_usage: 0, disk_usage: 0, info: h }
  }
  async getVMStats(vmid, type) {
    const s = await this.getVMStatus(vmid, type)
    return { cpu: s.cpu_usage || 0, memory: s.memory_usage || 0, disk: s.disk_usage || 0, network_usage: 'N/A' }
  }
  async deleteKVM(vmid, type) {
    return this.destroyHost(vmid)
  }
  async deleteLXC(vmid, type) {
    return this.destroyHost(vmid)
  }
  async destroyHost(vmid) {
    await this.request('hostDestroy', { auth: true, method: 'POST', body: { id: vmid, host_id: vmid } })
    return { vmid }
  }
  getVNCUrl() { throw new Error('智简魔方节点暂不支持 VNC，请在上游智简魔方控制台使用') }
  getVNC() { throw new Error('智简魔方节点暂不支持 VNC，请在上游智简魔方控制台使用') }
  getConsole() { throw new Error('智简魔方节点暂不支持网页控制台，请在上游智简魔方控制台操作') }
  getNodeImages() { throw new Error('请使用“同步镜像/产品信息”按钮') }
  getIsoImages() { return [] }
  getQemuVMs() { throw new Error('智简魔方节点请使用同步远端主机') }
  getLxcVMs() { return [] }
}

const clientMap = new Map() // nodeId -> { fp, client }

function fpOf(node) {
  return [node.id, node.host, node.api_user, node.api_token, node.provider_config].join('\u0001')
}

function getClient(node) {
  const fp = fpOf(node)
  const hit = clientMap.get(node.id)
  if (hit && hit.fp === fp) return hit.client
  const client = new ZJMFClient(node)
  clientMap.set(node.id, { fp, client })
  return client
}

module.exports = { ZJMFClient, getClient, unwrap }
