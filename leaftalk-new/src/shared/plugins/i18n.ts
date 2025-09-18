/**
 * 国际化插件
 * 提供多语言支持
 */

import { App, ref, computed } from 'vue'
import { createI18n } from 'vue-i18n'

// 导入语言包
import zhCN from '../i18n/locales/zh-CN.json'
import zhTW from '../i18n/locales/zh-TW.json'
import en from '../i18n/locales/en.json'
import ja from '../i18n/locales/ja.json'
import ko from '../i18n/locales/ko.json'
import ms from '../i18n/locales/ms.json'
import fr from '../i18n/locales/fr.json'
import de from '../i18n/locales/de.json'
import es from '../i18n/locales/es.json'

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  {
    code: 'zh-CN',
    name: '简体中文',
    nativeName: '简体中文',
    flag: '🇨🇳'
  },
  {
    code: 'zh-TW',
    name: '繁體中文',
    nativeName: '繁體中文',
    flag: '🇹🇼'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'ja',
    name: '日本語',
    nativeName: '日本語',
    flag: '🇯🇵'
  },
  {
    code: 'ko',
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷'
  },
  {
    code: 'ms',
    name: 'Bahasa Malaysia',
    nativeName: 'Bahasa Malaysia',
    flag: '🇲🇾'
  },
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷'
  },
  {
    code: 'de',
    name: 'Deutsch',
    nativeName: 'Deutsch',
    flag: '🇩🇪'
  },
  {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸'
  }
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

// 当前语言状态
const currentLanguage = ref<LanguageCode>('zh-CN')

// 创建i18n实例
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'zh': zhCN,  // 添加 'zh' 作为 'zh-CN' 的别名
    'zh-TW': zhTW,
    'en': en,
    'ja': ja,
    'ko': ko,
    'ms': ms,
    'fr': fr,
    'de': de,
    'es': es
  }
})

// 全局语言切换事件总线
const languageChangeCallbacks: Array<(lang: LanguageCode) => void> = []

// 注册语言切换回调
const onLanguageChange = (callback: (lang: LanguageCode) => void) => {
  languageChangeCallbacks.push(callback)
  return () => {
    const index = languageChangeCallbacks.indexOf(callback)
    if (index > -1) {
      languageChangeCallbacks.splice(index, 1)
    }
  }
}

// 触发语言切换事件
const triggerLanguageChange = (lang: LanguageCode) => {
  console.log('🔔 触发全局语言切换事件:', lang, '回调数量:', languageChangeCallbacks.length)
  languageChangeCallbacks.forEach(callback => {
    try {
      callback(lang)
    } catch (error) {
      console.error('语言切换回调执行失败:', error)
    }
  })
}

// 设置语言函数 - 全局统一切换
const setLanguage = (lang: LanguageCode): boolean => {
  try {
    // 检查语言是否支持
    if (!SUPPORTED_LANGUAGES.find(l => l.code === lang)) {
      console.warn(`不支持的语言: ${lang}`)
      return false
    }

    console.log('🔄 全局语言管理器开始切换语言到:', lang)
    console.log('🔍 切换前 i18n.global.locale.value:', i18n.global.locale.value)

    // 1. 更新i18n locale - 这是关键步骤
    i18n.global.locale.value = lang as any

    // 2. 更新当前语言状态
    currentLanguage.value = lang

    // 3. 保存到localStorage
    localStorage.setItem('yeyu_language', lang)
    localStorage.setItem('user-locale', lang)

    // 4. 更新HTML语言属性
    document.documentElement.lang = lang

    // 5. 触发全局语言切换事件 - 通知所有组件更新
    triggerLanguageChange(lang)

    console.log('✅ 全局语言管理器语言已切换到:', lang)
    console.log('🌐 切换后 i18n.global.locale.value:', i18n.global.locale.value)
    console.log('📝 当前可用的翻译键:', Object.keys(i18n.global.messages.value[lang] || {}))

    return true
  } catch (error) {
    console.error('❌ 全局语言管理器语言切换失败:', error)
    return false
  }
}

// 获取当前语言
const getCurrentLanguage = (): LanguageCode => {
  return currentLanguage.value
}

// 初始化语言设置
const initializeLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('yeyu_language') as LanguageCode
    if (savedLanguage && SUPPORTED_LANGUAGES.find(l => l.code === savedLanguage)) {
      setLanguage(savedLanguage)
    } else {
      setLanguage('zh-CN')
    }
  } catch (error) {
    console.error('语言初始化失败:', error)
    setLanguage('zh-CN')
  }
}

export default {
  install(app: App) {
    // 安装i18n
    app.use(i18n)

    // 初始化语言设置
    initializeLanguage()

    // 提供全局翻译函数
    app.config.globalProperties.$t = (key: string) => {
      return i18n.global.t(key)
    }

    // 提供语言相关的全局属性
    app.config.globalProperties.$setLanguage = setLanguage
    app.config.globalProperties.$getCurrentLanguage = getCurrentLanguage
    app.config.globalProperties.$currentLanguage = computed(() => currentLanguage.value)
    app.config.globalProperties.$supportedLanguages = SUPPORTED_LANGUAGES
    app.config.globalProperties.$onLanguageChange = onLanguageChange

    // 提供注入
    app.provide('$t', app.config.globalProperties.$t)
    app.provide('$setLanguage', setLanguage)
    app.provide('$getCurrentLanguage', getCurrentLanguage)
    app.provide('$currentLanguage', computed(() => currentLanguage.value))
    app.provide('$supportedLanguages', SUPPORTED_LANGUAGES)
    app.provide('$onLanguageChange', onLanguageChange)

    console.log('✅ 全局语言管理器已加载')
    console.log('🌐 支持的语言:', SUPPORTED_LANGUAGES.map(l => l.code))
    console.log('🔔 语言切换事件系统已启用')
  }
}

export { i18n, setLanguage, getCurrentLanguage, currentLanguage, onLanguageChange }
