#!/bin/bash

echo "=========================================="
echo "  CloudHost 更新部署脚本"
echo "=========================================="

PROJECT_DIR="/root/cloudhost-manager"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"

# 0. 确保 .env 存在
echo "[0/5] 检查配置文件..."
if [ ! -f "$SERVER_DIR/.env" ]; then
    echo "  .env 文件不存在，创建默认配置..."
    if [ -f "$SERVER_DIR/.env.example" ]; then
        cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
        echo "  已从 .env.example 创建 .env"
    else
        cat > "$SERVER_DIR/.env" << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloudhost
DB_USER=root
DB_PASS=cloudhost123
APP_PORT=8111
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EOF
        echo "  已创建默认 .env"
    fi
fi

# 1. 强制更新代码
echo "[1/5] 更新代码..."
cd "$PROJECT_DIR"
git fetch --all
git reset --hard origin/main
echo "  代码已更新到最新版本"

# 2. 确保 closeTicket API 存在（如果缺失则添加）
echo "[2/5] 检查并修复 API..."
grep -q "closeTicket" "$CLIENT_DIR/src/api/admin.js" || echo 'export const closeTicket = (id) => request.post(`/admin/tickets/${id}/close`)' >> "$CLIENT_DIR/src/api/admin.js"
grep -q "useVoucher" "$CLIENT_DIR/src/views/Recharge.vue" || sed -i 's/import { recharge, getVouchers, getRechargeRecords }/import { recharge, useVoucher, getVouchers, getRechargeRecords }/g' "$CLIENT_DIR/src/views/Recharge.vue"
sed -i 's/await getVouchers({ code: voucherCode.value })/await useVoucher(voucherCode.value)/g' "$CLIENT_DIR/src/views/Recharge.vue"
echo "  API 检查完成"

# 3. 重新构建前端
echo "[3/5] 重新构建前端..."
cd "$CLIENT_DIR"
npm run build
echo "  前端构建完成"

# 4. 重启后端
echo "[4/5] 重启后端服务..."
cd "$SERVER_DIR"
pm2 restart cloudhost
echo "  后端已重启"

# 5. 验证服务
echo "[5/5] 验证服务状态..."
sleep 3
if pm2 status cloudhost | grep -q "online"; then
    echo ""
    echo "=========================================="
    echo "  ✅ 部署成功！"
    echo "=========================================="
    echo ""
    echo "访问地址：https://pveusa.ypvps.com"
    echo ""
    echo "如需查看日志："
    echo "  pm2 logs cloudhost"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "  ❌ 服务启动失败，请查看日志"
    echo "=========================================="
    echo ""
    echo "pm2 logs cloudhost"
    echo ""
fi
