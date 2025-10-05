/**
 * 自动翻译服务
 * 支持文本翻译、语音翻译和实时翻译
 */

import { ref, computed } from 'vue'

// 翻译API配置
interface TranslationConfig {
  provider: 'baidu' | 'google' | 'microsoft' | 'local'
  apiKey?: string
  secretKey?: string
  endpoint?: string
}

// 翻译结果接口
interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  confidence: number
  timestamp: number
}

// 语音翻译结果接口
interface VoiceTranslationResult extends TranslationResult {
  audioUrl?: string
  duration?: number
  originalAudio?: Blob
  translatedAudio?: Blob
}

// 实时翻译配置
interface RealTimeTranslationConfig {
  sourceLanguage: string
  targetLanguage: string
  enableVoiceOutput: boolean
  voiceSpeed: number
  voicePitch: number
}

// 翻译缓存
const translationCache = new Map<string, TranslationResult>()

// 支持的语言列表
const supportedLanguages = {
  'zh-CN': { name: '简体中文', code: 'zh', voice: 'zh-CN' },
  'zh-TW': { name: '繁体中文', code: 'zh-tw', voice: 'zh-TW' },
  'en': { name: 'English', code: 'en', voice: 'en-US' },
  'ja': { name: '日本語', code: 'ja', voice: 'ja-JP' },
  'ko': { name: '한국어', code: 'ko', voice: 'ko-KR' },
  'ms': { name: 'Bahasa Malaysia', code: 'ms', voice: 'ms-MY' },
  'fr': { name: 'Français', code: 'fr', voice: 'fr-FR' },
  'de': { name: 'Deutsch', code: 'de', voice: 'de-DE' },
  'es': { name: 'Español', code: 'es', voice: 'es-ES' }
}

class AutoTranslationService {
  private config: TranslationConfig
  private isOnline = ref(navigator.onLine)
  private translationQueue: Array<{ text: string; resolve: Function; reject: Function }> = []
  private isProcessing = false
  
  // 语音识别和合成
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis
  private isListening = ref(false)
  private isTranslating = ref(false)
  
  // 实时翻译配置
  private realTimeConfig: RealTimeTranslationConfig = {
    sourceLanguage: 'zh-CN',
    targetLanguage: 'en',
    enableVoiceOutput: true,
    voiceSpeed: 1.0,
    voicePitch: 1.0
  }

  constructor(config: TranslationConfig = { provider: 'local' }) {
    this.config = config
    this.synthesis = window.speechSynthesis
    this.setupOnlineListener()
    this.initSpeechRecognition()
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline.value = true
      this.processQueue()
    })
    window.addEventListener('offline', () => {
      this.isOnline.value = false
    })
  }

  /**
   * 初始化语音识别
   */
  private initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = this.realTimeConfig.sourceLanguage
      
      this.recognition.onstart = () => {
        this.isListening.value = true
        console.log('🎤 语音识别开始')
      }
      
      this.recognition.onend = () => {
        this.isListening.value = false
        console.log('🎤 语音识别结束')
      }
      
      this.recognition.onresult = async (event) => {
        const result = event.results[event.results.length - 1]
        if (result.isFinal) {
          const text = result[0].transcript
          console.log('🎤 识别到语音:', text)
          
          // 自动翻译并播放
          await this.translateAndSpeak(text)
        }
      }
      
      this.recognition.onerror = (event) => {
        console.error('🎤 语音识别错误:', event.error)
        this.isListening.value = false
      }
    }
  }

  /**
   * 开始实时语音翻译
   */
  startRealTimeTranslation(config?: Partial<RealTimeTranslationConfig>) {
    if (config) {
      this.realTimeConfig = { ...this.realTimeConfig, ...config }
    }
    
    if (this.recognition) {
      this.recognition.lang = this.realTimeConfig.sourceLanguage
      this.recognition.start()
      console.log(`🔄 开始实时翻译: ${this.realTimeConfig.sourceLanguage} → ${this.realTimeConfig.targetLanguage}`)
    } else {
      console.error('❌ 浏览器不支持语音识别')
    }
  }

  /**
   * 停止实时语音翻译
   */
  stopRealTimeTranslation() {
    if (this.recognition && this.isListening.value) {
      this.recognition.stop()
      console.log('⏹️ 停止实时翻译')
    }
  }

  /**
   * 翻译并播放语音
   */
  async translateAndSpeak(text: string): Promise<VoiceTranslationResult> {
    this.isTranslating.value = true
    
    try {
      // 翻译文本
      const translationResult = await this.translateText(
        text,
        this.realTimeConfig.targetLanguage,
        this.realTimeConfig.sourceLanguage
      )
      
      // 如果启用语音输出，播放翻译结果
      if (this.realTimeConfig.enableVoiceOutput) {
        await this.speakText(translationResult.translatedText, this.realTimeConfig.targetLanguage)
      }
      
      const voiceResult: VoiceTranslationResult = {
        ...translationResult,
        duration: text.length * 100 // 估算时长
      }
      
      console.log('🔄 翻译完成:', voiceResult)
      return voiceResult
      
    } finally {
      this.isTranslating.value = false
    }
  }

  /**
   * 语音合成播放
   */
  async speakText(text: string, language: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('浏览器不支持语音合成'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = supportedLanguages[language]?.voice || language
      utterance.rate = this.realTimeConfig.voiceSpeed
      utterance.pitch = this.realTimeConfig.voicePitch
      
      utterance.onend = () => {
        console.log('🔊 语音播放完成')
        resolve()
      }
      
      utterance.onerror = (event) => {
        console.error('🔊 语音播放错误:', event.error)
        reject(new Error(event.error))
      }
      
      this.synthesis.speak(utterance)
      console.log('🔊 开始播放语音:', text)
    })
  }

  /**
   * 自动检测文本语言
   */
  async detectLanguage(text: string): Promise<string> {
    const chineseRegex = /[\u4e00-\u9fff]/
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/
    const koreanRegex = /[\uac00-\ud7af]/
    
    if (chineseRegex.test(text)) {
      return 'zh-CN'
    } else if (japaneseRegex.test(text)) {
      return 'ja'
    } else if (koreanRegex.test(text)) {
      return 'ko'
    } else {
      return 'en'
    }
  }

  /**
   * 翻译文本
   */
  async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    // 检查缓存
    const cacheKey = `${text}-${sourceLanguage || 'auto'}-${targetLanguage}`
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!
    }

    // 如果离线，使用本地翻译
    if (!this.isOnline.value) {
      return this.localTranslate(text, targetLanguage, sourceLanguage)
    }

    // 在线翻译
    try {
      const result = await this.onlineTranslate(text, targetLanguage, sourceLanguage)
      
      // 缓存结果
      translationCache.set(cacheKey, result)
      
      return result
    } catch (error) {
      console.warn('在线翻译失败，使用本地翻译:', error)
      return this.localTranslate(text, targetLanguage, sourceLanguage)
    }
  }

  /**
   * 在线翻译
   */
  private async onlineTranslate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const detectedLanguage = sourceLanguage || await this.detectLanguage(text)

    // 如果源语言和目标语言相同，直接返回
    if (detectedLanguage === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        confidence: 1.0,
        timestamp: Date.now()
      }
    }

    // 尝试多种翻译服务（按优先级排序）
    const translationMethods = [
      () => this.myMemoryTranslateAPI(text, targetLanguage, detectedLanguage),
      () => this.googleTranslateAPI(text, targetLanguage, detectedLanguage),
      () => this.libreTranslateAPI(text, targetLanguage, detectedLanguage),
      () => this.microsoftTranslateAPI(text, targetLanguage, detectedLanguage)
    ]

    for (let i = 0; i < translationMethods.length; i++) {
      const method = translationMethods[i]
      const serviceName = ['MyMemory', 'Google', 'LibreTranslate', 'Microsoft'][i]

      try {
        console.log(`🔄 尝试${serviceName}翻译服务...`)
        const result = await method()

        if (result.translatedText && result.translatedText !== text) {
          console.log(`✅ ${serviceName}翻译成功:`, {
            original: text,
            translated: result.translatedText,
            confidence: result.confidence
          })
          return result
        } else {
          console.warn(`⚠️ ${serviceName}翻译无效果，尝试下一个服务`)
        }
      } catch (error) {
        console.warn(`❌ ${serviceName}翻译失败:`, error.message)
      }
    }

    // 所有在线翻译都失败，使用本地翻译
    console.log('🔄 所有在线翻译失败，使用本地翻译')
    const localResult = await this.localTranslate(text, targetLanguage, detectedLanguage)

    // 如果本地翻译也没有结果，返回原文但标记为已处理
    if (localResult.translatedText === text) {
      console.log('⚠️ 本地翻译也无结果，保持原文')
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        confidence: 0.1,
        timestamp: Date.now()
      }
    }

    return localResult
  }

  /**
   * MyMemory Translation API (免费，无需API key)
   */
  private async myMemoryTranslateAPI(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<TranslationResult> {
    try {
      const url = 'https://api.mymemory.translated.net/get'
      const params = new URLSearchParams({
        q: text,
        langpair: `${sourceLanguage}|${targetLanguage}`
      })

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        mode: 'cors'
      })

      if (!response.ok) {
        throw new Error(`MyMemory API error: ${response.status}`)
      }

      const data = await response.json()
      const translatedText = data.responseData?.translatedText || text

      if (!translatedText || translatedText === text || translatedText.toLowerCase() === text.toLowerCase()) {
        throw new Error('MyMemory翻译失败或无结果')
      }

      console.log('✅ MyMemory翻译成功:', { original: text, translated: translatedText })

      return {
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        confidence: 0.95,
        timestamp: Date.now()
      }
    } catch (error) {
      console.warn('MyMemory翻译失败:', error.message)
      throw error
    }
  }

  /**
   * LibreTranslate API (免费开源翻译)
   */
  private async libreTranslateAPI(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<TranslationResult> {
    // 使用公共LibreTranslate实例
    const urls = [
      'https://libretranslate.de/translate',
      'https://translate.argosopentech.com/translate',
      'https://libretranslate.com/translate'
    ]

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: sourceLanguage,
            target: targetLanguage,
            format: 'text'
          })
        })

        if (!response.ok) continue

        const data = await response.json()
        const translatedText = data.translatedText

        if (translatedText && translatedText !== text) {
          return {
            originalText: text,
            translatedText,
            sourceLanguage,
            targetLanguage,
            confidence: 0.85,
            timestamp: Date.now()
          }
        }
      } catch (error) {
        console.warn(`LibreTranslate ${url} 失败:`, error)
        continue
      }
    }

    throw new Error('所有LibreTranslate实例都失败')
  }

  /**
   * Google Translate API (免费接口)
   */
  private async googleTranslateAPI(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<TranslationResult> {
    // 尝试多个Google翻译接口
    const urls = [
      // 使用CORS代理
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`)}`,
      // 备用代理
      `https://cors-anywhere.herokuapp.com/https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`,
      // 本地代理（如果有的话）
      `/api/translate?sl=${sourceLanguage}&tl=${targetLanguage}&q=${encodeURIComponent(text)}`
    ]

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        if (!response.ok) continue

        let data
        if (url.includes('allorigins.win')) {
          const result = await response.json()
          data = JSON.parse(result.contents)
        } else {
          data = await response.json()
        }

        const translatedText = data[0]?.[0]?.[0] || text

        if (translatedText && translatedText !== text) {
          return {
            originalText: text,
            translatedText,
            sourceLanguage,
            targetLanguage,
            confidence: 0.9,
            timestamp: Date.now()
          }
        }
      } catch (error) {
        console.warn('Google翻译接口失败:', error)
        continue
      }
    }

    throw new Error('所有Google翻译接口都失败')
  }

  /**
   * Microsoft Translator API (免费接口)
   */
  private async microsoftTranslateAPI(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<TranslationResult> {
    // 使用简单的翻译接口
    const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${sourceLanguage}&to=${targetLanguage}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify([{ text }])
    })

    if (!response.ok) {
      throw new Error(`Microsoft Translate API error: ${response.status}`)
    }

    const data = await response.json()
    const translatedText = data[0]?.translations?.[0]?.text || text

    if (!translatedText || translatedText === text) {
      throw new Error('Microsoft翻译失败或无结果')
    }

    return {
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.85,
      timestamp: Date.now()
    }
  }

  /**
   * 本地翻译（基于预设词典）
   */
  private async localTranslate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const detectedLanguage = sourceLanguage || await this.detectLanguage(text)

    console.log('🔍 本地翻译:', {
      text,
      detectedLanguage,
      targetLanguage
    })

    // 本地翻译词典
    const localDictionary = this.getLocalDictionary()

    let translatedText = text
    let matchCount = 0

    // 简单的词汇替换翻译
    if (localDictionary[detectedLanguage] && localDictionary[detectedLanguage][targetLanguage]) {
      const dictionary = localDictionary[detectedLanguage][targetLanguage]
      console.log('📚 找到词典，词汇数量:', Object.keys(dictionary).length)

      // 按词长度排序，优先匹配长词
      const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length)

      for (const key of sortedKeys) {
        if (text.includes(key)) {
          const regex = new RegExp(key, 'gi')
          const newText = translatedText.replace(regex, dictionary[key])
          if (newText !== translatedText) {
            console.log('🔄 词汇替换:', key, '->', dictionary[key])
            translatedText = newText
            matchCount++
          }
        }
      }
    } else {
      console.log('❌ 未找到对应的翻译词典:', `${detectedLanguage} -> ${targetLanguage}`)
    }

    console.log('📊 本地翻译结果:', {
      original: text,
      translated: translatedText,
      matchCount,
      changed: translatedText !== text
    })

    return {
      originalText: text,
      translatedText,
      sourceLanguage: detectedLanguage,
      targetLanguage,
      confidence: matchCount > 0 ? 0.8 : 0.1,
      timestamp: Date.now()
    }
  }

  /**
   * 获取本地翻译词典
   */
  private getLocalDictionary() {
    return {
      'zh-CN': {
        'en': {
          // 基础词汇
          '你好': 'Hello',
          '再见': 'Goodbye',
          '谢谢': 'Thank you',
          '对不起': 'Sorry',
          '是的': 'Yes',
          '不是': 'No',
          '请': 'Please',
          '帮助': 'Help',
          '我': 'I',
          '你': 'You',
          '他': 'He',
          '她': 'She',
          '我们': 'We',
          '他们': 'They',

          // 应用界面词汇
          '设置': 'Settings',
          '个人信息': 'Personal Info',
          '通用': 'General',
          '隐私': 'Privacy',
          '关于': 'About',
          '退出登录': 'Logout',
          '确定': 'OK',
          '取消': 'Cancel',
          '保存': 'Save',
          '删除': 'Delete',
          '编辑': 'Edit',
          '返回': 'Back',
          '下一步': 'Next',
          '完成': 'Done',
          '性别': 'Gender',
          '个性签名': 'Signature',
          '未设置': 'Not Set',
          '拍了拍你的头': 'Patted your head',
          '国家或地区': 'Country or Region',
          '选择地区': 'Select Region',
          '当前位置': 'Current Location',
          '正在定位': 'Locating...',
          '中国大陆': 'Mainland China',
          '中国香港': 'Hong Kong',
          '中国澳门': 'Macau',
          '中国台湾': 'Taiwan',
          '日本': 'Japan',
          '韩国': 'South Korea',
          '新加坡': 'Singapore',
          '马来西亚': 'Malaysia',
          '泰国': 'Thailand',
          '越南': 'Vietnam',
          '印度尼西亚': 'Indonesia',
          '菲律宾': 'Philippines',
          '印度': 'India',
          '英国': 'United Kingdom',
          '法国': 'France',
          '德国': 'Germany',
          '意大利': 'Italy',
          '西班牙': 'Spain',
          '荷兰': 'Netherlands',
          '比利时': 'Belgium',
          '瑞士': 'Switzerland',
          '奥地利': 'Austria',
          '瑞典': 'Sweden',
          '挪威': 'Norway',
          '丹麦': 'Denmark',
          '芬兰': 'Finland',
          '俄罗斯': 'Russia',
          '美国': 'United States',
          '加拿大': 'Canada',
          '墨西哥': 'Mexico',
          '巴西': 'Brazil',
          '阿根廷': 'Argentina',
          '智利': 'Chile',
          '南非': 'South Africa',
          '埃及': 'Egypt',
          '澳大利亚': 'Australia',
          '新西兰': 'New Zealand'
        },
        'ms': {
          // 基础词汇
          '你好': 'Hello',
          '再见': 'Selamat tinggal',
          '谢谢': 'Terima kasih',
          '对不起': 'Maaf',
          '是的': 'Ya',
          '不是': 'Tidak',
          '请': 'Sila',
          '帮助': 'Bantuan',
          '我': 'Saya',
          '你': 'Anda',
          '他': 'Dia',
          '她': 'Dia',
          '我们': 'Kami',
          '他们': 'Mereka',

          // 应用界面词汇
          '设置': 'Tetapan',
          '个人信息': 'Maklumat Peribadi',
          '通用': 'Umum',
          '隐私': 'Privasi',
          '关于': 'Tentang',
          '退出登录': 'Log Keluar',
          '确定': 'OK',
          '取消': 'Batal',
          '保存': 'Simpan',
          '删除': 'Padam',
          '编辑': 'Edit',
          '返回': 'Kembali',
          '下一步': 'Seterusnya',
          '完成': 'Selesai',
          '性别': 'Jantina',
          '个性签名': 'Tandatangan',
          '未设置': 'Tidak Ditetapkan',
          '拍了拍你的头': 'Menepuk kepala anda',
          '国家或地区': 'Negara atau Wilayah',
          '选择地区': 'Pilih Wilayah',
          '当前位置': 'Lokasi Semasa',
          '正在定位': 'Mencari lokasi...',
          '中国大陆': 'China Daratan',
          '中国香港': 'Hong Kong',
          '中国澳门': 'Macau',
          '中国台湾': 'Taiwan',
          '日本': 'Jepun',
          '韩国': 'Korea Selatan',
          '新加坡': 'Singapura',
          '马来西亚': 'Malaysia',
          '泰国': 'Thailand',
          '越南': 'Vietnam',
          '印度尼西亚': 'Indonesia',
          '菲律宾': 'Filipina',
          '印度': 'India',
          '英国': 'United Kingdom',
          '法国': 'Perancis',
          '德国': 'Jerman',
          '意大利': 'Itali',
          '西班牙': 'Sepanyol',
          '荷兰': 'Belanda',
          '比利时': 'Belgium',
          '瑞士': 'Switzerland',
          '奥地利': 'Austria',
          '瑞典': 'Sweden',
          '挪威': 'Norway',
          '丹麦': 'Denmark',
          '芬兰': 'Finland',
          '俄罗斯': 'Rusia',
          '美国': 'Amerika Syarikat',
          '加拿大': 'Kanada',
          '墨西哥': 'Mexico',
          '巴西': 'Brazil',
          '阿根廷': 'Argentina',
          '智利': 'Chile',
          '南非': 'Afrika Selatan',
          '埃及': 'Mesir',
          '澳大利亚': 'Australia',
          '新西兰': 'New Zealand'
        }
      },
      'en': {
        'zh-CN': {
          'Hello': '你好',
          'Goodbye': '再见',
          'Thank you': '谢谢',
          'Sorry': '对不起',
          'Yes': '是的',
          'No': '不是',
          'Please': '请',
          'Help': '帮助',
          'I': '我',
          'You': '你',
          'He': '他',
          'She': '她',
          'We': '我们',
          'They': '他们'
        }
      }
    }
  }

  // Getters
  get isListeningState() { return this.isListening }
  get isTranslatingState() { return this.isTranslating }
  get currentConfig() { return this.realTimeConfig }
  
  // 配置更新
  updateConfig(config: Partial<RealTimeTranslationConfig>) {
    this.realTimeConfig = { ...this.realTimeConfig, ...config }
    if (this.recognition) {
      this.recognition.lang = this.realTimeConfig.sourceLanguage
    }
  }

  private async processQueue() {
    // 处理翻译队列的逻辑
  }
}

// 全局翻译管理器
class GlobalTranslationManager {
  private currentLanguage = 'zh-CN'
  private translationService: AutoTranslationService
  private observer: MutationObserver | null = null
  private translationQueue: Set<Element> = new Set()
  private isProcessing = false

  constructor() {
    this.translationService = new AutoTranslationService()
    // 延迟初始化，等待DOM准备就绪
    if (typeof window !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initializeGlobalTranslation()
        })
      } else {
        // DOM已经准备就绪
        setTimeout(() => this.initializeGlobalTranslation(), 100)
      }
    }
  }

  // 公共初始化方法
  initialize() {
    console.log('🌍 GlobalTranslationManager 开始初始化...')
    this.initializeGlobalTranslation()
    console.log('✅ GlobalTranslationManager 初始化完成')
  }

  // 初始化全局翻译
  private initializeGlobalTranslation() {
    // 获取当前用户选择的语言
    const currentLang = this.getCurrentUserLanguage()
    this.currentLanguage = currentLang

    // 如果不是中文，自动启用翻译
    if (currentLang !== 'zh-CN') {
      this.enableAutoTranslation(currentLang)
    }

    // 监听语言变化
    this.watchLanguageChanges()

    // 监听DOM变化
    this.startDOMObserver()
  }

  // 获取当前用户选择的语言
  private getCurrentUserLanguage(): string {
    // 从localStorage获取当前语言，优先使用yeyu_language
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('yeyu_language') || localStorage.getItem('user-language') || 'zh-CN'
    }
    return 'zh-CN'
  }

  // 启用自动翻译（公共方法，会触发事件）
  enableAutoTranslation(targetLanguage: string) {
    this.enableAutoTranslationInternal(targetLanguage)
    // 触发全局语言变更事件
    this.notifyLanguageChange(targetLanguage)
  }

  // 启用自动翻译（内部方法，不触发事件）
  private enableAutoTranslationInternal(targetLanguage: string) {
    this.currentLanguage = targetLanguage

    console.log('🌍 启用自动翻译到:', targetLanguage)

    // 立即翻译当前页面
    setTimeout(() => this.translatePage(), 500)

    // 更新语音翻译服务的默认语言
    this.updateVoiceTranslationLanguage(targetLanguage)
  }

  // 禁用自动翻译（公共方法，会触发事件）
  disableAutoTranslation() {
    this.disableAutoTranslationInternal()
    // 触发语言变更事件
    this.notifyLanguageChange('zh-CN')
  }

  // 禁用自动翻译（内部方法，不触发事件）
  private disableAutoTranslationInternal() {
    this.currentLanguage = 'zh-CN'
    console.log('🌍 切换回中文，禁用自动翻译')

    // 恢复原文而不刷新页面
    this.restoreOriginalText()
  }

  // 恢复原文
  private restoreOriginalText() {
    console.log('🔄 恢复页面原文...')

    // 遍历所有已翻译的文本节点，恢复原文
    const allTextNodes = this.getAllTextNodes(document.body)
    let restoredCount = 0

    allTextNodes.forEach(textNode => {
      // 如果节点有原文备份，恢复原文
      const originalText = (textNode as any).__originalText
      if (originalText && textNode.textContent !== originalText) {
        textNode.textContent = originalText
        restoredCount++
      }
    })

    console.log(`✅ 已恢复 ${restoredCount} 个文本节点的原文`)
  }

  // 兼容旧方法名
  enableGlobalTranslation(targetLanguage: string = 'en') {
    this.enableAutoTranslation(targetLanguage)
  }

  disableGlobalTranslation() {
    this.disableAutoTranslation()
  }

  // 切换翻译语言
  switchLanguage(targetLanguage: string) {
    if (this.currentLanguage === targetLanguage) return

    this.currentLanguage = targetLanguage
    console.log('🌍 切换翻译语言:', targetLanguage)

    if (this.isEnabled) {
      this.translatePage()
      localStorage.setItem('autoTranslationLanguage', targetLanguage)
    }
  }

  // 监听语言变化
  private watchLanguageChanges() {
    // 监听用户语言设置变化
    window.addEventListener('storage', (e) => {
      if ((e.key === 'yeyu_language' || e.key === 'user-language') && e.newValue) {
        this.handleLanguageChange(e.newValue)
      }
    })

    // 监听全局语言变更事件
    window.addEventListener('globalLanguageChange', (e: any) => {
      this.handleLanguageChange(e.detail.language)
    })
  }

  // 处理语言变更
  private handleLanguageChange(newLanguage: string) {
    console.log('🌍 检测到语言变更:', newLanguage)

    // 防止无限递归：如果语言没有变化，直接返回
    if (this.currentLanguage === newLanguage) {
      console.log('🔄 语言未变化，跳过处理')
      return
    }

    if (newLanguage === 'zh-CN') {
      // 切换到中文，禁用翻译
      this.disableAutoTranslationInternal()
    } else {
      // 切换到其他语言，启用翻译
      this.enableAutoTranslationInternal(newLanguage)
    }
  }

  // 启动DOM观察器
  private startDOMObserver() {
    if (typeof window === 'undefined' || !document.body) return

    this.observer = new MutationObserver((mutations) => {
      // 只有在非中文语言时才翻译
      if (this.currentLanguage === 'zh-CN') return

      let hasNewContent = false
      const newTextNodes: Text[] = []

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 查找新增元素中的所有文本节点
              const textNodes = this.getTextNodesFromElement(node as Element)
              newTextNodes.push(...textNodes)
              hasNewContent = true
            } else if (node.nodeType === Node.TEXT_NODE) {
              // 直接添加的文本节点
              const textNode = node as Text
              if (this.isTranslatableTextNode(textNode)) {
                newTextNodes.push(textNode)
                hasNewContent = true
              }
            }
          })
        } else if (mutation.type === 'characterData') {
          // 文本内容变化
          const textNode = mutation.target as Text
          if (this.isTranslatableTextNode(textNode)) {
            newTextNodes.push(textNode)
            hasNewContent = true
          }
        }
      }

      if (hasNewContent && !this.isProcessing) {
        setTimeout(() => this.translateNewTextNodes(newTextNodes), 100)
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    })
  }

  // 从元素中获取所有文本节点
  private getTextNodesFromElement(element: Element): Text[] {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const textNode = node as Text
          return this.isTranslatableTextNode(textNode)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
        }
      }
    )

    let node
    while (node = walker.nextNode()) {
      textNodes.push(node as Text)
    }

    return textNodes
  }

  // 检查文本节点是否可翻译
  private isTranslatableTextNode(textNode: Text): boolean {
    const text = textNode.textContent?.trim() || ''

    // 检查文本长度和是否包含中文
    if (text.length < 2 || !this.containsChinese(text)) {
      return false
    }

    // 检查父元素是否应该跳过
    const parentElement = textNode.parentElement
    if (parentElement && this.shouldSkipElement(parentElement)) {
      return false
    }

    return true
  }

  // 翻译新增的文本节点
  private async translateNewTextNodes(textNodes: Text[]) {
    if (this.isProcessing || textNodes.length === 0) return

    this.isProcessing = true

    try {
      console.log('🔄 翻译新增的', textNodes.length, '个文本节点')
      let translatedCount = 0

      for (const textNode of textNodes) {
        const success = await this.translateTextNode(textNode)
        if (success) translatedCount++
      }

      console.log('✅ 新增内容翻译完成，成功翻译', translatedCount, '个文本节点')
    } finally {
      this.isProcessing = false
    }
  }

  // 处理翻译队列（保留兼容性）
  private async processTranslationQueue() {
    if (this.isProcessing || this.translationQueue.size === 0) return

    this.isProcessing = true

    try {
      const elements = Array.from(this.translationQueue)
      this.translationQueue.clear()

      for (const element of elements) {
        await this.translateElement(element)
      }
    } finally {
      this.isProcessing = false
    }
  }

  // 翻译整个页面
  async translatePage() {
    if (this.currentLanguage === 'zh-CN') return

    console.log('🌍 开始翻译页面到:', this.currentLanguage)

    // 获取所有需要翻译的文本节点
    const textNodes = this.getAllTranslatableTextNodes()
    console.log('🔍 找到', textNodes.length, '个可翻译的文本节点')

    let translatedCount = 0
    for (const textNode of textNodes) {
      const success = await this.translateTextNode(textNode)
      if (success) translatedCount++
    }

    console.log('🌍 页面翻译完成，成功翻译', translatedCount, '个文本节点')
  }

  // 获取所有可翻译的文本节点
  private getAllTranslatableTextNodes(): Text[] {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const textNode = node as Text
          const text = textNode.textContent?.trim() || ''

          // 跳过空文本或太短的文本
          if (text.length < 2) {
            return NodeFilter.FILTER_REJECT
          }

          // 跳过不包含中文的文本
          if (!this.containsChinese(text)) {
            return NodeFilter.FILTER_REJECT
          }

          // 跳过在不应翻译的元素内的文本
          const parentElement = textNode.parentElement
          if (parentElement && this.shouldSkipElement(parentElement)) {
            return NodeFilter.FILTER_REJECT
          }

          return NodeFilter.FILTER_ACCEPT
        }
      }
    )

    let node
    while (node = walker.nextNode()) {
      textNodes.push(node as Text)
    }

    return textNodes
  }

  // 翻译单个文本节点
  private async translateTextNode(textNode: Text): Promise<boolean> {
    try {
      const originalText = textNode.textContent?.trim() || ''
      if (!originalText || !this.containsChinese(originalText)) {
        return false
      }

      console.log('🔄 翻译文本:', originalText.substring(0, 50) + (originalText.length > 50 ? '...' : ''))
      console.log('🎯 目标语言:', this.currentLanguage)

      const result = await this.translationService.translateText(
        originalText,
        this.currentLanguage
      )

      console.log('📝 翻译结果:', {
        original: originalText,
        translated: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        confidence: result.confidence
      })

      if (result.translatedText && result.translatedText !== originalText) {
        // 备份原文
        if (!(textNode as any).__originalText) {
          (textNode as any).__originalText = originalText
        }

        textNode.textContent = result.translatedText
        console.log('✅ 翻译完成:', result.translatedText.substring(0, 50) + (result.translatedText.length > 50 ? '...' : ''))
        return true
      } else {
        console.log('⚠️ 翻译结果与原文相同，跳过应用')
        return false
      }
    } catch (error) {
      console.warn('❌ 翻译文本节点失败:', error)
      return false
    }
  }

  // 检查元素是否应该跳过
  private shouldSkipElement(element: Element): boolean {
    const skipSelectors = [
      'script', 'style', 'noscript', 'code', 'pre',
      '.no-translate', '[data-no-translate]', '[contenteditable]',
      'input', 'textarea', 'select', 'option'
    ]

    return skipSelectors.some(selector => {
      if (selector.startsWith('.') || selector.startsWith('[')) {
        return element.matches(selector)
      }
      return element.tagName.toLowerCase() === selector
    })
  }

  // 检查元素是否有可翻译的文本
  private hasTranslatableText(element: Element): boolean {
    const directText = this.getDirectTextContent(element)
    // 检测中文字符（包括汉字、中文标点符号等）
    return directText.length > 1 && this.containsChinese(directText)
  }

  // 检测文本是否包含中文
  private containsChinese(text: string): boolean {
    // 更全面的中文检测正则表达式
    // 包括：汉字、中文标点符号、全角字符等
    return /[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef\u3000-\u303f]/.test(text)
  }

  // 获取元素的直接文本内容
  private getDirectTextContent(element: Element): string {
    let text = ''
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || ''
      }
    }
    return text.trim()
  }

  // 翻译单个元素
  private async translateElement(element: Element) {
    if (this.shouldSkipElement(element)) return

    try {
      // 翻译文本内容
      const directText = this.getDirectTextContent(element)
      if (directText && directText.length > 1) {
        const result = await this.translationService.translateText(
          directText,
          this.currentLanguage
        )

        if (result.translatedText !== directText) {
          this.replaceTextContent(element, result.translatedText)
        }
      }

      // 翻译属性
      await this.translateAttributes(element)

    } catch (error) {
      console.warn('翻译元素失败:', element, error)
    }
  }

  // 替换文本内容
  private replaceTextContent(element: Element, translatedText: string) {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        node.textContent = translatedText
        break
      }
    }
  }

  // 翻译属性
  private async translateAttributes(element: Element) {
    const attributesToTranslate = ['title', 'alt', 'placeholder']

    for (const attr of attributesToTranslate) {
      const value = element.getAttribute(attr)
      if (value && value.trim() && /[\u4e00-\u9fff]/.test(value)) {
        try {
          const result = await this.translationService.translateText(
            value,
            this.currentLanguage
          )
          element.setAttribute(attr, result.translatedText)
        } catch (error) {
          console.warn(`翻译属性 ${attr} 失败:`, error)
        }
      }
    }
  }

  // 更新语音翻译服务的默认语言
  private updateVoiceTranslationLanguage(targetLanguage: string) {
    try {
      // 更新自动翻译服务的默认配置
      this.translationService.updateConfig({
        sourceLanguage: 'zh-CN', // 假设用户说中文
        targetLanguage: targetLanguage,
        enableVoiceOutput: true
      })

      console.log('🎤 语音翻译语言已更新为:', targetLanguage)
    } catch (error) {
      console.warn('⚠️ 更新语音翻译语言失败:', error)
    }
  }

  // 通知全局语言变更
  private notifyLanguageChange(targetLanguage: string) {
    try {
      // 发送自定义事件
      const event = new CustomEvent('globalLanguageChange', {
        detail: {
          language: targetLanguage,
          isTranslationEnabled: this.isEnabled,
          timestamp: Date.now()
        }
      })

      window.dispatchEvent(event)
      console.log('📢 已发送全局语言变更事件:', targetLanguage)
    } catch (error) {
      console.warn('⚠️ 发送语言变更事件失败:', error)
    }
  }

  // 监听全局语言变更事件
  onLanguageChange(callback: (language: string) => void) {
    const handler = (event: CustomEvent) => {
      callback(event.detail.language)
    }

    window.addEventListener('globalLanguageChange', handler as EventListener)

    // 返回清理函数
    return () => {
      window.removeEventListener('globalLanguageChange', handler as EventListener)
    }
  }

  // 获取当前状态
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      currentLanguage: this.currentLanguage,
      queueSize: this.translationQueue.size,
      isProcessing: this.isProcessing
    }
  }
}

// 创建全局实例
export const globalTranslationManager = new GlobalTranslationManager()
export const autoTranslationService = new AutoTranslationService()
export default AutoTranslationService
