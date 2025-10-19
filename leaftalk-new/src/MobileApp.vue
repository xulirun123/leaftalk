<template>
  <div class="mobile-app">
    <!-- 顶部导航栏（包含状态栏） -->
    <MobileTopBar
      v-if="showTopBar"
      :title="pageTitle"
      :subtitle="pageSubtitle"
      :show-back="showBackButton"
      :right-buttons="topBarButtons"
      :background-color="topBarBackgroundColor"
      @button-click="handleTopBarClick"
      @back="handleBack"
    />

    <!-- 主内容区 -->
    <div :class="['mobile-content', { 'no-top-bar': !showTopBar, 'no-tab-bar': !showTabBar }]">
      <router-view v-slot="{ Component, route }">
        <transition :name="transitionName" mode="out-in">
          <keep-alive>
            <component :is="Component" :key="route.meta?.keepAlive ? route.name : route.path" v-if="route.meta?.keepAlive" />
          </keep-alive>
        </transition>
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="route.path" v-if="!route.meta?.keepAlive" />
        </transition>
      </router-view>
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
    <RealtimeMessageReceiver ref="realtimeReceiverRef" :show-status="false" />

    <!-- 全局通话悬浮窗（呼叫/通话中且开启迷你模式时显示） -->
    <FloatingCallWidget />

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
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from './shared/stores/appStore'
import { useAuthStore } from './stores/auth'
import { useChatStore } from './modules/chat/stores/chatStore'
import { useContactStore } from './modules/contacts/stores/contactsStore'
import { messagePersistenceService } from './modules/chat/services/messagePersistenceService'
import MobileTopBar from './shared/components/mobile/MobileTopBar.vue'
import MobileTabBar from './shared/components/mobile/MobileTabBar.vue'
import RealtimeMessageReceiver from './modules/chat/components/RealtimeMessageReceiver.vue'
import FloatingCallWidget from './shared/components/call/FloatingCallWidget.vue'

import { DBDebugger } from './modules/chat/utils/dbDebugger'
import { useGlobalLanguage } from './shared/composables/useGlobalLanguage'
// PerformanceMonitor仅在开发环境使用，生产环境不依赖
// import PerformanceMonitor from './modules/admin/components/PerformanceMonitor.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const contactStore = useContactStore()
const eventBus = inject('eventBus')

// 使用全局语言管理
const { t } = useGlobalLanguage()

const showGestureIndicator = ref(false)
const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

// 实时消息接收器 ref
const realtimeReceiverRef = ref<any>(null)

// 页面切换动画
const transitionName = ref('slide-left')
let historyLength = window.history.length

// 监听路由变化，判断是前进还是后退
watch(() => route.path, () => {
  const currentLength = window.history.length

  if (currentLength > historyLength) {
    // 前进：新页面从右往左滑入
    transitionName.value = 'slide-left'
  } else {
    // 后退：当前页面从左往右滑出
    transitionName.value = 'slide-right'
  }

  historyLength = currentLength
})



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

// 页面标题 - 使用 ref 而不是 computed，通过 watch 更新
const pageTitle = ref(t('app.name') || '叶语')

// 顶部导航栏背景色 - 所有页面统一使用灰色
const topBarBackgroundColor = computed(() => {
  return '#E5E5E5'
})

// 计算标题的函数
const calculatePageTitle = () => {
  if (!route || !route.path) return t('app.name') || '叶语'

  console.log('📋 计算页面标题:', {
    path: route.path,
    metaTitle: route.meta?.title,
    meta: route.meta
  })

  // 优先使用路由 meta.title（直接字符串）
  if (route.meta?.title && typeof route.meta.title === 'string') {
    console.log('✅ 使用 meta.title:', route.meta.title)
    return route.meta.title
  }

  // 处理动态路由 - 聊天页面
  if (route.path.startsWith('/chat/')) {
    // 从路由参数中获取聊天对象ID
    const chatId = route.params.id as string
    console.log('🔍 计算聊天页面标题, chatId:', chatId)

    if (chatId) {
      // 处理群聊 (格式: group_xxx)
      if (chatId.startsWith('group_')) {
        console.log('👥 这是一个群聊，chatId:', chatId)

        // 优先使用 route.meta.title（ChatSimple.vue 已经设置好了）
        if (route.meta?.title && typeof route.meta.title === 'string' && route.meta.title !== '群聊') {
          console.log('✅ 使用 route.meta.title:', route.meta.title)
          return route.meta.title
        }

        // 从 chatStore 中查找群聊信息
        const session = chatStore.sessions.find(s => s.id === chatId)
        if (session && session.name) {
          console.log('✅ 从 chatStore 获取群聊名称:', session.name)
          return session.name
        }
        console.log('⚠️ 未在 chatStore 中找到群聊信息，返回默认值')
        return '群聊'
      }

      // 解析聊天ID (格式: chat_1_2)
      const parts = chatId.split('_')
      if (parts.length === 3) {
        const currentUserId = parseInt(parts[1])
        const otherUserId = parseInt(parts[2])
        const authStore = useAuthStore()
        const actualOtherId = authStore.user?.id === currentUserId ? otherUserId : currentUserId

        console.log('👤 对方用户ID:', actualOtherId, '当前用户ID:', authStore.user?.id)

        // 尝试从备注中获取名字
        try {
          const saved = JSON.parse(localStorage.getItem(`friend_remark_${actualOtherId}`) || 'null')
          const remark = saved?.remark
          if (remark) {
            console.log('✅ 从备注获取名字:', remark)
            return remark
          }
        } catch {}

        // 尝试从联系人列表中获取名字
        console.log('📋 联系人列表数量:', contactStore.contacts.length)
        const contact = contactStore.contacts.find(c => c.id === actualOtherId)
        if (contact) {
          const displayName = contact.remark || contact.nickname || contact.name || '聊天'
          console.log('✅ 从联系人获取名字:', displayName, contact)
          return displayName
        } else {
          console.log('⚠️ 未在联系人列表中找到用户:', actualOtherId)
        }
      }
    }
    console.log('⚠️ 使用默认标题: 聊天')
    return '聊天'
  }

  // 处理动态路由 - 好友详细资料
  if (route.path.startsWith('/friend-profile/')) {
    return t('profile.personalInfo') || '个人信息'
  }

  // 翻译键映射
  const titleKeyMap: Record<string, string> = {
    '/': 'app.name',
    '/chat': 'nav.chat',
    '/contacts': 'nav.contacts',
    '/new-friends': 'contacts.newFriends',
    '/friend-profile': 'profile.personalInfo',
    '/add-friend': 'contacts.addFriend',  // 添加这个映射
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

  const titleKey = titleKeyMap[route.path]
  if (titleKey) {
    const translated = t(titleKey)
    return translated !== titleKey ? translated : (titleKey.split('.').pop() || '叶语')
  }

  console.log('⚠️ 使用默认标题: 叶语')
  return t('app.name') || '叶语'
}

const pageSubtitle = computed(() => {
  if (!route || !route.path) return ''

  const subtitleMap = {
    '/genealogy': '家族传承',
    '/live': '精彩直播',
    '/discover': '探索更多'
  }
  return subtitleMap[route.path] || ''
})

// 动态顶部导航栏按钮（用于某些页面动态更新按钮）
const dynamicTopBarButtons = ref<any[]>([])

// 顶部导航栏按钮
const topBarButtons = computed(() => {
  if (!route || !route.path) return []

  // 群公告页面：使用动态按钮
  if (route.path.startsWith('/group-announcement/')) {
    return dynamicTopBarButtons.value
  }

  // 选择联系人页：右上角“完成”文本按钮
  if (route.path === '/select-contact') {
    return [{ action: 'selectContactConfirm', text: '完成' } as any]
  }

  // 发起群聊页：右上角"完成"文本按钮
  if (route.path === '/create-group') {
    return [{ action: 'createGroupConfirm', text: '完成' } as any]
  }

  // 选择背景页：右上角"完成"文本按钮
  if (route.path === '/settings/chat-background-gallery') {
    return [{ action: 'chatBackgroundConfirm', text: '完成' } as any]
  }

  // 首页（聊天列表）的按钮
  if (route.path === '/') {
    return [
      { icon: 'heroicons:magnifying-glass', action: 'search' },
      { icon: 'heroicons:plus-circle', action: 'showAddMenu' }
    ]
  }

  // 聊天页面的按钮 - 横排三点
  if (route.path.startsWith('/chat/') || route.path.startsWith('/group/')) {
    return [{ icon: 'heroicons:ellipsis-horizontal', action: 'chatInfo' }]
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

  // 新朋友页面：右上角"添加朋友"文本按钮
  if (route.path === '/new-friends') {
    return [{ text: '添加朋友', action: 'addFriend' } as any]
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
  console.log('🔥 Top bar button clicked:', payload, 'action:', action)
  console.log('🔥 eventBus:', eventBus)

  switch (action) {
    case 'search':
      router.push('/search')
      break
    case 'showAddMenu':
      console.log('🔥 showAddMenu action triggered')
      if (eventBus) {
        console.log('🔥 Emitting showAddMenu event')
        eventBus.emit('showAddMenu')
        console.log('🔥 showAddMenu event emitted')
      } else {
        console.error('❌ eventBus is not available!')
      }
      break
    case 'addFriend':
      router.push('/add-friend')
      break
    case 'chatInfo':
      // 解析聊天ID获取对方用户ID或群聊ID
      const chatId = route.params.id as string
      console.log('🔍 点击聊天详情按钮, chatId:', chatId)
      if (chatId) {
        // 判断是否为群聊
        if (chatId.startsWith('group_')) {
          // 群聊：直接跳转到群聊信息页面（使用 /group-info/:id 路由）
          console.log('🔍 跳转到群聊信息页:', `/group-info/${chatId}`)
          router.push(`/group-info/${chatId}`)
        } else {
          // 私聊：解析用户ID
          const parts = chatId.split('_')
          console.log('🔍 解析chatId parts:', parts, 'length:', parts.length)
          // chatId 格式可能是 "userId1_userId2" (2个部分) 或 "chat_userId1_userId2" (3个部分)
          if (parts.length === 2) {
            // 格式: "userId1_userId2"
            const userId1 = parts[0]
            const userId2 = parts[1]
            const currentUserId = String(authStore.user?.id)
            const actualOtherId = currentUserId === userId1 ? userId2 : userId1
            console.log('🔍 跳转到聊天详情页:', `/chat-info/${actualOtherId}`)
            router.push(`/chat-info/${actualOtherId}`)
          } else if (parts.length === 3) {
            // 格式: "chat_userId1_userId2"
            const userId1 = parts[1]
            const userId2 = parts[2]
            const currentUserId = String(authStore.user?.id)
            const actualOtherId = currentUserId === userId1 ? userId2 : userId1
            console.log('🔍 跳转到聊天详情页:', `/chat-info/${actualOtherId}`)
            router.push(`/chat-info/${actualOtherId}`)
          } else {
            console.error('❌ chatId 格式不正确:', chatId, parts)
          }
        }
      }
      break
    case 'friendSettings':
      const friendId = route.params.id
      router.push(`/friend-settings/${friendId}`)
      break
    case 'friendRemarkSave':
      if (eventBus) { eventBus.emit('friendRemarkSave') }
      break
    case 'selectContactConfirm':
      if (eventBus) { eventBus.emit('selectContact:confirm') }
      break
    case 'createGroupConfirm':
      if (eventBus) { eventBus.emit('createGroup:confirm') }
      break
    case 'chatBackgroundConfirm':
      console.log('🎨 [MobileApp] chatBackgroundConfirm 按钮被点击')
      if (eventBus) {
        eventBus.emit('chatBackground:confirm')
        console.log('🎨 [MobileApp] chatBackground:confirm 事件已触发')
      } else {
        console.error('❌ [MobileApp] eventBus 未初始化')
      }
      break

    case 'edit':
    case 'done':
      // 群公告页面的编辑/完成按钮，转发给页面组件
      console.log('📢 转发顶部按钮事件:', action)
      window.dispatchEvent(new CustomEvent('top-bar-action', {
        detail: { action }
      }))
      break

    default:
      console.log('Unknown action:', action)
  }
}

// 处理返回按钮
const handleBack = () => {
  console.log('🔙 处理返回按钮，当前路径:', route.path)

  // 选择联系人页（通话邀请）返回到通话页面
  if (route.path === '/select-contact' && route.query.from === 'callInvite') {
    router.push({ name: 'Call', query: { action: 'active' } })
    return
  }

  // 特殊页面的返回逻辑
  if (route.path.startsWith('/edit-group-name/')) {
    router.push(`/group-info/${route.params.id}`)
    return
  }

  if (route.path.startsWith('/edit-group-nickname/')) {
    router.push(`/group-info/${route.params.id}`)
    return
  }

  if (route.path.startsWith('/group-management/')) {
    router.push(`/group-info/${route.params.groupId}`)
    return
  }

  if (route.path.startsWith('/group-info/')) {
    router.push(`/chat/${route.params.id}`)
    return
  }

  if (route.path.startsWith('/chat/')) {
    router.push('/')
    return
  }

  // 默认返回
  try {
    if (window.history.length > 1) {
      router.back()
    } else {
      // 如果历史记录为空，返回到首页
      router.push('/')
    }
  } catch (error) {
    console.error('❌ 返回失败:', error)
    router.push('/')
  }
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

  // 暴露 RealtimeMessageReceiver 到全局
  if (realtimeReceiverRef.value) {
    (window as any).$realtimeReceiver = realtimeReceiverRef.value
    console.log('✅ 全局RealtimeMessageReceiver已注册')
  } else {
    console.warn('⚠️ RealtimeMessageReceiver ref 未初始化')
  }

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

  // 监听群名称修改事件
  window.addEventListener('group-name-changed', handleGroupNameChanged)
  console.log('✅ 已注册群名称修改事件监听')

  // 监听聊天标题更新事件
  window.addEventListener('chat-title-updated', (event: any) => {
    console.log('📢 收到聊天标题更新事件:', event.detail)
    if (event.detail?.title) {
      pageTitle.value = event.detail.title
      console.log('✅ 页面标题已更新为:', pageTitle.value)
    }
  })
  console.log('✅ 已注册聊天标题更新事件监听')

  // 监听动态更新顶部导航栏按钮事件
  window.addEventListener('update-top-bar-buttons', (event: any) => {
    console.log('📢 收到更新顶部导航栏按钮事件:', event.detail)
    if (event.detail?.buttons) {
      dynamicTopBarButtons.value = event.detail.buttons
    }
  })
  console.log('✅ 已注册动态顶部导航栏按钮事件监听')
})

// 监听路由变化，确保标题正确更新
watch(
  () => [route.path, route.meta, route.meta?.title],
  () => {
    console.log('🔄 路由变化，更新标题')
    // 延迟一点确保 route.meta 已经更新
    setTimeout(() => {
      pageTitle.value = calculatePageTitle()
      console.log('📋 标题已更新为:', pageTitle.value)
    }, 10)

    // 路由变化时清空动态按钮（除非是群公告页面）
    if (!route.path.startsWith('/group-announcement/')) {
      dynamicTopBarButtons.value = []
    }
  },
  { immediate: true, deep: true }
)

// 监听联系人列表变化，更新聊天页面标题
watch(
  () => contactStore.contacts.length,
  () => {
    if (route.path.startsWith('/chat/')) {
      console.log('👥 联系人列表已更新，重新计算聊天标题')
      pageTitle.value = calculatePageTitle()
      console.log('📋 标题已更新为:', pageTitle.value)
    }
  }
)

// 定期检查聊天页面标题（确保即使 meta 更新没有触发 watch 也能更新）
let titleCheckInterval: any = null
watch(
  () => route.path,
  (newPath) => {
    // 清除之前的定时器
    if (titleCheckInterval) {
      clearInterval(titleCheckInterval)
      titleCheckInterval = null
    }

    // 如果是聊天页面，启动定期检查
    if (newPath.startsWith('/chat/')) {
      console.log('🔄 启动聊天页面标题定期检查')
      titleCheckInterval = setInterval(() => {
        const newTitle = calculatePageTitle()
        if (newTitle !== pageTitle.value && newTitle !== '聊天') {
          console.log('🔄 定期检查发现标题变化:', pageTitle.value, '->', newTitle)
          pageTitle.value = newTitle
        }
      }, 500) // 每500ms检查一次

      // 5秒后停止检查（标题应该已经加载完成）
      setTimeout(() => {
        if (titleCheckInterval) {
          clearInterval(titleCheckInterval)
          titleCheckInterval = null
          console.log('⏹️ 停止聊天页面标题定期检查')
        }
      }, 5000)
    }
  },
  { immediate: true }
)

// 监听群名称修改事件，更新页面标题
const handleGroupNameChanged = (event: any) => {
  console.log('🔥 MobileApp 收到群名称修改事件:', event.detail)

  // 如果当前在聊天页面，立即更新标题
  if (route.path.startsWith('/chat/')) {
    console.log('🔥 当前在聊天页面，立即更新标题')
    console.log('🔥 当前 route.meta.title:', route.meta?.title)

    // 直接使用 route.meta.title（ChatSimple.vue 已经更新了）
    if (route.meta?.title && typeof route.meta.title === 'string') {
      console.log('🔥 直接使用 route.meta.title:', route.meta.title)
      pageTitle.value = route.meta.title
    } else {
      // 如果 route.meta.title 还没更新，使用 calculatePageTitle
      setTimeout(() => {
        const newTitle = calculatePageTitle()
        console.log('🔥 使用 calculatePageTitle 更新标题为:', newTitle)
        pageTitle.value = newTitle
      }, 50)
    }
  }
}

// 在卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('group-name-changed', handleGroupNameChanged)
  console.log('✅ 已移除群名称修改事件监听')
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
  position: relative; /* 为页面切换动画提供定位上下文 */
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

/* 页面切换动画 */
/* 前进动画：新页面从右往左滑入 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-enter-to {
  transform: translateX(0);
}

.slide-left-leave-from {
  transform: translateX(0);
}

.slide-left-leave-to {
  transform: translateX(-30%);
  opacity: 0.5;
}

/* 后退动画：当前页面从左往右滑出 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.slide-right-enter-from {
  transform: translateX(-30%);
  opacity: 0.5;
}

.slide-right-enter-to {
  transform: translateX(0);
}

.slide-right-leave-from {
  transform: translateX(0);
}

.slide-right-leave-to {
  transform: translateX(100%);
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
