-- 创建缺失的数据库表
--
-- ⚠️ 重要提示：这是MySQL语法文件
-- 如果你的IDE显示语法错误，请：
-- 1. 忽略这些错误（它们是因为IDE配置为SQL Server模式）
-- 2. 或者将IDE的SQL语言模式改为MySQL
-- 3. 这个文件在MySQL数据库中运行是正确的
--

-- 使用正确的数据库
USE `leaftalk-new`;

-- 创建好友关系表
CREATE TABLE IF NOT EXISTS `friendships` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `friend_id` INT NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    `remark_name` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_friendship` (`user_id`, `friend_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_friend_id` (`friend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建好友请求表
CREATE TABLE IF NOT EXISTS `friend_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `from_user_id` INT NOT NULL,
    `to_user_id` INT NOT NULL,
    `message` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_from_user` (`from_user_id`),
    INDEX `idx_to_user` (`to_user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 不再插入测试数据，保持数据库干净
-- INSERT IGNORE INTO friendships (user_id, friend_id, status, remark_name) VALUES
-- (1, 2, 'accepted', '好友1'),
-- (1, 3, 'accepted', '好友2'),
-- (2, 1, 'accepted', '测试用户'),
-- (3, 1, 'accepted', '测试用户');

-- 显示创建结果
SELECT 'Tables created successfully' as result;
SELECT COUNT(*) as friendship_count FROM friendships;
