#!/usr/bin/env node

/**
 * 分析数据库表使用情况
 * 规则：
 * 1. 只有一个表的 - 保留（不管是否使用）
 * 2. 有重复的表 - 如果没使用就删除，如果使用就保留
 */

const mysql = require('mysql2/promise')
const fs = require('fs').promises
const path = require('path')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4'
}

// 从代码中提取使用的表名
const USED_TABLES = [
    'users',           // 用户表 - 正在使用
    'user_friends',    // 好友关系表 - 正在使用
    'friend_requests', // 好友请求表 - 正在使用
    'moments',         // 朋友圈表 - 正在使用
    'moment_comments', // 朋友圈评论表 - 正在使用
    'moment_likes'     // 朋友圈点赞表 - 正在使用
]

async function analyzeTables() {
    let connection

    try {
        console.log('🔍 开始分析数据库表...')
        connection = await mysql.createConnection(dbConfig)

        // 获取所有数据库
        const [databases] = await connection.query('SHOW DATABASES')
        const dbNames = databases.map(row => Object.values(row)[0])
        const leaftalkDbs = dbNames.filter(name => name.includes('leaftalk') || name.includes('yeyu'))

        console.log('📊 相关数据库:', leaftalkDbs)

        // 收集所有表信息
        const allTables = {}
        
        for (const dbName of leaftalkDbs) {
            try {
                await connection.query(`USE \`${dbName}\``)
                const [tables] = await connection.query('SHOW TABLES')
                const tableNames = tables.map(row => Object.values(row)[0])
                
                console.log(`\n📋 数据库 ${dbName} 的表:`)
                for (const tableName of tableNames) {
                    if (!allTables[tableName]) {
                        allTables[tableName] = []
                    }
                    allTables[tableName].push(dbName)
                    
                    // 检查表中是否有数据
                    try {
                        const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``)
                        const hasData = count[0].count > 0
                        console.log(`  - ${tableName} (${hasData ? '有数据' : '空表'})`)
                    } catch (e) {
                        console.log(`  - ${tableName} (无法访问)`)
                    }
                }
            } catch (error) {
                console.log(`❌ 无法访问数据库 ${dbName}:`, error.message)
            }
        }

        console.log('\n📊 表分析结果:')
        console.log('================')

        const singleTables = []
        const duplicateTables = []

        for (const [tableName, databases] of Object.entries(allTables)) {
            const isUsed = USED_TABLES.includes(tableName)
            
            if (databases.length === 1) {
                // 只有一个表的 - 保留
                singleTables.push({
                    name: tableName,
                    database: databases[0],
                    used: isUsed,
                    action: '保留'
                })
                console.log(`✅ ${tableName} (${databases[0]}) - 唯一表，保留`)
            } else {
                // 有重复的表
                duplicateTables.push({
                    name: tableName,
                    databases: databases,
                    used: isUsed
                })
                
                if (isUsed) {
                    console.log(`🔄 ${tableName} - 重复表但正在使用，需要选择保留哪个:`)
                    databases.forEach(db => console.log(`    - ${db}`))
                } else {
                    console.log(`❌ ${tableName} - 重复表且未使用，建议删除:`)
                    databases.forEach(db => console.log(`    - ${db}`))
                }
            }
        }

        console.log('\n🎯 清理建议:')
        console.log('================')

        // 针对重复且未使用的表给出删除建议
        const toDelete = duplicateTables.filter(table => !table.used)
        if (toDelete.length > 0) {
            console.log('📝 可以删除的重复未使用表:')
            toDelete.forEach(table => {
                table.databases.forEach(db => {
                    console.log(`DROP TABLE IF EXISTS \`${db}\`.\`${table.name}\`;`)
                })
            })
        }

        // 针对重复且正在使用的表给出建议
        const usedDuplicates = duplicateTables.filter(table => table.used)
        if (usedDuplicates.length > 0) {
            console.log('\n⚠️ 重复且正在使用的表需要手动处理:')
            usedDuplicates.forEach(table => {
                console.log(`\n表: ${table.name}`)
                console.log('存在于数据库:')
                table.databases.forEach(db => console.log(`  - ${db}`))
                console.log('建议: 选择一个主数据库，将其他数据库中的表删除或迁移数据')
            })
        }

        console.log('\n📊 统计:')
        console.log(`- 唯一表: ${singleTables.length} 个`)
        console.log(`- 重复表: ${duplicateTables.length} 个`)
        console.log(`- 正在使用的表: ${USED_TABLES.length} 个`)

    } catch (error) {
        console.error('❌ 分析失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await analyzeTables()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { analyzeTables }
