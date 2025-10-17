-- 叶语应用完整数据库初始化脚本
-- 包含用户系统、家谱系统、朋友圈、聊天、支付、AI祖先等所有功能模块

-- ==================== 用户系统相关表 ====================

-- 1. 用户基础信息表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    yeyu_id VARCHAR(20) UNIQUE NOT NULL COMMENT '叶语号',
    username VARCHAR(50) UNIQUE COMMENT '用户名',
    nickname VARCHAR(50) NOT NULL COMMENT '昵称',
    password VARCHAR(255) COMMENT '密码',
    avatar VARCHAR(500) COMMENT '头像URL',
    phone VARCHAR(20) UNIQUE COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    real_name VARCHAR(50) COMMENT '真实姓名',
    id_card VARCHAR(18) COMMENT '身份证号',
    gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
    birthday DATE COMMENT '生日',
    region VARCHAR(100) COMMENT '地区',
    signature TEXT COMMENT '个性签名',
    qr_code VARCHAR(500) COMMENT '二维码URL',
    verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' COMMENT '实名认证状态',
    account_status ENUM('active', 'suspended', 'deleted') DEFAULT 'active' COMMENT '账户状态',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_yeyu_id (yeyu_id),
    INDEX idx_real_name (real_name),
    INDEX idx_id_card (id_card)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 2. 用户扩展信息表
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    profession VARCHAR(100) COMMENT '职业',
    education VARCHAR(100) COMMENT '学历',
    company VARCHAR(200) COMMENT '公司',
    address TEXT COMMENT '详细地址',
    emergency_contact VARCHAR(50) COMMENT '紧急联系人',
    emergency_phone VARCHAR(20) COMMENT '紧急联系电话',
    blood_type ENUM('A', 'B', 'AB', 'O', 'unknown') DEFAULT 'unknown' COMMENT '血型',
    height INT COMMENT '身高(cm)',
    weight DECIMAL(5,2) COMMENT '体重(kg)',
    marital_status ENUM('single', 'married', 'divorced', 'widowed', 'unknown') DEFAULT 'unknown' COMMENT '婚姻状况',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户扩展信息表';

-- 3. 账户绑定表
CREATE TABLE IF NOT EXISTS account_bindings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    primary_user_id INT NOT NULL COMMENT '主账户ID',
    bound_user_id INT NOT NULL COMMENT '绑定账户ID',
    binding_type ENUM('id_card', 'family', 'manual') DEFAULT 'id_card' COMMENT '绑定类型',
    binding_reason TEXT COMMENT '绑定原因',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '绑定状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bound_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_binding (primary_user_id, bound_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户绑定关系表';

-- ==================== 好友系统相关表 ====================

-- 4. 好友关系表
CREATE TABLE IF NOT EXISTS friendships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    friend_id INT NOT NULL COMMENT '好友ID',
    status ENUM('pending', 'accepted', 'blocked', 'deleted') DEFAULT 'accepted' COMMENT '关系状态',
    remark VARCHAR(100) COMMENT '好友备注',
    tags VARCHAR(200) COMMENT '标签',
    group_id INT COMMENT '分组ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (user_id, friend_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- 5. 好友请求表
CREATE TABLE IF NOT EXISTS friend_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL COMMENT '发送者ID',
    to_user_id INT NOT NULL COMMENT '接收者ID',
    message TEXT COMMENT '请求消息',
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending' COMMENT '请求状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_to_user (to_user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友请求表';

-- 6. 好友分组表
CREATE TABLE IF NOT EXISTS friend_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(50) NOT NULL COMMENT '分组名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友分组表';

-- 7. 黑名单表
CREATE TABLE IF NOT EXISTS blacklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    blocked_user_id INT NOT NULL COMMENT '被拉黑用户ID',
    reason TEXT COMMENT '拉黑原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_block (user_id, blocked_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='黑名单表';

-- ==================== 聊天系统相关表 ====================

-- 8. 聊天会话表
CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('private', 'group') NOT NULL COMMENT '会话类型',
    name VARCHAR(100) COMMENT '群聊名称',
    avatar VARCHAR(500) COMMENT '群聊头像',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- 9. 会话成员表
CREATE TABLE IF NOT EXISTS conversation_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL COMMENT '会话ID',
    user_id INT NOT NULL COMMENT '用户ID',
    role ENUM('owner', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member (conversation_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话成员表';

-- 10. 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL COMMENT '会话ID',
    sender_id INT NOT NULL COMMENT '发送者ID',
    content TEXT COMMENT '消息内容',
    type ENUM('text', 'image', 'video', 'audio', 'file', 'location', 'system') DEFAULT 'text' COMMENT '消息类型',
    media_url VARCHAR(500) COMMENT '媒体文件URL',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ==================== 朋友圈系统相关表 ====================

-- 11. 朋友圈动态表
CREATE TABLE IF NOT EXISTS moments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    content TEXT COMMENT '动态内容',
    images JSON COMMENT '图片列表',
    videos JSON COMMENT '视频列表',
    location VARCHAR(200) COMMENT '位置',
    location_lat DECIMAL(10, 8) COMMENT '纬度',
    location_lng DECIMAL(11, 8) COMMENT '经度',
    visibility ENUM('public', 'friends', 'private') DEFAULT 'friends' COMMENT '可见性',
    allow_comment BOOLEAN DEFAULT TRUE COMMENT '允许评论',
    allow_like BOOLEAN DEFAULT TRUE COMMENT '允许点赞',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈动态表';

-- 12. 朋友圈点赞表
CREATE TABLE IF NOT EXISTS moment_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moment_id INT NOT NULL COMMENT '动态ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (moment_id, user_id),
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈点赞表';

-- 13. 朋友圈评论表
CREATE TABLE IF NOT EXISTS moment_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moment_id INT NOT NULL COMMENT '动态ID',
    user_id INT NOT NULL COMMENT '用户ID',
    reply_to_user_id INT COMMENT '回复的用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈评论表';

-- ==================== 家谱系统相关表 ====================

-- 14. 家谱表
CREATE TABLE IF NOT EXISTS genealogies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '家谱名称',
    description TEXT COMMENT '家谱描述',
    creator_id INT NOT NULL COMMENT '创建者ID',
    patriarch_id INT COMMENT '族长ID',
    is_main BOOLEAN DEFAULT FALSE COMMENT '是否主家谱',
    status ENUM('active', 'archived') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patriarch_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家谱表';

-- 15. 家谱成员表
CREATE TABLE IF NOT EXISTS genealogy_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    genealogy_id INT NOT NULL COMMENT '家谱ID',
    user_id INT NOT NULL COMMENT '用户ID',
    role ENUM('member', 'admin', 'patriarch') DEFAULT 'member' COMMENT '角色',
    generation INT DEFAULT 1 COMMENT '世代',
    position_in_generation INT DEFAULT 1 COMMENT '同辈排序',
    father_id INT COMMENT '父亲ID',
    mother_id INT COMMENT '母亲ID',
    spouse_id INT COMMENT '配偶ID',
    is_deceased BOOLEAN DEFAULT FALSE COMMENT '是否已故',
    birth_date DATE COMMENT '出生日期',
    death_date DATE COMMENT '去世日期',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (genealogy_id) REFERENCES genealogies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (father_id) REFERENCES genealogy_members(id) ON DELETE SET NULL,
    FOREIGN KEY (mother_id) REFERENCES genealogy_members(id) ON DELETE SET NULL,
    FOREIGN KEY (spouse_id) REFERENCES genealogy_members(id) ON DELETE SET NULL,
    UNIQUE KEY unique_member (genealogy_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家谱成员表';

-- ==================== 支付系统相关表 ====================

-- 16. 钱包表
CREATE TABLE IF NOT EXISTS wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '钱包名称',
    type ENUM('personal', 'family', 'group') DEFAULT 'personal' COMMENT '钱包类型',
    balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '余额',
    status ENUM('active', 'frozen', 'closed') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包表';

-- 17. 用户钱包关联表
CREATE TABLE IF NOT EXISTS user_wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    wallet_id INT NOT NULL COMMENT '钱包ID',
    balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '余额',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认钱包',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_wallet (user_id, wallet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户钱包关联表';

-- 18. 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    wallet_id INT COMMENT '钱包ID',
    type ENUM('income', 'expense', 'transfer', 'red_packet', 'refund') NOT NULL COMMENT '交易类型',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    balance_after DECIMAL(10,2) COMMENT '交易后余额',
    description TEXT COMMENT '交易描述',
    related_user_id INT COMMENT '关联用户ID',
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- 19. 红包表
CREATE TABLE IF NOT EXISTS red_packets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL COMMENT '发送者ID',
    type ENUM('single', 'group', 'lucky') DEFAULT 'single' COMMENT '红包类型',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '总金额',
    total_count INT DEFAULT 1 COMMENT '红包个数',
    remaining_amount DECIMAL(10,2) NOT NULL COMMENT '剩余金额',
    remaining_count INT NOT NULL COMMENT '剩余个数',
    message VARCHAR(200) COMMENT '祝福语',
    conversation_id INT COMMENT '会话ID',
    expire_at TIMESTAMP NULL COMMENT '过期时间',
    status ENUM('active', 'completed', 'expired', 'refunded') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='红包表';

-- 20. 红包领取记录表
CREATE TABLE IF NOT EXISTS red_packet_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    red_packet_id INT NOT NULL COMMENT '红包ID',
    user_id INT NOT NULL COMMENT '领取用户ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '领取金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (red_packet_id) REFERENCES red_packets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_receive (red_packet_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='红包领取记录表';

-- ==================== 媒体文件相关表 ====================

-- 21. 媒体文件表
CREATE TABLE IF NOT EXISTS media_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    filename VARCHAR(255) NOT NULL COMMENT '文件名',
    original_name VARCHAR(255) COMMENT '原始文件名',
    file_path TEXT NOT NULL COMMENT '文件路径',
    file_size BIGINT COMMENT '文件大小(字节)',
    mime_type VARCHAR(100) COMMENT 'MIME类型',
    type ENUM('image', 'video', 'audio', 'document', 'other') NOT NULL COMMENT '文件类型',
    width INT COMMENT '图片/视频宽度',
    height INT COMMENT '图片/视频高度',
    duration INT COMMENT '音视频时长(秒)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒体文件表';

-- ==================== 其他系统表 ====================

-- 22. 叶语号修改历史表
CREATE TABLE IF NOT EXISTS yeyu_id_changes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    old_yeyu_id VARCHAR(50) NOT NULL COMMENT '旧叶语号',
    new_yeyu_id VARCHAR(50) NOT NULL COMMENT '新叶语号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_year (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='叶语号修改历史表';

-- 23. 系统通知表
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    type ENUM('system', 'friend', 'moment', 'genealogy', 'payment', 'other') NOT NULL COMMENT '通知类型',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    data JSON COMMENT '附加数据',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

-- 24. 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    setting_key VARCHAR(100) NOT NULL COMMENT '设置键',
    setting_value TEXT COMMENT '设置值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- 25. 隐私设置表
CREATE TABLE IF NOT EXISTS privacy_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    moments_visible_to ENUM('all', 'friends', 'custom', 'none') DEFAULT 'friends' COMMENT '朋友圈可见范围',
    allow_search_by_phone BOOLEAN DEFAULT TRUE COMMENT '允许通过手机号搜索',
    allow_search_by_yeyu_id BOOLEAN DEFAULT TRUE COMMENT '允许通过叶语号搜索',
    allow_friend_request BOOLEAN DEFAULT TRUE COMMENT '允许好友请求',
    show_real_name BOOLEAN DEFAULT FALSE COMMENT '显示真实姓名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_privacy (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='隐私设置表';

-- 26. 视频号表
CREATE TABLE IF NOT EXISTS video_channels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '视频号名称',
    description TEXT COMMENT '视频号简介',
    avatar VARCHAR(500) COMMENT '视频号头像',
    cover_image VARCHAR(500) COMMENT '封面图',
    follower_count INT DEFAULT 0 COMMENT '粉丝数',
    video_count INT DEFAULT 0 COMMENT '视频数',
    status ENUM('active', 'suspended', 'deleted') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_channel (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频号表';

-- 27. 视频表
CREATE TABLE IF NOT EXISTS videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    channel_id INT NOT NULL COMMENT '视频号ID',
    user_id INT NOT NULL COMMENT '用户ID',
    title VARCHAR(200) NOT NULL COMMENT '视频标题',
    description TEXT COMMENT '视频描述',
    video_url VARCHAR(500) NOT NULL COMMENT '视频URL',
    cover_url VARCHAR(500) COMMENT '封面URL',
    duration INT COMMENT '时长(秒)',
    width INT COMMENT '宽度',
    height INT COMMENT '高度',
    view_count INT DEFAULT 0 COMMENT '观看次数',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    share_count INT DEFAULT 0 COMMENT '分享数',
    status ENUM('draft', 'published', 'deleted') DEFAULT 'draft' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES video_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_channel_status (channel_id, status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频表';

-- 28. 视频点赞表
CREATE TABLE IF NOT EXISTS video_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL COMMENT '视频ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (video_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频点赞表';

-- 29. 视频评论表
CREATE TABLE IF NOT EXISTS video_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL COMMENT '视频ID',
    user_id INT NOT NULL COMMENT '用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    reply_to_id INT COMMENT '回复的评论ID',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES video_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频评论表';

-- 30. AI祖先表
CREATE TABLE IF NOT EXISTS ai_ancestors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    genealogy_member_id INT NOT NULL COMMENT '家谱成员ID',
    user_id INT NOT NULL COMMENT '创建用户ID',
    name VARCHAR(100) NOT NULL COMMENT '祖先姓名',
    avatar VARCHAR(500) COMMENT '头像',
    voice_model VARCHAR(200) COMMENT '语音模型',
    face_model VARCHAR(200) COMMENT '面部模型',
    personality_data JSON COMMENT '性格数据',
    memory_data JSON COMMENT '记忆数据',
    status ENUM('training', 'active', 'inactive') DEFAULT 'training' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (genealogy_member_id) REFERENCES genealogy_members(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI祖先表';

-- 31. AI对话记录表
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ai_ancestor_id INT NOT NULL COMMENT 'AI祖先ID',
    user_id INT NOT NULL COMMENT '用户ID',
    message TEXT NOT NULL COMMENT '消息内容',
    response TEXT COMMENT 'AI回复',
    emotion VARCHAR(50) COMMENT '情绪',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ai_ancestor_id) REFERENCES ai_ancestors(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ancestor_created (ai_ancestor_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话记录表';

-- 32. 电子墓碑表
CREATE TABLE IF NOT EXISTS tombstones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    genealogy_member_id INT NOT NULL COMMENT '家谱成员ID',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    birth_date DATE COMMENT '出生日期',
    death_date DATE COMMENT '去世日期',
    epitaph TEXT COMMENT '墓志铭',
    location VARCHAR(200) COMMENT '墓地位置',
    qr_code VARCHAR(500) COMMENT '二维码',
    visit_count INT DEFAULT 0 COMMENT '访问次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (genealogy_member_id) REFERENCES genealogy_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电子墓碑表';

-- 33. 祭拜记录表
CREATE TABLE IF NOT EXISTS worship_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tombstone_id INT NOT NULL COMMENT '墓碑ID',
    user_id INT NOT NULL COMMENT '用户ID',
    type ENUM('incense', 'flower', 'message', 'other') NOT NULL COMMENT '祭拜类型',
    message TEXT COMMENT '祭拜留言',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tombstone_id) REFERENCES tombstones(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tombstone_created (tombstone_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='祭拜记录表';

-- 34. 家族基金表
CREATE TABLE IF NOT EXISTS family_funds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    genealogy_id INT NOT NULL COMMENT '家谱ID',
    name VARCHAR(100) NOT NULL COMMENT '基金名称',
    description TEXT COMMENT '基金描述',
    balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '余额',
    manager_id INT COMMENT '管理员ID',
    status ENUM('active', 'frozen', 'closed') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (genealogy_id) REFERENCES genealogies(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家族基金表';

-- 35. 基金交易记录表
CREATE TABLE IF NOT EXISTS fund_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fund_id INT NOT NULL COMMENT '基金ID',
    user_id INT NOT NULL COMMENT '用户ID',
    type ENUM('deposit', 'withdraw', 'transfer') NOT NULL COMMENT '交易类型',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    balance_after DECIMAL(10,2) COMMENT '交易后余额',
    description TEXT COMMENT '交易描述',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fund_id) REFERENCES family_funds(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_fund_created (fund_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='基金交易记录表';

-- ==================== 插入测试数据 ====================

-- 插入测试用户
INSERT IGNORE INTO users (id, yeyu_id, nickname, password, avatar, phone, gender, region, signature) VALUES
(1, 'YYJRCW9U2X', '叶语用户1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, '13800000001', 'male', '广东省广州市', '这是测试用户1'),
(2, 'YYJRCW9U2Y', '叶语用户2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, '13800000002', 'female', '广东省深圳市', '这是测试用户2'),
(3, 'YYJRCW9U2Z', '叶语用户3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, '13800000003', 'male', '北京市', '这是测试用户3');

-- 插入测试好友关系
INSERT IGNORE INTO friendships (user_id, friend_id, status, remark) VALUES
(1, 2, 'accepted', '好友2'),
(2, 1, 'accepted', '好友1'),
(1, 3, 'accepted', '好友3'),
(3, 1, 'accepted', '好友1');

-- 插入测试钱包
INSERT IGNORE INTO wallets (id, name, type, balance) VALUES
(1, '个人钱包', 'personal', 1000.00),
(2, '家族钱包', 'family', 5000.00);

-- 插入用户钱包关联
INSERT IGNORE INTO user_wallets (user_id, wallet_id, balance, is_default) VALUES
(1, 1, 1000.00, TRUE),
(2, 1, 800.00, TRUE),
(3, 1, 500.00, TRUE);

-- 插入测试隐私设置
INSERT IGNORE INTO privacy_settings (user_id) VALUES (1), (2), (3);

-- 完成提示
SELECT '✅ 数据库初始化完成！' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'leaftalk';
SELECT '📊 已创建35个表' as info;

