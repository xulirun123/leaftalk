<template>
  <div class="location-picker">
    <!-- 顶部操作按钮 -->
    <button class="cancel-btn" @click="goBack">取消</button>
    <button class="send-btn" :disabled="!selectedLocation" @click="sendLocation">发送</button>

    <!-- 地图容器（60vh） -->
    <div class="map-container">
      <l-map
        v-if="mapReady"
        ref="mapRef"
        :zoom="zoom"
        :useGlobalLeaflet="false"
        :center="[mapCenter.lat, mapCenter.lng]"
        :bounds="mapBounds"
        :options="mapOptions"
        style="height: 100%; width: 100%"
        @moveend="onMapMoveEnd"
        @move="onMapMove"

      >
        <l-tile-layer :url="currentTile.url" :attribution="currentTile.attribution" :subdomains="currentTile.subdomains" :error-tile-url="errorTileUrl" @tileerror="onTileError" />
        <l-marker :lat-lng="[mapCenter.lat, mapCenter.lng]">
          <l-icon :icon-url="markerIcon" :shadow-url="markerShadow" :icon-size="[25,41]" :icon-anchor="[12,41]" />
          <l-tooltip :permanent="true" direction="top" :offset="[0,-10]">
            {{ (selectedLocation && selectedLocation.name) || '位置' }}
          </l-tooltip>
        </l-marker>
      </l-map>
      <div v-else class="map-loading">
        <div class="loading-spinner" />
        <span>{{ loadingText }}</span>
      </div>
    </div>

    <!-- 搜索框（42px容器，30px输入框） -->
    <div class="search-container">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass-20-solid" width="18" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索地点"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">
          <iconify-icon icon="heroicons:arrow-right-circle" width="18" />
        </button>
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
          <iconify-icon icon="heroicons:x-mark" width="16" />
        </button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="locations-list">
      <div class="list-header">
        附近位置 <span class="location-count" v-if="nearbyLocations.length">({{ nearbyLocations.length }})</span>
      </div>

      <div v-if="isLoadingPOI" class="loading-state">
        <div class="loading-spinner small" />
        <span>正在搜索附近地点...</span>
      </div>

      <template v-else>
        <div
          v-for="loc in nearbyLocations"
          :key="loc.id"
          class="location-item"
          :class="{ active: selectedLocation && selectedLocation.id === loc.id }"
          @click="selectLocation(loc)"
        >
          <div class="location-icon">
            <iconify-icon icon="heroicons:map-pin" width="18" color="#07C160" />
          </div>
          <div class="location-info">
            <div class="location-name">{{ loc.name }}</div>
            <div class="location-address">{{ loc.address }}</div>
          </div>
          <div class="location-distance">{{ loc.distance }}</div>
        </div>

        <div v-if="!nearbyLocations.length" class="empty-state">
          <iconify-icon icon="heroicons:map" width="48" color="#ccc" />
          <p>暂无地点，尝试拖动地图或搜索关键词</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LMap, LTileLayer, LMarker, LIcon, LTooltip } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationInfo {
  id: string
  name: string
  address: string
  distance: string
  latitude: number
  longitude: number
}

const router = useRouter()
const route = useRoute()

// 地图配置
const mapReady = ref(false)
// 初始中心优先读本地缓存，避免误认为“新加坡”硬编码
const loadSavedCenter = () => {
  try { const s = localStorage.getItem('last_known_location'); if (s) return JSON.parse(s) } catch {}
  return null
}
const mapCenter = ref(loadSavedCenter() || { lat: 34.3416, lng: 108.9398 }) // 若无缓存，给中国中部近似点（避免偏离）
const zoom = ref(13)
const mapBounds = ref<any | null>(null)

// 禁止缩放、允许拖动（固定比例）
const mapOptions = {
  zoomControl: false,
  attributionControl: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  touchZoom: false,
  boxZoom: false,
  keyboard: false,
  dragging: true
}

// 地图底图候选，更稳健顺序：ArcGIS → Wikimedia → OSM → 高德
const tileIndex = ref(0)
const tileCandidates = [
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (HK), Esri (Thailand), TomTom, 2012'
  },
  {
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    attribution: '© Wikimedia maps | © OpenStreetMap contributors'
  },
  {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a','b','c'],
    attribution: '&copy; OpenStreetMap contributors'
  },
  {
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
    subdomains: ['1','2','3','4'],
    attribution: '© 高德地图'
  }
]
const currentTile = computed(()=> tileCandidates[tileIndex.value] || tileCandidates[0])
const switching = ref(false)
const onTileError = () => {
  if (switching.value) return
  if (tileIndex.value < tileCandidates.length - 1) {
    switching.value = true
    tileIndex.value++
    setTimeout(()=> switching.value = false, 1500)
  }
}
const errorTileUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect width="100%25" height="100%25" fill="%23EDEDED"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14"%3Etile failed%3C/text%3E%3C/svg%3E'
const mapRef = ref<any>(null)

const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'


// UI/状态
const chatId = (route.query.chatId as string) || ''
const searchQuery = ref('')
const loadingText = ref('正在加载地图...')
const isLoadingPOI = ref(false)
const selectedLocation = ref<LocationInfo | null>(null)
const nearbyLocations = ref<LocationInfo[]>([])

// 定位
const userLocation = ref<{ lat: number; lng: number } | null>(null)

// 工具：距离计算（米）
const distanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)


  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 计算指定半径（米）的可视范围Bounds（默认5公里）
const getBoundsForRadius = (lat: number, lng: number, radiusMeters = 5000) => {
  // 1度纬度≈111320米；经度与纬度有关
  const latDelta = radiusMeters / 111320
  const lngDelta = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180) || 1)
  return [
    [lat - latDelta, lng - lngDelta], // SW
    [lat + latDelta, lng + lngDelta]  // NE
  ] as any
}


// IP 定位兜底（无权限/失败时使用）多源回退：ipapi → ipwhois → BigDataCloud（降低 403 噪音）
const ipGeoFallback = async (): Promise<{lat:number;lng:number}|null> => {
  const tryFns = [
    async ()=>{
      const d = await fetchJSON('https://ipapi.co/json/', 8000)
      return (d && d.latitude && d.longitude) ? { lat: d.latitude, lng: d.longitude } : null
    },
    async ()=>{
      const d = await fetchJSON('https://ipwho.is/', 8000)
      return (d && d.success && d.latitude && d.longitude) ? { lat: d.latitude, lng: d.longitude } : null
    },
    async ()=>{
      const d = await fetchJSON('https://api.bigdatacloud.net/data/ip-geolocation?localityLanguage=zh', 8000)
      return d?.location ? { lat: d.location.latitude, lng: d.location.longitude } : null
    }
  ]
  for (const fn of tryFns) {
    try { const r = await fn(); if (r) return r } catch {}
  }
  return null
}

const saveCenter = (lat:number, lng:number) => {
  try{ localStorage.setItem('last_known_location', JSON.stringify({ lat, lng })) }catch{}
}


// 输入联动（防遗忘按回车）：600ms 防抖自动搜索
let searchDebounce: any = null
watch(searchQuery, (val) => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (!val) {
    searchDebounce = setTimeout(() => clearSearch(), 200)
  } else {
    searchDebounce = setTimeout(() => handleSearch(), 600)
  }
})



//
// 固定使用 5 公里视野（用户希望放大并限制到 5km 内）
const setRegionBoundsAround = async (lat: number, lon: number) => {
  mapBounds.value = getBoundsForRadius(lat, lon, 2000)
}

const estimateRadiusForResult = (res: any): number => {
  const type = (res?.type || '').toLowerCase()
  const clazz = (res?.class || '').toLowerCase()
  // 行政区、城市级别：使用边界（如有），否则用较大半径
  if (['city','district','county','state','province','region','municipality','town'].includes(type)) return 15000
  if (['suburb','borough','quarter'].includes(type)) return 8000
  if (['neighbourhood','residential','village','hamlet'].includes(type)) return 4000
  // 具体地址或POI
  if (['amenity','shop','building','office','tourism','leisure','railway','aeroway','highway'].includes(clazz)) return 800
  if (['house','building','address','road'].includes(type)) return 800
  // 默认
  return 5000
}

// ---- 反向地理编码多源回退 & 缓存 ----
const AMAP_KEY = (import.meta as any).env?.VITE_AMAP_KEY || ''
const reverseCache = new Map<string, any>()
const fetchJSON = async (url: string, timeoutMs = 8000) => {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  try { const res = await fetch(url, { signal: ctrl.signal }); if (!res.ok) throw new Error(String(res.status)); return await res.json() } finally { clearTimeout(id) }
}

const amapReverse = async (lat:number, lon:number) => {
  if (!AMAP_KEY) return null
  try {
    const url = `https://restapi.amap.com/v3/geocode/regeo?location=${lon},${lat}&extensions=base&roadlevel=0&poitype=&radius=100&key=${AMAP_KEY}`
    const data = await fetchJSON(url, 8000)
    if (data.status !== '1') return null
    const rc = data.regeocode || {}
    const ac = rc.addressComponent || {}
    const disp = rc.formatted_address || ''
    const address = {
      country: ac.country,
      state: ac.province,
      city: ac.city && typeof ac.city === 'string' ? ac.city : (ac.district || ''),
      district: ac.district,
      township: ac.township,
      road: ac.towncode ? undefined : ac.township
    }
    return { display_name: disp, address }
  } catch { return null }
}

const nominatimReverse = async (lat:number, lon:number) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=zh-CN`
    return await fetchJSON(url, 8000)
  } catch { return null }
}

const bigDataCloudReverse = async (lat:number, lon:number) => {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
    const d = await fetchJSON(url, 8000)
    const disp = [d.countryName, d.principalSubdivision, d.city || d.locality, d.localityInfo?.administrative?.[0]?.name]
      .filter(Boolean).join(' ')
    const address:any = { country: d.countryName, state: d.principalSubdivision, city: d.city || d.locality }
    return { display_name: disp || d.locality || '', address }
  } catch { return null }
}


// 反向地理编码（多源：AMap → Nominatim → BigDataCloud），含内存缓存
const reverseGeocode = async (lat: number, lon: number) => {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`
  if (reverseCache.has(key)) return reverseCache.get(key)

  // 1) AMap（若配置了 KEY，优先使用）
  const a = await amapReverse(lat, lon)
  if (a && a.display_name) { reverseCache.set(key, a); return a }

  // 2) Nominatim（若被限流/503，则为 null）
  const n = await nominatimReverse(lat, lon)
  if (n && n.display_name) { reverseCache.set(key, n); return n }

  // 3) BigDataCloud（免 Key 兜底，字段做兼容）
  const b = await bigDataCloudReverse(lat, lon)
  if (b && b.display_name) { reverseCache.set(key, b); return b }

  return null
}

// 使用 Overpass 搜索附近 POI（1000m 半径）
const fetchNearbyPOI = async (lat: number, lon: number) => {
  isLoadingPOI.value = true
  try {
    const query = `
      [out:json][timeout:20];
      (
        node(around:1000,${lat},${lon})[amenity];
        node(around:1000,${lat},${lon})[shop];
        node(around:1000,${lat},${lon})[tourism];
        way(around:1000,${lat},${lon})[amenity];
        way(around:1000,${lat},${lon})[shop];
      );
      out center 50;
    `
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ data: query })
    })
    const data = await res.json()

    const items: LocationInfo[] = []
    // 当前中心
    items.push({ id: 'current', name: '当前位置', address: '', distance: '0m', latitude: lat, longitude: lon })

    for (const el of data.elements || []) {
      const name = el.tags?.name
      const center = el.type === 'node' ? { lat: el.lat, lon: el.lon } : el.center


      if (!name || !center) continue
      const dist = Math.round(distanceInMeters(lat, lon, center.lat, center.lon))


      items.push({
        id: `${el.type}_${el.id}`,
        name,
        address: el.tags?.addr_full || el.tags?.addr_street || el.tags?.addr_city || '附近位置',
        distance: `${dist}m`,
        latitude: center.lat,
        longitude: center.lon
      })
    }

    // 排序、去重
    const seen = new Set<string>()
    const list = items
      .filter(it => (it.name && !seen.has(it.name) && seen.add(it.name)) || it.id === 'current')
      .sort((a, b) => (a.id === 'current' ? -1 : b.id === 'current' ? 1 : parseInt(a.distance) - parseInt(b.distance)))
      .slice(0, 20)

    // 用最近的POI名称替换“当前位置”；地址用逆地理的详细地址
    const nearestPOI = list.find(it => it.id !== 'current')
    try {
      const rev = await reverseGeocode(lat, lon)
      if (rev?.display_name) list[0].address = rev.display_name
    } catch {}
    if (nearestPOI?.name) list[0].name = nearestPOI.name

    nearbyLocations.value = list
    if (!selectedLocation.value && list.length) selectedLocation.value = list[0]
  } catch (e) {
    console.error('POI 搜索失败:', e)
    // 简单降级：仅当前点
    nearbyLocations.value = [{ id: 'current', name: '当前位置', address: '', distance: '0m', latitude: lat, longitude: lon }]
  } finally {
    isLoadingPOI.value = false
  }
}


// 搜索关键词：根据地域层级自动适配视野
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    // 恢复默认：以当前中心为2km范围
    mapBounds.value = getBoundsForRadius(mapCenter.value.lat, mapCenter.value.lng, 2000)
    fetchNearbyPOI(mapCenter.value.lat, mapCenter.value.lng)
    return
  }
  try {
    const q = searchQuery.value.trim()
    // 取最佳匹配即可

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1&accept-language=zh-CN`
    const res = await fetch(url)
    if (!res.ok) throw new Error('搜索失败')
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return

    const top = data[0]
    const lat = parseFloat(top.lat)
    const lon = parseFloat(top.lon)
    mapCenter.value = { lat, lng: lon }
    saveCenter(lat, lon)

    // 固定 2km 范围显示（不再使用行政区边界）
    mapBounds.value = getBoundsForRadius(lat, lon, 2000)

    // 主动让地图适配到新的范围/中心
    await nextTick()
    const m = (mapRef.value as any)?.leafletObject
    if (m) {
      if (mapBounds.value) m.fitBounds(mapBounds.value, { padding: [20, 20] })
      else m.setView([lat, lon], 13)
    }

    // 选中该结果，并以其为中心刷新附近POI
    selectedLocation.value = {
      id: String(top.place_id),
      name: top.display_name?.split(',')[0] || q,
      address: top.display_name || '',
      distance: '0m',
      latitude: lat,
      longitude: lon
    }

    await fetchNearbyPOI(lat, lon)
  } catch (e) {
    console.error('关键词搜索失败:', e)
  }
}

const clearSearch = async () => {
  searchQuery.value = ''
  // 恢复到当前中心点的 2km 范围
  mapBounds.value = getBoundsForRadius(mapCenter.value.lat, mapCenter.value.lng, 2000)
  await nextTick()
  const m = (mapRef.value as any)?.leafletObject
  if (m && mapBounds.value) m.fitBounds(mapBounds.value, { padding: [20, 20] })
  fetchNearbyPOI(mapCenter.value.lat, mapCenter.value.lng)
}













const onMapMove = (e: any) => {
  const center = e.target.getCenter()
  mapCenter.value = { lat: center.lat, lng: center.lng }
}



const selectLocation = (loc: LocationInfo) => {
  selectedLocation.value = loc
  mapCenter.value = { lat: loc.latitude, lng: loc.longitude }
  saveCenter(loc.latitude, loc.longitude)
  // 选中具体位置时，聚焦到 1km 范围（不超过5km的需求内）
  mapBounds.value = getBoundsForRadius(loc.latitude, loc.longitude, 1000)
  fetchNearbyPOI(loc.latitude, loc.longitude)
}

const onMapMoveEnd = (e: any) => {
  const center = e.target.getCenter()
  mapCenter.value = { lat: center.lat, lng: center.lng }
  saveCenter(center.lat, center.lng)
  fetchNearbyPOI(center.lat, center.lng)
}

const sendLocation = () => {
  if (!selectedLocation.value) return
  const payload = {
    location: {
      name: selectedLocation.value.name,
      address: selectedLocation.value.address,
      latitude: selectedLocation.value.latitude,
      longitude: selectedLocation.value.longitude
    },
    from: 'location-picker',
    ts: Date.now()
  }
  sessionStorage.setItem('selected_location', JSON.stringify(payload))
  if (chatId) router.push(`/chat/${chatId}`)
  else router.back()
}

const goBack = () => router.back()

onMounted(async () => {
  loadingText.value = '正在定位...'
  try {
    await new Promise<void>((resolve) => {
      if (!navigator.geolocation) return resolve()
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          mapCenter.value = { ...userLocation.value }
          resolve()
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  } finally {
    // 若尚未获取精确定位，则尝试 IP 兜底
    if (!userLocation.value) {
      const ip = await ipGeoFallback()
      if (ip) { mapCenter.value = { lat: ip.lat, lng: ip.lng } }
    }
    const { lat, lng } = mapCenter.value
    saveCenter(lat, lng)
    // 固定以 2km 范围展示
    await setRegionBoundsAround(lat, lng)
    mapReady.value = true
    await nextTick()
    const m = (mapRef.value as any)?.leafletObject
    if (m) {
      if (mapBounds.value) m.fitBounds(mapBounds.value, { padding: [20, 20] })
      else m.setView([lat, lng], 13)
    }
    fetchNearbyPOI(lat, lng)
  }
})
</script>

<style scoped>
.location-picker {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #fff; z-index: 1000;
  display: flex; flex-direction: column;
}
.cancel-btn, .send-btn {
  position: absolute; top: 20px; z-index: 1001;
  padding: 8px 16px; border: none; border-radius: 20px;
  font-size: 14px; cursor: pointer;
}
.cancel-btn { left: 20px; background: rgba(0,0,0,0.6); color: #fff; }
.send-btn { right: 20px; background: #07C160; color: #fff; }
.send-btn:disabled { background: #ccc; cursor: not-allowed; }

.map-container { height: 70vh; position: relative; }
.map-loading {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  gap: 10px; background: rgba(255,255,255,0.9);
}
.loading-spinner { width: 24px; height: 24px; border: 2px solid #f3f3f3; border-top: 2px solid #07C160; border-radius: 50%; animation: spin 1s linear infinite; }
.loading-spinner.small { width: 16px; height: 16px; }
@keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }

.search-container { height: 42px; padding: 6px 16px; background: #fff; border-bottom: 1px solid #eee; }
.search-box { height: 30px; display: flex; align-items: center; gap: 8px; padding: 0 12px; background: #f5f5f5; border-radius: 15px; }
.search-box input { flex: 1; border: none; background: none; outline: none; font-size: 14px; }
.search-btn, .clear-btn { background: none; border: none; cursor: pointer; padding: 2px; border-radius: 50%; }
.search-btn:hover, .clear-btn:hover { background: rgba(0,0,0,0.1); }

.locations-list { flex: 1; overflow-y: auto; background: #fff; }
.list-header { padding: 12px 16px 8px; font-size: 14px; color: #666; background: #f8f8f8; border-bottom: 1px solid #eee; }
.location-count { color: #999; }
.location-item { height: 42px; display: flex; align-items: center; gap: 12px; padding: 0 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.location-item:hover { background: #f5f5f5; }
.location-item.active { background: #e8f5e8; }
.location-icon { flex-shrink: 0; }
.location-info { flex: 1; min-width: 0; }
.location-name { font-size: 14px; color: #333; height: 25px; line-height: 25px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.location-address { font-size: 12px; color: #999; height: 17px; line-height: 17px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.location-distance { font-size: 12px; color: #999; flex-shrink: 0; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #999; gap: 12px; }
</style>

