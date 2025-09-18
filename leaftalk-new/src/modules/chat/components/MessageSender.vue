<template>
  <!-- 这是一个无UI的服务组件，专门处理消息发送逻辑 -->
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useChatStore } from '../stores/chatStore'
import { useChatItemManager } from '../composables/useChatItemManager'
import { useAuthStore } from '../../../stores/auth'
import { useRouter } from 'vue-router'
import { ChatGuard } from '../utils/chatGuard'

import { apiClient } from '../../../shared/services/apiClient'
import { messagePersistenceService } from '../services/messagePersistenceService'


// Props
interface Props {
  chatId?: string
  receiverId?: string
  receiverName?: string
  receiverAvatar?: string
  sendToServerFn?: (message: any) => Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  chatId: '',
  receiverId: '',
  receiverName: '未知用户',
  receiverAvatar: ''
})

// Emits
interface Emits {
  (e: 'message-sent', message: any): void
  (e: 'chat-created', chatId: string): void
}

const emit = defineEmits<Emits>()

// 依赖注入
const chatStore = useChatStore()
const authStore = useAuthStore()
const chatItemManager = useChatItemManager(props.sendToServerFn)

// 消息发送接口
interface MessageData {
  type: 'text' | 'image' | 'voice' | 'video' | 'file'
  content: string | File
}


// 上传聊天文件，返回可访问的URL
const uploadChatFile = async (file: File): Promise<string> => {
  const form = new FormData()
  form.append('file', file)
  const resp = await apiClient.post<any>('/chat/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  if (resp.success && resp.data && resp.data.url) return resp.data.url
  throw new Error(resp.message || '文件上传失败')


}

// 防止重复发送的标志
let isSending = false

// 发送消息的主要方法
const sendMessage = async (messageData: MessageData) => {
  // 防止重复发送
  if (isSending) {
    console.log('⚠️ MessageSender 消息正在发送中，跳过重复请求')
    return
  }

  let tempMessageId: string | null = null
  let sessionId: string | null = null

  try {
    isSending = true
    console.log('📤 MessageSender 发送消息:', messageData)

    // 使用ChatGuard进行根本防护
    const currentUserId = String(authStore.user?.id || '')
    ChatGuard.validateChatOperation(currentUserId, props.receiverId, '发送消息')

    // 在发送前检查是否已存在会话，用于抑制重复“开始新的聊天”提示
    let existedBefore = false
    try {
      const preSessionId = chatStore.generateSessionId(currentUserId, String(props.receiverId))
      existedBefore = chatStore.hasSession(preSessionId)
      sessionId = preSessionId
    } catch {}

    // 1. 若为文件消息，先创建临时消息显示发送中状态
    let payload: MessageData = { ...messageData }

    if (payload.content instanceof File) {
      // 先创建临时消息显示"发送中"状态
      const tempMessage = createMessage({
        ...payload,
        content: URL.createObjectURL(payload.content) // 使用blob URL临时显示
      })
      tempMessage.status = 'sending'
      tempMessageId = tempMessage.id

      // 添加到聊天中显示"发送中"状态
      if (sessionId) {
        chatStore.addMessage(sessionId, tempMessage)
      }

      try {
        const url = await uploadChatFile(payload.content)
        if (!url) throw new Error('文件上传失败')

        // 上传成功，清理blob URL
        URL.revokeObjectURL(tempMessage.content as string)

        // 更新消息内容
        tempMessage.content = url

        // 持久化更新：将临时消息从 blob 地址更新为服务器URL，避免刷新后丢失
        try {
          if (sessionId) {
            await messagePersistenceService.saveMessage({
              id: tempMessage.id,
              sessionId,
              senderId: String(authStore.user?.id || ''),
              receiverId: String(props.receiverId || ''),
              content: url,
              type: payload.type,
              timestamp: (tempMessage as any).timestamp || Date.now(),
              status: 'sent',
              isOwn: true,
              serverUrl: url
            } as any)
          }
        } catch (e) {
          console.warn('⚠️ 持久化更新文件消息失败（忽略）', e)
        }

        tempMessage.status = 'sent'
        payload = { ...payload, content: url }
      } catch (error) {
        console.error('❌ 文件上传失败:', error)

        // 上传失败，从聊天中移除临时消息
        if (sessionId && tempMessageId) {
          chatStore.removeMessage(sessionId, tempMessageId)
        }

        // 清理blob URL
        if (tempMessage.content && typeof tempMessage.content === 'string' && tempMessage.content.startsWith('blob:')) {
          URL.revokeObjectURL(tempMessage.content)
        }

        throw error
      }
    }

    // 2. 创建最终消息对象并发送
    let message: ChatMessage

    if (tempMessageId) {
      // 对于文件消息，使用已存在的临时消息，更新其内容和状态
      const sessionMessages = chatStore.messages.get(sessionId!) || []
      const tempMessage = sessionMessages.find(msg => msg.id === tempMessageId)

      if (tempMessage) {
        // 更新临时消息的内容和状态
        tempMessage.content = payload.content as string
        tempMessage.status = 'sent'
        message = tempMessage
        console.log('📤 文件消息已更新，准备发送到服务器:', message.id)

        // 只发送到服务器，不再添加到chatStore（已经存在）
        await chatItemManager.sendMessageToServer(message)
      } else {
        throw new Error('临时消息未找到')
      }
    } else {
      // 对于文本消息，创建新消息并通过chatItemManager发送
      message = createMessage(payload)

      const receiverInfo = {
        id: props.receiverId,
        name: props.receiverName,
        avatar: props.receiverAvatar
      }

      const session = await chatItemManager.sendMessage(message, receiverInfo)

      if (session) {
        console.log('✅ 聊天项已创建/更新:', session.name)
        message.chatId = session.id

        // 仅在之前不存在会话时，才触发"开始新的聊天"事件
        if (!existedBefore) {
          emit('chat-created', session.id)
        }
      }
    }

    // if (session) { // 注释掉重复的session处理代码
      // console.log('✅ 聊天项已创建/更新:', session.name)
      // message.chatId = session.id

      // 仅在之前不存在会话时，才触发“开始新的聊天”事件
      // if (!existedBefore) {
      //   emit('chat-created', session.id)
      // }
    // } // 注释掉重复的session处理代码结束

    // 3. 发送事件通知
    emit('message-sent', message)

    console.log('✅ 消息发送成功:', message)
    return message

  } catch (error) {
    console.error('❌ 消息发送失败:', error)

    // 如果有临时消息且发送失败，清理它
    if (sessionId && tempMessageId) {
      console.log('🗑️ 清理发送失败的临时消息:', tempMessageId)
      chatStore.removeMessage(sessionId, tempMessageId)
    }

    throw error
  } finally {
    isSending = false
  }
}

// 创建消息对象
const createMessage = (messageData: MessageData) => {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  const timestamp = Date.now()

  let content = messageData.content

  // 处理文件类型消息
  if (messageData.content instanceof File) {
    content = URL.createObjectURL(messageData.content)
  }

  return {
    id: messageId,
    chatId: props.chatId,
    senderId: String(authStore.user?.id || 'current_user'), // 确保是字符串
    receiverId: String(props.receiverId), // 确保是字符串
    content: content as string,
    type: messageData.type,
    timestamp,
    status: 'sent' as const,
    isSelf: true,
    senderName: authStore.user?.nickname || authStore.user?.username || '我',
    senderAvatar: authStore.user?.avatar || null
  }
}

// 确保聊天会话存在
const ensureChatExists = async (): Promise<string> => {
  let chatId = props.chatId

  // 如果没有提供chatId，根据receiverId生成
  if (!chatId && props.receiverId) {
    chatId = `private_${props.receiverId}`
  }

  if (!chatId) {
    throw new Error('无法确定聊天ID')
  }

  // 检查聊天是否已存在
  const existingChat = chatStore.sessions?.find((session: any) => session.id === chatId)

  if (!existingChat) {
    // 获取当前用户ID
    const currentUserId = String(authStore.user?.id || '')

    // 🛡️ 根本防护：确保不是自聊天
    if (currentUserId === props.receiverId) {
      console.error('🛡️ MessageSender阻止创建自聊天会话:', { currentUserId, receiverId: props.receiverId })
      throw new Error('不能创建与自己的聊天会话')
    }

    // 创建新的聊天会话，包含正确的participants
    const newChat = {
      id: chatId,
      name: props.receiverName,
      avatar: props.receiverAvatar || generateAvatar(props.receiverName),
      lastMessage: '',
      lastTime: Date.now(),
      timestamp: Date.now(),
      unreadCount: 0,
      type: 'private' as const,
      userId: props.receiverId,
      participants: [currentUserId, props.receiverId]  // 🛡️ 明确设置participants
    }

    // 添加到聊天列表
    if (typeof chatStore.addSession === 'function') {
      chatStore.addSession(newChat)
      emit('chat-created', chatId)
      console.log('✅ 创建新聊天会话:', newChat)
    } else {
      console.warn('⚠️ chatStore.addSession 方法不存在')
    }
  }

  return chatId
}

// 生成头像
const generateAvatar = (name: string) => {
  const colors = ['#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7']
  const color = colors[name.length % colors.length]
  const initial = name.charAt(0)
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="${color}"/><text x="30" y="35" text-anchor="middle" fill="white" font-size="20">${initial}</text></svg>`
}

// 发送文本消息
const sendTextMessage = (text: string) => {
  return sendMessage({ type: 'text', content: text })
}

// 发送图片消息
const sendImageMessage = (file: File) => {
  return sendMessage({ type: 'image', content: file })
}

// 发送语音消息
const sendVoiceMessage = (audioBlob: Blob) => {
  const file = new File([audioBlob], 'voice.wav', { type: 'audio/wav' })
  return sendMessage({ type: 'voice', content: file })
}

// 发送视频消息
const sendVideoMessage = (file: File) => {
  return sendMessage({ type: 'video', content: file })
}

// 发送文件消息
const sendFileMessage = (file: File) => {
  return sendMessage({ type: 'file', content: file })
}

// 暴露方法给父组件
defineExpose({
  sendMessage,
  sendTextMessage,
  sendImageMessage,
  sendVoiceMessage,
  sendVideoMessage,
  sendFileMessage
})
</script>

<style scoped>
/* 无UI组件，不需要样式 */
</style>
