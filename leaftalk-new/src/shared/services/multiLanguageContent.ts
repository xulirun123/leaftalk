/**
 * 多语言内容管理系统
 * 解决用户生成内容的国际化问题
 */

export interface MultiLanguageContent {
  id: string
  originalLanguage: string
  originalText: string
  translations: Record<string, string>
  autoTranslated: Record<string, boolean>
  lastUpdated: Date
}

export interface ContentWithTranslation {
  id: string
  content: MultiLanguageContent
  author: {
    id: string
    name: string
    preferredLanguage: string
  }
  createdAt: Date
  type: 'moment' | 'video' | 'comment' | 'message'
}

export class MultiLanguageContentService {
  private translationAPI = {
    // 模拟翻译API
    translate: async (text: string, from: string, to: string): Promise<string> => {
      // 这里应该调用真实的翻译服务（如Google Translate, Azure Translator等）
      console.log(`翻译: ${text} (${from} -> ${to})`)
      
      // 模拟翻译结果
      const translations: Record<string, Record<string, string>> = {
        'zh-CN': {
          'en': 'Hello, this is a translated message from Chinese to English',
          'ja': 'こんにちは、これは中国語から日本語に翻訳されたメッセージです',
          'ko': '안녕하세요, 이것은 중국어에서 한국어로 번역된 메시지입니다'
        },
        'en': {
          'zh-CN': '你好，这是从英文翻译成中文的消息',
          'ja': 'こんにちは、これは英語から日本語に翻訳されたメッセージです',
          'ko': '안녕하세요, 이것은 영어에서 한국어로 번역된 메시지입니다'
        }
      }
      
      return translations[from]?.[to] || `[翻译] ${text}`
    }
  }

  /**
   * 创建多语言内容
   */
  async createMultiLanguageContent(
    originalText: string, 
    originalLanguage: string,
    targetLanguages: string[] = ['zh-CN', 'en', 'ja', 'ko', 'zh-TW']
  ): Promise<MultiLanguageContent> {
    const content: MultiLanguageContent = {
      id: this.generateId(),
      originalLanguage,
      originalText,
      translations: { [originalLanguage]: originalText },
      autoTranslated: { [originalLanguage]: false },
      lastUpdated: new Date()
    }

    // 自动翻译到其他语言
    for (const lang of targetLanguages) {
      if (lang !== originalLanguage) {
        try {
          const translated = await this.translationAPI.translate(originalText, originalLanguage, lang)
          content.translations[lang] = translated
          content.autoTranslated[lang] = true
        } catch (error) {
          console.error(`翻译失败 (${originalLanguage} -> ${lang}):`, error)
        }
      }
    }

    return content
  }

  /**
   * 获取用户偏好语言的内容
   */
  getContentInLanguage(content: MultiLanguageContent, preferredLanguage: string): string {
    // 1. 优先返回用户偏好语言
    if (content.translations[preferredLanguage]) {
      return content.translations[preferredLanguage]
    }

    // 2. 如果没有偏好语言，返回原文
    if (content.translations[content.originalLanguage]) {
      return content.translations[content.originalLanguage]
    }

    // 3. 返回任何可用的翻译
    const availableLanguages = Object.keys(content.translations)
    if (availableLanguages.length > 0) {
      return content.translations[availableLanguages[0]]
    }

    // 4. 最后返回原文
    return content.originalText
  }

  /**
   * 手动更新翻译
   */
  async updateTranslation(
    contentId: string, 
    language: string, 
    newTranslation: string
  ): Promise<void> {
    // 这里应该更新数据库
    console.log(`更新翻译: ${contentId} (${language}) -> ${newTranslation}`)
  }

  /**
   * 检测文本语言
   */
  async detectLanguage(text: string): Promise<string> {
    // 这里应该调用语言检测API
    // 简单的启发式检测
    if (/[\u4e00-\u9fff]/.test(text)) {
      return /[\u3400-\u4dbf\uf900-\ufaff]/.test(text) ? 'zh-TW' : 'zh-CN'
    }
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja'
    }
    if (/[\uac00-\ud7af]/.test(text)) {
      return 'ko'
    }
    return 'en'
  }

  /**
   * 批量处理内容翻译
   */
  async batchTranslateContent(
    contents: Array<{ id: string; text: string; language?: string }>,
    targetLanguages: string[]
  ): Promise<MultiLanguageContent[]> {
    const results: MultiLanguageContent[] = []

    for (const content of contents) {
      const detectedLanguage = content.language || await this.detectLanguage(content.text)
      const multiLangContent = await this.createMultiLanguageContent(
        content.text,
        detectedLanguage,
        targetLanguages
      )
      results.push(multiLangContent)
    }

    return results
  }

  /**
   * 获取翻译质量评分
   */
  getTranslationQuality(content: MultiLanguageContent, language: string): number {
    // 自动翻译的质量较低
    if (content.autoTranslated[language]) {
      return 0.7
    }
    // 人工翻译或原文质量较高
    return language === content.originalLanguage ? 1.0 : 0.9
  }

  /**
   * 生成内容ID
   */
  private generateId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 内容展示组件的辅助函数
 */
export class ContentDisplayHelper {
  constructor(private contentService: MultiLanguageContentService) {}

  /**
   * 为内容添加翻译标识
   */
  formatContentWithTranslationInfo(
    content: MultiLanguageContent,
    displayLanguage: string,
    showTranslationInfo: boolean = true
  ): { text: string; isTranslated: boolean; quality: number; originalLanguage: string } {
    const text = this.contentService.getContentInLanguage(content, displayLanguage)
    const isTranslated = displayLanguage !== content.originalLanguage
    const quality = this.contentService.getTranslationQuality(content, displayLanguage)

    return {
      text: showTranslationInfo && isTranslated ? `${text} [译]` : text,
      isTranslated,
      quality,
      originalLanguage: content.originalLanguage
    }
  }

  /**
   * 获取语言显示名称
   */
  getLanguageDisplayName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      'en': 'English',
      'ja': '日本語',
      'ko': '한국어'
    }
    return languageNames[languageCode] || languageCode
  }
}

// 单例实例
export const multiLanguageContentService = new MultiLanguageContentService()
export const contentDisplayHelper = new ContentDisplayHelper(multiLanguageContentService)
