#!/bin/bash

# 远程服务器配置
REMOTE_HOST="38.55.132.191"
REMOTE_USER="root"
REMOTE_PASS="thanks123A#"
REMOTE_DIR="/root/cloudhost-manager"
DB_PASS="cloudhost123"

echo "=========================================="
echo "  CloudHost 远程服务器一键部署"
echo "=========================================="
echo ""
echo "远程服务器: $REMOTE_HOST"
echo "部署目录: $REMOTE_DIR"
echo ""

# 检查是否安装了 sshpass
if ! command -v sshpass &> /dev/null; then
    echo "正在安装 sshpass..."
    apt-get update && apt-get install -y sshpass || yum install -y sshpass || {
        echo "请先安装 sshpass 工具"
        exit 1
    }
fi

# 1. 创建项目压缩包（排除 node_modules）
echo "[1/6] 正在创建项目压缩包..."
cd /workspace/cloudhost-manager
tar -czf /tmp/cloudhost-manager.tar.gz \
    --exclude='node_modules' \
    --exclude='client/node_modules' \
    --exclude='server/node_modules' \
    --exclude='.git' \
    --exclude='.gitignore' \
    --exclude='*.log' \
    --exclude='data/database.sqlite' \
    .

echo "✅ 压缩包创建完成: /tmp/cloudhost-manager.tar.gz"

# 2. 上传压缩包到远程服务器
echo "[2/6] 正在上传文件到远程服务器..."
sshpass -p "$REMOTE_PASS" scp -o StrictHostKeyChecking=no /tmp/cloudhost-manager.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/

# 3. 在远程服务器上执行部署
echo "[3/6] 正在远程服务器上执行部署..."
sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST << EOF
    echo "  - 清理旧项目目录..."
    rm -rf $REMOTE_DIR
    mkdir -p $REMOTE_DIR
    
    echo "  - 解压文件..."
    tar -xzf /tmp/cloudhost-manager.tar.gz -C $REMOTE_DIR
    
    echo "  - 清理临时文件..."
    rm -f /tmp/cloudhost-manager.tar.gz
    
    echo "  - 启动MariaDB..."
    systemctl start mariadb 2>/dev/null || true
    systemctl enable mariadb 2>/dev/null || true
    
    echo "  - 创建数据库..."
    mysql -u root << 'MYSQL_EOF'
CREATE DATABASE IF NOT EXISTS cloudhost DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
MYSQL_EOF
    
    echo "  - 配置数据库密码..."
    mysql -u root << MYSQL_EOF
ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASS';
FLUSH PRIVILEGES;
MYSQL_EOF
    
    echo "  - 配置环境变量..."
    cd $REMOTE_DIR/server
    cat > .env << ENV_EOF
APP_PORT=8111
APP_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloudhost
DB_USER=root
DB_PASS=$DB_PASS

JWT_SECRET=cloudhost-jwt-secret-key-2024-prod
JWT_EXPIRES_IN=7d

SITE_NAME=CloudHost
SITE_URL=http://$REMOTE_HOST:8111

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
    
    echo "  - 安装后端依赖..."
    rm -rf node_modules package-lock.json
    npm install --production
    
    echo "  - 初始化数据库..."
    node src/init-db.js
    
    echo "  - 停止旧服务..."
    pkill -f "node src/app.js" 2>/dev/null || true
    sleep 1
    
    echo "  - 启动新服务..."
    nohup npm start > /tmp/cloudhost.log 2>&1 &
    sleep 3
    
    echo "  - 检查服务状态..."
    if curl -s http://localhost:8111/api/health > /dev/null; then
        echo ""
        echo "=========================================="
        echo "  ✅ 远程部署成功！"
        echo "=========================================="
    else
        echo ""
        echo "=========================================="
        echo "  ⚠️  服务检查超时，请稍后手动验证"
        echo "=========================================="
    fi
EOF

# 4. 清理本地临时文件
echo "[4/6] 正在清理本地临时文件..."
rm -f /tmp/cloudhost-manager.tar.gz

# 5. 显示部署结果
echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  前台：http://$REMOTE_HOST:8111"
echo "  后台：http://$REMOTE_HOST:8111/#/admin"
echo ""
echo "管理员账号："
echo "  邮箱：admin@cloudhost.local"
echo "  密码：admin123"
echo ""
echo "查看远程日志："
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'tail -f /tmp/cloudhost.log'"
echo ""
echo "手动登录远程服务器："
echo "  ssh $REMOTE_USER@$REMOTE_HOST"
echo ""
