-- 创建聊天设置表（如果不存在）
-- 迁移文件: 003_create_chat_settings.sql
-- 创建时间: 2025-01-08
-- 描述: 支持置顶、静音、手动未读等聊天设置功能

CREATE TABLE IF NOT EXISTS chat_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL COMMENT '聊天ID',
  user_id INT NOT NULL COMMENT '用户ID',
  is_pinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
  is_muted TINYINT(1) DEFAULT 0 COMMENT '是否静音',
  manual_unread_count INT DEFAULT 0 COMMENT '手动设置的未读数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY unique_chat_user (chat_id, user_id),
  INDEX idx_chat_id (chat_id),
  INDEX idx_user_id (user_id),
  INDEX idx_pinned (is_pinned),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天设置表'
