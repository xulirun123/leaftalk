#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 叶语项目服务器部署工具');
console.log('================================');

// 配置信息
const config = {
  // 服务器配置（请根据实际情况修改）
  server: {
    host: 'your-server-ip',
    user: 'root',
    port: 22,
    deployPath: '/var/www/leaftalk'
  },
  
  // 应用配置
  app: {
    frontendPort: 80,
    backendPort: 8893,
    domain: 'your-domain.com'
  }
};

function runCommand(command, description, options = {}) {
  console.log(`\n📋 ${description}...`);
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit', 
      cwd: options.cwd || __dirname,
      encoding: 'utf8'
    });
    console.log(`✅ ${description} 完成`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    if (!options.optional) {
      process.exit(1);
    }
    return null;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} 存在`);
    return true;
  } else {
    console.log(`❌ ${description} 不存在`);
    return false;
  }
}

function createDeploymentFiles() {
  console.log('\n📝 创建部署配置文件...');
  
  // 创建 Nginx 配置
  const nginxConfig = `
server {
    listen 80;
    server_name ${config.app.domain};
    
    # 前端静态文件
    location / {
        root ${config.server.deployPath}/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:${config.app.backendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket 支持
    location /socket.io/ {
        proxy_pass http://localhost:${config.app.backendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

  fs.writeFileSync('nginx-leaftalk.conf', nginxConfig);
  console.log('✅ Nginx 配置文件已创建');

  // 创建 PM2 配置
  const pm2Config = {
    apps: [{
      name: 'leaftalk-backend',
      script: 'server/app.js',
      cwd: config.server.deployPath,
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: config.app.backendPort
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }]
  };

  fs.writeFileSync('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)};`);
  console.log('✅ PM2 配置文件已创建');

  // 创建部署脚本
  const deployScript = `#!/bin/bash

# 叶语项目部署脚本
echo "🚀 开始部署叶语项目..."

# 创建部署目录
sudo mkdir -p ${config.server.deployPath}
sudo mkdir -p ${config.server.deployPath}/logs

# 安装系统依赖
echo "📦 安装系统依赖..."
sudo apt update
sudo apt install -y nginx nodejs npm mysql-server redis-server

# 安装 PM2
sudo npm install -g pm2

# 复制项目文件
echo "📁 复制项目文件..."
sudo cp -r dist/* ${config.server.deployPath}/
sudo cp -r server ${config.server.deployPath}/
sudo cp -r uploads ${config.server.deployPath}/
sudo cp ecosystem.config.js ${config.server.deployPath}/

# 安装后端依赖
echo "📦 安装后端依赖..."
cd ${config.server.deployPath}/server
sudo npm install --production

# 配置 Nginx
echo "🔧 配置 Nginx..."
sudo cp nginx-leaftalk.conf /etc/nginx/sites-available/leaftalk
sudo ln -sf /etc/nginx/sites-available/leaftalk /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 启动服务
echo "🚀 启动服务..."
cd ${config.server.deployPath}
sudo pm2 start ecosystem.config.js
sudo pm2 save
sudo pm2 startup

# 设置权限
sudo chown -R www-data:www-data ${config.server.deployPath}
sudo chmod -R 755 ${config.server.deployPath}

echo "✅ 部署完成！"
echo "🌐 访问地址: http://${config.app.domain}"
`;

  fs.writeFileSync('deploy.sh', deployScript);
  fs.chmodSync('deploy.sh', '755');
  console.log('✅ 部署脚本已创建');
}

function buildProject() {
  console.log('\n🏗️  构建项目...');
  
  // 清理旧构建
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  // 构建前端
  runCommand('npm run build', '构建前端项目');
  
  // 验证构建
  runCommand('node test-build.js', '验证构建结果');
  
  // 安装后端依赖
  runCommand('npm install --production', '安装后端依赖', { cwd: 'server' });
}

function createDeploymentPackage() {
  console.log('\n📦 创建部署包...');
  
  const deployFiles = [
    'dist',
    'server',
    'uploads',
    'nginx-leaftalk.conf',
    'ecosystem.config.js',
    'deploy.sh'
  ];
  
  // 创建部署目录
  const deployDir = 'deployment-package';
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deployDir);
  
  // 复制文件
  for (const file of deployFiles) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      if (stats.isDirectory()) {
        runCommand(`xcopy "${file}" "${deployDir}\\${file}" /E /I /H /Y`, `复制 ${file} 目录`, { silent: true });
      } else {
        fs.copyFileSync(file, path.join(deployDir, file));
      }
      console.log(`✅ 已复制 ${file}`);
    }
  }
  
  console.log(`✅ 部署包已创建在 ${deployDir} 目录`);
}

function showDeploymentInstructions() {
  console.log('\n📋 部署说明');
  console.log('================================');
  console.log('1. 修改配置信息:');
  console.log(`   - 编辑 deploy-to-server.js 中的 config 对象`);
  console.log(`   - 设置服务器 IP、域名等信息`);
  console.log('');
  console.log('2. 上传部署包到服务器:');
  console.log(`   scp -r deployment-package/* ${config.server.user}@${config.server.host}:${config.server.deployPath}/`);
  console.log('');
  console.log('3. 在服务器上执行部署:');
  console.log(`   ssh ${config.server.user}@${config.server.host}`);
  console.log(`   cd ${config.server.deployPath}`);
  console.log(`   chmod +x deploy.sh`);
  console.log(`   ./deploy.sh`);
  console.log('');
  console.log('4. 配置数据库:');
  console.log('   - 导入数据库结构: mysql -u root -p < database/FINAL_UNIFIED_SCHEMA.sql');
  console.log('   - 配置数据库连接信息');
  console.log('');
  console.log('5. 配置 SSL (可选):');
  console.log('   - 使用 Let\'s Encrypt: certbot --nginx -d your-domain.com');
  console.log('');
  console.log('🎉 部署完成后访问: http://your-domain.com');
}

function main() {
  console.log('\n🔍 步骤 1: 检查项目结构');
  
  const requiredFiles = [
    { path: 'package.json', desc: '前端 package.json' },
    { path: 'server/package.json', desc: '后端 package.json' },
    { path: 'server/app.js', desc: '后端主文件' },
    { path: 'src/main.ts', desc: '前端主文件' }
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.error('\n❌ 项目文件不完整，请检查项目结构');
    process.exit(1);
  }
  
  buildProject();
  createDeploymentFiles();
  createDeploymentPackage();
  showDeploymentInstructions();
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('\n❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

main();
