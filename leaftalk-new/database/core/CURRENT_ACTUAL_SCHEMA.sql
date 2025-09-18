-- 叶语聊天系统 - 当前实际数据库结构
-- 生成时间: 2025-08-27T05:06:55.421Z
-- 数据库: leaftalk_enterprise

-- account_bindings 表
CREATE TABLE `account_bindings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '绑定ID',
  `id_card` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '身份证号',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `binding_type` enum('primary','secondary') COLLATE utf8mb4_unicode_ci DEFAULT 'secondary' COMMENT '绑定类型',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id_card` (`user_id`,`id_card`),
  KEY `idx_id_card` (`id_card`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `account_bindings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- chat_conversations 表
CREATE TABLE `chat_conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `conversation_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话唯一标识',
  `type` enum('private','group','system') COLLATE utf8mb4_unicode_ci DEFAULT 'private' COMMENT '会话类型',
  `name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '会话名称(群聊名称)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '会话描述',
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '会话头像(群聊头像)',
  `creator_id` bigint unsigned DEFAULT NULL COMMENT '创建者ID',
  `max_members` int unsigned DEFAULT '500' COMMENT '最大成员数',
  `is_public` tinyint(1) DEFAULT '0' COMMENT '是否公开群聊',
  `join_approval` tinyint(1) DEFAULT '1' COMMENT '是否需要审批加入',
  `mute_all` tinyint(1) DEFAULT '0' COMMENT '是否全员禁言',
  `status` enum('active','archived','deleted') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '会话状态',
  `last_message_id` bigint unsigned DEFAULT NULL COMMENT '最后一条消息ID',
  `last_message_time` timestamp NULL DEFAULT NULL COMMENT '最后消息时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_id` (`conversation_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_type` (`type`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_status` (`status`),
  KEY `idx_last_message_time` (`last_message_time`),
  KEY `last_message_id` (`last_message_id`),
  CONSTRAINT `chat_conversations_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chat_conversations_ibfk_2` FOREIGN KEY (`last_message_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- chat_members 表
CREATE TABLE `chat_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `conversation_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `role` enum('owner','admin','member') COLLATE utf8mb4_unicode_ci DEFAULT 'member' COMMENT '成员角色',
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '群内昵称',
  `is_muted` tinyint(1) DEFAULT '0' COMMENT '是否被禁言',
  `mute_until` timestamp NULL DEFAULT NULL COMMENT '禁言到期时间',
  `last_read_message_id` bigint unsigned DEFAULT NULL COMMENT '最后已读消息ID',
  `last_read_time` timestamp NULL DEFAULT NULL COMMENT '最后已读时间',
  `notification_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用通知',
  `status` enum('active','left','kicked','banned') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '成员状态',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `unread_count` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_user` (`conversation_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  KEY `last_read_message_id` (`last_read_message_id`),
  CONSTRAINT `chat_members_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `chat_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_members_ibfk_3` FOREIGN KEY (`last_read_message_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- chat_messages 表
CREATE TABLE `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `message_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息唯一标识',
  `conversation_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话ID',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送者ID',
  `reply_to_id` bigint unsigned DEFAULT NULL COMMENT '回复的消息ID',
  `message_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `media_data` json DEFAULT NULL COMMENT '媒体数据',
  `media_url` longtext COLLATE utf8mb4_unicode_ci,
  `media_size` int unsigned DEFAULT NULL COMMENT '媒体文件大小',
  `media_duration` int unsigned DEFAULT NULL COMMENT '媒体时长(秒)',
  `thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '缩略图URL',
  `is_recalled` tinyint(1) DEFAULT '0' COMMENT '是否已撤回',
  `recalled_at` timestamp NULL DEFAULT NULL COMMENT '撤回时间',
  `is_edited` tinyint(1) DEFAULT '0' COMMENT '是否已编辑',
  `edited_at` timestamp NULL DEFAULT NULL COMMENT '编辑时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_id` (`message_id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_message_type` (`message_type`),
  KEY `reply_to_id` (`reply_to_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_3` FOREIGN KEY (`reply_to_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=632 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- friend_requests 表
CREATE TABLE `friend_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '请求ID',
  `from_user_id` bigint unsigned NOT NULL COMMENT '发起用户ID',
  `to_user_id` bigint unsigned NOT NULL COMMENT '目标用户ID',
  `message` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '请求消息',
  `status` enum('pending','accepted','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '请求状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `requester_id` bigint unsigned NOT NULL COMMENT '发起请求的用户ID',
  `requestee_id` bigint unsigned NOT NULL COMMENT '接收请求的用户ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_request` (`from_user_id`,`to_user_id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_to_user_id` (`to_user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `friend_requests_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `friend_requests_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- friendships 表
CREATE TABLE `friendships` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `friend_id` bigint unsigned NOT NULL COMMENT '朋友ID',
  `status` enum('pending','accepted','blocked') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '关系状态',
  `remark` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注名',
  `tags` json DEFAULT NULL COMMENT '朋友标签',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_friendship` (`user_id`,`friend_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_friend_id` (`friend_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `friendships_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `friendships_ibfk_2` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- genealogies 表
CREATE TABLE `genealogies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '族谱ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '族谱名称',
  `surname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '姓氏',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '族谱描述',
  `creator_id` bigint unsigned NOT NULL COMMENT '创建者用户ID',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '族谱状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_surname` (`surname`),
  KEY `idx_status` (`status`),
  CONSTRAINT `genealogies_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- genealogy_members 表
CREATE TABLE `genealogy_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `genealogy_id` bigint unsigned NOT NULL COMMENT '族谱ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '关联用户ID（如果有）',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '成员姓名',
  `gender` enum('male','female','unknown') COLLATE utf8mb4_unicode_ci DEFAULT 'unknown' COMMENT '性别',
  `father_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '父亲姓名',
  `mother_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '母亲姓名',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `death_date` date DEFAULT NULL COMMENT '去世日期',
  `generation` int DEFAULT '1' COMMENT '世代数',
  `is_founder` tinyint(1) DEFAULT '0' COMMENT '是否为创始人',
  `position_x` int DEFAULT NULL COMMENT '族谱图中X坐标',
  `position_y` int DEFAULT NULL COMMENT '族谱图中Y坐标',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_genealogy_id` (`genealogy_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_generation` (`generation`),
  KEY `idx_is_founder` (`is_founder`),
  CONSTRAINT `genealogy_members_ibfk_1` FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `genealogy_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- moments 表
CREATE TABLE `moments` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_avatar` text COLLATE utf8mb4_unicode_ci,
  `content` text COLLATE utf8mb4_unicode_ci,
  `images` json DEFAULT NULL,
  `videos` json DEFAULT NULL,
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `privacy` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'friends',
  `likes` json DEFAULT NULL,
  `comments` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- spouse_options 表
CREATE TABLE `spouse_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '申请ID',
  `user_id` bigint unsigned NOT NULL COMMENT '候选用户ID',
  `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户地址',
  `is_selected` tinyint(1) DEFAULT '0' COMMENT '是否被选中',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_request_user` (`request_id`,`user_id`),
  KEY `idx_request_id` (`request_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_spouse_options_composite` (`request_id`,`user_id`,`is_selected`),
  CONSTRAINT `spouse_options_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `spouse_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spouse_options_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶选择选项表';

-- spouse_relation_history 表
CREATE TABLE `spouse_relation_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `relation_id` int NOT NULL COMMENT '关系ID',
  `user1_id` bigint unsigned NOT NULL COMMENT '用户1 ID',
  `user2_id` bigint unsigned NOT NULL COMMENT '用户2 ID',
  `action` enum('created','updated','removed','suspended','restored') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型',
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '旧状态',
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '新状态',
  `operated_by` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operation_reason` text COLLATE utf8mb4_unicode_ci COMMENT '操作原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `operated_by` (`operated_by`),
  KEY `idx_relation_id` (`relation_id`),
  KEY `idx_user1_id` (`user1_id`),
  KEY `idx_user2_id` (`user2_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `spouse_relation_history_ibfk_1` FOREIGN KEY (`relation_id`) REFERENCES `spouse_relations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spouse_relation_history_ibfk_2` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spouse_relation_history_ibfk_3` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spouse_relation_history_ibfk_4` FOREIGN KEY (`operated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关系历史记录表';

-- spouse_relations 表
CREATE TABLE `spouse_relations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user1_id` bigint unsigned NOT NULL COMMENT '用户1 ID',
  `user2_id` bigint unsigned NOT NULL COMMENT '用户2 ID',
  `request_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联的申请ID',
  `status` enum('active','removed','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '关系状态',
  `marriage_date` date DEFAULT NULL COMMENT '结婚日期',
  `divorce_date` date DEFAULT NULL COMMENT '离婚日期',
  `relationship_type` enum('married','divorced','widowed') COLLATE utf8mb4_unicode_ci DEFAULT 'married' COMMENT '关系类型',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关系建立时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `removed_at` timestamp NULL DEFAULT NULL COMMENT '关系解除时间',
  `removed_by` bigint unsigned DEFAULT NULL COMMENT '解除关系的用户ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_pair` (`user1_id`,`user2_id`),
  KEY `request_id` (`request_id`),
  KEY `removed_by` (`removed_by`),
  KEY `idx_user1_id` (`user1_id`),
  KEY `idx_user2_id` (`user2_id`),
  KEY `idx_status` (`status`),
  KEY `idx_relationship_type` (`relationship_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_spouse_relations_composite` (`status`,`user1_id`,`user2_id`),
  CONSTRAINT `spouse_relations_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spouse_relations_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spouse_relations_ibfk_3` FOREIGN KEY (`request_id`) REFERENCES `spouse_requests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `spouse_relations_ibfk_4` FOREIGN KEY (`removed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关系表';

-- spouse_requests 表
CREATE TABLE `spouse_requests` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requester_id` bigint unsigned NOT NULL COMMENT '申请人用户ID',
  `target_user_id` bigint unsigned DEFAULT NULL COMMENT '目标用户ID（如果已确定）',
  `requester_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '申请人姓名',
  `spouse_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配偶姓名',
  `verification_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '验证码',
  `status` enum('pending','approved','rejected','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '申请状态',
  `selected_user_id` bigint unsigned DEFAULT NULL COMMENT '选中的用户ID',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT '批准时间',
  `rejected_at` timestamp NULL DEFAULT NULL COMMENT '拒绝时间',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci COMMENT '拒绝原因',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `selected_user_id` (`selected_user_id`),
  KEY `idx_requester_id` (`requester_id`),
  KEY `idx_target_user_id` (`target_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_verification_code` (`verification_code`),
  KEY `idx_spouse_name` (`spouse_name`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_spouse_requests_composite` (`status`,`spouse_name`,`created_at`),
  CONSTRAINT `spouse_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spouse_requests_ibfk_2` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `spouse_requests_ibfk_3` FOREIGN KEY (`selected_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关联申请表';

-- spouse_verification_codes 表
CREATE TABLE `spouse_verification_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '验证码',
  `purpose` enum('spouse_request','spouse_confirm','spouse_remove') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用途',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `used_at` timestamp NULL DEFAULT NULL COMMENT '使用时间',
  `is_used` tinyint(1) DEFAULT '0' COMMENT '是否已使用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_code` (`code`),
  KEY `idx_purpose` (`purpose`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `spouse_verification_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶验证码表';

-- user_avatars 表
CREATE TABLE `user_avatars` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '头像ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `avatar_url` longtext COLLATE utf8mb4_unicode_ci,
  `avatar_type` enum('upload','generated','default') COLLATE utf8mb4_unicode_ci DEFAULT 'default' COMMENT '头像类型',
  `file_size` int unsigned DEFAULT NULL COMMENT '文件大小(字节)',
  `file_format` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件格式',
  `is_current` tinyint(1) DEFAULT '0' COMMENT '是否为当前头像',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否为当前头像',
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件名',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件路径',
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件类型',
  `width` int DEFAULT NULL COMMENT '图片宽度',
  `height` int DEFAULT NULL COMMENT '图片高度',
  `hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文件哈希值',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_current` (`is_current`),
  CONSTRAINT `user_avatars_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=260 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_chat_list 表 (跳过: View 'leaftalk_enterprise.user_chat_list' references invalid table(s) or column(s) or function(s) or definer/invoker of view lack rights to use them)

-- user_settings 表
CREATE TABLE `user_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `notifications` tinyint(1) DEFAULT '1' COMMENT '消息通知',
  `dark_mode` tinyint(1) DEFAULT '0' COMMENT '深色模式',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'zh-CN' COMMENT '语言设置',
  `auto_download` tinyint(1) DEFAULT '1' COMMENT '自动下载',
  `font_size` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'medium' COMMENT '字体大小',
  `sound_enabled` tinyint(1) DEFAULT '1' COMMENT '声音开启',
  `vibration_enabled` tinyint(1) DEFAULT '1' COMMENT '震动开启',
  `message_preview` tinyint(1) DEFAULT '1' COMMENT '消息预览',
  `auto_save_photos` tinyint(1) DEFAULT '0' COMMENT '自动保存照片',
  `auto_save_videos` tinyint(1) DEFAULT '0' COMMENT '自动保存视频',
  `data_usage_optimization` tinyint(1) DEFAULT '0' COMMENT '数据使用优化',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_settings` (`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- users 表
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `yeyu_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '叶语号',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '昵称',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码哈希',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '手机号',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱',
  `avatar` longtext COLLATE utf8mb4_unicode_ci,
  `real_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名',
  `id_card` varchar(18) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '身份证号',
  `verification_status` enum('unverified','pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'unverified' COMMENT '实名认证状态',
  `gender` enum('male','female','unknown') COLLATE utf8mb4_unicode_ci DEFAULT 'unknown' COMMENT '性别',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `region` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '地区',
  `signature` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '个性签名',
  `status` enum('active','inactive','banned') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '账户状态',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `father_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '父亲姓名',
  `mother_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '母亲姓名',
  `avatar_id` bigint unsigned DEFAULT NULL COMMENT '当前头像ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_yeyu_id` (`yeyu_id`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_id_card` (`id_card`),
  KEY `idx_yeyu_id` (`yeyu_id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_email` (`email`),
  KEY `idx_id_card` (`id_card`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- v_user_visible_chats 表 (跳过: View 'leaftalk_enterprise.v_user_visible_chats' references invalid table(s) or column(s) or function(s) or definer/invoker of view lack rights to use them)

-- v_user_visible_messages 表 (跳过: View 'leaftalk_enterprise.v_user_visible_messages' references invalid table(s) or column(s) or function(s) or definer/invoker of view lack rights to use them)

