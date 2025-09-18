-- 叶语企业版数据库用户设置脚本
-- 执行前请确保以root用户登录MySQL

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS leaftalk_enterprise 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 创建主要用户（读写权限）
DROP USER IF EXISTS 'leaftalk_user'@'localhost';
CREATE USER 'leaftalk_user'@'localhost' IDENTIFIED BY 'YeYu2024#SecurePass!';

-- 创建只读用户
DROP USER IF EXISTS 'leaftalk_readonly'@'localhost';
CREATE USER 'leaftalk_readonly'@'localhost' IDENTIFIED BY 'YeYu2024#ReadOnly!';

-- 授予主要用户完整权限
GRANT ALL PRIVILEGES ON leaftalk_enterprise.* TO 'leaftalk_user'@'localhost';

-- 授予只读用户查询权限
GRANT SELECT ON leaftalk_enterprise.* TO 'leaftalk_readonly'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证用户创建
SELECT User, Host FROM mysql.user WHERE User LIKE 'leaftalk%';

-- 显示用户权限
SHOW GRANTS FOR 'leaftalk_user'@'localhost';
SHOW GRANTS FOR 'leaftalk_readonly'@'localhost';

-- 测试连接（可选）
-- 使用以下命令测试连接：
-- mysql -u leaftalk_user -p'YeYu2024#SecurePass!' leaftalk_enterprise -e "SELECT 'Connection successful' as status;"
