-- ================================
-- 叶语社交系统 - 完整数据库架构
-- ================================
-- 版本: 2.0
-- 创建时间: 2025-08-27
-- 说明: 重构后的完整社交系统数据库结构
-- ================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================
-- 1. 用户系统（保留现有结构）
-- ================================

-- 用户基本信息表（使用现有的users表）
-- 用户设置表（使用现有的user_settings表）
-- 用户头像表（使用现有的user_avatars表）

-- ================================
-- 2. 好友关系系统
-- ================================

-- 好友关系表
DROP TABLE IF EXISTS `friendships`;
CREATE TABLE `friendships` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `friend_id` bigint unsigned NOT NULL COMMENT '好友ID',
  `status` enum('pending','accepted','blocked','deleted') DEFAULT 'pending' COMMENT '关系状态',
  `nickname` varchar(100) DEFAULT NULL COMMENT '好友备注名',
  `tags` json DEFAULT NULL COMMENT '好友标签',
  `source` varchar(50) DEFAULT NULL COMMENT '添加来源',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_friendship` (`user_id`, `friend_id`),
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
  `message` varchar(500) DEFAULT NULL COMMENT '验证消息',
  `status` enum('pending','accepted','rejected','expired') DEFAULT 'pending' COMMENT '请求状态',
  `source` varchar(50) DEFAULT NULL COMMENT '添加来源',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_request` (`from_user_id`, `to_user_id`),
  KEY `from_user_id` (`from_user_id`),
  KEY `to_user_id` (`to_user_id`),
  KEY `status` (`status`),
  FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友请求表';

-- ================================
-- 3. 群聊系统
-- ================================

-- 群组表
DROP TABLE IF EXISTS `groups`;
CREATE TABLE `groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '群组ID',
  `name` varchar(100) NOT NULL COMMENT '群组名称',
  `description` text COMMENT '群组描述',
  `avatar` longtext COMMENT '群组头像',
  `owner_id` bigint unsigned NOT NULL COMMENT '群主ID',
  `type` enum('normal','announcement','private') DEFAULT 'normal' COMMENT '群组类型',
  `max_members` int DEFAULT 500 COMMENT '最大成员数',
  `join_approval` tinyint(1) DEFAULT '0' COMMENT '是否需要审批加入',
  `invite_confirm` tinyint(1) DEFAULT '0' COMMENT '是否需要确认邀请',
  `mute_all` tinyint(1) DEFAULT '0' COMMENT '是否全员禁言',
  `status` enum('active','disbanded','suspended') DEFAULT 'active' COMMENT '群组状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `status` (`status`),
  KEY `type` (`type`),
  FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组表';

-- 群组成员表
DROP TABLE IF EXISTS `group_members`;
CREATE TABLE `group_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `group_id` bigint unsigned NOT NULL COMMENT '群组ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `role` enum('member','admin','owner') DEFAULT 'member' COMMENT '成员角色',
  `nickname` varchar(100) DEFAULT NULL COMMENT '群内昵称',
  `join_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `muted_until` timestamp NULL DEFAULT NULL COMMENT '禁言到期时间',
  `status` enum('active','left','kicked','banned') DEFAULT 'active' COMMENT '成员状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_member` (`group_id`, `user_id`),
  KEY `group_id` (`group_id`),
  KEY `user_id` (`user_id`),
  KEY `role` (`role`),
  KEY `status` (`status`),
  FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组成员表';

-- ================================
-- 4. 会话系统
-- ================================

-- 会话表
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `type` enum('private','group') NOT NULL COMMENT '会话类型',
  `participant_ids` json NOT NULL COMMENT '参与者ID列表',
  `group_id` bigint unsigned DEFAULT NULL COMMENT '群组ID（群聊时）',
  `last_message_id` bigint unsigned DEFAULT NULL COMMENT '最后一条消息ID',
  `last_message_time` timestamp NULL DEFAULT NULL COMMENT '最后消息时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `group_id` (`group_id`),
  KEY `last_message_time` (`last_message_time`),
  FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- 用户会话关系表
DROP TABLE IF EXISTS `user_conversations`;
CREATE TABLE `user_conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `is_muted` tinyint(1) DEFAULT '0' COMMENT '是否免打扰',
  `unread_count` int DEFAULT '0' COMMENT '未读消息数',
  `last_read_message_id` bigint unsigned DEFAULT NULL COMMENT '最后已读消息ID',
  `last_read_time` timestamp NULL DEFAULT NULL COMMENT '最后阅读时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_conversation` (`user_id`, `conversation_id`),
  KEY `user_id` (`user_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `is_pinned` (`is_pinned`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话关系表';

-- ================================
-- 5. 消息系统
-- ================================

-- 消息表
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `type` enum('text','image','video','audio','file','location','card','red_packet','transfer','system','call_record') NOT NULL COMMENT '消息类型',
  `content` longtext COMMENT '消息内容',
  `media_data` json DEFAULT NULL COMMENT '媒体数据',
  `reply_to_id` bigint unsigned DEFAULT NULL COMMENT '回复的消息ID',
  `is_recalled` tinyint(1) DEFAULT '0' COMMENT '是否已撤回',
  `recalled_at` timestamp NULL DEFAULT NULL COMMENT '撤回时间',
  `status` enum('sending','sent','delivered','read','failed') DEFAULT 'sending' COMMENT '消息状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  KEY `type` (`type`),
  KEY `created_at` (`created_at`),
  KEY `reply_to_id` (`reply_to_id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- 消息阅读状态表
DROP TABLE IF EXISTS `message_read_status`;
CREATE TABLE `message_read_status` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '状态ID',
  `message_id` bigint unsigned NOT NULL COMMENT '消息ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `read_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_read_status` (`message_id`, `user_id`),
  KEY `message_id` (`message_id`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息阅读状态表';

-- ================================
-- 6. 媒体文件系统
-- ================================

-- 媒体文件表
DROP TABLE IF EXISTS `media_files`;
CREATE TABLE `media_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `user_id` bigint unsigned NOT NULL COMMENT '上传用户ID',
  `original_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `file_name` varchar(255) NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_type` varchar(50) NOT NULL COMMENT '文件类型',
  `mime_type` varchar(100) NOT NULL COMMENT 'MIME类型',
  `file_size` bigint unsigned NOT NULL COMMENT '文件大小',
  `width` int DEFAULT NULL COMMENT '图片/视频宽度',
  `height` int DEFAULT NULL COMMENT '图片/视频高度',
  `duration` int DEFAULT NULL COMMENT '音频/视频时长（秒）',
  `thumbnail_path` varchar(500) DEFAULT NULL COMMENT '缩略图路径',
  `hash` varchar(64) NOT NULL COMMENT '文件哈希',
  `status` enum('uploading','completed','failed','deleted') DEFAULT 'uploading' COMMENT '文件状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `hash` (`hash`),
  KEY `user_id` (`user_id`),
  KEY `file_type` (`file_type`),
  KEY `status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒体文件表';

-- 相册表
DROP TABLE IF EXISTS `albums`;
CREATE TABLE `albums` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '相册ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `name` varchar(100) NOT NULL COMMENT '相册名称',
  `description` text COMMENT '相册描述',
  `cover_media_id` bigint unsigned DEFAULT NULL COMMENT '封面媒体ID',
  `privacy` enum('public','friends','private') DEFAULT 'private' COMMENT '隐私设置',
  `media_count` int DEFAULT '0' COMMENT '媒体数量',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `privacy` (`privacy`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cover_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='相册表';

-- 相册媒体关系表
DROP TABLE IF EXISTS `album_media`;
CREATE TABLE `album_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `album_id` bigint unsigned NOT NULL COMMENT '相册ID',
  `media_id` bigint unsigned NOT NULL COMMENT '媒体ID',
  `sort_order` int DEFAULT '0' COMMENT '排序顺序',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_album_media` (`album_id`, `media_id`),
  KEY `album_id` (`album_id`),
  KEY `media_id` (`media_id`),
  FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='相册媒体关系表';

-- ================================
-- 7. 位置服务系统
-- ================================

-- 位置信息表
DROP TABLE IF EXISTS `locations`;
CREATE TABLE `locations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '位置ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `name` varchar(200) NOT NULL COMMENT '位置名称',
  `address` varchar(500) NOT NULL COMMENT '详细地址',
  `latitude` decimal(10,8) NOT NULL COMMENT '纬度',
  `longitude` decimal(11,8) NOT NULL COMMENT '经度',
  `accuracy` float DEFAULT NULL COMMENT '精度（米）',
  `type` enum('current','shared','favorite') DEFAULT 'current' COMMENT '位置类型',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `type` (`type`),
  KEY `location_index` (`latitude`, `longitude`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='位置信息表';

-- 实时位置共享表
DROP TABLE IF EXISTS `live_locations`;
CREATE TABLE `live_locations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '共享ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `latitude` decimal(10,8) NOT NULL COMMENT '纬度',
  `longitude` decimal(11,8) NOT NULL COMMENT '经度',
  `accuracy` float DEFAULT NULL COMMENT '精度（米）',
  `heading` float DEFAULT NULL COMMENT '方向角',
  `speed` float DEFAULT NULL COMMENT '速度（m/s）',
  `duration` int NOT NULL COMMENT '共享时长（分钟）',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否活跃',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `expires_at` (`expires_at`),
  KEY `is_active` (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实时位置共享表';

-- ================================
-- 8. 通话系统
-- ================================

-- 通话记录表
DROP TABLE IF EXISTS `call_records`;
CREATE TABLE `call_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '通话ID',
  `caller_id` bigint unsigned NOT NULL COMMENT '主叫用户ID',
  `callee_id` bigint unsigned NOT NULL COMMENT '被叫用户ID',
  `conversation_id` bigint unsigned DEFAULT NULL COMMENT '会话ID',
  `type` enum('voice','video','group_voice','group_video') NOT NULL COMMENT '通话类型',
  `status` enum('calling','connected','ended','missed','rejected','busy','failed') NOT NULL COMMENT '通话状态',
  `start_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `connect_time` timestamp NULL DEFAULT NULL COMMENT '接通时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `duration` int DEFAULT '0' COMMENT '通话时长（秒）',
  `quality_rating` tinyint DEFAULT NULL COMMENT '通话质量评分(1-5)',
  `end_reason` varchar(50) DEFAULT NULL COMMENT '结束原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `caller_id` (`caller_id`),
  KEY `callee_id` (`callee_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `type` (`type`),
  KEY `status` (`status`),
  KEY `start_time` (`start_time`),
  FOREIGN KEY (`caller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`callee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话记录表';

-- 群组通话参与者表
DROP TABLE IF EXISTS `group_call_participants`;
CREATE TABLE `group_call_participants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '参与者ID',
  `call_id` bigint unsigned NOT NULL COMMENT '通话ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `join_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `leave_time` timestamp NULL DEFAULT NULL COMMENT '离开时间',
  `duration` int DEFAULT '0' COMMENT '参与时长（秒）',
  `status` enum('invited','joined','left','kicked') DEFAULT 'invited' COMMENT '参与状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_participant` (`call_id`, `user_id`),
  KEY `call_id` (`call_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  FOREIGN KEY (`call_id`) REFERENCES `call_records` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组通话参与者表';

-- ================================
-- 9. 支付系统
-- ================================

-- 钱包表
DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `balance` decimal(15,2) DEFAULT '0.00' COMMENT '余额',
  `frozen_amount` decimal(15,2) DEFAULT '0.00' COMMENT '冻结金额',
  `total_income` decimal(15,2) DEFAULT '0.00' COMMENT '总收入',
  `total_expense` decimal(15,2) DEFAULT '0.00' COMMENT '总支出',
  `payment_password` varchar(255) DEFAULT NULL COMMENT '支付密码',
  `is_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包表';

-- 红包表
DROP TABLE IF EXISTS `red_packets`;
CREATE TABLE `red_packets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '红包ID',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `message_id` bigint unsigned DEFAULT NULL COMMENT '消息ID',
  `type` enum('normal','lucky','exclusive') DEFAULT 'normal' COMMENT '红包类型',
  `title` varchar(100) DEFAULT '恭喜发财，大吉大利' COMMENT '红包标题',
  `total_amount` decimal(10,2) NOT NULL COMMENT '总金额',
  `total_count` int NOT NULL COMMENT '红包个数',
  `remaining_amount` decimal(10,2) NOT NULL COMMENT '剩余金额',
  `remaining_count` int NOT NULL COMMENT '剩余个数',
  `exclusive_user_id` bigint unsigned DEFAULT NULL COMMENT '专属用户ID',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `status` enum('active','expired','completed','refunded') DEFAULT 'active' COMMENT '红包状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `message_id` (`message_id`),
  KEY `exclusive_user_id` (`exclusive_user_id`),
  KEY `status` (`status`),
  KEY `expires_at` (`expires_at`),
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`exclusive_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='红包表';

-- 红包领取记录表
DROP TABLE IF EXISTS `red_packet_records`;
CREATE TABLE `red_packet_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `red_packet_id` bigint unsigned NOT NULL COMMENT '红包ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `amount` decimal(10,2) NOT NULL COMMENT '领取金额',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_packet` (`red_packet_id`, `user_id`),
  KEY `red_packet_id` (`red_packet_id`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`red_packet_id`) REFERENCES `red_packets` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='红包领取记录表';

-- 转账记录表
DROP TABLE IF EXISTS `transfers`;
CREATE TABLE `transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '转账ID',
  `from_user_id` bigint unsigned NOT NULL COMMENT '转出用户ID',
  `to_user_id` bigint unsigned NOT NULL COMMENT '转入用户ID',
  `conversation_id` bigint unsigned DEFAULT NULL COMMENT '会话ID',
  `message_id` bigint unsigned DEFAULT NULL COMMENT '消息ID',
  `amount` decimal(10,2) NOT NULL COMMENT '转账金额',
  `remark` varchar(200) DEFAULT NULL COMMENT '转账备注',
  `status` enum('pending','completed','expired','refunded','failed') DEFAULT 'pending' COMMENT '转账状态',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `from_user_id` (`from_user_id`),
  KEY `to_user_id` (`to_user_id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `message_id` (`message_id`),
  KEY `status` (`status`),
  KEY `expires_at` (`expires_at`),
  FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='转账记录表';

-- ================================
-- 10. 名片和联系人系统
-- ================================

-- 名片表
DROP TABLE IF EXISTS `business_cards`;
CREATE TABLE `business_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '名片ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `name` varchar(100) NOT NULL COMMENT '姓名',
  `title` varchar(100) DEFAULT NULL COMMENT '职位',
  `company` varchar(200) DEFAULT NULL COMMENT '公司',
  `phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `address` varchar(500) DEFAULT NULL COMMENT '地址',
  `website` varchar(200) DEFAULT NULL COMMENT '网站',
  `avatar` longtext COMMENT '头像',
  `qr_code` longtext COMMENT '二维码',
  `is_default` tinyint(1) DEFAULT '0' COMMENT '是否默认名片',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `is_default` (`is_default`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='名片表';

-- 联系人表
DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '联系人ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `name` varchar(100) NOT NULL COMMENT '联系人姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `company` varchar(200) DEFAULT NULL COMMENT '公司',
  `title` varchar(100) DEFAULT NULL COMMENT '职位',
  `address` varchar(500) DEFAULT NULL COMMENT '地址',
  `notes` text COMMENT '备注',
  `avatar` longtext COMMENT '头像',
  `tags` json DEFAULT NULL COMMENT '标签',
  `is_favorite` tinyint(1) DEFAULT '0' COMMENT '是否收藏',
  `source` varchar(50) DEFAULT NULL COMMENT '来源',
  `linked_user_id` bigint unsigned DEFAULT NULL COMMENT '关联用户ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `phone` (`phone`),
  KEY `email` (`email`),
  KEY `is_favorite` (`is_favorite`),
  KEY `linked_user_id` (`linked_user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`linked_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='联系人表';

-- ================================
-- 11. 黑名单和隐私系统
-- ================================

-- 黑名单表
DROP TABLE IF EXISTS `blacklist`;
CREATE TABLE `blacklist` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '黑名单ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `blocked_user_id` bigint unsigned NOT NULL COMMENT '被拉黑用户ID',
  `reason` varchar(200) DEFAULT NULL COMMENT '拉黑原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_blacklist` (`user_id`, `blocked_user_id`),
  KEY `user_id` (`user_id`),
  KEY `blocked_user_id` (`blocked_user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`blocked_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='黑名单表';

-- 隐私设置表
DROP TABLE IF EXISTS `privacy_settings`;
CREATE TABLE `privacy_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `profile_visibility` enum('public','friends','private') DEFAULT 'friends' COMMENT '资料可见性',
  `phone_searchable` tinyint(1) DEFAULT '1' COMMENT '允许通过手机号搜索',
  `yeyu_id_searchable` tinyint(1) DEFAULT '1' COMMENT '允许通过叶语号搜索',
  `add_friend_verification` tinyint(1) DEFAULT '1' COMMENT '加好友需要验证',
  `moments_visibility` enum('public','friends','private') DEFAULT 'friends' COMMENT '朋友圈可见性',
  `location_sharing` tinyint(1) DEFAULT '1' COMMENT '允许位置分享',
  `read_receipts` tinyint(1) DEFAULT '1' COMMENT '消息已读回执',
  `online_status` tinyint(1) DEFAULT '1' COMMENT '显示在线状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='隐私设置表';

-- ================================
-- 12. 系统通知和消息推送
-- ================================

-- 系统通知表
DROP TABLE IF EXISTS `system_notifications`;
CREATE TABLE `system_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '用户ID（NULL表示全体用户）',
  `type` enum('system','friend_request','group_invite','payment','call','update') NOT NULL COMMENT '通知类型',
  `title` varchar(200) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `data` json DEFAULT NULL COMMENT '附加数据',
  `is_read` tinyint(1) DEFAULT '0' COMMENT '是否已读',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal' COMMENT '优先级',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `type` (`type`),
  KEY `is_read` (`is_read`),
  KEY `priority` (`priority`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

-- 推送设备表
DROP TABLE IF EXISTS `push_devices`;
CREATE TABLE `push_devices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `device_token` varchar(255) NOT NULL COMMENT '设备令牌',
  `device_type` enum('ios','android','web') NOT NULL COMMENT '设备类型',
  `device_info` json DEFAULT NULL COMMENT '设备信息',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否活跃',
  `last_used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后使用时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_device` (`user_id`, `device_token`),
  KEY `user_id` (`user_id`),
  KEY `device_type` (`device_type`),
  KEY `is_active` (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推送设备表';

-- ================================
-- 13. 在线状态和会话管理
-- ================================

-- 用户在线状态表
DROP TABLE IF EXISTS `user_online_status`;
CREATE TABLE `user_online_status` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '状态ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `status` enum('online','offline','away','busy','invisible') DEFAULT 'offline' COMMENT '在线状态',
  `device_type` enum('mobile','desktop','web') DEFAULT 'mobile' COMMENT '设备类型',
  `last_seen_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后在线时间',
  `socket_id` varchar(100) DEFAULT NULL COMMENT 'Socket连接ID',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text COMMENT '用户代理',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `last_seen_at` (`last_seen_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户在线状态表';

-- 会话草稿表
DROP TABLE IF EXISTS `conversation_drafts`;
CREATE TABLE `conversation_drafts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '草稿ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `content` text NOT NULL COMMENT '草稿内容',
  `type` enum('text','media','mixed') DEFAULT 'text' COMMENT '草稿类型',
  `media_data` json DEFAULT NULL COMMENT '媒体数据',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_draft` (`user_id`, `conversation_id`),
  KEY `user_id` (`user_id`),
  KEY `conversation_id` (`conversation_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话草稿表';

-- ================================
-- 14. 朋友圈系统
-- ================================

-- 朋友圈动态表
DROP TABLE IF EXISTS `moments`;
CREATE TABLE `moments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '动态ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `content` text COMMENT '动态内容',
  `location` varchar(200) DEFAULT NULL COMMENT '位置信息',
  `privacy` enum('public','friends','private','custom') DEFAULT 'friends' COMMENT '隐私设置',
  `visible_to` json DEFAULT NULL COMMENT '可见用户列表（自定义隐私时）',
  `invisible_to` json DEFAULT NULL COMMENT '不可见用户列表',
  `status` enum('draft','published','deleted') DEFAULT 'draft' COMMENT '动态状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `privacy` (`privacy`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈动态表';

-- 朋友圈媒体关系表
DROP TABLE IF EXISTS `moment_media`;
CREATE TABLE `moment_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `moment_id` bigint unsigned NOT NULL COMMENT '动态ID',
  `media_id` bigint unsigned NOT NULL COMMENT '媒体ID',
  `sort_order` int DEFAULT '0' COMMENT '排序顺序',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_moment_media` (`moment_id`, `media_id`),
  KEY `moment_id` (`moment_id`),
  KEY `media_id` (`media_id`),
  FOREIGN KEY (`moment_id`) REFERENCES `moments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`media_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈媒体关系表';

-- 朋友圈点赞表
DROP TABLE IF EXISTS `moment_likes`;
CREATE TABLE `moment_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '点赞ID',
  `moment_id` bigint unsigned NOT NULL COMMENT '动态ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_moment_like` (`moment_id`, `user_id`),
  KEY `moment_id` (`moment_id`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`moment_id`) REFERENCES `moments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈点赞表';

-- 朋友圈评论表
DROP TABLE IF EXISTS `moment_comments`;
CREATE TABLE `moment_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `moment_id` bigint unsigned NOT NULL COMMENT '动态ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `content` text NOT NULL COMMENT '评论内容',
  `reply_to_id` bigint unsigned DEFAULT NULL COMMENT '回复的评论ID',
  `status` enum('published','deleted') DEFAULT 'published' COMMENT '评论状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `moment_id` (`moment_id`),
  KEY `user_id` (`user_id`),
  KEY `reply_to_id` (`reply_to_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  FOREIGN KEY (`moment_id`) REFERENCES `moments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES `moment_comments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈评论表';

-- ================================
-- 15. 消息加密系统
-- ================================

-- 用户密钥表
DROP TABLE IF EXISTS `user_keys`;
CREATE TABLE `user_keys` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '密钥ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `public_key` text NOT NULL COMMENT '公钥',
  `private_key_encrypted` text NOT NULL COMMENT '加密的私钥',
  `key_version` int DEFAULT '1' COMMENT '密钥版本',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否活跃',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_version` (`user_id`, `key_version`),
  KEY `user_id` (`user_id`),
  KEY `is_active` (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户密钥表';

-- 会话密钥表
DROP TABLE IF EXISTS `conversation_keys`;
CREATE TABLE `conversation_keys` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '会话密钥ID',
  `conversation_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `key_data` text NOT NULL COMMENT '加密的会话密钥',
  `key_version` int DEFAULT '1' COMMENT '密钥版本',
  `created_by` bigint unsigned NOT NULL COMMENT '创建者ID',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否活跃',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation_version` (`conversation_id`, `key_version`),
  KEY `conversation_id` (`conversation_id`),
  KEY `created_by` (`created_by`),
  KEY `is_active` (`is_active`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话密钥表';

-- 用户会话密钥表
DROP TABLE IF EXISTS `user_conversation_keys`;
CREATE TABLE `user_conversation_keys` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `conversation_key_id` bigint unsigned NOT NULL COMMENT '会话密钥ID',
  `encrypted_key` text NOT NULL COMMENT '用户加密的会话密钥',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_conversation_key` (`user_id`, `conversation_key_id`),
  KEY `user_id` (`user_id`),
  KEY `conversation_key_id` (`conversation_key_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_key_id`) REFERENCES `conversation_keys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话密钥表';

SET FOREIGN_KEY_CHECKS = 1;
