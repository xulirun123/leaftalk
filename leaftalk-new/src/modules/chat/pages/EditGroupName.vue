<template>
  <div class="page">
    <div class="body">
      <div class="name-section">
        <div class="name-label">群聊名称</div>
        <input
          ref="nameInputRef"
          v-model="groupName"
          type="text"
          class="name-input"
          :placeholder="originalName"
          maxlength="15"
          @input="updateCharCount"
        />
        <div class="char-count">{{ nameLength }}/15</div>
      </div>

      <div class="button-group">
        <button class="save-btn" @click="saveGroupName">完成修改</button>
        <button class="cancel-btn" @click="goBack">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/shared/stores/appStore'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '../stores/chatStore'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()

const groupName = ref('')
const nameLength = ref(0)
const originalName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)
const nameEditRestricted = ref(false)
const currentUserRole = ref<'owner' | 'creator' | 'admin' | 'member'>('member')

const updateCharCount = () => {
  nameLength.value = groupName.value.length
}

const goBack = () => {
  router.back()
}

const loadGroupName = () => {
  try {
    const groupId = route.params.id as string
    const session = chatStore.sessions.find(s => s.id === groupId)
    if (session && session.name) {
      originalName.value = session.name
      groupName.value = ''
      nameLength.value = 0
    }
  } catch (error) {
    console.warn('⚠️ 加载群名称失败:', error)
  }
}

// 加载群聊权限设置
const loadGroupPermissions = async () => {
  try {
    const groupId = route.params.id as string
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        nameEditRestricted.value = result.data.only_admin_can_rename === 1 || result.data.only_admin_can_rename === true
        console.log('✅ 群聊权限设置已加载:', { nameEditRestricted: nameEditRestricted.value })
      }
    }
  } catch (error) {
    console.warn('⚠️ 加载群聊权限设置失败:', error)
  }
}

// 加载当前用户在群内的角色
const loadCurrentUserRole = async () => {
  try {
    const groupId = route.params.id as string
    const resp = await fetch(`http://localhost:8893/api/groups/${groupId}/members`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (resp.ok) {
      const data = await resp.json()
      const me = (data?.data || []).find((m: any) => String(m.id) === String(authStore.user?.id))
      if (me && me.role) {
        currentUserRole.value = me.role
      }
    }
  } catch {}
}

const ensurePermission = () => {
  if (nameEditRestricted.value && currentUserRole.value === 'member') {
    appStore.showToast('您不能修改群名称', 'error')
    router.back()
  }
}

// 处理权限变化事件
const handlePermissionChanged = (event: Event) => {
  const customEvent = event as CustomEvent
  const { groupId, nameEditRestricted: restricted } = customEvent.detail

  if (groupId === route.params.id) {
    nameEditRestricted.value = restricted
    console.log('✅ 权限设置已实时更新:', { nameEditRestricted: nameEditRestricted.value })
    ensurePermission()
  }
}

const saveGroupName = async () => {
  try {
    // 如果输入框为空，使用原始名称
    const finalName = groupName.value.trim() || originalName.value

    if (!finalName) {
      appStore.showToast('群名称不能为空', 'error')
      return
    }

    const groupId = route.params.id as string

    console.log('💾 保存群名称:', { groupId, groupName: finalName, nameEditRestricted: nameEditRestricted.value })

    // 调用后端API保存群名称
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ name: finalName })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        console.log('✅ 群名称保存成功')

        // 1️⃣ 更新chatStore中的会话名称（检查是否有备注）
        const session = chatStore.sessions.find(s => s.id === groupId)
        if (session) {
          // 检查是否有群聊备注
          const savedRemark = localStorage.getItem(`group_remark_${groupId}`)

          // 提取当前名称中的成员数
          const currentName = session.name || ''
          const memberCountMatch = currentName.match(/（(\d+)）/)
          const memberCount = memberCountMatch ? memberCountMatch[1] : ''

          // 如果有备注，保持备注名称；否则使用新群名
          if (savedRemark && savedRemark.trim()) {
            // 有备注，保持备注名称不变
            const remarkName = savedRemark.trim()
            const newSessionName = memberCount ? `${remarkName}（${memberCount}）` : remarkName
            session.name = newSessionName
            console.log('✅ 保持群备注名称:', newSessionName)
          } else {
            // 没有备注，使用新群名
            const newSessionName = memberCount ? `${finalName}（${memberCount}）` : finalName
            session.name = newSessionName
            console.log('✅ 更新为新群名:', newSessionName)
          }
        }

        // 2️⃣ 触发事件通知其他组件更新群名称
        window.dispatchEvent(new CustomEvent('group-name-changed', {
          detail: { groupId, newGroupName: finalName }
        }))
        console.log('✅ 已触发group-name-changed事件')

        appStore.showToast('群名称已保存', 'success')

        // 延迟返回，确保事件被处理
        setTimeout(() => {
          router.back()
        }, 100)
      } else {
        console.error('❌ 保存群名称失败:', result.message)
        appStore.showToast(result.message || '保存失败', 'error')
      }
    } else if (response.status === 403) {
      // 权限不足
      console.error('❌ 权限不足，无法修改群名称')
      appStore.showToast('只有群主或管理员可以修改群名称', 'error')
    } else {
      console.error('❌ 保存群名称请求失败')
      appStore.showToast('保存失败', 'error')
    }
  } catch (error) {
    console.error('❌ 保存群名称失败:', error)
    appStore.showToast('保存失败', 'error')
  }
}

onMounted(() => {
  loadGroupName()
  Promise.all([loadGroupPermissions(), loadCurrentUserRole()])
    .then(() => { try { ensurePermission() } catch {} })
    .catch(() => { try { ensurePermission() } catch {} })

  // 监听权限变化事件
  window.addEventListener('group-name-edit-permission-changed', handlePermissionChanged)
})

// 页面激活时重新加载权限设置（从其他页面返回时）
onActivated(() => {
  console.log('🔄 EditGroupName 页面已激活，重新加载权限设置')
  loadGroupPermissions()

  // 确保事件监听已添加
  window.addEventListener('group-name-edit-permission-changed', handlePermissionChanged)
})

// 页面停用时移除事件监听
onDeactivated(() => {
  console.log('🔄 EditGroupName 页面已停用，移除事件监听')
  window.removeEventListener('group-name-edit-permission-changed', handlePermissionChanged)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('group-name-edit-permission-changed', handlePermissionChanged)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F7F7F7;
  display: flex;
  flex-direction: column;
}

.body {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.name-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.name-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.name-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  color: #333;
}

.name-input::placeholder {
  color: #999;
  opacity: 1;
}

.name-input:focus {
  outline: none;
  border-color: #07C160;
}

.char-count {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: right;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #E5E5E5;
}

.save-btn,
.cancel-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn {
  background: #07C160;
  color: white;
}

.save-btn:hover {
  background: #06a850;
}

.save-btn:active {
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
</style>

