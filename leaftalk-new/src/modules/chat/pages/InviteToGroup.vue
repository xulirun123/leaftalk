<template>
  <div class="invite-to-group-page">
    <MobileTopBar
      title="邀请好友"
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button 
          v-if="selectedFriends.length > 0" 
          @click="sendInvitations" 
          class="send-btn"
        >
          邀请({{ selectedFriends.length }})
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
            placeholder="搜索好友" 
            class="search-input"
          />
        </div>
      </div>

      <!-- 已选择的好友 -->
      <div v-if="selectedFriends.length > 0" class="selected-friends">
        <div class="selected-title">已选择 {{ selectedFriends.length }} 位好友</div>
        <div class="selected-list">
          <div 
            v-for="friend in selectedFriends" 
            :key="friend.id"
            class="selected-friend"
            @click="removeFriend(friend)"
          >
            <img :src="friend.avatar" :alt="friend.name" class="selected-avatar" />
            <span class="selected-name">{{ friend.name }}</span>
            <div class="remove-icon">
              <iconify-icon icon="heroicons:x-mark" width="12" color="white"></iconify-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 好友分类 -->
      <div class="friend-categories">
        <button 
          v-for="category in friendCategories" 
          :key="category.key"
          @click="activeCategory = category.key"
          :class="['category-btn', { active: activeCategory === category.key }]"
        >
          {{ category.name }}
          <span class="category-count">{{ getCategoryCount(category.key) }}</span>
        </button>
      </div>

      <!-- 好友列表 -->
      <div class="friends-list">
        <div v-if="filteredFriends.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:user-group" width="48" color="#ccc"></iconify-icon>
          <p>{{ searchKeyword ? '未找到匹配的好友' : '暂无可邀请的好友' }}</p>
        </div>
        
        <div v-else class="friend-items">
          <div 
            v-for="friend in filteredFriends" 
            :key="friend.id"
            class="friend-item"
            :class="{ selected: isSelected(friend) }"
            @click="toggleFriend(friend)"
          >
            <div class="friend-avatar">
              <img :src="friend.avatar" :alt="friend.name" />
              <div v-if="friend.isOnline" class="online-indicator"></div>
            </div>
            
            <div class="friend-info">
              <div class="friend-name">{{ friend.name }}</div>
              <div class="friend-status">
                <span v-if="friend.isInGroup" class="in-group-tag">已在群内</span>
                <span v-else-if="friend.isOnline" class="online-status">在线</span>
                <span v-else class="offline-status">{{ formatLastSeen(friend.lastSeen) }}</span>
              </div>
            </div>
            
            <div class="selection-indicator">
              <div v-if="isSelected(friend)" class="selected-icon">
                <iconify-icon icon="heroicons:check" width="16" color="white"></iconify-icon>
              </div>
              <div v-else-if="friend.isInGroup" class="disabled-icon">
                <iconify-icon icon="heroicons:check" width="16" color="#ccc"></iconify-icon>
              </div>
              <div v-else class="unselected-icon"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 邀请方式 -->
      <div class="invite-methods">
        <div class="method-title">其他邀请方式</div>
        <div class="method-list">
          <div class="method-item" @click="shareGroupQR">
            <iconify-icon icon="heroicons:qr-code" width="24" color="#07C160"></iconify-icon>
            <div class="method-info">
              <span>分享群二维码</span>
              <small>生成群二维码分享给好友</small>
            </div>
          </div>
          
          <div class="method-item" @click="shareGroupLink">
            <iconify-icon icon="heroicons:link" width="24" color="#1976d2"></iconify-icon>
            <div class="method-info">
              <span>分享群链接</span>
              <small>通过链接邀请好友加入</small>
            </div>
          </div>
          
          <div class="method-item" @click="inviteByPhone">
            <iconify-icon icon="heroicons:phone" width="24" color="#ff9500"></iconify-icon>
            <div class="method-info">
              <span>通过手机号邀请</span>
              <small>输入手机号直接邀请</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 邀请确认弹窗 -->
    <div v-if="showConfirmDialog" class="confirm-overlay" @click="hideConfirmDialog">
      <div class="confirm-dialog" @click.stop>
        <h3>确认邀请</h3>
        <p>确定要邀请以下 {{ selectedFriends.length }} 位好友加入群聊吗？</p>
        
        <div class="confirm-friends">
          <div 
            v-for="friend in selectedFriends.slice(0, 5)" 
            :key="friend.id"
            class="confirm-friend"
          >
            <img :src="friend.avatar" :alt="friend.name" />
            <span>{{ friend.name }}</span>
          </div>
          <div v-if="selectedFriends.length > 5" class="more-friends">
            +{{ selectedFriends.length - 5 }}
          </div>
        </div>
        
        <div class="confirm-actions">
          <button @click="hideConfirmDialog" class="cancel-btn">取消</button>
          <button @click="confirmInvite" class="confirm-btn">确认邀请</button>
        </div>
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
const selectedFriends = ref([])
const showConfirmDialog = ref(false)

// 好友分类
const friendCategories = [
  { key: 'all', name: '全部好友' },
  { key: 'recent', name: '最近联系' },
  { key: 'online', name: '在线好友' },
  { key: 'family', name: '家人' },
  { key: 'colleague', name: '同事' }
]

// 群信息
const groupInfo = ref({
  id: route.params.groupId,
  name: '家族群聊',
  memberIds: ['user1', 'user2', 'user3'] // 已在群内的成员ID
})

// 好友列表
const friends = ref([
  {
    id: 'friend1',
    name: '小明',
    avatar: '/avatar1.jpg',
    isOnline: true,
    lastSeen: new Date(),
    category: 'family',
    isInGroup: false
  },
  {
    id: 'friend2',
    name: '小红',
    avatar: '/avatar2.jpg',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000),
    category: 'colleague',
    isInGroup: true // 已在群内
  },
  {
    id: 'friend3',
    name: '小刚',
    avatar: '/avatar3.jpg',
    isOnline: true,
    lastSeen: new Date(),
    category: 'recent',
    isInGroup: false
  },
  // 添加更多好友数据...
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `friend${i + 4}`,
    name: `好友${i + 1}`,
    avatar: `/avatar${(i % 10) + 1}.jpg`,
    isOnline: Math.random() > 0.5,
    lastSeen: new Date(Date.now() - Math.random() * 86400000 * 7),
    category: ['family', 'colleague', 'recent'][Math.floor(Math.random() * 3)],
    isInGroup: Math.random() > 0.8
  }))
])

// 计算属性
const filteredFriends = computed(() => {
  let filtered = friends.value
  
  // 按分类筛选
  if (activeCategory.value !== 'all') {
    if (activeCategory.value === 'online') {
      filtered = filtered.filter(f => f.isOnline)
    } else {
      filtered = filtered.filter(f => f.category === activeCategory.value)
    }
  }
  
  // 按搜索关键词筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(f => 
      f.name.toLowerCase().includes(keyword)
    )
  }
  
  // 排序：未在群内的在前，在线的在前
  return filtered.sort((a, b) => {
    if (a.isInGroup !== b.isInGroup) {
      return a.isInGroup ? 1 : -1
    }
    if (a.isOnline !== b.isOnline) {
      return b.isOnline ? 1 : -1
    }
    return a.name.localeCompare(b.name)
  })
})

// 方法
const goBack = () => {
  router.back()
}

const getCategoryCount = (category: string) => {
  if (category === 'all') return friends.value.filter(f => !f.isInGroup).length
  if (category === 'online') return friends.value.filter(f => f.isOnline && !f.isInGroup).length
  return friends.value.filter(f => f.category === category && !f.isInGroup).length
}

const isSelected = (friend: any) => {
  return selectedFriends.value.some(f => f.id === friend.id)
}

const toggleFriend = (friend: any) => {
  if (friend.isInGroup) return // 已在群内的不能选择
  
  if (isSelected(friend)) {
    removeFriend(friend)
  } else {
    selectedFriends.value.push(friend)
  }
}

const removeFriend = (friend: any) => {
  const index = selectedFriends.value.findIndex(f => f.id === friend.id)
  if (index > -1) {
    selectedFriends.value.splice(index, 1)
  }
}

const formatLastSeen = (lastSeen: Date) => {
  const now = new Date()
  const diff = now.getTime() - lastSeen.getTime()
  
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前在线`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前在线`
  return `${Math.floor(diff / 86400000)}天前在线`
}

const sendInvitations = () => {
  if (selectedFriends.value.length === 0) return
  showConfirmDialog.value = true
}

const hideConfirmDialog = () => {
  showConfirmDialog.value = false
}

const confirmInvite = () => {
  // 发送邀请
  const friendNames = selectedFriends.value.map(f => f.name).join('、')
  appStore.showToast(`已向 ${friendNames} 发送群邀请`, 'success')
  
  // 清空选择
  selectedFriends.value = []
  hideConfirmDialog()
  
  // 返回群信息页面
  setTimeout(() => {
    router.back()
  }, 1500)
}

const shareGroupQR = () => {
  appStore.showToast('群二维码分享功能开发中', 'info')
}

const shareGroupLink = () => {
  appStore.showToast('群链接分享功能开发中', 'info')
}

const inviteByPhone = () => {
  appStore.showToast('手机号邀请功能开发中', 'info')
}

onMounted(() => {
  console.log('邀请好友页面加载:', route.params.groupId)
})
</script>

<style scoped>
.invite-to-group-page {
  height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

.send-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
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

.selected-friends {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.selected-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-friend {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.selected-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 4px;
}

.selected-name {
  font-size: 12px;
  color: #333;
  text-align: center;
  max-width: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-icon {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.friend-categories {
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

.friends-list {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state p {
  font-size: 16px;
  color: #333;
  margin: 16px 0;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.friend-item:last-child {
  border-bottom: none;
}

.friend-item:hover {
  background: #f8f8f8;
}

.friend-item.selected {
  background: #f0f8f0;
}

.friend-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.friend-info {
  flex: 1;
}

.friend-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.friend-status {
  font-size: 12px;
}

.in-group-tag {
  background: #e0e0e0;
  color: #666;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.online-status {
  color: #07C160;
}

.offline-status {
  color: #999;
}

.selection-indicator {
  margin-left: 12px;
}

.selected-icon {
  width: 24px;
  height: 24px;
  background: #07C160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.disabled-icon {
  width: 24px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unselected-icon {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
}

.invite-methods {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.method-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.method-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.method-item:last-child {
  border-bottom: none;
}

.method-item:hover {
  background: #f8f8f8;
}

.method-info {
  flex: 1;
}

.method-info span {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 2px;
}

.method-info small {
  font-size: 12px;
  color: #666;
}

/* 确认弹窗样式 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
}

.confirm-dialog h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
  text-align: center;
}

.confirm-dialog p {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
  text-align: center;
  line-height: 1.5;
}

.confirm-friends {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
}

.confirm-friend {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.confirm-friend img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.confirm-friend span {
  font-size: 10px;
  color: #333;
  text-align: center;
  max-width: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-friends {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 12px;
  color: #666;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.confirm-btn {
  background: #07C160;
  color: white;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn:hover {
  background: #06a552;
}
</style>
