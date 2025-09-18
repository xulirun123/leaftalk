<template>
  <div class="douyin-live-room">
    <!-- 直播视频背景 -->
    <div class="live-video-container">
      <video
        ref="videoElement"
        class="live-video"
        autoplay
        muted
        loop
        :src="liveStream"
      ></video>
      
      <!-- 渐变遮罩 -->
      <div class="video-overlay"></div>
    </div>

    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="material-symbols:arrow-back-ios" width="20" style="color: white;" />
      </button>
      
      <div class="live-info">
        <div class="streamer-card">
          <img :src="roomInfo.streamerAvatar" :alt="roomInfo.streamerName" class="streamer-avatar" />
          <div class="streamer-details">
            <div class="streamer-name">{{ roomInfo.streamerName }}</div>
            <div class="viewer-count">
              <iconify-icon icon="material-symbols:visibility" width="12" />
              <span>{{ formatViewerCount(roomInfo.viewerCount) }}</span>
            </div>
          </div>
          <button class="follow-btn" :class="{ followed: isFollowed }" @click="toggleFollow">
            {{ isFollowed ? '已关注' : '关注' }}
          </button>
        </div>
      </div>

      <div class="top-actions">
        <button class="action-btn" @click="shareRoom">
          <iconify-icon icon="material-symbols:share" width="20" style="color: white;" />
        </button>
        <button class="action-btn" @click="showMoreOptions = true">
          <iconify-icon icon="material-symbols:more-vert" width="20" style="color: white;" />
        </button>
      </div>
    </div>

    <!-- 右侧功能栏 -->
    <div class="right-sidebar">
      <!-- 点赞按钮 -->
      <button class="sidebar-btn like-btn" @click="sendLike">
        <iconify-icon icon="material-symbols:favorite" width="24" :style="{ color: isLiked ? '#ff4444' : 'white' }" />
        <span>{{ formatCount(roomInfo.likeCount) }}</span>
      </button>

      <!-- 评论按钮 -->
      <button class="sidebar-btn" @click="focusCommentInput">
        <iconify-icon icon="material-symbols:chat-bubble" width="24" style="color: white;" />
        <span>{{ formatCount(roomInfo.commentCount) }}</span>
      </button>

      <!-- 礼物按钮 -->
      <button class="sidebar-btn" @click="showGiftPanel = true">
        <iconify-icon icon="material-symbols:redeem" width="24" style="color: white;" />
        <span>礼物</span>
      </button>

      <!-- 分享按钮 -->
      <button class="sidebar-btn" @click="shareRoom">
        <iconify-icon icon="material-symbols:share" width="24" style="color: white;" />
        <span>分享</span>
      </button>
    </div>

    <!-- 聊天消息区域 -->
    <div class="chat-area">
      <div class="chat-messages" ref="chatMessagesRef">
        <div
          v-for="message in chatMessages"
          :key="message.id"
          class="chat-message"
          :class="{ 'gift-message': message.type === 'gift' }"
        >
          <img :src="message.userAvatar" :alt="message.userName" class="message-avatar" />
          <div class="message-content">
            <span class="message-user">{{ message.userName }}</span>
            <span v-if="message.type === 'text'" class="message-text">{{ message.content }}</span>
            <div v-else-if="message.type === 'gift'" class="gift-content">
              <iconify-icon icon="material-symbols:redeem" width="16" style="color: #ffd700;" />
              <span>送出了 {{ message.giftName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入栏 -->
    <div class="bottom-input">
      <div class="input-container">
        <input
          ref="commentInputRef"
          v-model="commentText"
          type="text"
          placeholder="说点什么..."
          class="comment-input"
          @keyup.enter="sendComment"
        />
        <button class="send-btn" @click="sendComment" :disabled="!commentText.trim()">
          <iconify-icon icon="material-symbols:send" width="20" />
        </button>
      </div>
    </div>

    <!-- 礼物面板 -->
    <div v-if="showGiftPanel" class="gift-panel-overlay" @click="showGiftPanel = false">
      <div class="gift-panel" @click.stop>
        <div class="gift-header">
          <h3>选择礼物</h3>
          <button @click="showGiftPanel = false" class="close-btn">
            <iconify-icon icon="material-symbols:close" width="20" />
          </button>
        </div>
        <div class="gift-grid">
          <div
            v-for="gift in gifts"
            :key="gift.id"
            class="gift-item"
            @click="sendGift(gift)"
          >
            <div class="gift-icon">{{ gift.icon }}</div>
            <div class="gift-name">{{ gift.name }}</div>
            <div class="gift-price">{{ gift.price }}豆</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 点赞动画 -->
    <div class="like-animations">
      <div
        v-for="like in likeAnimations"
        :key="like.id"
        class="like-animation"
        :style="like.style"
      >
        ❤️
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSafeNavigation } from '../../../shared/utils/safeNavigation'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const route = useRoute()
const { safeBack } = useSafeNavigation()
const appStore = useAppStore()

// 响应式数据
const videoElement = ref<HTMLVideoElement>()
const chatMessagesRef = ref<HTMLDivElement>()
const commentInputRef = ref<HTMLInputElement>()
const commentText = ref('')
const showGiftPanel = ref(false)
const showMoreOptions = ref(false)
const isFollowed = ref(false)
const isLiked = ref(false)
const likeAnimations = ref<any[]>([])

// 直播间信息
const roomInfo = ref({
  id: route.params.id as string,
  title: '今天教大家做美食',
  streamerName: '美食达人小王',
  streamerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
  viewerCount: 1234,
  likeCount: 5678,
  commentCount: 890
})

// 模拟直播流
const liveStream = ref('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')

// 聊天消息
const chatMessages = ref([
  {
    id: '1',
    userName: '观众1',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    content: '主播好厉害！',
    type: 'text',
    timestamp: Date.now() - 60000
  },
  {
    id: '2',
    userName: '观众2',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    content: '学到了！',
    type: 'text',
    timestamp: Date.now() - 30000
  },
  {
    id: '3',
    userName: '观众3',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    giftName: '玫瑰花',
    type: 'gift',
    timestamp: Date.now() - 10000
  }
])

// 礼物列表
const gifts = ref([
  { id: '1', name: '玫瑰花', icon: '🌹', price: 10 },
  { id: '2', name: '爱心', icon: '❤️', price: 20 },
  { id: '3', name: '火箭', icon: '🚀', price: 100 },
  { id: '4', name: '皇冠', icon: '👑', price: 500 },
  { id: '5', name: '钻石', icon: '💎', price: 1000 },
  { id: '6', name: '跑车', icon: '🏎️', price: 2000 }
])

// 方法
const goBack = () => {
  safeBack('/douyin-live')
}

const formatViewerCount = (count: number) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

const formatCount = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

const toggleFollow = () => {
  isFollowed.value = !isFollowed.value
  appStore.showToast(isFollowed.value ? '已关注主播' : '已取消关注', 'success')
}

const sendLike = () => {
  isLiked.value = true
  roomInfo.value.likeCount++
  
  // 创建点赞动画
  const likeId = Date.now()
  const like = {
    id: likeId,
    style: {
      right: `${Math.random() * 100 + 50}px`,
      bottom: '100px',
      fontSize: `${Math.random() * 10 + 20}px`,
      animationDelay: '0s',
      animationDuration: '3s'
    }
  }
  
  likeAnimations.value.push(like)
  
  // 3秒后移除动画
  setTimeout(() => {
    const index = likeAnimations.value.findIndex(l => l.id === likeId)
    if (index > -1) {
      likeAnimations.value.splice(index, 1)
    }
  }, 3000)
  
  setTimeout(() => {
    isLiked.value = false
  }, 500)
}

const focusCommentInput = () => {
  commentInputRef.value?.focus()
}

const sendComment = () => {
  if (!commentText.value.trim()) return
  
  const newMessage = {
    id: Date.now().toString(),
    userName: '我',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
    content: commentText.value,
    type: 'text',
    timestamp: Date.now()
  }
  
  chatMessages.value.push(newMessage)
  commentText.value = ''
  roomInfo.value.commentCount++
  
  // 滚动到底部
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

const sendGift = (gift: any) => {
  const giftMessage = {
    id: Date.now().toString(),
    userName: '我',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
    giftName: gift.name,
    type: 'gift',
    timestamp: Date.now()
  }
  
  chatMessages.value.push(giftMessage)
  showGiftPanel.value = false
  
  appStore.showToast(`送出了${gift.name}`, 'success')
  
  // 滚动到底部
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

const shareRoom = () => {
  appStore.showToast('分享功能开发中', 'info')
}

// 生命周期
onMounted(() => {
  console.log('进入直播间:', roomInfo.value.id)
  
  // 模拟定期收到新消息
  const messageInterval = setInterval(() => {
    const randomMessages = [
      '666666',
      '主播太棒了！',
      '学到了',
      '继续继续',
      '支持主播',
      '厉害厉害'
    ]
    
    const newMessage = {
      id: Date.now().toString(),
      userName: `观众${Math.floor(Math.random() * 1000)}`,
      userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${Math.random()}`,
      content: randomMessages[Math.floor(Math.random() * randomMessages.length)],
      type: 'text',
      timestamp: Date.now()
    }
    
    chatMessages.value.push(newMessage)
    
    // 保持消息数量在合理范围
    if (chatMessages.value.length > 50) {
      chatMessages.value.shift()
    }
    
    // 自动滚动到底部
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    })
  }, 3000)
  
  // 组件卸载时清理定时器
  onUnmounted(() => {
    clearInterval(messageInterval)
  })
})
</script>

<style scoped>
.douyin-live-room {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  color: white;
  overflow: hidden;
}

/* 直播视频 */
.live-video-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.live-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    transparent 0%,
    transparent 60%,
    rgba(0, 0, 0, 0.3) 80%,
    rgba(0, 0, 0, 0.6) 100%
  );
}

/* 顶部信息栏 */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 20px 16px 16px;
  background: linear-gradient(rgba(0, 0, 0, 0.5), transparent);
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.live-info {
  flex: 1;
  margin: 0 16px;
}

.streamer-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.streamer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
}

.streamer-details {
  flex: 1;
}

.streamer-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.viewer-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.follow-btn {
  background: #ff4444;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-btn.followed {
  background: rgba(255, 255, 255, 0.2);
}

.follow-btn:hover {
  transform: scale(1.05);
}

.top-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 右侧功能栏 */
.right-sidebar {
  position: absolute;
  right: 16px;
  bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 10;
}

.sidebar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.sidebar-btn span {
  font-size: 10px;
  white-space: nowrap;
}

.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.like-btn {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 聊天区域 */
.chat-area {
  position: absolute;
  left: 16px;
  bottom: 80px;
  width: 60%;
  max-height: 300px;
  z-index: 10;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.chat-messages::-webkit-scrollbar {
  width: 2px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  animation: slideInLeft 0.3s ease-out;
}

.chat-message.gift-message {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.message-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-user {
  font-size: 12px;
  font-weight: 600;
  color: #ffd700;
  margin-right: 8px;
}

.message-text {
  font-size: 12px;
  color: white;
}

.gift-content {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ffd700;
}

/* 底部输入栏 */
.bottom-input {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
  z-index: 10;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

.comment-input {
  flex: 1;
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  outline: none;
}

.comment-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.send-btn {
  background: #ff4444;
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
}

.send-btn:hover:not(:disabled) {
  background: #ee3333;
  transform: scale(1.1);
}

/* 礼物面板 */
.gift-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.gift-panel {
  background: white;
  color: #333;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
}

.gift-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.gift-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
}

.gift-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 20px;
}

.gift-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.gift-item:hover {
  border-color: #ff4444;
  transform: scale(1.05);
}

.gift-icon {
  font-size: 32px;
}

.gift-name {
  font-size: 14px;
  font-weight: 500;
}

.gift-price {
  font-size: 12px;
  color: #ff4444;
  font-weight: 600;
}

/* 点赞动画 */
.like-animations {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100px;
  height: 200px;
  pointer-events: none;
  z-index: 15;
}

.like-animation {
  position: absolute;
  animation: floatUp 3s ease-out forwards;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-200px) scale(1.5);
  }
}
</style>
