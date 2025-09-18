#!/usr/bin/env node

/**
 * 执行数据库清理 - 删除重复且未使用的表
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

async function executeCleanup() {
    let connection

    try {
        console.log('🗑️ 开始清理重复且未使用的表...')
        connection = await mysql.createConnection(dbConfig)

        // 读取清理SQL文件
        const sqlFile = './database/cleanup-duplicate-tables.sql'
        const sql = await fs.readFile(sqlFile, 'utf8')

        console.log('📄 执行清理SQL...')
        await connection.query(sql)

        console.log('✅ 清理完成！')
        
        // 重新分析验证结果
        console.log('🔍 验证清理结果...')
        const [databases] = await connection.query('SHOW DATABASES')
        const dbNames = databases.map(row => Object.values(row)[0])
        const leaftalkDbs = dbNames.filter(name => name.includes('leaftalk') || name.includes('yeyu'))

        let totalTables = 0
        for (const dbName of leaftalkDbs) {
            try {
                await connection.query(`USE \`${dbName}\``)
                const [tables] = await connection.query('SHOW TABLES')
                totalTables += tables.length
                console.log(`📊 ${dbName}: ${tables.length} 个表`)
            } catch (error) {
                console.log(`❌ 无法访问 ${dbName}`)
            }
        }

        console.log(`📊 总计: ${totalTables} 个表`)
        console.log('🎉 数据库清理完成！')

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
        await executeCleanup()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { executeCleanup }
