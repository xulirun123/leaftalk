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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import OptimizedAvatar from '../../../shared/components/common/OptimizedAvatar.vue'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'
import { GroupAvatarGenerator } from '../../../shared/utils/groupAvatarGenerator'

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
    participants?: string[]
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

// 动态生成的群头像
const dynamicGroupAvatar = ref<string>('')

// 为群聊生成动态头像（使用真实成员数据）
const generateDynamicGroupAvatar = async () => {
  if (props.chat.chatType !== 'group' && !props.chat.id.startsWith('group_')) return

  try {
    console.log(`📐 为群聊 ${props.chat.id} 生成动态头像`)

    // 从后端获取真实成员列表
    const authStore = (await import('@/stores/auth')).useAuthStore()
    const token = authStore.token

    if (!token) {
      console.warn('⚠️ 没有token，无法获取群成员')
      return
    }

    const response = await fetch(`http://localhost:8893/api/groups/${props.chat.id}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      console.warn('⚠️ 获取群成员失败')
      return
    }

    const result = await response.json()
    if (!result.success || !result.data || result.data.length === 0) {
      console.warn('⚠️ 群成员数据为空')
      return
    }

    // 使用真实成员数据生成头像
    const members = result.data.map((m: any, index: number) => ({
      id: m.id || m.user_id || `member_${index}`,
      name: m.nickname || m.name || `成员${index + 1}`,
      avatar: m.avatar || getRealAvatarUrl(m.id || m.user_id),
      joinTime: m.joined_at ? new Date(m.joined_at).getTime() : Date.now() - (result.data.length - index) * 1000
    }))

    console.log(`📐 群聊 ${props.chat.id} 真实成员数: ${members.length}`)

    // 保存成员数量到localStorage
    localStorage.setItem(`group_member_count_${props.chat.id}`, String(members.length))

    const avatar = await GroupAvatarGenerator.generateGroupAvatar(members, {
      size: 44,
      backgroundColor: '#f0f0f0',
      borderColor: '#ffffff',
      borderWidth: 0
    })

    dynamicGroupAvatar.value = avatar
    console.log(`✅ 群聊 ${props.chat.id} 动态头像生成成功`)
  } catch (error) {
    console.error(`❌ 生成群聊头像失败:`, error)
  }
}

// 监听成员数变化，重新生成头像
onMounted(() => {
  if (props.chat.chatType === 'group' || props.chat.id.startsWith('group_')) {
    generateDynamicGroupAvatar()
  }
})

// 监听props变化，重新生成头像
watch(() => props.chat.memberCount, (newCount, oldCount) => {
  if (newCount !== oldCount && (props.chat.chatType === 'group' || props.chat.id.startsWith('group_'))) {
    console.log(`📐 群聊 ${props.chat.id} 成员数变化: ${oldCount} -> ${newCount}，重新生成头像`)
    generateDynamicGroupAvatar()
  }
})

// 监听群成员变化事件
const handleGroupMembersChanged = (event: any) => {
  const { groupId } = event.detail || {}
  if (groupId === props.chat.id) {
    console.log(`📐 群聊 ${props.chat.id} 成员变化，重新生成头像`)
    generateDynamicGroupAvatar()
  }
}

onMounted(() => {
  window.addEventListener('group-members-changed', handleGroupMembersChanged)
})

onUnmounted(() => {
  window.removeEventListener('group-members-changed', handleGroupMembersChanged)
})

// 统一规范化头像：强制走后端真实头像API，避免 /uploads 404
const normalizedAvatar = computed(() => {
  // 如果是群聊，使用动态生成的群头像
  if (props.chat.chatType === 'group' && dynamicGroupAvatar.value) {
    return dynamicGroupAvatar.value
  }

  // 如果有预设的头像，使用预设的
  if (props.chat.avatar) {
    return props.chat.avatar
  }

  // 否则使用用户头像API
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
      minute: '2-digit'
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
