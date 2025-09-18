#!/usr/bin/env node

/**
 * 数据库清理脚本
 * 统一数据库结构，删除重复和未使用的数据库
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4'
}

async function cleanupDatabases() {
    let connection

    try {
        console.log('🔍 开始检查数据库状态...')
        connection = await mysql.createConnection(dbConfig)

        // 检查现有数据库
        console.log('📊 检查现有数据库...')
        const [databases] = await connection.query('SHOW DATABASES')
        const dbNames = databases.map(row => Object.values(row)[0])
        
        console.log('现有数据库:')
        dbNames.forEach(name => {
            if (name.includes('leaftalk') || name.includes('yeyu')) {
                console.log(`  - ${name}`)
            }
        })

        // 检查每个相关数据库的表结构
        const leaftalkDbs = dbNames.filter(name => 
            name.includes('leaftalk') || name.includes('yeyu')
        )

        for (const dbName of leaftalkDbs) {
            try {
                console.log(`\n🔍 检查数据库: ${dbName}`)
                await connection.query(`USE \`${dbName}\``)
                
                const [tables] = await connection.query('SHOW TABLES')
                const tableNames = tables.map(row => Object.values(row)[0])
                
                if (tableNames.length > 0) {
                    console.log(`  表数量: ${tableNames.length}`)
                    console.log(`  主要表: ${tableNames.slice(0, 5).join(', ')}${tableNames.length > 5 ? '...' : ''}`)
                    
                    // 检查用户数据
                    if (tableNames.includes('users')) {
                        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users')
                        console.log(`  用户数量: ${userCount[0].count}`)
                    }
                } else {
                    console.log(`  ⚠️ 空数据库`)
                }
            } catch (error) {
                console.log(`  ❌ 无法访问: ${error.message}`)
            }
        }

        // 统一决策
        console.log('\n📋 数据库统一方案:')
        console.log('✅ 保留: leaftalk_enterprise (企业版主数据库)')
        console.log('🗑️ 可删除: leaftalk (基础版，如果存在)')
        console.log('🗑️ 可删除: leaftalk-new (临时数据库)')
        console.log('🗑️ 可删除: yeyu_messages (消息数据库，已合并)')

        // 询问用户确认
        console.log('\n⚠️ 注意: 此操作将删除未使用的数据库')
        console.log('如果您确定要继续，请手动执行以下SQL命令:')
        
        if (dbNames.includes('leaftalk')) {
            console.log('DROP DATABASE IF EXISTS `leaftalk`;')
        }
        if (dbNames.includes('leaftalk-new')) {
            console.log('DROP DATABASE IF EXISTS `leaftalk-new`;')
        }
        if (dbNames.includes('yeyu_messages')) {
            console.log('DROP DATABASE IF EXISTS `yeyu_messages`;')
        }

        // 确保企业版数据库存在
        if (!dbNames.includes('leaftalk_enterprise')) {
            console.log('\n🔄 创建企业版数据库...')
            await connection.query('CREATE DATABASE IF NOT EXISTS `leaftalk_enterprise` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
            console.log('✅ 企业版数据库已创建')
        } else {
            console.log('\n✅ 企业版数据库已存在')
        }

        console.log('\n🎯 推荐操作:')
        console.log('1. 运行: node database/init-database.js')
        console.log('2. 启动服务: cd server && node app.js')

    } catch (error) {
        console.error('❌ 数据库检查失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await cleanupDatabases()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { cleanupDatabases }
