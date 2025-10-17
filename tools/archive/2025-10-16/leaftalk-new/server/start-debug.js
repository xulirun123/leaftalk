// 调试启动脚本
console.log('🔍 开始启动服务器...')

try {
  require('./app.js')
  console.log('✅ 服务器启动成功')
} catch (error) {
  console.error('❌ 服务器启动失败:')
  console.error(error)
  process.exit(1)
}

