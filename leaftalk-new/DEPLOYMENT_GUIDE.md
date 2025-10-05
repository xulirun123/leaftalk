# 叶语项目部署指南

## 🚀 一键部署（推荐）

### 方法一：Docker 部署（最简单）

```bash
# 1. 运行一键部署脚本
node one-click-deploy.js

# 2. 选择 "1" (Docker 部署)
# 脚本会自动完成所有配置和部署

# 3. 访问应用
# 前端: http://localhost
# 后端: http://localhost:8893
```

### 方法二：传统服务器部署

```bash
# 1. 运行一键部署脚本
node one-click-deploy.js

# 2. 选择 "2" (传统服务器部署)
# 3. 输入服务器信息
# 4. 按照提示上传文件并执行部署脚本
```

## 📋 手动部署步骤

### 1. 准备环境

**本地环境要求：**
- Node.js 18+
- npm 8+

**服务器环境要求：**
- Ubuntu 20.04+ / CentOS 8+
- Node.js 18+
- Nginx
- MySQL 8.0+
- Redis 6+
- PM2

### 2. 构建项目

```bash
# 清理并构建
npm run build

# 验证构建
node test-build.js
```

### 3. Docker 部署（推荐）

```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f
```

### 4. 传统部署

```bash
# 生成部署包
node deploy-to-server.js

# 上传到服务器
scp -r deployment-package/* user@server:/var/www/leaftalk/

# 在服务器上执行
ssh user@server
cd /var/www/leaftalk
chmod +x deploy.sh
./deploy.sh
```

## 🔧 配置说明

### 环境变量

创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=leaftalk
DB_USER=leaftalk
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 应用配置
NODE_ENV=production
PORT=8893
JWT_SECRET=your_jwt_secret

# 文件上传
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# 第三方服务
BAIDU_API_KEY=your_baidu_api_key
BAIDU_SECRET_KEY=your_baidu_secret_key
```

### 数据库初始化

```bash
# 导入数据库结构
mysql -u root -p leaftalk < database/FINAL_UNIFIED_SCHEMA.sql

# 或使用脚本
node database/init-database.js
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/leaftalk/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:8893;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:8893;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🔍 部署验证

### 检查服务状态

```bash
# Docker 部署
docker-compose ps
docker-compose logs leaftalk-app

# 传统部署
pm2 status
pm2 logs leaftalk-backend
systemctl status nginx
```

### 测试功能

1. **前端访问**：http://your-domain.com
2. **API 测试**：http://your-domain.com/api/health
3. **WebSocket 测试**：检查实时消息功能
4. **数据库连接**：检查用户注册登录
5. **文件上传**：测试头像上传功能

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep :80
   netstat -tlnp | grep :8893
   ```

2. **权限问题**
   ```bash
   # 设置正确权限
   sudo chown -R www-data:www-data /var/www/leaftalk
   sudo chmod -R 755 /var/www/leaftalk
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库服务
   systemctl status mysql
   mysql -u leaftalk -p -e "SELECT 1"
   ```

4. **内存不足**
   ```bash
   # 增加 swap 空间
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### 日志查看

```bash
# Docker 部署
docker-compose logs -f leaftalk-app
docker-compose logs -f mysql
docker-compose logs -f redis

# 传统部署
tail -f /var/log/leaftalk/backend.log
tail -f /var/log/nginx/error.log
pm2 logs leaftalk-backend
```

## 🔒 安全配置

### SSL 证书

```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 📊 监控和维护

### 性能监控

```bash
# 安装监控工具
npm install -g pm2-logrotate
pm2 install pm2-server-monit
```

### 定期维护

```bash
# 数据库备份
mysqldump -u root -p leaftalk > backup_$(date +%Y%m%d).sql

# 日志清理
find /var/log/leaftalk -name "*.log" -mtime +30 -delete

# 更新依赖
npm audit fix
```

## 📞 技术支持

如果遇到问题，请提供：
1. 错误日志
2. 系统环境信息
3. 部署方式
4. 具体错误步骤

---

**注意**：首次部署建议使用 Docker 方式，简单快捷且环境一致。
