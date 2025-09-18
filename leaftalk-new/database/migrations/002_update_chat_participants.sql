-- 更新聊天参与者表，添加活跃状态和退出时间字段
-- 迁移文件: 002_update_chat_participants.sql
-- 创建时间: 2025-01-08
-- 描述: 支持用户退出聊天功能

-- 添加is_active字段（忽略错误如果已存在）
ALTER TABLE chat_participants
ADD COLUMN is_active TINYINT(1) DEFAULT 1 COMMENT '是否活跃（未退出）';

-- 添加left_at字段（忽略错误如果已存在）
ALTER TABLE chat_participants
ADD COLUMN left_at TIMESTAMP NULL DEFAULT NULL COMMENT '退出时间';

-- 添加索引（MySQL不支持IF NOT EXISTS语法用于索引）
ALTER TABLE chat_participants
ADD INDEX idx_is_active (is_active);

ALTER TABLE chat_participants
ADD INDEX idx_left_at (left_at);

-- 更新现有数据，确保is_active字段有值
UPDATE chat_participants SET is_active = 1 WHERE is_active IS NULL
