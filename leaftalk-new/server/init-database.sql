-- 叶语数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `leaftalk-new` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `leaftalk-new`;

-- ============================================
-- 用户相关表
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `yeyu_id` VARCHAR(20) UNIQUE NOT NULL COMMENT '叶语号',
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `phone` VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `id_card` VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
  `verification_status` ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' COMMENT '实名认证状态',
  `gender` ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  `region` VARCHAR(100) DEFAULT NULL COMMENT '地区',
  `signature` VARCHAR(200) DEFAULT NULL COMMENT '个性签名',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_yeyu_id` (`yeyu_id`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 账号绑定表（同一身份证可以认证多个账号）
CREATE TABLE IF NOT EXISTS `account_bindings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '绑定ID',
  `id_card` VARCHAR(18) NOT NULL COMMENT '身份证号',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `bound_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  INDEX `idx_id_card` (`id_card`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账号绑定表';

-- ============================================
-- 好友关系表
-- ============================================

-- 好友关系表
CREATE TABLE IF NOT EXISTS `friendships` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '关系ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `friend_id` INT NOT NULL COMMENT '好友ID',
  `status` ENUM('accepted', 'blocked') DEFAULT 'accepted' COMMENT '关系状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_user_friend` (`user_id`, `friend_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- 好友请求表
CREATE TABLE IF NOT EXISTS `friend_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '请求ID',
  `sender_id` INT NOT NULL COMMENT '发送者ID',
  `receiver_id` INT NOT NULL COMMENT '接收者ID',
  `message` VARCHAR(255) DEFAULT NULL COMMENT '验证消息',
  `status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' COMMENT '请求状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_receiver_status` (`receiver_id`, `status`),
  INDEX `idx_sender` (`sender_id`),
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友请求表';

-- 好友备注表
CREATE TABLE IF NOT EXISTS `friend_remarks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '备注ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `friend_id` INT NOT NULL COMMENT '好友ID',
  `remark` VARCHAR(100) DEFAULT NULL COMMENT '备注名',
  `tags` JSON DEFAULT NULL COMMENT '标签',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_user_friend` (`user_id`, `friend_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友备注表';

-- 好友权限表
CREATE TABLE IF NOT EXISTS `friend_permissions` (
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `friend_id` BIGINT NOT NULL COMMENT '好友ID',
  `can_view_moments` TINYINT(1) DEFAULT 1 COMMENT '是否可以查看朋友圈',
  `can_view_video_channel` TINYINT(1) DEFAULT 1 COMMENT '是否可以查看视频号',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`user_id`, `friend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友权限表';

-- 黑名单表
CREATE TABLE IF NOT EXISTS `user_blacklist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '黑名单ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `blocked_user_id` INT NOT NULL COMMENT '被拉黑的用户ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_user_blocked` (`user_id`, `blocked_user_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`blocked_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='黑名单表';

-- 星标好友表
CREATE TABLE IF NOT EXISTS `star_friends` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '星标ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `friend_id` INT NOT NULL COMMENT '好友ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_user_friend` (`user_id`, `friend_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='星标好友表';

-- ============================================
-- 消息表
-- ============================================

-- 消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(255) PRIMARY KEY COMMENT '消息ID',
  `sender_id` INT NOT NULL COMMENT '发送者ID',
  `receiver_id` INT NOT NULL COMMENT '接收者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `type` ENUM('text', 'image', 'voice', 'video', 'file', 'system', 'group_invite', 'contact', 'custom_emoji', 'link', 'location', 'announcement') DEFAULT 'text' COMMENT '消息类型',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_sender` (`sender_id`),
  INDEX `idx_receiver` (`receiver_id`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ============================================
-- 群聊相关表
-- ============================================

-- 群聊表
CREATE TABLE IF NOT EXISTS `groups` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT '群聊ID，格式：group_时间戳',
  `name` VARCHAR(100) NOT NULL COMMENT '群名称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '群头像URL',
  `owner_id` INT NOT NULL COMMENT '群主ID',
  `announcement` TEXT DEFAULT NULL COMMENT '群公告',
  `require_approval` TINYINT(1) DEFAULT 0 COMMENT '是否需要审核（0=不需要，1=需要）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_owner` (`owner_id`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群聊表';

-- 群成员表
CREATE TABLE IF NOT EXISTS `group_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
  `group_id` VARCHAR(50) NOT NULL COMMENT '群聊ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `role` ENUM('owner', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '群昵称',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
  INDEX `idx_group_id` (`group_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表';

-- 群二维码表
CREATE TABLE IF NOT EXISTS `group_qrcodes` (
  `id` VARCHAR(100) PRIMARY KEY COMMENT '二维码ID',
  `group_id` VARCHAR(50) NOT NULL COMMENT '群聊ID',
  `qr_code_url` VARCHAR(500) NOT NULL COMMENT '二维码图片URL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `expires_at` DATETIME DEFAULT NULL COMMENT '过期时间（NULL表示永久有效）',
  INDEX `idx_group_id` (`group_id`),
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群二维码表';

-- 群邀请链接表
CREATE TABLE IF NOT EXISTS `group_invite_links` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '邀请链接ID',
  `group_id` VARCHAR(50) NOT NULL COMMENT '群聊ID',
  `invite_code` VARCHAR(50) UNIQUE NOT NULL COMMENT '邀请码',
  `inviter_id` INT NOT NULL COMMENT '创建邀请链接的用户ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `expires_at` DATETIME DEFAULT NULL COMMENT '过期时间（NULL表示永久有效）',
  `max_uses` INT DEFAULT NULL COMMENT '最大使用次数（NULL表示不限次数）',
  `used_count` INT DEFAULT 0 COMMENT '已使用次数',
  INDEX `idx_group_id` (`group_id`),
  INDEX `idx_invite_code` (`invite_code`),
  INDEX `idx_inviter_id` (`inviter_id`),
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群邀请链接表';

-- 群加入申请表
CREATE TABLE IF NOT EXISTS `group_join_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '申请ID',
  `group_id` VARCHAR(50) NOT NULL COMMENT '群聊ID',
  `user_id` INT NOT NULL COMMENT '申请人ID',
  `message` VARCHAR(255) DEFAULT NULL COMMENT '申请消息',
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '申请状态',
  `inviter_id` INT DEFAULT NULL COMMENT '邀请人ID',
  `invite_code` VARCHAR(50) DEFAULT NULL COMMENT '邀请码',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_group_id` (`group_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_invite_code` (`invite_code`),
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群加入申请表';

-- ============================================
-- 朋友圈相关表
-- ============================================

-- 朋友圈动态表
CREATE TABLE IF NOT EXISTS `moments` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT '动态ID',
  `user_id` INT NOT NULL COMMENT '发布者ID',
  `content` TEXT DEFAULT NULL COMMENT '文字内容',
  `media` JSON DEFAULT NULL COMMENT '媒体文件（图片/视频）',
  `location` VARCHAR(200) DEFAULT NULL COMMENT '位置',
  `visibility` ENUM('public', 'private', 'partial') DEFAULT 'public' COMMENT '可见性',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈动态表';

-- 朋友圈评论表
CREATE TABLE IF NOT EXISTS `moment_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
  `moment_id` VARCHAR(50) NOT NULL COMMENT '动态ID',
  `user_id` INT NOT NULL COMMENT '评论者ID',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `reply_to_id` INT DEFAULT NULL COMMENT '回复的评论ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_moment_id` (`moment_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES `moment_comments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈评论表';

-- 朋友圈点赞表
CREATE TABLE IF NOT EXISTS `moment_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '点赞ID',
  `moment_id` VARCHAR(50) NOT NULL COMMENT '动态ID',
  `user_id` INT NOT NULL COMMENT '点赞者ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_moment_user` (`moment_id`, `user_id`),
  INDEX `idx_moment_id` (`moment_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈点赞表';

-- ============================================
-- 视频号相关表
-- ============================================

-- 视频号表
CREATE TABLE IF NOT EXISTS `video_channels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '视频号ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '视频号名称',
  `description` TEXT DEFAULT NULL COMMENT '简介',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频号表';

-- 视频表
CREATE TABLE IF NOT EXISTS `videos` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT '视频ID',
  `channel_id` INT NOT NULL COMMENT '视频号ID',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `description` TEXT DEFAULT NULL COMMENT '描述',
  `video_url` VARCHAR(500) NOT NULL COMMENT '视频URL',
  `cover_url` VARCHAR(500) DEFAULT NULL COMMENT '封面URL',
  `duration` INT DEFAULT 0 COMMENT '时长（秒）',
  `view_count` INT DEFAULT 0 COMMENT '观看次数',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `comment_count` INT DEFAULT 0 COMMENT '评论数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_channel_id` (`channel_id`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`channel_id`) REFERENCES `video_channels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频表';

-- ============================================
-- 钱包相关表
-- ============================================

-- 钱包表
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '钱包ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `balance` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '余额',
  `password` VARCHAR(255) DEFAULT NULL COMMENT '支付密码（加密）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包表';

-- 交易记录表
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT '交易ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `type` ENUM('red_packet', 'transfer', 'recharge', 'withdraw') NOT NULL COMMENT '交易类型',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '金额',
  `status` ENUM('pending', 'completed', 'refunded', 'expired') DEFAULT 'pending' COMMENT '状态',
  `related_user_id` INT DEFAULT NULL COMMENT '关联用户ID（收款人/发送人）',
  `message` VARCHAR(200) DEFAULT NULL COMMENT '留言',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `expires_at` DATETIME DEFAULT NULL COMMENT '过期时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- ============================================
-- 家谱相关表
-- ============================================

-- 家谱表
CREATE TABLE IF NOT EXISTS `genealogies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '家谱ID',
  `name` VARCHAR(100) NOT NULL COMMENT '家谱名称',
  `type` ENUM('main', 'branch') DEFAULT 'main' COMMENT '类型（主谱/支谱）',
  `patriarch_id` INT DEFAULT NULL COMMENT '族长ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_patriarch_id` (`patriarch_id`),
  FOREIGN KEY (`patriarch_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家谱表';

-- 家谱成员表
CREATE TABLE IF NOT EXISTS `genealogy_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '成员ID',
  `genealogy_id` INT NOT NULL COMMENT '家谱ID',
  `user_id` INT DEFAULT NULL COMMENT '用户ID（关联账号）',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `gender` ENUM('male', 'female') NOT NULL COMMENT '性别',
  `birth_date` DATE DEFAULT NULL COMMENT '出生日期',
  `death_date` DATE DEFAULT NULL COMMENT '去世日期',
  `generation` INT NOT NULL COMMENT '世代',
  `father_id` INT DEFAULT NULL COMMENT '父亲ID',
  `mother_id` INT DEFAULT NULL COMMENT '母亲ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_genealogy_id` (`genealogy_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_father_id` (`father_id`),
  INDEX `idx_mother_id` (`mother_id`),
  FOREIGN KEY (`genealogy_id`) REFERENCES `genealogies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`father_id`) REFERENCES `genealogy_members`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`mother_id`) REFERENCES `genealogy_members`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家谱成员表';

-- ============================================
-- 系统表
-- ============================================

-- 系统通知表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '通知ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `type` ENUM('system', 'friend_request', 'group_invite', 'moment_like', 'moment_comment', 'payment') NOT NULL COMMENT '通知类型',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `data` JSON DEFAULT NULL COMMENT '附加数据',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

-- 初始化完成
SELECT '✅ 数据库初始化完成！' AS message;

