-- =====================================================
-- 修复自聊天问题的数据库迁移脚本
-- =====================================================

-- 1. 检查并显示现有的自聊天消息
SELECT 
    COUNT(*) as self_chat_count,
    'messages表中的自聊天消息数量' as description
FROM messages 
WHERE sender_id = receiver_id;

-- 2. 显示自聊天消息的详细信息（用于调试）
SELECT 
    id, sender_id, receiver_id, content, created_at,
    '自聊天消息' as issue_type
FROM messages 
WHERE sender_id = receiver_id
ORDER BY created_at DESC
LIMIT 10;

-- 3. 备份自聊天消息到临时表（以防需要恢复）
CREATE TABLE IF NOT EXISTS messages_self_chat_backup AS
SELECT * FROM messages WHERE sender_id = receiver_id;

-- 4. 删除所有自聊天消息
DELETE FROM messages WHERE sender_id = receiver_id;

-- 5. 添加数据库约束防止未来的自聊天消息
-- 注意：这个约束会阻止任何 sender_id = receiver_id 的插入
ALTER TABLE messages 
ADD CONSTRAINT chk_no_self_chat 
CHECK (sender_id != receiver_id);

-- 6. 验证约束是否生效
-- 这个查询应该返回错误，证明约束生效
-- INSERT INTO messages (id, sender_id, receiver_id, content, message_type, status) 
-- VALUES ('test_self_chat', 1, 1, 'test', 'text', 'sent');

-- 7. 显示清理结果
SELECT 
    COUNT(*) as remaining_self_chat_count,
    '清理后剩余的自聊天消息数量（应该为0）' as description
FROM messages 
WHERE sender_id = receiver_id;

-- 8. 显示约束信息
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE,
    '新增的约束' as description
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'messages'
  AND CONSTRAINT_NAME = 'chk_no_self_chat';

-- =====================================================
-- 完成
-- =====================================================

-- 执行完成后的说明：
-- 1. 所有自聊天消息已被删除
-- 2. 数据库约束已添加，防止未来创建自聊天消息
-- 3. 备份数据保存在 messages_self_chat_backup 表中
-- 4. 如果需要，可以手动删除备份表：DROP TABLE messages_self_chat_backup;
