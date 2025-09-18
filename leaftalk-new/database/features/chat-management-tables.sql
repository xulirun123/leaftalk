-- 聊天管理功能相关表结构
-- 用于支持置顶、标记未读、清空记录、删除聊天等功能

-- 1. 聊天设置表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS `chat_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(255) NOT NULL COMMENT '聊天ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `is_pinned` tinyint(1) DEFAULT 0 COMMENT '是否置顶',
  `is_muted` tinyint(1) DEFAULT 0 COMMENT '是否静音',
  `manual_unread_count` int(11) DEFAULT 0 COMMENT '手动设置的未读数',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chat_user` (`chat_id`, `user_id`),
  KEY `idx_chat_id` (`chat_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_pinned` (`is_pinned`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天设置表';

-- 2. 聊天参与者表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS `chat_participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(255) NOT NULL COMMENT '聊天ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `role` enum('admin', 'member') DEFAULT 'member' COMMENT '角色',
  `joined_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `left_at` timestamp NULL DEFAULT NULL COMMENT '离开时间',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否活跃',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chat_user_active` (`chat_id`, `user_id`, `is_active`),
  KEY `idx_chat_id` (`chat_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_joined_at` (`joined_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天参与者表';

-- 3. 聊天删除记录表（记录删除操作，用于审计）
CREATE TABLE IF NOT EXISTS `chat_deletion_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(255) NOT NULL COMMENT '聊天ID',
  `user_id` int(11) NOT NULL COMMENT '操作用户ID',
  `operation_type` enum('clear_history', 'delete_chat', 'leave_chat') NOT NULL COMMENT '操作类型',
  `keep_messages` tinyint(1) DEFAULT 1 COMMENT '是否保留消息',
  `deleted_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
  `reason` varchar(500) DEFAULT NULL COMMENT '删除原因',
  PRIMARY KEY (`id`),
  KEY `idx_chat_id` (`chat_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天删除记录表';

-- 4. 为现有的messages表添加索引（如果不存在）
-- 这些索引有助于提高查询性能
ALTER TABLE `messages` 
ADD INDEX IF NOT EXISTS `idx_chat_read` (`chat_id`, `read_at`),
ADD INDEX IF NOT EXISTS `idx_sender_chat` (`sender_id`, `chat_id`),
ADD INDEX IF NOT EXISTS `idx_created_at` (`created_at`);

-- 5. 为现有的chats表添加字段（如果不存在）
ALTER TABLE `chats` 
ADD COLUMN IF NOT EXISTS `is_deleted` tinyint(1) DEFAULT 0 COMMENT '是否已删除',
ADD COLUMN IF NOT EXISTS `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
ADD INDEX IF NOT EXISTS `idx_deleted` (`is_deleted`),
ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`);

-- 6. 插入一些示例数据（可选，用于测试）
-- 注意：这些数据仅用于开发测试，生产环境请谨慎使用

-- 示例：为用户1的聊天设置置顶
INSERT IGNORE INTO `chat_settings` (`chat_id`, `user_id`, `is_pinned`, `is_muted`) 
VALUES ('chat_1754011487643_zpm38mtn8', 1, 0, 0);

-- 示例：确保聊天参与者记录存在
INSERT IGNORE INTO `chat_participants` (`chat_id`, `user_id`, `role`) 
VALUES ('chat_1754011487643_zpm38mtn8', 1, 'member');

-- 7. 创建视图，方便查询聊天列表（包含设置信息）
CREATE OR REPLACE VIEW `v_user_chats` AS
SELECT 
    c.id as chat_id,
    c.name as chat_name,
    c.type as chat_type,
    c.avatar as chat_avatar,
    c.created_at as chat_created_at,
    c.updated_at as chat_updated_at,
    c.is_deleted as chat_is_deleted,
    cp.user_id,
    cp.role as user_role,
    cp.joined_at as user_joined_at,
    cp.is_active as user_is_active,
    cs.is_pinned,
    cs.is_muted,
    cs.manual_unread_count,
    cs.updated_at as settings_updated_at,
    -- 计算真实未读数
    COALESCE(
        (SELECT COUNT(*) 
         FROM messages m 
         WHERE m.chat_id = c.id 
           AND m.sender_id != cp.user_id 
           AND m.read_at IS NULL
        ), 0
    ) + COALESCE(cs.manual_unread_count, 0) as total_unread_count,
    -- 获取最后一条消息
    (SELECT m.content 
     FROM messages m 
     WHERE m.chat_id = c.id 
     ORDER BY m.created_at DESC 
     LIMIT 1
    ) as last_message,
    -- 获取最后消息时间
    (SELECT m.created_at 
     FROM messages m 
     WHERE m.chat_id = c.id 
     ORDER BY m.created_at DESC 
     LIMIT 1
    ) as last_message_time
FROM chats c
INNER JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN chat_settings cs ON c.id = cs.chat_id AND cp.user_id = cs.user_id
WHERE c.is_deleted = 0 
  AND cp.is_active = 1
ORDER BY 
    cs.is_pinned DESC,  -- 置顶的在前
    last_message_time DESC;  -- 按最后消息时间排序

-- 8. 创建存储过程，用于清理删除的聊天数据
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `CleanupDeletedChats`(
    IN days_to_keep INT DEFAULT 30
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE chat_id_to_clean VARCHAR(255);
    DECLARE cur CURSOR FOR 
        SELECT id FROM chats 
        WHERE is_deleted = 1 
          AND deleted_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    START TRANSACTION;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO chat_id_to_clean;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- 删除相关数据
        DELETE FROM messages WHERE chat_id = chat_id_to_clean;
        DELETE FROM chat_participants WHERE chat_id = chat_id_to_clean;
        DELETE FROM chat_settings WHERE chat_id = chat_id_to_clean;
        DELETE FROM chats WHERE id = chat_id_to_clean;

        -- 记录清理日志
        INSERT INTO chat_deletion_log (chat_id, user_id, operation_type, reason)
        VALUES (chat_id_to_clean, 0, 'delete_chat', CONCAT('Auto cleanup after ', days_to_keep, ' days'));

    END LOOP;
    CLOSE cur;

    COMMIT;
END //

DELIMITER ;

-- 9. 创建触发器，自动记录聊天删除操作
DELIMITER //

CREATE TRIGGER IF NOT EXISTS `tr_chat_delete_log` 
AFTER UPDATE ON `chats`
FOR EACH ROW
BEGIN
    IF NEW.is_deleted = 1 AND OLD.is_deleted = 0 THEN
        INSERT INTO chat_deletion_log (chat_id, user_id, operation_type, reason)
        VALUES (NEW.id, @current_user_id, 'delete_chat', 'Chat marked as deleted');
    END IF;
END //

DELIMITER ;

-- 完成
SELECT 'Chat management tables and procedures created successfully!' as status;
