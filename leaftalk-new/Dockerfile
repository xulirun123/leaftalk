# 叶语项目 Docker 部署文件
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    nginx \
    supervisor \
    mysql-client \
    redis

# 复制前端构建文件
COPY dist/ /usr/share/nginx/html/

# 复制后端文件
COPY server/ ./server/
COPY uploads/ ./uploads/

# 安装后端依赖
WORKDIR /app/server
RUN npm install --production

# 复制配置文件
COPY docker-configs/ /etc/

# 创建日志目录
RUN mkdir -p /var/log/leaftalk

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R node:node /app

# 暴露端口
EXPOSE 80 8893

# 启动服务
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
