#!/usr/bin/env node

/**
 * 将 leaftalk_enterprise 数据库的所有表迁移到 leaftalk-new 数据库
 * 解决新项目中缺少数据库表导致的报错问题
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true
}

async function migrateFromEnterprise() {
    let connection

    try {
        console.log('🔄 开始从 leaftalk_enterprise 迁移数据库表到 leaftalk-new...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 获取 leaftalk_enterprise 的所有表结构
        console.log('📊 获取 leaftalk_enterprise 的表结构...')
        await connection.query('USE `leaftalk_enterprise`')
        
        const [tables] = await connection.query('SHOW TABLES')
        const tableNames = tables.map(row => Object.values(row)[0])
        
        console.log(`发现 ${tableNames.length} 个表:`)
        tableNames.forEach(table => console.log(`  - ${table}`))

        // 2. 切换到目标数据库
        console.log('\n🎯 切换到 leaftalk-new 数据库...')
        await connection.query('USE `leaftalk-new`')

        // 3. 获取当前 leaftalk-new 的表
        const [existingTables] = await connection.query('SHOW TABLES')
        const existingTableNames = existingTables.map(row => Object.values(row)[0])
        
        console.log(`leaftalk-new 当前有 ${existingTableNames.length} 个表:`)
        existingTableNames.forEach(table => console.log(`  - ${table}`))

        // 4. 禁用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')

        // 5. 逐个迁移表
        let migratedCount = 0
        let skippedCount = 0

        for (const tableName of tableNames) {
            try {
                console.log(`\n🔄 处理表: ${tableName}`)
                
                // 检查表是否已存在
                if (existingTableNames.includes(tableName)) {
                    console.log(`  ⚠️ 表 ${tableName} 已存在，检查数据...`)
                    
                    // 检查现有表的数据量
                    const [existingCount] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``)
                    
                    // 检查源表的数据量
                    await connection.query('USE `leaftalk_enterprise`')
                    const [sourceCount] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``)
                    await connection.query('USE `leaftalk-new`')
                    
                    if (sourceCount[0].count > existingCount[0].count) {
                        console.log(`  🔄 源表有更多数据 (${sourceCount[0].count} vs ${existingCount[0].count})，替换表...`)
                        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``)
                    } else {
                        console.log(`  ✅ 保留现有表 (数据量: ${existingCount[0].count})`)
                        skippedCount++
                        continue
                    }
                }

                // 获取表结构
                await connection.query('USE `leaftalk_enterprise`')
                const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``)
                const createSQL = createResult[0]['Create Table']
                
                // 在目标数据库创建表
                await connection.query('USE `leaftalk-new`')
                await connection.query(createSQL)
                
                // 复制数据
                const [sourceData] = await connection.query(`SELECT * FROM \`leaftalk_enterprise\`.\`${tableName}\``)
                
                if (sourceData.length > 0) {
                    console.log(`  📊 复制 ${sourceData.length} 条数据...`)
                    
                    // 获取列名
                    const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``)
                    const columnNames = columns.map(col => `\`${col.Field}\``)
                    const placeholders = columns.map(() => '?')
                    
                    const insertSQL = `INSERT INTO \`${tableName}\` (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')})`
                    
                    // 批量插入数据
                    for (const row of sourceData) {
                        const values = columns.map(col => row[col.Field])
                        await connection.query(insertSQL, values)
                    }
                } else {
                    console.log(`  📊 表为空，只复制结构`)
                }
                
                console.log(`  ✅ 表 ${tableName} 迁移完成`)
                migratedCount++
                
            } catch (error) {
                console.error(`  ❌ 表 ${tableName} 迁移失败:`, error.message)
            }
        }

        // 6. 重新启用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')

        // 7. 验证迁移结果
        console.log('\n🔍 验证迁移结果...')
        const [finalTables] = await connection.query('SHOW TABLES')
        
        console.log('\n📊 迁移完成统计:')
        console.log(`  - 成功迁移: ${migratedCount} 个表`)
        console.log(`  - 跳过: ${skippedCount} 个表`)
        console.log(`  - leaftalk-new 最终表数量: ${finalTables.length}`)
        
        console.log('\n✅ 数据库迁移完成！')
        console.log('🚀 现在可以重启服务器测试了')

    } catch (error) {
        console.error('❌ 迁移失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await migrateFromEnterprise()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { migrateFromEnterprise }
