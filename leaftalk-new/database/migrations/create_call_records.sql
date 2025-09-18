-- 通话记录表
CREATE TABLE IF NOT EXISTS call_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  call_id VARCHAR(100) NOT NULL UNIQUE COMMENT '通话唯一标识',
  caller_id INT NOT NULL COMMENT '主叫用户ID',
  callee_id INT NOT NULL COMMENT '被叫用户ID',
  call_type ENUM('voice', 'video') NOT NULL DEFAULT 'voice' COMMENT '通话类型',
  call_status ENUM('answered', 'missed', 'rejected', 'cancelled', 'failed') NOT NULL COMMENT '通话状态',
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通话开始时间',
  answer_time TIMESTAMP NULL COMMENT '接听时间',
  end_time TIMESTAMP NULL COMMENT '结束时间',
  duration INT DEFAULT 0 COMMENT '通话时长（秒）',
  end_reason ENUM('normal', 'timeout', 'network', 'busy', 'declined') DEFAULT 'normal' COMMENT '结束原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_caller_id (caller_id),
  INDEX idx_callee_id (callee_id),
  INDEX idx_start_time (start_time),
  INDEX idx_call_status (call_status),
  INDEX idx_caller_time (caller_id, start_time DESC),
  INDEX idx_callee_time (callee_id, start_time DESC),
  
  -- 外键约束
  FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (callee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话记录表';

-- 通话质量统计表（可选，用于分析通话质量）
CREATE TABLE IF NOT EXISTS call_quality_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  call_id VARCHAR(100) NOT NULL COMMENT '通话ID',
  user_id INT NOT NULL COMMENT '用户ID',
  audio_quality DECIMAL(3,2) DEFAULT 0.00 COMMENT '音频质量评分(0-5)',
  video_quality DECIMAL(3,2) DEFAULT 0.00 COMMENT '视频质量评分(0-5)',
  network_delay INT DEFAULT 0 COMMENT '网络延迟(ms)',
  packet_loss DECIMAL(5,2) DEFAULT 0.00 COMMENT '丢包率(%)',
  bandwidth_used INT DEFAULT 0 COMMENT '使用带宽(kbps)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_call_id (call_id),
  INDEX idx_user_id (user_id),
  
  -- 外键约束
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (call_id) REFERENCES call_records(call_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通话质量统计表';

-- 插入示例数据
INSERT INTO call_records (
  call_id, caller_id, callee_id, call_type, call_status, 
  start_time, answer_time, end_time, duration, end_reason
) VALUES 
-- 用户1和用户2之间的通话记录
('call_demo_001', 1, 2, 'voice', 'answered', 
 DATE_SUB(NOW(), INTERVAL 2 HOUR), 
 DATE_SUB(NOW(), INTERVAL 2 HOUR) + INTERVAL 3 SECOND,
 DATE_SUB(NOW(), INTERVAL 2 HOUR) + INTERVAL 125 SECOND,
 122, 'normal'),

('call_demo_002', 2, 1, 'video', 'missed', 
 DATE_SUB(NOW(), INTERVAL 4 HOUR), 
 NULL, 
 DATE_SUB(NOW(), INTERVAL 4 HOUR) + INTERVAL 30 SECOND,
 0, 'timeout'),

('call_demo_003', 1, 2, 'voice', 'answered', 
 DATE_SUB(NOW(), INTERVAL 1 DAY), 
 DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 SECOND,
 DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 45 SECOND,
 43, 'normal'),

('call_demo_004', 2, 1, 'video', 'rejected', 
 DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR, 
 NULL, 
 DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR + INTERVAL 8 SECOND,
 0, 'declined'),

('call_demo_005', 1, 2, 'voice', 'answered', 
 DATE_SUB(NOW(), INTERVAL 3 DAY), 
 DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 5 SECOND,
 DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 320 SECOND,
 315, 'normal');

-- 创建视图：用户通话记录视图
CREATE OR REPLACE VIEW user_call_records AS
SELECT 
  cr.id,
  cr.call_id,
  cr.caller_id,
  cr.callee_id,
  cr.call_type,
  cr.call_status,
  cr.start_time,
  cr.answer_time,
  cr.end_time,
  cr.duration,
  cr.end_reason,
  -- 主叫用户信息
  caller.nickname as caller_name,
  caller.avatar as caller_avatar,
  caller.phone as caller_phone,
  -- 被叫用户信息
  callee.nickname as callee_name,
  callee.avatar as callee_avatar,
  callee.phone as callee_phone
FROM call_records cr
LEFT JOIN users caller ON cr.caller_id = caller.id
LEFT JOIN users callee ON cr.callee_id = callee.id
ORDER BY cr.start_time DESC;

-- 创建存储过程：获取用户通话统计
DELIMITER //
CREATE PROCEDURE GetUserCallStats(IN user_id INT, IN days INT DEFAULT 30)
BEGIN
  SELECT 
    COUNT(*) as total_calls,
    SUM(CASE WHEN caller_id = user_id THEN 1 ELSE 0 END) as outgoing_calls,
    SUM(CASE WHEN callee_id = user_id THEN 1 ELSE 0 END) as incoming_calls,
    SUM(CASE WHEN call_status = 'answered' THEN 1 ELSE 0 END) as answered_calls,
    SUM(CASE WHEN call_status = 'missed' AND callee_id = user_id THEN 1 ELSE 0 END) as missed_calls,
    SUM(CASE WHEN call_status = 'rejected' THEN 1 ELSE 0 END) as rejected_calls,
    SUM(CASE WHEN call_type = 'voice' THEN 1 ELSE 0 END) as voice_calls,
    SUM(CASE WHEN call_type = 'video' THEN 1 ELSE 0 END) as video_calls,
    SUM(CASE WHEN call_status = 'answered' THEN duration ELSE 0 END) as total_duration,
    AVG(CASE WHEN call_status = 'answered' AND duration > 0 THEN duration ELSE NULL END) as avg_duration
  FROM call_records 
  WHERE (caller_id = user_id OR callee_id = user_id)
    AND start_time >= DATE_SUB(NOW(), INTERVAL days DAY);
END //
DELIMITER ;

-- 创建触发器：自动计算通话时长
DELIMITER //
CREATE TRIGGER calculate_call_duration 
BEFORE UPDATE ON call_records
FOR EACH ROW
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.answer_time IS NOT NULL THEN
    SET NEW.duration = TIMESTAMPDIFF(SECOND, NEW.answer_time, NEW.end_time);
  END IF;
END //
DELIMITER ;
