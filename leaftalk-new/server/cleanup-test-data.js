// 清理测试数据脚本
require('dotenv').config({ path: '../.env' })
const mysql = require('mysql2/promise')

async function cleanupTestData() {
  let connection
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'leaftalk-new'
    })

    console.log('🔍 查看当前用户数据...')
    
    // 查看所有用户
    const [users] = await connection.execute(
      'SELECT id, username, nickname, phone, real_name, created_at FROM users ORDER BY id'
    )
    
    console.log('\n📋 当前用户列表:')
    console.log('ID\t用户名\t\t昵称\t\t手机号\t\t真实姓名\t创建时间')
    console.log('─'.repeat(80))
    
    users.forEach(user => {
      const createdAt = new Date(user.created_at).toLocaleString('zh-CN')
      console.log(`${user.id}\t${user.username || 'N/A'}\t\t${user.nickname || 'N/A'}\t\t${user.phone || 'N/A'}\t\t${user.real_name || 'N/A'}\t${createdAt}`)
    })

    console.log('\n🤔 请确认要保留的真实用户ID (多个ID用逗号分隔，例如: 1,2,6):')
    
    // 在Node.js中获取用户输入
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const keepUserIds = await new Promise((resolve) => {
      rl.question('要保留的用户ID: ', (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    })

    if (!keepUserIds) {
      console.log('❌ 未输入用户ID，操作取消')
      return
    }

    // 解析用户ID
    const idsToKeep = keepUserIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    
    if (idsToKeep.length === 0) {
      console.log('❌ 无效的用户ID，操作取消')
      return
    }

    console.log(`\n✅ 将保留用户ID: ${idsToKeep.join(', ')}`)
    console.log('🗑️ 开始清理其他测试数据...')

    // 开始事务
    await connection.beginTransaction()

    try {
      // 删除不需要的用户的相关数据
      const placeholders = idsToKeep.map(() => '?').join(',')
      
      // 1. 删除好友关系
      await connection.execute(
        `DELETE FROM friendships WHERE user_id NOT IN (${placeholders}) OR friend_id NOT IN (${placeholders})`,
        [...idsToKeep, ...idsToKeep]
      )
      console.log('✅ 清理了好友关系数据')

      // 2. 删除好友请求
      await connection.execute(
        `DELETE FROM friend_requests WHERE sender_id NOT IN (${placeholders}) OR receiver_id NOT IN (${placeholders})`,
        [...idsToKeep, ...idsToKeep]
      )
      console.log('✅ 清理了好友请求数据')

      // 3. 删除聊天消息
      await connection.execute(
        `DELETE FROM messages WHERE sender_id NOT IN (${placeholders}) OR receiver_id NOT IN (${placeholders})`,
        [...idsToKeep, ...idsToKeep]
      )
      console.log('✅ 清理了聊天消息数据')

      // 4. 删除聊天会话
      await connection.execute(
        `DELETE FROM chats WHERE user1_id NOT IN (${placeholders}) OR user2_id NOT IN (${placeholders})`,
        [...idsToKeep, ...idsToKeep]
      )
      console.log('✅ 清理了聊天会话数据')

      // 5. 最后删除用户
      await connection.execute(
        `DELETE FROM users WHERE id NOT IN (${placeholders})`,
        idsToKeep
      )
      console.log('✅ 清理了测试用户数据')

      // 提交事务
      await connection.commit()
      
      console.log('\n🎉 测试数据清理完成！')
      console.log('📱 现在通讯录应该只显示真实的联系人了')

      // 显示清理后的用户列表
      const [remainingUsers] = await connection.execute(
        'SELECT id, username, nickname, phone, real_name FROM users ORDER BY id'
      )
      
      console.log('\n📋 清理后的用户列表:')
      console.log('ID\t用户名\t\t昵称\t\t手机号\t\t真实姓名')
      console.log('─'.repeat(60))
      
      remainingUsers.forEach(user => {
        console.log(`${user.id}\t${user.username || 'N/A'}\t\t${user.nickname || 'N/A'}\t\t${user.phone || 'N/A'}\t\t${user.real_name || 'N/A'}`)
      })

    } catch (error) {
      // 回滚事务
      await connection.rollback()
      throw error
    }

  } catch (error) {
    console.error('❌ 清理过程中出错:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 运行清理脚本
cleanupTestData()
