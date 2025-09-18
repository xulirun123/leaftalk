<template>
  <div class="live-room">
    <!-- 视频播放区域 -->
    <div class="video-container">
      <video 
        ref="videoPlayer"
        class="live-video"
        autoplay
        playsinline
        muted
        @click="toggleControls"
      ></video>
      
      <!-- 直播信息覆盖层 -->
      <div class="live-overlay">
        <!-- 顶部信息 -->
        <div class="top-info">
          <button @click="goBack" class="back-btn">
            <iconify-icon icon="heroicons:arrow-left" width="20" style="color: white;" />
          </button>
          
          <div class="room-info">
            <div class="live-badge">
              <iconify-icon icon="heroicons:signal" width="12" />
              {{ $t('live.live') }}
            </div>
            <div class="viewer-count">
              <iconify-icon icon="heroicons:eye" width="12" />
              {{ formatViewerCount(room?.viewerCount || 0) }}
            </div>
          </div>
          
          <button @click="shareRoom" class="share-btn">
            <iconify-icon icon="heroicons:share" width="20" style="color: white;" />
          </button>
        </div>

        <!-- 主播信息 -->
        <div class="streamer-info">
          <img :src="room?.streamer.avatar" :alt="room?.streamer.name" class="streamer-avatar" />
          <div class="streamer-details">
            <div class="streamer-name">{{ room?.streamer.name }}</div>
            <div class="room-title">{{ room?.title }}</div>
          </div>
          <button 
            @click="toggleFollow" 
            class="follow-btn"
            :class="{ following: isFollowing }"
          >
            {{ isFollowing ? $t('live.following') : $t('live.follow') }}
          </button>
        </div>

        <!-- 礼物动画区域 -->
        <div class="gift-animation-area">
          <div 
            v-for="gift in activeGifts"
            :key="gift.id"
            class="gift-animation"
            :class="gift.animation"
            :style="{ animationDelay: gift.delay + 'ms' }"
          >
            <span class="gift-icon">{{ gift.icon }}</span>
            <span class="gift-count">x{{ gift.count }}</span>
          </div>
        </div>

        <!-- 点赞动画 -->
        <div class="like-animation-area">
          <div 
            v-for="like in activeLikes"
            :key="like.id"
            class="like-bubble"
            :style="{ 
              left: like.x + 'px',
              animationDelay: like.delay + 'ms'
            }"
          >
            ❤️
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天区域 -->
    <div class="chat-container" :class="{ expanded: isChatExpanded }">
      <!-- 聊天消息列表 -->
      <div class="chat-messages" ref="chatMessages">
        <div 
          v-for="message in messages"
          :key="message.id"
          class="chat-message"
          :class="{ 
            'gift-message': message.type === 'gift',
            'join-message': message.type === 'join',
            'like-message': message.type === 'like'
          }"
        >
          <div v-if="message.type === 'chat'" class="chat-content">
            <span class="user-name" :style="{ color: getUserColor(message.user.level) }">
              {{ message.user.name }}:
            </span>
            <span class="message-text">{{ message.content }}</span>
          </div>
          
          <div v-else-if="message.type === 'gift'" class="gift-content">
            <span class="gift-sender">{{ message.user.name }}</span>
            <span class="gift-text">送出了</span>
            <span class="gift-name">{{ message.gift?.name }}</span>
            <span class="gift-icon">{{ message.gift?.icon }}</span>
            <span v-if="message.gift && message.gift.count > 1" class="gift-count">x{{ message.gift.count }}</span>
          </div>
          
          <div v-else-if="message.type === 'join'" class="join-content">
            <span class="join-text">{{ message.user.name }} 进入了直播间</span>
          </div>
          
          <div v-else-if="message.type === 'like'" class="like-content">
            <span class="like-text">{{ message.user.name }} 点了个赞</span>
          </div>
        </div>
      </div>

      <!-- 聊天输入区域 -->
      <div class="chat-input-area">
        <div class="input-container">
          <input 
            v-model="chatInput"
            type="text"
            :placeholder="$t('live.chatPlaceholder')"
            class="chat-input"
            @keydown.enter="sendMessage"
            maxlength="100"
          />
          <button @click="sendMessage" class="send-btn" :disabled="!chatInput.trim()">
            <iconify-icon icon="heroicons:paper-airplane" width="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="bottom-controls">
      <button @click="toggleChat" class="control-btn">
        <iconify-icon icon="heroicons:chat-bubble-left" width="20" />
        <span>{{ $t('live.chat') }}</span>
      </button>
      
      <button @click="sendLike" class="control-btn like-btn">
        <iconify-icon icon="heroicons:heart" width="20" />
        <span>{{ $t('live.like') }}</span>
      </button>
      
      <button @click="showGiftPanel" class="control-btn">
        <iconify-icon icon="heroicons:gift" width="20" />
        <span>{{ $t('live.gift') }}</span>
      </button>
      
      <button @click="showMoreOptions" class="control-btn">
        <iconify-icon icon="heroicons:ellipsis-horizontal" width="20" />
        <span>{{ $t('common.more') }}</span>
      </button>
    </div>

    <!-- 礼物面板 -->
    <div v-if="showGifts" class="gift-panel-overlay" @click="closeGiftPanel">
      <div class="gift-panel" @click.stop>
        <div class="gift-header">
          <h3>{{ $t('live.sendGift') }}</h3>
          <button @click="closeGiftPanel" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>
        
        <div class="gift-list">
          <div 
            v-for="gift in giftList"
            :key="gift.id"
            class="gift-item"
            :class="{ selected: selectedGift?.id === gift.id }"
            @click="selectGift(gift)"
          >
            <div class="gift-icon-large">{{ gift.icon }}</div>
            <div class="gift-name">{{ gift.name }}</div>
            <div class="gift-value">{{ gift.value }}豆</div>
          </div>
        </div>
        
        <div class="gift-actions">
          <div class="gift-count-selector">
            <button 
              v-for="count in [1, 10, 66, 188]"
              :key="count"
              class="count-btn"
              :class="{ active: giftCount === count }"
              @click="giftCount = count"
            >
              {{ count }}
            </button>
          </div>
          
          <button 
            @click="sendGift" 
            class="send-gift-btn"
            :disabled="!selectedGift"
          >
            {{ $t('live.sendGift') }} ({{ (selectedGift?.value || 0) * giftCount }}豆)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../../shared/stores/appStore'
import { liveStreamManager, type LiveRoom, type LiveMessage, type LiveGift } from '../../utils/liveStream'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

// 响应式数据
const videoPlayer = ref<HTMLVideoElement>()
const chatMessages = ref<HTMLElement>()
const room = ref<LiveRoom | null>(null)
const messages = ref<LiveMessage[]>([])
const chatInput = ref('')
const isChatExpanded = ref(false)
const isFollowing = ref(false)
const showGifts = ref(false)
const selectedGift = ref<LiveGift | null>(null)
const giftCount = ref(1)
const activeGifts = ref<any[]>([])
const activeLikes = ref<any[]>([])

// 礼物列表
const giftList = ref<LiveGift[]>([])

// 获取房间ID
const roomId = route.params.id as string

// 方法
const goBack = () => {
  liveStreamManager.leaveRoom()
  router.back()
}

const formatViewerCount = (count: number) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

const toggleControls = () => {
  // 切换控制栏显示/隐藏
}

const shareRoom = () => {
  // 分享直播间
  appStore.showToast(t('live.shareSuccess'), 'success')
}

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
  appStore.showToast(
    isFollowing.value ? t('live.followSuccess') : t('live.unfollowSuccess'), 
    'success'
  )
}

const toggleChat = () => {
  isChatExpanded.value = !isChatExpanded.value
}

const sendMessage = () => {
  if (!chatInput.value.trim()) return
  
  const success = liveStreamManager.sendChatMessage(chatInput.value.trim())
  if (success) {
    chatInput.value = ''
  }
}

const sendLike = () => {
  liveStreamManager.sendLike()
  
  // 创建点赞动画
  const like = {
    id: Date.now() + Math.random(),
    x: Math.random() * 100,
    delay: 0
  }
  
  activeLikes.value.push(like)
  
  // 3秒后移除动画
  setTimeout(() => {
    const index = activeLikes.value.findIndex(l => l.id === like.id)
    if (index > -1) {
      activeLikes.value.splice(index, 1)
    }
  }, 3000)
}

const showGiftPanel = () => {
  showGifts.value = true
}

const closeGiftPanel = () => {
  showGifts.value = false
  selectedGift.value = null
  giftCount.value = 1
}

const selectGift = (gift: LiveGift) => {
  selectedGift.value = gift
}

const sendGift = () => {
  if (!selectedGift.value) return
  
  const success = liveStreamManager.sendGift(selectedGift.value.id, giftCount.value)
  if (success) {
    // 创建礼物动画
    const giftAnimation = {
      id: Date.now() + Math.random(),
      icon: selectedGift.value.icon,
      count: giftCount.value,
      animation: selectedGift.value.animation,
      delay: 0
    }
    
    activeGifts.value.push(giftAnimation)
    
    // 5秒后移除动画
    setTimeout(() => {
      const index = activeGifts.value.findIndex(g => g.id === giftAnimation.id)
      if (index > -1) {
        activeGifts.value.splice(index, 1)
      }
    }, 5000)
    
    closeGiftPanel()
    appStore.showToast(t('live.giftSent'), 'success')
  }
}

const showMoreOptions = () => {
  // 显示更多选项
}

const getUserColor = (level?: number) => {
  const colors = ['#666', '#07c160', '#1677ff', '#faad14', '#722ed1', '#ff6b6b']
  return colors[Math.min(level || 0, colors.length - 1)]
}

// 事件监听
const handleMessage = (message: LiveMessage) => {
  messages.value.push(message)
  
  // 自动滚动到底部
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight
    }
  })
  
  // 处理特殊消息类型
  if (message.type === 'gift' && message.gift) {
    // 触发礼物动画
    const giftAnimation = {
      id: Date.now() + Math.random(),
      icon: message.gift.icon,
      count: message.gift.count,
      animation: 'bounce',
      delay: 0
    }
    
    activeGifts.value.push(giftAnimation)
    
    setTimeout(() => {
      const index = activeGifts.value.findIndex(g => g.id === giftAnimation.id)
      if (index > -1) {
        activeGifts.value.splice(index, 1)
      }
    }, 5000)
  }
}

// 生命周期
onMounted(async () => {
  // 加载礼物列表
  giftList.value = liveStreamManager.getGiftList()
  
  // 监听消息
  liveStreamManager.on('message_received', handleMessage)
  
  // 加入直播间
  const success = await liveStreamManager.joinRoom(roomId)
  if (!success) {
    appStore.showToast(t('live.joinRoomFailed'), 'error')
    router.back()
    return
  }
  
  // 模拟房间信息
  room.value = {
    id: roomId,
    title: '精彩直播间',
    description: '欢迎来到我的直播间',
    cover: '',
    category: '生活',
    streamer: {
      id: 'streamer1',
      name: '主播小王',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=streamer',
      followers: 12345
    },
    viewerCount: 1234,
    likeCount: 5678,
    status: 'live',
    startTime: Date.now() - 3600000,
    chatEnabled: true,
    giftEnabled: true
  }
  
  // 模拟一些初始消息
  messages.value = [
    {
      id: '1',
      type: 'join',
      user: { id: 'user1', name: '观众A', avatar: '' },
      timestamp: Date.now() - 60000
    },
    {
      id: '2',
      type: 'chat',
      user: { id: 'user2', name: '观众B', avatar: '', level: 1 },
      content: '主播好！',
      timestamp: Date.now() - 50000
    },
    {
      id: '3',
      type: 'gift',
      user: { id: 'user3', name: '观众C', avatar: '', level: 2 },
      gift: {
        id: 'flower',
        name: '鲜花',
        icon: '🌹',
        value: 5,
        count: 1
      },
      timestamp: Date.now() - 40000
    }
  ]
})

onUnmounted(() => {
  liveStreamManager.off('message_received', handleMessage)
  liveStreamManager.leaveRoom()
})
</script>

<style scoped>
.live-room {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
}

.video-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.live-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.live-overlay > * {
  pointer-events: auto;
}

.top-info {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 10;
}

.back-btn, .share-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.room-info {
  display: flex;
  gap: 12px;
}

.live-badge, .viewer-count {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
}

.live-badge {
  background: #ff4444;
}

.viewer-count {
  background: rgba(0, 0, 0, 0.5);
}

.streamer-info {
  position: absolute;
  bottom: 120px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.streamer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.streamer-details {
  flex: 1;
  color: white;
}

.streamer-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.room-title {
  font-size: 14px;
  opacity: 0.8;
}

.follow-btn {
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-btn.following {
  background: rgba(7, 193, 96, 0.8);
  border-color: #07c160;
}

.gift-animation-area {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  z-index: 15;
}

.gift-animation {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 20px;
  color: white;
  font-size: 14px;
}

.gift-animation.bounce {
  animation: giftBounce 2s ease-out;
}

.gift-animation.float {
  animation: giftFloat 3s ease-out;
}

.gift-animation.sparkle {
  animation: giftSparkle 2s ease-out;
}

@keyframes giftBounce {
  0% { transform: translateX(100px) scale(0); opacity: 0; }
  20% { transform: translateX(0) scale(1.2); opacity: 1; }
  40% { transform: scale(1); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes giftFloat {
  0% { transform: translateY(50px) scale(0); opacity: 0; }
  20% { transform: translateY(0) scale(1); opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(-20px); opacity: 0; }
}

@keyframes giftSparkle {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  20% { transform: scale(1.3) rotate(180deg); opacity: 1; }
  40% { transform: scale(1) rotate(360deg); }
  100% { transform: scale(1) rotate(360deg); opacity: 1; }
}

.like-animation-area {
  position: absolute;
  bottom: 200px;
  right: 20px;
  width: 100px;
  height: 200px;
  pointer-events: none;
  z-index: 15;
}

.like-bubble {
  position: absolute;
  bottom: 0;
  font-size: 20px;
  animation: likeBubble 3s ease-out forwards;
}

@keyframes likeBubble {
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translateY(-20px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-200px) scale(0.5);
    opacity: 0;
  }
}

.chat-container {
  height: 200px;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  transition: height 0.3s;
}

.chat-container.expanded {
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.chat-message {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.chat-content {
  color: white;
}

.user-name {
  font-weight: 500;
  margin-right: 4px;
}

.message-text {
  color: rgba(255, 255, 255, 0.9);
}

.gift-content {
  color: #faad14;
  display: flex;
  align-items: center;
  gap: 4px;
}

.gift-sender {
  font-weight: 500;
}

.gift-name {
  color: #ff6b6b;
  font-weight: 500;
}

.join-content, .like-content {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.chat-input-area {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-container {
  display: flex;
  gap: 8px;
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  outline: none;
}

.chat-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #07c160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.send-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
}

.bottom-controls {
  display: flex;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.control-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: none;
  background: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  color: #07c160;
}

.control-btn.like-btn:hover {
  color: #ff6b6b;
}

/* 礼物面板样式 */
.gift-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.gift-panel {
  background: white;
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-height: 60vh;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.gift-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.gift-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.gift-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.gift-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.gift-item:hover {
  background: #f8f9fa;
}

.gift-item.selected {
  border-color: #07c160;
  background: #f0f8f0;
}

.gift-icon-large {
  font-size: 32px;
  margin-bottom: 8px;
}

.gift-name {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.gift-value {
  font-size: 11px;
  color: #666;
}

.gift-actions {
  padding: 20px;
  border-top: 1px solid #e5e5e5;
}

.gift-count-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: center;
}

.count-btn {
  padding: 8px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.count-btn.active {
  border-color: #07c160;
  background: #07c160;
  color: white;
}

.send-gift-btn {
  width: 100%;
  padding: 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.send-gift-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
