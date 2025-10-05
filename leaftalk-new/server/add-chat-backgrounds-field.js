// 添加 chat_backgrounds 字段到 user_settings 表
const dotenv = require('dotenv')
const path = require('path')
const mysql = require('mysql2/promise')

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true })

async function addChatBackgroundsField() {
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

    // 检查字段是否已存在
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM user_settings LIKE 'chat_backgrounds'
    `)

    if (columns.length > 0) {
      console.log('⚠️ chat_backgrounds 字段已存在，跳过创建')
      return
    }

    // 添加 chat_backgrounds 字段
    await connection.execute(`
      ALTER TABLE user_settings
      ADD COLUMN chat_backgrounds JSON NULL
      COMMENT '聊天背景设置（JSON格式，按chatId存储）'
    `)

    console.log('✅ chat_backgrounds 字段添加成功')

    // 检查表结构
    const [allColumns] = await connection.execute(`
      SHOW COLUMNS FROM user_settings
    `)
    
    console.log('\n📋 user_settings 表结构:')
    allColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`)
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
addChatBackgroundsField()
  .then(() => {
    console.log('\n🎉 脚本执行成功')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ 脚本执行失败:', error)
    process.exit(1)
  })

