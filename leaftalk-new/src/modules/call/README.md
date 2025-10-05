# 🎯 仿微信通话系统

全新开发的WebRTC通话系统，完全仿照微信的通话体验，具有高性能、简洁界面和流畅交互的特点。

## ✨ 特性

### 🎨 界面设计
- **完全仿微信**：界面布局、颜色、动画效果与微信保持一致
- **流畅动画**：60fps的流畅动画和即时响应
- **响应式设计**：适配各种屏幕尺寸
- **暗色主题**：优雅的暗色通话界面

### 🚀 性能优化
- **统一管理器**：单一CallManager管理所有通话功能
- **优化连接**：快速WebRTC连接建立
- **内存管理**：自动资源清理，避免内存泄漏
- **网络自适应**：实时网络质量监控和调整

### 📱 功能完整
- **语音通话**：高质量音频通话
- **视频通话**：高清视频通话
- **设备控制**：静音、摄像头切换、免提
- **状态管理**：完整的通话状态跟踪
- **错误处理**：完善的错误恢复机制

## 🏗️ 架构设计

```
src/modules/call/
├── types/              # 类型定义
│   └── index.ts
├── services/           # 核心服务
│   ├── CallManager.ts      # 通话管理器（核心）
│   ├── MediaManager.ts     # 媒体管理
│   ├── SignalManager.ts    # 信令管理
│   └── CallStateManager.ts # 状态管理
├── components/         # UI组件
│   ├── IncomingCallScreen.vue  # 来电界面
│   ├── VideoCallScreen.vue     # 视频通话界面
│   └── VoiceCallScreen.vue     # 语音通话界面
├── pages/              # 页面
│   └── CallPage.vue        # 通话页面
├── composables/        # 组合式函数
│   └── useCall.ts          # 通话Hook
├── router/             # 路由配置
│   └── index.ts
└── index.ts            # 模块入口
```

## 🔧 使用方法

### 1. 基础使用

```typescript
import { useCall } from '@/modules/call'

const { 
  makeCall, 
  acceptIncomingCall, 
  endCall,
  currentCall,
  callStatus 
} = useCall()

// 发起视频通话
await makeCall('targetUserId', 'video', {
  id: 'targetUserId',
  name: '张三',
  avatar: '/avatar.jpg'
})

// 发起语音通话
await makeCall('targetUserId', 'voice', userInfo)
```

### 2. 监听通话事件

```typescript
import { callManager } from '@/modules/call'

// 监听来电
callManager.on('call:incoming', (data) => {
  console.log('收到来电:', data)
  // 显示来电界面或通知
})

// 监听通话结束
callManager.on('call:ended', (data) => {
  console.log('通话结束:', data.reason)
})
```

### 3. 在组件中使用

```vue
<template>
  <div>
    <button @click="makeVideoCall">视频通话</button>
    <button @click="makeVoiceCall">语音通话</button>
    
    <div v-if="isInCall">
      通话中: {{ callStatus }}
      <button @click="endCall">挂断</button>
    </div>
  </div>
</template>

<script setup>
import { useCall } from '@/modules/call'

const { makeCall, endCall, isInCall, callStatus } = useCall()

const makeVideoCall = () => {
  makeCall('targetUserId', 'video', {
    id: 'targetUserId',
    name: '联系人',
    avatar: ''
  })
}

const makeVoiceCall = () => {
  makeCall('targetUserId', 'voice', userInfo)
}
</script>
```

## 🔌 API接口

### 后端API

```javascript
// 发起通话
POST /api/call/initiate
{
  "targetUserId": "string",
  "type": "voice" | "video"
}

// 接听通话
POST /api/call/accept
{
  "callId": "string"
}

// 拒绝通话
POST /api/call/reject
{
  "callId": "string",
  "reason": "string"
}

// 结束通话
POST /api/call/end
{
  "callId": "string",
  "reason": "string"
}

// 获取通话状态
GET /api/call/status/:callId

// 获取活跃通话
GET /api/call/active
```

### WebRTC信令

```javascript
// Socket.IO事件
'webrtc:incoming-call'    // 来电通知
'webrtc:offer'           // WebRTC Offer
'webrtc:answer'          // WebRTC Answer
'webrtc:ice-candidate'   // ICE候选
'webrtc:call-status'     // 通话状态更新
'webrtc:call-ended'      // 通话结束
```

## 🎮 测试

### 1. 使用测试页面

打开 `test-new-call-system.html` 进行功能测试：

```bash
# 启动服务器后访问
http://localhost:5173/test-new-call-system.html
```

### 2. 测试步骤

1. **初始化系统**：检查WebRTC支持和权限
2. **用户登录**：选择测试用户并登录
3. **发起通话**：测试语音和视频通话
4. **API测试**：验证各个API接口
5. **查看日志**：观察系统运行状态

### 3. 多用户测试

1. 打开两个浏览器窗口
2. 分别登录不同用户（用户1和用户2）
3. 在一个窗口发起通话
4. 在另一个窗口接听通话

## 🔧 配置

### 1. WebRTC配置

```typescript
// 在SignalManager.ts中配置
private rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
}
```

### 2. 媒体约束

```typescript
// 在MediaManager.ts中配置
const constraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user'
  }
}
```

## 🚀 部署

### 1. 前端集成

```typescript
// 在main.ts中
import { callRoutes } from '@/modules/call'

// 添加路由
router.addRoute(callRoutes[0])

// 初始化通话管理器
import { callManager } from '@/modules/call'
await callManager.initialize()
```

### 2. 后端集成

```javascript
// 在server/app.js中
const callRouter = require('../backend/routes/callRoutes')
app.use('/api/call', authenticateToken, callRouter)
```

## 📝 注意事项

1. **HTTPS要求**：WebRTC需要HTTPS环境（开发环境localhost除外）
2. **权限管理**：需要用户授权摄像头和麦克风权限
3. **网络环境**：建议在良好的网络环境下测试
4. **浏览器兼容**：支持现代浏览器（Chrome、Firefox、Safari、Edge）
5. **防火墙**：确保WebRTC相关端口未被阻塞

## 🔄 与旧系统的区别

| 特性 | 旧系统 | 新系统 |
|------|--------|--------|
| 架构 | 多个分散的服务 | 统一的CallManager |
| 性能 | 连接慢，资源占用高 | 快速连接，优化性能 |
| 界面 | 简单布局 | 完全仿微信设计 |
| 状态管理 | 复杂且容易出错 | 简化且可靠 |
| 错误处理 | 不完善 | 完善的错误恢复 |
| 代码维护 | 难以维护 | 模块化，易维护 |

## 🎯 下一步计划

- [ ] 添加群组通话支持
- [ ] 实现通话录制功能
- [ ] 添加屏幕共享
- [ ] 优化弱网环境下的通话质量
- [ ] 添加通话统计和分析
- [ ] 支持更多设备和平台
