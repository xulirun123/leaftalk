/**
 * 添加"加我为好友时需要验证"字段到用户表
 */

const mysql = require('mysql2/promise')

async function addFriendVerificationField() {
    let connection

    try {
        // 创建数据库连接
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'leaftalk',
            password: 'password',
            database: 'leaftalk-new'
        })

        console.log('✅ 数据库连接成功\n')

        // 检查字段是否已存在
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = 'leaftalk-new' 
             AND TABLE_NAME = 'users' 
             AND COLUMN_NAME = 'require_friend_verification'`
        )

        if (columns.length > 0) {
            console.log('⚠️ 字段 require_friend_verification 已存在，跳过添加')
        } else {
            // 添加字段
            console.log('🔄 添加 require_friend_verification 字段...')
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN require_friend_verification TINYINT(1) DEFAULT 1 COMMENT '加我为好友时需要验证：1=需要验证，0=直接通过'
            `)
            console.log('✅ require_friend_verification 字段已添加')
        }

        // 显示更新后的表结构
        const [fields] = await connection.execute('DESCRIBE users')
        console.log('\n📋 更新后的 users 表结构:')
        console.log('─'.repeat(80))
        fields.forEach(field => {
            console.log(`  - ${field.Field} (${field.Type})${field.Comment ? ' - ' + field.Comment : ''}`)
        })
        console.log('─'.repeat(80))

        console.log('\n✅ 数据库迁移完成！')

    } catch (error) {
        console.error('❌ 错误:', error.message)
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

// 运行脚本
addFriendVerificationField()

