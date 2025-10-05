
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// 添加请求日志
app.use((req, res, next) => {
  console.log(`📥 收到请求: ${req.method} ${req.path}`);
  next();
});

// 安全头配置
app.use((req, res, next) => {
  // 设置CSP头，允许必要的资源
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

  // 其他安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
});

// 添加body解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 添加multer中间件处理文件上传
const multer = require('multer');
const upload = multer();

// API 代理到后端服务器 - 支持文件上传
app.use('/api', upload.any(), async (req, res) => {
  try {
    console.log(`🔄 手动代理: ${req.method} ${req.originalUrl}`);
    console.log(`📦 请求体:`, req.body);
    console.log(`📁 文件:`, req.files ? req.files.length : 0);

    const axios = require('axios');
    const FormData = require('form-data');
    const targetUrl = `http://localhost:8893${req.originalUrl}`;

    let requestData;
    let requestHeaders = {
      'User-Agent': 'LeafTalk-Proxy/1.0'
    };

    // 转发Authorization header
    if (req.headers.authorization) {
      requestHeaders['Authorization'] = req.headers.authorization;
      console.log(`🔐 转发Authorization: ${req.headers.authorization.substring(0, 20)}...`);
    }

    // 如果有文件上传，使用FormData
    if (req.files && req.files.length > 0) {
      const formData = new FormData();

      // 添加文件
      req.files.forEach(file => {
        formData.append(file.fieldname, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
      });

      // 添加其他字段
      Object.keys(req.body).forEach(key => {
        formData.append(key, req.body[key]);
      });

      requestData = formData;
      requestHeaders = {
        ...requestHeaders,
        ...formData.getHeaders()
      };
    } else {
      // 普通JSON请求
      requestData = req.body;
      requestHeaders['Content-Type'] = 'application/json; charset=utf-8';
      requestHeaders['Accept'] = 'application/json';
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: requestData,
      headers: requestHeaders,
      timeout: 30000,
      validateStatus: function (status) {
        return status < 500; // 接受所有小于500的状态码
      }
    });

    console.log(`✅ 代理成功: ${response.status}`);
    console.log(`📤 响应数据:`, response.data);

    // 设置响应头
    res.set('Content-Type', 'application/json; charset=utf-8');

    // 检查后端响应格式，确保符合前端期望
    if (req.originalUrl.includes('/auth/register') && response.data && response.data.message) {
      // 注册接口需要返回特定格式
      const responseData = {
        success: true,
        message: response.data.message,
        data: {
          user: response.data.user,
          token: response.data.token || 'temp_token_' + Date.now() // 临时token
        }
      };
      res.status(response.status).json(responseData);
    } else {
      res.status(response.status).json(response.data);
    }

  } catch (error) {
    console.error('❌ 代理失败:', error.message);
    if (error.response) {
      console.log(`❌ 后端响应: ${error.response.status}`, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: '后端服务连接失败',
        error: error.message
      });
    }
  }
});

// Socket.IO 代理
app.use('/socket.io', createProxyMiddleware({
  target: 'http://localhost:8893',
  changeOrigin: true,
  ws: true
}));

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'dist')));

// 处理 SPA 路由 - 所有非API请求都返回index.html
app.get('*', (req, res) => {
  // 排除API请求
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  console.log(`📄 SPA路由: ${req.path} -> index.html`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.FRONTEND_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 前端服务器运行在 http://localhost:${PORT}`);
});
