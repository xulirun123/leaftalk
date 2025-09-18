<template>
  <div 
    class="chat-item-wrapper"
    :class="{ 
      'pinned': chat.isPinned,
      'muted': chat.isMuted,
      'selecting': isSelecting,
      'selected': isSelected 
    }"
  >
    <div 
      class="chat-item"
      @click="$emit('click', chat)"
      @contextmenu.prevent="$emit('contextmenu', chat, $event)"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- 44px 头像区域 -->
      <div class="user-avatar">
        <OptimizedAvatar
          :src="normalizedAvatar"
          :name="chat.name"
          size="44"
        />
        
        <!-- 在线状态指示器 -->
        <div v-if="chat.isOnline" class="online-indicator"></div>
        
        <!-- 未读消息徽章 -->
        <div 
          v-if="unreadCount > 0 && !chat.isMuted" 
          class="unread-badge"
          :class="{ 'large-count': unreadCount > 99 }"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </div>
        
        <!-- 免打扰红点 -->
        <div v-else-if="unreadCount > 0 && chat.isMuted" class="red-dot"></div>
      </div>

      <!-- 聊天信息区域 -->
      <div class="chat-user-info">
        <div class="user-details">
          <div class="user-name">
            {{ chat.name }}
            <span v-if="chat.chatType === 'group'" class="group-member-count">
              ({{ chat.memberCount || 0 }})
            </span>
          </div>
          <div class="last-message">
            <span v-if="isDraft" class="draft-indicator">[草稿]</span>
            <iconify-icon 
              v-if="messageTypeIcon" 
              :icon="messageTypeIcon" 
              class="message-type-icon"
            />
            {{ displayMessage }}
          </div>
        </div>

        <!-- 时间和状态区域 -->
        <div class="chat-meta">
          <div class="chat-time">{{ formattedTime }}</div>
          <div class="chat-status">
            <!-- 静音图标 -->
            <iconify-icon
              v-if="chat.isMuted"
              icon="heroicons:speaker-x-mark"
              class="mute-icon"
            />
            <!-- 置顶图标 -->
            <iconify-icon
              v-if="chat.isPinned"
              icon="heroicons:bookmark"
              class="pin-icon"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 滑动操作按钮 -->
    <div v-if="showActions" class="chat-item-actions" :class="{ 'show': showActions }">
      <button class="action-button delete" @click="$emit('delete', chat)">
        删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import OptimizedAvatar from '../../../shared/components/common/OptimizedAvatar.vue'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'

interface ChatItemProps {
  chat: {
    id: string
    name: string
    avatar?: string
    lastMessage?: string | any
    updatedAt: number
    unreadCount?: number
    isPinned?: boolean
    isMuted?: boolean
    isOnline?: boolean
    chatType?: 'private' | 'group' | 'system'
    memberCount?: number
    draft?: string
  }
  isSelecting?: boolean
  isSelected?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<ChatItemProps>(), {
  isSelecting: false,
  isSelected: false,
  showActions: false
})

const emit = defineEmits<{
  click: [chat: any]
  contextmenu: [chat: any, event: MouseEvent]
  delete: [chat: any]
}>()

// 统一规范化头像：强制走后端真实头像API，避免 /uploads 404
const normalizedAvatar = computed(() => {
  const id = (props.chat as any).userId || props.chat.id
  return getRealAvatarUrl(id)
})

// 未读消息数
const unreadCount = computed(() => props.chat.unreadCount || 0)

// 是否有草稿
const isDraft = computed(() => !!props.chat.draft)

// 显示的消息内容
const displayMessage = computed(() => {
  if (isDraft.value) {
    return props.chat.draft
  }
  
  const lastMessage = props.chat.lastMessage
  if (typeof lastMessage === 'string') {
    return lastMessage || '暂无消息'
  }
  
  if (lastMessage && lastMessage.content) {
    return lastMessage.content
  }
  
  return '暂无消息'
})

// 消息类型图标
const messageTypeIcon = computed(() => {
  const lastMessage = props.chat.lastMessage
  if (typeof lastMessage === 'object' && lastMessage?.type) {
    switch (lastMessage.type) {
      case 'image': return 'heroicons:photo'
      case 'voice': return 'heroicons:microphone'
      case 'video': return 'heroicons:video-camera'
      case 'file': return 'heroicons:document'
      default: return null
    }
  }
  return null
})

// 格式化时间
const formattedTime = computed(() => {
  const timestamp = props.chat.updatedAt
  const now = Date.now()
  const diff = now - timestamp
  
  // 1分钟内
  if (diff < 60000) return '刚刚'
  
  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  
  // 今天
  const today = new Date()
  const messageDate = new Date(timestamp)
  if (messageDate.toDateString() === today.toDateString()) {
    return messageDate.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  // 昨天
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  
  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[messageDate.getDay()]
  }
  
  // 更早
  return messageDate.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
})

// 触摸事件处理
const touchStartTime = ref(0)

const onTouchStart = () => {
  touchStartTime.value = Date.now()
}

const onTouchEnd = () => {
  const touchDuration = Date.now() - touchStartTime.value
  if (touchDuration > 500) {
    // 长按事件
    emit('contextmenu', props.chat, new MouseEvent('contextmenu'))
  }
}
</script>

<style scoped>
/* 引入聊天项样式 */
@import '../styles/ChatItemStyles.css';

/* 组件特定样式 */
.pin-icon {
  color: #07c160;
  font-size: 14px;
}

.group-member-count {
  color: #999;
  font-size: 12px;
  font-weight: normal;
}

.action-button.delete {
  background: #ff4757;
}

.action-button.delete:hover {
  background: #ff3742;
}

/* 选择状态样式 */
.chat-item-wrapper.selecting .chat-item {
  background: #e3f2fd;
}

.chat-item-wrapper.selected .chat-item {
  background: #bbdefb;
}

.chat-item-wrapper.selected .chat-item::before {
  content: '✓';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #1976d2;
  font-weight: bold;
  font-size: 16px;
}

.chat-item-wrapper.selected .user-avatar {
  margin-left: 20px;
}
</style>
