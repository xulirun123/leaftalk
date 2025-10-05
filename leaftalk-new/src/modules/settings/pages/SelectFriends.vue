<template>
  <div class="select-friends">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ pageTitle }}</div>
      <button class="save-btn" @click="saveSelection" :disabled="!hasChanges">
        保存
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: #999;"></iconify-icon>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索朋友" 
          class="search-input"
        />
      </div>
    </div>

    <!-- 朋友列表 -->
    <div class="friends-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <iconify-icon icon="heroicons:arrow-path" width="24" style="color: #07c160;" class="loading-icon"></iconify-icon>
        <p>正在加载朋友列表...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <iconify-icon icon="heroicons:exclamation-triangle" width="48" style="color: #fa5151;"></iconify-icon>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="refreshFriends">重试</button>
      </div>

      <!-- 朋友列表 -->
      <div v-else class="friends-list">
        <div
          v-for="friend in filteredFriends"
          :key="friend.id"
          class="friend-item"
          @click="toggleFriend(friend.id)"
        >
          <div class="friend-avatar">
            <img v-if="friend.avatar" :src="friend.avatar" :alt="friend.name" />
            <div v-else class="avatar-placeholder">{{ friend.name.charAt(0) }}</div>
          </div>
          <div class="friend-info">
            <div class="friend-name">{{ friend.name }}</div>
            <div class="friend-status">{{ friend.status || '在线' }}</div>
          </div>
          <div class="friend-checkbox" :class="{ checked: isSelected(friend.id) }">
            <iconify-icon
              v-if="isSelected(friend.id)"
              icon="heroicons:check"
              width="16"
              style="color: white;"
            ></iconify-icon>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && !error && filteredFriends.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:user-group" width="48" style="color: #ccc;"></iconify-icon>
          <p>{{ searchQuery ? '没有找到匹配的朋友' : '暂无朋友' }}</p>
        </div>
      </div>
    </div>

    <!-- 已选择统计 -->
    <div v-if="selectedFriends.length > 0" class="selected-summary">
      <span>已选择 {{ selectedFriends.length }} 位朋友</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePrivacyStore } from '../../../stores/privacy'
import { friendsService, type Friend } from '../../contacts/services/friendsService'

const router = useRouter()
const route = useRoute()
const privacyStore = usePrivacyStore()

// 页面类型
const pageType = computed(() => route.query.type as string)

// 页面标题
const pageTitle = computed(() => {
  switch (pageType.value) {
    case 'blacklist':
      return '不让他看我的朋友圈'
    case 'whitelist':
      return '不看他的朋友圈'
    default:
      return '选择朋友'
  }
})

// 搜索关键词
const searchQuery = ref('')

// 朋友数据
const allFriends = ref<Friend[]>([])
const loading = ref(false)
const error = ref('')

// 当前选中的朋友
const selectedFriends = ref<string[]>([])

// 初始选中状态
const originalSelection = ref<string[]>([])

// 过滤后的朋友列表
const filteredFriends = computed(() => {
  if (!searchQuery.value.trim()) {
    return allFriends.value
  }

  const searchTerm = searchQuery.value.toLowerCase()
  return allFriends.value.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm) ||
    (friend.nickname && friend.nickname.toLowerCase().includes(searchTerm)) ||
    (friend.phone && friend.phone.includes(searchTerm)) ||
    (friend.yeyuId && friend.yeyuId.toLowerCase().includes(searchTerm))
  )
})

// 是否有变更
const hasChanges = computed(() => {
  return JSON.stringify(selectedFriends.value.sort()) !== JSON.stringify(originalSelection.value.sort())
})

// 检查朋友是否被选中
const isSelected = (friendId: string) => {
  return selectedFriends.value.includes(friendId)
}

// 切换朋友选中状态
const toggleFriend = (friendId: string) => {
  const index = selectedFriends.value.indexOf(friendId)
  if (index > -1) {
    selectedFriends.value.splice(index, 1)
  } else {
    selectedFriends.value.push(friendId)
  }
}

// 保存选择
const saveSelection = () => {
  if (pageType.value === 'blacklist') {
    // 更新黑名单
    privacyStore.updateSetting('momentsBlacklist', [...selectedFriends.value])
  } else if (pageType.value === 'whitelist') {
    // 更新白名单
    privacyStore.updateSetting('momentsWhitelist', [...selectedFriends.value])
  }
  
  goBack()
}

// 返回
const goBack = () => {
  router.back()
}

// 加载朋友数据
const loadFriends = async () => {
  try {
    loading.value = true
    error.value = ''
    console.log('🔄 加载朋友列表...')

    const friends = await friendsService.getFriends()
    allFriends.value = friends

    console.log('✅ 朋友列表加载成功:', friends.length, '个朋友')
  } catch (err) {
    console.error('❌ 加载朋友列表失败:', err)
    error.value = '加载朋友列表失败，请重试'
  } finally {
    loading.value = false
  }
}

// 初始化选中状态
const initializeSelection = () => {
  if (pageType.value === 'blacklist') {
    selectedFriends.value = [...privacyStore.settings.momentsBlacklist]
  } else if (pageType.value === 'whitelist') {
    selectedFriends.value = [...privacyStore.settings.momentsWhitelist]
  }

  originalSelection.value = [...selectedFriends.value]
}

// 刷新朋友列表
const refreshFriends = async () => {
  await loadFriends()
}

onMounted(async () => {
  privacyStore.init()
  await loadFriends()
  initializeSelection()
})
</script>

<style scoped>
.select-friends {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex: 1;
  text-align: center;
}

.save-btn {
  border: none;
  background: transparent;
  color: #07c160;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.save-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.search-section {
  background: white;
  padding: 12px 16px;
  margin-top: 60px;
  border-bottom: 1px solid #f0f0f0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 16px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.friends-content {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.friends-list {
  padding: 0 16px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.friend-item:last-child {
  border-bottom: none;
}

.friend-item:hover {
  background: #f8f8f8;
}

.friend-avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 500;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 2px;
}

.friend-status {
  font-size: 12px;
  color: #999;
}

.friend-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.friend-checkbox.checked {
  background: #07c160;
  border-color: #07c160;
}

/* 状态样式 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-state p,
.error-state p,
.empty-state p {
  margin-top: 16px;
  font-size: 16px;
  color: #999;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #06a552;
}

.selected-summary {
  background: white;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  color: #666;
  font-size: 14px;
}
</style>
