<template>
  <div class="chat-info">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">聊天信息</div>
    </div>

    <!-- 用户信息 -->
    <div class="user-section">
      <div class="user-info">
        <img :src="chatInfo.avatar" :alt="chatInfo.name" class="user-avatar" />
        <div class="user-details">
          <div class="user-name">{{ chatInfo.name }}</div>
          <div class="user-status">{{ chatInfo.type === 'group' ? `${chatInfo.memberCount}人` : '在线' }}</div>
        </div>
      </div>
      
      <div class="user-actions">
        <button class="action-item" @click="audioCall">
          <iconify-icon icon="heroicons:phone" width="24" style="color: #07C160;"></iconify-icon>
          <span>语音通话</span>
        </button>
        <button class="action-item" @click="videoCall">
          <iconify-icon icon="heroicons:video-camera" width="24" style="color: #07C160;"></iconify-icon>
          <span>视频通话</span>
        </button>
        <button class="action-item" @click="viewProfile">
          <iconify-icon icon="heroicons:user" width="24" style="color: #07C160;"></iconify-icon>
          <span>个人信息</span>
        </button>
      </div>
    </div>

    <!-- 聊天设置 -->
    <div class="settings-section">
      <div class="setting-item" @click="toggleMute">
        <div class="setting-info">
          <iconify-icon icon="heroicons:bell-slash" width="20" style="color: #666;"></iconify-icon>
          <span>消息免打扰</span>
        </div>
        <div class="setting-toggle" :class="{ active: isMuted }">
          <div class="toggle-thumb"></div>
        </div>
      </div>

      <div class="setting-item" @click="togglePin">
        <div class="setting-info">
          <iconify-icon icon="heroicons:bookmark" width="20" style="color: #666;"></iconify-icon>
          <span>置顶聊天</span>
        </div>
        <div class="setting-toggle" :class="{ active: isPinned }">
          <div class="toggle-thumb"></div>
        </div>
      </div>

      <div class="setting-item" @click="setBackground">
        <div class="setting-info">
          <iconify-icon icon="heroicons:photo" width="20" style="color: #666;"></iconify-icon>
          <span>设置聊天背景</span>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>

      <div class="setting-item" @click="searchHistory">
        <div class="setting-info">
          <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: #666;"></iconify-icon>
          <span>查找聊天记录</span>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>
    </div>

    <!-- 危险操作 -->
    <div class="danger-section">
      <div class="setting-item danger" @click="clearHistory">
        <div class="setting-info">
          <iconify-icon icon="heroicons:trash" width="20" style="color: #ff4444;"></iconify-icon>
          <span style="color: #ff4444;">清空聊天记录</span>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>

      <div class="setting-item danger" @click="deleteChat">
        <div class="setting-info">
          <iconify-icon icon="heroicons:x-circle" width="20" style="color: #ff4444;"></iconify-icon>
          <span style="color: #ff4444;">删除聊天</span>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 聊天信息
const chatInfo = ref({
  id: route.params.id as string,
  name: '李四',
  avatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23FF9500"/><text x="30" y="35" text-anchor="middle" fill="white" font-size="20">李</text></svg>',
  type: 'private',
  memberCount: 0
})

// 设置状态
const isMuted = ref(false)
const isPinned = ref(false)

// 方法
const goBack = () => {
  router.back()
}

const audioCall = () => {
  console.log('发起语音通话')
}

const videoCall = () => {
  console.log('发起视频通话')
}

const viewProfile = () => {
  console.log('查看个人信息')
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  console.log('消息免打扰:', isMuted.value)
}

const togglePin = () => {
  isPinned.value = !isPinned.value
  console.log('置顶聊天:', isPinned.value)
}

const setBackground = () => {
  console.log('设置聊天背景')
}

const searchHistory = () => {
  console.log('查找聊天记录')
}

const clearHistory = async () => {
  try {
    const confirmed = confirm('确定要清空聊天记录吗？\n\n• 只会清空您本地的聊天记录\n• 不会影响对方的聊天记录\n• 会话仍会保留，可以继续聊天\n• 清空后无法恢复')
    if (!confirmed) return

    // 获取当前聊天ID
    const chatId = route.params.id as string
    if (!chatId) {
      console.error('❌ 无法获取聊天ID')
      return
    }

    // 清除聊天记录
    const { useChatStore } = await import('@/modules/chat/stores/chatStore')
    const chatStore = useChatStore()
    await chatStore.clearChatHistory(chatId)

    console.log('✅ 聊天记录已清空')
    alert('聊天记录已清空')
  } catch (error) {
    console.error('❌ 清空聊天记录失败:', error)
    alert('清空失败，请重试')
  }
}

const deleteChat = async () => {
  try {
    const confirmed = confirm('确定要删除聊天吗？\n\n• 只会删除您本地的聊天记录和会话\n• 不会影响对方的聊天记录\n• 删除后需要重新创建会话才能聊天\n• 删除后无法恢复')
    if (!confirmed) return

    // 获取当前聊天ID
    const chatId = route.params.id as string
    if (!chatId) {
      console.error('❌ 无法获取聊天ID')
      return
    }

    // 删除聊天项
    const { useChatStore } = await import('@/modules/chat/stores/chatStore')
    const chatStore = useChatStore()
    await chatStore.deleteChatItem(chatId)

    console.log('✅ 聊天已删除')
    alert('聊天已删除')
    router.back()
  } catch (error) {
    console.error('❌ 删除聊天失败:', error)
    alert('删除失败，请重试')
  }
}
</script>

<style scoped>
.chat-info {
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

.user-section {
  background: white;
  margin-top: 60px;
  padding: 20px 16px;
  border-bottom: 8px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 30px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-status {
  font-size: 14px;
  color: #666;
}

.user-actions {
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.action-item:hover {
  background: #f8f8f8;
}

.action-item span {
  font-size: 12px;
  color: #666;
}

.settings-section,
.danger-section {
  background: white;
  margin-bottom: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
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

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #333;
}

.setting-toggle {
  width: 44px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.3s;
}

.setting-toggle.active {
  background: #07C160;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-toggle.active .toggle-thumb {
  transform: translateX(20px);
}
</style>
