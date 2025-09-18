-- 叶语项目数据库初始化脚本
-- 执行此脚本来创建所有必需的数据库和表

-- 1. 创建主数据库
CREATE DATABASE IF NOT EXISTS `leaftalk` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 创建消息系统数据库
CREATE DATABASE IF NOT EXISTS `yeyu_messages` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 3. 创建用户和权限（可选，根据需要调整）
-- CREATE USER IF NOT EXISTS 'yeyu_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON leaftalk.* TO 'yeyu_user'@'localhost';
-- GRANT ALL PRIVILEGES ON yeyu_messages.* TO 'yeyu_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 显示创建的数据库
SHOW DATABASES LIKE '%leaftalk%';
SHOW DATABASES LIKE '%yeyu%';

-- 使用说明
SELECT 'Database initialization completed!' as Status;
SELECT 'Next steps:' as Info;
SELECT '1. Execute message-system-schema.sql to create tables' as Step1;
SELECT '2. Configure your application database connection' as Step2;
SELECT '3. Run your application migrations if any' as Step3;
