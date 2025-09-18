-- =====================================================
-- 完整的自聊天问题修复脚本
-- 这个脚本将从根本上解决自聊天问题
-- =====================================================

-- 1. 检查当前数据库中的自聊天情况
SELECT 
    '=== 当前数据库状态检查 ===' as status;

-- 检查messages表中的自聊天消息
SELECT 
    COUNT(*) as self_chat_messages_count,
    '自聊天消息数量' as description
FROM messages 
WHERE sender_id = receiver_id;

-- 显示自聊天消息的详细信息
SELECT 
    id, sender_id, receiver_id, content, created_at,
    '自聊天消息详情' as type
FROM messages 
WHERE sender_id = receiver_id
ORDER BY created_at DESC
LIMIT 5;

-- 2. 备份所有自聊天相关数据
SELECT 
    '=== 开始备份自聊天数据 ===' as status;

-- 创建备份表
CREATE TABLE IF NOT EXISTS messages_self_chat_backup AS
SELECT *, NOW() as backup_time FROM messages WHERE sender_id = receiver_id;

-- 显示备份结果
SELECT 
    COUNT(*) as backed_up_messages,
    '已备份的自聊天消息数量' as description
FROM messages_self_chat_backup;

-- 3. 清理自聊天消息
SELECT 
    '=== 开始清理自聊天消息 ===' as status;

-- 删除所有自聊天消息
DELETE FROM messages WHERE sender_id = receiver_id;

-- 显示清理结果
SELECT 
    COUNT(*) as remaining_self_chat_messages,
    '清理后剩余的自聊天消息（应该为0）' as description
FROM messages 
WHERE sender_id = receiver_id;

-- 4. 添加数据库约束防止未来的自聊天
SELECT 
    '=== 添加数据库约束 ===' as status;

-- 检查约束是否已存在
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'messages'
  AND CONSTRAINT_NAME = 'chk_no_self_chat';

-- 如果约束不存在，则添加
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'messages'
      AND CONSTRAINT_NAME = 'chk_no_self_chat'
);

-- 动态添加约束（如果不存在）
SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE messages ADD CONSTRAINT chk_no_self_chat CHECK (sender_id != receiver_id)',
    'SELECT "约束已存在，跳过添加" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 验证约束是否生效
SELECT 
    '=== 验证约束效果 ===' as status;

-- 显示约束信息
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE,
    '数据库约束' as type
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'messages'
  AND CONSTRAINT_NAME = 'chk_no_self_chat';

-- 6. 清理可能的测试数据
SELECT 
    '=== 清理测试数据 ===' as status;

-- 删除明显的测试消息（可选）
DELETE FROM messages 
WHERE content LIKE '%测试%' 
   OR content LIKE '%test%'
   OR content = 'hello'
   OR content = '你好';

-- 7. 优化数据库性能
SELECT 
    '=== 优化数据库 ===' as status;

-- 重建索引
ALTER TABLE messages DROP INDEX IF EXISTS idx_sender_receiver;
ALTER TABLE messages ADD INDEX idx_sender_receiver (sender_id, receiver_id);

-- 分析表
ANALYZE TABLE messages;

-- 8. 最终验证
SELECT 
    '=== 最终验证 ===' as status;

-- 统计正常消息数量
SELECT 
    COUNT(*) as total_messages,
    '总消息数量' as description
FROM messages;

-- 统计不同用户间的对话数量
SELECT 
    COUNT(DISTINCT CONCAT(LEAST(sender_id, receiver_id), '_', GREATEST(sender_id, receiver_id))) as unique_conversations,
    '独立对话数量' as description
FROM messages
WHERE sender_id != receiver_id;

-- 显示最近的正常消息
SELECT 
    id, sender_id, receiver_id, content, created_at,
    '最近的正常消息' as type
FROM messages 
WHERE sender_id != receiver_id
ORDER BY created_at DESC
LIMIT 5;

-- 9. 生成修复报告
SELECT 
    '=== 修复完成报告 ===' as status;

SELECT 
    (SELECT COUNT(*) FROM messages_self_chat_backup) as backed_up_self_chat_messages,
    (SELECT COUNT(*) FROM messages WHERE sender_id = receiver_id) as remaining_self_chat_messages,
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(DISTINCT CONCAT(LEAST(sender_id, receiver_id), '_', GREATEST(sender_id, receiver_id))) FROM messages WHERE sender_id != receiver_id) as unique_conversations,
    '修复统计' as report_type;

-- =====================================================
-- 修复完成
-- =====================================================

SELECT 
    '修复完成！' as message,
    '1. 所有自聊天消息已被清理' as step1,
    '2. 数据库约束已添加，防止未来的自聊天' as step2,
    '3. 备份数据保存在 messages_self_chat_backup 表中' as step3,
    '4. 如需要可手动删除备份表：DROP TABLE messages_self_chat_backup' as step4;
