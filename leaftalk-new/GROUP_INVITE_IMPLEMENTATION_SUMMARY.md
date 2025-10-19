# 群聊邀请流程实现总结

## 实现概述

已完成群聊邀请好友加入的完整流程，支持两种模式：
1. **未开启群聊邀请确认**：所有邀请直接加入
2. **开启群聊邀请确认**：群主/管理员邀请直接加入，普通成员邀请需要审核

## 实现的功能

### 1. 邀请流程
- ✅ 群主/管理员邀请好友 → 发送邀请链接 → 被邀请人点击确认 → 直接加入
- ✅ 普通成员邀请好友（未开启确认）→ 发送邀请链接 → 被邀请人点击确认 → 直接加入
- ✅ 普通成员邀请好友（开启确认）→ 发送邀请链接 → 被邀请人点击确认 → 输入申请理由 → 提交申请 → 等待审核

### 2. 审核流程
- ✅ 群主/管理员查看邀请申请列表
- ✅ 显示未读申请条数（红色数字）
- ✅ 同意/拒绝申请
- ✅ 实时通知申请人审核结果
- ✅ 任意管理员/群主处理后，其他人看到的申请状态同步更新

### 3. 状态管理
- ✅ 邀请卡片状态：pending（待处理）、joined（已加入）、waiting（等待审核）、approved（审核通过）、rejected（审核被拒）
- ✅ 申请状态：pending（待处理）、approved（已同意）、rejected（已拒绝）

## 修改的文件

### 前端文件

#### 1. InviteToGroup.vue
**修改内容：**
- 修改邀请API为 `/api/groups/:groupId/invite-request`
- 传递 `inviteeIds` 参数

**代码位置：** `leaftalk-new/src/modules/chat/pages/InviteToGroup.vue`

#### 2. GroupInviteCard.vue
**修改内容：**
- 添加申请理由输入框
- 添加 `needApprovalForJoin` 状态判断
- 添加 `checkIfNeedApproval()` 方法检查是否需要审核
- 修改确认对话框，根据是否需要审核显示不同内容
- 传递申请理由到后端API

**代码位置：** `leaftalk-new/src/modules/chat/components/GroupInviteCard.vue`

#### 3. GroupManagement.vue
**修改内容：**
- 添加 `unreadRequestCount` 状态
- 添加 `loadUnreadRequestCount()` 方法
- 添加未读申请条数显示（红色数字）
- 监听 WebSocket 事件 `new_group_invite_request` 更新未读数量
- 点击"群聊邀请申请"时清零未读数量

**代码位置：** `leaftalk-new/src/modules/chat/pages/GroupManagement.vue`

#### 4. GroupInviteRequests.vue
**修改内容：**
- 添加 MobileTopBar 顶部导航栏
- 添加 `goBack()` 方法
- 调整样式，添加 `margin-top: 75px`

**代码位置：** `leaftalk-new/src/modules/chat/pages/GroupInviteRequests.vue`

### 后端文件

#### server/app.js
**新增API：**

1. **GET /api/groups/invite-link-info**
   - 获取邀请链接信息（判断是否需要审核）
   - 返回：groupId, inviterId, requireApproval, isInviterAdmin

2. **GET /api/groups/:groupId/invite-requests**
   - 获取群聊邀请申请列表
   - 仅群主和管理员可访问
   - 返回所有申请，按状态和时间排序

3. **GET /api/groups/:groupId/invite-requests/unread-count**
   - 获取未读申请数量
   - 仅群主和管理员可访问
   - 返回待处理申请数量

4. **POST /api/groups/:groupId/invite-requests/:requestId/accept**
   - 同意邀请申请
   - 仅群主和管理员可操作
   - 添加用户到群聊
   - 发送系统消息
   - 通过 WebSocket 通知申请人和群成员

5. **POST /api/groups/:groupId/invite-requests/:requestId/reject**
   - 拒绝邀请申请
   - 仅群主和管理员可操作
   - 更新申请状态
   - 通过 WebSocket 通知申请人

**修改API：**

1. **POST /api/groups/join-by-invite**
   - 添加 `reason` 参数支持申请理由
   - 创建申请时保存申请理由
   - 通过 WebSocket 通知群主和管理员有新申请

**代码位置：** `leaftalk-new/server/app.js`

## WebSocket事件

### 新增事件

1. **new_group_invite_request**
   - 触发时机：普通成员邀请需要审核时
   - 接收者：群主和管理员
   - 数据：{ groupId, groupName, applicantId }

2. **group_join_approved**
   - 触发时机：申请被同意
   - 接收者：申请人
   - 数据：{ groupId, groupName, groupAvatar }

3. **group_join_rejected**
   - 触发时机：申请被拒绝
   - 接收者：申请人
   - 数据：{ groupId }

## 数据库表

### group_invite_links
- 存储群聊邀请链接
- 字段：id, group_id, invite_code, inviter_id, max_uses, used_count, expire_at, is_active, created_at

### group_join_requests
- 存储群聊加入申请
- 字段：id, group_id, user_id, message（申请理由）, status, inviter_id, invite_code, created_at, updated_at

## 业务逻辑

### 邀请逻辑
1. 邀请人点击"邀请好友"，选择好友
2. 调用 `/api/groups/:groupId/invite-request` 生成邀请码
3. 发送群聊邀请卡片消息给被邀请人和邀请人

### 加入逻辑
1. 被邀请人点击邀请卡片
2. 检查是否已是群成员
3. 检查是否有待处理的申请
4. 调用 `/api/groups/invite-link-info` 判断是否需要审核
5. 弹出确认对话框
   - 不需要审核：显示"确定要加入吗？"
   - 需要审核：显示申请理由输入框
6. 调用 `/api/groups/join-by-invite` 加入或提交申请

### 审核逻辑
1. 群主/管理员进入"群管理"
2. 查看"群聊邀请申请"右侧的未读数字
3. 点击进入申请列表
4. 查看申请详情（头像、昵称、申请理由）
5. 点击"接受"或"拒绝"
6. 更新申请状态
7. 通知申请人和群成员

## 权限控制

### 邀请权限
- 群主：可以邀请
- 管理员：可以邀请
- 普通成员：可以邀请（但可能需要审核）

### 审核权限
- 群主：可以查看和处理申请
- 管理员：可以查看和处理申请
- 普通成员：不可以查看和处理申请

### 加入规则
- 群主/管理员邀请：直接加入（无论群设置如何）
- 普通成员邀请 + 未开启确认：直接加入
- 普通成员邀请 + 开启确认：需要审核

## 测试建议

### 测试用户
- 用户1（ID: 6）：群主
- 用户2（ID: 15）：普通成员
- 测试群聊：group_1759751622485

### 测试步骤
1. 测试未开启确认的情况
   - 群主邀请 → 直接加入
   - 普通成员邀请 → 直接加入

2. 测试开启确认的情况
   - 群主开启"群聊邀请确认"
   - 群主邀请 → 直接加入
   - 普通成员邀请 → 需要审核
   - 查看未读申请数量
   - 同意/拒绝申请
   - 验证通知和状态更新

## 注意事项

1. **申请理由**：可选，最多100字符
2. **未读数量**：查看申请列表后清零
3. **状态同步**：任意管理员/群主处理后，其他人看到的状态同步更新
4. **重复申请**：已有待处理申请时，不能重复提交
5. **已是成员**：已是群成员时，不能再次加入

## 文档
- 测试文档：`GROUP_INVITE_FLOW_TEST.md`
- 实现总结：`GROUP_INVITE_IMPLEMENTATION_SUMMARY.md`

