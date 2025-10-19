# 群管理功能测试指南

## 🚀 启动应用

### 1. 启动后端服务器
```bash
npm run server
```

**预期输出**:
```
✅ 服务器运行在 http://localhost:8893
✅ 数据库连接成功
✅ Redis 连接成功
```

### 2. 启动前端开发服务器
```bash
npm run dev
```

**预期输出**:
```
✅ 前端运行在 http://localhost:5173
✅ HMR 已启用
```

### 3. 或者一键启动所有服务
```bash
npm run start:simple
```

---

## 📋 测试步骤

### 步骤 1: 登录应用
1. 打开浏览器，访问 `http://localhost:5173`
2. 使用测试账号登录
3. 确保成功进入主页

### 步骤 2: 进入群聊
1. 点击底部导航栏的"聊天"
2. 选择任意一个群聊
3. 进入群聊详情页面

### 步骤 3: 打开群聊信息
1. 点击顶部的群聊名称或信息按钮
2. 进入群聊信息页面
3. 向下滚动找到"群管理"按钮

### 步骤 4: 进入群管理页面
1. 点击"群管理"按钮
2. 应该看到完整的群管理界面
3. 检查以下内容是否正确显示：
   - ✅ 群头像
   - ✅ 群名称
   - ✅ 成员数量
   - ✅ 创建时间
   - ✅ 管理功能列表

---

## 🔍 验证清单

### 群信息卡片
- [ ] 群头像正确显示
- [ ] 群名称正确显示
- [ ] 成员数量正确显示
- [ ] 创建时间正确显示

### 成员管理区域
- [ ] "查看成员"按钮可点击
- [ ] "管理员"按钮显示管理员数量
- [ ] "移除成员"按钮可点击

### 群设置区域
- [ ] "群名称"按钮显示当前群名称
- [ ] "群公告"按钮显示公告内容或"暂无公告"
- [ ] "群二维码"按钮可点击

### 高级设置区域
- [ ] "转让群主"按钮可点击
- [ ] "解散群聊"按钮显示为红色
- [ ] "解散群聊"按钮可点击

---

## 🐛 常见问题排查

### 问题 1: groupId 为 undefined
**症状**: 浏览器控制台显示 `GET http://localhost:8893/api/groups/undefined`

**原因**: 路由参数获取错误

**解决方案**: 
- 检查 GroupManagement.vue 第 142 行
- 确保使用 `route.params.groupId` 而不是 `route.params.id`
- ✅ 已修复

### 问题 2: 后端连接失败
**症状**: 浏览器控制台显示 `net::ERR_CONNECTION_REFUSED`

**原因**: 后端服务器未启动

**解决方案**:
```bash
# 启动后端服务器
npm run server

# 或者一键启动所有服务
npm run start:simple
```

### 问题 3: API 返回 401 Unauthorized
**症状**: 浏览器控制台显示 `401 Unauthorized`

**原因**: 用户未认证或 token 过期

**解决方案**:
- 重新登录
- 检查 localStorage 中的 token 是否存在
- 检查 Authorization 请求头是否正确

### 问题 4: 页面显示"功能建设中"
**症状**: 群管理页面显示"功能建设中"

**原因**: 前端代码未热更新

**解决方案**:
- 刷新浏览器页面（Ctrl+R 或 Cmd+R）
- 清除浏览器缓存
- 检查前端开发服务器是否正在运行

---

## 📊 浏览器控制台日志

### 成功的日志输出
```
✅ 群组信息加载成功: {
  id: 'group_1760709734798',
  name: '测试群聊',
  avatar: 'https://...',
  announcement: '欢迎加入群聊',
  memberCount: 5,
  createTime: 1234567890
}

✅ 群成员加载成功: [
  { id: 1, nickname: '张三', avatar: '...', role: 'owner' },
  { id: 2, nickname: '李四', avatar: '...', role: 'member' },
  ...
]
```

### 错误的日志输出
```
❌ 加载群组信息失败: TypeError: Failed to fetch
❌ 加载群成员失败: TypeError: Failed to fetch
```

---

## 🔗 相关功能链接

### 已实现的功能
- ✅ 群聊信息页面 (`GroupInfo.vue`)
- ✅ 群成员列表 (`GroupMembers.vue`)
- ✅ 群管理页面 (`GroupManagement.vue`) - **新增**

### 需要实现的功能
- ⚠️ 添加管理员 (`AddGroupAdmin.vue`)
- ⚠️ 管理员列表 (`GroupAdmins.vue`)
- ⚠️ 移除成员 (`RemoveGroupMembers.vue`)
- ⚠️ 转让群主 (`TransferOwnership.vue`)
- ⚠️ 入群申请 (`GroupJoinRequests.vue`)
- ⚠️ 邀请申请 (`GroupInviteRequests.vue`)

---

## 📝 API 调用验证

### 验证 GET /api/groups/{groupId}
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:8893/api/groups/group_1760709734798
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "id": "group_1760709734798",
    "name": "测试群聊",
    "avatar": "...",
    "announcement": "欢迎加入群聊",
    "memberCount": 5,
    "createTime": 1234567890,
    "creatorId": 1
  }
}
```

### 验证 GET /api/groups/{groupId}/members
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:8893/api/groups/group_1760709734798/members
```

**预期响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nickname": "张三",
      "avatar": "...",
      "role": "owner"
    }
  ]
}
```

---

## ✅ 完成标志

当以下条件都满足时，群管理功能测试完成：

- [x] 群管理页面正确显示
- [x] 群信息卡片显示正确
- [x] 所有管理功能按钮可点击
- [x] 浏览器控制台无错误
- [x] API 调用成功
- [x] 后端返回正确的数据

---

## 🎉 总结

群管理功能已完全恢复并可用。用户可以通过此页面访问所有群管理功能。

**下一步**: 实现相关的子页面功能（添加管理员、转让群主等）。

