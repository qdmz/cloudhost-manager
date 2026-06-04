# CloudHost 云主机销售管理平台

一个完整的云主机销售管理平台，支持 PVE / Incus / LXD / KVM 虚拟化平台。

## 功能特性

### 用户端
- ✅ 用户注册、登录、邮箱验证
- ✅ 实名认证（身份证认证）
- ✅ 产品浏览、在线购买
- ✅ 余额充值（易支付/代金券）
- ✅ 我的服务管理（开机/关机/重启/重置密码/重装系统）
- ✅ VNC远程连接
- ✅ 工单系统（提交/回复/关闭）
- ✅ 续费服务
- ✅ 公告中心
- ✅ 用户中心（个人信息/修改密码/余额明细）

### 管理后台
- ✅ 控制台仪表盘
- ✅ 用户管理（增删改查/余额调整/代登录）
- ✅ 订单管理（处理/取消）
- ✅ 产品管理（产品/配置方案）
- ✅ 节点管理（PVE/Incus/LXD/KVM）
- ✅ 系统镜像管理
- ✅ 工单管理（回复）
- ✅ 代金券管理（批量生成）
- ✅ 公告管理（发布/编辑/置顶）
- ✅ 系统配置（网站信息/SMTP/易支付/实名认证）
- ✅ 自定义开通（手动分配资源给用户）

## 技术栈

### 前端
- Vue 3 + Composition API
- Ant Design Vue
- Vue Router
- Pinia
- Axios
- Vite

### 后端
- Node.js + Express
- MySQL + Sequelize ORM
- JWT 认证
- Nodemailer

## 快速开始

### 1. 环境要求
- Node.js >= 16.x
- MySQL >= 5.7
- npm 或 yarn

### 2. 数据库配置

创建 MySQL 数据库：
```sql
CREATE DATABASE cloudhost DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 4. 配置环境变量

复制并编辑 `.env` 文件：

```bash
cp .env.example .env
```

主要配置项：
```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloudhost
DB_USER=root
DB_PASS=your_password

# JWT密钥
JWT_SECRET=your-secret-key

# 网站URL
SITE_URL=http://localhost:3000

# SMTP邮件配置
SMTP_HOST=smtp.example.com
SMTP_USER=your@email.com
SMTP_PASS=your_password
SMTP_FROM=your@email.com

# 易支付配置
EPAY_URL=https://pay.example.com/
EPAY_PID=your_pid
EPAY_KEY=your_key
```

### 5. 初始化数据库

```bash
cd server
node src/init-db.js
```

这将创建所有表并插入初始数据：
- 管理员账户: admin / admin123
- 测试账户: testuser / test123
- 示例产品和配置
- 示例公告

### 6. 启动服务

```bash
# 启动后端 (端口 8080)
cd server
npm start

# 启动前端 (端口 3000)
cd client
npm run dev
```

### 7. 访问系统

- 前台: http://localhost:3000
- 后台: http://localhost:3000/admin
- 管理登录: admin / admin123

## 项目结构

```
cloudhost-manager/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── assets/        # 静态资源
│   │   ├── router/        # 路由配置
│   │   ├── store/         # Pinia状态管理
│   │   ├── utils/         # 工具函数
│   │   └── views/         # 页面组件
│   │       ├── admin/     # 管理后台页面
│   │       └── ...        # 用户端页面
│   └── package.json
│
├── server/                 # 后端项目
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── middleware/    # 中间件
│   │   ├── models/        # 数据模型
│   │   ├── routes/       # 路由
│   │   ├── services/      # 业务服务
│   │   ├── config/        # 配置
│   │   └── app.js         # 入口文件
│   └── package.json
│
└── README.md
```

## API 文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 退出登录

### 用户接口
- `GET /api/user/info` - 获取用户信息
- `PUT /api/user/update` - 更新用户信息
- `POST /api/user/change-password` - 修改密码
- `POST /api/user/submit-auth` - 提交实名认证

### 产品接口
- `GET /api/products` - 获取产品列表
- `GET /api/products/:id` - 获取产品详情
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表

### 服务接口
- `GET /api/services` - 获取我的服务
- `POST /api/services/:id/start` - 开机
- `POST /api/services/:id/stop` - 关机
- `POST /api/services/:id/restart` - 重启
- `POST /api/services/:id/reset-password` - 重置密码
- `POST /api/services/:id/reinstall` - 重装系统
- `POST /api/services/:id/renew` - 续费
- `GET /api/services/:id/vnc` - 获取VNC连接

### 工单接口
- `GET /api/tickets` - 获取工单列表
- `POST /api/tickets` - 创建工单
- `POST /api/tickets/:id/reply` - 回复工单

### 管理接口
- `GET /api/admin/users` - 用户管理
- `GET /api/admin/products` - 产品管理
- `GET /api/admin/nodes` - 节点管理
- `GET /api/admin/orders` - 订单管理
- `GET /api/admin/tickets` - 工单管理
- `GET /api/admin/configs` - 系统配置
- `POST /api/admin/services/custom-create` - 自定义开通

## 虚拟化平台集成

### Proxmox VE (PVE)
```javascript
// 节点配置示例
{
  type: 'pve',
  host: 'https://pve.example.com:8006',
  api_user: 'root@pam',
  api_token: 'your-api-token'
}
```

### Incus/LXD
```javascript
{
  type: 'incus',
  host: 'https://incus.example.com:8443',
  api_user: 'admin',
  api_token: 'your-api-token'
}
```

## 扩展功能

### 易支付对接
平台已集成易支付接口，需要在后台配置易支付商户信息。

### 实名认证对接
平台支持对接第三方实名认证API，可配置AUTH_API参数。

### SMTP邮件配置
配置SMTP后，系统可发送验证邮件、通知邮件等。

## License

MIT License
