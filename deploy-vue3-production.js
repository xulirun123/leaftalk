const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署Vue3生产版本到服务器...');

// 服务器配置
const SERVER_IP = '120.24.148.204';
const SERVER_USER = 'root';
const REMOTE_PATH = '/var/www/leaftalk';
const LOCAL_DIST_PATH = './leaftalk-new/dist';

try {
  // 1. 检查本地dist目录
  if (!fs.existsSync(LOCAL_DIST_PATH)) {
    throw new Error('❌ 本地dist目录不存在，请先运行 npm run build');
  }

  console.log('✅ 本地dist目录检查通过');

  // 2. 创建服务器目录
  console.log('📁 创建服务器目录...');
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "mkdir -p ${REMOTE_PATH}/frontend-vue3"`, {
    stdio: 'inherit'
  });

  // 3. 上传dist文件
  console.log('📤 上传Vue3前端文件...');
  execSync(`scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r ${LOCAL_DIST_PATH}/* ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/frontend-vue3/`, {
    stdio: 'inherit'
  });

  // 4. 创建Vue3前端服务器脚本
  const vue3ServerScript = `
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080;

// 启用CORS
app.use(cors());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'frontend-vue3')));

// API代理到后端
app.use('/api', (req, res) => {
  // 简单的健康检查
  if (req.path === '/health') {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      server: '叶语 (YeYu) Vue3前端服务器',
      frontend: 'Vue3 + Vite',
      backend: 'Node.js + Express'
    });
    return;
  }
  
  // 其他API请求返回模拟数据
  res.json({
    success: false,
    message: '后端API服务尚未启动，这是前端模拟响应',
    timestamp: new Date().toISOString()
  });
});

// Vue Router支持 - 所有路由都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-vue3', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🍃 叶语Vue3前端服务器启动成功！\`);
  console.log(\`📱 访问地址: http://localhost:\${PORT}\`);
  console.log(\`🌐 外网访问: http://120.24.148.204:\${PORT}\`);
  console.log(\`⚡ 前端技术栈: Vue3 + Vite + TypeScript + Pinia\`);
  console.log(\`🎨 UI风格: WeChat移动端风格\`);
  console.log(\`📊 API健康检查: http://120.24.148.204:\${PORT}/api/health\`);
});
`;

  // 5. 上传Vue3服务器脚本
  console.log('📝 创建Vue3服务器脚本...');
  fs.writeFileSync('vue3-production-server.js', vue3ServerScript);
  
  execSync(`scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null vue3-production-server.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/`, {
    stdio: 'inherit'
  });

  // 6. 停止旧服务并启动新服务
  console.log('🔄 重启Vue3前端服务...');
  
  // 停止所有相关的PM2进程
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_PATH} && pm2 delete leaftalk-frontend leaftalk-frontend-new leaftalk-vue3-frontend || true"`, {
    stdio: 'inherit'
  });

  // 启动新的Vue3服务
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_PATH} && pm2 start vue3-production-server.js --name leaftalk-vue3-production"`, {
    stdio: 'inherit'
  });

  // 保存PM2配置
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "pm2 save"`, {
    stdio: 'inherit'
  });

  console.log('✅ Vue3生产版本部署完成！');
  console.log('');
  console.log('🎉 部署成功信息:');
  console.log('📱 前端访问地址: http://120.24.148.204:8080/');
  console.log('📊 API健康检查: http://120.24.148.204:8080/api/health');
  console.log('🔧 PM2进程名称: leaftalk-vue3-production');
  console.log('📁 服务器路径: /var/www/leaftalk/frontend-vue3/');
  console.log('');
  console.log('🛠️ 管理命令:');
  console.log('查看状态: ssh root@120.24.148.204 "pm2 list"');
  console.log('查看日志: ssh root@120.24.148.204 "pm2 logs leaftalk-vue3-production"');
  console.log('重启服务: ssh root@120.24.148.204 "pm2 restart leaftalk-vue3-production"');

  // 清理临时文件
  fs.unlinkSync('vue3-production-server.js');

} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}
