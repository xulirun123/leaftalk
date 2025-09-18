#!/usr/bin/env node

/**
 * 创建新项目所有必需的表
 * 确保包含 conversations、user_friends、friend_requests 等所有表
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true
}

async function createAllRequiredTables() {
    let connection

    try {
        console.log('🚀 开始创建新项目所有必需的表...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 备份现有用户数据
        console.log('💾 备份现有用户数据...')
        let userData = []
        try {
            await connection.query('USE `leaftalk-new`')
            const [users] = await connection.query('SELECT * FROM users')
            userData = users
            console.log(`备份了 ${userData.length} 个用户`)
        } catch (e) {
            console.log('没有现有数据需要备份')
        }

        // 2. 重建数据库
        console.log('🔄 重建数据库...')
        await connection.query('DROP DATABASE IF EXISTS `leaftalk-new`')
        await connection.query('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        await connection.query('USE `leaftalk-new`')
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')

        // 3. 创建所有必需的表
        console.log('📊 创建所有必需的表...')

        // 用户表
        await connection.query(`
            CREATE TABLE users (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
                yeyu_id VARCHAR(20) UNIQUE COMMENT '叶语ID',
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
                verification_status ENUM('unverified','pending','verified','rejected') DEFAULT 'unverified' COMMENT '认证状态',
                signature VARCHAR(500) COMMENT '个性签名',
                status ENUM('active','inactive','banned') DEFAULT 'active' COMMENT '账户状态',
                last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_yeyu_id (yeyu_id),
                INDEX idx_username (username),
                INDEX idx_phone (phone),
                INDEX idx_status (status)
            ) COMMENT '用户基础信息表'
        `)
        console.log('  ✅ users 表创建完成')

        // 好友关系表
        await connection.query(`
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
                INDEX idx_status (status)
            ) COMMENT '用户好友关系表'
        `)
        console.log('  ✅ user_friends 表创建完成')

        // 好友请求表
        await connection.query(`
            CREATE TABLE friend_requests (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '请求ID',
                requester_id BIGINT NOT NULL COMMENT '请求者ID',
                receiver_id BIGINT NOT NULL COMMENT '接收者ID',
                message TEXT COMMENT '请求消息',
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' COMMENT '请求状态',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_requester_id (requester_id),
                INDEX idx_receiver_id (receiver_id),
                INDEX idx_status (status)
            ) COMMENT '好友请求表'
        `)
        console.log('  ✅ friend_requests 表创建完成')

        // 会话表 (conversations)
        await connection.query(`
            CREATE TABLE conversations (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
                conversation_id VARCHAR(50) UNIQUE NOT NULL COMMENT '会话唯一标识',
                type ENUM('private', 'group') DEFAULT 'private' COMMENT '会话类型',
                name VARCHAR(100) COMMENT '会话名称',
                avatar VARCHAR(500) COMMENT '会话头像',
                description TEXT COMMENT '会话描述',
                created_by BIGINT COMMENT '创建者ID',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_conversation_id (conversation_id),
                INDEX idx_type (type),
                INDEX idx_created_by (created_by)
            ) COMMENT '聊天会话表'
        `)
        console.log('  ✅ conversations 表创建完成')

        // 消息表
        await connection.query(`
            CREATE TABLE messages (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
                message_id VARCHAR(50) UNIQUE NOT NULL COMMENT '消息唯一标识',
                conversation_id VARCHAR(50) NOT NULL COMMENT '会话ID',
                sender_id BIGINT NOT NULL COMMENT '发送者ID',
                content TEXT NOT NULL COMMENT '消息内容',
                type ENUM('text', 'image', 'voice', 'video', 'file', 'system') DEFAULT 'text' COMMENT '消息类型',
                status ENUM('sending', 'sent', 'delivered', 'read') DEFAULT 'sending' COMMENT '消息状态',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_message_id (message_id),
                INDEX idx_conversation_id (conversation_id),
                INDEX idx_sender_id (sender_id),
                INDEX idx_created_at (created_at)
            ) COMMENT '聊天消息表'
        `)
        console.log('  ✅ messages 表创建完成')

        // 朋友圈表
        await connection.query(`
            CREATE TABLE moments (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '动态ID',
                user_id BIGINT NOT NULL COMMENT '用户ID',
                content TEXT COMMENT '动态内容',
                images JSON COMMENT '图片列表',
                location VARCHAR(200) COMMENT '位置信息',
                privacy ENUM('public', 'friends', 'private') DEFAULT 'friends' COMMENT '隐私设置',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at),
                INDEX idx_privacy (privacy)
            ) COMMENT '朋友圈动态表'
        `)
        console.log('  ✅ moments 表创建完成')

        // 朋友圈点赞表
        await connection.query(`
            CREATE TABLE moment_likes (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '点赞ID',
                moment_id BIGINT NOT NULL COMMENT '动态ID',
                user_id BIGINT NOT NULL COMMENT '用户ID',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                UNIQUE KEY unique_like (moment_id, user_id),
                INDEX idx_moment_id (moment_id),
                INDEX idx_user_id (user_id)
            ) COMMENT '朋友圈点赞表'
        `)
        console.log('  ✅ moment_likes 表创建完成')

        // 朋友圈评论表
        await connection.query(`
            CREATE TABLE moment_comments (
                id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评论ID',
                moment_id BIGINT NOT NULL COMMENT '动态ID',
                user_id BIGINT NOT NULL COMMENT '用户ID',
                content TEXT NOT NULL COMMENT '评论内容',
                reply_to BIGINT COMMENT '回复的评论ID',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                INDEX idx_moment_id (moment_id),
                INDEX idx_user_id (user_id),
                INDEX idx_reply_to (reply_to),
                INDEX idx_created_at (created_at)
            ) COMMENT '朋友圈评论表'
        `)
        console.log('  ✅ moment_comments 表创建完成')

        // 4. 恢复用户数据
        if (userData.length > 0) {
            console.log('📥 恢复用户数据...')
            for (const user of userData) {
                try {
                    await connection.query(
                        'INSERT INTO users (id, yeyu_id, username, password, nickname, avatar, phone, email, gender, birthday, region, real_name, id_card, verification_status, signature, status, last_login_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [user.id, user.yeyu_id, user.username, user.password, user.nickname, user.avatar, user.phone, user.email, user.gender, user.birthday, user.region, user.real_name, user.id_card, user.verification_status, user.signature, user.status, user.last_login_at, user.created_at, user.updated_at]
                    )
                    console.log(`  ✅ 恢复用户: ${user.username}`)
                } catch (error) {
                    console.log(`  ❌ 恢复用户失败: ${user.username}`)
                }
            }
        }

        // 5. 重新启用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')

        // 6. 验证表创建
        console.log('\n🔍 验证表创建结果...')
        const [tables] = await connection.query('SHOW TABLES')
        const tableNames = tables.map(row => Object.values(row)[0])
        
        const requiredTables = [
            'users', 'user_friends', 'friend_requests', 
            'conversations', 'messages', 
            'moments', 'moment_likes', 'moment_comments'
        ]
        
        console.log('📋 必需表检查:')
        for (const table of requiredTables) {
            const exists = tableNames.includes(table)
            console.log(`  ${exists ? '✅' : '❌'} ${table}`)
        }

        console.log(`\n📊 总表数量: ${tableNames.length}`)
        console.log('🎉 所有必需的表创建完成！')
        console.log('🚀 现在可以重启服务器并测试导航了')

    } catch (error) {
        console.error('❌ 创建表失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await createAllRequiredTables()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { createAllRequiredTables }
