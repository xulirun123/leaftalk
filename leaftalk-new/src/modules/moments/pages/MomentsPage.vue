<template>
  <div class="moments-page">
    <!-- 朋友圈封面 -->
    <div class="moments-cover">
      <div class="cover-image">
        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop" alt="朋友圈封面" />

        <!-- 返回按钮（左上角） -->
        <button class="back-button" @click="goBack">
          <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
        </button>

        <!-- 用户信息（右侧） -->
        <div class="user-info-right">
          <div class="user-details">
            <div class="user-name">{{ userName }}</div>
            <div class="user-signature">{{ userSignature }}</div>
          </div>
          <div class="user-avatar">
            <img :src="userAvatar" :alt="userName" />
          </div>
        </div>
      </div>
    </div>

    <!-- 发布动态按钮 - 仅在个人朋友圈显示 -->
    <div v-if="pageMode === 'personal'" class="publish-section">
      <button class="publish-button" @click="goToPublish">
        <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        发布动态
      </button>
    </div>

    <!-- 朋友圈动态列表 -->
    <div class="moments-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="moments.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:photo" width="48"></iconify-icon>
        <p>{{ getEmptyStateText() }}</p>
        <button v-if="pageMode === 'personal'" class="publish-first-button" @click="goToPublish">
          <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
          发布第一条动态
        </button>
      </div>

      <div v-else class="moments-list">
        <div v-for="moment in moments" :key="moment.id" class="moment-card">
          <div class="moment-header">
            <img :src="moment.author_avatar" alt="头像" class="author-avatar" />
            <div class="author-info">
              <h4>{{ moment.author_name }}</h4>
              <p>{{ formatTime(moment.created_at) }}</p>
            </div>
          </div>

          <div class="moment-body">
            <p class="moment-text">{{ moment.content }}</p>

            <div v-if="moment.images?.length" class="moment-images">
              <img
                v-for="(image, index) in moment.images"
                :key="index"
                :src="image"
                alt="图片"
                class="moment-image"
              />
            </div>

            <div v-if="moment.location" class="moment-location">
              <iconify-icon icon="heroicons:map-pin" width="14"></iconify-icon>
              <span>{{ moment.location }}</span>
            </div>
          </div>

          <div class="moment-footer">
            <div class="moment-actions">
              <button @click="toggleLike(moment)" class="action-btn">
                <iconify-icon
                  :icon="moment.is_liked ? 'heroicons:heart-solid' : 'heroicons:heart'"
                  width="18"
                  :style="{ color: moment.is_liked ? '#ff4757' : '#666' }"
                ></iconify-icon>
                <span>{{ moment.like_count }}</span>
              </button>

              <button @click="toggleComments(moment)" class="action-btn">
                <iconify-icon icon="heroicons:chat-bubble-left" width="18"></iconify-icon>
                <span>{{ moment.comment_count }}</span>
              </button>

              <button @click="shareMoment(moment)" class="action-btn">
                <iconify-icon icon="heroicons:share" width="18"></iconify-icon>
              </button>
            </div>

            <!-- 编辑删除按钮 - 仅在个人朋友圈且是自己的动态时显示 -->
            <div v-if="pageMode === 'personal' && moment.author_id === authStore.user?.id" class="moment-manage">
              <button @click="editMoment(moment)" class="manage-btn edit-btn">
                <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
                编辑
              </button>
              <button @click="deleteMoment(moment)" class="manage-btn delete-btn">
                <iconify-icon icon="heroicons:trash" width="16"></iconify-icon>
                删除
              </button>
            </div>
          </div>

          <!-- 评论区域 -->
          <div v-if="moment.showComments" class="comments-section">
            <!-- 现有评论列表 -->
            <div v-if="moment.comments && moment.comments.length > 0" class="comments-list">
              <div v-for="comment in moment.comments" :key="comment.id" class="comment-item">
                <img :src="comment.avatar || userAvatar" alt="头像" class="comment-avatar" />
                <span class="comment-content">{{ comment.content }}</span>
              </div>
            </div>

            <!-- 评论输入框 -->
            <div class="comment-input-section">
              <input
                v-model="moment.newComment"
                type="text"
                placeholder="写评论..."
                class="comment-input"
                @keyup.enter="submitComment(moment)"
              />
              <button @click="submitComment(moment)" class="send-btn" :disabled="!moment.newComment?.trim()">
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
<!--
//   - 
const timeString = ref('')
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const batteryLevel = ref(1)
let clockTimer: any = null

const startStatusBar = async () => {
  timeString.value = formatStatusTime()
  if (clockTimer) clearInterval(clockTimer)
  clockTimer = setInterval(() => { timeString.value = formatStatusTime() }, 30000)

  // 
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })

  // 
  try {
    const nav: any = navigator
    if (nav && typeof nav.getBattery === 'function') {
      const battery = await nav.getBattery()
      const setBattery = () => { batteryLevel.value = battery.level }
      setBattery()
      battery.addEventListener('levelchange', setBattery)
    } else {
      batteryLevel.value = 0.85 // fallback
    }
  } catch {
    batteryLevel.value = 0.85
  }
-->

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import { useUnifiedAvatar } from '../../../shared/composables/useUnifiedAvatar'
import { apiClient } from '../../../shared/services/apiClient'

console.log('📄 朋友圈页面脚本开始执行')

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// 使用统一头像系统
const { getUserAvatarUrl } = useUnifiedAvatar()

// 仿系统状态栏（时间/网络/电量）— 顶层统一逻辑
const timeString = ref('')
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const batteryLevel = ref(1)
let coverClockTimer: any = null

const formatStatusTime = () => {
  const d = new Date()
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const startCoverStatusBar = async () => {
  timeString.value = formatStatusTime()
  if (coverClockTimer) clearInterval(coverClockTimer)
  coverClockTimer = setInterval(() => { timeString.value = formatStatusTime() }, 30000)

  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })

  try {
    const nav: any = navigator
    if (nav && typeof nav.getBattery === 'function') {
      const battery = await nav.getBattery()
      const setBattery = () => { batteryLevel.value = battery.level }
      setBattery()
      battery.addEventListener('levelchange', setBattery)
    } else {
      batteryLevel.value = 0.85
    }
  } catch {
    batteryLevel.value = 0.85
  }
}

onMounted(() => {
  startCoverStatusBar()
})

const loading = ref(true)
const moments = ref<any[]>([])

// 页面模式判断
const pageMode = computed(() => {
  const path = route.path
  const userId = route.params.userId as string

  if (path === '/moments') {
    return 'feed' // 朋友圈动态流
  } else if (path.includes('/personal-moments') || userId === 'me' || userId === authStore.user?.id) {
    return 'personal' // 个人朋友圈
  } else if (userId) {
    return 'friend' // 好友朋友圈
  }
  return 'feed' // 默认为动态流
})

// 当前查看的用户信息
const viewingUserId = computed(() => {
  const userId = route.params.userId as string
  if (pageMode.value === 'personal' || userId === 'me') {
    return authStore.user?.id
  }
  return userId || authStore.user?.id
})



// 页面标题
const pageTitle = computed(() => {
  switch (pageMode.value) {
    case 'feed':
      return '朋友圈'
    case 'personal':
      return '我的朋友圈'
    case 'friend':
      return `${viewingUserName.value}的朋友圈`
    default:
      return '朋友圈'
  }
})

// 用户信息 - 优先使用appStore，fallback到authStore
const friendUser = ref<any | null>(null)

const userName = computed(() => {
  if (pageMode.value === 'friend' && friendUser.value) {
    return friendUser.value.nickname || friendUser.value.username || `用户${viewingUserId.value}`
  }
  const user = appStore.user || authStore.user
  return user?.nickname || user?.username || '叶语用户'
})
const userAvatar = computed(() => {
  if (pageMode.value === 'friend' && friendUser.value) {
    return friendUser.value.avatar || getUserAvatarUrl(friendUser.value) || '/default-avatar.png'
  }
  const user = appStore.user || authStore.user


  return user?.avatar || getUserAvatarUrl(user) || '/default-avatar.png'
})

// 当前查看用户的信息
const viewingUserName = computed(() => {
  if (pageMode.value === 'personal') {
    return userName.value
  }
  // TODO: 从用户数据中获取好友信息
  return '好友'
})

// 获取空状态文本
const getEmptyStateText = () => {
  switch (pageMode.value) {
    case 'feed':


      return '暂无朋友圈动态'
    case 'personal':
      return '还没有发布过朋友圈'
    case 'friend':
      return 'TA还没有发布过朋友圈'
    default:
      return '暂无朋友圈动态'
  }
}

const viewingUserAvatar = computed(() => {
  return userAvatar.value
})
const userSignature = computed(() => {
  if (pageMode.value === 'friend' && friendUser.value) {
    const sig = friendUser.value.signature
    return (typeof sig === 'string' ? sig : '') || '分享生活的美好时刻'
  }
  return authStore.user?.signature || '分享生活的美好时刻'
})




// 加载当前查看（好友）用户信息，用于封面右侧昵称/头像/签名
const fetchViewingUser = async () => {
  try {
    if (pageMode.value !== 'friend') return
    const uid = viewingUserId.value
    if (!uid) return
    const r = await apiClient.get<any>(`/users/${uid}`)
    if (r?.success && r.data) {
      friendUser.value = r.data
    }
  } catch (e) {
    console.warn('加载好友资料失败:', e)
  }
}

console.log('🔧 朋友圈页面响应式数据初始化完成')

const goBack = () => {
  // 尝试返回上一页，如果没有历史记录则跳转到发现页面
  if (window.history.length > 1) {

    router.back()
  } else {
    router.push('/discover')
  }
}

const goToPublish = () => {
  // 跳转到发布动态页面
  router.push('/publish-moment')
}

// 编辑动态
const editMoment = (moment: any) => {
  console.log('编辑动态:', moment.id)
  // 跳转到编辑页面，传递动态ID
  router.push(`/edit-moment/${moment.id}`)
}

// 删除动态
const deleteMoment = async (moment: any) => {
  if (!confirm('确定要删除这条动态吗？')) {
    return
  }

  try {
    console.log('删除动态:', moment.id)
    // TODO: 调用删除API
    // await momentsAPI.deleteMoment(moment.id)

    // 从列表中移除
    const index = moments.value.findIndex(m => m.id === moment.id)
    if (index > -1) {
      moments.value.splice(index, 1)
    }

    console.log('✅ 动态删除成功')
  } catch (error) {
    console.error('❌ 删除动态失败:', error)
    alert('删除失败，请重试')
  }
}

const loadMoments = async () => {
  try {
    loading.value = true
    // 确保有有效的令牌
    const hasValidToken = await authStore.ensureValidToken()
    if (!hasValidToken) {
      throw new Error('无法获取有效的访问令牌')
    }

    const token = authStore.token
    console.log('🔑 使用authStore令牌:', !!token)

    console.log(`🔄 开始加载朋友圈数据... 模式: ${pageMode.value}`)
    console.log('🔑 使用令牌:', token)

    // 根据页面模式构建不同的API URL
    let apiUrl = 'http://localhost:8893/api/moments'
    if (pageMode.value === 'personal') {
      apiUrl = 'http://localhost:8893/api/moments/personal' // 个人朋友圈
    } else if (pageMode.value === 'friend') {
      apiUrl = `http://localhost:8893/api/moments/user/${viewingUserId.value}` // 好友朋友圈
    }
    // pageMode === 'feed' 使用默认的朋友圈动态流

    const response = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    console.log('📡 API响应状态:', response.status, response.statusText)

    if (response.ok) {
      const result = await response.json()
      console.log('📊 API响应数据:', result)

      if (result.success) {
        moments.value = result.data.moments || []
        console.log('✅ 朋友圈数据加载成功，共', moments.value.length, '条动态')
      } else {
        console.warn('⚠️ API返回失败状态:', result)
      }
    } else {
      console.error('❌ API请求失败:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('❌ 错误详情:', errorText)
    }
  } catch (error) {
    console.error('❌ 加载朋友圈失败:', error)
    if (error instanceof Error) {
      console.error('❌ 错误堆栈:', error.stack)
    }
  } finally {
    loading.value = false
    console.log('🏁 朋友圈加载完成')
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString()
}

const toggleLike = (moment: any) => {
  moment.is_liked = !moment.is_liked
  moment.like_count += moment.is_liked ? 1 : -1
}

const toggleComments = (moment: any) => {
  // 切换评论区域显示/隐藏
  moment.showComments = !moment.showComments

  // 初始化评论相关数据
  if (!moment.comments) {
    moment.comments = []
  }
  if (!moment.newComment) {
    moment.newComment = ''
  }
}

const submitComment = (moment: any) => {
  const comment = moment.newComment?.trim()
  if (!comment) return

  // 添加评论
  if (!moment.comments) {
    moment.comments = []
  }

  moment.comments.push({
    id: Date.now(),
    author: userName.value,
    avatar: userAvatar.value,
    content: comment,
    created_at: new Date().toISOString()
  })

  moment.comment_count = (moment.comment_count || 0) + 1
  moment.newComment = '' // 清空输入框

  console.log('添加评论成功:', comment)
}



const shareMoment = (moment: any) => {
  // 简单的分享功能
  if (navigator.share) {
    navigator.share({
      title: '朋友圈动态',
      text: moment.content,
      url: window.location.href
    })
  } else {
    // 降级方案：复制到剪贴板
    navigator.clipboard.writeText(moment.content).then(() => {
      alert('动态内容已复制到剪贴板')
    }).catch(() => {
      console.log('分享动态:', moment)
    })
  }
}

const initUser = () => {
  console.log('👤 初始化用户状态...')

  authStore.initAuth()
  console.log('🔍 认证store状态:', authStore.user)

  if (!authStore.user) {
    console.log('⚠️ 没有用户信息，设置默认用户')
    // 直接设置token和user值
    authStore.token = 'default'
    authStore.user = {
      id: '1',
      yeyu_id: 'YYJRCW9U2X',
      username: 'YYJRCW9U2X',
      nickname: '叶语用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YYJRCW9U2X&backgroundColor=b6e3f4',
      phone: '13800138000'
    }
    console.log('✅ 默认用户设置完成')
  } else {
    console.log('✅ 用户信息已存在:', authStore.user.nickname)
  }
}

onMounted(() => {
  console.log('🎯 朋友圈页面已挂载')
  console.log('🔍 当前路径:', window.location.pathname)

  initUser()
  if (pageMode.value === 'friend') {
    fetchViewingUser()
  }
  loadMoments()
})
</script>

<style scoped>
.moments-page {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
}

/* 朋友圈封面 */
.moments-cover {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.cover-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 返回按钮 */
.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}
.back-button:hover { background: rgba(0, 0, 0, 0.5); }

/* 仿系统状态栏覆盖在封面顶部 */
.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 25px; /* 按你规范的状态栏高度 */
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  z-index: 11;
  pointer-events: none; /* 不拦截点击（返回按钮可点） */
}
.status-bar .sb-left .time { font-size: 12px; letter-spacing: 0.5px; }
.status-bar .sb-right { display: flex; align-items: center; gap: 8px; }
/* 信号条 */
.status-bar .signal i {
  display: inline-block;
  width: 3px;
  margin-left: 2px;
  background: #fff;
  opacity: 0.9;
  border-radius: 1px;
  vertical-align: bottom;
}
.status-bar .signal.offline i { opacity: 0.3; }
/* WiFi 简化符号 */
.status-bar .wifi i {
  display: inline-block;
  width: 14px;
  height: 10px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-left-color: transparent;
  transform: rotate(45deg);
  border-radius: 0 50% 0 0;
  opacity: 0.9;
}
.status-bar .wifi.offline i { opacity: 0.3; }
/* 电量 */
.status-bar .battery { display: inline-flex; align-items: center; gap: 2px; }
.status-bar .battery .cap { display: inline-block; width: 2px; height: 8px; background: #fff; border-radius: 1px; }
.status-bar .battery .level { display: inline-block; width: 20px; height: 10px; border: 2px solid #fff; border-radius: 2px; overflow: hidden; }
.status-bar .battery .level b { display: block; height: 100%; background: #fff; }

/* 相机按钮（左下角） */
.camera-button {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.camera-button:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* 用户信息（右侧） */
.user-info-right {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  /* 头像在右侧：昵称在左，头像在右 */
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 3px solid white;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right; /* 文本右对齐 */
}

.user-name {
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  margin-bottom: 4px;
}

.user-signature {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

/* 发布动态按钮 */
.publish-section {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.publish-button {
  width: 100%;
  padding: 12px 16px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.publish-button:hover {
  background: #06AD56;
}

.publish-first-button {
  margin-top: 16px;
  padding: 10px 20px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.publish-first-button:hover {
  background: #06AD56;
}

.user-cover-section {
  margin-top: 0;
  background: white;
  margin-bottom: 8px;
  position: relative;
}

.cover-image {
  height: 200px;
  position: relative;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-buttons {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 25px 16px 0;
  height: 75px;
  z-index: 10;
}

.floating-btn {
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  transition: background-color 0.2s;
}

.floating-btn:hover {
  background: rgba(0, 0, 0, 0.5);
}

.user-profile {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 3px solid white;
}

.user-info {
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.user-info h3 {
  font-size: 18px;
  margin: 0 0 4px 0;
}

.user-info p {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.moments-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 100px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.moment-card {
  background: white;
  margin-bottom: 8px;
  padding: 16px;
}

.moment-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
}

.author-info h4 {
  font-size: 16px;
  margin: 0 0 4px 0;
  color: #333;
}

.author-info p {
  font-size: 12px;
  margin: 0;
  color: #999;
}

.moment-text {
  font-size: 15px;
  line-height: 1.5;
  color: #333;
  margin: 0 0 12px 0;
}

.moment-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

.moment-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
}

.moment-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.moment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.moment-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.moment-manage {
  display: flex;
  align-items: center;
  gap: 8px;
}

.manage-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  border-color: #07C160;
  color: #07C160;
}

.delete-btn:hover {
  border-color: #ff4757;
  color: #ff4757;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
}

.action-btn:hover {
  opacity: 0.7;
}

.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.comments-list {
  margin-bottom: 12px;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.4;
  gap: 8px;
}

.comment-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  flex-shrink: 0;
}

.comment-content {
  color: #333;
  flex: 1;
}

.comment-input-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.comment-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background: #f8f8f8;
}

.comment-input:focus {
  border-color: #07c160;
  background: white;
}

.send-btn {
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  min-width: 60px;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: #05a850;
}

/* 发布选项弹窗 */
.publish-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.publish-dialog {
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
}

.publish-options {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.publish-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f8f8f8;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.publish-option:hover {
  background: #f0f0f0;
}

.cancel-btn {
  width: 100%;
  padding: 16px;
  background: #f8f8f8;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #f0f0f0;
}

/* 发布页面 */
.publish-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.cancel-publish {
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
}

.publish-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.confirm-publish {
  background: #07c160;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.confirm-publish:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.publish-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.publish-textarea {
  width: 100%;
  min-height: 120px;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  background: transparent;
}

.publish-textarea::placeholder {
  color: #999;
}

/* 图片预览 */
.image-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 16px 0;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-image {
  aspect-ratio: 1;
  border: 2px dashed #ddd;
  border-radius: 8px;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
}

.add-image:hover {
  border-color: #07c160;
  color: #07c160;
}

/* 功能选项 */
.publish-functions {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  margin-top: 16px;
}

.function-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 0;
  background: none;
  border: none;
  text-align: left;
  font-size: 16px;
  color: #333;
  cursor: pointer;
}

.function-btn:hover {
  background: #f8f8f8;
}
</style>
