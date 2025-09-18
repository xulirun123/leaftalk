-- 族谱数据库架构
-- 创建时间: 2025-08-03T19:13:16.379Z

-- 族谱表
CREATE TABLE IF NOT EXISTS genealogies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT '族谱名称',
  description TEXT COMMENT '族谱描述',
  family_name VARCHAR(100) NOT NULL COMMENT '家族姓氏',
  ancestor_name VARCHAR(100) COMMENT '始祖姓名',
  created_by INT NOT NULL COMMENT '创建者ID',
  members JSON COMMENT '成员ID列表',
  settings JSON COMMENT '族谱设置',
  status ENUM('active', 'inactive', 'archived') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_family_name (family_name),
  INDEX idx_created_by (created_by),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='族谱表';

-- 家族成员表
CREATE TABLE IF NOT EXISTS family_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  genealogy_id INT NOT NULL COMMENT '族谱ID',
  user_id INT COMMENT '关联用户ID',
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  gender ENUM('male', 'female') NOT NULL COMMENT '性别',
  birth_date DATE COMMENT '出生日期',
  death_date DATE COMMENT '去世日期',
  generation INT COMMENT '世代',
  parent_id INT COMMENT '父亲ID',
  spouse_id INT COMMENT '配偶ID',
  avatar VARCHAR(500) COMMENT '头像',
  biography TEXT COMMENT '生平简介',
  is_alive BOOLEAN DEFAULT TRUE COMMENT '是否在世',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (genealogy_id) REFERENCES genealogies(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES family_members(id) ON DELETE SET NULL,
  FOREIGN KEY (spouse_id) REFERENCES family_members(id) ON DELETE SET NULL,
  INDEX idx_genealogy_id (genealogy_id),
  INDEX idx_user_id (user_id),
  INDEX idx_generation (generation),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家族成员表';

-- 家族事件表
CREATE TABLE IF NOT EXISTS family_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  genealogy_id INT NOT NULL COMMENT '族谱ID',
  member_id INT COMMENT '相关成员ID',
  title VARCHAR(255) NOT NULL COMMENT '事件标题',
  description TEXT COMMENT '事件描述',
  event_date DATE COMMENT '事件日期',
  event_type ENUM('birth', 'death', 'marriage', 'achievement', 'other') DEFAULT 'other' COMMENT '事件类型',
  images JSON COMMENT '相关图片',
  created_by INT NOT NULL COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (genealogy_id) REFERENCES genealogies(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE SET NULL,
  INDEX idx_genealogy_id (genealogy_id),
  INDEX idx_member_id (member_id),
  INDEX idx_event_date (event_date),
  INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家族事件表';