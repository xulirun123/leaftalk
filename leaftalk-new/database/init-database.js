#!/usr/bin/env node

/**
 * 叶语企业版数据库初始化脚本
 * LeafTalk Enterprise Database Initialization Script
 * 
 * 使用方法:
 * node database/init-database.js
 * 
 * 环境变量:
 * DB_HOST - 数据库主机 (默认: localhost)
 * DB_USER - 数据库用户 (默认: root)
 * DB_PASSWORD - 数据库密码 (默认: password)
 * DB_NAME - 数据库名称 (默认: leaftalk-new)
 */

const mysql = require('mysql2/promise')
const fs = require('fs').promises
const path = require('path')

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    charset: 'utf8mb4',
    multipleStatements: true // 允许执行多条SQL语句
}

const DB_NAME = process.env.DB_NAME || 'leaftalk-new'

/**
 * 执行SQL文件
 */
async function executeSqlFile(connection, filePath) {
    try {
        console.log(`📄 读取SQL文件: ${filePath}`)
        const sql = await fs.readFile(filePath, 'utf8')
        
        console.log('🔄 执行SQL语句...')
        const results = await connection.query(sql)
        
        console.log('✅ SQL文件执行成功')
        return results
    } catch (error) {
        console.error('❌ SQL文件执行失败:', error.message)
        throw error
    }
}

/**
 * 检查数据库连接
 */
async function checkConnection(connection) {
    try {
        await connection.ping()
        console.log('✅ 数据库连接正常')
        return true
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message)
        return false
    }
}

/**
 * 验证数据库初始化结果
 */
async function validateDatabase(connection) {
    try {
        console.log('🔍 验证数据库初始化结果...')
        
        // 切换到目标数据库
        await connection.query(`USE \`${DB_NAME}\``)
        
        // 检查表是否存在
        const [tables] = await connection.query('SHOW TABLES')
        const tableNames = tables.map(row => Object.values(row)[0])
        
        const expectedTables = [
            'users',
            'user_friends', 
            'friend_requests',
            'chat_conversations',
            'chat_messages',
            'moments',
            'moment_likes',
            'moment_comments'
        ]
        
        console.log('📊 数据库表列表:')
        tableNames.forEach(table => console.log(`  - ${table}`))
        
        // 检查必需的表
        const missingTables = expectedTables.filter(table => !tableNames.includes(table))
        if (missingTables.length > 0) {
            console.warn('⚠️ 缺少以下表:', missingTables)
        } else {
            console.log('✅ 所有必需的表都已创建')
        }
        
        // 检查测试数据
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users')
        const [friendCount] = await connection.query('SELECT COUNT(*) as count FROM user_friends')
        
        console.log('📊 数据统计:')
        console.log(`  - 用户数量: ${userCount[0].count}`)
        console.log(`  - 好友关系数量: ${friendCount[0].count}`)
        
        return {
            tables: tableNames,
            userCount: userCount[0].count,
            friendCount: friendCount[0].count,
            success: missingTables.length === 0
        }
        
    } catch (error) {
        console.error('❌ 数据库验证失败:', error.message)
        throw error
    }
}

/**
 * 主函数
 */
async function main() {
    let connection
    
    try {
        console.log('🚀 开始初始化叶语企业版数据库...')
        console.log('📋 配置信息:')
        console.log(`  - 数据库主机: ${dbConfig.host}`)
        console.log(`  - 数据库用户: ${dbConfig.user}`)
        console.log(`  - 数据库名称: ${DB_NAME}`)
        console.log(`  - 字符集: ${dbConfig.charset}`)
        
        // 连接数据库
        console.log('🔌 连接到MySQL服务器...')
        connection = await mysql.createConnection(dbConfig)
        
        // 检查连接
        await checkConnection(connection)
        
        // 执行初始化SQL文件
        const sqlFilePath = path.join(__dirname, 'init-complete-database.sql')
        await executeSqlFile(connection, sqlFilePath)
        
        // 验证初始化结果
        const validation = await validateDatabase(connection)
        
        if (validation.success) {
            console.log('🎉 数据库初始化完成！')
            console.log('📱 现在可以启动应用服务器了')
            console.log('🔗 启动命令: cd server && node app.js')
        } else {
            console.error('❌ 数据库初始化不完整，请检查错误信息')
            process.exit(1)
        }
        
    } catch (error) {
        console.error('💥 数据库初始化失败:', error.message)
        console.error('🔧 请检查:')
        console.error('  1. MySQL服务是否运行')
        console.error('  2. 数据库连接配置是否正确')
        console.error('  3. 用户是否有足够的权限')
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
            console.log('🔌 数据库连接已关闭')
        }
    }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 未处理的Promise拒绝:', reason)
    process.exit(1)
})

process.on('uncaughtException', (error) => {
    console.error('💥 未捕获的异常:', error)
    process.exit(1)
})

// 运行主函数
if (require.main === module) {
    main()
}

module.exports = { main, validateDatabase }
