-- 添加成员头像字段到chat_conversations表
-- 用于存储群聊的成员头像列表（JSON格式）

USE leaftalk;

-- 检查字段是否已存在，如果不存在则添加
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'leaftalk' 
     AND TABLE_NAME = 'chat_conversations' 
     AND COLUMN_NAME = 'member_avatars') = 0,
    'ALTER TABLE chat_conversations ADD COLUMN member_avatars TEXT NULL COMMENT "群聊成员头像列表(JSON格式,最多9个)"',
    'SELECT "字段 member_avatars 已存在" as message'
  )
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 显示表结构确认
DESCRIBE chat_conversations;
