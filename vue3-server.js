const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// 启用CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'frontend-vue3')));

// API代理到后端
app.use('/api', (req, res) => {
  // 简单的健康检查
  if (req.path === '/health') {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      server: '叶语 (YeYu) Vue3前端服务器',
      frontend: 'Vue3 + Vite',
      backend: 'Node.js + Express'
    });
    return;
  }
  
  // 其他API请求返回模拟数据
  res.json({
    success: false,
    message: '后端API服务尚未启动，这是前端模拟响应',
    timestamp: new Date().toISOString()
  });
});

// Vue Router支持 - 所有路由都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-vue3', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🍃 叶语Vue3前端服务器启动成功！`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`🌐 外网访问: http://120.24.148.204:${PORT}`);
  console.log(`⚡ 前端技术栈: Vue3 + Vite + TypeScript + Pinia`);
  console.log(`🎨 UI风格: WeChat移动端风格`);
  console.log(`📊 API健康检查: http://120.24.148.204:${PORT}/api/health`);
});
