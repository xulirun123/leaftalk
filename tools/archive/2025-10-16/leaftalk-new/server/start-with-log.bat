@echo off
echo ========================================
echo 启动后端服务器并记录日志
echo ========================================
echo.
echo 日志文件: server-log.txt
echo.

REM 删除旧日志
if exist server-log.txt del server-log.txt

REM 启动服务器并输出到文件
echo 正在启动服务器...
node app.js > server-log.txt 2>&1

pause

