@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🍃 叶语应用 - 生产环境启动脚本
echo ========================================
echo.

:: 设置颜色
color 0A

:: 检查dist目录是否存在
if not exist "dist" (
    echo ❌ dist目录不存在，请先运行 npm run build
    pause
    exit /b 1
)

echo ✅ 检测到dist目录，准备启动生产服务器...
echo.

:: 检查Redis服务状态
echo 🔍 检查Redis服务状态...
sc query redis | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo ✅ Redis服务已运行
) else (
    echo 🔄 启动Redis服务...
    net start redis
    if %errorlevel% == 0 (
        echo ✅ Redis服务启动成功
    ) else (
        echo ❌ Redis服务启动失败，尝试手动启动...
        start /b "Redis Server" "C:\Program Files\Redis\redis-server.exe" redis.conf
        timeout /t 2 >nul
    )
)

:: 测试Redis连接
echo 🔍 测试Redis连接...
"C:\Program Files\Redis\redis-cli.exe" ping >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Redis连接正常
) else (
    echo ❌ Redis连接失败
    pause
    exit /b 1
)

echo.
echo 🔄 启动后端服务器...
echo ========================================

:: 启动后端服务器
cd server
start /b "Backend Server" cmd /c "node app.js"
cd ..

:: 等待后端启动
echo 🔄 等待后端服务器启动...
timeout /t 3 >nul

:: 检查后端服务器状态
curl -s http://localhost:8893/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ 后端服务器启动成功
) else (
    echo ⏳ 后端服务器正在启动中...
)

echo.
echo 🔄 启动前端生产服务器...
echo ========================================

:: 启动前端服务器
start /b "Frontend Server" cmd /c "node frontend-server.js"

:: 等待前端启动
echo 🔄 等待前端服务器启动...
timeout /t 3 >nul

echo.
echo ========================================
echo 🎉 生产环境服务启动完成！
echo ========================================
echo.
echo 📊 服务状态:
echo   🔧 Redis:     127.0.0.1:6379
echo   🚀 后端:      http://localhost:8893
echo   🌐 前端:      http://localhost:3000
echo   🔍 健康检查:  http://localhost:8893/health
echo.
echo 📝 常用命令:
echo   - 查看Redis状态: redis-cli ping
echo   - 停止所有服务: Ctrl+C
echo   - 重启服务: 重新运行此脚本
echo.
echo ⚠️  请保持此窗口打开以维持服务运行
echo ========================================

:: 打开浏览器
timeout /t 2 >nul
start http://localhost:3000

:: 保持窗口打开
echo.
echo 按任意键停止所有服务...
pause >nul

:: 清理进程
echo.
echo 🔄 正在停止服务...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im redis-server.exe >nul 2>&1
echo ✅ 服务已停止
pause

