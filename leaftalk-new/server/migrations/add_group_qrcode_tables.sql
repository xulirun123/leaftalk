-- 群二维码表
CREATE TABLE IF NOT EXISTS `group_qrcodes` (
  `id` VARCHAR(100) PRIMARY KEY,
  `group_id` VARCHAR(100) NOT NULL,
  `qrcode_data` TEXT NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  INDEX `idx_group_id` (`group_id`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 进群申请表
CREATE TABLE IF NOT EXISTS `group_join_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `group_id` VARCHAR(100) NOT NULL,
  `user_id` INT NOT NULL,
  `message` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  INDEX `idx_group_id` (`group_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加群聊的 require_approval 字段（如果不存在）
ALTER TABLE `groups` 
ADD COLUMN IF NOT EXISTS `require_approval` TINYINT(1) DEFAULT 0 COMMENT '是否需要进群验证';

