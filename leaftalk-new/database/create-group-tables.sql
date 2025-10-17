-- 群聊表
CREATE TABLE IF NOT EXISTS `groups` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT '群聊ID，格式：group_时间戳',
  `name` VARCHAR(100) NOT NULL COMMENT '群聊名称（显示在聊天列表）',
  `title` VARCHAR(100) DEFAULT NULL COMMENT '群聊标题（显示在聊天页面顶部，如"群聊（3人）"）',
  `avatar` LONGTEXT DEFAULT NULL COMMENT '群聊头像（base64或URL）',
  `creator_id` INT NOT NULL COMMENT '创建者用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_creator` (`creator_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群聊表';

-- 群成员表
CREATE TABLE IF NOT EXISTS `group_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
  `group_id` VARCHAR(50) NOT NULL COMMENT '群聊ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `role` ENUM('creator', 'admin', 'member') DEFAULT 'member' COMMENT '角色：创建者、管理员、普通成员',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
  INDEX `idx_group_id` (`group_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表';

-- 群聊消息表（扩展现有的 messages 表以支持群聊）
-- 注意：我们不创建新表，而是修改现有的 messages 表
-- 如果 receiver_id 是 group_xxx 格式，则表示这是一条群聊消息

-- 为 messages 表添加索引以优化群聊消息查询
ALTER TABLE `messages` 
ADD INDEX IF NOT EXISTS `idx_receiver_created` (`receiver_id`, `created_at`);

