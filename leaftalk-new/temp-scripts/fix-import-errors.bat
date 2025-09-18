@echo off
echo ========================================
echo 修复导入错误脚本 - 一次性使用
echo ========================================

echo.
echo 正在修复stores中的导入错误...

set PROJECT_DIR=F:\leaftalk\leaftalk-new
set SOURCE_DIR=F:\leaftalk\leaftalk-enterprise

echo.
echo 1. 创建config目录...
mkdir "%PROJECT_DIR%\src\config" 2>nul

echo.
echo 2. 复制config文件...
if exist "%SOURCE_DIR%\src\config" (
    xcopy "%SOURCE_DIR%\src\config\*.ts" "%PROJECT_DIR%\src\config\" /Y /Q 2>nul
    echo ✅ config文件复制完成
)

echo.
echo 3. 检查其他可能缺失的目录...
mkdir "%PROJECT_DIR%\src\types" 2>nul
mkdir "%PROJECT_DIR%\src\constants" 2>nul
mkdir "%PROJECT_DIR%\src\plugins" 2>nul

if exist "%SOURCE_DIR%\src\types" (
    xcopy "%SOURCE_DIR%\src\types\*.ts" "%PROJECT_DIR%\src\types\" /Y /Q 2>nul
    echo ✅ types文件复制完成
)

if exist "%SOURCE_DIR%\src\constants" (
    xcopy "%SOURCE_DIR%\src\constants\*.ts" "%PROJECT_DIR%\src\constants\" /Y /Q 2>nul
    echo ✅ constants文件复制完成
)

if exist "%SOURCE_DIR%\src\plugins" (
    xcopy "%SOURCE_DIR%\src\plugins\*.ts" "%PROJECT_DIR%\src\plugins\" /Y /Q 2>nul
    echo ✅ plugins文件复制完成
)

echo.
echo ========================================
echo 导入错误修复完成！
echo ========================================

echo.
echo 修复的问题：
echo - config/database.ts 导入错误
echo - 其他可能的缺失目录

echo.
pause
