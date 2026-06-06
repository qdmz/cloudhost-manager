#!/bin/bash

# CloudHost 一键安装脚本
# 支持 Ubuntu/Debian/CentOS

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

    # 读取 .env 配置
    local db_host=""
    local db_port=""
    local db_name=""
    local db_user=""
    local db_pass=""

    if [ -f ".env" ]; then
        db_host=$(grep -E '^DB_HOST=' .env | cut -d '=' -f 2 | tr -d '"')
        db_port=$(grep -E '^DB_PORT=' .env | cut -d '=' -f 2 | tr -d '"')
        db_name=$(grep -E '^DB_NAME=' .env | cut -d '=' -f 2 | tr -d '"')
        db_user=$(grep -E '^DB_USER=' .env | cut -d '=' -f 2 | tr -d '"')
        db_pass=$(grep -E '^DB_PASS=' .env | cut -d '=' -f 2 | tr -d '"')
    fi

    # 默认值
    db_host=${db_host:-localhost}
    db_port=${db_port:-3306}
    db_name=${db_name:-cloudhost}
    db_user=${db_user:-root}
    
    # 创建数据库
    if [[ -n "$db_pass" ]]; then
        mysql -h "$db_host" -P "$db_port" -u "$db_user" -p"$db_pass" 2>/dev/null -e "CREATE DATABASE IF NOT EXISTS \`$db_name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
            log_warn "无法自动创建数据库，请手动创建"
            log_info "执行: CREATE DATABASE \`$db_name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        }
    else
        mysql -h "$db_host" -P "$db_port" -u "$db_user" 2>/dev/null -e "CREATE DATABASE IF NOT EXISTS \`$db_name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
            log_warn "无法自动创建数据库，请手动创建"
            log_info "执行: CREATE DATABASE \`$db_name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        }
    fi

    log_info "数据库 $db_name 准备完成"
}

# 安装前端依赖
install_client_deps() {
    log_info "安装前端依赖..."
    cd client
    npm install
    cd ..
    log_info "前端依赖安装完成"
}

# 安装后端依赖
install_server_deps() {
    log_info "安装后端依赖..."
    cd server
    npm install
    log_info "后端依赖安装完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    cd server
    node src/init-db.js || {
        log_warn "数据库初始化可能遇到问题，请检查配置"
    }
    cd ..
    log_info "数据库初始化完成"
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
        else
            log_error "找不到 .env.example 配置模板"
            exit 1
        fi
    else
        log_info ".env 文件已存在"
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "   CloudHost 云主机管理平台一键安装"
    echo "========================================"
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
    echo "  后端: cd server && npm start"
    echo "  前端: cd client && npm run dev"
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
