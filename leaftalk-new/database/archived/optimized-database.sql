-- ================================
-- 叶语数据库优化版本
-- 精简字段，去除冗余，保留核心功能
-- ================================

DROP DATABASE IF EXISTS leaftalk_enterprise;
CREATE DATABASE leaftalk_enterprise;
USE leaftalk_enterprise;

-- ================================
-- 1. 核心用户表（精简版）
-- ================================

-- 用户表
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号（登录账号）',
  password VARCHAR(255) NOT NULL COMMENT '密码哈希',
  yeyu_id VARCHAR(20) UNIQUE NOT NULL COMMENT '叶语号（唯一标识）',
  nickname VARCHAR(100) NOT NULL COMMENT '昵称',
  avatar TEXT COMMENT '头像URL',
  real_name VARCHAR(50) COMMENT '真实姓名',
  id_card VARCHAR(18) COMMENT '身份证号',
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  birth_date DATE COMMENT '出生日期',
  region VARCHAR(100) DEFAULT '中国大陆' COMMENT '地区',
  signature VARCHAR(200) COMMENT '个性签名',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否实名认证',
  is_active BOOLEAN DEFAULT TRUE COMMENT '账号是否激活',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_phone (phone),
  INDEX idx_yeyu_id (yeyu_id),
  INDEX idx_real_name (real_name)
) ENGINE=InnoDB COMMENT='用户表';

-- ================================
-- 2. 好友系统（精简版）
-- ================================

-- 好友关系表
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

-- 好友请求表
CREATE TABLE friend_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  from_user_id BIGINT NOT NULL,
  to_user_id BIGINT NOT NULL,
  message VARCHAR(200) DEFAULT '' COMMENT '申请消息',
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  
  INDEX idx_from_user (from_user_id),
  INDEX idx_to_user (to_user_id),
  INDEX idx_status (status),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='好友请求表';

-- ================================
-- 3. 聊天系统（精简版）
-- ================================

-- 聊天会话表
CREATE TABLE chats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('private', 'group') DEFAULT 'private',
  name VARCHAR(200) COMMENT '群聊名称',
  avatar TEXT COMMENT '群聊头像',
  creator_id BIGINT COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_creator_id (creator_id),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='聊天会话表';

-- 聊天参与者表（群聊用）
CREATE TABLE chat_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_participant (chat_id, user_id),
  INDEX idx_chat_id (chat_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='聊天参与者表';

-- 消息表
CREATE TABLE messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  type ENUM('text', 'image', 'voice', 'video', 'file') DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_chat_id (chat_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='消息表';

-- ================================
-- 4. 朋友圈系统（精简版）
-- ================================

-- 朋友圈动态表
CREATE TABLE moments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  content TEXT COMMENT '动态内容',
  images JSON COMMENT '图片列表',
  location VARCHAR(200) COMMENT '位置信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='朋友圈动态表';

-- 朋友圈点赞表
CREATE TABLE moment_likes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  moment_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_like (moment_id, user_id),
  INDEX idx_moment_id (moment_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='朋友圈点赞表';

-- 朋友圈评论表
CREATE TABLE moment_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  moment_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_moment_id (moment_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='朋友圈评论表';

-- ================================
-- 5. 族谱系统（精简版）
-- ================================

-- 家族表
CREATE TABLE families (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '家族名称',
  surname VARCHAR(50) NOT NULL COMMENT '姓氏',
  description TEXT COMMENT '家族描述',
  creator_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_surname (surname),
  INDEX idx_creator_id (creator_id),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='家族表';

-- 家族成员表
CREATE TABLE family_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  family_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  generation INT NOT NULL COMMENT '世代',
  father_id BIGINT NULL COMMENT '父亲ID',
  mother_id BIGINT NULL COMMENT '母亲ID',
  spouse_id BIGINT NULL COMMENT '配偶ID',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_family_user (family_id, user_id),
  INDEX idx_family_id (family_id),
  INDEX idx_user_id (user_id),
  INDEX idx_generation (generation),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='家族成员表';

-- ================================
-- 6. 支付系统（精简版）
-- ================================

-- 用户钱包表
CREATE TABLE user_wallets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00 COMMENT '余额',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_wallet (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='用户钱包表';

-- 交易记录表
CREATE TABLE transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  from_user_id BIGINT NULL,
  to_user_id BIGINT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type ENUM('transfer', 'red_packet', 'recharge', 'withdraw') NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  description VARCHAR(500) COMMENT '交易描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_from_user_id (from_user_id),
  INDEX idx_to_user_id (to_user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='交易记录表';

-- ================================
-- 7. 通知系统（精简版）
-- ================================

-- 通知表
CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type ENUM('system', 'friend_request', 'family', 'payment', 'chat') NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='通知表';

-- ================================
-- 8. 初始化数据
-- ================================

-- 插入测试用户
INSERT INTO users (phone, password, yeyu_id, nickname, avatar) VALUES
('13800138000', '$2b$10$example.hash.here', 'YY00000001', '测试用户1', '/avatars/default1.jpg'),
('13800138001', '$2b$10$example.hash.here', 'YY00000002', '测试用户2', '/avatars/default2.jpg');

-- 创建好友关系
INSERT INTO friendships (user_id, friend_id) VALUES (1, 2), (2, 1);
