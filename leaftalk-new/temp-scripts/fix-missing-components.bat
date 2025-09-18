@echo off
echo ========================================
echo 修复缺失组件脚本 - 一次性使用
echo ========================================

echo.
echo 正在从原项目复制缺失的组件...

set SOURCE_DIR=F:\leaftalk\leaftalk-enterprise
set TARGET_DIR=F:\leaftalk\leaftalk-new

echo.
echo 1. 复制 MobileTabBar 组件...
if exist "%SOURCE_DIR%\src\components\mobile\MobileTabBar.vue" (
    mkdir "%TARGET_DIR%\src\components\mobile" 2>nul
    copy "%SOURCE_DIR%\src\components\mobile\MobileTabBar.vue" "%TARGET_DIR%\src\components\mobile\MobileTabBar.vue"
    echo ✅ MobileTabBar.vue 复制成功
) else (
    echo ❌ 源文件不存在: MobileTabBar.vue
)

echo.
echo 2. 复制 MobileTopBar 组件...
if exist "%SOURCE_DIR%\src\components\mobile\MobileTopBar.vue" (
    copy "%SOURCE_DIR%\src\components\mobile\MobileTopBar.vue" "%TARGET_DIR%\src\components\mobile\MobileTopBar.vue"
    echo ✅ MobileTopBar.vue 复制成功
) else (
    echo ❌ 源文件不存在: MobileTopBar.vue
)

echo.
echo 3. 复制 ChatHome 页面...
if exist "%SOURCE_DIR%\src\modules\chat\pages\ChatHome.vue" (
    mkdir "%TARGET_DIR%\src\modules\chat\pages" 2>nul
    copy "%SOURCE_DIR%\src\modules\chat\pages\ChatHome.vue" "%TARGET_DIR%\src\modules\chat\pages\ChatHome.vue"
    echo ✅ ChatHome.vue 复制成功
) else (
    echo ❌ 源文件不存在: ChatHome.vue
)

echo.
echo 4. 复制其他可能缺失的组件...
if exist "%SOURCE_DIR%\src\components\mobile" (
    xcopy "%SOURCE_DIR%\src\components\mobile\*.vue" "%TARGET_DIR%\src\components\mobile\" /Y /Q 2>nul
    echo ✅ 其他mobile组件复制完成
)

echo.
echo ========================================
echo 组件修复完成！
echo ========================================

echo.
echo 修复的组件：
echo - MobileTabBar.vue (底部导航栏)
echo - MobileTopBar.vue (顶部导航栏)  
echo - ChatHome.vue (聊天首页)
echo - 其他mobile组件

echo.
echo 请重启前端服务器以应用修改
echo.
pause
