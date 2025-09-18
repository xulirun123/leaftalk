#!/usr/bin/env node

/**
 * 完整的数据库迁移方案
 * 1. 清空 leaftalk-new 数据库
 * 2. 完整复制 leaftalk_enterprise 的所有表和数据
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true
}

async function completeMigration() {
    let connection

    try {
        console.log('🔄 开始完整数据库迁移...')
        connection = await mysql.createConnection(dbConfig)

        // 1. 清空 leaftalk-new 数据库
        console.log('🗑️ 清空 leaftalk-new 数据库...')
        await connection.query('DROP DATABASE IF EXISTS `leaftalk-new`')
        await connection.query('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        
        // 2. 获取 leaftalk_enterprise 的完整数据库结构
        console.log('📊 获取 leaftalk_enterprise 的完整结构...')
        
        // 使用 mysqldump 的方式来完整复制数据库
        const { spawn } = require('child_process')
        
        console.log('🔄 使用 mysqldump 导出数据...')
        
        // 导出 leaftalk_enterprise 数据库
        const dumpProcess = spawn('mysqldump', [
            '-h', 'localhost',
            '-u', 'root',
            '-ppassword',
            '--single-transaction',
            '--routines',
            '--triggers',
            'leaftalk_enterprise'
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        })

        let dumpData = ''
        dumpProcess.stdout.on('data', (data) => {
            dumpData += data.toString()
        })

        dumpProcess.stderr.on('data', (data) => {
            console.error('mysqldump error:', data.toString())
        })

        await new Promise((resolve, reject) => {
            dumpProcess.on('close', (code) => {
                if (code === 0) {
                    resolve()
                } else {
                    reject(new Error(`mysqldump failed with code ${code}`))
                }
            })

            dumpProcess.on('error', (error) => {
                reject(error)
            })
        })

        console.log('📥 导入数据到 leaftalk-new...')
        
        // 切换到目标数据库
        await connection.query('USE `leaftalk-new`')
        
        // 执行导入
        await connection.query(dumpData)
        
        console.log('✅ 数据库迁移完成！')
        
        // 验证结果
        const [tables] = await connection.query('SHOW TABLES')
        console.log(`📊 leaftalk-new 现在有 ${tables.length} 个表`)
        
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users')
        console.log(`👥 用户数量: ${users[0].count}`)

    } catch (error) {
        console.error('❌ 迁移失败:', error.message)
        
        // 如果 mysqldump 不可用，使用备用方案
        if (error.message.includes('mysqldump') || error.code === 'ENOENT') {
            console.log('⚠️ mysqldump 不可用，使用备用方案...')
            await backupMigration(connection)
        } else {
            throw error
        }
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function backupMigration(connection) {
    console.log('🔄 使用备用迁移方案...')
    
    // 1. 清空目标数据库
    await connection.query('DROP DATABASE IF EXISTS `leaftalk-new`')
    await connection.query('CREATE DATABASE `leaftalk-new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
    
    // 2. 禁用外键检查
    await connection.query('SET FOREIGN_KEY_CHECKS = 0')
    
    // 3. 获取所有表
    await connection.query('USE `leaftalk_enterprise`')
    const [tables] = await connection.query('SHOW TABLES')
    const tableNames = tables.map(row => Object.values(row)[0])
    
    console.log(`发现 ${tableNames.length} 个表`)
    
    // 4. 逐个复制表
    for (const tableName of tableNames) {
        try {
            console.log(`🔄 复制表: ${tableName}`)
            
            // 获取表结构
            const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``)
            const createSQL = createResult[0]['Create Table']
            
            // 在目标数据库创建表
            await connection.query('USE `leaftalk-new`')
            await connection.query(createSQL)
            
            // 复制数据
            await connection.query(`INSERT INTO \`leaftalk-new\`.\`${tableName}\` SELECT * FROM \`leaftalk_enterprise\`.\`${tableName}\``)
            
            console.log(`  ✅ ${tableName} 复制完成`)
            
        } catch (error) {
            console.error(`  ❌ ${tableName} 复制失败:`, error.message)
        }
    }
    
    // 5. 重新启用外键检查
    await connection.query('SET FOREIGN_KEY_CHECKS = 1')
    
    console.log('✅ 备用迁移完成！')
}

async function main() {
    try {
        await completeMigration()
        console.log('🎉 数据库迁移成功！现在可以重启服务器了')
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { completeMigration }
