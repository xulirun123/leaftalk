-- =====================================================
-- 叶语应用 - 最终统一数据库结构
-- 基于三个数据库合并后的 leaftalk-new 数据库
-- 生成时间: 2025-09-07
-- =====================================================

-- 设置数据库
CREATE DATABASE IF NOT EXISTS `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `leaftalk-new`;

-- =====================================================
-- 核心用户系统
-- =====================================================

-- 用户基础信息表
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `yeyu_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '叶语号',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '昵称',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '手机号',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱',
  `avatar` longtext COLLATE utf8mb4_unicode_ci COMMENT '头像',
  `real_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名',
  `id_card` varchar(18) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '身份证号',
  `verification_status` enum('unverified','pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'unverified' COMMENT '认证状态',
  `gender` enum('male','female','unknown') COLLATE utf8mb4_unicode_ci DEFAULT 'unknown' COMMENT '性别',
  `birth_date` date DEFAULT NULL COMMENT '生日',
  `region` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '地区',
  `signature` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '个性签名',
  `status` enum('active','inactive','banned') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '账户状态',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_active_at` timestamp NULL DEFAULT NULL COMMENT '最后活跃时间',
  `father_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '父亲姓名',
  `mother_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '母亲姓名',
  `avatar_id` bigint unsigned DEFAULT NULL COMMENT '头像ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_yeyu_id` (`yeyu_id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_id_card` (`id_card`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 用户设置表
CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `privacy_level` enum('public','friends','private') COLLATE utf8mb4_unicode_ci DEFAULT 'friends' COMMENT '隐私级别',
  `allow_friend_requests` tinyint(1) DEFAULT '1' COMMENT '允许好友请求',
  `allow_moments_comments` tinyint(1) DEFAULT '1' COMMENT '允许朋友圈评论',
  `notification_enabled` tinyint(1) DEFAULT '1' COMMENT '通知开关',
  `sound_enabled` tinyint(1) DEFAULT '1' COMMENT '声音开关',
  `vibration_enabled` tinyint(1) DEFAULT '1' COMMENT '震动开关',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- =====================================================
-- 聊天系统
-- =====================================================

-- 消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `conversation_id` bigint unsigned DEFAULT NULL COMMENT '会话ID',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `type` enum('text','image','video','audio','file','location','system') COLLATE utf8mb4_unicode_ci DEFAULT 'text' COMMENT '消息类型',
  `content` longtext COLLATE utf8mb4_unicode_ci COMMENT '消息内容',
  `media_url` longtext COLLATE utf8mb4_unicode_ci COMMENT '媒体文件URL',
  `reply_to_id` bigint unsigned DEFAULT NULL COMMENT '回复消息ID',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- 用户会话表
CREATE TABLE IF NOT EXISTS `user_conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `last_read_at` timestamp NULL DEFAULT NULL COMMENT '最后阅读时间',
  `is_muted` tinyint(1) DEFAULT '0' COMMENT '是否静音',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_conversation` (`user_id`,`conversation_id`),
  KEY `idx_conversation_id` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- =====================================================
-- 朋友圈系统
-- =====================================================

-- 朋友圈动态表
CREATE TABLE IF NOT EXISTS `moments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '动态ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `content` longtext COLLATE utf8mb4_unicode_ci COMMENT '动态内容',
  `images` json DEFAULT NULL COMMENT '图片列表',
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '位置信息',
  `privacy` enum('public','friends','private') COLLATE utf8mb4_unicode_ci DEFAULT 'friends' COMMENT '隐私设置',
  `likes_count` int DEFAULT '0' COMMENT '点赞数',
  `comments_count` int DEFAULT '0' COMMENT '评论数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈动态表';

-- =====================================================
-- 群组系统
-- =====================================================

-- 群邀请表
CREATE TABLE IF NOT EXISTS `group_invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '邀请ID',
  `group_id` bigint unsigned NOT NULL COMMENT '群组ID',
  `inviter_id` bigint unsigned NOT NULL COMMENT '邀请者ID',
  `invitee_id` bigint unsigned NOT NULL COMMENT '被邀请者ID',
  `status` enum('pending','accepted','rejected','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '邀请状态',
  `message` text COLLATE utf8mb4_unicode_ci COMMENT '邀请消息',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_invitee_id` (`invitee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群邀请表';

-- 群加入请求表
CREATE TABLE IF NOT EXISTS `group_join_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '请求ID',
  `group_id` bigint unsigned NOT NULL COMMENT '群组ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `status` enum('pending','approved','rejected','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '请求状态',
  `message` text COLLATE utf8mb4_unicode_ci COMMENT '请求消息',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群加入请求表';

-- 群成员表
CREATE TABLE IF NOT EXISTS `group_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `group_id` bigint unsigned NOT NULL COMMENT '群组ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `role` enum('member','admin','owner') COLLATE utf8mb4_unicode_ci DEFAULT 'member' COMMENT '角色',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '群内昵称',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_user` (`group_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表';

-- =====================================================
-- 视频系统
-- =====================================================

-- 视频频道表
CREATE TABLE IF NOT EXISTS `video_channels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '频道ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '频道名称',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '频道描述',
  `owner_id` bigint unsigned NOT NULL COMMENT '所有者ID',
  `avatar` longtext COLLATE utf8mb4_unicode_ci COMMENT '频道头像',
  `subscriber_count` int DEFAULT '0' COMMENT '订阅者数量',
  `video_count` int DEFAULT '0' COMMENT '视频数量',
  `status` enum('active','inactive','banned') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '频道状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频频道表';

-- 视频表
CREATE TABLE IF NOT EXISTS `videos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '视频ID',
  `channel_id` bigint unsigned NOT NULL COMMENT '频道ID',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频标题',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '视频描述',
  `video_url` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频URL',
  `thumbnail_url` longtext COLLATE utf8mb4_unicode_ci COMMENT '缩略图URL',
  `duration` int DEFAULT NULL COMMENT '视频时长(秒)',
  `view_count` int DEFAULT '0' COMMENT '观看次数',
  `like_count` int DEFAULT '0' COMMENT '点赞数',
  `comment_count` int DEFAULT '0' COMMENT '评论数',
  `status` enum('draft','published','private','deleted') COLLATE utf8mb4_unicode_ci DEFAULT 'draft' COMMENT '视频状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_channel_id` (`channel_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频表';

-- =====================================================
-- 钱包系统
-- =====================================================

-- 钱包表
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '钱包名称',
  `type` enum('personal','family','business') COLLATE utf8mb4_unicode_ci DEFAULT 'personal' COMMENT '钱包类型',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'CNY' COMMENT '货币类型',
  `status` enum('active','frozen','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '钱包状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包表';

-- =====================================================
-- 系统配置
-- =====================================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS `system_config` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键',
  `config_value` text COLLATE utf8mb4_unicode_ci COMMENT '配置值',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '配置描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入基础配置
INSERT IGNORE INTO `system_config` (`config_key`, `config_value`, `description`) VALUES
('app_name', '叶语', '应用名称'),
('app_version', '1.0.0', '应用版本'),
('database_version', '1.0.0', '数据库版本'),
('merge_date', NOW(), '数据库合并日期');

-- =====================================================
-- 索引优化
-- =====================================================

-- 为高频查询添加复合索引
ALTER TABLE `messages` ADD INDEX `idx_conversation_sender` (`conversation_id`, `sender_id`);
ALTER TABLE `moments` ADD INDEX `idx_user_created` (`user_id`, `created_at`);
ALTER TABLE `user_conversations` ADD INDEX `idx_user_updated` (`user_id`, `updated_at`);
