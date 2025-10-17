@echo off
echo ========================================
echo 叶语项目一键安装所有依赖
echo ========================================

set SCRIPT_DIR=%~dp0

echo.
echo 开始安装所有依赖...

echo.
echo ========================================
echo 第一步：安装前端依赖
echo ========================================
call "%SCRIPT_DIR%install-client-deps.bat"

echo.
echo ========================================
echo 第二步：安装后端依赖
echo ========================================
call "%SCRIPT_DIR%install-server-deps.bat"

echo.
echo ========================================
echo 所有依赖安装完成！
echo ========================================

echo.
echo 下一步操作：
echo 1. 确保MySQL数据库服务已启动
echo 2. 确保Redis服务已启动
echo 3. 运行 start-dev.bat 启动开发环境

echo.
echo 或者直接运行：
echo scripts\start-dev.bat

echo.
pause
