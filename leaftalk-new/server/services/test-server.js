// 简单测试服务器
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8893;

// 中间件
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
app.use(express.json());

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '叶语测试服务器运行中',
    timestamp: new Date().toISOString(),
    port: PORT,
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 模拟API路由
app.get('/api/chats', (req, res) => {
  res.json([]);
});

app.get('/api/contacts', (req, res) => {
  res.json([]);
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: '登录成功（测试模式）',
    data: {
      token: 'test-token-123',
      user: {
        id: 1,
        username: 'test',
        nickname: '测试用户',
        yeyu_id: 'TEST001'
      }
    }
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ 测试服务器启动成功: http://127.0.0.1:${PORT}`);
  console.log(`🔗 健康检查: http://127.0.0.1:${PORT}/health`);
  console.log(`📡 API端点: http://127.0.0.1:${PORT}/api/*`);
});

console.log('🚀 正在启动测试服务器...');
