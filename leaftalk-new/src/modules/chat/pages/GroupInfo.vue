<template>
  <div class="group-info">
    <!-- 顶部导航 -->
    <MobileTopBar
      :title="`群聊信息(${groupInfo.memberCount})`"
      :show-back="true"
      :right-buttons="topBarButtons"
      @button-click="handleTopBarClick"
    />

    <!-- 群成员区域 -->
    <div class="members-section">
      <div class="members-grid">
        <!-- 显示的群成员 -->
        <div
          v-for="member in displayMembers"
          :key="member.id"
          class="member-item"
          @click="viewMemberProfile(member)"
        >
          <div class="member-avatar">
            <div class="avatar-placeholder">{{ member.name.charAt(0) }}</div>
          </div>
          <div v-if="showNicknames" class="member-name">{{ member.name }}</div>
        </div>

        <!-- 邀请好友按钮 -->
        <div class="member-item action-item" @click="inviteMembers">
          <div class="member-avatar action-avatar">
            <iconify-icon icon="heroicons:plus" width="24" style="color: #666;"></iconify-icon>
          </div>
          <div v-if="showNicknames" class="member-name">邀请</div>
        </div>

        <!-- 踢出群员按钮（仅管理员和群主显示） -->
        <div v-if="canManageMembers" class="member-item action-item" @click="removeMembers">
          <div class="member-avatar action-avatar">
            <iconify-icon icon="heroicons:minus" width="24" style="color: #666;"></iconify-icon>
          </div>
          <div v-if="showNicknames" class="member-name">移除</div>
        </div>
      </div>

      <!-- 更多群聊人员按钮 -->
      <div v-if="groupInfo.memberCount > 18" class="more-members-btn" @click="toggleShowAllMembers">
        <span>更多群聊人员</span>
        <iconify-icon
          :icon="showAllMembers ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
          width="16"
          style="color: #666;"
        ></iconify-icon>
      </div>
    </div>

    <!-- 群功能区域 -->
    <div class="group-functions">
      <div class="function-row">
        <div class="function-item" @click="startGroupCall('voice')">
          <iconify-icon icon="heroicons:phone" width="24" color="#07C160"></iconify-icon>
          <span>语音通话</span>
        </div>
        <div class="function-item" @click="startGroupCall('video')">
          <iconify-icon icon="heroicons:video-camera" width="24" color="#1976d2"></iconify-icon>
          <span>视频通话</span>
        </div>
        <div class="function-item" @click="sendGroupRedPacket">
          <iconify-icon icon="heroicons:gift" width="24" color="#ff4757"></iconify-icon>
          <span>群红包</span>
        </div>
        <div class="function-item" @click="groupTransfer">
          <iconify-icon icon="heroicons:banknotes" width="24" color="#ff9500"></iconify-icon>
          <span>群收款</span>
        </div>
      </div>
    </div>

    <!-- 群成员详情 -->
    <div class="group-members-section">
      <div class="section-header">
        <div class="section-title">群成员 ({{ groupInfo.memberCount }})</div>
        <button @click="showAllMembers" class="view-all-btn">查看全部</button>
      </div>

      <div class="members-list">
        <div
          v-for="member in displayedMembers"
          :key="member.id"
          class="member-row"
          @click="viewMemberProfile(member)"
        >
          <div class="member-avatar">
            <img :src="member.avatar" :alt="member.name" />
            <div v-if="member.role === 'owner'" class="role-badge owner">群主</div>
            <div v-else-if="member.role === 'admin'" class="role-badge admin">管理员</div>
          </div>
          <div class="member-info">
            <div class="member-name">
              {{ member.name }}
              <iconify-icon
                v-if="member.role === 'owner'"
                icon="heroicons:crown"
                width="14"
                color="#ffd700"
              ></iconify-icon>
              <iconify-icon
                v-else-if="member.role === 'admin'"
                icon="heroicons:shield-check"
                width="14"
                color="#07C160"
              ></iconify-icon>
            </div>
            <div class="member-status">
              <span :class="['online-status', { online: member.isOnline }]">
                {{ member.isOnline ? '在线' : formatLastSeen(member.lastSeen) }}
              </span>
            </div>
          </div>
          <div class="member-actions" v-if="canManageMembers && member.id !== currentUserId">
            <button
              v-if="member.role === 'member' && currentUserRole === 'owner'"
              @click.stop="setAsAdmin(member)"
              class="action-btn promote"
            >
              设为管理员
            </button>
            <button
              v-else-if="member.role === 'admin' && currentUserRole === 'owner'"
              @click.stop="removeAdmin(member)"
              class="action-btn demote"
            >
              取消管理员
            </button>
            <button
              v-if="canRemoveMember(member)"
              @click.stop="removeMember(member)"
              class="action-btn remove"
            >
              移出群聊
            </button>
          </div>
        </div>

        <!-- 添加成员按钮 -->
        <div v-if="canInviteMembers" class="member-row add-member-row" @click="inviteMembers">
          <div class="add-member-icon">
            <iconify-icon icon="heroicons:plus" width="24" color="#07C160"></iconify-icon>
          </div>
          <div class="member-info">
            <div class="member-name">邀请好友</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 群设置 -->
    <div class="group-settings">
      <!-- 基础设置 -->
      <div class="setting-section">
        <div class="setting-item" @click="editGroupName" v-if="canEditGroupInfo">
          <iconify-icon icon="heroicons:pencil" width="20" color="#666"></iconify-icon>
          <span>修改群名称</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>

        <div class="setting-item" @click="editGroupAvatar" v-if="canEditGroupInfo">
          <iconify-icon icon="heroicons:photo" width="20" color="#666"></iconify-icon>
          <span>修改群头像</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>

        <div class="setting-item" @click="editGroupAnnouncement" v-if="canEditGroupInfo">
          <iconify-icon icon="heroicons:megaphone" width="20" color="#666"></iconify-icon>
          <span>群公告</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>
      </div>

      <!-- 权限设置 -->
      <div class="setting-section" v-if="canManagePermissions">
        <div class="section-title">群权限管理</div>

        <div class="setting-item toggle-item">
          <iconify-icon icon="heroicons:user-plus" width="20" color="#666"></iconify-icon>
          <span>允许群成员邀请好友</span>
          <input
            v-model="groupSettings.allowMemberInvite"
            type="checkbox"
            class="toggle-switch"
            @change="updateGroupSettings"
          />
        </div>

        <div class="setting-item toggle-item">
          <iconify-icon icon="heroicons:chat-bubble-left" width="20" color="#666"></iconify-icon>
          <span>全员禁言</span>
          <input
            v-model="groupSettings.muteAll"
            type="checkbox"
            class="toggle-switch"
            @change="updateGroupSettings"
          />
        </div>

        <div class="setting-item toggle-item">
          <iconify-icon icon="heroicons:eye-slash" width="20" color="#666"></iconify-icon>
          <span>群聊内容保密</span>
          <input
            v-model="groupSettings.isPrivate"
            type="checkbox"
            class="toggle-switch"
            @change="updateGroupSettings"
          />
        </div>

        <div class="setting-item" @click="manageGroupPermissions">
          <iconify-icon icon="heroicons:cog-6-tooth" width="20" color="#666"></iconify-icon>
          <span>群权限设置</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>
      </div>

      <!-- 群管理 -->
      <div class="setting-section" v-if="currentUserRole === 'owner'">
        <div class="section-title">群管理</div>

        <div class="setting-item" @click="transferOwnership">
          <iconify-icon icon="heroicons:arrow-path" width="20" color="#ff9500"></iconify-icon>
          <span>转让群主</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>

        <div class="setting-item danger" @click="dissolveGroup">
          <iconify-icon icon="heroicons:trash" width="20" color="#ff4444"></iconify-icon>
          <span>解散群聊</span>
        </div>
      </div>

      <!-- 个人设置 -->
      <div class="setting-section">
        <div class="setting-item toggle-item">
          <iconify-icon icon="heroicons:bell-slash" width="20" color="#666"></iconify-icon>
          <span>消息免打扰</span>
          <input
            v-model="personalSettings.muteNotifications"
            type="checkbox"
            class="toggle-switch"
            @change="updatePersonalSettings"
          />
        </div>

        <div class="setting-item toggle-item">
          <iconify-icon icon="heroicons:star" width="20" color="#666"></iconify-icon>
          <span>置顶聊天</span>
          <input
            v-model="personalSettings.isPinned"
            type="checkbox"
            class="toggle-switch"
            @change="updatePersonalSettings"
          />
        </div>

        <div class="setting-item" @click="setGroupNickname">
          <iconify-icon icon="heroicons:identification" width="20" color="#666"></iconify-icon>
          <span>我在本群的昵称</span>
          <span class="setting-value">{{ personalSettings.groupNickname || '未设置' }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
        </div>
      </div>

      <!-- 退出群聊 -->
      <div class="setting-section">
        <div class="setting-item danger" @click="leaveGroup">
          <iconify-icon icon="heroicons:arrow-right-on-rectangle" width="20" color="#ff4444"></iconify-icon>
          <span>{{ currentUserRole === 'owner' ? '转让群主后退出' : '退出群聊' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()

// 当前用户信息
const currentUserId = ref('user1')
const currentUserRole = ref('owner') // owner, admin, member

// 群组信息
const groupInfo = ref({
  id: 'group123',
  name: '家族群聊',
  avatar: '/group-avatar.jpg',
  memberCount: 9,
  announcement: '欢迎大家加入家族群聊！请大家遵守群规，文明聊天。',
  createdAt: new Date('2024-01-01'),
  members: [
    {
      id: 'user1',
      name: '张三',
      avatar: '/avatar1.jpg',
      role: 'owner',
      isOnline: true,
      lastSeen: new Date(),
      joinTime: Date.now() - 86400000 * 30
    },
    {
      id: 'user2',
      name: '李四',
      avatar: '/avatar2.jpg',
      role: 'admin',
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000),
      joinTime: Date.now() - 86400000 * 25
    },
    {
      id: 'user3',
      name: '王五',
      avatar: '/avatar3.jpg',
      role: 'member',
      isOnline: true,
      lastSeen: new Date(),
      joinTime: Date.now() - 86400000 * 20
    },
    {
      id: 'user4',
      name: '赵六',
      avatar: '/avatar4.jpg',
      role: 'member',
      isOnline: false,
      lastSeen: new Date(Date.now() - 86400000),
      joinTime: Date.now() - 86400000 * 15
    },
    {
      id: 'user5',
      name: '钱七',
      avatar: '/avatar5.jpg',
      role: 'member',
      isOnline: true,
      lastSeen: new Date(),
      joinTime: Date.now() - 86400000 * 10
    }
  ]
})

// 群设置
const groupSettings = ref({
  allowMemberInvite: true,
  muteAll: false,
  isPrivate: false,
  allowMemberModifyInfo: false,
  requireApprovalForJoin: true
})

// 个人设置
const personalSettings = ref({
  muteNotifications: false,
  isPinned: false,
  groupNickname: ''
})

// 用于群头像显示的成员（最多9个，按加入时间排序）
const displayMembers = computed(() => {
  return groupInfo.value.members
    .sort((a, b) => a.joinTime - b.joinTime)
    .slice(0, 9)
})

// 显示的成员列表（前5个）
const displayedMembers = computed(() => {
  return groupInfo.value.members.slice(0, 5)
})

// 权限相关计算属性
const canManageMembers = computed(() => {
  return currentUserRole.value === 'owner' || currentUserRole.value === 'admin'
})

const canInviteMembers = computed(() => {
  if (currentUserRole.value === 'owner' || currentUserRole.value === 'admin') {
    return true
  }
  return groupSettings.value.allowMemberInvite
})

const canEditGroupInfo = computed(() => {
  return currentUserRole.value === 'owner' || currentUserRole.value === 'admin'
})

const canManagePermissions = computed(() => {
  return currentUserRole.value === 'owner'
})

const canRemoveMember = (member: any) => {
  if (currentUserRole.value === 'owner') {
    return member.role !== 'owner'
  }
  if (currentUserRole.value === 'admin') {
    return member.role === 'member'
  }
  return false
}

// 方法
const getAvatarText = (name: string) => {
  if (name.length === 0) return '?'
  if (name.length === 1) return name
  if (name.length === 2) return name
  return name.slice(-2)
}

// 群功能方法
const startGroupCall = (type: 'voice' | 'video') => {
  console.log(`发起群${type === 'voice' ? '语音' : '视频'}通话`)
  appStore.showToast(`发起群${type === 'voice' ? '语音' : '视频'}通话功能开发中`, 'info')
}

const sendGroupRedPacket = () => {
  console.log('发群红包')
  appStore.showToast('群红包功能开发中', 'info')
}

const groupTransfer = () => {
  console.log('群收款')
  appStore.showToast('群收款功能开发中', 'info')
}

// 成员管理方法
const showAllMembers = () => {
  router.push(`/group-members/${groupInfo.value.id}`)
}

const viewMemberProfile = (member: any) => {
  router.push(`/user-profile/${member.id}`)
}

const inviteMembers = () => {
  router.push(`/invite-to-group/${groupInfo.value.id}`)
}

const setAsAdmin = (member: any) => {
  member.role = 'admin'
  appStore.showToast(`已设置 ${member.name} 为管理员`, 'success')
}

const removeAdmin = (member: any) => {
  member.role = 'member'
  appStore.showToast(`已取消 ${member.name} 的管理员权限`, 'success')
}

const removeMember = (member: any) => {
  const index = groupInfo.value.members.findIndex(m => m.id === member.id)
  if (index > -1) {
    groupInfo.value.members.splice(index, 1)
    groupInfo.value.memberCount--
    appStore.showToast(`已移出群成员: ${member.name}`, 'success')
  }
}

// 群设置方法
const editGroupAvatar = () => {
  appStore.showToast('修改群头像功能开发中', 'info')
}

const editGroupAnnouncement = () => {
  router.push(`/group-announcement/${groupInfo.value.id}`)
}

const updateGroupSettings = () => {
  console.log('更新群设置:', groupSettings.value)
  appStore.showToast('群设置已更新', 'success')
}

const updatePersonalSettings = () => {
  console.log('更新个人设置:', personalSettings.value)
  appStore.showToast('设置已更新', 'success')
}

const manageGroupPermissions = () => {
  router.push(`/group-permissions/${groupInfo.value.id}`)
}

const transferOwnership = () => {
  router.push(`/transfer-group-owner/${groupInfo.value.id}`)
}

const dissolveGroup = () => {
  appStore.showToast('解散群聊功能开发中', 'info')
}

const setGroupNickname = () => {
  appStore.showToast('设置群昵称功能开发中', 'info')
}

const formatLastSeen = (lastSeen: Date) => {
  const now = new Date()
  const diff = now.getTime() - lastSeen.getTime()

  if (diff < 60000) return '刚刚在线'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前在线`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前在线`
  return `${Math.floor(diff / 86400000)}天前在线`
}

const addMember = () => {
  inviteMembers()
}

const editGroupName = () => {
  const newName = prompt('请输入新的群名称', groupInfo.value.name)
  if (newName && newName.trim()) {
    groupInfo.value.name = newName.trim()
  }
}

const leaveGroup = () => {
  if (currentUserRole.value === 'owner') {
    appStore.showToast('群主需要先转让群主权限才能退出群聊', 'warning')
    transferOwnership()
  } else {
    if (confirm('确定要退出群聊吗？')) {
      appStore.showToast('已退出群聊', 'success')
      router.push('/')
    }
  }
}

onMounted(() => {
  const groupId = route.params.id as string
  groupInfo.value.id = groupId
})
</script>

<style scoped>
.group-info {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding-top: 81px;
}

.group-content {
  flex: 1;
  overflow-y: auto;
}

.group-header {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.group-avatar-container {
  margin-right: 16px;
}

.group-avatar-grid {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 1px;
}

.member-avatar-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.member-avatar-text {
  font-size: 8px;
  color: white;
  background: #07C160;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.group-info-text {
  flex: 1;
}

.group-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.group-member-count {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.group-members-section {
  background: white;
  margin-bottom: 8px;
}

.section-title {
  padding: 16px 20px 12px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  padding: 16px 20px;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.member-avatar, .add-member-icon {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.avatar-text {
  width: 100%;
  height: 100%;
  background: #07C160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
}

.add-member-icon {
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ccc;
}

.member-name {
  font-size: 12px;
  color: #333;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-settings {
  background: white;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-item span {
  flex: 1;
  margin-left: 12px;
  font-size: 16px;
  color: #333;
}

.setting-item.danger span {
  color: #ff4444;
}

.arrow {
  color: #999;
}

/* 群功能区域样式 */
.group-functions {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  padding: 16px;
}

.function-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.function-item:hover {
  background: #f5f5f5;
}

.function-item span {
  font-size: 12px;
  color: #333;
  text-align: center;
}

/* 成员列表样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 8px 16px;
}

.view-all-btn {
  background: none;
  border: none;
  color: #07C160;
  font-size: 14px;
  cursor: pointer;
}

.members-list {
  padding: 0 16px 16px 16px;
}

.member-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.member-row:last-child {
  border-bottom: none;
}

.member-row:hover {
  background: #f8f8f8;
}

.member-row .member-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
}

.member-row .member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.role-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 8px;
  padding: 2px 4px;
  border-radius: 6px;
  color: white;
  font-weight: bold;
}

.role-badge.owner {
  background: #ffd700;
  color: #333;
}

.role-badge.admin {
  background: #07C160;
}

.member-info {
  flex: 1;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.member-status {
  font-size: 12px;
}

.online-status {
  color: #999;
}

.online-status.online {
  color: #07C160;
}

.member-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.promote {
  background: #e8f5e8;
  color: #07C160;
}

.action-btn.demote {
  background: #fff3e0;
  color: #ff9500;
}

.action-btn.remove {
  background: #ffebee;
  color: #ff4757;
}

.action-btn:hover {
  opacity: 0.8;
}

.add-member-row {
  cursor: pointer;
}

.add-member-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

/* 设置区域样式 */
.setting-section {
  margin-bottom: 16px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section .section-title {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  color: #666;
  background: #f8f8f8;
  margin: 0;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  appearance: none;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-switch:checked {
  background: #07C160;
}

.toggle-switch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-switch:checked::before {
  transform: translateX(20px);
}

.setting-value {
  font-size: 14px;
  color: #999;
  margin-right: 8px;
}
</style>