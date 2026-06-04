#!/bin/bash

# CloudHost 完整一键部署脚本
# 支持 Nginx 反向代理 + Let's Encrypt 免费HTTPS证书
# 适配域名: pveusa.ypvps.com
# 作者: CloudHost Team

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CloudHost 云主机管理平台${NC}"
echo -e "${BLUE}  一键部署脚本 (Nginx + HTTPS)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 配置信息
DOMAIN="${1:-pveusa.ypvps.com}"
SERVER_IP="${2:-38.55.132.191}"
APP_PORT="${3:-8111}"
EMAIL="${4:-admin@example.com}"

echo -e "${YELLOW}配置信息：${NC}"
echo -e "  域名: ${GREEN}$DOMAIN${NC}"
echo -e "  服务器IP: ${GREEN}$SERVER_IP${NC}"
echo -e "  应用端口: ${GREEN}$APP_PORT${NC}"
echo -e "  管理员邮箱: ${GREEN}$EMAIL${NC}"
echo ""

# 1. 检查系统权限
echo -e "${YELLOW}[1/12] 检查系统权限...${NC}"
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 权限运行此脚本${NC}"
    echo -e "提示：运行 ${GREEN}sudo bash $0${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 权限检查通过${NC}"

# 2. 安装系统依赖
echo -e "${YELLOW}[2/12] 安装系统依赖...${NC}"
apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx

# 检查 Docker（如果需要）
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}安装 Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

echo -e "${GREEN}✓ 系统依赖安装完成${NC}"

# 3. 获取项目代码
echo -e "${YELLOW}[3/12] 获取项目代码...${NC}"
if [ -d "/root/cloudhost-manager" ]; then
    echo -e "${YELLOW}更新现有代码...${NC}"
    cd /root/cloudhost-manager
    git pull
else
    echo -e "${YELLOW}克隆项目代码...${NC}"
    cd /root
    git clone https://github.com/qdmz/cloudhost-manager.git
    cd cloudhost-manager
fi
echo -e "${GREEN}✓ 代码获取完成${NC}"

# 4. 检查并安装 Node.js
echo -e "${YELLOW}[4/12] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}安装 Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"
echo -e "${GREEN}✓ npm 版本: $(npm -v)${NC}"

# 5. 安装 PM2 进程管理器
echo -e "${YELLOW}[5/12] 安装 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 安装完成${NC}"

# 6. 构建前端
echo -e "${YELLOW}[6/12] 构建前端项目...${NC}"
cd /root/cloudhost-manager/client
npm install
npm run build
echo -e "${GREEN}✓ 前端构建完成${NC}"

# 7. 安装后端依赖
echo -e "${YELLOW}[7/12] 安装后端依赖...${NC}"
cd /root/cloudhost-manager/server
npm install
echo -e "${GREEN}✓ 后端依赖安装完成${NC}"

# 8. 配置环境变量
echo -e "${YELLOW}[8/12] 配置环境变量...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << EOF
# 服务器配置
APP_PORT=${APP_PORT}
APP_URL=http://${DOMAIN}

# 数据库配置 (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=cloudhost123
DB_NAME=cloudhost

# JWT 密钥
JWT_SECRET=cloudhost-jwt-secret-key-$(date +%s)

# 易支付配置 (留空，后续在后台配置)
EPAY_URL=
EPAY_PID=
EPAY_KEY=
EPAY_PRIVATE_KEY=
EPAY_PUBLIC_KEY=
EOF
    echo -e "${GREEN}✓ 环境变量配置完成${NC}"
else
    echo -e "${YELLOW}环境变量已存在，跳过创建${NC}"
fi

# 9. 初始化数据库
echo -e "${YELLOW}[9/12] 初始化数据库...${NC}"
# 创建数据库（如果不存在）
mysql -u root -p"cloudhost123" << 'EOF'
CREATE DATABASE IF NOT EXISTS cloudhost DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# 初始化数据库表
node src/init-db.js
echo -e "${GREEN}✓ 数据库初始化完成${NC}"

# 10. 配置 Nginx 反向代理
echo -e "${YELLOW}[10/12] 配置 Nginx 反向代理...${NC}"

# 创建 Nginx 配置文件
cat > /etc/nginx/sites-available/cloudhost << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # 日志文件
    access_log /var/log/nginx/cloudhost_access.log;
    error_log /var/log/nginx/cloudhost_error.log;
    
    # 前端静态文件
    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 支持 WebSocket
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API 转发
    location /api/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/cloudhost /etc/nginx/sites-enabled/cloudhost
rm -f /etc/nginx/sites-enabled/default  # 删除默认站点

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✓ Nginx 配置完成${NC}"

# 11. 使用 PM2 启动后端服务
echo -e "${YELLOW}[11/12] 启动后端服务...${NC}"

# 创建 PM2 配置文件
cat > /root/cloudhost-manager/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cloudhost',
    script: 'src/app.js',
    cwd: '/root/cloudhost-manager/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/cloudhost_error.log',
    out_file: '/var/log/cloudhost_out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
EOF

# 启动服务
pm2 delete cloudhost 2>/dev/null || true
pm2 start /root/cloudhost-manager/ecosystem.config.js
pm2 save
pm2 startup 2>/dev/null || true
echo -e "${GREEN}✓ 后端服务启动完成${NC}"

# 12. 申请 HTTPS 证书
echo -e "${YELLOW}[12/12] 申请 HTTPS 证书...${NC}"
echo -e "${YELLOW}注意：需要先配置 DNS 解析，将 ${DOMAIN} 指向 ${SERVER_IP}${NC}"

read -p "是否现在申请 HTTPS 证书？(y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 确保证书目录存在
    mkdir -p /var/www/letsencrypt
    
    # 停止 Nginx（如果证书申请需要）
    systemctl stop nginx
    
    # 申请证书
    certbot certonly --standalone \
        -d ${DOMAIN} \
        -d www.${DOMAIN} \
        --agree-tos \
        --email ${EMAIL} \
        --non-interactive \
        --webroot -w /var/www/letsencrypt \
        --force-renewal || {
        echo -e "${YELLOW}证书申请失败，HTTP服务将继续使用 HTTP${NC}"
        systemctl start nginx
    }
    
    # 如果证书申请成功，配置 HTTPS
    if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
        cat > /etc/nginx/sites-available/cloudhost << EOF
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 日志文件
    access_log /var/log/nginx/cloudhost_access.log;
    error_log /var/log/nginx/cloudhost_error.log;
    
    # 前端静态文件
    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API 转发
    location /api/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
        
        # 测试并重启 Nginx
        nginx -t
        systemctl restart nginx
        
        # 配置自动续期
        (crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet --renew-hook 'systemctl reload nginx'") | crontab -
        
        echo -e "${GREEN}✓ HTTPS 证书配置完成${NC}"
        echo -e "${GREEN}✓ 自动续期已配置${NC}"
    fi
else
    echo -e "${YELLOW}跳过 HTTPS 证书申请${NC}"
    echo -e "${YELLOW}后续可以运行: certbot --nginx -d ${DOMAIN}${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}访问地址：${NC}"
echo -e "  ${GREEN}HTTP:  http://${DOMAIN}${NC}"
echo -e "  ${GREEN}HTTPS: https://${DOMAIN}${NC}"
echo -e "  ${GREEN}IP:    http://${SERVER_IP}${NC}"
echo ""
echo -e "${BLUE}管理员账号：${NC}"
echo -e "  用户名: ${GREEN}admin@cloudhost.local${NC}"
echo -e "  密码:   ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}常用命令：${NC}"
echo -e "  ${YELLOW}pm2 status${NC}              - 查看服务状态"
echo -e "  ${YELLOW}pm2 logs cloudhost${NC}       - 查看服务日志"
echo -e "  ${YELLOW}pm2 restart cloudhost${NC}     - 重启服务"
echo -e "  ${YELLOW}systemctl status nginx${NC}   - 查看 Nginx 状态"
echo -e "  ${YELLOW}certbot renew${NC}            - 手动续期证书"
echo ""
echo -e "${BLUE}后续配置：${NC}"
echo -e "  1. 配置 DNS 解析（如果还没配置）"
echo -e "  2. 登录后台配置 SMTP 邮件服务"
echo -e "  3. 配置易支付接口信息"
echo -e "  4. 添加产品、节点、镜像等数据"
echo ""
