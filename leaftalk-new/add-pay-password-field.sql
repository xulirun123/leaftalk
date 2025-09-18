-- 添加支付密码字段到用户表
-- 执行此脚本来为现有的users表添加pay_password字段

USE `leaftalk-new`;

-- 检查pay_password字段是否已存在
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'leaftalk-new'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'pay_password'
);

-- 如果字段不存在，则添加它
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE users ADD COLUMN pay_password VARCHAR(255) DEFAULT NULL COMMENT "支付密码(加密存储)"',
    'SELECT "pay_password字段已存在" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 显示结果
SELECT 
    CASE 
        WHEN @column_exists = 0 THEN 'pay_password字段添加成功'
        ELSE 'pay_password字段已存在，无需添加'
    END as result;

-- 显示users表结构确认
DESCRIBE users;
