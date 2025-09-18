/**
 * 重建数据库 - 使用正确的原始结构
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    charset: 'utf8mb4'
}

async function rebuildDatabase() {
    let connection

    try {
        console.log('🔄 连接到MySQL服务器...')
        connection = await mysql.createConnection(dbConfig)

        // 删除并重建数据库
        console.log('🗑️ 删除旧数据库...')
        await connection.execute('DROP DATABASE IF EXISTS `leaftalk-new`')
        
        console.log('🔄 创建新数据库...')
        await connection.execute('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        
        // 选择数据库
        await connection.query('USE `leaftalk-new`')

        console.log('📊 创建用户表...')
        await connection.execute(`
            CREATE TABLE users (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
                yeyu_id VARCHAR(20) UNIQUE NOT NULL COMMENT '叶语ID',
                username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
                password VARCHAR(255) NOT NULL COMMENT '密码',
                nickname VARCHAR(50) COMMENT '昵称',
                avatar VARCHAR(500) COMMENT '头像URL',
                phone VARCHAR(20) UNIQUE COMMENT '手机号',
                email VARCHAR(100) COMMENT '邮箱',
                gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
                birthday DATE COMMENT '生日',
                region VARCHAR(100) COMMENT '地区',
                real_name VARCHAR(50) COMMENT '真实姓名',
                id_card VARCHAR(18) COMMENT '身份证号',
                is_verified BOOLEAN DEFAULT FALSE COMMENT '是否实名认证',
                verification_date TIMESTAMP NULL COMMENT '认证时间',
                signature VARCHAR(200) COMMENT '个性签名',
                status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '状态',
                last_login_time TIMESTAMP NULL COMMENT '最后登录时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                
                INDEX idx_yeyu_id (yeyu_id),
                INDEX idx_username (username),
                INDEX idx_phone (phone),
                INDEX idx_status (status)
            ) COMMENT '用户基础信息表'
        `)

        console.log('📊 创建好友关系表...')
        await connection.execute(`
            CREATE TABLE user_friends (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关系ID',
                user_id BIGINT NOT NULL COMMENT '用户ID',
                friend_id BIGINT NOT NULL COMMENT '好友ID',
                status ENUM('pending', 'accepted', 'blocked', 'deleted') DEFAULT 'pending' COMMENT '关系状态',
                remark_name VARCHAR(50) COMMENT '备注名称',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                
                UNIQUE KEY unique_friendship (user_id, friend_id),
                INDEX idx_user_id (user_id),
                INDEX idx_friend_id (friend_id),
                INDEX idx_status (status),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
            ) COMMENT '用户好友关系表'
        `)

        console.log('📊 插入测试用户...')
        await connection.execute(`
            INSERT INTO users (id, yeyu_id, username, password, nickname, avatar, phone) VALUES 
            (1, 'YYJRCW9U2X', 'testuser', '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q', '叶语用户', 'https://api.dicebear.com/7.x/avataaars/svg?seed=YYJRCW9U2X', '13800138000'),
            (2, '89FW2Z0BRN', '89FW2Z0BRN', '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q', '测试用户2', 'https://api.dicebear.com/7.x/avataaars/svg?seed=89FW2Z0BRN', '13800138001'),
            (3, 'CD5V4Q3QVF', 'CD5V4Q3QVF', '$2b$10$rQJ8kHWZ9QJ8kHWZ9QJ8kOJ8kHWZ9QJ8kHWZ9QJ8kHWZ9QJ8kHWZ9Q', '测试用户3', 'https://api.dicebear.com/7.x/avataaars/svg?seed=CD5V4Q3QVF', '13800138002')
        `)

        console.log('📊 插入测试好友关系...')
        await connection.execute(`
            INSERT INTO user_friends (user_id, friend_id, status, remark_name) VALUES 
            (1, 2, 'accepted', '好友2'),
            (1, 3, 'accepted', '好友3'),
            (2, 1, 'accepted', '测试用户'),
            (3, 1, 'accepted', '测试用户')
        `)

        console.log('✅ 数据库重建完成！')
        console.log('📊 数据库信息:')
        console.log('  - 数据库名: leaftalk-new')
        console.log('  - 用户表: users (BIGINT主键)')
        console.log('  - 好友表: user_friends (正确的表名)')
        console.log('  - 测试用户: 3个')
        console.log('  - 测试好友关系: 4个')

    } catch (error) {
        console.error('❌ 数据库重建失败:', error)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

rebuildDatabase().catch(console.error)
