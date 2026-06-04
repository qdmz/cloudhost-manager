#!/bin/bash

# CloudHost 服务管理脚本
# 使用方法:
#   ./cloudhost-service.sh start   - 启动服务
#   ./cloudhost-service.sh stop    - 停止服务
#   ./cloudhost-service.sh restart - 重启服务
#   ./cloudhost-service.sh status - 查看状态

APP_DIR="/root/cloudhost-manager/server"
LOG_FILE="/tmp/cloudhost.log"
PID_FILE="/tmp/cloudhost.pid"

start() {
    echo "正在启动 CloudHost 服务..."
    
    # 检查是否已运行
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo "服务已在运行 (PID: $OLD_PID)"
            return 1
        fi
    fi
    
    # 进入目录
    cd "$APP_DIR"
    
    # 启动服务
    nohup npm start > "$LOG_FILE" 2>&1 &
    
    # 保存PID
    echo $! > "$PID_FILE"
    
    sleep 2
    
    # 检查是否启动成功
    if curl -s http://localhost:8111/api/health > /dev/null; then
        echo "✅ 服务启动成功 (PID: $(cat $PID_FILE))"
        echo "访问地址: http://你的服务器IP:8111"
    else
        echo "❌ 服务启动失败，请查看日志: tail -f $LOG_FILE"
    fi
}

stop() {
    echo "正在停止 CloudHost 服务..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            kill "$PID"
            rm -f "$PID_FILE"
            echo "✅ 服务已停止"
        else
            echo "服务未运行"
            rm -f "$PID_FILE"
        fi
    else
        # 尝试通过进程名查找
        PIDS=$(pgrep -f "node src/app.js")
        if [ -n "$PIDS" ]; then
            kill $PIDS 2>/dev/null
            echo "✅ 服务已停止 (通过进程名)"
        else
            echo "服务未运行"
        fi
    fi
}

restart() {
    stop
    sleep 2
    start
}

status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "✅ 服务正在运行 (PID: $PID)"
            
            # 检查健康状态
            if curl -s http://localhost:8111/api/health > /dev/null; then
                echo "✅ 健康检查通过"
            else
                echo "⚠️ 健康检查失败"
            fi
        else
            echo "❌ 服务未运行 (PID文件存在但进程不存在)"
        fi
    else
        # 尝试通过进程名查找
        PIDS=$(pgrep -f "node src/app.js")
        if [ -n "$PIDS" ]; then
            echo "✅ 服务正在运行 (PID: $PIDS)"
        else
            echo "❌ 服务未运行"
        fi
    fi
    
    echo ""
    echo "日志查看: tail -f $LOG_FILE"
    echo "最新日志:"
    tail -5 "$LOG_FILE" 2>/dev/null || echo "暂无日志"
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    *)
        echo "使用方法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0
