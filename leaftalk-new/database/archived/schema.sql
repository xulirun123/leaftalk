-- 叶语聊天系统数据库表结构
-- 创建时间: 2025-01-30
-- 版本: 2.0 - 完整重构版本

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `leaftalk` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `leaftalk`;

-- 1. 用户表
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
  `status` enum('active','muted','banned','left') DEFAULT 'active' COMMENT '状态',
  `nickname` varchar(100) DEFAULT NULL COMMENT '群昵称',
  `mute_until` timestamp NULL DEFAULT NULL COMMENT '禁言到期时间',
  `joined_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `left_at` timestamp NULL DEFAULT NULL COMMENT '离开时间',
  `invited_by` int(11) DEFAULT NULL COMMENT '邀请人ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_user` (`chat_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_joined_at` (`joined_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天成员表';

-- 4. 消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `id` varchar(50) NOT NULL COMMENT '消息ID',
  `chat_id` varchar(50) NOT NULL COMMENT '聊天ID',
  `sender_id` int(11) NOT NULL COMMENT '发送者ID',
  `type` enum('text','image','voice','video','file','location','contact','red_packet','transfer','call','system') NOT NULL COMMENT '消息类型',
  `content` text COMMENT '消息内容',
  `media_url` varchar(500) DEFAULT NULL COMMENT '媒体文件URL',
  `thumbnail_url` varchar(500) DEFAULT NULL COMMENT '缩略图URL',
  `file_name` varchar(255) DEFAULT NULL COMMENT '文件名',
  `file_size` bigint(20) DEFAULT NULL COMMENT '文件大小(字节)',
  `duration` int(11) DEFAULT NULL COMMENT '时长(秒)',
  `width` int(11) DEFAULT NULL COMMENT '宽度(像素)',
  `height` int(11) DEFAULT NULL COMMENT '高度(像素)',
  `metadata` json DEFAULT NULL COMMENT '扩展元数据',
  `reply_to_id` varchar(50) DEFAULT NULL COMMENT '回复的消息ID',
  `forward_from_id` varchar(50) DEFAULT NULL COMMENT '转发来源消息ID',
  `status` enum('sending','sent','delivered','read','failed','recalled') DEFAULT 'sent' COMMENT '消息状态',
  `recalled_at` timestamp NULL DEFAULT NULL COMMENT '撤回时间',
  `recalled_by` int(11) DEFAULT NULL COMMENT '撤回人ID',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_id` (`chat_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_status` (`status`),
  KEY `idx_reply_to_id` (`reply_to_id`),
  KEY `idx_chat_time` (`chat_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- 5. 消息已读状态表
CREATE TABLE IF NOT EXISTS `message_reads` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `message_id` varchar(50) NOT NULL COMMENT '消息ID',
  `chat_id` varchar(50) NOT NULL COMMENT '聊天ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `read_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '已读时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_user` (`message_id`, `user_id`),
  KEY `idx_chat_user` (`chat_id`, `user_id`),
  KEY `idx_read_at` (`read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息已读状态表';

-- 6. 未读计数表
CREATE TABLE IF NOT EXISTS `unread_counts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(50) NOT NULL COMMENT '聊天ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `count` int(11) DEFAULT 0 COMMENT '未读数量',
  `last_read_message_id` varchar(50) DEFAULT NULL COMMENT '最后已读消息ID',
  `last_read_at` timestamp NULL DEFAULT NULL COMMENT '最后已读时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_user` (`chat_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_count` (`count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='未读计数表';

-- 7. 聊天设置表
CREATE TABLE IF NOT EXISTS `chat_settings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(50) NOT NULL COMMENT '聊天ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `is_pinned` tinyint(1) DEFAULT 0 COMMENT '是否置顶',
  `is_muted` tinyint(1) DEFAULT 0 COMMENT '是否免打扰',
  `is_hidden` tinyint(1) DEFAULT 0 COMMENT '是否隐藏',
  `custom_name` varchar(100) DEFAULT NULL COMMENT '自定义名称',
  `background` varchar(255) DEFAULT NULL COMMENT '聊天背景',
  `font_size` enum('small','medium','large') DEFAULT 'medium' COMMENT '字体大小',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_user` (`chat_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_pinned` (`is_pinned`),
  KEY `idx_is_muted` (`is_muted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天设置表';

-- 8. 消息草稿表
CREATE TABLE IF NOT EXISTS `message_drafts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(50) NOT NULL COMMENT '聊天ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `content` text COMMENT '草稿内容',
  `type` enum('text','voice','image','video','file') DEFAULT 'text' COMMENT '草稿类型',
  `metadata` json DEFAULT NULL COMMENT '草稿元数据',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_user` (`chat_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息草稿表';

-- 9. 黑名单表
CREATE TABLE IF NOT EXISTS `blacklist` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `blocked_user_id` int(11) NOT NULL COMMENT '被拉黑用户ID',
  `reason` varchar(255) DEFAULT NULL COMMENT '拉黑原因',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_blocked` (`user_id`, `blocked_user_id`),
  KEY `idx_blocked_user_id` (`blocked_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='黑名单表';

-- 10. 文件存储表
CREATE TABLE IF NOT EXISTS `file_storage` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `file_id` varchar(50) NOT NULL COMMENT '文件ID',
  `original_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `file_name` varchar(255) NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_size` bigint(20) NOT NULL COMMENT '文件大小',
  `mime_type` varchar(100) NOT NULL COMMENT 'MIME类型',
  `file_type` enum('image','voice','video','file','avatar','background') NOT NULL COMMENT '文件类型',
  `width` int(11) DEFAULT NULL COMMENT '图片/视频宽度',
  `height` int(11) DEFAULT NULL COMMENT '图片/视频高度',
  `duration` int(11) DEFAULT NULL COMMENT '音频/视频时长',
  `thumbnail_path` varchar(500) DEFAULT NULL COMMENT '缩略图路径',
  `upload_user_id` int(11) NOT NULL COMMENT '上传用户ID',
  `reference_count` int(11) DEFAULT 1 COMMENT '引用计数',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_file_id` (`file_id`),
  KEY `idx_file_type` (`file_type`),
  KEY `idx_upload_user_id` (`upload_user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件存储表';

-- 创建索引优化查询性能
-- 聊天列表查询优化
CREATE INDEX `idx_chat_members_user_status` ON `chat_members` (`user_id`, `status`);

-- 消息分页查询优化
CREATE INDEX `idx_messages_chat_time_desc` ON `messages` (`chat_id`, `created_at` DESC);

-- 未读消息统计优化
CREATE INDEX `idx_unread_counts_user` ON `unread_counts` (`user_id`, `count`);

-- 消息搜索优化
CREATE FULLTEXT INDEX `ft_messages_content` ON `messages` (`content`);

-- 设置外键约束
ALTER TABLE `chat_members` ADD CONSTRAINT `fk_chat_members_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE;
ALTER TABLE `chat_members` ADD CONSTRAINT `fk_chat_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `messages` ADD CONSTRAINT `fk_messages_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `message_reads` ADD CONSTRAINT `fk_message_reads_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE;
ALTER TABLE `message_reads` ADD CONSTRAINT `fk_message_reads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `unread_counts` ADD CONSTRAINT `fk_unread_counts_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE;
ALTER TABLE `unread_counts` ADD CONSTRAINT `fk_unread_counts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `chat_settings` ADD CONSTRAINT `fk_chat_settings_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE;
ALTER TABLE `chat_settings` ADD CONSTRAINT `fk_chat_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `message_drafts` ADD CONSTRAINT `fk_message_drafts_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE;
ALTER TABLE `message_drafts` ADD CONSTRAINT `fk_message_drafts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `blacklist` ADD CONSTRAINT `fk_blacklist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `blacklist` ADD CONSTRAINT `fk_blacklist_blocked` FOREIGN KEY (`blocked_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `file_storage` ADD CONSTRAINT `fk_file_storage_user` FOREIGN KEY (`upload_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- 11. 通话记录表
CREATE TABLE IF NOT EXISTS `call_records` (
  `id` varchar(50) NOT NULL COMMENT '通话ID',
  `chat_id` varchar(50) NOT NULL COMMENT '聊天ID',
  `caller_id` bigint(20) unsigned NOT NULL COMMENT '发起人ID',
  `call_type` enum('voice','video') NOT NULL COMMENT '通话类型',
  `status` enum('calling','ringing','connected','ended','missed','rejected','cancelled') DEFAULT 'calling' COMMENT '通话状态',
  `started_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `answered_at` timestamp NULL DEFAULT NULL COMMENT '接听时间',
  `ended_at` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `duration` int(11) DEFAULT 0 COMMENT '通话时长(秒)',
  `end_reason` enum('normal','busy','timeout','network_error','rejected','cancelled') DEFAULT NULL COMMENT '结束原因',
  `quality_rating` tinyint(1) DEFAULT NULL COMMENT '通话质量评分(1-5)',
  `metadata` json DEFAULT NULL COMMENT '通话元数据',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_id` (`chat_id`),
  KEY `idx_caller_id` (`caller_id`),
  KEY `idx_call_type` (`call_type`),
  KEY `idx_status` (`status`),
  KEY `idx_started_at` (`started_at`),
  CONSTRAINT `fk_call_records_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_call_records_caller` FOREIGN KEY (`caller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话记录表';

-- 12. 通话参与者表
CREATE TABLE IF NOT EXISTS `call_participants` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `call_id` varchar(50) NOT NULL COMMENT '通话ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT '用户ID',
  `role` enum('caller','callee') NOT NULL COMMENT '角色',
  `status` enum('calling','ringing','connected','disconnected','rejected') DEFAULT 'calling' COMMENT '参与状态',
  `joined_at` timestamp NULL DEFAULT NULL COMMENT '加入时间',
  `left_at` timestamp NULL DEFAULT NULL COMMENT '离开时间',
  `connection_quality` json DEFAULT NULL COMMENT '连接质量数据',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_call_user` (`call_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_call_participants_call` FOREIGN KEY (`call_id`) REFERENCES `call_records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_call_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通话参与者表';

SET FOREIGN_KEY_CHECKS = 1;
