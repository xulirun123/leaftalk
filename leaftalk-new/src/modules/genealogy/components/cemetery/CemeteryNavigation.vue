<template>
  <div class="cemetery-navigation">
    <!-- 导航头部 -->
    <div class="nav-header">
      <div class="destination-info">
        <div class="cemetery-name">{{ cemetery.name }}</div>
        <div class="grave-info">{{ grave.name }} - {{ grave.section }}</div>
        <div class="distance-info" v-if="navigationData.distance">
          距离: {{ formatDistance(navigationData.distance) }} | 
          预计: {{ formatDuration(navigationData.duration) }}
        </div>
      </div>
      <button @click="exitNavigation" class="exit-btn">
        <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 地图导航区域 -->
    <div class="map-navigation">
      <AMapContainer
        ref="mapRef"
        :width="'100%'"
        :height="'100%'"
        :center="mapCenter"
        :zoom="18"
        :markers="navigationMarkers"
        :show-controls="false"
        @map-ready="onMapReady"
        @location-change="onLocationChange"
      />
      
      <!-- 导航指示器 -->
      <div class="navigation-overlay">
        <!-- 当前位置指示器 -->
        <div class="current-location-indicator" v-if="currentLocation">
          <div class="location-dot"></div>
          <div class="location-accuracy" :style="{ width: accuracyRadius + 'px', height: accuracyRadius + 'px' }"></div>
        </div>
        
        <!-- 路线指示 -->
        <div class="route-instruction" v-if="currentInstruction">
          <div class="instruction-icon">
            <iconify-icon :icon="getInstructionIcon(currentInstruction.action)" width="24"></iconify-icon>
          </div>
          <div class="instruction-text">
            <div class="instruction-main">{{ currentInstruction.text }}</div>
            <div class="instruction-distance">{{ formatDistance(currentInstruction.distance) }}</div>
          </div>
        </div>
        
        <!-- 到达提示 -->
        <div class="arrival-notice" v-if="hasArrived">
          <iconify-icon icon="heroicons:check-circle" width="32" class="arrival-icon"></iconify-icon>
          <div class="arrival-text">
            <div class="arrival-title">已到达目的地</div>
            <div class="arrival-subtitle">{{ grave.name }}</div>
          </div>
        </div>
      </div>
      
      <!-- 导航控制按钮 -->
      <div class="nav-controls">
        <button @click="recenterMap" class="control-btn">
          <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
        </button>
        <button @click="toggleVoiceGuide" :class="['control-btn', { active: voiceGuideEnabled }]">
          <iconify-icon :icon="voiceGuideEnabled ? 'heroicons:speaker-wave' : 'heroicons:speaker-x-mark'" width="16"></iconify-icon>
        </button>
        <button @click="switchToSatellite" class="control-btn">
          <iconify-icon icon="heroicons:globe-alt" width="16"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="bottom-info">
      <div class="navigation-stats">
        <div class="stat-item">
          <iconify-icon icon="heroicons:clock" width="14"></iconify-icon>
          <span>{{ formatTime(navigationStartTime) }}</span>
        </div>
        <div class="stat-item">
          <iconify-icon icon="heroicons:map" width="14"></iconify-icon>
          <span>{{ navigationData.totalDistance ? formatDistance(navigationData.totalDistance) : '计算中...' }}</span>
        </div>
        <div class="stat-item">
          <iconify-icon icon="heroicons:signal" width="14"></iconify-icon>
          <span>{{ getLocationAccuracyText() }}</span>
        </div>
      </div>
      
      <div class="action-buttons">
        <button @click="shareLocation" class="action-btn share">
          <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
          分享位置
        </button>
        <button @click="callEmergency" class="action-btn emergency">
          <iconify-icon icon="heroicons:phone" width="16"></iconify-icon>
          紧急联系
        </button>
      </div>
    </div>

    <!-- 语音播报 -->
    <audio ref="voiceAudio" preload="auto"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AMapContainer from '../map/AMapContainer.vue'
import { mapService, type MapLocation } from '../../services/mapService'
import { MAP_UTILS } from '../../config/map'

interface Cemetery {
  id: string
  name: string
  address: string
  location: MapLocation
}

interface Grave {
  id: string
  name: string
  section: string
  row: string
  number: string
  location: MapLocation
  deceased: {
    name: string
    birthDate: string
    deathDate: string
  }
}

interface NavigationInstruction {
  action: 'straight' | 'left' | 'right' | 'arrive'
  text: string
  distance: number
}

interface NavigationData {
  distance: number
  duration: number
  totalDistance: number
  route: MapLocation[]
  instructions: NavigationInstruction[]
}

interface Props {
  cemetery: Cemetery
  grave: Grave
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'navigation-exit': []
  'navigation-complete': []
  'location-share': [location: MapLocation]
  'emergency-call': []
}>()

// 响应式数据
const mapRef = ref()
const map = ref<any>(null)
const voiceAudio = ref<HTMLAudioElement>()
const currentLocation = ref<MapLocation | null>(null)
const locationAccuracy = ref<number>(0)
const accuracyRadius = ref<number>(0)
const navigationData = ref<NavigationData>({
  distance: 0,
  duration: 0,
  totalDistance: 0,
  route: [],
  instructions: []
})
const currentInstruction = ref<NavigationInstruction | null>(null)
const hasArrived = ref(false)
const voiceGuideEnabled = ref(true)
const navigationStartTime = ref<Date>(new Date())
const watchId = ref<number | null>(null)

// 地图中心点
const mapCenter = computed(() => {
  if (currentLocation.value) {
    return [currentLocation.value.lng, currentLocation.value.lat]
  }
  return [props.grave.location.lng, props.grave.location.lat]
})

// 导航标记点
const navigationMarkers = computed(() => {
  const markers: MapLocation[] = []
  
  // 添加目标墓地
  markers.push({
    ...props.grave.location,
    name: props.grave.name
  })
  
  // 添加当前位置
  if (currentLocation.value) {
    markers.push({
      ...currentLocation.value,
      name: '我的位置'
    })
  }
  
  // 添加路线点
  navigationData.value.route.forEach((point, index) => {
    markers.push({
      ...point,
      name: `路线点${index + 1}`
    })
  })
  
  return markers
})

// 地图准备就绪
const onMapReady = (mapInstance: any) => {
  map.value = mapInstance
  console.log('✅ 墓地导航地图准备就绪')
  initNavigation()
}

// 位置变化处理
const onLocationChange = (location: MapLocation) => {
  console.log('📍 导航位置变化:', location)
}

// 初始化导航
const initNavigation = async () => {
  try {
    // 获取当前位置
    await getCurrentLocation()
    
    // 计算路线
    await calculateRoute()
    
    // 开始位置追踪
    startLocationTracking()
    
    console.log('✅ 墓地导航初始化完成')
  } catch (error) {
    console.error('❌ 导航初始化失败:', error)
  }
}

// 获取当前位置
const getCurrentLocation = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude, accuracy } = position.coords
        locationAccuracy.value = accuracy
        accuracyRadius.value = Math.min(accuracy * 2, 100) // 限制最大半径
        
        try {
          const location = await mapService.reverseGeocode(longitude, latitude)
          currentLocation.value = location
          resolve()
        } catch (error) {
          currentLocation.value = {
            lng: longitude,
            lat: latitude,
            address: `${longitude.toFixed(6)}, ${latitude.toFixed(6)}`
          }
          resolve()
        }
      },
      (error) => {
        reject(new Error('定位失败: ' + error.message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

// 计算路线
const calculateRoute = async () => {
  if (!currentLocation.value) return
  
  try {
    // 这里应该调用高德地图的路线规划API
    // 现在使用模拟数据
    const distance = MAP_UTILS.getDistance(
      [currentLocation.value.lng, currentLocation.value.lat],
      [props.grave.location.lng, props.grave.location.lat]
    )
    
    navigationData.value = {
      distance,
      duration: Math.ceil(distance / 1000 * 3), // 假设步行速度3分钟/公里
      totalDistance: distance,
      route: [currentLocation.value, props.grave.location],
      instructions: [
        {
          action: 'straight',
          text: '直行前往目的地',
          distance: distance
        },
        {
          action: 'arrive',
          text: '已到达目的地',
          distance: 0
        }
      ]
    }
    
    currentInstruction.value = navigationData.value.instructions[0]
    
    console.log('✅ 路线计算完成:', navigationData.value)
  } catch (error) {
    console.error('❌ 路线计算失败:', error)
  }
}

// 开始位置追踪
const startLocationTracking = () => {
  if (!navigator.geolocation) return
  
  watchId.value = navigator.geolocation.watchPosition(
    async (position) => {
      const { longitude, latitude, accuracy } = position.coords
      locationAccuracy.value = accuracy
      accuracyRadius.value = Math.min(accuracy * 2, 100)
      
      try {
        const location = await mapService.reverseGeocode(longitude, latitude)
        currentLocation.value = location
        
        // 检查是否到达目的地
        checkArrival(location)
        
        // 更新导航指示
        updateNavigationInstruction(location)
        
      } catch (error) {
        console.error('❌ 位置更新失败:', error)
      }
    },
    (error) => {
      console.error('❌ 位置追踪失败:', error)
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 10000
    }
  )
}

// 检查是否到达
const checkArrival = (location: MapLocation) => {
  const distance = MAP_UTILS.getDistance(
    [location.lng, location.lat],
    [props.grave.location.lng, props.grave.location.lat]
  )
  
  if (distance <= 10) { // 10米内算到达
    hasArrived.value = true
    if (voiceGuideEnabled.value) {
      playVoiceGuide('已到达目的地')
    }
    emit('navigation-complete')
  }
}

// 更新导航指示
const updateNavigationInstruction = (location: MapLocation) => {
  // 这里应该根据当前位置和路线计算下一步指示
  // 现在使用简化逻辑
  const distance = MAP_UTILS.getDistance(
    [location.lng, location.lat],
    [props.grave.location.lng, props.grave.location.lat]
  )
  
  if (distance > 10) {
    currentInstruction.value = {
      action: 'straight',
      text: '继续直行前往目的地',
      distance: distance
    }
  }
}

// 获取指示图标
const getInstructionIcon = (action: string): string => {
  switch (action) {
    case 'left': return 'heroicons:arrow-left'
    case 'right': return 'heroicons:arrow-right'
    case 'arrive': return 'heroicons:flag'
    default: return 'heroicons:arrow-up'
  }
}

// 重新居中地图
const recenterMap = () => {
  if (currentLocation.value && map.value) {
    mapService.setCenter(
      currentLocation.value.lng,
      currentLocation.value.lat,
      18
    )
  }
}

// 切换语音导航
const toggleVoiceGuide = () => {
  voiceGuideEnabled.value = !voiceGuideEnabled.value
  console.log(`🔊 语音导航${voiceGuideEnabled.value ? '开启' : '关闭'}`)
}

// 切换卫星视图
const switchToSatellite = () => {
  if (map.value) {
    // 切换地图样式
    map.value.setMapStyle('amap://styles/satellite')
  }
}

// 播放语音导航
const playVoiceGuide = (text: string) => {
  if (!voiceGuideEnabled.value || !voiceAudio.value) return
  
  // 这里应该使用语音合成API
  console.log('🔊 语音播报:', text)
}

// 分享位置
const shareLocation = () => {
  if (currentLocation.value) {
    emit('location-share', currentLocation.value)
  }
}

// 紧急联系
const callEmergency = () => {
  emit('emergency-call')
}

// 退出导航
const exitNavigation = () => {
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }
  emit('navigation-exit')
}

// 格式化距离
const formatDistance = (distance: number): string => {
  return MAP_UTILS.formatDistance(distance)
}

// 格式化时长
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 获取定位精度文本
const getLocationAccuracyText = (): string => {
  if (locationAccuracy.value <= 5) return '高精度'
  if (locationAccuracy.value <= 20) return '中精度'
  return '低精度'
}

onUnmounted(() => {
  exitNavigation()
})
</script>

<style scoped>
.cemetery-navigation {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000;
  color: white;
  position: relative;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.destination-info {
  flex: 1;
}

.cemetery-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.grave-info {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 4px;
}

.distance-info {
  font-size: 12px;
  color: #07C160;
}

.exit-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.map-navigation {
  flex: 1;
  position: relative;
}

.navigation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
}

.current-location-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.location-dot {
  width: 12px;
  height: 12px;
  background: #007AFF;
  border: 2px solid white;
  border-radius: 50%;
  position: relative;
  z-index: 2;
  box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
}

.location-accuracy {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 122, 255, 0.2);
  border: 1px solid rgba(0, 122, 255, 0.5);
  border-radius: 50%;
  z-index: 1;
}

.route-instruction {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
}

.instruction-icon {
  background: #07C160;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.instruction-text {
  flex: 1;
}

.instruction-main {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.instruction-distance {
  font-size: 14px;
  color: #ccc;
}

.arrival-notice {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(7, 193, 96, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
  animation: arrivalPulse 2s infinite;
}

@keyframes arrivalPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.05); }
}

.arrival-icon {
  color: white;
}

.arrival-text {
  text-align: center;
}

.arrival-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.arrival-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.nav-controls {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
}

.control-btn {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.control-btn.active {
  background: #07C160;
}

.bottom-info {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.navigation-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #ccc;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.action-btn.share {
  border-color: #07C160;
  color: #07C160;
}

.action-btn.share:hover {
  background: rgba(7, 193, 96, 0.2);
}

.action-btn.emergency {
  border-color: #ff4757;
  color: #ff4757;
}

.action-btn.emergency:hover {
  background: rgba(255, 71, 87, 0.2);
}
</style>
