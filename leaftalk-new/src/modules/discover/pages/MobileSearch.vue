<template>
  <div class="mobile-search">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-input-container">
        <iconify-icon icon="heroicons:magnifying-glass" width="20" class="search-icon"></iconify-icon>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="搜索"
          class="search-input"
          @input="handleSearch"
          @focus="handleFocus"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
          <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 搜索建议 -->
    <div v-if="!searchQuery && !hasSearched" class="search-suggestions">
      <div class="suggestion-section">
        <div class="section-title">搜索指定内容</div>
        <div class="suggestion-item" @click="searchType = 'contact'">
          <span>联系人</span>
        </div>
        <div class="suggestion-item" @click="searchType = 'chat'">
          <span>聊天记录</span>
        </div>
        <div class="suggestion-item" @click="searchType = 'file'">
          <span>文件</span>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchQuery || hasSearched" class="search-results">
      <!-- 联系人结果 -->
      <div v-if="contactResults.length > 0" class="result-section">
        <div class="section-title">联系人</div>
        <div 
          v-for="contact in contactResults"
          :key="contact.id"
          class="result-item contact-item"
          @click="openChat(contact)"
        >
          <img :src="contact.avatar" :alt="contact.name" class="contact-avatar" />
          <div class="contact-info">
            <div class="contact-name">{{ contact.name }}</div>
            <div class="contact-detail">{{ contact.wechatId }}</div>
          </div>
        </div>
      </div>

      <!-- 聊天记录结果 -->
      <div v-if="chatResults.length > 0" class="result-section">
        <div class="section-title">聊天记录</div>
        <div 
          v-for="chat in chatResults"
          :key="chat.id"
          class="result-item chat-item"
          @click="openChatMessage(chat)"
        >
          <img :src="chat.avatar" :alt="chat.name" class="chat-avatar" />
          <div class="chat-info">
            <div class="chat-name">{{ chat.name }}</div>
            <div class="chat-message">{{ chat.message }}</div>
            <div class="chat-time">{{ formatTime(chat.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- 文件结果 -->
      <div v-if="fileResults.length > 0" class="result-section">
        <div class="section-title">文件</div>
        <div 
          v-for="file in fileResults"
          :key="file.id"
          class="result-item file-item"
          @click="openFile(file)"
        >
          <div class="file-icon">
            <iconify-icon :icon="getFileIcon(file.type)" width="24"></iconify-icon>
          </div>
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-detail">{{ file.size }} · {{ formatTime(file.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- 无结果 -->
      <div v-if="searchQuery && !hasResults" class="no-results">
        <iconify-icon icon="heroicons:magnifying-glass" width="64" style="color: #cccccc;"></iconify-icon>
        <p>无搜索结果</p>
        <p class="no-results-tip">请尝试其他关键词</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
// 移除vue-i18n导入，使用全局$t方法
import { contactAPI } from '../../../modules/contacts/services/api'

const router = useRouter()
// 使用全局$t方法，通过getCurrentInstance获取

// 响应式数据
const searchQuery = ref('')
const searchType = ref('all')
const hasSearched = ref(false)
const searchInput = ref<HTMLInputElement>()

// 搜索结果
const contactResults = ref([])
const chatResults = ref([])
const fileResults = ref([])

// 计算属性
const hasResults = computed(() => {
  return contactResults.value.length > 0 || 
         chatResults.value.length > 0 || 
         fileResults.value.length > 0
})

// 方法
const goBack = () => {
  router.back()
}

const handleFocus = () => {
  // 输入框获得焦点时的处理
}

const clearSearch = () => {
  searchQuery.value = ''
  contactResults.value = []
  chatResults.value = []
  fileResults.value = []
  hasSearched.value = false
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    clearSearch()
    return
  }

  hasSearched.value = true

  try {
    // 搜索联系人
    const contactResponse = await contactAPI.search(searchQuery.value)
    if (contactResponse.data.success) {
      contactResults.value = contactResponse.data.data.map((user: any) => ({
        id: user.id,
        name: user.nickname,
        leafId: user.yeyu_id,
        avatar: user.avatar || generateAvatar(user.nickname)
      }))
    }
  } catch (error) {
    console.error('搜索联系人失败:', error)
    contactResults.value = []
  }

  // 搜索聊天记录
  try {
    const chatResponse = await contactAPI.searchMessages(searchQuery.value)
    if (chatResponse.data.success) {
      chatResults.value = chatResponse.data.data.map((msg: any) => ({
        id: msg.id,
        name: msg.sender_id === getCurrentUserId() ? msg.receiver_name : msg.sender_name,
        message: msg.content,
        avatar: msg.sender_id === getCurrentUserId() ? msg.receiver_avatar : msg.sender_avatar,
        timestamp: new Date(msg.created_at).getTime()
      }))
    }
  } catch (error) {
    console.error('搜索聊天记录失败:', error)
    chatResults.value = []
  }

  // 搜索文件
  try {
    const fileResponse = await contactAPI.searchFiles(searchQuery.value)
    if (fileResponse.data.success) {
      fileResults.value = fileResponse.data.data.map((file: any) => ({
        id: file.id,
        name: getFileName(file.content),
        type: getFileType(file.message_type),
        size: getFileSize(file.content),
        timestamp: new Date(file.created_at).getTime()
      }))
    }
  } catch (error) {
    console.error('搜索文件失败:', error)
    fileResults.value = []
  }
}

const openChat = (contact: any) => {
  router.push(`/chat/${contact.id}`)
}

const openChatMessage = (chat: any) => {
  router.push(`/chat/${chat.id}`)
}

const openFile = (file: any) => {
  console.log('打开文件:', file.name)
}

// 生成头像
const generateAvatar = (name: string) => {
  const colors = ['#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7']
  const color = colors[name.length % colors.length]
  const initial = name.charAt(0)
  const svgContent = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${color}"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14">${initial}</text></svg>`)
  return `data:image/svg+xml,${svgContent}`
}

// 获取当前用户ID
const getCurrentUserId = () => {
  const userInfo = localStorage.getItem('user_info')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      return user.id
    } catch (error) {
      console.error('获取用户ID失败:', error)
    }
  }
  return null
}

// 从文件内容中提取文件名
const getFileName = (content: string) => {
  try {
    const fileInfo = JSON.parse(content)
    return fileInfo.name || '未知文件'
  } catch (error) {
    return content.split('/').pop() || '未知文件'
  }
}

// 获取文件类型
const getFileType = (messageType: string) => {
  const typeMap = {
    'image': 'jpg',
    'video': 'mp4',
    'file': 'pdf'
  }
  return typeMap[messageType as keyof typeof typeMap] || 'file'
}

// 获取文件大小
const getFileSize = (content: string) => {
  try {
    const fileInfo = JSON.parse(content)
    return fileInfo.size || '未知大小'
  } catch (error) {
    return '未知大小'
  }
}

const getFileIcon = (type: string) => {
  const iconMap = {
    pdf: 'heroicons:document-text',
    doc: 'heroicons:document-text',
    docx: 'heroicons:document-text',
    xls: 'heroicons:table-cells',
    xlsx: 'heroicons:table-cells',
    ppt: 'heroicons:presentation-chart-bar',
    pptx: 'heroicons:presentation-chart-bar',
    jpg: 'heroicons:photo',
    jpeg: 'heroicons:photo',
    png: 'heroicons:photo',
    gif: 'heroicons:photo',
    mp4: 'heroicons:video-camera',
    mp3: 'heroicons:musical-note',
    zip: 'heroicons:archive-box'
  }
  return iconMap[type] || 'heroicons:document'
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) {
    return '刚刚'
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }
}

onMounted(() => {
  nextTick(() => {
    searchInput.value?.focus()
  })
})
</script>

<style scoped>
.mobile-search {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding-top: 60px; /* 为固定的搜索头部留出空间 */
}

.search-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  z-index: 100;
  height: 36px;
  box-sizing: border-box;
}

.search-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 3px 12px;
  gap: 8px;
  height: 30px;
  box-sizing: border-box;
}

.search-icon {
  color: #999;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  height: 24px;
  line-height: 24px;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
}

.cancel-btn {
  border: none;
  background: transparent;
  color: #07C160;
  font-size: 16px;
  cursor: pointer;
}

.search-suggestions {
  flex: 1;
  padding: 16px;
}

.suggestion-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  padding: 12px 16px;
  font-size: 14px;
  color: #999;
  background: #f8f8f8;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: #f8f8f8;
}

.suggestion-item span {
  color: #999;
  font-size: 14px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.result-section {
  background: white;
  margin-bottom: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  gap: 12px;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f8f8f8;
}

.contact-avatar, .chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
}

.contact-info, .chat-info, .file-info {
  flex: 1;
}

.contact-name, .chat-name, .file-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.contact-detail, .chat-message, .file-detail {
  font-size: 14px;
  color: #666;
}

.chat-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 6px;
  color: #666;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-results p {
  margin: 16px 0 8px;
  font-size: 16px;
  color: #666;
}

.no-results-tip {
  font-size: 14px;
  color: #999;
}
</style>