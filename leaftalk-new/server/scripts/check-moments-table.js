const mysql = require('mysql2/promise')

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'leaftalk-new',
    charset: 'utf8mb4'
}

async function checkMomentsTable() {
    let connection
    try {
        console.log('🔄 连接数据库...')
        connection = await mysql.createConnection(dbConfig)
        
        // 检查moments表是否存在
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'moments'
        `, [dbConfig.database])
        
        if (tables.length === 0) {
            console.log('❌ moments表不存在')
            return
        }
        
        console.log('✅ moments表存在')
        
        // 查看表结构
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'moments'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database])
        
        console.log('📋 moments表结构:')
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`)
        })
        
        // 查看表中的数据
        const [moments] = await connection.execute('SELECT COUNT(*) as count FROM moments')
        console.log(`📊 moments表中有 ${moments[0].count} 条记录`)
        
        if (moments[0].count > 0) {
            const [sampleMoments] = await connection.execute(`
                SELECT m.*, u.nickname 
                FROM moments m 
                LEFT JOIN users u ON m.user_id = u.id 
                LIMIT 3
            `)
            
            console.log('📋 示例数据:')
            sampleMoments.forEach((moment, index) => {
                console.log(`  ${index + 1}. ID: ${moment.id}, 用户: ${moment.nickname || moment.user_id}, 内容: ${moment.content}`)
            })
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error)
    } finally {
        if (connection) {
            await connection.end()
            console.log('🔚 数据库连接已关闭')
        }
    }
}

// 运行脚本
checkMomentsTable()
