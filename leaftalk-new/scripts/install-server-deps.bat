@echo off
echo ========================================
echo 叶语后端服务器依赖安装脚本
echo ========================================

cd /d "%~dp0..\server"

echo.
echo 当前目录: %CD%
echo 正在安装后端依赖...

echo.
echo 安装基础依赖...
call npm install

echo.
echo 安装额外依赖...
call npm install redis baidu-aip express-fileupload

echo.
echo ========================================
echo 后端依赖安装完成！
echo ========================================

echo.
echo 已安装的主要依赖：
echo - express (Web框架)
echo - mysql2 (MySQL数据库)
echo - bcryptjs (密码加密)
echo - jsonwebtoken (JWT认证)
echo - cors (跨域支持)
echo - socket.io (WebSocket)
echo - redis (Redis缓存)
echo - baidu-aip (百度OCR)
echo - express-fileupload (文件上传)
echo - multer (文件处理)
echo - dotenv (环境变量)

echo.
echo 启动后端服务器: node app.js
echo.
pause
