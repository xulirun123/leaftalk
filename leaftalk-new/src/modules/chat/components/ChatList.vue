<template>
  <div class="chat-list">
    <div 
      v-for="chat in chatList" 
      :key="chat.id"
      class="chat-item"
      :class="{ 
        'pinned': chat.isPinned, 
        'muted': chat.isMuted,
        'system-notification': chat.chatType === 'system'
      }"
      @click="openChat(chat)"
      @contextmenu.prevent="showContextMenu($event, chat)"
    >
      <!-- 聊天头像 -->
      <div class="chat-avatar">
        <UnifiedAvatar
          :user-id="chat.userId"
          :src="chat.avatar"
          :name="chat.name"
          size="medium"
          :show-status="chat.chatType !== 'system'"
          :status="chat.isOnline ? 'online' : 'offline'"
        />
      </div>

      <!-- 聊天信息 -->
      <div class="chat-info">
        <div class="chat-header">
          <div class="chat-name">
            {{ chat.name }}
            <!-- 系统通知标识 -->
            <iconify-icon 
              v-if="chat.chatType === 'system'" 
              icon="heroicons:shield-check" 
              width="14" 
              class="system-badge"
            ></iconify-icon>
          </div>
          <div class="chat-time">{{ formatTime(chat.lastMessageTime) }}</div>
        </div>
        <div class="chat-preview">
          <div class="last-message" :class="{ 'system-message': chat.lastMessageType === 'system_notification' }">
            {{ formatLastMessage(chat) }}
          </div>
          <!-- 未读消息数 -->
          <div v-if="chat.unreadCount > 0" class="unread-badge">
            {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
          </div>
          <!-- 静音图标 -->
          <iconify-icon 
            v-else-if="chat.isMuted" 
            icon="heroicons:speaker-x-mark" 
            width="16" 
            class="mute-icon"
          ></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import UnifiedAvatar from '../common/UnifiedAvatar.vue'

interface Chat {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageType: string
  lastMessageTime: Date
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
  isOnline: boolean
  chatType: 'user' | 'group' | 'system'
}

interface Props {
  chats: Chat[]
}

const props = defineProps<Props>()
const router = useRouter()

const emit = defineEmits(['contextmenu', 'chat-click'])

// 检测是否为纯表情消息
const isEmojiOnly = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false

  // 移除所有空白字符
  const trimmed = text.trim()
  if (!trimmed) return false

  // 表情符号的 Unicode 范围
  const emojiRegex = /^[\p{Emoji}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]+$/u

  return emojiRegex.test(trimmed)
}

// 格式化最后一条消息
const formatLastMessage = (chat: Chat) => {
  if (chat.lastMessageType === 'image') return '[图片]'
  if (chat.lastMessageType === 'voice') return '[语音]'
  if (chat.lastMessageType === 'video') return '[视频]'
  if (chat.lastMessageType === 'file') return '[文件]'
  if (chat.lastMessageType === 'location') return '[位置]'
  if (chat.lastMessageType === 'custom_emoji') return '[动画表情]'
  if (chat.lastMessageType === 'group_invite') return '[链接] 群聊邀请'
  if (chat.lastMessageType === 'system_notification') {
    // 解析系统通知内容
    try {
      const notificationData = JSON.parse(chat.lastMessage)
      return `[${getNotificationTypeText(notificationData.type)}] ${notificationData.title}`
    } catch (error) {
      return '[家族通知]'
    }
  }

  // 检测是否为纯表情消息
  if (chat.lastMessage && isEmojiOnly(chat.lastMessage)) {
    return '[表情]'
  }

  return chat.lastMessage
}

// 获取通知类型文本
const getNotificationTypeText = (type: string) => {
  const typeMap = {
    'announcement': '公告',
    'activity': '活动通知',
    'reminder': '提醒',
    'urgent': '紧急通知'
  }
  return typeMap[type] || '通知'
}

// 格式化时间
const formatTime = (time: Date) => {
  if (!time) return ''

  const messageDate = new Date(time)
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

// 打开聊天
const openChat = (chat: Chat) => {
  if (chat.chatType === 'system') {
    // 系统通知聊天，跳转到通知详情页面
    router.push(`/system-notifications/${chat.id}`)
  } else {
    console.log('🚀 ChatList跳转到聊天页面:', chat.id, 'type:', chat.type)

    // 判断是群聊还是私聊
    if (chat.id.startsWith('group_') || chat.type === 'group') {
      // 群聊：跳转到 /group/:id
      console.log('✅ 跳转到群聊页面:', `/group/${chat.id}`)
      router.push(`/group/${chat.id}`)
    } else {
      // 私聊：跳转到 /chat/:id
      let urlChatId = chat.id
      if (chat.id.startsWith('chat_')) {
        urlChatId = chat.id.replace('chat_', '')
      }
      console.log('✅ 跳转到私聊页面:', `/chat/${urlChatId}`)
      router.push(`/chat/${urlChatId}`)
    }
  }
  emit('chat-click', chat)
}

// 显示右键菜单
const showContextMenu = (event: MouseEvent, chat: Chat) => {
  emit('contextmenu', { event, chat })
}



// 计算属性：排序后的聊天列表
const chatList = computed(() => {
  return [...props.chats].sort((a, b) => {
    // 置顶的聊天排在前面
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    
    // 按最后消息时间排序
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  })
})
</script>

<style scoped>
.chat-list {
  background: white;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.chat-item:hover {
  background: #f8f9fa;
}

.chat-item:active {
  background: #e9ecef;
}

/* 置顶聊天样式 */
.chat-item.pinned {
  background: #E5E5E5 !important;
}

.chat-item.pinned::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #07c160;
}

/* 系统通知样式 */
.chat-item.system-notification {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-left: 3px solid #6c757d;
}

.chat-item.system-notification .chat-avatar img {
  border: 2px solid #6c757d;
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.2);
}

.chat-item.system-notification .chat-name {
  color: #495057;
  font-weight: 600;
}

.chat-item.system-notification .last-message.system-message {
  color: #6c757d;
  font-style: italic;
}

/* 头像样式 */
.chat-avatar {
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
}

.chat-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #07c160;
  border: 2px solid white;
  border-radius: 50%;
}

/* 聊天信息样式 */
.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.chat-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.system-badge {
  color: #6c757d;
}

.chat-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.chat-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.last-message {
  font-size: 14px;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-badge {
  background: #ff4757;
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  margin-left: 8px;
  flex-shrink: 0;
}

.mute-icon {
  color: #999;
  margin-left: 8px;
  flex-shrink: 0;
}

/* 静音聊天样式 */
.chat-item.muted .chat-name,
.chat-item.muted .last-message {
  color: #999;
}
</style>
