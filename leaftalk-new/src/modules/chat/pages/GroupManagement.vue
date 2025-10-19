<template>
  <div class="page">
    <div class="body scroll-container">
      <!-- 群聊邀请确认 -->
      <div class="management-item toggle-item">
        <div class="item-content">
          <div class="item-title">群聊邀请确认</div>
        </div>
        <label class="toggle-switch">
          <input
            type="checkbox"
            v-model="inviteConfirmEnabled"
            @change="updateInviteConfirm"
            class="toggle-input"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- 权限设置 -->
      <div class="management-item toggle-item">
        <div class="item-content">
          <div class="item-title">仅群主/管理员可修改群名称</div>
        </div>
        <label class="toggle-switch">
          <input
            type="checkbox"
            v-model="nameEditRestricted"
            @change="updateNameEditRestriction"
            class="toggle-input"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- 群聊邀请申请 - 群聊邀请确认开启后显示，群主和管理员可见 -->
      <div v-if="inviteConfirmEnabled && (isGroupOwner || currentUserRole === 'admin')" class="management-item" @click="viewInviteRequests">
        <div class="item-content">
          <div class="item-title">群聊邀请申请</div>
        </div>
        <div class="item-right">
          <!-- 申请人头像列表 -->
          <div v-if="pendingRequestAvatars.length > 0" class="request-avatars">
            <img
              v-for="(avatar, index) in pendingRequestAvatars"
              :key="index"
              :src="avatar"
              class="request-avatar"
              :style="{ zIndex: pendingRequestAvatars.length - index }"
            />
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="20" color="#999"></iconify-icon>
        </div>
      </div>

      <!-- 群管理员管理 - 群主和管理员可见 -->
      <div v-if="isGroupOwner || currentUserRole === 'admin'" class="management-item" @click="manageAdmins">
        <div class="item-content">
          <div class="item-title">群管理员</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="20" color="#999"></iconify-icon>
      </div>

      <!-- 群主权限转让 - 仅群主可见 -->
      <div v-if="isGroupOwner" class="management-item" @click="transferOwnership">
        <div class="item-content">
          <div class="item-title">转让群主权限</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="20" color="#999"></iconify-icon>
      </div>

      <!-- 解散群聊 - 仅群主可见 -->
      <div v-if="isGroupOwner" class="management-item danger danger-center danger-spacing" @click="dissolveGroup">
        <div class="item-content center">
          <div class="item-title" style="color: #ff3b30;">解散该群聊</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/shared/stores/appStore'
import { useAuthStore } from '@/stores/auth'
import { showConfirm } from '@/shared/utils/dialog'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const socket = inject<any>('socket', null)

// 响应式数据
const groupId = ref(route.params.groupId as string)
const groupInfo = ref({
  id: '',
  name: '',
  avatar: '',
  announcement: '',
  memberCount: 0,
  createTime: 0
})

const members = ref<any[]>([])
const loading = ref(false)
const inviteConfirmEnabled = ref(false)
const nameEditRestricted = ref(true)
const isGroupOwner = ref(false)
const currentUserRole = ref('')
const unreadRequestCount = ref(0)
// 待审核的申请人头像列表（最多5个）
const pendingRequestAvatars = ref<string[]>([])

// WebSocket事件处理
const handleNewInviteRequest = (data: any) => {
  console.log('🔔 收到新的邀请申请通知:', data)
  if (data.groupId === groupId.value) {
    unreadRequestCount.value++
  }
}

// 生命周期
onMounted(() => {
  loadGroupInfo()
  loadMembers()
  loadUnreadRequestCount()

  // 监听新的邀请申请
  if (socket) {
    socket.on('new_group_invite_request', handleNewInviteRequest)
  }
})

// 页面激活时重新加载数据（从其他页面返回时）
onActivated(() => {
  console.log('🔄 GroupManagement 页面已激活，重新加载群聊设置')
  loadGroupInfo()
  loadMembers()
  loadUnreadRequestCount()
})

// 清理
onUnmounted(() => {
  if (socket) {
    socket.off('new_group_invite_request', handleNewInviteRequest)
  }
})

// 方法
const loadGroupInfo = async () => {
  try {
    loading.value = true
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        groupInfo.value = {
          id: result.data.id,
          name: result.data.name || '群聊',
          avatar: result.data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.data.id}`,
          announcement: result.data.announcement || '',
          memberCount: result.data.memberCount || 0,
          createTime: result.data.createTime || Date.now()
        }

        // 加载群聊设置
        inviteConfirmEnabled.value = result.data.require_approval === 1 || result.data.require_approval === true
        nameEditRestricted.value = result.data.only_admin_can_rename === 1 || result.data.only_admin_can_rename === true

        console.log('✅ 群组信息加载成功:', {
          groupInfo: groupInfo.value,
          inviteConfirmEnabled: inviteConfirmEnabled.value,
          nameEditRestricted: nameEditRestricted.value
        })
      }
    }
  } catch (error) {
    console.error('❌ 加载群组信息失败:', error)
    appStore.showToast('加载群组信息失败', 'error')
  } finally {
    loading.value = false
  }
}

const loadMembers = async () => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/members`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        members.value = result.data
        console.log('✅ 群成员加载成功:', members.value)

        // 检查当前用户的角色
        const currentUser = members.value.find((m: any) => m.id === authStore.user?.id)
        if (currentUser) {
          currentUserRole.value = currentUser.role
          isGroupOwner.value = currentUser.role === 'creator' || currentUser.role === 'owner'
          console.log('✅ 当前用户角色:', currentUserRole.value, '是否群主:', isGroupOwner.value)
        }
      }
    }
  } catch (error) {
    console.error('❌ 加载群成员失败:', error)
  }
}

// 更新群聊邀请确认设置
const updateInviteConfirm = async () => {
  try {
    console.log('🔄 更新群聊邀请确认设置:', inviteConfirmEnabled.value)
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        require_approval: inviteConfirmEnabled.value,
        send_system_message: true  // 发送系统消息
      })
    })

    if (response.ok) {
      appStore.showToast('设置已更新', 'success')
      console.log('✅ 群聊邀请确认设置已更新')
    }
  } catch (error) {
    console.error('❌ 更新设置失败:', error)
    appStore.showToast('更新失败', 'error')
  }
}

// 更新群名称修改权限
const updateNameEditRestriction = async () => {
  try {
    console.log('🔄 更新群名称修改权限:', nameEditRestricted.value)
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        name_edit_restricted: nameEditRestricted.value
      })
    })

    if (response.ok) {
      appStore.showToast('设置已更新', 'success')
      console.log('✅ 群名称修改权限已更新')

      // 触发事件通知其他组件权限已更改
      window.dispatchEvent(new CustomEvent('group-name-edit-permission-changed', {
        detail: {
          groupId: groupId.value,
          nameEditRestricted: nameEditRestricted.value
        }
      }))
      console.log('✅ 已触发group-name-edit-permission-changed事件')
    }
  } catch (error) {
    console.error('❌ 更新设置失败:', error)
    appStore.showToast('更新失败', 'error')
  }
}

// 加载未读申请数量和申请人头像
const loadUnreadRequestCount = async () => {
  try {
    const response = await fetch(`http://localhost:8893/api/groups/${groupId.value}/invite-requests`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        // 筛选出待处理的申请
        const pendingRequests = result.data.filter((req: any) => req.status === 'pending')
        unreadRequestCount.value = pendingRequests.length

        // 获取最新的5个申请人头像
        pendingRequestAvatars.value = pendingRequests
          .slice(0, 5)
          .map((req: any) => req.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user_id}`)

        console.log('✅ 未读申请数量:', unreadRequestCount.value)
        console.log('✅ 申请人头像:', pendingRequestAvatars.value.length)
      }
    }
  } catch (error) {
    console.error('❌ 加载未读申请数量失败:', error)
  }
}

// 查看群聊邀请申请
const viewInviteRequests = () => {
  router.push(`/group-invite-requests/${groupId.value}`)
  // 清零未读数量
  unreadRequestCount.value = 0
}

// 管理群管理员
const manageAdmins = () => {
  router.push(`/group-admins/${groupId.value}`)
}

// 转让群主权限
const transferOwnership = () => {
  router.push(`/transfer-ownership/${groupId.value}`)
}

// 解散群聊
const dissolveGroup = async () => {
  const confirmed = await showConfirm({
    title: '解散群聊',
    content: '确定要解散此群聊吗？此操作不可撤销。',
    confirmText: '解散',
    cancelText: '取消'
  })

  if (confirmed) {
    router.push(`/group-info/${groupId.value}`)
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F7F7F7;
  display: flex;
  flex-direction: column;
}

.body {
  padding: 0;
  padding-bottom: 100px;
  flex: 1;
}

.management-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: white;
  padding: 0 16px;
  height: 42px;
  border-bottom: 1px solid #EDEDED;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 2px;
}

.management-item:hover {
  background: #f5f5f5;
}

.management-item.danger:hover {
  background: #fff5f5;
}

.management-item.toggle-item {
  cursor: default;
}

.management-item.toggle-item:hover {
  background: white;
}

.management-item.invite-item {
  cursor: pointer;
  background: #f9f9f9;
}

.management-item.invite-item:hover {
  background: #f0f0f0;
}

.management-item.danger-center {
  justify-content: center;
}

.management-item.danger-spacing {
  margin-bottom: 10px;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.item-content.center {
  flex: none;
  text-align: center;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 申请人头像列表 */
.request-avatars {
  display: flex;
  align-items: center;
  margin-right: 4px;
}

.request-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #fff;
  margin-left: -8px;
  object-fit: cover;
}

.request-avatar:first-child {
  margin-left: 0;
}

.unread-badge {
  background: #ff3b30;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1;
}

.item-desc {
  font-size: 12px;
  color: #999;
  margin: 0;
  line-height: 1;
}

.scroll-container {
  overflow-y: auto;
  max-height: calc(100vh - 100px);
}

/* 切换开关样式 */
.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  margin: 0;
  z-index: 1;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
  pointer-events: none;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  top: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: #07c160;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(22px);
}
</style>

