#!/usr/bin/env node

/**
 * 创建新项目的所有表 - 完整版本
 * 包含用户、聊天、朋友圈、族谱、支付、视频号等所有功能的表
 */

const mysql = require('mysql2/promise')
const fs = require('fs').promises

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true
}

async function createAllTables() {
    let connection

    try {
        console.log('🚀 开始创建新项目的所有表...')
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

        // 2. 使用完整的数据库结构文件
        console.log('📄 读取完整的数据库结构文件...')
        const schemaPath = './database/core/UNIFIED_COMPLETE_SCHEMA.sql'
        const schemaSql = await fs.readFile(schemaPath, 'utf8')

        // 3. 重建数据库
        console.log('🔄 重建数据库...')
        await connection.query('DROP DATABASE IF EXISTS `leaftalk-new`')
        await connection.query('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        await connection.query('USE `leaftalk-new`')

        // 4. 禁用外键检查并执行完整结构
        console.log('🔄 禁用外键检查...')
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')
        
        console.log('📊 执行完整的数据库结构...')
        await connection.query(schemaSql)
        
        console.log('🔄 重新启用外键检查...')
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')

        // 5. 恢复用户数据
        if (userData.length > 0) {
            console.log('📥 恢复用户数据...')
            for (const user of userData) {
                try {
                    await connection.query(
                        'INSERT IGNORE INTO users (id, yeyu_id, username, password, nickname, avatar, phone, email, gender, birth_date, region, real_name, id_card, verification_status, signature, status, last_login_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [user.id, user.yeyu_id, user.username, user.password, user.nickname, user.avatar, user.phone, user.email, user.gender, user.birth_date, user.region, user.real_name, user.id_card, user.verification_status, user.signature, user.status, user.last_login_at, user.created_at, user.updated_at]
                    )
                    console.log(`  ✅ 恢复用户: ${user.username}`)
                } catch (error) {
                    console.log(`  ⚠️ 用户可能已存在: ${user.username}`)
                }
            }
        }

        // 6. 验证所有表
        console.log('\n🔍 验证所有表创建结果...')
        const [tables] = await connection.query('SHOW TABLES')
        const tableNames = tables.map(row => Object.values(row)[0])
        
        console.log(`📊 总表数量: ${tableNames.length}`)
        console.log('\n📋 所有创建的表:')
        
        // 按功能分组显示表
        const tableGroups = {
            '用户系统': tableNames.filter(t => t.includes('user') || t === 'users'),
            '聊天系统': tableNames.filter(t => t.includes('chat') || t.includes('message') || t.includes('conversation')),
            '好友系统': tableNames.filter(t => t.includes('friend')),
            '朋友圈系统': tableNames.filter(t => t.includes('moment')),
            '族谱系统': tableNames.filter(t => t.includes('genealogy') || t.includes('family')),
            '支付系统': tableNames.filter(t => t.includes('payment') || t.includes('wallet') || t.includes('transaction')),
            '视频系统': tableNames.filter(t => t.includes('video')),
            '其他功能': tableNames.filter(t => 
                !t.includes('user') && t !== 'users' &&
                !t.includes('chat') && !t.includes('message') && !t.includes('conversation') &&
                !t.includes('friend') && !t.includes('moment') &&
                !t.includes('genealogy') && !t.includes('family') &&
                !t.includes('payment') && !t.includes('wallet') && !t.includes('transaction') &&
                !t.includes('video')
            )
        }

        for (const [group, tables] of Object.entries(tableGroups)) {
            if (tables.length > 0) {
                console.log(`\n${group} (${tables.length}个表):`)
                tables.forEach(table => console.log(`  ✅ ${table}`))
            }
        }

        // 7. 检查关键表是否存在
        const criticalTables = [
            'users', 'user_friends', 'friend_requests', 
            'conversations', 'messages', 'chat_conversations', 'chat_messages',
            'moments', 'moment_likes', 'moment_comments',
            'genealogy_members', 'genealogy_families',
            'videos', 'video_likes', 'video_comments'
        ]
        
        console.log('\n🎯 关键表检查:')
        let missingTables = []
        for (const table of criticalTables) {
            const exists = tableNames.includes(table)
            console.log(`  ${exists ? '✅' : '❌'} ${table}`)
            if (!exists) missingTables.push(table)
        }

        if (missingTables.length === 0) {
            console.log('\n🎉 所有关键表都已创建成功！')
        } else {
            console.log(`\n⚠️ 缺少 ${missingTables.length} 个关键表:`, missingTables)
        }

        console.log('\n✅ 数据库完整结构创建完成！')
        console.log('🚀 现在可以重启服务器并测试所有功能了')

    } catch (error) {
        console.error('❌ 创建表失败:', error.message)
        console.error('详细错误:', error)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await createAllTables()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { createAllTables }
