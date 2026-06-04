#!/bin/bash

# CloudHost 完整更新脚本
# 一次性解决所有已知问题

set -e

echo "=========================================="
echo "  CloudHost 完整问题修复脚本"
echo "=========================================="
echo ""

# 1. 更新代码
echo "[1/6] 更新代码..."
cd /root/cloudhost-manager
git pull

# 2. 构建前端
echo "[2/6] 重新构建前端..."
cd client
npm install
npm run build

# 3. 安装后端依赖
echo "[3/6] 安装后端依赖..."
cd ../server
npm install

# 4. 重启服务
echo "[4/6] 重启后端服务..."
pkill -f "node src/app.js" || true
sleep 2
nohup npm start > /tmp/cloudhost.log 2>&1 &
sleep 3

# 5. 检查服务状态
echo "[5/6] 检查服务状态..."
if curl -s http://localhost:8111/api/health > /dev/null; then
    echo "✓ 后端服务运行正常"
else
    echo "✗ 后端服务启动失败，请检查日志："
    tail -50 /tmp/cloudhost.log
    exit 1
fi

# 6. 配置 Nginx
echo "[6/6] 配置 Nginx 反向代理..."
cat > /etc/nginx/sites-available/cloudhost << 'EOF'
server {
    listen 80;
    server_name pveusa.ypvps.com www.pveusa.ypvps.com;
    
    access_log /var/log/nginx/cloudhost_access.log;
    error_log /var/log/nginx/cloudhost_error.log;
    
    location / {
        proxy_pass http://127.0.0.1:8111;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8111/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/cloudhost /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# 测试并重启 Nginx
nginx -t && systemctl restart nginx

echo ""
echo "=========================================="
echo "  ✓ 更新完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  http://pveusa.ypvps.com"
echo "  http://38.55.132.191"
echo ""
echo "管理员账号："
echo "  邮箱：admin@cloudhost.local"
echo "  密码：admin123"
echo ""
echo "修复内容："
echo "  ✓ 系统配置保存问题"
echo "  ✓ 工单系统查看详情"
echo "  ✓ 产品管理配置方案"
echo "  ✓ 服务管理页面"
echo "  ✓ 首页购买按钮"
echo "  ✓ 易支付对接（RSA签名）"
echo "  ✓ 代登录功能"
echo ""
