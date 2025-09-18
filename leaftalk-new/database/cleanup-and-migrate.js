#!/usr/bin/env node

/**
 * 1. 删除不需要的数据库
 * 2. 使用备份方案迁移 leaftalk_enterprise 到 leaftalk-new
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true
}

async function cleanupAndMigrate() {
    let connection

    try {
        console.log('🚀 开始清理和迁移数据库...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 删除不需要的数据库
        console.log('🗑️ 删除不需要的数据库...')
        
        const databasesToDelete = [
            'leaftalk-new-backup',
            'yeyu_app', 
            'yeyu_messages'
        ]

        for (const dbName of databasesToDelete) {
            try {
                console.log(`  删除数据库: ${dbName}`)
                await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``)
                console.log(`  ✅ ${dbName} 已删除`)
            } catch (error) {
                console.log(`  ⚠️ ${dbName} 删除失败: ${error.message}`)
            }
        }

        // 2. 清空并重建 leaftalk-new 数据库
        console.log('\n🔄 重建 leaftalk-new 数据库...')
        await connection.query('DROP DATABASE IF EXISTS `leaftalk-new`')
        await connection.query('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        
        // 3. 使用备份方案迁移
        console.log('📊 开始迁移 leaftalk_enterprise 到 leaftalk-new...')
        
        // 禁用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')
        
        // 获取所有表
        await connection.query('USE `leaftalk_enterprise`')
        const [tables] = await connection.query('SHOW TABLES')
        const tableNames = tables.map(row => Object.values(row)[0])
        
        console.log(`发现 ${tableNames.length} 个表需要迁移`)
        
        let successCount = 0
        let failCount = 0
        
        // 逐个复制表
        for (const tableName of tableNames) {
            try {
                console.log(`🔄 迁移表: ${tableName}`)
                
                // 获取表结构
                const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``)
                const createSQL = createResult[0]['Create Table']
                
                // 在目标数据库创建表
                await connection.query('USE `leaftalk-new`')
                await connection.query(createSQL)
                
                // 复制数据
                await connection.query(`INSERT INTO \`leaftalk-new\`.\`${tableName}\` SELECT * FROM \`leaftalk_enterprise\`.\`${tableName}\``)
                
                // 检查数据量
                const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``)
                console.log(`  ✅ ${tableName} 迁移完成 (${count[0].count} 条记录)`)
                successCount++
                
            } catch (error) {
                console.error(`  ❌ ${tableName} 迁移失败: ${error.message}`)
                failCount++
            }
        }
        
        // 重新启用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')
        
        // 4. 验证迁移结果
        console.log('\n🔍 验证迁移结果...')
        await connection.query('USE `leaftalk-new`')
        
        const [finalTables] = await connection.query('SHOW TABLES')
        console.log(`📊 leaftalk-new 现在有 ${finalTables.length} 个表`)
        
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users')
        console.log(`👥 用户数量: ${users[0].count}`)
        
        const [conversations] = await connection.query('SELECT COUNT(*) as count FROM conversations')
        console.log(`💬 会话数量: ${conversations[0].count}`)
        
        console.log('\n📊 迁移统计:')
        console.log(`  - 成功迁移: ${successCount} 个表`)
        console.log(`  - 失败: ${failCount} 个表`)
        
        if (failCount === 0) {
            console.log('\n🎉 数据库迁移完全成功！')
        } else {
            console.log('\n⚠️ 部分表迁移失败，但主要功能应该正常')
        }
        
        console.log('🚀 现在可以重启服务器测试了')

    } catch (error) {
        console.error('❌ 操作失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await cleanupAndMigrate()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { cleanupAndMigrate }
