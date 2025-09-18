@echo off
echo ========================================
echo 组件测试脚本 - 一次性使用
echo ========================================

echo.
echo 检查关键组件是否存在...

set PROJECT_DIR=F:\leaftalk\leaftalk-new

echo.
echo 1. 检查 MobileTabBar 组件...
if exist "%PROJECT_DIR%\src\components\mobile\MobileTabBar.vue" (
    echo ✅ MobileTabBar.vue 存在
) else (
    echo ❌ MobileTabBar.vue 缺失
)

echo.
echo 2. 检查 MobileTopBar 组件...
if exist "%PROJECT_DIR%\src\components\mobile\MobileTopBar.vue" (
    echo ✅ MobileTopBar.vue 存在
) else (
    echo ❌ MobileTopBar.vue 缺失
)

echo.
echo 3. 检查 ChatHome 页面...
if exist "%PROJECT_DIR%\src\modules\chat\pages\ChatHome.vue" (
    echo ✅ ChatHome.vue 存在
) else (
    echo ❌ ChatHome.vue 缺失
)

echo.
echo 4. 检查其他关键文件...
if exist "%PROJECT_DIR%\src\modules\auth\pages\Login.vue" (
    echo ✅ Login.vue 存在
) else (
    echo ❌ Login.vue 缺失
)

if exist "%PROJECT_DIR%\src\modules\auth\pages\IdentityVerificationNew2024.vue" (
    echo ✅ IdentityVerificationNew2024.vue 存在
) else (
    echo ❌ IdentityVerificationNew2024.vue 缺失
)

echo.
echo ========================================
echo 组件检查完成！
echo ========================================

echo.
echo 如果所有组件都存在，可以重启前端服务器测试
echo.
pause
