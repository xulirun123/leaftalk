#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

console.log('🚀 叶语项目简单部署工具');
console.log('================================');

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
      throw error;
    }
    return null;
  }
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 100; port++) {
    if (await checkPort(port)) {
      return port;
    }
  }
  return null;
}

function createStaticServer() {
  console.log('\n🌐 创建静态文件服务器...');
  
  const serverCode = `
const express = require('express');
const path = require('path');
const app = express();

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'dist')));

// 处理 SPA 路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🌐 前端服务器运行在 http://localhost:\${PORT}\`);
});
`;

  fs.writeFileSync('frontend-server.js', serverCode);
  console.log('✅ 前端服务器文件已创建');
}

function createBackendStartScript() {
  console.log('\n🔧 创建后端启动脚本...');
  
  const startScript = `
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
  console.log(\`后端服务退出，代码: \${code}\`);
});

backend.on('error', (error) => {
  console.error('启动后端服务失败:', error);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\\n正在关闭后端服务...');
  backend.kill('SIGINT');
  process.exit(0);
});
`;

  fs.writeFileSync('backend-server.js', startScript);
  console.log('✅ 后端启动脚本已创建');
}

function createStartAllScript() {
  console.log('\n📝 创建一键启动脚本...');
  
  const startAllScript = `
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
  console.log('\\n正在关闭所有服务...');
  backend.kill('SIGINT');
  process.exit(0);
});

console.log('\\n🎉 服务启动完成！');
console.log('📱 前端访问地址: http://localhost:3000');
console.log('🔧 后端 API 地址: http://localhost:8893');
console.log('\\n按 Ctrl+C 停止所有服务');
`;

  fs.writeFileSync('start-all.js', startAllScript);
  console.log('✅ 一键启动脚本已创建');
}

function createPackageJson() {
  console.log('\n📦 创建部署 package.json...');
  
  const packageJson = {
    "name": "leaftalk-deployment",
    "version": "1.0.0",
    "description": "叶语项目部署包",
    "main": "start-all.js",
    "scripts": {
      "start": "node start-all.js",
      "frontend": "node frontend-server.js",
      "backend": "node backend-server.js",
      "install-deps": "npm install && cd server && npm install"
    },
    "dependencies": {
      "express": "^4.18.2"
    }
  };
  
  fs.writeFileSync('deployment-package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ 部署 package.json 已创建');
}

function createDeploymentInstructions() {
  console.log('\n📋 创建部署说明...');
  
  const instructions = `
# 叶语项目部署说明

## 🚀 快速部署

### 1. 安装依赖
\`\`\`bash
npm install
cd server && npm install
\`\`\`

### 2. 启动服务
\`\`\`bash
# 启动所有服务
node start-all.js

# 或分别启动
node backend-server.js  # 后端服务
node frontend-server.js # 前端服务
\`\`\`

### 3. 访问应用
- 前端: http://localhost:3000
- 后端: http://localhost:8893

## 📁 文件说明

- \`start-all.js\` - 一键启动所有服务
- \`frontend-server.js\` - 前端静态文件服务器
- \`backend-server.js\` - 后端服务启动器
- \`dist/\` - 前端构建文件
- \`server/\` - 后端源码
- \`uploads/\` - 文件上传目录

## 🔧 配置

### 环境变量
在 \`server/.env\` 文件中配置：
\`\`\`
NODE_ENV=production
PORT=8893
DB_HOST=localhost
DB_PORT=3306
DB_NAME=leaftalk
DB_USER=your_user
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
\`\`\`

### 数据库
1. 安装 MySQL 和 Redis
2. 导入数据库结构: \`mysql -u root -p leaftalk < database/FINAL_UNIFIED_SCHEMA.sql\`
3. 配置数据库连接信息

## 🌐 生产部署

### 使用 PM2 (推荐)
\`\`\`bash
npm install -g pm2
pm2 start start-all.js --name leaftalk
pm2 save
pm2 startup
\`\`\`

### 使用 Nginx 反向代理
\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:8893;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

## 🔍 故障排除

1. **端口冲突**: 修改 \`PORT\` 环境变量
2. **数据库连接失败**: 检查数据库配置和服务状态
3. **文件权限问题**: 确保 \`uploads\` 目录可写

## 📞 技术支持

如有问题，请检查：
1. Node.js 版本 (推荐 18+)
2. 数据库服务状态
3. 端口是否被占用
4. 防火墙设置
`;

  fs.writeFileSync('DEPLOYMENT_README.md', instructions);
  console.log('✅ 部署说明已创建');
}

async function main() {
  try {
    console.log('\n🔍 步骤 1: 检查构建文件');
    if (!fs.existsSync('dist')) {
      console.log('❌ 构建文件不存在，正在构建...');
      runCommand('npm run build', '构建前端项目');
    } else {
      console.log('✅ 构建文件已存在');
    }
    
    console.log('\n🔍 步骤 2: 检查后端文件');
    if (!fs.existsSync('server/app.js')) {
      console.error('❌ 后端文件不存在，请检查 server 目录');
      process.exit(1);
    }
    console.log('✅ 后端文件存在');
    
    console.log('\n🔍 步骤 3: 创建部署文件');
    createStaticServer();
    createBackendStartScript();
    createStartAllScript();
    createPackageJson();
    createDeploymentInstructions();
    
    console.log('\n🔍 步骤 4: 安装部署依赖');
    runCommand('npm install express', '安装 Express');
    
    console.log('\n🔍 步骤 5: 检查端口可用性');
    const frontendPort = await findAvailablePort(3000);
    const backendPort = await findAvailablePort(8893);
    
    if (!frontendPort || !backendPort) {
      console.warn('⚠️  部分端口可能被占用，请检查端口配置');
    } else {
      console.log(`✅ 前端端口 ${frontendPort} 可用`);
      console.log(`✅ 后端端口 ${backendPort} 可用`);
    }
    
    console.log('\n🎉 部署准备完成！');
    console.log('================================');
    console.log('📋 下一步操作:');
    console.log('1. 配置数据库连接 (server/.env)');
    console.log('2. 启动服务: node start-all.js');
    console.log('3. 访问应用: http://localhost:3000');
    console.log('');
    console.log('📖 详细说明请查看 DEPLOYMENT_README.md');
    
    // 询问是否立即启动
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n🚀 是否立即启动服务？(y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n🚀 正在启动服务...');
        runCommand('node start-all.js', '启动所有服务');
      } else {
        console.log('\n✅ 部署完成！使用 "node start-all.js" 启动服务。');
      }
      rl.close();
    });
    
  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    process.exit(1);
  }
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
