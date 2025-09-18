<template>
  <div class="cemetery-detail-panel">
    <div class="panel-overlay" @click="$emit('close')"></div>
    
    <div class="panel-content">
      <!-- 头部 -->
      <div class="panel-header">
        <div class="cemetery-basic">
          <h3 class="cemetery-name">{{ cemetery.name }}</h3>
          <div class="cemetery-status" :class="cemetery.status">
            {{ getStatusText(cemetery.status) }}
          </div>
        </div>
        
        <button @click="$emit('close')" class="close-btn">
          <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
        </button>
      </div>
      
      <!-- 照片轮播 -->
      <div class="photo-carousel" v-if="cemetery.photos.length > 0">
        <div class="photo-container">
          <img :src="currentPhoto" :alt="cemetery.name" />
          
          <div v-if="cemetery.photos.length > 1" class="photo-nav">
            <button @click="prevPhoto" class="nav-btn">
              <iconify-icon icon="heroicons:chevron-left" width="20"></iconify-icon>
            </button>
            <button @click="nextPhoto" class="nav-btn">
              <iconify-icon icon="heroicons:chevron-right" width="20"></iconify-icon>
            </button>
          </div>
          
          <div v-if="cemetery.photos.length > 1" class="photo-indicators">
            <div 
              v-for="(photo, index) in cemetery.photos" 
              :key="index"
              @click="currentPhotoIndex = index"
              :class="{ active: index === currentPhotoIndex }"
              class="indicator"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- 详细信息 -->
      <div class="panel-body">
        <div class="info-sections">
          <!-- 逝者信息 -->
          <div class="info-section">
            <h4>逝者信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>姓名</label>
                <span>{{ cemetery.deceasedName }}</span>
              </div>
              
              <div class="info-item">
                <label>生卒年月</label>
                <span>{{ formatDates(cemetery) }}</span>
              </div>
              
              <div v-if="getAge()" class="info-item">
                <label>享年</label>
                <span>{{ getAge() }}岁</span>
              </div>
            </div>
          </div>
          
          <!-- 位置信息 -->
          <div class="info-section">
            <h4>位置信息</h4>
            <div class="location-info">
              <div class="address">
                <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
                <span>{{ cemetery.location }}</span>
              </div>
              
              <div v-if="cemetery.coordinates.lat && cemetery.coordinates.lng" class="coordinates">
                <iconify-icon icon="heroicons:globe-alt" width="16"></iconify-icon>
                <span>{{ cemetery.coordinates.lat.toFixed(6) }}, {{ cemetery.coordinates.lng.toFixed(6) }}</span>
              </div>
              
              <div v-if="cemetery.distance" class="distance">
                <iconify-icon icon="heroicons:map" width="16"></iconify-icon>
                <span>距离当前位置 {{ cemetery.distance }}km</span>
              </div>
            </div>
          </div>
          
          <!-- 描述信息 -->
          <div v-if="cemetery.description" class="info-section">
            <h4>描述信息</h4>
            <div class="description">
              {{ cemetery.description }}
            </div>
          </div>
          
          <!-- 访问记录 -->
          <div class="info-section">
            <h4>访问记录</h4>
            <div class="visit-info">
              <div v-if="cemetery.lastVisit" class="last-visit">
                <iconify-icon icon="heroicons:calendar" width="16"></iconify-icon>
                <span>最后访问：{{ formatLastVisit(cemetery.lastVisit) }}</span>
              </div>
              
              <div class="visit-count">
                <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
                <span>总访问次数：{{ cemetery.visitCount || 0 }}次</span>
              </div>
            </div>
          </div>
          
          <!-- 提醒设置 -->
          <div class="info-section">
            <h4>提醒设置</h4>
            <div class="reminder-list">
              <div 
                v-for="reminder in cemetery.reminders" 
                :key="reminder.type"
                class="reminder-item"
                :class="{ enabled: reminder.enabled }"
              >
                <iconify-icon 
                  :icon="reminder.enabled ? 'heroicons:bell' : 'heroicons:bell-slash'" 
                  width="16"
                ></iconify-icon>
                <span>{{ getReminderText(reminder.type) }}</span>
                <div class="reminder-status">
                  {{ reminder.enabled ? '已开启' : '已关闭' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="panel-footer">
        <button @click="$emit('navigate', cemetery)" class="action-btn navigate">
          <iconify-icon icon="heroicons:map" width="16"></iconify-icon>
          <span>导航前往</span>
        </button>
        
        <button @click="$emit('edit', cemetery)" class="action-btn edit">
          <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
          <span>编辑信息</span>
        </button>
        
        <button @click="shareCemetery" class="action-btn share">
          <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
          <span>分享</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../../shared/stores/appStore'

const appStore = useAppStore()

// Props
const props = defineProps({
  cemetery: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'edit', 'navigate', 'delete'])

// 状态
const currentPhotoIndex = ref(0)

// 计算属性
const currentPhoto = computed(() => {
  return props.cemetery.photos[currentPhotoIndex.value] || '/default-cemetery.jpg'
})

// 方法
const getStatusText = (status) => {
  const statusMap = {
    active: '正常',
    maintenance: '维护中',
    relocated: '已迁移'
  }
  return statusMap[status] || '未知'
}

const formatDates = (cemetery) => {
  const birth = cemetery.birthDate ? new Date(cemetery.birthDate).getFullYear() : '?'
  const death = cemetery.deathDate ? new Date(cemetery.deathDate).getFullYear() : '?'
  return `${birth} - ${death}`
}

const getAge = () => {
  if (!props.cemetery.birthDate || !props.cemetery.deathDate) return null
  
  const birth = new Date(props.cemetery.birthDate)
  const death = new Date(props.cemetery.deathDate)
  const age = death.getFullYear() - birth.getFullYear()
  
  return age > 0 ? age : null
}

const formatLastVisit = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getReminderText = (type) => {
  const reminderMap = {
    qingming: '清明节提醒',
    birthday: '生日提醒',
    deathday: '忌日提醒'
  }
  return reminderMap[type] || type
}

const prevPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  } else {
    currentPhotoIndex.value = props.cemetery.photos.length - 1
  }
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < props.cemetery.photos.length - 1) {
    currentPhotoIndex.value++
  } else {
    currentPhotoIndex.value = 0
  }
}

const shareCemetery = () => {
  if (navigator.share) {
    navigator.share({
      title: `${props.cemetery.deceasedName}的墓地位置`,
      text: props.cemetery.location,
      url: `${window.location.origin}/cemetery/${props.cemetery.id}`
    })
  } else {
    // 复制到剪贴板
    const shareText = `${props.cemetery.deceasedName}的墓地位置：${props.cemetery.location}`
    navigator.clipboard.writeText(shareText)
    appStore.showToast('位置信息已复制', 'success')
  }
}
</script>

<style scoped>
.cemetery-detail-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.panel-content {
  position: relative;
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.cemetery-basic {
  flex: 1;
}

.cemetery-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.cemetery-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.cemetery-status.active {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.cemetery-status.maintenance {
  background: rgba(255, 152, 0, 0.1);
  color: #FF9800;
}

.cemetery-status.relocated {
  background: rgba(158, 158, 158, 0.1);
  color: #9E9E9E;
}

.close-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.photo-carousel {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.photo-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.photo-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-nav {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.indicator.active {
  background: white;
  transform: scale(1.2);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.info-item span {
  font-size: 14px;
  color: #333;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address, .coordinates, .distance {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.description {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.visit-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.last-visit, .visit-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f8f9fa;
}

.reminder-item.enabled {
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
}

.reminder-status {
  margin-left: auto;
  font-size: 12px;
  color: #666;
}

.reminder-item.enabled .reminder-status {
  color: #07c160;
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.navigate {
  background: #07c160;
  color: white;
}

.action-btn.navigate:hover {
  background: #06a552;
}

.action-btn.edit {
  background: #FF9800;
  color: white;
}

.action-btn.edit:hover {
  background: #F57C00;
}

.action-btn.share {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.action-btn.share:hover {
  background: #e0e0e0;
}
</style>
