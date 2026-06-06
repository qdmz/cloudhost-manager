#!/bin/bash

# CloudHost 一键安装脚本
# 支持 Ubuntu/Debian/CentOS

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 输出函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "请使用 root 用户运行此脚本"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [[ -f /etc/debian_version ]]; then
        OS="debian"
        log_info "检测到 Debian/Ubuntu 系统"
    elif [[ -f /etc/centos-release ]] || [[ -f /etc/redhat-release ]]; then
        OS="centos"
        log_info "检测到 CentOS/RHEL 系统"
    else
        log_error "不支持的操作系统"
        exit 1
    fi
}

# 安装 Node.js
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_info "Node.js 已安装: $NODE_VERSION"
    else
        log_info "正在安装 Node.js..."
        
        if [[ $OS == "debian" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        elif [[ $OS == "centos" ]]; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            yum install -y nodejs
        fi
        
        log_info "Node.js 安装完成: $(node -v)"
    fi
}

# 安装 MySQL
install_mysql() {
    if command -v mysql &> /dev/null; then
        MYSQL_VERSION=$(mysql --version)
        log_info "MySQL 已安装: $MYSQL_VERSION"
    else
        log_info "正在安装 MySQL..."
        
        if [[ $OS == "debian" ]]; then
            apt-get update
            apt-get install -y mariadb-server mariadb-client
            systemctl start mariadb
            systemctl enable mariadb
        elif [[ $OS == "centos" ]]; then
            yum install -y mariadb-server mariadb
            systemctl start mariadb
            systemctl enable mariadb
        fi
        
        log_info "MySQL 安装完成"
    fi
}

# 创建数据库
create_database() {
    log_info "创建数据库..."
    
    # 默认数据库配置
    local DB_NAME="cloudhost"
    local DB_USER="root"
    local DB_PASS=""
    local DB_HOST="localhost"
    local DB_PORT="3306"
    
    # 从 .env 读取配置
    if [ -f ".env" ]; then
        while IFS='=' read -r key value; do
            # 去除首尾空格和引号
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs | sed 's/^["'"'"']//;s/["'"'"']$//')
            
            case "$key" in
                "DB_NAME") DB_NAME="$value" ;;
                "DB_USER") DB_USER="$value" ;;
                "DB_PASS") DB_PASS="$value" ;;
                "DB_HOST") DB_HOST="$value" ;;
                "DB_PORT") DB_PORT="$value" ;;
            esac
        done < .env
    fi

    log_info "数据库配置: host=$DB_HOST, port=$DB_PORT, database=$DB_NAME, user=$DB_USER"
    
    # 创建数据库
    local mysql_cmd="mysql"
    if [ "$DB_HOST" != "localhost" ]; then
        mysql_cmd="$mysql_cmd -h $DB_HOST"
    fi
    mysql_cmd="$mysql_cmd -P $DB_PORT -u $DB_USER"
    
    if [ -n "$DB_PASS" ]; then
        mysql_cmd="$mysql_cmd -p\"$DB_PASS\""
    fi
    
    log_info "正在创建数据库..."
    $mysql_cmd -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_info "数据库 $DB_NAME 创建成功"
    else
        log_warn "无法自动创建数据库，请手动执行以下命令："
        echo ""
        echo "  mysql -u root -p"
        echo "  CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        echo "  EXIT;"
        echo ""
    fi
}

# 安装前端依赖
install_client_deps() {
    log_info "安装前端依赖..."
    if [ -d "client" ]; then
        cd client
        npm install
        cd ..
        log_info "前端依赖安装完成"
    else
        log_error "找不到 client 目录"
    fi
}

# 安装后端依赖
install_server_deps() {
    log_info "安装后端依赖..."
    if [ -d "server" ]; then
        cd server
        npm install
        cd ..
        log_info "后端依赖安装完成"
    else
        log_error "找不到 server 目录"
    fi
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    if [ -d "server" ]; then
        cd server
        if [ -f "src/init-db.js" ]; then
            node src/init-db.js
            log_info "数据库初始化完成"
        else
            log_error "找不到 init-db.js"
        fi
        cd ..
    else
        log_error "找不到 server 目录"
    fi
}

# 配置环境变量
setup_env() {
    # 先检查项目根目录，再检查 server 目录
    local env_example=""
    
    if [ -f ".env.example" ]; then
        env_example=".env.example"
    elif [ -f "server/.env.example" ]; then
        env_example="server/.env.example"
    fi

    if [ ! -f ".env" ]; then
        log_info "创建 .env 配置文件..."
        if [ -n "$env_example" ]; then
            cp "$env_example" .env
            log_warn "请编辑 .env 文件配置数据库和API密钥"
            log_info "配置文件位置: $SCRIPT_DIR/.env"
        else
            log_error "找不到 .env.example 配置模板"
            exit 1
        fi
    else
        log_info ".env 配置文件已存在"
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "   CloudHost 云主机管理平台一键安装"
    echo "========================================"
    echo ""
    echo "当前目录: $(pwd)"
    echo ""

    check_root
    detect_os
    install_nodejs
    install_mysql

    # 配置环境变量
    setup_env

    # 询问是否创建数据库
    read -p "是否创建数据库？(Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        create_database
    fi

    # 安装依赖
    install_client_deps
    install_server_deps

    # 询问是否初始化数据库
    read -p "是否初始化数据库？(Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        init_database
    fi

    echo ""
    echo "========================================"
    echo "   安装完成！"
    echo "========================================"
    echo ""
    echo "启动服务命令："
    echo "  后端: cd $SCRIPT_DIR/server && npm start"
    echo "  前端: cd $SCRIPT_DIR/client && npm run dev"
    echo ""
    echo "默认账号："
    echo "  管理后台: admin / admin123"
    echo "  测试账号: testuser / test123"
    echo ""
    echo "访问地址："
    echo "  前台: http://localhost:3000"
    echo "  后台: http://localhost:3000/admin"
    echo ""
}

# 运行主函数
main "$@"
