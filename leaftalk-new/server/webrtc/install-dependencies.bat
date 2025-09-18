@echo off
echo ========================================
echo 叶语后端服务器依赖安装脚本
echo ========================================

echo.
echo 正在安装后端依赖...
npm install

echo.
echo 正在安装额外的依赖包...
npm install redis
npm install baidu-aip
npm install express-fileupload

echo.
echo ========================================
echo 依赖安装完成！
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
echo 请确保以下服务已启动：
echo 1. MySQL数据库 (端口3306)
echo 2. Redis服务 (端口6379)
echo.
echo 然后运行: node app.js
echo.
pause
