@echo off
echo ========================================
echo 叶语企业版 - 数据库用户设置
echo ========================================
echo.

echo 正在设置数据库用户...
echo 请输入MySQL root密码：

:: 执行用户设置SQL脚本
mysql -u root -p < database\setup_users.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 数据库用户设置成功！
    echo.
    echo 创建的用户：
    echo   - leaftalk_user (读写权限)
    echo   - leaftalk_readonly (只读权限)
    echo.
    echo 测试连接...
    mysql -u leaftalk_user -p"YeYu2024#SecurePass!" leaftalk_enterprise -e "SELECT 'Connection successful' as status;"
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ 用户连接测试成功！
    ) else (
        echo ❌ 用户连接测试失败
    )
) else (
    echo ❌ 数据库用户设置失败
    echo 请检查MySQL是否运行，以及root密码是否正确
)

echo.
pause
