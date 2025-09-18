@echo off
echo ========================================
echo 叶语项目用户数据查询
echo ========================================

echo.
echo 正在查询数据库中的用户数据...

curl -s http://127.0.0.1:8893/api/dev/users

echo.
echo.
echo ========================================
echo 用户数据查询完成
echo ========================================

echo.
echo 说明：
echo - verified: true = 已实名认证
echo - verified: false = 未实名认证
echo - real_name: 真实姓名
echo - id_card: 身份证号（已脱敏）

echo.
pause
