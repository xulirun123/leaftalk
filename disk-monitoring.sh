#!/bin/bash
# 叶语服务器磁盘监控脚本

echo "=== 叶语服务器磁盘使用监控 ==="
echo "时间: $(date)"
echo

# 总体磁盘使用情况
echo "📊 总体磁盘使用:"
df -h /

# 计算使用百分比
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "当前使用率: ${USAGE}%"

# 预警检查
if [ $USAGE -gt 80 ]; then
    echo "🚨 警告: 磁盘使用率超过80%!"
elif [ $USAGE -gt 70 ]; then
    echo "⚠️  注意: 磁盘使用率超过70%"
else
    echo "✅ 磁盘使用率正常"
fi

echo
echo "📁 主要目录空间占用:"

# 叶语项目空间
echo "叶语项目:"
du -sh /var/www/leaftalk 2>/dev/null || echo "  未找到项目目录"

# 数据库空间
echo "MySQL数据库:"
du -sh /var/lib/mysql 2>/dev/null || echo "  未找到数据库目录"

# 日志空间
echo "系统日志:"
du -sh /var/log 2>/dev/null || echo "  未找到日志目录"

# Node.js模块
echo "Node.js模块:"
du -sh /var/www/leaftalk/node_modules 2>/dev/null || echo "  未找到node_modules"

# 上传文件
echo "上传文件:"
du -sh /var/www/leaftalk/uploads 2>/dev/null || echo "  未找到uploads目录"

echo
echo "🧹 清理建议:"

# 检查大文件
echo "大文件 (>100MB):"
find / -type f -size +100M 2>/dev/null | head -5

# 检查旧日志
echo "旧日志文件 (>30天):"
find /var/log -name "*.log" -mtime +30 2>/dev/null | head -5

# 检查临时文件
echo "临时文件:"
du -sh /tmp 2>/dev/null

echo
echo "💡 优化建议:"
if [ $USAGE -gt 70 ]; then
    echo "- 清理旧日志文件"
    echo "- 压缩或删除大文件"
    echo "- 考虑使用外部存储(OSS)"
    echo "- 定期清理数据库"
fi

echo "- 配置日志轮转"
echo "- 定期清理临时文件"
echo "- 监控数据库增长"

echo
echo "🔧 快速清理命令:"
echo "# 清理系统日志"
echo "journalctl --vacuum-time=30d"
echo
echo "# 清理临时文件"
echo "find /tmp -mtime +7 -delete"
echo
echo "# 清理旧的聊天文件"
echo "find /var/www/leaftalk/uploads/temp -mtime +7 -delete"
