#!/usr/bin/env node

/**
 * 删除数据库表中的旧字段，只保留新字段
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'leaftalk-new',
    charset: 'utf8mb4'
}

async function removeOldFields() {
    let connection

    try {
        console.log('🧹 开始删除数据库表中的旧字段...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 检查 friend_requests 表当前结构
        console.log('📊 检查 friend_requests 表当前结构...')
        const [columns] = await connection.query('DESCRIBE friend_requests')
        console.log('当前字段:')
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`)
        })

        // 2. 删除旧字段
        console.log('\n🗑️ 删除旧字段...')
        
        const oldFields = ['from_user_id', 'to_user_id']
        
        for (const field of oldFields) {
            try {
                console.log(`删除字段: ${field}`)
                await connection.query(`ALTER TABLE friend_requests DROP COLUMN \`${field}\``)
                console.log(`  ✅ ${field} 删除成功`)
            } catch (error) {
                if (error.message.includes("doesn't exist")) {
                    console.log(`  ⚪ ${field} 字段不存在，跳过`)
                } else {
                    console.error(`  ❌ ${field} 删除失败: ${error.message}`)
                }
            }
        }

        // 3. 检查删除后的表结构
        console.log('\n📊 检查删除后的表结构...')
        const [newColumns] = await connection.query('DESCRIBE friend_requests')
        console.log('剩余字段:')
        newColumns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`)
        })

        // 4. 验证数据完整性
        console.log('\n🔍 验证数据完整性...')
        const [data] = await connection.query('SELECT * FROM friend_requests LIMIT 3')
        console.log(`数据条数: ${data.length}`)
        if (data.length > 0) {
            console.log('示例数据:')
            data.forEach((row, index) => {
                console.log(`  记录 ${index + 1}:`, {
                    id: row.id,
                    requester_id: row.requester_id,
                    requestee_id: row.requestee_id,
                    status: row.status
                })
            })
        }

        // 5. 检查其他表是否也有类似的旧字段需要清理
        console.log('\n🔍 检查其他表的旧字段...')
        
        // 检查 users 表是否有重复字段
        const [userColumns] = await connection.query('DESCRIBE users')
        const userFields = userColumns.map(col => col.Field)
        console.log('\nusers 表字段检查:')
        
        // 查找可能的重复字段
        const duplicatePatterns = ['avatar', 'nickname', 'phone', 'email']
        for (const pattern of duplicatePatterns) {
            const matchingFields = userFields.filter(field => 
                field.toLowerCase().includes(pattern.toLowerCase())
            )
            if (matchingFields.length > 1) {
                console.log(`  ⚠️ 发现重复字段模式 "${pattern}": ${matchingFields.join(', ')}`)
            }
        }

        // 6. 检查 conversations 表
        try {
            const [convColumns] = await connection.query('DESCRIBE conversations')
            console.log('\nconversations 表字段:')
            convColumns.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type})`)
            })
        } catch (error) {
            console.log('\nconversations 表不存在或无法访问')
        }

        // 7. 检查 messages 表
        try {
            const [msgColumns] = await connection.query('DESCRIBE messages')
            console.log('\nmessages 表字段:')
            msgColumns.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type})`)
            })
        } catch (error) {
            console.log('\nmessages 表不存在或无法访问')
        }

        console.log('\n🎉 旧字段清理完成！')
        console.log('✅ friend_requests 表现在只包含新字段')
        console.log('🚀 可以重启服务器测试API了')

    } catch (error) {
        console.error('❌ 清理失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await removeOldFields()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { removeOldFields }
