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
- ✅ 端口转发管理
- ✅ 域名绑定管理

### 管理后台
- ✅ 控制台仪表盘
- ✅ 用户管理（增删改查/余额调整/代登录）
- ✅ 订单管理（处理/取消）
- ✅ 产品管理（产品/配置方案）
- ✅ 节点管理（PVE/Incus/LXD/KVM）
- ✅ 节点SSH配置（支持端口转发、域名绑定）
- ✅ 系统镜像管理
- ✅ 工单管理（回复）
- ✅ 代金券管理（批量生成）
- ✅ 充值记录管理
- ✅ 余额变动日志
- ✅ 域名绑定管理
- ✅ 端口转发管理
- ✅ 公告管理（发布/编辑/置顶）
- ✅ 系统配置（网站信息/SMTP/易支付/实名认证）
- ✅ 自定义开通（真正在PVE上创建虚拟机）

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
- SSH2 (用于SSH连接)

## 一键安装部署

### 自动安装脚本

```bash
# 下载项目
git clone https://github.com/your-repo/cloudhost-manager.git
cd cloudhost-manager

# 运行一键安装脚本（自动安装所有依赖和配置）
chmod +x install.sh
./install.sh
```

### 脚本功能
- 自动检测并安装 Node.js (如果未安装)
- 自动检测并安装 MySQL (如果未安装)
- 自动安装前端和后端依赖
- 自动创建数据库
- 自动配置环境变量
- 自动初始化数据库表

## 手动安装部署

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
cp server/.env.example server/.env
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
EPAY_SIGN_TYPE=MD5
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

## 生产环境部署

### 使用 PM2 部署后端

```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务
cd server
pm2 start src/app.js --name cloudhost-server

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 使用 Nginx 反向代理

```nginx
upstream cloudhost_backend {
    server 127.0.0.1:8080;
}

upstream cloudhost_frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        proxy_pass http://cloudhost_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API 代理
    location /api {
        proxy_pass http://cloudhost_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 更新升级

### 拉取最新代码
```bash
cd cloudhost-manager
git pull origin main
```

### 更新依赖
```bash
# 更新后端依赖
cd server
npm install

# 更新前端依赖
cd ../client
npm install
```

### 重启服务
```bash
# 使用 PM2 重启
pm2 restart cloudhost-server

# 或手动重启
cd server && npm start
```

## 项目结构

```
cloudhost-manager/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── api/           # API接口
│   │   │   ├── admin.js   # 管理后台API
│   │   │   ├── auth.js    # 认证API
│   │   │   ├── domain.js  # 域名/端口API
│   │   │   └── ...
│   │   ├── assets/        # 静态资源
│   │   ├── router/        # 路由配置
│   │   ├── store/         # Pinia状态管理
│   │   ├── utils/         # 工具函数
│   │   └── views/         # 页面组件
│   │       ├── admin/     # 管理后台页面
│   │       │   ├── Nodes.vue      # 节点管理
│   │       │   ├── Services.vue   # 服务管理
│   │       │   ├── Recharges.vue   # 充值记录
│   │       │   ├── DomainBindings.vue  # 域名绑定
│   │       │   ├── PortForwards.vue    # 端口转发
│   │       │   └── ...
│   │       └── ...        # 用户端页面
│   └── package.json
│
├── server/                 # 后端项目
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── middleware/    # 中间件
│   │   ├── models/        # 数据模型
│   │   │   └── index.js   # Sequelize模型定义
│   │   ├── routes/        # 路由
│   │   │   ├── admin.js   # 管理后台路由
│   │   │   ├── services.js # 服务管理路由
│   │   │   ├── port_forwards.js  # 端口转发路由
│   │   │   ├── domain_bindings.js # 域名绑定路由
│   │   │   └── ...
│   │   ├── services/      # 业务服务
│   │   │   ├── vm.js      # 虚拟机管理服务
│   │   │   ├── ssh.js     # SSH连接服务
│   │   │   ├── network.js # 网络配置服务
│   │   │   └── epay.js    # 易支付服务
│   │   └── app.js         # 入口文件
│   └── package.json
│
├── install.sh              # 一键安装脚本
├── .env.example           # 环境变量模板
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
- `GET /api/services/:id/stats` - 获取使用统计

### 端口转发接口
- `GET /api/port-forwards` - 获取端口转发列表
- `POST /api/port-forwards` - 创建端口转发
- `PUT /api/port-forwards/:id` - 更新端口转发
- `DELETE /api/port-forwards/:id` - 删除端口转发

### 域名绑定接口
- `GET /api/domain-bindings` - 获取域名绑定列表
- `POST /api/domain-bindings` - 创建域名绑定
- `PUT /api/domain-bindings/:id` - 更新域名绑定
- `DELETE /api/domain-bindings/:id` - 删除域名绑定

### 工单接口
- `GET /api/tickets` - 获取工单列表
- `POST /api/tickets` - 创建工单
- `POST /api/tickets/:id/reply` - 回复工单

### 管理接口
- `GET /api/admin/users` - 用户管理
- `GET /api/admin/products` - 产品管理
- `GET /api/admin/nodes` - 节点管理
- `POST /api/admin/nodes/:id/sync` - 同步节点
- `POST /api/admin/nodes/:id/test-ssh` - 测试SSH连接
- `GET /api/admin/orders` - 订单管理
- `POST /api/admin/orders/:id/process` - 处理订单
- `GET /api/admin/services` - 服务管理
- `POST /api/admin/services/custom-create` - 自定义开通（真正创建虚拟机）
- `GET /api/admin/recharges` - 充值记录管理
- `GET /api/admin/balance-logs` - 余额变动日志
- `GET /api/admin/port-forwards` - 端口转发管理
- `GET /api/admin/domain-bindings` - 域名绑定管理
- `GET /api/admin/tickets` - 工单管理
- `GET /api/admin/configs` - 系统配置
- `PUT /api/admin/configs/:key` - 更新配置

## 虚拟化平台集成

### Proxmox VE (PVE)

节点配置示例：
```javascript
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

### SSH配置（用于端口转发和域名绑定）

在节点管理中启用SSH并配置：
```javascript
{
  ssh_enabled: true,
  ssh_host: 'pve.example.com',    // 留空则使用节点地址
  ssh_port: 22,                   // SSH端口
  ssh_username: 'root',            // SSH用户名
  ssh_password: 'your-password',   // SSH密码
  ssh_key: 'your-private-key'      // 或使用私钥认证
}
```

## 扩展功能

### 易支付对接
平台已集成易支付接口，需要在后台配置易支付商户信息。

### 实名认证对接
平台支持对接第三方实名认证API，可配置AUTH_API参数。

### SMTP邮件配置
配置SMTP后，系统可发送验证邮件、通知邮件等。

### 端口转发
- 在节点启用SSH后，用户可以创建端口转发规则
- 系统会在节点上自动配置iptables规则
- 支持TCP/UDP协议

### 域名绑定
- 在节点启用SSH后，用户可以绑定域名
- 系统会自动配置Nginx反向代理
- 支持HTTP/HTTPS协议

## 常见问题

### Q: 端口转发/域名绑定不生效？
A: 请确保在节点配置中正确填写了SSH信息，并点击"测试SSH连接"验证连接成功。

### Q: 订单支付后虚拟机没有创建？
A: 检查节点PVE API配置是否正确，确认API Token有足够权限。

### Q: 如何查看日志？
A: 使用PM2：`pm2 logs cloudhost-server`

## License

MIT License
