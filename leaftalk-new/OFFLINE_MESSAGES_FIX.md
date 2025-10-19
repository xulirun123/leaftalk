# 离线消息加载问题修复

## 问题描述

用户离线时，别人发送的消息无法在登录后看到。

## 根本原因分析

### 前端流程
1. ✅ 用户登录后，`MobileApp.vue` 调用 `chatStore.loadChatsFromAPI(true)` 加载聊天列表
2. ✅ 聊天列表显示所有会话
3. ✅ 用户点击进入某个聊天时，`ChatSimple.vue` 的 `onMounted` 调用 `loadMessages()`
4. ✅ `loadMessages()` 调用 `chatStore.loadMessagesForSession(sessionId)`
5. ✅ `loadMessagesForSession()` 调用 `syncMessagesFromAPI(sessionId)` 从后端获取离线消息

### 前端修复（已完成）
- ✅ 修改 `syncMessagesFromAPI()` 支持群聊消息（`group_` 格式）
- ✅ 添加字段兼容性处理（支持不同的字段名）
- ✅ 添加详细的日志记录

## 后端需要实现的接口

### 1. 私聊离线消息接口
**端点**: `GET /api/chat/messages/{otherUserId}`

**功能**: 获取与指定用户的所有消息（包括离线消息）

**返回格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_123",
      "sender_id": 1,
      "receiver_id": 2,
      "content": "消息内容",
      "message_type": "text",
      "created_at": "2025-10-17T10:00:00Z",
      "status": "sent"
    }
  ]
}
```

**字段说明**:
- `sender_id`: 发送者ID
- `receiver_id`: 接收者ID
- `message_type`: 消息类型（text/image/voice/video/file/contact/location）
- `created_at`: 消息创建时间（ISO格式）
- `status`: 消息状态（sent/delivered/read）

### 2. 群聊离线消息接口
**端点**: `GET /api/groups/{groupId}/messages`

**功能**: 获取群聊的所有消息（包括离线消息）

**返回格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_456",
      "sender_id": 1,
      "receiver_id": "group_1234567890",
      "content": "群消息内容",
      "message_type": "text",
      "created_at": "2025-10-17T10:00:00Z",
      "status": "sent"
    }
  ]
}
```

## 前端代码修改

### 修改位置: `leaftalk-new/src/modules/chat/stores/chatStore.ts`

#### 1. 支持群聊消息同步（第 1124-1163 行）
```typescript
// 判断是否为群聊消息
const isGroupMessage = String(sessionId).startsWith('group_')
let apiUrl = ''

if (isGroupMessage) {
  // 群聊消息：直接使用群ID
  const groupId = sessionId
  apiUrl = `http://localhost:8893/api/groups/${groupId}/messages`
} else {
  // 私聊消息：解析sessionId获取对方用户ID
  const parts = sessionId.replace('chat_', '').split('_')
  const currentUserId = authStore.user?.id
  const otherUserId = parts.find(id => id !== String(currentUserId))
  apiUrl = `http://localhost:8893/api/chat/messages/${otherUserId}`
}
```

#### 2. 字段兼容性处理（第 1165-1235 行）
```typescript
// 兼容不同的字段名（私聊和群聊可能不同）
const senderId = msg.sender_id || msg.senderId || msg.from_id
const receiverId = msg.receiver_id || msg.receiverId || msg.to_id || sessionId
const content = msg.content || msg.message || ''
const messageType = msg.message_type || msg.type || 'text'
const timestamp = msg.created_at ? new Date(msg.created_at).getTime() : (msg.timestamp || Date.now())
```

## 测试步骤

### 测试私聊离线消息
1. 用户A登录应用
2. 用户B（另一个浏览器/设备）发送消息给用户A
3. 用户A离线（关闭应用或浏览器）
4. 用户B继续发送多条消息
5. 用户A重新登录
6. 用户A点击与用户B的聊天
7. **验证**: 应该看到所有离线消息

### 测试群聊离线消息
1. 用户A创建群聊，邀请用户B
2. 用户A离线
3. 用户B在群聊中发送消息
4. 用户C在群聊中发送消息
5. 用户A重新登录
6. 用户A点击群聊
7. **验证**: 应该看到所有离线消息

## 浏览器控制台日志

### 成功加载离线消息的日志
```
🔄 从API同步私聊消息... { sessionId: 'chat_1_2', otherUserId: '2' }
✅ API消息同步成功: 5 条
💾 保存离线消息: { id: 'msg_123', content: '你好', senderId: '2', receiverId: '1' }
✅ 新增 5 条离线消息
```

### 群聊离线消息日志
```
🔄 从API同步群聊消息... { sessionId: 'group_1234567890' }
✅ API消息同步成功: 10 条
💾 保存离线消息: { id: 'msg_456', content: '群消息', senderId: '2', receiverId: 'group_1234567890' }
✅ 新增 10 条离线消息
```

## 后续优化

- [ ] 添加消息分页加载（避免一次加载过多消息）
- [ ] 添加消息时间范围过滤
- [ ] 优化大量消息的加载性能
- [ ] 添加消息压缩存储

