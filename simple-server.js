const express = require('express');
const app = express();

// 根路径返回前端页面
app.get('/', (req, res) => {
  res.send(`
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
        
        <div class="status">
            ✅ 前端服务运行正常
        </div>
        
        <div class="info">
            <h3>🔗 API 接口测试</h3>
            <a href="/api/health" class="endpoint" target="_blank">GET /api/health - 健康检查</a>
        </div>
        
        <div class="info">
            <h3>📊 服务器信息</h3>
            <p><strong>服务器IP:</strong> 120.24.148.204</p>
            <p><strong>服务端口:</strong> 8080</p>
            <p><strong>部署时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="footer">
            <p>© 2025 叶语 (YeYu) - 企业级家族社交聊天应用</p>
            <p>部署成功 🎉</p>
        </div>
    </div>
</body>
</html>
  `);
});

// API健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    server: '叶语 (YeYu) 家族社交聊天应用'
  });
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`叶语服务器运行在端口 ${PORT}`);
});
