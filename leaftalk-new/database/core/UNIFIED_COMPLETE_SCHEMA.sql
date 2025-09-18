-- ================================
-- 叶语聊天系统 - 完整统一数据库结构
-- ================================
-- 版本: 1.0
-- 创建时间: 2025-08-27
-- 说明: 包含所有功能模块的完整数据库结构
-- ================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================
-- 1. 用户系统
-- ================================

-- 用户基本信息表
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `yeyu_id` varchar(20) DEFAULT NULL COMMENT '叶语号',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `nickname` varchar(100) NOT NULL COMMENT '昵称',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `avatar` longtext COMMENT '头像URL',
  `real_name` varchar(100) DEFAULT NULL COMMENT '真实姓名',
  `id_card` varchar(18) DEFAULT NULL COMMENT '身份证号',
  `verification_status` enum('unverified','pending','verified','rejected') DEFAULT 'unverified' COMMENT '实名认证状态',
  `gender` enum('male','female','unknown') DEFAULT 'unknown' COMMENT '性别',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `region` varchar(200) DEFAULT NULL COMMENT '地区',
  `signature` varchar(500) DEFAULT NULL COMMENT '个性签名',
  `status` enum('active','inactive','banned') DEFAULT 'active' COMMENT '账号状态',
  `father_name` varchar(100) DEFAULT NULL COMMENT '父亲姓名',
  `mother_name` varchar(100) DEFAULT NULL COMMENT '母亲姓名',
  `avatar_id` bigint unsigned DEFAULT NULL COMMENT '当前头像ID',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `yeyu_id` (`yeyu_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `id_card` (`id_card`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基本信息表';

-- 用户头像管理表
DROP TABLE IF EXISTS `user_avatars`;
CREATE TABLE `user_avatars` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '头像ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `avatar_url` longtext COMMENT '头像URL',
  `avatar_type` enum('upload','generated','default') DEFAULT 'default' COMMENT '头像类型',
  `file_name` varchar(255) DEFAULT NULL COMMENT '文件名',
  `file_path` varchar(500) DEFAULT NULL COMMENT '文件路径',
  `file_type` varchar(50) DEFAULT NULL COMMENT '文件类型',
  `file_size` int unsigned DEFAULT NULL COMMENT '文件大小',
  `file_format` varchar(10) DEFAULT NULL COMMENT '文件格式',
  `width` int DEFAULT NULL COMMENT '图片宽度',
  `height` int DEFAULT NULL COMMENT '图片高度',
  `hash` varchar(64) DEFAULT NULL COMMENT '文件哈希',
  `is_current` tinyint(1) DEFAULT '0' COMMENT '是否当前头像',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否有效',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `is_current` (`is_current`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户头像管理表';

-- 用户设置表
DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `notifications` tinyint(1) DEFAULT '1' COMMENT '通知开关',
  `dark_mode` tinyint(1) DEFAULT '0' COMMENT '深色模式',
  `language` varchar(10) DEFAULT 'zh-CN' COMMENT '语言设置',
  `auto_download` tinyint(1) DEFAULT '1' COMMENT '自动下载',
  `font_size` varchar(20) DEFAULT 'medium' COMMENT '字体大小',
  `sound_enabled` tinyint(1) DEFAULT '1' COMMENT '声音开关',
  `vibration_enabled` tinyint(1) DEFAULT '1' COMMENT '震动开关',
  `message_preview` tinyint(1) DEFAULT '1' COMMENT '消息预览',
  `auto_save_photos` tinyint(1) DEFAULT '0' COMMENT '自动保存照片',
  `auto_save_videos` tinyint(1) DEFAULT '0' COMMENT '自动保存视频',
  `data_usage_optimization` tinyint(1) DEFAULT '0' COMMENT '数据使用优化',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- 账号绑定表（实名认证）
DROP TABLE IF EXISTS `account_bindings`;
CREATE TABLE `account_bindings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '绑定ID',
  `id_card` varchar(18) NOT NULL COMMENT '身份证号',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `binding_type` enum('primary','secondary') DEFAULT 'secondary' COMMENT '绑定类型',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `id_card` (`id_card`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账号绑定表';

-- ================================
-- 2. 聊天系统
-- ================================

-- 聊天会话表
DROP TABLE IF EXISTS `chat_conversations`;
CREATE TABLE `chat_conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `conversation_id` varchar(50) NOT NULL COMMENT '会话唯一标识',
  `type` enum('private','group','system') DEFAULT 'private' COMMENT '会话类型',
  `name` varchar(200) DEFAULT NULL COMMENT '会话名称',
  `description` text COMMENT '会话描述',
  `avatar` varchar(500) DEFAULT NULL COMMENT '会话头像',
  `creator_id` bigint unsigned DEFAULT NULL COMMENT '创建者ID',
  `max_members` int unsigned DEFAULT '500' COMMENT '最大成员数',
  `is_public` tinyint(1) DEFAULT '0' COMMENT '是否公开',
  `join_approval` tinyint(1) DEFAULT '1' COMMENT '加入需要审批',
  `mute_all` tinyint(1) DEFAULT '0' COMMENT '全员禁言',
  `status` enum('active','archived','deleted') DEFAULT 'active' COMMENT '会话状态',
  `last_message_id` bigint unsigned DEFAULT NULL COMMENT '最后消息ID',
  `last_message_time` timestamp NULL DEFAULT NULL COMMENT '最后消息时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversation_id` (`conversation_id`),
  KEY `type` (`type`),
  KEY `creator_id` (`creator_id`),
  KEY `status` (`status`),
  KEY `last_message_id` (`last_message_id`),
  KEY `last_message_time` (`last_message_time`),
  FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- 聊天成员表
DROP TABLE IF EXISTS `chat_members`;
CREATE TABLE `chat_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `conversation_id` varchar(50) NOT NULL COMMENT '会话ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `role` enum('owner','admin','member') DEFAULT 'member' COMMENT '成员角色',
  `nickname` varchar(100) DEFAULT NULL COMMENT '群内昵称',
  `is_muted` tinyint(1) DEFAULT '0' COMMENT '是否被禁言',
  `mute_until` timestamp NULL DEFAULT NULL COMMENT '禁言到期时间',
  `last_read_message_id` bigint unsigned DEFAULT NULL COMMENT '最后已读消息ID',
  `last_read_time` timestamp NULL DEFAULT NULL COMMENT '最后已读时间',
  `notification_enabled` tinyint(1) DEFAULT '1' COMMENT '通知开关',
  `status` enum('active','left','kicked','banned') DEFAULT 'active' COMMENT '成员状态',
  `unread_count` int NOT NULL DEFAULT '0' COMMENT '未读消息数',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversation_user` (`conversation_id`,`user_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `user_id` (`user_id`),
  KEY `role` (`role`),
  KEY `status` (`status`),
  KEY `last_read_message_id` (`last_read_message_id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`conversation_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天成员表';

-- 聊天消息表
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `message_id` varchar(50) NOT NULL COMMENT '消息唯一标识',
  `conversation_id` varchar(50) NOT NULL COMMENT '会话ID',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `reply_to_id` bigint unsigned DEFAULT NULL COMMENT '回复消息ID',
  `message_type` varchar(20) NOT NULL COMMENT '消息类型',
  `content` longtext COMMENT '消息内容',
  `media_data` json DEFAULT NULL COMMENT '媒体数据',
  `media_url` longtext COMMENT '媒体URL',
  `media_size` int unsigned DEFAULT NULL COMMENT '媒体大小',
  `media_duration` int unsigned DEFAULT NULL COMMENT '媒体时长',
  `thumbnail_url` varchar(500) DEFAULT NULL COMMENT '缩略图URL',
  `is_recalled` tinyint(1) DEFAULT '0' COMMENT '是否撤回',
  `recalled_at` timestamp NULL DEFAULT NULL COMMENT '撤回时间',
  `is_edited` tinyint(1) DEFAULT '0' COMMENT '是否编辑',
  `edited_at` timestamp NULL DEFAULT NULL COMMENT '编辑时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_id` (`message_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  KEY `reply_to_id` (`reply_to_id`),
  KEY `message_type` (`message_type`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`conversation_id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- ================================
-- 3. 社交系统
-- ================================

-- 好友关系表
DROP TABLE IF EXISTS `friendships`;
CREATE TABLE `friendships` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `friend_id` bigint unsigned NOT NULL COMMENT '好友ID',
  `status` enum('pending','accepted','blocked') DEFAULT 'pending' COMMENT '关系状态',
  `remark` varchar(100) DEFAULT NULL COMMENT '备注名',
  `tags` json DEFAULT NULL COMMENT '标签',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_friend` (`user_id`,`friend_id`),
  KEY `user_id` (`user_id`),
  KEY `friend_id` (`friend_id`),
  KEY `status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- 好友请求表
DROP TABLE IF EXISTS `friend_requests`;
CREATE TABLE `friend_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '请求ID',
  `from_user_id` bigint unsigned NOT NULL COMMENT '发起用户ID',
  `to_user_id` bigint unsigned NOT NULL COMMENT '目标用户ID',
  `requester_id` bigint unsigned NOT NULL COMMENT '请求者ID',
  `requestee_id` bigint unsigned NOT NULL COMMENT '被请求者ID',
  `message` varchar(200) DEFAULT '' COMMENT '请求消息',
  `status` enum('pending','accepted','rejected') DEFAULT 'pending' COMMENT '请求状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `from_user_id` (`from_user_id`),
  KEY `to_user_id` (`to_user_id`),
  KEY `status` (`status`),
  FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友请求表';

-- ================================
-- 4. 族谱系统
-- ================================

-- 族谱表
DROP TABLE IF EXISTS `genealogies`;
CREATE TABLE `genealogies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '族谱ID',
  `name` varchar(100) NOT NULL COMMENT '族谱名称',
  `surname` varchar(50) NOT NULL COMMENT '姓氏',
  `description` text COMMENT '族谱描述',
  `family_name` varchar(50) NOT NULL COMMENT '家族姓氏',
  `ancestor_name` varchar(100) DEFAULT NULL COMMENT '始祖姓名',
  `creator_id` bigint unsigned NOT NULL COMMENT '创建者ID',
  `founder_id` bigint unsigned DEFAULT NULL COMMENT '始祖ID',
  `type` enum('main','branch') DEFAULT 'main' COMMENT '族谱类型：总谱/分谱',
  `parent_genealogy_id` bigint unsigned DEFAULT NULL COMMENT '父族谱ID（分谱指向总谱）',
  `region` varchar(200) DEFAULT NULL COMMENT '地区',
  `member_count` int unsigned DEFAULT 0 COMMENT '成员数量',
  `generation_count` int unsigned DEFAULT 0 COMMENT '世代数量',
  `is_public` tinyint(1) DEFAULT 0 COMMENT '是否公开',
  `invite_code` varchar(20) DEFAULT NULL COMMENT '邀请码',
  `settings` json DEFAULT NULL COMMENT '族谱设置',
  `status` enum('active','inactive','archived') DEFAULT 'active' COMMENT '族谱状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_code` (`invite_code`),
  KEY `surname` (`surname`),
  KEY `family_name` (`family_name`),
  KEY `creator_id` (`creator_id`),
  KEY `founder_id` (`founder_id`),
  KEY `type` (`type`),
  KEY `parent_genealogy_id` (`parent_genealogy_id`),
  KEY `status` (`status`),
  FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`founder_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`parent_genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='族谱表';

-- 族谱成员表
DROP TABLE IF EXISTS `genealogy_members`;
CREATE TABLE `genealogy_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '关联用户ID',
  `name` varchar(100) NOT NULL COMMENT '成员姓名',
  `nickname` varchar(100) DEFAULT NULL COMMENT '昵称',
  `gender` enum('male','female','unknown') DEFAULT 'unknown' COMMENT '性别',
  `father_id` bigint unsigned DEFAULT NULL COMMENT '父亲ID',
  `mother_id` bigint unsigned DEFAULT NULL COMMENT '母亲ID',
  `father_name` varchar(100) DEFAULT NULL COMMENT '父亲姓名',
  `mother_name` varchar(100) DEFAULT NULL COMMENT '母亲姓名',
  `spouse_ids` json DEFAULT NULL COMMENT '配偶IDs',
  `children_ids` json DEFAULT NULL COMMENT '子女IDs',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `death_date` date DEFAULT NULL COMMENT '死亡日期',
  `birth_place` varchar(200) DEFAULT NULL COMMENT '出生地',
  `death_place` varchar(200) DEFAULT NULL COMMENT '死亡地',
  `occupation` varchar(100) DEFAULT NULL COMMENT '职业',
  `education` varchar(200) DEFAULT NULL COMMENT '教育背景',
  `biography` text DEFAULT NULL COMMENT '生平简介',
  `avatar` varchar(500) DEFAULT NULL COMMENT '头像',
  `photos` json DEFAULT NULL COMMENT '照片集',
  `documents` json DEFAULT NULL COMMENT '相关文档',
  `generation` int DEFAULT '1' COMMENT '世代',
  `position` int DEFAULT 0 COMMENT '同代排序位置',
  `is_founder` tinyint(1) DEFAULT '0' COMMENT '是否创始人',
  `is_alive` tinyint(1) DEFAULT '1' COMMENT '是否在世',
  `is_verified` tinyint(1) DEFAULT '0' COMMENT '是否已验证',
  `role` enum('patriarch','admin','member') DEFAULT 'member' COMMENT '族谱角色',
  `position_x` int DEFAULT NULL COMMENT 'X坐标',
  `position_y` int DEFAULT NULL COMMENT 'Y坐标',
  `privacy_level` enum('public','family','private') DEFAULT 'family' COMMENT '隐私级别',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `genealogy_id` (`genealogy_id`),
  KEY `user_id` (`user_id`),
  KEY `father_id` (`father_id`),
  KEY `mother_id` (`mother_id`),
  KEY `generation` (`generation`),
  KEY `is_founder` (`is_founder`),
  KEY `is_alive` (`is_alive`),
  KEY `role` (`role`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`father_id`) REFERENCES `genealogy_members` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`mother_id`) REFERENCES `genealogy_members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='族谱成员表';

-- 家族关系表
DROP TABLE IF EXISTS `family_relations`;
CREATE TABLE `family_relations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `from_member_id` bigint unsigned NOT NULL COMMENT '起始成员ID',
  `to_member_id` bigint unsigned NOT NULL COMMENT '目标成员ID',
  `relation_type` enum('parent','child','spouse','sibling') NOT NULL COMMENT '关系类型',
  `description` varchar(200) DEFAULT NULL COMMENT '关系描述',
  `start_date` date DEFAULT NULL COMMENT '关系开始日期',
  `end_date` date DEFAULT NULL COMMENT '关系结束日期',
  `is_verified` tinyint(1) DEFAULT '0' COMMENT '是否已验证',
  `verified_by` bigint unsigned DEFAULT NULL COMMENT '验证者ID',
  `verified_at` timestamp NULL DEFAULT NULL COMMENT '验证时间',
  `created_by` bigint unsigned NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_relation` (`genealogy_id`,`from_member_id`,`to_member_id`,`relation_type`),
  KEY `genealogy_id` (`genealogy_id`),
  KEY `from_member_id` (`from_member_id`),
  KEY `to_member_id` (`to_member_id`),
  KEY `relation_type` (`relation_type`),
  KEY `verified_by` (`verified_by`),
  KEY `created_by` (`created_by`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_member_id`) REFERENCES `genealogy_members` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_member_id`) REFERENCES `genealogy_members` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家族关系表';

-- 家族活动表
DROP TABLE IF EXISTS `family_activities`;
CREATE TABLE `family_activities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '活动ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `title` varchar(200) NOT NULL COMMENT '活动标题',
  `description` text COMMENT '活动描述',
  `type` enum('gathering','memorial','celebration','meeting','other') DEFAULT 'gathering' COMMENT '活动类型',
  `location` varchar(300) DEFAULT NULL COMMENT '活动地点',
  `start_time` timestamp NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `max_participants` int unsigned DEFAULT NULL COMMENT '最大参与人数',
  `registration_deadline` timestamp NULL DEFAULT NULL COMMENT '报名截止时间',
  `require_approval` tinyint(1) DEFAULT '0' COMMENT '是否需要审批',
  `status` enum('draft','published','ongoing','completed','cancelled') DEFAULT 'draft' COMMENT '活动状态',
  `organizer_id` bigint unsigned NOT NULL COMMENT '组织者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `genealogy_id` (`genealogy_id`),
  KEY `type` (`type`),
  KEY `status` (`status`),
  KEY `organizer_id` (`organizer_id`),
  KEY `start_time` (`start_time`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家族活动表';

-- 活动参与表
DROP TABLE IF EXISTS `activity_participants`;
CREATE TABLE `activity_participants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '参与ID',
  `activity_id` bigint unsigned NOT NULL COMMENT '活动ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `member_id` bigint unsigned DEFAULT NULL COMMENT '族谱成员ID',
  `status` enum('registered','approved','rejected','attended','absent') DEFAULT 'registered' COMMENT '参与状态',
  `registration_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
  `approval_time` timestamp NULL DEFAULT NULL COMMENT '审批时间',
  `check_in_time` timestamp NULL DEFAULT NULL COMMENT '签到时间',
  `notes` text COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `activity_user` (`activity_id`,`user_id`),
  KEY `activity_id` (`activity_id`),
  KEY `user_id` (`user_id`),
  KEY `member_id` (`member_id`),
  KEY `status` (`status`),
  FOREIGN KEY (`activity_id`) REFERENCES `family_activities` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `genealogy_members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动参与表';

-- 家族故事表
DROP TABLE IF EXISTS `family_stories`;
CREATE TABLE `family_stories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '故事ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `author_id` bigint unsigned NOT NULL COMMENT '作者ID',
  `title` varchar(200) NOT NULL COMMENT '故事标题',
  `content` longtext NOT NULL COMMENT '故事内容',
  `category` enum('history','legend','biography','tradition','other') DEFAULT 'other' COMMENT '故事分类',
  `related_members` json DEFAULT NULL COMMENT '相关成员IDs',
  `tags` json DEFAULT NULL COMMENT '标签',
  `images` json DEFAULT NULL COMMENT '图片',
  `videos` json DEFAULT NULL COMMENT '视频',
  `is_featured` tinyint(1) DEFAULT '0' COMMENT '是否精选',
  `view_count` int unsigned DEFAULT '0' COMMENT '浏览次数',
  `like_count` int unsigned DEFAULT '0' COMMENT '点赞数',
  `comment_count` int unsigned DEFAULT '0' COMMENT '评论数',
  `status` enum('draft','published','archived') DEFAULT 'draft' COMMENT '状态',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `genealogy_id` (`genealogy_id`),
  KEY `author_id` (`author_id`),
  KEY `category` (`category`),
  KEY `status` (`status`),
  KEY `is_featured` (`is_featured`),
  KEY `published_at` (`published_at`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家族故事表';

-- 故事互动表
DROP TABLE IF EXISTS `story_interactions`;
CREATE TABLE `story_interactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '互动ID',
  `story_id` bigint unsigned NOT NULL COMMENT '故事ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `type` enum('like','comment','share','bookmark') NOT NULL COMMENT '互动类型',
  `content` text COMMENT '互动内容（评论内容）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `story_user_type` (`story_id`,`user_id`,`type`),
  KEY `story_id` (`story_id`),
  KEY `user_id` (`user_id`),
  KEY `type` (`type`),
  FOREIGN KEY (`story_id`) REFERENCES `family_stories` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='故事互动表';

-- 家族相册表
DROP TABLE IF EXISTS `family_albums`;
CREATE TABLE `family_albums` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '相册ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `name` varchar(200) NOT NULL COMMENT '相册名称',
  `description` text COMMENT '相册描述',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '封面图片',
  `category` enum('family','event','memorial','historical','other') DEFAULT 'family' COMMENT '相册分类',
  `privacy_level` enum('public','family','private') DEFAULT 'family' COMMENT '隐私级别',
  `creator_id` bigint unsigned NOT NULL COMMENT '创建者ID',
  `photo_count` int unsigned DEFAULT '0' COMMENT '照片数量',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `genealogy_id` (`genealogy_id`),
  KEY `category` (`category`),
  KEY `privacy_level` (`privacy_level`),
  KEY `creator_id` (`creator_id`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家族相册表';

-- 相册照片表
DROP TABLE IF EXISTS `album_photos`;
CREATE TABLE `album_photos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '照片ID',
  `album_id` bigint unsigned NOT NULL COMMENT '相册ID',
  `uploader_id` bigint unsigned NOT NULL COMMENT '上传者ID',
  `filename` varchar(255) NOT NULL COMMENT '文件名',
  `original_name` varchar(255) DEFAULT NULL COMMENT '原始文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_size` int unsigned DEFAULT NULL COMMENT '文件大小',
  `width` int unsigned DEFAULT NULL COMMENT '图片宽度',
  `height` int unsigned DEFAULT NULL COMMENT '图片高度',
  `caption` text COMMENT '照片说明',
  `taken_date` date DEFAULT NULL COMMENT '拍摄日期',
  `location` varchar(200) DEFAULT NULL COMMENT '拍摄地点',
  `related_members` json DEFAULT NULL COMMENT '相关成员IDs',
  `tags` json DEFAULT NULL COMMENT '标签',
  `order_index` int unsigned DEFAULT '0' COMMENT '排序索引',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `album_id` (`album_id`),
  KEY `uploader_id` (`uploader_id`),
  KEY `taken_date` (`taken_date`),
  KEY `order_index` (`order_index`),
  FOREIGN KEY (`album_id`) REFERENCES `family_albums` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='相册照片表';

-- 族谱通知表
DROP TABLE IF EXISTS `genealogy_notifications`;
CREATE TABLE `genealogy_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `title` varchar(200) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `type` enum('announcement','activity','approval','system','other') DEFAULT 'announcement' COMMENT '通知类型',
  `target_type` enum('all','role','specific') DEFAULT 'all' COMMENT '目标类型',
  `target_roles` json DEFAULT NULL COMMENT '目标角色',
  `target_members` json DEFAULT NULL COMMENT '目标成员IDs',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal' COMMENT '优先级',
  `is_urgent` tinyint(1) DEFAULT '0' COMMENT '是否紧急',
  `read_count` int unsigned DEFAULT '0' COMMENT '已读数量',
  `total_recipients` int unsigned DEFAULT '0' COMMENT '总接收者数量',
  `status` enum('draft','sent','archived') DEFAULT 'draft' COMMENT '状态',
  `sent_at` timestamp NULL DEFAULT NULL COMMENT '发送时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `genealogy_id` (`genealogy_id`),
  KEY `sender_id` (`sender_id`),
  KEY `type` (`type`),
  KEY `status` (`status`),
  KEY `sent_at` (`sent_at`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='族谱通知表';

-- 通知接收记录表
DROP TABLE IF EXISTS `notification_recipients`;
CREATE TABLE `notification_recipients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '接收记录ID',
  `notification_id` bigint unsigned NOT NULL COMMENT '通知ID',
  `user_id` bigint unsigned NOT NULL COMMENT '接收者ID',
  `is_read` tinyint(1) DEFAULT '0' COMMENT '是否已读',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_user` (`notification_id`,`user_id`),
  KEY `notification_id` (`notification_id`),
  KEY `user_id` (`user_id`),
  KEY `is_read` (`is_read`),
  FOREIGN KEY (`notification_id`) REFERENCES `genealogy_notifications` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知接收记录表';

-- 成员邀请表
DROP TABLE IF EXISTS `genealogy_invitations`;
CREATE TABLE `genealogy_invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '邀请ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `inviter_id` bigint unsigned NOT NULL COMMENT '邀请者ID',
  `invitee_phone` varchar(20) DEFAULT NULL COMMENT '被邀请者手机号',
  `invitee_email` varchar(100) DEFAULT NULL COMMENT '被邀请者邮箱',
  `invitee_name` varchar(100) DEFAULT NULL COMMENT '被邀请者姓名',
  `invitation_code` varchar(50) NOT NULL COMMENT '邀请码',
  `message` text COMMENT '邀请消息',
  `status` enum('pending','accepted','rejected','expired') DEFAULT 'pending' COMMENT '邀请状态',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `accepted_at` timestamp NULL DEFAULT NULL COMMENT '接受时间',
  `rejected_at` timestamp NULL DEFAULT NULL COMMENT '拒绝时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitation_code` (`invitation_code`),
  KEY `genealogy_id` (`genealogy_id`),
  KEY `inviter_id` (`inviter_id`),
  KEY `status` (`status`),
  KEY `expires_at` (`expires_at`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`inviter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员邀请表';

-- 关系审批表
DROP TABLE IF EXISTS `relation_approvals`;
CREATE TABLE `relation_approvals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '审批ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `applicant_id` bigint unsigned NOT NULL COMMENT '申请者ID',
  `relation_id` bigint unsigned DEFAULT NULL COMMENT '关系ID',
  `action_type` enum('add','modify','delete') NOT NULL COMMENT '操作类型',
  `old_data` json DEFAULT NULL COMMENT '原始数据',
  `new_data` json NOT NULL COMMENT '新数据',
  `reason` text COMMENT '申请理由',
  `status` enum('pending','approved','rejected') DEFAULT 'pending' COMMENT '审批状态',
  `approver_id` bigint unsigned DEFAULT NULL COMMENT '审批者ID',
  `approval_reason` text COMMENT '审批理由',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT '审批时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `genealogy_id` (`genealogy_id`),
  KEY `applicant_id` (`applicant_id`),
  KEY `relation_id` (`relation_id`),
  KEY `status` (`status`),
  KEY `approver_id` (`approver_id`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`relation_id`) REFERENCES `family_relations` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关系审批表';

-- ================================
-- 5. 配偶关联系统
-- ================================

-- 配偶关系表
DROP TABLE IF EXISTS `spouse_relations`;
CREATE TABLE `spouse_relations` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user1_id` bigint unsigned NOT NULL COMMENT '用户1 ID',
  `user2_id` bigint unsigned NOT NULL COMMENT '用户2 ID',
  `request_id` varchar(50) DEFAULT NULL COMMENT '请求ID',
  `status` enum('active','removed','suspended') DEFAULT 'active' COMMENT '关系状态',
  `marriage_date` date DEFAULT NULL COMMENT '结婚日期',
  `divorce_date` date DEFAULT NULL COMMENT '离婚日期',
  `relationship_type` enum('married','divorced','widowed') DEFAULT 'married' COMMENT '关系类型',
  `removed_at` timestamp NULL DEFAULT NULL COMMENT '移除时间',
  `removed_by` bigint unsigned DEFAULT NULL COMMENT '移除操作者',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_pair` (`user1_id`,`user2_id`),
  KEY `user1_id` (`user1_id`),
  KEY `user2_id` (`user2_id`),
  KEY `request_id` (`request_id`),
  KEY `status` (`status`),
  KEY `relationship_type` (`relationship_type`),
  KEY `created_at` (`created_at`),
  KEY `removed_by` (`removed_by`),
  FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`removed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关系表';

-- 配偶请求表
DROP TABLE IF EXISTS `spouse_requests`;
CREATE TABLE `spouse_requests` (
  `id` varchar(50) NOT NULL COMMENT '请求ID',
  `requester_id` bigint unsigned NOT NULL COMMENT '请求者ID',
  `target_user_id` bigint unsigned DEFAULT NULL COMMENT '目标用户ID',
  `requester_name` varchar(100) NOT NULL COMMENT '请求者姓名',
  `spouse_name` varchar(100) NOT NULL COMMENT '配偶姓名',
  `verification_code` varchar(20) NOT NULL COMMENT '验证码',
  `status` enum('pending','approved','rejected','expired') DEFAULT 'pending' COMMENT '请求状态',
  `selected_user_id` bigint unsigned DEFAULT NULL COMMENT '选中用户ID',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT '批准时间',
  `rejected_at` timestamp NULL DEFAULT NULL COMMENT '拒绝时间',
  `rejection_reason` text COMMENT '拒绝原因',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `requester_id` (`requester_id`),
  KEY `target_user_id` (`target_user_id`),
  KEY `spouse_name` (`spouse_name`),
  KEY `verification_code` (`verification_code`),
  KEY `status` (`status`),
  KEY `selected_user_id` (`selected_user_id`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`selected_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶请求表';

-- 配偶选项表
DROP TABLE IF EXISTS `spouse_options`;
CREATE TABLE `spouse_options` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '选项ID',
  `request_id` varchar(50) NOT NULL COMMENT '请求ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `address` varchar(200) DEFAULT NULL COMMENT '地址',
  `is_selected` tinyint(1) DEFAULT '0' COMMENT '是否被选中',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`request_id`) REFERENCES `spouse_requests` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶选项表';

-- 配偶关系历史表
DROP TABLE IF EXISTS `spouse_relation_history`;
CREATE TABLE `spouse_relation_history` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '历史ID',
  `relation_id` int NOT NULL COMMENT '关系ID',
  `user1_id` bigint unsigned NOT NULL COMMENT '用户1 ID',
  `user2_id` bigint unsigned NOT NULL COMMENT '用户2 ID',
  `action` enum('created','updated','removed','suspended','restored') NOT NULL COMMENT '操作类型',
  `old_status` varchar(50) DEFAULT NULL COMMENT '原状态',
  `new_status` varchar(50) DEFAULT NULL COMMENT '新状态',
  `operated_by` bigint unsigned DEFAULT NULL COMMENT '操作者ID',
  `operation_reason` text COMMENT '操作原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `relation_id` (`relation_id`),
  KEY `user1_id` (`user1_id`),
  KEY `user2_id` (`user2_id`),
  KEY `action` (`action`),
  KEY `operated_by` (`operated_by`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`relation_id`) REFERENCES `spouse_relations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`operated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关系历史表';

-- 配偶验证码表
DROP TABLE IF EXISTS `spouse_verification_codes`;
CREATE TABLE `spouse_verification_codes` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '验证码ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `code` varchar(20) NOT NULL COMMENT '验证码',
  `purpose` enum('spouse_request','spouse_confirm','spouse_remove') NOT NULL COMMENT '用途',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `used_at` timestamp NULL DEFAULT NULL COMMENT '使用时间',
  `is_used` tinyint(1) DEFAULT '0' COMMENT '是否已使用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `code` (`code`),
  KEY `purpose` (`purpose`),
  KEY `expires_at` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶验证码表';

-- ================================
-- 6. 朋友圈系统
-- ================================

-- 朋友圈动态表
DROP TABLE IF EXISTS `moments`;
CREATE TABLE `moments` (
  `id` varchar(50) NOT NULL COMMENT '动态ID',
  `user_id` varchar(50) NOT NULL COMMENT '用户ID',
  `user_name` varchar(100) NOT NULL COMMENT '用户名',
  `user_avatar` text COMMENT '用户头像',
  `content` text COMMENT '动态内容',
  `images` json DEFAULT NULL COMMENT '图片列表',
  `videos` json DEFAULT NULL COMMENT '视频列表',
  `location` varchar(200) DEFAULT NULL COMMENT '位置信息',
  `privacy` varchar(20) DEFAULT 'friends' COMMENT '隐私设置',
  `likes` json DEFAULT NULL COMMENT '点赞列表',
  `comments` json DEFAULT NULL COMMENT '评论列表',
  `like_count` int unsigned DEFAULT '0' COMMENT '点赞数',
  `comment_count` int unsigned DEFAULT '0' COMMENT '评论数',
  `view_count` int unsigned DEFAULT '0' COMMENT '浏览数',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `status` enum('published','deleted','hidden') DEFAULT 'published' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  KEY `is_pinned` (`is_pinned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈动态表';

-- 朋友圈互动表
DROP TABLE IF EXISTS `moment_interactions`;
CREATE TABLE `moment_interactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '互动ID',
  `moment_id` varchar(50) NOT NULL COMMENT '动态ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `type` enum('like','comment','share') NOT NULL COMMENT '互动类型',
  `content` text COMMENT '互动内容（评论内容）',
  `reply_to_id` bigint unsigned DEFAULT NULL COMMENT '回复的互动ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `moment_id` (`moment_id`),
  KEY `user_id` (`user_id`),
  KEY `type` (`type`),
  KEY `reply_to_id` (`reply_to_id`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`moment_id`) REFERENCES `moments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES `moment_interactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈互动表';

-- ================================
-- 7. 视频号系统
-- ================================

-- 视频号频道表
DROP TABLE IF EXISTS `video_channels`;
CREATE TABLE `video_channels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '频道ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `channel_name` varchar(100) NOT NULL COMMENT '频道名称',
  `description` text COMMENT '频道描述',
  `avatar` varchar(500) DEFAULT NULL COMMENT '频道头像',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '封面图片',
  `category` varchar(50) DEFAULT NULL COMMENT '频道分类',
  `tags` json DEFAULT NULL COMMENT '标签',
  `subscriber_count` int unsigned DEFAULT '0' COMMENT '订阅者数量',
  `video_count` int unsigned DEFAULT '0' COMMENT '视频数量',
  `total_views` bigint unsigned DEFAULT '0' COMMENT '总播放量',
  `is_verified` tinyint(1) DEFAULT '0' COMMENT '是否认证',
  `status` enum('active','suspended','deleted') DEFAULT 'active' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_channel` (`user_id`),
  KEY `category` (`category`),
  KEY `status` (`status`),
  KEY `subscriber_count` (`subscriber_count`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频号频道表';

-- 视频表
DROP TABLE IF EXISTS `videos`;
CREATE TABLE `videos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '视频ID',
  `channel_id` bigint unsigned NOT NULL COMMENT '频道ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `title` varchar(200) NOT NULL COMMENT '视频标题',
  `description` text COMMENT '视频描述',
  `video_url` varchar(500) NOT NULL COMMENT '视频URL',
  `thumbnail_url` varchar(500) DEFAULT NULL COMMENT '缩略图URL',
  `duration` int unsigned DEFAULT NULL COMMENT '视频时长（秒）',
  `file_size` bigint unsigned DEFAULT NULL COMMENT '文件大小',
  `resolution` varchar(20) DEFAULT NULL COMMENT '分辨率',
  `format` varchar(10) DEFAULT NULL COMMENT '视频格式',
  `category` varchar(50) DEFAULT NULL COMMENT '视频分类',
  `tags` json DEFAULT NULL COMMENT '标签',
  `view_count` bigint unsigned DEFAULT '0' COMMENT '播放量',
  `like_count` int unsigned DEFAULT '0' COMMENT '点赞数',
  `dislike_count` int unsigned DEFAULT '0' COMMENT '踩数',
  `comment_count` int unsigned DEFAULT '0' COMMENT '评论数',
  `share_count` int unsigned DEFAULT '0' COMMENT '分享数',
  `privacy` enum('public','unlisted','private') DEFAULT 'public' COMMENT '隐私设置',
  `is_featured` tinyint(1) DEFAULT '0' COMMENT '是否精选',
  `status` enum('processing','published','deleted','blocked') DEFAULT 'processing' COMMENT '状态',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `channel_id` (`channel_id`),
  KEY `user_id` (`user_id`),
  KEY `category` (`category`),
  KEY `status` (`status`),
  KEY `privacy` (`privacy`),
  KEY `published_at` (`published_at`),
  KEY `view_count` (`view_count`),
  FOREIGN KEY (`channel_id`) REFERENCES `video_channels` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频表';

-- 视频互动表
DROP TABLE IF EXISTS `video_interactions`;
CREATE TABLE `video_interactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '互动ID',
  `video_id` bigint unsigned NOT NULL COMMENT '视频ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `type` enum('like','dislike','comment','share','report') NOT NULL COMMENT '互动类型',
  `content` text COMMENT '互动内容（评论内容）',
  `reply_to_id` bigint unsigned DEFAULT NULL COMMENT '回复的互动ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `video_user_type` (`video_id`,`user_id`,`type`),
  KEY `video_id` (`video_id`),
  KEY `user_id` (`user_id`),
  KEY `type` (`type`),
  KEY `reply_to_id` (`reply_to_id`),
  FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES `video_interactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频互动表';

-- 频道订阅表
DROP TABLE IF EXISTS `channel_subscriptions`;
CREATE TABLE `channel_subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '订阅ID',
  `channel_id` bigint unsigned NOT NULL COMMENT '频道ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `notification_enabled` tinyint(1) DEFAULT '1' COMMENT '通知开关',
  `subscribed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '订阅时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `channel_user` (`channel_id`,`user_id`),
  KEY `channel_id` (`channel_id`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`channel_id`) REFERENCES `video_channels` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='频道订阅表';

-- ================================
-- 8. 直播系统
-- ================================

-- 直播间表
DROP TABLE IF EXISTS `live_rooms`;
CREATE TABLE `live_rooms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '直播间ID',
  `user_id` bigint unsigned NOT NULL COMMENT '主播用户ID',
  `channel_id` bigint unsigned DEFAULT NULL COMMENT '关联视频号频道ID',
  `title` varchar(200) NOT NULL COMMENT '直播标题',
  `description` text COMMENT '直播描述',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '封面图片',
  `category` varchar(50) DEFAULT NULL COMMENT '直播分类',
  `tags` json DEFAULT NULL COMMENT '标签',
  `stream_key` varchar(100) NOT NULL COMMENT '推流密钥',
  `stream_url` varchar(500) DEFAULT NULL COMMENT '推流地址',
  `play_url` varchar(500) DEFAULT NULL COMMENT '播放地址',
  `status` enum('preparing','live','paused','ended','banned') DEFAULT 'preparing' COMMENT '直播状态',
  `viewer_count` int unsigned DEFAULT '0' COMMENT '观看人数',
  `max_viewers` int unsigned DEFAULT '0' COMMENT '最高观看人数',
  `like_count` int unsigned DEFAULT '0' COMMENT '点赞数',
  `gift_count` int unsigned DEFAULT '0' COMMENT '礼物数',
  `duration` int unsigned DEFAULT '0' COMMENT '直播时长（秒）',
  `is_recording` tinyint(1) DEFAULT '0' COMMENT '是否录制',
  `recording_url` varchar(500) DEFAULT NULL COMMENT '录制文件URL',
  `started_at` timestamp NULL DEFAULT NULL COMMENT '开始时间',
  `ended_at` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stream_key` (`stream_key`),
  KEY `user_id` (`user_id`),
  KEY `channel_id` (`channel_id`),
  KEY `status` (`status`),
  KEY `category` (`category`),
  KEY `started_at` (`started_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`channel_id`) REFERENCES `video_channels` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='直播间表';

-- 直播观众表
DROP TABLE IF EXISTS `live_viewers`;
CREATE TABLE `live_viewers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '观众ID',
  `room_id` bigint unsigned NOT NULL COMMENT '直播间ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '进入时间',
  `left_at` timestamp NULL DEFAULT NULL COMMENT '离开时间',
  `watch_duration` int unsigned DEFAULT '0' COMMENT '观看时长（秒）',
  `is_online` tinyint(1) DEFAULT '1' COMMENT '是否在线',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_user` (`room_id`,`user_id`),
  KEY `room_id` (`room_id`),
  KEY `user_id` (`user_id`),
  KEY `is_online` (`is_online`),
  FOREIGN KEY (`room_id`) REFERENCES `live_rooms` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='直播观众表';

-- 直播消息表
DROP TABLE IF EXISTS `live_messages`;
CREATE TABLE `live_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `room_id` bigint unsigned NOT NULL COMMENT '直播间ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `type` enum('text','gift','like','system','announcement') DEFAULT 'text' COMMENT '消息类型',
  `content` text COMMENT '消息内容',
  `gift_data` json DEFAULT NULL COMMENT '礼物数据',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `user_id` (`user_id`),
  KEY `type` (`type`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`room_id`) REFERENCES `live_rooms` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='直播消息表';

-- 直播礼物表
DROP TABLE IF EXISTS `live_gifts`;
CREATE TABLE `live_gifts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '礼物ID',
  `name` varchar(100) NOT NULL COMMENT '礼物名称',
  `icon` varchar(500) NOT NULL COMMENT '礼物图标',
  `animation` varchar(500) DEFAULT NULL COMMENT '动画效果',
  `price` decimal(10,2) NOT NULL COMMENT '礼物价格',
  `category` varchar(50) DEFAULT NULL COMMENT '礼物分类',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `sort_order` int unsigned DEFAULT '0' COMMENT '排序',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `category` (`category`),
  KEY `is_active` (`is_active`),
  KEY `sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='直播礼物表';

-- 礼物记录表
DROP TABLE IF EXISTS `gift_records`;
CREATE TABLE `gift_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `room_id` bigint unsigned NOT NULL COMMENT '直播间ID',
  `gift_id` bigint unsigned NOT NULL COMMENT '礼物ID',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `receiver_id` bigint unsigned NOT NULL COMMENT '接收者ID',
  `quantity` int unsigned DEFAULT '1' COMMENT '数量',
  `total_price` decimal(10,2) NOT NULL COMMENT '总价格',
  `message` varchar(200) DEFAULT NULL COMMENT '附加消息',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `gift_id` (`gift_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`room_id`) REFERENCES `live_rooms` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`gift_id`) REFERENCES `live_gifts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='礼物记录表';

-- ================================
-- 9. 支付系统
-- ================================

-- 用户钱包表
DROP TABLE IF EXISTS `user_wallets`;
CREATE TABLE `user_wallets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `balance` decimal(15,2) DEFAULT '0.00' COMMENT '余额',
  `frozen_amount` decimal(15,2) DEFAULT '0.00' COMMENT '冻结金额',
  `total_income` decimal(15,2) DEFAULT '0.00' COMMENT '总收入',
  `total_expense` decimal(15,2) DEFAULT '0.00' COMMENT '总支出',
  `payment_password` varchar(255) DEFAULT NULL COMMENT '支付密码',
  `is_locked` tinyint(1) DEFAULT '0' COMMENT '是否锁定',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户钱包表';

-- 交易记录表
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '交易ID',
  `transaction_id` varchar(50) NOT NULL COMMENT '交易唯一标识',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `type` enum('recharge','withdraw','transfer','red_packet','gift','refund') NOT NULL COMMENT '交易类型',
  `amount` decimal(15,2) NOT NULL COMMENT '交易金额',
  `balance_before` decimal(15,2) NOT NULL COMMENT '交易前余额',
  `balance_after` decimal(15,2) NOT NULL COMMENT '交易后余额',
  `status` enum('pending','completed','failed','cancelled') DEFAULT 'pending' COMMENT '交易状态',
  `description` varchar(200) DEFAULT NULL COMMENT '交易描述',
  `related_user_id` bigint unsigned DEFAULT NULL COMMENT '关联用户ID',
  `related_order_id` varchar(50) DEFAULT NULL COMMENT '关联订单ID',
  `payment_method` varchar(50) DEFAULT NULL COMMENT '支付方式',
  `third_party_id` varchar(100) DEFAULT NULL COMMENT '第三方交易ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `user_id` (`user_id`),
  KEY `type` (`type`),
  KEY `status` (`status`),
  KEY `related_user_id` (`related_user_id`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- 红包表
DROP TABLE IF EXISTS `red_packets`;
CREATE TABLE `red_packets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '红包ID',
  `packet_id` varchar(50) NOT NULL COMMENT '红包唯一标识',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `type` enum('personal','group','lucky') DEFAULT 'personal' COMMENT '红包类型',
  `total_amount` decimal(10,2) NOT NULL COMMENT '红包总金额',
  `total_count` int unsigned NOT NULL COMMENT '红包总个数',
  `remaining_amount` decimal(10,2) NOT NULL COMMENT '剩余金额',
  `remaining_count` int unsigned NOT NULL COMMENT '剩余个数',
  `message` varchar(200) DEFAULT NULL COMMENT '红包祝福语',
  `conversation_id` varchar(50) DEFAULT NULL COMMENT '会话ID',
  `status` enum('active','expired','completed') DEFAULT 'active' COMMENT '红包状态',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `packet_id` (`packet_id`),
  KEY `sender_id` (`sender_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `status` (`status`),
  KEY `expires_at` (`expires_at`),
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`conversation_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='红包表';

-- 红包领取记录表
DROP TABLE IF EXISTS `red_packet_records`;
CREATE TABLE `red_packet_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `packet_id` varchar(50) NOT NULL COMMENT '红包ID',
  `receiver_id` bigint unsigned NOT NULL COMMENT '接收者ID',
  `amount` decimal(10,2) NOT NULL COMMENT '领取金额',
  `received_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `packet_receiver` (`packet_id`,`receiver_id`),
  KEY `packet_id` (`packet_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `received_at` (`received_at`),
  FOREIGN KEY (`packet_id`) REFERENCES `red_packets` (`packet_id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='红包领取记录表';

-- 转账记录表
DROP TABLE IF EXISTS `transfers`;
CREATE TABLE `transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '转账ID',
  `transfer_id` varchar(50) NOT NULL COMMENT '转账唯一标识',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `receiver_id` bigint unsigned NOT NULL COMMENT '接收者ID',
  `amount` decimal(10,2) NOT NULL COMMENT '转账金额',
  `message` varchar(200) DEFAULT NULL COMMENT '转账留言',
  `status` enum('pending','completed','rejected','expired') DEFAULT 'pending' COMMENT '转账状态',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_id` (`transfer_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `status` (`status`),
  KEY `expires_at` (`expires_at`),
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='转账记录表';

-- ================================
-- 10. 通话系统
-- ================================

-- 通话记录表
DROP TABLE IF EXISTS `call_records`;
CREATE TABLE `call_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '通话ID',
  `call_id` varchar(50) NOT NULL COMMENT '通话唯一标识',
  `caller_id` bigint unsigned NOT NULL COMMENT '发起者ID',
  `callee_id` bigint unsigned NOT NULL COMMENT '接收者ID',
  `type` enum('voice','video') NOT NULL COMMENT '通话类型',
  `status` enum('calling','connected','ended','cancelled','rejected','timeout') DEFAULT 'calling' COMMENT '通话状态',
  `duration` int unsigned DEFAULT '0' COMMENT '通话时长（秒）',
  `quality_rating` tinyint unsigned DEFAULT NULL COMMENT '通话质量评分(1-5)',
  `end_reason` enum('normal','caller_hangup','callee_hangup','network_error','timeout') DEFAULT NULL COMMENT '结束原因',
  `started_at` timestamp NULL DEFAULT NULL COMMENT '开始时间',
  `ended_at` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `call_id` (`call_id`),
  KEY `caller_id` (`caller_id`),
  KEY `callee_id` (`callee_id`),
  KEY `type` (`type`),
  KEY `status` (`status`),
  KEY `started_at` (`started_at`),
  FOREIGN KEY (`caller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`callee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话记录表';

-- ================================
-- 11. 文件管理系统
-- ================================

-- 文件存储表
DROP TABLE IF EXISTS `file_storage`;
CREATE TABLE `file_storage` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `file_id` varchar(50) NOT NULL COMMENT '文件唯一标识',
  `uploader_id` bigint unsigned NOT NULL COMMENT '上传者ID',
  `original_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `file_name` varchar(255) NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_url` varchar(500) DEFAULT NULL COMMENT '访问URL',
  `file_type` varchar(50) NOT NULL COMMENT '文件类型',
  `mime_type` varchar(100) NOT NULL COMMENT 'MIME类型',
  `file_size` bigint unsigned NOT NULL COMMENT '文件大小',
  `width` int unsigned DEFAULT NULL COMMENT '图片宽度',
  `height` int unsigned DEFAULT NULL COMMENT '图片高度',
  `duration` int unsigned DEFAULT NULL COMMENT '音视频时长',
  `hash` varchar(64) NOT NULL COMMENT '文件哈希',
  `storage_type` enum('local','oss','cdn') DEFAULT 'local' COMMENT '存储类型',
  `bucket` varchar(100) DEFAULT NULL COMMENT '存储桶',
  `is_public` tinyint(1) DEFAULT '0' COMMENT '是否公开',
  `download_count` int unsigned DEFAULT '0' COMMENT '下载次数',
  `status` enum('uploading','completed','failed','deleted') DEFAULT 'uploading' COMMENT '状态',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `file_id` (`file_id`),
  UNIQUE KEY `hash` (`hash`),
  KEY `uploader_id` (`uploader_id`),
  KEY `file_type` (`file_type`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件存储表';

-- 文件分享表
DROP TABLE IF EXISTS `file_shares`;
CREATE TABLE `file_shares` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '分享ID',
  `file_id` varchar(50) NOT NULL COMMENT '文件ID',
  `sharer_id` bigint unsigned NOT NULL COMMENT '分享者ID',
  `share_code` varchar(20) NOT NULL COMMENT '分享码',
  `password` varchar(20) DEFAULT NULL COMMENT '提取密码',
  `download_limit` int unsigned DEFAULT NULL COMMENT '下载次数限制',
  `download_count` int unsigned DEFAULT '0' COMMENT '已下载次数',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否有效',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `share_code` (`share_code`),
  KEY `file_id` (`file_id`),
  KEY `sharer_id` (`sharer_id`),
  KEY `expires_at` (`expires_at`),
  FOREIGN KEY (`file_id`) REFERENCES `file_storage` (`file_id`) ON DELETE CASCADE,
  FOREIGN KEY (`sharer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件分享表';

-- ================================
-- 12. 系统通知
-- ================================

-- 系统通知表
DROP TABLE IF EXISTS `system_notifications`;
CREATE TABLE `system_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `title` varchar(200) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `type` enum('system','announcement','update','maintenance','security') DEFAULT 'system' COMMENT '通知类型',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal' COMMENT '优先级',
  `target_type` enum('all','user_group','specific_users') DEFAULT 'all' COMMENT '目标类型',
  `target_users` json DEFAULT NULL COMMENT '目标用户IDs',
  `target_conditions` json DEFAULT NULL COMMENT '目标条件',
  `action_type` enum('none','url','app_page','function') DEFAULT 'none' COMMENT '操作类型',
  `action_data` json DEFAULT NULL COMMENT '操作数据',
  `image_url` varchar(500) DEFAULT NULL COMMENT '通知图片',
  `is_popup` tinyint(1) DEFAULT '0' COMMENT '是否弹窗',
  `is_push` tinyint(1) DEFAULT '1' COMMENT '是否推送',
  `read_count` int unsigned DEFAULT '0' COMMENT '已读数量',
  `total_recipients` int unsigned DEFAULT '0' COMMENT '总接收者数量',
  `status` enum('draft','published','expired','deleted') DEFAULT 'draft' COMMENT '状态',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_by` bigint unsigned NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `priority` (`priority`),
  KEY `status` (`status`),
  KEY `published_at` (`published_at`),
  KEY `created_by` (`created_by`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

-- 用户通知接收记录表
DROP TABLE IF EXISTS `user_notification_records`;
CREATE TABLE `user_notification_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `notification_id` bigint unsigned NOT NULL COMMENT '通知ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `is_read` tinyint(1) DEFAULT '0' COMMENT '是否已读',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  `is_clicked` tinyint(1) DEFAULT '0' COMMENT '是否点击',
  `clicked_at` timestamp NULL DEFAULT NULL COMMENT '点击时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_user` (`notification_id`,`user_id`),
  KEY `notification_id` (`notification_id`),
  KEY `user_id` (`user_id`),
  KEY `is_read` (`is_read`),
  FOREIGN KEY (`notification_id`) REFERENCES `system_notifications` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户通知接收记录表';

-- ================================
-- 13. 系统配置和日志
-- ================================

-- 系统配置表
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text COMMENT '配置值',
  `config_type` enum('string','number','boolean','json','array') DEFAULT 'string' COMMENT '配置类型',
  `category` varchar(50) DEFAULT 'general' COMMENT '配置分类',
  `description` varchar(500) DEFAULT NULL COMMENT '配置描述',
  `is_public` tinyint(1) DEFAULT '0' COMMENT '是否公开',
  `is_editable` tinyint(1) DEFAULT '1' COMMENT '是否可编辑',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`),
  KEY `category` (`category`),
  KEY `is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 操作日志表
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '用户ID',
  `action` varchar(100) NOT NULL COMMENT '操作动作',
  `resource` varchar(100) DEFAULT NULL COMMENT '操作资源',
  `resource_id` varchar(50) DEFAULT NULL COMMENT '资源ID',
  `method` varchar(10) DEFAULT NULL COMMENT 'HTTP方法',
  `url` varchar(500) DEFAULT NULL COMMENT '请求URL',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text COMMENT '用户代理',
  `request_data` json DEFAULT NULL COMMENT '请求数据',
  `response_data` json DEFAULT NULL COMMENT '响应数据',
  `status_code` int DEFAULT NULL COMMENT '状态码',
  `execution_time` int unsigned DEFAULT NULL COMMENT '执行时间(ms)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `action` (`action`),
  KEY `resource` (`resource`),
  KEY `ip_address` (`ip_address`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 错误日志表
DROP TABLE IF EXISTS `error_logs`;
CREATE TABLE `error_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '错误ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '用户ID',
  `error_type` varchar(100) NOT NULL COMMENT '错误类型',
  `error_message` text NOT NULL COMMENT '错误消息',
  `error_stack` text COMMENT '错误堆栈',
  `request_url` varchar(500) DEFAULT NULL COMMENT '请求URL',
  `request_method` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `request_data` json DEFAULT NULL COMMENT '请求数据',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text COMMENT '用户代理',
  `severity` enum('low','medium','high','critical') DEFAULT 'medium' COMMENT '严重程度',
  `is_resolved` tinyint(1) DEFAULT '0' COMMENT '是否已解决',
  `resolved_at` timestamp NULL DEFAULT NULL COMMENT '解决时间',
  `resolved_by` bigint unsigned DEFAULT NULL COMMENT '解决者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `error_type` (`error_type`),
  KEY `severity` (`severity`),
  KEY `is_resolved` (`is_resolved`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错误日志表';

-- ================================
-- 14. 数据统计
-- ================================

-- 用户统计表
DROP TABLE IF EXISTS `user_statistics`;
CREATE TABLE `user_statistics` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `date` date NOT NULL COMMENT '统计日期',
  `login_count` int unsigned DEFAULT '0' COMMENT '登录次数',
  `message_sent` int unsigned DEFAULT '0' COMMENT '发送消息数',
  `message_received` int unsigned DEFAULT '0' COMMENT '接收消息数',
  `video_watched` int unsigned DEFAULT '0' COMMENT '观看视频数',
  `live_watched_duration` int unsigned DEFAULT '0' COMMENT '观看直播时长',
  `money_spent` decimal(10,2) DEFAULT '0.00' COMMENT '消费金额',
  `money_received` decimal(10,2) DEFAULT '0.00' COMMENT '收入金额',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_date` (`user_id`,`date`),
  KEY `user_id` (`user_id`),
  KEY `date` (`date`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户统计表';

-- 设置外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 配偶关系表
DROP TABLE IF EXISTS `spouse_relations`;
CREATE TABLE `spouse_relations` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user1_id` bigint unsigned NOT NULL COMMENT '用户1 ID',
  `user2_id` bigint unsigned NOT NULL COMMENT '用户2 ID',
  `request_id` varchar(50) DEFAULT NULL COMMENT '请求ID',
  `status` enum('active','removed','suspended') DEFAULT 'active' COMMENT '关系状态',
  `marriage_date` date DEFAULT NULL COMMENT '结婚日期',
  `divorce_date` date DEFAULT NULL COMMENT '离婚日期',
  `relationship_type` enum('married','divorced','widowed') DEFAULT 'married' COMMENT '关系类型',
  `removed_at` timestamp NULL DEFAULT NULL COMMENT '移除时间',
  `removed_by` bigint unsigned DEFAULT NULL COMMENT '移除操作者',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_pair` (`user1_id`,`user2_id`),
  KEY `user1_id` (`user1_id`),
  KEY `user2_id` (`user2_id`),
  KEY `request_id` (`request_id`),
  KEY `status` (`status`),
  KEY `relationship_type` (`relationship_type`),
  KEY `created_at` (`created_at`),
  KEY `removed_by` (`removed_by`),
  FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`removed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关系表';

-- 配偶请求表
DROP TABLE IF EXISTS `spouse_requests`;
CREATE TABLE `spouse_requests` (
  `id` varchar(50) NOT NULL COMMENT '请求ID',
  `requester_id` bigint unsigned NOT NULL COMMENT '请求者ID',
  `target_user_id` bigint unsigned DEFAULT NULL COMMENT '目标用户ID',
  `requester_name` varchar(100) NOT NULL COMMENT '请求者姓名',
  `spouse_name` varchar(100) NOT NULL COMMENT '配偶姓名',
  `verification_code` varchar(20) NOT NULL COMMENT '验证码',
  `status` enum('pending','approved','rejected','expired') DEFAULT 'pending' COMMENT '请求状态',
  `selected_user_id` bigint unsigned DEFAULT NULL COMMENT '选中用户ID',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT '批准时间',
  `rejected_at` timestamp NULL DEFAULT NULL COMMENT '拒绝时间',
  `rejection_reason` text COMMENT '拒绝原因',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `requester_id` (`requester_id`),
  KEY `target_user_id` (`target_user_id`),
  KEY `spouse_name` (`spouse_name`),
  KEY `verification_code` (`verification_code`),
  KEY `status` (`status`),
  KEY `selected_user_id` (`selected_user_id`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`selected_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶请求表';
