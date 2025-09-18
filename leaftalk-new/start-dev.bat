@echo off
echo ========================================
echo 叶语项目一键启动脚本
echo ========================================

echo.
echo 检查服务状态...

echo.
echo 1. 启动后端服务器...
cd server
start "叶语后端服务器" cmd /k "node app.js"
cd ..

echo.
echo 等待后端服务器启动...
timeout /t 3 /nobreak > nul

echo.
echo 2. 启动前端开发服务器...
start "叶语前端开发服务器" cmd /k "npm run dev"

echo.
echo ========================================
echo 服务启动完成！
echo ========================================

echo.
echo 服务地址：
echo - 前端: http://127.0.0.1:5173
echo - 后端: http://127.0.0.1:8893
echo - API健康检查: http://127.0.0.1:8893/api/health
echo.
echo 请确保以下服务已启动：
echo - MySQL数据库 (端口3306)
echo - Redis服务 (端口6379)
echo.
echo 按任意键关闭此窗口...
pause > nul
