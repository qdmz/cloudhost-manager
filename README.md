# CloudHost Manager

一款面向主机商 / IDC 场景的云主机（VPS）销售与自动化管理平台。提供商品商城、在线下单支付、虚拟机自动化开通、节点管理、在线终端、备份、工单、代理商分销等能力，并支持对接 **智简魔方** 作为上游货源实现产品、节点、镜像的同步与自动交付。

> 前端：Vue 3 + Ant Design Vue；后端：Node.js + Express + MySQL（Sequelize）。

---

## 功能特性

### 用户端
- 商品浏览与购买，选择套餐/周期在线下单
- 余额充值（易支付）、优惠券抵扣、订单支付
- 「我的服务」：开机 / 关机 / 重启 / 重装 等云主机管理
- VNC / WebSocket 在线终端（xterm.js），支持 Web 链接跳转
- 工单系统、公告中心
- 实名认证（可选接入认证 API）
- 域名绑定、端口转发
- 注册 / 登录 / 找回密码

### 管理后台
- 数据看板（Dashboard）
- 用户管理、实名审核、代理商与佣金管理
- 产品 / 套餐 / 节点 / 镜像管理
- 订单、充值记录、优惠券、服务实例管理
- 自定义开通（Custom Create）
- 工单、公告管理
- 备份管理（打包下载）、系统配置
- 域名绑定与端口转发管理

### 自动化 / 集成
- 订单支付后自动开通虚拟机（provisioning）
- 智简魔方（ZJMF）上游：产品 / 节点 / 镜像数据同步
- Proxmox VE（PVE）节点对接与虚拟机生命周期管理
- SMTP 邮件通知
- 易支付收款

### 工程化
- 结构化数据库迁移（`server/src/migrations/`，幂等执行）
- 安装 / 升级一键脚本 `install.sh`
- 前后端分离，Vite 开发代理开箱即用

---

## 技术栈

| 端 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vite 4、Ant Design Vue 4、Pinia、Vue Router、axios、xterm.js |
| 后端 | Node.js、Express、Sequelize、MySQL（mysql2）、jsonwebtoken、ws、ssh2、nodemailer、archiver |
| 部署 | PM2（可选）、nginx / 任意静态托管 |

---

## 目录结构

```
cloudhost-manager/
├── client/                  # 前端（Vue 3）
│   ├── src/
│   │   ├── api/             # API 请求封装
│   │   ├── views/           # 页面：用户端 / admin 管理后台 / agent 代理商
│   │   ├── router/ store/ components/
│   │   └── vite.config.js   # 开发服务器（端口 3000，代理 /api → :8111）
│   └── package.json
├── server/                  # 后端（Node.js）
│   ├── src/
│   │   ├── app.js           # 服务入口
│   │   ├── config/          # 数据库等配置
│   │   ├── routes/          # API 路由（auth/user/admin/orders/pay/vm/...）
│   │   ├── models/          # Sequelize 模型
│   │   ├── services/        # 业务服务（vm / ssh / console / epay / provisioning / zjmf / backup ...）
│   │   ├── migrations/      # 数据库迁移
│   │   ├── scripts/         # 工具脚本（migrate.js 等）
│   │   └── init-db.js       # 建表 + 演示数据填充
│   └── package.json
├── install.sh               # Linux 安装 / 升级脚本
└── .env.example             # 环境变量示例
```

---

## 环境要求

- Node.js ≥ 16（建议 18+）
- MySQL 5.7+ / 8.0
- npm（建议 ≥ 9）
- Linux / macOS / Windows 均可，生产环境建议 Linux + PM2

---

## 快速开始

### 1. 安装依赖

```bash
git clone https://github.com/qdmz/cloudhost-manager.git
cd cloudhost-manager

# 后端
cd server && npm install && cd ..

# 前端
cd client && npm install && cd ..
```

### 2. 配置环境变量

参考根目录 [`.env.example`](.env.example) 创建 `.env`（后端会从 `server/.env` 或仓库根目录 `.env` 读取）：

```bash
cp .env.example .env
# 编辑 .env：数据库连接、JWT 密钥、SMTP、易支付等
```

### 3. 初始化数据库

> 建表（不会清空已有数据）；若库中尚无用户，会自动创建演示账号。

```bash
cd server
node src/init-db.js          # 建表 + 首次填充演示数据
# 升级已有部署时执行迁移：
node src/scripts/migrate.js  # 按序执行 migrations/ 下所有迁移（幂等）
```

### 4. 启动

**开发模式**

```bash
# 终端 1：后端（http://localhost:8111）
cd server
npm run dev                  # nodemon

# 终端 2：前端（http://localhost:3000，/api 已代理到 8111）
cd client
npm run dev
```

**生产模式**

```bash
# 构建前端
cd client && npm run build   # 产物输出到 client/dist/

# 使用 PM2 托管后端（以 Linux 为例）
cd server
npm install -g pm2
pm2 start src/app.js --name cloudhost
```

前端 `client/dist/` 由 nginx 等静态服务器托管，并将 `/api`、WebSocket 请求反向代理至后端 `:8111` 即可。

### 5. 演示账号

数据库为空时 `node src/init-db.js` 会自动创建：

| 角色 | 账号 | 密码 |
| --- | --- | --- |
| 管理员 | `admin` | `admin123` |
| 普通用户 | `testuser` | `test123` |

> 生产环境请立即修改默认密码与 `.env` 中的 `JWT_SECRET`。

---

## 环境变量说明

| 变量 | 说明 |
| --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | MySQL 连接配置 |
| `APP_PORT` | 后端服务端口（默认 `8111`） |
| `JWT_SECRET` | JWT 签名密钥，生产环境务必改为随机字符串 |
| `SITE_URL` | 网站地址（如 `http://localhost:3000`） |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | 邮件发送（SMTP） |
| `EPAY_URL` / `EPAY_PID` / `EPAY_KEY` / `EPAY_SIGN_TYPE` | 易支付收款配置 |
| `AUTH_API` / `AUTH_APP_ID` / `AUTH_APP_KEY` | 实名认证 API（可选） |

完整示例见 [`.env.example`](.env.example)。

---

## 版本

- `v0.11`：智简魔方上游同步、产品自动开通与订单支付流程优化
- `v0.10`：初版功能完善

## License

本项目为私有项目，仅授权本人仓库使用。
