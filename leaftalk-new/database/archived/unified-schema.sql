-- 叶语聊天系统 - 统一数据库Schema
-- 版本: v3.0 (统一重构版)
-- 创建时间: 2025-08-18

-- ================================
-- 1. 用户系统
-- ================================

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  yeyu_id VARCHAR(20) NOT NULL COMMENT '叶语号',
  username VARCHAR(50) COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  nickname VARCHAR(50) NOT NULL COMMENT '昵称',
  avatar VARCHAR(500) COMMENT '头像URL',
  phone VARCHAR(20) UNIQUE COMMENT '手机号',
  email VARCHAR(100) COMMENT '邮箱',
  real_name VARCHAR(50) COMMENT '真实姓名',
  id_card VARCHAR(18) COMMENT '身份证号',
  verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' COMMENT '认证状态',
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  region VARCHAR(100) COMMENT '地区',
  signature VARCHAR(200) COMMENT '个性签名',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '账号状态',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (id),
  UNIQUE KEY uk_yeyu_id (yeyu_id),
  UNIQUE KEY uk_phone (phone),
  KEY idx_nickname (nickname),
  KEY idx_status (status),
  KEY idx_verification_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ================================
-- 2. 聊天会话系统
-- ================================

-- 聊天会话表（统一的聊天表）
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

-- 会话成员表
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
-- 3. 消息系统
-- ================================

-- 消息表（统一的消息表）
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
-- 4. 好友系统
-- ================================

-- 好友关系表
CREATE TABLE friendships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  friend_id BIGINT UNSIGNED NOT NULL COMMENT '好友ID',
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'accepted' COMMENT '关系状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_friend (user_id, friend_id),
  KEY idx_user_id (user_id),
  KEY idx_friend_id (friend_id),
  KEY idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- 好友请求表
CREATE TABLE friend_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '请求ID',
  from_user_id BIGINT UNSIGNED NOT NULL COMMENT '发起用户ID',
  to_user_id BIGINT UNSIGNED NOT NULL COMMENT '目标用户ID',
  message VARCHAR(200) COMMENT '请求消息',
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' COMMENT '请求状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (id),
  UNIQUE KEY uk_from_to_user (from_user_id, to_user_id),
  KEY idx_from_user_id (from_user_id),
  KEY idx_to_user_id (to_user_id),
  KEY idx_status (status),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友请求表';

-- ================================
-- 5. 其他系统表
-- ================================

-- 通知表
CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  type VARCHAR(50) NOT NULL COMMENT '通知类型',
  title VARCHAR(100) NOT NULL COMMENT '通知标题',
  content TEXT COMMENT '通知内容',
  data JSON COMMENT '通知数据',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_type (type),
  KEY idx_is_read (is_read),
  KEY idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- 朋友圈表
CREATE TABLE moments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '朋友圈ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  content TEXT COMMENT '内容',
  images JSON COMMENT '图片列表',
  location VARCHAR(100) COMMENT '位置',
  privacy ENUM('public', 'friends', 'private') DEFAULT 'friends' COMMENT '隐私设置',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_privacy (privacy),
  KEY idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈表';

-- ================================
-- 6. 创建有用的视图
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

SELECT 'Unified schema created successfully!' as status;
