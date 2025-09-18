<template>
  <div class="activity-checkin-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">活动签到</h1>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 活动信息 -->
    <div class="activity-info">
      <div class="activity-cover">
        <img :src="activity.cover || '/default-activity.jpg'" alt="活动封面" />
        <div class="activity-status" :class="activity.status">
          {{ getStatusText(activity.status) }}
        </div>
      </div>
      
      <div class="activity-details">
        <h2 class="activity-title">{{ activity.title }}</h2>
        <div class="activity-meta">
          <div class="meta-item">
            <iconify-icon icon="heroicons:calendar-days" width="16"></iconify-icon>
            <span>{{ formatDate(activity.startTime) }}</span>
          </div>
          <div class="meta-item">
            <iconify-icon icon="heroicons:clock" width="16"></iconify-icon>
            <span>{{ formatTime(activity.startTime) }} - {{ formatTime(activity.endTime) }}</span>
          </div>
          <div class="meta-item">
            <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
            <span>{{ activity.location }}</span>
          </div>
          <div class="meta-item">
            <iconify-icon icon="heroicons:users" width="16"></iconify-icon>
            <span>{{ activity.participantCount }}/{{ activity.maxParticipants }}人</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 签到方式选择 -->
    <div class="checkin-methods">
      <div class="section-title">签到方式</div>
      
      <div class="method-cards">
        <div 
          class="method-card" 
          :class="{ active: selectedMethod === 'qrcode' }"
          @click="selectMethod('qrcode')"
        >
          <div class="method-icon">
            <iconify-icon icon="heroicons:qr-code" width="24"></iconify-icon>
          </div>
          <div class="method-name">扫码签到</div>
          <div class="method-desc">扫描活动二维码签到</div>
        </div>
        
        <div 
          class="method-card" 
          :class="{ active: selectedMethod === 'location' }"
          @click="selectMethod('location')"
        >
          <div class="method-icon">
            <iconify-icon icon="heroicons:map-pin" width="24"></iconify-icon>
          </div>
          <div class="method-name">位置签到</div>
          <div class="method-desc">通过位置信息签到</div>
        </div>
        
        <div 
          class="method-card" 
          :class="{ active: selectedMethod === 'code' }"
          @click="selectMethod('code')"
        >
          <div class="method-icon">
            <iconify-icon icon="heroicons:key" width="24"></iconify-icon>
          </div>
          <div class="method-name">口令签到</div>
          <div class="method-desc">输入活动口令签到</div>
        </div>
      </div>
    </div>

    <!-- 签到内容 -->
    <div class="checkin-content">
      <!-- 扫码签到 -->
      <div v-if="selectedMethod === 'qrcode'" class="qrcode-checkin">
        <div class="camera-container">
          <div v-if="!cameraActive" class="camera-placeholder">
            <iconify-icon icon="heroicons:camera" width="48"></iconify-icon>
            <p>点击开启相机扫描二维码</p>
            <button @click="startCamera" class="start-camera-btn">开启相机</button>
          </div>
          <video v-else ref="videoElement" class="camera-feed" autoplay playsinline></video>
        </div>
        
        <div class="qrcode-tips">
          <p>请将二维码对准相机进行扫描</p>
          <p>或者</p>
          <button @click="uploadQRCode" class="upload-btn">
            <iconify-icon icon="heroicons:photo" width="16"></iconify-icon>
            <span>上传二维码图片</span>
          </button>
        </div>
      </div>
      
      <!-- 位置签到 -->
      <div v-if="selectedMethod === 'location'" class="location-checkin">
        <div class="map-container">
          <div v-if="!locationLoaded" class="map-placeholder">
            <iconify-icon icon="heroicons:map" width="48"></iconify-icon>
            <p>正在获取位置信息...</p>
          </div>
          <div v-else class="map-view">
            <div class="map-image">
              <!-- 地图将在这里显示 -->
              <div class="location-marker">
                <iconify-icon icon="heroicons:map-pin" width="24" color="#ff4757"></iconify-icon>
              </div>
            </div>
            
            <div class="location-info">
              <div class="current-location">
                <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
                <span>{{ locationInfo.address || '未知位置' }}</span>
              </div>
              <div class="distance-info">
                <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
                <span>距离活动地点 {{ locationInfo.distance || '计算中...' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="location-actions">
          <button @click="refreshLocation" class="refresh-btn">
            <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
            <span>刷新位置</span>
          </button>
          <button @click="performLocationCheckin" class="checkin-btn" :disabled="!canLocationCheckin">
            <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
            <span>{{ locationInfo.distance && parseFloat(locationInfo.distance) > 1000 ? '位置过远，无法签到' : '确认签到' }}</span>
          </button>
        </div>
      </div>
      
      <!-- 口令签到 -->
      <div v-if="selectedMethod === 'code'" class="code-checkin">
        <div class="code-input-container">
          <label>请输入活动签到口令</label>
          <input 
            type="text" 
            v-model="checkinCode" 
            placeholder="请输入活动组织者提供的口令"
            class="code-input"
          />
        </div>
        
        <button @click="performCodeCheckin" class="checkin-btn" :disabled="!checkinCode">
          <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
          <span>确认签到</span>
        </button>
      </div>
    </div>

    <!-- 签到成功弹窗 -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="success-modal">
        <div class="success-icon">
          <iconify-icon icon="heroicons:check-circle" width="64" color="#07c160"></iconify-icon>
        </div>
        <h3>签到成功</h3>
        <p>您已成功签到活动</p>
        <p class="success-time">{{ formatDateTime(new Date()) }}</p>
        <button @click="closeSuccessModal" class="close-btn">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID和活动ID
const genealogyId = ref(route.params.genealogyId as string)
const activityId = ref(route.params.activityId as string)

// 活动信息
const activity = ref({
  title: '',
  cover: '',
  status: 'upcoming',
  startTime: '',
  endTime: '',
  location: '',
  participantCount: 0,
  maxParticipants: 0
})

// 签到方式
const selectedMethod = ref('qrcode')

// 扫码签到
const videoElement = ref(null)
const cameraActive = ref(false)

// 位置签到
const locationLoaded = ref(false)
const locationInfo = reactive({
  latitude: 0,
  longitude: 0,
  address: '',
  distance: ''
})

// 口令签到
const checkinCode = ref('')

// 签到成功弹窗
const showSuccessModal = ref(false)

// 计算属性
const canLocationCheckin = computed(() => {
  return locationLoaded.value && 
         locationInfo.distance && 
         parseFloat(locationInfo.distance) <= 1000 // 1公里内可以签到
})

// 生命周期
onMounted(() => {
  loadActivityData()
})

onUnmounted(() => {
  stopCamera()
})

// 方法
const loadActivityData = async () => {
  try {
    appStore.showLoading('加载活动信息...')
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/activities/${activityId.value}`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        activity.value = result.data
      } else {
        appStore.showToast(result.message || '加载活动失败', 'error')
        router.go(-1)
      }
    } else {
      appStore.showToast('请求失败', 'error')
      router.go(-1)
    }
  } catch (error) {
    console.error('加载活动信息失败:', error)
    appStore.showToast('加载活动失败', 'error')
    router.go(-1)
  } finally {
    appStore.hideLoading()
  }
}

const selectMethod = (method) => {
  selectedMethod.value = method
  
  if (method === 'location') {
    getLocation()
  } else if (method === 'qrcode') {
    // 重置相机状态
    cameraActive.value = false
  } else if (method === 'code') {
    // 重置口令
    checkinCode.value = ''
  }
}

// 扫码签到方法
const startCamera = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      appStore.showToast('您的设备不支持相机功能', 'error')
      return
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    videoElement.value.srcObject = stream
    cameraActive.value = true
    
    // 开始扫描二维码
    scanQRCode()
  } catch (error) {
    console.error('开启相机失败:', error)
    appStore.showToast('无法访问相机', 'error')
  }
}

const stopCamera = () => {
  if (videoElement.value && videoElement.value.srcObject) {
    const tracks = videoElement.value.srcObject.getTracks()
    tracks.forEach(track => track.stop())
    videoElement.value.srcObject = null
    cameraActive.value = false
  }
}

const scanQRCode = () => {
  // 这里应该使用二维码扫描库，如jsQR
  // 简化实现，模拟扫描成功
  setTimeout(() => {
    if (cameraActive.value) {
      performQRCodeCheckin('mock-qrcode-data')
    }
  }, 3000)
}

const uploadQRCode = () => {
  // 创建文件上传输入
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 处理上传的二维码图片
      // 简化实现，模拟扫描成功
      performQRCodeCheckin('mock-qrcode-data')
    }
  }
  input.click()
}

const performQRCodeCheckin = async (qrData) => {
  try {
    appStore.showLoading('正在签到...')
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/activities/${activityId.value}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        method: 'qrcode',
        qrCode: qrData,
        timestamp: new Date().toISOString()
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        showSuccessModal.value = true
        stopCamera()
      } else {
        appStore.showToast(result.message || '签到失败', 'error')
      }
    } else {
      appStore.showToast('签到请求失败', 'error')
    }
  } catch (error) {
    console.error('二维码签到失败:', error)
    appStore.showToast('签到失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 位置签到方法
const getLocation = () => {
  if (!navigator.geolocation) {
    appStore.showToast('您的设备不支持位置功能', 'error')
    return
  }
  
  locationLoaded.value = false
  
  navigator.geolocation.getCurrentPosition(
    position => {
      locationInfo.latitude = position.coords.latitude
      locationInfo.longitude = position.coords.longitude
      
      // 获取地址和计算距离
      getAddressAndDistance(position.coords.latitude, position.coords.longitude)
    },
    error => {
      console.error('获取位置失败:', error)
      appStore.showToast('无法获取位置信息', 'error')
      locationLoaded.value = true
    },
    { enableHighAccuracy: true }
  )
}

const getAddressAndDistance = async (latitude, longitude) => {
  try {
    // 这里应该调用地图API获取地址和计算距离
    // 简化实现，模拟数据
    locationInfo.address = '北京市海淀区中关村大街1号'
    locationInfo.distance = '500米'
    locationLoaded.value = true
  } catch (error) {
    console.error('获取地址和距离失败:', error)
    locationInfo.address = '未知位置'
    locationInfo.distance = '未知'
    locationLoaded.value = true
  }
}

const refreshLocation = () => {
  getLocation()
}

const performLocationCheckin = async () => {
  try {
    appStore.showLoading('正在签到...')
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/activities/${activityId.value}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        method: 'location',
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
        address: locationInfo.address,
        distance: locationInfo.distance,
        timestamp: new Date().toISOString()
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        showSuccessModal.value = true
      } else {
        appStore.showToast(result.message || '签到失败', 'error')
      }
    } else {
      appStore.showToast('签到请求失败', 'error')
    }
  } catch (error) {
    console.error('位置签到失败:', error)
    appStore.showToast('签到失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 口令签到方法
const performCodeCheckin = async () => {
  if (!checkinCode.value) {
    appStore.showToast('请输入签到口令', 'warning')
    return
  }
  
  try {
    appStore.showLoading('正在签到...')
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/activities/${activityId.value}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        method: 'code',
        code: checkinCode.value,
        timestamp: new Date().toISOString()
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        showSuccessModal.value = true
      } else {
        appStore.showToast(result.message || '签到失败', 'error')
      }
    } else {
      appStore.showToast('签到请求失败', 'error')
    }
  } catch (error) {
    console.error('口令签到失败:', error)
    appStore.showToast('签到失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 关闭成功弹窗
const closeSuccessModal = () => {
  showSuccessModal.value = false
  router.push(`/genealogy/${genealogyId.value}/activities/${activityId.value}`)
}

// 辅助方法
const getStatusText = (status) => {
  const statusMap = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (date) => {
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.activity-checkin-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.nav-placeholder {
  width: 40px;
}

/* 活动信息 */
.activity-info {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
}

.activity-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.activity-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.activity-status.upcoming {
  background: #3498db;
}

.activity-status.ongoing {
  background: #07c160;
}

.activity-status.completed {
  background: #95a5a6;
}

.activity-status.cancelled {
  background: #e74c3c;
}

.activity-details {
  padding: 16px;
}

.activity-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

/* 签到方式选择 */
.checkin-methods {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.method-cards {
  display: flex;
  gap: 12px;
}

.method-card {
  flex: 1;
  padding: 16px 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.method-card.active {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.method-card:hover {
  border-color: #07c160;
}

.method-icon {
  color: #07c160;
  margin-bottom: 8px;
}

.method-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.method-desc {
  font-size: 12px;
  color: #666;
}

/* 签到内容 */
.checkin-content {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 16px;
}

/* 扫码签到 */
.qrcode-checkin {
  text-align: center;
}

.camera-container {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  position: relative;
  margin-bottom: 16px;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.camera-placeholder iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}

.start-camera-btn {
  margin-top: 12px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #07c160;
  color: white;
  cursor: pointer;
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qrcode-tips {
  color: #666;
  font-size: 14px;
}

.upload-btn {
  margin-top: 12px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 位置签到 */
.location-checkin {
  text-align: center;
}

.map-container {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  margin-bottom: 16px;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.map-placeholder iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}

.map-view {
  height: 100%;
  position: relative;
}

.map-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #e8f5e8, #f0f8f0);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.location-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  font-size: 12px;
}

.current-location,
.distance-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.location-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.checkin-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.checkin-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 口令签到 */
.code-checkin {
  text-align: center;
}

.code-input-container {
  margin-bottom: 20px;
}

.code-input-container label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.code-input {
  width: 100%;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
}

.code-input:focus {
  border-color: #07c160;
  outline: none;
}

/* 成功弹窗 */
.modal-overlay {
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
  padding: 20px;
}

.success-modal {
  background: white;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  max-width: 300px;
  width: 100%;
}

.success-icon {
  margin-bottom: 16px;
}

.success-modal h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.success-modal p {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.success-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 20px;
}

.close-btn {
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}
</style>
