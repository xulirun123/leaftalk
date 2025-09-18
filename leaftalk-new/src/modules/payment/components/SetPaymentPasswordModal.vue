<template>
  <div v-if="visible" class="set-payment-password-modal" @click="handleBackdropClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">设置支付密码</h3>
        <button class="close-btn" @click="close">
          <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
        </button>
      </div>
      
      <div class="modal-body">
        <!-- 设置步骤指示器 -->
        <div class="step-indicator">
          <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
            <div class="step-number">1</div>
            <span class="step-text">设置密码</span>
          </div>
          <div class="step-line" :class="{ active: currentStep > 1 }"></div>
          <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
            <div class="step-number">2</div>
            <span class="step-text">确认密码</span>
          </div>
        </div>

        <p class="modal-description">
          {{ currentStep === 1 ? '请设置6位数字支付密码' : '请再次输入密码确认' }}
        </p>
        
        <!-- 密码输入框 -->
        <div class="password-input-container">
          <div class="password-dots">
            <div 
              v-for="i in 6" 
              :key="i" 
              class="password-dot"
              :class="{ filled: currentPassword.length >= i }"
            >
              <div v-if="currentPassword.length >= i" class="dot"></div>
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

        <!-- 安全提示 -->
        <div class="security-tips">
          <h4 class="tips-title">安全提示</h4>
          <ul class="tips-list">
            <li>支付密码用于验证重要操作</li>
            <li>请设置不易被猜测的密码</li>
            <li>请妥善保管您的密码</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success', password: string): void
  (e: 'cancel'): void
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<Emits>()

const currentStep = ref(1)
const currentPassword = ref('')
const firstPassword = ref('')
const errorMessage = ref('')

// 输入数字
const inputNumber = (num: number) => {
  if (currentPassword.value.length < 6) {
    currentPassword.value += num.toString()
    errorMessage.value = ''
    
    // 如果输入满6位，自动进入下一步
    if (currentPassword.value.length === 6) {
      setTimeout(() => {
        if (currentStep.value === 1) {
          // 第一次输入完成，进入确认步骤
          firstPassword.value = currentPassword.value
          currentStep.value = 2
          currentPassword.value = ''
        } else {
          // 第二次输入完成，验证密码
          verifyPassword()
        }
      }, 200)
    }
  }
}

// 删除数字
const deleteNumber = () => {
  if (currentPassword.value.length > 0) {
    currentPassword.value = currentPassword.value.slice(0, -1)
    errorMessage.value = ''
  }
}

// 验证密码
const verifyPassword = () => {
  if (currentPassword.value === firstPassword.value) {
    // 密码设置成功
    emit('success', firstPassword.value)
    close()
  } else {
    // 密码不匹配，重新设置
    errorMessage.value = '两次输入的密码不一致，请重新设置'
    setTimeout(() => {
      currentStep.value = 1
      currentPassword.value = ''
      firstPassword.value = ''
      errorMessage.value = ''
    }, 1500)
  }
}

// 关闭弹窗
const close = () => {
  currentStep.value = 1
  currentPassword.value = ''
  firstPassword.value = ''
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
    currentStep.value = 1
    currentPassword.value = ''
    firstPassword.value = ''
    errorMessage.value = ''
  }
})
</script>

<style scoped>
.set-payment-password-modal {
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
  max-height: 90vh;
  overflow-y: auto;
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

/* 步骤指示器 */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: #07C160;
  color: white;
}

.step.completed .step-number {
  background: #07C160;
  color: white;
}

.step-text {
  font-size: 12px;
  color: #666;
  transition: color 0.3s ease;
}

.step.active .step-text {
  color: #07C160;
}

.step-line {
  width: 60px;
  height: 2px;
  background: #e0e0e0;
  margin: 0 16px;
  transition: background-color 0.3s ease;
}

.step-line.active {
  background: #07C160;
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
  margin-bottom: 24px;
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

/* 安全提示 */
.security-tips {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 3px solid #07C160;
}

.tips-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.tips-list {
  margin: 0;
  padding-left: 16px;
}

.tips-list li {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  line-height: 1.4;
}

.tips-list li:last-child {
  margin-bottom: 0;
}
</style>
