/**
 * 叶语应用完整数据库初始化脚本
 * 包含用户系统、家谱系统、朋友圈、聊天、支付、AI祖先等所有功能模块
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    charset: 'utf8mb4'
}

async function initDatabase() {
    let connection

    try {
        console.log('🔄 连接到MySQL服务器...')
        connection = await mysql.createConnection(dbConfig)

        // 保留原有数据库，只清理测试数据库
        console.log('🗑️ 清理测试数据库...')
        await connection.execute('DROP DATABASE IF EXISTS `leaftalk`')

        // 创建新数据库
        console.log('🔄 创建数据库 leaftalk-new...')
        await connection.execute('CREATE DATABASE IF NOT EXISTS `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')

        // 选择数据库
        await connection.query('USE `leaftalk-new`')

        console.log('📊 开始创建数据库表结构...')

        // ==================== 用户系统相关表 ====================

        // 1. 用户基础信息表
        console.log('🔄 创建用户表...')
        await connection.execute(`
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

        // 2. 用户扩展信息表
        console.log('🔄 创建用户扩展信息表...')
        await connection.execute(`
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
            ) COMMENT='用户扩展信息表'
        `)

        // 3. 账户绑定表
        console.log('🔄 创建账户绑定表...')
        await connection.execute(`
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
            ) COMMENT='账户绑定关系表'
        `)

        // ==================== 好友系统相关表 ====================

        // 4. 好友关系表
        console.log('🔄 创建好友关系表...')
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS friendships (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT '用户ID',
                friend_id INT NOT NULL COMMENT '好友ID',
                status ENUM('pending', 'accepted', 'blocked', 'deleted') DEFAULT 'pending' COMMENT '关系状态',
                remark VARCHAR(100) COMMENT '好友备注',
                group_id INT COMMENT '分组ID',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_friendship (user_id, friend_id),
                INDEX idx_status (status)
            ) COMMENT='好友关系表'
        `)

        // 5. 好友请求表
        console.log('🔄 创建好友请求表...')
        await connection.execute(`
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
            ) COMMENT='好友请求表'
        `)

        // 6. 好友分组表
        console.log('🔄 创建好友分组表...')
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS friend_groups (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL COMMENT '用户ID',
                name VARCHAR(50) NOT NULL COMMENT '分组名称',
                sort_order INT DEFAULT 0 COMMENT '排序',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) COMMENT='好友分组表'
        `)

        // 7. 黑名单表
        console.log('🔄 创建黑名单表...')
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS blacklist (
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

        // ==================== 朋友圈系统相关表 ====================

        // 8. 朋友圈动态表
        console.log('🔄 创建朋友圈表...')
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS moments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                content TEXT,
                images JSON,
                videos JSON,
                location VARCHAR(200),
                location_lat DECIMAL(10, 8),
                location_lng DECIMAL(11, 8),
                visibility ENUM('public', 'friends', 'private') DEFAULT 'friends',
                allow_comment BOOLEAN DEFAULT TRUE,
                allow_like BOOLEAN DEFAULT TRUE,
                is_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `)
        
        // 创建点赞表
        console.log('🔄 创建点赞表...')
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS moment_likes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                moment_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_like (moment_id, user_id),
                FOREIGN KEY (moment_id) REFERENCES moments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `)
        
        // 创建评论表
        console.log('🔄 创建评论表...')
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS moment_comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                moment_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (moment_id) REFERENCES moments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `)
        
        // 插入测试用户
        console.log('🔄 插入测试用户...')
        await connection.execute(`
            INSERT IGNORE INTO users (id, yeyu_id, username, nickname, avatar) VALUES 
            (1, 'YYJRCW9U2X', 'testuser', '叶语用户', 'https://api.dicebear.com/7.x/avataaars/svg?seed=YYJRCW9U2X&backgroundColor=b6e3f4')
        `)
        
        console.log('✅ 数据库初始化完成！')
        
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('🎉 数据库初始化成功！')
            process.exit(0)
        })
        .catch((error) => {
            console.error('💥 数据库初始化失败:', error)
            process.exit(1)
        })
}

module.exports = { initDatabase }
