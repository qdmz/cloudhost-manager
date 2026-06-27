#!/bin/bash
# CloudHost Manager 安装/升级脚本
# 用法: ./install.sh

set -e

echo "========================================"
echo "CloudHost Manager 安装/升级脚本"
echo "========================================"

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-cloudhost}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"

echo "[1/3] 检查数据库连接..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" 2>&1
echo "✓ 数据库连接成功"

echo ""
echo "[2/3] 执行数据库迁移..."
node src/migrations/001_add_node_fields.js
echo "✓ 数据库迁移完成"

echo ""
echo "[3/3] 重启服务..."
# 如果使用 PM2
if command -v pm2 &> /dev/null; then
  pm2 restart cloudhost
  echo "✓ PM2 服务已重启"
else
  # 杀死旧进程
  pkill -f "node.*app.js" 2>/dev/null || true
  sleep 2
  # 启动新进程
  nohup node src/app.js > logs/app.log 2>&1 &
  echo "✓ 服务已启动 (PID: $(cat logs/app.pid 2>/dev/null || echo 'unknown'))"
fi

echo ""
echo "========================================"
echo "安装/升级完成！"
echo "========================================"
