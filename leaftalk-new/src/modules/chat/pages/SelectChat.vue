<template>
  <div class="select-chat">
    <div class="list">
      <div v-for="chat in chats" :key="chat.id" class="chat-item" @click="selectChat(chat)">
        <div class="avatar">
          <UnifiedAvatar
            :user-id="chat.userId"
            :src="chat.avatar"
            :name="getDisplayName(chat)"
            size="medium"
            :show-status="false"
          />
        </div>
        <div class="info">
          <div class="name">{{ getDisplayName(chat) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useChatStore } from '../stores/chatStore'
import UnifiedAvatar from '../../../shared/components/common/UnifiedAvatar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const chats = ref<any[]>([])

const currentUserId = computed(() => String(authStore.user?.id || ''))

const getSavedRemarkPack = (id: string | number) => {
  try { return JSON.parse(localStorage.getItem(`friend_remark_${id}`) || 'null') } catch { return null }
}

const getOtherUserId = (chatId: string): string => {
  try {
    // 支持 chat_1_2 或 1_2 两种格式
    const raw = chatId.startsWith('chat_') ? chatId.slice(5) : chatId
    const [a, b] = raw.split('_')
    if (!a || !b) return ''
    const me = currentUserId.value
    return String(a) === me ? String(b) : String(a)
  } catch { return '' }
}

const getDisplayName = (chat: any): string => {
  try {
    const otherId = getOtherUserId(String(chat.id || ''))
    if (otherId) {
      const saved = getSavedRemarkPack(otherId)
      if (saved?.name && String(saved.name).trim()) return String(saved.name).trim()
    }
  } catch {}
  return chat.remark || chat.name || chat.nickname || `用户${chat.id}`
}

const loadChats = () => {
  try {
    // 读取现有聊天列表（本地缓存）
    const local = JSON.parse(localStorage.getItem('yeyu_chats') || '[]')
    if (Array.isArray(local)) chats.value = local
  } catch {}
}

const selectChat = (chat: any) => {
  // 直接发送名片消息到选中的聊天，然后跳转到聊天页面
  const cid = String(chat.id || '')
  const finalId = cid.startsWith('chat_') ? cid : `chat_${cid}`
  const otherId = getOtherUserId(cid)

  try {
    const friendId = String(route.query.friendId || '')
    if (friendId && otherId) {
      // 构建名片消息
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        senderId: currentUserId.value,
        receiverId: otherId,
        content: JSON.stringify({ friendId }),
        type: 'contact' as const,
        timestamp: Date.now(),
        status: 'sent' as const
      }

      // 通过chatStore创建/更新会话并保存消息
      try {
        const chatStore = useChatStore()
        chatStore.createOrUpdateChatItem(message as any, { id: otherId, name: getDisplayName(chat), avatar: chat.avatar })
      } catch (e) {
        console.warn('发送名片到会话失败，仍将跳转：', e)
      }
    }
  } catch (e) {
    console.warn('构建名片消息失败：', e)
  }

  router.push(`/chat/${finalId}`)
}

onMounted(() => {
  loadChats()
})
</script>

<style scoped>
.select-chat {
  min-height: 100vh;
  background: #f5f5f5;
}

.list { background: #fff; }

.chat-item {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.avatar { margin-right: 12px; }

.info { display: flex; align-items: center; height: 36px; }

.name {
  font-size: 14px;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
</style>

