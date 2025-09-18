-- ================================
-- 叶语数据库完整重构方案
-- 包含：用户系统、好友关系、聊天、朋友圈、族谱、直播、支付等
-- ================================

-- 删除所有现有表，重新开始
DROP DATABASE IF EXISTS leaftalk_enterprise;
CREATE DATABASE leaftalk_enterprise DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE leaftalk_enterprise;

-- ================================
-- 1. 用户核心表
-- ================================

-- 用户基础信息表
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码哈希',
  phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
  yeyu_id VARCHAR(20) UNIQUE NOT NULL COMMENT '叶语号',
  nickname VARCHAR(100) NOT NULL COMMENT '昵称',
  avatar LONGTEXT COMMENT '头像URL',
  real_name VARCHAR(50) COMMENT '真实姓名',
  id_card VARCHAR(18) COMMENT '身份证号',
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  birth_date DATE COMMENT '出生日期',
  region VARCHAR(100) DEFAULT '中国大陆' COMMENT '地区',
  signature VARCHAR(200) COMMENT '个性签名',
  email VARCHAR(100) COMMENT '邮箱',
  verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' COMMENT '实名认证状态',
  is_active BOOLEAN DEFAULT TRUE COMMENT '账号是否激活',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_phone (phone),
  INDEX idx_yeyu_id (yeyu_id),
  INDEX idx_real_name (real_name),
  INDEX idx_verification_status (verification_status)
) ENGINE=InnoDB COMMENT='用户基础信息表';

-- 用户隐私设置表
CREATE TABLE user_privacy_settings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  phone_searchable BOOLEAN DEFAULT TRUE COMMENT '手机号是否可被搜索',
  yeyu_id_searchable BOOLEAN DEFAULT TRUE COMMENT '叶语号是否可被搜索',
  need_verification BOOLEAN DEFAULT TRUE COMMENT '添加好友是否需要验证',
  show_real_name BOOLEAN DEFAULT TRUE COMMENT '是否显示真实姓名',
  show_phone BOOLEAN DEFAULT FALSE COMMENT '是否显示手机号',
  show_email BOOLEAN DEFAULT FALSE COMMENT '是否显示邮箱',
  show_region BOOLEAN DEFAULT TRUE COMMENT '是否显示地区',
  show_signature BOOLEAN DEFAULT TRUE COMMENT '是否显示个性签名',
  moments_visible_range ENUM('all', 'recent_3_days', 'recent_week', 'recent_month', 'half_year', 'none') DEFAULT 'recent_3_days' COMMENT '朋友圈可见范围',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_privacy (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='用户隐私设置表';

-- ================================
-- 2. 好友关系表
-- ================================

-- 好友关系表
CREATE TABLE friendships (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  friend_id BIGINT NOT NULL COMMENT '好友ID',
  status ENUM('accepted', 'blocked') DEFAULT 'accepted' COMMENT '关系状态',
  remark VARCHAR(100) COMMENT '好友备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_friendship (user_id, friend_id),
  INDEX idx_user_id (user_id),
  INDEX idx_friend_id (friend_id),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='好友关系表';

-- 好友请求表
CREATE TABLE friend_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  from_user_id BIGINT NOT NULL COMMENT '发送者ID',
  to_user_id BIGINT NOT NULL COMMENT '接收者ID',
  message VARCHAR(200) DEFAULT '' COMMENT '申请消息',
  source ENUM('search', 'qr_code', 'phone', 'recommendation') DEFAULT 'search' COMMENT '添加来源',
  status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending' COMMENT '请求状态',
  processed_at TIMESTAMP NULL COMMENT '处理时间',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_from_user (from_user_id),
  INDEX idx_to_user (to_user_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='好友请求表';

-- ================================
-- 3. 聊天系统表
-- ================================

-- 聊天会话表
CREATE TABLE chats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('private', 'group', 'system') NOT NULL DEFAULT 'private' COMMENT '聊天类型',
  name VARCHAR(200) COMMENT '聊天名称（群聊使用）',
  avatar TEXT COMMENT '聊天头像（群聊使用）',
  description TEXT COMMENT '聊天描述',
  creator_id BIGINT COMMENT '创建者ID',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_creator_id (creator_id),
  INDEX idx_updated_at (updated_at),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='聊天会话表';

-- 聊天参与者表
CREATE TABLE chat_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role ENUM('member', 'admin', 'owner') DEFAULT 'member' COMMENT '角色',
  nickname VARCHAR(100) COMMENT '群内昵称',
  is_muted BOOLEAN DEFAULT FALSE COMMENT '是否被禁言',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL COMMENT '离开时间',
  
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
  content TEXT NOT NULL COMMENT '消息内容',
  type ENUM('text', 'image', 'voice', 'video', 'file', 'location', 'card', 'system') DEFAULT 'text' COMMENT '消息类型',
  reply_to_id BIGINT NULL COMMENT '回复的消息ID',
  is_recalled BOOLEAN DEFAULT FALSE COMMENT '是否已撤回',
  recalled_at TIMESTAMP NULL COMMENT '撤回时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_chat_id (chat_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at),
  INDEX idx_reply_to_id (reply_to_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='消息表';

-- 消息已读状态表
CREATE TABLE message_read_status (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_read_status (message_id, user_id),
  INDEX idx_message_id (message_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='消息已读状态表';

-- ================================
-- 4. 朋友圈系统表
-- ================================

-- 朋友圈动态表
CREATE TABLE moments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  content TEXT COMMENT '动态内容',
  images JSON COMMENT '图片列表',
  videos JSON COMMENT '视频列表',
  location VARCHAR(200) COMMENT '位置信息',
  location_lat DECIMAL(10, 8) COMMENT '纬度',
  location_lng DECIMAL(11, 8) COMMENT '经度',
  visibility ENUM('public', 'friends', 'private', 'custom') DEFAULT 'friends' COMMENT '可见性',
  visible_to JSON COMMENT '自定义可见用户列表',
  allow_comment BOOLEAN DEFAULT TRUE COMMENT '允许评论',
  allow_like BOOLEAN DEFAULT TRUE COMMENT '允许点赞',
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_visibility (visibility),
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
  reply_to_id BIGINT NULL COMMENT '回复的评论ID',
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_moment_id (moment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_reply_to_id (reply_to_id),
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES moment_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='朋友圈评论表';

-- ================================
-- 5. 族谱系统表
-- ================================

-- 家族表
CREATE TABLE families (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '家族名称',
  surname VARCHAR(50) NOT NULL COMMENT '姓氏',
  origin_place VARCHAR(200) COMMENT '祖籍地',
  description TEXT COMMENT '家族描述',
  family_motto TEXT COMMENT '家训',
  coat_of_arms TEXT COMMENT '家徽图片URL',
  founder_id BIGINT COMMENT '创建者ID',
  patriarch_id BIGINT COMMENT '族长ID',
  is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
  member_count INT DEFAULT 0 COMMENT '成员数量',
  generation_count INT DEFAULT 0 COMMENT '世代数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_surname (surname),
  INDEX idx_founder_id (founder_id),
  INDEX idx_patriarch_id (patriarch_id),
  FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (patriarch_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='家族表';

-- 家族成员表
CREATE TABLE family_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  family_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  generation INT NOT NULL COMMENT '世代（1为第一代）',
  position_in_generation INT DEFAULT 1 COMMENT '同代中的排序',
  father_id BIGINT NULL COMMENT '父亲ID',
  mother_id BIGINT NULL COMMENT '母亲ID',
  spouse_ids JSON COMMENT '配偶ID列表（支持多偶制）',
  role ENUM('member', 'elder', 'patriarch', 'admin') DEFAULT 'member' COMMENT '角色',
  title VARCHAR(100) COMMENT '称谓/辈分',
  biography TEXT COMMENT '个人传记',
  achievements TEXT COMMENT '主要成就',
  memorial_text TEXT COMMENT '纪念文字',
  burial_place VARCHAR(200) COMMENT '安葬地点',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证身份',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_family_user (family_id, user_id),
  INDEX idx_family_id (family_id),
  INDEX idx_user_id (user_id),
  INDEX idx_generation (generation),
  INDEX idx_father_id (father_id),
  INDEX idx_mother_id (mother_id),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (father_id) REFERENCES family_members(id) ON DELETE SET NULL,
  FOREIGN KEY (mother_id) REFERENCES family_members(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='家族成员表';

-- 族谱权限表
CREATE TABLE family_permissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  family_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  permission_type ENUM('view', 'edit', 'admin', 'patriarch') NOT NULL,
  granted_by BIGINT NOT NULL COMMENT '授权人ID',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL COMMENT '过期时间',

  UNIQUE KEY unique_family_user_permission (family_id, user_id, permission_type),
  INDEX idx_family_id (family_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='族谱权限表';

-- 家族事件表
CREATE TABLE family_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  family_id BIGINT NOT NULL,
  event_type ENUM('birth', 'death', 'marriage', 'divorce', 'achievement', 'migration', 'other') NOT NULL,
  title VARCHAR(200) NOT NULL COMMENT '事件标题',
  description TEXT COMMENT '事件描述',
  event_date DATE COMMENT '事件日期',
  location VARCHAR(200) COMMENT '事件地点',
  related_members JSON COMMENT '相关成员ID列表',
  images JSON COMMENT '相关图片',
  documents JSON COMMENT '相关文档',
  created_by BIGINT NOT NULL COMMENT '创建者ID',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_family_id (family_id),
  INDEX idx_event_type (event_type),
  INDEX idx_event_date (event_date),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='家族事件表';

-- 电子墓碑表
CREATE TABLE digital_tombstones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '逝者用户ID',
  family_id BIGINT NOT NULL,
  tombstone_name VARCHAR(200) NOT NULL COMMENT '墓碑名称',
  epitaph TEXT COMMENT '墓志铭',
  life_story TEXT COMMENT '生平事迹',
  photos JSON COMMENT '生前照片',
  videos JSON COMMENT '生前视频',
  voice_recordings JSON COMMENT '语音记录',
  memorial_messages JSON COMMENT '纪念留言',
  virtual_offerings JSON COMMENT '虚拟供品记录',
  cemetery_location VARCHAR(200) COMMENT '墓地位置',
  cemetery_3d_model TEXT COMMENT '3D墓地模型URL',
  qr_code TEXT COMMENT '墓碑二维码',
  visit_count INT DEFAULT 0 COMMENT '访问次数',
  is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
  created_by BIGINT NOT NULL COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_tombstone (user_id),
  INDEX idx_family_id (family_id),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='电子墓碑表';

-- ================================
-- 6. 直播系统表
-- ================================

-- 直播频道表
CREATE TABLE live_channels (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '主播用户ID',
  title VARCHAR(200) NOT NULL COMMENT '直播标题',
  description TEXT COMMENT '直播描述',
  category ENUM('entertainment', 'education', 'family', 'memorial', 'other') DEFAULT 'entertainment' COMMENT '直播分类',
  cover_image TEXT COMMENT '封面图片',
  status ENUM('preparing', 'live', 'ended', 'banned') DEFAULT 'preparing' COMMENT '直播状态',
  viewer_count INT DEFAULT 0 COMMENT '观看人数',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  max_viewers INT DEFAULT 0 COMMENT '最高在线人数',
  stream_key VARCHAR(100) UNIQUE COMMENT '推流密钥',
  rtmp_url TEXT COMMENT 'RTMP推流地址',
  hls_url TEXT COMMENT 'HLS播放地址',
  is_private BOOLEAN DEFAULT FALSE COMMENT '是否私密直播',
  allowed_viewers JSON COMMENT '允许观看的用户ID列表',
  started_at TIMESTAMP NULL COMMENT '开始时间',
  ended_at TIMESTAMP NULL COMMENT '结束时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_started_at (started_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='直播频道表';

-- 直播观看记录表
CREATE TABLE live_viewers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  channel_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  watch_duration INT DEFAULT 0 COMMENT '观看时长（秒）',

  INDEX idx_channel_id (channel_id),
  INDEX idx_user_id (user_id),
  INDEX idx_joined_at (joined_at),
  FOREIGN KEY (channel_id) REFERENCES live_channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='直播观看记录表';

-- 直播弹幕表
CREATE TABLE live_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  channel_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL COMMENT '弹幕内容',
  type ENUM('text', 'gift', 'system') DEFAULT 'text' COMMENT '弹幕类型',
  gift_id BIGINT NULL COMMENT '礼物ID（如果是礼物弹幕）',
  gift_count INT DEFAULT 1 COMMENT '礼物数量',
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_channel_id (channel_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (channel_id) REFERENCES live_channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='直播弹幕表';

-- 直播礼物表
CREATE TABLE live_gifts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '礼物名称',
  icon TEXT NOT NULL COMMENT '礼物图标',
  animation TEXT COMMENT '礼物动画',
  price DECIMAL(10, 2) NOT NULL COMMENT '礼物价格',
  category ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common' COMMENT '礼物等级',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_category (category),
  INDEX idx_price (price)
) ENGINE=InnoDB COMMENT='直播礼物表';

-- ================================
-- 7. 支付系统表
-- ================================

-- 用户钱包表
CREATE TABLE user_wallets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00 COMMENT '余额',
  frozen_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '冻结金额',
  total_income DECIMAL(15, 2) DEFAULT 0.00 COMMENT '总收入',
  total_expense DECIMAL(15, 2) DEFAULT 0.00 COMMENT '总支出',
  payment_password VARCHAR(255) COMMENT '支付密码',
  is_locked BOOLEAN DEFAULT FALSE COMMENT '是否锁定',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_wallet (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='用户钱包表';

-- 交易记录表
CREATE TABLE transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  transaction_no VARCHAR(64) UNIQUE NOT NULL COMMENT '交易号',
  from_user_id BIGINT NULL COMMENT '付款用户ID',
  to_user_id BIGINT NULL COMMENT '收款用户ID',
  amount DECIMAL(15, 2) NOT NULL COMMENT '交易金额',
  type ENUM('transfer', 'red_packet', 'recharge', 'withdraw', 'gift', 'family_fund') NOT NULL COMMENT '交易类型',
  status ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending' COMMENT '交易状态',
  description VARCHAR(500) COMMENT '交易描述',
  remark VARCHAR(200) COMMENT '备注',
  expires_at TIMESTAMP NULL COMMENT '过期时间（红包等）',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_transaction_no (transaction_no),
  INDEX idx_from_user_id (from_user_id),
  INDEX idx_to_user_id (to_user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='交易记录表';

-- 红包表
CREATE TABLE red_packets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  transaction_id BIGINT NOT NULL COMMENT '关联交易ID',
  sender_id BIGINT NOT NULL COMMENT '发送者ID',
  chat_id BIGINT NULL COMMENT '聊天ID（群红包）',
  total_amount DECIMAL(15, 2) NOT NULL COMMENT '红包总金额',
  total_count INT NOT NULL COMMENT '红包总个数',
  remaining_amount DECIMAL(15, 2) NOT NULL COMMENT '剩余金额',
  remaining_count INT NOT NULL COMMENT '剩余个数',
  type ENUM('random', 'fixed', 'lucky') DEFAULT 'random' COMMENT '红包类型',
  message VARCHAR(200) DEFAULT '恭喜发财，大吉大利' COMMENT '红包祝福语',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  status ENUM('active', 'completed', 'expired', 'refunded') DEFAULT 'active' COMMENT '红包状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_transaction_id (transaction_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_chat_id (chat_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_status (status),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='红包表';

-- 红包领取记录表
CREATE TABLE red_packet_claims (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  red_packet_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL COMMENT '领取金额',
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_red_packet (red_packet_id, user_id),
  INDEX idx_red_packet_id (red_packet_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (red_packet_id) REFERENCES red_packets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='红包领取记录表';

-- 家族基金表
CREATE TABLE family_funds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  family_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL COMMENT '基金名称',
  description TEXT COMMENT '基金描述',
  target_amount DECIMAL(15, 2) COMMENT '目标金额',
  current_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT '当前金额',
  purpose ENUM('education', 'medical', 'emergency', 'celebration', 'memorial', 'other') NOT NULL COMMENT '基金用途',
  manager_id BIGINT NOT NULL COMMENT '管理员ID',
  status ENUM('active', 'completed', 'suspended', 'closed') DEFAULT 'active' COMMENT '基金状态',
  start_date DATE COMMENT '开始日期',
  end_date DATE COMMENT '结束日期',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_family_id (family_id),
  INDEX idx_manager_id (manager_id),
  INDEX idx_purpose (purpose),
  INDEX idx_status (status),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='家族基金表';

-- 基金捐赠记录表
CREATE TABLE fund_donations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  fund_id BIGINT NOT NULL,
  donor_id BIGINT NOT NULL COMMENT '捐赠者ID',
  amount DECIMAL(15, 2) NOT NULL COMMENT '捐赠金额',
  message VARCHAR(500) COMMENT '捐赠留言',
  is_anonymous BOOLEAN DEFAULT FALSE COMMENT '是否匿名',
  transaction_id BIGINT NOT NULL COMMENT '关联交易ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_fund_id (fund_id),
  INDEX idx_donor_id (donor_id),
  INDEX idx_transaction_id (transaction_id),
  FOREIGN KEY (fund_id) REFERENCES family_funds(id) ON DELETE CASCADE,
  FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='基金捐赠记录表';

-- ================================
-- 8. 通知系统表
-- ================================

-- 系统通知表
CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '接收者ID',
  type ENUM('system', 'friend_request', 'family_invite', 'payment', 'live', 'moment', 'chat') NOT NULL COMMENT '通知类型',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT NOT NULL COMMENT '通知内容',
  data JSON COMMENT '附加数据',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT '优先级',
  expires_at TIMESTAMP NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_priority (priority),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='系统通知表';

-- ================================
-- 9. 文件存储表
-- ================================

-- 文件表
CREATE TABLE files (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '上传者ID',
  filename VARCHAR(500) NOT NULL COMMENT '文件名',
  original_name VARCHAR(500) NOT NULL COMMENT '原始文件名',
  file_path TEXT NOT NULL COMMENT '文件路径',
  file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
  mime_type VARCHAR(200) NOT NULL COMMENT 'MIME类型',
  file_type ENUM('image', 'video', 'audio', 'document', 'other') NOT NULL COMMENT '文件类型',
  usage_type ENUM('avatar', 'moment', 'chat', 'family', 'live', 'tombstone', 'other') NOT NULL COMMENT '使用类型',
  is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
  download_count INT DEFAULT 0 COMMENT '下载次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_file_type (file_type),
  INDEX idx_usage_type (usage_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='文件表';

-- ================================
-- 10. 初始数据插入
-- ================================

-- 插入默认直播礼物
INSERT INTO live_gifts (name, icon, animation, price, category) VALUES
('小心心', '/icons/gifts/heart.png', '/animations/heart.json', 1.00, 'common'),
('玫瑰花', '/icons/gifts/rose.png', '/animations/rose.json', 5.00, 'common'),
('棒棒糖', '/icons/gifts/candy.png', '/animations/candy.json', 10.00, 'common'),
('巧克力', '/icons/gifts/chocolate.png', '/animations/chocolate.json', 20.00, 'rare'),
('钻石', '/icons/gifts/diamond.png', '/animations/diamond.json', 100.00, 'epic'),
('皇冠', '/icons/gifts/crown.png', '/animations/crown.json', 500.00, 'legendary');

-- ================================
-- 11. 创建视图
-- ================================

-- 用户完整信息视图
CREATE VIEW user_profiles AS
SELECT
  u.id,
  u.username,
  u.phone,
  u.yeyu_id,
  u.nickname,
  u.avatar,
  u.real_name,
  u.gender,
  u.birth_date,
  u.death_date,
  u.region,
  u.signature,
  u.email,
  u.verification_status,
  u.is_active,
  u.is_deceased,
  u.last_login_at,
  u.created_at,
  ups.phone_searchable,
  ups.yeyu_id_searchable,
  ups.need_verification,
  ups.show_real_name,
  ups.show_phone,
  ups.show_email,
  ups.show_region,
  ups.show_signature,
  ups.moments_visible_range
FROM users u
LEFT JOIN user_privacy_settings ups ON u.id = ups.user_id;

-- 好友关系视图
CREATE VIEW friend_relationships AS
SELECT
  f.id,
  f.user_id,
  f.friend_id,
  f.status,
  f.remark,
  f.created_at,
  u1.nickname AS user_nickname,
  u1.avatar AS user_avatar,
  u2.nickname AS friend_nickname,
  u2.avatar AS friend_avatar,
  u2.real_name AS friend_real_name,
  u2.region AS friend_region
FROM friendships f
JOIN users u1 ON f.user_id = u1.id
JOIN users u2 ON f.friend_id = u2.id
WHERE f.status = 'accepted';

-- 家族成员关系视图
CREATE VIEW family_tree AS
SELECT
  fm.id,
  fm.family_id,
  fm.user_id,
  fm.generation,
  fm.position_in_generation,
  fm.father_id,
  fm.mother_id,
  fm.spouse_ids,
  fm.role,
  fm.title,
  f.name AS family_name,
  f.surname,
  u.nickname,
  u.real_name,
  u.avatar,
  u.birth_date,
  u.death_date,
  u.is_deceased,
  father.real_name AS father_name,
  mother.real_name AS mother_name
FROM family_members fm
JOIN families f ON fm.family_id = f.id
JOIN users u ON fm.user_id = u.id
LEFT JOIN family_members father_fm ON fm.father_id = father_fm.id
LEFT JOIN users father ON father_fm.user_id = father.id
LEFT JOIN family_members mother_fm ON fm.mother_id = mother_fm.id
LEFT JOIN users mother ON mother_fm.user_id = mother.id;

-- ================================
-- 12. 创建存储过程
-- ================================

DELIMITER //

-- 创建好友关系的存储过程
CREATE PROCEDURE AddFriendship(
  IN p_user_id BIGINT,
  IN p_friend_id BIGINT,
  IN p_remark VARCHAR(100)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- 添加双向好友关系
  INSERT INTO friendships (user_id, friend_id, remark)
  VALUES (p_user_id, p_friend_id, p_remark);

  INSERT INTO friendships (user_id, friend_id, remark)
  VALUES (p_friend_id, p_user_id, '');

  COMMIT;
END //

-- 创建聊天会话的存储过程
CREATE PROCEDURE CreatePrivateChat(
  IN p_user1_id BIGINT,
  IN p_user2_id BIGINT,
  OUT p_chat_id BIGINT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- 创建聊天会话
  INSERT INTO chats (type, creator_id) VALUES ('private', p_user1_id);
  SET p_chat_id = LAST_INSERT_ID();

  -- 添加参与者
  INSERT INTO chat_participants (chat_id, user_id, role)
  VALUES (p_chat_id, p_user1_id, 'member');

  INSERT INTO chat_participants (chat_id, user_id, role)
  VALUES (p_chat_id, p_user2_id, 'member');

  COMMIT;
END //

DELIMITER ;

-- ================================
-- 13. 性能优化
-- ================================

-- 设置数据库参数
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL max_connections = 1000;
SET GLOBAL query_cache_size = 268435456; -- 256MB

-- 创建复合索引
CREATE INDEX idx_messages_chat_time ON messages(chat_id, created_at);
CREATE INDEX idx_moments_user_time ON moments(user_id, created_at);
CREATE INDEX idx_family_members_family_generation ON family_members(family_id, generation);
CREATE INDEX idx_transactions_user_type_time ON transactions(from_user_id, type, created_at);
CREATE INDEX idx_notifications_user_read_time ON notifications(user_id, is_read, created_at);

-- ================================
-- 数据库重构完成
-- ================================
