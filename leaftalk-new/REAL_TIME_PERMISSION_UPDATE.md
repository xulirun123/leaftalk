# 实时权限更新功能完成

## 📋 功能说明

当用户在群管理页面修改"仅群主/管理员可修改群名称"权限设置时，群聊信息页面会实时更新权限状态，用户点击"群聊名称"项时会立即检查最新的权限设置。

## ✅ 完成的修改

### 1. GroupManagement.vue - 触发权限变化事件
**文件**: `leaftalk-new/src/modules/chat/pages/GroupManagement.vue` (第 189-221 行)

**修改内容**:
- 在 `updateNameEditRestriction` 函数中，当权限设置更新成功后，触发 `group-name-edit-permission-changed` 事件
- 事件包含 `groupId` 和 `nameEditRestricted` 两个参数

```javascript
// 触发事件通知其他组件权限已更改
window.dispatchEvent(new CustomEvent('group-name-edit-permission-changed', {
  detail: { 
    groupId: groupId.value, 
    nameEditRestricted: nameEditRestricted.value 
  }
}))
```

### 2. GroupInfo.vue - 监听权限变化事件并实时更新
**文件**: `leaftalk-new/src/modules/chat/pages/GroupInfo.vue`

**修改内容**:

#### a. 改进 loadGroupSettings 函数 (第 524-549 行)
- 正确处理后端返回的字段名 (`only_admin_can_rename` 和 `invite_confirm_enabled`)
- 支持多种字段名的兼容性

```javascript
groupSettings.value.onlyAdminCanRename = result.data.only_admin_can_rename === 1 || result.data.only_admin_can_rename === true
groupSettings.value.requireApproval = result.data.invite_confirm_enabled === 1 || result.data.invite_confirm_enabled === true || result.data.require_approval === 1 || result.data.require_approval === true
```

#### b. 添加权限变化事件处理函数 (第 1110-1119 行)
- 监听 `group-name-edit-permission-changed` 事件
- 实时更新 `groupSettings.value.onlyAdminCanRename`

```javascript
const handlePermissionChanged = (event: Event) => {
  const customEvent = event as CustomEvent
  const { groupId, nameEditRestricted } = customEvent.detail
  
  if (groupId === route.params.id) {
    groupSettings.value.onlyAdminCanRename = nameEditRestricted
    console.log('✅ 权限设置已实时更新:', { onlyAdminCanRename: nameEditRestricted })
  }
}
```

#### c. 在 onMounted 中注册事件监听 (第 1106-1107 行)
```javascript
window.addEventListener('group-name-edit-permission-changed', handlePermissionChanged)
```

#### d. 在 onActivated 中重新加载权限设置 (第 1127 行)
```javascript
await loadGroupSettings()  // 重新加载权限设置
```

#### e. 在 onUnmounted 中移除事件监听 (第 1139 行)
```javascript
window.removeEventListener('group-name-edit-permission-changed', handlePermissionChanged)
```

### 3. editGroupName 函数 - 检查权限
**文件**: `leaftalk-new/src/modules/chat/pages/GroupInfo.vue` (第 676-690 行)

**现有逻辑**:
- 当用户点击"群聊名称"项时，检查 `groupSettings.value.onlyAdminCanRename`
- 如果权限限制且用户是普通成员，显示错误提示并阻止进入编辑页面
- 否则允许进入编辑群名称页面

```javascript
const editGroupName = () => {
  console.log('修改群聊名称')

  // 检查是否只允许管理员修改群名称
  if (groupSettings.value.onlyAdminCanRename) {
    // 检查当前用户角色
    if (currentUserRole.value === 'member') {
      appStore.showToast('您不能修改群名称', 'error')
      return
    }
  }

  // 跳转到编辑群聊名称页面
  router.push(`/edit-group-name/${groupInfo.value.id}`)
}
```

## 🎯 工作流程

```
1. 用户在群管理页面切换"仅群主/管理员可修改群名称"开关
   ↓
2. GroupManagement.vue 调用 updateNameEditRestriction()
   ↓
3. 后端更新数据库中的 only_admin_can_rename 字段
   ↓
4. 前端触发 group-name-edit-permission-changed 事件
   ↓
5. GroupInfo.vue 监听到事件，实时更新 groupSettings.value.onlyAdminCanRename
   ↓
6. 用户点击"群聊名称"项
   ↓
7. editGroupName() 检查最新的权限设置
   ↓
8. 如果有权限，进入编辑页面；否则显示错误提示
```

## ✨ 功能特性

- ✅ 权限设置变化时实时更新
- ✅ 用户点击群聊名称时检查最新权限
- ✅ 权限不足时显示友好的错误提示
- ✅ 支持多个群聊的独立权限管理
- ✅ 页面返回时重新加载权限设置
- ✅ 组件卸载时正确清理事件监听

## 🔍 测试步骤

1. 打开群聊信息页面
2. 进入群管理页面
3. 切换"仅群主/管理员可修改群名称"开关
4. 返回群聊信息页面
5. 用普通成员账号点击"群聊名称"项
6. 验证是否显示权限错误提示或允许进入编辑页面

