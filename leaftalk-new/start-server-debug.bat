@echo off
echo 启动叶语服务器（调试模式）...
echo.

echo 检查Node.js版本...
node --version
echo.

echo 检查当前目录...
cd
echo.

echo 进入服务器目录...
cd server
echo.

echo 检查服务器文件...
dir app.js
echo.

echo 启动服务器...
node app.js

echo.
echo 如果出现错误，请查看上面的信息
pause
