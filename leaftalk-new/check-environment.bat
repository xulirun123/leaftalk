@echo off
echo ========================================
echo 叶语项目环境检查脚本
echo ========================================

echo.
echo 检查Node.js版本...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装或不在PATH中
    echo 请安装Node.js 16+
    goto :end
) else (
    echo ✅ Node.js 已安装
)

echo.
echo 检查npm版本...
npm --version
if %errorlevel% neq 0 (
    echo ❌ npm 未安装
    goto :end
) else (
    echo ✅ npm 已安装
)

echo.
echo 检查MySQL连接...
mysql --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ MySQL客户端未找到，请确保MySQL已安装
) else (
    echo ✅ MySQL客户端已安装
)

echo.
echo 检查Redis连接...
redis-cli --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Redis客户端未找到，请确保Redis已安装
) else (
    echo ✅ Redis客户端已安装
)

echo.
echo 检查项目文件...
if exist "package.json" (
    echo ✅ 前端package.json存在
) else (
    echo ❌ 前端package.json不存在
)

if exist "server\package.json" (
    echo ✅ 后端package.json存在
) else (
    echo ❌ 后端package.json不存在
)

if exist "server\.env" (
    echo ✅ 后端环境配置文件存在
) else (
    echo ❌ 后端环境配置文件不存在
)

echo.
echo ========================================
echo 环境检查完成！
echo ========================================

echo.
echo 如果所有检查都通过，可以运行：
echo 1. install-dependencies.bat (安装前端依赖)
echo 2. server\install-dependencies.bat (安装后端依赖)
echo 3. start-dev.bat (启动开发服务器)

:end
echo.
pause
