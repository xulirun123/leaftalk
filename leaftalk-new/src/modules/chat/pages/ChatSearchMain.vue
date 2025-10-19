<template>
  <div class="chat-search-main">
    <!-- 状态栏 -->
    <StatusBar />

    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-bar">
        <iconify-icon icon="heroicons:magnifying-glass" width="18" color="#999"></iconify-icon>
        <input
          v-model="searchKeyword"
          placeholder="搜索聊天记录"
          class="search-input"
          ref="searchInput"
        />
        <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          <iconify-icon icon="heroicons:x-circle-solid" width="18" color="#999"></iconify-icon>
        </button>
      </div>
      <button class="cancel-btn" @click="goBack">取消</button>
    </div>
    
    <!-- 页面内容 -->
    <div class="page-content">
      <!-- 快速搜索分类 - 无输入时显示 -->
      <div class="quick-search-section" v-if="!searchKeyword">
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

      <!-- 分类搜索按钮 - 有输入时显示 -->
      <div class="category-search-section" v-else>
        <!-- 分类搜索按钮行 -->
        <div
          class="category-buttons"
          ref="categoryButtonsRef"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
        >
          <button
            v-for="category in filterCategories"
            :key="category.key"
            class="category-btn"
            :class="{ active: selectedCategory === category.key }"
            @click="selectCategory(category.key)"
          >
            <iconify-icon :icon="category.icon" width="16" :color="selectedCategory === category.key ? '#07C160' : category.color"></iconify-icon>
            <span>{{ category.name }}</span>
          </button>
        </div>

        <!-- 搜索项 - 只在未搜索时显示 -->
        <div v-if="!hasSearched" class="search-item" @click="performSearch">
          <iconify-icon icon="heroicons:magnifying-glass" width="20" color="#999"></iconify-icon>
          <div class="search-item-content">
            <span class="search-label">搜索：</span>
            <span class="search-text">"{{ searchKeyword }}"</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" color="#999"></iconify-icon>
        </div>

        <!-- 搜索结果 - 只在执行搜索后显示 -->
        <div class="search-results" v-if="hasSearched">
          <div v-if="isSearching" class="loading-state">
            <iconify-icon icon="heroicons:arrow-path" width="24" color="#999" class="spinning"></iconify-icon>
            <span>搜索中...</span>
          </div>

          <div v-else-if="filteredResults.length === 0" class="empty-results">
            <iconify-icon icon="heroicons:magnifying-glass" width="36" color="#999"></iconify-icon>
            <p>未找到与"{{ searchKeyword }}"相关的结果</p>
          </div>

          <div v-else class="result-list">
            <!-- 全部类型搜索 - 显示消息列表 -->
            <template v-if="selectedCategory === 'all'">
              <div
                v-for="result in filteredResults"
                :key="result.id"
                class="result-item"
                @click="openChatMessage(result)"
              >
                <div class="result-avatar">
                  <img :src="result.chatAvatar || result.senderAvatar" :alt="result.chatName || result.senderName" />
                </div>
                <div class="result-content">
                  <div class="result-header">
                    <span class="sender-name-text">{{ result.chatName || result.senderName }}</span>
                    <span class="result-time">{{ formatTime(result.timestamp) }}</span>
                  </div>
                  <div class="result-message">
                    <span class="message-content" v-html="highlightKeyword(getMessagePreview(result))"></span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 特定类型搜索 - 显示卡片样式 -->
            <template v-else>
              <div
                v-for="result in filteredResults"
                :key="result.id"
                class="result-card"
                @click="handleCardClick(result)"
              >
                <!-- 发送者信息 -->
                <div class="card-sender">
                  <div class="sender-avatar-small">
                    <img :src="result.senderAvatar" :alt="result.senderName" />
                  </div>
                  <span class="sender-name-small">{{ result.senderName }}</span>
                  <span class="card-time-top">{{ formatTime(result.timestamp) }}</span>
                </div>

                <!-- 内容卡片 -->
                <div class="card-content">
                  <div class="card-cover">
                    <img :src="getContentCover(result)" :alt="getContentTitle(result)" />
                  </div>
                  <div class="card-title">{{ getContentTitle(result) }}</div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 音乐播放器 -->
    <MusicPlayer
      :visible="musicPlayerVisible"
      :music-info="currentMusic"
      @close="closeMusicPlayer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StatusBar from '@/shared/components/mobile/StatusBar.vue'
import MusicPlayer from '@/modules/chat/components/MusicPlayer.vue'
import { messagePersistenceService } from '@/modules/chat/services/messagePersistenceService'
import { useChatStore } from '@/modules/chat/stores/chatStore'
import { useAuthStore } from '@/stores/auth'
import { getRealAvatarUrl } from '@/shared/utils/avatar'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()
const authStore = useAuthStore()

// 响应式数据
const searchInput = ref(null)
const categoryButtonsRef = ref<HTMLElement | null>(null)
const searchKeyword = ref('')
const isSearching = ref(false)
const selectedCategory = ref('all') // 默认选中"全部"
const hasSearched = ref(false) // 是否已执行搜索

// 鼠标拖动相关
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)

// 音乐播放器相关
const musicPlayerVisible = ref(false)
const currentMusic = ref({
  name: '',
  artist: '',
  cover: '',
  url: ''
})

// 快速搜索分类（无输入时显示）
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

// 筛选分类（有输入时显示，第一个是"全部"，移除图片和视频）
const filterCategories = [
  { key: 'all', name: '全部', icon: 'heroicons:squares-2x2', color: '#07C160' },
  { key: 'music', name: '音乐', icon: 'heroicons:musical-note', color: '#FF3B30' },
  { key: 'file', name: '文件', icon: 'heroicons:document', color: '#5856D6' },
  { key: 'link', name: '链接', icon: 'heroicons:link', color: '#007AFF' },
  { key: 'transaction', name: '交易', icon: 'heroicons:banknotes', color: '#FF9500' },
  { key: 'miniprogram', name: '小程序', icon: 'heroicons:cube', color: '#5AC8FA' },
  { key: 'videochannel', name: '视频号', icon: 'heroicons:play-circle', color: '#FF2D55' }
]

// 搜索结果数据
const searchResults = ref<any[]>([])
const allMessages = ref<any[]>([])

// 计算属性
const filteredResults = computed(() => {
  if (!searchKeyword.value || !hasSearched.value) return []

  const keyword = searchKeyword.value.toLowerCase().trim()

  // 从所有消息中搜索
  let results = allMessages.value.filter(msg => {
    // 按分类筛选
    if (selectedCategory.value !== 'all' && msg.type !== selectedCategory.value) {
      return false
    }

    // 根据消息类型搜索不同的字段
    switch (msg.type) {
      case 'text':
        // 文本消息：搜索内容、聊天名称、发送者名称
        const content = (msg.content || '').toLowerCase()
        const chatName = (msg.chatName || '').toLowerCase()
        const senderName = (msg.senderName || '').toLowerCase()
        return content.includes(keyword) ||
               chatName.includes(keyword) ||
               senderName.includes(keyword)

      case 'file':
        // 文件消息：搜索文件名
        const fileName = (msg.fileName || msg.content || '').toLowerCase()
        return fileName.includes(keyword)

      case 'music':
        // 音乐消息：搜索音乐名称
        const musicName = (msg.musicName || msg.content || '').toLowerCase()
        return musicName.includes(keyword)

      case 'transaction':
        // 交易消息：搜索金额
        const amount = String(msg.amount || msg.content || '')
        return amount.includes(keyword)

      case 'miniprogram':
        // 小程序消息：搜索小程序名称
        const miniprogramName = (msg.miniprogramName || msg.content || '').toLowerCase()
        return miniprogramName.includes(keyword)

      case 'videochannel':
        // 视频号消息：搜索作品名称
        const videoTitle = (msg.videoTitle || msg.content || '').toLowerCase()
        return videoTitle.includes(keyword)

      case 'link':
        // 链接消息：搜索链接标题和内容
        const linkTitle = (msg.linkTitle || msg.content || '').toLowerCase()
        return linkTitle.includes(keyword)

      default:
        // 其他类型：搜索内容
        const defaultContent = (msg.content || '').toLowerCase()
        return defaultContent.includes(keyword)
    }
  })

  // 按时间倒序排列
  results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  console.log('🔍 筛选结果数量:', results.length, '关键词:', keyword, '分类:', selectedCategory.value)

  return results
})

// 方法
const goBack = () => {
  router.back()
}

// 清除搜索内容
const clearSearch = () => {
  searchKeyword.value = ''
  selectedCategory.value = 'all' // 重置为"全部"
  hasSearched.value = false // 重置搜索状态
  if (searchInput.value) {
    searchInput.value.focus()
  }
}

// 跳转到分类搜索页面（无输入时点击分类）
const goToCategorySearch = (category: string) => {
  const chatId = route.params.chatId as string
  const basePath = `/chat-search-${category}`
  const fullPath = chatId ? `${basePath}/${chatId}` : basePath

  console.log('🔍 跳转到分类搜索:', category, fullPath)
  router.push(fullPath)
}

// 鼠标拖动处理函数
const handleMouseDown = (e: MouseEvent) => {
  if (!categoryButtonsRef.value) return

  isDragging.value = true
  startX.value = e.pageX - categoryButtonsRef.value.offsetLeft
  scrollLeft.value = categoryButtonsRef.value.scrollLeft
  categoryButtonsRef.value.style.cursor = 'grabbing'
  categoryButtonsRef.value.style.userSelect = 'none'
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !categoryButtonsRef.value) return

  e.preventDefault()
  const x = e.pageX - categoryButtonsRef.value.offsetLeft
  const walk = (x - startX.value) * 2 // 滚动速度倍数
  categoryButtonsRef.value.scrollLeft = scrollLeft.value - walk
}

const handleMouseUp = () => {
  if (!categoryButtonsRef.value) return

  isDragging.value = false
  categoryButtonsRef.value.style.cursor = 'grab'
  categoryButtonsRef.value.style.userSelect = 'auto'
}

const handleMouseLeave = () => {
  if (!categoryButtonsRef.value) return

  isDragging.value = false
  categoryButtonsRef.value.style.cursor = 'grab'
  categoryButtonsRef.value.style.userSelect = 'auto'
}

// 选择分类（有输入时点击分类按钮，不跳转，只筛选）
const selectCategory = (category: string) => {
  // 如果正在拖动，不触发点击事件
  if (isDragging.value) return

  selectedCategory.value = category
  console.log('🔍 选择分类:', category, '关键词:', searchKeyword.value)
  // 如果已经搜索过，切换分类时重新筛选
  if (hasSearched.value) {
    // 结果会自动通过 computed 更新
  }
}

// 加载聊天消息
const loadMessages = async () => {
  try {
    const chatId = route.params.chatId as string

    if (!chatId) {
      console.warn('⚠️ 没有提供 chatId')
      return
    }

    console.log('📥 开始加载聊天消息，chatId:', chatId)

    // 从 IndexedDB 加载消息
    const messages = await messagePersistenceService.getLatestMessages(chatId, 1000)

    if (!messages || messages.length === 0) {
      console.log('📭 该会话没有消息记录')
      allMessages.value = []
      return
    }

    console.log('📥 加载到消息数量:', messages.length)

    // 转换消息格式
    allMessages.value = messages.map(msg => {
      const baseMsg = {
        id: msg.id,
        chatId: chatId,
        chatName: getChatName(chatId),
        chatAvatar: getChatAvatar(chatId),
        isGroup: chatId.includes('_'),
        senderId: msg.senderId,
        senderName: getSenderName(msg.senderId),
        senderAvatar: getSenderAvatar(msg.senderId),
        type: msg.type || 'text',
        content: msg.content || '',
        timestamp: new Date(Number(msg.timestamp))
      }

      // 根据消息类型解析额外信息
      if (msg.type === 'file' && msg.content) {
        try {
          const fileData = JSON.parse(msg.content)
          return {
            ...baseMsg,
            fileName: fileData.name || fileData.fileName || '未知文件',
            fileCover: fileData.cover || fileData.thumbnail,
            fileSize: fileData.size,
            fileType: fileData.type
          }
        } catch {
          return { ...baseMsg, fileName: msg.content }
        }
      }

      if (msg.type === 'music' && msg.content) {
        try {
          const musicData = JSON.parse(msg.content)
          return {
            ...baseMsg,
            musicName: musicData.name || musicData.title || '未知音乐',
            musicCover: musicData.cover || musicData.thumbnail,
            musicArtist: musicData.artist
          }
        } catch {
          return { ...baseMsg, musicName: msg.content }
        }
      }

      if (msg.type === 'transaction' && msg.content) {
        try {
          const transData = JSON.parse(msg.content)
          return {
            ...baseMsg,
            amount: transData.amount || '0.00',
            transactionType: transData.type || 'transfer'
          }
        } catch {
          return { ...baseMsg, amount: msg.content }
        }
      }

      if (msg.type === 'miniprogram' && msg.content) {
        try {
          const mpData = JSON.parse(msg.content)
          return {
            ...baseMsg,
            miniprogramName: mpData.name || mpData.title || '未知小程序',
            miniprogramCover: mpData.cover || mpData.icon
          }
        } catch {
          return { ...baseMsg, miniprogramName: msg.content }
        }
      }

      if (msg.type === 'videochannel' && msg.content) {
        try {
          const videoData = JSON.parse(msg.content)
          return {
            ...baseMsg,
            videoTitle: videoData.title || videoData.name || '未知作品',
            videoCover: videoData.cover || videoData.thumbnail
          }
        } catch {
          return { ...baseMsg, videoTitle: msg.content }
        }
      }

      if (msg.type === 'link' && msg.content) {
        try {
          const linkData = JSON.parse(msg.content)
          return {
            ...baseMsg,
            linkTitle: linkData.title || linkData.name || '未知链接',
            linkCover: linkData.cover || linkData.thumbnail,
            linkUrl: linkData.url
          }
        } catch {
          return { ...baseMsg, linkTitle: msg.content }
        }
      }

      return baseMsg
    })

    console.log('📥 转换后的消息数量:', allMessages.value.length)
  } catch (error) {
    console.error('❌ 加载消息失败:', error)
    allMessages.value = []
  }
}

// 获取聊天名称
const getChatName = (chatId: string) => {
  const session = chatStore.sessions.find(s => s.id === chatId)
  return session?.name || '未知聊天'
}

// 获取聊天头像
const getChatAvatar = (chatId: string) => {
  const session = chatStore.sessions.find(s => s.id === chatId)
  return session?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId}`
}

// 获取发送者名称
const getSenderName = (senderId: string) => {
  // 如果是当前用户
  const currentUserId = String(authStore.user?.id || '')
  if (senderId === currentUserId) {
    return authStore.user?.nickname || authStore.user?.username || '我'
  }

  // 从localStorage联系人缓存中查找
  try {
    const contactsCache = localStorage.getItem('contacts_list')
    if (contactsCache) {
      const { data } = JSON.parse(contactsCache)
      if (data && Array.isArray(data)) {
        const contact = data.find((c: any) => c.id?.toString() === senderId)
        if (contact) {
          return contact.nickname || contact.name || `用户${senderId}`
        }
      }
    }
  } catch (error) {
    console.warn('获取联系人名称失败:', error)
  }

  return `用户${senderId}`
}

// 获取发送者头像
const getSenderAvatar = (senderId: string) => {
  // 如果是当前用户
  const currentUserId = String(authStore.user?.id || '')
  if (senderId === currentUserId) {
    return authStore.user?.avatar || getRealAvatarUrl(senderId)
  }

  // 从localStorage联系人缓存中查找
  try {
    const contactsCache = localStorage.getItem('contacts_list')
    if (contactsCache) {
      const { data } = JSON.parse(contactsCache)
      if (data && Array.isArray(data)) {
        const contact = data.find((c: any) => c.id?.toString() === senderId)
        if (contact && contact.avatar) {
          // 如果联系人有头像，使用联系人头像
          return contact.avatar
        }
      }
    }
  } catch (error) {
    console.warn('获取联系人头像失败:', error)
  }

  // 使用真实头像API
  return getRealAvatarUrl(senderId)
}

// 执行搜索（点击"搜索：xxx"项）
const performSearch = async () => {
  if (!searchKeyword.value.trim()) {
    return
  }

  hasSearched.value = true
  selectedCategory.value = 'all'
  isSearching.value = true

  console.log('🔍 执行搜索:', searchKeyword.value)

  try {
    // 如果还没有加载消息，先加载
    if (allMessages.value.length === 0) {
      await loadMessages()
    }

    // 搜索结果会通过 computed 自动更新
    console.log('🔍 搜索完成，结果数量:', filteredResults.value.length)
  } catch (error) {
    console.error('❌ 搜索失败:', error)
  } finally {
    isSearching.value = false
  }
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

// 获取消息预览（全部类型搜索时使用）
const getMessagePreview = (result: any) => {
  const type = result.type

  switch (type) {
    case 'text':
      return result.content || ''
    case 'file':
      return `【文件】${result.fileName || '未知文件'}`
    case 'music':
      return `【音乐】${result.musicName || '未知音乐'}`
    case 'transaction':
      const amount = result.amount || '0.00'
      const transType = result.transactionType === 'redpacket' ? '红包' : '转账'
      return `【${transType}】¥${amount}`
    case 'miniprogram':
      return `【小程序】${result.miniprogramName || '未知小程序'}`
    case 'videochannel':
      return `【视频号】${result.videoTitle || '未知作品'}`
    case 'link':
      return `【链接】${result.linkTitle || result.content || '未知链接'}`
    default:
      return result.content || ''
  }
}

// 获取内容封面（特定类型搜索时使用）
const getContentCover = (result: any) => {
  const type = result.type

  switch (type) {
    case 'file':
      return result.fileCover || getFileTypeIcon(result.fileName)
    case 'music':
      return result.musicCover || '/images/default-music-cover.png'
    case 'transaction':
      return result.transactionType === 'redpacket'
        ? '/images/redpacket-cover.png'
        : '/images/transfer-cover.png'
    case 'miniprogram':
      return result.miniprogramCover || '/images/default-miniprogram-cover.png'
    case 'videochannel':
      return result.videoCover || '/images/default-video-cover.png'
    case 'link':
      return result.linkCover || '/images/default-link-cover.png'
    default:
      return '/images/default-cover.png'
  }
}

// 获取文件类型图标
const getFileTypeIcon = (fileName: string) => {
  if (!fileName) return '/images/file-unknown.png'

  const ext = fileName.split('.').pop()?.toLowerCase()

  const iconMap: Record<string, string> = {
    'pdf': '/images/file-pdf.png',
    'doc': '/images/file-word.png',
    'docx': '/images/file-word.png',
    'xls': '/images/file-excel.png',
    'xlsx': '/images/file-excel.png',
    'ppt': '/images/file-ppt.png',
    'pptx': '/images/file-ppt.png',
    'zip': '/images/file-zip.png',
    'rar': '/images/file-zip.png',
    'txt': '/images/file-txt.png',
    'jpg': '/images/file-image.png',
    'jpeg': '/images/file-image.png',
    'png': '/images/file-image.png',
    'gif': '/images/file-image.png',
  }

  return iconMap[ext || ''] || '/images/file-unknown.png'
}

// 获取内容标题（特定类型搜索时使用）
const getContentTitle = (result: any) => {
  const type = result.type

  switch (type) {
    case 'file':
      return result.fileName || '未知文件'
    case 'music':
      return result.musicName || '未知音乐'
    case 'transaction':
      const amount = result.amount || '0.00'
      return `¥${amount}`
    case 'miniprogram':
      return result.miniprogramName || '未知小程序'
    case 'videochannel':
      return result.videoTitle || '未知作品'
    case 'link':
      return result.linkTitle || '未知链接'
    default:
      return result.content || ''
  }
}

// 处理卡片点击（特定类型搜索）
const handleCardClick = (result: any) => {
  console.log('点击卡片:', result.type, result)

  switch (result.type) {
    case 'music':
      // 播放音乐
      playMusic(result)
      break

    case 'miniprogram':
      // 进入小程序
      openMiniprogram(result)
      break

    case 'videochannel':
      // 播放视频号作品
      playVideoChannel(result)
      break

    case 'transaction':
      // 跳转到聊天页面，定位到该交易消息
      openChatWithMessage(result)
      break

    case 'link':
      // 打开链接
      openLink(result)
      break

    case 'file':
      // 打开文件（可以预览或下载）
      openFile(result)
      break

    default:
      // 默认跳转到聊天页面
      openChatWithMessage(result)
      break
  }
}

// 播放音乐
const playMusic = (result: any) => {
  console.log('🎵 播放音乐:', result.musicName)

  currentMusic.value = {
    name: result.musicName || '未知音乐',
    artist: result.musicArtist || '未知艺术家',
    cover: result.musicCover || '/images/default-music-cover.png',
    url: result.musicUrl || result.content || ''
  }

  musicPlayerVisible.value = true
}

// 关闭音乐播放器
const closeMusicPlayer = () => {
  musicPlayerVisible.value = false
}

// 打开小程序
const openMiniprogram = (result: any) => {
  console.log('📦 打开小程序:', result.miniprogramName)
  // TODO: 实现小程序打开功能
  router.push({
    path: '/miniprogram-runner',
    query: {
      name: result.miniprogramName,
      // 其他小程序参数
    }
  })
}

// 播放视频号作品
const playVideoChannel = (result: any) => {
  console.log('📺 播放视频号:', result.videoTitle)
  // TODO: 实现视频号播放功能
  router.push({
    path: '/video-channel',
    query: {
      videoId: result.id,
      title: result.videoTitle
    }
  })
}

// 打开链接
const openLink = (result: any) => {
  console.log('🔗 打开链接:', result.linkUrl)
  if (result.linkUrl) {
    window.open(result.linkUrl, '_blank')
  } else {
    alert('链接地址无效')
  }
}

// 打开文件
const openFile = (result: any) => {
  console.log('📁 打开文件:', result.fileName)

  // 跳转到聊天页面并定位到该文件消息
  openChatWithMessage(result)
}

// 跳转到聊天页面并定位到指定消息
const openChatWithMessage = (result: any) => {
  console.log('💬 跳转到聊天并定位消息:', result.id)
  router.push({
    path: `/chat/${result.chatId}`,
    query: {
      messageId: result.id,
      highlight: searchKeyword.value // 传递搜索关键词用于高亮
    }
  })
}

// 打开聊天消息（全部类型搜索）
const openChatMessage = (result: any) => {
  console.log('打开聊天消息:', result)
  openChatWithMessage(result)
}

// 监听搜索关键词变化
watch(searchKeyword, (newVal, oldVal) => {
  // 当输入内容改变时，重置搜索状态
  if (newVal !== oldVal && hasSearched.value) {
    hasSearched.value = false
    console.log('🔄 输入内容改变，重置搜索状态')
  }
})

// 生命周期
onMounted(async () => {
  // 加载消息数据
  await loadMessages()

  // 聚焦搜索框
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
})

// 页面激活时（从其他页面返回）
onActivated(async () => {
  console.log('🔄 搜索页面被激活')

  // 重置搜索状态
  searchKeyword.value = ''
  hasSearched.value = false
  selectedCategory.value = 'all'

  // 重新加载当前聊天的消息
  await loadMessages()

  // 聚焦搜索框
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
})
</script>

<style scoped>
.chat-search-main {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #EDEDED;
}

/* 覆盖状态栏背景色 - 与页面背景一致 */
.chat-search-main :deep(.status-bar) {
  background: #EDEDED !important;
}

/* 搜索头部 */
.search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px; /* 调整内边距 */
  background: #EDEDED; /* 与页面背景一致 */
  border-bottom: 1px solid #E5E5E5;
  height: 36px; /* 容器高度36px */
  box-sizing: content-box;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px; /* 调整内边距 */
  background: #FFFFFF; /* 纯白色，与背景形成对比 */
  border-radius: 8px;
  height: 36px; /* 输入框容器高度36px */
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px; /* 修改为13px */
  color: #333;
  background: #FFFFFF;
}

.search-input::placeholder {
  color: #999;
  font-size: 13px; /* 修改为13px */
}

.clear-btn {
  padding: 0;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.clear-btn:active {
  opacity: 0.6;
}

.cancel-btn {
  padding: 0;
  background: none;
  border: none;
  font-size: 14px; /* 修改为14px */
  color: #000000; /* 修改为黑色 */
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
  background: #EDEDED; /* 与页面背景一致 */
  padding: 16px;
  padding-top: 116px;
  height: 100%;
  box-sizing: border-box;
}

.section-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
  text-align: center;
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

/* 分类搜索区域 - 有输入时显示 */
.category-search-section {
  background: #EDEDED;
  display: flex;
  flex-direction: column;
}

/* 分类搜索按钮行 */
.category-buttons {
  display: flex;
  gap: 8px;
  padding: 6px 16px; /* 调整内边距 */
  background: #EDEDED;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  flex-shrink: 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  height: 36px; /* 容器高度36px */
  box-sizing: content-box;
  align-items: center;
  cursor: grab; /* 鼠标拖动光标 */
  user-select: none; /* 防止拖动时选中文字 */
}

.category-buttons:active {
  cursor: grabbing; /* 拖动中的光标 */
}

.category-buttons::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}

.category-btn.active {
  background: #E7F8EE; /* 浅绿色背景 */
  border-color: #07C160; /* 绿色边框 */
  color: #07C160; /* 绿色文字 */
}

.category-btn:active {
  background: #F6F6F6;
  transform: scale(0.98);
}

.category-btn.active:active {
  background: #D5F3E3; /* 激活状态下的点击效果 */
}

/* 搜索项 */
.search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px; /* 调整内边距 */
  background: #FFFFFF;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  height: 36px; /* 容器高度36px */
}

.search-item:active {
  background: #F6F6F6;
}

.search-item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-label {
  font-size: 11px; /* 修改为11px */
  color: #666;
}

.search-text {
  font-size: 11px; /* 修改为11px */
  color: #333;
  font-weight: 500;
}

/* 搜索结果 */
.search-results {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #EDEDED; /* 与页面背景一致 */
}

.loading-state,
.empty-results {
  text-align: center;
  padding: 60px 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #999;
}

.empty-results {
  color: #999; /* 灰色 */
}

.empty-results iconify-icon {
  color: #999; /* 图标改为灰色 */
  width: 36px !important; /* 图标改小 */
  height: 36px !important;
}

.empty-results p {
  margin: 12px 0 4px;
  font-size: 12px; /* 修改为12px */
  color: #999; /* 修改为灰色 */
}

.empty-results span {
  font-size: 12px; /* 修改为12px */
  color: #999; /* 灰色 */
}

.result-list {
  padding: 0;
  background: #EDEDED; /* 与页面背景一致，用于显示间距 */
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px; /* 调整内边距 */
  background: #FFFFFF;
  cursor: pointer;
  transition: background 0.2s;
  height: 48px; /* 容器高度48px */
  margin-bottom: 2px; /* 2px间距 */
}

.result-item:last-child {
  margin-bottom: 0; /* 最后一项不需要间距 */
}

.result-item:active {
  background: #F6F6F6;
}

.result-avatar {
  flex-shrink: 0;
}

.result-avatar img {
  width: 36px;  /* 头像36px */
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}

.result-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px; /* 减小间距 */
}

.sender-name-text {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.result-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
  min-width: 48px; /* 日期48px */
  text-align: right;
}

.result-message {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-content :deep(mark) {
  background: transparent;
  color: #07C160; /* 使用绿色高亮搜索关键词 */
  font-weight: 500;
  padding: 0;
}

/* 卡片样式 - 用于特定类型搜索 */
.result-card {
  background: #FFFFFF;
  padding: 12px 16px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: background 0.2s;
  height: 104px; /* 容器高度104px */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.result-card:last-child {
  margin-bottom: 0;
}

.result-card:active {
  background: #F6F6F6;
}

.card-sender {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sender-avatar-small {
  flex-shrink: 0;
}

.sender-avatar-small img {
  width: 24px;  /* 小头像24px */
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
}

.sender-name-small {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.card-time-top {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  margin-left: auto;
}

.card-content {
  display: flex;
  gap: 8px; /* 封面与标题间距8px */
  align-items: center;
}

.card-cover {
  flex-shrink: 0;
  width: 56px;  /* 封面56px */
  height: 56px;
  border-radius: 4px;
  overflow: hidden;
  background: #F5F5F5;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-title {
  flex: 1;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

