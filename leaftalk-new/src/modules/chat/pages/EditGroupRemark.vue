<template>
  <div class="page">
    <div class="body">
      <!-- 说明文本 -->
      <div class="notice-text">
        群聊的备注仅自己可见
      </div>

      <!-- 备注输入框 -->
      <div class="remark-input-container">
        <img :src="groupAvatar" :alt="groupName" class="group-avatar" />
        <input
          v-model="remark"
          type="text"
          class="remark-input"
          placeholder="备注"
          maxlength="100"
          @input="updateCharCount"
        />
      </div>

      <!-- 字符计数 -->
      <div class="char-count">{{ remarkLength }}/100</div>

      <!-- 保存按钮 -->
      <div class="button-group">
        <button class="save-btn" @click="saveRemark">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/shared/stores/appStore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

const remark = ref('')
const remarkLength = ref(0)
const groupName = ref('')
const groupAvatar = ref('')

const updateCharCount = () => {
  remarkLength.value = remark.value.length
}

const loadGroupInfo = async () => {
  try {
    const groupId = route.params.groupId as string
    console.log('🔍 加载群组信息，groupId:', groupId)

    // 获取群组信息
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        groupName.value = result.data.name || '群聊'
        groupAvatar.value = result.data.avatar || 'https://via.placeholder.com/36'
        console.log('✅ 群组信息加载成功')
      }
    }

    // 加载现有备注
    const remarkResponse = await fetch(`http://localhost:8893/api/groups/${groupId}/remark`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (remarkResponse.ok) {
      const remarkResult = await remarkResponse.json()
      if (remarkResult.success && remarkResult.data && remarkResult.data.remark) {
        remark.value = remarkResult.data.remark
        remarkLength.value = remark.value.length
        console.log('✅ 群备注加载成功:', remark.value)
      }
    }
  } catch (error) {
    console.error('❌ 加载群组信息失败:', error)
  }
}

const saveRemark = async () => {
  try {
    const groupId = route.params.groupId as string

    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/remark`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        remark: remark.value.trim()
      })
    })

    if (response.ok) {
      // 保存到本地存储，供其他组件使用
      if (remark.value.trim()) {
        localStorage.setItem(`group_remark_${groupId}`, remark.value.trim())
      } else {
        localStorage.removeItem(`group_remark_${groupId}`)
      }

      // 触发事件通知其他组件更新（使用正确的事件名称）
      window.dispatchEvent(new CustomEvent('group-remark-changed', {
        detail: { groupId, remarkName: remark.value.trim() }
      }))

      console.log('✅ 已触发群备注修改事件:', { groupId, remarkName: remark.value.trim() })

      appStore.showToast('备注已保存', 'success')
      router.back()
    } else {
      appStore.showToast('保存失败', 'error')
    }
  } catch (error) {
    console.error('❌ 保存备注失败:', error)
    appStore.showToast('保存失败', 'error')
  }
}

onMounted(() => {
  loadGroupInfo()
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
}

/* 说明文本 */
.notice-text {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-bottom: 16px;
  padding: 8px 0;
}

/* 备注输入框容器 */
.remark-input-container {
  height: 48px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  margin-bottom: 8px;
}

.group-avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.remark-input {
  flex: 1;
  height: 36px;
  border: none;
  outline: none;
  font-size: 13px;
  color: #333;
  background: transparent;
}

.remark-input::placeholder {
  color: #999;
}

/* 字符计数 */
.char-count {
  font-size: 12px;
  color: #999;
  text-align: right;
  padding: 4px 12px;
  margin-bottom: 24px;
}

/* 按钮组 */
.button-group {
  display: flex;
  justify-content: center;
}

.save-btn {
  width: 100%;
  height: 44px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn:active {
  background: #06a850;
}
</style>

