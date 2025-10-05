/**
 * 开发环境模拟服务器
 * 完全按照开发环境的行为来提供生产服务
 */

const express = require('express')
const path = require('path')
const { createProxyMiddleware } = require('http-proxy-middleware')
const history = require('connect-history-api-fallback')
const cors = require('cors')

const app = express()
const PORT = 3000

// 完全模拟开发环境的CORS配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}))

// 调试中间件 - 记录所有请求
app.use((req, res, next) => {
  console.log(`[请求] ${req.method} ${req.url}`)
  next()
})

// 模拟开发环境的安全头配置（更宽松）
app.use((req, res, next) => {
  // 开发环境风格的CSP - 非常宽松
  res.setHeader('Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *; " +
    "style-src 'self' 'unsafe-inline' *; " +
    "img-src 'self' data: blob: *; " +
    "font-src 'self' data: *; " +
    "connect-src 'self' ws: wss: *; " +
    "media-src 'self' blob: data: *; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  )
  
  // 开发环境的其他安全头
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  next()
})

// 解析JSON和URL编码的请求体
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// API代理 - 完全模拟开发环境的代理配置
app.use(createProxyMiddleware({
  target: 'http://localhost:8893',
  changeOrigin: true,
  secure: false,
  timeout: 30000,
  pathFilter: '/api/**',  // 只代理 /api 开头的请求
  on: {
    error: (err, req, res) => {
      console.error('API代理错误:', err.message)
      res.status(500).json({ error: 'API代理错误', message: err.message })
    },
    proxyReq: (proxyReq, req, res) => {
      console.log(`[API代理] ${req.method} ${req.url} -> http://localhost:8893${proxyReq.path}`)
    }
  }
}))

// WebSocket代理 - 模拟开发环境
app.use('/ws', createProxyMiddleware({
  target: 'ws://localhost:8893',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug'
}))

// 文件上传代理
app.use('/uploads', createProxyMiddleware({
  target: 'http://localhost:8893',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug'
}))

// 静态文件服务 - 模拟开发环境的文件服务
const staticPath = path.join(__dirname, 'dist')
console.log('📁 静态文件目录:', staticPath)

// 设置静态文件的MIME类型（模拟开发环境）
app.use(express.static(staticPath, {
  etag: false,
  lastModified: false,
  maxAge: 0,
  setHeaders: (res, path) => {
    // 模拟开发环境的MIME类型设置
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8')
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
    }

    // 开发环境的缓存策略（强制不缓存）- 最强设置
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '-1')

    // 移除可能导致缓存的头
    res.removeHeader('ETag')
    res.removeHeader('Last-Modified')
  }
}))

// SPA路由回退 - 必须在静态文件服务之后
app.use(history({
  index: '/index.html',
  verbose: true,
  disableDotRule: true,  // 允许带点的路径
  htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
}))

// 再次提供静态文件（用于SPA路由回退后的文件服务）
app.use(express.static(staticPath))

// 错误处理中间件 - 模拟开发环境的错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
    stack: err.stack  // 开发环境显示错误堆栈
  })
})

// 404处理 - 模拟开发环境
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url}`)
  res.status(404).json({
    error: '页面未找到',
    url: req.url,
    method: req.method
  })
})

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('🚀 开发环境模拟服务器启动成功！')
  console.log('')
  console.log(`📱 前端访问地址: http://localhost:${PORT}`)
  console.log(`🔗 API代理目标: http://localhost:8893`)
  console.log(`📁 静态文件目录: ${staticPath}`)
  console.log('')
  console.log('✨ 特性:')
  console.log('  - 完全模拟开发环境行为')
  console.log('  - 宽松的安全策略')
  console.log('  - 详细的调试日志')
  console.log('  - 不缓存静态文件')
  console.log('  - 完整的错误信息')
  console.log('')
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...')
  process.exit(0)
})
