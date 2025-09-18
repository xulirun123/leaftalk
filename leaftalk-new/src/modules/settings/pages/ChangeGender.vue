<template>
  <div class="change-gender-page">
    <!-- 性别选择列表 -->
    <div class="gender-list">
      <div
        class="gender-item"
        :class="{ 'selected': selectedGender === 'male' }"
        @click="selectGender('male')"
      >
        <span class="gender-text">男</span>
        <iconify-icon
          v-if="selectedGender === 'male'"
          icon="heroicons:check"
          width="20"
          class="check-icon"
        ></iconify-icon>
      </div>

      <div
        class="gender-item"
        :class="{ 'selected': selectedGender === 'female' }"
        @click="selectGender('female')"
      >
        <span class="gender-text">女</span>
        <iconify-icon
          v-if="selectedGender === 'female'"
          icon="heroicons:check"
          width="20"
          class="check-icon"
        ></iconify-icon>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-section">
      <button 
        class="save-button"
        :disabled="!hasChanged"
        @click="saveGender"
      >
        保存
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import { userAPI } from '../../auth/services/api'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// 状态
const selectedGender = ref('')
const originalGender = ref('')

// 计算属性
const hasChanged = computed(() => {
  return selectedGender.value !== originalGender.value
})

// 选择性别
const selectGender = (gender: string) => {
  selectedGender.value = gender
}

// 保存性别
const saveGender = async () => {
  if (!hasChanged.value) return

  try {
    // 调用API更新性别
    const response = await userAPI.updateProfile({
      gender: selectedGender.value
    })

    if (response.success) {
      // 更新本地存储
      await authStore.fetchUserInfo()
      
      // 触发用户信息更新事件
      window.dispatchEvent(new CustomEvent('userInfoUpdated', {
        detail: {
          type: 'gender',
          newValue: selectedGender.value,
          user: authStore.user
        }
      }))

      // 显示成功提示
      appStore.showToast('性别修改成功', 'success')

      // 立即返回
      router.push('/settings/personal-info')
    } else {
      appStore.showToast('修改失败：' + (response.error || '未知错误'), 'error')
    }
  } catch (error: any) {
    console.error('修改性别失败:', error)
    appStore.showToast('修改失败：' + error.message, 'error')
  }
}

// goBack 函数已移除，使用 MobileApp 的统一返回处理

// 页面初始化
onMounted(async () => {
  // 确保用户数据已加载
  if (!authStore.user && authStore.token) {
    await authStore.fetchUserInfo()
  }

  // 获取当前用户性别
  const currentGender = authStore.user?.gender || ''
  selectedGender.value = currentGender
  originalGender.value = currentGender

  console.log('🎯 性别设置页面初始化:', {
    currentGender,
    selectedGender: selectedGender.value,
    user: authStore.user
  })
})

// 监听用户信息变化
watch(() => authStore.user?.gender, (newGender) => {
  console.log('🔄 性别设置页面监听到用户数据变化:', {
    newGender,
    currentSelected: selectedGender.value,
    user: authStore.user
  })

  if (newGender !== undefined && newGender !== selectedGender.value) {
    selectedGender.value = newGender
    originalGender.value = newGender
    console.log('✅ 性别设置页面用户数据已更新:', newGender)
  }
}, { immediate: true })
</script>

<style scoped>
.change-gender-page {
  min-height: 100vh;
  background: #EDEDED;
  display: flex;
  flex-direction: column;
}

.gender-list {
  background: white;
  /* 移除 margin-top，使用 MobileApp 统一间距，第一项与导航栏重合 */
}

.gender-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #E5E5E5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.gender-item:last-child {
  border-bottom: none;
}

.gender-item:active {
  background: #f0f0f0;
}

.gender-item.selected {
  background: #f8f8f8;
}

.gender-text {
  font-size: 16px;
  color: #333;
}

.check-icon {
  color: #07C160;
}

.save-section {
  margin-top: 32px;
  padding: 0 20px;
}

.save-button {
  width: 100%;
  height: 48px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.save-button:not(:disabled):active {
  background: #06a552;
  transform: scale(0.98);
}
</style>
