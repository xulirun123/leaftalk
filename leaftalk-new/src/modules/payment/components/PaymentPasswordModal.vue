<template>
  <div v-if="visible" class="payment-password-modal" @click.stop>
    <div class="modal-content" @click.stop>
      <div class="modal-body">
        <!-- 红包金额显示 -->
        <div class="redpacket-amount">
          <div class="amount-label">叶语红包</div>
          <div class="amount-value">¥{{ amount }}</div>
          <button class="close-btn" @click="close">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <!-- 付款方式 -->
        <div class="payment-method-section">
          <div class="payment-method-header">
            <span class="method-label">付款方式</span>
            <button class="change-method-btn" @click="showPaymentMethods = !showPaymentMethods">
              更改
              <iconify-icon
                :icon="showPaymentMethods ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                width="16"
              ></iconify-icon>
            </button>
          </div>

          <!-- 当前选择的付款方式 -->
          <div class="current-payment-method">
            <div class="method-icon">
              <iconify-icon
                :icon="selectedMethod.icon"
                width="24"
                :style="{ color: selectedMethod.color }"
              ></iconify-icon>
            </div>
            <div class="method-info">
              <div class="method-name">{{ selectedMethod.name }}</div>
              <div v-if="selectedMethod.cardNumber" class="method-detail">
                {{ selectedMethod.cardNumber }}
              </div>
            </div>
          </div>
        </div>

        <!-- 密码输入框 -->
        <div class="password-section">
          <div class="password-label">请输入支付密码</div>
          <div class="password-input-container">
            <div class="password-boxes">
              <div
                v-for="i in 6"
                :key="i"
                class="password-box"
              >
                <div v-if="password.length >= i" class="dot"></div>
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- 数字键盘 -->
      <div class="keyboard-section">
        <div class="keyboard-grid">
          <button
            v-for="(key, index) in keyboardKeys"
            :key="index"
            class="keyboard-key"
            :class="{
              'key-delete': key === 'delete',
              'key-dot': key === '.',
              'key-confirm': key === 'confirm'
            }"
            @click="handleKeyPress(key)"
          >
            <iconify-icon v-if="key === 'delete'" icon="heroicons:backspace" width="24"></iconify-icon>
            <span v-else-if="key === 'confirm'">确认</span>
            <span v-else>{{ key }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 选择付款方式弹窗 -->
    <transition name="slide-up">
      <div v-if="showPaymentMethods" class="payment-method-modal">
        <div class="payment-modal-overlay" @click="showPaymentMethods = false"></div>
        <div class="payment-modal-content">
          <!-- 头部 -->
          <div class="payment-modal-header">
            <button class="back-btn" @click="showPaymentMethods = false">
              <iconify-icon icon="heroicons:chevron-down" width="24"></iconify-icon>
            </button>
            <h3 class="payment-modal-title">选择付款方式</h3>
          </div>

          <!-- 内容 -->
          <div class="payment-modal-body">
            <!-- 零钱 -->
            <div class="balance-item" @click="selectPaymentMethod(paymentMethods[0])">
              <div class="balance-left">
                <iconify-icon icon="heroicons:wallet" width="24" style="color: #07C160;"></iconify-icon>
                <span class="balance-text">零钱</span>
              </div>
              <div class="balance-right">
                <span class="balance-amount">¥{{ walletBalance }}</span>
                <iconify-icon
                  v-if="selectedMethod.id === 'balance'"
                  icon="heroicons:check-circle-solid"
                  width="20"
                  style="color: #07C160;"
                ></iconify-icon>
              </div>
            </div>

            <!-- 银行卡标题 -->
            <div class="bank-card-title">银行卡</div>

            <!-- 银行卡列表 -->
            <div class="bank-card-list">
              <div
                v-for="method in bankCards"
                :key="method.id"
                class="bank-card-item"
                @click="selectPaymentMethod(method)"
              >
                <div class="card-left">
                  <iconify-icon icon="heroicons:credit-card" width="24" :style="{ color: method.color }"></iconify-icon>
                  <div class="card-info">
                    <div class="card-name">{{ method.name }}</div>
                    <div class="card-number">{{ method.cardNumber }}</div>
                  </div>
                </div>
                <iconify-icon
                  v-if="selectedMethod.id === method.id"
                  icon="heroicons:check-circle-solid"
                  width="20"
                  style="color: #07C160;"
                ></iconify-icon>
              </div>
            </div>

            <!-- 添加银行卡 -->
            <div class="add-bank-card-item" @click="handleAddCard">
              <iconify-icon icon="heroicons:plus-circle" width="24" style="color: #07C160;"></iconify-icon>
              <span class="add-card-text">添加银行卡</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface PaymentMethod {
  id: string
  name: string
  icon: string
  color: string
  cardNumber?: string
}

interface Props {
  visible: boolean
  amount: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', password: string, paymentMethodId: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const password = ref('')
const errorMessage = ref('')
const showPaymentMethods = ref(false)

// 付款方式列表
const paymentMethods = ref<PaymentMethod[]>([
  {
    id: 'balance',
    name: '零钱',
    icon: 'heroicons:wallet',
    color: '#07C160'
  },
  {
    id: 'icbc',
    name: '工商银行储蓄卡',
    icon: 'heroicons:credit-card',
    color: '#C8102E',
    cardNumber: '(1234)'
  },
  {
    id: 'ccb',
    name: '建设银行储蓄卡',
    icon: 'heroicons:credit-card',
    color: '#003399',
    cardNumber: '(5678)'
  },
  {
    id: 'abc',
    name: '农业银行储蓄卡',
    icon: 'heroicons:credit-card',
    color: '#00A550',
    cardNumber: '(9012)'
  }
])

// 当前选择的付款方式
const selectedMethod = ref<PaymentMethod>(paymentMethods.value[0])

// 钱包余额
const walletBalance = ref('1580.50')

// 银行卡列表（不包括零钱）
const bankCards = computed(() => paymentMethods.value.filter(m => m.id !== 'balance'))

// 选择付款方式
const selectPaymentMethod = (method: PaymentMethod) => {
  selectedMethod.value = method
  showPaymentMethods.value = false
}

// 添加银行卡
const handleAddCard = () => {
  showPaymentMethods.value = false
  // 跳转到添加银行卡页面
  window.location.href = '/#/payment/add-bank-card'
}

// 数字键盘按键 (4行4列)
const keyboardKeys = [
  '1', '2', '3', 'delete',
  '4', '5', '6', 'confirm',
  '7', '8', '9',
  '0', '.'
]

// 处理按键
const handleKeyPress = (key: string) => {
  if (key === 'confirm') {
    verifyPassword()
  } else if (key === 'delete') {
    if (password.value.length > 0) {
      password.value = password.value.slice(0, -1)
      errorMessage.value = ''
    }
  } else {
    // 数字键
    if (password.value.length < 6) {
      password.value += key
      errorMessage.value = ''

      // 如果输入满6位，自动验证
      if (password.value.length === 6) {
        setTimeout(() => {
          verifyPassword()
        }, 200)
      }
    }
  }
}

// 验证密码
const verifyPassword = async () => {
  // 检查密码长度
  if (password.value.length !== 6) {
    errorMessage.value = '请输入6位支付密码'
    return
  }

  try {
    // 获取已设置的支付密码
    const savedPassword = localStorage.getItem('yeyu_payment_password')

    // 这里应该调用API验证密码
    // 暂时用localStorage存储的密码或固定密码模拟
    if (password.value === savedPassword || password.value === '123456') {
      emit('confirm', password.value, selectedMethod.value.id)
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
  showPaymentMethods.value = false
  emit('update:visible', false)
  emit('cancel')
}

// 监听visible变化，重置状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    password.value = ''
    errorMessage.value = ''
    showPaymentMethods.value = false
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

.modal-body {
  padding: 0;
}

/* 红包金额显示 */
.redpacket-amount {
  position: relative;
  text-align: center;
  padding: 20px 20px 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.amount-label {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.amount-value {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #999;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

/* 付款方式 */
.payment-method-section {
  position: relative;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.payment-method-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.method-label {
  font-size: 14px;
  color: #666;
}

.change-method-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #07C160;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.change-method-btn:hover {
  background: #f0f0f0;
}

.current-payment-method {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

/* 选择付款方式弹窗 */
.payment-method-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
}

.payment-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.payment-modal-content {
  position: relative;
  width: 100%;
  max-height: 80vh;
  background: white;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
}

.payment-modal-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.back-btn {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.payment-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* 零钱项 */
.balance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0 20px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.balance-item:active {
  background: #f8f8f8;
}

.balance-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.balance-text {
  font-size: 15px;
  color: #333;
}

.balance-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-amount {
  font-size: 14px;
  color: #999;
}

/* 银行卡标题 */
.bank-card-title {
  height: 25px;
  line-height: 25px;
  padding: 0 20px;
  font-size: 13px;
  color: #999;
  background: #f5f5f5;
  margin-top: 8px;
}

/* 银行卡列表 */
.bank-card-list {
  padding: 0;
}

.bank-card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.bank-card-item:last-child {
  border-bottom: none;
}

.bank-card-item:active {
  background: #f8f8f8;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-name {
  font-size: 15px;
  color: #333;
}

.card-number {
  font-size: 13px;
  color: #999;
}

/* 添加银行卡 */
.add-bank-card-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.2s;
  border-top: 8px solid #f5f5f5;
}

.add-bank-card-item:active {
  background: #f8f8f8;
}

.add-card-text {
  font-size: 15px;
  color: #07C160;
  font-weight: 500;
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-active .payment-modal-content,
.slide-up-leave-active .payment-modal-content {
  transition: transform 0.3s ease;
}

.slide-up-enter-from .payment-modal-overlay,
.slide-up-leave-to .payment-modal-overlay {
  opacity: 0;
}

.slide-up-enter-from .payment-modal-content,
.slide-up-leave-to .payment-modal-content {
  transform: translateY(100%);
}

.method-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 6px;
}

.method-info {
  flex: 1;
}

.method-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.method-detail {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* 密码输入 */
.password-section {
  padding: 16px 20px;
}

.password-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  text-align: center;
}

.password-input-container {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.password-boxes {
  display: flex;
  gap: 8px;
}

.password-box {
  width: 40px;
  height: 40px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: all 0.2s ease;
}

.password-box:has(.dot) {
  border-color: #07C160;
}

.dot {
  width: 10px;
  height: 10px;
  background: #333;
  border-radius: 50%;
  animation: showDot 0.2s ease-out;
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

/* 数字键盘 */
.keyboard-section {
  padding: 16px;
  background: #f5f5f5;
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 56px);
  gap: 10px;
}

.keyboard-key {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;

  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);

  &:active {
    background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.1),
      inset 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateY(1px);
  }

  &.key-delete {
    background: linear-gradient(180deg, #ff7b7b 0%, #ff5252 100%);
    border-color: #ff4444;
    color: #fff;
    box-shadow:
      0 2px 4px rgba(255, 82, 82, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);

    &:active {
      background: linear-gradient(180deg, #ff5252 0%, #ff3838 100%);
      box-shadow:
        0 1px 2px rgba(255, 82, 82, 0.2),
        inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  &.key-dot {
    font-size: 32px;
    font-weight: 700;
  }

  &.key-confirm {
    grid-row: span 3;
    background: linear-gradient(180deg, #09d66f 0%, #07C160 100%);
    border-color: #06ad56;
    color: #fff;
    font-size: 17px;
    font-weight: 700;
    box-shadow:
      0 3px 6px rgba(7, 193, 96, 0.3),
      0 1px 3px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);

    &:active {
      background: linear-gradient(180deg, #07C160 0%, #06ad56 100%);
      box-shadow:
        0 1px 3px rgba(7, 193, 96, 0.2),
        inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
