<template>
  <div class="change-signature-page">
    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-container">
        <textarea
          v-model="signature"
          class="signature-input"
          placeholder="请输入个性签名（最多20个字）"
          maxlength="20"
          rows="4"
          @input="handleInput"
        ></textarea>
        <div class="char-count">
          {{ (signature || '').length }}/20
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-section">
      <button 
        class="save-button"
        :disabled="!hasChanged"
        @click="saveSignature"
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
const signature = ref('')
const originalSignature = ref('')

// 计算属性
const hasChanged = computed(() => {
  return signature.value.trim() !== originalSignature.value
})

// 处理输入
const handleInput = () => {
  // 限制最多20个字符
  if (signature.value.length > 20) {
    signature.value = signature.value.substring(0, 20)
  }
}

// 保存个性签名
const saveSignature = async () => {
  if (!hasChanged.value) return

  const trimmedSignature = signature.value.trim()
  
  // 验证长度
  if (trimmedSignature.length > 20) {
    appStore.showToast('个性签名最多20个字', 'warning')
    return
  }

  try {
    // 调用API更新个性签名
    const response = await userAPI.updateProfile({
      signature: trimmedSignature
    })

    if (response.success) {
      console.log('✅ 个性签名更新成功，开始更新本地数据')

      // 更新本地存储
      await authStore.fetchUserInfo()
      console.log('✅ authStore.fetchUserInfo() 完成')

      // 触发用户信息更新事件
      window.dispatchEvent(new CustomEvent('userInfoUpdated', {
        detail: {
          type: 'signature',
          newValue: trimmedSignature,
          user: authStore.user
        }
      }))
      console.log('✅ userInfoUpdated 事件已触发')

      // 显示成功提示
      appStore.showToast('个性签名修改成功', 'success')
      console.log('✅ 成功提示已显示')

      // 立即返回
      console.log('🔄 立即跳转到个人信息页面')
      router.push('/settings/personal-info')
    } else {
      appStore.showToast('修改失败：' + (response.error || '未知错误'), 'error')
    }
  } catch (error: any) {
    console.error('修改个性签名失败:', error)
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

  // 获取当前用户个性签名
  const currentSignature = authStore.user?.signature || ''
  signature.value = currentSignature
  originalSignature.value = currentSignature

  console.log('📝 个性签名设置页面初始化:', {
    currentSignature,
    signature: signature.value,
    user: authStore.user
  })
})

// 监听用户信息变化
watch(() => authStore.user?.signature, (newSignature) => {
  console.log('🔄 个性签名设置页面监听到用户数据变化:', {
    newSignature,
    currentSignature: signature.value,
    user: authStore.user
  })

  const ns = (newSignature ?? '')
  if (ns !== signature.value) {
    signature.value = ns
    originalSignature.value = ns
    console.log('✅ 个性签名设置页面用户数据已更新:', ns)
  }
}, { immediate: true })
</script>

<style scoped>
.change-signature-page {
  min-height: 100vh;
  background: #EDEDED;
  display: flex;
  flex-direction: column;
}

.input-section {
  background: white;
  padding: 20px;
  /* 移除 margin-top，使用 MobileApp 统一间距，第一项与导航栏重合 */
}

.input-container {
  position: relative;
}

.signature-input {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  outline: none;
  background: #fafafa;
  transition: border-color 0.2s;
}

.signature-input:focus {
  border-color: #07C160;
  background: white;
}

.signature-input::placeholder {
  color: #999;
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #999;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 4px;
  border-radius: 4px;
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
