const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  qq: { type: DataTypes.STRING(20) },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'disabled'), defaultValue: 'active' },
  email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  identity_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  real_name: { type: DataTypes.STRING(50) },
  id_card: { type: DataTypes.STRING(18) },
  auth_status: { type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'), defaultValue: 'none' }
}, { tableName: 'users', timestamps: true, underscored: true })

const Service = sequelize.define('Service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  node_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER },
  plan_id: { type: DataTypes.INTEGER },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM('kvm', 'lxc', 'lxd', 'incus'), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'running', 'stopped', 'suspended'), defaultValue: 'pending' },
  cpu: { type: DataTypes.INTEGER, defaultValue: 1 },
  memory: { type: DataTypes.INTEGER, defaultValue: 1024 },
  disk: { type: DataTypes.INTEGER, defaultValue: 20 },
  bandwidth: { type: DataTypes.INTEGER },
  traffic_limit: { type: DataTypes.INTEGER },
  ipv4: { type: DataTypes.STRING(50) },
  ipv6: { type: DataTypes.STRING(100) },
  mac: { type: DataTypes.STRING(50) },
  vmid: { type: DataTypes.STRING(50) },
  os: { type: DataTypes.STRING(100) },
  password: { type: DataTypes.STRING(255) },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  expire_time: { type: DataTypes.DATE, allowNull: false },
  note: { type: DataTypes.TEXT }
}, { tableName: 'services', timestamps: true, underscored: true })

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM('kvm', 'lxc', 'lxd', 'incus'), allowNull: false },
  description: { type: DataTypes.TEXT },
  features: { type: DataTypes.TEXT },
  cpu_range: { type: DataTypes.STRING(20) },
  memory_range: { type: DataTypes.STRING(20) },
  disk_range: { type: DataTypes.STRING(20) },
  min_price: { type: DataTypes.DECIMAL(10, 2) },
  max_price: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.ENUM('online', 'offline'), defaultValue: 'online' },
  sort: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'products', timestamps: true, underscored: true })

const Plan = sequelize.define('Plan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  cpu: { type: DataTypes.INTEGER, allowNull: false },
  memory: { type: DataTypes.INTEGER, allowNull: false },
  disk: { type: DataTypes.INTEGER, allowNull: false },
  bandwidth: { type: DataTypes.INTEGER },
  traffic_limit: { type: DataTypes.INTEGER },
  price_monthly: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  price_quarterly: { type: DataTypes.DECIMAL(10, 2) },
  price_yearly: { type: DataTypes.DECIMAL(10, 2) }
}, { tableName: 'plans', timestamps: true, underscored: true })

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  order_no: { type: DataTypes.STRING(32), unique: true, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  plan_id: { type: DataTypes.INTEGER, allowNull: false },
  node_id: { type: DataTypes.INTEGER, allowNull: false },
  cycle: { type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'paid', 'completed', 'cancelled', 'refunded'), defaultValue: 'pending' },
  payment_method: { type: DataTypes.STRING(20) },
  paid_at: { type: DataTypes.DATE }
}, { tableName: 'orders', timestamps: true, underscored: true })

const Node = sequelize.define('Node', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM('pve', 'incus', 'lxd', 'kvm'), allowNull: false },
  host: { type: DataTypes.STRING(255), allowNull: false },
  api_user: { type: DataTypes.STRING(100) },
  api_token: { type: DataTypes.STRING(255) },
  location: { type: DataTypes.STRING(100) },
  nat_bridge: { type: DataTypes.STRING(50) },
  ipv6_bridge: { type: DataTypes.STRING(50) },
  nat_subnet: { type: DataTypes.STRING(50) },
  ipv6_subnet: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.ENUM('online', 'offline'), defaultValue: 'online' },
  cpu_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
  memory_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
  memory_total: { type: DataTypes.INTEGER, defaultValue: 0 },
  note: { type: DataTypes.TEXT },
  // SSH 配置字段
  ssh_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  ssh_host: { type: DataTypes.STRING(255) },
  ssh_port: { type: DataTypes.INTEGER, defaultValue: 22 },
  ssh_username: { type: DataTypes.STRING(100), defaultValue: 'root' },
  ssh_password: { type: DataTypes.STRING(255) },
  ssh_key: { type: DataTypes.TEXT }
}, { tableName: 'nodes', timestamps: true, underscored: true })

const Image = sequelize.define('Image', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  node_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  os: { type: DataTypes.STRING(50), allowNull: false },
  version: { type: DataTypes.STRING(50) },
  arch: { type: DataTypes.STRING(20), defaultValue: 'amd64' },
  template: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, { tableName: 'images', timestamps: true, underscored: true })

const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.ENUM('pre_sales', 'after_sales', 'technical', 'billing', 'suggestion', 'other'), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  status: { type: DataTypes.ENUM('open', 'pending', 'answered', 'closed'), defaultValue: 'open' },
  priority: { type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'), defaultValue: 'normal' }
}, { tableName: 'tickets', timestamps: true, underscored: true })

const TicketMessage = sequelize.define('TicketMessage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  attachments: { type: DataTypes.TEXT }
}, { tableName: 'ticket_messages', timestamps: true, underscored: true })

const Announcement = sequelize.define('Announcement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  summary: { type: DataTypes.STRING(500) },
  is_top: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_important: { type: DataTypes.BOOLEAN, defaultValue: false },
  views: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'announcements', timestamps: true, underscored: true })

const Recharge = sequelize.define('Recharge', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_method: { type: DataTypes.STRING(20) },
  trade_no: { type: DataTypes.STRING(64) },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), defaultValue: 'pending' }
}, { tableName: 'recharges', timestamps: true, underscored: true })

const Voucher = sequelize.define('Voucher', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(32), unique: true, allowNull: false },
  value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false },
  used_by: { type: DataTypes.INTEGER },
  used_at: { type: DataTypes.DATE },
  expire_time: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'vouchers', timestamps: true, underscored: true })

const BalanceLog = sequelize.define('BalanceLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('recharge', 'consume', 'refund', 'adjust'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  balance_before: { type: DataTypes.DECIMAL(10, 2) },
  balance_after: { type: DataTypes.DECIMAL(10, 2) },
  note: { type: DataTypes.STRING(255) },
  related_id: { type: DataTypes.INTEGER },
  related_type: { type: DataTypes.STRING(50) }
}, { tableName: 'balance_logs', timestamps: true, underscored: true })

const Config = sequelize.define('Config', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  value: { type: DataTypes.TEXT },
  type: { type: DataTypes.ENUM('string', 'number', 'boolean', 'json'), defaultValue: 'string' }
}, { tableName: 'configs', timestamps: true, underscored: true })

const AuthRequest = sequelize.define('AuthRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  real_name: { type: DataTypes.STRING(50), allowNull: false },
  id_card: { type: DataTypes.STRING(18), allowNull: false },
  id_card_front: { type: DataTypes.STRING(255) },
  id_card_back: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  reject_reason: { type: DataTypes.STRING(255) },
  reviewed_by: { type: DataTypes.INTEGER },
  reviewed_at: { type: DataTypes.DATE }
}, { tableName: 'auth_requests', timestamps: true, underscored: true })

const DomainBinding = sequelize.define('DomainBinding', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  service_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  domain: { type: DataTypes.STRING(255), allowNull: false },
  protocol: { type: DataTypes.ENUM('http', 'https', 'tcp', 'udp'), defaultValue: 'http' },
  external_port: { type: DataTypes.INTEGER, allowNull: false },
  internal_ip: { type: DataTypes.STRING(50) },
  internal_port: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'inactive', 'pending'), defaultValue: 'pending' },
  ssl_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  ssl_cert: { type: DataTypes.TEXT },
  ssl_key: { type: DataTypes.TEXT },
  note: { type: DataTypes.TEXT }
}, { tableName: 'domain_bindings', timestamps: true, underscored: true })

const PortForward = sequelize.define('PortForward', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  service_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  protocol: { type: DataTypes.ENUM('tcp', 'udp'), defaultValue: 'tcp' },
  external_port: { type: DataTypes.INTEGER, allowNull: false },
  internal_ip: { type: DataTypes.STRING(50) },
  internal_port: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'inactive', 'pending'), defaultValue: 'pending' },
  note: { type: DataTypes.TEXT }
}, { tableName: 'port_forwards', timestamps: true, underscored: true })

User.hasMany(Service, { foreignKey: 'user_id' })
Service.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Service.belongsTo(Node, { foreignKey: 'node_id', as: 'node' })
Service.hasMany(DomainBinding, { foreignKey: 'service_id' })
Service.hasMany(PortForward, { foreignKey: 'service_id' })

Product.hasMany(Plan, { foreignKey: 'product_id' })
Plan.belongsTo(Product, { foreignKey: 'product_id' })

User.hasMany(Order, { foreignKey: 'user_id' })
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' })
Order.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' })
Order.belongsTo(Node, { foreignKey: 'node_id', as: 'node' })

Node.hasMany(Image, { foreignKey: 'node_id' })
Image.belongsTo(Node, { foreignKey: 'node_id' })

User.hasMany(Ticket, { foreignKey: 'user_id' })
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Ticket.hasMany(TicketMessage, { foreignKey: 'ticket_id' })
TicketMessage.belongsTo(Ticket, { foreignKey: 'ticket_id' })
TicketMessage.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(Recharge, { foreignKey: 'user_id' })
Recharge.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(BalanceLog, { foreignKey: 'user_id' })
BalanceLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(DomainBinding, { foreignKey: 'user_id' })
DomainBinding.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
DomainBinding.belongsTo(Service, { foreignKey: 'service_id', as: 'service' })

User.hasMany(PortForward, { foreignKey: 'user_id' })
PortForward.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
PortForward.belongsTo(Service, { foreignKey: 'service_id', as: 'service' })

module.exports = {
  sequelize,
  User, Service, Product, Plan, Order, Node, Image,
  Ticket, TicketMessage, Announcement, Recharge, Voucher,
  BalanceLog, Config, AuthRequest, DomainBinding, PortForward
}
