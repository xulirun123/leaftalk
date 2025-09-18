#!/bin/bash

# 叶语应用 - 统一启动脚本 (Linux/Mac版本)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "========================================"
echo "🍃 叶语应用 - 统一启动脚本"
echo "========================================"
echo -e "${NC}"

# 检查Redis是否安装
check_redis() {
    if command -v redis-server &> /dev/null; then
        echo -e "${GREEN}✅ Redis已安装${NC}"
        return 0
    else
        echo -e "${RED}❌ Redis未安装，请先安装Redis${NC}"
        echo "Ubuntu/Debian: sudo apt-get install redis-server"
        echo "CentOS/RHEL: sudo yum install redis"
        echo "macOS: brew install redis"
        return 1
    fi
}

# 启动Redis
start_redis() {
    echo -e "${BLUE}🔄 启动Redis服务...${NC}"
    
    # 检查Redis是否已运行
    if pgrep redis-server > /dev/null; then
        echo -e "${GREEN}✅ Redis服务已运行${NC}"
    else
        # 尝试启动Redis
        if command -v systemctl &> /dev/null; then
            # 使用systemctl (systemd)
            sudo systemctl start redis
        elif command -v service &> /dev/null; then
            # 使用service
            sudo service redis-server start
        else
            # 手动启动
            redis-server redis.conf &
        fi
        
        sleep 2
        
        # 验证Redis是否启动成功
        if redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Redis启动成功${NC}"
        else
            echo -e "${RED}❌ Redis启动失败${NC}"
            return 1
        fi
    fi
}

# 启动后端服务器
start_backend() {
    echo -e "${BLUE}🔄 启动后端服务器...${NC}"
    
    # 检查Node.js是否安装
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js未安装${NC}"
        return 1
    fi
    
    # 启动后端
    nohup node server/app.js > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    sleep 3
    
    # 检查后端是否启动成功
    if curl -s http://localhost:8893/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务器启动成功 (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⏳ 后端服务器正在启动中...${NC}"
    fi
}

# 启动前端服务器
start_frontend() {
    echo -e "${BLUE}🔄 启动前端开发服务器...${NC}"
    
    # 检查npm是否安装
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm未安装${NC}"
        return 1
    fi
    
    # 启动前端
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    echo -e "${GREEN}✅ 前端服务器启动成功 (PID: $FRONTEND_PID)${NC}"
}

# 显示服务状态
show_status() {
    echo -e "${GREEN}"
    echo "========================================"
    echo "🎉 所有服务启动完成！"
    echo "========================================"
    echo -e "${NC}"
    echo "📊 服务状态:"
    echo "  🔧 Redis:     127.0.0.1:6379"
    echo "  🚀 后端:      http://localhost:8893"
    echo "  🌐 前端:      http://127.0.0.1:5173"
    echo "  🔍 健康检查:  http://localhost:8893/health"
    echo ""
    echo "📝 常用命令:"
    echo "  - 查看Redis状态: redis-cli ping"
    echo "  - 查看后端日志: tail -f backend.log"
    echo "  - 查看前端日志: tail -f frontend.log"
    echo "  - 停止所有服务: ./stop-all.sh"
    echo ""
    echo "⚠️  服务在后台运行，使用 ./stop-all.sh 停止"
    echo "========================================"
}

# 创建停止脚本
create_stop_script() {
    cat > stop-all.sh << 'EOF'
#!/bin/bash

echo "🔄 正在停止所有服务..."

# 停止后端
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ 后端服务器已停止"
    fi
    rm -f backend.pid
fi

# 停止前端
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ 前端服务器已停止"
    fi
    rm -f frontend.pid
fi

# 清理日志文件（可选）
# rm -f backend.log frontend.log

echo "🎉 所有服务已停止"
EOF
    chmod +x stop-all.sh
}

# 主函数
main() {
    # 检查Redis
    if ! check_redis; then
        exit 1
    fi
    
    # 启动Redis
    if ! start_redis; then
        exit 1
    fi
    
    # 启动后端
    start_backend
    
    # 启动前端
    start_frontend
    
    # 创建停止脚本
    create_stop_script
    
    # 显示状态
    show_status
    
    # 尝试打开浏览器（如果支持）
    if command -v xdg-open &> /dev/null; then
        xdg-open http://127.0.0.1:5173 &
    elif command -v open &> /dev/null; then
        open http://127.0.0.1:5173 &
    fi
}

# 运行主函数
main
