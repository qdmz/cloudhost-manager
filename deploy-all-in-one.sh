#!/bin/bash
# ========================================
# CloudHost 一键部署脚本（全自动版）
# ========================================
# 配置信息
DOMAIN="pveusa.ypvps.com"
EMAIL="admin@pveusa.ypvps.com"
DB_PASSWORD="cloudhost123"
PROJECT_DIR="/root/cloudhost-manager"

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "========================================"
echo "  CloudHost 云主机管理平台 - 全自动部署"
echo "  域名: $DOMAIN"
echo "  数据库密码: $DB_PASSWORD"
echo "========================================"
echo ""

# 1. 检测系统并安装基础依赖
log_info "检测系统..."
apt-get update
apt-get install -y curl wget git vim

# 2. 安装 Node.js
if ! command -v node &> /dev/null; then
    log_info "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
log_success "Node.js: $(node -v)"

# 3. 安装 PM2
if ! command -v pm2 &> /dev/null; then
    log_info "安装 PM2..."
    npm install -g pm2
fi
log_success "PM2: $(pm2 -v)"

# 4. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    log_info "安装 Nginx..."
    apt-get install -y nginx
fi
log_success "Nginx 已安装"

# 5. 安装 Certbot
if ! command -v certbot &> /dev/null; then
    log_info "安装 Certbot..."
    apt-get install -y certbot python3-certbot-nginx
fi
log_success "Certbot 已安装"

# 6. 配置并启动 MariaDB
log_info "配置 MariaDB..."

# 停止现有 MariaDB
systemctl stop mariadb 2>/dev/null || true
pkill -9 mysqld 2>/dev/null || true
pkill -9 mariadbd 2>/dev/null || true
sleep 2

# 确保目录存在
mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld 2>/dev/null || true

# 安全模式启动
log_info "以安全模式启动 MariaDB..."
mysqld_safe --skip-grant-tables --skip-networking &
sleep 5

# 配置数据库
log_info "配置数据库..."
mysql -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE DATABASE IF NOT EXISTS cloudhost CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
EOF

# 重启 MariaDB
log_info "重启 MariaDB..."
pkill -9 mysqld 2>/dev/null || true
sleep 2
systemctl start mariadb
sleep 2

# 验证数据库
if mysql -u root -p$DB_PASSWORD -e "SELECT 'OK' as test" cloudhost 2>/dev/null; then
    log_success "数据库配置成功"
else
    log_error "数据库配置失败"
    exit 1
fi

# 7. 克隆或更新项目
if [ ! -d "$PROJECT_DIR" ]; then
    log_info "克隆项目..."
    git clone https://github.com/qdmz/cloudhost-manager.git "$PROJECT_DIR"
fi

# 8. 配置 .env 文件
log_info "配置 .env 文件..."
cd "$PROJECT_DIR/server"

cat > .env <<EOF
# 服务配置
PORT=8111
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=$DB_PASSWORD
DB_NAME=cloudhost

# 域名配置
SITE_DOMAIN=$DOMAIN

# JWT 密钥
JWT_SECRET=cloudhost_jwt_secret_$(date +%s)_$RANDOM
JWT_EXPIRES_IN=7d

# PVE 默认配置（可在后台修改）
PVE_DEFAULT_NODE=1
EOF

log_success ".env 配置完成"

# 9. 安装后端依赖
log_info "安装后端依赖..."
cd "$PROJECT_DIR/server"
npm install
npm install ssh2 archiver decompress --save

# 10. 安装前端依赖
log_info "安装前端依赖..."
cd "$PROJECT_DIR/client"
npm install

# 11. 构建前端
log_info "构建前端..."
cd "$PROJECT_DIR/client"
npm run build
log_success "前端构建完成"

# 12. 停止旧服务
log_info "停止旧服务..."
pm2 delete cloudhost 2>/dev/null || true
pm2 delete cloudhost-server 2>/dev/null || true
pkill -f "node.*app.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# 13. 初始化数据库
log_info "初始化数据库..."
cd "$PROJECT_DIR/server"
npx sequelize-cli db:migrate 2>/dev/null || npx sequelize db:migrate 2>/dev/null || true
npx sequelize-cli db:seed:all 2>/dev/null || npx sequelize db:seed:all 2>/dev/null || true

# 14. 启动后端服务
log_info "启动后端服务..."
cd "$PROJECT_DIR/server"
pm2 start src/app.js --name cloudhost-server --env production
pm2 save
log_success "后端服务已启动"

# 15. 配置 Nginx
log_info "配置 Nginx..."
NGINX_CONF="/etc/nginx/sites-available/cloudhost"

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $PROJECT_DIR/client/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:8111;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size 100M;
}
EOF

# 启用配置
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重载 Nginx
nginx -t && systemctl reload nginx
log_success "Nginx 配置完成"

# 16. 申请 HTTPS 证书
log_info "申请 HTTPS 证书..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log_warning "证书已存在，跳过申请"
else
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect || log_warning "证书申请失败，可稍后重试"
fi

# 配置证书自动续期
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
fi

# 完成！
echo ""
echo "========================================"
log_success "部署完成！"
echo ""
log_info "访问信息："
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "  网站地址: https://$DOMAIN"
else
    echo "  网站地址: http://$DOMAIN"
fi
echo "  管理员账号: admin / admin123"
echo ""
log_info "服务管理命令："
echo "  pm2 list                    # 查看状态"
echo "  pm2 logs cloudhost-server   # 查看日志"
echo "  pm2 restart cloudhost-server # 重启"
echo ""
log_info "数据库信息："
echo "  主机: localhost"
echo "  用户: root"
echo "  密码: $DB_PASSWORD"
echo "  数据库: cloudhost"
echo ""
echo "========================================"