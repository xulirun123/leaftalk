-- 创建用户退出聊天存储过程
-- 迁移文件: 008_create_user_leave_chat_procedure.sql
-- 创建时间: 2025-01-08
-- 描述: 用户退出聊天的存储过程

DELIMITER $$

DROP PROCEDURE IF EXISTS UserLeaveChat$$

CREATE PROCEDURE UserLeaveChat(
    IN p_chat_id VARCHAR(255),
    IN p_user_id INT,
    IN p_keep_messages BOOLEAN DEFAULT TRUE
)
BEGIN
    DECLARE other_users_count INT DEFAULT 0;
    DECLARE msg_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

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

        INSERT IGNORE INTO message_deletions (message_id, user_id, deletion_type)
        SELECT id, p_user_id, 'chat_leave'
        FROM messages
        WHERE chat_id = p_chat_id;
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
END$$

DELIMITER ;
