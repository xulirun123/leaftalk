@echo off
echo ==========================================
echo 叶语项目服务器连接信息
echo ==========================================
echo.
echo 服务器IP: 120.24.148.204
echo 用户名: root
echo 密码: 314077060@qq.com
echo.
echo ==========================================
echo SSH连接命令
echo ==========================================
echo.
echo 方式1 - 使用Windows OpenSSH:
echo ssh root@120.24.148.204
echo.
echo 方式2 - 使用PuTTY:
echo 1. 打开PuTTY
echo 2. Host Name: 120.24.148.204
echo 3. Port: 22
echo 4. Connection Type: SSH
echo 5. 点击Open
echo 6. 输入用户名: root
echo 7. 输入密码: 314077060@qq.com
echo.
echo ==========================================
echo 部署步骤概览
echo ==========================================
echo.
echo 1. 连接服务器并检查当前状态
echo 2. 评估是否需要重装系统
echo 3. 安装必需软件 (Node.js, MySQL, Redis, Nginx)
echo 4. 上传叶语项目代码
echo 5. 配置数据库和环境变量
echo 6. 启动服务并测试
echo.
echo ==========================================
echo 准备工作
echo ==========================================
echo.
echo 请确保您有以下工具之一:
echo 1. Windows 10/11 内置OpenSSH客户端
echo 2. PuTTY SSH客户端
echo 3. 其他SSH客户端工具
echo.
echo 如需安装OpenSSH客户端:
echo 设置 ^> 应用 ^> 可选功能 ^> 添加功能 ^> OpenSSH客户端
echo.
pause
