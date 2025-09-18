#!/usr/bin/env node

/**
 * 检查表结构，特别是 friend_requests 表
 */

const mysql = require('mysql2/promise')

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'leaftalk-new',
    charset: 'utf8mb4'
}

async function checkTableStructure() {
    let connection

    try {
        console.log('🔍 检查表结构...')
        connection = await mysql.createConnection(dbConfig)

        // 检查 friend_requests 表结构
        console.log('\n📊 friend_requests 表结构:')
        const [columns] = await connection.query('DESCRIBE friend_requests')
        columns.forEach(col => {
            console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`)
        })

        // 检查表中的数据
        console.log('\n📊 friend_requests 表数据:')
        const [data] = await connection.query('SELECT * FROM friend_requests LIMIT 5')
        console.log('数据条数:', data.length)
        if (data.length > 0) {
            console.log('字段名:', Object.keys(data[0]))
            data.forEach((row, index) => {
                console.log(`  记录 ${index + 1}:`, row)
            })
        }

        // 检查 contacts 表结构
        console.log('\n📊 contacts 表结构:')
        const [contactColumns] = await connection.query('DESCRIBE contacts')
        contactColumns.forEach(col => {
            console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`)
        })

        // 检查 users 表结构
        console.log('\n📊 users 表结构:')
        const [userColumns] = await connection.query('DESCRIBE users')
        userColumns.forEach(col => {
            console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`)
        })

    } catch (error) {
        console.error('❌ 检查失败:', error.message)
        throw error
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

async function main() {
    try {
        await checkTableStructure()
    } catch (error) {
        console.error('💥 操作失败:', error.message)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { checkTableStructure }
