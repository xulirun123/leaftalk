<template>
  <div class="douyin-live">
    <!-- 抖音风格顶部导航 -->
    <div class="douyin-header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="material-symbols:arrow-back-ios" width="20" style="color: white;" />
      </button>
      <div class="header-title">直播</div>
      <div class="header-actions">
        <button class="search-btn" @click="showSearch = !showSearch">
          <iconify-icon icon="material-symbols:search" width="20" style="color: white;" />
        </button>
        <button class="start-live-btn" @click="showStartLiveDialog = true">
          <iconify-icon icon="material-symbols:videocam" width="20" style="color: white;" />
        </button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索直播间..." 
        class="search-input"
        @input="handleSearch"
      />
    </div>

    <!-- 抖音风格分类标签 -->
    <div class="douyin-categories">
      <div class="category-scroll">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-pill"
          :class="{ active: selectedCategory === category.id }"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </div>
      </div>
    </div>

    <!-- 抖音风格直播间网格 -->
    <div class="douyin-live-grid">
      <div
        v-for="room in filteredRooms"
        :key="room.id"
        class="live-card"
        @click="enterRoom(room.id)"
      >
        <!-- 直播封面 -->
        <div class="live-cover">
          <img :src="room.cover" :alt="room.title" />
          
          <!-- 渐变遮罩 -->
          <div class="cover-gradient"></div>
          
          <!-- 直播状态标签 -->
          <div class="live-badge">
            <div class="live-dot"></div>
            <span>直播中</span>
          </div>
          
          <!-- 观看人数 -->
          <div class="viewer-info">
            <iconify-icon icon="material-symbols:visibility" width="14" />
            <span>{{ formatViewerCount(room.viewerCount) }}</span>
          </div>

          <!-- 主播信息 -->
          <div class="streamer-info">
            <img :src="room.authorAvatar" :alt="room.authorName" class="streamer-avatar" />
            <div class="streamer-details">
              <div class="streamer-name">{{ room.authorName }}</div>
              <div class="live-title">{{ room.title }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredRooms && filteredRooms.length === 0" class="empty-state">
      <iconify-icon icon="material-symbols:videocam-off" width="64" style="color: #666;" />
      <p>暂无直播间</p>
      <button class="start-live-empty" @click="showStartLiveDialog = true">
        开始直播
      </button>
    </div>

    <!-- 开播设置弹窗 -->
    <div v-if="showStartLiveDialog" class="start-live-overlay" @click="closeStartLiveDialog">
      <div class="start-live-modal" @click.stop>
        <div class="modal-header">
          <h3>开始直播</h3>
          <button @click="closeStartLiveDialog" class="close-btn">
            <iconify-icon icon="material-symbols:close" width="20" />
          </button>
        </div>

        <div class="modal-content">
          <!-- 直播标题 -->
          <div class="form-group">
            <label>直播标题</label>
            <input 
              v-model="liveConfig.title"
              type="text"
              placeholder="请输入直播标题"
              class="form-input"
              maxlength="50"
            />
            <div class="char-count">{{ (liveConfig.title || '').length }}/50</div>
          </div>

          <!-- 直播分类 -->
          <div class="form-group">
            <label>直播分类</label>
            <select v-model="liveConfig.category" class="form-select">
              <option v-for="category in categories.slice(1)" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- 直播设置 -->
          <div class="form-group">
            <label>直播设置</label>
            <div class="settings-list">
              <div class="setting-item">
                <span>开启聊天</span>
                <input 
                  v-model="liveConfig.chatEnabled"
                  type="checkbox"
                  class="setting-switch"
                />
              </div>
              <div class="setting-item">
                <span>开启礼物</span>
                <input 
                  v-model="liveConfig.giftEnabled"
                  type="checkbox"
                  class="setting-switch"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeStartLiveDialog" class="cancel-btn">
            取消
          </button>
          <button 
            @click="confirmStartLive" 
            class="confirm-btn"
            :disabled="!canStartLive"
          >
            开始直播
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSafeNavigation } from '../../../shared/utils/safeNavigation'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const { safeBack, safePush } = useSafeNavigation()
const appStore = useAppStore()

// 响应式数据
const selectedCategory = ref('all')
const showSearch = ref(false)
const searchQuery = ref('')
const showStartLiveDialog = ref(false)

// 直播配置
const liveConfig = ref({
  title: '',
  category: '生活',
  chatEnabled: true,
  giftEnabled: true
})

// 分类列表
const categories = ref([
  { id: 'all', name: '全部' },
  { id: '生活', name: '生活' },
  { id: '音乐', name: '音乐' },
  { id: '游戏', name: '游戏' },
  { id: '教育', name: '教育' },
  { id: '娱乐', name: '娱乐' },
  { id: '美食', name: '美食' },
  { id: '旅行', name: '旅行' },
  { id: '运动', name: '运动' }
])

// 模拟直播间数据
const liveRooms = ref([
  {
    id: '1',
    title: '今天教大家做美食',
    cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop',
    authorName: '美食达人小王',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
    viewerCount: 1234,
    category: '美食'
  },
  {
    id: '2',
    title: '户外徒步直播',
    cover: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=300&h=200&fit=crop',
    authorName: '户外探险家',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hiker',
    viewerCount: 856,
    category: '旅行'
  },
  {
    id: '3',
    title: '吉他弹唱时间',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
    authorName: '音乐人阿杰',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=musician',
    viewerCount: 2341,
    category: '音乐'
  },
  {
    id: '4',
    title: '王者荣耀上分局',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
    authorName: '游戏主播小明',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gamer',
    viewerCount: 3456,
    category: '游戏'
  },
  {
    id: '5',
    title: '瑜伽课程直播',
    cover: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop',
    authorName: '瑜伽老师小美',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yoga',
    viewerCount: 987,
    category: '运动'
  },
  {
    id: '6',
    title: '编程技术分享',
    cover: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop',
    authorName: '程序员老李',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=programmer',
    viewerCount: 1567,
    category: '教育'
  }
])

// 计算属性
const filteredRooms = computed(() => {
  let rooms = liveRooms.value
  
  // 分类筛选
  if (selectedCategory.value !== 'all') {
    rooms = rooms.filter(room => room.category === selectedCategory.value)
  }
  
  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    rooms = rooms.filter(room => 
      room.title.toLowerCase().includes(query) ||
      room.authorName.toLowerCase().includes(query)
    )
  }
  
  return rooms
})

const canStartLive = computed(() => {
  return liveConfig.value.title.trim().length > 0
})

// 方法
const goBack = () => {
  safeBack('/discover')
}

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const enterRoom = (roomId: string) => {
  console.log('进入直播间:', roomId)
  safePush(`/live-room/${roomId}`)
}

const closeStartLiveDialog = () => {
  showStartLiveDialog.value = false
  liveConfig.value = {
    title: '',
    category: '生活',
    chatEnabled: true,
    giftEnabled: true
  }
}

const confirmStartLive = async () => {
  if (!canStartLive.value) return
  
  console.log('开始直播:', liveConfig.value)
  
  try {
    // 模拟开播过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    closeStartLiveDialog()
    safePush('/live-streaming')
    
  } catch (error) {
    console.error('开播失败:', error)
    appStore.showToast('开播失败', 'error')
  }
}

const formatViewerCount = (count: number) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

// 生命周期
onMounted(() => {
  console.log('抖音风格直播大厅已加载')
})
</script>

<style scoped>
.douyin-live {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 抖音风格顶部导航 */
.douyin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
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

.header-title {
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-btn, .start-live-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-btn:hover, .start-live-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 搜索框 */
.search-container {
  padding: 0 16px 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: #999;
}

/* 抖音风格分类 */
.douyin-categories {
  padding: 0 16px 20px;
}

.category-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-pill {
  flex-shrink: 0;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  white-space: nowrap;
}

.category-pill.active {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.category-pill:hover:not(.active) {
  background: rgba(255, 255, 255, 0.3);
}

/* 抖音风格直播网格 */
.douyin-live-grid {
  padding: 0 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.live-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.live-card:hover {
  transform: translateY(-2px);
}

.live-cover {
  position: relative;
  aspect-ratio: 9/16;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.live-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.live-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.viewer-info {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.streamer-info {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.streamer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
}

.streamer-details {
  flex: 1;
  min-width: 0;
}

.streamer-name {
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 2px;
}

.live-title {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.empty-state p {
  margin: 16px 0;
  font-size: 16px;
}

.start-live-empty {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s;
}

.start-live-empty:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 开播弹窗 */
.start-live-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.start-live-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  color: #333;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
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

.modal-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-input, .form-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus {
  border-color: #667eea;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-switch {
  width: 20px;
  height: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #667eea;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
