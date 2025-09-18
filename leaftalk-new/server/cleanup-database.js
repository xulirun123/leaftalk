// 清理数据库中的测试数据
require('dotenv').config({ path: '../.env' })
const mysql = require('mysql2/promise')

async function cleanupDatabase() {
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
      // 1. 查看当前有哪些用户
      console.log('\n📋 当前数据库中的用户:')
      const [allUsers] = await connection.execute(
        'SELECT id, username, nickname, phone, real_name FROM users ORDER BY id'
      )
      allUsers.forEach(user => {
        console.log(`  ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}, 手机: ${user.phone}`)
      })

      // 2. 删除明显的测试用户
      console.log('\n🧹 删除测试用户...')
      const [deletedUsers] = await connection.execute(`
        DELETE FROM users WHERE 
        nickname IN ('张三', '李四', '王五', '测试用户', '王大力', '刘美丽', '陈小华') OR
        username IN ('zhangsan', 'lisi', 'wangwu', 'user001', 'user002', 'user003') OR
        phone LIKE '138001380%'
      `)
      console.log(`✅ 删除了 ${deletedUsers.affectedRows} 个测试用户`)

      // 3. 删除测试好友关系
      console.log('\n🧹 清理测试好友关系...')
      const [deletedFriendships] = await connection.execute(`
        DELETE FROM friendships WHERE 
        user_id NOT IN (SELECT id FROM users) OR 
        friend_id NOT IN (SELECT id FROM users)
      `)
      console.log(`✅ 删除了 ${deletedFriendships.affectedRows} 条无效好友关系`)

      // 4. 删除测试好友请求
      console.log('\n🧹 清理测试好友请求...')
      const [deletedRequests] = await connection.execute(`
        DELETE FROM friend_requests WHERE 
        from_user_id NOT IN (SELECT id FROM users) OR 
        to_user_id NOT IN (SELECT id FROM users)
      `)
      console.log(`✅ 删除了 ${deletedRequests.affectedRows} 条无效好友请求`)

      // 5. 删除测试消息
      console.log('\n🧹 清理测试消息...')
      const [deletedMessages] = await connection.execute(`
        DELETE FROM messages WHERE 
        sender_id NOT IN (SELECT id FROM users) OR 
        receiver_id NOT IN (SELECT id FROM users) OR
        content LIKE '%测试%' OR content LIKE '%hello%' OR content LIKE '%你好%'
      `)
      console.log(`✅ 删除了 ${deletedMessages.affectedRows} 条测试消息`)

      // 提交事务
      await connection.commit()
      
      console.log('\n🎉 数据库清理完成！')
      
      // 显示清理后的用户列表
      console.log('\n📋 清理后的用户列表:')
      const [remainingUsers] = await connection.execute(
        'SELECT id, username, nickname, phone, real_name FROM users ORDER BY id'
      )
      
      if (remainingUsers.length === 0) {
        console.log('  📱 数据库中没有用户了')
      } else {
        remainingUsers.forEach(user => {
          console.log(`  ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}, 手机: ${user.phone}`)
        })
      }
      
      // 显示统计信息
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
    console.error('❌ 数据库清理失败:', error.message)
    console.log('💡 请检查数据库连接配置和权限')
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 运行清理脚本
console.log('🚀 开始清理数据库中的测试数据...')
console.log('⚠️  这将删除所有测试用户和相关数据')
console.log('')

cleanupDatabase()
