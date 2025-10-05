#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

console.log('🚀 叶语项目一键部署工具');
console.log('================================');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

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

async function selectDeploymentMethod() {
  console.log('\n🎯 请选择部署方式:');
  console.log('1. Docker 部署 (推荐)');
  console.log('2. 传统服务器部署');
  console.log('3. 仅构建项目');
  
  const choice = await question('请输入选择 (1-3): ');
  return choice.trim();
}

async function dockerDeploy() {
  console.log('\n🐳 Docker 部署模式');
  
  // 检查 Docker 是否安装
  try {
    runCommand('docker --version', '检查 Docker', { silent: true });
    runCommand('docker-compose --version', '检查 Docker Compose', { silent: true });
  } catch (error) {
    console.error('❌ Docker 或 Docker Compose 未安装');
    console.log('请先安装 Docker: https://docs.docker.com/get-docker/');
    return;
  }
  
  // 构建项目
  await buildProject();
  
  // 创建 Docker 配置目录
  createDockerConfigs();
  
  // 构建并启动容器
  runCommand('docker-compose down', '停止现有容器', { optional: true });
  runCommand('docker-compose build', '构建 Docker 镜像');
  runCommand('docker-compose up -d', '启动服务');
  
  console.log('\n🎉 Docker 部署完成！');
  console.log('📱 前端访问地址: http://localhost');
  console.log('🔧 后端 API 地址: http://localhost:8893');
  console.log('🗄️  数据库地址: localhost:3306');
  console.log('📊 Redis 地址: localhost:6379');
  console.log('\n📋 管理命令:');
  console.log('  查看日志: docker-compose logs -f');
  console.log('  停止服务: docker-compose down');
  console.log('  重启服务: docker-compose restart');
}

async function traditionalDeploy() {
  console.log('\n🖥️  传统服务器部署模式');
  
  const serverIP = await question('请输入服务器 IP 地址: ');
  const serverUser = await question('请输入服务器用户名 (默认: root): ') || 'root';
  const domain = await question('请输入域名 (可选): ') || serverIP;
  
  // 更新配置
  updateServerConfig(serverIP, serverUser, domain);
  
  // 构建项目
  await buildProject();
  
  // 运行部署脚本
  runCommand('node deploy-to-server.js', '生成部署包');
  
  console.log('\n📦 部署包已生成，请按照以下步骤完成部署:');
  console.log(`1. 上传文件到服务器: scp -r deployment-package/* ${serverUser}@${serverIP}:/var/www/leaftalk/`);
  console.log(`2. 登录服务器: ssh ${serverUser}@${serverIP}`);
  console.log('3. 执行部署脚本: cd /var/www/leaftalk && ./deploy.sh');
}

async function buildProject() {
  console.log('\n🏗️  构建项目...');
  
  // 清理旧构建
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('✅ 清理旧构建文件');
  }
  
  // 安装依赖
  runCommand('npm install', '安装前端依赖');
  runCommand('npm install', '安装后端依赖', { cwd: 'server' });
  
  // 构建前端
  runCommand('npm run build', '构建前端项目');
  
  // 验证构建
  runCommand('node test-build.js', '验证构建结果');
}

function createDockerConfigs() {
  console.log('\n📝 创建 Docker 配置文件...');
  
  const configDir = 'docker-configs';
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
  
  // Nginx 配置
  const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream backend {
        server localhost:8893;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}`;
  
  fs.writeFileSync(path.join(configDir, 'nginx.conf'), nginxConfig);
  
  // Supervisor 配置
  const supervisorConfig = `
[supervisord]
nodaemon=true
user=root

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/var/log/leaftalk/nginx.log
stderr_logfile=/var/log/leaftalk/nginx.error.log

[program:leaftalk-backend]
command=node app.js
directory=/app/server
user=node
autostart=true
autorestart=true
stdout_logfile=/var/log/leaftalk/backend.log
stderr_logfile=/var/log/leaftalk/backend.error.log
environment=NODE_ENV=production
`;
  
  fs.writeFileSync(path.join(configDir, 'supervisord.conf'), supervisorConfig);
  
  console.log('✅ Docker 配置文件已创建');
}

function updateServerConfig(serverIP, serverUser, domain) {
  const configPath = 'deploy-to-server.js';
  let content = fs.readFileSync(configPath, 'utf8');
  
  content = content.replace(/host: 'your-server-ip'/, `host: '${serverIP}'`);
  content = content.replace(/user: 'root'/, `user: '${serverUser}'`);
  content = content.replace(/domain: 'your-domain.com'/, `domain: '${domain}'`);
  
  fs.writeFileSync(configPath, content);
  console.log('✅ 服务器配置已更新');
}

async function main() {
  try {
    const choice = await selectDeploymentMethod();
    
    switch (choice) {
      case '1':
        await dockerDeploy();
        break;
      case '2':
        await traditionalDeploy();
        break;
      case '3':
        await buildProject();
        console.log('\n✅ 项目构建完成！构建文件在 dist 目录中。');
        break;
      default:
        console.log('❌ 无效选择');
        break;
    }
  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('\n❌ 未捕获的异常:', error.message);
  rl.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ 未处理的 Promise 拒绝:', reason);
  rl.close();
  process.exit(1);
});

main();
