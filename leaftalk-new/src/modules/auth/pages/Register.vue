<template>
  <div class="register-container">
    <div class="register-card">
      <div class="form-header">
        <h2>注册叶语账号</h2>
        <p>创建您的专属账号，开启家族连接之旅</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <!-- 手机号 -->
        <div class="form-group">
          <label for="phone">手机号</label>
          <input
            id="phone"
            v-model="phone"
            type="tel"
            placeholder="请输入11位手机号"
            maxlength="11"
            @input="handlePhoneInput"
            class="form-input"
            :class="{ 'error': phoneCheckStatus === 'error' }"
            required
          />
          <div v-if="phoneCheckMessage" class="check-message" :class="phoneCheckStatus">
            {{ phoneCheckMessage }}
          </div>
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码（6-20位）"
            minlength="6"
            maxlength="20"
            class="form-input"
            required
          />
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            class="form-input"
            required
          />
        </div>

        <!-- 昵称 -->
        <div class="form-group">
          <label for="nickname">昵称</label>
          <div class="nickname-group">
            <input
              id="nickname"
              v-model="nickname"
              type="text"
              placeholder="系统已为您生成昵称"
              maxlength="20"
              class="form-input"
            />
            <button type="button" @click="generateRandomNicknameHandler" class="generate-btn">
              换一个
            </button>
          </div>
          <div class="nickname-options">
            <span class="options-label">推荐昵称：</span>
            <button
              v-for="option in nicknameOptions"
              :key="option"
              type="button"
              @click="selectNickname(option)"
              class="nickname-option"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- 叶语号 -->
        <div class="form-group">
          <label for="yeyuId">叶语号</label>
          <div class="yeyu-id-group">
            <input
              id="yeyuId"
              v-model="generatedYeyuId"
              type="text"
              placeholder="系统自动生成"
              readonly
              class="form-input readonly"
            />
            <button type="button" @click="generateYeyuId" class="generate-btn">
              重新生成
            </button>
          </div>
        </div>

        <!-- 用户协议 -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              v-model="agreeToTerms"
              type="checkbox"
              class="checkbox"
              required
            />
            我已阅读并同意《用户协议》和《隐私政策》
          </label>
        </div>

        <!-- 注册按钮 -->
        <button 
          type="submit"
          :disabled="!canRegister" 
          class="register-btn"
          :class="{ 'loading': isRegistering }"
        >
          <span v-if="isRegistering">注册中...</span>
          <span v-else>注册</span>
        </button>
      </form>

      <!-- 登录链接 -->
      <div class="login-link">
        已有账号？<router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import { generateRandomNickname, generateNicknameOptions, validateNickname } from '@/utils/nicknameGenerator'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// 表单数据
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const nicknameOptions = ref([])
const generatedYeyuId = ref('')
const agreeToTerms = ref(false)
const isRegistering = ref(false)

// 手机号检查状态
const phoneCheckMessage = ref('')
const phoneCheckStatus = ref('')
const isPhoneAvailable = ref(false)
const isCheckingPhone = ref(false)

// 计算属性
const canRegister = computed(() => {
  return phone.value.length === 11 &&
         password.value.length >= 6 &&
         confirmPassword.value.length >= 6 &&
         generatedYeyuId.value &&
         agreeToTerms.value &&
         isPhoneAvailable.value &&
         !isRegistering.value
})

// 安全的Toast显示
const safeShowToast = async (message, type = 'info') => {
  try {
    if (appStore && typeof appStore.showToast === 'function') {
      appStore.showToast(message, type)
    } else {
      console.log(`Toast (${type}): ${message}`)
      const { showAlert } = await import('../utils/dialog')
      await showAlert(message, '提示')
    }
  } catch (error) {
    console.error('Toast显示失败:', error)
    const { showAlert } = await import('../utils/dialog')
    await showAlert(message, '提示')
  }
}

// 防抖函数
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 检查手机号可用性 - 优化速度
const checkPhoneAvailability = async (phoneNumber) => {
  if (phoneNumber.length !== 11) return

  try {
    const response = await fetch(`/api/users/check/${phoneNumber}`)
    const result = await response.json()

    // 快速更新结果
    if (result.exists) {
      phoneCheckMessage.value = '该手机号已注册，请直接登录'
      phoneCheckStatus.value = 'error'
      isPhoneAvailable.value = false
    } else {
      phoneCheckMessage.value = '手机号可用'
      phoneCheckStatus.value = 'success'
      isPhoneAvailable.value = true
    }
  } catch (error) {
    phoneCheckMessage.value = '检查失败，请重试'
    phoneCheckStatus.value = 'error'
    isPhoneAvailable.value = false
  } finally {
    isCheckingPhone.value = false
  }
}

// 防抖的手机号检查 - 进一步优化响应速度
const debouncedCheckPhone = debounce(checkPhoneAvailability, 100)

// 立即检查函数（无防抖）
const immediateCheckPhone = (phoneNumber) => {
  checkPhoneAvailability(phoneNumber)
}

// 手机号输入处理 - 优化即时反馈
const handlePhoneInput = (event) => {
  const target = event.target
  const phoneNumber = target.value

  // 只允许输入数字
  target.value = phoneNumber.replace(/\D/g, '')
  phone.value = target.value

  // 清除之前的检查结果
  isPhoneAvailable.value = false
  isCheckingPhone.value = false

  // 立即提供反馈，不等待防抖
  if (target.value.length === 11) {
    // 立即显示检查状态
    phoneCheckMessage.value = '正在检查...'
    phoneCheckStatus.value = 'checking'
    isCheckingPhone.value = true

    // 立即检查，无延迟
    immediateCheckPhone(target.value)
  } else if (target.value.length > 0 && target.value.length < 11) {
    phoneCheckMessage.value = '请输入11位手机号'
    phoneCheckStatus.value = 'warning'
  } else {
    phoneCheckMessage.value = ''
    phoneCheckStatus.value = ''
  }
}

// 生成随机昵称
const generateRandomNicknameHandler = () => {
  nickname.value = generateRandomNickname()
  // 同时更新推荐选项
  nicknameOptions.value = generateNicknameOptions(4)
}

// 选择推荐昵称
const selectNickname = (selectedNickname) => {
  nickname.value = selectedNickname
}

// 生成叶语号
const generateYeyuId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'YY'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  generatedYeyuId.value = result
}

// 处理注册
const handleRegister = async () => {
  if (!canRegister.value) return

  if (password.value !== confirmPassword.value) {
    safeShowToast('两次输入的密码不一致', 'error')
    return
  }

  isRegistering.value = true

  try {
    console.log('📝 开始注册流程...')
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: generatedYeyuId.value, // 使用生成的叶语号作为用户名
        nickname: nickname.value, // 使用生成的随机昵称
        password: password.value,
        phone: phone.value,
        email: null // 可选字段
      })
    })

    const result = await response.json()
    console.log('📝 注册响应:', result)

    if (result.success) {
      safeShowToast('注册成功！正在跳转...', 'success')
      
      // 保存认证信息
      localStorage.setItem('yeyu_auth_token', result.data.token)
      localStorage.setItem('yeyu_user_info', JSON.stringify(result.data.user))
      
      // 更新store状态
      if (authStore) {
        authStore.setUser(result.data.user)
        authStore.setToken(result.data.token)
      }

      // 直接跳转到实名认证
      setTimeout(() => {
        router.push('/identity-verification')
      }, 1500)

    } else {
      throw new Error(result.message || '注册失败')
    }

  } catch (error) {
    console.error('❌ 注册失败:', error)
    safeShowToast(error.message || '注册失败，请重试', 'error')
  } finally {
    isRegistering.value = false
  }
}

// 组件挂载时生成叶语号和昵称
onMounted(() => {
  generateYeyuId()
  generateRandomNicknameHandler()
})
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  color: #333;
  margin-bottom: 8px;
  font-size: 24px;
}

.form-header p {
  color: #666;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #07c160;
}

.form-input.error {
  border-color: #ff4757;
}

.form-input.readonly {
  background: #f5f5f5;
  color: #666;
}

.nickname-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nickname-group .form-input {
  flex: 1;
}

.nickname-options {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.options-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.nickname-option {
  padding: 4px 8px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.nickname-option:hover {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.yeyu-id-group {
  display: flex;
  gap: 8px;
}

.yeyu-id-group .form-input {
  flex: 1;
}

.generate-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.generate-btn:hover {
  background: #06a552;
}

.check-message {
  margin-top: 4px;
  font-size: 12px;
}

.check-message.success {
  color: #07c160;
}

.check-message.error {
  color: #ff4757;
}

.check-message.warning {
  color: #ffa502;
}

.check-message.checking {
  color: #3742fa;
  animation: pulse 0.8s ease-in-out infinite;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.02);
  }
}

.login-prompt {
  margin-top: 8px;
}

.login-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s;
}

.login-btn:hover {
  background: #06a552;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.checkbox {
  margin-right: 8px;
}

.register-btn {
  width: 100%;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 14px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.register-btn:hover:not(:disabled) {
  background: #06a552;
}

.register-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.register-btn.loading {
  background: #ccc;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #07c160;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
