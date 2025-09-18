-- ================================
-- 叶语数据库简化版本
-- 去除冗余字段，保留核心功能
-- ================================

DROP DATABASE IF EXISTS leaftalk_enterprise;
CREATE DATABASE leaftalk_enterprise;
USE leaftalk_enterprise;

-- ================================
-- 1. 用户表（简化版）
-- ================================

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号（登录账号）',
  password VARCHAR(255) NOT NULL COMMENT '密码哈希',
  yeyu_id VARCHAR(20) UNIQUE NOT NULL COMMENT '叶语号（唯一标识）',
  nickname VARCHAR(100) NOT NULL COMMENT '昵称（显示名称）',
  avatar TEXT COMMENT '头像URL',
  real_name VARCHAR(50) COMMENT '真实姓名',
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  region VARCHAR(100) DEFAULT '中国大陆' COMMENT '地区',
  signature VARCHAR(200) COMMENT '个性签名',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否实名认证',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_phone (phone),
  INDEX idx_yeyu_id (yeyu_id)
) ENGINE=InnoDB COMMENT='用户表';

-- ================================
-- 2. 好友系统
-- ================================

CREATE TABLE friendships (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  friend_id BIGINT NOT NULL,
  remark VARCHAR(100) COMMENT '好友备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_friendship (user_id, friend_id),
  INDEX idx_user_id (user_id),
  INDEX idx_friend_id (friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='好友关系表';

CREATE TABLE friend_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  from_user_id BIGINT NOT NULL,
  to_user_id BIGINT NOT NULL,
  message VARCHAR(200) DEFAULT '',
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_from_user (from_user_id),
  INDEX idx_to_user (to_user_id),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='好友请求表';

-- ================================
-- 3. 聊天系统
-- ================================

CREATE TABLE chats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('private', 'group') DEFAULT 'private',
  name VARCHAR(200) COMMENT '群聊名称',
  creator_id BIGINT COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_creator_id (creator_id),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='聊天会话表';

CREATE TABLE chat_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_participant (chat_id, user_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='聊天参与者表';

CREATE TABLE messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  type ENUM('text', 'image', 'voice', 'video', 'file') DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_chat_id (chat_id),
  INDEX idx_sender_id (sender_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='消息表';

-- ================================
-- 4. 朋友圈系统
-- ================================

CREATE TABLE moments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  content TEXT,
  images JSON COMMENT '图片列表',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='朋友圈动态表';

CREATE TABLE moment_likes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  moment_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_like (moment_id, user_id),
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='朋友圈点赞表';

CREATE TABLE moment_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  moment_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='朋友圈评论表';

-- ================================
-- 5. 族谱系统
-- ================================

CREATE TABLE families (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '家族名称',
  surname VARCHAR(50) NOT NULL COMMENT '姓氏',
  creator_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='家族表';

CREATE TABLE family_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  family_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  generation INT NOT NULL COMMENT '世代',
  father_id BIGINT NULL,
  mother_id BIGINT NULL,
  spouse_id BIGINT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_family_user (family_id, user_id),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='家族成员表';

-- ================================
-- 6. 支付系统
-- ================================

CREATE TABLE user_wallets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_wallet (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='用户钱包表';

CREATE TABLE transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  from_user_id BIGINT NULL,
  to_user_id BIGINT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type ENUM('transfer', 'red_packet', 'recharge') NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  description VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='交易记录表';

-- ================================
-- 7. 通知系统
-- ================================

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type ENUM('system', 'friend_request', 'family', 'payment') NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='通知表';

-- ================================
-- 8. 测试数据
-- ================================

-- 插入测试用户（密码都是123456）
INSERT INTO users (phone, password, yeyu_id, nickname) VALUES
('13800138000', '$2b$10$N9qo8uLOickgx2ZMRZoMye.Ik.KzAWaC.l.1.1.1.1.1.1.1.1.1.1.1', 'YY00000001', '张三'),
('13800138001', '$2b$10$N9qo8uLOickgx2ZMRZoMye.Ik.KzAWaC.l.1.1.1.1.1.1.1.1.1.1.1', 'YY00000002', '李四'),
('13800138002', '$2b$10$N9qo8uLOickgx2ZMRZoMye.Ik.KzAWaC.l.1.1.1.1.1.1.1.1.1.1.1', 'YY00000003', '王五');

-- 创建好友关系
INSERT INTO friendships (user_id, friend_id) VALUES 
(1, 2), (2, 1),
(1, 3), (3, 1),
(2, 3), (3, 2);
