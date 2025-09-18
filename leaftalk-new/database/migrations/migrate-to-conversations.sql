-- 数据库结构优化：添加Conversations表
-- 解决聊天消息无法正确识别聊天对象的问题

-- 1. 创建会话表
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(50) PRIMARY KEY COMMENT '会话ID，格式：conv_1_3',
  type ENUM('private', 'group') DEFAULT 'private' COMMENT '会话类型',
  participant_ids JSON COMMENT '参与者ID列表，如：[1, 3]',
  name VARCHAR(100) COMMENT '会话名称（群聊使用）',
  avatar VARCHAR(500) COMMENT '会话头像',
  creator_id BIGINT COMMENT '创建者ID',
  last_message_id BIGINT COMMENT '最后一条消息ID',
  last_message_time TIMESTAMP NULL COMMENT '最后消息时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_type (type),
  INDEX idx_creator_id (creator_id),
  INDEX idx_last_message_time (last_message_time),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- 2. 备份现有消息表
CREATE TABLE IF NOT EXISTS messages_backup AS SELECT * FROM messages;

-- 3. 创建新的消息表结构
DROP TABLE IF EXISTS messages_new;
CREATE TABLE messages_new (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL COMMENT '会话ID',
  sender_id BIGINT NOT NULL COMMENT '发送者ID',
  content TEXT NOT NULL COMMENT '消息内容',
  type ENUM('text', 'image', 'voice', 'video', 'file', 'location', 'card', 'system') DEFAULT 'text' COMMENT '消息类型',
  reply_to_id BIGINT NULL COMMENT '回复的消息ID',
  is_recalled BOOLEAN DEFAULT FALSE COMMENT '是否已撤回',
  recalled_at TIMESTAMP NULL COMMENT '撤回时间',
  read_at TIMESTAMP NULL COMMENT '已读时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES messages_new(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表（新结构）';

-- 4. 数据迁移：从旧消息表迁移到新结构
-- 首先创建会话记录
INSERT IGNORE INTO conversations (id, type, participant_ids, creator_id, created_at)
SELECT DISTINCT
  CONCAT('conv_', 
    LEAST(m1.sender_id, m1.chat_id), '_', 
    GREATEST(m1.sender_id, m1.chat_id)
  ) as conversation_id,
  'private' as type,
  JSON_ARRAY(
    LEAST(m1.sender_id, m1.chat_id), 
    GREATEST(m1.sender_id, m1.chat_id)
  ) as participant_ids,
  LEAST(m1.sender_id, m1.chat_id) as creator_id,
  MIN(m1.created_at) as created_at
FROM messages_backup m1
WHERE m1.chat_id IS NOT NULL 
  AND m1.sender_id IS NOT NULL
  AND m1.chat_id != m1.sender_id
GROUP BY 
  LEAST(m1.sender_id, m1.chat_id), 
  GREATEST(m1.sender_id, m1.chat_id);

-- 5. 迁移消息数据
INSERT INTO messages_new (
  id, conversation_id, sender_id, content, type, 
  created_at, read_at
)
SELECT 
  m.id,
  CONCAT('conv_', 
    LEAST(m.sender_id, m.chat_id), '_', 
    GREATEST(m.sender_id, m.chat_id)
  ) as conversation_id,
  m.sender_id,
  m.content,
  m.type,
  m.created_at,
  m.read_at
FROM messages_backup m
WHERE m.chat_id IS NOT NULL 
  AND m.sender_id IS NOT NULL
  AND m.chat_id != m.sender_id;

-- 6. 更新会话表的最后消息信息
UPDATE conversations c
SET 
  last_message_id = (
    SELECT id FROM messages_new m 
    WHERE m.conversation_id = c.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
  ),
  last_message_time = (
    SELECT created_at FROM messages_new m 
    WHERE m.conversation_id = c.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
  ),
  updated_at = (
    SELECT created_at FROM messages_new m 
    WHERE m.conversation_id = c.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
  );

-- 7. 替换旧表（谨慎操作）
-- RENAME TABLE messages TO messages_old;
-- RENAME TABLE messages_new TO messages;

-- 8. 验证数据迁移
SELECT 
  '会话数量' as item,
  COUNT(*) as count
FROM conversations
UNION ALL
SELECT 
  '消息数量（新表）' as item,
  COUNT(*) as count
FROM messages_new
UNION ALL
SELECT 
  '消息数量（原表）' as item,
  COUNT(*) as count
FROM messages_backup;

-- 9. 显示会话示例
SELECT 
  id as conversation_id,
  participant_ids,
  last_message_time,
  (SELECT COUNT(*) FROM messages_new WHERE conversation_id = conversations.id) as message_count
FROM conversations 
ORDER BY last_message_time DESC 
LIMIT 10;
