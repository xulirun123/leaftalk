<template>
  <div v-if="visible" class="payment-password-modal" @click="handleBackdropClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="close-btn" @click="close">
          <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="modal-description">{{ description }}</p>
        
        <!-- 密码输入框 -->
        <div class="password-input-container">
          <div class="password-dots">
            <div 
              v-for="i in 6" 
              :key="i" 
              class="password-dot"
              :class="{ filled: password.length >= i }"
            >
              <div v-if="password.length >= i" class="dot"></div>
            </div>
          </div>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <!-- 数字键盘 -->
        <div class="number-keyboard">
          <div class="keyboard-row">
            <button 
              v-for="num in [1, 2, 3]" 
              :key="num" 
              class="keyboard-btn number-btn"
              @click="inputNumber(num)"
            >
              {{ num }}
            </button>
          </div>
          <div class="keyboard-row">
            <button 
              v-for="num in [4, 5, 6]" 
              :key="num" 
              class="keyboard-btn number-btn"
              @click="inputNumber(num)"
            >
              {{ num }}
            </button>
          </div>
          <div class="keyboard-row">
            <button 
              v-for="num in [7, 8, 9]" 
              :key="num" 
              class="keyboard-btn number-btn"
              @click="inputNumber(num)"
            >
              {{ num }}
            </button>
          </div>
          <div class="keyboard-row">
            <div class="keyboard-btn empty"></div>
            <button class="keyboard-btn number-btn" @click="inputNumber(0)">0</button>
            <button class="keyboard-btn delete-btn" @click="deleteNumber">
              <iconify-icon icon="heroicons:backspace" width="20"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  visible: boolean
  title?: string
  description?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', password: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '请输入支付密码',
  description: '为了您的账户安全，请输入6位支付密码'
})

const emit = defineEmits<Emits>()

const password = ref('')
const errorMessage = ref('')

// 输入数字
const inputNumber = (num: number) => {
  if (password.value.length < 6) {
    password.value += num.toString()
    errorMessage.value = ''
    
    // 如果输入满6位，自动验证
    if (password.value.length === 6) {
      setTimeout(() => {
        verifyPassword()
      }, 200)
    }
  }
}

// 删除数字
const deleteNumber = () => {
  if (password.value.length > 0) {
    password.value = password.value.slice(0, -1)
    errorMessage.value = ''
  }
}

// 验证密码
const verifyPassword = async () => {
  try {
    // 获取已设置的支付密码
    const savedPassword = localStorage.getItem('yeyu_payment_password')

    // 这里应该调用API验证密码
    // 暂时用localStorage存储的密码或固定密码模拟
    if (password.value === savedPassword || password.value === '123456') {
      emit('confirm', password.value)
      close()
    } else {
      errorMessage.value = '支付密码错误，请重新输入'
      // 添加震动效果
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }
      // 清空密码并重新输入
      setTimeout(() => {
        password.value = ''
      }, 500)
    }
  } catch (error) {
    console.error('验证支付密码失败:', error)
    errorMessage.value = '验证失败，请重试'
    password.value = ''
  }
}

// 关闭弹窗
const close = () => {
  password.value = ''
  errorMessage.value = ''
  emit('update:visible', false)
  emit('cancel')
}

// 点击背景关闭
const handleBackdropClick = () => {
  close()
}

// 监听visible变化，重置状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    password.value = ''
    errorMessage.value = ''
  }
})
</script>

<style scoped>
.payment-password-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 400px;
  padding: 0;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 0 20px 20px 20px;
}

.modal-description {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 0 0 24px 0;
}

.password-input-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.password-dots {
  display: flex;
  gap: 12px;
}

.password-dot {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.password-dot.filled {
  border-color: #07C160;
  animation: fillDot 0.2s ease-out;
}

.dot {
  width: 8px;
  height: 8px;
  background: #07C160;
  border-radius: 50%;
  animation: showDot 0.2s ease-out;
}

@keyframes fillDot {
  from {
    transform: scale(0.8);
    border-color: #e0e0e0;
  }
  to {
    transform: scale(1);
    border-color: #07C160;
  }
}

@keyframes showDot {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.error-message {
  text-align: center;
  color: #ff4757;
  font-size: 14px;
  margin-bottom: 20px;
  min-height: 20px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.number-keyboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keyboard-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.keyboard-btn {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: #f8f8f8;
  color: #333;
  font-size: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.keyboard-btn:hover {
  background: #e8e8e8;
}

.keyboard-btn:active {
  background: #d8d8d8;
  transform: scale(0.95);
}

.keyboard-btn.empty {
  background: transparent;
  cursor: default;
}

.keyboard-btn.empty:hover {
  background: transparent;
}

.delete-btn {
  color: #666;
}
</style>
