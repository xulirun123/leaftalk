/**
 * Vue 国际化类型定义
 */

import { ComputedRef } from 'vue'

export type LanguageCode = 'zh-CN' | 'en-US' | 'zh-TW' | 'ja-JP' | 'ko-KR'

export interface SupportedLanguage {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /**
     * 翻译函数
     * @param key 翻译键
     * @returns 翻译后的文本
     */
    $t: (key: string) => string
    
    /**
     * 设置语言
     * @param lang 语言代码
     * @returns 是否设置成功
     */
    $setLanguage: (lang: LanguageCode) => boolean
    
    /**
     * 获取当前语言
     * @returns 当前语言代码
     */
    $getCurrentLanguage: () => LanguageCode
    
    /**
     * 当前语言（响应式）
     */
    $currentLanguage: ComputedRef<LanguageCode>
    
    /**
     * 支持的语言列表
     */
    $supportedLanguages: readonly SupportedLanguage[]
  }
}

// 扩展 Window 接口
declare global {
  interface Window {
    $setLanguage?: (lang: LanguageCode) => boolean
    $getCurrentLanguage?: () => LanguageCode
    $supportedLanguages?: readonly SupportedLanguage[]
  }
}

export {}
