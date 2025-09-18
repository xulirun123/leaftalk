#!/usr/bin/env node

/**
 * 应用正确的数据库表结构
 * 使用 FINAL_UNIFIED_SCHEMA.sql 重建数据库
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

async function applyCorrectSchema() {
    let connection

    try {
        console.log('🔄 开始应用正确的数据库表结构...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 备份当前用户数据
        console.log('💾 备份当前用户数据...')
        await connection.query('USE `leaftalk-new`')
        
        let userData = []
        try {
            const [users] = await connection.query('SELECT * FROM users')
            userData = users
            console.log(`备份了 ${userData.length} 个用户`)
        } catch (e) {
            console.log('用户表不存在或无法访问')
        }

        // 2. 读取正确的表结构文件
        console.log('📄 读取完整的表结构...')
        const schemaPath = './database/core/UNIFIED_COMPLETE_SCHEMA.sql'
        const schemaSql = await fs.readFile(schemaPath, 'utf8')

        // 3. 删除并重建数据库
        console.log('🗑️ 删除旧数据库...')
        await connection.query('DROP DATABASE IF EXISTS `leaftalk-new`')

        console.log('🔄 创建新数据库...')
        await connection.query('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        await connection.query('USE `leaftalk-new`')

        console.log('🔄 禁用外键检查...')
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')

        console.log('🔄 执行完整的表结构...')
        await connection.query(schemaSql)

        console.log('🔄 重新启用外键检查...')
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')

        // 4. 恢复用户数据
        if (userData.length > 0) {
            console.log('📥 恢复用户数据...')
            await connection.query('USE `leaftalk-new`')
            
            for (const user of userData) {
                try {
                    await connection.query(
                        `INSERT INTO users (id, yeyu_id, username, nickname, password, phone, email, avatar, real_name, id_card, verification_status, gender, birth_date, region, signature, status, last_login_at, created_at, updated_at, last_active_at, father_name, mother_name, avatar_id) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            user.id, user.yeyu_id, user.username, user.nickname || user.username, 
                            user.password, user.phone, user.email, user.avatar, user.real_name, 
                            user.id_card, user.verification_status || 'unverified', user.gender || 'unknown', 
                            user.birth_date, user.region, user.signature, user.status || 'active',
                            user.last_login_at, user.created_at, user.updated_at, user.last_active_at,
                            user.father_name, user.mother_name, user.avatar_id
                        ]
                    )
                    console.log(`  ✅ 恢复用户: ${user.username}`)
                } catch (error) {
                    console.log(`  ❌ 恢复用户失败: ${user.username} - ${error.message}`)
                }
            }
        }

        // 5. 验证新表结构
        console.log('\n🔍 验证新表结构...')
        const [tables] = await connection.query('SHOW TABLES')
        const tableNames = tables.map(row => Object.values(row)[0])
        
        console.log(`📊 数据库表数量: ${tableNames.length}`)
        
        // 检查关键表
        const expectedTables = [
            'users', 'user_settings', 'user_friends', 'friend_requests',
            'conversations', 'conversation_participants', 'messages',
            'moments', 'moment_likes', 'moment_comments'
        ]
        
        console.log('\n📋 关键表检查:')
        for (const table of expectedTables) {
            const exists = tableNames.includes(table)
            console.log(`  ${exists ? '✅' : '❌'} ${table}`)
            
            if (exists) {
                try {
                    const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``)
                    console.log(`      数据量: ${count[0].count}`)
                } catch (e) {
                    console.log(`      无法查询数据量`)
                }
            }
        }

        console.log('\n🎉 数据库表结构应用完成！')
        console.log('✅ 现在数据库表结构与新项目代码匹配')
        console.log('🚀 可以重启服务器测试了')

    } catch (error) {
        console.error('❌ 应用表结构失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await applyCorrectSchema()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { applyCorrectSchema }
