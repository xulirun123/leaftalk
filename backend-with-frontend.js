// 修改后端服务器，直接提供前端服务
const express = require('express');
const path = require('path');

const app = express();

// 静态文件服务 - 前端页面
app.use(express.static(path.join(__dirname, 'frontend')));

// 根路径返回前端页面
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>叶语 (YeYu)</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #07C160, #00A854);
            color: white;
            margin: 0;
        }
        .container {
            background: white;
            color: #333;
            padding: 40px;
            border-radius: 20px;
            max-width: 500px;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 { color: #07C160; margin-bottom: 20px; }
        .status { 
            background: #e8f5e8; 
            color: #07C160; 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0; 
            font-weight: bold;
        }
        .api-link {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .api-link a {
            color: #07C160;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍃 叶语 (YeYu)</h1>
        <p>家族社交聊天应用</p>
        <div class="status">✅ 服务器运行正常</div>
        <p>服务器地址: 120.24.148.204:8893</p>
        <div class="api-link">
            <p>API测试: <a href="/api/health" target="_blank">/api/health</a></p>
        </div>
        <div class="api-link">
            <p>当前时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>
    <script>
        // 测试API连接
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                console.log('API状态:', data);
                document.querySelector('.status').innerHTML = '✅ 服务器和API运行正常';
            })
            .catch(error => {
                console.error('API连接失败:', error);
                document.querySelector('.status').innerHTML = '⚠️ 前端正常，API连接检查中...';
            });
    </script>
</body>
</html>
  `);
});

// 现有的API路由...
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 8893;
app.listen(PORT, () => {
  console.log(`叶语服务器运行在端口 ${PORT}`);
});
