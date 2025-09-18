<template>
  <div class="moments-privacy">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">朋友圈权限</div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 朋友圈可见范围 -->
      <div class="settings-section">
        <div class="section-title">允许朋友查看朋友圈的范围</div>
        <div 
          v-for="option in privacyStore.momentsRangeOptions" 
          :key="option.value"
          class="setting-item"
          @click="selectRange(option.value)"
        >
          <div class="setting-info">
            <span>{{ option.label }}</span>
          </div>
          <div class="setting-check" v-if="privacyStore.settings.momentsVisibleRange === option.value">
            <iconify-icon icon="heroicons:check" width="20" style="color: #07c160;"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 朋友圈黑名单 -->
      <div class="settings-section">
        <div class="section-title">不让他看我的朋友圈</div>
        <div class="setting-item" @click="manageMomentsBlacklist">
          <div class="setting-info">
            <span>选择朋友</span>
            <span class="setting-value">已选择 {{ privacyStore.settings.momentsBlacklist.length }} 人</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        
        <!-- 黑名单列表 -->
        <div v-if="blacklistFriends.length > 0" class="friends-list">
          <div 
            v-for="friend in blacklistFriends" 
            :key="friend.id"
            class="friend-item"
          >
            <div class="friend-avatar">
              <img v-if="friend.avatar" :src="friend.avatar" :alt="friend.name" />
              <div v-else class="avatar-placeholder">{{ friend.name.charAt(0) }}</div>
            </div>
            <div class="friend-info">
              <div class="friend-name">{{ friend.name }}</div>
            </div>
            <button class="remove-btn" @click="removeFromBlacklist(friend.id)">
              <iconify-icon icon="heroicons:x-mark" width="16" style="color: #999;"></iconify-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 朋友圈白名单 -->
      <div class="settings-section">
        <div class="section-title">不看他的朋友圈</div>
        <div class="setting-item" @click="manageMomentsWhitelist">
          <div class="setting-info">
            <span>选择朋友</span>
            <span class="setting-value">已选择 {{ privacyStore.settings.momentsWhitelist.length }} 人</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        
        <!-- 白名单列表 -->
        <div v-if="whitelistFriends.length > 0" class="friends-list">
          <div 
            v-for="friend in whitelistFriends" 
            :key="friend.id"
            class="friend-item"
          >
            <div class="friend-avatar">
              <img v-if="friend.avatar" :src="friend.avatar" :alt="friend.name" />
              <div v-else class="avatar-placeholder">{{ friend.name.charAt(0) }}</div>
            </div>
            <div class="friend-info">
              <div class="friend-name">{{ friend.name }}</div>
            </div>
            <button class="remove-btn" @click="removeFromWhitelist(friend.id)">
              <iconify-icon icon="heroicons:x-mark" width="16" style="color: #999;"></iconify-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 说明文字 -->
      <div class="privacy-note">
        <p>• 朋友圈可见范围设置后，朋友只能看到指定时间范围内的朋友圈动态</p>
        <p>• 被加入黑名单的朋友将无法看到您的朋友圈</p>
        <p>• 被加入白名单的朋友的朋友圈将不会在您的朋友圈中显示</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrivacyStore } from '../../../stores/privacy'
import { friendsService, type Friend } from '../../../services/friendsService'

const router = useRouter()
const privacyStore = usePrivacyStore()

// 朋友数据
const allFriends = ref<Friend[]>([])

// 黑名单朋友列表
const blacklistFriends = computed(() => {
  return allFriends.value.filter(friend =>
    privacyStore.settings.momentsBlacklist.includes(friend.id)
  )
})

// 白名单朋友列表
const whitelistFriends = computed(() => {
  return allFriends.value.filter(friend =>
    privacyStore.settings.momentsWhitelist.includes(friend.id)
  )
})

const goBack = () => {
  router.back()
}

// 选择朋友圈可见范围
const selectRange = (range: string) => {
  privacyStore.updateSetting('momentsVisibleRange', range as any)
}

// 管理朋友圈黑名单
const manageMomentsBlacklist = () => {
  router.push('/settings/select-friends?type=blacklist')
}

// 管理朋友圈白名单
const manageMomentsWhitelist = () => {
  router.push('/settings/select-friends?type=whitelist')
}

// 从黑名单移除
const removeFromBlacklist = (friendId: string) => {
  privacyStore.removeFromMomentsBlacklist(friendId)
}

// 从白名单移除
const removeFromWhitelist = (friendId: string) => {
  privacyStore.removeFromMomentsWhitelist(friendId)
}

// 加载朋友数据
const loadFriends = async () => {
  try {
    console.log('🔄 加载朋友列表...')
    const friends = await friendsService.getFriends()
    allFriends.value = friends
    console.log('✅ 朋友列表加载成功:', friends.length, '个朋友')
  } catch (error) {
    console.error('❌ 加载朋友列表失败:', error)
  }
}

onMounted(async () => {
  privacyStore.init()
  await loadFriends()
})
</script>

<style scoped>
.moments-privacy {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
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
}

.settings-content {
  margin-top: 60px;
  padding: 16px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-info span:first-child {
  font-size: 16px;
  color: #333;
}

.setting-value {
  font-size: 14px;
  color: #666;
}

.setting-check {
  display: flex;
  align-items: center;
}

.friends-list {
  padding: 0 16px 16px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.friend-avatar {
  width: 40px;
  height: 40px;
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
  font-size: 16px;
  font-weight: 500;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-size: 16px;
  color: #333;
}

.remove-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background: #f0f0f0;
}

.privacy-note {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.privacy-note p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
</style>
