#!/bin/bash

# 云主机管理平台 - GitHub一键部署脚本
# 使用方法: 在远程服务器上执行此脚本

# 配置项
GITHUB_REPO="https://github.com/qdmz/cloudhost-manager.git"
INSTALL_DIR="/root/cloudhost-manager"
APP_PORT=8111
DB_PASS="cloudhost123"

echo "=========================================="
echo "  CloudHost 云主机管理平台"
echo "  GitHub 一键部署脚本"
echo "=========================================="
echo ""

# 1. 检查并安装依赖
echo "[1/9] 检查系统依赖..."
if ! command -v git &> /dev/null; then
    echo "  正在安装 git..."
    apt-get update && apt-get install -y git || yum install -y git
fi

if ! command -v node &> /dev/null; then
    echo "  正在安装 Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs || yum install -y nodejs
fi

if ! command -v mysql &> /dev/null; then
    echo "  正在安装 MariaDB..."
    apt-get install -y mariadb-server || yum install -y mariadb-server
fi

echo "  ✅ 依赖检查完成"

# 2. 启动MariaDB
echo "[2/9] 启动数据库服务..."
systemctl start mariadb 2>/dev/null || true
systemctl enable mariadb 2>/dev/null || true
echo "  ✅ 数据库服务已启动"

# 3. 清理旧项目
echo "[3/9] 清理旧项目文件..."
if [ -d "$INSTALL_DIR" ]; then
    cd $INSTALL_DIR
    pkill -f "node src/app.js" 2>/dev/null || true
    sleep 1
    cd /
    rm -rf $INSTALL_DIR
fi
echo "  ✅ 清理完成"

# 4. 从GitHub克隆代码
echo "[4/9] 从GitHub拉取最新代码..."
git clone --depth 1 $GITHUB_REPO $INSTALL_DIR
cd $INSTALL_DIR
echo "  ✅ 代码拉取完成"

# 5. 配置数据库
echo "[5/9] 配置数据库..."
mysql -u root << 'MYSQL_EOF'
CREATE DATABASE IF NOT EXISTS cloudhost DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
MYSQL_EOF

mysql -u root << MYSQL_EOF
ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASS';
FLUSH PRIVILEGES;
MYSQL_EOF
echo "  ✅ 数据库配置完成"

# 6. 安装前端依赖并构建
echo "[6/9] 构建前端项目..."
cd $INSTALL_DIR/client
npm install
npm run build
echo "  ✅ 前端构建完成"

# 7. 安装后端依赖
echo "[7/9] 安装后端依赖..."
cd $INSTALL_DIR/server
npm install
echo "  ✅ 后端依赖安装完成"

# 8. 配置环境变量
echo "[8/9] 配置环境变量..."
SERVER_IP=$(hostname -I | awk '{print $1}')
cat > $INSTALL_DIR/server/.env << ENV_EOF
APP_PORT=$APP_PORT
APP_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloudhost
DB_USER=root
DB_PASS=$DB_PASS

JWT_SECRET=cloudhost-jwt-secret-key-$(date +%s)
JWT_EXPIRES_IN=7d

SITE_NAME=CloudHost
SITE_URL=http://$SERVER_IP:$APP_PORT

SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_SECURE=true

EPAY_URL=
EPAY_PID=
EPAY_KEY=

AUTH_ENABLED=false
AUTH_API=
AUTH_KEY=
ENV_EOF
echo "  ✅ 环境变量配置完成"

# 9. 初始化数据库并启动服务
echo "[9/9] 初始化数据库并启动服务..."
cd $INSTALL_DIR/server
node src/init-db.js

pkill -f "node src/app.js" 2>/dev/null || true
sleep 1
nohup npm start > /tmp/cloudhost.log 2>&1 &
sleep 3

echo ""
echo "=========================================="
echo "  ✅ 部署完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  前台：http://$SERVER_IP:$APP_PORT"
echo "  后台：http://$SERVER_IP:$APP_PORT/#/admin"
echo ""
echo "管理员账号："
echo "  邮箱：admin@cloudhost.local"
echo "  密码：admin123"
echo ""
echo "常用命令："
echo "  查看日志：tail -f /tmp/cloudhost.log"
echo "  重启服务：cd $INSTALL_DIR/server && pkill -f 'node src/app.js' && nohup npm start > /tmp/cloudhost.log 2>&1 &"
echo "  更新代码：cd $INSTALL_DIR && git pull && cd client && npm run build && cd ../server && npm install && pkill -f 'node src/app.js' && nohup npm start > /tmp/cloudhost.log 2>&1 &"
echo ""
