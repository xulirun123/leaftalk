// 添加支付密码字段的数据库迁移脚本
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Lxr200311',
    database: 'leaftalk-new',
    charset: 'utf8mb4'
}

async function migratePayPasswordField() {
    let connection = null
    
    try {
        console.log('🔄 连接数据库...')
        connection = await mysql.createConnection(dbConfig)
        
        console.log('✅ 数据库连接成功')
        
        // 检查pay_password字段是否已存在
        const [columns] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'leaftalk-new'
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME = 'pay_password'
        `)
        
        const fieldExists = columns[0].count > 0
        
        if (fieldExists) {
            console.log('✅ pay_password字段已存在，无需添加')
        } else {
            console.log('🔄 添加pay_password字段...')
            
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN pay_password VARCHAR(255) DEFAULT NULL 
                COMMENT '支付密码(加密存储)'
            `)
            
            console.log('✅ pay_password字段添加成功')
        }
        
        // 显示users表结构确认
        console.log('\n📋 当前users表结构:')
        const [tableStructure] = await connection.execute('DESCRIBE users')
        console.table(tableStructure)
        
    } catch (error) {
        console.error('❌ 迁移失败:', error.message)
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
            console.log('🔌 数据库连接已关闭')
        }
    }
}

// 执行迁移
if (require.main === module) {
    migratePayPasswordField()
        .then(() => {
            console.log('🎉 迁移完成')
            process.exit(0)
        })
        .catch(error => {
            console.error('❌ 迁移失败:', error)
            process.exit(1)
        })
}

module.exports = { migratePayPasswordField }
