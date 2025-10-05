<template>
  <div class="chat-search-file">
    <!-- 统一状态栏 -->
    <StatusBar />

    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-bar">
        <span class="search-prefix">{{ searchTypeText }}</span>
        <input
          v-model="searchKeyword"
          :placeholder="`搜索${searchTypeText}`"
          class="search-input"
          ref="searchInput"
        />
      </div>
      <button class="cancel-btn" @click="goBack">取消</button>
    </div>

    <!-- 搜索结果 -->
    <div class="page-content">
      <!-- 无内容状态 -->
      <div v-if="!searchKeyword" class="empty-hint">
        <iconify-icon :icon="searchIcon" width="48" color="#ccc"></iconify-icon>
        <p>无内容</p>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="isSearching" class="loading-state">
        <iconify-icon icon="heroicons:arrow-path" width="24" color="#999" class="spinning"></iconify-icon>
        <span>搜索中...</span>
      </div>

      <!-- 搜索无结果 -->
      <div v-else-if="filteredResults.length === 0" class="empty-results">
        <iconify-icon :icon="searchIcon" width="48" color="#ccc"></iconify-icon>
        <p>无内容</p>
      </div>

      <!-- 搜索结果列表 -->
      <div v-else class="result-list">
        <div
          v-for="result in filteredResults"
          :key="result.id"
          class="result-item"
          @click="openFile(result)"
        >
          <div class="file-icon">
            <iconify-icon :icon="searchIcon" width="40" color="#5856D6"></iconify-icon>
          </div>
          <div class="file-info">
            <div class="file-name" v-html="highlightKeyword(result.fileName)"></div>
            <div class="file-meta">
              <span class="file-size">{{ result.fileSize }}</span>
              <span class="file-time">{{ formatTime(result.timestamp) }}</span>
            </div>
            <div class="file-source">
              <span class="chat-name">{{ result.chatName }}</span>
              <span v-if="result.isGroup" class="sender-name">{{ result.senderName }}</span>
            </div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" color="#999"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StatusBar from '@/shared/components/mobile/StatusBar.vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const searchInput = ref(null)
const searchKeyword = ref('')
const isSearching = ref(false)

// 根据路由名称确定搜索类型
const searchTypeText = computed(() => {
  const routeName = route.name as string
  const typeMap: Record<string, string> = {
    'ChatSearchFile': '文件',
    'ChatSearchMusic': '音乐',
    'ChatSearchLink': '链接',
    'ChatSearchTransaction': '交易',
    'ChatSearchMiniprogram': '小程序',
    'ChatSearchVideochannel': '视频号'
  }
  return typeMap[routeName] || '文件'
})

// 根据搜索类型确定图标
const searchIcon = computed(() => {
  const routeName = route.name as string
  const iconMap: Record<string, string> = {
    'ChatSearchFile': 'heroicons:document',
    'ChatSearchMusic': 'heroicons:musical-note',
    'ChatSearchLink': 'heroicons:link',
    'ChatSearchTransaction': 'heroicons:currency-dollar',
    'ChatSearchMiniprogram': 'heroicons:squares-2x2',
    'ChatSearchVideochannel': 'heroicons:video-camera'
  }
  return iconMap[routeName] || 'heroicons:document'
})

// 模拟文件数据
const fileResults = ref([
  {
    id: 1,
    chatId: 'chat_15_2',
    chatName: '家族群',
    isGroup: true,
    senderId: 'user3',
    senderName: '王大明',
    fileName: '家族族谱文档.pdf',
    fileSize: '2.5MB',
    timestamp: new Date(Date.now() - 86400000)
  },
  {
    id: 2,
    chatId: 'chat_15_3',
    chatName: '李小华',
    isGroup: false,
    senderId: 'user2',
    senderName: '李小华',
    fileName: '会议记录.docx',
    fileSize: '1.2MB',
    timestamp: new Date(Date.now() - 172800000)
  },
  {
    id: 3,
    chatId: 'chat_15_2',
    chatName: '家族群',
    isGroup: true,
    senderId: 'user5',
    senderName: '刘小芳',
    fileName: '家族活动方案.pptx',
    fileSize: '5.8MB',
    timestamp: new Date(Date.now() - 259200000)
  }
])

// 计算属性
const filteredResults = computed(() => {
  if (!searchKeyword.value) return []
  
  let results = fileResults.value.filter(result => 
    result.fileName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
  
  // 按聊天ID筛选（如果有传入chatId参数）
  if (route.params.chatId) {
    const chatId = route.params.chatId as string
    results = results.filter(result => result.chatId === chatId)
  }
  
  return results
})

// 方法
const goBack = () => {
  router.back()
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

const openFile = (result: any) => {
  console.log('打开文件:', result)
  // 这里可以实现文件预览或下载功能
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
})
</script>

<style scoped>
.chat-search-file {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #EDEDED; /* 淡灰色背景 */
}

/* 覆盖状态栏背景色 - 与页面背景一致 */
.chat-search-file :deep(.status-bar) {
  background: #EDEDED !important;
}

/* 搜索头部 */
.search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #EDEDED; /* 与页面背景一致 */
  border-bottom: 1px solid #E5E5E5;
  flex-shrink: 0;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #FFFFFF; /* 纯白色搜索框，与背景形成对比 */
  border-radius: 8px;
}

.search-prefix {
  font-size: 15px;
  color: #333;
  white-space: nowrap;
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
  background: #EDEDED; /* 与页面背景一致 */
}

/* 加载和空状态 */
.loading-state,
.empty-results,
.empty-hint {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-results p,
.empty-hint p {
  margin: 12px 0 0;
  font-size: 15px;
  color: #999;
}

/* 结果列表 */
.result-list {
  padding: 0;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #FFFFFF; /* 白色背景 */
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background 0.2s;
}

.result-item:active {
  background: #F6F6F6;
}

.file-icon {
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name :deep(mark) {
  background: #FFE066;
  color: #333;
  padding: 0 2px;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.file-source {
  font-size: 12px;
  color: #999;
}

.chat-name {
  margin-right: 8px;
}

.sender-name::before {
  content: '·';
  margin-right: 4px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

