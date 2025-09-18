-- 创建消息删除记录表（用户特定删除功能）
-- 迁移文件: 001_create_message_deletions.sql
-- 创建时间: 2025-01-08
-- 描述: 支持用户独立删除聊天记录，不影响其他用户

CREATE TABLE IF NOT EXISTS message_deletions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL COMMENT '消息ID',
  user_id INT NOT NULL COMMENT '删除操作的用户ID',
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
  deletion_type ENUM('user_delete', 'chat_clear', 'chat_leave') DEFAULT 'user_delete' COMMENT '删除类型',
  UNIQUE KEY unique_message_user (message_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_message_id (message_id),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_deletion_type (deletion_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户消息删除记录表'
