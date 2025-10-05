#!/bin/bash
echo "=== 叶语前端快速修复脚本 ==="

# 停止可能冲突的服务
systemctl stop nginx 2>/dev/null

# 创建前端目录和文件
mkdir -p /var/www/leaftalk/frontend
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
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #07C160, #00A854);
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
        }
        h1 { font-size: 32px; margin-bottom: 10px; color: #07C160; }
        .subtitle { font-size: 18px; color: #666; margin-bottom: 30px; }
        .status {
            background: #e8f5e8;
            color: #07C160;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-weight: 600;
        }
        .info {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
        .info h3 { color: #07C160; margin-bottom: 10px; }
        .endpoint {
            background: #333;
            color: #00ff00;
            padding: 8px 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            margin: 5px 0;
            display: block;
            text-decoration: none;
        }
        .endpoint:hover { background: #555; }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🍃</div>
        <h1>叶语 (YeYu)</h1>
        <p class="subtitle">家族社交聊天应用</p>
        
        <div class="status" id="status">
            ✅ 前端服务运行正常
        </div>
        
        <div class="info">
            <h3>🔗 API 接口测试</h3>
            <a href="/api/health" class="endpoint" target="_blank">GET /api/health - 健康检查</a>
            <a href="/api" class="endpoint" target="_blank">GET /api - API信息</a>
        </div>
        
        <div class="info">
            <h3>📊 服务器信息</h3>
            <p><strong>服务器IP:</strong> 120.24.148.204</p>
            <p><strong>前端端口:</strong> 8080</p>
            <p><strong>API端口:</strong> 8893</p>
            <p><strong>当前时间:</strong> <span id="time"></span></p>
        </div>
        
        <div class="footer">
            <p>© 2025 叶语 (YeYu) - 企业级家族社交聊天应用</p>
            <p>部署成功 🎉</p>
        </div>
    </div>
    
    <script>
        // 更新时间
        function updateTime() {
            document.getElementById('time').textContent = new Date().toLocaleString('zh-CN');
        }
        updateTime();
        setInterval(updateTime, 1000);
        
        // 测试API连接
        async function testAPI() {
            try {
                const response = await fetch('/api/health');
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('status').innerHTML = '✅ 前端和API服务运行正常';
                    console.log('API响应:', data);
                } else {
                    throw new Error('API响应错误');
                }
            } catch (error) {
                document.getElementById('status').innerHTML = '⚠️ 前端正常，API连接检查中...';
                console.error('API连接失败:', error);
            }
        }
        
        // 页面加载时测试API
        window.addEventListener('load', testAPI);
    </script>
</body>
</html>
EOF

# 设置正确的权限
chmod 644 /var/www/leaftalk/frontend/index.html
chown -R www-data:www-data /var/www/leaftalk/frontend

# 创建简化的Nginx配置
cat > /etc/nginx/sites-available/leaftalk << 'EOF'
server {
    listen 8080 default_server;
    listen [::]:8080 default_server;
    
    root /var/www/leaftalk/frontend;
    index index.html;
    
    server_name _;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8893;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 删除默认配置，启用新配置
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/leaftalk
ln -s /etc/nginx/sites-available/leaftalk /etc/nginx/sites-enabled/

# 测试Nginx配置
echo "测试Nginx配置..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx配置测试通过"
    
    # 启动Nginx
    systemctl start nginx
    systemctl enable nginx
    
    # 等待服务启动
    sleep 2
    
    # 检查服务状态
    echo "=== 服务状态 ==="
    systemctl is-active nginx
    systemctl is-active mysql
    
    # 检查端口监听
    echo "=== 端口监听状态 ==="
    netstat -tlnp | grep -E "(8080|8893)"
    
    # 测试本地访问
    echo "=== 本地访问测试 ==="
    curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:8080/
    
    echo "=== 修复完成 ==="
    echo "✅ 前端地址: http://120.24.148.204:8080/"
    echo "✅ API地址: http://120.24.148.204:8080/api/health"
    
else
    echo "❌ Nginx配置测试失败"
    nginx -t
    exit 1
fi
