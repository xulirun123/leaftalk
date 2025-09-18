// 删除数据库中的测试数据
require('dotenv').config({ path: '../.env' })
const mysql = require('mysql2/promise')

async function removeTestData() {
  let connection
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'leaftalk-new'
    })

    console.log('🔍 连接数据库成功，开始清理测试数据...')
    
    // 开始事务
    await connection.beginTransaction()

    try {
      // 1. 删除测试用户的好友关系
      console.log('🧹 清理测试好友关系...')
      const [friendships] = await connection.execute(
        `DELETE FROM friendships WHERE 
         (user_id IN (1,2,3) OR friend_id IN (1,2,3)) AND
         (remark_name LIKE '%测试%' OR remark_name LIKE '%好友%')`
      )
      console.log(`✅ 删除了 ${friendships.affectedRows} 条测试好友关系`)

      // 2. 删除测试用户的好友请求
      console.log('🧹 清理测试好友请求...')
      const [requests] = await connection.execute(
        `DELETE FROM friend_requests WHERE 
         sender_id IN (1,2,3) OR receiver_id IN (1,2,3)`
      )
      console.log(`✅ 删除了 ${requests.affectedRows} 条测试好友请求`)

      // 3. 删除测试聊天消息
      console.log('🧹 清理测试聊天消息...')
      const [messages] = await connection.execute(
        `DELETE FROM messages WHERE 
         sender_id IN (1,2,3) OR receiver_id IN (1,2,3) OR
         content LIKE '%测试%' OR content LIKE '%hello%' OR content LIKE '%你好%'`
      )
      console.log(`✅ 删除了 ${messages.affectedRows} 条测试消息`)

      // 4. 删除测试聊天会话
      console.log('🧹 清理测试聊天会话...')
      const [chats] = await connection.execute(
        `DELETE FROM chats WHERE 
         user1_id IN (1,2,3) OR user2_id IN (1,2,3)`
      )
      console.log(`✅ 删除了 ${chats.affectedRows} 个测试聊天会话`)

      // 5. 删除明显的测试用户（保留真实用户）
      console.log('🧹 清理明显的测试用户...')
      
      // 先查看哪些用户可能是测试用户
      const [testUsers] = await connection.execute(
        `SELECT id, username, nickname, phone, real_name FROM users WHERE 
         username IN ('user001', 'user002', 'user003', 'zhangsan', 'lisi', 'wangwu') OR
         nickname IN ('张三', '李四', '王五', '测试用户', '王大力', '刘美丽', '陈小华') OR
         phone LIKE '138001380%'`
      )
      
      if (testUsers.length > 0) {
        console.log('🔍 发现以下测试用户:')
        testUsers.forEach(user => {
          console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}, 手机: ${user.phone}`)
        })
        
        // 删除这些测试用户
        const testUserIds = testUsers.map(u => u.id)
        const placeholders = testUserIds.map(() => '?').join(',')
        
        const [deletedUsers] = await connection.execute(
          `DELETE FROM users WHERE id IN (${placeholders})`,
          testUserIds
        )
        console.log(`✅ 删除了 ${deletedUsers.affectedRows} 个测试用户`)
      } else {
        console.log('✅ 没有发现明显的测试用户')
      }

      // 提交事务
      await connection.commit()
      
      console.log('\n🎉 测试数据清理完成！')
      console.log('📱 现在通讯录应该只显示真实的联系人了')
      
      // 显示清理后的统计
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users')
      const [friendCount] = await connection.execute('SELECT COUNT(*) as count FROM friendships')
      const [messageCount] = await connection.execute('SELECT COUNT(*) as count FROM messages')
      
      console.log('\n📊 清理后的数据统计:')
      console.log(`  - 用户数量: ${userCount[0].count}`)
      console.log(`  - 好友关系: ${friendCount[0].count}`)
      console.log(`  - 消息数量: ${messageCount[0].count}`)

    } catch (error) {
      // 回滚事务
      await connection.rollback()
      throw error
    }

  } catch (error) {
    console.error('❌ 清理过程中出错:', error.message)
    console.log('💡 请检查数据库连接配置')
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 运行清理脚本
console.log('🚀 开始清理数据库中的测试数据...')
console.log('⚠️  这将删除所有测试用户和相关数据')
console.log('📝 请确保已备份重要数据')
console.log('')

removeTestData()
