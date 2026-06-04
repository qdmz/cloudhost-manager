#!/bin/bash

# CloudHost 服务管理脚本
# 用于启动、停止、重启服务

SERVICE_NAME="cloudhost"
APP_DIR="/root/cloudhost-manager/server"
LOG_FILE="/tmp/cloudhost.log"
PM2_CONFIG="/root/cloudhost-manager/ecosystem.config.js"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

case "$1" in
    start)
        echo -e "${BLUE}启动 CloudHost 服务...${NC}"
        
        # 检查服务是否已运行
        if pm2 list | grep -q "$SERVICE_NAME"; then
            echo -e "${YELLOW}服务已在运行中${NC}"
        else
            cd $APP_DIR
            pm2 start $PM2_CONFIG
            pm2 save
            echo -e "${GREEN}服务启动成功${NC}"
        fi
        
        # 检查 Nginx
        if systemctl is-active --quiet nginx; then
            echo -e "${GREEN}Nginx 运行正常${NC}"
        else
            echo -e "${YELLOW}Nginx 未运行，正在启动...${NC}"
            systemctl start nginx
            systemctl enable nginx
        fi
        ;;
        
    stop)
        echo -e "${BLUE}停止 CloudHost 服务...${NC}"
        pm2 stop $SERVICE_NAME
        echo -e "${GREEN}服务已停止${NC}"
        ;;
        
    restart)
        echo -e "${BLUE}重启 CloudHost 服务...${NC}"
        pm2 restart $SERVICE_NAME
        systemctl restart nginx
        echo -e "${GREEN}服务重启成功${NC}"
        ;;
        
    status)
        echo -e "${BLUE}CloudHost 服务状态${NC}"
        echo ""
        echo -e "${BLUE}PM2 进程状态:${NC}"
        pm2 list
        echo ""
        echo -e "${BLUE}Nginx 状态:${NC}"
        systemctl status nginx | grep -E "(Active|loaded)"
        echo ""
        echo -e "${BLUE}端口监听状态:${NC}"
        netstat -tlnp | grep -E "(80|443|8111)" || ss -tlnp | grep -E "(80|443|8111)"
        ;;
        
    logs)
        echo -e "${BLUE}查看 CloudHost 日志 (Ctrl+C 退出)${NC}"
        if [ -f "$LOG_FILE" ]; then
            tail -f $LOG_FILE
        else
            pm2 logs $SERVICE_NAME --lines 50
        fi
        ;;
        
    logs-nginx)
        echo -e "${BLUE}查看 Nginx 日志 (Ctrl+C 退出)${NC}"
        tail -f /var/log/nginx/cloudhost_access.log
        ;;
        
    update)
        echo -e "${BLUE}更新 CloudHost...${NC}"
        
        # 停止服务
        pm2 stop $SERVICE_NAME
        
        # 更新代码
        cd /root/cloudhost-manager
        git pull
        
        # 重新构建前端
        cd client
        npm run build
        
        # 安装后端依赖
        cd ../server
        npm install
        
        # 重启服务
        pm2 restart $SERVICE_NAME
        
        echo -e "${GREEN}更新完成${NC}"
        ;;
        
    uninstall)
        echo -e "${RED}警告：即将卸载 CloudHost 服务！${NC}"
        read -p "确定要继续吗？(yes/no): " confirm
        
        if [ "$confirm" = "yes" ]; then
            echo -e "${BLUE}卸载 CloudHost...${NC}"
            
            # 停止服务
            pm2 delete $SERVICE_NAME
            pm2 save
            
            # 停止 Nginx
            systemctl stop nginx
            rm -f /etc/nginx/sites-available/cloudhost
            rm -f /etc/nginx/sites-enabled/cloudhost
            
            echo -e "${GREEN}卸载完成${NC}"
        else
            echo -e "${YELLOW}取消卸载${NC}"
        fi
        ;;
        
    *)
        echo -e "${BLUE}CloudHost 服务管理脚本${NC}"
        echo ""
        echo -e "${YELLOW}用法:${NC}"
        echo -e "  ${GREEN}$0 start${NC}     - 启动服务"
        echo -e "  ${GREEN}$0 stop${NC}      - 停止服务"
        echo -e "  ${GREEN}$0 restart${NC}    - 重启服务"
        echo -e "  ${GREEN}$0 status${NC}     - 查看服务状态"
        echo -e "  ${GREEN}$0 logs${NC}       - 查看服务日志"
        echo -e "  ${GREEN}$0 logs-nginx${NC} - 查看 Nginx 日志"
        echo -e "  ${GREEN}$0 update${NC}     - 更新代码并重启"
        echo -e "  ${GREEN}$0 uninstall${NC}  - 卸载服务"
        echo ""
        ;;
esac
