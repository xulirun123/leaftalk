/**
 * 全局语言管理 Composable
 * 统一管理整个应用的语言切换
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage, getCurrentLanguage, onLanguageChange, type LanguageCode } from '../plugins/i18n'

// 全局语言状态
const globalLanguage = ref<LanguageCode>('zh-CN')
const isLanguageChanging = ref(false)

// 语言切换历史记录
const languageHistory = ref<LanguageCode[]>([])

// 支持的语言列表
const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN' as LanguageCode, name: '简体中文', nativeName: '简体中文' },
  { code: 'zh-TW' as LanguageCode, name: '繁體中文', nativeName: '繁體中文' },
  { code: 'en' as LanguageCode, name: 'English', nativeName: 'English' },
  { code: 'ja' as LanguageCode, name: '日本語', nativeName: '日本語' },
  { code: 'ko' as LanguageCode, name: '한국어', nativeName: '한국어' },
  { code: 'ms' as LanguageCode, name: 'Bahasa Malaysia', nativeName: 'Bahasa Malaysia' },
  { code: 'fr' as LanguageCode, name: 'Français', nativeName: 'Français' },
  { code: 'de' as LanguageCode, name: 'Deutsch', nativeName: 'Deutsch' },
  { code: 'es' as LanguageCode, name: 'Español', nativeName: 'Español' }
] as const

/**
 * 全局语言管理 Hook
 */
export function useGlobalLanguage() {
  const { locale, t } = useI18n()

  // 同步全局语言状态
  const syncGlobalLanguage = () => {
    const currentLang = getCurrentLanguage()
    if (globalLanguage.value !== currentLang) {
      globalLanguage.value = currentLang
      locale.value = currentLang
    }
  }

  // 切换语言 - 全局统一方法
  const changeLanguage = async (lang: LanguageCode): Promise<boolean> => {
    if (isLanguageChanging.value) {
      console.warn('🔄 语言切换正在进行中，请稍候...')
      return false
    }

    try {
      isLanguageChanging.value = true
      console.log('🌐 全局语言管理器开始切换语言:', lang)

      // 1. 验证语言是否支持
      const isSupported = SUPPORTED_LANGUAGES.some(l => l.code === lang)
      if (!isSupported) {
        console.error('❌ 不支持的语言:', lang)
        return false
      }

      // 2. 记录语言切换历史
      if (!languageHistory.value.includes(globalLanguage.value)) {
        languageHistory.value.push(globalLanguage.value)
      }

      // 3. 调用全局语言设置函数
      const success = setLanguage(lang)
      if (!success) {
        console.error('❌ 全局语言设置失败')
        return false
      }

      // 4. 更新本地状态
      globalLanguage.value = lang
      locale.value = lang

      // 5. 保存到本地存储
      localStorage.setItem('yeyu_language', lang)
      localStorage.setItem('user-locale', lang)

      console.log('✅ 全局语言切换成功:', lang)
      return true

    } catch (error) {
      console.error('❌ 全局语言切换失败:', error)
      return false
    } finally {
      isLanguageChanging.value = false
    }
  }

  // 获取当前语言信息
  const getCurrentLanguageInfo = () => {
    return SUPPORTED_LANGUAGES.find(l => l.code === globalLanguage.value) || SUPPORTED_LANGUAGES[0]
  }

  // 获取语言显示名称
  const getLanguageDisplayName = (lang: LanguageCode, useNative = false) => {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang)
    if (!langInfo) return lang

    if (useNative) {
      return langInfo.nativeName
    }

    // 根据当前语言返回对应的翻译
    const key = `languages.${lang.replace('-', '')}`
    const translated = t(key)
    return translated !== key ? translated : langInfo.nativeName
  }

  // 监听语言变化
  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    // 初始化同步语言状态
    syncGlobalLanguage()

    // 注册语言变化监听器
    unsubscribe = onLanguageChange((newLang) => {
      console.log('🔔 收到全局语言变化事件:', newLang)
      if (globalLanguage.value !== newLang) {
        globalLanguage.value = newLang
        locale.value = newLang
      }
    })

    console.log('✅ 全局语言管理器已初始化')
  })

  onUnmounted(() => {
    // 清理语言变化监听器
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })

  // 监听 locale 变化，同步到全局状态
  watch(locale, (newLocale) => {
    if (globalLanguage.value !== newLocale) {
      console.log('🔄 检测到 locale 变化，同步到全局状态:', newLocale)
      globalLanguage.value = newLocale as LanguageCode
    }
  })

  return {
    // 状态
    globalLanguage: computed(() => globalLanguage.value),
    isLanguageChanging: computed(() => isLanguageChanging.value),
    languageHistory: computed(() => languageHistory.value),
    supportedLanguages: SUPPORTED_LANGUAGES,

    // 方法
    changeLanguage,
    getCurrentLanguageInfo,
    getLanguageDisplayName,
    syncGlobalLanguage,

    // 计算属性
    currentLanguageInfo: computed(() => getCurrentLanguageInfo()),
    isRTL: computed(() => ['ar', 'he', 'fa'].includes(globalLanguage.value)),
    
    // 翻译函数
    t
  }
}

/**
 * 全局语言状态（可在任何地方使用）
 */
export function useGlobalLanguageState() {
  return {
    globalLanguage: computed(() => globalLanguage.value),
    isLanguageChanging: computed(() => isLanguageChanging.value),
    supportedLanguages: SUPPORTED_LANGUAGES
  }
}

/**
 * 简化的语言切换函数（可在任何地方调用）
 */
export async function switchGlobalLanguage(lang: LanguageCode): Promise<boolean> {
  console.log('🌐 调用全局语言切换函数:', lang)
  
  try {
    const success = setLanguage(lang)
    if (success) {
      globalLanguage.value = lang
      console.log('✅ 全局语言切换成功:', lang)
    }
    return success
  } catch (error) {
    console.error('❌ 全局语言切换失败:', error)
    return false
  }
}

export default useGlobalLanguage
