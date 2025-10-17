const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function initGroupTables() {
  let connection

  try {
    // 尝试多个数据库账号
    const candidates = [
      { user: 'root', password: '' },
      { user: 'root', password: '123456' },
      { user: 'leaftalk', password: '' },
      { user: 'admin', password: '' }
    ]

    let connected = false
    for (const cand of candidates) {
      try {
        connection = await mysql.createConnection({
          host: 'localhost',
          user: cand.user,
          password: cand.password,
          database: 'leaftalk',
          multipleStatements: true
        })
        console.log(`✅ 数据库连接成功，使用账号: ${cand.user}`)
        connected = true
        break
      } catch (e) {
        console.log(`⚠️ 尝试账号 ${cand.user} 失败，继续尝试...`)
      }
    }

    if (!connected) {
      throw new Error('无法连接数据库，请检查数据库配置')
    }

    // 读取 SQL 文件
    const sqlFile = path.join(__dirname, 'create-group-tables.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    console.log('📄 执行 SQL 文件...')

    // 执行 SQL
    await connection.query(sql)

    console.log('✅ 群聊表创建成功！')
    console.log('📋 已创建的表：')
    console.log('  - groups (群聊表)')
    console.log('  - group_members (群成员表)')
    console.log('  - messages 表已添加索引以支持群聊消息')

  } catch (error) {
    console.error('❌ 初始化失败:', error)
    throw error
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 数据库连接已关闭')
    }
  }
}

// 执行初始化
initGroupTables()
  .then(() => {
    console.log('🎉 群聊表初始化完成！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 初始化失败:', error)
    process.exit(1)
  })

