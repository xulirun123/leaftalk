#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 启动WebRTC信令服务器...')

// 启动WebRTC信令服务器
const webrtcServer = spawn('node', ['app.js'], {
  cwd: __dirname,
  stdio: 'inherit'
})

webrtcServer.on('error', (error) => {
  console.error('❌ WebRTC服务器启动失败:', error)
  process.exit(1)
})

webrtcServer.on('exit', (code) => {
  console.log(`📴 WebRTC服务器退出，代码: ${code}`)
  process.exit(code)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('📴 收到SIGTERM信号，正在关闭WebRTC服务器...')
  webrtcServer.kill('SIGTERM')
})

process.on('SIGINT', () => {
  console.log('📴 收到SIGINT信号，正在关闭WebRTC服务器...')
  webrtcServer.kill('SIGINT')
})

console.log('✅ WebRTC信令服务器启动脚本运行中...')
console.log('📞 WebRTC服务器地址: http://localhost:8894')
console.log('📊 健康检查: http://localhost:8894/health')
console.log('📈 服务器状态: http://localhost:8894/status')
