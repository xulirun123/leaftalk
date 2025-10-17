-- 添加 inviter_id 字段到 group_invite_links 表
-- 如果字段已存在，这个命令会失败，但不会影响数据库

-- 检查字段是否存在
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'leaftalk-new'
    AND TABLE_NAME = 'group_invite_links'
    AND COLUMN_NAME = 'inviter_id'
);

-- 如果字段不存在，添加它
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE `group_invite_links` ADD COLUMN `inviter_id` INT NOT NULL COMMENT ''创建邀请链接的用户ID'' AFTER `invite_code`',
    'SELECT ''inviter_id column already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 显示表结构确认
DESCRIBE `group_invite_links`;

