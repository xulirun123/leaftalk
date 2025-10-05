const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始完整部署Vue3构建文件到服务器...');

// 服务器配置
const SERVER_IP = '120.24.148.204';
const SERVER_USER = 'root';
const SERVER_PASSWORD = '314077060@qq.com';
const REMOTE_PATH = '/var/www/leaftalk';
const LOCAL_DIST_PATH = './leaftalk-new/dist';

try {
  // 1. 检查本地dist目录
  if (!fs.existsSync(LOCAL_DIST_PATH)) {
    throw new Error('❌ 本地dist目录不存在，请先运行 npm run build');
  }

  console.log('✅ 本地dist目录检查通过');
  
  // 显示dist目录内容
  const distFiles = fs.readdirSync(LOCAL_DIST_PATH);
  console.log('📁 dist目录内容:', distFiles);

  // 2. 停止当前服务
  console.log('🛑 停止当前前端服务...');
  try {
    execSync(`echo "${SERVER_PASSWORD}" | ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "pm2 stop all"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.log('⚠️ 停止服务时出现错误，继续部署...');
  }

  // 3. 备份现有文件
  console.log('💾 备份现有文件...');
  try {
    execSync(`echo "${SERVER_PASSWORD}" | ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_PATH} && cp -r . backup-$(date +%Y%m%d-%H%M%S) || true"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.log('⚠️ 备份时出现错误，继续部署...');
  }

  // 4. 清理并创建目录
  console.log('🗂️ 准备部署目录...');
  execSync(`echo "${SERVER_PASSWORD}" | ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "rm -rf ${REMOTE_PATH}/frontend && mkdir -p ${REMOTE_PATH}/frontend"`, {
    stdio: 'inherit'
  });

  // 5. 分批上传文件
  console.log('📤 开始分批上传Vue3构建文件...');

  // 上传index.html
  console.log('📄 上传 index.html...');
  execSync(`echo "${SERVER_PASSWORD}" | scp -o StrictHostKeyChecking=no ${LOCAL_DIST_PATH}/index.html ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/frontend/`, {
    stdio: 'inherit'
  });

  // 上传manifest.json等小文件
  const smallFiles = ['manifest.json', 'sw.js', 'test.html', 'test-audio.html', 'download-dict.js', 'pinyin-dict.json'];
  for (const file of smallFiles) {
    const filePath = path.join(LOCAL_DIST_PATH, file);
    if (fs.existsSync(filePath)) {
      console.log(`📄 上传 ${file}...`);
      try {
        execSync(`echo "${SERVER_PASSWORD}" | scp -o StrictHostKeyChecking=no ${filePath} ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/frontend/`, {
          stdio: 'inherit'
        });
      } catch (error) {
        console.log(`⚠️ 上传 ${file} 失败，跳过...`);
      }
    }
  }

  // 创建assets目录并分批上传
  console.log('📁 创建assets目录...');
  execSync(`echo "${SERVER_PASSWORD}" | ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "mkdir -p ${REMOTE_PATH}/frontend/assets"`, {
    stdio: 'inherit'
  });

  // 分批上传assets文件
  const assetsPath = path.join(LOCAL_DIST_PATH, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    console.log(`📦 发现 ${assetFiles.length} 个assets文件，开始分批上传...`);

    // 分组上传（每次10个文件）
    const batchSize = 10;
    for (let i = 0; i < assetFiles.length; i += batchSize) {
      const batch = assetFiles.slice(i, i + batchSize);
      console.log(`📤 上传第 ${Math.floor(i/batchSize) + 1} 批assets文件 (${batch.length} 个)...`);
      
      for (const file of batch) {
        const filePath = path.join(assetsPath, file);
        try {
          execSync(`echo "${SERVER_PASSWORD}" | scp -o StrictHostKeyChecking=no "${filePath}" ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/frontend/assets/`, {
            stdio: 'pipe'
          });
        } catch (error) {
          console.log(`⚠️ 上传 ${file} 失败，跳过...`);
        }
      }
    }
  }

  // 上传其他目录
  const directories = ['images', 'sounds', 'music', 'templates'];
  for (const dir of directories) {
    const dirPath = path.join(LOCAL_DIST_PATH, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 上传 ${dir} 目录...`);
      try {
        execSync(`echo "${SERVER_PASSWORD}" | scp -o StrictHostKeyChecking=no -r "${dirPath}" ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/frontend/`, {
          stdio: 'inherit'
        });
      } catch (error) {
        console.log(`⚠️ 上传 ${dir} 目录失败，跳过...`);
      }
    }
  }

  // 6. 创建Vue3服务器脚本
  const vue3ServerScript = `
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// 启用CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 静态文件服务 - 指向frontend目录
app.use(express.static(path.join(__dirname, 'frontend')));

// API健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    server: '叶语 (YeYu) Vue3前端服务器',
    frontend: 'Vue3 + Vite + TypeScript + Pinia',
    backend: 'Node.js + Express',
    ui: 'WeChat移动端风格'
  });
});

// 其他API请求返回模拟数据
app.use('/api', (req, res) => {
  res.json({
    success: false,
    message: '后端API服务尚未启动，这是前端模拟响应',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Vue Router支持 - 所有路由都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🍃 叶语Vue3前端服务器启动成功！\`);
  console.log(\`📱 本地访问: http://localhost:\${PORT}\`);
  console.log(\`🌐 外网访问: http://120.24.148.204:\${PORT}\`);
  console.log(\`⚡ 技术栈: Vue3 + Vite + TypeScript + Pinia\`);
  console.log(\`🎨 UI风格: WeChat移动端风格\`);
  console.log(\`📊 API健康检查: http://120.24.148.204:\${PORT}/api/health\`);
  console.log(\`📁 静态文件目录: \${path.join(__dirname, 'frontend')}\`);
});
`;

  // 7. 上传Vue3服务器脚本
  console.log('📝 创建并上传Vue3服务器脚本...');
  fs.writeFileSync('vue3-production-server.js', vue3ServerScript);
  
  execSync(`echo "${SERVER_PASSWORD}" | scp -o StrictHostKeyChecking=no vue3-production-server.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/`, {
    stdio: 'inherit'
  });

  // 8. 启动新的Vue3服务
  console.log('🚀 启动Vue3前端服务...');
  execSync(`echo "${SERVER_PASSWORD}" | ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_PATH} && pm2 start vue3-production-server.js --name leaftalk-vue3-frontend"`, {
    stdio: 'inherit'
  });

  // 9. 保存PM2配置
  execSync(`echo "${SERVER_PASSWORD}" | ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "pm2 save"`, {
    stdio: 'inherit'
  });

  console.log('✅ Vue3前端完整部署成功！');
  console.log('');
  console.log('🎉 部署完成信息:');
  console.log('📱 前端访问地址: http://120.24.148.204:8080/');
  console.log('📊 API健康检查: http://120.24.148.204:8080/api/health');
  console.log('🔧 PM2进程名称: leaftalk-vue3-frontend');
  console.log('📁 前端文件路径: /var/www/leaftalk/frontend/');
  console.log('');
  console.log('🛠️ 管理命令:');
  console.log('查看状态: ssh root@120.24.148.204 "pm2 list"');
  console.log('查看日志: ssh root@120.24.148.204 "pm2 logs leaftalk-vue3-frontend"');
  console.log('重启服务: ssh root@120.24.148.204 "pm2 restart leaftalk-vue3-frontend"');

  // 清理临时文件
  fs.unlinkSync('vue3-production-server.js');

} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}
