const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 请求日志
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// 安全头配置
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://code.iconify.design https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "connect-src 'self' ws: wss: http: https:; " +
    "media-src 'self' blob:; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// API 代理配置
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:8893',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // 保持路径不变
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 代理请求: ${req.method} ${req.originalUrl} -> http://localhost:8893${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ 代理响应: ${proxyRes.statusCode} ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('❌ 代理错误:', err.message);
    res.status(500).json({
      success: false,
      message: '后端服务连接失败',
      error: err.message
    });
  }
});

// WebSocket 代理配置
const wsProxy = createProxyMiddleware({
  target: 'http://localhost:8893',
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔌 WebSocket代理: ${req.originalUrl}`);
  }
});

// 应用代理中间件
app.use('/api', apiProxy);
app.use('/socket.io', wsProxy);

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 路由处理
app.get('*', (req, res) => {
  console.log(`📄 SPA路由: ${req.path} -> index.html`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.FRONTEND_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 前端服务器运行在 http://localhost:${PORT}`);
  console.log(`🔄 API代理: /api/* -> http://localhost:8893/api/*`);
  console.log(`🔌 WebSocket代理: /socket.io/* -> http://localhost:8893/socket.io/*`);
});
