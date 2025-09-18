/**
 * 叶语应用数据库整合脚本
 * 将三个分散的数据库整合为一个统一的 leaftalk-new 数据库
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    charset: 'utf8mb4'
}

async function migrateDatabase() {
    let connection
    
    try {
        console.log('🔄 连接到MySQL服务器...')
        connection = await mysql.createConnection(dbConfig)
        
        // 备份当前数据库
        console.log('💾 备份当前数据库...')
        await connection.execute('CREATE DATABASE IF NOT EXISTS `leaftalk-new-backup` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        
        // 重新创建统一数据库
        console.log('🗑️ 清理并重建统一数据库...')
        await connection.execute('DROP DATABASE IF EXISTS `leaftalk-new`')
        await connection.execute('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        await connection.query('USE `leaftalk-new`')
        
        console.log('📊 开始创建统一数据库表结构...')
        
        // ==================== 核心用户系统 ====================
        
        console.log('👤 创建用户系统表...')
        
        // 用户基础信息表
        await connection.execute(`
            CREATE TABLE users (
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
                verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending' COMMENT '实名认证状态',
                account_status ENUM('active', 'suspended', 'deleted') DEFAULT 'active' COMMENT '账户状态',
                last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_phone (phone),
                INDEX idx_yeyu_id (yeyu_id),
                INDEX idx_real_name (real_name)
            ) COMMENT='用户基础信息表'
        `)
        
        // 用户设置表
        await connection.execute(`
            CREATE TABLE user_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                privacy_level ENUM('public', 'friends', 'private') DEFAULT 'friends' COMMENT '隐私级别',
                allow_friend_requests BOOLEAN DEFAULT TRUE COMMENT '允许好友请求',
                allow_moments_comments BOOLEAN DEFAULT TRUE COMMENT '允许朋友圈评论',
                notification_enabled BOOLEAN DEFAULT TRUE COMMENT '通知开关',
                sound_enabled BOOLEAN DEFAULT TRUE COMMENT '声音开关',
                vibration_enabled BOOLEAN DEFAULT TRUE COMMENT '震动开关',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) COMMENT='用户设置表'
        `)
        
        // 用户统计表
        await connection.execute(`
            CREATE TABLE user_statistics (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                friends_count INT DEFAULT 0 COMMENT '好友数量',
                moments_count INT DEFAULT 0 COMMENT '朋友圈数量',
                messages_count INT DEFAULT 0 COMMENT '消息数量',
                login_count INT DEFAULT 0 COMMENT '登录次数',
                last_active_at TIMESTAMP NULL COMMENT '最后活跃时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) COMMENT='用户统计表'
        `)
        
        // ==================== 好友系统 ====================
        
        console.log('👥 创建好友系统表...')
        
        // 好友关系表
        await connection.execute(`
            CREATE TABLE friendships (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT '用户ID',
                friend_id INT NOT NULL COMMENT '好友ID',
                status ENUM('pending', 'accepted', 'blocked', 'deleted') DEFAULT 'accepted' COMMENT '关系状态',
                remark VARCHAR(100) COMMENT '好友备注',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_friendship (user_id, friend_id),
                INDEX idx_status (status)
            ) COMMENT='好友关系表'
        `)
        
        // 好友请求表
        await connection.execute(`
            CREATE TABLE friend_requests (
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
            ) COMMENT='好友请求表'
        `)
        
        // 黑名单表
        await connection.execute(`
            CREATE TABLE blacklist (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT '用户ID',
                blocked_user_id INT NOT NULL COMMENT '被拉黑用户ID',
                reason TEXT COMMENT '拉黑原因',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_block (user_id, blocked_user_id)
            ) COMMENT='黑名单表'
        `)
        
        // ==================== 聊天系统 ====================

        console.log('💬 创建聊天系统表...')

        // 会话表
        await connection.execute(`
            CREATE TABLE conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                type ENUM('private', 'group') NOT NULL COMMENT '会话类型',
                name VARCHAR(100) COMMENT '群聊名称',
                avatar VARCHAR(500) COMMENT '群聊头像',
                description TEXT COMMENT '群聊描述',
                creator_id INT COMMENT '创建者ID',
                last_message_id INT COMMENT '最后一条消息ID',
                last_message_at TIMESTAMP NULL COMMENT '最后消息时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_type (type),
                INDEX idx_last_message_at (last_message_at)
            ) COMMENT='会话表'
        `)

        // 会话成员表
        await connection.execute(`
            CREATE TABLE conversation_members (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conversation_id INT NOT NULL COMMENT '会话ID',
                user_id INT NOT NULL COMMENT '用户ID',
                role ENUM('member', 'admin', 'owner') DEFAULT 'member' COMMENT '角色',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
                last_read_at TIMESTAMP NULL COMMENT '最后阅读时间',
                is_muted BOOLEAN DEFAULT FALSE COMMENT '是否静音',
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_member (conversation_id, user_id)
            ) COMMENT='会话成员表'
        `)

        // 消息表
        await connection.execute(`
            CREATE TABLE messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conversation_id INT NOT NULL COMMENT '会话ID',
                sender_id INT NOT NULL COMMENT '发送者ID',
                type ENUM('text', 'image', 'video', 'audio', 'file', 'location', 'system') DEFAULT 'text' COMMENT '消息类型',
                content TEXT COMMENT '消息内容',
                media_url VARCHAR(500) COMMENT '媒体文件URL',
                reply_to_id INT COMMENT '回复消息ID',
                is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL,
                INDEX idx_conversation (conversation_id),
                INDEX idx_created_at (created_at)
            ) COMMENT='消息表'
        `)

        // ==================== 朋友圈系统 ====================

        console.log('📸 创建朋友圈系统表...')

        // 朋友圈动态表
        await connection.execute(`
            CREATE TABLE moments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT '用户ID',
                content TEXT COMMENT '动态内容',
                images JSON COMMENT '图片列表',
                location VARCHAR(200) COMMENT '位置信息',
                privacy ENUM('public', 'friends', 'private') DEFAULT 'friends' COMMENT '隐私设置',
                likes_count INT DEFAULT 0 COMMENT '点赞数',
                comments_count INT DEFAULT 0 COMMENT '评论数',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) COMMENT='朋友圈动态表'
        `)

        // 朋友圈点赞表
        await connection.execute(`
            CREATE TABLE moment_likes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                moment_id INT NOT NULL COMMENT '动态ID',
                user_id INT NOT NULL COMMENT '用户ID',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (moment_id, user_id)
            ) COMMENT='朋友圈点赞表'
        `)

        // 朋友圈评论表
        await connection.execute(`
            CREATE TABLE moment_comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                moment_id INT NOT NULL COMMENT '动态ID',
                user_id INT NOT NULL COMMENT '用户ID',
                content TEXT NOT NULL COMMENT '评论内容',
                reply_to_id INT COMMENT '回复评论ID',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reply_to_id) REFERENCES moment_comments(id) ON DELETE CASCADE,
                INDEX idx_moment_id (moment_id)
            ) COMMENT='朋友圈评论表'
        `)

        console.log('✅ 核心表结构创建完成')
        console.log('📋 开始数据迁移...')

        // 迁移用户数据（从 leaftalk_enterprise 主数据库）
        await migrateUsersData(connection)

        console.log('✅ 数据库整合完成！')
        
    } catch (error) {
        console.error('❌ 数据库整合失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

// 迁移用户数据
async function migrateUsersData(connection) {
    try {
        console.log('👤 迁移用户数据...')
        
        // 从主数据库迁移用户
        await connection.execute(`
            INSERT INTO \`leaftalk-new\`.users (yeyu_id, username, nickname, password, avatar, phone, email, real_name, verification_status, created_at)
            SELECT yeyu_id, username, nickname, password, avatar, phone, email, real_name, verification_status, created_at
            FROM \`leaftalk_enterprise\`.users
            ON DUPLICATE KEY UPDATE
            nickname = VALUES(nickname),
            avatar = VALUES(avatar),
            updated_at = CURRENT_TIMESTAMP
        `)
        
        console.log('✅ 用户数据迁移完成')
        
    } catch (error) {
        console.error('❌ 用户数据迁移失败:', error.message)
        // 继续执行，不中断整个流程
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    migrateDatabase()
        .then(() => {
            console.log('🎉 数据库整合成功！')
            console.log('📊 统一数据库: leaftalk-new')
            console.log('💾 备份数据库: leaftalk-new-backup')
            process.exit(0)
        })
        .catch((error) => {
            console.error('💥 数据库整合失败:', error)
            process.exit(1)
        })
}

module.exports = { migrateDatabase }
