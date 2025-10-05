<template>
  <div class="my-video-channel">
    <!-- 个人信息区域 -->
    <div class="profile-section">
      <div class="profile-header">
        <!-- 头像和基本信息 -->
        <div class="profile-info">
          <UnifiedAvatar
            :is-current-user="true"
            size="large"
            class="profile-avatar"
          />
          <div class="profile-details">
            <div class="profile-name">{{ currentUserNickname }}</div>
            <div class="profile-location">
              <iconify-icon icon="heroicons:map-pin" width="12" style="color: #999;"></iconify-icon>
              <span>{{ userProfile.location }}</span>
            </div>
          </div>
        </div>

        <!-- 关注数据 -->
        <div class="follow-stats">
          <div class="stat-item">
            <div class="stat-number">{{ userProfile.followers }}</div>
            <div class="stat-label">关注我的</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="publishVideo" class="action-btn primary">
          <iconify-icon icon="heroicons:video-camera" width="20" style="color: white;"></iconify-icon>
          <span>发布视频</span>
        </button>
        <button @click="startLive" class="action-btn secondary">
          <iconify-icon icon="heroicons:signal" width="20" style="color: #333;"></iconify-icon>
          <span>发起直播</span>
        </button>
      </div>

      <!-- 创作者中心入口 -->
      <div class="creator-center-entry">
        <button @click="goToCreatorCenter" class="creator-center-btn">
          <div class="creator-center-icon">
            <iconify-icon icon="heroicons:sparkles" width="24" style="color: #07c160;"></iconify-icon>
          </div>
          <div class="creator-center-info">
            <h4>创作者中心</h4>
            <p>数据分析、内容管理、商业化工具</p>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="20" style="color: #999;"></iconify-icon>
        </button>
      </div>

      <!-- 带货中心入口 -->
      <div class="ecommerce-center-entry">
        <button @click="goToEcommerceCenter" class="ecommerce-center-btn">
          <div class="ecommerce-center-icon">
            <iconify-icon icon="heroicons:shopping-bag" width="24" style="color: #ff6b6b;"></iconify-icon>
          </div>
          <div class="ecommerce-center-info">
            <h4>带货中心</h4>
            <p>商品橱窗、直播带货、订单管理</p>
          </div>
          <div class="hot-badge">热门</div>
          <iconify-icon icon="heroicons:chevron-right" width="20" style="color: #999;"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 双导航栏 -->
    <div class="dual-navigation">
      <!-- 主导航栏 -->
      <div class="main-nav">
        <button
          v-for="nav in mainNavItems"
          :key="nav.key"
          class="nav-item"
          :class="{ active: activeMainNav === nav.key }"
          @click="switchMainNav(nav.key)"
        >
          <iconify-icon :icon="nav.icon" width="20"></iconify-icon>
          <span>{{ nav.label }}</span>
          <span v-if="nav.count > 0" class="nav-count">{{ nav.count }}</span>
        </button>
      </div>

      <!-- 子导航栏 -->
      <div class="sub-nav" v-if="currentSubNavItems.length > 0">
        <button
          v-for="nav in currentSubNavItems"
          :key="nav.key"
          class="sub-nav-item"
          :class="{ active: activeSubNav === nav.key }"
          @click="switchSubNav(nav.key)"
        >
          {{ nav.label }}
          <span v-if="nav.count > 0" class="sub-nav-count">{{ nav.count }}</span>
        </button>
      </div>
    </div>

    <!-- 内容分类标签 -->
    <div class="category-tabs">
      <button 
        v-for="category in categories"
        :key="category.key"
        class="category-tab"
        :class="{ active: activeCategory === category.key }"
        @click="switchCategory(category.key)"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 主页 -->
      <div v-if="activeCategory === 'home'" class="home-content">
        <div class="section-title">最新视频</div>
        <div class="video-grid">
          <div
            v-for="video in recentVideos"
            :key="video.id"
            class="video-item"
            @click="playVideo(video)"
          >
            <div class="video-thumbnail">
              <img :src="video.thumbnail" :alt="video.title" />
              <div class="video-duration">{{ video.duration }}</div>
              <div class="play-icon">
                <iconify-icon icon="heroicons:play" width="24" style="color: white;"></iconify-icon>
              </div>
            </div>
            <div class="video-info">
              <div class="video-title">{{ video.title }}</div>
              <div class="video-stats">
                <span>{{ video.views }}次播放</span>
                <span>{{ formatTime(video.publishTime) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 橱窗商品 -->
        <div class="showcase-section">
          <div class="section-title">橱窗商品</div>
          <div class="showcase-grid">
            <div
              v-for="product in showcaseProducts"
              :key="product.id"
              class="showcase-item"
              @click="viewProduct(product)"
            >
              <div class="showcase-image">
                <img :src="product.image" :alt="product.name" />
                <div class="showcase-tag">橱窗</div>
              </div>
              <div class="showcase-info">
                <div class="showcase-name">{{ product.name }}</div>
                <div class="showcase-price">¥{{ product.price }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 视频 -->
      <div v-if="activeCategory === 'videos'" class="videos-content">
        <div class="video-grid">
          <div 
            v-for="video in allVideos"
            :key="video.id"
            class="video-item"
            @click="playVideo(video)"
          >
            <div class="video-thumbnail">
              <img :src="video.thumbnail" :alt="video.title" />
              <div class="video-duration">{{ video.duration }}</div>
              <div class="play-icon">
                <iconify-icon icon="heroicons:play" width="24" style="color: white;"></iconify-icon>
              </div>
            </div>
            <div class="video-info">
              <div class="video-title">{{ video.title }}</div>
              <div class="video-stats">
                <span>{{ video.views }}次播放</span>
                <span>{{ formatTime(video.publishTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 商品 -->
      <div v-if="activeCategory === 'products'" class="products-content">
        <div class="product-grid">
          <div 
            v-for="product in products"
            :key="product.id"
            class="product-item"
            @click="viewProduct(product)"
          >
            <div class="product-image">
              <img :src="product.image" :alt="product.name" />
              <div class="product-tag">橱窗</div>
            </div>
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">¥{{ product.price }}</div>
              <div class="product-sales">已售{{ product.sales }}件</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 音乐 -->
      <div v-if="activeCategory === 'music'" class="music-content">
        <div class="music-list">
          <div 
            v-for="music in musicList"
            :key="music.id"
            class="music-item"
            @click="playMusic(music)"
          >
            <div class="music-cover">
              <img :src="music.cover" :alt="music.title" />
              <div class="music-play-icon">
                <iconify-icon icon="heroicons:musical-note" width="20" style="color: white;"></iconify-icon>
              </div>
            </div>
            <div class="music-info">
              <div class="music-title">{{ music.title }}</div>
              <div class="music-artist">{{ music.artist }}</div>
              <div class="music-duration">{{ music.duration }}</div>
            </div>
            <button class="music-action-btn">
              <iconify-icon icon="heroicons:play" width="16" style="color: #07C160;"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVideoStore } from '../../../stores/video'
import { useAuthStore } from '../../../stores/auth'
import { useSafeNavigation } from '../../../shared/utils/safeNavigation'

import UnifiedAvatar from '../../../shared/components/common/UnifiedAvatar.vue'
import { useUnifiedAvatar } from '../../../shared/composables/useUnifiedAvatar'

const router = useRouter()
const videoStore = useVideoStore()
const authStore = useAuthStore()
const { safePush } = useSafeNavigation()

// 使用统一用户信息管理
const { currentUserNickname, currentUserYeyuId, currentUserAvatar } = useUnifiedAvatar()

// 用户资料 - 使用真实数据
const userProfile = computed(() => {
  const user = authStore.user
  return {
    name: user?.name || user?.nickname || '用户',
    avatar: user?.avatar || generateAvatar(user?.name || user?.nickname || '用户'),
    location: user?.location || '未设置位置',
    followers: Math.floor(Math.random() * 2000) + 500 // 模拟粉丝数
  }
})

// 生成头像函数
const generateAvatar = (name: string) => {
  const colors = ['#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7']
  const color = colors[name.length % colors.length]
  const initial = name.charAt(0)
  const svgContent = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="${color}"/><text x="30" y="35" text-anchor="middle" fill="white" font-size="20">${initial}</text></svg>`)
  return `data:image/svg+xml,${svgContent}`
}

// 分类标签
const categories = ref([
  { key: 'home', name: '主页' },
  { key: 'videos', name: '视频' },
  { key: 'products', name: '商品' },
  { key: 'music', name: '音乐' }
])

const activeCategory = ref('home')

// 双导航栏数据
const activeMainNav = ref('videos')
const activeSubNav = ref('all')

// 主导航项
const mainNavItems = ref([
  {
    key: 'videos',
    label: '作品',
    icon: 'heroicons:video-camera',
    count: 24
  },
  {
    key: 'live',
    label: '直播',
    icon: 'heroicons:signal',
    count: 3
  },
  {
    key: 'ecommerce',
    label: '带货',
    icon: 'heroicons:shopping-bag',
    count: 12
  },
  {
    key: 'data',
    label: '数据',
    icon: 'heroicons:chart-bar',
    count: 0
  }
])

// 子导航项配置
const subNavConfig = {
  videos: [
    { key: 'all', label: '全部', count: 24 },
    { key: 'published', label: '已发布', count: 20 },
    { key: 'draft', label: '草稿', count: 3 },
    { key: 'reviewing', label: '审核中', count: 1 }
  ],
  live: [
    { key: 'all', label: '全部', count: 3 },
    { key: 'upcoming', label: '预告', count: 1 },
    { key: 'history', label: '历史', count: 2 }
  ],
  ecommerce: [
    { key: 'all', label: '全部', count: 12 },
    { key: 'selling', label: '在售', count: 8 },
    { key: 'sold_out', label: '售罄', count: 2 },
    { key: 'offline', label: '下架', count: 2 }
  ],
  data: []
}

// 计算当前子导航项
const currentSubNavItems = computed(() => {
  return subNavConfig[activeMainNav.value] || []
})

// 最新视频（主页显示6个）
// 使用真实的视频数据
const recentVideos = computed(() => videoStore.recentVideos)

// 所有视频
const allVideos = computed(() => videoStore.myVideos)

// 橱窗商品（主页显示2个）
const showcaseProducts = ref([
  {
    id: '1',
    name: '精选咖啡豆 500g',
    image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23d4a574"/><text x="100" y="100" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">咖啡豆</text></svg>',
    price: 128,
    sales: 256
  },
  {
    id: '2',
    name: '手工陶瓷杯',
    image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23a1887f"/><text x="100" y="100" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">陶瓷杯</text></svg>',
    price: 68,
    sales: 89
  }
])

// 商品列表（商品页面显示全部）
const products = ref([
  ...showcaseProducts.value,
  {
    id: '3',
    name: '有机蜂蜜 250ml',
    image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ffc107"/><text x="100" y="100" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">蜂蜜</text></svg>',
    price: 88,
    sales: 156
  },
  {
    id: '4',
    name: '竹制茶具套装',
    image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23795548"/><text x="100" y="100" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">茶具</text></svg>',
    price: 198,
    sales: 67
  }
])

// 音乐列表
const musicList = ref([
  {
    id: '1',
    title: '夏日清晨',
    artist: '张三',
    cover: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23ffb74d"/><text x="30" y="35" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em">♪</text></svg>',
    duration: '03:45'
  },
  {
    id: '2',
    title: '城市夜景',
    artist: '张三',
    cover: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%237986cb"/><text x="30" y="35" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em">♫</text></svg>',
    duration: '04:20'
  }
])

// 方法
const switchCategory = (category: string) => {
  activeCategory.value = category
}

const publishVideo = () => {
  console.log('📹 发布视频')
  safePush('/video-publish')
}

// 头像加载错误处理
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const user = authStore.user
  img.src = generateAvatar(user?.name || user?.nickname || '用户')
}

const startLive = () => {
  console.log('发起直播')
  // 跳转到直播页面
}

const goToCreatorCenter = () => {
  console.log('🎬 进入创作者中心')
  safePush('/creator-center')
}

const goToEcommerceCenter = () => {
  console.log('🛒 进入带货中心')
  safePush('/ecommerce/center')
}

// 导航切换方法
const switchMainNav = (navKey: string) => {
  activeMainNav.value = navKey
  // 切换主导航时，重置子导航到第一个
  const subNavs = subNavConfig[navKey]
  if (subNavs && subNavs.length > 0) {
    activeSubNav.value = subNavs[0].key
  }
  console.log('切换主导航:', navKey)
}

const switchSubNav = (navKey: string) => {
  activeSubNav.value = navKey
  console.log('切换子导航:', navKey)
}

// 顶部导航方法
const goBack = () => {
  safePush('/profile')
}

const showMenu = () => {
  console.log('显示菜单')
  // 可以添加更多菜单选项
}

const playVideo = (video: any) => {
  console.log('播放视频:', video.title)
  router.push(`/video-player/${video.id}`)
}

const viewProduct = (product: any) => {
  console.log('查看商品:', product.name)
  router.push(`/product-detail/${product.id}`)
}

const playMusic = (music: any) => {
  console.log('播放音乐:', music.title)
  // 播放音乐
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) {
    return '刚刚'
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }
}
</script>

<style scoped>
.my-video-channel {
  min-height: 100vh;
  background: #f8f8f8;
}

/* 自定义顶部导航栏 */
.custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 20;
}

.back-btn,
.menu-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-btn:hover,
.menu-btn:hover {
  background: #f0f0f0;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.profile-section {
  background: white;
  padding: 20px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 30px;
}

.profile-details {
  flex: 1;
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.profile-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.follow-stats {
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #07C160;
  color: white;
}

.action-btn.secondary {
  background: #f0f0f0;
  color: #333;
}

.action-btn:hover {
  opacity: 0.8;
}

/* 创作者中心入口 */
.creator-center-entry {
  margin-top: 16px;
}

.creator-center-btn {
  width: 100%;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.creator-center-btn:hover {
  background: #f8f8f8;
  border-color: #07c160;
}

.creator-center-icon {
  width: 40px;
  height: 40px;
  background: rgba(7, 193, 96, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.creator-center-info {
  flex: 1;
  text-align: left;
}

.creator-center-info h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.creator-center-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

/* 带货中心入口 */
.ecommerce-center-entry {
  margin-top: 12px;
}

.ecommerce-center-btn {
  width: 100%;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.ecommerce-center-btn:hover {
  background: #f8f8f8;
  border-color: #ff6b6b;
}

.ecommerce-center-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ecommerce-center-info {
  flex: 1;
  text-align: left;
}

.ecommerce-center-info h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.ecommerce-center-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.hot-badge {
  position: absolute;
  top: 8px;
  right: 40px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

/* 双导航栏 */
.dual-navigation {
  background: white;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 76px;
  z-index: 10;
}

.main-nav {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.nav-item.active {
  color: #07c160;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: #07c160;
  border-radius: 1px;
}

.nav-item span {
  font-size: 12px;
  font-weight: 500;
}

.nav-count {
  position: absolute;
  top: 4px;
  right: 8px;
  background: #ff4757;
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 14px;
}

.sub-nav {
  display: flex;
  overflow-x: auto;
  padding: 0 16px;
  gap: 8px;
}

.sub-nav::-webkit-scrollbar {
  display: none;
}

.sub-nav-item {
  flex-shrink: 0;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
}

.sub-nav-item.active {
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
  font-weight: 500;
}

.sub-nav-count {
  margin-left: 4px;
  background: rgba(7, 193, 96, 0.2);
  color: #07c160;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 14px;
}

.category-tabs {
  background: white;
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.category-tab {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.category-tab.active {
  color: #07C160;
}

.category-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #07C160;
}

.content-area {
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 16px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.video-item {
  cursor: pointer;
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.video-item:hover .play-icon {
  opacity: 1;
}

.video-info {
  padding: 0 4px;
}

.video-title {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-stats {
  font-size: 10px;
  color: #999;
  display: flex;
  justify-content: space-between;
}

.showcase-section {
  margin-top: 24px;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.showcase-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.showcase-item:hover {
  transform: translateY(-2px);
}

.showcase-image {
  position: relative;
  aspect-ratio: 1;
}

.showcase-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.showcase-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #07C160;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.showcase-info {
  padding: 12px;
}

.showcase-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.showcase-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4444;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.product-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.product-item:hover {
  transform: translateY(-2px);
}

.product-image {
  position: relative;
  aspect-ratio: 1;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #07C160;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4444;
  margin-bottom: 4px;
}

.product-sales {
  font-size: 12px;
  color: #999;
}

.music-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.music-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.music-item:last-child {
  border-bottom: none;
}

.music-item:hover {
  background: #f8f8f8;
}

.music-cover {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-info {
  flex: 1;
}

.music-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.music-artist {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.music-duration {
  font-size: 10px;
  color: #999;
}

.music-action-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.music-action-btn:hover {
  background: #f0f0f0;
}
</style>
