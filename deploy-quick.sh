#!/bin/bash
# ========================================
# CloudHost 一键部署脚本（全自动版）
# ========================================

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

# 配置变量（直接在这里配置，不需要交互）
DOMAIN="pveusa.ypvps.com"
EMAIL="admin@$DOMAIN"  # 可以修改为你的邮箱
PROJECT_DIR="/root/cloudhost-manager"

# 确保在项目目录
cd "$PROJECT_DIR"

echo "========================================"
echo "  CloudHost 云主机管理平台 - 全自动部署"
echo "  域名: $DOMAIN"
echo "========================================"
echo ""

# 1. 检测系统
log_info "检测系统..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS=$(uname -s)
fi
log_success "系统: $OS"

# 2. 检查并安装依赖
log_info "检查依赖..."

# Node.js
if ! command -v node &> /dev/null; then
    log_warning "安装 Node.js..."
    if [ "$OS" = "debian" ] || [ "$OS" = "ubuntu" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
fi
log_success "Node.js: $(node -v)"

# PM2
if ! command -v pm2 &> /dev/null; then
    log_info "安装 PM2..."
    npm install -g pm2
fi
log_success "PM2: $(pm2 -v)"

# Nginx
if ! command -v nginx &> /dev/null; then
    log_info "安装 Nginx..."
    apt-get update && apt-get install -y nginx
fi
log_success "Nginx 已安装"

# Certbot
if ! command -v certbot &> /dev/null; then
    log_info "安装 Certbot..."
    apt-get install -y certbot python3-certbot-nginx
fi
log_success "Certbot 已安装"

# 3. 配置 .env 文件
log_info "配置 .env 文件..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
    fi
fi

# 更新或添加域名配置
if grep -q "SITE_DOMAIN" .env; then
    sed -i "s|SITE_DOMAIN=.*|SITE_DOMAIN=$DOMAIN|g" .env
else
    echo "SITE_DOMAIN=$DOMAIN" >> .env
fi
log_success ".env 配置完成"

# 4. 安装后端依赖
log_info "安装后端依赖..."
cd "$PROJECT_DIR/server"
npm install
npm install ssh2 archiver decompress --save

# 5. 安装前端依赖
log_info "安装前端依赖..."
cd "$PROJECT_DIR/client"
npm install

# 6. 构建前端
log_info "构建前端..."
cd "$PROJECT_DIR/client"
npm run build
log_success "前端构建完成"

# 7. 停止旧服务
log_info "停止旧服务..."
cd "$PROJECT_DIR/server"
pm2 delete cloudhost 2>/dev/null || true
pm2 delete cloudhost-server 2>/dev/null || true
pkill -f "node.*app.js" 2>/dev/null || true
sleep 2

# 8. 启动后端服务
log_info "启动后端服务..."
cd "$PROJECT_DIR/server"
pm2 start src/app.js --name cloudhost-server --env production
pm2 save
log_success "后端服务已启动"

# 9. 配置 Nginx
log_info "配置 Nginx..."
NGINX_CONF="/etc/nginx/sites-available/cloudhost"

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 前端静态文件
    location / {
        root $PROJECT_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        proxy_read_timeout 86400;
    }

    client_max_body_size 100M;
}
EOF

# 启用配置
if [ -d "/etc/nginx/sites-enabled" ]; then
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
fi

# 测试并重载 Nginx
nginx -t && systemctl reload nginx
log_success "Nginx 配置完成"

# 10. 尝试申请 HTTPS 证书（自动方式）
log_info "尝试申请 HTTPS 证书..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log_warning "证书已存在，跳过申请"
else
    # 尝试静默申请，如果失败也不中断部署
    if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect 2>&1; then
        log_success "HTTPS 证书申请成功！"
        
        # 配置自动续期
        if ! crontab -l | grep -q "certbot renew"; then
            (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
            log_success "证书自动续期已配置"
        fi
    else
        log_warning "HTTPS 证书申请失败（可能是 DNS 未生效或网络问题）"
        log_warning "可以稍后手动执行: certbot --nginx -d $DOMAIN"
    fi
fi

# 完成！
echo ""
echo "========================================"
log_success "部署完成！"
echo ""
log_info "访问信息："
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "  网站地址: https://$DOMAIN"
    echo "  后台地址: https://$DOMAIN/admin"
else
    echo "  网站地址: http://$DOMAIN"
    echo "  后台地址: http://$DOMAIN/admin"
fi
echo "  管理员: admin / admin123"
echo ""
log_info "服务管理命令："
echo "  pm2 list                    # 查看状态"
echo "  pm2 logs cloudhost-server   # 查看日志"
echo "  pm2 restart cloudhost-server # 重启"
echo "  pm2 stop cloudhost-server    # 停止"
echo ""
log_info "Nginx 管理："
echo "  systemctl status nginx      # 查看状态"
echo "  systemctl reload nginx      # 重载"
echo ""
echo "========================================"
