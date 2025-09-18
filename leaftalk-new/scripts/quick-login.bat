@echo off
echo ========================================
echo 叶语项目快速登录
echo ========================================

echo.
echo 可用的测试账号：

echo.
echo 1. 已实名认证用户：
echo    - 用户名: 阳静达 (ID: 1)
echo    - 真实姓名: 谭如英
echo    - 状态: 已认证

echo.
echo 2. 已实名认证用户：
echo    - 用户名: 兴海清 (ID: 2)  
echo    - 真实姓名: 徐礼润
echo    - 状态: 已认证

echo.
echo 3. 测试用户：
echo    - 用户名: testuser
echo    - 密码: 123456
echo    - 手机号: 17872886600
echo    - 状态: 可登录测试

echo.
echo 4. 未认证用户：
echo    - 用户名: testuser2
echo    - 状态: 未实名认证

echo.
echo ========================================
echo 登录地址: http://127.0.0.1:5173/login
echo ========================================

echo.
echo 正在打开登录页面...
start http://127.0.0.1:5173/login

echo.
pause
