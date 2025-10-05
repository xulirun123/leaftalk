
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 启动叶语后端服务...');

// 设置环境变量
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '8893';

// 启动后端服务
const backend = spawn('node', ['app.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit'
});

backend.on('close', (code) => {
  console.log(`后端服务退出，代码: ${code}`);
});

backend.on('error', (error) => {
  console.error('启动后端服务失败:', error);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭后端服务...');
  backend.kill('SIGINT');
  process.exit(0);
});
