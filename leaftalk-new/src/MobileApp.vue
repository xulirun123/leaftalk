<template>
  <div class="mobile-app">
    <!-- 顶部导航栏（包含状态栏） -->
    <MobileTopBar
      v-if="showTopBar"
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :show-back="showBackButton"
      :right-buttons="topBarButtons"
      @button-click="handleTopBarClick"
      @back="handleBack"
    />

    <!-- 主内容区 -->
    <div :class="['mobile-content', { 'no-top-bar': !showTopBar, 'no-tab-bar': !showTabBar }]">
      <router-view />
    </div>

    <!-- 移动端底部导航 -->
    <MobileTabBar
      v-if="showTabBar"
      :active-tab="currentTab"
      @tab-change="handleTabChange"
    />

    <!-- 移动端手势指示器 -->
    <div class="gesture-indicator safe-area-bottom" v-if="showGestureIndicator">
      <div class="gesture-bar"></div>
    </div>

    <!-- 全局通知 -->
    <div v-if="appStore.toast.show" class="notification" :class="appStore.toast.type">
      {{ appStore.toast.message }}
    </div>

    <!-- 实时消息接收器 -->
    <RealtimeMessageReceiver :show-status="false" />



    <!-- 开发环境调试信息 (可选) -->
    <div v-if="isDevelopment && false" class="dev-debug-info">
      <div class="debug-item">开发环境: {{ isDevelopment }}</div>
      <div class="debug-item">用户状态: {{ appStore.user ? '已登录' : '未登录' }}</div>
      <div class="debug-item">用户昵称: {{ appStore.user?.nickname || '未设置' }}</div>
      <div class="debug-item">叶语号: {{ appStore.user?.yeyu_id || '未设置' }}</div>
      <div class="debug-item">令牌: {{ appStore.token ? '有效' : '无效' }}</div>
    </div>

    <!-- 性能监控已移除，生产环境不依赖调试工具 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from './shared/stores/appStore'
import { useChatStore } from './modules/chat/stores/chatStore'
import { messagePersistenceService } from './modules/chat/services/messagePersistenceService'
import MobileTopBar from './shared/components/mobile/MobileTopBar.vue'
import MobileTabBar from './shared/components/mobile/MobileTabBar.vue'
import RealtimeMessageReceiver from './modules/chat/components/RealtimeMessageReceiver.vue'

import { DBDebugger } from './modules/chat/utils/dbDebugger'
import { useGlobalLanguage } from './shared/composables/useGlobalLanguage'
// PerformanceMonitor仅在开发环境使用，生产环境不依赖
// import PerformanceMonitor from './modules/admin/components/PerformanceMonitor.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const chatStore = useChatStore()
const eventBus = inject('eventBus')

// 使用全局语言管理
const { t } = useGlobalLanguage()

const showGestureIndicator = ref(false)
const isDevelopment = computed(() => process.env.NODE_ENV === 'development')



// 显示顶部导航的页面 - 大部分页面都显示统一导航栏
const showTopBar = computed(() => {
  if (!route || !route.path) return true

  // 明确不显示导航栏的页面（只有这些特殊页面）
  const hideTopBarPages = [
    '/login',
    '/register'
  ]

  if (hideTopBarPages.includes(route.path)) {
    return false
  }

  // 检查路由的 meta 配置 - 只有明确设置的页面才隐藏导航栏
  if (route.meta && route.meta.hideTopBar === true) {
    return false
  }

  // 默认显示导航栏
  return true
})

// 显示底部导航的页面
const tabBarPages = ['/', '/chat', '/contacts', '/discover', '/profile', '/genealogy']
const showTabBar = computed(() => {
  if (!route || !route.path) return true

  // 优先检查路由meta配置
  if (route.meta && route.meta.hideTabBar === true) {
    return false
  }

  // 如果是具体的聊天页面（不是聊天列表），不显示底部导航栏
  if (route.path.startsWith('/chat/')) {
    return false
  }

  // 其他特殊页面也不显示底部导航栏
  const hideTabBarPages = [
    '/login',
    '/register',
    '/identity-verification',  // 实名认证页面隐藏底部导航栏
    '/search',
    '/new-friends',
    '/friend-profile',
    '/group-info',
    '/chat-info',
    '/moments-main',
    '/videos-main',
    '/payment',
    '/settings',
    '/profile-settings',
    '/friend-permissions',
    '/friend-moments',
    '/friend-videos',
    '/author-channel',
    '/video-search',
    '/ai-assistant',
    '/tab-bar-test'
  ]

  // 检查是否是需要隐藏底部导航栏的页面
  const shouldHide = hideTabBarPages.some(page => route.path.startsWith(page))
  if (shouldHide) {
    return false
  }

  const shouldShow = tabBarPages.includes(route.path)
  return shouldShow
})

// 当前激活的标签页
const currentTab = computed(() => {
  const path = route?.path || '/'
  if (path === '/' || path === '/chat') return 'chats'
  if (path === '/contacts') return 'contacts'
  if (path === '/discover') return 'discover'
  if (path === '/profile') return 'profile'
  if (path === '/genealogy') return 'genealogy'
  return 'chats'
})

// 页面标题 - 使用翻译函数
const pageTitle = computed(() => {
  if (!route || !route.path) return t('app.name') || '叶语'

  // 优先使用路由meta.title
  if (route.meta && (route.meta as any).title) {
    return String((route.meta as any).title)
  }

  // 翻译键映射
  const titleKeyMap = {
    '/': 'app.name',
    '/chat': 'nav.chat',
    '/contacts': 'nav.contacts',
    '/new-friends': 'contacts.newFriends',
    '/friend-profile': 'profile.personalInfo',
    '/genealogy': 'nav.genealogy',
    '/genealogy/advanced-search': 'genealogy.advancedSearch',
    '/genealogy/layout-styles': 'genealogy.layoutStyles',
    '/identity-verification': 'auth.identityVerification',
    '/live': 'discover.live',
    '/discover': 'nav.discover',
    '/profile': 'nav.me',
    '/moments': 'discover.moments',
    '/my-moments': 'discover.moments',
    '/friend-moments': 'discover.moments',
    '/videos': 'discover.videos',
    '/my-videos': 'discover.videos',
    '/cards': 'profile.cards',
    '/wallet': 'profile.wallet',
    '/yeyu-wallet': 'profile.yeyuWallet',
    '/payment': 'profile.payment',
    '/payment-code': 'profile.payment',
    '/transfer': 'profile.transfer',
    '/blacklist': 'settings.blacklist',
    '/baidu-ocr-test': 'settings.baiduOcrTest',
    '/video-call': 'chat.videoCall',
    '/virtual-cemetery': 'genealogy.virtualCemetery',
    '/login': 'auth.login',
    '/register': 'auth.register',
    // 设置页面
    '/settings': 'common.settings',
    '/settings/personal-info': 'profile.personalInfo',
    '/settings/account-security': 'settings.accountSecurity',
    '/settings/change-password': 'settings.changePassword',
    '/settings/change-pay-password': 'settings.changePayPassword',
    '/settings/pay-password-style': 'settings.payPasswordStyle',
    '/settings/privacy': 'settings.privacy',
    '/settings/general': 'settings.general',
    '/settings/notifications': 'settings.notifications',
    '/settings/storage': 'settings.storage',
    '/settings/about': 'settings.about',
    '/settings/help': 'settings.help',
    // 个人信息子页面
    '/settings/change-gender': 'profile.gender',
    '/settings/change-signature': 'profile.signature',
    '/settings/change-name': 'profile.changeName',
    '/settings/region-selector': 'profile.region',
    '/settings/avatar-view': 'profile.avatar',
    // 通用设置子页面
    '/settings/language-selector': 'settings.language'
  }

  // 处理动态路由
  if (route.path.startsWith('/friend-profile/')) {
    return t('profile.personalInfo') || '个人信息'
  }

  const titleKey = titleKeyMap[route.path]
  if (titleKey) {
    const translated = t(titleKey)
    return translated !== titleKey ? translated : (titleKey.split('.').pop() || '叶语')
  }

  return t('app.name') || '叶语'
})

const pageSubtitle = computed(() => {
  if (!route || !route.path) return ''

  const subtitleMap = {
    '/genealogy': '家族传承',
    '/live': '精彩直播',
    '/discover': '探索更多'
  }
  return subtitleMap[route.path] || ''
})

// 顶部导航栏按钮
const topBarButtons = computed(() => {
  if (!route || !route.path) return []

  // 首页（聊天列表）的按钮
  if (route.path === '/') {
    return [
      { icon: 'heroicons:magnifying-glass', action: 'search' },
      { icon: 'heroicons:plus-circle', action: 'showAddMenu' }
    ]
  }

  // 聊天页面的按钮
  if (route.path.startsWith('/chat/')) {
    return [{ icon: 'lucide:more-vertical', action: 'chatInfo' }]
  }

  // 个人信息页面的按钮
  if (route.path.startsWith('/friend-profile/')) {
    // 详细资料页右上角显示水平三点，点击进入资料设置
    return [{ icon: 'heroicons:ellipsis-horizontal', action: 'friendSettings' }]
  }

  // 备注和标签页面按钮：右上角“完成”
  if (route.path.startsWith('/friend-remark/')) {
    return [{ icon: 'heroicons:check', action: 'friendRemarkSave' }]
  }

  // 其他页面的按钮
  if (route.path === '/contacts') {
    return [
      { icon: 'heroicons:magnifying-glass', action: 'search' },
      { icon: 'heroicons:plus-circle', action: 'showAddMenu' }
    ]
  }

  if (route.path === '/discover') {
    return [{ icon: 'heroicons:magnifying-glass', action: 'search' }]
  }

  if (route.path === '/genealogy') {
    return [
      { icon: 'heroicons:magnifying-glass', action: 'search' },
      { icon: 'heroicons:plus-circle', action: 'addGenealogy' }
    ]
  }

  return []
})

const showBackButton = computed(() => {
  return route && route.path && !tabBarPages.includes(route.path)
})

// 处理顶部导航栏按钮点击
const handleTopBarClick = (payload: any) => {
  const action = typeof payload === 'string' ? payload : payload?.action
  console.log('Top bar button clicked:', payload)

  switch (action) {
    case 'search':
      router.push('/search')
      break
    case 'showAddMenu':
      if (eventBus) {
        eventBus.emit('showAddMenu')
      }
      break
    case 'addFriend':
      router.push('/add-friend')
      break
    case 'chatInfo':
      const chatId = route.params.id
      router.push(`/chat-info/${chatId}`)
      break
    case 'friendSettings':
      const friendId = route.params.id
      router.push(`/friend-settings/${friendId}`)
      break
    case 'friendRemarkSave':
      if (eventBus) { eventBus.emit('friendRemarkSave') }
      break

    default:
      console.log('Unknown action:', action)
  }
}

// 处理返回按钮
const handleBack = () => {
  router.back()
}

// 处理底部导航栏切换
const handleTabChange = (tabKey: string) => {
  console.log('🧭 MobileApp handleTabChange 被调用:', {
    tabKey,
    currentPath: route.path,
    currentTab: currentTab.value,
    timestamp: new Date().toLocaleTimeString()
  })

  try {
    const tabRoutes = {
      'chats': '/',
      'contacts': '/contacts',
      'discover': '/discover',
      'profile': '/profile',
      'genealogy': '/genealogy'
    }

    const targetRoute = tabRoutes[tabKey]
    console.log('🧭 目标路由:', targetRoute)

    if (!targetRoute) {
      console.error('❌ 无效的标签键:', tabKey)
      return
    }

    if (targetRoute === route.path) {
      console.log('🧭 已在目标页面，跳过导航')
      return
    }

    console.log('🧭 准备导航:', `${route.path} -> ${targetRoute}`)

    // 添加导航前的状态检查
    console.log('🧭 导航前状态检查:', {
      routerReady: router.isReady(),
      hasRouter: !!router,
      hasRoute: !!route,
      windowLocation: window.location.href
    })

    // 执行导航
    console.log('🧭 执行 router.push...')
    router.push(targetRoute).then(() => {
      console.log('✅ 导航成功:', targetRoute)
      console.log('🧭 导航后状态:', {
        newPath: route.path,
        windowLocation: window.location.href
      })
    }).catch((error) => {
      console.error('❌ 导航失败:', error)
      console.error('❌ 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    })

  } catch (error) {
    console.error('❌ handleTabChange 执行失败:', error)
    console.error('❌ 错误堆栈:', error.stack)
  }
}

// 检查和修复数据库
const checkAndFixDatabase = async () => {
  try {
    console.log('🔍 检查数据库状态...')
    const diagnosis = await DBDebugger.diagnoseProblem()

    if (diagnosis.status !== 'healthy') {
      console.warn('⚠️ 数据库问题:', diagnosis.issues)
      console.log('🔧 尝试自动修复...')

      const fixResult = await DBDebugger.autoFix()
      if (fixResult.success) {
        console.log('✅ 数据库修复成功:', fixResult.actions)
      } else {
        console.error('❌ 数据库修复失败:', fixResult.error)
      }
    } else {
      console.log('✅ 数据库状态正常')
    }
  } catch (error) {
    console.error('❌ 数据库检查失败:', error)
  }
}

onMounted(async () => {
  console.log('MobileApp mounted')

  // 首先恢复用户登录状态
  console.log('🔄 恢复用户登录状态...')
  const restored = appStore.restoreUserFromStorage()
  if (restored) {
    console.log('✅ 用户登录状态已恢复')
  } else {
    console.log('⚠️ 没有找到已保存的用户登录状态')
  }

  // 检查和修复数据库
  await checkAndFixDatabase()

  // 延迟加载聊天列表，避免阻塞页面渲染
  setTimeout(async () => {
    try {
      // 只有在用户已登录时才调用API
      if (appStore.user && appStore.token) {
        console.log('🔄 页面刷新，强制从API加载最新聊天数据...')

        // 不再在刷新前清除本地会话缓存，避免API临时空列表导致误清空
        // 若API成功返回有效数据，chatStore会自行覆盖并保存缓存
        // console.log('🧹 清除旧的聊天缓存...')
        // localStorage.removeItem('chat_sessions_cache')

        // 检查存储空间
        console.log('💾 检查存储空间...')
        try {
          await messagePersistenceService.checkStorageAndCleanup()
        } catch (error) {
          console.warn('⚠️ 存储空间检查失败:', error)
        }

        await chatStore.loadChatsFromAPI(true) // 强制刷新，不使用缓存
      } else {
        console.log('⚠️ 用户未登录，跳过API调用')
      }
    } catch (error) {
      // 静默处理错误，不影响页面加载
      console.debug('聊天列表加载失败，已使用本地数据')
    }
  }, 100) // 延迟100ms，让页面先渲染

  // 暴露全局测试函数
  ;(window as any).testDirectNavigation = () => {
    console.log('🧪 测试直接URL修改（不使用Vue Router）')
    try {
      // 直接修改浏览器URL，不触发Vue Router
      window.history.pushState({}, '', '/contacts')
      console.log('✅ URL修改成功，当前URL:', window.location.href)
      console.log('🧪 这个测试不应该导致页面刷新')
    } catch (error) {
      console.error('❌ URL修改失败:', error)
    }
  }

  ;(window as any).testWindowLocation = () => {
    console.log('🧪 测试 window.location.href 修改（会导致页面刷新）')
    try {
      // 这个会导致页面刷新，用于对比
      window.location.href = '/contacts'
    } catch (error) {
      console.error('❌ window.location 修改失败:', error)
    }
  }

  console.log('🧪 全局测试函数已注册:')
  console.log('  - window.testDirectNavigation() - 测试直接URL修改')
  console.log('  - window.testWindowLocation() - 测试window.location修改')
})


</script>

<style scoped>
.mobile-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #e5e5e5;
}

/* 状态栏样式已移至MobileTopBar组件 */

.mobile-content {
  flex: 1;
  overflow: hidden;
  /* 移除 padding-top，因为导航栏不再使用 fixed 定位 */
  padding-bottom: 75px; /* 底部导航栏高度 */
  box-sizing: border-box;
}

.mobile-content.no-top-bar {
  /* 不需要额外的 padding-top，因为导航栏在正常文档流中 */
}

.mobile-content.no-tab-bar {
  padding-bottom: 0;
}

.gesture-indicator {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 134px;
  height: 5px;
  padding: 8px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.gesture-bar {
  width: 134px;
  height: 5px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2.5px;
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  z-index: 9999;
  max-width: 80%;
  text-align: center;
}

.notification.success {
  background: #07C160;
}

.notification.error {
  background: #ff4757;
}

.notification.warning {
  background: #ffa502;
}

.notification.info {
  background: #3742fa;
}



/* 开发环境调试信息 */
.dev-debug-info {
  position: fixed;
  top: 200px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 9998;
  max-width: 200px;
}

.debug-item {
  margin-bottom: 4px;
}

/* 全局翻译控制 */
.global-translation-wrapper {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-width: 320px;
}

@media (max-width: 768px) {
  .global-translation-wrapper {
    top: 70px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
