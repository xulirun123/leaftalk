-- =====================================================
-- 叶语聊天系统 - 统一数据库架构
-- 版本: 1.0.0
-- 创建时间: 2025-08-22
-- 说明: 这是项目的唯一权威数据库架构定义
-- =====================================================

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 用户相关表
-- =====================================================

-- 用户基础信息表
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `yeyu_id` VARCHAR(20) NOT NULL UNIQUE COMMENT '叶语号',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
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
  `region` VARCHAR(100) COMMENT '地区',
  `status` ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '账户状态',
  `last_login_at` TIMESTAMP NULL COMMENT '最后登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_yeyu_id` (`yeyu_id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_verification_status` (`verification_status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 用户设置表
DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `privacy_phone_visible` BOOLEAN DEFAULT FALSE COMMENT '手机号是否可见',
  `privacy_moments_visible` ENUM('all', 'friends', 'none') DEFAULT 'friends' COMMENT '朋友圈可见性',
  `privacy_searchable` BOOLEAN DEFAULT TRUE COMMENT '是否可被搜索',
  `notification_message` BOOLEAN DEFAULT TRUE COMMENT '消息通知',
  `notification_call` BOOLEAN DEFAULT TRUE COMMENT '通话通知',
  `notification_moments` BOOLEAN DEFAULT TRUE COMMENT '朋友圈通知',
  `theme` ENUM('light', 'dark', 'auto') DEFAULT 'auto' COMMENT '主题设置',
  `language` VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言设置',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- =====================================================
-- 2. 聊天相关表
-- =====================================================

-- 聊天会话表
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `conversation_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '会话唯一标识',
  `type` ENUM('private', 'group') NOT NULL COMMENT '会话类型',
  `name` VARCHAR(100) COMMENT '会话名称(群聊名称)',
  `avatar` VARCHAR(500) COMMENT '会话头像',
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
DROP TABLE IF EXISTS `conversation_members`;
CREATE TABLE `conversation_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `conversation_id` VARCHAR(64) NOT NULL COMMENT '会话ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` ENUM('owner', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
  `nickname` VARCHAR(50) COMMENT '群内昵称',
  `is_muted` BOOLEAN DEFAULT FALSE COMMENT '是否静音',
  `is_pinned` BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  `unread_count` INT UNSIGNED DEFAULT 0 COMMENT '未读消息数',
  `last_read_message_id` BIGINT UNSIGNED COMMENT '最后已读消息ID',
  `last_read_time` TIMESTAMP NULL COMMENT '最后已读时间',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`),
  KEY `idx_joined_at` (`joined_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话成员表';

-- 聊天消息表
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `message_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '消息唯一标识',
  `conversation_id` VARCHAR(64) NOT NULL COMMENT '会话ID',
  `sender_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `reply_to_id` BIGINT UNSIGNED COMMENT '回复的消息ID',
  `message_type` ENUM('text', 'image', 'voice', 'video', 'file', 'location', 'contact', 'red_packet', 'transfer', 'system') NOT NULL COMMENT '消息类型',
  `content` TEXT COMMENT '消息内容',
  `media_data` JSON COMMENT '媒体数据(JSON格式)',
  `status` ENUM('sending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sending' COMMENT '消息状态',
  `is_recalled` BOOLEAN DEFAULT FALSE COMMENT '是否已撤回',
  `recalled_at` TIMESTAMP NULL COMMENT '撤回时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_id` (`message_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_message_type` (`message_type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_reply_to_id` (`reply_to_id`),
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- =====================================================
-- 3. 联系人相关表
-- =====================================================

-- 好友关系表
DROP TABLE IF EXISTS `friendships`;
CREATE TABLE `friendships` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关系ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `friend_id` BIGINT UNSIGNED NOT NULL COMMENT '好友ID',
  `status` ENUM('pending', 'accepted', 'blocked', 'deleted') DEFAULT 'pending' COMMENT '关系状态',
  `remark` VARCHAR(50) COMMENT '备注名',
  `source` ENUM('phone', 'yeyu_id', 'qr_code', 'group', 'recommendation') COMMENT '添加来源',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_friend` (`user_id`, `friend_id`),
  KEY `idx_friend_id` (`friend_id`),
  KEY `idx_status` (`status`),
  KEY `idx_source` (`source`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- 好友请求表
DROP TABLE IF EXISTS `friend_requests`;
CREATE TABLE `friend_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '请求ID',
  `requester_id` BIGINT UNSIGNED NOT NULL COMMENT '请求者ID',
  `target_id` BIGINT UNSIGNED NOT NULL COMMENT '目标用户ID',
  `message` VARCHAR(200) COMMENT '请求消息',
  `status` ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending' COMMENT '请求状态',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `processed_at` TIMESTAMP NULL COMMENT '处理时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_requester_target` (`requester_id`, `target_id`),
  KEY `idx_target_id` (`target_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友请求表';

-- =====================================================
-- 4. 朋友圈相关表
-- =====================================================

-- 朋友圈动态表
DROP TABLE IF EXISTS `moments_posts`;
CREATE TABLE `moments_posts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '动态ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `content` TEXT COMMENT '动态内容',
  `media_urls` JSON COMMENT '媒体文件URLs',
  `location_name` VARCHAR(100) COMMENT '位置名称',
  `location_latitude` DECIMAL(10,8) COMMENT '纬度',
  `location_longitude` DECIMAL(11,8) COMMENT '经度',
  `visibility` ENUM('public', 'friends', 'private') DEFAULT 'friends' COMMENT '可见性',
  `like_count` INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
  `comment_count` INT UNSIGNED DEFAULT 0 COMMENT '评论数',
  `is_deleted` BOOLEAN DEFAULT FALSE COMMENT '是否已删除',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_visibility` (`visibility`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_deleted` (`is_deleted`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈动态表';

-- 朋友圈评论表
DROP TABLE IF EXISTS `moments_comments`;
CREATE TABLE `moments_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `post_id` BIGINT UNSIGNED NOT NULL COMMENT '动态ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `content` VARCHAR(500) NOT NULL COMMENT '评论内容',
  `reply_to_id` BIGINT UNSIGNED COMMENT '回复的评论ID',
  `is_deleted` BOOLEAN DEFAULT FALSE COMMENT '是否已删除',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_reply_to_id` (`reply_to_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`post_id`) REFERENCES `moments_posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈评论表';

-- 朋友圈点赞表
DROP TABLE IF EXISTS `moments_likes`;
CREATE TABLE `moments_likes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '点赞ID',
  `post_id` BIGINT UNSIGNED NOT NULL COMMENT '动态ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_user` (`post_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`post_id`) REFERENCES `moments_posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈点赞表';

-- =====================================================
-- 5. 族谱相关表
-- =====================================================

-- 族谱表
DROP TABLE IF EXISTS `genealogies`;
CREATE TABLE `genealogies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '族谱ID',
  `name` VARCHAR(100) NOT NULL COMMENT '族谱名称',
  `description` TEXT COMMENT '族谱描述',
  `family_name` VARCHAR(50) NOT NULL COMMENT '家族姓氏',
  `ancestor_name` VARCHAR(50) COMMENT '始祖姓名',
  `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '创建者ID',
  `member_count` INT UNSIGNED DEFAULT 0 COMMENT '成员数量',
  `status` ENUM('active', 'inactive', 'archived') DEFAULT 'active' COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_family_name` (`family_name`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='族谱表';

-- 族谱成员表
DROP TABLE IF EXISTS `genealogy_members`;
CREATE TABLE `genealogy_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `genealogy_id` BIGINT UNSIGNED NOT NULL COMMENT '族谱ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` ENUM('patriarch', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
  `generation` INT NOT NULL COMMENT '世代',
  `father_id` BIGINT UNSIGNED COMMENT '父亲ID',
  `mother_id` BIGINT UNSIGNED COMMENT '母亲ID',
  `spouse_ids` JSON COMMENT '配偶IDs',
  `children_ids` JSON COMMENT '子女IDs',
  `birth_date` DATE COMMENT '出生日期',
  `death_date` DATE COMMENT '死亡日期',
  `is_alive` BOOLEAN DEFAULT TRUE COMMENT '是否在世',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_genealogy_user` (`genealogy_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`),
  KEY `idx_generation` (`generation`),
  KEY `idx_father_id` (`father_id`),
  KEY `idx_mother_id` (`mother_id`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='族谱成员表';

-- =====================================================
-- 6. 支付相关表
-- =====================================================

-- 红包表
DROP TABLE IF EXISTS `red_packets`;
CREATE TABLE `red_packets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '红包ID',
  `sender_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `conversation_id` VARCHAR(64) COMMENT '会话ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '总金额',
  `count` INT UNSIGNED NOT NULL COMMENT '红包个数',
  `message` VARCHAR(100) COMMENT '红包留言',
  `type` ENUM('random', 'fixed') DEFAULT 'random' COMMENT '红包类型',
  `status` ENUM('active', 'expired', 'completed') DEFAULT 'active' COMMENT '状态',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='红包表';

-- 转账表
DROP TABLE IF EXISTS `transfers`;
CREATE TABLE `transfers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '转账ID',
  `sender_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
  `receiver_id` BIGINT UNSIGNED NOT NULL COMMENT '接收者ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '转账金额',
  `message` VARCHAR(100) COMMENT '转账留言',
  `status` ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  `completed_at` TIMESTAMP NULL COMMENT '完成时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='转账表';

-- =====================================================
-- 7. 系统相关表
-- =====================================================

-- 系统通知表
DROP TABLE IF EXISTS `system_notifications`;
CREATE TABLE `system_notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `title` VARCHAR(100) NOT NULL COMMENT '通知标题',
  `content` TEXT NOT NULL COMMENT '通知内容',
  `type` ENUM('system', 'friend', 'message', 'moments', 'payment') NOT NULL COMMENT '通知类型',
  `data` JSON COMMENT '附加数据',
  `is_read` BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  `read_at` TIMESTAMP NULL COMMENT '已读时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

-- 账户绑定表
DROP TABLE IF EXISTS `account_bindings`;
CREATE TABLE `account_bindings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '绑定ID',
  `id_card` VARCHAR(18) NOT NULL COMMENT '身份证号',
  `user_ids` JSON NOT NULL COMMENT '绑定的用户IDs',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_id_card` (`id_card`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户绑定表';

-- =====================================================
-- 8. 视频号相关表
-- =====================================================

-- 视频号频道表
DROP TABLE IF EXISTS `video_channels`;
CREATE TABLE `video_channels` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '频道ID',
  `channel_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '频道唯一标识',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '频道名称',
  `description` TEXT COMMENT '频道描述',
  `avatar` VARCHAR(500) COMMENT '频道头像',
  `cover_image` VARCHAR(500) COMMENT '频道封面',
  `category` VARCHAR(50) COMMENT '频道分类',
  `subscriber_count` INT UNSIGNED DEFAULT 0 COMMENT '订阅数',
  `video_count` INT UNSIGNED DEFAULT 0 COMMENT '视频数',
  `total_views` BIGINT UNSIGNED DEFAULT 0 COMMENT '总播放量',
  `status` ENUM('active', 'suspended', 'deleted') DEFAULT 'active' COMMENT '状态',
  `is_verified` BOOLEAN DEFAULT FALSE COMMENT '是否认证',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_id` (`channel_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_category` (`category`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频号频道表';

-- 视频表
DROP TABLE IF EXISTS `videos`;
CREATE TABLE `videos` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '视频ID',
  `video_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '视频唯一标识',
  `channel_id` VARCHAR(64) NOT NULL COMMENT '频道ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '发布者ID',
  `title` VARCHAR(200) NOT NULL COMMENT '视频标题',
  `description` TEXT COMMENT '视频描述',
  `video_url` VARCHAR(500) NOT NULL COMMENT '视频URL',
  `cover_url` VARCHAR(500) COMMENT '封面URL',
  `duration` INT UNSIGNED COMMENT '视频时长(秒)',
  `file_size` BIGINT UNSIGNED COMMENT '文件大小(字节)',
  `width` INT UNSIGNED COMMENT '视频宽度',
  `height` INT UNSIGNED COMMENT '视频高度',
  `format` VARCHAR(20) COMMENT '视频格式',
  `quality` ENUM('240p', '360p', '480p', '720p', '1080p', '4k') COMMENT '视频质量',
  `view_count` BIGINT UNSIGNED DEFAULT 0 COMMENT '观看次数',
  `like_count` INT UNSIGNED DEFAULT 0 COMMENT '点赞次数',
  `dislike_count` INT UNSIGNED DEFAULT 0 COMMENT '踩数',
  `comment_count` INT UNSIGNED DEFAULT 0 COMMENT '评论次数',
  `share_count` INT UNSIGNED DEFAULT 0 COMMENT '分享次数',
  `collect_count` INT UNSIGNED DEFAULT 0 COMMENT '收藏次数',
  `tags` JSON COMMENT '标签列表',
  `visibility` ENUM('public', 'unlisted', 'private') DEFAULT 'public' COMMENT '可见性',
  `status` ENUM('uploading', 'processing', 'published', 'deleted') DEFAULT 'uploading' COMMENT '状态',
  `is_monetized` BOOLEAN DEFAULT FALSE COMMENT '是否开启收益',
  `published_at` TIMESTAMP NULL COMMENT '发布时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_video_id` (`video_id`),
  KEY `idx_channel_id` (`channel_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_visibility` (`visibility`),
  KEY `idx_published_at` (`published_at`),
  KEY `idx_view_count` (`view_count`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频表';

-- 视频点赞表
DROP TABLE IF EXISTS `video_likes`;
CREATE TABLE `video_likes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '点赞ID',
  `video_id` VARCHAR(64) NOT NULL COMMENT '视频ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `type` ENUM('like', 'dislike') NOT NULL COMMENT '类型',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_video_user` (`video_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频点赞表';

-- 视频评论表
DROP TABLE IF EXISTS `video_comments`;
CREATE TABLE `video_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `comment_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '评论唯一标识',
  `video_id` VARCHAR(64) NOT NULL COMMENT '视频ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `parent_id` BIGINT UNSIGNED COMMENT '父评论ID',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `like_count` INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
  `reply_count` INT UNSIGNED DEFAULT 0 COMMENT '回复数',
  `is_pinned` BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  `is_deleted` BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comment_id` (`comment_id`),
  KEY `idx_video_id` (`video_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频评论表';

-- 视频订阅表
DROP TABLE IF EXISTS `video_subscriptions`;
CREATE TABLE `video_subscriptions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订阅ID',
  `channel_id` VARCHAR(64) NOT NULL COMMENT '频道ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `notification_enabled` BOOLEAN DEFAULT TRUE COMMENT '是否开启通知',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_user` (`channel_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频订阅表';

-- =====================================================
-- 9. 钱包支付相关表
-- =====================================================

-- 用户钱包表
DROP TABLE IF EXISTS `user_wallets`;
CREATE TABLE `user_wallets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `balance` DECIMAL(15,2) DEFAULT 0.00 COMMENT '余额',
  `frozen_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT '冻结金额',
  `total_income` DECIMAL(15,2) DEFAULT 0.00 COMMENT '总收入',
  `total_expense` DECIMAL(15,2) DEFAULT 0.00 COMMENT '总支出',
  `beans_balance` INT UNSIGNED DEFAULT 0 COMMENT '叶语豆余额',
  `payment_password` VARCHAR(255) COMMENT '支付密码',
  `is_locked` BOOLEAN DEFAULT FALSE COMMENT '是否锁定',
  `status` ENUM('active', 'frozen', 'closed') DEFAULT 'active' COMMENT '钱包状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户钱包表';

-- 钱包交易记录表
DROP TABLE IF EXISTS `wallet_transactions`;
CREATE TABLE `wallet_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '交易ID',
  `transaction_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '交易唯一标识',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `type` ENUM('income', 'expense', 'transfer_in', 'transfer_out', 'red_packet_in', 'red_packet_out', 'recharge', 'withdraw') NOT NULL COMMENT '交易类型',
  `amount` DECIMAL(15,2) NOT NULL COMMENT '交易金额',
  `currency` ENUM('CNY', 'BEANS') DEFAULT 'CNY' COMMENT '货币类型',
  `balance_before` DECIMAL(15,2) NOT NULL COMMENT '交易前余额',
  `balance_after` DECIMAL(15,2) NOT NULL COMMENT '交易后余额',
  `description` VARCHAR(200) COMMENT '交易描述',
  `related_user_id` BIGINT UNSIGNED COMMENT '关联用户ID',
  `related_order_id` VARCHAR(64) COMMENT '关联订单ID',
  `status` ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '交易状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_transaction_id` (`transaction_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_related_user_id` (`related_user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包交易记录表';

-- 红包记录表
DROP TABLE IF EXISTS `red_packet_records`;
CREATE TABLE `red_packet_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `red_packet_id` BIGINT UNSIGNED NOT NULL COMMENT '红包ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '领取用户ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '领取金额',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_packet_user` (`red_packet_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`red_packet_id`) REFERENCES `red_packets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='红包记录表';

-- =====================================================
-- 10. 媒体文件管理表
-- =====================================================

-- 媒体文件表
DROP TABLE IF EXISTS `media_files`;
CREATE TABLE `media_files` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `file_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '文件唯一标识',
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
  `download_count` INT UNSIGNED DEFAULT 0 COMMENT '下载次数',
  `status` ENUM('uploading', 'processing', 'completed', 'failed', 'deleted') DEFAULT 'uploading' COMMENT '状态',
  `is_public` BOOLEAN DEFAULT FALSE COMMENT '是否公开',
  `expires_at` TIMESTAMP NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_file_id` (`file_id`),
  KEY `idx_uploader_id` (`uploader_id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_hash` (`hash`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒体文件表';

-- 文件缩略图表
DROP TABLE IF EXISTS `media_thumbnails`;
CREATE TABLE `media_thumbnails` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '缩略图ID',
  `file_id` VARCHAR(64) NOT NULL COMMENT '文件ID',
  `size` ENUM('small', 'medium', 'large') NOT NULL COMMENT '尺寸',
  `width` INT UNSIGNED NOT NULL COMMENT '宽度',
  `height` INT UNSIGNED NOT NULL COMMENT '高度',
  `file_path` VARCHAR(500) NOT NULL COMMENT '缩略图路径',
  `file_size` INT UNSIGNED NOT NULL COMMENT '文件大小',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_file_size` (`file_id`, `size`),
  KEY `idx_file_id` (`file_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件缩略图表';

-- =====================================================
-- 11. 通话相关表
-- =====================================================

-- 通话记录表
DROP TABLE IF EXISTS `call_records`;
CREATE TABLE `call_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '通话ID',
  `call_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '通话唯一标识',
  `caller_id` BIGINT UNSIGNED NOT NULL COMMENT '主叫用户ID',
  `callee_id` BIGINT UNSIGNED NOT NULL COMMENT '被叫用户ID',
  `conversation_id` VARCHAR(64) COMMENT '会话ID',
  `type` ENUM('voice', 'video') NOT NULL COMMENT '通话类型',
  `status` ENUM('calling', 'connected', 'ended', 'cancelled', 'rejected', 'timeout') NOT NULL COMMENT '通话状态',
  `start_time` TIMESTAMP NULL COMMENT '开始时间',
  `end_time` TIMESTAMP NULL COMMENT '结束时间',
  `duration` INT UNSIGNED DEFAULT 0 COMMENT '通话时长(秒)',
  `quality_rating` TINYINT UNSIGNED COMMENT '通话质量评分(1-5)',
  `end_reason` ENUM('normal', 'caller_hangup', 'callee_hangup', 'network_error', 'timeout') COMMENT '结束原因',
  `recording_url` VARCHAR(500) COMMENT '录音文件URL',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_call_id` (`call_id`),
  KEY `idx_caller_id` (`caller_id`),
  KEY `idx_callee_id` (`callee_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`start_time`),
  FOREIGN KEY (`caller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`callee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话记录表';

-- 通话参与者表
DROP TABLE IF EXISTS `call_participants`;
CREATE TABLE `call_participants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '参与者ID',
  `call_id` VARCHAR(64) NOT NULL COMMENT '通话ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` ENUM('caller', 'callee', 'participant') NOT NULL COMMENT '角色',
  `join_time` TIMESTAMP NULL COMMENT '加入时间',
  `leave_time` TIMESTAMP NULL COMMENT '离开时间',
  `duration` INT UNSIGNED DEFAULT 0 COMMENT '参与时长(秒)',
  `is_muted` BOOLEAN DEFAULT FALSE COMMENT '是否静音',
  `is_video_enabled` BOOLEAN DEFAULT TRUE COMMENT '是否开启视频',
  `network_quality` ENUM('excellent', 'good', 'fair', 'poor') COMMENT '网络质量',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_call_user` (`call_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话参与者表';

-- =====================================================
-- 12. AI功能相关表
-- =====================================================

-- AI对话记录表
DROP TABLE IF EXISTS `ai_conversations`;
CREATE TABLE `ai_conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '对话ID',
  `conversation_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '对话唯一标识',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `title` VARCHAR(200) NOT NULL COMMENT '对话标题',
  `description` TEXT COMMENT '对话描述',
  `model` VARCHAR(50) NOT NULL COMMENT 'AI模型',
  `system_prompt` TEXT COMMENT '系统提示词',
  `message_count` INT UNSIGNED DEFAULT 0 COMMENT '消息数量',
  `token_usage` INT UNSIGNED DEFAULT 0 COMMENT 'Token使用量',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  `settings` JSON COMMENT '对话设置',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_id` (`conversation_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_model` (`model`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话记录表';

-- AI消息表
DROP TABLE IF EXISTS `ai_messages`;
CREATE TABLE `ai_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `message_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '消息唯一标识',
  `conversation_id` VARCHAR(64) NOT NULL COMMENT '对话ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `type` ENUM('user', 'assistant', 'system') NOT NULL COMMENT '消息类型',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `attachments` JSON COMMENT '附件信息',
  `metadata` JSON COMMENT '元数据',
  `token_count` INT UNSIGNED DEFAULT 0 COMMENT 'Token数量',
  `response_time` INT UNSIGNED COMMENT '响应时间(毫秒)',
  `status` ENUM('sending', 'sent', 'delivered', 'failed') DEFAULT 'sending' COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_id` (`message_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI消息表';

-- AI训练数据表
DROP TABLE IF EXISTS `ai_training_data`;
CREATE TABLE `ai_training_data` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '训练数据ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `genealogy_member_id` BIGINT UNSIGNED COMMENT '族谱成员ID',
  `data_type` ENUM('video', 'audio', 'image', 'text') NOT NULL COMMENT '数据类型',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
  `file_size` BIGINT UNSIGNED NOT NULL COMMENT '文件大小',
  `duration` INT UNSIGNED COMMENT '时长(秒)',
  `quality_score` DECIMAL(3,2) COMMENT '质量评分',
  `processing_status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT '处理状态',
  `features_extracted` JSON COMMENT '提取的特征',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_genealogy_member_id` (`genealogy_member_id`),
  KEY `idx_data_type` (`data_type`),
  KEY `idx_processing_status` (`processing_status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`genealogy_member_id`) REFERENCES `genealogy_members`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI训练数据表';

-- =====================================================
-- 13. 用户会话和设备管理表
-- =====================================================

-- 用户会话表
DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `session_id` VARCHAR(128) NOT NULL UNIQUE COMMENT '会话标识',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `device_id` VARCHAR(64) COMMENT '设备ID',
  `device_type` ENUM('web', 'ios', 'android', 'desktop') NOT NULL COMMENT '设备类型',
  `device_info` JSON COMMENT '设备信息',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IP地址',
  `user_agent` TEXT COMMENT '用户代理',
  `location` VARCHAR(100) COMMENT '登录位置',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活动时间',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_id` (`session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_device_id` (`device_id`),
  KEY `idx_device_type` (`device_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- 用户设备表
DROP TABLE IF EXISTS `user_devices`;
CREATE TABLE `user_devices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `device_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '设备唯一标识',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `device_name` VARCHAR(100) NOT NULL COMMENT '设备名称',
  `device_type` ENUM('web', 'ios', 'android', 'desktop') NOT NULL COMMENT '设备类型',
  `os_version` VARCHAR(50) COMMENT '操作系统版本',
  `app_version` VARCHAR(20) COMMENT '应用版本',
  `push_token` VARCHAR(255) COMMENT '推送令牌',
  `is_trusted` BOOLEAN DEFAULT FALSE COMMENT '是否受信任设备',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  `last_login` TIMESTAMP NULL COMMENT '最后登录时间',
  `last_ip` VARCHAR(45) COMMENT '最后登录IP',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_device_id` (`device_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_device_type` (`device_type`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设备表';

-- =====================================================
-- 14. 消息扩展功能表
-- =====================================================

-- 消息已读状态表
DROP TABLE IF EXISTS `message_read_status`;
CREATE TABLE `message_read_status` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '状态ID',
  `message_id` VARCHAR(64) NOT NULL COMMENT '消息ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '已读时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_user` (`message_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_read_at` (`read_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息已读状态表';

-- 消息反应表
DROP TABLE IF EXISTS `message_reactions`;
CREATE TABLE `message_reactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '反应ID',
  `message_id` VARCHAR(64) NOT NULL COMMENT '消息ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `reaction` VARCHAR(20) NOT NULL COMMENT '反应类型',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_message_user_reaction` (`message_id`, `user_id`, `reaction`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_reaction` (`reaction`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息反应表';

-- =====================================================
-- 15. 群组扩展功能表
-- =====================================================

-- 群组公告表
DROP TABLE IF EXISTS `group_announcements`;
CREATE TABLE `group_announcements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `conversation_id` VARCHAR(64) NOT NULL COMMENT '群组ID',
  `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '创建者ID',
  `title` VARCHAR(200) NOT NULL COMMENT '公告标题',
  `content` TEXT NOT NULL COMMENT '公告内容',
  `is_pinned` BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否有效',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_is_pinned` (`is_pinned`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组公告表';

-- 群组邀请表
DROP TABLE IF EXISTS `group_invitations`;
CREATE TABLE `group_invitations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '邀请ID',
  `conversation_id` VARCHAR(64) NOT NULL COMMENT '群组ID',
  `inviter_id` BIGINT UNSIGNED NOT NULL COMMENT '邀请者ID',
  `invitee_id` BIGINT UNSIGNED NOT NULL COMMENT '被邀请者ID',
  `message` VARCHAR(200) COMMENT '邀请消息',
  `status` ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending' COMMENT '状态',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `processed_at` TIMESTAMP NULL COMMENT '处理时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_invitee` (`conversation_id`, `invitee_id`),
  KEY `idx_inviter_id` (`inviter_id`),
  KEY `idx_invitee_id` (`invitee_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`invitee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组邀请表';

-- 群组设置表
DROP TABLE IF EXISTS `group_settings`;
CREATE TABLE `group_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `conversation_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '群组ID',
  `allow_member_invite` BOOLEAN DEFAULT TRUE COMMENT '允许成员邀请',
  `allow_member_modify_info` BOOLEAN DEFAULT FALSE COMMENT '允许成员修改群信息',
  `message_approval_required` BOOLEAN DEFAULT FALSE COMMENT '消息需要审核',
  `join_approval_required` BOOLEAN DEFAULT FALSE COMMENT '加群需要审核',
  `max_members` INT UNSIGNED DEFAULT 500 COMMENT '最大成员数',
  `mute_all` BOOLEAN DEFAULT FALSE COMMENT '全员禁言',
  `welcome_message` TEXT COMMENT '欢迎消息',
  `group_rules` TEXT COMMENT '群规',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_id` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组设置表';

-- =====================================================
-- 16. 黑名单和收藏功能表
-- =====================================================

-- 黑名单表
DROP TABLE IF EXISTS `blacklist`;
CREATE TABLE `blacklist` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '黑名单ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `blocked_user_id` BIGINT UNSIGNED NOT NULL COMMENT '被拉黑用户ID',
  `reason` VARCHAR(200) COMMENT '拉黑原因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_blocked` (`user_id`, `blocked_user_id`),
  KEY `idx_blocked_user_id` (`blocked_user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`blocked_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='黑名单表';

-- 收藏表
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `item_type` ENUM('message', 'video', 'moment', 'file', 'link') NOT NULL COMMENT '收藏类型',
  `item_id` VARCHAR(64) NOT NULL COMMENT '收藏项目ID',
  `title` VARCHAR(200) COMMENT '收藏标题',
  `description` TEXT COMMENT '收藏描述',
  `thumbnail` VARCHAR(500) COMMENT '缩略图',
  `tags` JSON COMMENT '标签',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_item` (`user_id`, `item_type`, `item_id`),
  KEY `idx_item_type` (`item_type`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- =====================================================
-- 17. 系统管理和日志表
-- =====================================================

-- 系统日志表
DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `log_id` VARCHAR(64) NOT NULL UNIQUE COMMENT '日志唯一标识',
  `level` ENUM('debug', 'info', 'warn', 'error', 'fatal') NOT NULL COMMENT '日志级别',
  `category` VARCHAR(50) NOT NULL COMMENT '日志分类',
  `message` TEXT NOT NULL COMMENT '日志消息',
  `context` JSON COMMENT '上下文信息',
  `user_id` BIGINT UNSIGNED COMMENT '相关用户ID',
  `ip_address` VARCHAR(45) COMMENT 'IP地址',
  `user_agent` TEXT COMMENT '用户代理',
  `request_id` VARCHAR(64) COMMENT '请求ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_log_id` (`log_id`),
  KEY `idx_level` (`level`),
  KEY `idx_category` (`category`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_request_id` (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- 操作审计表
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审计ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '操作用户ID',
  `action` VARCHAR(100) NOT NULL COMMENT '操作动作',
  `resource_type` VARCHAR(50) NOT NULL COMMENT '资源类型',
  `resource_id` VARCHAR(64) COMMENT '资源ID',
  `old_values` JSON COMMENT '修改前的值',
  `new_values` JSON COMMENT '修改后的值',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IP地址',
  `user_agent` TEXT COMMENT '用户代理',
  `result` ENUM('success', 'failure') NOT NULL COMMENT '操作结果',
  `error_message` TEXT COMMENT '错误信息',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_resource_type` (`resource_type`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_result` (`result`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作审计表';

-- 性能监控表
DROP TABLE IF EXISTS `performance_metrics`;
CREATE TABLE `performance_metrics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '指标ID',
  `metric_name` VARCHAR(100) NOT NULL COMMENT '指标名称',
  `metric_value` DECIMAL(15,6) NOT NULL COMMENT '指标值',
  `metric_unit` VARCHAR(20) COMMENT '指标单位',
  `tags` JSON COMMENT '标签',
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '时间戳',

  PRIMARY KEY (`id`),
  KEY `idx_metric_name` (`metric_name`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='性能监控表';

-- 系统配置表
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  `config_value` TEXT NOT NULL COMMENT '配置值',
  `config_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '配置类型',
  `description` VARCHAR(200) COMMENT '配置描述',
  `is_public` BOOLEAN DEFAULT FALSE COMMENT '是否公开',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`),
  KEY `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- =====================================================
-- 18. 数据统计和分析表
-- =====================================================

-- 用户统计表
DROP TABLE IF EXISTS `user_statistics`;
CREATE TABLE `user_statistics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `date` DATE NOT NULL COMMENT '统计日期',
  `messages_sent` INT UNSIGNED DEFAULT 0 COMMENT '发送消息数',
  `messages_received` INT UNSIGNED DEFAULT 0 COMMENT '接收消息数',
  `login_count` INT UNSIGNED DEFAULT 0 COMMENT '登录次数',
  `online_duration` INT UNSIGNED DEFAULT 0 COMMENT '在线时长(分钟)',
  `videos_watched` INT UNSIGNED DEFAULT 0 COMMENT '观看视频数',
  `videos_liked` INT UNSIGNED DEFAULT 0 COMMENT '点赞视频数',
  `moments_posted` INT UNSIGNED DEFAULT 0 COMMENT '发布朋友圈数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `date`),
  KEY `idx_date` (`date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户统计表';

-- 系统统计表
DROP TABLE IF EXISTS `system_statistics`;
CREATE TABLE `system_statistics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `date` DATE NOT NULL UNIQUE COMMENT '统计日期',
  `total_users` INT UNSIGNED DEFAULT 0 COMMENT '总用户数',
  `active_users` INT UNSIGNED DEFAULT 0 COMMENT '活跃用户数',
  `new_users` INT UNSIGNED DEFAULT 0 COMMENT '新增用户数',
  `total_messages` BIGINT UNSIGNED DEFAULT 0 COMMENT '总消息数',
  `total_conversations` INT UNSIGNED DEFAULT 0 COMMENT '总会话数',
  `total_videos` INT UNSIGNED DEFAULT 0 COMMENT '总视频数',
  `total_storage_used` BIGINT UNSIGNED DEFAULT 0 COMMENT '总存储使用量(字节)',
  `peak_concurrent_users` INT UNSIGNED DEFAULT 0 COMMENT '峰值并发用户数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统统计表';

-- =====================================================
-- 19. 创建视图和索引优化
-- =====================================================

-- 用户好友视图
CREATE OR REPLACE VIEW `user_friends_view` AS
SELECT
  f.user_id,
  f.friend_id,
  u.nickname as friend_nickname,
  u.avatar as friend_avatar,
  u.status as friend_status,
  f.remark,
  f.created_at as friendship_created
FROM friendships f
JOIN users u ON f.friend_id = u.id
WHERE f.status = 'accepted';

-- 会话列表视图
CREATE OR REPLACE VIEW `conversation_list_view` AS
SELECT
  c.id,
  c.conversation_id,
  c.type,
  c.name,
  c.avatar,
  c.last_message_time,
  cm.unread_count,
  cm.is_pinned,
  cm.is_muted,
  lm.content as last_message_content,
  lm.message_type as last_message_type,
  sender.nickname as last_sender_nickname
FROM conversations c
JOIN conversation_members cm ON c.conversation_id = cm.conversation_id
LEFT JOIN chat_messages lm ON c.last_message_id = lm.id
LEFT JOIN users sender ON lm.sender_id = sender.id
WHERE c.is_active = TRUE;

-- =====================================================
-- 20. 插入初始数据
-- =====================================================

-- 插入系统配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_type`, `description`, `is_public`) VALUES
('app_name', '叶语', 'string', '应用名称', TRUE),
('app_version', '1.0.0', 'string', '应用版本', TRUE),
('max_file_size', '104857600', 'number', '最大文件上传大小(字节)', FALSE),
('max_video_duration', '600', 'number', '最大视频时长(秒)', FALSE),
('enable_ai_features', 'true', 'boolean', '是否启用AI功能', FALSE),
('default_avatar_url', '/avatars/default.jpg', 'string', '默认头像URL', TRUE);

-- 重置外键检查
SET FOREIGN_KEY_CHECKS = 1;
