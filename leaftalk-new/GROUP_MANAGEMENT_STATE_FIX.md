# 群管理页面状态恢复问题修复

## 问题描述

在群管理页面（`/group-management/:groupId`）中，用户修改以下两个开关设置后，切换到其他页面再返回时，这些开关会恢复到默认状态：

1. **群聊邀请确认** - `inviteConfirmEnabled`
2. **仅群主/管理员可修改群名称** - `nameEditRestricted`

## 根本原因分析

### 问题的三个层面

#### 1. 路由配置问题（主要原因）
- **文件**: `src/router/index.ts` (第 1078 行)
- **问题**: `GroupManagement` 路由的 `keepAlive` 设置为 `false`
- **影响**: 页面不被缓存，每次返回都会重新创建组件，导致状态丢失

```typescript
// ❌ 修改前
meta: {
  keepAlive: false,  // 页面不被缓存
  ...
}
```

#### 2. 生命周期钩子问题
- **文件**: `src/modules/chat/pages/GroupManagement.vue`
- **问题**: 缺少 `onActivated` 钩子
- **影响**: 即使启用 keep-alive，页面返回时也不会重新加载数据

#### 3. 变量声明问题
- **文件**: `src/modules/chat/pages/EditGroupName.vue`
- **问题**: 引用了未声明的 `nameEditRestricted` 变量
- **影响**: 权限检查逻辑无法正常工作

## 修复方案

### 修复 1: 启用 keep-alive 缓存

**文件**: `src/router/index.ts`

```typescript
// ✅ 修改后
{
  path: '/group-management/:groupId',
  name: 'GroupManagement',
  component: () => import('../modules/chat/pages/GroupManagement.vue'),
  meta: {
    title: '群管理',
    requiresAuth: true,
    keepAlive: true,  // ✅ 改为 true，启用页面缓存
    showBack: true,
    hideTopBar: false,
    topBarTitle: '群管理'
  }
}
```

**作用**: 
- 页面被 `keep-alive` 缓存
- 切换页面返回时，组件不会被销毁
- `onActivated` 钩子会被触发

### 修复 2: 添加 onActivated 生命周期钩子

**文件**: `src/modules/chat/pages/GroupManagement.vue`

```typescript
import { ref, onMounted, onActivated } from 'vue'

// 页面激活时重新加载数据（从其他页面返回时）
onActivated(() => {
  console.log('🔄 GroupManagement 页面已激活，重新加载群聊设置')
  loadGroupInfo()
  loadMembers()
})
```

**作用**:
- 页面从缓存中恢复时，自动重新加载最新的群聊设置
- 确保开关状态与后端数据同步

### 修复 3: 声明缺失的变量

**文件**: `src/modules/chat/pages/EditGroupName.vue`

```typescript
const groupName = ref('')
const nameLength = ref(0)
const originalName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)
const nameEditRestricted = ref(false)  // ✅ 添加声明
```

**作用**:
- 修复权限检查逻辑
- 确保群名称修改权限设置正确

## 工作流程

### 修改前的流程（有问题）
```
1. 用户进入群管理页面
   ↓
2. 页面加载，显示当前设置
   ↓
3. 用户修改开关（例如：启用"群聊邀请确认"）
   ↓
4. 调用 updateInviteConfirm() 更新后端
   ↓
5. 用户切换到其他页面
   ❌ 组件被销毁（keepAlive: false）
   ↓
6. 用户返回群管理页面
   ❌ 组件重新创建，状态重置为默认值
   ↓
7. 显示错误的状态（开关恢复到默认）
```

### 修改后的流程（正确）
```
1. 用户进入群管理页面
   ↓
2. onMounted() 加载初始数据
   ↓
3. 用户修改开关
   ↓
4. updateInviteConfirm() 更新后端
   ↓
5. 用户切换到其他页面
   ✅ 组件被缓存（keepAlive: true）
   ↓
6. 用户返回群管理页面
   ✅ onActivated() 被触发
   ✅ 重新加载最新的群聊设置
   ↓
7. 显示正确的状态（开关保持用户设置）
```

## 测试步骤

1. **打开群管理页面**
   ```
   http://127.0.0.1:5173/group-management/group_1760709734798
   ```

2. **修改开关设置**
   - 启用/禁用"群聊邀请确认"
   - 启用/禁用"仅群主/管理员可修改群名称"
   - 观察控制台日志确认 API 调用成功

3. **切换页面**
   - 点击返回按钮或导航到其他页面
   - 再次返回群管理页面

4. **验证结果**
   - ✅ 开关状态应该保持用户设置
   - ✅ 控制台应该显示 `🔄 GroupManagement 页面已激活，重新加载群聊设置`
   - ✅ 开关状态应该与后端数据同步

## 相关文件修改

| 文件 | 修改内容 | 行号 |
|------|--------|------|
| `src/router/index.ts` | 将 `keepAlive` 改为 `true` | 1078 |
| `src/modules/chat/pages/GroupManagement.vue` | 添加 `onActivated` 钩子 | 104-108 |
| `src/modules/chat/pages/EditGroupName.vue` | 声明 `nameEditRestricted` 变量 | 43 |

## 性能考虑

- **keep-alive 缓存**: 只缓存 `GroupManagement` 页面，不会显著增加内存占用
- **重新加载数据**: 仅在页面激活时执行，不会频繁调用 API
- **用户体验**: 页面切换更快，因为不需要重新创建组件

## 验证完成

✅ 所有修复已完成并测试
✅ 代码已热更新
✅ 可以在浏览器中实时验证

