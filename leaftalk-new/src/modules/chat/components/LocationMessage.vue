<template>
  <div class="location-message" @click="openLocationDetail">
    <div class="location-header">
      <iconify-icon icon="heroicons:map-pin" width="16" class="location-icon"></iconify-icon>
      <span class="location-title">位置信息</span>
    </div>
    
    <div class="location-content">
      <!-- 地图预览 -->
      <div class="map-preview" :style="{ backgroundImage: `url(${staticMapUrl})` }">
        <div class="map-overlay">
          <iconify-icon icon="heroicons:eye" width="20"></iconify-icon>
          <span>查看详情</span>
        </div>
      </div>
      
      <!-- 地址信息 -->
      <div class="address-info">
        <div class="address-name">{{ location.name || '位置' }}</div>
        <div class="address-detail">{{ location.address }}</div>
        <div class="coordinates" v-if="showCoordinates">
          {{ location.lng.toFixed(6) }}, {{ location.lat.toFixed(6) }}
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="location-actions">
      <button @click.stop="copyLocation" class="action-btn copy-btn">
        <iconify-icon icon="heroicons:clipboard" width="14"></iconify-icon>
        复制
      </button>
      <button @click.stop="openNavigation" class="action-btn nav-btn">
        <iconify-icon icon="heroicons:map" width="14"></iconify-icon>
        导航
      </button>
      <button @click.stop="shareLocation" class="action-btn share-btn">
        <iconify-icon icon="heroicons:share" width="14"></iconify-icon>
        分享
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AMAP_CONFIG } from '../../config/map'

interface LocationData {
  lng: number
  lat: number
  address: string
  name?: string
}

interface Props {
  location: LocationData
  showCoordinates?: boolean
  mapSize?: string
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: false,
  mapSize: '300x150'
})

const emit = defineEmits<{
  'location-click': [location: LocationData]
  'navigation-click': [location: LocationData]
}>()

// 生成静态地图URL
const staticMapUrl = computed(() => {
  const { lng, lat } = props.location
  const [width, height] = props.mapSize.split('x')
  
  return `https://restapi.amap.com/v3/staticmap?` +
    `location=${lng},${lat}&` +
    `zoom=15&` +
    `size=${width}*${height}&` +
    `markers=mid,0xFF0000,A:${lng},${lat}&` +
    `key=${AMAP_CONFIG.key}`
})

// 打开位置详情
const openLocationDetail = () => {
  emit('location-click', props.location)
}

// 复制位置信息
const copyLocation = async () => {
  try {
    const text = `${props.location.address}\n坐标: ${props.location.lng}, ${props.location.lat}`
    await navigator.clipboard.writeText(text)
    console.log('✅ 位置信息已复制')
  } catch (error) {
    console.error('❌ 复制失败:', error)
  }
}

// 打开导航
const openNavigation = () => {
  emit('navigation-click', props.location)
  
  // 尝试打开高德地图导航
  const amapUrl = `https://uri.amap.com/navigation?to=${props.location.lng},${props.location.lat},${encodeURIComponent(props.location.name || '目的地')}&mode=car&policy=1&src=叶语`
  
  // 在移动端尝试打开APP，否则打开网页版
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    window.location.href = amapUrl
  } else {
    window.open(amapUrl, '_blank')
  }
}

// 分享位置
const shareLocation = async () => {
  const shareData = {
    title: props.location.name || '位置分享',
    text: props.location.address,
    url: `https://uri.amap.com/marker?position=${props.location.lng},${props.location.lat}&name=${encodeURIComponent(props.location.name || '位置')}&src=叶语`
  }
  
  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      // 降级到复制链接
      await navigator.clipboard.writeText(shareData.url)
      console.log('✅ 位置链接已复制')
    }
  } catch (error) {
    console.error('❌ 分享失败:', error)
  }
}
</script>

<style scoped>
.location-message {
  max-width: 280px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.location-message:hover {
  transform: translateY(-1px);
}

.location-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 12px 8px;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.location-icon {
  color: #07C160;
}

.location-title {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.location-content {
  position: relative;
}

.map-preview {
  width: 100%;
  height: 120px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  background-color: #f0f0f0;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: white;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.2s;
}

.location-message:hover .map-overlay {
  opacity: 1;
}

.address-info {
  padding: 12px;
}

.address-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-detail {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 4px;
}

.coordinates {
  font-size: 11px;
  color: #999;
  font-family: monospace;
}

.location-actions {
  display: flex;
  border-top: 1px solid #eee;
}

.action-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 10px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #f8f8f8;
}

.action-btn:not(:last-child) {
  border-right: 1px solid #eee;
}

.copy-btn:hover {
  color: #07C160;
}

.nav-btn:hover {
  color: #1890ff;
}

.share-btn:hover {
  color: #ff6b35;
}
</style>
