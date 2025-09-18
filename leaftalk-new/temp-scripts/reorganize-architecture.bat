@echo off
echo ========================================
echo 按新架构重新整理文件结构
echo ========================================

echo.
echo 正在按模块化架构重新整理文件...

set PROJECT_DIR=F:\leaftalk\leaftalk-new\src

echo.
echo 1. 移动stores到shared目录...
if exist "%PROJECT_DIR%\stores" (
    move "%PROJECT_DIR%\stores\*.ts" "%PROJECT_DIR%\shared\stores\" 2>nul
    echo ✅ stores移动到shared/stores
)

echo.
echo 2. 移动services到shared目录...
if exist "%PROJECT_DIR%\services" (
    move "%PROJECT_DIR%\services\*.ts" "%PROJECT_DIR%\shared\services\" 2>nul
    echo ✅ services移动到shared/services
)

echo.
echo 3. 移动utils到shared目录...
if exist "%PROJECT_DIR%\utils" (
    move "%PROJECT_DIR%\utils\*.ts" "%PROJECT_DIR%\shared\utils\" 2>nul
    echo ✅ utils移动到shared/utils
)

echo.
echo 4. 移动config到shared目录...
if exist "%PROJECT_DIR%\config" (
    move "%PROJECT_DIR%\config\*.ts" "%PROJECT_DIR%\shared\config\" 2>nul
    echo ✅ config移动到shared/config
)

echo.
echo 5. 移动types到shared目录...
if exist "%PROJECT_DIR%\types" (
    move "%PROJECT_DIR%\types\*.ts" "%PROJECT_DIR%\shared\types\" 2>nul
    echo ✅ types移动到shared/types
)

echo.
echo 6. 移动constants到shared目录...
if exist "%PROJECT_DIR%\constants" (
    move "%PROJECT_DIR%\constants\*.ts" "%PROJECT_DIR%\shared\constants\" 2>nul
    echo ✅ constants移动到shared/constants
)

echo.
echo 7. 移动composables到shared目录...
if exist "%PROJECT_DIR%\composables" (
    move "%PROJECT_DIR%\composables\*.ts" "%PROJECT_DIR%\shared\composables\" 2>nul
    echo ✅ composables移动到shared/composables
)

echo.
echo 8. 移动components到shared目录...
if exist "%PROJECT_DIR%\components" (
    move "%PROJECT_DIR%\components\*" "%PROJECT_DIR%\shared\components\" 2>nul
    echo ✅ components移动到shared/components
)

echo.
echo ========================================
echo 文件结构重新整理完成！
echo ========================================

echo.
echo 新的架构：
echo - shared/stores/ (状态管理)
echo - shared/services/ (API服务)
echo - shared/utils/ (工具函数)
echo - shared/config/ (配置文件)
echo - shared/types/ (类型定义)
echo - shared/constants/ (常量)
echo - shared/composables/ (组合式函数)
echo - shared/components/ (共享组件)

echo.
pause
