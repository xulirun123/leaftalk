<template>
  <div class="chat-info">
    <!-- 使用全局顶部导航栏，不需要自定义导航栏 -->

    <!-- 用户信息 -->
    <div class="user-section">
      <div class="avatar-container">
        <img
          :src="chatInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatInfo.id}`"
          :alt="chatInfo.name"
          class="user-avatar"
          @error="handleImageError"
        />
        <div class="user-name">{{ displayName }}</div>
      </div>
      <div class="add-member-box" @click="goToCreateGroup">
        <iconify-icon icon="heroicons:plus" width="16" style="color: #999;"></iconify-icon>
      </div>
    </div>

    <!-- 聊天设置 -->
    <div class="settings-section">
      <div class="setting-item" @click="toggleMute">
        <span>消息免打扰</span>
        <div class="setting-toggle" :class="{ active: isMuted }">
          <div class="toggle-thumb"></div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="setting-item" @click="togglePin">
        <span>置顶聊天</span>
        <div class="setting-toggle" :class="{ active: isPinned }">
          <div class="toggle-thumb"></div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="setting-item" @click="setBackground">
        <span>设置聊天背景</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>
    </div>

    <div class="settings-section">
      <div class="setting-item" @click="searchHistory">
        <span>查找聊天内容</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>
    </div>

    <!-- 危险操作 -->
    <div class="settings-section">
      <div class="setting-item" @click="showDeleteDialog">
        <span>删除聊天记录</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>
    </div>

    <!-- 删除聊天记录弹窗 -->
    <div v-if="isDeleteDialogVisible" class="dialog-overlay" @click="hideDeleteDialog">
      <div class="dialog-bottom" @click.stop>
        <div class="dialog-button delete-button" @click="confirmDelete">删除聊天记录</div>
        <div class="dialog-divider"></div>
        <div class="dialog-button cancel-button" @click="hideDeleteDialog">取消</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContactStore } from '@/modules/contacts/stores/contactsStore'

const router = useRouter()
const route = useRoute()
const contactStore = useContactStore()

// 聊天信息
const chatInfo = ref({
  id: '',
  name: '',
  avatar: '',
  remark: '',
  type: 'private',
  memberCount: 0
})

// 计算显示名称（最长显示4个字，超过4个字显示前3个字+省略号）
const displayName = computed(() => {
  const name = chatInfo.value.remark || chatInfo.value.name || '用户'
  if (name.length > 4) {
    return name.substring(0, 3) + '...'
  }
  return name
})

// 设置状态
const isMuted = ref(false)
const isPinned = ref(false)
const isDeleteDialogVisible = ref(false)

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const userId = route.params.id as string
    console.log('🔍 加载聊天详情，用户ID:', userId)
    console.log('📋 当前联系人列表数量:', contactStore.contacts.length)
    console.log('📋 联系人列表:', contactStore.contacts)

    if (!userId) {
      console.error('❌ 无法获取用户ID')
      return
    }

    // 从联系人列表中查找用户信息
    const contact = contactStore.contacts.find(c => String(c.id) === String(userId))

    if (contact) {
      console.log('✅ 找到联系人信息:', contact)
      console.log('📸 头像URL:', contact.avatar)
      console.log('👤 昵称:', contact.nickname)
      console.log('🏷️ 备注:', contact.remark)

      chatInfo.value = {
        id: String(contact.id),
        name: contact.nickname || contact.name || '未知用户',
        avatar: contact.avatar || '',
        remark: contact.remark || '',
        type: 'private',
        memberCount: 0
      }

      console.log('✅ 最终聊天信息:', chatInfo.value)
    } else {
      console.log('⚠️ 未找到联系人，尝试从API获取用户信息')

      // 尝试从API获取用户信息
      try {
        const { userApi } = await import('@/shared/services/userApi')
        const response = await userApi.getUserInfo(userId)

        console.log('✅ 从API获取到用户信息:', response)

        // API返回的数据结构是 {success: true, data: {...}}
        const userInfo = response?.data || response

        if (userInfo && userInfo.id) {
          console.log('📸 API返回的头像URL:', userInfo.avatar)
          console.log('👤 API返回的昵称:', userInfo.nickname)

          chatInfo.value = {
            id: String(userInfo.id),
            name: userInfo.nickname || userInfo.username || '未知用户',
            avatar: userInfo.avatar || '',
            remark: '',
            type: 'private',
            memberCount: 0
          }

          console.log('✅ 最终聊天信息（从API）:', chatInfo.value)
        } else {
          throw new Error('API返回空数据')
        }
      } catch (apiError) {
        console.error('❌ 从API获取用户信息失败:', apiError)
        // 使用默认信息
        chatInfo.value = {
          id: userId,
          name: '未知用户',
          avatar: '',
          remark: '',
          type: 'private',
          memberCount: 0
        }
      }
    }
  } catch (error) {
    console.error('❌ 加载用户信息失败:', error)
  }
}

// 监听联系人列表变化
watch(() => contactStore.contacts.length, (newLength, oldLength) => {
  console.log('📋 联系人列表数量变化:', oldLength, '->', newLength)
  if (newLength > 0) {
    loadUserInfo()
  }
}, { immediate: false })

onMounted(async () => {
  console.log('🔄 页面加载，开始加载用户信息')
  console.log('📋 当前联系人列表数量:', contactStore.contacts.length)

  // 加载用户信息
  await loadUserInfo()

  // 加载会话设置
  await loadSessionSettings()
})

// 加载会话设置
const loadSessionSettings = async () => {
  try {
    const userId = route.params.id as string
    if (!userId) return

    // 生成sessionId
    const { useChatStore } = await import('@/modules/chat/stores/chatStore')
    const chatStore = useChatStore()
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    const currentUserId = String(authStore.user?.id || '')
    const sessionId = chatStore.generateSessionId(currentUserId, userId)

    console.log('📋 加载会话设置，sessionId:', sessionId)

    // 加载免打扰状态
    const { useUnreadStore } = await import('@/modules/chat/stores/unread')
    const unreadStore = useUnreadStore()
    isMuted.value = unreadStore.getMuteStatus(sessionId)
    console.log('🔕 免打扰状态:', isMuted.value)

    // 加载置顶状态
    const session = chatStore.sessions.find(s => s.id === sessionId)
    if (session) {
      isPinned.value = session.isPinned || false
      console.log('📌 置顶状态:', isPinned.value)
    }
  } catch (error) {
    console.error('❌ 加载会话设置失败:', error)
  }
}

// 方法
const toggleMute = async () => {
  try {
    const userId = route.params.id as string
    if (!userId) return

    const { useChatStore } = await import('@/modules/chat/stores/chatStore')
    const chatStore = useChatStore()
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    const currentUserId = String(authStore.user?.id || '')
    const sessionId = chatStore.generateSessionId(currentUserId, userId)

    // 切换免打扰状态
    isMuted.value = !isMuted.value

    // 保存到store
    const { useUnreadStore } = await import('@/modules/chat/stores/unread')
    const unreadStore = useUnreadStore()
    unreadStore.setMuteStatus(sessionId, isMuted.value)

    console.log('🔕 消息免打扰:', isMuted.value)
  } catch (error) {
    console.error('❌ 设置免打扰失败:', error)
  }
}

const togglePin = async () => {
  try {
    const userId = route.params.id as string
    if (!userId) return

    const { useChatStore } = await import('@/modules/chat/stores/chatStore')
    const chatStore = useChatStore()
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    const currentUserId = String(authStore.user?.id || '')
    const sessionId = chatStore.generateSessionId(currentUserId, userId)

    // 切换置顶状态
    isPinned.value = !isPinned.value

    // 更新会话的置顶状态
    const session = chatStore.sessions.find(s => s.id === sessionId)
    if (session) {
      session.isPinned = isPinned.value
      // 保存到缓存
      chatStore.saveToCache()
    }

    console.log('📌 置顶聊天:', isPinned.value)
  } catch (error) {
    console.error('❌ 设置置顶失败:', error)
  }
}

const setBackground = () => {
  console.log('🎨 跳转到设置聊天背景页面')
  router.push('/settings/chat-background')
}

const searchHistory = async () => {
  console.log('🔍 跳转到搜索聊天记录页面')
  const userId = route.params.id as string

  // 生成sessionId
  const { useChatStore } = await import('@/modules/chat/stores/chatStore')
  const chatStore = useChatStore()
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  const currentUserId = String(authStore.user?.id || '')
  const sessionId = chatStore.generateSessionId(currentUserId, userId)

  console.log('🔍 跳转到搜索页面，sessionId:', sessionId)
  router.push(`/chat-search/${sessionId}`)
}

// 显示删除对话框
const showDeleteDialog = () => {
  isDeleteDialogVisible.value = true
}

// 隐藏删除对话框
const hideDeleteDialog = () => {
  isDeleteDialogVisible.value = false
}

// 确认删除聊天记录
const confirmDelete = async () => {
  try {
    // 获取当前用户ID
    const userId = route.params.id as string
    if (!userId) {
      console.error('❌ 无法获取用户ID')
      return
    }

    // 生成sessionId
    const { useChatStore } = await import('@/modules/chat/stores/chatStore')
    const chatStore = useChatStore()
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    const currentUserId = String(authStore.user?.id || '')
    const sessionId = chatStore.generateSessionId(currentUserId, userId)

    console.log('🧹 清除聊天记录，sessionId:', sessionId)

    // 清除聊天记录
    await chatStore.clearChatHistory(sessionId)

    console.log('✅ 聊天记录已删除')

    // 隐藏对话框
    hideDeleteDialog()
  } catch (error) {
    console.error('❌ 删除聊天记录失败:', error)
    hideDeleteDialog()
  }
}

// 跳转到创建群聊页面
const goToCreateGroup = () => {
  console.log('🔍 跳转到创建群聊页面')
  router.push('/create-group')
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.log('❌ 头像加载失败，使用默认头像')
  img.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatInfo.value.id}`
}
</script>

<style scoped>
.chat-info {
  min-height: 100vh;
  background: #E5E5E5;
  overflow-y: auto;
  position: absolute;
  top: 65px; /* 从顶部导航栏下方开始，间距为0 */
  left: 0;
  right: 0;
  bottom: 0;
}

.user-section {
  background: white;
  height: 80px; /* 容器高度 80px */
  display: flex;
  align-items: flex-start; /* 顶部对齐 */
  padding-left: 10px; /* 左边距 10px */
  padding-top: 10px; /* 顶部内边距 */
  gap: 12px; /* 头像容器和虚线框之间的间距 */
  margin-bottom: 2px; /* 容器间距 2px */
}

.avatar-container {
  display: flex;
  flex-direction: column; /* 纵向布局：头像在上，昵称在下 */
  align-items: center;
  justify-content: flex-start;
  gap: 6px; /* 头像和昵称之间的间距 6px */
}

.user-avatar {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  min-height: 36px !important;
  max-width: 36px !important;
  max-height: 36px !important;
  border-radius: 4px;
  flex-shrink: 0;
  object-fit: cover; /* 确保图片按比例裁剪 */
}

.user-name {
  font-size: 10px; /* 字体大小 10px（浏览器最小字体） */
  font-weight: normal; /* 不使用粗体 */
  color: #666;
  width: 36px; /* 宽度 36px */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  line-height: 1;
}

.add-member-box {
  width: 36px; /* 虚线框宽度 36px */
  height: 36px; /* 虚线框高度 36px，正方形 */
  border: 1px dashed #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.add-member-box:hover {
  border-color: #999;
  background: #f5f5f5;
}

.add-member-box:active {
  background: #e5e5e5;
}

.settings-section {
  background: white;
  margin-bottom: 2px; /* 容器间距 2px */
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px; /* 功能项高度 48px */
  padding: 0 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 16px;
  color: #333;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-toggle {
  width: 44px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.3s;
}

.setting-toggle.active {
  background: #07C160;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-toggle.active .toggle-thumb {
  left: 22px;
}

/* 删除对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-bottom {
  width: 100%;
  background: white;
  border-radius: 12px 12px 0 0;
  padding: 0;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.dialog-button {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dialog-button:active {
  background: #f5f5f5;
}

.delete-button {
  color: #FF3B30;
  font-weight: 500;
}

.cancel-button {
  color: #333;
}

.dialog-divider {
  height: 8px;
  background: #f5f5f5;
}
</style>
