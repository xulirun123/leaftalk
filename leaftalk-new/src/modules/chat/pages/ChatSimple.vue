<template>
  <div class="chat-simple" :class="{ entering: isEntering }" v-if="isValidRoute">
    <!-- 使用统一的顶部导航栏，不需要自定义导航栏 -->

    <!-- 调试信息已关闭 -->
    <div v-if="false" style="position: fixed; top: 100px; right: 10px; background: rgba(255,255,255,0.95); padding: 10px; z-index: 9999; font-size: 11px; max-width: 350px; word-break: break-all; border: 2px solid #07C160; max-height: 400px; overflow-y: auto;">
      <div><strong style="color: #07C160;">🔍 背景调试信息:</strong></div>
      <div style="margin-top: 5px; padding: 5px; background: #f0f0f0;">
        <div><strong>chatBackgroundStyle:</strong></div>
        <div style="font-size: 10px; color: #333;">{{ JSON.stringify(chatBackgroundStyle) }}</div>
      </div>
      <div style="margin-top: 5px; padding: 5px; background: #f0f0f0;">
        <div><strong>localStorage背景:</strong></div>
        <div style="font-size: 10px; color: #333;">{{ debugLocalStorage }}</div>
      </div>
      <div style="margin-top: 5px; padding: 5px; background: #f0f0f0;">
        <div><strong>加载状态:</strong></div>
        <div style="font-size: 10px; color: #333;">{{ debugLoadStatus }}</div>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="messagesContainer" @scroll="handleUserScroll" :style="chatBackgroundStyle">
      <div v-if="!messages || messages.length === 0" class="empty-chat">
        <iconify-icon icon="heroicons:chat-bubble-left-right" width="48" style="color: #ccc;"></iconify-icon>
        <p>开始聊天吧！</p>
      </div>

      <div v-for="(message, index) in messages" :key="message.id" class="message-wrapper" :data-message-id="message.id">
        <!-- 消息时间 - 只有与前一条消息间隔超过10分钟才显示 -->
        <div v-if="shouldShowTime(message, index)" class="message-time-center">
          {{ formatTime(message.timestamp) }}
        </div>

        <div class="message-item" :class="{ 'own-message': message.isOwn }">
          <!-- 对方消息：头像在左侧 -->
          <div class="message-avatar" v-if="!message.isOwn">
            <img :src="chatInfo?.avatar || ''" :alt="chatInfo?.name || '用户'" @error="() => handleAvatarError('other')" />
          </div>
          <div class="message-content" :class="{ 'own-content': message.isOwn }">
            <div class="message-bubble" :class="{ 'own-bubble': message.isOwn, 'message-failed': message.status === 'failed', 'is-location': message.type === 'location' }"
                 :style="message.isOwn && message.type === 'text' ? 'padding: 8px 15px 8px 12px !important;' : ''">
              <p v-if="message.type === 'text'" :style="message.isOwn ? 'margin: 0; padding-right: 0;' : 'margin: 0;'" v-html="highlightMessageContent(message)"></p>
              <img
                v-else-if="message.type === 'image'"
                :src="message.content"
                alt="图片"
                class="message-image"
                @click="openPreview('image', message.content)"
                @error="handleMediaError($event, '图片', message.id)"
              />
              <div v-else-if="message.type === 'video'" class="video-wrapper" @click="openPreview('video', message.content)">
                <video
                  class="message-video"
                  preload="metadata"
                  playsinline
                  @error="handleMediaError($event, '视频', message.id)"
                >
                  <source :src="message.content" />
                  您的浏览器不支持视频播放
                </video>
                <button class="video-play-btn" aria-label="播放">▶</button>
              </div>
              <div v-else-if="message.type === 'contact'" class="contact-bubble" @click="openContactFromMessage(message)">
                <div class="cb-card">
                  <img class="cb-avatar" :src="getContactAvatarFromMessage(message)" @error="(e:any)=>handleContactAvatarError(e, message)" alt="头像" />
                  <div class="cb-text">
                    <div class="cb-title">个人名片</div>
                    <div class="cb-name">{{ getContactNameFromMessage(message) }}</div>
                  </div>
                </div>
              </div>
              <div v-else-if="message.type === 'location'" class="location-bubble" @click="openLocationFromMessage(message)">
                <div class="location-card with-thumb">
                  <div class="location-thumb">
                    <img class="location-thumb-img" :src="getMapSrc(message, '600x300')" alt="地图缩略图" @error="(e:any)=>handleStaticMapError(e, message)" />
                  </div>
                  <div class="location-info">
                    <div class="location-name">{{ getLocationNameFromMessage(message) }}</div>
                    <div class="location-address">{{ getLocationAddressFromMessage(message) }}</div>
                  </div>
                </div>
              </div>

              <!-- 发送状态指示器已移除 -->

              <!-- 错误信息 -->
              <div v-if="message.error" class="message-error">
                {{ message.error }}
              </div>
            </div>
          </div>
          <!-- 当前用户消息：头像在右侧 -->
          <div class="message-avatar" v-if="message.isOwn">
            <img :src="currentUser.avatar" :alt="currentUser.name" @error="() => handleAvatarError('own')" />
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <ChatInput
      @send="handleMessageSend"
      @typing="handleTyping"
      @video-call="openCallSheet"
      placeholder="输入消息..."
      :disabled="false"
      :chat-id="sessionId"
    />

    <!-- RealtimeMessageReceiver组件 -->
    <RealtimeMessageReceiver ref="realtimeReceiver" :show-status="false" />

    <!-- MessageSender组件 -->
    <MessageSender
      ref="messageSender"
      :chat-id="chatId"
      :receiver-id="receiverId"
      :receiver-name="chatInfo.name"
      :receiver-avatar="chatInfo.avatar"
      :send-to-server-fn="sendToServer"
      @message-sent="handleMessageSent"
      @chat-created="handleChatCreated"
    />
  </div>
        <!-- 全屏媒体预览 -->
        <div v-if="showPreview" class="media-preview-overlay" @click="closePreview">
          <button class="preview-close-btn" @click.stop="closePreview" aria-label="关闭">✕</button>
          <img v-if="previewType==='image'" :src="previewSrc" class="preview-image" @click.stop />
          <div v-else-if="previewType==='video'" class="preview-video-wrap" @click.stop="togglePreviewPlayback">
            <video ref="previewVideoRef" :src="previewSrc" class="preview-video" playsinline></video>


            <button v-if="!isPreviewPlaying" class="preview-play-btn" aria-label="播放">▶</button>
          </div>
        </div>
  <!-- 通话选择底部弹层 -->
  <div v-if="showCallSheet" class="call-sheet-overlay" @click="hideCallSheet">
    <div class="call-sheet" @click.stop>
      <button class="option" @click="makeVideoCall">视频电话</button>
      <button class="option" @click="makeVoiceCall">语音电话</button>
      <button class="option cancel" @click="hideCallSheet">取消</button>
    </div>
  </div>


</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, onActivated, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StatusBar from '../../../shared/components/mobile/StatusBar.vue'
import ChatInput from '../components/ChatInput.vue'

import MessageSender from '../components/MessageSender.vue'
import RealtimeMessageReceiver from '../components/RealtimeMessageReceiver.vue'
import { useAppStore } from '../../../shared/stores/appStore'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../../../stores/auth'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'
// import { getOtherUserId } from '../utils/chatUrlGenerator' // 暂时不使用
import { ensureStylesLoaded } from '../utils/stylePreloader'
import { loadAndApplyChatBackground, getCurrentChatId } from '../utils/chatBackgroundManager'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()
const eventBus = inject('eventBus') as any

// 搜索关键词高亮
const searchHighlightKeyword = ref<string>('')

// ========== 聊天背景管理（已重写，使用新的工具函数） ==========
// 背景样式 ref（保留用于调试面板显示）
const chatBackgroundStyle = ref<any>({})

// 调试信息（保留用于调试面板显示）
const debugLocalStorage = ref<string>('')
const debugLoadStatus = ref<string>('未加载')

// 加载聊天背景（新版本 - 简单可靠）
const loadChatBackground = () => {
  const chatId = getCurrentChatId()
  loadAndApplyChatBackground(chatId)
  debugLoadStatus.value = '✅ 已加载'
}
const chatStore = useChatStore()

// 进入聊天页时轻微淡入，减少路由切换抖动
const isEntering = ref(true)

// 🎯 统一路由格式：/chat/:id (格式：chat_1_2)
const currentUserId = authStore.user?.id?.toString() || '1'
const routeParam = route.params.id as string

console.log('🔍 路由参数解析:')
console.log('  route.params.id:', routeParam)
console.log('  currentUserId:', currentUserId)
// 底部通话选择弹层（来自功能面板）
const showCallSheet = ref(false)
const openCallSheet = () => { showCallSheet.value = true }
const hideCallSheet = () => { showCallSheet.value = false }

const tryInitiateCall = async (type: 'video' | 'voice'): Promise<any> => {
  try {
    const token = localStorage.getItem('yeyu_auth_token') || ''

    // 先让目标用户上线（模拟真实场景）
    await fetch('http://localhost:8893/api/calls/online', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: otherUserId })
    })

    const res = await fetch('http://localhost:8893/api/calls/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ toUserId: otherUserId, type })
    })

    if (res.ok) {
      const result = await res.json()
      if (result?.success) {
        console.log(`✅ ${type === 'video' ? '视频' : '语音'}通话邀请发送成功`)
        appStore.showToast(`${type === 'video' ? '视频' : '语音'}通话邀请已发送`, 'success')

        // 存储通话ID用于后续操作
        localStorage.setItem('current_call_id', result.data.callId)

        console.log('📞 通话邀请已通过WebSocket发送给对方，等待对方响应...')
        return result
      } else {
        appStore.showToast(result?.message || (type === 'video' ? '视频通话邀请失败' : '语音通话邀请失败'), 'error')
        return result
      }
    } else if (res.status === 409) {
      // 处理冲突错误（用户正在通话中）
      const result = await res.json()
      console.warn('通话冲突:', result)

      if (result.data?.type === 'caller_busy') {
        // 发起者正在通话中
        appStore.showToast(result.message, 'error')
      } else {
        // 提供清理选项
        if (confirm(`${result.message}\n\n是否清理旧的通话会话并重新发起？`)) {
          await clearAllCallSessions()
          // 重新尝试发起通话
          setTimeout(() => tryInitiateCall(type), 500)
        }
      }
    } else {
      console.warn('call initiate failed, status:', res.status)
      appStore.showToast('发送邀请失败', 'error')
      return null
    }
  } catch (e) {
    console.error('call initiate failed:', e)
    appStore.showToast('网络错误', 'error')
    return null
  }
}

// 清理所有通话会话
const clearAllCallSessions = async () => {
  try {
    const token = localStorage.getItem('yeyu_auth_token') || ''
    const res = await fetch('http://localhost:8893/api/calls/clear-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (res.ok) {
      const result = await res.json()
      console.log('✅ 通话会话清理成功:', result.message)
      appStore.showToast(result.message, 'success')
    }
  } catch (e) {
    console.error('清理通话会话失败:', e)
  }
}

const makeVideoCall = async () => {
  hideCallSheet()

  try {
    // 使用新的通话系统发起视频通话
    router.push({
      path: '/call',
      query: {
        action: 'outgoing',
        targetUserId: otherUserId,
        type: 'video',
        name: titleName.value || '联系人',
        avatar: chatInfo.value?.avatar || ''
      }
    })
  } catch (error) {
    console.error('❌ 发起视频通话失败:', error)
    appStore.showToast('发起视频通话失败', 'error')
  }
}

const makeVoiceCall = async () => {
  hideCallSheet()

  try {
    // 使用新的通话系统发起语音通话
    router.push({
      path: '/call',
      query: {
        action: 'outgoing',
        targetUserId: otherUserId,
        type: 'voice',
        name: titleName.value || '联系人',
        avatar: chatInfo.value?.avatar || ''
      }
    })
  } catch (error) {
    console.error('❌ 发起语音通话失败:', error)
    appStore.showToast('发起语音通话失败', 'error')
  }
}


// 验证路由参数
const isValidRoute = ref(true)
if (!routeParam) {
  console.error('❌ 路由参数为空，跳转回首页')
  appStore.showToast('无效的聊天页面', 'error')
  router.replace('/')
  isValidRoute.value = false
}

// 解析chatId格式：chat_1_2
let chatId = routeParam
if (chatId && chatId.startsWith('chat_')) {
  chatId = chatId.substring(5) // 去掉 'chat_' 前缀
}

console.log('  处理后的chatId:', chatId)

// 再次验证chatId
if (!chatId) {
  console.error('❌ 处理后的chatId为空')
  appStore.showToast('无效的聊天页面', 'error')
  router.replace('/')
  isValidRoute.value = false
}

// 从chatId解析出两个用户ID
const parts = chatId ? chatId.split('_') : []
if (parts.length !== 2) {
  console.error('❌ 无效的聊天ID格式:', chatId, 'parts:', parts)
  appStore.showToast('无效的聊天页面', 'error')
  router.replace('/')
  isValidRoute.value = false
}

const userId1 = parts[0]
const userId2 = parts[1]

// 确定对方用户ID
const otherUserId = userId1 === currentUserId ? userId2 : userId1

console.log('🔍 用户ID解析结果:')
console.log('  userId1:', userId1)
console.log('  userId2:', userId2)
console.log('  currentUserId:', currentUserId)
console.log('  otherUserId:', otherUserId)

// 检查是否为自聊天
if (currentUserId === otherUserId) {
  console.error('🛡️ 检测到自聊天，阻止进入:', { currentUserId, otherUserId, chatId })
  appStore.showToast('不能与自己聊天', 'error')
  router.replace('/')
  throw new Error('不能与自己聊天')

}

// 组件引用
const messageSender = ref<InstanceType<typeof MessageSender>>()
const realtimeReceiver = ref<InstanceType<typeof RealtimeMessageReceiver>>()

// 全局AppStore（复用已有实例）

// 统一的媒体发送函数
const sendCapturedBlob = async (type: 'photo' | 'video', blob: Blob) => {
  const mappedType = type === 'photo' ? 'image' : 'video'

  const mime = blob.type || (mappedType === 'image' ? 'image/jpeg' : 'video/webm')
  const filename = `${mappedType}-${Date.now()}.${mappedType === 'image' ? 'jpg' : 'webm'}`
  const file = new File([blob], filename, { type: mime })

  // 立即发送以先显示本地预览（blob），不阻塞等待连接
  messageSender.value?.sendMessage({ type: mappedType, content: file })?.catch(()=>{})
}

// 接收拍摄页回传的媒体（事件通道）
const handleCapturedMedia = async (e: Event) => {
  const ev = e as CustomEvent
  const detail: any = ev.detail || {}
  if (!detail || !detail.blob) return
  try {
    await sendCapturedBlob(detail.type === 'photo' ? 'photo' : 'video', detail.blob)
    console.log('✅ 拍摄媒体发送成功（事件）')
  } catch (error) {
    console.error('❌ 拍摄媒体发送失败（事件）:', error)
  }
}

// 处理通过全局store回传的待发送媒体（避免事件在路由切换时丢失）
const processPendingCapturedMedia = async () => {
  const pending = appStore.consumePendingCapturedMedia()
  if (pending) {
    try {
      await sendCapturedBlob(pending.type, pending.blob)
      console.log('✅ 拍摄媒体发送成功（store）')
    } catch (error) {
      console.error('❌ 拍摄媒体发送失败（store）:', error)
    }
  }
}

// 聊天相关数据
const receiverId = otherUserId

// WebSocket发送函数
const sendToServer = async (message: any) => {
  if (!realtimeReceiver.value) {
    console.warn('⚠️ RealtimeMessageReceiver不可用')
    return
  }
  try {
    // 等待连接（不阻塞UI链路，失败则后台重试）
    const ok = await (realtimeReceiver.value as any).waitUntilConnected?.(6000)
    if (!ok) throw new Error('WebSocket未连接')
    await (realtimeReceiver.value as any).sendMessage(message)
  } catch (e) {
    console.warn('⚠️ 首次发送失败，将在后台重试一次:', e)
    setTimeout(async () => {
      try {
        const ok2 = await (realtimeReceiver.value as any)?.waitUntilConnected?.(8000)
        if (ok2) {
          await (realtimeReceiver.value as any)?.sendMessage(message)
          console.log('✅ 后台重试发送成功')
        }
      } catch (e2) {
        console.warn('❌ 后台重试仍失败，保持本地显示，待连接恢复再手动/自动重发', e2)
      }
    }, 1000)
    // 不抛出错误，避免打断本地显示
  }
}

// 聊天信息（对方用户信息）
const chatInfo = ref({
  id: otherUserId || '0',
  name: '加载中...',
  avatar: ''
})


// 标题优先使用备注名
const titleName = computed(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(`friend_remark_${otherUserId}`) || 'null')
    const remark = saved?.name && String(saved.name).trim()
    if (remark) return remark
  } catch {}
  return chatInfo.value?.name || '聊天'
})

// 当前用户信息
const currentUser = ref({
  id: currentUserId,
  name: authStore.user?.nickname || authStore.user?.username || '我',
  avatar: authStore.user?.avatar || ''
})

// 全屏预览状态与方法
const showPreview = ref(false)
const previewType = ref<'image' | 'video' | null>(null)
const previewSrc = ref('')

const previewVideoRef = ref<HTMLVideoElement | null>(null)
const isPreviewPlaying = ref(false)
function togglePreviewPlayback() {
  const v = previewVideoRef.value
  if (!v) return
  if (v.paused) { v.play(); isPreviewPlaying.value = true } else { v.pause(); isPreviewPlaying.value = false }
}

function openPreview(type: 'image' | 'video', src: string) {
  previewType.value = type
  previewSrc.value = src
  showPreview.value = true
  if (type === 'video') {
    nextTick(() => {
      const v = previewVideoRef.value
      if (v) { try { v.pause() } catch {} }
      isPreviewPlaying.value = false
    })
  }
}
function closePreview() {
  try { const v = previewVideoRef.value; if (v) { v.pause() } } catch {}
  isPreviewPlaying.value = false
  showPreview.value = false
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePreview()
}

// 生成会话ID（简化版本）
const sessionId = computed(() => {
  const participants = [currentUserId, otherUserId].sort()
  const id = `chat_${participants[0]}_${participants[1]}`
  console.log('🔍 生成sessionId:', id, '参与者:', participants)
  return id
})

// 从chatStore获取消息（使用本地持久化）
const messages = computed(() => {
  // 安全检查
  if (!chatStore.messages || !sessionId.value) {
    console.log('📨 chatStore.messages或sessionId未初始化')
    return []
  }

  const sessionMessages = chatStore.messages.get(sessionId.value) || []
  console.log('📨 当前会话消息数量:', sessionMessages.length)

  // 仅过滤历史样本无效文件；保留 blob: 临时消息以便“立即显示”
  const shownMessages = sessionMessages.filter((msg: any) => {
    if (typeof msg.content === 'string' && (
      msg.content.includes('1757725383688_0472ba8497ee7326.mp4') ||
      msg.content.includes('1757766900761_2d0cea9d08600f05.mp4') ||
      msg.content.includes('5fa65094-0e93-46fa-962b-c9f8c91bce29')
    )) {
      console.log('🗑️ 过滤历史样本无效文件:', msg.content)
      return false
    }
    return true
  })

  return shownMessages.map((msg: any) => {
    // 确保比较时都是字符串类型
    const msgSenderId = String(msg.senderId)
    const currentUserIdStr = String(currentUserId)
    const isOwn = msgSenderId === currentUserIdStr

    console.log('📨 消息归属判断:', {
      messageId: msg.id,
      senderId: msgSenderId,
      currentUserId: currentUserIdStr,
      isOwn: isOwn,
      content: msg.content,
      comparison: `${msgSenderId} === ${currentUserIdStr} = ${isOwn}`
    })

    return {
      id: msg.id,
      type: msg.type || 'text',
      content: msg.content,
      isOwn: isOwn,
      timestamp: msg.timestamp,
      senderId: msgSenderId,
      receiverId: String(msg.receiverId),
      status: msg.status || 'sent', // 添加status属性，默认为'sent'
      error: msg.error || null // 添加error属性
    }
  })
})

// 加载消息（从本地持久化）
const loadMessages = async () => {
  if (!isValidRoute.value || !sessionId.value) {
    console.log('📨 路由无效或sessionId无效，跳过消息加载')
    return
  }

  try {
    console.log('� 从本地持久化加载消息...', sessionId.value)

    // 使用chatStore的消息加载功能
    await chatStore.loadMessagesForSession(sessionId.value)

    console.log('✅ 消息加载完成，数量:', messages.value.length)
    // 加载完成后，滚动到底部确保最后一条消息可见
    nextTick(() => {
      scrollToBottom(true)
    })

  } catch (error) {
    console.error('❌ 消息加载失败:', error)
  }
}

// 消息计算属性（用于显示）
const displayMessages = computed(() => {
  console.log('📨 当前消息数量:', messages.value.length)

  return messages.value.map(msg => {
    // 确保比较时都是字符串类型
    const msgSenderId = String(msg.senderId)
    const currentUserIdStr = String(currentUserId)
    const isOwn = msgSenderId === currentUserIdStr

    console.log('📨 消息归属判断:', {
      messageId: msg.id,
      senderId: msgSenderId,
      currentUserId: currentUserIdStr,
      isOwn: isOwn,
      content: msg.content,
      comparison: `${msgSenderId} === ${currentUserIdStr} = ${isOwn}`
    })

    return {
      id: msg.id,
      type: msg.type || 'text',
      content: msg.content,
      isOwn: isOwn,
      timestamp: msg.timestamp,
      senderId: msgSenderId,
      receiverId: String(msg.receiverId),
      status: (msg as any).status || 'sent',
      error: (msg as any).error
    }
  })
})

// 输入相关
const messagesContainer = ref<HTMLElement>()

// 用户滚动状态管理
const isUserScrolling = ref(false)
const userScrollTimer = ref<any>(null)
// 挂载稳定期：在初次进入的短时间内，避免动态调整造成上下抖动
const mountSettled = ref(false)

// 按用户规则：计算最后一条消息的最低高度
const adjustLastMessagePosition = () => {
  // 如果用户正在查看历史消息，不应用此规则
  if (isUserScrolling.value) {
    console.log('🚫 用户正在查看历史消息，跳过最后消息高度调整')
    return
  }

  const messagesContainer = document.querySelector('.chat-messages') as HTMLElement
  if (!messagesContainer) return

  // 固定面板高度
  const EMOJI_PANEL_HEIGHT = 250  // 表情面板高度
  const MORE_PANEL_HEIGHT = 180   // 功能面板高度
  const INPUT_METHOD_PANEL_HEIGHT = 234  // 输入法面板高度（从日志中看到的）
  const BASE_HEIGHT = 78  // 基础高度

  // 检查当前激活的面板
  let minBottomHeight = BASE_HEIGHT

  // 检查输入法面板
  const inputMethodPanel = document.querySelector('.input-method-panel') as HTMLElement
  if (inputMethodPanel && inputMethodPanel.offsetHeight > 0) {
    minBottomHeight = INPUT_METHOD_PANEL_HEIGHT + BASE_HEIGHT
    console.log('📐 输入法面板激活，最后消息最低高度:', minBottomHeight)
  }
  // 检查表情面板
  else if ((document.querySelector('.emoji-panel') as HTMLElement)?.offsetHeight > 0) {
    minBottomHeight = EMOJI_PANEL_HEIGHT + BASE_HEIGHT
    console.log('📐 表情面板激活，最后消息最低高度:', minBottomHeight)
  }
  // 检查功能面板
  else if ((document.querySelector('.more-panel') as HTMLElement)?.offsetHeight > 0) {
    minBottomHeight = MORE_PANEL_HEIGHT + BASE_HEIGHT
    console.log('📐 功能面板激活，最后消息最低高度:', minBottomHeight)
  }
  else {
    console.log('📐 无面板激活，最后消息最低高度:', minBottomHeight)
  }

  // 设置消息容器的padding-bottom来确保最后一条消息的最低高度
  messagesContainer.style.setProperty('padding-bottom', `${minBottomHeight}px`, 'important')

  // 滚动到底部确保最后一条消息可见
  nextTick(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  })
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 显示聊天信息
const showChatInfo = () => {
  const chatId = chatInfo.value?.id || otherUserId
  if (chatId) {
    router.push(`/chat-info/${chatId}`)
  } else {
    console.error('❌ 无法获取聊天ID')
    appStore.showToast('无法打开聊天信息', 'error')
  }
}

// 判断是否应该显示时间
const shouldShowTime = (message: any, index: number) => {
  if (index === 0) {
    // 第一条消息总是显示时间
    return true
  }

  const prevMessage = messages.value[index - 1]
  if (!prevMessage) {
    return true
  }

  // 计算与前一条消息的时间间隔（毫秒）
  const timeDiff = message.timestamp - prevMessage.timestamp
  // 超过10分钟（600000毫秒）才显示时间
  return timeDiff > 600000
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()

  // 获取今天、昨天、前天的日期（只比较年月日）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dayBeforeYesterday = new Date(today)
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)

  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // 格式化时间部分
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // 判断是今天、昨天、前天还是更早
  if (messageDate.getTime() === today.getTime()) {
    // 今天：只显示时间
    return timeStr
  } else if (messageDate.getTime() === yesterday.getTime()) {
    // 昨天：显示"昨天 + 时间"
    return `昨天 ${timeStr}`
  } else if (messageDate.getTime() === dayBeforeYesterday.getTime()) {
    // 前天：显示"前天 + 时间"
    return `前天 ${timeStr}`
  } else {
    // 更早：显示"月/日 + 时间"
    const monthDay = date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric'
    })
    return `${monthDay} ${timeStr}`
  }
}

// 名片消息处理
const parseContactPayload = (message: any): any => {
  try { return JSON.parse(message?.content || '{}') } catch { return {} }
}

const getContactNameFromMessage = (message: any): string => {
  const p = parseContactPayload(message)
  const id = String(p.friendId || '')
  if (!id) return '好友名片'
  let saved: any = null
  try { saved = JSON.parse(localStorage.getItem(`friend_remark_${id}`) || 'null') } catch {}
  if (saved?.name && String(saved.name).trim()) return String(saved.name).trim()
  return `用户${id}`
}

const getContactAvatarFromMessage = (message: any): string => {
  const p = parseContactPayload(message)
  const id = String(p.friendId || '')
  if (!id) return ''
  try {
    const cache = JSON.parse(localStorage.getItem('friend_profile_cache') || '{}')
    const url = cache?.[id]?.avatar
    if (url) return url
  } catch {}
  return getRealAvatarUrl(id)
}

const handleContactAvatarError = (ev: Event, message: any) => {
  const img = ev.target as HTMLImageElement
  const p = parseContactPayload(message)
  img.src = getRealAvatarUrl(String(p.friendId || ''))
}

const openContactFromMessage = (message: any) => {
  const p = parseContactPayload(message)
  if (p.friendId) router.push(`/friend-profile/${p.friendId}`)
}

// 防止重复发送的标志
let isSending = false

// 处理消息发送
const handleMessageSend = async (message: { type: 'text' | 'image' | 'voice' | 'video' | 'file', content: string | File }) => {
  // 防止重复发送
  if (isSending) {
    console.log('⚠️ 消息正在发送中，跳过重复请求')
    return
  }

  try {
    isSending = true
    console.log('📤 ChatSimple 处理消息发送:', message)

    // 使用MessageSender组件发送消息
    if (messageSender.value) {
      await messageSender.value.sendMessage(message)
    } else {
      console.error('❌ MessageSender组件未初始化')
    }
  } catch (error) {
    console.error('❌ 消息发送失败:', error)
    appStore.showToast('消息发送失败', 'error')
  } finally {
    isSending = false
  }
}

// 检查位置选择结果
const checkLocationSelection = () => {
  try {
    const locationData = sessionStorage.getItem('selected_location')
    if (locationData) {
      const data = JSON.parse(locationData)
      sessionStorage.removeItem('selected_location')

      // 发送位置消息
      if (data.location) {
        const locationMessage = {
          type: 'location' as const,
          content: JSON.stringify({
            name: data.location.name,
            address: data.location.address,
            latitude: data.location.latitude,
            longitude: data.location.longitude
          })
        }
        handleMessageSend(locationMessage)
      }
    }
  } catch (error) {
    console.error('处理位置选择结果失败:', error)
  }
}

// 位置消息相关方法
const getLocationNameFromMessage = (message: any) => {
  try {
    const locationData = JSON.parse(message.content)
    return locationData.name || '位置'
  } catch {
    return '位置'
  }
}

const getLocationAddressFromMessage = (message: any) => {
  try {
    const locationData = JSON.parse(message.content)
    return locationData.address || '详细地址'
  } catch {
    return '详细地址'
  }
}

const getStaticMapFromMessage = (message: any, size = '280x140') => {
  try {
    const data = JSON.parse(message.content)
    const latRaw: any = (data || {}).latitude
    const lonRaw: any = (data || {}).longitude
    const latitude = typeof latRaw === 'number' ? latRaw : parseFloat(latRaw)
    const longitude = typeof lonRaw === 'number' ? lonRaw : parseFloat(lonRaw)
    if (!isFinite(latitude) || !isFinite(longitude)) return ''
    const [w, h] = String(size).split('x')
    const key = (import.meta as any).env?.VITE_AMAP_KEY || '57eda573d29a3034ad1419599454760e'
    return `https://restapi.amap.com/v3/staticmap?location=${longitude},${latitude}&zoom=16&scale=2&size=${w}*${h}&markers=mid,0x07C160,A:${longitude},${latitude}&key=${key}`
  } catch {
    return ''
  }
}

// 计算给定半径（米）在指定宽度像素下的静态图缩放级别（Zoom）
const calcZoomForRadius = (lat:number, widthPx:number, radiusMeters:number) => {
  const cos = Math.cos((lat||0) * Math.PI / 180)
  const metersPerPixel = (2 * radiusMeters) / Math.max(1, parseInt(String(widthPx)||'600'))
  const z = Math.log2((156543.03392 * cos) / metersPerPixel)
  return Math.max(3, Math.min(18, Math.round(z)))
}


// 地图缩略图回退：当高德静态图加载失败时，切换到 OSM 静态图
const fallbackMapSrcs = ref<Record<string, string>>({})

const buildAmapStatic = (lat:number, lon:number, size='600x300', radiusMeters=2000) => {
  const [w,h] = String(size).split('x')
  const zoom = calcZoomForRadius(lat, parseInt(w), radiusMeters)
  const key = (import.meta as any).env?.VITE_AMAP_KEY || '57eda573d29a3034ad1419599454760e'
  return `https://restapi.amap.com/v3/staticmap?location=${lon},${lat}&zoom=${zoom}&scale=2&size=${w}*${h}&markers=mid,0x07C160,A:${lon},${lat}&key=${key}`
}

const buildOSMStatic = (lat:number, lon:number, size='600x300', radiusMeters=2000) => {
  const [w,h] = String(size).split('x')
  const zoom = calcZoomForRadius(lat, parseInt(w), radiusMeters)
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${w}x${h}&markers=${lat},${lon},red`
}

const buildYandexStatic = (lat:number, lon:number, size='600x300', radiusMeters=2000) => {
  const [w,h] = String(size).split('x')
  const zoom = calcZoomForRadius(lat, parseInt(w), radiusMeters)
  return `https://static-maps.yandex.ru/1.x/?lang=zh_CN&ll=${lon},${lat}&z=${zoom}&size=${w},${h}&l=map&pt=${lon},${lat},pm2gnl`
}


const getMapSrc = (message:any, size='600x300') => {
  try{
    const id = String(message?.id || '')
    if (id && fallbackMapSrcs.value[id]) return fallbackMapSrcs.value[id]
    const data = JSON.parse(message.content||'{}')
    const lat = typeof data.latitude==='number'?data.latitude:parseFloat(data.latitude)
    const lon = typeof data.longitude==='number'?data.longitude:parseFloat(data.longitude)
    if(!isFinite(lat)||!isFinite(lon)) return ''
    return buildAmapStatic(lat, lon, size, 2000)
  }catch{return ''}
}

const handleStaticMapError = (ev: Event, message: any) => {
  try {
    const data = JSON.parse(message.content || '{}')
    const lat = typeof data.latitude === 'number' ? data.latitude : parseFloat(data.latitude)
    const lon = typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude)
    const id = String(message?.id || '')
    if (!isFinite(lat) || !isFinite(lon) || !id) return

    const img = ev.target as HTMLImageElement
    const current = img?.src || ''
    let next = ''
    if (current.includes('amap.com')) {
      // AMap failed -> try Yandex
      next = buildYandexStatic(lat, lon, '600x300', 2000)
    } else if (current.includes('yandex.ru')) {
      // Yandex failed -> try OSM static
      next = buildOSMStatic(lat, lon, '600x300', 2000)
    } else if (current.includes('openstreetmap.de')) {
      // OSM static failed -> final placeholder
      const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'>
        <rect width='100%' height='100%' fill='#eaeaea'/>
        <g fill='#999' font-family='sans-serif' font-size='14'>
          <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'>地图加载失败</text>
        </g>
      </svg>`)
      next = `data:image/svg+xml;charset=UTF-8,${svg}`
    } else {
      // Unknown -> try OSM
      next = buildOSMStatic(lat, lon, '600x300', 2000)
    }
    fallbackMapSrcs.value[id] = next
    if (img) img.src = next
  } catch {}
}


// 将位置信息按中国习惯（大到小）展示：若地址以逗号/顿号分隔，则反转片段顺序
const getLocationDisplayCN = (message: any) => {
  try {
    const data = JSON.parse(message.content || '{}')
    let addr = String(data.address || '').trim()
    // 若为“附近位置/含‘附近’”这类泛化描述，则优先展示名字
    if (!addr || /附近/.test(addr)) return String(data.name || addr || '')
    // 优先处理中文/英文逗号分隔
    const parts = addr.split(/[，,]/).map(s => s.trim()).filter(Boolean)
    if (parts.length > 1) {
      const reversed = parts.reverse()
      const filtered = reversed.filter(p => p !== '中国')
      return filtered.join(' ')
    }
    return addr
  } catch {
    return ''
  }
}

const openLocationFromMessage = (message: any) => {
  try {
    const locationData = JSON.parse(message.content)
    const { latitude, longitude, name } = locationData
    // 优先使用高德地图导航（移动端会尝试唤起APP，PC端打开网页版）


    const amapUrl = `https://uri.amap.com/navigation?to=${longitude},${latitude},${encodeURIComponent(name || '目的地')}&mode=car&policy=1&src=叶语`
    window.open(amapUrl, '_blank')
  } catch (error) {
    console.error('打开位置失败:', error)
    appStore.showToast('无法打开位置', 'error')
  }
}

// 处理消息发送成功
const handleMessageSent = (message: any) => {
  console.log('✅ 消息发送成功:', message)

  // 注意：不需要手动添加到chatStore，因为useChatItemManager已经处理了
  // 这里只需要处理UI相关的操作

  // 发送消息后强制滚动到底部，不管用户之前在哪个位置
  nextTick(() => {
    console.log('📨 消息发送成功，强制滚动到底部')
    scrollToBottom(true) // 强制滚动
  })

}

// 处理聊天创建
const handleChatCreated = (chatId: string) => {
  console.log('✅ 新聊天会话已创建:', chatId)

  appStore.showToast('开始新的聊天', 'success')
}

// 处理打字状态
const handleTyping = (isTyping: boolean) => {
  console.log('⌨️ 打字状态:', isTyping)
  // 这里可以发送打字状态给服务器
}

// 这些方法已移到 ChatInput 组件中

// 检查是否接近底部（用于判断是否应该自动滚动）
const isNearBottom = () => {
  if (!messagesContainer.value) return true
  const container = messagesContainer.value
  const threshold = 100 // 距离底部100px内认为是接近底部
  return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
}

// 滚动到底部（只在特定条件下执行）
const scrollToBottom = (force = false) => {
  if (!messagesContainer.value) return


  // 如果用户正在主动滚动查看历史消息，且不是强制滚动，则不自动滚动到底部
  if (isUserScrolling.value && !force) {
    console.log('🚫 用户正在查看历史消息，跳过自动滚动到底部')
    return
  }

  // 如果用户不在底部附近，且不是强制滚动，则不自动滚动
  if (!isNearBottom() && !force) {
    console.log('🚫 用户不在底部附近，跳过自动滚动到底部')
    return
  }

  console.log('📜 滚动到底部')
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

// 滚动到指定消息并高亮
const scrollToMessage = (messageId: string, highlightKeyword?: string) => {
  console.log('📍 定位到消息:', messageId, '高亮关键词:', highlightKeyword)

  // 保存搜索关键词用于高亮
  if (highlightKeyword) {
    searchHighlightKeyword.value = highlightKeyword
  }

  nextTick(() => {
    // 查找消息元素
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)

    if (messageElement && messagesContainer.value) {
      // 滚动到消息位置（消息在顶部）
      const containerTop = messagesContainer.value.offsetTop
      const messageTop = (messageElement as HTMLElement).offsetTop

      messagesContainer.value.scrollTop = messageTop - containerTop

      // 高亮消息
      messageElement.classList.add('message-highlight')

      // 3秒后移除高亮
      setTimeout(() => {
        messageElement.classList.remove('message-highlight')
      }, 3000)

      console.log('✅ 已定位到消息')
    } else {
      console.warn('⚠️ 未找到消息元素:', messageId)
      // 如果找不到消息，滚动到底部
      scrollToBottom(true)
    }
  })
}

// 高亮消息内容中的关键词
const highlightMessageContent = (message: any) => {
  const content = message.content || ''

  // 如果没有搜索关键词，直接返回原内容
  if (!searchHighlightKeyword.value) {
    return content
  }

  // 转义HTML特殊字符
  const escapeHtml = (text: string) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const escapedContent = escapeHtml(content)
  const keyword = searchHighlightKeyword.value

  // 使用正则表达式进行不区分大小写的替换
  const regex = new RegExp(`(${keyword})`, 'gi')
  return escapedContent.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// 监听用户滚动行为
const handleUserScroll = () => {
  if (!messagesContainer.value) return

  // 标记用户正在滚动
  isUserScrolling.value = true

  // 清除之前的定时器
  if (userScrollTimer.value) {
    clearTimeout(userScrollTimer.value)
  }

  // 1秒后重置滚动状态
  userScrollTimer.value = setTimeout(() => {
    isUserScrolling.value = false
    console.log('✅ 用户滚动状态重置')
  }, 1000)


  console.log('👆 检测到用户滚动，isNearBottom:', isNearBottom())
}

// 简化：让消息容器直接跟随输入框容器变化
const adjustMessagesContainerHeight = () => {
  // 初次挂载的稳定期内不调整，避免上下抖动
  if (!mountSettled.value) {
    return
  }
  const messagesContainer = document.querySelector('.chat-messages') as HTMLElement
  const inputContainer = document.querySelector('.wechat-input') as HTMLElement

  if (!messagesContainer || !inputContainer) {
    console.log('❌ 找不到消息容器或输入框容器')
    return
  }

  // 获取输入框容器的位置信息
  const inputRect = inputContainer.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  // 计算输入框容器距离底部的距离
  const inputDistanceFromBottom = viewportHeight - inputRect.top

  // 强制设置消息容器的所有相关样式，确保正确定位
  messagesContainer.style.setProperty('position', 'fixed', 'important')
  messagesContainer.style.setProperty('bottom', `${inputDistanceFromBottom}px`, 'important')
  messagesContainer.style.setProperty('top', '66px', 'important')
  messagesContainer.style.setProperty('left', '0', 'important')
  messagesContainer.style.setProperty('right', '0', 'important')
  messagesContainer.style.setProperty('z-index', '1', 'important')

  console.log(`📐 强制设置: 消息容器bottom=${inputDistanceFromBottom}px (输入框顶部距底部: ${inputDistanceFromBottom}px)`)
  console.log('📐 输入框位置:', {
    top: inputRect.top,
    bottom: inputRect.bottom,
    height: inputRect.height,
    computedBottom: getComputedStyle(inputContainer).bottom
  })
  console.log('📐 消息容器设置后的样式:', {
    position: getComputedStyle(messagesContainer).position,
    bottom: getComputedStyle(messagesContainer).bottom,
    top: getComputedStyle(messagesContainer).top,
    zIndex: getComputedStyle(messagesContainer).zIndex
  })
}

// 测试函数
const testAdjustHeight = () => {
  console.log('🧪 手动测试调整高度')

  // 先改变背景色，让用户看到变化
  const messagesContainer = document.querySelector('.chat-messages') as HTMLElement
  if (messagesContainer) {
    messagesContainer.style.backgroundColor = '#ffcccc' // 临时红色背景
    setTimeout(() => {
      messagesContainer.style.backgroundColor = '#f5f5f5' // 恢复原色
    }, 1000)
  }

  adjustLastMessagePosition()

  // 调整后，只有在用户接近底部时才滚动到底部
  nextTick(() => {
    scrollToBottom() // 使用智能滚动逻辑
  })
}

// 监听消息数量变化，新消息时强制滚动到底部
watch(() => messages.value.length, (newLength, oldLength) => {
  nextTick(() => {
    adjustMessagesContainerHeight()
    // 新消息时强制滚动到底部（发送消息的情况）
    if (newLength > oldLength) {
      console.log('📨 检测到新消息，强制滚动到底部')
      scrollToBottom(true) // 强制滚动
    }
  })
})

// 监听会话删除状态
watch(() => chatStore.sessions, (newSessions) => {
  // 检查当前会话是否还存在
  if (sessionId.value) {
    const currentSession = newSessions.find(s => s.id === sessionId.value)
    if (!currentSession) {
      console.log('🚫 当前会话已被删除，返回聊天列表')
      // 清空当前页面的消息
      messages.value.splice(0, messages.value.length)
      // 返回聊天列表
      router.replace('/')
    }
  }
}, { deep: true })

// 监听输入框位置变化
const observeInputPosition = () => {
  const inputContainer = document.querySelector('.wechat-input') as HTMLElement
  if (!inputContainer) return

  // 使用MutationObserver监听样式变化
  const observer = new MutationObserver((mutations) => {
    console.log('🔍 检测到输入框变化:', mutations.map(m => ({
      type: m.type,
      attributeName: m.attributeName,
      target: m.target
    })))
    adjustLastMessagePosition() // 调整最后消息位置
  })

  observer.observe(inputContainer, {
    attributes: true,
    attributeFilter: ['style', 'class']
  })

  // 移除定时器，避免性能问题
  // const intervalCheck = setInterval(() => {
  //   setMessagesContainerHeight()
  // }, 1000)

  // 初始调整
  adjustMessagesContainerHeight()

  // 监听窗口大小变化
  const handleResize = () => {
    adjustLastMessagePosition() // 调整最后消息位置
  }
  window.addEventListener('resize', handleResize)

  return {
    observer,
    cleanup: () => {
      observer.disconnect()
      // clearInterval(intervalCheck) // 已移除定时器
      window.removeEventListener('resize', handleResize)
    }
  }
}

// 在setup阶段注册卸载钩子，避免异步回调中调用onUnmounted
const inputObserverCleanup = ref<null | (() => void)>(null)
onUnmounted(() => {
  if (inputObserverCleanup.value) {
    inputObserverCleanup.value()
  }
  // 清理用户滚动定时器
  if (userScrollTimer.value) {
    clearTimeout(userScrollTimer.value)
  }
  window.removeEventListener('chat:media-captured', handleCapturedMedia as EventListener)
})

// 头像错误处理（优先回退到真实头像API，以减少404）
const handleAvatarError = (who: 'own' | 'other') => {
  if (who === 'own') {
    const fallback = getRealAvatarUrl(currentUserId)
    currentUser.value.avatar = fallback
  } else {
    const fallback = getRealAvatarUrl(chatInfo.value.id)
    chatInfo.value.avatar = fallback
  }
}

// 媒体文件错误处理
const handleMediaError = (event: Event, mediaType: string, messageId?: string) => {
  const target = event.target as HTMLImageElement | HTMLVideoElement
  console.warn(`❌ ${mediaType}加载失败:`, target.src)

  // 检查是否是blob URL错误（临时文件已失效）
  const isBlobUrl = target.src.startsWith('blob:')

  // 检查是否是404错误（文件不存在）
  const isFileNotFound = target.src.includes('localhost:8893/uploads/') &&
                         !target.src.includes('data:image/svg+xml')

  if ((isBlobUrl || isFileNotFound) && messageId) {
    console.warn('⚠️ 媒体加载失败:', messageId, isBlobUrl ? '(blob URL失效)' : '(可能暂不可用)')

    // 不再删除消息，避免有效的图片/视频被误删
    if (isBlobUrl) {
      // 等待MessageSender将内容更新为服务器URL后，界面会自动恢复
      return
    }

    if (isFileNotFound) {
      // 尝试一次强制刷新（加时间戳避免缓存）
      setTimeout(() => {
        try {
          const base = target.src.split('#')[0].split('?')[0]
          target.src = `${base}?t=${Date.now()}`
        } catch {}
      }, 800)
      return
    }
  }

  // 为图片设置占位符
  if (mediaType === '图片' && target instanceof HTMLImageElement) {
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4='
    target.alt = '图片加载失败'
  }

  // 为视频设置错误样式
  if (mediaType === '视频' && target instanceof HTMLVideoElement) {
    target.style.background = '#f5f5f5'
    target.style.display = 'flex'
    target.style.alignItems = 'center'
    target.style.justifyContent = 'center'
    target.innerHTML = '<div style="color: #999; font-size: 14px;">视频加载失败</div>'
  }
}

// 加载聊天信息
const loadChatInfo = async () => {
  console.log('💬 路由参数:', chatId)
  console.log('💬 解析结果:', `当前用户ID: ${currentUserId}, 对方用户ID: ${otherUserId}`)

  // 尝试从联系人列表获取真实昵称和头像（统一走真实头像API，避免/uploads直链404）
  let finalChatName = `用户${otherUserId}`
  let finalChatAvatar = getRealAvatarUrl(otherUserId)

  // 规范化头像：一律优先使用真实头像API
  const normalizeAvatarForUser = (id: string, url?: string) => {
    if (!url) return getRealAvatarUrl(id)
    const u = String(url)
    if (u.includes('/uploads/avatars/')) return getRealAvatarUrl(id)
    if (u.startsWith('http://localhost:8893/api/users/')) return u
    return getRealAvatarUrl(id)
  }

  try {
    // 从localStorage获取联系人缓存
    const contactsCache = localStorage.getItem('contacts_list')
    if (contactsCache) {
      const { data } = JSON.parse(contactsCache)
      if (data && Array.isArray(data)) {
        const contact = data.find((c: any) => c.id?.toString() === otherUserId)
        if (contact) {
          finalChatName = contact.nickname || contact.name || `用户${otherUserId}`
          finalChatAvatar = normalizeAvatarForUser(otherUserId, contact.avatar)
        }
      }
    }
  } catch (error) {
    console.warn('获取联系人信息失败:', error)
  }

  console.log('🖼️ 对方头像URL:', finalChatAvatar)

  chatInfo.value = {
    id: otherUserId,
    name: finalChatName,
    avatar: finalChatAvatar
  }

  // 更新路由 meta 标题，让 MobileApp 显示正确的标题
  if (route.meta) {
    route.meta.title = finalChatName
  }

  // 加载当前用户信息（头像统一走真实头像API，忽略/uploads直链）
  const currentUserName = authStore.user?.nickname || authStore.user?.username || '我'
  const currentUserAvatar = normalizeAvatarForUser(currentUserId, authStore.user?.avatar)

  currentUser.value = {
    id: currentUserId,
    name: currentUserName,
    avatar: currentUserAvatar
  }

  console.log('✅ 聊天信息加载成功:', chatInfo.value)
  console.log('✅ 当前用户信息:', currentUser.value)
}

// 加载历史消息
const loadHistoryMessages = () => {
  console.log('📨 加载历史消息，会话ID:', sessionId.value)

  // 确保chatStore已经加载了缓存数据
  chatStore.loadFromCache()

  const sessionMessages = chatStore.messages.get(sessionId.value) || []
  console.log('📨 找到历史消息数量:', sessionMessages.length)

  if (sessionMessages.length > 0) {
    console.log('✅ 历史消息加载完成')
    nextTick(() => {
      scrollToBottom(true) // 初始加载时强制滚动到底部
    })
  }
}

// 强制修复布局
const forceFixLayout = () => {
  nextTick(() => {
    // 强制设置消息容器的样式
    const messagesContainer = document.querySelector('.chat-messages') as HTMLElement
    if (messagesContainer) {
      messagesContainer.style.paddingBottom = '16px'
      messagesContainer.style.marginBottom = '0px'
      messagesContainer.style.boxSizing = 'border-box'
      messagesContainer.style.overflowY = 'auto'
      console.log('🔧 强制修复消息容器布局')

      // 立即调整消息容器高度
      adjustLastMessagePosition()
    }

    // 强制设置主容器的样式
    const chatSimple = document.querySelector('.chat-simple') as HTMLElement
    if (chatSimple) {
      chatSimple.style.display = 'flex'
      chatSimple.style.flexDirection = 'column'
      chatSimple.style.height = '100vh'
      chatSimple.style.position = 'fixed'
      chatSimple.style.top = '0'
      chatSimple.style.left = '0'
      chatSimple.style.right = '0'
      chatSimple.style.bottom = '0'
      console.log('🔧 强制修复主容器布局')
    }

    // 确保输入框在底部
    const inputContainer = document.querySelector('.wechat-input') as HTMLElement
    if (inputContainer) {
      inputContainer.style.position = 'fixed'
      inputContainer.style.bottom = '0'
      inputContainer.style.left = '0'
      inputContainer.style.right = '0'
      inputContainer.style.zIndex = '1000'
      console.log('🔧 强制修复输入框位置')
    }
  })
}

// 强制清理IndexedDB中的无效消息
const forceCleanupDatabase = async () => {
  try {
    console.log('🧹 开始强制清理数据库...')

    // 先删除整个数据库，重新开始
    const deleteRequest = indexedDB.deleteDatabase('leaftalk-messages')

    deleteRequest.onsuccess = () => {
      console.log('✅ 数据库已完全清理')
    }

    deleteRequest.onerror = () => {
      console.warn('⚠️ 数据库删除失败，尝试清理表')
    }

    deleteRequest.onblocked = () => {
      console.warn('⚠️ 数据库删除被阻止，尝试清理表')
    }

  } catch (error) {
    console.error('❌ 强制清理失败:', error)
  }
}

// 彻底清理所有存储
const clearAllStorage = () => {
  try {
    console.log('🧹 开始彻底清理所有存储...')

    // 1. 清理localStorage
    const keys = Object.keys(localStorage)
    let clearedCount = 0

    keys.forEach(key => {
      if (key.startsWith('chat_messages_') ||
          key.startsWith('chat_sessions_') ||
          key.startsWith('leaftalk_') ||
          key.includes('message') ||
          key.includes('chat')) {
        localStorage.removeItem(key)
        console.log(`🗑️ 清理localStorage: ${key}`)
        clearedCount++
      }
    })

    // 2. 清理sessionStorage
    const sessionKeys = Object.keys(sessionStorage)
    sessionKeys.forEach(key => {
      if (key.startsWith('chat_') ||
          key.startsWith('leaftalk_') ||
          key.includes('message')) {
        sessionStorage.removeItem(key)
        console.log(`🗑️ 清理sessionStorage: ${key}`)
        clearedCount++
      }
    })

    // 3. 清理内存中的消息
    if (chatStore && chatStore.messages) {
      chatStore.messages.clear()
      console.log('🗑️ 清理内存中的消息')
    }

    console.log(`✅ 存储清理完成，共清理 ${clearedCount} 个缓存项`)
  } catch (e) {
    console.warn('⚠️ 存储清理失败:', e)
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  console.log('🚀 ChatSimple组件挂载，会话ID:', sessionId.value)

  // 保存当前聊天ID到 localStorage（用于背景设置页面获取）
  const chatId = getCurrentChatId()
  localStorage.setItem('yeyu_last_chat_id', chatId)
  console.log('📝 保存当前聊天ID:', chatId)

  // 加载聊天背景（新版本 - 简单可靠）
  loadChatBackground()

  // 监听背景更新事件（简化版）
  if (eventBus) {
    eventBus.on('chatBackground:updated', (data: any) => {
      console.log('📢 收到背景更新事件:', data)
      if (data.chatId === chatId) {
        console.log('🔄 当前聊天背景已更新，立即重新加载')
        loadChatBackground()
      }
    })
  }



  // 检查位置选择结果
  checkLocationSelection()

  // 轻微淡入（下一个帧切换为不透明，配合CSS过渡）
  requestAnimationFrame(() => { isEntering.value = false })

  // 首先检查当前会话是否已被删除
  if (sessionId.value) {
    // 加载删除列表和清空列表
    chatStore.loadDeletedSessions()
    chatStore.loadClearedSessions()

    console.log('🔍 检查删除状态:', {
      sessionId: sessionId.value,
      deletedSessions: Array.from(chatStore.deletedSessions || []),
      clearedSessions: Array.from(chatStore.clearedSessions || [])
    })

    // 检查当前会话是否在删除列表中
    if (chatStore.deletedSessions && chatStore.deletedSessions.has(sessionId.value)) {
      console.log('🚫 当前会话已被删除，但用户主动访问，从删除列表中移除并重新创建会话')

      // 从删除列表中移除
      chatStore.deletedSessions.delete(sessionId.value)
      localStorage.setItem('deleted_chat_sessions', JSON.stringify(Array.from(chatStore.deletedSessions)))

      // 重新创建会话（如果不存在）
      const existingSession = chatStore.sessions.find(s => s.id === sessionId.value)
      if (!existingSession) {
        console.log('🔄 重新创建会话:', sessionId.value)
        // 这里会话会在后续的消息加载或发送时自动创建
      }
    }

    // 检查当前会话是否已被清空
    if (chatStore.clearedSessions && chatStore.clearedSessions.has(sessionId.value)) {
      console.log('🧹 当前会话已被清空，跳过历史消息加载，但允许新消息显示')
      // 注意：这里不清空当前消息，只是标记不加载历史消息
      // 新发送的消息仍然可以正常显示
    }

    // 清理当前会话的无效消息
    chatStore.cleanupInvalidMessages(sessionId.value)
  }

  // 确保样式立即加载
  await ensureStylesLoaded()

  // 立即调整消息容器高度
  nextTick(() => {
    adjustLastMessagePosition()
  })

  // 强制修复布局
  forceFixLayout()

  // 加载消息（使用本地持久化）
  await loadMessages()

  loadChatInfo()
  // loadHistoryMessages() // 移除重复调用，loadMessages()已经加载了消息

  // 延迟再次修复布局，确保所有组件都已渲染
  setTimeout(() => {
    forceFixLayout()
  }, 100)

  nextTick(() => {
    // 启动输入框位置监听
    const observer = observeInputPosition()

    // 记录清理函数，由setup阶段注册统一卸载
    if (observer && observer.cleanup) {
      inputObserverCleanup.value = observer.cleanup
    }

    // 检查是否需要定位到指定消息
    const messageId = route.query.messageId as string
    const highlightKeyword = route.query.highlight as string

    if (messageId) {
      // 定位到指定消息
      scrollToMessage(messageId, highlightKeyword)
    } else {
      scrollToBottom(true) // 页面初始化时强制滚动到底部
    }
  })

  // 初次进入的稳定期（避免上下抖动）：短暂冻结动态高度调整
  setTimeout(() => { mountSettled.value = true }, 320)

  // 监听拍摄页回传（事件通道）
  window.addEventListener('chat:media-captured', handleCapturedMedia as EventListener)

  // 处理通过store回传的媒体（更稳妥）
  await processPendingCapturedMedia()

  // 暴露清理函数到全局，方便在控制台调用
  ;(window as any).forceCleanupMessages = async () => {
    console.log('🧹 手动触发清理...')
    clearAllStorage()
    await forceCleanupDatabase()
    chatStore.cleanupAllInvalidMessages()
    console.log('✅ 手动清理完成，请刷新页面')
    // 强制刷新页面
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // 暴露删除测试函数到全局
  ;(window as any).testDeleteFunction = () => {
    console.log('🧪 测试删除功能...')
    console.log('当前会话ID:', sessionId.value)
    console.log('删除列表:', Array.from(chatStore.deletedSessions || []))
    console.log('清空列表:', Array.from(chatStore.clearedSessions || []))
    console.log('当前消息数量:', messages.value.length)

    // 测试删除当前会话
    if (sessionId.value) {
      console.log('🗑️ 测试删除当前会话...')
      chatStore.deleteChatItem(sessionId.value)
    }
  }

  // 暴露清空测试函数到全局
  ;(window as any).testClearFunction = () => {
    console.log('🧹 测试清空功能...')
    console.log('当前会话ID:', sessionId.value)
    console.log('当前消息数量:', messages.value.length)

    // 测试清空当前会话
    if (sessionId.value) {
      console.log('🧹 测试清空当前会话...')

      chatStore.clearChatHistory(sessionId.value)
    }
  }

  // 添加键盘事件监听
  window.addEventListener('keydown', onKeydown)

  // 初始化 settingsStore 并监听背景变化
  try {
    const { useGeneralStore } = await import('../../../modules/settings/stores/settingsStore')
    const generalStore = useGeneralStore()

    console.log('🔧 [ChatSimple] 设置背景监听器')
    console.log('🔧 [ChatSimple] 当前背景设置:', generalStore.settings.chatBackground)

    // 监听背景变化
    watch(() => generalStore.settings.chatBackground, async (newBackground, oldBackground) => {
      console.log('🔄 [ChatSimple] 检测到背景设置变化:', oldBackground, '->', newBackground)
      try {
        await loadChatBackground()
        console.log('✅ [ChatSimple] 背景加载完成')
      } catch (error) {
        console.error('❌ [ChatSimple] 背景加载失败:', error)
      }
    }, { deep: true, immediate: false })

    console.log('✅ [ChatSimple] 背景监听器已设置')
    console.log('✅ [ChatSimple] chatBackgroundStyle:', chatBackgroundStyle.value)
  } catch (error) {
    console.error('❌ 初始化settingsStore失败:', error)
  }
})

// 组件激活时重新加载背景（从背景设置页面返回时）
onActivated(() => {
  console.log('🔄 ChatSimple页面激活，重新加载聊天背景')
  loadChatBackground()
  checkLocationSelection()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)

  // 移除背景更新事件监听
  if (eventBus) {
    eventBus.off('chatBackground:updated')
  }
})
</script>

<style scoped>
.chat-simple {
  /* 不设置高度，让内容自然填充 */
  min-height: 100vh;
  /* 改为相对定位，支持绝对定位的子元素 */
  position: relative !important;
  background: #FFFFFF; /* 聊天容器使用正常白色 */
  box-sizing: border-box !important;
  padding: 0 !important;
  margin: 0 !important;
  /* 确保消息容器在输入框上面 */
  z-index: 1;
  /* 确保子元素正确排列 */
  overflow: hidden !important;
  /* 固定在屏幕上，为顶部导航栏留出空间 */
  position: fixed !important;
  top: 65px !important; /* 状态栏25px + 导航栏40px = 65px */
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  /* 轻微淡入过渡，减少路由切换抖动 */
  opacity: 1;
  transition: opacity .16s ease;
  will-change: opacity;
  backface-visibility: hidden;
}
.chat-simple.entering { opacity: 0; }

/* 消息区域 */
.chat-messages {
  /* 不使用flex: 1，而是使用固定高度计算 */
  overflow-y: auto !important;
  padding: 16px 0 78px 0 !important; /* 初始与脚本一致的底部留白，避免首次进入时的高度跳变 */
  margin: 0 !important;
  box-sizing: border-box !important;
  /* 按用户要求：消息容器固定底部53px */
  position: fixed !important;
  top: 65px !important; /* 状态栏25px + 导航栏40px = 65px */
  left: 0 !important;
  right: 0 !important;
  bottom: 53px !important; /* 固定底部53px，不再动态调整 */
  z-index: 1 !important;
  /* 背景由 Vue :style 绑定动态设置，不在这里设置默认值 */
  /* padding-bottom由JavaScript根据面板状态动态设置 */
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chat-messages::-webkit-scrollbar {
  display: none;
}

.empty-chat {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-chat p {
  margin: 16px 0 0 0;
  font-size: 16px;
}

/* 消息包装器 - 包含时间和消息 */
.message-wrapper {
  margin-bottom: 20px; /* 消息包装器间距 */
  transition: background-color 0.3s ease;
}

.message-wrapper.message-highlight {
  background-color: #E7F8EE; /* 浅绿色高亮背景 */
  border-radius: 8px;
  padding: 8px;
  margin-left: -8px;
  margin-right: -8px;
}

/* 搜索关键词高亮 */
.message-bubble :deep(mark.search-highlight) {
  background-color: transparent;
  color: #07C160;
  font-weight: 500;
  padding: 0;
}

.message-wrapper + .message-wrapper .message-item {
  margin-top: 20px; /* 相邻两头像间距40px = 20px + 20px */
}

/* 消息时间 - 显示在屏幕中间，气泡上方 */
.message-time-center {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 20px; /* 与气泡的间距是20px */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 0;
  position: relative;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

/* 对方头像：左边距12px，右边距10px */
.message-item:not(.own-message) .message-avatar {
  margin: 0 12px 0 12px; /* 头像与气泡间距固定为12px */
}

/* 当前用户头像：固定在屏幕右侧，右边距12px */
.message-item.own-message .message-avatar {
  position: absolute;
  right: 12px;
  top: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.message-content {
  max-width: calc(100vw - 116px); /* 屏幕宽度 - 116px */
  position: relative;
}

.message-content.own-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 60px; /* 36px头像 + 12px间距(图片/视频到头像) + 12px保留 */
  max-width: calc(100vw - 116px); /* 保持与对方消息相同的最大宽度 */
}

.message-bubble {
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  min-height: 36px;
  display: flex;
  align-items: center;
  position: relative;
  word-wrap: break-word;
  word-break: break-word;
}

/* 对方消息气泡箭头 - 指向左侧头像中心（头像高度36px，中心位置18px） */
.message-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 18px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid white;
}

.message-bubble.own-bubble {
  background: #07C160;
  color: white;
  padding: 8px 15px 8px 12px !important; /* 右侧15px内边距，左侧保持12px，使用!important确保生效 */
}

/* 直接针对当前用户消息内的文本设置右边距 */
.message-item.own-message .message-bubble p {
  margin-right: 3px !important; /* 额外增加3px右边距，总共15px */
  margin-left: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* 当前用户消息气泡箭头 - 指向右侧头像中心 */
.message-bubble.own-bubble::before {
  left: auto;
  right: -8px;
  top: 18px;
  transform: translateY(-50%);
  border-right: none;
  border-left: 8px solid #07C160;
}

.message-bubble p {
  margin: 0;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  font-size: 14px;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  /* 文本换行要达到气泡的最大长度才换行 */
  overflow-wrap: break-word;
  hyphens: auto;
}

/* 媒体消息样式 - 图片和视频 */
.message-image {
  max-width: 150px;
  height: auto;
  border-radius: 8px;
  display: block;
  /* 让元素按自身比例渲染，边框紧贴实际内容，不产生留白 */
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: transform, opacity;
}

.message-video {
  max-width: 150px;
  height: auto;
  border-radius: 8px;
  display: block;
  /* 移除黑色背景，避免出现内侧黑边 */
  background: transparent;
  backface-visibility: hidden;
/* 无 :has 支持时，位置消息也按图片样式处理 */
.message-bubble.is-location{padding:0!important;background:transparent!important;box-shadow:none!important}
.message-bubble.is-location::before{display:block}

  transform: translateZ(0);
  will-change: transform, opacity;
}

/* 轻量视频UI：仅中央播放按钮 */
.video-wrapper { position: relative; display: inline-block; backface-visibility: hidden; transform: translateZ(0); will-change: transform, opacity; }
.video-play-btn {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 44px; height: 44px; border-radius: 50%;
  border: none; outline: none; cursor: pointer;
  background: rgba(0,0,0,0.45); color: #fff; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
}
.video-wrapper:hover .video-play-btn { background: rgba(0,0,0,0.6); }


/* 消息状态样式已移除 */

.message-failed {
  opacity: 0.6;
  border: 1px solid #ff4444 !important;
}

.message-error {
  font-size: 12px;
  color: #ff4444;
  margin-top: 4px;
  padding: 4px 8px;
  background: #fff2f2;
  border-radius: 4px;
}

/* 自己发送的媒体消息：2px绿色边框，紧贴媒体内容 */
.message-item.own-message .message-image,
.message-item.own-message .message-video {
  border: 2px solid #07C160;
  box-sizing: border-box;
}

/* 确保媒体消息的气泡没有额外padding */
.message-bubble:has(.message-image),
.message-bubble:has(.message-video) {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* 媒体消息气泡保留箭头 */
.message-bubble:has(.message-image)::before,
.message-bubble:has(.message-video)::before {
  display: block;
}

/* 名片气泡样式（仿微信） */
.contact-bubble { display: flex; }
.contact-bubble .cb-card { display:flex; align-items:center; gap:8px; background:#f6f6f6; border:1px solid #e6e6e6; border-radius:8px; padding:8px 10px; min-width:180px; max-width:240px; }
.contact-bubble .cb-avatar { width:36px; height:36px; border-radius:6px; object-fit:cover; background:#ddd; }
.contact-bubble .cb-text { display:flex; flex-direction:column; justify-content:center; }
.contact-bubble .cb-title { font-size:12px; color:#999; line-height:16px; }
/* 底部通话选择弹层 */
.call-sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;z-index:9999}
.call-sheet{width:100%;max-width:480px;background:#E5E5E5;border-radius:16px 16px 0 0;height:calc(150px + env(safe-area-inset-bottom));padding:0 0 2px;animation:callSlideUp .22s ease-out;box-shadow:0 -6px 24px rgba(0,0,0,.08);display:flex;flex-direction:column;gap:5px}
.call-sheet .option{width:100%;background:#fff;border:none;height:44px;line-height:44px;padding:0;font-size:16px;color:#333;text-align:center;border-radius:0}
.call-sheet .option:first-child{border-top-left-radius:16px;border-top-right-radius:16px}

.call-sheet .option.cancel{color:#666;height:50px;line-height:50px;background:#fff}
@keyframes callSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}

.contact-bubble .cb-name { font-size:14px; color:#333; line-height:18px; font-weight:400; }

/* 位置消息气泡样式 */
.location-bubble {
  display: flex;
  cursor: pointer;
}

.location-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f6f6f6;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  max-width: 280px;
  transition: background 0.2s ease;
}

.location-card:hover {
  background: #f0f0f0;
}

.location-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;

  background: #f0f9f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-info {
  flex: 1;

  min-width: 0;
}

.location-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  line-height: 18px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location-address {
  font-size: 12px;
  color: #666;
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 旧的message-time样式已移除，使用message-time-center */

/* 响应式适配 - JavaScript会动态调整消息容器的底部间距 */
/* 不再使用固定的CSS值，而是通过JavaScript实时计算输入框位置 */

/* 输入区域样式已移到 ChatInput 组件中 */
/* 全屏媒体预览 */
.media-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.media-preview-overlay .preview-image,
.media-preview-overlay .preview-video {
  max-width: 100vw;
  max-height: 100vh;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

/* 预览关闭与播放按钮 */
.preview-close-btn{position:absolute;top:16px;left:16px;width:36px;height:36px;border-radius:18px;border:1px solid rgba(255,255,255,0.5);background:rgba(0,0,0,0.5);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px}
.preview-close-btn:hover{background:rgba(0,0,0,0.7)}
.preview-video-wrap{position:relative;display:flex;align-items:center;justify-content:center}
.preview-play-btn{position:absolute;width:64px;height:64px;border-radius:32px;border:2px solid rgba(255,255,255,0.8);background:rgba(0,0,0,0.5);color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px}

/* 位置缩略图卡片（带缩略图与信息区）*/
.location-card.with-thumb{display:flex;flex-direction:column;gap:0;padding:2px;overflow:hidden;background:#fff;border:1px solid #eee;border-radius:8px}
.location-thumb{position:relative;width:100%;height:140px;background:#eaeaea}
.location-thumb-img{width:100%;height:140px;object-fit:cover;display:block}
.thumb-overlay{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:flex-start;background:linear-gradient(to top,rgba(0,0,0,0.3),transparent 60%);pointer-events:none}
.thumb-pill{margin:6px;padding:2px 6px;font-size:12px;color:#fff;background:rgba(0,0,0,0.45);border-radius:10px;max-width:80%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.location-card.with-thumb .location-info{padding:10px 12px}


/* 兼容性：不依赖 :has()，对位置消息直接用类名覆盖样式 */
.message-bubble.is-location{padding:0!important;background:transparent!important;box-shadow:none!important}
.message-bubble.is-location::before{display:block}

/* 位置消息在气泡中的表现，和图片一致：去掉内边距与背景，保留箭头 */
.message-bubble:has(.location-card.with-thumb){padding:0!important;background:transparent!important;box-shadow:none!important}
.message-bubble:has(.location-card.with-thumb)::before{display:block}

/* 自己发送的位置消息：2px 主色边框 */
.message-item.own-message .location-card.with-thumb{border:2px solid #07C160}

/* 宽度规则：当(屏幕宽度-116px)>=180px取180px，否则取(屏幕宽度-116px) */
.location-card.with-thumb{width:min(180px, calc(100vw - 116px))}
/* 文字左对齐 */
.location-card.with-thumb .location-info{text-align:left}



</style>
