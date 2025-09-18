<template>
  <div class="change-pay-password">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      :show-back="true"
      @back="router.back()"
    />

    <!-- 支付密码修改表单 -->
    <div class="password-form">
      <!-- 当前支付密码 -->
      <div class="form-group">
        <label class="form-label">
          {{ hasPayPassword ? '当前支付密码' : '您还没有设置支付密码' }}
        </label>
        <div v-if="hasPayPassword" class="input-wrapper">
          <input
            v-model="currentPayPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入当前支付密码"
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
        </div>
        <div v-else class="info-message">
          请直接设置新的支付密码
        </div>
        <div v-if="errors.currentPayPassword" class="error-message">
          {{ errors.currentPayPassword }}
        </div>
      </div>

      <!-- 新支付密码 -->
      <div class="form-group">
        <label class="form-label">{{ hasPayPassword ? '新支付密码' : '设置支付密码' }}</label>
        <div class="input-wrapper">
          <input
            v-model="newPayPassword"
            :type="showNewPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入6位数字支付密码"
            maxlength="6"
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
        <div v-if="errors.newPayPassword" class="error-message">
          {{ errors.newPayPassword }}
        </div>
      </div>

      <!-- 确认新支付密码 -->
      <div class="form-group">
        <label class="form-label">确认支付密码</label>
        <div class="input-wrapper">
          <input
            v-model="confirmPayPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请再次输入支付密码"
            maxlength="6"
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
        <div v-if="errors.confirmPayPassword" class="error-message">
          {{ errors.confirmPayPassword }}
        </div>
      </div>

      <!-- 提交按钮 -->
      <button 
        class="submit-btn"
        :class="{ 'disabled': !canSubmit || isLoading }"
        :disabled="!canSubmit || isLoading"
        @click="handleSubmit"
      >
        {{ isLoading ? '设置中...' : (hasPayPassword ? '确认修改' : '确认设置') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const authStore = useAuthStore()

// 表单数据
const currentPayPassword = ref('')
const newPayPassword = ref('')
const confirmPayPassword = ref('')

// 密码显示状态
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 加载状态
const isLoading = ref(false)
const hasPayPassword = ref(false)

// 错误信息
const errors = ref({
  currentPayPassword: '',
  newPayPassword: '',
  confirmPayPassword: ''
})

// 清除错误信息
const clearErrors = () => {
  errors.value = {
    currentPayPassword: '',
    newPayPassword: '',
    confirmPayPassword: ''
  }
}

// 验证表单
const canSubmit = computed(() => {
  if (hasPayPassword.value) {
    return currentPayPassword.value.length > 0 && 
           newPayPassword.value.length > 0 && 
           confirmPayPassword.value.length > 0
  } else {
    return newPayPassword.value.length > 0 && 
           confirmPayPassword.value.length > 0
  }
})

// 验证密码
const validatePasswords = () => {
  clearErrors()
  let isValid = true

  // 验证当前支付密码（如果已设置）
  if (hasPayPassword.value && !currentPayPassword.value) {
    errors.value.currentPayPassword = '请输入当前支付密码'
    isValid = false
  }

  // 验证新支付密码
  if (!newPayPassword.value) {
    errors.value.newPayPassword = '请输入支付密码'
    isValid = false
  } else if (!/^\d{6}$/.test(newPayPassword.value)) {
    errors.value.newPayPassword = '支付密码必须是6位数字'
    isValid = false
  }

  // 验证确认支付密码
  if (!confirmPayPassword.value) {
    errors.value.confirmPayPassword = '请确认支付密码'
    isValid = false
  } else if (newPayPassword.value !== confirmPayPassword.value) {
    errors.value.confirmPayPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

// 检查是否已设置支付密码
const checkPayPasswordStatus = async () => {
  try {
    const response = await fetch('http://localhost:8893/api/payment/check-password', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    // 检查响应是否成功
    if (!response.ok) {
      console.error('API响应错误:', response.status, response.statusText)
      // 如果是404，说明API端点不存在
      if (response.status === 404) {
        console.error('支付API端点不存在，请检查后端服务')
      }
      return
    }

    // 检查响应内容类型
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API返回非JSON响应:', contentType)
      const text = await response.text()
      console.error('响应内容:', text.substring(0, 200))
      return
    }

    const result = await response.json()
    hasPayPassword.value = result.hasPayPassword || false
  } catch (error) {
    console.error('检查支付密码状态失败:', error)
    // 如果是JSON解析错误，提供更详细的信息
    if (error instanceof SyntaxError) {
      console.error('JSON解析失败，可能收到了HTML响应而不是JSON')
    }
  }
}

// 提交修改
const handleSubmit = async () => {
  if (!validatePasswords()) {
    return
  }

  isLoading.value = true

  try {
    // 统一使用 set-password 端点，后端会根据是否已有密码自动处理
    const endpoint = 'http://localhost:8893/api/payment/set-password'
    const body = {
      oldPassword: hasPayPassword.value ? currentPayPassword.value : undefined,
      newPassword: newPayPassword.value
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(body)
    })

    // 检查响应是否成功
    if (!response.ok) {
      console.error('API响应错误:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('错误响应内容:', errorText)
      alert('操作失败，请稍后重试')
      return
    }

    // 检查响应内容类型
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API返回非JSON响应:', contentType)
      alert('服务器响应格式错误')
      return
    }

    const result = await response.json()

    if (result.success) {
      // 设置/修改成功
      alert(result.message || (hasPayPassword.value ? '支付密码修改成功' : '支付密码设置成功'))
      router.back()
    } else {
      // 设置/修改失败
      if (result.error === '原支付密码错误') {
        errors.value.currentPayPassword = '当前支付密码错误'
      } else {
        alert(result.error || '操作失败')
      }
    }
  } catch (error) {
    console.error('操作失败:', error)
    if (error instanceof SyntaxError) {
      console.error('JSON解析失败，可能收到了HTML响应而不是JSON')
      alert('服务器响应格式错误，请检查后端服务')
    } else {
      alert('网络错误，请稍后重试')
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  checkPayPasswordStatus()
})
</script>

<style scoped>
.change-pay-password {
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

.form-label {
  display: block;
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
  font-weight: normal;
}

.input-wrapper {
  position: relative;
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

.info-message {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
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
