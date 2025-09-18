-- =====================================================
-- 叶语企业版完整数据库初始化脚本
-- LeafTalk Enterprise Complete Database Initialization
-- 版本: v1.0
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4
-- =====================================================

-- 统一使用企业版数据库
-- 保留原有数据库，只重建表结构
USE `leaftalk_enterprise`;

-- =====================================================
-- 1. 用户系统相关表
-- =====================================================

-- 用户基础信息表
CREATE TABLE `users` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    `yeyu_id` VARCHAR(20) UNIQUE NOT NULL COMMENT '叶语ID',
    `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码',
    `nickname` VARCHAR(50) COMMENT '昵称',
    `avatar` VARCHAR(500) COMMENT '头像URL',
    `phone` VARCHAR(20) UNIQUE COMMENT '手机号',
    `email` VARCHAR(100) COMMENT '邮箱',
    `gender` ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
    `birthday` DATE COMMENT '生日',
    `region` VARCHAR(100) COMMENT '地区',
    -- 实名认证相关字段
    `real_name` VARCHAR(50) COMMENT '真实姓名',
    `id_card` VARCHAR(18) COMMENT '身份证号',
    `is_verified` BOOLEAN DEFAULT FALSE COMMENT '是否实名认证',
    `verification_date` TIMESTAMP NULL COMMENT '认证时间',
    `signature` VARCHAR(200) COMMENT '个性签名',
    `status` ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '状态',
    `last_login_time` TIMESTAMP NULL COMMENT '最后登录时间',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX `idx_yeyu_id` (`yeyu_id`),
    INDEX `idx_username` (`username`),
    INDEX `idx_phone` (`phone`),
    INDEX `idx_status` (`status`)
) COMMENT '用户基础信息表';

-- 用户好友关系表
CREATE TABLE `user_friends` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关系ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `friend_id` BIGINT NOT NULL COMMENT '好友ID',
    `status` ENUM('pending', 'accepted', 'blocked', 'deleted') DEFAULT 'pending' COMMENT '关系状态',
    `remark_name` VARCHAR(50) COMMENT '备注名称',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY `unique_friendship` (`user_id`, `friend_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_friend_id` (`friend_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '用户好友关系表';

-- 好友请求表
CREATE TABLE `friend_requests` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '请求ID',
    `requester_id` BIGINT NOT NULL COMMENT '请求者ID',
    `receiver_id` BIGINT NOT NULL COMMENT '接收者ID',
    `message` TEXT COMMENT '请求消息',
    `status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' COMMENT '请求状态',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX `idx_requester_id` (`requester_id`),
    INDEX `idx_receiver_id` (`receiver_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '好友请求表';

-- =====================================================
-- 2. 聊天系统相关表
-- =====================================================

-- 聊天会话表
CREATE TABLE `chat_conversations` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
    `conversation_id` VARCHAR(50) UNIQUE NOT NULL COMMENT '会话唯一标识',
    `type` ENUM('private', 'group') DEFAULT 'private' COMMENT '会话类型',
    `name` VARCHAR(100) COMMENT '会话名称',
    `avatar` VARCHAR(500) COMMENT '会话头像',
    `description` TEXT COMMENT '会话描述',
    `created_by` BIGINT COMMENT '创建者ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX `idx_conversation_id` (`conversation_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_created_by` (`created_by`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) COMMENT '聊天会话表';

-- 聊天消息表
CREATE TABLE `chat_messages` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
    `message_id` VARCHAR(50) UNIQUE NOT NULL COMMENT '消息唯一标识',
    `conversation_id` VARCHAR(50) NOT NULL COMMENT '会话ID',
    `sender_id` BIGINT NOT NULL COMMENT '发送者ID',
    `content` TEXT NOT NULL COMMENT '消息内容',
    `type` ENUM('text', 'image', 'voice', 'video', 'file', 'system') DEFAULT 'text' COMMENT '消息类型',
    `status` ENUM('sending', 'sent', 'delivered', 'read') DEFAULT 'sending' COMMENT '消息状态',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX `idx_message_id` (`message_id`),
    INDEX `idx_conversation_id` (`conversation_id`),
    INDEX `idx_sender_id` (`sender_id`),
    INDEX `idx_created_at` (`created_at`),
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '聊天消息表';

-- =====================================================
-- 3. 朋友圈系统相关表
-- =====================================================

-- 朋友圈动态表
CREATE TABLE `moments` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '动态ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `content` TEXT COMMENT '动态内容',
    `images` JSON COMMENT '图片列表',
    `location` VARCHAR(200) COMMENT '位置信息',
    `privacy` ENUM('public', 'friends', 'private') DEFAULT 'friends' COMMENT '隐私设置',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_privacy` (`privacy`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '朋友圈动态表';

-- 朋友圈点赞表
CREATE TABLE `moment_likes` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '点赞ID',
    `moment_id` BIGINT NOT NULL COMMENT '动态ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY `unique_like` (`moment_id`, `user_id`),
    INDEX `idx_moment_id` (`moment_id`),
    INDEX `idx_user_id` (`user_id`),
    FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '朋友圈点赞表';

-- 朋友圈评论表
CREATE TABLE `moment_comments` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评论ID',
    `moment_id` BIGINT NOT NULL COMMENT '动态ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `content` TEXT NOT NULL COMMENT '评论内容',
    `reply_to` BIGINT COMMENT '回复的评论ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX `idx_moment_id` (`moment_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_reply_to` (`reply_to`),
    INDEX `idx_created_at` (`created_at`),
    FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reply_to`) REFERENCES `moment_comments`(`id`) ON DELETE CASCADE
) COMMENT '朋友圈评论表';

-- =====================================================
-- 4. 插入测试数据
-- =====================================================

-- 插入测试用户
INSERT INTO `users` (`id`, `yeyu_id`, `username`, `password`, `nickname`, `avatar`, `phone`) VALUES 
(1, 'YYJRCW9U2X', 'testuser', '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q', '叶语用户', 'https://api.dicebear.com/7.x/avataaars/svg?seed=YYJRCW9U2X', '13800138000'),
(2, '89FW2Z0BRN', '89FW2Z0BRN', '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q', '测试用户2', 'https://api.dicebear.com/7.x/avataaars/svg?seed=89FW2Z0BRN', '13800138001'),
(3, 'CD5V4Q3QVF', 'CD5V4Q3QVF', '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q', '测试用户3', 'https://api.dicebear.com/7.x/avataaars/svg?seed=CD5V4Q3QVF', '13800138002');

-- 插入测试好友关系
INSERT INTO `user_friends` (`user_id`, `friend_id`, `status`, `remark_name`) VALUES 
(1, 2, 'accepted', '好友2'),
(1, 3, 'accepted', '好友3'),
(2, 1, 'accepted', '测试用户'),
(3, 1, 'accepted', '测试用户');

-- =====================================================
-- 5. 创建索引优化
-- =====================================================

-- 为高频查询添加复合索引
ALTER TABLE `chat_messages` ADD INDEX `idx_conversation_sender` (`conversation_id`, `sender_id`);
ALTER TABLE `moments` ADD INDEX `idx_user_created` (`user_id`, `created_at`);

-- =====================================================
-- 完成
-- =====================================================

SELECT '✅ 叶语企业版数据库初始化完成！' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as friend_count FROM user_friends;
