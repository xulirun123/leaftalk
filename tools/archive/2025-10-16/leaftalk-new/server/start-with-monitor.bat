@echo off
echo ========================================
echo 叶语服务器监控启动脚本
echo ========================================

echo.
echo 🚀 启动叶语服务器监控器...
echo.
echo 功能特性:
echo - 自动启动服务器
echo - 定期健康检查 (每30秒)
echo - 自动重启崩溃的服务器
echo - 详细日志记录
echo - 最多重启10次
echo.

echo 📍 服务器地址:
echo - HTTP API: http://localhost:8893
echo - WebSocket: ws://localhost:8893
echo - 健康检查: http://localhost:8893/health
echo.

echo 📋 日志文件:
echo - 监控日志: logs/monitor.log
echo - 应用日志: logs/application-*.log
echo - 错误日志: logs/error-*.log
echo.

echo ⚠️ 注意事项:
echo - 使用 Ctrl+C 安全停止监控
echo - 监控器会自动处理服务器崩溃
echo - 达到最大重启次数后会停止监控
echo.

echo ========================================
echo 正在启动监控器...
echo ========================================

node monitor-server.js

echo.
echo 监控器已停止
pause
