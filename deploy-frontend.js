const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署叶语前端到服务器...');

const SERVER_IP = '120.24.148.204';
const SERVER_USER = 'root';
const FRONTEND_DIR = 'frontend-dist';
const REMOTE_DIR = '/var/www/leaftalk/frontend';

try {
  // 1. 检查本地前端文件
  console.log('📁 检查本地前端文件...');
  if (!fs.existsSync(FRONTEND_DIR)) {
    throw new Error(`前端目录不存在: ${FRONTEND_DIR}`);
  }
  
  const indexPath = path.join(FRONTEND_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html 文件不存在');
  }
  
  console.log('✅ 本地前端文件检查完成');
  
  // 2. 创建服务器目录
  console.log('📂 创建服务器目录...');
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "mkdir -p ${REMOTE_DIR}"`, { stdio: 'inherit' });
  
  // 3. 上传前端文件
  console.log('📤 上传前端文件到服务器...');
  execSync(`scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r ${FRONTEND_DIR}/* ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/`, { stdio: 'inherit' });
  
  // 4. 设置文件权限
  console.log('🔐 设置文件权限...');
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "chmod -R 755 ${REMOTE_DIR}"`, { stdio: 'inherit' });
  
  // 5. 安装和配置Nginx
  console.log('🌐 安装和配置Nginx...');
  
  // 安装Nginx
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "apt update && apt install -y nginx"`, { stdio: 'inherit' });
  
  // 创建Nginx配置
  const nginxConfig = `
server {
    listen 8080;
    server_name _;
    
    root ${REMOTE_DIR};
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 静态文件缓存
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8893;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # WebSocket支持
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8893;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
`;
  
  // 写入Nginx配置
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "cat > /etc/nginx/sites-available/leaftalk << 'EOF'${nginxConfig}EOF"`, { stdio: 'inherit' });
  
  // 启用配置
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "rm -f /etc/nginx/sites-enabled/default && ln -sf /etc/nginx/sites-available/leaftalk /etc/nginx/sites-enabled/"`, { stdio: 'inherit' });
  
  // 测试Nginx配置
  console.log('🧪 测试Nginx配置...');
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "nginx -t"`, { stdio: 'inherit' });
  
  // 重启Nginx
  console.log('🔄 重启Nginx服务...');
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "systemctl restart nginx && systemctl enable nginx"`, { stdio: 'inherit' });
  
  // 6. 停止旧的简单服务器
  console.log('🛑 停止旧的简单服务器...');
  try {
    execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "pm2 stop leaftalk-frontend"`, { stdio: 'inherit' });
    execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "pm2 delete leaftalk-frontend"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ 旧服务器可能已经停止');
  }
  
  // 7. 验证部署
  console.log('✅ 验证部署结果...');
  
  // 检查Nginx状态
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "systemctl is-active nginx"`, { stdio: 'inherit' });
  
  // 检查端口监听
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "netstat -tlnp | grep :8080"`, { stdio: 'inherit' });
  
  // 测试本地访问
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "curl -I http://localhost:8080/"`, { stdio: 'inherit' });
  
  console.log('🎉 前端部署完成！');
  console.log('');
  console.log('📋 部署信息:');
  console.log(`   🌐 前端地址: http://${SERVER_IP}:8080/`);
  console.log(`   📁 服务器路径: ${REMOTE_DIR}`);
  console.log(`   🔧 Nginx配置: /etc/nginx/sites-available/leaftalk`);
  console.log(`   📊 API代理: /api/* -> http://127.0.0.1:8893`);
  console.log('');
  console.log('🧪 测试访问:');
  console.log(`   curl -I http://${SERVER_IP}:8080/`);
  console.log(`   curl http://${SERVER_IP}:8080/api/health`);
  
} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}
