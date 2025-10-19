<template>
  <div class="realtime-message-receiver">
    <!-- 连接状态组件 -->
    <ConnectionStatus
      v-if="showStatus"
      :is-connected="isConnected"
      :is-connecting="isConnecting"
      :reconnect-count="reconnectAttempts"
      server-url="ws://localhost:8893"
      :on-reconnect="initializeConnection"
      :on-toggle-offline-mode="toggleOfflineMode"
    />

    <!-- 子组件内容 -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../../../stores/auth'
import { useUnreadStore } from '../stores/unread'
import { useContactStore } from '../../contacts/stores/contactsStore'
import { useCallStore } from '../stores/callStore'
import { useGroupPermissionsStore } from '../stores/groupPermissions'

import ConnectionStatus from './ConnectionStatus.vue'


// 全局开关：启用音视频通话相关事件处理
const CALLS_DISABLED = false

// Props
interface Props {
  showStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showStatus: false
})

// 共享 Socket（跨组件生命周期保持连接）
let sharedSocket: Socket | null = null

// 状态管理
const socket = ref<Socket | null>(null)
const isConnected = ref(false)
const isConnecting = ref(false)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5

// Router
const router = useRouter()

// Stores
const chatStore = useChatStore()
const contactStore = useContactStore()
const callStore = useCallStore()
const groupPerms = useGroupPermissionsStore()

const authStore = useAuthStore()
const unreadStore = useUnreadStore()

// 计算属性
const statusClass = computed(() => ({
  'status-connected': isConnected.value,
  'status-connecting': isConnecting.value,
  'status-disconnected': !isConnected.value && !isConnecting.value
}))

const statusText = computed(() => {
  if (isConnected.value) return '已连接'
  if (isConnecting.value) return '连接中...'
  return '未连接'
})

// 初始化WebSocket连接
const initializeConnection = async () => {
  try {
    const token = localStorage.getItem('yeyu_auth_token')
    const userId = authStore.user?.id

    if (!token || !userId) {
      console.warn('⚠️ 用户未登录，跳过实时消息服务初始化')
      return
    }

    // 如果已有共享连接并且处于连接状态，则复用，不重复初始化
    if (sharedSocket && sharedSocket.connected) {
      console.log('🔌 复用共享 WebSocket 连接')
      socket.value = sharedSocket
      isConnected.value = true
      isConnecting.value = false
      reconnectAttempts.value = 0
      joinUserRoom()
      return
    }

    // 如果组件内有旧连接，先断开（共享连接不动）
    if (socket.value && socket.value.connected && socket.value !== sharedSocket) {
      console.log('🔌 断开组件内旧的WebSocket连接（非共享）')
      try { socket.value.disconnect() } catch {}
      socket.value = null
    }

    console.log('🔌 初始化实时消息接收器...')
    isConnecting.value = true

    // 检查WebSocket服务器是否可用
    const isServerAvailable = await checkServerAvailability()

    if (!isServerAvailable) {
      console.warn('⚠️ WebSocket服务器不可用，启用离线模式')
      enableOfflineMode()
      return
    }

      socket.value = io('http://localhost:8893', {
      auth: { token, userId },
      transports: ['websocket', 'polling'],
      timeout: 15000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 15000,
      randomizationFactor: 0.5,
      forceNew: true,
      upgrade: true,
      rememberUpgrade: true
    })



    // 设置为共享连接
    sharedSocket = socket.value

    setupEventListeners()

  } catch (error) {
    console.error('❌ 实时消息接收器初始化失败:', error)
    isConnecting.value = false
    enableOfflineMode()
  }
}

// 移除事件监听器（避免重复绑定）- 放在模块作用域，供多个函数调用
function removeEventListeners() {
  const s = socket.value
  if (!s) return
  try {
    const events = ['connect','disconnect','connect_error','new_message','system_message','message_status','user_status','blacklist_updated','incoming_call','webrtc:incoming-call','call_timeout','call_answered','call_ended','unread_update','group_settings_updated','group_announcement_updated']
    events.forEach(evt => { try { (s as any).off(evt) } catch {} })
  } catch {}
}


// 设置事件监听器
const setupEventListeners = () => {
  if (!socket.value) return

  // 注册前先清空可能存在的旧监听，避免重复
  removeEventListeners()

  // 连接成功
  socket.value.on('connect', () => {


    console.log('✅ 实时消息接收器连接成功')
    isConnected.value = true
    isConnecting.value = false
    reconnectAttempts.value = 0
    joinUserRoom()
  })

  // 连接断开
  socket.value.on('disconnect', (reason) => {
    console.log('❌ 实时消息接收器连接断开:', reason)
    isConnected.value = false
    isConnecting.value = false

    // 根据断开原因决定是否重连
    if (reason === 'io server disconnect') {
      // 服务器主动断开，可能是服务器重启
      console.log('🔄 服务器主动断开，延迟重连...')
      setTimeout(() => {
        if (!isConnected.value && !isConnecting.value) {
          initializeConnection()
        }
      }, 5000)
    } else if (reason === 'transport close' || reason === 'transport error') {
      // 网络问题，尝试重连
      console.log('🔄 网络问题，延迟重连...')
      setTimeout(() => {
        if (!isConnected.value && !isConnecting.value) {
          handleReconnect()
        }
      }, 3000)
    } else if (reason === 'io client disconnect') {
      // 客户端主动断开，不重连
      console.log('🔌 客户端主动断开，不重连')
    }
  })

  // 连接错误
  socket.value.on('connect_error', (error) => {
    // 只在开发环境且用户已登录时输出错误信息
    if (import.meta.env.DEV && authStore.isAuthenticated) {
      console.error('❌ 实时消息接收器连接错误:', error)
    }
    isConnecting.value = false

    // 详细的错误处理
    if (error.message.includes('ECONNREFUSED')) {
      if (import.meta.env.DEV && authStore.isAuthenticated) {
        console.error('❌ 服务器拒绝连接，可能服务器未启动，启用离线模式')
      }
      enableOfflineMode()
      return
    } else if (error.message.includes('timeout')) {
      if (import.meta.env.DEV && authStore.isAuthenticated) {
        console.error('❌ 连接超时，网络可能有问题')
      }
    }

    // 延迟重连，避免频繁尝试
    setTimeout(() => {
      if (!isConnected.value && !isConnecting.value) {
        handleReconnect()
      }
    }, 5000)
  })

  // 接收新消息
  socket.value.on('new_message', handleNewMessage)


  // 
  // 
  //   
  socket.value.on('system_message', handleSystemMessage)

  // 消息状态更新
  socket.value.on('message_status', handleMessageStatusUpdate)

  // 用户状态更新
  socket.value.on('user_status', handleUserStatusUpdate)
  // 黑名单更新（服务端广播）
  socket.value.on('blacklist_updated', (payload: any) => {
    try {
      const id = String(payload?.userId || '')
      const action = payload?.action
      console.log('🧱 收到黑名单更新事件:', payload)
      if (action === 'add' && id) {
        contactStore.removeContact(id)
      }
      // 可按需处理 'remove' 事件（从黑名单移除时是否恢复联系人由业务决定）
    } catch (e) {
      console.warn('处理 blacklist_updated 事件失败:', e)
    }
  })

  // 来电通知（兼容两种事件名称）
  socket.value.on('incoming_call', handleIncomingCall)
  socket.value.on('webrtc:incoming-call', handleIncomingCall)

  // 通话超时
  socket.value.on('call_timeout', handleCallTimeout)
  // 通话已接听
  socket.value.on('call_answered', (data) => {
    console.log('🔔 WebSocket收到call_answered事件:', data)
    handleCallAnswered(data)
  })

  // 通话结束
  socket.value.on('call_ended', (data) => {
    console.log('🔔 WebSocket收到call_ended事件:', data)
    handleCallEnded(data)
  })

  // 未读消息计数更新
  socket.value.on('unread_update', handleUnreadUpdate)

  // 群设置实时更新（权限/审核开关）
  socket.value.on('group_settings_updated', (payload: any) => {
    try {
      console.log('🔔 收到 group_settings_updated:', payload)
      const groupId = String(payload?.groupId || '')
      const onlyAdmin = !!payload?.only_admin_can_rename
      const requireApproval = !!payload?.require_approval

      // 写入 Pinia，全局可响应
      if (groupId) {
        groupPerms.setSettings(groupId, {
          onlyAdminCanRename: onlyAdmin,
          requireApproval: requireApproval
        })
      }

      // 转发为全局自定义事件，供页面监听（兼容已有页面逻辑）
      try { window.dispatchEvent(new CustomEvent('group-name-edit-permission-changed', { detail: { groupId, nameEditRestricted: onlyAdmin } })) } catch {}
      try { window.dispatchEvent(new CustomEvent('group-invite-approval-changed', { detail: { groupId, requireApproval } })) } catch {}
    } catch (e) {
      console.warn('处理 group_settings_updated 事件失败:', e)
    }
  })

  // 群公告更新事件
  socket.value.on('group_announcement_updated', (payload: any) => {
    try {
      console.log('📢 收到 group_announcement_updated:', payload)
      const groupId = String(payload?.groupId || '')

      // 转发为全局自定义事件，供页面监听
      if (groupId) {
        window.dispatchEvent(new CustomEvent('group-announcement-updated', {
          detail: { groupId }
        }))
      }
    } catch (e) {
      console.warn('处理 group_announcement_updated 事件失败:', e)
    }
  })

  // 群成员变化事件
  socket.value.on('group-members-changed', (payload: any) => {
    try {
      console.log('👥 收到 group-members-changed:', payload)
      const { groupId, memberCount } = payload || {}

      if (groupId) {
        // 保存成员数量到localStorage
        localStorage.setItem(`group_member_count_${groupId}`, String(memberCount))

        // 转发为全局自定义事件，供页面监听
        window.dispatchEvent(new CustomEvent('group-members-changed', {
          detail: { groupId, memberCount }
        }))
        console.log('📢 已转发 group-members-changed 事件')
      }
    } catch (error) {
      console.error('❌ 处理 group-members-changed 事件失败:', error)
    }
  })

  // 群成员退出事件
  socket.value.on('group-member-left', (payload: any) => {
    try {
      console.log('🚪 收到 group-member-left:', payload)
      const { groupId, memberCount } = payload || {}

      if (groupId) {
        // 保存成员数量到localStorage
        localStorage.setItem(`group_member_count_${groupId}`, String(memberCount))

        // 转发为全局自定义事件，供页面监听
        window.dispatchEvent(new CustomEvent('group-members-changed', {
          detail: { groupId, memberCount }
        }))
        console.log('📢 已转发 group-member-left 事件')
      }
    } catch (error) {
      console.error('❌ 处理 group-member-left 事件失败:', error)
    }
  })

  // 用户被踢出群聊事件
  socket.value.on('removed_from_group', (payload: any) => {
    try {
      console.log('🚫 收到 removed_from_group:', payload)
      const { groupId, operatorName } = payload || {}

      if (groupId) {
        // 不删除聊天项，保留消息历史
        // 只标记用户已被移除，禁止发送新消息
        console.log('🚫 用户已被移除群聊，保留消息历史:', groupId)

        // 可以在这里添加一个标记，表示用户已被移除
        // 例如：localStorage.setItem(`removed_from_group_${groupId}`, 'true')
        // 这样在发送消息时可以检查这个标记，禁止发送
      }
    } catch (error) {
      console.error('❌ 处理 removed_from_group 事件失败:', error)
    }
  })

  // 群名称更新事件
  socket.value.on('group_name_updated', (payload: any) => {
    try {
      console.log('📢📢📢 收到 group_name_updated:', payload)
      console.log('📢 payload 详情:', JSON.stringify(payload, null, 2))
      const { groupId, newGroupName } = payload || {}
      console.log('📢 解析后:', { groupId, newGroupName })

      if (groupId && newGroupName) {
        // 1. 更新 chatStore 中的会话名称（只在没有备注时更新显示名称）
        const session = chatStore.sessions.find(s => s.id === groupId)
        if (session) {
          // 检查是否有群聊备注
          const savedRemark = localStorage.getItem(`group_remark_${groupId}`)

          // 保留成员数（如果有）
          const memberCountMatch = session.name?.match(/（(\d+)）$/)
          const memberCount = memberCountMatch ? memberCountMatch[1] : ''

          // 如果有备注，保持备注名称；否则使用新群名
          if (savedRemark && savedRemark.trim()) {
            // 有备注，保持备注名称不变
            const remarkName = savedRemark.trim()
            session.name = memberCount ? `${remarkName}（${memberCount}）` : remarkName
            console.log('✅ 保持群备注名称:', session.name)
          } else {
            // 没有备注，使用新群名
            session.name = memberCount ? `${newGroupName}（${memberCount}）` : newGroupName
            console.log('✅ 更新为新群名:', session.name)
          }

          // 保存到缓存
          chatStore.saveToCache()
        }

        // 2. 转发为全局自定义事件，供页面监听
        console.log('📢 准备转发 group-name-changed 事件...')
        window.dispatchEvent(new CustomEvent('group-name-changed', {
          detail: { groupId, newGroupName }
        }))
        console.log('✅✅✅ 已转发 group-name-changed 事件:', { groupId, newGroupName })
      } else {
        console.warn('⚠️ groupId 或 newGroupName 为空，不转发事件')
      }
    } catch (e) {
      console.error('❌ 处理 group_name_updated 事件失败:', e)
    }
  })

}

// 处理新消息接收
const handleNewMessage = async (message: any) => {
  console.log('📨 收到新消息:', message)
  console.log('📨 消息类型 (message.type):', message.type)
  console.log('📨 消息完整对象:', JSON.stringify(message))
  console.log('📨 发送者ID:', message.senderId)

  const currentUserId = authStore.user?.id

  // 确保不是自己发送的消息（公告消息和系统消息除外）；允许服务端自回显 isOwn=true
  const isOwnEcho = (message as any).isOwn === true
  if (message.senderId === currentUserId && !isOwnEcho && message.type !== 'announcement' && message.type !== 'system') {
    console.log('⚠️ 过滤掉自己发送的消息（非自回显）')
    return
  }

  // 创建或更新聊天项
  const chatMessage = {
    id: message.id || `msg_${Date.now()}`,
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    type: message.type || 'text',
    timestamp: message.timestamp || Date.now(),
    status: 'delivered',
    isOwn: isOwnEcho === true,
    senderName: message.senderName || null  // 添加发送者昵称
  }

  console.log('📨 处理后的消息:', chatMessage)

  // 🛡️ 判断是否为群聊消息
  const isGroupMessage = String(message.receiverId).startsWith('group_')

  // 获取发送者真实信息
  let senderInfo = {
    id: message.senderId,
    name: message.senderName || `用户${message.senderId}`,
    nickname: message.senderName || `用户${message.senderId}`,
    avatar: message.senderAvatar || null
  }

  // 如果是群聊消息，获取群聊信息和发送者的群昵称
  if (isGroupMessage) {
    try {
      console.log('🔍 获取群聊信息，群ID:', message.receiverId)
      const response = await fetch(`http://localhost:8893/api/groups/${message.receiverId}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (response.ok) {
        const groupData = await response.json()
        if (groupData.success && groupData.data) {
          senderInfo = {
            ...senderInfo,
            groupName: groupData.data.name || groupData.data.title || `群聊${message.receiverId.substring(6, 16)}`,
            groupAvatar: groupData.data.avatar || null,
            groupId: message.receiverId
          }
          console.log('✅ 获取到群聊信息:', senderInfo)
        }
      }

      // 获取群成员信息，包括发送者的群昵称
      try {
        const membersResponse = await fetch(`http://localhost:8893/api/groups/${message.receiverId}/members`, {
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (membersResponse.ok) {
          const membersData = await membersResponse.json()
          if (membersData.success && membersData.data) {
            const sender = membersData.data.find((m: any) => String(m.id) === String(message.senderId))
            if (sender && sender.group_nickname) {
              // 缓存发送者的群昵称到localStorage
              localStorage.setItem(`group_member_nickname_${message.receiverId}_${message.senderId}`, sender.group_nickname)
              console.log('✅ 缓存发送者群昵称:', sender.group_nickname)
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ 获取群成员信息失败:', error)
      }
    } catch (error) {
      console.warn('⚠️ 获取群聊信息失败:', error)
      // 使用默认群聊名称
      senderInfo = {
        ...senderInfo,
        groupName: `群聊${message.receiverId.substring(6, 16)}`,
        groupId: message.receiverId
      }
    }
  } else {
    // 如果消息中没有发送者信息，尝试从API获取
    if (!message.senderName || !message.senderAvatar) {
      try {
        console.log('🔍 获取发送者信息，用户ID:', message.senderId)
        const response = await fetch(`http://localhost:8893/api/users/${message.senderId}`, {
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          if (userData.success && userData.data) {
            senderInfo = {
              id: message.senderId,
              name: userData.data.nickname || userData.data.username || `用户${message.senderId}`,
              nickname: userData.data.nickname || userData.data.username || `用户${message.senderId}`,
              avatar: userData.data.avatar || `http://localhost:8893/api/users/${message.senderId}/avatar`
            }
            console.log('✅ 获取到发送者信息:', senderInfo)
          }
        }
      } catch (error) {
        console.warn('⚠️ 获取发送者信息失败:', error)
      }
    }
  }

  console.log('📨 接收方创建聊天项，消息类型:', isGroupMessage ? '群聊' : '私聊')
  console.log('📨 接收方创建聊天项，发送者信息:', senderInfo)
  console.log('📨 接收方创建聊天项，消息内容:', chatMessage.content)

  // 使用chatStore的接收消息方法
  if (typeof chatStore.receiveMessage === 'function') {
    await chatStore.receiveMessage(chatMessage, senderInfo)
  } else {
    // 兜底方案：直接创建或更新聊天项
    await chatStore.createOrUpdateChatItem(chatMessage, senderInfo)
  }

  // 检查创建后的聊天项
  // 🛡️ 使用已声明的 isGroupMessage 变量
  const sessionId = isGroupMessage
    ? String(chatMessage.receiverId)
    : generateSessionId(chatMessage.senderId, chatMessage.receiverId)

  const createdSession = chatStore.sessions.find(s => s.id === sessionId)
  if (createdSession) {
    console.log('📨 接收方聊天项创建完成:', {
      id: createdSession.id,
      name: createdSession.name,
      avatar: createdSession.avatar,
      lastMessage: createdSession.lastMessage,
      lastMessageType: createdSession.lastMessageType,
      unreadCount: createdSession.unreadCount
    })
  }

  // 更新未读计数（使用同一个sessionId）
  unreadStore.addUnreadMessage(sessionId, {
    id: chatMessage.id,
    sessionId: sessionId,
    senderId: chatMessage.senderId,
    content: chatMessage.content,
    type: chatMessage.type || 'text',
    timestamp: chatMessage.timestamp
  })

  // 发送消息已送达确认
  sendMessageDelivered(chatMessage.id)

  // 显示通知（如果页面不在前台）
  if (document.hidden) {
    showNotification(chatMessage)
  }
}

// 处理消息状态更新
const handleMessageStatusUpdate = (data: { messageId: string, status: string }) => {
  console.log('📋 消息状态更新:', data)
  // 这里可以更新消息的显示状态
}

// 处理用户状态更新
const handleUserStatusUpdate = (status: any) => {
  console.log('👤 用户状态更新:', status)
  // 这里可以更新用户在线状态显示
}

// 
const handleSystemMessage = (payload: { type: string; targetUserId?: string; content: string }) => {
  try {
    const targetId = payload.targetUserId
    // 🛡️ 判断是否为群聊消息
    const isGroupMessage = String(targetId || '').startsWith('group_')
    const sessionId = isGroupMessage
      ? String(targetId || '')
      : generateSessionId(String(authStore.user?.id || ''), String(targetId || ''))

    chatStore.addMessage(sessionId, {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      senderId: authStore.user?.id,
      receiverId: targetId,
      content: payload.content || '系统通知',
      type: 'text',
      timestamp: Date.now(),
      status: 'delivered'
    } as any)
  } catch (e) {
    console.warn('处理系统消息失败:', e)
  }
}

// 处理来电通知
const handleIncomingCall = (callData: any) => {
  if (CALLS_DISABLED) { console.log('☎️ 通话功能已禁用，忽略 incoming_call'); return }

  console.log('📞 收到来电通知:', callData)
  try {
    const { callId, type, fromUserId } = callData

    // 去重：避免多个实例重复处理同一个来电
    const handledKey = `handled_call_${callId}`
    try {
      if (sessionStorage.getItem(handledKey)) {
        console.log('⚠️ 此来电已处理，忽略重复事件:', callId)
        return
      }
      sessionStorage.setItem(handledKey, String(Date.now()))
    } catch (e) {
      // 若sessionStorage不可用，忽略去重但不影响流程
    }

    // 跳转到来电页面
    console.log('📞 收到来电，跳转到来电页面')
    try {
      // 标记通话流程中，保持聊天实时连接
      try { sessionStorage.setItem('keep_realtime_ws', '1') } catch {}
      router.push({
        path: '/call',
        query: { action: 'incoming', callId, type, targetUserId: fromUserId }
      })
      console.log('✅ 已跳转到来电页面')
    } catch (e) {
      console.error('❌ 路由跳转失败:', e)
      // 备用方案：直接修改URL
      window.location.href = `http://localhost:5173/call?action=incoming&callId=${callId}&type=${type}&targetUserId=${fromUserId}`
    }
  } catch (error) {
    console.error('❌ 处理来电通知失败:', error)
  }
}

// 处理通话超时（现在统一为call_ended事件）
const handleCallTimeout = (data: any) => {
  if (CALLS_DISABLED) { console.log('\u260e\ufe0f \u901a\u8bdd\u529f\u80fd\u5df2\u7981\u7528\uff0c\u5ffd\u7565 call_timeout'); return }

  console.log('⏰ 收到通话超时通知（已废弃，统一使用call_ended）:', data)
  // 超时现在统一通过call_ended事件处理，这里保留兼容性
  handleCallEnded(data)
}

// 处理通话已接听（对端接听）
const handleCallAnswered = (data: any) => {
  if (CALLS_DISABLED) { console.log('☎️ 通话功能已禁用，忽略 call_answered'); return }
  console.log('✅ 收到通话已接听通知:', data)
  try {
    const { callId } = data || {}
    const url = new URL(window.location.href)
    const currentCallId = url.searchParams.get('callId')
    const path = url.pathname
    const isCallPage = path.includes('/call') || path.includes('/incoming-call') || path.includes('/video-call') || path.includes('/voice-call')
    if (isCallPage && currentCallId === callId) {
      // 将状态更新为connected，供通话页侦听
      try { window.dispatchEvent(new CustomEvent('call_answered', { detail: data })) } catch {}
      const q: any = Object.fromEntries(url.searchParams.entries())
      q.status = 'connected'
      router.replace({ path: path, query: q })
    }
  } catch (error) {
    console.error('❌ 处理通话已接听通知失败:', error)
  }
}


// 处理通话结束
const handleCallEnded = (data: any) => {
  if (CALLS_DISABLED) { console.log('\u260e\ufe0f \u901a\u8bdd\u529f\u80fd\u5df2\u7981\u7528\uff0c\u5ffd\u7565 call_ended'); return }

  console.log('📞 收到通话结束通知:', data)
  console.log('📞 当前页面路径:', window.location.pathname)
  console.log('📞 当前页面查询参数:', window.location.search)
  try {
    const { callId, endBy, reason } = data
    console.log(`📞 通话 ${callId} 已被用户 ${endBy} 结束，原因: ${reason}`)

    // 如果当前页为通话相关页面，且URL中callId匹配，则直接关闭/退出
    const url = new URL(window.location.href)
    const currentCallId = url.searchParams.get('callId')
    const path = url.pathname
    const isCallPage = path.includes('/call') || path.includes('/incoming-call') || path.includes('/video-call') || path.includes('/voice-call')

    if (isCallPage && currentCallId === callId) {
      console.log('🧭 收到结束通知，准备关闭通话页面')
      console.log('🧭 页面类型:', path.includes('/incoming-call') ? '来电页面' : path.includes('/video-call') ? '视频通话页面' : '语音通话页面')
      console.log('🧭 结束原因:', reason, '结束者:', endBy)

      // 对于来电页面，只有在明确的结束原因时才关闭
      if (path.includes('/incoming-call') || (path.includes('/call') && (new URL(window.location.href)).searchParams.get('action') === 'incoming')) {
        if (reason === 'rejected' || reason === 'timeout' || endBy !== 'system') {
          console.log('🧭 来电页面：明确的结束原因，关闭页面')
        } else {
          console.log('🧭 来电页面：不明确的结束原因，保持页面开启')
          return
        }
      }

      // 先触发全局事件，让通话页面有机会处理
      console.log('🧭 触发全局call_ended事件')
      try { window.dispatchEvent(new CustomEvent('call_ended', { detail: data })) } catch {}

      // 对于主叫方通话页面，让页面自己处理关闭逻辑
      if (path.includes('/video-call') || path.includes('/voice-call')) {
        console.log('🧭 主叫方通话页面：已触发全局事件，让页面自己处理')
        return // 不在这里直接跳转，让VideoCall页面自己处理
      }

      // 对于来电页面，继续原有的关闭逻辑
      const fallback = sessionStorage.getItem('call_fallback_path') || (() => {
        // 新的统一通话页 /call?action=incoming&targetUserId=<caller>
        if (path.includes('/call')) {
          try {
            const u = new URL(window.location.href)
            const caller = u.searchParams.get('targetUserId')
            if (caller) {
              const currentUserId = String(authStore.user?.id || '')
              return currentUserId ? `/chat/chat_${currentUserId}_${caller}` : `/chat/${caller}`
            }
          } catch {}
        }
        // 兼容旧的来电页 incoming-call/:callerId/:type -> /chat/chat_<current>_<caller>
        let m = path.match(/\/incoming-call\/(\w+)\/(video|voice)/)
        if (m) {
          const currentUserId = String(authStore.user?.id || '')
          return currentUserId ? `/chat/chat_${currentUserId}_${m[1]}` : `/chat/${m[1]}`
        }
        // 兼容旧的视频/语音通话页 video-call|voice-call/:peerId -> /chat/chat_<current>_<peer>
        m = path.match(/\/(video-call|voice-call)\/(\w+)/)
        if (m) {
          const currentUserId = String(authStore.user?.id || '')
          return currentUserId ? `/chat/chat_${currentUserId}_${m[2]}` : `/chat/${m[2]}`
        }
        return '/'
      })()

      if (window.opener) {
        window.close()
      } else {
        try { router.replace(fallback) } catch { window.location.href = `http://localhost:5173${fallback}` }
      }
    }
  } catch (error) {
    console.error('❌ 处理通话结束失败:', error)
  }
}

// 处理未读消息更新
const handleUnreadUpdate = (data: { sessionId: string, count: number }) => {
  console.log('🔢 未读消息更新:', data)
  unreadStore.setUnreadCount(data.sessionId, data.count)
}

// 发送消息已送达确认
const sendMessageDelivered = (messageId: string) => {
  if (socket.value && isConnected.value) {
    socket.value.emit('message_delivered', { messageId })
  }
}

// 加入用户房间
const joinUserRoom = () => {
  const userId = authStore.user?.id
  if (userId && socket.value && isConnected.value) {
    socket.value.emit('join_user_room', { userId })
    console.log('🏠 已加入用户房间:', userId)
  }
}

// 检查服务器可用性
const checkServerAvailability = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch('http://localhost:8893/health', {
      method: 'GET',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ 服务器健康检查通过:', data)
      return true
    } else {
      console.warn('⚠️ 服务器健康检查失败:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('⚠️ 服务器健康检查超时')
    } else {
      console.warn('⚠️ 服务器健康检查失败:', error.message)
    }
    return false
  }
}

// 启用离线模式
const enableOfflineMode = () => {
  isConnecting.value = false
  isConnected.value = false
  console.log('📱 启用离线模式 - 功能受限')
}





// 处理重连
const handleReconnect = () => {
  if (reconnectAttempts.value < maxReconnectAttempts) {
    reconnectAttempts.value++
    console.log(`🔄 尝试重连 (${reconnectAttempts.value}/${maxReconnectAttempts})`)

    // 使用指数退避算法，避免频繁重连
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value - 1), 30000)
    console.log(`⏰ ${delay}ms后重连`)

    setTimeout(() => {
      if (!isConnected.value && !isConnecting.value) {
        initializeConnection()
      }
    }, delay)
  } else {
    console.error('❌ 达到最大重连次数，启用离线模式')
    enableOfflineMode()
  }
}

// 显示通知
const showNotification = (message: any) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('新消息', {
      body: message.content,
      icon: '/favicon.ico'
    })
  }
}

// 生成会话ID
const generateSessionId = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort()
  return `chat_${sortedIds[0]}_${sortedIds[1]}`
}

// 发送消息
const sendMessage = async (message: any): Promise<boolean> => {
  // 保留调用方传入的 id 和 timestamp，避免本地与服务端各自生成不同ID导致重复
  const fullMessage = {
    ...message,
    senderId: authStore.user?.id,
    id: message?.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: message?.timestamp || Date.now(),
    status: message?.status || 'sent'
  }

  // 如果WebSocket连接可用，通过WebSocket发送
  if (isConnected.value && socket.value) {
    return new Promise((resolve, reject) => {
      socket.value!.emit('send_message', fullMessage, (response: any) => {
        if (response?.success) {
          console.log('✅ 消息发送成功:', fullMessage.id)
          resolve(true)
        } else {
          console.error('❌ 消息发送失败:', response?.error)
          // 如果后端拒收（例如被对方拉黑），在当前会话插入一条系统提示
          try {
            // 🛡️ 判断是否为群聊消息
            const isGroupMessage = String(fullMessage.receiverId).startsWith('group_')
            const sessionId = isGroupMessage
              ? String(fullMessage.receiverId)
              : generateSessionId(String(authStore.user?.id || ''), String(fullMessage.receiverId))

            chatStore.addMessage(sessionId, {
              id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              senderId: authStore.user?.id,
              receiverId: fullMessage.receiverId,
              content: response?.error || '对方拒收你的消息',
              type: 'text',
              timestamp: Date.now(),
              status: 'delivered'
            } as any)
          } catch (e) {
            console.warn('插入系统提示失败:', e)
          }
          reject(new Error(response?.error || '发送失败'))
        }
      })
    })
  } else {
    // 离线模式：无法发送消息
    console.log('❌ 离线模式无法发送消息:', fullMessage.id)
    throw new Error('服务器连接失败，无法发送消息')
  }
}

// 断开连接
const disconnect = (force = false) => {
  // 在通话中且非强制，不断开，保持聊天实时连接
  try {
    if (!force && callStore?.isInCall?.value) {
      console.log('🛡️ 保持实时连接：当前处于通话中，跳过断开')
      return
    }
  } catch {}

  if (socket.value) {
    try { socket.value.disconnect() } catch {}
    socket.value = null
  }
  // 同步清理共享连接
  if (sharedSocket) {
    try { sharedSocket.disconnect() } catch {}
    sharedSocket = null
  }
  isConnected.value = false
  isConnecting.value = false
  console.log('🔌 实时消息接收器已断开')
}

// 切换离线模式
const toggleOfflineMode = () => {
  if (isConnected.value) {
    disconnect(true)
    enableOfflineMode()
  } else {
    initializeConnection()
  }
}

// 生命周期
onMounted(() => {
  // 延迟初始化，避免页面加载时的竞争条件
  setTimeout(() => {
    initializeConnection()
  }, 1000)
})

onUnmounted(() => {
  // 仅移除事件监听；若处于通话中则保持连接，否则断开
  try {
    if (socket.value) {
      removeEventListeners()
    } else if (sharedSocket) {
      // 若当前实例没有引用，但存在共享连接，也移除其事件监听，防止重复绑定
      try {
        const s = sharedSocket
        s?.off && ['connect','disconnect','connect_error','new_message','system_message','message_status','user_status','blacklist_updated','incoming_call','webrtc:incoming-call','call_timeout','call_answered','call_ended','unread_update'].forEach(evt => {
          try { (s as any).off(evt) } catch {}
        })
      } catch {}
    }
  } catch {}

  const keep = (() => { try { return sessionStorage.getItem('keep_realtime_ws') === '1' } catch { return false } })()
  if (keep || (callStore?.isInCall?.value)) {
    console.log('🛡️ 组件卸载但通话中/保持标记为真：仅移除监听，不断开 WebSocket')
    return
  }
  disconnect(true)
})

// 等待连接就绪
const waitUntilConnected = async (timeoutMs: number = 6000): Promise<boolean> => {
  if (isConnected.value) return true
  // 触发连接流程（如未在连接中且未连接）
  if (!isConnecting.value && !(socket.value && socket.value.connected)) {
    initializeConnection()
  }
  return new Promise<boolean>((resolve) => {
    let done = false
    const finish = (ok: boolean) => { if (!done) { done = true; cleanup(); resolve(ok) } }
    const onConnect = () => finish(true)
    const cleanup = () => {
      try { socket.value && socket.value.off && socket.value.off('connect', onConnect) } catch {}
      clearTimeout(timer)
    }
    // 监听connect事件
    try { socket.value && socket.value.on && socket.value.on('connect', onConnect) } catch {}
    // 超时
    const timer = setTimeout(() => finish(false), timeoutMs)
  })
}

// 暴露方法给父组件
defineExpose({
  sendMessage,
  disconnect,
  reconnect: initializeConnection,
  isConnected: computed(() => isConnected.value),
  waitUntilConnected
})
</script>

<style scoped>
.realtime-message-receiver {
  position: relative;
}
</style>
