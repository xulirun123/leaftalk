# 群管理功能 - 快速参考

## 🚀 快速启动

```bash
# 一键启动所有服务
npm run start:simple

# 或分别启动
npm run server      # 后端
npm run dev         # 前端
```

**访问**: http://localhost:5173

---

## 📍 页面导航

### 进入群管理页面的路径
```
主页 → 聊天 → 选择群聊 → 群聊信息 → 群管理
```

### 路由
```
/group-management/{groupId}
```

---

## 🎯 群管理功能列表

| 功能 | 路由 | 状态 |
|------|------|------|
| 查看成员 | `/group-members/{groupId}` | ✅ 完成 |
| 管理员 | `/add-group-admin/{groupId}` | ⚠️ 建设中 |
| 移除成员 | `/remove-group-members/{groupId}` | ⚠️ 建设中 |
| 群名称 | `/edit-group-name/{groupId}` | ✅ 完成 |
| 群公告 | `/group-announcement/{groupId}` | ✅ 完成 |
| 群二维码 | `/group-qrcode/{groupId}` | ✅ 完成 |
| 转让群主 | `/transfer-ownership/{groupId}` | ⚠️ 建设中 |
| 解散群聊 | 直接删除 | ✅ 完成 |

---

## 🔧 关键文件

### 前端
- `src/modules/chat/pages/GroupManagement.vue` - 群管理页面
- `src/modules/chat/pages/GroupInfo.vue` - 群聊信息页面
- `src/modules/chat/pages/GroupMembers.vue` - 群成员列表

### 后端
- `server/app.js` - 主服务器文件
- 需要实现的 API 端点见下文

---

## 📊 后端 API 需求

### 必须实现

#### 1. 获取群聊详情
```
GET /api/groups/{groupId}
```
**关键**: 必须返回 `creatorId` 字段

#### 2. 获取群成员
```
GET /api/groups/{groupId}/members
```
**关键**: 必须返回正确的 `role` 字段（owner/admin/member）

#### 3. 批量获取用户信息
```
GET /api/users/batch?ids=1,2,3
```
**关键**: 返回用户的 avatar、nickname、username

---

## 🐛 常见问题

### Q: 页面显示"功能建设中"
**A**: 刷新浏览器或清除缓存

### Q: groupId 为 undefined
**A**: 已修复，确保使用 `route.params.groupId`

### Q: 后端连接失败
**A**: 运行 `npm run server` 启动后端

### Q: API 返回 401
**A**: 重新登录或检查 token

---

## 📝 文档

| 文档 | 内容 |
|------|------|
| `GROUP_MANAGEMENT_RESTORATION.md` | 恢复总结 |
| `BACKEND_API_REQUIREMENTS.md` | API 详细规范 |
| `GROUP_MANAGEMENT_TESTING_GUIDE.md` | 完整测试指南 |
| `FINAL_SUMMARY.md` | 最终总结 |
| `QUICK_REFERENCE.md` | 本文件 |

---

## ✅ 检查清单

启动前检查:
- [ ] Node.js 已安装
- [ ] npm 依赖已安装 (`npm install`)
- [ ] 数据库已初始化 (`npm run init`)
- [ ] Redis 已启动（如果需要）

启动后检查:
- [ ] 后端运行在 http://localhost:8893
- [ ] 前端运行在 http://localhost:5173
- [ ] 可以正常登录
- [ ] 可以进入群聊
- [ ] 可以打开群管理页面

---

## 🎯 下一步

1. **实现后端 API**
   - 返回 creatorId
   - 返回正确的 role
   - 实现 /api/users/batch

2. **实现子页面**
   - AddGroupAdmin.vue
   - GroupAdmins.vue
   - RemoveGroupMembers.vue
   - TransferOwnership.vue

3. **测试验证**
   - 按照测试指南进行测试
   - 检查浏览器控制台日志
   - 验证 API 调用

---

## 💡 提示

- 使用浏览器开发者工具 (F12) 查看网络请求和控制台日志
- 检查 Network 标签中的 API 调用是否成功
- 查看 Console 标签中的错误信息
- 使用 curl 命令测试 API 端点

---

## 📞 支持

如有问题，请检查:
1. 浏览器控制台是否有错误
2. 后端服务器是否正在运行
3. 网络请求是否成功（Network 标签）
4. 相关文档是否有解决方案

---

**最后更新**: 2024年
**状态**: ✅ 群管理功能已恢复

