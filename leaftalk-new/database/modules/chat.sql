-- 统一聊天系统数据库设计
-- 目标：消除重复表，使用统一的聊天系统

-- ================================
-- 1. 删除旧的重复表
-- ================================
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS conversations;

-- ================================
-- 2. 统一的聊天会话表
-- ================================
CREATE TABLE chat_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  conversation_id VARCHAR(64) NOT NULL COMMENT '会话唯一标识',
  type ENUM('private', 'group') NOT NULL COMMENT '会话类型',
  name VARCHAR(100) COMMENT '会话名称(群聊名称)',
  avatar VARCHAR(500) COMMENT '会话头像',
  description TEXT COMMENT '会话描述',
  creator_id BIGINT UNSIGNED NOT NULL COMMENT '创建者ID',
  member_count INT UNSIGNED DEFAULT 0 COMMENT '成员数量',
  last_message_id BIGINT UNSIGNED COMMENT '最后一条消息ID',
  last_message_time TIMESTAMP NULL COMMENT '最后消息时间',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (id),
  UNIQUE KEY uk_conversation_id (conversation_id),
  KEY idx_type (type),
  KEY idx_creator_id (creator_id),
  KEY idx_last_message_time (last_message_time),
  KEY idx_is_active (is_active),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- ================================
-- 3. 会话成员表
-- ================================
CREATE TABLE chat_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  conversation_id VARCHAR(64) NOT NULL COMMENT '会话标识',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  role ENUM('owner', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
  nickname VARCHAR(50) COMMENT '群内昵称',
  is_muted BOOLEAN DEFAULT FALSE COMMENT '是否被禁言',
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  unread_count INT UNSIGNED DEFAULT 0 COMMENT '未读消息数',
  last_read_message_id BIGINT UNSIGNED COMMENT '最后已读消息ID',
  last_read_time TIMESTAMP NULL COMMENT '最后已读时间',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (id),
  UNIQUE KEY uk_conversation_user (conversation_id, user_id),
  KEY idx_conversation_id (conversation_id),
  KEY idx_user_id (user_id),
  KEY idx_role (role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话成员表';

-- ================================
-- 4. 消息表
-- ================================
CREATE TABLE messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  message_id VARCHAR(64) NOT NULL COMMENT '消息唯一标识',
  conversation_id VARCHAR(64) NOT NULL COMMENT '会话标识',
  sender_id BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  reply_to_id BIGINT UNSIGNED COMMENT '回复的消息ID',
  type ENUM('text', 'image', 'voice', 'video', 'file', 'location', 'contact', 'redpacket', 'transfer', 'system') NOT NULL COMMENT '消息类型',
  content TEXT COMMENT '消息内容',
  media_data JSON COMMENT '媒体数据',
  status ENUM('sending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sending' COMMENT '消息状态',
  is_recalled BOOLEAN DEFAULT FALSE COMMENT '是否已撤回',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (id),
  UNIQUE KEY uk_message_id (message_id),
  KEY idx_conversation_id (conversation_id),
  KEY idx_sender_id (sender_id),
  KEY idx_sent_at (sent_at),
  KEY idx_type (type),
  KEY idx_status (status),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ================================
-- 5. 创建视图简化查询
-- ================================

-- 用户聊天列表视图
CREATE OR REPLACE VIEW user_chat_list AS
SELECT 
    cc.conversation_id,
    cc.type,
    cc.name,
    cc.avatar,
    cc.last_message_time,
    cm.user_id,
    cm.unread_count,
    cm.is_pinned,
    cm.is_muted,
    -- 获取最后一条消息
    (SELECT content FROM messages m 
     WHERE m.conversation_id = cc.conversation_id 
     ORDER BY m.sent_at DESC LIMIT 1) as last_message,
    -- 对于私聊，获取对方用户信息
    CASE 
        WHEN cc.type = 'private' THEN
            (SELECT u.nickname FROM chat_members cm2 
             JOIN users u ON cm2.user_id = u.id 
             WHERE cm2.conversation_id = cc.conversation_id 
             AND cm2.user_id != cm.user_id LIMIT 1)
        ELSE cc.name
    END as display_name,
    CASE 
        WHEN cc.type = 'private' THEN
            (SELECT u.avatar FROM chat_members cm2 
             JOIN users u ON cm2.user_id = u.id 
             WHERE cm2.conversation_id = cc.conversation_id 
             AND cm2.user_id != cm.user_id LIMIT 1)
        ELSE cc.avatar
    END as display_avatar
FROM chat_conversations cc
JOIN chat_members cm ON cc.conversation_id = cm.conversation_id
WHERE cc.is_active = TRUE;

-- ================================
-- 6. 数据迁移说明
-- ================================

/*
如果需要从旧表迁移数据：

1. 从chats表迁移到chat_conversations表：
INSERT INTO chat_conversations (conversation_id, type, name, creator_id)
SELECT CONCAT('migrated_', id), type, name, creator_id FROM chats;

2. 更新所有API代码，统一使用chat_conversations表

3. 删除旧表：
DROP TABLE chats;
DROP TABLE conversations;
*/
