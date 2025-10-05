#!/bin/bash

# 叶语项目服务器环境检查脚本
# 服务器: 120.24.148.204
# 用户: root

echo "=========================================="
echo "叶语项目服务器环境检查"
echo "服务器: 120.24.148.204"
echo "时间: $(date)"
echo "=========================================="

# 检查系统信息
echo ""
echo "🖥️  系统信息检查..."
echo "操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "内核版本: $(uname -r)"
echo "架构: $(uname -m)"

# 检查硬件资源
echo ""
echo "💾 硬件资源检查..."
echo "CPU核心数: $(nproc)"
echo "内存总量: $(free -h | grep Mem | awk '{print $2}')"
echo "可用内存: $(free -h | grep Mem | awk '{print $7}')"
echo "磁盘使用情况:"
df -h | grep -E '^/dev/'

# 检查网络
echo ""
echo "🌐 网络检查..."
echo "IP地址: $(hostname -I | awk '{print $1}')"
echo "DNS配置:"
cat /etc/resolv.conf | grep nameserver

# 检查已安装的软件
echo ""
echo "📦 已安装软件检查..."

# 检查Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: 未安装"
fi

# 检查npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm: 未安装"
fi

# 检查MySQL
if command -v mysql &> /dev/null; then
    echo "✅ MySQL: $(mysql --version | awk '{print $3}' | cut -d',' -f1)"
    systemctl is-active mysql && echo "   状态: 运行中" || echo "   状态: 未运行"
else
    echo "❌ MySQL: 未安装"
fi

# 检查Redis
if command -v redis-server &> /dev/null; then
    echo "✅ Redis: $(redis-server --version | awk '{print $3}' | cut -d'=' -f2)"
    systemctl is-active redis && echo "   状态: 运行中" || echo "   状态: 未运行"
else
    echo "❌ Redis: 未安装"
fi

# 检查Nginx
if command -v nginx &> /dev/null; then
    echo "✅ Nginx: $(nginx -v 2>&1 | awk '{print $3}' | cut -d'/' -f2)"
    systemctl is-active nginx && echo "   状态: 运行中" || echo "   状态: 未运行"
else
    echo "❌ Nginx: 未安装"
fi

# 检查PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
else
    echo "❌ PM2: 未安装"
fi

# 检查Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version | awk '{print $3}' | cut -d',' -f1)"
    systemctl is-active docker && echo "   状态: 运行中" || echo "   状态: 未运行"
else
    echo "❌ Docker: 未安装"
fi

# 检查端口占用
echo ""
echo "🔌 端口占用检查..."
ports=(22 80 443 3306 6379 8893 8894)
for port in "${ports[@]}"; do
    if netstat -tuln | grep ":$port " &> /dev/null; then
        echo "端口 $port: 已占用"
        netstat -tuln | grep ":$port " | head -1
    else
        echo "端口 $port: 可用"
    fi
done

# 检查防火墙状态
echo ""
echo "🔥 防火墙状态..."
if command -v ufw &> /dev/null; then
    echo "UFW状态: $(ufw status | head -1)"
elif command -v firewall-cmd &> /dev/null; then
    echo "Firewalld状态: $(firewall-cmd --state 2>/dev/null || echo '未运行')"
else
    echo "防火墙: 未检测到UFW或Firewalld"
fi

# 检查现有的Web服务
echo ""
echo "🌐 现有Web服务检查..."
if [ -d "/var/www" ]; then
    echo "Web目录存在: /var/www"
    ls -la /var/www/ 2>/dev/null || echo "无法访问/var/www目录"
else
    echo "Web目录不存在: /var/www"
fi

# 检查日志目录
echo ""
echo "📝 日志目录检查..."
log_dirs=("/var/log/nginx" "/var/log/mysql" "/var/log/redis")
for dir in "${log_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir 存在"
    else
        echo "❌ $dir 不存在"
    fi
done

# 检查磁盘空间详情
echo ""
echo "💿 磁盘空间详细信息..."
echo "根目录使用情况:"
du -sh /* 2>/dev/null | sort -hr | head -10

echo ""
echo "=========================================="
echo "环境检查完成"
echo "建议: 根据检查结果决定是否需要重新安装系统"
echo "=========================================="
