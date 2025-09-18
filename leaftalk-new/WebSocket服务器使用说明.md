# 叶语统一服务器使用说明

## 🚀 快速启动

### 方法1: 使用启动脚本（推荐）

**Windows用户:**
```bash
双击运行: start-websocket.bat
```

**Linux/Mac用户:**
```bash
chmod +x start-websocket.sh
./start-websocket.sh
```

### 方法2: 手动启动

```bash
# 进入服务器目录
cd server

# 启动统一服务器（包含WebSocket + API + WebRTC）
node app.js

# 或者开发模式（自动重启）
npm run dev
```

## 📡 服务器信息

- **服务器端口**: 8893
- **WebSocket地址**: `ws://localhost:8893`
- **API基础地址**: `http://localhost:8893/api`
- **健康检查**: `http://localhost:8893/health`
- **数据库检查**: `http://localhost:8893/api/dev/check-db`

## 🔧 解决WebSocket连接问题

### 问题1: 连接失败
```
WebSocket connection to 'ws://localhost:8893/socket.io/' failed
```

**解决方案:**
1. 确保WebSocket服务器已启动
2. 检查端口8893是否被占用
3. 查看服务器控制台是否有错误信息

### 问题2: 端口被占用
```
Error: listen EADDRINUSE: address already in use :::8893
```

**解决方案:**
1. 关闭占用端口的程序
2. 或修改服务器端口（在mockWebSocketServer.js中修改PORT变量）

### 问题3: 权限问题
```
Error: EACCES: permission denied
```

**解决方案:**
1. 以管理员身份运行
2. 检查防火墙设置

## 🎯 功能特性

### ✅ 已实现功能

1. **实时消息传输**
   - 文本消息发送/接收
   - 消息状态更新（已发送/已送达/已读）
   - 用户在线状态同步
   - 消息数据库持久化

2. **连接管理**
   - 自动重连机制
   - 心跳保活
   - 离线模式支持

3. **用户管理**
   - 用户房间管理
   - 在线用户统计
   - 用户状态广播

4. **聊天API**
   - 获取聊天历史消息
   - 获取聊天会话列表
   - 标记消息为已读
   - JWT认证保护

### 🔄 离线模式

当WebSocket服务器不可用时，系统会自动启用离线模式：

- ✅ 消息仅保存在本地
- ✅ 定期检查服务器恢复
- ✅ 自动重新连接
- ✅ 用户友好的状态提示

## 📊 监控和调试

### 连接状态监控

前端会显示连接状态指示器：
- 🟢 **绿色**: 已连接
- 🟡 **黄色**: 连接中
- 🔴 **红色**: 未连接
- ⚫ **灰色**: 离线模式

### 服务器日志

服务器会输出详细的日志信息：
```
🔌 新用户连接: socket_id
👤 用户 user_id 已加入房间
📨 收到消息: message_data
✅ 消息已发送: sender -> receiver
❌ 用户断开连接: socket_id
```

### 健康检查

访问 `http://localhost:8893/health` 检查服务器状态：
```json
{
  "status": "ok",
  "timestamp": 1699123456789
}
```

### 状态查询

访问 `http://localhost:8893/api/status` 查看详细状态：
```json
{
  "status": "running",
  "onlineUsers": 3,
  "timestamp": 1699123456789
}
```

## 🛠️ 开发调试

### 启用调试模式

```bash
# 开发模式启动（自动重启）
cd server
npm run websocket:dev
```

### 查看详细日志

服务器会输出所有WebSocket事件的详细信息，包括：
- 连接/断开事件
- 消息发送/接收
- 用户状态变化
- 错误信息

### 测试连接

可以使用浏览器开发者工具的Console测试连接：
```javascript
// 测试WebSocket连接
const socket = io('http://localhost:8893')
socket.on('connect', () => console.log('连接成功'))
socket.on('disconnect', () => console.log('连接断开'))
```

## 🔒 安全注意事项

1. **仅用于开发环境**: 当前服务器仅适用于开发和测试
2. **无认证机制**: 生产环境需要添加完整的用户认证
3. **无加密传输**: 生产环境建议使用WSS（WebSocket Secure）
4. **无消息持久化**: 服务器重启后消息会丢失

## 🚀 生产环境部署

生产环境建议：

1. **使用专业的WebSocket服务**
   - Socket.IO官方服务
   - AWS API Gateway WebSocket
   - 自建高可用WebSocket集群

2. **添加安全措施**
   - JWT认证
   - HTTPS/WSS加密
   - 消息加密
   - 频率限制

3. **数据持久化**
   - Redis消息队列
   - 数据库消息存储
   - 消息备份机制

## 📞 技术支持

如果遇到问题：

1. 检查控制台错误信息
2. 查看服务器日志
3. 确认网络连接
4. 重启服务器和客户端

## 📝 更新日志

### v1.0.0
- ✅ 基础WebSocket连接
- ✅ 实时消息传输
- ✅ 用户状态管理
- ✅ 离线模式支持
- ✅ 自动重连机制
