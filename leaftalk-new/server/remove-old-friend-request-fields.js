/**
 * 删除 friend_requests 表中的旧字段
 * 只保留 from_user_id 和 to_user_id
 */

const mysql = require('mysql2/promise')

async function removeOldFields() {
    let connection

    try {
        // 创建数据库连接
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'leaftalk',
            password: 'password',
            database: 'leaftalk-new'
        })

        console.log('✅ 数据库连接成功')

        // 检查表结构
        console.log('\n📋 当前 friend_requests 表结构:')
        const [columns] = await connection.execute(
            `SHOW COLUMNS FROM friend_requests`
        )
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`)
        })

        // 删除 requester_id 字段
        console.log('\n🔄 删除 requester_id 字段...')
        try {
            await connection.execute(
                `ALTER TABLE friend_requests DROP COLUMN requester_id`
            )
            console.log('✅ requester_id 字段已删除')
        } catch (error) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('⚠️  requester_id 字段不存在，跳过')
            } else {
                throw error
            }
        }

        // 删除 requestee_id 字段
        console.log('\n🔄 删除 requestee_id 字段...')
        try {
            await connection.execute(
                `ALTER TABLE friend_requests DROP COLUMN requestee_id`
            )
            console.log('✅ requestee_id 字段已删除')
        } catch (error) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('⚠️  requestee_id 字段不存在，跳过')
            } else {
                throw error
            }
        }

        // 显示更新后的表结构
        console.log('\n📋 更新后的 friend_requests 表结构:')
        const [newColumns] = await connection.execute(
            `SHOW COLUMNS FROM friend_requests`
        )
        newColumns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`)
        })

        console.log('\n✅ 数据库字段清理完成！')

    } catch (error) {
        console.error('❌ 错误:', error.message)
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
            console.log('\n👋 数据库连接已关闭')
        }
    }
}

// 运行脚本
removeOldFields()

