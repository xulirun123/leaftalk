-- 社交功能补充数据表

-- ================================
-- 朋友圈相关表
-- ================================

-- 朋友圈动态表
CREATE TABLE IF NOT EXISTS moments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '发布者用户ID',
    content TEXT COMMENT '动态内容',
    images JSON COMMENT '图片列表',
    videos JSON COMMENT '视频列表',
    location VARCHAR(200) COMMENT '位置信息',
    location_lat DECIMAL(10, 8) COMMENT '纬度',
    location_lng DECIMAL(11, 8) COMMENT '经度',
    visibility ENUM('public', 'friends', 'private') DEFAULT 'friends' COMMENT '可见性',
    allow_comment BOOLEAN DEFAULT TRUE COMMENT '允许评论',
    allow_like BOOLEAN DEFAULT TRUE COMMENT '允许点赞',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    view_count INT DEFAULT 0 COMMENT '查看数',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_visibility (visibility),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='朋友圈动态表';

-- 朋友圈点赞表
CREATE TABLE IF NOT EXISTS moment_likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    moment_id BIGINT NOT NULL COMMENT '动态ID',
    user_id BIGINT NOT NULL COMMENT '点赞用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moment_user (moment_id, user_id),
    INDEX idx_moment_id (moment_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='朋友圈点赞表';

-- 朋友圈评论表
CREATE TABLE IF NOT EXISTS moment_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    moment_id BIGINT NOT NULL COMMENT '动态ID',
    user_id BIGINT NOT NULL COMMENT '评论用户ID',
    parent_id BIGINT NULL COMMENT '父评论ID（回复功能）',
    reply_to_user_id BIGINT NULL COMMENT '回复的用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    images JSON COMMENT '评论图片',
    like_count INT DEFAULT 0 COMMENT '评论点赞数',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moment_id (moment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES moment_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_user_id) REFERENCES users(id) ON DELETE SET NULL
) COMMENT='朋友圈评论表';

-- ================================
-- 好友请求系统
-- ================================

-- 好友请求表
CREATE TABLE IF NOT EXISTS friend_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_user_id BIGINT NOT NULL COMMENT '发送请求的用户ID',
    to_user_id BIGINT NOT NULL COMMENT '接收请求的用户ID',
    message TEXT COMMENT '验证消息',
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending' COMMENT '请求状态',
    source VARCHAR(50) COMMENT '添加来源（搜索、扫码、推荐等）',
    processed_at TIMESTAMP NULL COMMENT '处理时间',
    expires_at TIMESTAMP NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_friend_request (from_user_id, to_user_id),
    INDEX idx_to_user_status (to_user_id, status),
    INDEX idx_from_user_id (from_user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='好友请求表';

-- ================================
-- 黑名单功能
-- ================================

-- 用户黑名单表
CREATE TABLE IF NOT EXISTS user_blacklist (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '拉黑的用户ID',
    blocked_user_id BIGINT NOT NULL COMMENT '被拉黑的用户ID',
    reason VARCHAR(200) COMMENT '拉黑原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_blacklist (user_id, blocked_user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_blocked_user_id (blocked_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='用户黑名单表';

-- ================================
-- 用户状态管理
-- ================================

-- 用户在线状态表
CREATE TABLE IF NOT EXISTS user_online_status (
    user_id BIGINT PRIMARY KEY,
    status ENUM('online', 'offline', 'away', 'busy') DEFAULT 'offline' COMMENT '在线状态',
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后上线时间',
    device_type VARCHAR(50) COMMENT '设备类型',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    socket_id VARCHAR(100) COMMENT 'Socket连接ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_last_seen (last_seen_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='用户在线状态表';

-- ================================
-- 消息状态管理
-- ================================

-- 消息已读状态表
CREATE TABLE IF NOT EXISTS message_read_status (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id BIGINT NOT NULL COMMENT '消息ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    conversation_id VARCHAR(100) NOT NULL COMMENT '会话ID',
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '已读时间',
    UNIQUE KEY unique_message_user (message_id, user_id),
    INDEX idx_message_id (message_id),
    INDEX idx_user_id (user_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_read_at (read_at),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='消息已读状态表';

-- 会话未读消息计数表
CREATE TABLE IF NOT EXISTS conversation_unread_count (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    conversation_id VARCHAR(100) NOT NULL COMMENT '会话ID',
    unread_count INT DEFAULT 0 COMMENT '未读消息数',
    last_message_id BIGINT COMMENT '最后一条消息ID',
    last_read_message_id BIGINT COMMENT '最后已读消息ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_conversation (user_id, conversation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_conversation_id (conversation_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='会话未读消息计数表';

-- ================================
-- 系统通知
-- ================================

-- 系统通知表
CREATE TABLE IF NOT EXISTS system_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '接收通知的用户ID',
    type ENUM('friend_request', 'friend_accepted', 'group_invite', 'system_message', 'moment_like', 'moment_comment') NOT NULL COMMENT '通知类型',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    data JSON COMMENT '通知相关数据',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    action_url VARCHAR(500) COMMENT '点击跳转链接',
    expires_at TIMESTAMP NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id_read (user_id, is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='系统通知表';

-- ================================
-- 文件上传管理
-- ================================

-- 文件上传记录表
CREATE TABLE IF NOT EXISTS file_uploads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '上传用户ID',
    file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
    file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
    file_type VARCHAR(100) NOT NULL COMMENT '文件类型',
    mime_type VARCHAR(100) COMMENT 'MIME类型',
    file_hash VARCHAR(64) COMMENT '文件哈希值',
    usage_type ENUM('avatar', 'moment', 'chat', 'document', 'other') DEFAULT 'other' COMMENT '使用类型',
    is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开访问',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_file_hash (file_hash),
    INDEX idx_usage_type (usage_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='文件上传记录表';

-- ================================
-- 插入示例数据
-- ================================

-- 插入示例朋友圈动态
INSERT INTO moments (user_id, content, location, visibility) VALUES
(1, '今天天气真好，出来走走～ 🌞', '深圳市南山区', 'friends'),
(2, '刚刚完成了一个重要项目，感谢团队的努力！💪', '北京市朝阳区', 'friends'),
(1, '周末和家人一起度过，很温馨的时光 ❤️', '上海市浦东新区', 'friends');

-- 插入示例点赞
INSERT INTO moment_likes (moment_id, user_id) VALUES
(1, 2), (1, 3),
(2, 1), (2, 3),
(3, 2);

-- 插入示例评论
INSERT INTO moment_comments (moment_id, user_id, content) VALUES
(1, 2, '确实是个好天气！'),
(1, 3, '在哪里拍的？风景不错'),
(2, 1, '恭喜恭喜！🎉'),
(3, 2, '家人最重要了');

-- 更新朋友圈统计数据
UPDATE moments SET like_count = (SELECT COUNT(*) FROM moment_likes WHERE moment_id = moments.id);
UPDATE moments SET comment_count = (SELECT COUNT(*) FROM moment_comments WHERE moment_id = moments.id AND is_deleted = FALSE);
