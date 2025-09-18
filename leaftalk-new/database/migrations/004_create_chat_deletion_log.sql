-- 创建聊天删除记录表
-- 迁移文件: 004_create_chat_deletion_log.sql
-- 创建时间: 2025-01-08
-- 描述: 记录聊天删除操作，用于审计

CREATE TABLE IF NOT EXISTS chat_deletion_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL COMMENT '聊天ID',
  user_id INT NOT NULL COMMENT '操作用户ID',
  operation_type ENUM('clear_history', 'delete_chat', 'leave_chat') NOT NULL COMMENT '操作类型',
  keep_messages TINYINT(1) DEFAULT 1 COMMENT '是否保留消息',
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
  reason VARCHAR(500) DEFAULT NULL COMMENT '删除原因',
  INDEX idx_chat_id (chat_id),
  INDEX idx_user_id (user_id),
  INDEX idx_operation_type (operation_type),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天删除记录表'
