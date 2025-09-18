-- 用户特定删除功能的数据库表结构
-- 支持每个用户独立删除聊天记录和聊天项，不影响其他用户

-- 1. 消息删除记录表（软删除）
CREATE TABLE IF NOT EXISTS `message_deletions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_id` int(11) NOT NULL COMMENT '消息ID',
  `user_id` int(11) NOT NULL COMMENT '删除操作的用户ID',
  `deleted_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
  `deletion_type` enum('user_delete', 'chat_clear', 'chat_leave') DEFAULT 'user_delete' COMMENT '删除类型',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_message_user` (`message_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_deletion_type` (`deletion_type`),
  FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户消息删除记录表';

-- 2. 确保chat_participants表有正确的字段
ALTER TABLE `chat_participants` 
ADD COLUMN IF NOT EXISTS `is_active` tinyint(1) DEFAULT 1 COMMENT '是否活跃（未退出）',
ADD COLUMN IF NOT EXISTS `left_at` timestamp NULL DEFAULT NULL COMMENT '退出时间',
ADD INDEX IF NOT EXISTS `idx_is_active` (`is_active`),
ADD INDEX IF NOT EXISTS `idx_left_at` (`left_at`);

-- 3. 创建视图：用户可见的聊天列表
CREATE OR REPLACE VIEW `v_user_visible_chats` AS
SELECT 
    c.id as chat_id,
    c.name as chat_name,
    c.type as chat_type,
    c.avatar as chat_avatar,
    c.created_at as chat_created_at,
    c.updated_at as chat_updated_at,
    cp.user_id,
    cp.role as user_role,
    cp.joined_at as user_joined_at,
    cp.is_active as user_is_active,
    cp.left_at as user_left_at,
    cs.is_pinned,
    cs.is_muted,
    cs.manual_unread_count,
    -- 计算用户可见的未读数（排除已删除的消息）
    COALESCE(
        (SELECT COUNT(*) 
         FROM messages m 
         LEFT JOIN message_deletions md ON m.id = md.message_id AND md.user_id = cp.user_id
         WHERE m.chat_id = c.id 
           AND m.sender_id != cp.user_id 
           AND m.read_at IS NULL
           AND md.id IS NULL  -- 排除用户已删除的消息
        ), 0
    ) + COALESCE(cs.manual_unread_count, 0) as visible_unread_count,
    -- 获取用户可见的最后一条消息
    (SELECT m.content 
     FROM messages m 
     LEFT JOIN message_deletions md ON m.id = md.message_id AND md.user_id = cp.user_id
     WHERE m.chat_id = c.id AND md.id IS NULL
     ORDER BY m.created_at DESC 
     LIMIT 1
    ) as visible_last_message,
    -- 获取用户可见的最后消息时间
    (SELECT m.created_at 
     FROM messages m 
     LEFT JOIN message_deletions md ON m.id = md.message_id AND md.user_id = cp.user_id
     WHERE m.chat_id = c.id AND md.id IS NULL
     ORDER BY m.created_at DESC 
     LIMIT 1
    ) as visible_last_message_time
FROM chats c
INNER JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN chat_settings cs ON c.id = cs.chat_id AND cp.user_id = cs.user_id
WHERE cp.is_active = 1  -- 只显示用户未退出的聊天
ORDER BY 
    cs.is_pinned DESC,  -- 置顶的在前
    visible_last_message_time DESC;  -- 按最后消息时间排序

-- 4. 创建视图：用户可见的消息列表
CREATE OR REPLACE VIEW `v_user_visible_messages` AS
SELECT 
    m.id,
    m.chat_id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.type,
    m.read_at,
    m.created_at,
    m.updated_at,
    u.nickname as sender_name,
    u.avatar as sender_avatar
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM message_deletions md 
    WHERE md.message_id = m.id 
    -- 注意：这个视图需要在查询时指定user_id参数
);

-- 5. 创建存储过程：用户清空聊天记录
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `UserClearChatHistory`(
    IN p_chat_id VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE msg_id INT;
    DECLARE msg_count INT DEFAULT 0;
    DECLARE cur CURSOR FOR 
        SELECT id FROM messages WHERE chat_id = p_chat_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    START TRANSACTION;

    -- 获取消息总数
    SELECT COUNT(*) INTO msg_count FROM messages WHERE chat_id = p_chat_id;

    -- 为用户标记所有消息为已删除
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO msg_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- 插入删除记录（忽略重复）
        INSERT IGNORE INTO message_deletions (message_id, user_id, deletion_type)
        VALUES (msg_id, p_user_id, 'chat_clear');

    END LOOP;
    CLOSE cur;

    -- 标记用户的未读消息为已读
    UPDATE messages SET read_at = NOW() 
    WHERE chat_id = p_chat_id AND sender_id != p_user_id AND read_at IS NULL;

    -- 记录操作日志
    INSERT INTO chat_deletion_log (chat_id, user_id, operation_type, reason)
    VALUES (p_chat_id, p_user_id, 'clear_history', CONCAT('用户清空聊天记录，共', msg_count, '条消息'));

    COMMIT;

    -- 返回结果
    SELECT msg_count as deleted_count, 'success' as status;
END //

DELIMITER ;

-- 6. 创建存储过程：用户退出聊天
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `UserLeaveChat`(
    IN p_chat_id VARCHAR(255),
    IN p_user_id INT,
    IN p_keep_messages BOOLEAN DEFAULT TRUE
)
BEGIN
    DECLARE other_users_count INT DEFAULT 0;
    DECLARE msg_count INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    DECLARE msg_id INT;
    DECLARE cur CURSOR FOR 
        SELECT id FROM messages WHERE chat_id = p_chat_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    START TRANSACTION;

    -- 检查是否还有其他活跃用户
    SELECT COUNT(*) INTO other_users_count 
    FROM chat_participants 
    WHERE chat_id = p_chat_id AND user_id != p_user_id AND is_active = 1;

    -- 更新用户的参与状态
    UPDATE chat_participants 
    SET is_active = 0, left_at = NOW() 
    WHERE chat_id = p_chat_id AND user_id = p_user_id;

    -- 删除用户的聊天设置
    DELETE FROM chat_settings 
    WHERE chat_id = p_chat_id AND user_id = p_user_id;

    -- 如果保留消息，为用户标记所有消息为已删除
    IF p_keep_messages THEN
        SELECT COUNT(*) INTO msg_count FROM messages WHERE chat_id = p_chat_id;

        OPEN cur;
        read_loop: LOOP
            FETCH cur INTO msg_id;
            IF done THEN
                LEAVE read_loop;
            END IF;

            INSERT IGNORE INTO message_deletions (message_id, user_id, deletion_type)
            VALUES (msg_id, p_user_id, 'chat_leave');

        END LOOP;
        CLOSE cur;
    END IF;

    -- 记录操作日志
    INSERT INTO chat_deletion_log (chat_id, user_id, operation_type, reason)
    VALUES (p_chat_id, p_user_id, 'delete_chat', 
            CASE 
                WHEN other_users_count > 0 THEN '用户退出聊天'
                ELSE '删除聊天（最后用户）'
            END);

    COMMIT;

    -- 返回结果
    SELECT 
        other_users_count as remaining_users,
        msg_count as hidden_messages,
        'success' as status;
END //

DELIMITER ;

-- 7. 创建触发器：自动清理孤立的聊天
DELIMITER //

CREATE TRIGGER IF NOT EXISTS `tr_cleanup_empty_chats` 
AFTER UPDATE ON `chat_participants`
FOR EACH ROW
BEGIN
    DECLARE active_count INT DEFAULT 0;
    
    -- 如果用户变为非活跃状态
    IF NEW.is_active = 0 AND OLD.is_active = 1 THEN
        -- 检查该聊天是否还有活跃用户
        SELECT COUNT(*) INTO active_count 
        FROM chat_participants 
        WHERE chat_id = NEW.chat_id AND is_active = 1;
        
        -- 如果没有活跃用户，标记聊天为已删除
        IF active_count = 0 THEN
            UPDATE chats 
            SET is_deleted = 1, deleted_at = NOW() 
            WHERE id = NEW.chat_id;
        END IF;
    END IF;
END //

DELIMITER ;

-- 8. 插入测试数据（可选）
-- 确保现有的聊天参与者记录有正确的is_active状态
UPDATE chat_participants SET is_active = 1 WHERE is_active IS NULL;

-- 完成
SELECT 'User-specific deletion system created successfully!' as status,
       'Users can now delete chat records and leave chats without affecting others' as description;
