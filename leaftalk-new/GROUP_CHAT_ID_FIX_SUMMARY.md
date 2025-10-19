# 群聊ID格式错误修复总结

## 问题描述

用户在发送群聊消息时，出现以下错误：
```
❌ 无效的聊天ID格式: 15_group_1760708486645 parts: (3) ['15', 'group', '1760708486645']
❌ 全局RealtimeMessageReceiver不可用
```

### 根本原因

1. **群聊ID格式错误**：群聊消息的 `receiverId` 是群ID（`group_1760708486645`），但代码在调用 `generateSessionId(userId, groupId)` 时，生成了错误的格式 `chat_userId_group_timestamp`

2. **全局RealtimeMessageReceiver未注册**：`ChatSimple.vue` 尝试访问 `window.$realtimeReceiver`，但这个全局变量没有被设置

## 修复内容

### 1️⃣ realtimeMessageService.ts (第 145 行)
**修复**：在处理新消息时，添加群聊检查
```typescript
const isGroupMessage = String(message.receiverId).startsWith('group_')
const sessionId = isGroupMessage 
  ? String(message.receiverId)
  : chatStore.generateSessionId(message.senderId, message.receiverId)
```

### 2️⃣ RealtimeMessageReceiver.vue (3处)
- **第 354 行**：检查创建后的聊天项时，添加群聊检查
- **第 702 行**：消息发送失败时插入系统提示，添加群聊检查
- **第 403 行**：处理系统消息时，添加群聊检查

### 3️⃣ MessageSender.vue (第 91 行)
**修复**：在发送前检查会话是否存在时，添加群聊检查

### 4️⃣ ChatInfo.vue (2处)
- **第 218 行**：加载会话设置时，添加群聊检查
- **第 317 行**：搜索聊天记录时，添加群聊检查

### 5️⃣ chatGuard.ts (第 66 行)
**修复**：当 `userId2` 是群ID时，跳过自聊天检查
```typescript
const userId2Str = String(userId2)
if (userId2Str.startsWith('group_')) {
  return
}
```

### 6️⃣ chatStore.ts (第 698 行)
**修复**：在 `loadFromCache` 函数中添加迁移逻辑，自动修复缓存中的错误ID格式
```typescript
// 修复错误的群聊ID格式（迁移逻辑）
let migratedSessions = (data || []).map((session: any) => {
  // 检查是否为错误的群聊ID格式：userId_group_timestamp
  if (session.id && session.id.match(/^\d+_group_\d+$/)) {
    const parts = session.id.split('_')
    const correctId = `group_${parts[2]}`
    console.log('🔧 修复错误的群聊ID:', session.id, '→', correctId)
    return { ...session, id: correctId, type: 'group' }
  }
  // 检查是否为错误的群聊ID格式：chat_userId_group_timestamp
  if (session.id && session.id.match(/^chat_\d+_group_\d+$/)) {
    const parts = session.id.split('_')
    const correctId = `group_${parts[3]}`
    console.log('🔧 修复错误的群聊ID:', session.id, '→', correctId)
    return { ...session, id: correctId, type: 'group' }
  }
  return session
})
```

### 7️⃣ MobileApp.vue (2处)
**修复**：暴露 `RealtimeMessageReceiver` 到全局
- 添加 `realtimeReceiverRef` ref
- 在 `onMounted` 中将其暴露到 `window.$realtimeReceiver`

## 会话ID格式规范

- **私聊**：`chat_userId1_userId2` (两个用户ID排序后用下划线连接)
- **群聊**：`group_timestamp` (群ID直接使用)

## 测试步骤

1. **创建群聊并发送消息**
   - 进入发起群聊页面
   - 选择多个联系人
   - 点击"完成"按钮
   - 在群聊中发送消息
   - 检查浏览器控制台，应该看到 `✅ 全局RealtimeMessageReceiver已注册`

2. **打开群聊列表**
   - 返回聊天列表
   - 点击群聊项
   - 应该能够正常打开群聊页面
   - 不应该看到 `❌ 无效的聊天ID格式` 错误

3. **验证缓存迁移**
   - 打开浏览器开发者工具
   - 查看控制台日志
   - 如果有旧的错误格式的会话ID，应该看到 `🔧 修复错误的群聊ID` 日志

## 关键改进

✅ 所有群聊消息现在使用正确的ID格式：`group_timestamp`
✅ 私聊消息继续使用：`chat_userId1_userId2`
✅ 自动修复缓存中的错误ID格式
✅ 群聊消息不再进行自聊天检查
✅ 全局 `RealtimeMessageReceiver` 已正确注册
✅ 所有调用 `generateSessionId` 的地方都已检查并修复
✅ **群聊消息接收者现在能自动创建群聊项**（新增）

## 群聊消息接收逻辑（新增）

当群里的其他成员收到消息时，系统会：

1. **检测消息类型**：判断 `receiverId` 是否以 `group_` 开头
2. **获取群聊信息**：从 API 获取群聊的名称和头像
3. **创建群聊项**：如果本地还没有该群聊的会话，自动创建
4. **添加消息**：将消息添加到群聊会话中

### 修改的文件

- `RealtimeMessageReceiver.vue` - 添加群聊信息获取逻辑
- `chatStore.ts` - 修改 `receiveMessage` 和 `createOrUpdateChatItem` 函数

### 群聊信息获取流程

```typescript
// 1. 检测群聊消息
const isGroupMessage = String(message.receiverId).startsWith('group_')

// 2. 如果是群聊，从 API 获取群聊信息
if (isGroupMessage) {
  const response = await fetch(`http://localhost:8893/api/groups/${message.receiverId}`)
  const groupData = await response.json()

  senderInfo = {
    groupName: groupData.data.name,
    groupAvatar: groupData.data.avatar,
    groupId: message.receiverId
  }
}

// 3. 调用 receiveMessage 创建或更新群聊项
await chatStore.receiveMessage(chatMessage, senderInfo)
```

