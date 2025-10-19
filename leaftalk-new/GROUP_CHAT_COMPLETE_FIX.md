# 群聊功能完整修复方案

## 问题总结

### 问题 1：群聊ID格式错误
- **症状**：`❌ 无效的聊天ID格式: 15_group_1760708486645`
- **原因**：调用 `generateSessionId(userId, groupId)` 时没有检查 groupId 是否为群ID
- **影响**：群聊消息无法正确创建会话

### 问题 2：全局RealtimeMessageReceiver未注册
- **症状**：`❌ 全局RealtimeMessageReceiver不可用`
- **原因**：`ChatSimple.vue` 尝试访问 `window.$realtimeReceiver`，但未被设置
- **影响**：无法通过WebSocket发送消息

### 问题 3：群聊消息接收者无法自动创建群聊项
- **症状**：群里的其他成员收到消息后，聊天列表中没有出现该群聊
- **原因**：`receiveMessage` 函数没有获取群聊信息，只记录了发送者信息
- **影响**：群聊消息接收者无法看到群聊项

## 修复方案

### 修复 1：群聊ID格式检查（7个文件）

在所有调用 `generateSessionId` 的地方添加群聊检查：

```typescript
const isGroupMessage = String(receiverId).startsWith('group_')
const sessionId = isGroupMessage 
  ? String(receiverId)
  : generateSessionId(userId1, userId2)
```

**修改文件**：
- realtimeMessageService.ts
- RealtimeMessageReceiver.vue (3处)
- MessageSender.vue
- ChatInfo.vue (2处)
- chatGuard.ts
- chatStore.ts

### 修复 2：全局RealtimeMessageReceiver注册

在 `MobileApp.vue` 中：
1. 添加 `realtimeReceiverRef` ref
2. 在 `onMounted` 中暴露到 `window.$realtimeReceiver`

```typescript
const realtimeReceiverRef = ref<any>(null)

onMounted(() => {
  if (realtimeReceiverRef.value) {
    (window as any).$realtimeReceiver = realtimeReceiverRef.value
    console.log('✅ 全局RealtimeMessageReceiver已注册')
  }
})
```

### 修复 3：群聊消息接收者自动创建群聊项

#### 3.1 RealtimeMessageReceiver.vue 中获取群聊信息

```typescript
const isGroupMessage = String(message.receiverId).startsWith('group_')

if (isGroupMessage) {
  // 从 API 获取群聊信息
  const response = await fetch(`http://localhost:8893/api/groups/${message.receiverId}`)
  const groupData = await response.json()
  
  senderInfo = {
    groupName: groupData.data.name,
    groupAvatar: groupData.data.avatar,
    groupId: message.receiverId
  }
}
```

#### 3.2 chatStore.ts 中处理群聊信息

在 `receiveMessage` 和 `createOrUpdateChatItem` 函数中：

```typescript
if (isGroupMessage) {
  // 从 senderInfo 中获取群聊信息
  sessionName = senderInfo?.groupName || `群聊${receiverId.substring(6, 16)}`
  sessionAvatar = senderInfo?.groupAvatar || null
} else {
  // 获取发送者信息
  sessionName = senderInfo?.name || `用户${senderId}`
  sessionAvatar = senderInfo?.avatar || null
}
```

## 会话ID格式规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 私聊 | `chat_userId1_userId2` | `chat_1_2` |
| 群聊 | `group_timestamp` | `group_1760708486645` |

## 测试清单

### 基础功能测试
- [ ] 创建群聊并发送消息
- [ ] 打开群聊列表中的群聊
- [ ] 验证缓存迁移
- [ ] 验证私聊功能

### 群聊接收测试
- [ ] 用户A创建群聊，邀请用户B
- [ ] 用户A发送消息
- [ ] 用户B登录后，聊天列表自动出现群聊项
- [ ] 群聊项显示正确的名称和头像

### 控制台日志检查
- [ ] `✅ 全局RealtimeMessageReceiver已注册`
- [ ] `🔍 createOrUpdateChatItem - 消息类型: 群聊`
- [ ] `✅ 收到消息，创建新聊天项: 群聊名称 类型: 群聊`
- [ ] `✅ 获取到群聊信息`

## 关键改进

✅ 群聊ID格式正确：`group_timestamp`
✅ 私聊ID格式正确：`chat_userId1_userId2`
✅ 缓存中的错误ID自动修复
✅ 全局WebSocket连接正确注册
✅ 群聊消息接收者自动创建群聊项
✅ 群聊信息（名称、头像）正确显示

## 后续工作

- [ ] 测试多人群聊场景
- [ ] 测试群聊消息撤回
- [ ] 测试群聊成员变更通知
- [ ] 优化群聊信息缓存
- [ ] 添加群聊消息已读状态

