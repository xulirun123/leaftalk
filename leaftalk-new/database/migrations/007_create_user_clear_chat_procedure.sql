-- 创建用户清空聊天记录存储过程
-- 迁移文件: 007_create_user_clear_chat_procedure.sql
-- 创建时间: 2025-01-08
-- 描述: 用户清空聊天记录的存储过程

DELIMITER $$

DROP PROCEDURE IF EXISTS UserClearChatHistory$$

CREATE PROCEDURE UserClearChatHistory(
    IN p_chat_id VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE msg_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 获取消息总数
    SELECT COUNT(*) INTO msg_count FROM messages WHERE chat_id = p_chat_id;

    -- 为用户标记所有消息为已删除
    INSERT IGNORE INTO message_deletions (message_id, user_id, deletion_type)
    SELECT id, p_user_id, 'chat_clear'
    FROM messages
    WHERE chat_id = p_chat_id;

    -- 标记用户的未读消息为已读
    UPDATE messages SET read_at = NOW()
    WHERE chat_id = p_chat_id AND sender_id != p_user_id AND read_at IS NULL;

    -- 记录操作日志
    INSERT INTO chat_deletion_log (chat_id, user_id, operation_type, reason)
    VALUES (p_chat_id, p_user_id, 'clear_history', CONCAT('用户清空聊天记录，共', msg_count, '条消息'));

    COMMIT;

    -- 返回结果
    SELECT msg_count as deleted_count, 'success' as status;
END$$

DELIMITER ;
