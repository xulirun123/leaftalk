#!/usr/bin/env node

/**
 * 修复 users 表结构不兼容问题
 * 将 leaftalk-new 中的 users 表替换为 leaftalk_enterprise 中的版本
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true
}

async function fixUsersTable() {
    let connection

    try {
        console.log('🔧 修复 users 表结构不兼容问题...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 备份 leaftalk-new 中的 users 数据
        console.log('💾 备份 leaftalk-new 中的 users 数据...')
        await connection.query('USE `leaftalk-new`')
        const [currentUsers] = await connection.query('SELECT * FROM users')
        console.log(`备份了 ${currentUsers.length} 个用户`)

        // 2. 获取 leaftalk_enterprise 中的 users 表结构
        console.log('📊 获取 leaftalk_enterprise 中的 users 表结构...')
        await connection.query('USE `leaftalk_enterprise`')
        const [createResult] = await connection.query('SHOW CREATE TABLE users')
        const createSQL = createResult[0]['Create Table']
        
        // 3. 获取 leaftalk_enterprise 中的 users 数据
        const [enterpriseUsers] = await connection.query('SELECT * FROM users')
        console.log(`leaftalk_enterprise 中有 ${enterpriseUsers.length} 个用户`)

        // 4. 禁用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')

        // 5. 删除 leaftalk-new 中的 users 表
        console.log('🗑️ 删除 leaftalk-new 中的旧 users 表...')
        await connection.query('USE `leaftalk-new`')
        await connection.query('DROP TABLE IF EXISTS users')

        // 6. 在 leaftalk-new 中创建新的 users 表
        console.log('🔄 创建新的 users 表结构...')
        await connection.query(createSQL)

        // 7. 合并用户数据
        console.log('📊 合并用户数据...')
        
        // 先插入企业版用户
        if (enterpriseUsers.length > 0) {
            console.log('📥 插入企业版用户数据...')
            const [columns] = await connection.query('SHOW COLUMNS FROM users')
            const columnNames = columns.map(col => `\`${col.Field}\``)
            const placeholders = columns.map(() => '?')
            
            const insertSQL = `INSERT IGNORE INTO users (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')})`
            
            for (const user of enterpriseUsers) {
                const values = columns.map(col => user[col.Field])
                await connection.query(insertSQL, values)
            }
        }

        // 再插入原有用户（如果不冲突）
        if (currentUsers.length > 0) {
            console.log('📥 插入原有用户数据...')
            for (const user of currentUsers) {
                try {
                    // 检查用户是否已存在
                    const [existing] = await connection.query('SELECT id FROM users WHERE yeyu_id = ? OR username = ?', [user.yeyu_id, user.username])
                    
                    if (existing.length === 0) {
                        // 用户不存在，插入
                        await connection.query(
                            'INSERT INTO users (yeyu_id, username, password, nickname, avatar, phone) VALUES (?, ?, ?, ?, ?, ?)',
                            [user.yeyu_id, user.username, user.password, user.nickname, user.avatar, user.phone]
                        )
                        console.log(`  ✅ 插入用户: ${user.username}`)
                    } else {
                        console.log(`  ⚠️ 用户已存在: ${user.username}`)
                    }
                } catch (error) {
                    console.log(`  ❌ 插入用户失败: ${user.username} - ${error.message}`)
                }
            }
        }

        // 8. 重新启用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')

        // 9. 验证结果
        const [finalUsers] = await connection.query('SELECT COUNT(*) as count FROM users')
        console.log(`✅ users 表修复完成，最终用户数量: ${finalUsers[0].count}`)

        console.log('🎉 users 表结构修复完成！现在可以重新运行迁移脚本了')

    } catch (error) {
        console.error('❌ 修复失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await fixUsersTable()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { fixUsersTable }
