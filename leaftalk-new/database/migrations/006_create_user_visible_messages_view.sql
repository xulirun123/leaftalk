-- 创建用户可见消息列表视图
-- 迁移文件: 006_create_user_visible_messages_view.sql
-- 创建时间: 2025-01-08
-- 描述: 创建视图显示用户可见的消息列表，排除已删除的消息

-- 创建视图（注意：这个视图需要在查询时指定user_id参数）
CREATE VIEW v_user_visible_messages AS
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
