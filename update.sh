#!/bin/bash
# ========================================
# CloudHost 云主机管理平台 - 更新脚本
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

# 获取项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  CloudHost 云主机管理平台 - 更新"
echo "========================================"
echo ""

# 1. 拉取最新代码
log_info "拉取最新代码..."
git pull origin main
log_success "代码已更新"

# 2. 更新依赖
log_info "更新后端依赖..."
cd "$SCRIPT_DIR/server"
npm install
npm install ssh2 archiver decompress --save

log_info "更新前端依赖..."
cd "$SCRIPT_DIR/client"
npm install

# 3. 重新构建前端
log_info "重新构建前端..."
npm run build

# 4. 重启服务
log_info "重启后端服务..."
pm2 restart cloudhost-server

# 5. 重载 Nginx
log_info "重载 Nginx..."
systemctl reload nginx

echo ""
echo "========================================"
log_success "更新完成！"
echo ""
log_info "当前状态："
pm2 list
echo ""
echo "========================================"
