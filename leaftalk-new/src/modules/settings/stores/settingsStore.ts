/**
 * 通用设置数据存储
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsAPI } from '../services/api'

export interface GeneralSettings {
  // 多语言设置
  language: 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR'
  
  // 字体设置
  fontSize: 'small' | 'standard' | 'large' | 'extra-large'
  
  // 聊天设置
  enterToSend: boolean
  translateEnabled: boolean
  chatBackground: string
  emojiSettings: {
    recentEmojis: string[]
    customEmojis: string[]
  }
  
  // 媒体设置
  autoDownload: boolean
  photoVideoQuality: 'low' | 'standard' | 'high' | 'original'
  
  // 发现页管理
  momentsEnabled: boolean
  videoChannelEnabled: boolean
  liveAndNearbyEnabled: boolean
  
  // 辅助功能
  earphoneMode: boolean
  voiceToText: boolean
  textToVoice: boolean
  highContrast: boolean
  
  // 存储设置
  autoCleanup: boolean
  cleanupDays: number
  maxStorageSize: number // GB
  
  // 通知设置
  soundEnabled: boolean
  vibrationEnabled: boolean
  showPreview: boolean
}

export const useGeneralStore = defineStore('general', () => {
  // 默认设置
  const defaultSettings: GeneralSettings = {
    language: 'zh-CN',
    fontSize: 'standard',
    enterToSend: false,
    translateEnabled: true,
    chatBackground: 'default',
    emojiSettings: {
      recentEmojis: [],
      customEmojis: []
    },
    autoDownload: true,
    photoVideoQuality: 'standard',
    momentsEnabled: true,
    videoChannelEnabled: true,
    liveAndNearbyEnabled: true,
    earphoneMode: false,
    voiceToText: true,
    textToVoice: false,
    highContrast: false,
    autoCleanup: true,
    cleanupDays: 7,
    maxStorageSize: 10,
    soundEnabled: true,
    vibrationEnabled: true,
    showPreview: true
  }
  
  // 当前设置
  const settings = ref<GeneralSettings>({ ...defaultSettings })
  
  // 应用版本信息
  const appVersion = ref('1.0.0')
  const buildNumber = ref('20250703')
  const updateAvailable = ref(false)
  
  // 存储使用情况
  const storageInfo = ref({
    used: 0, // MB
    total: 0, // MB
    breakdown: {
      images: 0,
      videos: 0,
      files: 0,
      cache: 0,
      other: 0
    }
  })
  
  // 初始化设置
  const init = async () => {
    try {
      // 先尝试从API获取设置
      const response = await settingsAPI.getSettings()
      if (response.data.success) {
        const apiSettings = response.data.data
        settings.value = {
          ...defaultSettings,
          ...apiSettings
        }
        console.log('✅ 通用设置已从API加载')
        // 初始化存储信息
        calculateStorageUsage()
        return
      }
    } catch (error) {
      console.warn('⚠️ 从API加载通用设置失败，使用本地存储:', error)
    }

    // 如果API失败，从本地存储加载
    const savedSettings = localStorage.getItem('yeyu_general_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        settings.value = { ...defaultSettings, ...parsed }
        console.log('✅ 通用设置已从本地存储加载')
      } catch (error) {
        console.error('❌ 通用设置加载失败:', error)
        settings.value = { ...defaultSettings }
      }
    } else {
      settings.value = { ...defaultSettings }
    }

    // 初始化存储信息
    calculateStorageUsage()
  }
  
  // 保存设置
  const saveSettings = async () => {
    try {
      // 保存到API
      await settingsAPI.updateSettings(settings.value)
      console.log('✅ 通用设置已保存到API')
    } catch (error) {
      console.warn('⚠️ 保存到API失败，使用本地存储:', error)
    }

    try {
      // 同时保存到本地存储作为备份
      localStorage.setItem('yeyu_general_settings', JSON.stringify(settings.value))
      console.log('✅ 通用设置已保存到本地存储')
    } catch (error) {
      console.error('❌ 通用设置本地保存失败:', error)
    }
  }
  
  // 更新单个设置
  const updateSetting = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    settings.value[key] = value
    saveSettings()
    
    // 应用设置变更
    applySettingChange(key, value)
  }
  
  // 批量更新设置
  const updateSettings = (newSettings: Partial<GeneralSettings>) => {
    Object.assign(settings.value, newSettings)
    saveSettings()
  }
  
  // 重置为默认设置
  const resetToDefault = () => {
    settings.value = { ...defaultSettings }
    saveSettings()
  }
  
  // 应用设置变更
  const applySettingChange = (key: string, value: any) => {
    switch (key) {
      case 'fontSize':
        applyFontSize(value)
        break
      case 'language':
        applyLanguage(value)
        break
      case 'chatBackground':
        applyChatBackground(value)
        break
      case 'highContrast':
        applyHighContrast(value)
        break
    }
  }
  
  // 应用字体大小
  const applyFontSize = (fontSize: string) => {
    const fontSizeMap = {
      'small': '14px',
      'standard': '16px',
      'large': '18px',
      'extra-large': '20px'
    }

    const size = fontSizeMap[fontSize as keyof typeof fontSizeMap] || '16px'

    // 设置CSS变量
    document.documentElement.style.setProperty('--base-font-size', size)
    document.documentElement.style.setProperty('--chat-font-size', size)

    // 添加字体大小类名到body
    document.body.className = document.body.className.replace(/font-size-\w+/g, '')
    document.body.classList.add(`font-size-${fontSize}`)

    console.log('📝 字体大小已应用:', fontSize, size)
  }
  
  // 应用语言设置
  const applyLanguage = (language: string) => {
    try {
      // 使用统一的语言存储键名
      localStorage.setItem('yeyu_language', language)

      // 使用i18n插件的语言切换函数
      if (typeof window !== 'undefined' && (window as any).$setLanguage) {
        (window as any).$setLanguage(language as any)
        console.log('✅ 通过i18n插件更新语言到:', language)
      }

      console.log('🌐 语言已切换到:', language)
    } catch (error) {
      console.error('❌ 语言切换失败:', error)
    }
  }
  
  // 应用聊天背景
  const applyChatBackground = (background: string) => {
    try {
      // 获取聊天容器元素
      const chatContainers = document.querySelectorAll('.messages-container, .simple-chat, .chat-messages')

      chatContainers.forEach(container => {
        const element = container as HTMLElement

        if (background === 'default') {
          element.style.background = '#f7f7f7'
          element.style.backgroundImage = 'none'
        } else if (background.startsWith('custom:')) {
          // 自定义背景图片
          const imageUrl = background.replace('custom:', '')
          element.style.backgroundImage = `url(${imageUrl})`
          element.style.backgroundSize = 'cover'
          element.style.backgroundPosition = 'center'
          element.style.backgroundRepeat = 'no-repeat'
        } else if (background.startsWith('color-')) {
          // 纯色背景
          const colorMap: Record<string, string> = {
            'color-white': '#ffffff',
            'color-gray': '#f5f5f5',
            'color-blue': '#e3f2fd',
            'color-green': '#e8f5e8',
            'color-pink': '#fce4ec'
          }
          const color = colorMap[background] || '#f7f7f7'
          element.style.background = color
          element.style.backgroundImage = 'none'
        } else if (background.startsWith('image-')) {
          // 预设图片背景
          const imageMap: Record<string, string> = {
            'image-1': 'https://picsum.photos/800/600?random=1',
            'image-2': 'https://picsum.photos/800/600?random=2',
            'image-3': 'https://picsum.photos/800/600?random=3'
          }
          const imageUrl = imageMap[background]
          if (imageUrl) {
            element.style.backgroundImage = `url(${imageUrl})`
            element.style.backgroundSize = 'cover'
            element.style.backgroundPosition = 'center'
            element.style.backgroundRepeat = 'no-repeat'
          }
        }
      })

      console.log('🎨 聊天背景已应用:', background)
    } catch (error) {
      console.error('❌ 应用聊天背景失败:', error)
    }
  }
  
  // 应用高对比度
  const applyHighContrast = (enabled: boolean) => {
    if (enabled) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }
  
  // 计算存储使用情况
  const calculateStorageUsage = async () => {
    try {
      // 这里应该调用实际的存储计算API
      // 暂时使用模拟数据
      const mockUsage = {
        used: Math.floor(Math.random() * 5000), // MB
        total: 10240, // 10GB
        breakdown: {
          images: Math.floor(Math.random() * 2000),
          videos: Math.floor(Math.random() * 2000),
          files: Math.floor(Math.random() * 500),
          cache: Math.floor(Math.random() * 300),
          other: Math.floor(Math.random() * 200)
        }
      }
      
      storageInfo.value = mockUsage
      console.log('📊 存储使用情况已更新:', mockUsage)
    } catch (error) {
      console.error('❌ 计算存储使用情况失败:', error)
    }
  }
  
  // 清理存储
  const cleanupStorage = async (types: string[] = ['cache', 'temp']) => {
    try {
      console.log('🧹 开始清理存储...', types)
      
      // 这里应该调用实际的清理API
      // 模拟清理过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 重新计算存储使用情况
      await calculateStorageUsage()
      
      console.log('✅ 存储清理完成')
      return true
    } catch (error) {
      console.error('❌ 存储清理失败:', error)
      return false
    }
  }
  
  // 检查更新
  const checkForUpdates = async () => {
    try {
      console.log('🔍 检查更新中...')
      
      // 这里应该调用实际的更新检查API
      // 模拟检查过程
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟更新检查结果
      const hasUpdate = Math.random() > 0.8
      updateAvailable.value = hasUpdate
      
      if (hasUpdate) {
        console.log('🆕 发现新版本')
        return {
          hasUpdate: true,
          version: '1.0.1',
          description: '修复了一些问题，提升了性能',
          size: '25.6MB',
          releaseDate: new Date().toISOString()
        }
      } else {
        console.log('✅ 已是最新版本')
        return { hasUpdate: false }
      }
    } catch (error) {
      console.error('❌ 检查更新失败:', error)
      return { hasUpdate: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
  
  // 计算属性
  const languageLabel = computed(() => {
    const languageMap = {
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      'en-US': 'English',
      'ja-JP': '日本語',
      'ko-KR': '한국어'
    }
    return languageMap[settings.value.language] || '简体中文'
  })
  
  const fontSizeLabel = computed(() => {
    const fontSizeMap = {
      'small': '小',
      'standard': '标准',
      'large': '大',
      'extra-large': '特大'
    }
    return fontSizeMap[settings.value.fontSize] || '标准'
  })
  
  const storageUsedGB = computed(() => {
    return (storageInfo.value.used / 1024).toFixed(1)
  })
  
  const storageTotalGB = computed(() => {
    return (storageInfo.value.total / 1024).toFixed(1)
  })
  
  const storageUsagePercent = computed(() => {
    return Math.round((storageInfo.value.used / storageInfo.value.total) * 100)
  })
  
  // 自动初始化：从 localStorage 或 API 加载设置
  ;(async () => {
    try {
      await init()
      console.log('✅ [settingsStore] 自动初始化完成')
    } catch (error) {
      console.error('❌ [settingsStore] 自动初始化失败:', error)
    }
  })()

  return {
    settings,
    appVersion,
    buildNumber,
    updateAvailable,
    storageInfo,
    languageLabel,
    fontSizeLabel,
    storageUsedGB,
    storageTotalGB,
    storageUsagePercent,
    init,
    saveSettings,
    updateSetting,
    updateSettings,
    resetToDefault,
    applySettingChange,
    calculateStorageUsage,
    cleanupStorage,
    checkForUpdates
  }
})
