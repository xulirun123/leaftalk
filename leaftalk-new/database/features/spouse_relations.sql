-- 配偶关系管理数据库表

-- 配偶关联申请表
CREATE TABLE IF NOT EXISTS spouse_requests (
  id VARCHAR(50) PRIMARY KEY,
  requester_id INT NOT NULL COMMENT '申请人用户ID',
  target_user_id INT NULL COMMENT '目标用户ID（如果已确定）',
  requester_name VARCHAR(100) NOT NULL COMMENT '申请人姓名',
  spouse_name VARCHAR(100) NOT NULL COMMENT '配偶姓名',
  verification_code VARCHAR(20) NOT NULL COMMENT '验证码',
  status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending' COMMENT '申请状态',
  selected_user_id INT NULL COMMENT '选中的用户ID',
  approved_at TIMESTAMP NULL COMMENT '批准时间',
  rejected_at TIMESTAMP NULL COMMENT '拒绝时间',
  rejection_reason TEXT COMMENT '拒绝原因',
  expires_at TIMESTAMP NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_requester_id (requester_id),
  INDEX idx_target_user_id (target_user_id),
  INDEX idx_status (status),
  INDEX idx_spouse_name (spouse_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关联申请表';

-- 配偶选择选项表
CREATE TABLE IF NOT EXISTS spouse_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL COMMENT '申请ID',
  user_id INT NOT NULL COMMENT '候选用户ID',
  address VARCHAR(200) COMMENT '用户地址',
  is_selected BOOLEAN DEFAULT FALSE COMMENT '是否被选中',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (request_id) REFERENCES spouse_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_request_user (request_id, user_id),
  INDEX idx_request_id (request_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶选择选项表';

-- 配偶关系表
CREATE TABLE IF NOT EXISTS spouse_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user1_id INT NOT NULL COMMENT '用户1 ID',
  user2_id INT NOT NULL COMMENT '用户2 ID',
  request_id VARCHAR(50) NULL COMMENT '关联的申请ID',
  status ENUM('active', 'removed', 'suspended') DEFAULT 'active' COMMENT '关系状态',
  marriage_date DATE NULL COMMENT '结婚日期',
  divorce_date DATE NULL COMMENT '离婚日期',
  relationship_type ENUM('married', 'divorced', 'widowed') DEFAULT 'married' COMMENT '关系类型',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '关系建立时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  removed_at TIMESTAMP NULL COMMENT '关系解除时间',
  removed_by INT NULL COMMENT '解除关系的用户ID',
  
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES spouse_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (removed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_spouse_relation (user1_id, user2_id),
  INDEX idx_user1_id (user1_id),
  INDEX idx_user2_id (user2_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关系表';

-- 配偶关系历史记录表
CREATE TABLE IF NOT EXISTS spouse_relation_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  relation_id INT NOT NULL COMMENT '关系ID',
  user1_id INT NOT NULL COMMENT '用户1 ID',
  user2_id INT NOT NULL COMMENT '用户2 ID',
  action ENUM('created', 'updated', 'removed', 'restored') NOT NULL COMMENT '操作类型',
  old_status VARCHAR(50) COMMENT '旧状态',
  new_status VARCHAR(50) COMMENT '新状态',
  operator_id INT NULL COMMENT '操作人ID',
  reason TEXT COMMENT '操作原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (relation_id) REFERENCES spouse_relations(id) ON DELETE CASCADE,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_relation_id (relation_id),
  INDEX idx_user1_id (user1_id),
  INDEX idx_user2_id (user2_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶关系历史记录表';

-- 配偶验证码表
CREATE TABLE IF NOT EXISTS spouse_verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  code VARCHAR(20) NOT NULL COMMENT '验证码',
  purpose ENUM('spouse_request', 'spouse_confirm', 'spouse_remove') NOT NULL COMMENT '用途',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  used_at TIMESTAMP NULL COMMENT '使用时间',
  is_used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_code (code),
  INDEX idx_purpose (purpose),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配偶验证码表';

-- 创建视图：配偶关系摘要
CREATE OR REPLACE VIEW spouse_relations_summary AS
SELECT 
  sr.id,
  sr.user1_id,
  sr.user2_id,
  u1.nickname as user1_name,
  u1.yeyu_id as user1_yeyu_id,
  u2.nickname as user2_name,
  u2.yeyu_id as user2_yeyu_id,
  sr.status,
  sr.relationship_type,
  sr.marriage_date,
  sr.divorce_date,
  sr.created_at,
  sr.updated_at,
  CASE 
    WHEN sr.status = 'active' THEN '正常'
    WHEN sr.status = 'removed' THEN '已解除'
    WHEN sr.status = 'suspended' THEN '暂停'
    ELSE '未知'
  END as status_text,
  CASE 
    WHEN sr.relationship_type = 'married' THEN '已婚'
    WHEN sr.relationship_type = 'divorced' THEN '离异'
    WHEN sr.relationship_type = 'widowed' THEN '丧偶'
    ELSE '未知'
  END as relationship_text
FROM spouse_relations sr
JOIN users u1 ON sr.user1_id = u1.id
JOIN users u2 ON sr.user2_id = u2.id;

-- 创建存储过程：获取用户的配偶信息
DELIMITER $$

CREATE PROCEDURE GetUserSpouses(
  IN p_user_id INT
)
BEGIN
  SELECT 
    sr.id as relation_id,
    CASE 
      WHEN sr.user1_id = p_user_id THEN sr.user2_id
      ELSE sr.user1_id
    END as spouse_id,
    CASE 
      WHEN sr.user1_id = p_user_id THEN u2.nickname
      ELSE u1.nickname
    END as spouse_name,
    CASE 
      WHEN sr.user1_id = p_user_id THEN u2.yeyu_id
      ELSE u1.yeyu_id
    END as spouse_yeyu_id,
    sr.status,
    sr.relationship_type,
    sr.marriage_date,
    sr.created_at
  FROM spouse_relations sr
  JOIN users u1 ON sr.user1_id = u1.id
  JOIN users u2 ON sr.user2_id = u2.id
  WHERE (sr.user1_id = p_user_id OR sr.user2_id = p_user_id)
    AND sr.status = 'active'
  ORDER BY sr.created_at DESC;
END$$

DELIMITER ;

-- 创建存储过程：检查配偶关系是否存在
DELIMITER $$

CREATE PROCEDURE CheckSpouseRelation(
  IN p_user1_id INT,
  IN p_user2_id INT,
  OUT p_exists BOOLEAN,
  OUT p_relation_id INT,
  OUT p_status VARCHAR(50)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  
  SELECT COUNT(*), MAX(id), MAX(status)
  INTO v_count, p_relation_id, p_status
  FROM spouse_relations 
  WHERE (user1_id = p_user1_id AND user2_id = p_user2_id)
     OR (user1_id = p_user2_id AND user2_id = p_user1_id);
  
  SET p_exists = (v_count > 0);
END$$

DELIMITER ;

-- 创建函数：获取用户的配偶数量
DELIMITER $$

CREATE FUNCTION GetSpouseCount(
  p_user_id INT
) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_count INT DEFAULT 0;
  
  SELECT COUNT(*)
  INTO v_count
  FROM spouse_relations 
  WHERE (user1_id = p_user_id OR user2_id = p_user_id)
    AND status = 'active';
  
  RETURN v_count;
END$$

DELIMITER ;

-- 创建触发器：配偶关系变更时记录历史
DELIMITER $$

CREATE TRIGGER spouse_relations_history_trigger
AFTER UPDATE ON spouse_relations
FOR EACH ROW
BEGIN
  INSERT INTO spouse_relation_history (
    relation_id, user1_id, user2_id, action, old_status, new_status, created_at
  ) VALUES (
    NEW.id, NEW.user1_id, NEW.user2_id, 'updated', OLD.status, NEW.status, NOW()
  );
END$$

DELIMITER ;

-- 插入示例数据（可选）
-- INSERT INTO spouse_requests (
--   id, requester_id, requester_name, spouse_name, verification_code, 
--   status, expires_at
-- ) VALUES (
--   'spouse_req_example', 1, '张三', '李四', '123456', 
--   'pending', DATE_ADD(NOW(), INTERVAL 7 DAY)
-- );

-- 创建索引优化查询性能
CREATE INDEX idx_spouse_requests_composite ON spouse_requests(status, spouse_name, created_at);
CREATE INDEX idx_spouse_relations_composite ON spouse_relations(status, user1_id, user2_id);
CREATE INDEX idx_spouse_options_composite ON spouse_options(request_id, user_id, is_selected);
