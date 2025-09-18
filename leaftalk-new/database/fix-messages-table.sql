-- 修复messages表的根本问题
-- 问题：id字段是INTEGER，但前端发送的是字符串ID

-- 1. 查看当前表结构
DESCRIBE messages;

-- 2. 备份现有数据
CREATE TABLE messages_backup AS SELECT * FROM messages;

-- 3. 删除现有的messages表
DROP TABLE IF EXISTS messages;

-- 4. 重新创建messages表，使用正确的字段类型
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent',
    INDEX idx_sender_receiver (sender_id, receiver_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. 如果有备份数据，可以选择性恢复（跳过自聊天消息）
-- INSERT INTO messages SELECT * FROM messages_backup WHERE sender_id != receiver_id;

-- 6. 验证表结构
DESCRIBE messages;

SELECT 'Messages表修复完成' as status;
