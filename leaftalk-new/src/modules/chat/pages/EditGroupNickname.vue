<template>
  <div class="page">
    <div class="body">
      <div class="nickname-section">
        <div class="nickname-label">我在本群的昵称</div>
        <input
          ref="nicknameInputRef"
          v-model="nickname"
          type="text"
          class="nickname-input"
          :placeholder="originalNickname"
          maxlength="20"
          @input="updateCharCount"
        />
        <div class="char-count">{{ nicknameLength }}/20</div>
      </div>

      <div class="button-group">
        <button class="save-btn" @click="saveNickname">完成修改</button>
        <button class="cancel-btn" @click="goBack">取消</button>
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

const nickname = ref('')
const nicknameLength = ref(0)
const originalNickname = ref('')
const nicknameInputRef = ref<HTMLInputElement | null>(null)

const updateCharCount = () => {
  nicknameLength.value = nickname.value.length
}

const goBack = () => {
  router.back()
}

const loadNickname = () => {
  try {
    const groupId = route.params.groupId as string
    console.log('📝 加载群昵称，groupId:', groupId)
    const savedNickname = localStorage.getItem(`group_nickname_${groupId}`)
    if (savedNickname) {
      originalNickname.value = savedNickname
      nickname.value = ''
      nicknameLength.value = 0
    }
  } catch (error) {
    console.warn('⚠️ 加载群昵称失败:', error)
  }
}

const saveNickname = async () => {
  try {
    // 如果输入框为空，使用原始昵称
    const finalNickname = nickname.value.trim() || originalNickname.value

    if (!finalNickname) {
      appStore.showToast('群昵称不能为空', 'error')
      return
    }

    const groupId = route.params.groupId as string

    console.log('💾 保存群昵称:', { groupId, nickname: finalNickname })

    if (!groupId) {
      console.error('❌ groupId 为空')
      appStore.showToast('群ID获取失败', 'error')
      return
    }

    // 调用后端API保存群昵称
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/set-nickname`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ nickname: finalNickname })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        console.log('✅ 群昵称保存成功')

        // 保存到localStorage
        localStorage.setItem(`group_nickname_${groupId}`, finalNickname)

        // 触发事件通知其他组件更新
        window.dispatchEvent(new CustomEvent('group-nickname-changed', {
          detail: { groupId, nickname: finalNickname }
        }))

        appStore.showToast('昵称已保存', 'success')
        router.back()
      } else {
        console.error('❌ 保存群昵称失败:', result.message)
        appStore.showToast(result.message || '保存失败', 'error')
      }
    } else {
      console.error('❌ 保存群昵称请求失败')
      appStore.showToast('保存失败', 'error')
    }
  } catch (error) {
    console.error('❌ 保存群昵称失败:', error)
    appStore.showToast('保存失败', 'error')
  }
}

onMounted(() => {
  loadNickname()
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

.nickname-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.nickname-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.nickname-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  color: #333;
}

.nickname-input::placeholder {
  color: #999;
  opacity: 1;
}

.nickname-input:focus {
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

