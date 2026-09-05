/**
 * 服务开通（自动开通）公共逻辑
 * 统一处理：订单支付成功后 -> 创建服务(开通中 pending) -> 在对应节点驱动上开通
 *  - PVE/Incus/LXD/KVM 节点：在本地节点创建 VM/LXC，并分配 NAT IPv4/IPv6、生成端口转发
 *  - 智简魔方(zjmf) 节点：调用上游开放 API 代下订单+余额支付，上游自动开通后回写远端主机ID
 * 开通失败的记录保持 pending，可通过管理后台“重试开通”或节点“同步主机”再次处理。
 */

const { Product, Plan, Node, Service } = require('../models')

/** 分配 NAT IPv4（第4段从小到大避开已占用） */
async function allocateIPv4(nodeId, natSubnet) {
  if (!natSubnet) return ''
  try {
    const services = await Service.findAll({
      where: { node_id: nodeId },
      attributes: ['ipv4'],
      order: [['id', 'ASC']]
    })
    const baseIp = String(natSubnet).split('/')[0]
    const baseParts = baseIp.split('.').slice(0, 3)
    const usedOctets = new Set(
      services
        .map((s) => s.ipv4)
        .filter((ip) => ip && ip.startsWith(baseParts.join('.')))
        .map((ip) => parseInt(ip.split('.').pop(), 10))
    )
    for (let i = 2; i <= 254; i++) {
      if (!usedOctets.has(i)) return baseParts.join('.') + '.' + i
    }
  } catch (err) {
    console.error('[allocateIPv4] Failed:', err.message)
  }
  return ''
}

/** 分配 NAT IPv6（基于子网前缀 + 主机位） */
async function allocateIPv6(nodeId, ipv6Subnet) {
  if (!ipv6Subnet) return ''
  try {
    const services = await Service.findAll({
      where: { node_id: nodeId },
      attributes: ['ipv6'],
      order: [['id', 'ASC']]
    })
    const prefix = String(ipv6Subnet).split('/')[0].split(':').slice(0, 4).join(':')
    const usedSuffixes = new Set(
      services
        .map((s) => s.ipv6)
        .filter(Boolean)
        .map((ip) => {
          const parts = ip.split(':')
          return parts.slice(4).join(':')
        })
    )
    for (let counter = 2; counter < 65536; counter++) {
      const suffix = counter.toString(16)
      const candidate = prefix + '::' + suffix
      if (!usedSuffixes.has(suffix) && !usedSuffixes.has(candidate)) return candidate
    }
  } catch (err) {
    console.error('[allocateIPv6] Failed:', err.message)
  }
  return ''
}

/** 计算按周期对应的到期天数 */
function expireDaysFor(cycle) {
  if (cycle === 'quarterly') return 90
  if (cycle === 'yearly') return 365
  return 30
}

function cleanName(name) {
  return String(name || 'VM').replace(/[^\w\-]/g, '') || 'VM'
}

/** 为订单创建“开通中”的服务记录（不包含虚拟开通动作） */
async function createPendingServices(order) {
  const plan = await Plan.findByPk(order.plan_id)
  const product = await Product.findByPk(order.product_id)
  if (!plan || !product) throw new Error('产品/套餐不存在，无法创建服务')

  const quantity = order.quantity || 1
  const expireDays = expireDaysFor(order.cycle || 'monthly')
  const expireAt = new Date()
  expireAt.setDate(expireAt.getDate() + expireDays)

  const services = []
  for (let i = 0; i < quantity; i++) {
    const name = `${cleanName(product.name)}-${i + 1}`
    const svc = await Service.create({
      user_id: order.user_id,
      node_id: order.node_id,
      product_id: order.product_id,
      plan_id: order.plan_id,
      order_id: order.id,
      image_id: product.image_id || null,
      name,
      type: product.type || 'kvm',
      status: 'pending',
      cpu: plan.cpu || 1,
      memory: plan.memory || 1024,
      disk: plan.disk || 20,
      bandwidth: plan.bandwidth || 0,
      traffic_limit: plan.traffic_limit || 0,
      os: product.default_os || '',
      price: parseFloat(order.amount) / quantity,
      expire_time: expireAt
    })
    services.push(svc)
  }
  return services
}

/**
 * 对单个（新建的）服务执行虚拟开通
 * 返回更新后的服务；开通失败时抛错（由调用方决定状态保留 pending）
 */
async function provisionService(svc) {
  const { vmService } = require('./vm')
  const { Order } = require('../models')
  const product = await Product.findByPk(svc.product_id)
  const plan = await Plan.findByPk(svc.plan_id)
  const node = await Node.findByPk(svc.node_id)
  if (!product || !plan || !node) throw new Error('产品/套餐/节点不存在')

  // 取订单周期（智简魔方下单需要）
  let cycle = 'monthly'
  if (svc.order_id) {
    const ord = await Order.findByPk(svc.order_id)
    if (ord && ord.cycle) cycle = ord.cycle
  }

  const createResult = await vmService.createVM(node.id, {
    productId: product.id,
    planId: plan.id,
    serviceId: svc.id,
    name: svc.name,
    type: product.type || 'kvm',
    cycle,
    cpu: plan.cpu,
    memory: plan.memory,
    disk: plan.disk,
    bandwidth: plan.bandwidth,
    traffic: plan.traffic_limit,
    // 智简魔方上游相关（可选透传）
    upstreamProductId: product.upstream_product_id || '',
    os: svc.os || product.default_os || ''
  })

  const updateData = {
    status: 'running',
    vmid: String(createResult.vmid || '')
  }
  if (createResult.ipv4) updateData.ipv4 = createResult.ipv4
  if (createResult.ipv6) updateData.ipv6 = createResult.ipv6
  if (createResult.os) updateData.os = createResult.os
  if (createResult.password) updateData.password = createResult.password

  // PVE 本地节点：未返回公网IP时从节点 NAT 段自动分配
  if (node.type !== 'zjmf') {
    if (!updateData.ipv4) {
      const ipv4 = await allocateIPv4(node.id, node.nat_subnet)
      if (ipv4) updateData.ipv4 = ipv4
    }
    if (!updateData.ipv6) {
      const ipv6 = await allocateIPv6(node.id, node.ipv6_subnet)
      if (ipv6) updateData.ipv6 = ipv6
    }
  }

  await svc.update(updateData)

  // PVE 节点生成自动端口转发
  if (node.type !== 'zjmf' && svc.ipv4) {
    try {
      const { createAutoPortForwards } = require('./portForward')
      await createAutoPortForwards(svc, node.id)
    } catch (pfError) {
      console.error('[Provisioning] 自动端口转发失败:', pfError.message)
    }
  }
  return svc
}

/**
 * 订单支付成功后执行：创建服务并逐个开通
 * @returns {{services: Array, errors: Array}}
 */
async function provisionOrderServices(order) {
  let services = []
  try {
    services = await createPendingServices(order)
  } catch (e) {
    return { services: [], errors: [e.message] }
  }
  const errors = []
  for (const svc of services) {
    try {
      await provisionService(svc)
    } catch (e) {
      console.error(`[Provisioning] 服务 ${svc.id} 开通失败:`, e.message)
      let note = '自动开通失败: ' + e.message
      if (e.orderId) note += `（上游订单 ${e.orderId} 已提交，可在上游确认后同步/重试）`
      try { await svc.update({ note }) } catch (_) { /* ignore */ }
      errors.push(e.message)
    }
  }
  return { services, errors }
}

/**
 * 管理端“重试开通”：对开通中(pending 且无 vmid)的服务重新尝试。
 * 智简魔方节点因可能已在上游下单，统一建议执行“同步远端主机”，避免重复下单。
 */
async function retryProvisionService(service) {
  const node = await Node.findByPk(service.node_id)
  if (!node) throw new Error('节点不存在')
  if (node.type === 'zjmf') {
    throw new Error('智简魔方节点请先执行“节点-同步主机”，将上游已开通主机关联到该服务后再重试')
  }
  const product = await Product.findByPk(service.product_id)
  const plan = await Plan.findByPk(service.plan_id)
  if (!product || !plan) throw new Error('产品/套餐不存在')
  await service.update({ status: 'pending', note: '管理端触发重试开通...' })
  try {
    await provisionService(service)
    await service.update({ note: '重试开通成功' })
    return service
  } catch (e) {
    await service.update({ note: '重试开通失败: ' + e.message })
    throw e
  }
}

module.exports = {
  allocateIPv4,
  allocateIPv6,
  createPendingServices,
  provisionService,
  provisionOrderServices,
  retryProvisionService
}
