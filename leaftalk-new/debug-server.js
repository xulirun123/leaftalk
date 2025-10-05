// 调试服务器启动问题
require('dotenv').config({ path: './.env' })

console.log('🔍 开始诊断服务器启动问题...')

// 1. 检查环境变量
console.log('\n📋 环境变量检查:')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)
console.log('PORT:', process.env.PORT)

// 2. 检查依赖模块
console.log('\n📦 依赖模块检查:')
try {
  const express = require('express')
  console.log('✅ express 模块正常')
} catch (e) {
  console.log('❌ express 模块错误:', e.message)
}

try {
  const mysql = require('mysql2/promise')
  console.log('✅ mysql2 模块正常')
} catch (e) {
  console.log('❌ mysql2 模块错误:', e.message)
}

try {
  const socketIo = require('socket.io')
  console.log('✅ socket.io 模块正常')
} catch (e) {
  console.log('❌ socket.io 模块错误:', e.message)
}

// 3. 测试数据库连接
console.log('\n🗄️ 数据库连接测试:')
async function testDatabase() {
  try {
    const mysql = require('mysql2/promise')
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'leaftalk-new'
    })
    
    console.log('✅ 数据库连接成功')
    await connection.end()
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message)
  }
}

// 4. 测试端口
console.log('\n🔌 端口测试:')
function testPort() {
  const net = require('net')
  const port = process.env.PORT || 8893
  
  const server = net.createServer()
  
  server.listen(port, () => {
    console.log(`✅ 端口 ${port} 可用`)
    server.close()
  })
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`❌ 端口 ${port} 被占用`)
    } else {
      console.log(`❌ 端口测试错误:`, err.message)
    }
  })
}

// 5. 尝试启动简单的Express服务器
console.log('\n🚀 简单服务器测试:')
async function testSimpleServer() {
  try {
    const express = require('express')
    const app = express()
    const port = 8894 // 使用不同端口避免冲突
    
    app.get('/test', (req, res) => {
      res.json({ message: '测试服务器正常' })
    })
    
    const server = app.listen(port, () => {
      console.log(`✅ 测试服务器启动成功，端口: ${port}`)
      setTimeout(() => {
        server.close(() => {
          console.log('✅ 测试服务器已关闭')
        })
      }, 2000)
    })
    
    server.on('error', (err) => {
      console.log('❌ 测试服务器启动失败:', err.message)
    })
    
  } catch (error) {
    console.log('❌ 测试服务器错误:', error.message)
  }
}

// 运行所有测试
async function runDiagnostics() {
  await testDatabase()
  testPort()
  await testSimpleServer()
  
  console.log('\n🎯 诊断完成！')
}

runDiagnostics().catch(console.error)
