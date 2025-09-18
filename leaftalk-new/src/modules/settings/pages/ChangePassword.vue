<template>
  <div class="change-password">
    <!-- 密码修改表单 -->
    <div class="password-form">
      <!-- 当前密码 -->
      <div class="form-group">
        <div class="password-header">
          <label class="form-label">当前密码</label>
          <button
            type="button"
            class="forgot-password-btn"
            @click="goToForgotPassword"
          >
            忘记密码
          </button>
        </div>
        <div class="input-wrapper">
          <input
            v-model="currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ 'success': currentPasswordVerified, 'error': currentPasswordError }"
            placeholder="请输入当前密码"
            @input="clearErrors"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showCurrentPassword = !showCurrentPassword"
          >
            <iconify-icon
              :icon="showCurrentPassword ? 'heroicons:eye-slash' : 'heroicons:eye'"
              width="20"
            ></iconify-icon>
          </button>
          <!-- 验证状态图标 -->
          <div v-if="currentPasswordVerifying" class="verify-icon">
            <iconify-icon icon="heroicons:arrow-path" width="16" class="spinning"></iconify-icon>
          </div>
          <div v-else-if="currentPasswordVerified" class="verify-icon success">
            <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
          </div>
          <div v-else-if="currentPasswordError" class="verify-icon error">
            <iconify-icon icon="heroicons:x-circle" width="16"></iconify-icon>
          </div>
        </div>
        <div v-if="errors.currentPassword" class="error-message">
          {{ errors.currentPassword }}
        </div>
        <div v-if="currentPasswordVerified" class="success-message">
          当前密码验证通过
        </div>
      </div>

      <!-- 验证当前密码按钮 - 只有输入密码且未验证时显示 -->
      <div v-if="currentPassword && !currentPasswordVerified" class="verify-section">
        <button
          type="button"
          class="verify-btn"
          :disabled="currentPasswordVerifying || !currentPassword"
          @click="verifyCurrentPassword"
        >
          {{ currentPasswordVerifying ? '验证中...' : '验证密码' }}
        </button>
      </div>

      <!-- 新密码 - 只有当前密码验证通过后才显示 -->
      <div class="form-group" v-if="currentPasswordVerified">
        <label class="form-label">新密码</label>
        <div class="input-wrapper">
          <input
            v-model="newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入新密码"
            @input="clearErrors"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showNewPassword = !showNewPassword"
          >
            <iconify-icon
              :icon="showNewPassword ? 'heroicons:eye-slash' : 'heroicons:eye'"
              width="20"
            ></iconify-icon>
          </button>
        </div>
        <div v-if="errors.newPassword" class="error-message">
          {{ errors.newPassword }}
        </div>
      </div>

      <!-- 确认新密码 - 只有当前密码验证通过后才显示 -->
      <div class="form-group" v-if="currentPasswordVerified">
        <label class="form-label">确认新密码</label>
        <div class="input-wrapper">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请再次输入新密码"
            @input="clearErrors"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <iconify-icon
              :icon="showConfirmPassword ? 'heroicons:eye-slash' : 'heroicons:eye'"
              width="20"
            ></iconify-icon>
          </button>
        </div>
        <div v-if="errors.confirmPassword" class="error-message">
          {{ errors.confirmPassword }}
        </div>
      </div>

      <!-- 提交按钮 - 只有当前密码验证通过后才显示 -->
      <button
        v-if="currentPasswordVerified"
        class="submit-btn"
        :class="{ 'disabled': !canSubmit || isLoading }"
        :disabled="!canSubmit || isLoading"
        @click="handleSubmit"
      >
        {{ isLoading ? '修改中...' : '确认修改' }}
      </button>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单数据
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// 密码显示状态
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 加载状态
const isLoading = ref(false)

// 当前密码验证状态
const currentPasswordVerifying = ref(false)
const currentPasswordVerified = ref(false)
const currentPasswordError = ref(false)

// 错误信息
const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 清除错误信息
const clearErrors = () => {
  errors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

// 处理当前密码输入 - 移除自动验证
const handleCurrentPasswordInput = () => {
  // 清除之前的验证状态
  currentPasswordVerified.value = false
  currentPasswordError.value = false
  clearErrors()
}

// 验证当前密码 - 手动触发
const verifyCurrentPassword = async () => {
  if (!currentPassword.value) {
    errors.value.currentPassword = '请输入当前密码'
    return
  }

  if (currentPassword.value.length < 6) {
    errors.value.currentPassword = '密码长度至少6位'
    return
  }

  currentPasswordVerifying.value = true
  currentPasswordError.value = false
  clearErrors()

  try {
    // 检查所有可能的token存储位置
    const authStoreToken = authStore.token
    const yeyuToken = localStorage.getItem('yeyu_auth_token')
    const legacyToken = localStorage.getItem('token')
    const authToken = localStorage.getItem('auth_token')

    console.log('🔍 验证密码 - 完整Token检查:', {
      authStoreToken: authStoreToken ? `${authStoreToken.substring(0, 20)}...` : null,
      yeyuToken: yeyuToken ? `${yeyuToken.substring(0, 20)}...` : null,
      legacyToken: legacyToken ? `${legacyToken.substring(0, 20)}...` : null,
      authToken: authToken ? `${authToken.substring(0, 20)}...` : null,
      authStoreUser: authStore.user?.id,
      isAuthenticated: authStore.isAuthenticated
    })

    // 尝试多种token获取方式
    const token = authStoreToken || yeyuToken || legacyToken || authToken

    if (!token) {
      errors.value.currentPassword = '请先登录'
      console.error('❌ 没有找到任何有效的token')
      return
    }

    console.log('✅ 使用token:', token.substring(0, 20) + '...')

    // 使用专门的密码验证API
    const response = await fetch('http://localhost:8893/api/auth/verify-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        password: currentPassword.value
      })
    })

    const result = await response.json()

    console.log('🔍 验证密码响应:', {
      status: response.status,
      ok: response.ok,
      result
    })

    if (response.ok && result.success) {
      // 密码正确
      currentPasswordVerified.value = true
      currentPasswordError.value = false
      console.log('✅ 当前密码验证成功')
    } else {
      // 密码错误
      currentPasswordVerified.value = false
      currentPasswordError.value = true
      errors.value.currentPassword = result.error || '密码错误'
      console.log('❌ 当前密码验证失败:', result.error)
    }
  } catch (error) {
    console.error('验证密码失败:', error)
    currentPasswordError.value = true
    errors.value.currentPassword = '验证失败，请稍后重试'
  } finally {
    currentPasswordVerifying.value = false
  }
}

// 跳转到找回密码页面
const goToForgotPassword = () => {
  // 这里可以跳转到找回密码页面
  router.push('/forgot-password')
}

// 验证表单
const canSubmit = computed(() => {
  return currentPasswordVerified.value &&
         newPassword.value.length > 0 &&
         confirmPassword.value.length > 0
})

// 验证密码
const validatePasswords = () => {
  clearErrors()
  let isValid = true

  // 验证当前密码
  if (!currentPassword.value) {
    errors.value.currentPassword = '请输入当前密码'
    isValid = false
  }

  // 验证新密码
  if (!newPassword.value) {
    errors.value.newPassword = '请输入新密码'
    isValid = false
  } else if (newPassword.value.length < 6) {
    errors.value.newPassword = '密码长度至少6位'
    isValid = false
  }

  // 验证确认密码
  if (!confirmPassword.value) {
    errors.value.confirmPassword = '请确认新密码'
    isValid = false
  } else if (newPassword.value !== confirmPassword.value) {
    errors.value.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

// 提交修改
const handleSubmit = async () => {
  if (!validatePasswords()) {
    return
  }

  isLoading.value = true

  try {
    // 检查token是否存在
    const token = authStore.token || localStorage.getItem('yeyu_auth_token')
    console.log('🔍 修改密码 - Token检查:', {
      hasAuthStoreToken: !!authStore.token,
      hasLocalStorageToken: !!localStorage.getItem('yeyu_auth_token'),
      tokenLength: token?.length
    })

    if (!token) {
      alert('请先登录')
      return
    }

    // 调用API修改密码
    const response = await fetch('http://localhost:8893/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      // 修改成功
      alert('密码修改成功')
      router.back()
    } else {
      // 修改失败
      alert(result.error || '密码修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    alert('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.change-password {
  height: 100vh;
  background: #e5e5e5;
  padding: 20px 16px;
  overflow-y: auto;
}

.password-form {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: #333;
  margin: 0;
  font-weight: normal;
}

.input-wrapper {
  position: relative;
}

.verify-icon {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.verify-icon.success {
  color: #07C160;
}

.verify-icon.error {
  color: #ff4444;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 40px 0 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #07C160;
}

.form-input.success {
  border-color: #07C160;
  background-color: #f0f9f0;
}

.form-input.error {
  border-color: #ff4444;
  background-color: #fff5f5;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
}

.error-message {
  color: #ff4444;
  font-size: 13px;
  margin-top: 4px;
}

.success-message {
  color: #07C160;
  font-size: 13px;
  margin-top: 4px;
}

.forgot-password-btn {
  background: none;
  border: none;
  color: #07C160;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}

.forgot-password-btn:hover {
  text-decoration: underline;
}

.verify-section {
  margin-bottom: 20px;
}

.verify-btn {
  width: 100%;
  height: 44px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: normal;
  cursor: pointer;
  transition: background-color 0.2s;
}

.verify-btn:hover {
  background: #06AD56;
}

.verify-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  height: 44px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: normal;
  cursor: pointer;
  margin-top: 20px;
}

.submit-btn:hover {
  background: #06AD56;
}

.submit-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}


</style>
