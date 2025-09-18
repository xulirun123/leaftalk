@echo off
echo ========================================
echo 调试页面刷新问题 - 一次性使用
echo ========================================

echo.
echo 正在检查可能的问题...

echo.
echo 1. 检查localStorage中的数据
echo    打开浏览器开发者工具 ^> Application ^> Local Storage
echo    查看是否有以下数据：
echo    - token: 用户认证令牌
echo    - user: 用户信息

echo.
echo 2. 检查控制台日志
echo    刷新页面时查看控制台输出：
echo    - 🔄 路由守卫中恢复用户状态
echo    - 🔒 已登录用户访问首页，重定向到聊天页
echo    - 🔒 需要认证的路由，重定向到登录页

echo.
echo 3. 可能的问题原因：
echo    a) token存在但无效
echo    b) 用户状态恢复失败
echo    c) 路由守卫执行顺序问题
echo    d) appStore导入失败

echo.
echo 4. 测试步骤：
echo    a) 登录成功后，检查localStorage
echo    b) 直接访问 http://127.0.0.1:5173/chat
echo    c) 刷新页面，观察控制台日志
echo    d) 检查网络请求是否有错误
echo.
echo 5. 新增的调试日志：
echo    - 🔄 开始恢复用户状态...
echo    - 📦 appStore恢复用户状态
echo    - ✅ 用户状态恢复成功
echo    - 🔒 路由守卫检查
echo    - 🔒 认证状态
echo    - 🔄 检查用户状态

echo.
echo 5. 如果问题依然存在：
echo    - 检查后端API是否正常响应
echo    - 检查token格式是否正确
echo    - 检查用户数据结构是否匹配

echo.
pause
