#!/bin/bash
# CloudHost 数据库修复脚本 - 一键修复所有问题

set -e

echo "========================================"
echo "  CloudHost 数据库修复脚本"
echo "========================================"
echo ""

# 1. 停止 MariaDB
echo "[1/8] 停止 MariaDB..."
systemctl stop mariadb 2>/dev/null || true
pkill -9 mysqld 2>/dev/null || true
sleep 2

# 2. 以安全模式启动 MariaDB
echo "[2/8] 以安全模式启动 MariaDB..."
mysqld_safe --skip-grant-tables &
sleep 3

# 3. 等待 MariaDB 启动
echo "[3/8] 等待 MariaDB 启动..."
for i in {1..10}; do
    if mysql -u root -e "SELECT 1" &>/dev/null; then
        echo "MariaDB 已启动"
        break
    fi
    sleep 1
done

# 4. 重置 root 密码并创建数据库
echo "[4/8] 重置 root 密码并创建数据库..."
mysql -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'cloudhost123';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS cloudhost CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
EXIT;
EOF

echo "数据库密码已重置，数据库已创建"

# 5. 停止安全模式 MariaDB
echo "[5/8] 停止安全模式 MariaDB..."
pkill -9 mysqld 2>/dev/null || true
sleep 2

# 6. 正常启动 MariaDB
echo "[6/8] 正常启动 MariaDB..."
systemctl start mariadb

# 7. 修改 .env 配置
echo "[7/8] 修改 .env 配置..."
sed -i "s/DB_PASS=.*/DB_PASS=cloudhost123/" /root/cloudhost-manager/.env 2>/dev/null || true

# 8. 重启后端服务
echo "[8/8] 重启后端服务..."
cd /root/cloudhost-manager/server
pm2 restart cloudhost-server
sleep 3

# 验证
echo ""
echo "========================================"
echo "  验证服务状态"
echo "========================================"

# 检查 MariaDB
if mysql -u root -pcloudhost123 -e "SELECT 'OK' as status;" &>/dev/null; then
    echo "[✓] MariaDB 连接正常"
else
    echo "[✗] MariaDB 连接失败"
fi

# 检查数据库
if mysql -u root -pcloudhost123 -e "USE cloudhost; SELECT 'OK' as status;" &>/dev/null; then
    echo "[✓] cloudhost 数据库存在"
else
    echo "[✗] cloudhost 数据库不存在"
fi

# 检查后端服务
if curl -s http://localhost:8111/api/configs/site_name &>/dev/null; then
    echo "[✓] 后端服务正常运行"
else
    echo "[✗] 后端服务可能有问题，查看日志："
    pm2 logs cloudhost-server --lines 10
fi

echo ""
echo "========================================"
echo "  修复完成！"
echo ""
echo "  访问地址: https://pveusa.ypvps.com"
echo "  后台地址: https://pveusa.ypvps.com/admin"
echo "  管理员账号: admin / admin123"
echo ""
echo "  如有问题，查看日志: pm2 logs cloudhost-server"
echo "========================================"
