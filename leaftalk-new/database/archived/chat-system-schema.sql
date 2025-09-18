-- =====================================================
-- 叶语聊天系统数据库设计
-- 版本: 2.0
-- 创建时间: 2025-01-08
-- 描述: 完整的聊天系统数据库架构
-- =====================================================

-- 设置数据库字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `leaftalk_chat` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `leaftalk_chat`;

-- =====================================================
-- 1. 用户相关表
-- =====================================================

-- 用户基础信息表
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `yeyu_id` VARCHAR(20) NOT NULL COMMENT '叶语号',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
  `phone` VARCHAR(20) UNIQUE COMMENT '手机号',
  `email` VARCHAR(100) UNIQUE COMMENT '邮箱',
  `avatar` VARCHAR(500) COMMENT '头像URL',
  `real_name` VARCHAR(50) COMMENT '真实姓名',
  `id_card` VARCHAR(18) COMMENT '身份证号',
  `verification_status` ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' COMMENT '认证状态',
  `gender` ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  `birth_date` DATE COMMENT '出生日期',
  `father_name` VARCHAR(50) COMMENT '父亲姓名',
  `mother_name` VARCHAR(50) COMMENT '母亲姓名',
  `marital_status` ENUM('single', 'married', 'divorced', 'widowed', 'unknown') DEFAULT 'unknown' COMMENT '婚姻状况',
  `spouse_name` VARCHAR(50) COMMENT '配偶姓名',
  `marriage_date` DATE COMMENT '结婚日期',
  `children_count` INT DEFAULT 0 COMMENT '子女数量',
  `region` VARCHAR(100) DEFAULT '中国大陆' COMMENT '地区',
  `signature` VARCHAR(200) COMMENT '个性签名',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '账户是否激活',
  `allow_phone_search` BOOLEAN DEFAULT TRUE COMMENT '允许通过手机号搜索',
  `allow_yeyu_id_search` BOOLEAN DEFAULT TRUE COMMENT '允许通过叶语号搜索',
  `last_login_at` TIMESTAMP NULL COMMENT '最后登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_yeyu_id` (`yeyu_id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_verification_status` (`verification_status`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_id_card` (`id_card`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 用户头像表
DROP TABLE IF EXISTS `user_avatars`;
CREATE TABLE `user_avatars` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '头像ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '文件名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
  `file_size` INT UNSIGNED NOT NULL COMMENT '文件大小(字节)',
  `file_type` VARCHAR(50) NOT NULL COMMENT '文件类型',
  `width` INT UNSIGNED COMMENT '图片宽度',
  `height` INT UNSIGNED COMMENT '图片高度',
  `hash` VARCHAR(64) NOT NULL COMMENT '文件哈希值',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否为当前头像',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_hash` (`hash`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户头像表';

-- =====================================================
-- 2. 聊天会话相关表
-- =====================================================

-- 聊天会话表
DROP TABLE IF EXISTS `chat_conversations`;
CREATE TABLE `chat_conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `conversation_id` VARCHAR(64) NOT NULL COMMENT '会话唯一标识',
  `type` ENUM('private', 'group') NOT NULL COMMENT '会话类型',
  `name` VARCHAR(100) COMMENT '会话名称(群聊名称)',
  `avatar_id` BIGINT UNSIGNED COMMENT '会话头像ID',
  `description` TEXT COMMENT '会话描述',
  `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '创建者ID',
  `member_count` INT UNSIGNED DEFAULT 0 COMMENT '成员数量',
  `last_message_id` BIGINT UNSIGNED COMMENT '最后一条消息ID',
  `last_message_time` TIMESTAMP NULL COMMENT '最后消息时间',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_id` (`conversation_id`),
  KEY `idx_type` (`type`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_last_message_time` (`last_message_time`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- 会话成员表
DROP TABLE IF EXISTS `chat_members`;
CREATE TABLE `chat_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `conversation_id` BIGINT UNSIGNED NOT NULL COMMENT '会话ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` ENUM('owner', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
  `nickname` VARCHAR(50) COMMENT '群内昵称',
  `is_muted` BOOLEAN DEFAULT FALSE COMMENT '是否被禁言',
  `is_pinned` BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  `unread_count` INT UNSIGNED DEFAULT 0 COMMENT '未读消息数',
  `last_read_message_id` BIGINT UNSIGNED COMMENT '最后已读消息ID',
  `last_read_time` TIMESTAMP NULL COMMENT '最后已读时间',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`),
  KEY `idx_is_pinned` (`is_pinned`),
  KEY `idx_unread_count` (`unread_count`),
  FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话成员表';

-- =====================================================
-- 3. 消息相关表
-- =====================================================

-- 消息表
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `message_id` VARCHAR(64) NOT NULL COMMENT '消息唯一标识',
  `conversation_id` BIGINT UNSIGNED NOT NULL COMMENT '会话ID',
  `sender_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `reply_to_id` BIGINT UNSIGNED COMMENT '回复的消息ID',
  `type` ENUM('text', 'image', 'voice', 'video', 'file', 'location', 'contact', 'redpacket', 'transfer', 'system') NOT NULL COMMENT '消息类型',
  `content` TEXT COMMENT '消息内容',
  `media_id` BIGINT UNSIGNED COMMENT '媒体文件ID',
  `metadata` JSON COMMENT '消息元数据',
  `status` ENUM('sending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sending' COMMENT '消息状态',
  `is_recalled` BOOLEAN DEFAULT FALSE COMMENT '是否已撤回',
  `recalled_at` TIMESTAMP NULL COMMENT '撤回时间',
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_id` (`message_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_sent_at` (`sent_at`),
  KEY `idx_is_recalled` (`is_recalled`),
  KEY `idx_conversation_sent` (`conversation_id`, `sent_at`),
  FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES `chat_messages`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- 消息已读状态表
DROP TABLE IF EXISTS `message_read_status`;
CREATE TABLE `message_read_status` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `message_id` BIGINT UNSIGNED NOT NULL COMMENT '消息ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '已读时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_user` (`message_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_read_at` (`read_at`),
  FOREIGN KEY (`message_id`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息已读状态表';

-- =====================================================
-- 4. 媒体文件相关表
-- =====================================================

-- 媒体文件表
DROP TABLE IF EXISTS `media_files`;
CREATE TABLE `media_files` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `file_id` VARCHAR(64) NOT NULL COMMENT '文件唯一标识',
  `uploader_id` BIGINT UNSIGNED NOT NULL COMMENT '上传者ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件存储路径',
  `file_size` BIGINT UNSIGNED NOT NULL COMMENT '文件大小(字节)',
  `file_type` VARCHAR(50) NOT NULL COMMENT '文件MIME类型',
  `category` ENUM('image', 'voice', 'video', 'document', 'other') NOT NULL COMMENT '文件分类',
  `width` INT UNSIGNED COMMENT '图片/视频宽度',
  `height` INT UNSIGNED COMMENT '图片/视频高度',
  `duration` INT UNSIGNED COMMENT '音频/视频时长(秒)',
  `thumbnail_path` VARCHAR(500) COMMENT '缩略图路径',
  `hash` VARCHAR(64) NOT NULL COMMENT '文件哈希值',
  `upload_status` ENUM('uploading', 'completed', 'failed') DEFAULT 'uploading' COMMENT '上传状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_file_id` (`file_id`),
  KEY `idx_uploader_id` (`uploader_id`),
  KEY `idx_category` (`category`),
  KEY `idx_hash` (`hash`),
  KEY `idx_upload_status` (`upload_status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒体文件表';

-- =====================================================
-- 5. 通话相关表
-- =====================================================

-- 通话记录表
DROP TABLE IF EXISTS `call_records`;
CREATE TABLE `call_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '通话ID',
  `call_id` VARCHAR(64) NOT NULL COMMENT '通话唯一标识',
  `caller_id` BIGINT UNSIGNED NOT NULL COMMENT '主叫用户ID',
  `callee_id` BIGINT UNSIGNED NOT NULL COMMENT '被叫用户ID',
  `type` ENUM('voice', 'video') NOT NULL COMMENT '通话类型',
  `status` ENUM('calling', 'connected', 'ended', 'cancelled', 'rejected', 'timeout') NOT NULL COMMENT '通话状态',
  `start_time` TIMESTAMP NULL COMMENT '通话开始时间',
  `end_time` TIMESTAMP NULL COMMENT '通话结束时间',
  `duration` INT UNSIGNED DEFAULT 0 COMMENT '通话时长(秒)',
  `quality_rating` TINYINT UNSIGNED COMMENT '通话质量评分(1-5)',
  `end_reason` ENUM('normal', 'caller_hangup', 'callee_hangup', 'network_error', 'timeout') COMMENT '结束原因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_call_id` (`call_id`),
  KEY `idx_caller_id` (`caller_id`),
  KEY `idx_callee_id` (`callee_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`caller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`callee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话记录表';

-- =====================================================
-- 6. 好友关系表
-- =====================================================

-- 好友关系表
DROP TABLE IF EXISTS `friendships`;
CREATE TABLE `friendships` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `friend_id` BIGINT UNSIGNED NOT NULL COMMENT '好友ID',
  `status` ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending' COMMENT '关系状态',
  `remark` VARCHAR(50) COMMENT '好友备注',
  `source` VARCHAR(50) COMMENT '添加来源',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_friend` (`user_id`, `friend_id`),
  KEY `idx_friend_id` (`friend_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- =====================================================
-- 7. 系统配置表
-- =====================================================

-- 用户设置表
DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `setting_key` VARCHAR(100) NOT NULL COMMENT '设置键',
  `setting_value` TEXT COMMENT '设置值',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_setting` (`user_id`, `setting_key`),
  KEY `idx_setting_key` (`setting_key`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- =====================================================
-- 6. 好友系统表
-- =====================================================

-- 朋友关系表
DROP TABLE IF EXISTS `friendships`;
CREATE TABLE `friendships` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `friend_id` BIGINT UNSIGNED NOT NULL COMMENT '朋友ID',
  `status` ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending' COMMENT '关系状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_friendship` (`user_id`, `friend_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_friend_id` (`friend_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友关系表';

-- 好友请求表
DROP TABLE IF EXISTS `friend_requests`;
CREATE TABLE `friend_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '请求ID',
  `from_user_id` BIGINT UNSIGNED NOT NULL COMMENT '发起用户ID',
  `to_user_id` BIGINT UNSIGNED NOT NULL COMMENT '目标用户ID',
  `message` VARCHAR(200) DEFAULT '' COMMENT '请求消息',
  `status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' COMMENT '请求状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_request` (`from_user_id`, `to_user_id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_to_user_id` (`to_user_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友请求表';

SET FOREIGN_KEY_CHECKS = 1;
