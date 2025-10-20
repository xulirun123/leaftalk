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

    <!-- 付款方式选择面板（独立弹出） -->
    <div v-if="showPaymentMethods" class="payment-methods-overlay" @click="showPaymentMethods = false">
      <div class="payment-methods-panel" @click.stop>
        <div class="panel-header">
          <h3 class="panel-title">选择付款方式</h3>
          <button class="panel-close-btn" @click="showPaymentMethods = false">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="panel-body">
          <!-- 付款方式列表 -->
          <div class="payment-methods-list">
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="payment-method-item"
              :class="{ active: selectedMethod.id === method.id }"
              @click="selectPaymentMethod(method)"
            >
              <div class="method-icon">
                <iconify-icon
                  :icon="method.icon"
                  width="24"
                  :style="{ color: method.color }"
                ></iconify-icon>
              </div>
              <div class="method-info">
                <div class="method-name">{{ method.name }}</div>
                <div v-if="method.cardNumber" class="method-detail">
                  {{ method.cardNumber }}
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

          <!-- 添加银行卡按钮 -->
          <div class="add-card-section">
            <button class="add-card-btn" @click="handleAddCard">
              <iconify-icon icon="heroicons:plus-circle" width="20"></iconify-icon>
              <span>添加银行卡</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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

// 选择付款方式
const selectPaymentMethod = (method: PaymentMethod) => {
  selectedMethod.value = method
  showPaymentMethods.value = false
}

// 添加银行卡
const handleAddCard = () => {
  showPaymentMethods.value = false
  // TODO: 跳转到添加银行卡页面
  console.log('添加银行卡')
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

/* 付款方式选择面板（独立弹出） */
.payment-methods-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.payment-methods-panel {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.panel-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #999;
  transition: all 0.2s;
}

.panel-close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.payment-methods-list {
  padding: 0;
}

.payment-method-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.payment-method-item:last-child {
  border-bottom: none;
}

.payment-method-item:hover {
  background: #f8f8f8;
}

.payment-method-item.active {
  background: #f0f9f4;
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

/* 添加银行卡 */
.add-card-section {
  padding: 16px 20px;
  border-top: 8px solid #f5f5f5;
}

.add-card-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #07C160;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-card-btn:hover {
  background: #f8f8f8;
  border-color: #07C160;
}

.add-card-btn:active {
  transform: scale(0.98);
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
