# 后端 API 需求总结

## 📋 群聊管理相关 API

### 1. 获取群聊详情

**端点**: `GET /api/groups/{groupId}`

**请求头**:
```
Authorization: Bearer {token}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "group_1234567890",
    "name": "群聊名称",
    "avatar": "https://example.com/avatar.jpg",
    "announcement": "群公告内容",
    "memberCount": 5,
    "createTime": 1234567890,
    "creatorId": 1,
    "creator_id": 1,
    "qr_code_url": "https://example.com/qrcode.png"
  }
}
```

**关键字段**:
- `creatorId` 或 `creator_id`: 群主ID（用于判断当前用户是否是群主）
- `memberCount`: 群成员数量
- `createTime`: 群创建时间戳

---

### 2. 获取群成员列表

**端点**: `GET /api/groups/{groupId}/members`

**请求头**:
```
Authorization: Bearer {token}
```

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nickname": "张三",
      "username": "zhangsan",
      "avatar": "https://example.com/avatar1.jpg",
      "role": "owner",
      "joinTime": 1234567890,
      "group_nickname": "群内昵称"
    },
    {
      "id": 2,
      "nickname": "李四",
      "username": "lisi",
      "avatar": "https://example.com/avatar2.jpg",
      "role": "member",
      "joinTime": 1234567891,
      "group_nickname": ""
    }
  ]
}
```

**关键字段**:
- `role`: 成员角色（'owner'、'creator'、'admin'、'member'）
- `avatar`: 用户头像 URL
- `nickname`: 用户昵称
- `joinTime`: 加入时间戳

---

### 3. 批量获取用户信息

**端点**: `GET /api/users/batch?ids={userIds}`

**请求参数**:
- `ids`: 用户ID列表，逗号分隔（例如：`1,2,3`）

**请求头**:
```
Authorization: Bearer {token}
```

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nickname": "张三",
      "username": "zhangsan",
      "avatar": "https://example.com/avatar1.jpg"
    },
    {
      "id": 2,
      "nickname": "李四",
      "username": "lisi",
      "avatar": "https://example.com/avatar2.jpg"
    }
  ]
}
```

---

### 4. 删除群聊

**端点**: `DELETE /api/groups/{groupId}`

**请求头**:
```
Authorization: Bearer {token}
```

**响应格式**:
```json
{
  "success": true,
  "message": "群聊已删除"
}
```

---

### 5. 编辑群名称

**端点**: `PUT /api/groups/{groupId}/name`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "新的群名称"
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "group_xxx",
    "name": "新的群名称"
  }
}
```

---

### 6. 编辑群公告

**端点**: `PUT /api/groups/{groupId}/announcement`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "announcement": "新的群公告"
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "group_xxx",
    "announcement": "新的群公告"
  }
}
```

---

### 7. 编辑群备注

**端点**: `PUT /api/groups/{groupId}/remark`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "remark": "群备注内容"
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "group_xxx",
    "remark": "群备注内容"
  }
}
```

---

## 🔑 关键实现要点

### 1. creatorId 字段
- **必须返回**: 在 `GET /api/groups/{groupId}` 响应中
- **用途**: 用于判断当前用户是否是群主
- **格式**: 可以是 `creatorId` 或 `creator_id`

### 2. 成员角色字段
- **必须返回**: 在 `GET /api/groups/{groupId}/members` 响应中
- **值**: `'owner'`、`'creator'`、`'admin'`、`'member'`
- **用途**: 用于判断成员权限和显示角色标记

### 3. 用户头像和昵称
- **必须返回**: 在 `GET /api/users/batch` 响应中
- **字段**: `avatar`、`nickname`、`username`
- **用途**: 显示真实用户信息

### 4. 错误处理
- **401 Unauthorized**: 用户未认证或 token 过期
- **403 Forbidden**: 用户无权限执行此操作
- **404 Not Found**: 群聊或用户不存在
- **500 Internal Server Error**: 服务器错误

---

## 📊 API 调用流程

```
1. 打开群管理页面
   ↓
2. 调用 GET /api/groups/{groupId}
   ↓
3. 获取群信息（名称、头像、公告等）
   ↓
4. 调用 GET /api/groups/{groupId}/members
   ↓
5. 获取成员列表和角色信息
   ↓
6. 显示群管理界面
```

---

## ✅ 检查清单

- [ ] `GET /api/groups/{groupId}` 返回 `creatorId` 字段
- [ ] `GET /api/groups/{groupId}/members` 返回正确的 `role` 字段
- [ ] `GET /api/users/batch` 接口已实现
- [ ] 所有 API 都支持 Bearer token 认证
- [ ] 错误响应格式统一
- [ ] 所有 API 都返回 `success` 字段

---

## 🎯 优先级

### 高优先级（必须实现）
1. ✅ `GET /api/groups/{groupId}` - 返回 `creatorId`
2. ✅ `GET /api/groups/{groupId}/members` - 返回 `role`
3. ✅ `GET /api/users/batch` - 批量获取用户信息

### 中优先级（应该实现）
4. `PUT /api/groups/{groupId}/name` - 编辑群名称
5. `PUT /api/groups/{groupId}/announcement` - 编辑群公告
6. `DELETE /api/groups/{groupId}` - 删除群聊

### 低优先级（可以后续实现）
7. `PUT /api/groups/{groupId}/remark` - 编辑群备注
8. 其他群管理 API

---

## 📝 测试命令

```bash
# 获取群聊详情
curl -H "Authorization: Bearer {token}" \
  http://localhost:8893/api/groups/group_xxx

# 获取群成员列表
curl -H "Authorization: Bearer {token}" \
  http://localhost:8893/api/groups/group_xxx/members

# 批量获取用户信息
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8893/api/users/batch?ids=1,2,3"
```

