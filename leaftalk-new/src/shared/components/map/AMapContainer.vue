<template>
  <div class="amap-container">
    <div 
      :id="mapId" 
      class="amap-wrapper"
      :style="{ width: width, height: height }"
    ></div>
    
    <!-- 地图控制按钮 -->
    <div class="map-controls" v-if="showControls">
      <button @click="getCurrentLocation" class="control-btn location-btn" title="定位">
        <iconify-icon icon="heroicons:map-pin" width="20"></iconify-icon>
      </button>
      <button @click="toggleMapStyle" class="control-btn style-btn" title="切换样式">
        <iconify-icon icon="heroicons:swatch" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="map-search" v-if="showSearch">
      <input 
        v-model="searchKeyword"
        @keyup.enter="searchPlace"
        placeholder="搜索地点..."
        class="search-input"
      />
      <button @click="searchPlace" class="search-btn">
        <iconify-icon icon="heroicons:magnifying-glass" width="16"></iconify-icon>
      </button>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results" v-if="searchResults.length > 0">
      <div 
        v-for="(result, index) in searchResults" 
        :key="index"
        @click="selectSearchResult(result)"
        class="search-result-item"
      >
        <div class="result-name">{{ result.name }}</div>
        <div class="result-address">{{ result.address }}</div>
        <div class="result-distance" v-if="result.distance">
          {{ formatDistance(result.distance) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { mapService, type MapLocation, type SearchResult } from '../../services/mapService'
import { MAP_STYLES, MAP_UTILS } from '../../config/map'

interface Props {
  width?: string
  height?: string
  center?: [number, number]
  zoom?: number
  showControls?: boolean
  showSearch?: boolean
  markers?: MapLocation[]
  mapStyle?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px',
  center: () => [116.397428, 39.90923],
  zoom: 10,
  showControls: true,
  showSearch: false,
  markers: () => [],
  mapStyle: 'normal'
})

const emit = defineEmits<{
  mapReady: [map: any]
  locationChange: [location: MapLocation]
  markerClick: [marker: any, location: MapLocation]
}>()

// 响应式数据
const mapId = ref(`amap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
const map = ref<any>(null)
const searchKeyword = ref('')
const searchResults = ref<SearchResult[]>([])
const currentStyleIndex = ref(0)

// 地图样式列表
const styleKeys = Object.keys(MAP_STYLES)

// 初始化地图
const initMap = async () => {
  try {
    map.value = await mapService.initMap(mapId.value, {
      center: props.center,
      zoom: props.zoom,
      mapStyle: MAP_STYLES[props.mapStyle as keyof typeof MAP_STYLES]
    })

    // 添加标记点
    if (props.markers.length > 0) {
      addMarkers(props.markers)
    }

    // 地图点击事件
    map.value.on('click', (e: any) => {
      const location: MapLocation = {
        lng: e.lnglat.lng,
        lat: e.lnglat.lat
      }
      emit('locationChange', location)
    })

    emit('mapReady', map.value)
    console.log('✅ 地图组件初始化成功')
  } catch (error) {
    console.error('❌ 地图初始化失败:', error)
  }
}

// 添加标记点
const addMarkers = (locations: MapLocation[]) => {
  locations.forEach(location => {
    const marker = mapService.addMarker(location, {
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(25, 34),
        image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
        imageOffset: new window.AMap.Pixel(-9, -3),
        imageSize: new window.AMap.Size(18, 24)
      })
    })

    marker.on('click', () => {
      emit('markerClick', marker, location)
    })
  })
}

// 获取当前位置
const getCurrentLocation = async () => {
  try {
    const location = await mapService.getCurrentLocation()
    mapService.setCenter(location.lng, location.lat, 15)
    emit('locationChange', location)
  } catch (error) {
    console.error('❌ 定位失败:', error)
  }
}

// 切换地图样式
const toggleMapStyle = () => {
  if (!map.value) return
  
  currentStyleIndex.value = (currentStyleIndex.value + 1) % styleKeys.length
  const newStyle = MAP_STYLES[styleKeys[currentStyleIndex.value] as keyof typeof MAP_STYLES]
  map.value.setMapStyle(newStyle)
}

// 搜索地点
const searchPlace = async () => {
  if (!searchKeyword.value.trim()) return

  try {
    const results = await mapService.searchPlace(searchKeyword.value)
    searchResults.value = results
  } catch (error) {
    console.error('❌ 搜索失败:', error)
    searchResults.value = []
  }
}

// 选择搜索结果
const selectSearchResult = (result: SearchResult) => {
  mapService.setCenter(result.location.lng, result.location.lat, 15)
  mapService.addMarker(result.location)
  searchResults.value = []
  searchKeyword.value = ''
  emit('locationChange', result.location)
}

// 格式化距离
const formatDistance = (distance: number): string => {
  return MAP_UTILS.formatDistance(distance)
}

// 监听标记点变化
watch(() => props.markers, (newMarkers) => {
  if (map.value && newMarkers.length > 0) {
    // 清除现有标记点
    map.value.clearMap()
    // 添加新标记点
    addMarkers(newMarkers)
  }
}, { deep: true })

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (map.value) {
    mapService.setCenter(newCenter[0], newCenter[1])
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  mapService.destroy()
})
</script>

<style scoped>
.amap-container {
  position: relative;
  width: 100%;
}

.amap-wrapper {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}

.control-btn {
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
}

.map-search {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.search-input {
  border: none;
  padding: 10px 12px;
  outline: none;
  width: 200px;
  font-size: 14px;
}

.search-btn {
  background: #07C160;
  border: none;
  color: white;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover {
  background: #06AD56;
}

.search-results {
  position: absolute;
  top: 60px;
  left: 10px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 250px;
}

.search-result-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #f8f8f8;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.result-address {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.result-distance {
  font-size: 11px;
  color: #999;
}
</style>
