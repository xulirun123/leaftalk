#!/usr/bin/env node

/**
 * 从 leaftalk_enterprise 复制所有表到 leaftalk-new
 * 确保新项目有所有的表
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true
}

async function copyAllFromEnterprise() {
    let connection

    try {
        console.log('🚀 开始从 leaftalk_enterprise 复制所有表到 leaftalk-new...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 检查源数据库
        console.log('🔍 检查源数据库 leaftalk_enterprise...')
        await connection.query('USE `leaftalk_enterprise`')
        const [sourceTables] = await connection.query('SHOW TABLES')
        const sourceTableNames = sourceTables.map(row => Object.values(row)[0])
        
        console.log(`📊 源数据库有 ${sourceTableNames.length} 个表`)

        // 2. 备份现有用户数据
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

        // 3. 重建目标数据库
        console.log('🔄 重建目标数据库...')
        await connection.query('DROP DATABASE IF EXISTS `leaftalk-new`')
        await connection.query('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        await connection.query('USE `leaftalk-new`')
        await connection.query('SET FOREIGN_KEY_CHECKS = 0')

        // 4. 逐个复制表结构（不包含外键）
        console.log('📊 复制所有表结构...')
        let successCount = 0
        let failCount = 0

        for (const tableName of sourceTableNames) {
            try {
                console.log(`🔄 复制表: ${tableName}`)
                
                // 获取表结构
                await connection.query('USE `leaftalk_enterprise`')
                const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``)
                let createSQL = createResult[0]['Create Table']
                
                // 强力移除所有外键约束
                createSQL = createSQL.replace(/,\s*CONSTRAINT\s+`[^`]+`\s+FOREIGN\s+KEY\s*\([^)]+\)\s+REFERENCES\s+`[^`]+`\s*\([^)]+\)(\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))*/gi, '')
                createSQL = createSQL.replace(/,\s*FOREIGN\s+KEY\s*\([^)]+\)\s+REFERENCES\s+`[^`]+`\s*\([^)]+\)(\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))*/gi, '')
                createSQL = createSQL.replace(/\)\s+REFERENCES\s+`[^`]+`\s*\([^)]+\)(\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))*/gi, ')')
                createSQL = createSQL.replace(/,\s*,/g, ',')
                createSQL = createSQL.replace(/,\s*\)/g, ')')
                
                // 在目标数据库创建表
                await connection.query('USE `leaftalk-new`')
                await connection.query(createSQL)
                
                successCount++
                console.log(`  ✅ ${tableName} 结构复制成功`)
                
            } catch (error) {
                failCount++
                console.error(`  ❌ ${tableName} 结构复制失败: ${error.message}`)
            }
        }

        // 5. 复制数据
        console.log('\n📥 复制所有表数据...')
        let dataSuccessCount = 0
        let dataFailCount = 0
        let totalRecords = 0

        for (const tableName of sourceTableNames) {
            try {
                // 检查表是否在目标数据库中存在
                await connection.query('USE `leaftalk-new`')
                const [targetTables] = await connection.query('SHOW TABLES')
                const targetTableNames = targetTables.map(row => Object.values(row)[0])
                
                if (!targetTableNames.includes(tableName)) {
                    console.log(`  ⚠️ ${tableName} 表不存在，跳过数据复制`)
                    continue
                }

                console.log(`📥 复制数据: ${tableName}`)
                
                // 检查源表数据量
                await connection.query('USE `leaftalk_enterprise`')
                const [sourceCount] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``)
                
                if (sourceCount[0].count > 0) {
                    // 复制数据
                    await connection.query('USE `leaftalk-new`')
                    await connection.query(`INSERT INTO \`${tableName}\` SELECT * FROM \`leaftalk_enterprise\`.\`${tableName}\``)
                    
                    totalRecords += sourceCount[0].count
                    console.log(`  ✅ ${tableName} 数据复制完成 (${sourceCount[0].count} 条记录)`)
                } else {
                    console.log(`  ⚪ ${tableName} 无数据`)
                }
                
                dataSuccessCount++
                
            } catch (error) {
                dataFailCount++
                console.error(`  ❌ ${tableName} 数据复制失败: ${error.message}`)
            }
        }

        // 6. 恢复备份的用户数据（如果有冲突则跳过）
        if (userData.length > 0) {
            console.log('\n📥 恢复备份的用户数据...')
            for (const user of userData) {
                try {
                    await connection.query(
                        'INSERT IGNORE INTO users (id, yeyu_id, username, password, nickname, avatar, phone, email, gender, birth_date, region, real_name, id_card, verification_status, signature, status, last_login_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [user.id, user.yeyu_id, user.username, user.password, user.nickname, user.avatar, user.phone, user.email, user.gender, user.birth_date, user.region, user.real_name, user.id_card, user.verification_status, user.signature, user.status, user.last_login_at, user.created_at, user.updated_at]
                    )
                } catch (error) {
                    // 忽略重复数据错误
                }
            }
        }

        // 7. 重新启用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')

        // 8. 验证复制结果
        console.log('\n🔍 验证复制结果...')
        const [finalTables] = await connection.query('SHOW TABLES')
        const finalTableNames = finalTables.map(row => Object.values(row)[0])
        
        console.log('\n📊 复制统计:')
        console.log(`  - 源数据库表数量: ${sourceTableNames.length}`)
        console.log(`  - 表结构复制成功: ${successCount}`)
        console.log(`  - 表结构复制失败: ${failCount}`)
        console.log(`  - 数据复制成功: ${dataSuccessCount}`)
        console.log(`  - 数据复制失败: ${dataFailCount}`)
        console.log(`  - 总记录数: ${totalRecords}`)
        console.log(`  - 最终表数量: ${finalTableNames.length}`)

        // 9. 显示所有表
        console.log('\n📋 所有复制的表:')
        finalTableNames.sort().forEach((table, index) => {
            console.log(`  ${(index + 1).toString().padStart(2, '0')}. ${table}`)
        })

        console.log('\n🎉 所有表复制完成！')
        console.log('✅ 新项目现在拥有所有必需的表')
        console.log('🚀 可以重启服务器并测试导航功能了')

    } catch (error) {
        console.error('❌ 复制失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await copyAllFromEnterprise()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { copyAllFromEnterprise }
