<template>
  <div class="group-members-page">
    <MobileTopBar
      title="群成员"
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canInviteMembers" @click="inviteMembers" class="invite-btn">
          <iconify-icon icon="heroicons:user-plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>
    
    <div class="page-content scroll-container">
      <!-- 搜索栏 -->
      <div class="search-section">
        <div class="search-bar">
          <iconify-icon icon="heroicons:magnifying-glass" width="20" color="#999"></iconify-icon>
          <input 
            v-model="searchKeyword" 
            placeholder="搜索群成员" 
            class="search-input"
          />
        </div>
      </div>

      <!-- 成员统计 -->
      <div class="member-stats">
        <div class="stat-item">
          <span class="stat-number">{{ groupInfo.memberCount }}</span>
          <span class="stat-label">总成员</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ onlineCount }}</span>
          <span class="stat-label">在线</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ adminCount }}</span>
          <span class="stat-label">管理员</span>
        </div>
      </div>

      <!-- 成员分类 -->
      <div class="member-categories">
        <button 
          v-for="category in memberCategories" 
          :key="category.key"
          @click="activeCategory = category.key"
          :class="['category-btn', { active: activeCategory === category.key }]"
        >
          {{ category.name }}
          <span class="category-count">{{ getCategoryCount(category.key) }}</span>
        </button>
      </div>

      <!-- 成员列表 -->
      <div class="members-list">
        <div 
          v-for="member in filteredMembers" 
          :key="member.id"
          class="member-item"
          @click="viewMemberProfile(member)"
        >
          <div class="member-avatar">
            <img :src="member.avatar" :alt="member.name" />
            <div v-if="member.role === 'owner'" class="role-badge owner">群主</div>
            <div v-else-if="member.role === 'admin'" class="role-badge admin">管理员</div>
            <div v-if="member.isOnline" class="online-indicator"></div>
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
            <div class="member-details">
              <span class="join-time">{{ formatJoinTime(member.joinTime) }}加入</span>
              <span class="online-status" :class="{ online: member.isOnline }">
                {{ member.isOnline ? '在线' : formatLastSeen(member.lastSeen) }}
              </span>
            </div>
          </div>
          
          <div class="member-actions" v-if="canManageMembers && member.id !== currentUserId">
            <button 
              @click.stop="showMemberActions(member)"
              class="more-btn"
            >
              <iconify-icon icon="heroicons:ellipsis-horizontal" width="16"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 成员操作弹窗 -->
    <div v-if="showActionSheet" class="action-sheet-overlay" @click="hideActionSheet">
      <div class="action-sheet" @click.stop>
        <div class="action-sheet-header">
          <img :src="selectedMember?.avatar" :alt="selectedMember?.name" class="action-avatar" />
          <div class="action-member-info">
            <h3>{{ selectedMember?.name }}</h3>
            <span>{{ getRoleText(selectedMember?.role) }}</span>
          </div>
        </div>
        
        <div class="action-list">
          <button @click="sendMessage" class="action-item">
            <iconify-icon icon="heroicons:chat-bubble-left" width="20"></iconify-icon>
            <span>发消息</span>
          </button>
          
          <button @click="viewProfile" class="action-item">
            <iconify-icon icon="heroicons:user" width="20"></iconify-icon>
            <span>查看资料</span>
          </button>
          
          <button 
            v-if="selectedMember?.role === 'member' && currentUserRole === 'owner'"
            @click="setAsAdmin" 
            class="action-item"
          >
            <iconify-icon icon="heroicons:shield-check" width="20"></iconify-icon>
            <span>设为管理员</span>
          </button>
          
          <button 
            v-if="selectedMember?.role === 'admin' && currentUserRole === 'owner'"
            @click="removeAdmin" 
            class="action-item"
          >
            <iconify-icon icon="heroicons:shield-exclamation" width="20"></iconify-icon>
            <span>取消管理员</span>
          </button>
          
          <button 
            v-if="canRemoveMember(selectedMember)"
            @click="removeMember" 
            class="action-item danger"
          >
            <iconify-icon icon="heroicons:user-minus" width="20"></iconify-icon>
            <span>移出群聊</span>
          </button>
        </div>
        
        <button @click="hideActionSheet" class="action-cancel">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const searchKeyword = ref('')
const activeCategory = ref('all')
const showActionSheet = ref(false)
const selectedMember = ref(null)

// 当前用户信息
const currentUserId = ref('user1')
const currentUserRole = ref('owner') // owner, admin, member

// 成员分类
const memberCategories = [
  { key: 'all', name: '全部' },
  { key: 'owner', name: '群主' },
  { key: 'admin', name: '管理员' },
  { key: 'member', name: '普通成员' }
]

// 群信息和成员数据
const groupInfo = ref({
  id: route.params.groupId,
  name: '家族群聊',
  memberCount: 25,
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
      role: 'admin',
      isOnline: true,
      lastSeen: new Date(),
      joinTime: Date.now() - 86400000 * 20 
    },
    // 添加更多成员数据...
    ...Array.from({ length: 22 }, (_, i) => ({
      id: `user${i + 4}`,
      name: `成员${i + 1}`,
      avatar: `/avatar${(i % 10) + 1}.jpg`,
      role: 'member',
      isOnline: Math.random() > 0.5,
      lastSeen: new Date(Date.now() - Math.random() * 86400000 * 7),
      joinTime: Date.now() - Math.random() * 86400000 * 30
    }))
  ]
})

// 计算属性
const onlineCount = computed(() => {
  return groupInfo.value.members.filter(m => m.isOnline).length
})

const adminCount = computed(() => {
  return groupInfo.value.members.filter(m => m.role === 'admin' || m.role === 'owner').length
})

const filteredMembers = computed(() => {
  let members = groupInfo.value.members
  
  // 按分类筛选
  if (activeCategory.value !== 'all') {
    members = members.filter(m => m.role === activeCategory.value)
  }
  
  // 按搜索关键词筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    members = members.filter(m => 
      m.name.toLowerCase().includes(keyword)
    )
  }
  
  // 排序：群主 > 管理员 > 在线成员 > 离线成员
  return members.sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 }
    if (roleOrder[a.role] !== roleOrder[b.role]) {
      return roleOrder[a.role] - roleOrder[b.role]
    }
    if (a.isOnline !== b.isOnline) {
      return b.isOnline ? 1 : -1
    }
    return a.name.localeCompare(b.name)
  })
})

const canManageMembers = computed(() => {
  return currentUserRole.value === 'owner' || currentUserRole.value === 'admin'
})

const canInviteMembers = computed(() => {
  return currentUserRole.value === 'owner' || currentUserRole.value === 'admin'
})

// 方法
const goBack = () => {
  router.back()
}

const getCategoryCount = (category: string) => {
  if (category === 'all') return groupInfo.value.memberCount
  return groupInfo.value.members.filter(m => m.role === category).length
}

const formatJoinTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 86400000) return '今天'
  if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)}天前`
  if (diff < 86400000 * 30) return `${Math.floor(diff / (86400000 * 7))}周前`
  return `${Math.floor(diff / (86400000 * 30))}个月前`
}

const formatLastSeen = (lastSeen: Date) => {
  const now = new Date()
  const diff = now.getTime() - lastSeen.getTime()
  
  if (diff < 60000) return '刚刚在线'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前在线`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前在线`
  return `${Math.floor(diff / 86400000)}天前在线`
}

const getRoleText = (role: string) => {
  const roleMap = {
    owner: '群主',
    admin: '管理员',
    member: '普通成员'
  }
  return roleMap[role] || '成员'
}

const canRemoveMember = (member: any) => {
  if (!member) return false
  if (currentUserRole.value === 'owner') {
    return member.role !== 'owner'
  }
  if (currentUserRole.value === 'admin') {
    return member.role === 'member'
  }
  return false
}

const inviteMembers = () => {
  router.push(`/invite-to-group/${groupInfo.value.id}`)
}

const viewMemberProfile = (member: any) => {
  router.push(`/user-profile/${member.id}`)
}

const showMemberActions = (member: any) => {
  selectedMember.value = member
  showActionSheet.value = true
}

const hideActionSheet = () => {
  showActionSheet.value = false
  selectedMember.value = null
}

const sendMessage = () => {
  hideActionSheet()
  router.push(`/chat/${selectedMember.value.id}`)
}

const viewProfile = () => {
  hideActionSheet()
  router.push(`/user-profile/${selectedMember.value.id}`)
}

const setAsAdmin = () => {
  if (selectedMember.value) {
    selectedMember.value.role = 'admin'
    appStore.showToast(`已设置 ${selectedMember.value.name} 为管理员`, 'success')
  }
  hideActionSheet()
}

const removeAdmin = () => {
  if (selectedMember.value) {
    selectedMember.value.role = 'member'
    appStore.showToast(`已取消 ${selectedMember.value.name} 的管理员权限`, 'success')
  }
  hideActionSheet()
}

const removeMember = () => {
  if (selectedMember.value) {
    const index = groupInfo.value.members.findIndex(m => m.id === selectedMember.value.id)
    if (index > -1) {
      groupInfo.value.members.splice(index, 1)
      groupInfo.value.memberCount--
      appStore.showToast(`已移出群成员: ${selectedMember.value.name}`, 'success')
    }
  }
  hideActionSheet()
}

onMounted(() => {
  console.log('群成员页面加载:', route.params.groupId)
})
</script>

<style scoped>
.group-members-page {
  height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

.invite-btn {
  background: none;
  border: none;
  color: #07C160;
  cursor: pointer;
  padding: 4px;
}

.search-section {
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 20px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  margin-left: 8px;
  font-size: 14px;
  color: #333;
}

.member-stats {
  display: flex;
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-right: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-right: none;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.member-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.category-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn.active {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.category-count {
  background: rgba(255,255,255,0.2);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.category-btn.active .category-count {
  background: rgba(255,255,255,0.3);
}

.members-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.member-item:last-child {
  border-bottom: none;
}

.member-item:hover {
  background: #f8f8f8;
}

.member-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
}

.member-avatar img {
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

.online-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #07C160;
  border: 2px solid white;
  border-radius: 50%;
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
  margin-bottom: 4px;
}

.member-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.join-time {
  color: #999;
}

.online-status {
  color: #999;
}

.online-status.online {
  color: #07C160;
}

.member-actions {
  margin-left: 12px;
}

.more-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  color: #999;
}

.more-btn:hover {
  background: #f0f0f0;
}

/* 操作弹窗样式 */
.action-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.action-sheet {
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.action-sheet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.action-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.action-member-info h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.action-member-info span {
  font-size: 14px;
  color: #666;
}

.action-list {
  margin-bottom: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 0;
  border: none;
  background: none;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}

.action-item:hover {
  background: #f8f8f8;
}

.action-item.danger {
  color: #ff4757;
}

.action-cancel {
  width: 100%;
  padding: 16px;
  border: none;
  background: #f0f0f0;
  color: #666;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}
</style>
