const sequelize = require('./config/database')
const { User, Product, Plan, Node, Announcement } = require('./models')
const bcrypt = require('bcryptjs')

async function initDatabase() {
  try {
    console.log('Initializing database...')
    
    await sequelize.sync({ force: true })
    console.log('Tables created')
    
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      email_verified: true,
      identity_verified: true,
      balance: 1000
    })
    console.log('Admin user created: admin / admin123')
    
    const testUserPassword = await bcrypt.hash('test123', 10)
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: testUserPassword,
      role: 'user',
      email_verified: true,
      balance: 100
    })
    console.log('Test user created: testuser / test123')
    
    const node1 = await Node.create({
      name: '洛杉矶节点1',
      type: 'pve',
      host: 'https://pve1.example.com:8006',
      api_user: 'root@pam',
      api_token: '',
      location: '洛杉矶',
      nat_bridge: 'vmbr1',
      ipv6_bridge: 'vmbr2',
      nat_subnet: '10.0.1.0/24',
      ipv6_subnet: '2001:db8::/64',
      status: 'online'
    })
    console.log('Node created')
    
    const node2 = await Node.create({
      name: '香港节点1',
      type: 'incus',
      host: 'https://incus1.example.com:8443',
      api_user: 'admin',
      api_token: '',
      location: '香港',
      nat_bridge: 'vmbr1',
      ipv6_bridge: 'vmbr2',
      nat_subnet: '10.0.2.0/24',
      ipv6_subnet: '2001:db9::/64',
      status: 'online'
    })
    
    const product1 = await Product.create({
      name: 'KVM云主机',
      type: 'kvm',
      description: 'KVM完全虚拟化，性能强劲，支持Windows和Linux全系列系统',
      features: '完全虚拟化\n性能强劲\n支持Windows\n支持Linux\n独立IP\nIPv6支持\nDDoS防护',
      cpu_range: '1-16',
      memory_range: '512-32768',
      disk_range: '10-500',
      min_price: 20,
      max_price: 500,
      status: 'online',
      sort: 1
    })
    
    await Plan.create({
      product_id: product1.id,
      name: '入门型',
      cpu: 1,
      memory: 1024,
      disk: 20,
      bandwidth: 10,
      traffic_limit: 1000,
      price_monthly: 20,
      price_quarterly: 55,
      price_yearly: 199
    })
    
    await Plan.create({
      product_id: product1.id,
      name: '标准型',
      cpu: 2,
      memory: 2048,
      disk: 40,
      bandwidth: 20,
      traffic_limit: 2000,
      price_monthly: 45,
      price_quarterly: 120,
      price_yearly: 399
    })
    
    await Plan.create({
      product_id: product1.id,
      name: '高级型',
      cpu: 4,
      memory: 4096,
      disk: 80,
      bandwidth: 50,
      traffic_limit: 5000,
      price_monthly: 89,
      price_quarterly: 240,
      price_yearly: 799
    })
    
    const product2 = await Product.create({
      name: 'LXD容器',
      type: 'lxc',
      description: 'LXD容器化技术，轻量高效，适合开发测试环境',
      features: '容器化技术\n轻量高效\n秒级启动\n低资源占用\n适合开发测试\n支持快照',
      cpu_range: '1-8',
      memory_range: '256-16384',
      disk_range: '5-200',
      min_price: 10,
      max_price: 200,
      status: 'online',
      sort: 2
    })
    
    await Plan.create({
      product_id: product2.id,
      name: '轻量型',
      cpu: 1,
      memory: 512,
      disk: 10,
      bandwidth: 5,
      traffic_limit: 500,
      price_monthly: 10,
      price_quarterly: 27,
      price_yearly: 99
    })
    
    await Plan.create({
      product_id: product2.id,
      name: '专业型',
      cpu: 2,
      memory: 2048,
      disk: 30,
      bandwidth: 10,
      traffic_limit: 1000,
      price_monthly: 30,
      price_quarterly: 80,
      price_yearly: 299
    })
    
    console.log('Products and plans created')
    
    await Announcement.create({
      title: '欢迎使用 CloudHost 云主机管理平台',
      content: '<p>欢迎使用CloudHost云主机管理平台！我们提供多种虚拟化解决方案，包括KVM、LXD、Incus等。</p><p>平台特点：</p><ul><li>秒级开通</li><li>灵活计费</li><li>便捷管理</li><li>安全可靠</li></ul>',
      summary: '欢迎使用CloudHost云主机管理平台',
      is_top: true,
      is_important: true
    })
    
    await Announcement.create({
      title: '关于实名认证',
      content: '<p>根据相关法规要求，用户需完成实名认证后方可使用部分服务。</p><p>实名认证完全免费，审核通常在1-2个工作日内完成。</p>',
      summary: '提醒用户完成实名认证'
    })
    
    await Announcement.create({
      title: '新增支付方式',
      content: '<p>平台已支持支付宝、微信支付、QQ钱包等多种支付方式，充值更加便捷。</p>',
      summary: '新增多种支付方式'
    })
    
    console.log('Announcements created')
    
    console.log('\n========================================')
    console.log('Database initialization completed!')
    console.log('========================================')
    console.log('\nAdmin credentials:')
    console.log('  Username: admin')
    console.log('  Password: admin123')
    console.log('\nTest user credentials:')
    console.log('  Username: testuser')
    console.log('  Password: test123')
    console.log('========================================\n')
    
    process.exit(0)
  } catch (error) {
    console.error('Initialization failed:', error)
    process.exit(1)
  }
}

initDatabase()
