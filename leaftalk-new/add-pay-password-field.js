// 简单的数据库字段添加脚本
const mysql = require('mysql2/promise')

async function addPayPasswordField() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Lxr200311',
        database: 'leaftalk-new'
    })

    try {
        console.log('连接数据库成功')
        
        // 检查字段是否已存在
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'leaftalk-new' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'pay_password'
        `)

        if (columns.length > 0) {
            console.log('pay_password字段已存在')
        } else {
            console.log('添加pay_password字段...')
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN pay_password VARCHAR(255) DEFAULT NULL 
                COMMENT '支付密码(加密存储)'
            `)
            console.log('pay_password字段添加成功')
        }

        // 显示表结构
        const [structure] = await connection.execute('DESCRIBE users')
        console.log('当前users表结构:')
        structure.forEach(row => {
            console.log(`${row.Field}: ${row.Type} ${row.Null} ${row.Key} ${row.Default || ''} ${row.Extra || ''}`)
        })

    } catch (error) {
        console.error('操作失败:', error.message)
    } finally {
        await connection.end()
        console.log('数据库连接已关闭')
    }
}

addPayPasswordField()
