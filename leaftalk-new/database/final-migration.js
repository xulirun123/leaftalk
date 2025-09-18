#!/usr/bin/env node

/**
 * 最终迁移方案 - 分步骤处理
 * 1. 先创建所有表结构
 * 2. 再复制数据
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true
}

async function finalMigration() {
    let connection

    try {
        console.log('🚀 开始最终数据库迁移...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 重建 leaftalk-new 数据库
        console.log('🔄 重建 leaftalk-new 数据库...')
        await connection.query('DROP DATABASE IF EXISTS `leaftalk-new`')
        await connection.query('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        
        // 2. 禁用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')
        
        // 3. 获取所有表
        await connection.query('USE `leaftalk_enterprise`')
        const [tables] = await connection.query('SHOW TABLES')
        const tableNames = tables.map(row => Object.values(row)[0])
        
        console.log(`发现 ${tableNames.length} 个表需要迁移`)
        
        // 4. 第一步：创建所有表结构
        console.log('\n📊 第一步：创建表结构...')
        await connection.query('USE `leaftalk-new`')
        
        let createdTables = []
        let failedTables = []
        
        for (const tableName of tableNames) {
            try {
                console.log(`🔧 创建表结构: ${tableName}`)
                
                // 获取表结构
                await connection.query('USE `leaftalk_enterprise`')
                const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``)
                let createSQL = createResult[0]['Create Table']
                
                // 移除外键约束，稍后再添加
                createSQL = createSQL.replace(/,\s*CONSTRAINT.*?FOREIGN KEY.*?REFERENCES.*?(?=,|\))/g, '')
                createSQL = createSQL.replace(/,\s*FOREIGN KEY.*?REFERENCES.*?(?=,|\))/g, '')
                
                // 在目标数据库创建表
                await connection.query('USE `leaftalk-new`')
                await connection.query(createSQL)
                
                createdTables.push(tableName)
                console.log(`  ✅ ${tableName} 结构创建成功`)
                
            } catch (error) {
                failedTables.push({ table: tableName, error: error.message })
                console.error(`  ❌ ${tableName} 结构创建失败: ${error.message}`)
            }
        }
        
        console.log(`\n📊 表结构创建完成: ${createdTables.length} 成功, ${failedTables.length} 失败`)
        
        // 5. 第二步：复制数据
        console.log('\n📊 第二步：复制数据...')
        
        let dataSuccessCount = 0
        let dataFailCount = 0
        
        for (const tableName of createdTables) {
            try {
                console.log(`📥 复制数据: ${tableName}`)
                
                // 检查源表数据量
                await connection.query('USE `leaftalk_enterprise`')
                const [sourceCount] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``)
                
                if (sourceCount[0].count > 0) {
                    // 复制数据
                    await connection.query('USE `leaftalk-new`')
                    await connection.query(`INSERT INTO \`${tableName}\` SELECT * FROM \`leaftalk_enterprise\`.\`${tableName}\``)
                    
                    console.log(`  ✅ ${tableName} 数据复制完成 (${sourceCount[0].count} 条记录)`)
                } else {
                    console.log(`  ⚪ ${tableName} 无数据`)
                }
                
                dataSuccessCount++
                
            } catch (error) {
                console.error(`  ❌ ${tableName} 数据复制失败: ${error.message}`)
                dataFailCount++
            }
        }
        
        // 6. 重新启用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')
        
        // 7. 验证迁移结果
        console.log('\n🔍 验证迁移结果...')
        await connection.query('USE `leaftalk-new`')
        
        const [finalTables] = await connection.query('SHOW TABLES')
        console.log(`📊 leaftalk-new 现在有 ${finalTables.length} 个表`)
        
        // 检查关键表
        const keyTables = ['users', 'conversations', 'messages', 'moments']
        for (const table of keyTables) {
            try {
                const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``)
                console.log(`📊 ${table}: ${count[0].count} 条记录`)
            } catch (error) {
                console.log(`⚠️ ${table}: 表不存在或无法访问`)
            }
        }
        
        console.log('\n📊 最终统计:')
        console.log(`  - 表结构创建成功: ${createdTables.length}`)
        console.log(`  - 表结构创建失败: ${failedTables.length}`)
        console.log(`  - 数据复制成功: ${dataSuccessCount}`)
        console.log(`  - 数据复制失败: ${dataFailCount}`)
        
        if (failedTables.length > 0) {
            console.log('\n❌ 失败的表:')
            failedTables.forEach(item => {
                console.log(`  - ${item.table}: ${item.error}`)
            })
        }
        
        console.log('\n🎉 数据库迁移完成！')
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
        await finalMigration()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { finalMigration }
