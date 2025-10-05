const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// 中间件
app.use(express.json());
app.use(express.static('.'));

// 根路径 - 提供新的前端页面
app.get('/', (req, res) => {
  try {
    // 尝试读取新的index.html文件
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      res.send(htmlContent);
    } else {
      // 如果文件不存在，返回简单页面
      res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>叶语 (YeYu) - 家族社交聊天应用</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #07C160 0%, #00A854 100%);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
        }
        .logo {
            font-size: 80px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 36px;
            font-weight: bold;
            color: #07C160;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 30px;
        }
        .status {
            background: #f0f9ff;
            border: 1px solid #07C160;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
        }
        .btn {
            background: linear-gradient(135deg, #07C160, #00A854);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 20px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(7, 193, 96, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🍃</div>
        <h1 class="title">叶语 (YeYu)</h1>
        <p class="subtitle">企业级家族社交聊天应用</p>
        
        <div class="status">
            <p><strong>✅ 服务器运行正常</strong></p>
            <p>服务器地址: 120.24.148.204:8080</p>
            <p>部署时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <a href="/api/health" class="btn" target="_blank">API健康检查</a>
        <button class="btn" onclick="location.reload()">刷新页面</button>
    </div>
</body>
</html>
      `);
    }
  } catch (error) {
    console.error('读取index.html失败:', error);
    res.status(500).send('服务器错误');
  }
});

// API健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    server: '叶语 (YeYu) 家族社交聊天应用',
    frontend: 'Vue3风格前端',
    features: [
      '即时聊天',
      '联系人管理', 
      '家族族谱',
      '实名认证'
    ]
  });
});

// 其他API路由
app.get('/api/*', (req, res) => {
  res.json({
    message: '叶语API服务',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`叶语服务器运行在端口 ${PORT}`);
  console.log(`访问地址: http://120.24.148.204:${PORT}/`);
  console.log(`API地址: http://120.24.148.204:${PORT}/api/health`);
});
