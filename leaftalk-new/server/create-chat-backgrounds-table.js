// 创建聊天背景设置表
const dotenv = require('dotenv')
const path = require('path')
const mysql = require('mysql2/promise')

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true })

async function createChatBackgroundsTable() {
  let connection
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'leaftalk'
    })

    console.log('✅ 数据库连接成功')

    // 创建聊天背景设置表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS chat_backgrounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        chat_id VARCHAR(100) NOT NULL,
        background_type VARCHAR(20) NOT NULL DEFAULT 'default',
        background_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_chat (user_id, chat_id),
        INDEX idx_user_id (user_id),
        INDEX idx_chat_id (chat_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='用户聊天背景设置表';
    `

    await connection.execute(createTableSQL)
    console.log('✅ chat_backgrounds 表创建成功')

    // 检查表结构
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM chat_backgrounds
    `)
    
    console.log('\n📋 表结构:')
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`)
    })

    console.log('\n✅ 所有操作完成')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    throw error
  } finally {
    if (connection) {
      await connection.end()
      console.log('✅ 数据库连接已关闭')
    }
  }
}

// 执行脚本
createChatBackgroundsTable()
  .then(() => {
    console.log('\n🎉 脚本执行成功')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ 脚本执行失败:', error)
    process.exit(1)
  })

