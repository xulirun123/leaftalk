/**
 * 查询用户密码
 */

const mysql = require('mysql2/promise')

async function checkPasswords() {
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

        // 查询用户密码
        const [users] = await connection.execute(
            `SELECT phone, password, nickname FROM users WHERE phone IN ('17872886622', '17872886600')`
        )

        console.log('📋 用户密码信息:')
        console.log('─'.repeat(60))
        users.forEach(user => {
            console.log(`手机号: ${user.phone}`)
            console.log(`昵称: ${user.nickname}`)
            console.log(`密码: ${user.password}`)
            console.log('─'.repeat(60))
        })

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
checkPasswords()

