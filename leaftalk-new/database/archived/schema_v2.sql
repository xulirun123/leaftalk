-- 叶语聊天系统数据库表结构 v2.0
-- 创建时间: 2025-01-30
-- 完整重构版本，支持所有消息类型和高级功能

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `leaftalk` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `leaftalk`;

-- 1. 用户表 (扩展现有表结构)
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `yeyu_id` varchar(20) NOT NULL COMMENT '叶语号',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码哈希',
  `nickname` varchar(100) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(500) DEFAULT NULL COMMENT '头像URL',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `id_card` varchar(18) DEFAULT NULL COMMENT '身份证号',
  `gender` tinyint(1) DEFAULT 0 COMMENT '性别 0:未知 1:男 2:女',
  `birthday` date DEFAULT NULL COMMENT '生日',
  `region` varchar(200) DEFAULT NULL COMMENT '地区',
  `signature` varchar(500) DEFAULT NULL COMMENT '个性签名',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0:禁用 1:正常 2:注销',
  `is_online` tinyint(1) DEFAULT 0 COMMENT '是否在线',
  `last_login_time` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) DEFAULT NULL COMMENT '最后登录IP',
  `verification_status` tinyint(1) DEFAULT 0 COMMENT '实名认证状态 0:未认证 1:已认证',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_yeyu_id` (`yeyu_id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_id_card` (`id_card`),
  KEY `idx_status` (`status`),
  KEY `idx_is_online` (`is_online`),
  KEY `idx_verification_status` (`verification_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 聊天表
CREATE TABLE IF NOT EXISTS `chats` (
  `id` varchar(50) NOT NULL COMMENT '聊天ID',
  `type` enum('private','group','system') NOT NULL DEFAULT 'private' COMMENT '聊天类型',
  `name` varchar(200) DEFAULT NULL COMMENT '聊天名称',
  `avatar` varchar(500) DEFAULT NULL COMMENT '聊天头像',
  `description` text DEFAULT NULL COMMENT '聊天描述',
  `owner_id` bigint(20) unsigned DEFAULT NULL COMMENT '群主ID',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0:禁用 1:正常 2:解散',
  `member_count` int(11) DEFAULT 0 COMMENT '成员数量',
  `max_members` int(11) DEFAULT 500 COMMENT '最大成员数',
  `last_message_id` varchar(50) DEFAULT NULL COMMENT '最后一条消息ID',
  `last_message_time` timestamp NULL DEFAULT NULL COMMENT '最后消息时间',
  `last_message_type` varchar(20) DEFAULT NULL COMMENT '最后消息类型',
  `last_message_content` text DEFAULT NULL COMMENT '最后消息内容',
  `message_count` bigint(20) DEFAULT 0 COMMENT '消息总数',
  `settings` json DEFAULT NULL COMMENT '聊天设置',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_last_message_time` (`last_message_time`),
  CONSTRAINT `fk_chats_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天表';

-- 3. 聊天成员表
CREATE TABLE IF NOT EXISTS `chat_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `chat_id` varchar(50) NOT NULL COMMENT '聊天ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT '用户ID',
  `role` enum('member','admin','owner') DEFAULT 'member' COMMENT '角色',
  `nickname` varchar(100) DEFAULT NULL COMMENT '群内昵称',
  `is_pinned` tinyint(1) DEFAULT 0 COMMENT '是否置顶',
  `is_muted` tinyint(1) DEFAULT 0 COMMENT '是否免打扰',
  `unread_count` int(11) DEFAULT 0 COMMENT '未读消息数',
  `last_read_message_id` varchar(50) DEFAULT NULL COMMENT '最后已读消息ID',
  `last_read_time` timestamp NULL DEFAULT NULL COMMENT '最后已读时间',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0:已退出 1:正常',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_user` (`chat_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_pinned` (`is_pinned`),
  KEY `idx_unread_count` (`unread_count`),
  CONSTRAINT `fk_chat_members_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天成员表';

-- 4. 消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `id` varchar(50) NOT NULL COMMENT '消息ID',
  `chat_id` varchar(50) NOT NULL COMMENT '聊天ID',
  `sender_id` bigint(20) unsigned NOT NULL COMMENT '发送者ID',
  `type` varchar(20) NOT NULL DEFAULT 'text' COMMENT '消息类型',
  `content` text DEFAULT NULL COMMENT '消息内容',
  `metadata` json DEFAULT NULL COMMENT '消息元数据',
  `reply_to_id` varchar(50) DEFAULT NULL COMMENT '回复的消息ID',
  `forward_from_id` varchar(50) DEFAULT NULL COMMENT '转发来源消息ID',
  `status` enum('sending','sent','delivered','read','failed','recalled') DEFAULT 'sending' COMMENT '消息状态',
  `is_recalled` tinyint(1) DEFAULT 0 COMMENT '是否已撤回',
  `recalled_at` timestamp NULL DEFAULT NULL COMMENT '撤回时间',
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `delivered_at` timestamp NULL DEFAULT NULL COMMENT '送达时间',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '已读时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_chat_id_sent_at` (`chat_id`, `sent_at`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_reply_to_id` (`reply_to_id`),
  KEY `idx_forward_from_id` (`forward_from_id`),
  CONSTRAINT `fk_messages_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_reply` FOREIGN KEY (`reply_to_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_forward` FOREIGN KEY (`forward_from_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- 5. 好友关系表
CREATE TABLE IF NOT EXISTS `friendships` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT '用户ID',
  `friend_id` bigint(20) unsigned NOT NULL COMMENT '好友ID',
  `status` enum('pending','accepted','blocked','deleted') DEFAULT 'pending' COMMENT '关系状态',
  `remark_name` varchar(100) DEFAULT NULL COMMENT '备注名',
  `tags` json DEFAULT NULL COMMENT '标签',
  `source` varchar(50) DEFAULT NULL COMMENT '添加来源',
  `request_message` text DEFAULT NULL COMMENT '请求消息',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_friend` (`user_id`, `friend_id`),
  KEY `idx_friend_id` (`friend_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_friendships_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_friendships_friend` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- 6. 媒体文件表
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` varchar(50) NOT NULL COMMENT '文件ID',
  `message_id` varchar(50) NOT NULL COMMENT '消息ID',
  `file_name` varchar(255) NOT NULL COMMENT '文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_url` varchar(500) DEFAULT NULL COMMENT '文件URL',
  `thumbnail_url` varchar(500) DEFAULT NULL COMMENT '缩略图URL',
  `file_size` bigint(20) DEFAULT 0 COMMENT '文件大小(字节)',
  `file_type` varchar(50) NOT NULL COMMENT '文件类型',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME类型',
  `width` int(11) DEFAULT NULL COMMENT '宽度(图片/视频)',
  `height` int(11) DEFAULT NULL COMMENT '高度(图片/视频)',
  `duration` int(11) DEFAULT NULL COMMENT '时长(音频/视频)',
  `upload_status` enum('uploading','completed','failed') DEFAULT 'uploading' COMMENT '上传状态',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_file_type` (`file_type`),
  KEY `idx_upload_status` (`upload_status`),
  CONSTRAINT `fk_media_files_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒体文件表';

-- 7. 支付记录表
CREATE TABLE IF NOT EXISTS `payments` (
  `id` varchar(50) NOT NULL COMMENT '支付ID',
  `message_id` varchar(50) NOT NULL COMMENT '消息ID',
  `type` enum('red_packet','transfer') NOT NULL COMMENT '支付类型',
  `sender_id` bigint(20) unsigned NOT NULL COMMENT '发送者ID',
  `receiver_id` bigint(20) unsigned DEFAULT NULL COMMENT '接收者ID',
  `amount` decimal(10,2) NOT NULL COMMENT '金额',
  `title` varchar(200) DEFAULT NULL COMMENT '标题',
  `note` text DEFAULT NULL COMMENT '备注',
  `password` varchar(255) DEFAULT NULL COMMENT '支付密码',
  `status` enum('pending','completed','expired','refunded') DEFAULT 'pending' COMMENT '状态',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_payments_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- 8. 通话记录表
CREATE TABLE IF NOT EXISTS `call_records` (
  `id` varchar(50) NOT NULL COMMENT '通话ID',
  `message_id` varchar(50) NOT NULL COMMENT '消息ID',
  `type` enum('voice','video') NOT NULL COMMENT '通话类型',
  `caller_id` bigint(20) unsigned NOT NULL COMMENT '主叫用户ID',
  `callee_id` bigint(20) unsigned NOT NULL COMMENT '被叫用户ID',
  `status` enum('calling','connected','ended','cancelled','missed','busy','failed') DEFAULT 'calling' COMMENT '通话状态',
  `duration` int(11) DEFAULT 0 COMMENT '通话时长(秒)',
  `start_time` timestamp NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `end_reason` varchar(50) DEFAULT NULL COMMENT '结束原因',
  `quality_rating` tinyint(1) DEFAULT NULL COMMENT '通话质量评分',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_caller_id` (`caller_id`),
  KEY `idx_callee_id` (`callee_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_call_records_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_call_records_caller` FOREIGN KEY (`caller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_call_records_callee` FOREIGN KEY (`callee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话记录表';

-- 创建性能优化索引
CREATE INDEX `idx_messages_chat_type_time` ON `messages` (`chat_id`, `type`, `sent_at`);
CREATE INDEX `idx_messages_sender_time` ON `messages` (`sender_id`, `sent_at`);
CREATE INDEX `idx_chat_members_user_status` ON `chat_members` (`user_id`, `status`);
CREATE INDEX `idx_chat_members_chat_role` ON `chat_members` (`chat_id`, `role`);
CREATE INDEX `idx_friendships_user_status` ON `friendships` (`user_id`, `status`);

-- 插入测试数据
INSERT IGNORE INTO `users` (`id`, `yeyu_id`, `username`, `password`, `nickname`, `phone`, `status`) VALUES
(1, '1000000001', 'admin', '$2b$10$example_hash', '系统管理员', '13800138000', 1),
(2, '1000000002', 'testuser1', '$2b$10$example_hash', '测试用户1', '13800138001', 1),
(3, '1000000003', 'testuser2', '$2b$10$example_hash', '测试用户2', '13800138002', 1);

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;
