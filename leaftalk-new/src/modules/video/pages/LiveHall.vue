<template>
  <div class="live-hall">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      title="直播大厅"
      :show-back="true"
      @back="goBack"
    >
      <template #right>
        <button @click="startLive" class="start-live-btn">
          <iconify-icon icon="heroicons:video-camera" width="20" style="color: white;" />
          开始直播
        </button>
      </template>
    </MobileTopBar>

    <!-- 分类导航 -->
    <div class="category-nav">
      <div 
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        :class="{ active: selectedCategory === category.id }"
        @click="selectCategory(category.id)"
      >
        {{ category.name }}
      </div>
    </div>

    <!-- 直播间列表 -->
    <div class="live-rooms">
      <div 
        v-for="room in filteredRooms"
        :key="room.id"
        class="room-card"
        @click="joinRoom(room)"
      >
        <!-- 直播封面 -->
        <div class="room-cover">
          <img :src="room.cover" :alt="room.title" />
          
          <!-- 直播状态标识 -->
          <div class="live-badge">
            <iconify-icon icon="heroicons:signal" width="12" />
            直播中
          </div>
          
          <!-- 观看人数 -->
          <div class="viewer-count">
            <iconify-icon icon="heroicons:eye" width="12" />
            {{ formatViewerCount(room.viewerCount) }}
          </div>
        </div>

        <!-- 直播信息 -->
        <div class="room-info">
          <div class="room-title">{{ room.title }}</div>
          <div class="streamer-info">
            <img :src="room.streamer.avatar" :alt="room.streamer.name" class="streamer-avatar" />
            <span class="streamer-name">{{ room.streamer.name }}</span>
            <span class="category-tag">{{ room.category }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredRooms && filteredRooms.length === 0" class="empty-state">
      <iconify-icon icon="heroicons:video-camera-slash" width="48" style="color: #ccc;" />
      <p>暂无直播间</p>
    </div>

    <!-- 开播设置弹窗 -->
    <div v-if="showStartLiveDialog" class="start-live-overlay" @click="closeStartLiveDialog">
      <div class="start-live-modal" @click.stop>
        <div class="modal-header">
          <h3>开始直播</h3>
          <button @click="closeStartLiveDialog" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
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

          <!-- 直播描述 -->
          <div class="form-group">
            <label>直播描述</label>
            <textarea
              v-model="liveConfig.description"
              placeholder="请输入直播描述"
              class="form-textarea"
              rows="3"
              maxlength="200"
            ></textarea>
            <div class="char-count">{{ (liveConfig.description || '').length }}/200</div>
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

    <!-- 权限请求弹窗 -->
    <div v-if="showPermissionDialog" class="permission-overlay">
      <div class="permission-modal">
        <div class="permission-icon">
          <iconify-icon icon="heroicons:video-camera" width="48" style="color: #ff6b6b;" />
        </div>
        <h3>需要权限</h3>
        <p>需要访问您的摄像头和麦克风来开始直播</p>
        <div class="permission-actions">
          <button @click="closePermissionDialog" class="cancel-btn">
            取消
          </button>
          <button @click="requestPermissions" class="allow-btn">
            允许
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { liveStreamManager, type LiveRoom } from '../../utils/liveStream'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const selectedCategory = ref('all')
const liveRooms = ref<LiveRoom[]>([])
const showStartLiveDialog = ref(false)
const showPermissionDialog = ref(false)

// 直播配置
const liveConfig = ref({
  title: '',
  description: '',
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
  { id: '娱乐', name: '娱乐' }
])

// 计算属性
const filteredRooms = computed(() => {
  if (!liveRooms.value || !Array.isArray(liveRooms.value)) {
    return []
  }

  if (selectedCategory.value === 'all') {
    return liveRooms.value
  }
  return liveRooms.value.filter(room => room.category === selectedCategory.value)
})

const canStartLive = computed(() => {
  return liveConfig.value && liveConfig.value.title && liveConfig.value.title.trim().length > 0
})

// 方法
const goBack = () => {
  router.back()
}

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

const joinRoom = (room: LiveRoom) => {
  router.push(`/live/room/${room.id}`)
}

const startLive = () => {
  showStartLiveDialog.value = true
}

const closeStartLiveDialog = () => {
  showStartLiveDialog.value = false
  // 重置配置
  liveConfig.value = {
    title: '',
    description: '',
    category: '生活',
    chatEnabled: true,
    giftEnabled: true
  }
}

const confirmStartLive = async () => {
  if (!canStartLive.value) return

  // 检查权限
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    
    // 开始直播
    const success = await liveStreamManager.startStreaming(liveConfig.value)
    
    if (success) {
      closeStartLiveDialog()
      router.push('/live/streaming')
    } else {
      appStore.showToast('开播失败', 'error')
    }
    
  } catch (error) {
    console.error('获取媒体权限失败:', error)
    showPermissionDialog.value = true
  }
}

const closePermissionDialog = () => {
  showPermissionDialog.value = false
}

const requestPermissions = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    showPermissionDialog.value = false
    confirmStartLive()
  } catch (error) {
    appStore.showToast('权限被拒绝', 'error')
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
onMounted(async () => {
  try {
    // 加载推荐直播间
    const rooms = await liveStreamManager.getRecommendedRooms()
    liveRooms.value = Array.isArray(rooms) ? rooms : []
  } catch (error) {
    console.error('Failed to load live rooms:', error)
    liveRooms.value = []
  }
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped>
.live-hall {
  min-height: 100vh;
  background: #f8f8f8;
}

.start-live-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.start-live-btn:hover {
  background: #ee5a24;
}

.category-nav {
  display: flex;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  overflow-x: auto;
  gap: 16px;
}

.category-item {
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.category-item.active {
  background: #ff6b6b;
  color: white;
}

.category-item:hover:not(.active) {
  background: #f0f0f0;
}

.live-rooms {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.room-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.room-cover {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.room-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #ff4444;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.viewer-count {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.room-info {
  padding: 12px;
}

.room-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.streamer-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.streamer-name {
  font-size: 12px;
  color: #666;
  flex: 1;
}

.category-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: #f0f0f0;
  color: #666;
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

/* 弹窗样式 */
.start-live-overlay, .permission-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.start-live-modal, .permission-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
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

.modal-content {
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  border-color: #ff6b6b;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.setting-switch {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e5e5;
}

.cancel-btn, .confirm-btn, .allow-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn, .allow-btn {
  background: #ff6b6b;
  color: white;
}

.confirm-btn:hover:not(:disabled), .allow-btn:hover {
  background: #ee5a24;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 权限弹窗样式 */
.permission-modal {
  padding: 30px;
  text-align: center;
}

.permission-icon {
  margin-bottom: 16px;
}

.permission-modal h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.permission-modal p {
  color: #666;
  line-height: 1.5;
  margin-bottom: 24px;
}

.permission-actions {
  display: flex;
  gap: 12px;
}
</style>
