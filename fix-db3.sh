#!/bin/bash
set -e
echo "========================================"
echo "  CloudHost 数据库强制修复脚本"
echo "========================================"

# 强制停止所有 MySQL 进程
echo "[1/7] 强制停止 MariaDB..."
pkill -9 mysqld 2>/dev/null || true
pkill -9 mariadbd 2>/dev/null || true
pkill -9 mysqld_safe 2>/dev/null || true
sleep 3

# 确保 socket 目录存在
mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld 2>/dev/null || true

# 以 mysql 用户启动安全模式
echo "[2/7] 以安全模式启动 MariaDB..."
if [ -f /usr/bin/mysqld_safe ]; then
    su - mysql -s /bin/bash -c "mysqld_safe --skip-grant-tables --skip-networking &" 2>/dev/null || true
else
    mysqld_safe --skip-grant-tables --skip-networking &
fi
sleep 5

# 检查是否启动成功
if ! mysql --protocol=TCP -u root 2>/dev/null; then
    echo "[3/7] 尝试直接启动..."
    /usr/sbin/mysqld --user=mysql --skip-grant-tables --skip-networking &
    sleep 5
fi

# 检查是否连接成功
echo "[4/7] 重置 root 密码..."
mysql --protocol=TCP -u root <<'EOF'
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'cloudhost123';
CREATE DATABASE IF NOT EXISTS cloudhost CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
EOF

echo "[5/7] 测试数据库连接..."
if mysql --protocol=TCP -u root -pcloudhost123 -e "SELECT 'OK' as test" cloudhost 2>/dev/null; then
    echo "数据库连接成功！"
else
    echo "尝试通过 socket 连接..."
    mysql -u root -pcloudhost123 -e "SELECT 'OK'" 2>/dev/null && echo "Socket 连接成功！" || echo "连接失败"
fi

echo "[6/7] 重启 MariaDB..."
pkill -9 mysqld 2>/dev/null || true
sleep 2
systemctl start mariadb 2>/dev/null || service mariadb start 2>/dev/null || true
sleep 3

echo "[7/7] 验证服务..."
if mysql -u root -pcloudhost123 -e "SELECT 'OK' as test" cloudhost 2>/dev/null; then
    echo "数据库修复成功！"
else
    mysql -u root -pcloudhost123 -e "SELECT 'OK'" 2>/dev/null && echo "数据库修复成功！" || echo "需要手动检查"
fi

# 重启后端服务
echo "重启后端服务..."
cd /root/cloudhost-manager/server && pm2 restart cloudhost-server 2>/dev/null || pm2 start npm --name "cloudhost-server" -- start
sleep 2
pm2 status

echo "========================================"
echo "  修复完成！"
echo "========================================"