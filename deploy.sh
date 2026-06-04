#!/bin/bash

echo "=========================================="
echo "  CloudHost 一键部署脚本"
echo "=========================================="

# 1. 启动MariaDB
echo "[1/7] 启动MariaDB服务..."
systemctl start mariadb
systemctl enable mariadb

# 2. 创建数据库
echo "[2/7] 创建数据库..."
mysql -u root << 'EOF'
CREATE DATABASE IF NOT EXISTS cloudhost DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
EOF

# 3. 配置数据库连接密码
echo "[3/7] 配置数据库密码..."
DB_PASS="cloudhost123"
mysql -u root << EOF
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_PASS}';
FLUSH PRIVILEGES;
EOF

# 4. 进入项目目录
echo "[4/7] 进入项目目录..."
cd ~/cloudhost-manager/server

# 5. 配置环境变量
echo "[5/7] 配置环境变量..."
cat > .env << EOF
APP_PORT=8111
APP_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloudhost
DB_USER=root
DB_PASS=${DB_PASS}

JWT_SECRET=cloudhost-jwt-secret-key-2024-prod
JWT_EXPIRES_IN=7d

SITE_NAME=CloudHost
SITE_URL=http://localhost:8111

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
EOF

# 6. 安装依赖
echo "[6/7] 安装Node.js依赖..."
rm -rf node_modules package-lock.json
npm install

# 7. 初始化数据库
echo "[7/7] 初始化数据库..."
node src/init-db.js

# 8. 启动服务
echo ""
echo "=========================================="
echo "  启动服务..."
echo "=========================================="
nohup npm start > /tmp/cloudhost.log 2>&1 &

sleep 3

# 检查服务状态
if curl -s http://localhost:8111/api/health > /dev/null; then
    echo ""
    echo "=========================================="
    echo "  ✅ 部署成功！"
    echo "=========================================="
    echo ""
    echo "访问地址："
    echo "  前台：http://localhost:8111"
    echo "  后台：http://localhost:8111/admin"
    echo ""
    echo "管理员账号："
    echo "  邮箱：admin@cloudhost.local"
    echo "  密码：admin123"
    echo ""
    echo "日志查看："
    echo "  tail -f /tmp/cloudhost.log"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "  ❌ 服务启动失败，请查看日志"
    echo "=========================================="
    echo ""
    echo "tail /tmp/cloudhost.log"
    echo ""
fi
