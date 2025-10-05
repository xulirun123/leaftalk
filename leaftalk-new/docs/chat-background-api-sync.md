# 聊天背景 API 同步功能

## 📋 功能概述

聊天背景设置现在支持**跨设备同步**，用户可以在不同设备上使用相同的聊天背景设置。

### 核心特性

1. **按聊天ID存储** - 每个聊天可以设置不同的背景
2. **本地优先** - 优先使用本地缓存，提升加载速度
3. **自动同步** - 保存背景时自动同步到服务器
4. **跨设备同步** - 登录时自动从服务器加载背景设置
5. **离线支持** - 即使同步失败，本地数据仍然可用

---

## 🗄️ 数据库设计

### user_settings 表新增字段

```sql
ALTER TABLE user_settings
ADD COLUMN chat_backgrounds JSON NULL
COMMENT '聊天背景设置（JSON格式，按chatId存储）';
```

### 数据结构

```json
{
  "chat_15_2": "custom:data:image/jpeg;base64,...",
  "chat_16_3": "blue-light",
  "chat_17_4": "default"
}
```

---

## 🔌 后端 API

### 1. 获取所有聊天背景设置

**请求**
```http
GET /api/chat-backgrounds
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "chat_15_2": "custom:data:image/jpeg;base64,...",
    "chat_16_3": "blue-light"
  }
}
```

### 2. 保存单个聊天的背景设置

**请求**
```http
POST /api/chat-backgrounds/:chatId
Authorization: Bearer <token>
Content-Type: application/json

{
  "background": "blue-light"
}
```

**响应**
```json
{
  "success": true,
  "message": "聊天背景保存成功"
}
```

### 3. 删除单个聊天的背景设置

**请求**
```http
DELETE /api/chat-backgrounds/:chatId
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "message": "聊天背景删除成功"
}
```

---

## 💻 前端实现

### API 服务

**文件**: `src/modules/chat/services/chatBackgroundApi.ts`

```typescript
// 获取所有聊天背景设置
export async function getChatBackgrounds(): Promise<ChatBackgrounds>

// 保存单个聊天的背景设置
export async function saveChatBackground(chatId: string, background: string): Promise<void>

// 删除单个聊天的背景设置
export async function deleteChatBackground(chatId: string): Promise<void>

// 从服务器同步聊天背景到本地
export async function syncChatBackgroundsFromServer(): Promise<void>

// 从本地同步聊天背景到服务器
export async function syncChatBackgroundsToServer(): Promise<void>
```

### 数据流程

#### 1. 保存背景

```
用户选择背景
    ↓
保存到 localStorage
    ↓
同步到服务器 (异步)
    ↓
触发事件通知聊天页面更新
```

#### 2. 加载背景

```
页面加载
    ↓
检查是否已同步 (sessionStorage)
    ↓
如果未同步，从服务器获取
    ↓
保存到 localStorage
    ↓
从 localStorage 读取当前聊天背景
    ↓
应用背景样式
```

---

## 📁 文件修改清单

### 后端文件

1. **server/app.js** - 添加聊天背景 API 路由
2. **server/add-chat-backgrounds-field.js** - 数据库迁移脚本

### 前端文件

1. **src/modules/chat/services/chatBackgroundApi.ts** - API 服务（新建）
2. **src/modules/chat/pages/ChatSimple.vue** - 聊天页面，添加同步逻辑
3. **src/modules/settings/pages/ChatBackground.vue** - 背景选择页面，添加同步
4. **src/modules/settings/pages/ChatBackgroundGallery.vue** - 背景画廊，添加同步

---

## 🔄 同步策略

### 首次加载

- 使用 `sessionStorage` 标记是否已同步
- 仅在首次加载时从服务器同步
- 同一会话中不重复同步，减少 API 调用

### 保存时同步

- 立即保存到 localStorage（确保本地可用）
- 异步同步到服务器（不阻塞用户操作）
- 同步失败时仅记录警告，不影响用户体验

### 错误处理

- 同步失败时使用本地数据
- 下次登录时自动重试同步
- 所有错误都有详细的控制台日志

---

## 🧪 测试步骤

### 1. 设置背景

1. 登录账号（用户ID: 6）
2. 进入聊天页面（如 chat_15_2）
3. 点击右上角菜单 → 设置聊天背景
4. 选择一个背景（预设或自定义）
5. 查看控制台日志，确认同步成功

### 2. 跨设备同步

1. 在设备A设置背景
2. 在设备B登录同一账号
3. 进入相同的聊天页面
4. 背景应该自动加载

### 3. 离线支持

1. 断开网络连接
2. 设置聊天背景
3. 背景应该立即生效（保存到本地）
4. 恢复网络连接
5. 刷新页面，背景应该同步到服务器

---

## 📊 数据存储

### localStorage

```javascript
// 聊天背景数据
{
  "yeyu_chat_backgrounds": {
    "chat_15_2": "custom:data:image/jpeg;base64,...",
    "chat_16_3": "blue-light"
  }
}

// 最后访问的聊天ID（用于背景设置页面）
{
  "yeyu_last_chat_id": "chat_15_2"
}
```

### sessionStorage

```javascript
// 同步标记（避免重复同步）
{
  "yeyu_chat_backgrounds_synced": "true"
}
```

---

## 🎯 未来优化

1. **批量同步** - 一次性同步所有背景设置
2. **增量同步** - 仅同步变更的背景
3. **压缩存储** - 压缩 base64 图片数据
4. **CDN 存储** - 将自定义背景上传到 CDN
5. **背景模板** - 提供更多预设背景模板

---

## 🐛 故障排查

### 背景未同步到服务器

1. 检查控制台是否有错误日志
2. 确认用户已登录（有有效 token）
3. 检查网络连接
4. 查看后端日志

### 背景未加载

1. 检查 localStorage 中是否有数据
2. 确认 chatId 正确
3. 查看控制台日志
4. 清除缓存并重新登录

### 跨设备不同步

1. 确认两个设备使用同一账号
2. 检查服务器数据库中的 chat_backgrounds 字段
3. 手动触发同步（刷新页面）

---

## ✅ 完成状态

- [x] 数据库表结构设计
- [x] 后端 API 实现
- [x] 前端 API 服务
- [x] ChatSimple.vue 同步逻辑
- [x] ChatBackground.vue 同步逻辑
- [x] ChatBackgroundGallery.vue 同步逻辑
- [x] 构建测试通过
- [ ] 功能测试
- [ ] 跨设备测试
- [ ] 性能优化

---

## 📝 更新日志

### 2025-10-05

- ✅ 添加 `chat_backgrounds` 字段到 `user_settings` 表
- ✅ 实现后端 API（GET/POST/DELETE）
- ✅ 创建前端 API 服务
- ✅ 修改聊天页面添加同步逻辑
- ✅ 修改背景选择页面添加同步逻辑
- ✅ 构建成功

