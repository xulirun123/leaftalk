<template>
  <div class="chat-search-page">
    <!-- 状态栏 -->
    <div class="status-bar"></div>

    <!-- 搜索栏 -->
    <div class="search-header">
      <div class="search-bar">
        <iconify-icon icon="heroicons:magnifying-glass" width="18" color="#999"></iconify-icon>
        <input
          v-model="searchKeyword"
          placeholder="搜索聊天记录"
          class="search-input"
          @input="performSearch"
          ref="searchInput"
        />
      </div>
      <button class="cancel-btn" @click="goBack">取消</button>
    </div>

    <div class="page-content">
      <!-- 快速搜索分类 -->
      <div class="quick-search-section">
        <div class="section-title">快速搜索聊天内容</div>
        <div class="quick-search-grid">
          <div
            v-for="category in searchCategories"
            :key="category.key"
            class="category-item"
            @click="goToCategorySearch(category.key)"
          >
            <iconify-icon :icon="category.icon" width="24" :color="category.color"></iconify-icon>
            <span class="category-name">{{ category.name }}</span>
          </div>
        </div>
      </div>

      <!-- 搜索结果（当有输入时显示） -->
      <div class="search-results-section" v-if="searchKeyword">

        <div v-if="isSearching" class="loading-state">
          <iconify-icon icon="heroicons:arrow-path" width="24" color="#999" class="spinning"></iconify-icon>
          <span>搜索中...</span>
        </div>

        <div v-else-if="filteredResults.length === 0" class="empty-results">
          <iconify-icon icon="heroicons:magnifying-glass" width="48" color="#ccc"></iconify-icon>
          <p>未找到相关聊天记录</p>
          <span>尝试使用其他关键词</span>
        </div>
        
        <div v-else class="result-list">
          <div
            v-for="result in filteredResults"
            :key="result.id"
            class="result-item"
            @click="openChatMessage(result)"
          >
            <div class="result-avatar">
              <img :src="result.chatAvatar" :alt="result.chatName" />
            </div>
            <div class="result-content">
              <div class="result-header">
                <span class="chat-name">{{ result.chatName }}</span>
                <span class="result-time">{{ formatTime(result.timestamp) }}</span>
              </div>
              <div class="result-message">
                <span class="sender-name" v-if="result.isGroup">{{ result.senderName }}:</span>

                <!-- 文字消息 -->
                <span v-if="result.type === 'text'" class="message-content" v-html="highlightKeyword(result.content)"></span>

                <!-- 图片消息 -->
                <div v-else-if="result.type === 'image'" class="media-message">
                  <iconify-icon icon="heroicons:photo" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content" v-html="highlightKeyword(result.content)"></span>
                </div>

                <!-- 视频消息 -->
                <div v-else-if="result.type === 'video'" class="media-message">
                  <iconify-icon icon="heroicons:video-camera" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content">{{ result.content }}</span>
                  <span class="media-duration">{{ result.duration }}</span>
                </div>

                <!-- 语音消息 -->
                <div v-else-if="result.type === 'voice'" class="media-message">
                  <iconify-icon icon="heroicons:microphone" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content">{{ result.content }}</span>
                  <span class="media-duration">{{ result.duration }}</span>
                </div>

                <!-- 文件消息 -->
                <div v-else-if="result.type === 'file'" class="media-message">
                  <iconify-icon icon="heroicons:document" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content" v-html="highlightKeyword(result.content)"></span>
                  <span class="file-size">{{ result.fileSize }}</span>
                </div>

                <!-- 链接消息 -->
                <div v-else-if="result.type === 'link'" class="media-message">
                  <iconify-icon icon="heroicons:link" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content" v-html="highlightKeyword(result.linkTitle || result.content)"></span>
                </div>

                <!-- 音乐消息 -->
                <div v-else-if="result.type === 'music'" class="media-message">
                  <iconify-icon icon="heroicons:musical-note" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content">{{ result.musicTitle }}</span>
                  <span class="music-artist">{{ result.artist }}</span>
                </div>

                <!-- 小程序消息 -->
                <div v-else-if="result.type === 'miniprogram'" class="media-message">
                  <iconify-icon icon="heroicons:cube" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content">{{ result.miniprogramName }}</span>
                </div>

                <!-- 视频号消息 -->
                <div v-else-if="result.type === 'videochannel'" class="media-message">
                  <iconify-icon icon="heroicons:play-circle" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content">{{ result.videoChannelTitle }}</span>
                </div>

                <!-- 位置消息 -->
                <div v-else-if="result.type === 'location'" class="media-message">
                  <iconify-icon icon="heroicons:map-pin" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content">{{ result.locationName }}</span>
                  <span class="location-address">{{ result.address }}</span>
                </div>

                <!-- 红包消息 -->
                <div v-else-if="result.type === 'redpacket'" class="media-message">
                  <iconify-icon icon="heroicons:gift" width="16" color="#F56C6C"></iconify-icon>
                  <span class="message-content">{{ result.content }}</span>
                  <span class="amount">¥{{ result.amount }}</span>
                </div>

                <!-- 转账消息 -->
                <div v-else-if="result.type === 'transfer'" class="media-message">
                  <iconify-icon icon="heroicons:banknotes" width="16" color="#07C160"></iconify-icon>
                  <span class="message-content">{{ result.content }}</span>
                </div>

                <!-- 其他类型 -->
                <span v-else class="message-content">{{ result.content }}</span>
              </div>
              <div class="result-type">
                <iconify-icon :icon="getTypeIcon(result.type)" width="12" color="#999"></iconify-icon>
                <span>{{ getTypeText(result.type) }}</span>
              </div>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" color="#999"></iconify-icon>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const searchInput = ref(null)
const searchKeyword = ref('')
const isSearching = ref(false)

// 快速搜索分类
const searchCategories = [
  { key: 'date', name: '日期', icon: 'heroicons:calendar', color: '#07C160' },
  { key: 'image', name: '图片', icon: 'heroicons:photo', color: '#FF9500' },
  { key: 'music', name: '音乐', icon: 'heroicons:musical-note', color: '#FF3B30' },
  { key: 'file', name: '文件', icon: 'heroicons:document', color: '#5856D6' },
  { key: 'link', name: '链接', icon: 'heroicons:link', color: '#007AFF' },
  { key: 'video', name: '视频', icon: 'heroicons:video-camera', color: '#34C759' },
  { key: 'transaction', name: '交易', icon: 'heroicons:banknotes', color: '#FF9500' },
  { key: 'miniprogram', name: '小程序', icon: 'heroicons:cube', color: '#5AC8FA' },
  { key: 'videochannel', name: '视频号', icon: 'heroicons:play-circle', color: '#FF2D55' }
]



// 搜索结果（模拟数据 - 包含各种类型）
const searchResults = ref([
  {
    id: 1,
    chatId: 'chat_15_2',
    chatName: '家族群',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group1',
    isGroup: true,
    senderId: 'user1',
    senderName: '张小明',
    type: 'text',
    content: '明天的家族聚会大家都准备好了吗？',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: 2,
    chatId: 'chat_15_3',
    chatName: '李小华',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    isGroup: false,
    senderId: 'user2',
    senderName: '李小华',
    type: 'image',
    content: '[图片] 家族聚会合影.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300',
    timestamp: new Date(Date.now() - 7200000)
  },
  {
    id: 3,
    chatId: 'chat_15_2',
    chatName: '家族群',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group1',
    isGroup: true,
    senderId: 'user3',
    senderName: '王大明',
    type: 'file',
    content: '[文件] 家族族谱文档.pdf',
    fileSize: '2.5MB',
    timestamp: new Date(Date.now() - 86400000)
  },
  {
    id: 4,
    chatId: 'chat_15_3',
    chatName: '李小华',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    isGroup: false,
    senderId: 'user2',
    senderName: '李小华',
    type: 'video',
    content: '[视频] 家族聚会视频.mp4',
    duration: '02:35',
    timestamp: new Date(Date.now() - 172800000)
  },
  {
    id: 5,
    chatId: 'chat_15_2',
    chatName: '家族群',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group1',
    isGroup: true,
    senderId: 'user4',
    senderName: '赵小红',
    type: 'voice',
    content: '[语音]',
    duration: '15"',
    timestamp: new Date(Date.now() - 259200000)
  },
  {
    id: 6,
    chatId: 'chat_15_4',
    chatName: '王小刚',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    isGroup: false,
    senderId: 'user4',
    senderName: '王小刚',
    type: 'link',
    content: '家族网站链接',
    linkUrl: 'https://family.example.com',
    linkTitle: '叶氏家族官方网站',
    timestamp: new Date(Date.now() - 345600000)
  },
  {
    id: 7,
    chatId: 'chat_15_2',
    chatName: '家族群',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group1',
    isGroup: true,
    senderId: 'user5',
    senderName: '刘小芳',
    type: 'music',
    content: '[音乐] 家族主题曲',
    musicTitle: '叶氏家族之歌',
    artist: '家族合唱团',
    timestamp: new Date(Date.now() - 432000000)
  },
  {
    id: 8,
    chatId: 'chat_15_3',
    chatName: '李小华',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    isGroup: false,
    senderId: 'user2',
    senderName: '李小华',
    type: 'miniprogram',
    content: '[小程序] 家族族谱查询',
    miniprogramName: '叶语族谱',
    timestamp: new Date(Date.now() - 518400000)
  },
  {
    id: 9,
    chatId: 'chat_15_2',
    chatName: '家族群',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group1',
    isGroup: true,
    senderId: 'user6',
    senderName: '陈小明',
    type: 'videochannel',
    content: '[视频号] 家族历史纪录片',
    videoChannelTitle: '叶氏家族百年史',
    timestamp: new Date(Date.now() - 604800000)
  },
  {
    id: 10,
    chatId: 'chat_15_5',
    chatName: '周小丽',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    isGroup: false,
    senderId: 'user5',
    senderName: '周小丽',
    type: 'location',
    content: '[位置] 家族祠堂',
    locationName: '叶氏祠堂',
    address: '广东省梅州市梅县区',
    timestamp: new Date(Date.now() - 691200000)
  },
  {
    id: 11,
    chatId: 'chat_15_2',
    chatName: '家族群',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group1',
    isGroup: true,
    senderId: 'user7',
    senderName: '吴小强',
    type: 'redpacket',
    content: '[红包] 新年快乐',
    amount: '88.88',
    timestamp: new Date(Date.now() - 777600000)
  },
  {
    id: 12,
    chatId: 'chat_15_6',
    chatName: '郑小华',
    chatAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user6',
    isGroup: false,
    senderId: 'user6',
    senderName: '郑小华',
    type: 'transfer',
    content: '[转账] ¥500.00',
    amount: '500.00',
    timestamp: new Date(Date.now() - 864000000)
  }
])

// 计算属性
const filteredResults = computed(() => {
  if (!searchKeyword.value) return []

  let results = searchResults.value.filter(result =>
    result.content.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    result.chatName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    result.senderName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )

  // 按聊天ID筛选（如果有传入chatId参数）
  if (route.params.chatId) {
    const chatId = route.params.chatId as string
    results = results.filter(result => result.chatId === chatId)
  }

  return results
})

// 生命周期
onMounted(() => {
  // 自动聚焦搜索框
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })

  // 如果有传入的搜索关键词
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword as string
  }
})

// 方法
const goBack = () => {
  router.back()
}

// 跳转到分类搜索页面
const goToCategorySearch = (category: string) => {
  const chatId = route.params.chatId as string
  const basePath = `/chat-search-${category}`
  const fullPath = chatId ? `${basePath}/${chatId}` : basePath

  console.log('🔍 跳转到分类搜索:', category, fullPath)
  router.push(fullPath)
}

const performSearch = () => {
  if (!searchKeyword.value.trim()) return
  
  isSearching.value = true
  
  // 模拟搜索延迟
  setTimeout(() => {
    isSearching.value = false
    
    // 添加到最近搜索
    if (!recentSearches.value.includes(searchKeyword.value)) {
      recentSearches.value.unshift(searchKeyword.value)
      if (recentSearches.value.length > 10) {
        recentSearches.value = recentSearches.value.slice(0, 10)
      }
    }
  }, 500)
}



const highlightKeyword = (text: string) => {
  if (!searchKeyword.value) return text
  
  const regex = new RegExp(`(${searchKeyword.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 86400000) {
    return timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  } else {
    return timestamp.toLocaleDateString('zh-CN')
  }
}

const getTypeIcon = (type: string) => {
  const iconMap = {
    text: 'heroicons:chat-bubble-left',
    image: 'heroicons:photo',
    video: 'heroicons:video-camera',
    voice: 'heroicons:microphone',
    file: 'heroicons:document',
    link: 'heroicons:link',
    music: 'heroicons:musical-note',
    miniprogram: 'heroicons:cube',
    videochannel: 'heroicons:play-circle',
    location: 'heroicons:map-pin',
    redpacket: 'heroicons:gift',
    transfer: 'heroicons:banknotes'
  }
  return iconMap[type] || 'heroicons:chat-bubble-left'
}

const getTypeText = (type: string) => {
  const typeMap = {
    text: '文字消息',
    image: '图片',
    video: '视频',
    voice: '语音',
    file: '文件',
    link: '链接',
    music: '音乐',
    miniprogram: '小程序',
    videochannel: '视频号',
    location: '位置',
    redpacket: '红包',
    transfer: '转账'
  }
  return typeMap[type] || '消息'
}

const openChatMessage = (result: any) => {
  // 跳转到对应的聊天窗口并定位到消息
  router.push({
    path: `/chat/${result.chatId}`,
    query: { messageId: result.id }
  })
}


</script>

<style scoped>
.chat-search-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #EDEDED;
}

/* 状态栏 */
.status-bar {
  height: 25px;
  background: white;
}

/* 搜索头部 */
.search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #E5E5E5;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #F6F6F6;
  border-radius: 8px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #333;
  background: transparent;
}

.search-input::placeholder {
  color: #999;
}

.cancel-btn {
  padding: 0;
  background: none;
  border: none;
  font-size: 15px;
  color: #07C160;
  cursor: pointer;
  white-space: nowrap;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 快速搜索分类 */
.quick-search-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.quick-search-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: #F6F6F6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:active {
  background: #E5E5E5;
  transform: scale(0.98);
}

.category-name {
  font-size: 13px;
  color: #333;
}

.filter-section {
  margin-bottom: 16px;
}

/* 日期筛选 */
.date-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.date-filter-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.date-filter-btn.active {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.date-filter-btn:hover {
  border-color: #07C160;
}

/* 类型筛选 */
.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.filter-tab {
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

.filter-tab.active {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.filter-count {
  background: rgba(255,255,255,0.2);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.filter-tab.active .filter-count {
  background: rgba(255,255,255,0.3);
}

.loading-state,
.empty-results {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-results p {
  font-size: 16px;
  color: #333;
  margin: 16px 0 8px 0;
}

.empty-results span {
  font-size: 14px;
  color: #999;
}

.result-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f8f8f8;
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.result-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-content {
  flex: 1;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chat-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.result-time {
  font-size: 12px;
  color: #999;
}

.result-message {
  margin-bottom: 4px;
}

.sender-name {
  font-size: 14px;
  color: #666;
  margin-right: 4px;
}

.message-content {
  font-size: 14px;
  color: #333;
}

.message-content :deep(mark) {
  background: #ffeb3b;
  padding: 0 2px;
  border-radius: 2px;
}

.result-type {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

/* 媒体消息样式 */
.media-message {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.media-duration,
.file-size,
.music-artist,
.location-address {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}

.amount {
  font-size: 14px;
  font-weight: bold;
  color: #F56C6C;
  margin-left: 4px;
}

.search-suggestions {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.suggestion-section {
  margin-bottom: 24px;
}

.suggestion-section:last-child {
  margin-bottom: 0;
}

.suggestion-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.recent-searches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f8f8;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.recent-item:hover {
  background: #f0f0f0;
}

.recent-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.remove-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: #e0e0e0;
}

.search-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}
</style>
