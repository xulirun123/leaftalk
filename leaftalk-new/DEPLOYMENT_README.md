
# 叶语项目部署说明

## 🚀 快速部署

### 1. 安装依赖
```bash
npm install
cd server && npm install
```

### 2. 启动服务
```bash
# 启动所有服务
node start-all.js

# 或分别启动
node backend-server.js  # 后端服务
node frontend-server.js # 前端服务
```

### 3. 访问应用
- 前端: http://localhost:3000
- 后端: http://localhost:8893

## 📁 文件说明

- `start-all.js` - 一键启动所有服务
- `frontend-server.js` - 前端静态文件服务器
- `backend-server.js` - 后端服务启动器
- `dist/` - 前端构建文件
- `server/` - 后端源码
- `uploads/` - 文件上传目录

## 🔧 配置

### 环境变量
在 `server/.env` 文件中配置：
```
NODE_ENV=production
PORT=8893
DB_HOST=localhost
DB_PORT=3306
DB_NAME=leaftalk
DB_USER=your_user
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 数据库
1. 安装 MySQL 和 Redis
2. 导入数据库结构: `mysql -u root -p leaftalk < database/FINAL_UNIFIED_SCHEMA.sql`
3. 配置数据库连接信息

## 🌐 生产部署

### 使用 PM2 (推荐)
```bash
npm install -g pm2
pm2 start start-all.js --name leaftalk
pm2 save
pm2 startup
```

### 使用 Nginx 反向代理
```nginx
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
```

## 🔍 故障排除

1. **端口冲突**: 修改 `PORT` 环境变量
2. **数据库连接失败**: 检查数据库配置和服务状态
3. **文件权限问题**: 确保 `uploads` 目录可写

## 📞 技术支持

如有问题，请检查：
1. Node.js 版本 (推荐 18+)
2. 数据库服务状态
3. 端口是否被占用
4. 防火墙设置
