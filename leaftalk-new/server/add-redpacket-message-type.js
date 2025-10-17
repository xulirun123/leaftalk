require('dotenv').config()
const mysql = require('mysql2/promise')

async function addRedPacketMessageType() {
  let connection = null
  
  try {
    console.log('🔧 连接数据库...')
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'leaftalk-new'
    })
    
    console.log('✅ 数据库连接成功')
    
    // 更新 messages 表的 type 字段，添加 redpacket 类型
    console.log('🔄 开始更新 messages.type 字段，添加 redpacket 类型...')
    await connection.execute(`
      ALTER TABLE messages
      MODIFY COLUMN \`type\` ENUM('text', 'image', 'voice', 'video', 'file', 'system', 'group_invite', 'contact', 'custom_emoji', 'link', 'location', 'announcement', 'redpacket') DEFAULT 'text'
    `)
    console.log('✅ messages.type 字段已更新，现在支持 redpacket 类型')
    
    console.log('✅ 所有操作完成！')
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message)
    console.error('完整错误:', error)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 数据库连接已关闭')
    }
  }
}

addRedPacketMessageType()

