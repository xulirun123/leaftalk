@echo off
echo ========================================
echo 叶语前端项目依赖安装脚本
echo ========================================

cd /d "%~dp0.."

echo.
echo 当前目录: %CD%
echo 正在安装前端依赖...

call npm install

echo.
echo ========================================
echo 前端依赖安装完成！
echo ========================================

echo.
echo 已安装的主要依赖：
echo - vue@3 (Vue框架)
echo - vite (构建工具)
echo - vue-router (路由)
echo - pinia (状态管理)
echo - axios (HTTP客户端)
echo - @iconify/vue (图标库)
echo - typescript (TypeScript支持)

echo.
echo 启动开发服务器: npm run dev
echo 构建生产版本: npm run build
echo.
pause
