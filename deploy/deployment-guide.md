# 叶语项目服务器部署指南

## 🖥️ 服务器信息
- **IP地址**: 120.24.148.204
- **用户名**: root
- **密码**: 314077060@qq.com
- **操作系统**: 待检查
- **部署方式**: 全新部署（可能需要格式化）

## 📋 部署步骤

### 第一步：服务器环境检查
1. SSH连接到服务器
```bash
ssh root@120.24.148.204
# 密码: 314077060@qq.com
```

2. 运行系统检查脚本
```bash
# 检查系统信息
cat /etc/os-release
uname -a
free -h
df -h

# 检查已安装软件
which node npm mysql redis-server nginx docker
```

### 第二步：系统环境准备
根据检查结果，决定是否需要：
- 格式化重装系统
- 或在现有系统上清理和配置

### 第三步：安装必需软件
```bash
# 更新系统
apt update && apt upgrade -y

# 安装Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装MySQL 8.0
apt install -y mysql-server-8.0

# 安装Redis
apt install -y redis-server

# 安装Nginx
apt install -y nginx

# 安装PM2
npm install -g pm2

# 安装其他工具
apt install -y git curl wget unzip
```

### 第四步：项目代码部署
```bash
# 创建项目目录
mkdir -p /var/www/leaftalk
cd /var/www/leaftalk

# 上传项目代码（通过git或scp）
# 方式1: Git克隆（如果有仓库）
git clone <repository-url> .

# 方式2: 手动上传文件
# 使用scp或其他工具上传项目文件
```

### 第五步：配置环境
```bash
# 安装项目依赖
npm install
cd server && npm install && cd ..

# 配置环境变量
cp .env.example .env.production
nano .env.production

# 构建前端
npm run build
```

### 第六步：数据库配置
```bash
# 启动MySQL
systemctl start mysql
systemctl enable mysql

# 安全配置
mysql_secure_installation

# 创建数据库和用户
mysql -u root -p
```

```sql
CREATE DATABASE leaftalk_enterprise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'leaftalk'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON leaftalk_enterprise.* TO 'leaftalk'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 导入数据库结构
mysql -u leaftalk -p leaftalk_enterprise < database/schemas/leaftalk.mysql
```

### 第七步：服务配置
```bash
# 配置Redis
systemctl start redis-server
systemctl enable redis-server

# 配置Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/leaftalk
ln -s /etc/nginx/sites-available/leaftalk /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 配置防火墙
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 第八步：启动服务
```bash
# 使用PM2启动应用
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 第九步：测试验证
```bash
# 检查服务状态
pm2 status
systemctl status nginx mysql redis-server

# 测试API
curl http://localhost:8893/health
curl http://localhost/api/health
```

## 🔧 故障排除

### 常见问题
1. **端口冲突**: 检查端口占用 `netstat -tuln`
2. **权限问题**: 确保文件权限正确 `chown -R www-data:www-data /var/www/leaftalk`
3. **数据库连接**: 检查MySQL配置和用户权限
4. **内存不足**: 监控系统资源 `htop`

### 日志查看
```bash
# PM2日志
pm2 logs

# Nginx日志
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# MySQL日志
tail -f /var/log/mysql/error.log

# 系统日志
journalctl -f
```

## 📞 联系信息
如遇问题，请检查日志并根据错误信息进行排查。
