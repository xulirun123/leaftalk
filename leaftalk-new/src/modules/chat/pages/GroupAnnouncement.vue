<template>
  <div class="page">
    <!-- 群信息区域（68px 容器高度） -->
    <div class="group-info-section">
      <OptimizedAvatar
        :src="groupAvatar || ''"
        :name="groupName"
        :size="56"
        shape="rounded"
        class="group-avatar"
      />
      <div class="group-info">
        <div class="group-name">{{ groupName || '群聊' }}</div>
        <div class="last-update-time">
          {{ announcement?.updated_at ? formatTime(announcement.updated_at) : '暂无公告' }}
        </div>
      </div>
    </div>

    <!-- 公告输入框 - 一直显示 -->
    <div class="content-container">
      <!-- 原公告内容（灰色显示，作为背景） -->
      <div v-if="!editContent && announcement?.content && isEditing" class="original-announcement">
        {{ announcement.content }}
      </div>

      <textarea
        ref="contentInput"
        v-model="editContent"
        class="content-textarea"
        :class="{ 'editing': isEditing, 'has-original': !editContent && announcement?.content && isEditing }"
        :placeholder="(!announcement?.content && isEditing) ? '请输入群公告内容...' : ''"
        maxlength="500"
        @input="updateCharCount"
        @click="handleTextareaClick"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/shared/stores/appStore'
import OptimizedAvatar from '@/shared/components/common/OptimizedAvatar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const announcement = ref<any>(null)
const isGroupOwner = ref(false)
const isAdmin = ref(false) // 是否是管理员
const canEdit = computed(() => isGroupOwner.value || isAdmin.value) // 群主或管理员都可以编辑
const isEditing = ref(false)
const editContent = ref('')
const charCount = ref(0)
const sendNotification = ref(true)
const contentInput = ref<HTMLTextAreaElement | null>(null)
const groupName = ref('')
const groupAvatar = ref('')

const updateCharCount = () => {
  charCount.value = editContent.value.length
}

const formatTime = (timestamp: string | number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60000) return '刚刚'
  // 小于1小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  // 小于24小时
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  // 小于7天
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  // 超过7天显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  if (year === now.getFullYear()) {
    return `${month}-${day} ${hour}:${minute}`
  }
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const loadGroupInfo = async () => {
  try {
    const groupId = route.params.groupId as string
    console.log('📋 开始加载群信息，groupId:', groupId)
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('📋 群信息API响应:', result)
      if (result.success && result.data) {
        groupName.value = result.data.name || result.data.group_name || '群聊'
        groupAvatar.value = result.data.avatar || result.data.group_avatar || ''
        console.log('✅ 群信息加载成功:', { name: groupName.value, avatar: groupAvatar.value })
      }
    } else {
      console.error('❌ 群信息API响应失败:', response.status)
    }
  } catch (error) {
    console.error('❌ 加载群信息失败:', error)
  }
}

const loadAnnouncement = async () => {
  try {
    const groupId = route.params.groupId as string
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/announcement`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        announcement.value = result.data
        // 如果不在编辑模式，更新输入框内容
        if (!isEditing.value) {
          editContent.value = result.data?.content || ''
          charCount.value = editContent.value.length
        }
      }
    }
  } catch (error) {
    console.error('❌ 加载群公告失败:', error)
  }
}

const checkGroupOwner = async () => {
  try {
    const groupId = route.params.groupId as string
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/members`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        const currentUser = result.data.find((m: any) => m.id === authStore.user?.id)
        isGroupOwner.value = currentUser?.role === 'creator' || currentUser?.role === 'owner'
        isAdmin.value = currentUser?.role === 'admin'
        console.log('📢 当前用户角色:', currentUser?.role, '是否群主:', isGroupOwner.value, '是否管理员:', isAdmin.value, '可以编辑:', canEdit.value)
      }
    }
  } catch (error) {
    console.error('❌ 检查群主权限失败:', error)
  }
}

const handleTextareaClick = () => {
  // 如果不是群主或管理员，不允许编辑
  if (!canEdit.value) {
    return
  }
  // 如果还没进入编辑模式，自动进入编辑模式
  if (!isEditing.value) {
    startEdit()
  }
}

const startEdit = () => {
  // 编辑内容初始化为空，原公告内容会以灰色显示
  editContent.value = ''
  charCount.value = 0
  isEditing.value = true
  nextTick(() => {
    contentInput.value?.focus()
    // 确保光标在最前面
    if (contentInput.value) {
      contentInput.value.setSelectionRange(0, 0)
    }
  })
}

const saveAnnouncement = async () => {
  // 如果没有输入新内容，使用原公告内容
  const contentToSave = editContent.value.trim() || announcement.value?.content || ''

  if (!contentToSave) {
    appStore.showToast('请输入公告内容', 'error')
    return
  }

  try {
    const groupId = route.params.groupId as string
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/announcement`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        content: contentToSave,
        editorId: authStore.user?.id,
        editorNickname: authStore.user?.nickname || authStore.user?.username,
        sendNotification: sendNotification.value
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('群公告已发布', 'success')

        // 退出编辑模式
        isEditing.value = false

        // 重新加载公告
        await loadAnnouncement()

        // 触发事件通知其他页面更新
        window.dispatchEvent(new CustomEvent('group-announcement-updated', {
          detail: { groupId }
        }))

        // 跳转到群聊页面
        router.push(`/chat/${groupId}`)
      } else {
        appStore.showToast(result.message || '发布失败', 'error')
      }
    } else {
      appStore.showToast('发布失败', 'error')
    }
  } catch (error) {
    console.error('❌ 发布群公告失败:', error)
    appStore.showToast('发布失败', 'error')
  }
}

// 更新顶部导航栏按钮
const updateTopBarButtons = () => {
  if (!canEdit.value) return

  const buttons = isEditing.value
    ? [{ text: '完成', action: 'done' }]
    : [{ text: '编辑', action: 'edit' }]

  // 触发事件更新顶部导航栏按钮
  window.dispatchEvent(new CustomEvent('update-top-bar-buttons', {
    detail: { buttons }
  }))
}

// 监听顶部导航栏按钮点击事件
const handleTopBarAction = (event: any) => {
  console.log('📢 顶部导航栏按钮点击:', event.detail)
  const action = event.detail?.action

  if (action === 'edit') {
    startEdit()
  } else if (action === 'done') {
    saveAnnouncement()
  }
}

// 监听编辑状态变化，更新顶部按钮
watch(isEditing, () => {
  updateTopBarButtons()
})

// 监听编辑权限变化，更新顶部按钮
watch(canEdit, () => {
  updateTopBarButtons()
})

onMounted(async () => {
  console.log('📢 群公告页面加载，groupId:', route.params.groupId)
  await Promise.all([loadGroupInfo(), loadAnnouncement(), checkGroupOwner()])
  console.log('📢 群信息:', { name: groupName.value, avatar: groupAvatar.value })
  console.log('📢 群公告数据:', announcement.value)
  console.log('📢 是否群主:', isGroupOwner.value, '是否管理员:', isAdmin.value, '可以编辑:', canEdit.value)

  // 监听顶部导航栏按钮点击
  window.addEventListener('top-bar-action', handleTopBarAction)

  // 设置顶部导航栏按钮
  updateTopBarButtons()
})

onUnmounted(() => {
  window.removeEventListener('top-bar-action', handleTopBarAction)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  height: 100%;
  background: #F7F7F7;
  display: flex;
  flex-direction: column;
}

/* 群信息区域 */
.group-info-section {
  height: 68px;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
}

.group-avatar {
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}

.group-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.last-update-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  line-height: 1.2;
}

/* 内容容器 - 紧贴头像容器 */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
  overflow: hidden;
}

/* 原公告内容（灰色显示在输入框下方） */
.original-announcement {
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: #999;
  white-space: pre-wrap;
  word-break: break-word;
  pointer-events: none;
  z-index: 1;
}

/* 内容输入框 - 一直显示 */
.content-textarea {
  flex: 1;
  padding: 0 16px;
  border: none;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  resize: none;
  font-family: inherit;
  background: transparent;
  cursor: text;
  position: relative;
  z-index: 2;
  overflow-y: auto;
}

.content-textarea.has-original {
  color: transparent;
}

.content-textarea.has-original:focus {
  color: #333;
}

.content-textarea:focus {
  outline: none;
}

.content-textarea::placeholder {
  color: #BFBFBF;
}

/* 编辑底部工具栏 */
.edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #E5E5E5;
  background: white;
  flex-shrink: 0;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.edit-btn,
.cancel-btn,
.save-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.edit-btn {
  background: #07C160;
  color: white;
}

.edit-btn:hover {
  background: #06a850;
}

.edit-btn:active {
  background: #059141;
}

.cancel-btn {
  background: #E5E5E5;
  color: #333;
}

.cancel-btn:hover {
  background: #d0d0d0;
}

.cancel-btn:active {
  background: #c0c0c0;
}

.save-btn {
  background: #07C160;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #06a850;
}

.save-btn:active:not(:disabled) {
  background: #059141;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>

