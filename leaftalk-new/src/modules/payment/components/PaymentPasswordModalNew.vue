<template>
  <div class="payment-password-modal">
    <div class="modal-overlay" @click="$emit('cancel')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>请输入支付密码</h3>
          <button class="close-btn" @click="$emit('cancel')">
            <iconify-icon icon="material-symbols:close" width="20" />
          </button>
        </div>
        
        <div class="payment-info">
          <div class="amount-display">
            <span class="currency">¥</span>
            <span class="amount">{{ amount }}</span>
          </div>
          <div class="payment-desc">支付给叶语红包</div>
        </div>

        <div class="password-input">
          <div class="password-dots">
            <div
              v-for="i in 6"
              :key="i"
              class="password-dot"
              :class="{ filled: password.length >= i }"
            >
              <div v-if="password.length >= i" class="dot-fill"></div>
            </div>
          </div>
          
          <input
            ref="passwordInput"
            v-model="password"
            type="password"
            maxlength="6"
            class="hidden-input"
            @input="handleInput"
            @keyup.enter="handleConfirm"
          />
        </div>

        <div class="keypad">
          <div class="keypad-row" v-for="row in keypadLayout" :key="row.join('')">
            <button
              v-for="key in row"
              :key="key"
              class="keypad-btn"
              :class="{ 
                'delete-btn': key === 'delete',
                'confirm-btn': key === 'confirm'
              }"
              @click="handleKeypadClick(key)"
            >
              <iconify-icon v-if="key === 'delete'" icon="material-symbols:backspace" width="20" />
              <iconify-icon v-else-if="key === 'confirm'" icon="material-symbols:check" width="20" />
              <span v-else>{{ key }}</span>
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <div class="forgot-password">
            <a href="#" @click.prevent="handleForgotPassword">忘记密码？</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface Props {
  amount: string | number
}

const props = defineProps<Props>()

interface Emits {
  (e: 'confirm', password: string): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const password = ref('')
const passwordInput = ref<HTMLInputElement>()

// 键盘布局
const keypadLayout = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['delete', '0', 'confirm']
]

// 方法
const handleInput = () => {
  // 限制只能输入数字
  password.value = password.value.replace(/\D/g, '')
  
  // 自动确认
  if (password.value.length === 6) {
    handleConfirm()
  }
}

const handleKeypadClick = (key: string) => {
  if (key === 'delete') {
    password.value = password.value.slice(0, -1)
  } else if (key === 'confirm') {
    handleConfirm()
  } else if (password.value.length < 6) {
    password.value += key
    
    // 自动确认
    if (password.value.length === 6) {
      setTimeout(handleConfirm, 100)
    }
  }
}

const handleConfirm = () => {
  if (password.value.length === 6) {
    emit('confirm', password.value)
  }
}

const handleForgotPassword = () => {
  console.log('🔐 忘记密码')
  // 这里可以跳转到密码重置页面
}

// 生命周期
onMounted(() => {
  // 自动聚焦输入框
  nextTick(() => {
    passwordInput.value?.focus()
  })
})
</script>

<style scoped>
.payment-password-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-content {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 400px;
  padding: 24px;
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
  margin-bottom: 24px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.payment-info {
  text-align: center;
  margin-bottom: 32px;
}

.amount-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.currency {
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.amount {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.payment-desc {
  font-size: 14px;
  color: #666;
}

.password-input {
  position: relative;
  margin-bottom: 32px;
}

.password-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.password-dot {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.password-dot.filled {
  border-color: #07C160;
}

.dot-fill {
  width: 8px;
  height: 8px;
  background: #07C160;
  border-radius: 50%;
}

.hidden-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
}

.keypad {
  margin-bottom: 24px;
}

.keypad-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  justify-content: center;
}

.keypad-btn {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: #f8f8f8;
  font-size: 20px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.keypad-btn:hover {
  background: #e8e8e8;
  transform: scale(1.05);
}

.keypad-btn:active {
  transform: scale(0.95);
}

.keypad-btn.delete-btn {
  background: #f5f5f5;
  color: #666;
}

.keypad-btn.confirm-btn {
  background: #07C160;
  color: white;
}

.keypad-btn.confirm-btn:hover {
  background: #06a552;
}

.modal-footer {
  text-align: center;
}

.forgot-password a {
  color: #07C160;
  text-decoration: none;
  font-size: 14px;
}

.forgot-password a:hover {
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .modal-content {
    padding: 20px;
  }
  
  .keypad-btn {
    width: 50px;
    height: 50px;
    font-size: 18px;
  }
  
  .amount {
    font-size: 28px;
  }
}
</style>
