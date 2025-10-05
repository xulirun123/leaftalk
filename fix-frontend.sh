#!/bin/bash
echo "=== 叶语前端部署修复脚本 ==="

# 创建前端目录
mkdir -p /var/www/leaftalk/frontend

# 创建前端HTML文件
cat > /var/www/leaftalk/frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>叶语 (YeYu) - 家族社交聊天应用</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #07C160 0%, #00A854 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #333;
        }
        .container {
            background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            text-align: center; max-width: 500px; width: 90%;
        }
        .logo {
            width: 80px; height: 80px; background: linear-gradient(135deg, #07C160, #00A854);
            border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center;
            justify-content: center; font-size: 40px; color: white;
        }
        h1 { font-size: 32px; margin-bottom: 10px; color: #07C160; }
        .subtitle { font-size: 18px; color: #666; margin-bottom: 30px; }
        .status { background: #e8f5e8; color: #07C160; padding: 15px; border-radius: 10px; margin: 20px 0; font-weight: 600; }
        .api-info { background: #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; }
        .api-info h3 { color: #07C160; margin-bottom: 10px; }
        .api-endpoint {
            background: #333; color: #00ff00; padding: 8px 12px; border-radius: 6px;
            font-family: 'Courier New', monospace; font-size: 14px; margin: 5px 0; display: block;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🍃</div>
        <h1>叶语 (YeYu)</h1>
        <p class="subtitle">家族社交聊天应用</p>
        <div class="status">✅ 服务器运行正常</div>
        <div class="api-info">
            <h3>API 接口信息</h3>
            <code class="api-endpoint">GET /api/health - 健康检查</code>
            <code class="api-endpoint">POST /api/auth/login - 用户登录</code>
            <code class="api-endpoint">POST /api/auth/register - 用户注册</code>
            <code class="api-endpoint">WebSocket /socket.io - 实时通信</code>
        </div>
        <div class="footer">
            <p>© 2025 叶语 (YeYu) - 企业级家族社交聊天应用</p>
            <p>服务器地址: 120.24.148.204</p>
        </div>
    </div>
    <script>
        async function checkAPI() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                console.log('API状态:', data);
            } catch (error) {
                console.error('API连接失败:', error);
            }
        }
        window.addEventListener('load', checkAPI);
    </script>
</body>
</html>
EOF

# 设置文件权限
chmod 644 /var/www/leaftalk/frontend/index.html
chown -R www-data:www-data /var/www/leaftalk/frontend

# 创建Nginx配置
cat > /etc/nginx/sites-available/leaftalk << 'EOF'
server {
    listen 8080;
    server_name 120.24.148.204;
    
    location / {
        root /var/www/leaftalk/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:8893;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:8893;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用站点配置
ln -sf /etc/nginx/sites-available/leaftalk /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重启Nginx
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    systemctl enable nginx
    echo "✅ Nginx配置成功并已重启"
else
    echo "❌ Nginx配置测试失败"
    exit 1
fi

# 开放端口
ufw allow 8080

# 检查服务状态
echo "=== 服务状态检查 ==="
echo "Nginx状态:"
systemctl is-active nginx
echo "端口8080监听状态:"
netstat -tlnp | grep 8080
echo "前端文件:"
ls -la /var/www/leaftalk/frontend/

echo "=== 修复完成 ==="
echo "前端访问地址: http://120.24.148.204:8080/"
echo "API测试地址: http://120.24.148.204:8080/api/health"
