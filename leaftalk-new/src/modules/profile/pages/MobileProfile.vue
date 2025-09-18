<template>
  <div class="mobile-profile">
    <!-- 个人信息 -->
    <div class="profile-content">
      <div class="profile-header">
        <div class="profile-info" @click="editProfile">
          <UnifiedAvatar
            :is-current-user="true"
            size="medium"
            clickable
            class="profile-avatar"
          />
          <div class="profile-details">
            <h3 class="profile-name">{{ currentUserNickname }}</h3>
            <p class="profile-id">叶语号: {{ currentUserYeyuId }}</p>
          </div>
          <div class="profile-actions">
            <button class="qr-btn" @click.stop="showMyQRCode" :title="$t('profile.myQRCode')">
              <iconify-icon icon="heroicons:qr-code" width="20" style="color: #333;"></iconify-icon>
            </button>
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 功能列表 -->
      <div class="function-list">
        <div class="function-section">
          <div class="function-item" @click="goToServices">
            <iconify-icon icon="heroicons:squares-2x2" width="24" style="color: #07c160;"></iconify-icon>
            <span>{{ $t('profile.services') }}</span>
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
          </div>
        </div>

        <div class="function-section">
          <div class="function-item" @click="goToFavorites">
            <iconify-icon icon="heroicons:star" width="24" style="color: #07c160;"></iconify-icon>
            <span>{{ $t('profile.favorites') }}</span>
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
          </div>
          <div class="function-item" @click="goToMoments">
            <iconify-icon icon="heroicons:camera" width="24" style="color: #07c160;"></iconify-icon>
            <span>{{ $t('profile.moments') }}</span>
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
          </div>
          <div class="function-item" @click="goToVideoChannel">
            <iconify-icon icon="heroicons:video-camera" width="24" style="color: #07c160;"></iconify-icon>
            <span>{{ $t('profile.videoChannel') }}</span>
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
          </div>

          <div class="function-item" @click="goToEmoji">
            <iconify-icon icon="heroicons:face-smile" width="24" style="color: #07c160;"></iconify-icon>
            <span>{{ $t('profile.stickers') }}</span>
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
          </div>
        </div>

        <div class="function-section">
          <div class="function-item" @click="goToSettings">
            <iconify-icon icon="heroicons:cog-6-tooth" width="24" style="color: #07c160;"></iconify-icon>
            <span>{{ $t('profile.settings') }}</span>
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
          </div>
        </div>


      </div>
    </div>

    <!-- 底部导航栏 -->
    <MobileTabBar />


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { userAPI } from '../../auth/services/api'
import MobileTabBar from '../../../shared/components/mobile/MobileTabBar.vue'
import UnifiedAvatar from '../../../shared/components/common/UnifiedAvatar.vue'
import { useUnifiedAvatar } from '../composables/useUnifiedAvatar'
import { getUserInfo, formatUserDisplayName, formatYeyuIdDisplay, getUserAvatarUrl } from '../../../shared/utils/userInfo'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

// 使用统一用户信息管理
const { getUserAvatarUrl } = useUnifiedAvatar()

// 当前用户信息
const currentUserNickname = computed(() => {
  // 优先级：appStore > localStorage > 默认值
  return appStore.user?.nickname ||
         appStore.user?.name ||
         userInfo.value.nickname ||
         userInfo.value.name ||
         '叶语用户'
})

const currentUserYeyuId = computed(() => {
  // 优先级：appStore > localStorage > 默认值，支持多种字段名
  return appStore.user?.yeyu_id ||
         appStore.user?.yeyuId ||
         appStore.user?.yeyuNumber ||
         userInfo.value.yeyu_id ||
         userInfo.value.yeyuId ||
         userInfo.value.yeyuNumber ||
         'yeyu_user'
})

const currentUserAvatar = computed(() => {
  return appStore.user?.avatar ||
         userInfo.value.avatar ||
         generateAvatar(currentUserNickname.value)
})

const currentUserRegion = computed(() => {
  // 获取用户设置的地区信息
  return appStore.user?.region ||
         appStore.user?.location ||
         appStore.user?.area ||
         userInfo.value.region ||
         userInfo.value.location ||
         userInfo.value.area ||
         '未设置'
})

// 使用 vue-i18n 国际化系统
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// 生成头像
const generateAvatar = (name: string) => {
  // 使用DiceBear API生成头像，如果失败则使用本地SVG
  try {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  } catch (error) {
    // 备用方案：生成本地SVG头像
    const colors = ['#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7']
    const color = colors[name.length % colors.length]
    const initial = name.charAt(0)
    const svgContent = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${color}"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14">${initial}</text></svg>`)
    return `data:image/svg+xml,${svgContent}`
  }
}

// 处理头像加载错误
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.warn('个人资料中心头像加载失败，使用默认头像:', img.src)
  img.src = generateAvatar(userInfo.value?.name || '叶语用户')
}

// 用户信息（从localStorage或API加载）
const userInfo = ref({
  name: '叶语用户',
  yeyuId: 'yeyu_user',
  avatar: generateAvatar('叶语用户')
})





// 从多个来源加载用户信息
const loadUserInfo = async () => {
  console.log('🔄 开始加载用户信息...')

  // 1. 优先从localStorage加载最新的用户信息
  try {
    const localUserInfo = localStorage.getItem('yeyu_user_info')
    console.log('🔍 localStorage中的yeyu_user_info:', localUserInfo)

    if (localUserInfo) {
      const user = JSON.parse(localUserInfo)
      console.log('🔍 解析后的用户数据:', user)
      console.log('🔍 用户昵称字段:', {
        nickname: user.nickname,
        name: user.name,
        username: user.username
      })

      userInfo.value = {
        name: user.nickname || user.name || user.username || '叶语用户',
        yeyuId: user.yeyuId || user.yeyu_id || 'yeyu_user',
        avatar: user.avatar || generateAvatar(user.nickname || user.name || user.username || '叶语用户')
      }
      console.log('✅ 从localStorage加载用户信息成功:', userInfo.value)
      return
    } else {
      console.log('⚠️ localStorage中没有yeyu_user_info，尝试其他存储')
    }
  } catch (error) {
    console.error('❌ localStorage加载用户信息失败:', error)
  }

  // 1.5. 尝试从其他localStorage key加载
  try {
    const altKeys = ['yeyu_user', 'user']
    for (const key of altKeys) {
      const altUserInfo = localStorage.getItem(key)
      console.log(`🔍 尝试从${key}加载:`, altUserInfo)

      if (altUserInfo) {
        const user = JSON.parse(altUserInfo)
        console.log(`🔍 从${key}解析的数据:`, user)

        userInfo.value = {
          name: user.nickname || user.name || user.username || '叶语用户',
          yeyuId: user.yeyuId || user.yeyu_id || 'yeyu_user',
          avatar: user.avatar || generateAvatar(user.nickname || user.name || user.username || '叶语用户')
        }
        console.log(`✅ 从${key}加载用户信息成功:`, userInfo.value)

        // 同步到yeyu_user_info
        localStorage.setItem('yeyu_user_info', JSON.stringify(user))
        return
      }
    }
  } catch (error) {
    console.error('❌ 备用localStorage加载失败:', error)
  }

  // 2. 尝试从API获取用户信息
  try {
    const response = await userAPI.getProfile()
    if (response.data.success) {
      const user = response.data.data
      userInfo.value = {
        name: user.nickname || '叶语用户',
        yeyuId: user.yeyu_id || 'yeyu_user',
        avatar: user.avatar || generateAvatar(user.nickname || '叶语用户')
      }
      console.log('✅ 从API加载用户信息成功:', userInfo.value)

      // 同步到localStorage
      localStorage.setItem('yeyu_user_info', JSON.stringify({
        nickname: userInfo.value.name,
        yeyuId: userInfo.value.yeyuId,
        avatar: userInfo.value.avatar
      }))
      return
    }
  } catch (error) {
    console.warn('⚠️ 从API加载用户信息失败，使用本地存储:', error)
  }

  // 如果API失败，使用统一的用户信息工具
  const currentUser = getUserInfo()
  if (currentUser) {
    userInfo.value = {
      name: formatUserDisplayName(currentUser),
      yeyuId: formatYeyuIdDisplay(currentUser),
      avatar: getUserAvatarUrl(currentUser)
    }
    console.log('✅ 从统一工具加载用户信息:', userInfo.value)
  } else {
    // 设置默认用户信息
    userInfo.value = {
      name: '叶语用户',
      yeyuId: 'yeyu_' + Date.now().toString().slice(-6),
      avatar: generateAvatar('叶语用户')
    }
    console.warn('⚠️ 未找到用户信息，使用默认值:', userInfo.value)
  }
}



onMounted(() => {
  loadUserInfo()
})

// 当页面被激活时重新加载用户信息（从编辑页面返回时）
onActivated(() => {
  loadUserInfo()
})

// 监听用户信息变化
import { userInfoEmitter } from '../../../shared/utils/userInfo'
const unsubscribe = userInfoEmitter.subscribe((updatedUserInfo) => {
  loadUserInfo()
})

// 同时监听 userInfoUpdated 事件
const handleUserInfoUpdate = (event: CustomEvent) => {
  console.log('📢 个人中心页面收到用户信息更新事件:', event.detail)
  loadUserInfo()
}

window.addEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener)

// 页面卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener)
  unsubscribe()
})

// 二维码相关方法
const showMyQRCode = () => {
  // 跳转到独立的二维码页面
  router.push('/my-qr-code')
}



// 方法
const editProfile = () => {
  console.log('🎯 点击头像，准备跳转到个人信息页面')
  try {
    router.push('/settings/personal-info')
    console.log('✅ 路由跳转命令已发送: /settings/personal-info')
  } catch (error) {
    console.error('❌ 路由跳转失败:', error)
    // 备用跳转方法
    window.location.href = '/settings/personal-info'
  }
}

const goToServices = () => {
  // 简单跳转到支付验证页面
  router.push('/payment-auth')
}

const goToFavorites = () => {
  router.push('/favorites')
}

const goToMoments = () => {
  // 跳转到当前用户的朋友圈（个人朋友圈页面）
  const authStore = useAuthStore()
  if (authStore.user?.id) {
    router.push(`/personal-moments/${authStore.user.id}`)
  } else {
    // 如果没有用户ID，使用默认值
    router.push('/personal-moments/1')
  }
}

const goToVideoChannel = () => {
  console.log('🎬 进入我的视频号')
  router.push('/my-video-channel')
}

const goToEmoji = () => {
  router.push('/emoji')
}

const goToSettings = () => {
  router.push('/settings')
}



</script>

<style scoped>
.mobile-profile {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #e5e5e5;
  /* 移除padding，由MobileApp.vue统一管理 */
}

.profile-content {
  flex: 1;
  overflow-y: auto;
  padding: 0; /* 移除padding，让第一项与导航栏重合 */
}

.profile-header {
  background-color: white;
  margin-bottom: 5px; /* 头像项和服务项之间的5px间距 */
}

.profile-info {
  display: flex;
  align-items: center;
  padding: 3px 16px;
  cursor: pointer;
  height: 62px;
}

.profile-info:hover {
  background-color: #f8f8f8;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  gap: 4px;
}

.qr-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-btn:hover {
  background: #f0f0f0;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 12px;
}

.profile-details {
  flex: 1;
}

.profile-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 2px 0;
}

.profile-id {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.function-list {
  /* 功能列表样式 */
}

.function-section {
  background-color: white;
  margin-bottom: 0;
}

.function-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  height: 42px;
  background-color: white;
}

.function-item > iconify-icon:first-child {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

/* 保留所有分隔线，包括最后一个项目 */

.function-item:hover {
  background-color: #f8f8f8;
}

.function-item span {
  flex: 1;
  margin-left: 10px;
  font-size: 14px;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 通知徽章 */
.notification-badge {
  background: #ff4757;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  margin-left: auto;
  margin-right: 8px;
  font-weight: 600;
}

.logout-item span {
  color: #ff4757;
}






</style>
