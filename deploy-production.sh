#!/bin/bash
# ========================================
# CloudHost 云主机管理平台 - 生产环境一键部署
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
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

# 检测系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/debian_version ]; then
        OS=debian
        OS_VERSION=$(cat /etc/debian_version)
    elif [ -f /etc/redhat-release ]; then
        OS=centos
        OS_VERSION=$(rpm -q --qf "%{VERSION}" centos-release)
    else
        OS=$(uname -s)
        OS_VERSION=$(uname -r)
    fi
}

# 安装依赖
install_dependencies() {
    log_info "检查并安装依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_warning "Node.js 未安装，正在安装..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            yum install -y nodejs
        fi
    fi
    log_success "Node.js 版本: $(node -v)"
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        log_info "安装 PM2..."
        npm install -g pm2
    fi
    log_success "PM2 版本: $(pm2 -v)"
    
    # 检查 Nginx
    if ! command -v nginx &> /dev/null; then
        log_warning "Nginx 未安装，正在安装..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            apt-get update && apt-get install -y nginx
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            yum install -y nginx
        fi
    fi
    log_success "Nginx 已安装"
    
    # 检查 Certbot
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot 未安装，正在安装..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            apt-get install -y certbot python3-certbot-nginx
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            yum install -y certbot python3-certbot-nginx
        fi
    fi
    log_success "Certbot 已安装"
}

# 配置项目
setup_project() {
    log_info "配置项目..."
    
    # 获取项目目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR"
    
    log_info "项目目录: $SCRIPT_DIR"
    
    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "已创建 .env 文件，请手动编辑配置"
        else
            log_error ".env.example 文件不存在，请检查项目"
            exit 1
        fi
    fi
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd "$SCRIPT_DIR/server"
    npm install
    npm install ssh2 archiver decompress --save
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    cd "$SCRIPT_DIR/client"
    npm install
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    cd "$SCRIPT_DIR/client"
    npm run build
    log_success "前端构建完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    cd "$SCRIPT_DIR/server"
    node src/init-db.js || log_warning "数据库初始化可能需要手动执行"
}

# 停止旧服务
stop_old_services() {
    log_info "停止旧服务..."
    cd "$SCRIPT_DIR/server"
    
    # 停止 PM2 中的 cloudhost-server
    if pm2 list | grep -q "cloudhost-server"; then
        pm2 stop cloudhost-server || true
        pm2 delete cloudhost-server || true
    fi
    
    # 杀掉可能的僵尸进程
    pkill -f "node.*app.js" 2>/dev/null || true
    sleep 2
}

# 启动服务
start_services() {
    log_info "启动后端服务..."
    cd "$SCRIPT_DIR/server"
    
    # 停止旧的 cloudhost 进程（如果有）
    pm2 delete cloudhost 2>/dev/null || true
    
    # 使用 PM2 启动
    pm2 start src/app.js --name cloudhost-server --env production
    pm2 save
    
    log_success "后端服务已启动"
    
    # 设置开机自启（跳过自动配置，手动提示）
    log_info "提示：如需配置开机自启，请手动执行:"
    log_info "  pm2 startup"
    log_info "  # 然后复制粘贴输出的命令执行"
    log_info "  pm2 save"
}

# 配置 Nginx (HTTP)
configure_nginx_http() {
    log_info "配置 Nginx (HTTP)..."
    
    # 获取域名或IP
    DOMAIN=""
    if [ -f "$SCRIPT_DIR/.env" ]; then
        DOMAIN=$(grep 'SITE_DOMAIN' "$SCRIPT_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    fi
    
    if [ -z "$DOMAIN" ]; then
        DOMAIN=$(hostname -I | awk '{print $1}')
    fi
    
    log_info "使用域名/IP: $DOMAIN"
    
    # 创建 Nginx 配置
    NGINX_CONF="/etc/nginx/sites-available/cloudhost"
    cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 前端静态文件
    location / {
        root $SCRIPT_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
        
        # 缓存配置
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
        
        # WebSocket 支持
        proxy_read_timeout 86400;
    }

    # 上传文件大小限制
    client_max_body_size 100M;
}
EOF

    # 启用站点
    if [ -d "/etc/nginx/sites-enabled" ]; then
        ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    elif [ -d "/etc/nginx/conf.d" ]; then
        cp "$NGINX_CONF" /etc/nginx/conf.d/cloudhost.conf
    fi
    
    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null
    rm -f /etc/nginx/conf.d/default.conf 2>/dev/null
    
    # 测试 Nginx 配置
    nginx -t && systemctl reload nginx
    log_success "Nginx 配置完成 (HTTP)"
    
    return 0
}

# 配置 HTTPS
setup_https() {
    log_info "配置 HTTPS..."
    
    # 获取域名
    DOMAIN=""
    if [ -f "$SCRIPT_DIR/.env" ]; then
        DOMAIN=$(grep 'SITE_DOMAIN' "$SCRIPT_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    fi
    
    if [ -z "$DOMAIN" ]; then
        log_warning "未配置域名，跳过 HTTPS 设置"
        return 0
    fi
    
    # 检查是否为 IP 地址
    if [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_warning "检测到 IP 地址，Let's Encrypt 不支持 IP 证书，跳过 HTTPS 设置"
        return 0
    fi
    
    log_info "准备为域名 $DOMAIN 申请 Let's Encrypt 证书..."
    
    # 询问是否申请证书
    read -p "是否申请免费 HTTPS 证书？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "跳过 HTTPS 设置"
        return 0
    fi
    
    # 询问邮箱
    read -p "请输入用于接收证书通知的邮箱: " EMAIL
    
    # 使用 certbot 申请证书
    log_info "申请 Let's Encrypt 证书..."
    if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect; then
        log_success "HTTPS 证书申请成功！"
        
        # 配置自动续期
        log_info "配置证书自动续期..."
        if ! crontab -l | grep -q "certbot renew"; then
            (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
            log_success "证书自动续期已配置 (每天凌晨3点检查续期)"
        fi
    else
        log_warning "HTTPS 证书申请失败，请稍后手动执行: certbot --nginx -d $DOMAIN"
    fi
}

# 显示访问信息
show_access_info() {
    # 获取域名
    DOMAIN=""
    if [ -f "$SCRIPT_DIR/.env" ]; then
        DOMAIN=$(grep 'SITE_DOMAIN' "$SCRIPT_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    fi
    
    if [ -z "$DOMAIN" ]; then
        DOMAIN=$(hostname -I | awk '{print $1}')
    fi
    
    # 检查是否有 HTTPS
    HAS_HTTPS=0
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        HAS_HTTPS=1
    fi
    
    echo ""
    echo "========================================"
    log_success "部署完成！"
    echo ""
    log_info "访问信息："
    if [ $HAS_HTTPS -eq 1 ]; then
        echo "  网站地址: https://$DOMAIN"
        echo "  后台地址: https://$DOMAIN/admin"
        echo "  (HTTP 会自动重定向到 HTTPS)"
    else
        echo "  网站地址: http://$DOMAIN"
        echo "  后台地址: http://$DOMAIN/admin"
    fi
    echo "  管理员: admin / admin123"
    echo ""
    log_info "服务管理命令："
    echo "  pm2 list                    # 查看服务状态"
    echo "  pm2 logs cloudhost-server   # 查看服务日志"
    echo "  pm2 restart cloudhost-server # 重启服务"
    echo "  pm2 stop cloudhost-server    # 停止服务"
    echo ""
    log_info "Nginx 管理："
    echo "  systemctl status nginx      # 查看状态"
    echo "  systemctl reload nginx      # 重载配置"
    echo ""
    log_info "证书管理："
    echo "  certbot renew --dry-run     # 测试续期"
    echo "  certbot renew               # 手动续期"
    echo ""
    echo "========================================"
}

# 主函数
main() {
    echo "========================================"
    echo "  CloudHost 云主机管理平台 - 生产部署"
    echo "========================================"
    echo ""
    
    detect_os
    log_info "检测到系统: $OS $OS_VERSION"
    
    # 检查是否为 root
    if [ "$EUID" -ne 0 ]; then
        log_warning "建议使用 root 用户运行此脚本"
        read -p "是否继续？(y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    install_dependencies
    setup_project
    build_frontend
    stop_old_services
    start_services
    configure_nginx_http
    setup_https
    show_access_info
}

# 运行主函数
main "$@"
