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
    "img-src 'self' data: blob: https: http: http://localhost:8893 'unsafe-inline'; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "connect-src 'self' ws: wss: http: https: http://localhost:8893; " +
    "media-src 'self' blob: data: http://localhost:8893; " +
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
    if (req.files && req.files.length > 0) {
      console.log(`📁 文件:`, req.files.map(f => ({ name: f.fieldname, size: f.size, type: f.mimetype })));
    }

    const axios = require('axios');
    const FormData = require('form-data');

    const targetUrl = `http://localhost:8893${req.originalUrl}`;
    console.log(`🎯 目标URL: ${targetUrl}`);

    let requestData;
    let requestHeaders = {
      'User-Agent': 'LeafTalk-Proxy/1.0'
    };

    // 转发Authorization header
    if (req.headers.authorization) {
      requestHeaders['Authorization'] = req.headers.authorization;
      console.log(`🔐 转发Authorization: ${req.headers.authorization.substring(0, 20)}...`);
    }

    if (req.files && req.files.length > 0) {
      // 处理文件上传
      const formData = new FormData();
      
      // 添加普通字段
      for (const [key, value] of Object.entries(req.body)) {
        formData.append(key, value);
      }
      
      // 添加文件
      for (const file of req.files) {
        formData.append(file.fieldname, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
      }
      
      requestData = formData;
      requestHeaders = {
        ...requestHeaders,
        ...formData.getHeaders()
      };
    } else {
      // 处理JSON数据
      requestData = req.body;
      requestHeaders['Content-Type'] = 'application/json';
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: requestData,
      headers: requestHeaders,
      timeout: 30000,
      maxRedirects: 5
    });

    console.log(`✅ 代理成功: ${response.status}`);
    res.status(response.status).json(response.data);

  } catch (error) {
    console.error(`❌ 代理错误:`, error.message);
    if (error.response) {
      console.error(`📊 响应状态: ${error.response.status}`);
      console.error(`📄 响应数据:`, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: '代理服务器错误', 
        message: error.message,
        code: 'PROXY_ERROR'
      });
    }
  }
});

// 设置正确的MIME类型
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  } else if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
  } else if (req.path.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// SPA 路由处理 - 所有非API请求都返回index.html
app.get('*', (req, res) => {
  // 跳过API请求
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  console.log(`📄 SPA路由: ${req.path} -> index.html`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.FRONTEND_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 前端服务器运行在 http://localhost:${PORT}`);
});
