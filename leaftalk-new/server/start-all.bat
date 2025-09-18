@echo off
echo ========================================
echo 叶语统一服务器启动脚本
echo ========================================

echo.
echo 🔧 检查依赖安装状态...
if not exist "node_modules" (
    echo 📦 正在安装主服务器依赖...
    npm install
)

if not exist "webrtc\node_modules" (
    echo 📦 正在安装WebRTC服务器依赖...
    cd webrtc
    npm install
    cd ..
)

echo.
echo ✅ 依赖检查完成

echo.
echo 🚀 启动叶语统一服务器...
echo.
echo 📝 启动信息:
echo   - 主服务器: http://localhost:8893
echo   - WebRTC服务: 独立进程启动
echo   - 日志目录: ./logs/
echo   - 上传目录: ../uploads/
echo.

echo 🔄 正在启动主服务器...
start "叶语主服务器" cmd /k "npm start"

echo.
echo 🔄 正在启动WebRTC服务器...
start "叶语WebRTC服务器" cmd /k "npm run webrtc"

echo.
echo ========================================
echo 🎉 叶语统一服务器启动完成！
echo ========================================

echo.
echo 📋 服务状态:
echo   ✅ 主服务器: 已启动 (端口 8893)
echo   ✅ WebRTC服务器: 已启动 (独立进程)
echo.
echo 📝 使用说明:
echo   - 访问 http://localhost:8893 查看服务状态
echo   - 访问 http://localhost:8893/health 进行健康检查
echo   - WebRTC服务运行在独立进程中
echo   - 查看各自的终端窗口了解运行状态
echo.
echo 🛑 停止服务:
echo   - 关闭对应的终端窗口
echo   - 或在终端中按 Ctrl+C
echo.

pause
