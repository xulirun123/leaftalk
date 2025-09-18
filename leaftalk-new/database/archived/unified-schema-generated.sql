-- 叶语聊天系统 - 统一数据库Schema
-- 此文件由 shared/data-models.js 自动生成，请勿手动修改

SET FOREIGN_KEY_CHECKS = 0;

-- users 表
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '用户ID',
  `yeyu_id` VARCHAR(20) COMMENT '叶语号',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `nickname` VARCHAR(100) NOT NULL COMMENT '昵称',
  `password` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `email` VARCHAR(100) COMMENT '邮箱',
  `avatar` VARCHAR(500) COMMENT '头像URL',
  `real_name` VARCHAR(100) COMMENT '真实姓名',
  `id_card` VARCHAR(18) COMMENT '身份证号',
  `father_name` VARCHAR(100) COMMENT '父亲姓名',
  `mother_name` VARCHAR(100) COMMENT '母亲姓名',
  `verification_status` ENUM("unverified", "pending", "verified", "rejected") DEFAULT 'unverified' COMMENT '实名认证状态',
  `gender` ENUM("male", "female", "unknown") DEFAULT 'unknown' COMMENT '性别',
  `birth_date` DATE COMMENT '出生日期',
  `region` VARCHAR(200) COMMENT '地区',
  `signature` VARCHAR(500) COMMENT '个性签名',
  `status` ENUM("active", "inactive", "banned") DEFAULT 'active' COMMENT '账户状态',
  `last_login_at` TIMESTAMP COMMENT '最后登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_yeyu_id` (`yeyu_id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_id_card` (`id_card`),
  KEY `idx_yeyu_id` (`yeyu_id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_email` (`email`),
  KEY `idx_id_card` (`id_card`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_avatars 表
DROP TABLE IF EXISTS `user_avatars`;
CREATE TABLE IF NOT EXISTS `user_avatars` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '头像ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `avatar_url` VARCHAR(500) NOT NULL COMMENT '头像URL',
  `avatar_type` ENUM("upload", "generated", "default") DEFAULT 'default' COMMENT '头像类型',
  `file_size` INT UNSIGNED COMMENT '文件大小(字节)',
  `file_format` VARCHAR(10) COMMENT '文件格式',
  `is_current` BOOLEAN DEFAULT 0 COMMENT '是否为当前头像',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_current` (`is_current`),
  FOREIGN KEY (`user_id`) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- chat_conversations 表
DROP TABLE IF EXISTS `chat_conversations`;
CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '会话ID',
  `conversation_id` VARCHAR(50) NOT NULL COMMENT '会话唯一标识',
  `type` ENUM("private", "group", "system") DEFAULT 'private' COMMENT '会话类型',
  `name` VARCHAR(200) COMMENT '会话名称(群聊名称)',
  `description` TEXT COMMENT '会话描述',
  `avatar` VARCHAR(500) COMMENT '会话头像(群聊头像)',
  `creator_id` BIGINT UNSIGNED COMMENT '创建者ID',
  `max_members` INT UNSIGNED DEFAULT 500 COMMENT '最大成员数',
  `is_public` BOOLEAN DEFAULT 0 COMMENT '是否公开群聊',
  `join_approval` BOOLEAN DEFAULT 1 COMMENT '是否需要审批加入',
  `mute_all` BOOLEAN DEFAULT 0 COMMENT '是否全员禁言',
  `status` ENUM("active", "archived", "deleted") DEFAULT 'active' COMMENT '会话状态',
  `last_message_id` BIGINT UNSIGNED COMMENT '最后一条消息ID',
  `last_message_time` TIMESTAMP COMMENT '最后消息时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_id` (`conversation_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_type` (`type`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_status` (`status`),
  KEY `idx_last_message_time` (`last_message_time`),
  FOREIGN KEY (`creator_id`) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (`last_message_id`) REFERENCES chat_messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- chat_members 表
DROP TABLE IF EXISTS `chat_members`;
CREATE TABLE IF NOT EXISTS `chat_members` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '成员ID',
  `conversation_id` VARCHAR(50) NOT NULL COMMENT '会话ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` ENUM("owner", "admin", "member") DEFAULT 'member' COMMENT '成员角色',
  `nickname` VARCHAR(100) COMMENT '群内昵称',
  `is_muted` BOOLEAN DEFAULT 0 COMMENT '是否被禁言',
  `mute_until` TIMESTAMP COMMENT '禁言到期时间',
  `last_read_message_id` BIGINT UNSIGNED COMMENT '最后已读消息ID',
  `last_read_time` TIMESTAMP COMMENT '最后已读时间',
  `notification_enabled` BOOLEAN DEFAULT 1 COMMENT '是否启用通知',
  `status` ENUM("active", "left", "kicked", "banned") DEFAULT 'active' COMMENT '成员状态',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`conversation_id`) REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (`last_read_message_id`) REFERENCES chat_messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- chat_messages 表
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '消息ID',
  `message_id` VARCHAR(50) NOT NULL COMMENT '消息唯一标识',
  `conversation_id` VARCHAR(50) NOT NULL COMMENT '会话ID',
  `sender_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `reply_to_id` BIGINT UNSIGNED COMMENT '回复的消息ID',
  `message_type` ENUM("text", "image", "video", "audio", "file", "location", "system", "recall") DEFAULT 'text' COMMENT '消息类型',
  `content` TEXT COMMENT '消息内容',
  `media_url` VARCHAR(500) COMMENT '媒体文件URL',
  `media_size` INT UNSIGNED COMMENT '媒体文件大小',
  `media_duration` INT UNSIGNED COMMENT '媒体时长(秒)',
  `thumbnail_url` VARCHAR(500) COMMENT '缩略图URL',
  `is_recalled` BOOLEAN DEFAULT 0 COMMENT '是否已撤回',
  `recalled_at` TIMESTAMP COMMENT '撤回时间',
  `is_edited` BOOLEAN DEFAULT 0 COMMENT '是否已编辑',
  `edited_at` TIMESTAMP COMMENT '编辑时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_id` (`message_id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_message_type` (`message_type`),
  FOREIGN KEY (`conversation_id`) REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES chat_messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- friendships 表
DROP TABLE IF EXISTS `friendships`;
CREATE TABLE IF NOT EXISTS `friendships` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '关系ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `friend_id` BIGINT UNSIGNED NOT NULL COMMENT '朋友ID',
  `status` ENUM("pending", "accepted", "blocked") DEFAULT 'pending' COMMENT '关系状态',
  `remark` VARCHAR(100) COMMENT '备注名',
  `tags` JSON COMMENT '朋友标签',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_friendship` (`user_id`, `friend_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_friend_id` (`friend_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- friend_requests 表
DROP TABLE IF EXISTS `friend_requests`;
CREATE TABLE IF NOT EXISTS `friend_requests` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '请求ID',
  `from_user_id` BIGINT UNSIGNED NOT NULL COMMENT '发起用户ID',
  `to_user_id` BIGINT UNSIGNED NOT NULL COMMENT '目标用户ID',
  `message` VARCHAR(200) DEFAULT '' COMMENT '请求消息',
  `status` ENUM("pending", "accepted", "rejected") DEFAULT 'pending' COMMENT '请求状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_request` (`from_user_id`, `to_user_id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_to_user_id` (`to_user_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`from_user_id`) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (`to_user_id`) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- genealogies 表
DROP TABLE IF EXISTS `genealogies`;
CREATE TABLE IF NOT EXISTS `genealogies` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '族谱ID',
  `name` VARCHAR(100) NOT NULL COMMENT '族谱名称',
  `surname` VARCHAR(50) NOT NULL COMMENT '姓氏',
  `description` TEXT COMMENT '族谱描述',
  `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '创建者用户ID',
  `status` ENUM("active", "inactive") DEFAULT 'active' COMMENT '族谱状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_surname` (`surname`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`creator_id`) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- genealogy_members 表
DROP TABLE IF EXISTS `genealogy_members`;
CREATE TABLE IF NOT EXISTS `genealogy_members` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '成员ID',
  `genealogy_id` BIGINT UNSIGNED NOT NULL COMMENT '族谱ID',
  `user_id` BIGINT UNSIGNED COMMENT '关联用户ID（如果有）',
  `name` VARCHAR(100) NOT NULL COMMENT '成员姓名',
  `gender` ENUM("male", "female", "unknown") DEFAULT 'unknown' COMMENT '性别',
  `father_name` VARCHAR(100) COMMENT '父亲姓名',
  `mother_name` VARCHAR(100) COMMENT '母亲姓名',
  `birth_date` DATE COMMENT '出生日期',
  `death_date` DATE COMMENT '去世日期',
  `generation` INT DEFAULT 1 COMMENT '世代数',
  `is_founder` BOOLEAN DEFAULT false COMMENT '是否为创始人',
  `position_x` INT COMMENT '族谱图中X坐标',
  `position_y` INT COMMENT '族谱图中Y坐标',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_genealogy_id` (`genealogy_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_generation` (`generation`),
  KEY `idx_is_founder` (`is_founder`),
  FOREIGN KEY (`genealogy_id`) REFERENCES genealogies(id) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- account_bindings 表
DROP TABLE IF EXISTS `account_bindings`;
CREATE TABLE IF NOT EXISTS `account_bindings` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT COMMENT '绑定ID',
  `id_card` VARCHAR(18) NOT NULL COMMENT '身份证号',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `binding_type` ENUM("primary", "secondary") DEFAULT 'secondary' COMMENT '绑定类型',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_id_card` (`id_card`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `uk_user_id_card` (`user_id`, `id_card`),
  FOREIGN KEY (`user_id`) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
