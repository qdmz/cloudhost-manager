#!/bin/bash

# CloudHost 完整部署脚本
# 包含 Nginx + Certbot HTTPS + 项目部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  CloudHost 云主机管理平台${NC}"
echo -e "${GREEN}  完整部署脚本 (含 Nginx + HTTPS)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 1. 检查系统
echo -e "${YELLOW}[1/10] 检查系统环境...${NC}"
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 权限运行此脚本${NC}"
    exit 1
fi

# 2. 安装必要依赖
echo -e "${YELLOW}[2/10] 安装系统依赖...${NC}"
apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx

# 3. 克隆或更新代码
echo -e "${YELLOW}[3/10] 获取项目代码...${NC}"
if [ -d "/root/cloudhost-manager" ]; then
    cd /root/cloudhost-manager
    git pull
else
    cd /root
    git clone https://github.com/qdmz/cloudhost-manager.git
    cd cloudhost-manager
fi

# 4. 检查 Node.js 和 npm
echo -e "${YELLOW}[4/10] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js 未安装，正在安装...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm 未安装，正在安装...${NC}"
    apt-get install -y npm
fi

echo -e "${GREEN}Node.js 版本: $(node -v)${NC}"
echo -e "${GREEN}npm 版本: $(npm -v)${NC}"

# 5. 检查并安装 PM2
echo -e "${YELLOW}[5/10] 安装 PM2 (进程管理器)...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 6. 安装前端依赖并构建
echo -e "${YELLOW}[6/10] 构建前端项目...${NC}"
cd /root/cloudhost-manager/client
npm install
npm run build

# 7. 安装后端依赖
echo -e "${YELLOW}[7/10] 安装后端依赖...${NC}"
cd /root/cloudhost-manager/server
npm install

# 8. 配置环境变量
echo -e "${YELLOW}[8/10] 配置环境变量...${NC}"
if [ ! -f "/root/cloudhost-manager/server/.env" ]; then
    cat > /root/cloudhost-manager/server/.env << 'EOF'
# 服务器配置
APP_PORT=8111
APP_URL=http://localhost:8111

# 数据库配置 (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=cloudhost

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 易支付配置
EPAY_URL=
EPAY_PID=
EPAY_KEY=
EOF
fi

# 9. 初始化数据库
echo -e "${YELLOW}[9/10] 初始化数据库...${NC}"
cd /root/cloudhost-manager/server
node src/init-db.js

# 10. 配置并启动 Nginx
echo -e "${YELLOW}[10/10] 配置 Nginx...${NC}"

# 复制 Nginx 配置到 sites-available
cp /root/cloudhost-manager/nginx.conf /etc/nginx/sites-available/cloudhost
ln -sf /etc/nginx/sites-available/cloudhost /etc/nginx/sites-enabled/cloudhost 2>/dev/null || true

# 测试并重启 Nginx
echo -e "${YELLOW}测试 Nginx 配置...${NC}"
nginx -t
systemctl restart nginx
systemctl enable nginx

# 使用 PM2 启动后端服务
echo -e "${YELLOW}启动后端服务...${NC}"
cd /root/cloudhost-manager/server
pm2 delete cloudhost 2>/dev/null || true
pm2 start src/app.js --name cloudhost
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址:"
echo "  HTTP: http://$(curl -s ifconfig.me)"
echo "  管理员账号: admin@cloudhost.local / admin123"
echo ""
echo "下一步操作:"
echo "  1. 配置 DNS 解析域名到服务器"
echo "  2. 运行: certbot --nginx -d pveusa.ypvps.com -d www.pveusa.ypvps.com"
echo "  3. 配置支付网关等参数"
echo ""
echo "常用命令:"
echo "  pm2 status           # 查看服务状态"
echo "  pm2 logs cloudhost   # 查看服务日志"
echo "  pm2 restart cloudhost # 重启服务"
echo "  systemctl status nginx # Nginx 状态"
echo ""
