<template>
  <div class="mobile-home">
    <!-- 聊天列表 -->
    <div class="chat-list">
      <!-- 空状态 -->
      <div v-if="chats.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:chat-bubble-left-right" width="64" style="color: #cccccc;"></iconify-icon>
        <p>暂无聊天</p>
        <p class="empty-tip">开始你的第一个对话吧</p>
      </div>

      <!-- 聊天项列表 -->
      <div
        v-for="(chat, index) in chats"
        :key="chat.id"
        class="chat-item-wrapper"
      >
        <!-- 分隔线 -->
        <div v-if="index > 0" class="chat-separator"></div>

        <div
          class="chat-item"
          :class="{ 'pinned': chat.isPinned }"
          @click="openChat(chat.id)"
          @touchstart.passive="startLongPress(chat, $event)"
          @touchend.passive="handleTouchEnd(chat.id, $event)"
          @touchmove.passive="endLongPress"
          @mousedown="startLongPress(chat, $event)"
          @mouseup="endLongPress"
          @mouseleave="endLongPress"
          @contextmenu.prevent="showLongPressMenu(chat, $event)"
        >
          <div class="chat-user-info">
            <!-- 头像区域 -->
            <div class="user-avatar">
              <OptimizedAvatar
                :src="chat.avatar || getDefaultAvatar(chat.name || '')"
                :name="chat.name || ''"
                :size="44"
              />
              <!-- 未读消息徽章 -->
              <div v-if="unreadStore.getUnreadCount(chat.id) > 0" class="unread-badge">
                {{ unreadStore.getUnreadCount(chat.id) > 99 ? '99+' : unreadStore.getUnreadCount(chat.id) }}
              </div>
            </div>

            <!-- 用户详情 -->
            <div class="user-details">
              <!-- 昵称 -->
              <div class="user-name">{{ getDisplayName(chat) }}</div>
              <!-- 最后消息和时间 -->
              <div class="message-time-row">
                <div class="last-message">{{ formatLastMessage(chat) }}</div>
              </div>
            </div>
          </div>

          <!-- 右侧状态区域 -->
          <div class="chat-meta">
            <div class="chat-time">{{ formatTime(chat.lastMessageTime || chat.updatedAt || Date.now()) }}</div>
            <div class="chat-status">
              <!-- 免打扰聊天只显示红点 -->
              <div v-if="unreadStore.hasRedDot(chat.id)" class="red-dot"></div>
              <!-- 静音标识 -->
              <iconify-icon
                v-if="unreadStore.getMuteStatus(chat.id)"
                icon="heroicons:speaker-x-mark"
                width="16"
                style="color: #999;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天菜单 -->
    <div v-if="showChatMenu" class="chat-menu-container" @click="closeChatMenu">
      <div
        class="chat-menu"
        @click.stop
        :style="{
          left: menuPosition.x + 'px',
          top: menuPosition.y + 'px'
        }"
      >
        <div class="chat-menu-item" @click="pinChat">
          <iconify-icon icon="heroicons:bookmark" width="20" style="color: #07C160;"></iconify-icon>
          <span>{{ selectedChat?.isPinned ? '取消置顶' : '置顶聊天' }}</span>
        </div>
        <div class="chat-menu-item" @click="markUnread">
          <iconify-icon icon="heroicons:envelope" width="20" style="color: #07C160;"></iconify-icon>
          <span>{{ selectedChat && unreadStore.getUnreadCount(selectedChat.id) > 0 ? '标为已读' : '标为未读' }}</span>
        </div>
        <div class="chat-menu-item" @click="clearChatHistory">
          <iconify-icon icon="heroicons:archive-box-x-mark" width="20" style="color: #FF9500;"></iconify-icon>
          <span>清空聊天记录</span>
        </div>
        <div class="chat-menu-item delete" @click="deleteChat">
          <iconify-icon icon="heroicons:trash" width="20" style="color: #ff4757;"></iconify-icon>
          <span>删除聊天</span>
        </div>
      </div>
    </div>

    <!-- 添加菜单弹窗 -->
    <div v-if="showAddMenu" class="add-menu" @click="showAddMenu = false">
      <div class="add-menu-content" @click.stop>
        <div class="add-menu-item" @click="startGroupChat">
          <iconify-icon icon="heroicons:user-group" width="24" style="color: #07C160;"></iconify-icon>
          <span>发起群聊</span>
        </div>
        <div class="add-menu-item" @click="addFriend">
          <iconify-icon icon="heroicons:user-plus" width="24" style="color: #07C160;"></iconify-icon>
          <span>添加朋友</span>
        </div>
        <div class="add-menu-item" @click="scanQR">
          <iconify-icon icon="heroicons:qr-code" width="24" style="color: #07C160;"></iconify-icon>
          <span>扫一扫</span>
        </div>
        <div class="add-menu-item" @click="payment">
          <iconify-icon icon="heroicons:credit-card" width="24" style="color: #07C160;"></iconify-icon>
          <span>收付款</span>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <MobileTabBar :unread-count="totalUnreadCount" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import MobileTabBar from '../../../shared/components/mobile/MobileTabBar.vue'
import OptimizedAvatar from '../../../shared/components/common/OptimizedAvatar.vue'
import { useUnreadStore } from '../stores/unread'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import { generateChatUrl, getOtherUserId } from '../utils/chatUrlGenerator'
import { ChatGuard } from '../utils/chatGuard'

import { apiClient } from '../../../shared/services/apiClient'

const router = useRouter()
const unreadStore = useUnreadStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const showChatMenu = ref(false)
const showAddMenu = ref(false)
const selectedChat = ref<any>(null)
const menuPosition = ref({ x: 0, y: 0 })
const isLongPressing = ref(false)
const longPressTimer = ref<any>(null)

// 聊天数据 - 使用chatStore，确保数据完整性，过滤自聊天
const chats = computed(() => {
  // 确保chatStore.sessions是数组
  const sessionsArray = Array.isArray(chatStore.sessions) ? chatStore.sessions : []
  const currentUserId = String(authStore.user?.id || '1')

  // 🛡️ 使用ChatGuard过滤自聊天项
  const { cleanedSessions } = ChatGuard.cleanSelfChatSessions(sessionsArray)

  return [...cleanedSessions]
    .filter((session: any) => {
      // 🛡️ 额外检查：确保participants不包含自聊天
      if (session.participants && ChatGuard.isSelfChatParticipants(session.participants)) {
        console.log('🛡️ 过滤自聊天项（participants）:', session.id, session.participants)
        return false
      }

      // 🛡️ 额外检查：确保ID不是自聊天格式
      if (session.id && ChatGuard.isSelfChatId(session.id)) {
        console.log('🛡️ 过滤自聊天项（ID格式）:', session.id)
        return false
      }

      return true
    })
    .map((session: any) => {
      // 处理群聊备注和名称
      if (session.type === 'group' || session.id.startsWith('group_')) {
        // 从localStorage获取最新的成员数量
        try {
          const cachedMemberCount = localStorage.getItem(`group_member_count_${session.id}`)
          if (cachedMemberCount) {
            session.memberCount = parseInt(cachedMemberCount, 10)
          }
        } catch (e) {
          console.warn('读取群成员数量失败:', e)
        }

        // 检查是否有群聊备注
        try {
          const savedRemark = localStorage.getItem(`group_remark_${session.id}`)
          if (savedRemark && savedRemark.trim()) {
            // 提取成员数量
            const memberCountMatch = session.name?.match(/（(\d+)）/)
            const memberCount = memberCountMatch ? memberCountMatch[1] : ''

            // 使用备注名替换群名
            const remarkName = savedRemark.trim()
            session.name = memberCount ? `${remarkName}（${memberCount}）` : remarkName
          }
        } catch (e) {
          console.warn('读取群聊备注失败:', e)
        }
      }

      return session
    })
    .sort((a: any, b: any) => {
      // 置顶聊天排在前面
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // 按最后消息时间排序
      const timeA = a.lastMessageTime || a.updatedAt || 0
      const timeB = b.lastMessageTime || b.updatedAt || 0
      return timeB - timeA
    })
})

// 计算总未读消息数
const totalUnreadCount = computed(() => {
  return unreadStore.totalUnreadCount
})

// 工具函数
const getDefaultAvatar = (name: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
}

// 备注版本号，用于触发重新渲染
const remarkVersion = ref(0)
const eventBus: any = inject('eventBus')
const onRemarkUpdated = () => { remarkVersion.value++ }

// 后台懒加载备注包，避免阻塞渲染
const fetchedRemarkIds = new Set<string>()
const ensureRemarkPack = async (otherId: string) => {
  if (!otherId || fetchedRemarkIds.has(otherId)) return
  fetchedRemarkIds.add(otherId)
  try {
    const resp = await apiClient.get<any>(`/contacts/${otherId}/remark-pack`)
    if (resp?.success && resp?.data) {
      const pack = resp.data
      const payload = {
        name: pack.remark || '',
        tags: Array.isArray(pack.tags) ? pack.tags : [],
        phones: Array.isArray(pack.phones) ? pack.phones : [],
        description: pack.description || ''
      }
      try { localStorage.setItem(`friend_remark_${otherId}`, JSON.stringify(payload)) } catch {}
      // 通知刷新
      try { eventBus?.emit && eventBus.emit('friendRemarkUpdated', { id: String(otherId), payload }) } catch {}
    }
  } catch (e) {
    // 静默失败
  }
}


onMounted(() => { try { eventBus?.on && eventBus.on('friendRemarkUpdated', onRemarkUpdated) } catch {} })
onUnmounted(() => { try { eventBus?.off && eventBus.off('friendRemarkUpdated', onRemarkUpdated) } catch {} })

const getDisplayName = (chat: any) => {
  // 订阅remarkVersion使其成为响应依赖
  void remarkVersion.value
  try {
    const currentUserId = String(authStore.user?.id || '1')
    const otherId = getOtherUserId(String(chat.id || ''), currentUserId)
    let saved: any = null
    try { saved = JSON.parse(localStorage.getItem(`friend_remark_${otherId}`) || 'null') } catch {}
    if (!saved) ensureRemarkPack(otherId) // 后台拉取一次
    if (saved && saved.name && String(saved.name).trim()) return String(saved.name).trim()
  } catch {}
  return chat.remark || chat.name || chat.nickname || `用户${chat.id}`
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return ''

  const messageDate = new Date(timestamp)
  const now = new Date()

  // 获取今天、昨天、前天的日期（只比较年月日）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dayBeforeYesterday = new Date(today)
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)

  const msgDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())

  // 今天：显示时间
  if (msgDate.getTime() === today.getTime()) {
    return messageDate.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // 昨天：显示"昨天"
  if (msgDate.getTime() === yesterday.getTime()) {
    return '昨天'
  }

  // 前天：显示"前天"
  if (msgDate.getTime() === dayBeforeYesterday.getTime()) {
    return '前天'
  }

  // 三天以前：只显示日期（月/日）
  return messageDate.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  })
}

const formatLastMessage = (chat: any) => {
  const message = chat.lastMessage
  if (!message) return '暂无消息'

  // 判断是否是群聊
  const isGroupChat = chat.type === 'group' || (chat.id && String(chat.id).startsWith('group_'))

  // 获取发送者名称（仅群聊需要）
  let senderPrefix = ''
  if (isGroupChat && message && typeof message === 'object' && message.senderId) {
    const senderId = String(message.senderId)
    const currentUserId = String(authStore.user?.id || '')

    console.log('🔍 formatLastMessage - 群聊消息:', {
      chatId: chat.id,
      senderId,
      currentUserId,
      messageType: typeof message,
      hasSenderName: !!message.senderName,
      senderName: message.senderName,
      message
    })

    // 如果是当前用户发送的消息
    if (senderId === currentUserId) {
      senderPrefix = '我: '
    } else {
      // 获取发送者名称：优先级 备注名 > 群昵称 > 昵称
      let senderName = ''

      // 1. 尝试获取好友备注
      try {
        const saved = JSON.parse(localStorage.getItem(`friend_remark_${senderId}`) || 'null')
        if (saved?.name && String(saved.name).trim()) {
          senderName = String(saved.name).trim()
          console.log('✅ 使用好友备注:', senderName)
        }
      } catch (e) {
        console.warn('读取好友备注失败:', e)
      }

      // 2. 如果没有备注，尝试获取群昵称（从缓存）
      if (!senderName && chat.id) {
        try {
          const groupNickname = localStorage.getItem(`group_member_nickname_${chat.id}_${senderId}`)
          if (groupNickname && groupNickname.trim()) {
            senderName = groupNickname.trim()
            console.log('✅ 使用群昵称:', senderName)
          }
        } catch (e) {
          console.warn('读取群昵称失败:', e)
        }
      }

      // 3. 如果都没有，使用消息中的发送者昵称
      if (!senderName && message.senderName) {
        senderName = String(message.senderName).trim()
        console.log('✅ 使用消息中的昵称:', senderName)
      }

      // 4. 如果还是没有，使用默认值
      if (!senderName) {
        senderName = `用户${senderId}`
        console.log('⚠️ 使用默认值:', senderName)
      }

      senderPrefix = `${senderName}: `
    }
  }

  // 对象类型（新结构）
  if (typeof message === 'object') {
    // 名片消息
    if (message.type === 'contact') {
      try {
        const payload = JSON.parse(String(message.content || '{}'))
        const fid = String(payload.friendId || '')
        if (fid) {
          const saved = JSON.parse(localStorage.getItem(`friend_remark_${fid}`) || 'null')
          const name = (saved?.name && String(saved.name).trim()) || `用户${fid}`
          return `${senderPrefix}[名片] ${name}`
        }
      } catch {}
      return `${senderPrefix}[名片]`
    }
    // 其它消息类型：取content
    const txt = String(message.content || '').trim()
    if (txt) return `${senderPrefix}${txt}`
  }

  // 字符串/旧结构
  const messageStr = typeof message === 'string' ? message : (message?.content || message?.text || String(message || ''))
  if (!messageStr) return '暂无消息'

  // 兼容：字符串中是名片payload
  try {
    const payload = JSON.parse(messageStr)
    if (payload && payload.friendId) {
      const fid = String(payload.friendId)
      const saved = JSON.parse(localStorage.getItem(`friend_remark_${fid}`) || 'null')
      const name = (saved?.name && String(saved.name).trim()) || `用户${fid}`
      return `${senderPrefix}[名片] ${name}`
    }
  } catch {}

  // 特殊占位符
  let finalMessage = messageStr
  if (finalMessage.includes('[VOICE_CALL_ICON]')) finalMessage = finalMessage.replace('[VOICE_CALL_ICON]', '📞')
  if (finalMessage.includes('[VIDEO_CALL_ICON]')) finalMessage = finalMessage.replace('[VIDEO_CALL_ICON]', '📹')

  return `${senderPrefix}${finalMessage}`
}

// 长按相关
const startLongPress = (chat: any, event: any) => {
  isLongPressing.value = true
  longPressTimer.value = setTimeout(() => {
    if (isLongPressing.value) {
      showLongPressMenu(chat, event)
    }
  }, 500) // 500ms长按
}

const endLongPress = () => {
  isLongPressing.value = false
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const handleTouchEnd = (chatId: string, event: any) => {
  if (isLongPressing.value && longPressTimer.value) {
    // 如果还在长按计时中，说明是短按
    endLongPress()
    openChat(chatId)
  } else {
    endLongPress()
  }
}

const showLongPressMenu = (chat: any, event: any) => {
  selectedChat.value = chat

  const rect = event.target.getBoundingClientRect()
  menuPosition.value = {
    x: Math.min(rect.left, window.innerWidth - 200),
    y: rect.top + rect.height
  }

  showChatMenu.value = true
  endLongPress()
}

const closeChatMenu = () => {
  showChatMenu.value = false
  selectedChat.value = null
}

// 聊天操作
const openChat = (chatId: string) => {
  // 如果正在长按，不执行点击操作
  if (isLongPressing.value) {
    console.log('🚫 长按中，忽略点击事件')
    return
  }

  console.log('🔥 openChat 被调用:', chatId)

  // 1️⃣ 验证chatId
  if (!chatId) {
    console.error('❌ chatId为空')
    appStore.showToast('无效的聊天ID', 'error')
    return
  }

  // 2️⃣ 查找聊天会话
  const chat = chats.value.find(c => c.id === chatId)
  if (!chat) {
    console.error('❌ 未找到聊天:', chatId)
    appStore.showToast('聊天不存在', 'error')
    return
  }

  console.log('✅ 找到聊天:', { id: chat.id, name: chat.name, type: chat.type })

  // 3️⃣ 清除未读消息数
  unreadStore.markAsRead(chatId)

  // 4️⃣ 异步处理跳转（确保UI更新）
  nextTick(() => {
    // 5️⃣ 判断是群聊还是私聊
    if (chatId.startsWith('group_') || chat.type === 'group') {
      // ✅ 群聊：直接跳转到 /group/:id
      console.log('🚀 跳转到群聊页面:', `/group/${chatId}`)
      router.push(`/group/${chatId}`)
    } else {
      // ✅ 私聊：需要进行自聊天检查
      const currentUserId = String(authStore.user?.id || '1')

      // 检查自聊天
      if (ChatGuard.isSelfChatParticipants(chat.participants)) {
        console.error('❌ 检测到自聊天参与者，阻止跳转')
        appStore.showToast('不能与自己聊天', 'error')
        return
      }

      if (ChatGuard.isSelfChatId(chatId)) {
        console.error('❌ 检测到自聊天ID，阻止跳转')
        appStore.showToast('不能与自己聊天', 'error')
        return
      }

      // 确保chatId格式正确（添加chat_前缀）
      let finalChatId = chatId
      if (!finalChatId.startsWith('chat_')) {
        finalChatId = `chat_${finalChatId}`
      }

      console.log('🚀 跳转到私聊页面:', `/chat/${finalChatId}`)
      router.push(`/chat/${finalChatId}`)
    }
  })
}

// 菜单操作
const pinChat = () => {
  if (selectedChat.value) {
    // TODO: 实现置顶功能
    console.log('置顶聊天:', selectedChat.value.id)
    appStore.showToast(selectedChat.value.isPinned ? '已取消置顶' : '已置顶', 'success')
  }
  closeChatMenu()
}

const markUnread = () => {
  if (selectedChat.value) {
    const chatId = selectedChat.value.id
    const currentUnread = unreadStore.getUnreadCount(chatId)

    if (currentUnread > 0) {
      unreadStore.markAsRead(chatId)
      appStore.showToast('已标为已读', 'success')
    } else {
      unreadStore.setUnreadCount(chatId, 1)
      appStore.showToast('已标为未读', 'success')
    }
  }
  closeChatMenu()
}

const clearChatHistory = async () => {
  if (selectedChat.value) {
    try {
      console.log('🧹 清空聊天记录:', selectedChat.value.id)

      // 确认对话框
      const confirmed = confirm('确定要清空聊天记录吗？\n\n• 只会清空您本地的聊天记录\n• 不会影响对方的聊天记录\n• 会话仍会保留，可以继续聊天\n• 清空后无法恢复')
      if (!confirmed) {
        closeChatMenu()
        return
      }

      // 清除聊天记录
      await chatStore.clearChatHistory(selectedChat.value.id)

      // 清除未读消息
      unreadStore.markAsRead(selectedChat.value.id)

      appStore.showToast('聊天记录已清空', 'success')
      console.log('✅ 聊天记录清空完成')
    } catch (error) {
      console.error('❌ 清空聊天记录失败:', error)
      appStore.showToast('清空失败，请重试', 'error')
    }
  }
  closeChatMenu()
}

const deleteChat = async () => {
  if (selectedChat.value) {
    try {
      const chatId = selectedChat.value.id
      console.log('🗑️ 删除聊天会话:', chatId)

      // 确认对话框
      const confirmed = confirm('确定要删除聊天吗？\n\n• 只会删除您本地的聊天记录和会话\n• 不会影响对方的聊天记录\n• 删除后需要重新创建会话才能聊天\n• 删除后无法恢复')
      if (!confirmed) {
        closeChatMenu()
        return
      }

      // 删除聊天项（包括会话和所有消息）
      await chatStore.deleteChatItem(chatId)

      // 清除未读消息
      unreadStore.markAsRead(chatId)

      appStore.showToast('聊天已删除', 'success')
      console.log('✅ 聊天删除完成，当前会话数量:', chatStore.sessions.length)
    } catch (error) {
      console.error('❌ 删除聊天失败:', error)
      appStore.showToast('删除失败，请重试', 'error')
    }
  }
  closeChatMenu()
}

// 添加菜单相关方法
const startGroupChat = () => {
  console.log('发起群聊')
  router.push('/create-group')
  showAddMenu.value = false
}

const addFriend = () => {
  console.log('添加朋友')
  router.push('/add-friend')
  showAddMenu.value = false
}

const scanQR = () => {
  console.log('扫一扫')
  router.push('/scan')
  showAddMenu.value = false
}

const payment = () => {
  console.log('收付款')
  router.push('/payment-code')
  showAddMenu.value = false
}

// 生命周期
// 处理群名称更新事件
const handleGroupNameChanged = (event: any) => {
  const { groupId, newGroupName } = event.detail
  console.log('📢 聊天列表收到群名称更新事件:', { groupId, newGroupName })

  // 查找并更新对应的会话
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
}

onMounted(async () => {
  console.log('📱 ChatHomeEnterprise 组件挂载')

  // 初始化数据
  await initializeChatData()

  // 强制清理自聊天数据
  await cleanupSelfChatData()

  // 监听顶部导航栏的添加按钮点击事件
  if (eventBus) {
    eventBus.on('showAddMenu', () => {
      console.log('📱 收到显示添加菜单事件')
      showAddMenu.value = true
    })
  }

  // 监听群名称更新事件
  window.addEventListener('group-name-changed', handleGroupNameChanged)
  console.log('✅ 已注册群名称更新事件监听')
})

onUnmounted(() => {
  endLongPress()

  // 移除事件监听
  window.removeEventListener('group-name-changed', handleGroupNameChanged)
  console.log('✅ 已移除群名称更新事件监听')
})

// 初始化聊天数据
const initializeChatData = async () => {
  try {
    console.log('🚀 开始初始化聊天数据...')

    // 1. 检查用户登录状态
    if (!authStore.user || !authStore.token) {
      console.log('⚠️ 用户未登录，跳过数据初始化')
      return
    }

    // 2. 加载聊天数据
    console.log('📋 加载的聊天数据数量:', chats.value.length)

    // 3. 调试聊天数据结构
    if (chats.value.length > 0) {
      console.log('📋 聊天数据详情:', chats.value.map(chat => ({
        id: chat.id,
        name: chat.name,
        participants: chat.participants,
        lastMessage: chat.lastMessage
      })))
    }

    // 4. 等待DOM更新
    await nextTick()

    console.log('✅ 聊天数据初始化完成，最终数量:', chats.value.length)
  } catch (error) {
    console.error('❌ 初始化聊天数据失败:', error)
  }
}

// 强制清理自聊天数据
const cleanupSelfChatData = async () => {
  console.log('🛡️ 开始强制清理自聊天数据，当前会话数量:', chatStore.sessions.length)
  const { cleanedSessions, removedCount, removedItems } = ChatGuard.cleanSelfChatSessions(chatStore.sessions)

  if (removedCount > 0) {
    console.log('🛡️ ChatGuard清理了', removedCount, '个自聊天会话:', removedItems.map(item => ({ id: item.id, participants: item.participants })))

    // 强制替换sessions数组
    chatStore.sessions.splice(0, chatStore.sessions.length, ...cleanedSessions as any)

    // 保存到缓存
    if (typeof chatStore.saveToCache === 'function') {
      chatStore.saveToCache()
    }

    console.log('🛡️ 清理完成，剩余会话数量:', chatStore.sessions.length)
  } else {
    console.log('🛡️ 没有发现自聊天数据需要清理')
  }
}
</script>

<style scoped>
.mobile-home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #e5e5e5;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  background: #e5e5e5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

.empty-tip {
  font-size: 14px !important;
  color: #ccc !important;
}

.chat-item-wrapper {
  position: relative;
}

.chat-separator {
  height: 1px;
  background: #e0e0e0;
  margin-left: 60px;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  height: 56px;
}

.chat-item:hover {
  background: #f5f5f5;
}

.chat-item:active {
  background: #e5e5e5;
}

.chat-item.pinned {
  background: #f8f8f8;
}

.chat-item.pinned:hover {
  background: #f0f0f0;
}

.chat-item.pinned:active {
  background: #e8e8e8;
}

.chat-user-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff4757;
  color: white;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  border: 2px solid white;
  z-index: 10;
}

.user-details {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 44px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.message-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.last-message {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  flex: 1;
  margin-right: 8px;
  word-break: break-word;
  overflow-wrap: break-word;
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
}

.last-message img.emoji {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin: 0 1px;
}

.chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  height: 44px;
  flex-shrink: 0;
}

.chat-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  white-space: nowrap;
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.red-dot {
  width: 8px;
  height: 8px;
  background: #ff4757;
  border-radius: 50%;
}

/* 聊天菜单 */
.chat-menu-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.chat-menu {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  overflow: hidden;
}

.chat-menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.chat-menu-item:hover {
  background: #f5f5f5;
}

.chat-menu-item:active {
  background: #e5e5e5;
}

.chat-menu-item.delete {
  color: #ff4757;
}

.chat-menu-item span {
  font-size: 14px;
}

/* 添加菜单 */
.add-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 100px 20px 0 0;
}

.add-menu-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 140px;
  position: relative;
  animation: slideDown 0.2s ease-out;
}

/* 添加指向加号按钮的箭头 */
.add-menu-content::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 20px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid white;
  filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.1));
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.add-menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #e0e0e0;
}

.add-menu-item:last-child {
  border-bottom: none;
}

.add-menu-item:hover {
  background-color: #f8f8f8;
}

.add-menu-item span {
  font-size: 14px;
  color: #333;
}
</style>
