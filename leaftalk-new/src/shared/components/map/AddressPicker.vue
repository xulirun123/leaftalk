<template>
  <div class="address-picker">
    <!-- 地址输入框 -->
    <div class="address-input-group">
      <label class="input-label">详细地址</label>
      <div class="input-wrapper">
        <input 
          v-model="addressText"
          @focus="showMap = true"
          @input="onAddressInput"
          placeholder="请输入详细地址或点击地图选择"
          class="address-input"
          readonly
        />
        <button @click="showMap = !showMap" class="map-toggle-btn">
          <iconify-icon icon="heroicons:map" width="16"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 地图选择器 -->
    <div class="map-picker" v-if="showMap">
      <div class="map-header">
        <h3>选择地址位置</h3>
        <button @click="showMap = false" class="close-btn">
          <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
        </button>
      </div>
      
      <AMapContainer
        :width="'100%'"
        :height="'300px'"
        :center="mapCenter"
        :zoom="15"
        :show-controls="true"
        :show-search="true"
        @map-ready="onMapReady"
        @location-change="onLocationChange"
      />
      
      <div class="selected-address" v-if="selectedLocation">
        <div class="address-info">
          <div class="address-text">{{ selectedLocation.address }}</div>
          <div class="coordinates">
            经度: {{ selectedLocation.lng.toFixed(6) }}, 
            纬度: {{ selectedLocation.lat.toFixed(6) }}
          </div>
        </div>
        <button @click="confirmAddress" class="confirm-btn">
          确认选择
        </button>
      </div>
    </div>

    <!-- 常用地址 -->
    <div class="common-addresses" v-if="commonAddresses.length > 0">
      <div class="section-title">常用地址</div>
      <div class="address-list">
        <div 
          v-for="(addr, index) in commonAddresses"
          :key="index"
          @click="selectCommonAddress(addr)"
          class="address-item"
        >
          <div class="address-name">{{ addr.name }}</div>
          <div class="address-detail">{{ addr.address }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AMapContainer from './AMapContainer.vue'
import { mapService, type MapLocation } from '../../services/mapService'
import { MAP_UTILS } from '../../config/map'

interface CommonAddress {
  name: string
  address: string
  location: MapLocation
}

interface Props {
  modelValue?: string
  placeholder?: string
  commonAddresses?: CommonAddress[]
  defaultLocation?: [number, number]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择地址',
  commonAddresses: () => [],
  defaultLocation: () => [116.397428, 39.90923]
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'location-selected': [location: MapLocation]
}>()

// 响应式数据
const addressText = ref(props.modelValue)
const showMap = ref(false)
const selectedLocation = ref<MapLocation | null>(null)
const map = ref<any>(null)

// 地图中心点
const mapCenter = computed(() => {
  if (selectedLocation.value) {
    return [selectedLocation.value.lng, selectedLocation.value.lat]
  }
  return props.defaultLocation
})

// 地址输入处理
const onAddressInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  addressText.value = target.value
  emit('update:modelValue', target.value)
}

// 地图准备就绪
const onMapReady = (mapInstance: any) => {
  map.value = mapInstance
  console.log('✅ 地址选择器地图准备就绪')
}

// 位置变化处理
const onLocationChange = async (location: MapLocation) => {
  try {
    // 如果没有地址信息，进行逆地理编码
    if (!location.address) {
      const fullLocation = await mapService.reverseGeocode(location.lng, location.lat)
      selectedLocation.value = fullLocation
    } else {
      selectedLocation.value = location
    }
  } catch (error) {
    console.error('❌ 获取地址信息失败:', error)
    selectedLocation.value = location
  }
}

// 确认地址选择
const confirmAddress = () => {
  if (selectedLocation.value) {
    addressText.value = selectedLocation.value.address || `${selectedLocation.value.lng}, ${selectedLocation.value.lat}`
    emit('update:modelValue', addressText.value)
    emit('location-selected', selectedLocation.value)
    showMap.value = false
  }
}

// 选择常用地址
const selectCommonAddress = (addr: CommonAddress) => {
  selectedLocation.value = addr.location
  addressText.value = addr.address
  emit('update:modelValue', addr.address)
  emit('location-selected', addr.location)
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  addressText.value = newValue
})
</script>

<style scoped>
.address-picker {
  width: 100%;
}

.address-input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.address-input {
  flex: 1;
  padding: 12px 40px 12px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.address-input:focus {
  outline: none;
  border-color: #07C160;
}

.map-toggle-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.map-toggle-btn:hover {
  background: #f0f0f0;
}

.map-picker {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  background: white;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.map-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.selected-address {
  padding: 16px;
  background: #f8f8f8;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-info {
  flex: 1;
}

.address-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.coordinates {
  font-size: 12px;
  color: #666;
}

.confirm-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.confirm-btn:hover {
  background: #06AD56;
}

.common-addresses {
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.address-list {
  display: grid;
  gap: 8px;
}

.address-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.address-item:hover {
  border-color: #07C160;
  background: #f8fff8;
}

.address-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.address-detail {
  font-size: 12px;
  color: #666;
}
</style>
