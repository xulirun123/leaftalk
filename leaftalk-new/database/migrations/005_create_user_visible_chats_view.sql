-- 创建用户可见聊天列表视图
-- 迁移文件: 005_create_user_visible_chats_view.sql
-- 创建时间: 2025-01-08
-- 描述: 创建视图显示用户可见的聊天列表，排除已删除的消息

-- 创建或替换视图
CREATE VIEW v_user_visible_chats AS
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
    COALESCE(cs.is_pinned, 0) as is_pinned,
    COALESCE(cs.is_muted, 0) as is_muted,
    COALESCE(cs.manual_unread_count, 0) as manual_unread_count
FROM chats c
INNER JOIN chat_participants cp ON c.id = cp.chat_id
LEFT JOIN chat_settings cs ON c.id = cs.chat_id AND cp.user_id = cs.user_id
WHERE cp.is_active = 1
ORDER BY 
    COALESCE(cs.is_pinned, 0) DESC,
    c.updated_at DESC
