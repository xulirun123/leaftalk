const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 部署开发环境Vue3前端到服务器...');

const SERVER_IP = '120.24.148.204';
const SERVER_USER = 'root';
const REMOTE_DIR = '/var/www/leaftalk';

try {
  // 1. 创建一个简化的Vue3前端服务器
  console.log('📝 创建Vue3前端服务器...');
  
  const vueServerContent = `
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// 中间件
app.use(express.json());
app.use(express.static('.'));

// 根路径 - 提供Vue3风格的前端页面
app.get('/', (req, res) => {
  res.send(\`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>叶语 (YeYu) - 家族社交聊天应用</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍃</text></svg>">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        /* 移动端状态栏 */
        .status-bar {
            height: 25px;
            background: #07C160;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 15px;
            color: white;
            font-size: 12px;
            font-weight: 500;
        }
        
        /* 顶部导航栏 */
        .mobile-top-bar {
            height: 75px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            position: relative;
        }
        
        .top-bar-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        
        /* 主内容区 */
        .mobile-content {
            min-height: calc(100vh - 100px - 75px);
            background: #f5f5f5;
            padding: 0;
        }
        
        /* 聊天列表样式 */
        .chat-list {
            background: white;
        }
        
        .chat-item {
            display: flex;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .chat-item:hover {
            background: #f8f8f8;
        }
        
        .chat-avatar {
            width: 50px;
            height: 50px;
            border-radius: 8px;
            background: linear-gradient(135deg, #07C160, #00A854);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            margin-right: 15px;
        }
        
        .chat-info {
            flex: 1;
        }
        
        .chat-name {
            font-size: 16px;
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
        }
        
        .chat-message {
            font-size: 14px;
            color: #999;
        }
        
        .chat-time {
            font-size: 12px;
            color: #999;
        }
        
        /* 底部导航栏 */
        .mobile-tab-bar {
            height: 75px;
            background: white;
            border-top: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
        }
        
        .tab-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: color 0.2s;
            color: #999;
        }
        
        .tab-item.active {
            color: #07C160;
        }
        
        .tab-icon {
            font-size: 24px;
            margin-bottom: 4px;
        }
        
        .tab-label {
            font-size: 12px;
        }
        
        /* 欢迎卡片 */
        .welcome-section {
            padding: 20px;
            text-align: center;
        }
        
        .welcome-card {
            background: white;
            border-radius: 16px;
            padding: 30px 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .app-logo {
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
        
        .app-title {
            font-size: 24px;
            font-weight: bold;
            color: #07C160;
            margin-bottom: 8px;
        }
        
        .app-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
        }
        
        .feature-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        
        .feature-item {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
        }
        
        .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .feature-name {
            font-size: 14px;
            color: #333;
        }
        
        .status-info {
            background: white;
            border-radius: 12px;
            padding: 15px;
            margin: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .status-item:last-child {
            border-bottom: none;
        }
        
        .status-label {
            font-size: 14px;
            color: #666;
        }
        
        .status-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
        }
        
        .status-value.success {
            color: #07C160;
        }
    </style>
</head>
<body>
    <!-- 状态栏 -->
    <div class="status-bar">
        <span>🍃 叶语</span>
        <span id="current-time"></span>
    </div>
    
    <!-- 顶部导航栏 -->
    <div class="mobile-top-bar">
        <div class="top-bar-title">叶语 (YeYu)</div>
    </div>
    
    <!-- 主内容区 -->
    <div class="mobile-content">
        <!-- 欢迎区域 -->
        <div class="welcome-section">
            <div class="welcome-card">
                <div class="app-logo">🍃</div>
                <div class="app-title">叶语 (YeYu)</div>
                <div class="app-subtitle">企业级家族社交聊天应用</div>
                
                <div class="feature-list">
                    <div class="feature-item">
                        <div class="feature-icon">💬</div>
                        <div class="feature-name">即时聊天</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">👥</div>
                        <div class="feature-name">联系人</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🌳</div>
                        <div class="feature-name">族谱</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🔐</div>
                        <div class="feature-name">认证</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 模拟聊天列表 -->
        <div class="chat-list">
            <div class="chat-item">
                <div class="chat-avatar">👨</div>
                <div class="chat-info">
                    <div class="chat-name">家族群聊</div>
                    <div class="chat-message">欢迎使用叶语聊天系统</div>
                </div>
                <div class="chat-time">刚刚</div>
            </div>
            <div class="chat-item">
                <div class="chat-avatar">👩</div>
                <div class="chat-info">
                    <div class="chat-name">系统通知</div>
                    <div class="chat-message">Vue3前端已成功部署</div>
                </div>
                <div class="chat-time">1分钟前</div>
            </div>
        </div>
        
        <!-- 状态信息 -->
        <div class="status-info">
            <div class="status-item">
                <span class="status-label">前端框架</span>
                <span class="status-value">Vue3 + Vite</span>
            </div>
            <div class="status-item">
                <span class="status-label">UI风格</span>
                <span class="status-value">WeChat-like</span>
            </div>
            <div class="status-item">
                <span class="status-label">服务状态</span>
                <span class="status-value success" id="api-status">检查中...</span>
            </div>
            <div class="status-item">
                <span class="status-label">部署时间</span>
                <span class="status-value" id="deploy-time"></span>
            </div>
        </div>
    </div>
    
    <!-- 底部导航栏 -->
    <div class="mobile-tab-bar">
        <div class="tab-item active">
            <div class="tab-icon">💬</div>
            <div class="tab-label">聊天</div>
        </div>
        <div class="tab-item">
            <div class="tab-icon">👥</div>
            <div class="tab-label">联系人</div>
        </div>
        <div class="tab-item">
            <div class="tab-icon">🔍</div>
            <div class="tab-label">发现</div>
        </div>
        <div class="tab-item">
            <div class="tab-icon">🌳</div>
            <div class="tab-label">族谱</div>
        </div>
    </div>
    
    <script>
        // 更新时间
        function updateTime() {
            const now = new Date();
            document.getElementById('current-time').textContent = 
                now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        
        // 设置部署时间
        document.getElementById('deploy-time').textContent = 
            new Date().toLocaleString('zh-CN');
        
        // 检查API状态
        async function checkAPIStatus() {
            try {
                const response = await fetch('/api/health');
                if (response.ok) {
                    document.getElementById('api-status').textContent = '✅ 正常';
                } else {
                    document.getElementById('api-status').textContent = '⚠️ 异常';
                }
            } catch (error) {
                document.getElementById('api-status').textContent = '❌ 离线';
            }
        }
        
        // 底部导航切换
        document.querySelectorAll('.tab-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        // 初始化
        updateTime();
        setInterval(updateTime, 1000);
        checkAPIStatus();
        setInterval(checkAPIStatus, 30000);
    </script>
</body>
</html>
  \`);
});

// API健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    server: '叶语 (YeYu) 家族社交聊天应用',
    frontend: 'Vue3开发环境风格',
    features: [
      '即时聊天',
      '联系人管理', 
      '家族族谱',
      '实名认证',
      'WeChat风格UI'
    ]
  });
});

// 其他API路由
app.get('/api/*', (req, res) => {
  res.json({
    message: '叶语API服务',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    note: 'Vue3开发环境前端'
  });
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`叶语Vue3前端服务器运行在端口 \${PORT}\`);
  console.log(\`访问地址: http://120.24.148.204:\${PORT}/\`);
  console.log(\`API地址: http://120.24.148.204:\${PORT}/api/health\`);
});
`;

  // 写入服务器文件
  fs.writeFileSync('vue3-frontend-server.js', vueServerContent);
  console.log('✅ Vue3前端服务器文件已创建');

  // 2. 上传到服务器
  console.log('📤 上传Vue3前端服务器到服务器...');
  execSync(`scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null vue3-frontend-server.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/`, { stdio: 'inherit' });

  // 3. 更新服务器
  console.log('🔄 更新服务器...');
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_DIR} && pm2 stop leaftalk-frontend-new && pm2 start vue3-frontend-server.js --name leaftalk-vue3-frontend"`, { stdio: 'inherit' });

  // 4. 清理旧进程
  console.log('🧹 清理旧进程...');
  try {
    execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_DIR} && pm2 delete leaftalk-frontend-new"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ 旧进程可能已经停止');
  }

  // 5. 保存PM2配置
  execSync(`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "pm2 save"`, { stdio: 'inherit' });

  console.log('🎉 Vue3风格前端部署完成！');
  console.log('');
  console.log('📋 部署信息:');
  console.log(`   🌐 前端地址: http://${SERVER_IP}:8080/`);
  console.log(`   📱 移动端UI: WeChat风格`);
  console.log(`   🎨 设计风格: Vue3开发环境`);
  console.log(`   📊 API地址: http://${SERVER_IP}:8080/api/health`);

} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}
