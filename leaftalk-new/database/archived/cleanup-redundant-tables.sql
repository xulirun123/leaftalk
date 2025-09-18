-- 清理冗余表脚本
-- 删除所有重复和过时的表结构

-- ================================
-- 1. 删除冗余的聊天相关表
-- ================================

-- 删除旧的chats表（功能被chat_conversations替代）
DROP TABLE IF EXISTS chats;

-- 删除旧的conversations表（功能被chat_conversations替代）
DROP TABLE IF EXISTS conversations;

-- 删除可能存在的其他重复表
DROP TABLE IF EXISTS chat_messages; -- 使用messages表统一
DROP TABLE IF EXISTS chat_participants; -- 使用chat_members表统一

-- ================================
-- 2. 删除过时的视图
-- ================================

DROP VIEW IF EXISTS v_user_chats;
DROP VIEW IF EXISTS user_chat_list;

-- ================================
-- 3. 删除可能存在的临时表
-- ================================

DROP TABLE IF EXISTS temp_chats;
DROP TABLE IF EXISTS backup_chats;
DROP TABLE IF EXISTS old_messages;

-- ================================
-- 4. 删除测试表
-- ================================

DROP TABLE IF EXISTS test_chats;
DROP TABLE IF EXISTS test_messages;
DROP TABLE IF EXISTS test_users;

-- ================================
-- 5. 清理完成提示
-- ================================

SELECT 'Redundant tables cleanup completed!' as status;
