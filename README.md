# CloudHost Manager

**版本**: v0.10  |  **更新日期**: 2026-06-24  |  **许可证**: MIT

完整的云主机销售管理平台，支持 **Proxmox VE (PVE)**、**Incus/LXD** 容器虚拟化，提供用户自助购买、管理、续费、运维的一站式解决方案。

---

## 📸 界面截图

### 用户端

| 界面 | 说明 |
|------|------|
| ![登录页](https://via.placeholder.com/800x500/4A90D9/FFFFFF?text=Login+Page) | 用户登录（含验证码） |
| ![首页](https://via.placeholder.com/800x500/50B86C/FFFFFF?text=Home+Page) | 首页公告与产品展示 |
| ![产品列表](https://via.placeholder.com/800x500/FF8C42/FFFFFF?text=Products+List) | 产品浏览与订购 |
| ![我的服务](https://via.placeholder.com/800x500/9B59B6/FFFFFF?text=My+Services) | 用户服务列表 |
| ![服务详情](https://via.placeholder.com/800x500/E74C3C/FFFFFF?text=Service+Detail) | 服务详情（开机/重启/密码/重装/VNC） |
| ![订单中心](https://via.placeholder.com/800x500/3498DB/FFFFFF?text=Orders) | 订单列表与支付 |
| ![余额充值](https://via.placeholder.com/800x500/2ECC71/FFFFFF?text=Recharge) | 余额充值（易支付） |
| ![用户中心](https://via.placeholder.com/800x500/E67E22/FFFFFF?text=User+Center) | 个人信息/实名认证/修改密码 |
| ![端口转发](https://via.placeholder.com/800x500/1ABC9C/FFFFFF?text=Port+Forward) | 端口转发管理 |
| ![域名绑定](https://via.placeholder.com/800x500/34495E/FFFFFF?text=Domain+Binding) | 域名绑定管理 |
| ![工单系统](https://via.placeholder.com/800x500/7F8C8D/FFFFFF?text=Tickets) | 工单提交与回复 |

### 管理后台

| 界面 | 说明 |
|------|------|
| ![仪表盘](https://via.placeholder.com/800x500/2C3E50/FFFFFF?text=Dashboard) | 数据统计概览 |
| ![用户管理](https://via.placeholder.com/800x500/34495E/FFFFFF?text=User+Management) | 用户增删改查/余额调整 |
| ![产品管理](https://via.placeholder.com/800x500/16A085/FFFFFF?text=Product+Management) | 产品与套餐配置 |
| ![节点管理](https://via.placeholder.com/800x500/C0392B/FFFFFF?text=Node+Management) | PVE/Incus 节点管理 |
| ![服务管理](https://via.placeholder.com/800x500/8E44AD/FFFFFF?text=Service+Management) | 全局服务管理 |
| ![订单管理](https://via.placeholder.com/800x500/D35400/FFFFFF?text=Order+Management) | 订单处理 |
| ![系统配置](https://via.placeholder.com/800x500/27AE60/FFFFFF?text=System+Config) | 网站/SMTP/支付/认证配置 |
| ![自定义开通](https://via.placeholder.com/800x500/F39C12/FFFFFF?text=Custom+Create) | 管理员手动创建虚拟机 |
| ![备份管理](https://via.placeholder.com/800x500/2980B9/FFFFFF?text=Backup+Management) | 系统备份与恢复 |
| ![代金券管理](https://via.placeholder.com/800x500/16A085/FFFFFF?text=Vouchers) | 代金券批量生成 |

> **提示**: 实际截图请在部署后访问系统自行截取，或运行 `npm run dev` 后截图替换占位链接。

---

## ✨ 功能特性

### 用户端

| 功能 | 说明 |
|------|------|
| 📝 注册登录 | 邮箱注册、用户名登录、图形验证码 |
| 🔐 实名认证 | 身份证实名认证（可对接第三方API） |
| 🛒 产品订购 | 浏览产品、选择套餐、在线下单 |
| 💰 余额充值 | 易支付（微信/支付宝/QQ钱包） |
| 🖥 服务管理 | 开机 / 关机 / 重启 / 重置密码 / 重装系统 |
| 🔗 VNC 连接 | 浏览器内远程连接虚拟机 |
| 🔄 续费 | 余额支付或易支付订单续费 |
| 📮 端口转发 | 用户自助创建 TCP/UDP 端口转发 |
| 🌐 域名绑定 | 用户自助绑定域名（自动配置 Nginx） |
| 🎫 工单系统 | 提交问题、查看回复 |
| 👤 用户中心 | 个人信息、修改密码、余额明细 |
| 📢 公告 | 查看系统公告 |

### 管理后台

| 功能 | 说明 |
|------|------|
| 📊 仪表盘 | 用户/订单/服务/收入统计 |
| 👥 用户管理 | 增删改查、余额调整、代登录、实名认证审核 |
| 📦 产品管理 | 产品 CRUD、套餐配置（CPU/内存/磁盘/带宽） |
| 🖧 节点管理 | PVE/Incus 节点配置、SSH 测试、状态监控 |
| 🔄 服务管理 | 全局服务查看、手动创建/删除虚拟机 |
| 📋 订单管理 | 订单处理、退款 |
| 💳 充值记录 | 查看充值流水 |
| 🎟 代金券 | 批量生成代金券 |
| 📮 端口转发管理 | 查看和管理所有端口转发规则 |
| 🌐 域名绑定管理 | 查看和管理所有域名绑定 |
| 🎫 工单管理 | 回复用户工单 |
| ⚙️ 系统配置 | 网站信息、SMTP、易支付、实名认证、备份策略 |
| 💾 备份管理 | 系统备份、恢复、定时任务 |

---

## 🏗 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.4 | 核心框架 |
| Ant Design Vue | ^4.x | UI 组件库 |
| Vue Router | ^4 | 路由管理 |
| Pinia | ^2 | 状态管理 |
| Axios | ^1 | HTTP 客户端 |
| Vite | ^5 | 构建工具 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >= 18 | 运行时 |
| Express | ^4 | Web 框架 |
| MySQL | >= 8.0 | 数据库 |
| Sequelize | ^6 | ORM |
| JWT | ^9 | 身份认证 |
| bcryptjs | ^2 | 密码加密 |
| ssh2 | ^1 | SSH 连接 |
| nodemailer | ^6 | 邮件发送 |

### 虚拟化支持
| 平台 | 类型 | 说明 |
|------|------|------|
| Proxmox VE | PVE | KVM + LXC 容器 |
| Incus | LXD | 下一代 LXC |
| 自定义创建 | - | 管理员手动在 PVE 上创建 |

---

## 📁 项目结构

```
cloudhost-manager/
├── client/                          # 前端项目
│   ├── src/
│   │   ├── api/                     # API 接口封装
│   │   │   ├── admin.js             # 管理后台 API
│   │   │   ├── auth.js              # 认证 API
│   │   │   ├── user.js              # 用户 API
│   │   │   ├── domain.js            # 域名绑定 API
│   │   │   └── port.js              # 端口转发 API
│   │   ├── router/                  # 路由配置
│   │   ├── store/                   # Pinia 状态管理
│   │   ├── views/                   # 页面组件
│   │   │   ├── Login.vue            # 登录页
│   │   │   ├── Register.vue         # 注册页
│   │   │   ├── Home.vue             # 首页
│   │   │   ├── Products.vue         # 产品列表
│   │   │   ├── MyServices.vue       # 我的服务
│   │   │   ├── ServiceDetail.vue    # 服务详情
│   │   │   ├── Orders.vue           # 订单中心
│   │   │   ├── Recharge.vue         # 余额充值
│   │   │   ├── UserCenter.vue       # 用户中心
│   │   │   ├── PortForwards.vue     # 端口转发
│   │   │   ├── DomainBindings.vue   # 域名绑定
│   │   │   ├── Tickets.vue          # 工单
│   │   │   ├── VNC.vue              # VNC 远程
│   │   │   └── admin/               # 管理后台
│   │   │       ├── Dashboard.vue    # 仪表盘
│   │   │       ├── Users.vue        # 用户管理
│   │   │       ├── Products.vue     # 产品管理
│   │   │       ├── Nodes.vue        # 节点管理
│   │   │       ├── Services.vue     # 服务管理
│   │   │       ├── Orders.vue       # 订单管理
│   │   │       ├── Configs.vue      # 系统配置
│   │   │       ├── CustomCreate.vue # 自定义开通
│   │   │       ├── Backup.vue       # 备份管理
│   │   │       └── Vouchers.vue     # 代金券
│   │   └── App.vue
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # 后端项目
│   ├── src/
│   │   ├── config/                  # 配置文件
│   │   ├── middleware/              # 中间件
│   │   │   ├── auth.js              # JWT 认证
│   │   │   └── admin.js             # 管理员权限
│   │   ├── models/                  # 数据模型
│   │   │   └── index.js             # 所有 Sequelize 模型
│   │   ├── routes/                  # API 路由
│   │   │   ├── auth.js              # 注册/登录/验证码
│   │   │   ├── user.js              # 用户信息
│   │   │   ├── products.js          # 产品列表
│   │   │   ├── orders.js            # 订单
│   │   │   ├── pay.js               # 支付回调
│   │   │   ├── services.js          # 服务管理/续费
│   │   │   ├── port_forwards.js     # 端口转发
│   │   │   ├── domain_bindings.js   # 域名绑定
│   │   │   ├── tickets.js           # 工单
│   │   │   ├── admin.js             # 管理后台
│   │   │   └── ...
│   │   ├── services/                # 业务服务
│   │   │   ├── vm.js                # PVE/Incus 虚拟机管理
│   │   │   ├── ssh.js               # SSH 连接
│   │   │   ├── network.js           # 网络配置
│   │   │   ├── epay.js              # 易支付
│   │   │   ├── email.js             # 邮件服务
│   │   │   ├── backup.js            # 系统备份
│   │   │   └── console.js           # 控制台 WebSocket
│   │   ├── init-db.js               # 数据库初始化
│   │   └── app.js                   # Express 入口
│   └── package.json
│
├── .env.example                     # 环境变量模板
├── deploy.sh                        # 生产环境部署脚本
├── install.sh                       # 一键安装脚本
├── package.json                     # 根 package.json
└── README.md
```

---

## 🚀 快速部署

### 方式一：一键安装（推荐）

```bash
git clone https://github.com/qdmz/cloudhost-manager.git
cd cloudhost-manager
chmod +x install.sh
./install.sh
```

### 方式二：手动部署

#### 1. 环境准备

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装 MySQL 8+
apt install -y mysql-server
```

#### 2. 克隆项目

```bash
git clone https://github.com/qdmz/cloudhost-manager.git
cd cloudhost-manager
```

#### 3. 安装依赖

```bash
# 后端
cd server && npm install && cd ..

# 前端
cd client && npm install && cd ..
```

#### 4. 数据库配置

```sql
CREATE DATABASE cloudhost DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 5. 环境变量

```bash
cp server/.env.example server/.env
# 编辑 server/.env，配置数据库、JWT、SMTP、易支付等
```

#### 6. 初始化数据库

```bash
cd server && node src/init-db.js && cd ..
```

#### 7. 编译前端

```bash
cd client && npm run build && cd ..
```

#### 8. 启动服务

```bash
cd server && npm start &
# 或 PM2
pm2 start src/app.js --name cloudhost
pm2 save
pm2 startup
```

---

## ⚙️ 环境配置

### 核心配置项 (`server/.env`)

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloudhost
DB_USER=root
DB_PASS=your_password

# JWT
JWT_SECRET=your-secret-key-change-in-production

# 应用
APP_PORT=8111
SITE_URL=https://yourdomain.com

# SMTP 邮件
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your@qq.com
SMTP_PASS=your_smtp_password

# 易支付
EPAY_URL=https://pay.example.com
EPAY_PID=your_merchant_id
EPAY_KEY=your_sign_key
EPAY_SIGN_TYPE=MD5
```

### PVE 节点配置

在管理后台 → 节点管理中添加节点：

| 字段 | 示例 | 说明 |
|------|------|------|
| name | pve-node-1 | 节点名称 |
| type | pve | 虚拟化类型 (pve/incus) |
| host | https://pve.example.com:8006 | PVE API 地址 |
| api_user | root@pam | API 用户名 |
| api_token | your_password | API 密码或 Token |
| nat_bridge | vmbr1 | NAT4 网桥 |
| ipv6_bridge | vmbr2 | IPv6 网桥 |
| nat_subnet | 172.16.0.0/24 | NAT4 子网 |

---

## 📡 API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/auth/captcha` | 获取验证码 |
| POST | `/api/auth/forgot-password` | 忘记密码 |

### 用户
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/info` | 用户信息 |
| PUT | `/api/user/update` | 更新信息 |
| POST | `/api/user/change-password` | 修改密码 |
| POST | `/api/user/submit-auth` | 实名认证 |
| GET | `/api/user/balance-log` | 余额明细 |

### 产品与订单
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 产品列表 |
| GET | `/api/products/:id` | 产品详情 |
| POST | `/api/orders` | 创建订单 |
| GET | `/api/orders` | 订单列表 |
| GET | `/api/orders/:id` | 订单详情 |

### 服务
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/services` | 我的服务列表 |
| GET | `/api/services/:id` | 服务详情 |
| POST | `/api/services/:id/start` | 开机 |
| POST | `/api/services/:id/stop` | 关机 |
| POST | `/api/services/:id/restart` | 重启 |
| POST | `/api/services/:id/reset-password` | 重置密码 |
| POST | `/api/services/:id/reinstall` | 重装系统 |
| POST | `/api/services/:id/renew` | 续费 |
| GET | `/api/services/:id/vnc` | VNC 连接 |
| GET | `/api/services/:id/stats` | 资源统计 |
| GET | `/api/services/:id/console` | WebSocket 控制台 |

### 端口转发
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/port-forwards` | 转发列表 |
| POST | `/api/port-forwards` | 创建转发 |
| PUT | `/api/port-forwards/:id` | 更新转发 |
| DELETE | `/api/port-forwards/:id` | 删除转发 |

### 域名绑定
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/domain-bindings` | 绑定列表 |
| POST | `/api/domain-bindings` | 创建绑定 |
| PUT | `/api/domain-bindings/:id` | 更新绑定 |
| DELETE | `/api/domain-bindings/:id` | 删除绑定 |

### 工单
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tickets` | 工单列表 |
| POST | `/api/tickets` | 创建工单 |
| POST | `/api/tickets/:id/reply` | 回复工单 |

### 充值
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/recharge/create` | 创建充值订单 |
| GET | `/api/recharge/list` | 充值记录 |

### 支付回调
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/pay/notify` | 易支付异步通知 |
| GET | `/api/pay/return` | 支付成功跳转 |

### 管理后台 (需 admin 角色)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/dashboard` | 仪表盘数据 |
| GET | `/api/admin/users` | 用户列表 |
| POST | `/api/admin/users` | 创建用户 |
| PUT | `/api/admin/users/:id` | 更新用户 |
| DELETE | `/api/admin/users/:id` | 删除用户 |
| GET | `/api/admin/products` | 产品列表 |
| POST | `/api/admin/products` | 创建产品 |
| PUT | `/api/admin/products/:id` | 更新产品 |
| DELETE | `/api/admin/products/:id` | 删除产品 |
| GET | `/api/admin/plans` | 套餐列表 |
| POST | `/api/admin/plans` | 创建套餐 |
| GET | `/api/admin/nodes` | 节点列表 |
| POST | `/api/admin/nodes` | 创建节点 |
| PUT | `/api/admin/nodes/:id` | 更新节点 |
| DELETE | `/api/admin/nodes/:id` | 删除节点 |
| POST | `/api/admin/nodes/:id/test-ssh` | 测试 SSH |
| GET | `/api/admin/services` | 服务列表 |
| POST | `/api/admin/services/custom-create` | 自定义开通 |
| GET | `/api/admin/orders` | 订单列表 |
| GET | `/api/admin/recharges` | 充值记录 |
| GET | `/api/admin/balance-logs` | 余额日志 |
| GET | `/api/admin/port-forwards` | 端口转发 |
| GET | `/api/admin/domain-bindings` | 域名绑定 |
| GET | `/api/admin/tickets` | 工单列表 |
| POST | `/api/admin/tickets/:id/reply` | 回复工单 |
| GET | `/api/admin/configs` | 系统配置 |
| PUT | `/api/admin/configs/:key` | 更新配置 |
| GET | `/api/admin/backups` | 备份列表 |
| POST | `/api/admin/backups` | 创建备份 |
| POST | `/api/admin/backups/:id/restore` | 恢复备份 |
| GET | `/api/admin/vouchers` | 代金券列表 |
| POST | `/api/admin/vouchers/generate` | 生成代金券 |
| GET | `/api/admin/announcements` | 公告列表 |
| POST | `/api/admin/announcements` | 创建公告 |

---

## 🔄 版本更新日志

### v0.10 (2026-06-24)

**新功能**
- ✅ 管理员同时支持用户名和邮箱登录
- ✅ 续费功能完善：余额支付自动扣款、易支付订单生成
- ✅ LXC 模板自动映射（debian-12 → 实际模板文件）
- ✅ VMID 自动分配（从 PVE API 获取 nextid）
- ✅ PVE API 认证修复（支持密码模式和 Token 模式）
- ✅ 系统备份管理（创建/恢复/定时备份）
- ✅ 代金券管理（批量生成）
- ✅ 端口转发管理（用户自助创建）
- ✅ 域名绑定管理（自动配置 Nginx）
- ✅ VNC 远程连接
- ✅ WebSocket 控制台

**修复**
- 🐛 修复 LXC 创建时模板路径错误
- 🐛 修复续费不扣余额的问题
- 🐛 修复 VM 创建失败时仍标记为 running
- 🐛 修复管理员登录只认用户名不认邮箱

**变更**
- 📦 前端登录表单字段统一为 `username`
- 🔐 后端登录查询改为 `$or: [{ username }, { email }]`

---

## ❓ 常见问题

### Q: 登录后提示"用户名或密码错误"？
A: 确认使用的是正确的凭据。管理员默认：用户名 `admin`，密码 `admin123`。如果是邮箱登录，确保后端已支持 email 登录。

### Q: 购买后虚拟机没有创建？
A: 检查：1) 节点 PVE API 配置是否正确；2) 节点状态是否为 online；3) PVE 上是否有可用模板；4) 查看 PM2 日志 `pm2 logs cloudhost`。

### Q: 续费不扣余额？
A: v0.10 已修复。确保使用 `payment_method: 'balance'` 参数调用续费接口。

### Q: 如何修改默认密码？
A: 登录管理后台 → 用户管理 → 编辑 admin 用户 → 修改密码。

### Q: 如何对接自己的易支付？
A: 管理后台 → 系统配置 → 易支付配置，填入商户号、密钥、支付平台地址。

### Q: 端口转发不生效？
A: 确保节点配置中 SSH 信息正确，且节点已启用 SSH 连接。系统在节点上自动配置 iptables 规则。

---

## 👥 默认账户

| 角色 | 用户名 | 邮箱 | 密码 |
|------|--------|------|------|
| 管理员 | admin | admin@ypvps.com | admin123 |
| 测试用户 | testuser | test@example.com | test123 |

> ⚠️ **生产环境请务必修改默认密码！**

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**GitHub**: [github.com/qdmz/cloudhost-manager](https://github.com/qdmz/cloudhost-manager)
