admin_path = "/root/cloudhost-manager/server/src/routes/admin.js"
content = open(admin_path, "r").read()

# Import port forward service at the top
import_line = "const { vmService } = require('../services/vm')"
new_import = import_line + "\nconst { createAutoPortForwards } = require('../services/portForward')"
content = content.replace(import_line, new_import)

# Fix 1: Add port allocation after Service.create in order flow (around line 235)
old_order_create = '''    // 创建服务记录
    await Service.create({
      user_id: order.user_id,
      node_id: order.node_id,
      product_id: order.product_id,
      plan_id: order.plan_id,
      name: \`VPS-${pveResult.vmid}\`,
      type: osType,
      status: 'running',
      cpu: cpu,
      memory: memory,
      disk: disk,
      vmid: String(pveResult.vmid),
      price: order.amount / order.quantity,
      expire_time: expireTime
    })
    
    res.json({'''

new_order_create = '''    // 创建服务记录
    const service = await Service.create({
      user_id: order.user_id,
      node_id: order.node_id,
      product_id: order.product_id,
      plan_id: order.plan_id,
      name: \`VPS-${pveResult.vmid}\`,
      type: osType,
      status: 'running',
      cpu: cpu,
      memory: memory,
      disk: disk,
      vmid: String(pveResult.vmid),
      price: order.amount / order.quantity,
      expire_time: expireTime
    })
    
    // Auto-assign port forwards
    try {
      const pfResult = await createAutoPortForwards(service, order.node_id)
      console.log('Auto-assigned ports for service', service.id, JSON.stringify(pfResult))
    } catch (pfError) {
      console.error('Port forward assignment failed:', pfError.message)
      // Non-fatal: continue without ports
    }
    
    res.json({'''

content = content.replace(old_order_create, new_order_create)

# Fix 2: Add port allocation after Service.create in custom-create flow (around line 831)
old_custom_create = '''    // 在数据库中创建服务记录
    const service = await Service.create({
      user_id: user_id,
      node_id: node_id,
      name: name || pveResult.message,
      type: type || 'kvm',
      status: 'running',
      cpu: cpu || 1,
      memory: memory || 1024,
      disk: disk || 20,
      vmid: String(pveResult.vmid),
      ipv4: ipv4 || '',
      ipv6: ipv6 || '',
      os: os || 'Unknown',
      price: price != null ? parseFloat(price) : (amount != null ? parseFloat(amount) : 0.00),
      expire_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    })
    
    res.json({
      code: 200,
      message: \`虚拟机创建成功 (${pveResult.message})\`,
      data: {
        service: service,
        pve_result: {
          vmid: pveResult.vmid,
          type: pveResult.type,
          node: pveResult.node
        }
      }
    })'''

new_custom_create = '''    // 在数据库中创建服务记录
    const service = await Service.create({
      user_id: user_id,
      node_id: node_id,
      name: name || pveResult.message,
      type: type || 'kvm',
      status: 'running',
      cpu: cpu || 1,
      memory: memory || 1024,
      disk: disk || 20,
      vmid: String(pveResult.vmid),
      ipv4: ipv4 || '',
      ipv6: ipv6 || '',
      os: os || 'Unknown',
      price: price != null ? parseFloat(price) : (amount != null ? parseFloat(amount) : 0.00),
      expire_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    })
    
    // Auto-assign port forwards
    try {
      const pfResult = await createAutoPortForwards(service, node_id)
      console.log('Auto-assigned ports for service', service.id, JSON.stringify(pfResult))
    } catch (pfError) {
      console.error('Port forward assignment failed:', pfError.message)
    }
    
    res.json({
      code: 200,
      message: \`虚拟机创建成功 (${pveResult.message})\`,
      data: {
        service: service,
        port_forwards: pfResult || null,
        pve_result: {
          vmid: pveResult.vmid,
          type: pveResult.type,
          node: pveResult.node
        }
      }
    })'''

content = content.replace(old_custom_create, new_custom_create)

with open(admin_path, "w") as f:
    f.write(content)
print("Fixed: auto port allocation in order flow and custom-create")
