<template>
  <div class="payment-auth-page">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1 class="title">身份验证</h1>
      <div class="header-spacer"></div>
    </div>

    <!-- 身份验证内容 -->
    <div class="auth-content">
      <!-- 检查密码状态 -->
      <div v-if="loading" class="loading">
        <div class="auth-icon">
          <iconify-icon icon="heroicons:arrow-path" width="80" style="color: #07c160;" class="spin"></iconify-icon>
        </div>
        <div class="auth-title">正在检查密码设置...</div>
      </div>

      <!-- 没有设置密码 -->
      <div v-else-if="!hasAnyPassword" class="no-password">
        <div class="auth-icon">
          <iconify-icon icon="heroicons:shield-exclamation" width="80" style="color: #ff9500;"></iconify-icon>
        </div>
        <div class="auth-title">需要设置支付密码</div>
        <div class="auth-desc">首次使用服务功能，请先设置支付密码</div>
        
        <div class="action-buttons">
          <button @click="goToSetPassword" class="primary-btn">
            设置支付密码
          </button>
        </div>
      </div>

      <!-- 有密码，进行验证 -->
      <div v-else class="has-password">
        <div class="auth-icon">
          <iconify-icon icon="heroicons:shield-check" width="80" style="color: #07c160;"></iconify-icon>
        </div>
        
        <div class="auth-title">请输入支付密码</div>
        <div class="auth-desc">验证身份后可使用服务功能</div>

        <!-- 数字密码显示区域 -->
        <div class="password-display">
          <div
            v-for="i in 6"
            :key="i"
            class="password-dot"
            :class="{ filled: paymentPassword.length >= i }"
          ></div>
        </div>
        
        <div class="test-hint">测试密码：123456</div>
        
        <!-- 显示键盘按钮 -->
        <div class="keyboard-trigger">
          <button @click="showKeyboardInput" class="keyboard-btn">
            输入密码
          </button>
        </div>
      </div>
    </div>

    <!-- 数字键盘弹窗 -->
    <div v-if="showKeyboard" class="keyboard-overlay" @click="hideKeyboard">
      <div class="keyboard-container" @click.stop>
        <div class="keyboard-header">
          <span>输入支付密码</span>
          <button @click="hideKeyboard" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>
        
        <div class="keyboard-grid">
          <button
            v-for="num in [1,2,3,4,5,6,7,8,9]"
            :key="num"
            class="keyboard-btn"
            @click="inputNumber(num)"
          >
            {{ num }}
          </button>
          <button class="keyboard-btn keyboard-empty"></button>
          <button
            class="keyboard-btn"
            @click="inputNumber(0)"
          >
            0
          </button>
          <button
            class="keyboard-btn keyboard-delete"
            @click="deleteNumber"
          >
            <iconify-icon icon="heroicons:backspace" width="20"></iconify-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 错误对话框 -->
    <div v-if="showErrorDialog" class="error-dialog-overlay" @click="closeErrorDialog">
      <div class="error-dialog" @click.stop>
        <div class="error-icon">
          <iconify-icon icon="heroicons:exclamation-triangle" width="48" style="color: #ff4444;"></iconify-icon>
        </div>
        <div class="error-title">密码错误</div>
        <div class="error-message">支付密码不正确，请重试</div>
        
        <div class="error-actions">
          <button @click="retryPassword" class="retry-btn">重试</button>
          <button @click="forgotPassword" class="forgot-btn">忘记密码</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(true)
const hasAnyPassword = ref(false)
const paymentPassword = ref('')
const showKeyboard = ref(false)
const showErrorDialog = ref(false)

// 检查密码设置状态
const checkPasswordStatus = async () => {
  try {
    const response = await fetch('http://localhost:8893/api/payment/check-password', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    if (response.ok) {
      const result = await response.json()
      hasAnyPassword.value = result.hasPayPassword || false
      console.log('密码状态检查结果:', result)
    } else if (response.status === 403) {
      // Token无效，跳转到登录页面
      console.error('Token无效，跳转到登录页面')
      router.push('/login')
      return
    } else {
      console.warn('检查密码状态失败，状态码:', response.status)
      hasAnyPassword.value = false
    }
  } catch (error) {
    console.error('检查密码状态失败:', error)
    hasAnyPassword.value = false
  } finally {
    loading.value = false
  }
}

// 方法
const goBack = () => {
  router.back()
}

const goToSetPassword = () => {
  router.push('/settings/pay-password-style')
}

const showKeyboardInput = () => {
  showKeyboard.value = true
}

const hideKeyboard = () => {
  showKeyboard.value = false
}

const inputNumber = (num: number) => {
  if (paymentPassword.value.length < 6) {
    paymentPassword.value += num.toString()
    
    // 如果输入完6位，自动验证
    if (paymentPassword.value.length === 6) {
      setTimeout(() => {
        verifyPassword()
      }, 200)
    }
  }
}

const deleteNumber = () => {
  paymentPassword.value = paymentPassword.value.slice(0, -1)
}

const verifyPassword = async () => {
  try {
    const response = await fetch('http://localhost:8893/api/payment/verify-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ password: paymentPassword.value })
    })
    
    const result = await response.json()
    
    if (response.ok && result.valid) {
      // 验证成功，跳转到服务页面
      console.log('密码验证成功')
      hideKeyboard()
      router.push('/services')
    } else {
      // 验证失败
      console.log('密码验证失败')
      showErrorDialog.value = true
      paymentPassword.value = ''
    }
  } catch (error) {
    console.error('验证密码失败:', error)
    showErrorDialog.value = true
    paymentPassword.value = ''
  }
}

const closeErrorDialog = () => {
  showErrorDialog.value = false
}

const retryPassword = () => {
  showErrorDialog.value = false
  paymentPassword.value = ''
}

const forgotPassword = () => {
  showErrorDialog.value = false
  router.push('/settings/pay-password-options')
}

// 生命周期
onMounted(() => {
  checkPasswordStatus()
})
</script>

<style scoped>
.payment-auth-page {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-spacer {
  width: 40px;
}

.auth-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.auth-icon {
  margin-bottom: 24px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.auth-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.auth-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}

.password-display {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.password-dot {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  background: white;
  transition: all 0.2s;
}

.password-dot.filled {
  background: #07c160;
  border-color: #07c160;
}

.test-hint {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.action-buttons, .keyboard-trigger {
  width: 100%;
  max-width: 300px;
}

.primary-btn, .keyboard-btn {
  width: 100%;
  padding: 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-btn:hover, .keyboard-btn:hover {
  background: #06ad56;
}

/* 键盘样式 */
.keyboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.keyboard-container {
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
}

.keyboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.keyboard-grid .keyboard-btn {
  aspect-ratio: 1;
  border-radius: 8px;
  font-size: 24px;
  font-weight: 600;
  background: #f5f5f5;
  color: #333;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.keyboard-grid .keyboard-btn:hover {
  background: #e0e0e0;
}

.keyboard-empty {
  background: transparent !important;
  cursor: default !important;
}

.keyboard-delete {
  background: #ff4444 !important;
  color: white !important;
}

.keyboard-delete:hover {
  background: #e63939 !important;
}

/* 错误对话框 */
.error-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.error-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 20px;
  text-align: center;
  max-width: 300px;
  width: 100%;
}

.error-icon {
  margin-bottom: 16px;
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.error-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

.error-actions {
  display: flex;
  gap: 12px;
}

.retry-btn, .forgot-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.retry-btn {
  background: #07c160;
  color: white;
}

.forgot-btn {
  background: #f5f5f5;
  color: #666;
}
</style>
