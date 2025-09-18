/**
 * 消息发送服务
 * 处理消息发送、状态更新、重试机制等
 */

import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../../../stores/auth'

export interface SendMessageOptions {
  receiverId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'video' | 'file'
  metadata?: any
}

export interface MessageStatus {
  id: string
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: number
  error?: string
}

class MessageSendService {
  private pendingMessages = new Map<string, any>()
  private retryAttempts = new Map<string, number>()
  private maxRetries = 3

  /**
   * 发送文本消息
   */
  async sendTextMessage(receiverId: string, content: string): Promise<string> {
    return this.sendMessage({
      receiverId,
      content,
      type: 'text'
    })
  }

  /**
   * 发送图片消息
   */
  async sendImageMessage(receiverId: string, imageFile: File): Promise<string> {
    try {
      // 先上传图片
      const imageUrl = await this.uploadFile(imageFile)
      
      return this.sendMessage({
        receiverId,
        content: imageUrl,
        type: 'image',
        metadata: {
          filename: imageFile.name,
          size: imageFile.size,
          mimeType: imageFile.type
        }
      })
    } catch (error) {
      console.error('❌ 发送图片消息失败:', error)
      throw error
    }
  }

  /**
   * 发送语音消息
   */
  async sendVoiceMessage(receiverId: string, audioBlob: Blob, duration: number): Promise<string> {
    try {
      // 先上传语音文件
      const audioUrl = await this.uploadBlob(audioBlob, 'voice.wav')
      
      return this.sendMessage({
        receiverId,
        content: audioUrl,
        type: 'voice',
        metadata: {
          duration,
          size: audioBlob.size
        }
      })
    } catch (error) {
      console.error('❌ 发送语音消息失败:', error)
      throw error
    }
  }

  /**
   * 发送视频消息
   */
  async sendVideoMessage(receiverId: string, videoFile: File): Promise<string> {
    try {
      // 先上传视频
      const videoUrl = await this.uploadFile(videoFile)
      
      return this.sendMessage({
        receiverId,
        content: videoUrl,
        type: 'video',
        metadata: {
          filename: videoFile.name,
          size: videoFile.size,
          mimeType: videoFile.type
        }
      })
    } catch (error) {
      console.error('❌ 发送视频消息失败:', error)
      throw error
    }
  }

  /**
   * 发送文件消息
   */
  async sendFileMessage(receiverId: string, file: File): Promise<string> {
    try {
      // 先上传文件
      const fileUrl = await this.uploadFile(file)
      
      return this.sendMessage({
        receiverId,
        content: fileUrl,
        type: 'file',
        metadata: {
          filename: file.name,
          size: file.size,
          mimeType: file.type
        }
      })
    } catch (error) {
      console.error('❌ 发送文件消息失败:', error)
      throw error
    }
  }

  /**
   * 通用消息发送方法
   */
  private async sendMessage(options: SendMessageOptions): Promise<string> {
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    const currentUserId = authStore.user?.id

    if (!currentUserId) {
      throw new Error('用户未登录')
    }

    // 生成消息ID
    const messageId = this.generateMessageId()
    
    // 创建消息对象
    const message = {
      id: messageId,
      senderId: currentUserId,
      receiverId: options.receiverId,
      content: options.content,
      type: options.type,
      timestamp: Date.now(),
      status: 'sending' as const,
      metadata: options.metadata
    }

    try {
      // 立即添加到本地聊天记录（显示发送中状态）
      chatStore.createOrUpdateChatItem(message)
      
      // 添加到待发送队列
      this.pendingMessages.set(messageId, message)

      // 尝试发送消息
      await this.attemptSendMessage(message)

      return messageId
    } catch (error) {
      console.error('❌ 发送消息失败:', error)
      
      // 更新消息状态为失败
      this.updateMessageStatus(messageId, 'failed', error instanceof Error ? error.message : '发送失败')
      
      throw error
    }
  }

  /**
   * 尝试发送消息
   */
  private async attemptSendMessage(message: any): Promise<void> {
    try {
      // 模拟发送到服务器
      const response = await this.sendToServer(message)
      
      if (response.success) {
        // 发送成功
        this.updateMessageStatus(message.id, 'sent')
        this.pendingMessages.delete(message.id)
        this.retryAttempts.delete(message.id)
        
        console.log('✅ 消息发送成功:', message.id)
      } else {
        throw new Error(response.error || '服务器返回错误')
      }
    } catch (error) {
      console.error('❌ 发送消息到服务器失败:', error)
      
      // 检查是否需要重试
      const attempts = this.retryAttempts.get(message.id) || 0
      
      if (attempts < this.maxRetries) {
        this.retryAttempts.set(message.id, attempts + 1)
        console.log(`🔄 重试发送消息 (${attempts + 1}/${this.maxRetries}):`, message.id)
        
        // 延迟重试
        setTimeout(() => {
          this.attemptSendMessage(message)
        }, 1000 * Math.pow(2, attempts)) // 指数退避
      } else {
        // 达到最大重试次数，标记为失败
        this.updateMessageStatus(message.id, 'failed', '发送失败，请重试')
        this.pendingMessages.delete(message.id)
        this.retryAttempts.delete(message.id)
      }
    }
  }

  /**
   * 发送到服务器（模拟实现）
   */
  private async sendToServer(message: any): Promise<{ success: boolean, error?: string }> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    // 模拟发送成功率（90%成功率）
    if (Math.random() > 0.1) {
      return { success: true }
    } else {
      return { success: false, error: '网络错误' }
    }
  }

  /**
   * 上传文件
   */
  private async uploadFile(file: File): Promise<string> {
    // 模拟文件上传
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          // 模拟上传成功，返回文件URL
          const fileUrl = `https://example.com/files/${Date.now()}_${file.name}`
          resolve(fileUrl)
        } else {
          reject(new Error('文件上传失败'))
        }
      }, 1000 + Math.random() * 2000)
    })
  }

  /**
   * 上传Blob
   */
  private async uploadBlob(blob: Blob, filename: string): Promise<string> {
    // 模拟Blob上传
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          const fileUrl = `https://example.com/files/${Date.now()}_${filename}`
          resolve(fileUrl)
        } else {
          reject(new Error('文件上传失败'))
        }
      }, 1000 + Math.random() * 2000)
    })
  }

  /**
   * 更新消息状态
   */
  private updateMessageStatus(messageId: string, status: MessageStatus['status'], error?: string) {
    const chatStore = useChatStore()
    
    // 这里应该更新chatStore中的消息状态
    // 由于当前chatStore结构限制，我们先打印日志
    console.log('📋 更新消息状态:', messageId, status, error)
    
    // 触发状态更新事件
    this.emitStatusUpdate({
      id: messageId,
      status,
      timestamp: Date.now(),
      error
    })
  }

  /**
   * 发送状态更新事件
   */
  private emitStatusUpdate(statusUpdate: MessageStatus) {
    // 可以通过事件总线或其他方式通知UI更新
    window.dispatchEvent(new CustomEvent('messageStatusUpdate', {
      detail: statusUpdate
    }))
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 重试发送失败的消息
   */
  async retryMessage(messageId: string): Promise<void> {
    const message = this.pendingMessages.get(messageId)
    if (message) {
      this.retryAttempts.delete(messageId)
      await this.attemptSendMessage(message)
    }
  }

  /**
   * 获取待发送消息列表
   */
  getPendingMessages(): any[] {
    return Array.from(this.pendingMessages.values())
  }

  /**
   * 清除待发送消息
   */
  clearPendingMessages(): void {
    this.pendingMessages.clear()
    this.retryAttempts.clear()
  }
}

// 创建全局实例
export const messageSendService = new MessageSendService()

export default MessageSendService
