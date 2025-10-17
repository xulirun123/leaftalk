@echo off
echo ========================================
echo 叶语项目一键启动开发环境
echo ========================================

set PROJECT_ROOT=%~dp0..

echo.
echo 项目根目录: %PROJECT_ROOT%

echo.
echo 1. 启动后端服务器...
cd /d "%PROJECT_ROOT%\server"
start "叶语后端服务器 - 端口8893" cmd /k "echo 后端服务器启动中... && node app.js"

echo.
echo 等待后端服务器启动...
timeout /t 3 /nobreak > nul

echo.
echo 2. 启动前端开发服务器...
cd /d "%PROJECT_ROOT%"
start "叶语前端开发服务器 - 端口5173" cmd /k "echo 前端开发服务器启动中... && npm run dev"

echo.
echo ========================================
echo 开发环境启动完成！
echo ========================================

echo.
echo 服务地址：
echo - 前端应用: http://127.0.0.1:5173
echo - 后端API: http://127.0.0.1:8893
echo - 健康检查: http://127.0.0.1:8893/api/health
echo - 用户列表: http://127.0.0.1:8893/api/dev/users

echo.
echo 测试账号：
echo - 用户名: testuser
echo - 密码: 123456
echo - 手机号: 17872886600

echo.
echo 注意：请确保MySQL和Redis服务已启动
echo.
pause
