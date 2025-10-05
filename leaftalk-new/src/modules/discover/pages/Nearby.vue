<template>
  <div class="nearby-page">

    <!-- 位置信息 -->
    <div class="location-info">
      <div class="current-location">
        <iconify-icon icon="heroicons:map-pin" width="16" style="color: #07C160;"></iconify-icon>
        <span>{{ currentLocation }}</span>
      </div>
      <div class="refresh-btn" @click="refreshLocation">
        <iconify-icon icon="heroicons:arrow-path" width="16" style="color: #666;"></iconify-icon>
        <span>刷新</span>
      </div>
    </div>

    <!-- 附近的人列表 -->
    <div class="nearby-list">
      <div v-if="loading" class="loading-state">
        <iconify-icon icon="heroicons:arrow-path" width="32" style="color: #ccc;" class="loading-icon"></iconify-icon>
        <p>正在搜索附近的人...</p>
      </div>

      <div v-else-if="nearbyUsers.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:user-group" width="64" style="color: #ccc;"></iconify-icon>
        <p>附近暂无其他用户</p>
        <p class="empty-tip">稍后再试或调整搜索范围</p>
      </div>

      <div v-else class="user-list">
        <div 
          v-for="user in nearbyUsers" 
          :key="user.id"
          class="user-item"
          @click="viewUserProfile(user)"
        >
          <div class="user-avatar">
            <img :src="user.avatar" :alt="user.name" />
            <div v-if="user.isOnline" class="online-indicator"></div>
          </div>
          
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-distance">{{ user.distance }}</div>
            <div v-if="user.signature" class="user-signature">{{ user.signature }}</div>
          </div>
          
          <div class="user-actions">
            <button class="action-btn" @click.stop="sayHello(user)">
              <iconify-icon icon="heroicons:hand-raised" width="16"></iconify-icon>
              <span>打招呼</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 个人资料弹窗 -->
    <div v-if="showProfileDialog" class="dialog-overlay" @click="hideProfile">
      <div class="profile-dialog" @click.stop>
        <div class="profile-header">
          <button class="close-btn" @click="hideProfile">
            <iconify-icon icon="heroicons:x-mark" width="24" style="color: white;"></iconify-icon>
          </button>
        </div>

        <div v-if="selectedUser" class="profile-content">
          <div class="profile-avatar">
            <img :src="selectedUser.avatar" :alt="selectedUser.name" />
            <div v-if="selectedUser.isOnline" class="online-indicator"></div>
          </div>

          <div class="profile-info">
            <h2 class="profile-name">{{ selectedUser.name }}</h2>
            <p class="profile-distance">距离 {{ selectedUser.distance }}</p>
            <p v-if="selectedUser.signature" class="profile-signature">{{ selectedUser.signature }}</p>
            <p v-if="selectedUser.age" class="profile-age">{{ selectedUser.age }}岁</p>
            <p v-if="selectedUser.gender" class="profile-gender">{{ selectedUser.gender === 'male' ? '男' : '女' }}</p>
          </div>

          <div class="profile-actions">
            <button class="profile-btn primary" @click="sayHelloFromProfile">
              <iconify-icon icon="heroicons:hand-raised" width="20"></iconify-icon>
              <span>打招呼</span>
            </button>
            <button class="profile-btn secondary" @click="addFriendFromProfile">
              <iconify-icon icon="heroicons:user-plus" width="20"></iconify-icon>
              <span>加好友</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 打招呼弹窗 -->
    <div v-if="showHelloDialog" class="dialog-overlay" @click="hideHello">
      <div class="hello-dialog" @click.stop>
        <div class="dialog-header">
          <h3>向 {{ selectedUser?.name }} 打招呼</h3>
          <button class="close-btn" @click="hideHello">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="hello-content">
          <div class="hello-templates">
            <h4>快速选择</h4>
            <div class="template-buttons">
              <button
                v-for="template in helloTemplates"
                :key="template"
                class="template-btn"
                @click="selectTemplate(template)"
              >
                {{ template }}
              </button>
            </div>
          </div>

          <div class="hello-input">
            <h4>自定义消息</h4>
            <textarea
              v-model="helloMessage"
              placeholder="输入你想说的话..."
              class="hello-textarea"
              maxlength="200"
            ></textarea>
            <div class="char-count">{{ helloMessage.length }}/200</div>
          </div>

          <div class="hello-actions">
            <button class="hello-btn cancel" @click="hideHello">取消</button>
            <button class="hello-btn send" @click="sendHello" :disabled="!helloMessage.trim()">发送</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选弹窗 -->
    <div v-if="showFilterDialog" class="dialog-overlay" @click="hideFilter">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>筛选条件</h3>
          <button class="close-btn" @click="hideFilter">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="filter-options">
          <div class="filter-group">
            <label>搜索范围</label>
            <div class="range-options">
              <button 
                v-for="range in rangeOptions" 
                :key="range.value"
                class="range-btn"
                :class="{ active: selectedRange === range.value }"
                @click="selectedRange = range.value"
              >
                {{ range.label }}
              </button>
            </div>
          </div>
          
          <div class="filter-group">
            <label>性别</label>
            <div class="gender-options">
              <button 
                v-for="gender in genderOptions" 
                :key="gender.value"
                class="gender-btn"
                :class="{ active: selectedGender === gender.value }"
                @click="selectedGender = gender.value"
              >
                {{ gender.label }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="reset-btn" @click="resetFilter">重置</button>
          <button class="apply-btn" @click="applyFilter">应用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { generateDefaultAvatar } from '../../../shared/utils/userInfo'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(false)
const currentLocation = ref('正在定位...')
const showFilterDialog = ref(false)
const showProfileDialog = ref(false)
const showHelloDialog = ref(false)
const selectedRange = ref(1000) // 默认1公里
const selectedGender = ref('all')
const selectedUser = ref(null)
const helloMessage = ref('')

// 打招呼模板
const helloTemplates = ref([
  '你好，很高兴认识你！',
  'Hi，可以交个朋友吗？',
  '你好，我们聊聊吧！',
  'Hello，很有缘分呢！',
  '你好，想和你做朋友！'
])

// 附近用户数据（从API获取）
const nearbyUsers = ref<any[]>([])
const userLocation = ref<{latitude: number, longitude: number} | null>(null)

const rangeOptions = [
  { value: 500, label: '500米' },
  { value: 1000, label: '1公里' },
  { value: 2000, label: '2公里' },
  { value: 5000, label: '5公里' }
]

const genderOptions = [
  { value: 'all', label: '不限' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' }
]

// 方法
const goBack = () => {
  console.log('附近的人页面返回')

  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/discover')
  }
}

const refreshLocation = () => {
  loading.value = true
  currentLocation.value = '正在定位...'
  
  if (navigator.geolocation) {
    // 配置定位选项
    const options = {
      enableHighAccuracy: true, // 启用高精度定位
      timeout: 10000, // 10秒超时
      maximumAge: 300000 // 5分钟内的缓存位置可用
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // 获取真实位置信息
        const { latitude, longitude } = position.coords
        console.log('定位成功:', latitude, longitude)

        // 保存用户位置
        userLocation.value = { latitude, longitude }

        try {
          console.log('📍 获取到位置坐标:', latitude, longitude)

          // 使用多个地理编码服务，优先使用国内服务
          let locationName = '当前位置'

          // 首先尝试使用腾讯地图API（国内更准确，免费）
          try {
            const tencentResponse = await fetch(`/api/map/geocoder?location=${latitude},${longitude}`)
            const tencentData = await tencentResponse.json()

            if (tencentData.status === 0 && tencentData.result) {
              const address = tencentData.result.formatted_addresses?.recommend || tencentData.result.address
              if (address) {
                locationName = address
                console.log('✅ 腾讯地图定位成功:', locationName)
              }
            }
          } catch (tencentError) {
            console.log('腾讯地图API失败，尝试其他服务')
          }

          // 如果腾讯地图失败，尝试百度地图API
          if (locationName === '当前位置') {
            try {
              // 百度地图API需要有效密钥，暂时跳过
              throw new Error('百度地图API暂时不可用')
              const baiduData = await baiduResponse.json()

              if (baiduData.status === 0 && baiduData.result) {
                locationName = baiduData.result.formatted_address
                console.log('✅ 百度地图定位成功:', locationName)
              }
            } catch (baiduError) {
              console.log('百度地图API失败')
            }
          }

          // 如果国内服务都失败，使用国际服务
          if (locationName === '当前位置') {
            try {
              const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`)
              const data = await response.json()

              if (data.locality || data.city) {
                // 检查是否在中国境内
                if (data.countryCode === 'CN') {
                  locationName = `${data.city || data.locality}, ${data.principalSubdivision || '中国'}`
                } else {
                  locationName = `${data.city || data.locality}, ${data.countryName}`
                }
                console.log('✅ BigDataCloud定位成功:', locationName)
              }
            } catch (bigDataError) {
              console.log('BigDataCloud API失败')
            }
          }

          // 最后尝试OpenStreetMap
          if (locationName === '当前位置') {
            try {
              const osmResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh&addressdetails=1`)
              const osmData = await osmResponse.json()

              if (osmData.display_name) {
                // 提取主要地址信息，优先显示中文
                const address = osmData.address
                if (address) {
                  const parts = []
                  if (address.city || address.town || address.village) {
                    parts.push(address.city || address.town || address.village)
                  }
                  if (address.state) {
                    parts.push(address.state)
                  }
                  if (address.country) {
                    parts.push(address.country)
                  }
                  locationName = parts.join(', ') || osmData.display_name.split(',').slice(0, 3).join(', ')
                }
                console.log('✅ OpenStreetMap定位成功:', locationName)
              }
            } catch (osmError) {
              console.log('OpenStreetMap API失败')
            }
          }

          currentLocation.value = locationName
          console.log('🎯 最终定位结果:', locationName)

        } catch (error) {
          console.error('地址解析失败:', error)
          // 降级显示坐标
          currentLocation.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }

        loading.value = false
        searchNearbyUsers()
      },
      (error) => {
        console.error('定位失败:', error)
        let errorMessage = '定位失败'

        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '定位权限被拒绝'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用'
            break
          case error.TIMEOUT:
            errorMessage = '定位请求超时'
            break
          default:
            errorMessage = '未知定位错误'
            break
        }

        currentLocation.value = errorMessage
        loading.value = false
        appStore.showToast(errorMessage + '，请检查位置权限', 'error')
      },
      options // 添加定位选项
    )
  } else {
    currentLocation.value = '不支持定位'
    loading.value = false
    appStore.showToast('您的浏览器不支持定位功能', 'error')
  }
}

const searchNearbyUsers = async () => {
  if (!userLocation.value) {
    console.log('没有位置信息，无法搜索附近用户')
    return
  }

  loading.value = true

  try {
    // 调用真实API搜索附近用户
    const response = await fetch('/api/nearby/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('yeyu_token') || ''}`
      },
      body: JSON.stringify({
        latitude: userLocation.value.latitude,
        longitude: userLocation.value.longitude,
        radius: selectedRange.value,
        gender: selectedGender.value === 'all' ? null : selectedGender.value
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        nearbyUsers.value = data.users || []
        console.log('✅ 搜索完成，找到', nearbyUsers.value.length, '个附近用户')
      } else {
        console.error('搜索附近用户失败:', data.message)
        nearbyUsers.value = []
      }
    } else {
      console.error('API请求失败:', response.status)
      // API请求失败，显示错误信息
      nearbyUsers.value = []
      console.error('附近用户API请求失败，状态码:', response.status)
    }
  } catch (error) {
    console.error('搜索附近用户错误:', error)
    // 网络错误，显示错误信息
    nearbyUsers.value = []
    console.error('网络错误，无法搜索附近用户')
  } finally {
    loading.value = false
  }
}

// 不再生成模拟数据，返回空数组
const generateMockNearbyUsers = () => {
  console.log('📱 附近的人功能需要真实的位置数据，不返回模拟数据')
  return []
}

// 查看用户资料
const viewUserProfile = (user: any) => {
  selectedUser.value = user
  showProfileDialog.value = true
}

// 打招呼
const sayHello = (user: any) => {
  selectedUser.value = user
  helloMessage.value = helloTemplates.value[0] // 默认第一个模板
  showHelloDialog.value = true
}

// 从资料页面打招呼
const sayHelloFromProfile = () => {
  showProfileDialog.value = false
  helloMessage.value = helloTemplates.value[0]
  showHelloDialog.value = true
}

// 从资料页面加好友
const addFriendFromProfile = () => {
  if (selectedUser.value) {
    appStore.showToast(`已向${selectedUser.value.name}发送好友请求`, 'success')
    showProfileDialog.value = false
  }
}

// 选择打招呼模板
const selectTemplate = (template: string) => {
  helloMessage.value = template
}

// 发送打招呼消息
const sendHello = () => {
  if (selectedUser.value && helloMessage.value.trim()) {
    console.log('发送打招呼消息:', {
      to: selectedUser.value.name,
      message: helloMessage.value
    })

    appStore.showToast(`已向${selectedUser.value.name}发送消息`, 'success')
    hideHello()
  }
}

// 隐藏资料弹窗
const hideProfile = () => {
  showProfileDialog.value = false
  selectedUser.value = null
}

// 隐藏打招呼弹窗
const hideHello = () => {
  showHelloDialog.value = false
  helloMessage.value = ''
}

const showFilter = () => {
  showFilterDialog.value = true
}

const hideFilter = () => {
  showFilterDialog.value = false
}

const resetFilter = () => {
  selectedRange.value = 1000
  selectedGender.value = 'all'
}

const applyFilter = () => {
  console.log('应用筛选:', { range: selectedRange.value, gender: selectedGender.value })
  hideFilter()
  searchNearbyUsers()
  appStore.showToast('筛选条件已应用', 'success')
}

onMounted(() => {
  refreshLocation()
})
</script>

<style scoped>
.nearby-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 0;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
  height: 48px;
}

.back-btn, .filter-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.location-info {
  background: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0;
  border-bottom: 1px solid #f0f0f0;
}

.current-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #333;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background: #f8f8f8;
}

.nearby-list {
  padding: 16px;
  min-height: calc(100vh - 140px);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state p {
  margin: 16px 0 8px 0;
  font-size: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #ccc;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  position: relative;
  margin-right: 12px;
}

.user-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #07C160;
  border: 2px solid white;
  border-radius: 50%;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-distance {
  font-size: 12px;
  color: #07C160;
  margin-bottom: 4px;
}

.user-signature {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-actions {
  margin-left: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #06a552;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  margin: 0 20px;
  max-width: 400px;
  width: 100%;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  color: #666;
}

.filter-options {
  padding: 20px;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.range-options, .gender-options {
  display: flex;
  gap: 8px;
}

.range-btn, .gender-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.range-btn:hover, .gender-btn:hover {
  border-color: #07C160;
}

.range-btn.active, .gender-btn.active {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 0 20px 20px;
}

.reset-btn, .apply-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.reset-btn {
  background: #f0f0f0;
  color: #666;
}

.apply-btn {
  background: #07C160;
  color: white;
}

/* 个人资料弹窗 */
.profile-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.profile-header {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  padding-top: 40px;
}

.profile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: white;
}

.profile-avatar {
  position: relative;
  margin-bottom: 20px;
}

.profile-avatar img {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.profile-info {
  text-align: center;
  margin-bottom: 40px;
}

.profile-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.profile-distance {
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 12px;
}

.profile-signature {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.profile-age, .profile-gender {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.profile-actions {
  display: flex;
  gap: 16px;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-btn.primary {
  background: #07C160;
  color: white;
}

.profile-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.profile-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 打招呼弹窗 */
.hello-dialog {
  background: white;
  border-radius: 12px;
  margin: 20px;
  max-width: 400px;
  width: calc(100% - 40px);
  max-height: 80vh;
  overflow-y: auto;
}

.hello-content {
  padding: 20px;
}

.hello-templates {
  margin-bottom: 24px;
}

.hello-templates h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.template-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-btn {
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.template-btn:hover {
  background: #e8f5e8;
  border-color: #07C160;
}

.hello-input h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.hello-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s ease;
}

.hello-textarea:focus {
  border-color: #07C160;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.hello-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.hello-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hello-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.hello-btn.send {
  background: #07C160;
  color: white;
}

.hello-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.hello-btn:not(:disabled):hover {
  transform: translateY(-1px);
}
</style>
