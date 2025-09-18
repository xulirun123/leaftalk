/**
 * Vue组合式函数 - 国际化
 */

import {
  $setLanguage as setLang,
  $getCurrentLanguage as getCurrentLanguage,
  SUPPORTED_LANGUAGES,
  $addLanguagePack as addTranslationKey,
  type LanguageCode
} from '../plugins/i18n'

export function useI18n() {
  // 注意：现在使用全局国际化系统，这个组合式函数主要用于兼容性
  // 推荐直接在组件中使用 $t, $setLanguage 等全局方法

  const setLanguage = (lang: LanguageCode) => {
    return setLang(lang)
  }

  const getLanguageName = (code: LanguageCode) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)
    return lang ? lang.name : code
  }

  const getLanguageNativeName = (code: LanguageCode) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)
    return lang ? lang.nativeName : code
  }

  const isLanguageSupported = (code: string): code is LanguageCode => {
    return SUPPORTED_LANGUAGES.some(l => l.code === code)
  }

  // 获取全局翻译函数
  const t = (key: string) => {
    // 在组件外部使用时，需要通过全局实例获取
    if (typeof window !== 'undefined' && (window as any).__VUE_APP__) {
      return (window as any).__VUE_APP__.config.globalProperties.$t(key)
    }
    return key // 降级处理
  }

  return {
    // 兼容性方法 - 推荐直接使用全局 $t, $setLanguage 等
    t,
    setLanguage,
    getCurrentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    getLanguageName,
    getLanguageNativeName,
    isLanguageSupported
  }
}

export default useI18n