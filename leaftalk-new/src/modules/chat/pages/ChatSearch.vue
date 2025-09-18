<template>
  <div class="chat-search-page">
    <MobileTopBar
      title="搜索聊天记录"
      :showBack="true"
      @back="goBack"
    />
    
    <div class="page-content scroll-container">
      <!-- 搜索栏 -->
      <div class="search-section">
        <div class="search-bar">
          <iconify-icon icon="heroicons:magnifying-glass" width="20" color="#999"></iconify-icon>
          <input 
            v-model="searchKeyword" 
            placeholder="搜索聊天记录" 
            class="search-input"
            @input="performSearch"
            ref="searchInput"
          />
          <button v-if="searchKeyword" @click="clearSearch" class="clear-btn">
            <iconify-icon icon="heroicons:x-mark" width="16" color="#999"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- 搜索筛选 -->
      <div class="filter-section" v-if="searchKeyword">
        <div class="filter-tabs">
          <button 
            v-for="filter in searchFilters" 
            :key="filter.key"
            @click="activeFilter = filter.key"
            :class="['filter-tab', { active: activeFilter === filter.key }]"
          >
            {{ filter.name }}
            <span v-if="getFilterCount(filter.key) > 0" class="filter-count">
              {{ getFilterCount(filter.key) }}
            </span>
          </button>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div class="search-results" v-if="searchKeyword">
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
                <span class="message-content" v-html="highlightKeyword(result.content)"></span>
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

      <!-- 搜索建议 -->
      <div class="search-suggestions" v-else>
        <div class="suggestion-section">
          <h3>最近搜索</h3>
          <div class="recent-searches">
            <div 
              v-for="recent in recentSearches" 
              :key="recent"
              class="recent-item"
              @click="searchKeyword = recent"
            >
              <iconify-icon icon="heroicons:clock" width="16" color="#999"></iconify-icon>
              <span>{{ recent }}</span>
              <button @click.stop="removeRecentSearch(recent)" class="remove-btn">
                <iconify-icon icon="heroicons:x-mark" width="12" color="#999"></iconify-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="suggestion-section">
          <h3>搜索技巧</h3>
          <div class="search-tips">
            <div class="tip-item">
              <iconify-icon icon="heroicons:light-bulb" width="16" color="#07C160"></iconify-icon>
              <span>输入关键词搜索聊天内容</span>
            </div>
            <div class="tip-item">
              <iconify-icon icon="heroicons:light-bulb" width="16" color="#07C160"></iconify-icon>
              <span>可以搜索图片、文件、链接等</span>
            </div>
            <div class="tip-item">
              <iconify-icon icon="heroicons:light-bulb" width="16" color="#07C160"></iconify-icon>
              <span>支持按联系人或群组筛选</span>
            </div>
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
const activeFilter = ref('all')
const isSearching = ref(false)

// 搜索筛选选项
const searchFilters = [
  { key: 'all', name: '全部' },
  { key: 'text', name: '文字' },
  { key: 'image', name: '图片' },
  { key: 'file', name: '文件' },
  { key: 'link', name: '链接' }
]

// 最近搜索
const recentSearches = ref([
  '家族聚会',
  '照片',
  '文档',
  '会议'
])

// 搜索结果
const searchResults = ref([
  {
    id: 1,
    chatId: 'chat1',
    chatName: '家族群',
    chatAvatar: '/group-avatar1.jpg',
    isGroup: true,
    senderId: 'user1',
    senderName: '张小明',
    type: 'text',
    content: '明天的家族聚会大家都准备好了吗？',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: 2,
    chatId: 'chat2',
    chatName: '李小华',
    chatAvatar: '/avatar2.jpg',
    isGroup: false,
    senderId: 'user2',
    senderName: '李小华',
    type: 'image',
    content: '家族聚会的照片.jpg',
    timestamp: new Date(Date.now() - 7200000)
  },
  {
    id: 3,
    chatId: 'chat1',
    chatName: '家族群',
    chatAvatar: '/group-avatar1.jpg',
    isGroup: true,
    senderId: 'user3',
    senderName: '王大明',
    type: 'file',
    content: '家族族谱文档.pdf',
    timestamp: new Date(Date.now() - 86400000)
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
  
  if (activeFilter.value !== 'all') {
    results = results.filter(result => result.type === activeFilter.value)
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

const clearSearch = () => {
  searchKeyword.value = ''
  activeFilter.value = 'all'
}

const getFilterCount = (filterKey: string) => {
  if (filterKey === 'all') return filteredResults.value.length
  return searchResults.value.filter(result => 
    result.type === filterKey && 
    (result.content.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
     result.chatName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
     result.senderName.toLowerCase().includes(searchKeyword.value.toLowerCase()))
  ).length
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
    file: 'heroicons:document',
    link: 'heroicons:link',
    voice: 'heroicons:microphone',
    video: 'heroicons:video-camera'
  }
  return iconMap[type] || 'heroicons:chat-bubble-left'
}

const getTypeText = (type: string) => {
  const typeMap = {
    text: '文字消息',
    image: '图片消息',
    file: '文件消息',
    link: '链接消息',
    voice: '语音消息',
    video: '视频消息'
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

const removeRecentSearch = (search: string) => {
  const index = recentSearches.value.indexOf(search)
  if (index > -1) {
    recentSearches.value.splice(index, 1)
  }
}
</script>

<style scoped>
.chat-search-page {
  height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
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

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #f0f0f0;
}

.filter-section {
  margin-bottom: 16px;
}

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
