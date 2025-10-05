
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动叶语完整应用...');

// 启动后端
console.log('📡 启动后端服务...');
const backend = spawn('node', ['backend-server.js'], {
  stdio: 'inherit'
});

// 等待一秒后启动前端
setTimeout(() => {
  console.log('🌐 启动前端服务...');
  const frontend = spawn('node', ['frontend-server.js'], {
    stdio: 'inherit'
  });
  
  frontend.on('error', (error) => {
    console.error('启动前端服务失败:', error);
  });
}, 1000);

backend.on('error', (error) => {
  console.error('启动后端服务失败:', error);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭所有服务...');
  backend.kill('SIGINT');
  process.exit(0);
});

console.log('\n🎉 服务启动完成！');
console.log('📱 前端访问地址: http://localhost:3000');
console.log('🔧 后端 API 地址: http://localhost:8893');
console.log('\n按 Ctrl+C 停止所有服务');
