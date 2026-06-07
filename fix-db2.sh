#!/bin/bash
set -e
echo "强制修复数据库..."

# 强制停止所有 MySQL 进程
pkill -9 mysqld 2>/dev/null || true
pkill -9 mariadbd 2>/dev/null || true
sleep 3

# 删除旧数据库并重建
rm -f /var/lib/mysql/mysql.sock 2>/dev/null || true

# 以跳过权限方式启动
mysqld --skip-grant-tables --skip-networking &
sleep 5

# 重置密码
mysql <<EOF
FLUSH PRIVILEGES;
SET GLOBAL super_read_only = 0;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'cloudhost123';
CREATE DATABASE IF NOT EXISTS cloudhost;
FLUSH PRIVILEGES;
EOF

# 重启
pkill -9 mysqld
sleep 2
systemctl start mariadb

# 测试
mysql -u root -pcloudhost123 -e "SELECT 'OK'" 2>/dev/null && echo "密码设置成功！" || echo "密码设置失败"

# 重启服务
cd /root/cloudhost-manager/server && pm2 restart cloudhost-server
