// 调试数据库结构和数据
require('dotenv').config({ path: '../.env' })
const mysql = require('mysql2/promise')

async function debugDatabase() {
  let connection
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'leaftalk-new'
    })

    console.log('🔍 连接数据库成功，开始调试...')
    
    // 1. 查看所有表
    console.log('\n📋 数据库中的表:')
    const [tables] = await connection.execute('SHOW TABLES')
    tables.forEach(table => {
      const tableName = Object.values(table)[0]
      console.log(`  - ${tableName}`)
    })

    // 2. 查看users表结构和数据
    console.log('\n👥 users表结构:')
    const [userColumns] = await connection.execute('DESCRIBE users')
    userColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(可空)' : '(非空)'} ${col.Key ? `[${col.Key}]` : ''}`)
    })

    console.log('\n👥 users表数据:')
    const [users] = await connection.execute('SELECT id, username, nickname, phone, real_name FROM users ORDER BY id')
    if (users.length === 0) {
      console.log('  📱 没有用户数据')
    } else {
      users.forEach(user => {
        console.log(`  ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}, 手机: ${user.phone}, 真实姓名: ${user.real_name}`)
      })
    }

    // 3. 检查friendships表
    try {
      console.log('\n🤝 friendships表结构:')
      const [friendshipColumns] = await connection.execute('DESCRIBE friendships')
      friendshipColumns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(可空)' : '(非空)'} ${col.Key ? `[${col.Key}]` : ''}`)
      })

      console.log('\n🤝 friendships表数据:')
      const [friendships] = await connection.execute('SELECT * FROM friendships ORDER BY id')
      if (friendships.length === 0) {
        console.log('  📱 没有好友关系数据')
      } else {
        friendships.forEach(friendship => {
          console.log(`  ID: ${friendship.id}, 用户: ${friendship.user_id} -> 好友: ${friendship.friend_id}, 状态: ${friendship.status}`)
        })
      }
    } catch (error) {
      console.log('\n⚠️ friendships表不存在或查询失败:', error.message)
    }

    // 4. 检查friend_requests表
    try {
      console.log('\n📨 friend_requests表结构:')
      const [requestColumns] = await connection.execute('DESCRIBE friend_requests')
      requestColumns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(可空)' : '(非空)'} ${col.Key ? `[${col.Key}]` : ''}`)
      })

      console.log('\n📨 friend_requests表数据:')
      const [requests] = await connection.execute('SELECT * FROM friend_requests ORDER BY id')
      if (requests.length === 0) {
        console.log('  📱 没有好友请求数据')
      } else {
        requests.forEach(request => {
          console.log(`  ID: ${request.id}, 发送者: ${request.from_user_id || request.requester_id} -> 接收者: ${request.to_user_id || request.requestee_id}, 状态: ${request.status}`)
        })
      }
    } catch (error) {
      console.log('\n⚠️ friend_requests表不存在或查询失败:', error.message)
    }

    // 5. 检查messages表
    try {
      console.log('\n💬 messages表数据统计:')
      const [messageCount] = await connection.execute('SELECT COUNT(*) as count FROM messages')
      console.log(`  消息总数: ${messageCount[0].count}`)
      
      if (messageCount[0].count > 0) {
        const [recentMessages] = await connection.execute('SELECT sender_id, receiver_id, content FROM messages ORDER BY id DESC LIMIT 5')
        console.log('  最近5条消息:')
        recentMessages.forEach(msg => {
          console.log(`    ${msg.sender_id} -> ${msg.receiver_id}: ${msg.content.substring(0, 50)}...`)
        })
      }
    } catch (error) {
      console.log('\n⚠️ messages表不存在或查询失败:', error.message)
    }

    // 6. 模拟当前用户的联系人查询
    console.log('\n🔍 模拟联系人查询 (假设当前用户ID为2):')
    const currentUserId = 2
    
    // 尝试friendships表查询
    try {
      const [friendshipContacts] = await connection.execute(`
        SELECT u.id, u.yeyu_id, u.nickname, u.avatar, u.phone,
               f.created_at as friend_since, f.remark_name
        FROM friendships f
        JOIN users u ON (f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)
        WHERE f.status = 'accepted' AND u.id != ?
        ORDER BY f.created_at DESC
      `, [currentUserId, currentUserId, currentUserId])
      
      console.log(`  通过friendships表查询到 ${friendshipContacts.length} 个联系人:`)
      friendshipContacts.forEach(contact => {
        console.log(`    ${contact.nickname} (ID: ${contact.id})`)
      })
    } catch (error) {
      console.log('  friendships表查询失败:', error.message)
    }

    // 尝试friend_requests表查询
    try {
      const [requestContacts] = await connection.execute(`
        SELECT u.id, u.yeyu_id, u.nickname, u.avatar, u.phone,
               f.created_at as friend_since, NULL as remark_name
        FROM friend_requests f
        JOIN users u ON (f.requester_id = ? AND f.requestee_id = u.id) OR (f.requestee_id = ? AND f.requester_id = u.id)
        WHERE f.status = 'accepted' AND u.id != ?
        ORDER BY f.created_at DESC
      `, [currentUserId, currentUserId, currentUserId])
      
      console.log(`  通过friend_requests表查询到 ${requestContacts.length} 个联系人:`)
      requestContacts.forEach(contact => {
        console.log(`    ${contact.nickname} (ID: ${contact.id})`)
      })
    } catch (error) {
      console.log('  friend_requests表查询失败:', error.message)
    }

  } catch (error) {
    console.error('❌ 数据库调试失败:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 运行调试脚本
console.log('🚀 开始调试数据库...')
debugDatabase()
