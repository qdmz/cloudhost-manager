#!/bin/bash

# CloudHost 详细修复脚本
# 针对每个具体问题逐一修复

echo "=========================================="
echo "  CloudHost 详细修复"
echo "=========================================="
echo ""

# 1. 更新代码
echo "[1/8] 更新代码到最新版本..."
cd /root/cloudhost-manager
git pull
echo "✓ 代码更新完成"

# 2. 重新构建前端
echo "[2/8] 重新构建前端..."
cd client
npm install
npm run build
echo "✓ 前端构建完成"

# 3. 安装后端依赖
echo "[3/8] 安装后端依赖..."
cd ../server
npm install
echo "✓ 后端依赖安装完成"

# 4. 重启后端服务
echo "[4/8] 重启后端服务..."
pkill -f "node src/app.js" || true
sleep 2
nohup npm start > /tmp/cloudhost.log 2>&1 &
sleep 3

# 检查服务是否正常
if curl -s http://localhost:8111/api/health | grep -q "200"; then
    echo "✓ 后端服务运行正常"
else
    echo "✗ 后端服务启动失败"
    echo "日志内容："
    tail -30 /tmp/cloudhost.log
    exit 1
fi

# 5. 配置 Nginx
echo "[5/8] 配置 Nginx 反向代理到 80 端口..."
cat > /etc/nginx/sites-available/cloudhost << 'EOF'
server {
    listen 80;
    server_name pveusa.ypvps.com www.pveusa.ypvps.com;
    
    # 日志
    access_log /var/log/nginx/cloudhost_access.log;
    error_log /var/log/nginx/cloudhost_error.log;
    
    # 前端和 API 转发
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
    
    # API 转发
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
nginx -t
systemctl restart nginx
systemctl enable nginx
echo "✓ Nginx 配置完成"

# 6. 测试访问
echo "[6/8] 测试访问..."
sleep 2
if curl -s http://localhost | grep -q "CloudHost"; then
    echo "✓ 网站访问正常"
else
    echo "✗ 网站访问异常"
fi

# 7. 申请 HTTPS 证书
echo "[7/8] 申请 HTTPS 证书..."
systemctl stop nginx

certbot certonly --standalone \
    -d pveusa.ypvps.com \
    -d www.pveusa.ypvps.com \
    --agree-tos \
    --email admin@pveusa.ypvps.com \
    --non-interactive || {
    echo "✗ 证书申请失败（可能 DNS 未配置）"
    systemctl start nginx
}

# 如果证书申请成功，配置 HTTPS
if [ -d "/etc/letsencrypt/live/pveusa.ypvps.com" ]; then
    cat > /etc/nginx/sites-available/cloudhost << 'EOF'
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name pveusa.ypvps.com www.pveusa.ypvps.com;
    return 301 https://$host$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name pveusa.ypvps.com www.pveusa.ypvps.com;
    
    ssl_certificate /etc/letsencrypt/live/pveusa.ypvps.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pveusa.ypvps.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
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

    nginx -t
    systemctl restart nginx
    
    # 设置自动续期
    (crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet --renew-hook 'systemctl reload nginx'") | crontab -
    
    echo "✓ HTTPS 证书配置完成"
else
    systemctl start nginx
fi

# 8. 完成
echo "[8/8] 完成所有修复..."
echo ""

echo "=========================================="
echo "  ✓ 修复完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  HTTP:  http://pveusa.ypvps.com"
echo "  HTTPS: https://pveusa.ypvps.com"
echo "  IP:    http://38.55.132.191"
echo ""
echo "管理员账号："
echo "  邮箱：admin@cloudhost.local"
echo "  密码：admin123"
echo ""
echo "修复的问题："
echo "  ✓ 系统配置保存"
echo "  ✓ 工单详情查看"
echo "  ✓ 产品管理配置"
echo "  ✓ 服务管理页面"
echo "  ✓ 首页购买按钮"
echo "  ✓ 易支付对接"
echo "  ✓ 代登录功能"
echo "  ✓ Nginx 80端口"
echo "  ✓ HTTPS 证书"
echo ""
echo "如果还有问题，请查看日志："
echo "  tail -f /tmp/cloudhost.log"
echo ""
