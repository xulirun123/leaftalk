// 语音识别服务
// 提供语音转文字功能

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export interface SpeechRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

export class SpeechRecognitionService {
  private recognition: any = null
  private isSupported = false
  private isListening = false

  constructor() {
    this.initializeRecognition()
  }

  private initializeRecognition() {
    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      this.isSupported = true
      this.recognition = new SpeechRecognition()
    } else {
      console.warn('⚠️ 浏览器不支持语音识别功能')
      this.isSupported = false
    }
  }

  /**
   * 检查是否支持语音识别
   */
  isRecognitionSupported(): boolean {
    return this.isSupported
  }

  /**
   * 开始语音识别
   */
  async startRecognition(options: SpeechRecognitionOptions = {}): Promise<void> {
    if (!this.isSupported || !this.recognition) {
      throw new Error('语音识别不支持')
    }

    if (this.isListening) {
      console.warn('⚠️ 语音识别已在进行中')
      return
    }

    // 配置识别选项
    this.recognition.lang = options.language || 'zh-CN'
    this.recognition.continuous = options.continuous || false
    this.recognition.interimResults = options.interimResults || true
    this.recognition.maxAlternatives = options.maxAlternatives || 1

    try {
      this.recognition.start()
      this.isListening = true
      console.log('🎤 开始语音识别')
    } catch (error) {
      console.error('❌ 启动语音识别失败:', error)
      throw error
    }
  }

  /**
   * 停止语音识别
   */
  stopRecognition(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
      console.log('🛑 停止语音识别')
    }
  }

  /**
   * 监听识别结果
   */
  onResult(callback: (result: SpeechRecognitionResult) => void): void {
    if (!this.recognition) return

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      const confidence = result[0].confidence
      const isFinal = result.isFinal

      callback({
        transcript,
        confidence,
        isFinal
      })
    }
  }

  /**
   * 监听识别错误
   */
  onError(callback: (error: string) => void): void {
    if (!this.recognition) return

    this.recognition.onerror = (event: any) => {
      console.error('❌ 语音识别错误:', event.error)
      this.isListening = false
      callback(event.error)
    }
  }

  /**
   * 监听识别结束
   */
  onEnd(callback: () => void): void {
    if (!this.recognition) return

    this.recognition.onend = () => {
      console.log('✅ 语音识别结束')
      this.isListening = false
      callback()
    }
  }

  /**
   * 获取当前识别状态
   */
  getListeningState(): boolean {
    return this.isListening
  }

  /**
   * 语音转文字（模拟实现，用于降级处理）
   * @param audioBlob 音频数据（当前为模拟实现，不实际处理音频）
   * @returns Promise<{success: boolean, text: string}>
   */
  async speechToText(audioBlob: Blob): Promise<{success: boolean, text: string}> {
    try {
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模拟语音识别结果
      const mockTexts = [
        '你好，这是一条测试消息',
        '今天天气真不错',
        '语音识别功能正在测试中',
        '感谢您的使用',
        '这是模拟的语音识别结果',
        '系统正在处理您的语音',
        '语音转文字功能运行正常'
      ]

      const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)]

      console.log('🎤 模拟语音转文字成功:', randomText)

      return {
        success: true,
        text: randomText
      }
    } catch (error) {
      console.error('🎤 模拟语音转文字失败:', error)
      return {
        success: false,
        text: ''
      }
    }
  }
}

// 创建全局实例
export const speechRecognition = new SpeechRecognitionService()

// 便捷函数
export function startSpeechRecognition(
  onResult: (result: SpeechRecognitionResult) => void,
  onError?: (error: string) => void,
  options?: SpeechRecognitionOptions
): Promise<void> {
  speechRecognition.onResult(onResult)
  
  if (onError) {
    speechRecognition.onError(onError)
  }

  return speechRecognition.startRecognition(options)
}

export function stopSpeechRecognition(): void {
  speechRecognition.stopRecognition()
}

export function isSpeechRecognitionSupported(): boolean {
  return speechRecognition.isRecognitionSupported()
}

// 默认导出
export default speechRecognition
