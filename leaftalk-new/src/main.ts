import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import mitt from 'mitt'
import MobileApp from './MobileApp.vue'

// 导入设计系统
import { generateCSSVariables } from './design-system/tokens'

// 导入模块注册系统
import { moduleRegistry } from './shared/core/ModuleRegistry'

// 导入业务模块
import AuthModule from './modules/auth/AuthModule'
import ChatModule from './modules/chat/ChatModule'
import ContactsModule from './modules/contacts/ContactsModule'
import ProfileModule from './modules/profile/ProfileModule'
import DiscoverModule from './modules/discover/DiscoverModule'
import GenealogyModule from './modules/genealogy/GenealogyModule'

// 样式导入
import './styles/index.scss'
// 聊天模块关键样式 - 确保立即加载
import './modules/chat/styles/critical.css'

// 插件导入
import I18nPlugin from './shared/plugins/i18n'

// Iconify 导入
import 'iconify-icon'

// 全局组件导入
import UnifiedIcon from './shared/components/common/UnifiedIcon.vue'

// 工具导入
import { crashPrevention, recoverFromCrash } from './shared/utils/crashPrevention'
import { installGlobalDialog } from './shared/utils/dialogUtils'

// 全局翻译服务导入
import { globalTranslationManager } from './shared/services/autoTranslationService'

// 屏蔽浏览器扩展错误 - 增强版
window.addEventListener('error', (event) => {
  // 过滤掉浏览器扩展相关的错误
  if (event.filename && (
    event.filename.includes('content_scripts') ||
    event.filename.includes('extension') ||
    event.filename.includes('chrome-extension') ||
    event.filename.includes('moz-extension')
  )) {
    console.log('🔇 已过滤浏览器扩展错误:', event.message)
    event.preventDefault()
    event.stopPropagation()
    return false
  }

  // 过滤特定的扩展错误消息
  if (event.message && (
    event.message.includes('handleHotKey') ||
    event.message.includes('toUpperCase') ||
    event.message.includes('content_scripts')
  )) {
    console.log('🔇 已过滤扩展热键错误:', event.message)
    event.preventDefault()
    event.stopPropagation()
    return false
  }
})

window.addEventListener('unhandledrejection', (event) => {
  // 过滤掉浏览器扩展相关的Promise错误
  const error = event.reason
  if (error && error.stack && (
    error.stack.includes('content_scripts') ||
    error.stack.includes('extension') ||
    error.stack.includes('chrome-extension') ||
    error.stack.includes('moz-extension') ||
    error.stack.includes('handleHotKey') ||
    error.stack.includes('shadowRoot')
  )) {
    event.preventDefault()
    return false
  }
})

// 创建应用实例 - 使用移动版本
const app = createApp(MobileApp)

// 注册全局组件
app.component('UnifiedIcon', UnifiedIcon)

// 创建事件总线
const eventBus = mitt()



// 提供eventBus
app.provide('eventBus', eventBus)

// compilerOptions 已在 vite.config.ts 中配置，这里不需要重复配置

// 额外的警告抑制
app.config.warnHandler = (msg, instance, trace) => {
  // 抑制 iconify-icon 相关的警告
  if (msg.includes('iconify-icon') || msg.includes('Failed to resolve component: iconify-icon')) {
    return
  }
  // 其他警告正常显示
  console.warn(msg, instance, trace)
}

// Pinia和路由将在下面统一配置



// 全局属性 - 暂时注释掉，稍后配置
// app.config.globalProperties.$api = api

// 错误处理 - 过滤扩展错误
app.config.errorHandler = (err, vm, info) => {
  // 过滤浏览器扩展错误
  if (err && err.stack && (
    err.stack.includes('content_scripts') ||
    err.stack.includes('handleHotKey') ||
    err.stack.includes('extension') ||
    err.stack.includes('chrome-extension') ||
    err.stack.includes('moz-extension')
  )) {
    console.log('🔇 已过滤Vue扩展错误:', err.message)
    return
  }
  console.error('Vue Error:', err, info)
}

// 覆盖console.error来过滤扩展错误
const originalConsoleError = console.error
console.error = function(...args) {
  const message = args.join(' ')
  if (message.includes('content_scripts') ||
      message.includes('handleHotKey') ||
      message.includes('toUpperCase') ||
      message.includes('chrome-extension') ||
      message.includes('moz-extension')) {
    console.log('🔇 已过滤控制台扩展错误:', message)
    return
  }
  originalConsoleError.apply(console, args)
}

// 清理旧数据的函数
function cleanupOldData() {
  try {
    console.log('🧹 开始清理旧数据...')

    // 清理旧的聊天数据
    localStorage.removeItem('leaftalk_chats')

    // 清理旧的语言设置
    localStorage.removeItem('language')

    // 清理旧的用户信息
    localStorage.removeItem('user_info')
    localStorage.removeItem('user')
    localStorage.removeItem('token')

    console.log('✅ 旧数据清理完成')
  } catch (error) {
    console.error('清理旧数据失败:', error)
  }
}

// 防止重复挂载
let appMounted = false
let appInstance: any = null

// 启动应用的异步函数
async function startApp() {
  // 检查是否已经挂载
  if (appMounted || appInstance) {
    console.warn('⚠️ 应用已经挂载，跳过重复启动')
    return
  }

  // 检查DOM元素
  const appElement = document.querySelector('#app')
  if (!appElement) {
    console.error('❌ 找不到#app元素')
    return
  }

  // 检查是否已经有Vue应用实例
  if ((appElement as any).__vue_app__) {
    if (import.meta.env.DEV) {
      console.log('🔄 开发环境热重载，跳过重复挂载')
    }
    return
  }

  try {
    console.log('🚀 启动叶语聊天系统...')

    // 清理旧数据
    cleanupOldData()

    // 创建路由 - 使用原项目的路由配置
    const { default: router } = await import('./router/index')

    // 创建状态管理
    const pinia = createPinia()

    // 应用CSS变量
    console.log('🎨 应用设计系统...')
    const cssVars = generateCSSVariables()
    const root = document.documentElement
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // 安装插件
    app.use(pinia)
    app.use(router)
    app.use(I18nPlugin)
    // 使用统一的UnifiedIcon组件，不需要额外的图标插件

    // 设置模块上下文
    moduleRegistry.setContext({ app, router, pinia })

    // 注册所有模块
    console.log('📦 注册业务模块...')
    await moduleRegistry.registerAll([
      new AuthModule(),
      new ChatModule(),
      new ContactsModule(),
      new ProfileModule(),
      new DiscoverModule(),
      new GenealogyModule()
    ])

    console.log('✅ 模块化架构初始化完成')

    // 初始化标签页ID（用于多标签页token管理）
    if (!sessionStorage.getItem('yeyu_tab_id')) {
      const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('yeyu_tab_id', tabId)
      console.log('🏷️ 创建标签页ID:', tabId)
    } else {
      console.log('🏷️ 使用现有标签页ID:', sessionStorage.getItem('yeyu_tab_id'))
    }

    // 初始化用户状态
    console.log('🔐 用户状态初始化...')
    try {
      console.log('🔄 开始恢复用户状态...')

      // 初始化authStore
      const { useAuthStore } = await import('./stores/auth')
      const authStore = useAuthStore()
      await authStore.initAuth()

      // 初始化appStore
      const { useAppStore } = await import('./shared/stores/appStore')
      const appStore = useAppStore()
      appStore.restoreUserFromStorage()

      // 检查恢复结果
      const hasUser = !!appStore.user || !!authStore.user
      const hasToken = !!appStore.token || !!authStore.token
      console.log('✅ 用户状态恢复完成:', {
        hasUser,
        hasToken,
        authStoreToken: !!authStore.token,
        appStoreToken: !!appStore.token
      })

      if (hasUser && hasToken) {
        const user = authStore.user || appStore.user
        console.log('👤 当前用户:', user?.username || user?.id)

        // 初始化来电监听服务
        try {
          console.log('📞 初始化来电监听服务...')
          const { incomingCallService } = await import('./modules/webrtc/services/incomingCallService')
          await incomingCallService.initialize()

          // 加入用户房间以接收来电
          if (user?.id) {
            await incomingCallService.joinUserRoom(String(user.id))
          }

          console.log('✅ 来电监听服务初始化完成')
        } catch (error) {
          console.error('❌ 来电监听服务初始化失败:', error)
        }
      }
    } catch (error) {
      console.error('❌ 用户状态恢复失败:', error)
    }

    // 配置Iconify备用CDN
    if (typeof window !== 'undefined') {
      // 设置Iconify的备用API
      window.IconifyProviders = {
        '': {
          resources: [
            'https://api.iconify.design',
            'https://api.unisvg.com',
            'https://api.simplesvg.com',
            // 添加备用CDN
            'https://cdn.jsdelivr.net/npm/@iconify/json@2/json'
          ]
        }
      }
    }

    // 初始化统一用户信息管理
    console.log('👤 初始化统一用户信息管理...')
    try {
      const { initializeUnifiedAvatar } = await import('./shared/composables/useUnifiedAvatar')
      initializeUnifiedAvatar()
      console.log('✅ 统一用户信息管理初始化完成')
    } catch (error) {
      console.error('❌ 统一用户信息管理初始化失败:', error)
    }

    // 初始化身份认证缓存 - 稍后实现
    console.log('🆔 身份认证系统准备就绪')

    // 最后挂载到DOM
    appInstance = app.mount('#app')
    appMounted = true

    console.log('✅ LeafTalk Enterprise started successfully')
  } catch (error) {
    console.error('❌ Failed to start application:', error)
  }
}

// 强力清理localStorage中的所有Blob URL
const cleanupOldBlobUrls = () => {
  try {
    console.log('🧹 开始强力清理所有Blob URL...')
    const keys = Object.keys(localStorage)
    let totalCleaned = 0

    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        if (value && value.includes('blob:')) {
          console.log('🔍 发现包含Blob URL的存储项:', key)

          // 尝试解析为JSON并清理
          try {
            const data = JSON.parse(value)
            const cleanedData = cleanBlobUrlsFromObject(data)
            localStorage.setItem(key, JSON.stringify(cleanedData))
            totalCleaned++
            console.log('✅ 已清理存储项:', key)
          } catch (parseError) {
            // 如果不是JSON，直接检查是否是Blob URL字符串
            if (value.startsWith('blob:')) {
              localStorage.removeItem(key)
              totalCleaned++
              console.log('🗑️ 删除Blob URL存储项:', key)
            }
          }
        }
      } catch (error) {
        console.warn('处理存储项失败:', key, error)
      }
    })

    console.log(`✅ Blob URL清理完成，共处理 ${totalCleaned} 个存储项`)
  } catch (error) {
    console.warn('清理Blob URL失败:', error)
  }
}

// 递归清理对象中的Blob URL
const cleanBlobUrlsFromObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    return obj.startsWith('blob:') ? '' : obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanBlobUrlsFromObject(item))
  }

  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanBlobUrlsFromObject(value)
    }
    return cleaned
  }

  return obj
}

// 设置全局事件监听
const setupGlobalEventListeners = () => {
  // 监听API客户端的toast事件
  window.addEventListener('yeyu:show-toast', (event: any) => {
    const { message, type, duration } = event.detail
    console.log('📢 收到toast事件:', { message, type, duration })

    // 使用应用的toast系统 - 稍后实现
    console.log('📢 Toast消息:', message, type)
  })

  console.log('✅ 全局事件监听器已设置')
}

// 初始化崩溃预防系统
console.log('🛡️ 初始化崩溃预防系统...')
recoverFromCrash() // 从之前的崩溃中恢复

// 启动应用
setupGlobalEventListeners()
startApp()

// 预加载头像以提升性能 - 稍后实现
console.log('🖼️ 头像系统准备就绪')

// 清理旧的Blob URL
cleanupOldBlobUrls()

// 增强的全局错误处理来捕获所有Blob URL错误
window.addEventListener('error', (event) => {
  const message = event.message || ''
  const filename = event.filename || ''

  // 检查是否是Blob URL相关错误
  if (message.includes('blob:') || filename.includes('blob:') ||
      message.includes('ERR_FILE_NOT_FOUND') ||
      message.includes('net::ERR_FILE_NOT_FOUND')) {
    console.warn('🚫 拦截Blob URL错误:', { message, filename })
    event.preventDefault()
    event.stopPropagation()
    return false
  }
}, true) // 使用捕获阶段

// 处理Promise中的Blob URL错误
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason ? event.reason.toString() : ''
  if (reason.includes('blob:') || reason.includes('ERR_FILE_NOT_FOUND')) {
    console.warn('🚫 拦截Promise中的Blob URL错误:', reason)
    event.preventDefault()
  }
})

// 拦截网络请求错误 - 临时注释掉以测试API问题
// const originalFetch = window.fetch
// window.fetch = function(...args) {
//   const url = args[0]
//   if (typeof url === 'string' && url.startsWith('blob:')) {
//     console.warn('🚫 拦截Blob URL网络请求:', url)
//     return Promise.reject(new Error('Blob URL已被拦截'))
//   }
//   return originalFetch.apply(this, args)
// }

// 安装全局弹窗替换（暂时禁用以避免意外弹窗）
// console.log('🎨 安装全局弹窗替换...')
// installGlobalDialog()

// 初始化全局翻译管理器
console.log('🌍 初始化全局翻译管理器...')
try {
  // 初始化全局翻译管理器
  globalTranslationManager.initialize()
  console.log('✅ 全局翻译管理器初始化完成')
} catch (error) {
  console.error('❌ 全局翻译管理器初始化失败:', error)
}

// 开发环境下的热重载支持和调试工具
if (import.meta.hot) {
  import.meta.hot.accept()
}

// 开发环境下加载测试数据清理工具
if (import.meta.env.DEV) {
  import('./utils/cleanupTestData.js').then(() => {
    console.log('🧹 测试数据清理工具已加载')
    console.log('💡 在控制台中使用以下命令:')
    console.log('  - cleanupTestData() - 一键清理所有测试数据')
    console.log('  - clearLocalData() - 清理本地存储数据')
    console.log('  - resetContacts() - 重置联系人数据')
    console.log('')
    console.log('🎯 如果通讯录被测试数据填满，请运行: cleanupTestData()')
  }).catch(err => {
    console.warn('⚠️ 清理工具加载失败:', err)
  })
}
