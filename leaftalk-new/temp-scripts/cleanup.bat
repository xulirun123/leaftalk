@echo off
echo ========================================
echo 清理临时脚本 - 删除temp-scripts目录
echo ========================================

echo.
echo 警告：此操作将删除整个temp-scripts目录
echo 包含的文件：
echo - fix-missing-components.bat
echo - test-components.bat  
echo - cleanup.bat (本脚本)

echo.
set /p confirm=确认删除？(y/N): 

if /i "%confirm%"=="y" (
    echo.
    echo 正在删除temp-scripts目录...
    cd ..
    rmdir /s /q temp-scripts
    echo ✅ temp-scripts目录已删除
) else (
    echo.
    echo ❌ 操作已取消
)

echo.
pause
