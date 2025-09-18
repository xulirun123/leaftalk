<template>
  <div class="user-video-channel">

    <!-- 用户信息区域 -->
    <div class="user-section">
      <div class="user-info">
        <div class="user-avatar">
          <img
            :src="userInfo.avatar || generateAvatar(userInfo.name)"
            :alt="userInfo.name"
            class="avatar-image"
            @error="handleAvatarError"
          />
        </div>
        <div class="user-details">
          <h2 class="user-name">{{ userInfo.name }}</h2>
          <p class="welcome-text">{{ userInfo.welcomeText }}</p>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn" :class="{ followed: userInfo.isFollowed }" @click="toggleFollow">
          {{ userInfo.isFollowed ? '已关注' : '关注' }}
        </button>
        <button class="action-btn secondary" @click="sendMessage">
          私信
        </button>
      </div>
    </div>

    <!-- 橱窗商品 -->
    <div v-if="showcaseProducts.length > 0" class="showcase-section">
      <h3 class="section-title">橱窗商品</h3>
      <div class="showcase-products">
        <div
          v-for="product in showcaseProducts"
          :key="product.id"
          class="product-item"
          @click="viewProduct(product)"
        >
          <div class="product-image-placeholder">商品</div>
          <div class="product-info">
            <p class="product-name">{{ product.name }}</p>
            <p class="product-price">¥{{ product.price }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="tab in categoryTabs"
        :key="tab.key"
        class="category-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 主页 -->
      <div v-if="activeTab === 'home'" class="tab-content">
        <div class="latest-videos-section">
          <h4 class="content-title">最新视频</h4>
          <div class="videos-grid">
            <div
              v-for="video in latestVideos"
              :key="video.id"
              class="video-item"
              @click="playVideo(video)"
            >
              <div class="video-thumbnail">
                <div class="thumbnail-placeholder">视频</div>
                <div class="video-duration">{{ video.duration }}</div>
              </div>
              <p class="video-title">{{ video.title }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 视频 -->
      <div v-if="activeTab === 'videos'" class="tab-content">
        <div class="videos-grid">
          <div
            v-for="video in allVideos"
            :key="video.id"
            class="video-item"
            @click="playVideo(video)"
          >
            <div class="video-thumbnail">
              <div class="thumbnail-placeholder">视频</div>
              <div class="video-duration">{{ video.duration }}</div>
            </div>
            <p class="video-title">{{ video.title }}</p>
          </div>
        </div>
      </div>

      <!-- 商品 -->
      <div v-if="activeTab === 'products'" class="tab-content">
        <div class="products-header">
          <h4 class="content-title">商品</h4>
          <button class="view-all-btn" @click="viewAllProducts">全部</button>
        </div>
        <div class="products-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
            @click="viewProduct(product)"
          >
            <div class="product-image-placeholder">商品</div>
            <div class="product-info">
              <p class="product-name">{{ product.name }}</p>
              <p class="product-price">¥{{ product.price }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 音乐 -->
      <div v-if="activeTab === 'music'" class="tab-content">
        <div class="music-list">
          <div
            v-for="music in musicTracks"
            :key="music.id"
            class="music-item"
            @click="playMusic(music)"
          >
            <div class="music-cover">
              <div class="cover-placeholder">♪</div>
              <div class="play-icon">
                <iconify-icon icon="heroicons:play" width="16" style="color: white;"></iconify-icon>
              </div>
            </div>
            <div class="music-info">
              <p class="music-title">{{ music.title }}</p>
              <p class="music-artist">{{ music.artist }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 响应式数据
const activeTab = ref('home')
const userInfo = ref({
  id: '',
  name: '',
  welcomeText: '欢迎来到我的视频号！',
  isFollowed: false,
  followerCount: 0
})

const categoryTabs = [
  { key: 'home', name: '主页' },
  { key: 'videos', name: '视频' },
  { key: 'products', name: '商品' },
  { key: 'music', name: '音乐' }
]

const showcaseProducts = ref([
  {
    id: '1',
    name: '精选商品1',
    price: 99.99
  },
  {
    id: '2',
    name: '精选商品2',
    price: 199.99
  }
])

const latestVideos = ref([
  {
    id: '1',
    title: '最新视频1',
    duration: '2:30'
  },
  {
    id: '2',
    title: '最新视频2',
    duration: '1:45'
  },
  {
    id: '3',
    title: '最新视频3',
    duration: '3:20'
  },
  {
    id: '4',
    title: '最新视频4',
    duration: '1:20'
  },
  {
    id: '5',
    title: '最新视频5',
    duration: '2:10'
  },
  {
    id: '6',
    title: '最新视频6',
    duration: '3:45'
  }
])

const allVideos = ref(latestVideos.value)
const products = ref(showcaseProducts.value)
const musicTracks = ref([
  {
    id: '1',
    title: '背景音乐1',
    artist: '艺术家1'
  },
  {
    id: '2',
    title: '背景音乐2',
    artist: '艺术家2'
  }
])

// 方法（移除goBack，使用全局导航栏）

// 生成头像
const generateAvatar = (name: string): string => {
  if (!name) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
}

// 处理头像加载错误
const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = generateAvatar(userInfo.value.name)
}

const toggleFollow = () => {
  userInfo.value.isFollowed = !userInfo.value.isFollowed
  console.log('关注状态:', userInfo.value.isFollowed)
}

const sendMessage = async () => {
  try {
    console.log('发送视频号私信给:', userInfo.value.name)

    // 导入自定义弹窗
    const { showAlert, showConfirm } = await import('../../utils/dialog')

    // 检查是否已经发送过私信且未回复
    const hasUnrepliedMessage = await checkUnrepliedMessage(userInfo.value.id)

    if (hasUnrepliedMessage) {
      await showAlert('您已向该用户发送过私信，请等待对方回复后再发送新消息', '提示')
      return
    }

    // 显示发送私信确认
    const confirmed = await showConfirm({
      title: '发送私信',
      content: `确定要向 ${userInfo.value.name} 发送私信吗？\n\n注意：对方回复前只能发送一条私信`,
      confirmText: '发送',
      cancelText: '取消'
    })

    if (confirmed) {
      // 跳转到视频号私信聊天页面
      router.push(`/video-chat/${userInfo.value.id}?type=video_channel`)
    }
  } catch (error) {
    console.error('发送私信失败:', error)
    const { showAlert } = await import('../../utils/dialog')
    await showAlert('发送私信失败，请稍后重试', '错误')
  }
}

// 检查是否有未回复的私信
const checkUnrepliedMessage = async (userId: string): Promise<boolean> => {
  try {
    // 这里应该调用API检查是否有未回复的私信
    // 现在返回false，表示可以发送
    return false
  } catch (error) {
    console.error('检查私信状态失败:', error)
    return false
  }
}

const viewProduct = (product: any) => {
  console.log('查看商品:', product)
  router.push(`/product/${product.id}`)
}

const playVideo = (video: any) => {
  console.log('播放视频:', video)
  router.push(`/video-player/${video.id}`)
}

const playMusic = (music: any) => {
  console.log('播放音乐:', music)
}

const viewAllProducts = () => {
  router.push(`/user-shop/${userInfo.value.id}`)
}

onMounted(async () => {
  const userId = route.params.id as string
  console.log('加载用户视频号页面:', userId)

  // 从API获取真实用户信息
  await loadUserInfo(userId)
})

// 加载用户信息
const loadUserInfo = async (userId: string) => {
  try {
    const token = localStorage.getItem('yeyu_auth_token') || localStorage.getItem('token') || ''
    const response = await fetch(`http://127.0.0.1:8893/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    if (result.success && result.data) {
      const user = result.data
      userInfo.value = {
        id: user.id,
        name: user.nickname || user.name || user.username,
        avatar: user.avatar || generateAvatar(user.nickname || user.name || user.username),
        welcomeText: `欢迎来到 ${user.nickname || user.name || user.username} 的视频号！`,
        isFollowed: false, // 这里应该从API获取关注状态
        followerCount: 0 // 这里应该从API获取粉丝数
      }
      console.log('✅ 用户视频号信息加载成功:', userInfo.value)
    } else {
      console.error('❌ 获取用户信息失败:', result.message)
      // 使用默认信息
      userInfo.value = {
        id: userId,
        name: '用户',
        welcomeText: '欢迎来到我的视频号！',
        isFollowed: false,
        followerCount: 0
      }
    }
  } catch (error) {
    console.error('❌ 加载用户信息异常:', error)
    // 使用默认信息
    userInfo.value = {
      id: userId,
      name: '用户',
      welcomeText: '欢迎来到我的视频号！',
      isFollowed: false,
      followerCount: 0
    }
  }
}
</script>

<style scoped>
.user-video-channel {
  min-height: 100vh;
  background: #000;
  color: white;
}

/* 移除自创导航栏样式，使用全局导航栏 */

.user-section {
  padding: 20px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 80px;
  height: 80px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: 600;
  border: 3px solid white;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.welcome-text {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px 24px;
  border: 2px solid white;
  border-radius: 25px;
  background: transparent;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.followed {
  background: white;
  color: #333;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
}

.showcase-section {
  background: white;
  color: #333;
  padding: 16px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.showcase-products {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.product-item {
  min-width: 120px;
  cursor: pointer;
}

.product-image-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.product-info {
  margin-top: 8px;
}

.product-name {
  font-size: 14px;
  margin: 0 0 4px 0;
}

.product-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4444;
  margin: 0;
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
  background: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.category-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
}

.content-area {
  background: white;
  color: #333;
  min-height: 400px;
}

.tab-content {
  padding: 16px;
}

.content-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.video-item {
  cursor: pointer;
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 9/16;
  border-radius: 8px;
  overflow: hidden;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-title {
  font-size: 12px;
  margin: 8px 0 0 0;
  line-height: 1.3;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.view-all-btn {
  background: none;
  border: none;
  color: #07c160;
  font-size: 14px;
  cursor: pointer;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  cursor: pointer;
}

.music-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.music-cover {
  position: relative;
  width: 60px;
  height: 60px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 20px;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-info {
  flex: 1;
}

.music-title {
  font-size: 16px;
  margin: 0 0 4px 0;
}

.music-artist {
  font-size: 14px;
  color: #666;
  margin: 0;
}
</style>
