@echo off
echo ========================================
echo 创建ChatHome缺失文件脚本
echo ========================================

echo.
echo 正在创建缺失的目录和文件...

set PROJECT_DIR=F:\leaftalk\leaftalk-new\src

echo.
echo 1. 创建components目录结构...
mkdir "%PROJECT_DIR%\components\common" 2>nul
mkdir "%PROJECT_DIR%\components\icons" 2>nul
mkdir "%PROJECT_DIR%\composables" 2>nul
mkdir "%PROJECT_DIR%\stores" 2>nul
mkdir "%PROJECT_DIR%\services" 2>nul
mkdir "%PROJECT_DIR%\utils" 2>nul

echo.
echo 2. 从原项目复制缺失文件...
set SOURCE_DIR=F:\leaftalk\leaftalk-enterprise\src

if exist "%SOURCE_DIR%\components\common" (
    xcopy "%SOURCE_DIR%\components\common\*.vue" "%PROJECT_DIR%\components\common\" /Y /Q 2>nul
    echo ✅ common组件复制完成
)

if exist "%SOURCE_DIR%\components\icons" (
    xcopy "%SOURCE_DIR%\components\icons\*.vue" "%PROJECT_DIR%\components\icons\" /Y /Q 2>nul
    echo ✅ icons组件复制完成
)

if exist "%SOURCE_DIR%\composables" (
    xcopy "%SOURCE_DIR%\composables\*.ts" "%PROJECT_DIR%\composables\" /Y /Q 2>nul
    echo ✅ composables复制完成
)

if exist "%SOURCE_DIR%\stores" (
    xcopy "%SOURCE_DIR%\stores\*.ts" "%PROJECT_DIR%\stores\" /Y /Q 2>nul
    echo ✅ stores复制完成
)

if exist "%SOURCE_DIR%\services" (
    xcopy "%SOURCE_DIR%\services\*.ts" "%PROJECT_DIR%\services\" /Y /Q 2>nul
    echo ✅ services复制完成
)

if exist "%SOURCE_DIR%\utils" (
    xcopy "%SOURCE_DIR%\utils\*.ts" "%PROJECT_DIR%\utils\" /Y /Q 2>nul
    echo ✅ utils复制完成
)

echo.
echo ========================================
echo 文件创建完成！
echo ========================================

echo.
pause
