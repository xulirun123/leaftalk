<template>
  <div class="send-redpacket-page">
    <div class="content">
      <!-- 红包类型选择（仅群聊显示） -->
      <div v-if="isGroup" class="type-selector">
        <button
          :class="['type-button', { active: redPacketType === 'normal' }]"
          @click="redPacketType = 'normal'"
        >
          普通红包
        </button>
        <button
          :class="['type-button', { active: redPacketType === 'lucky' }]"
          @click="redPacketType = 'lucky'"
        >
          拼手气红包
        </button>
      </div>

      <!-- 金额输入 -->
      <div class="input-group">
        <div class="amount-wrapper">
          <span class="label-text">金额</span>
          <div class="amount-right">
            <span class="currency">¥</span>
            <input
              v-model="amountInput"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              class="amount-input"
              @input="handleAmountInput"
              @focus="handleAmountFocus"
            />
          </div>
        </div>
      </div>

      <!-- 红包个数（仅群聊拼手气红包） -->
      <div v-if="isGroup && redPacketType === 'lucky'" class="input-group">
        <input
          v-model.number="count"
          type="number"
          min="1"
          max="100"
          placeholder="红包个数"
          class="count-input"
        />
      </div>

      <!-- 祝福语 -->
      <div class="input-group">
        <input
          v-model="customBlessing"
          type="text"
          maxlength="50"
          :placeholder="defaultBlessing"
          class="blessing-input"
          @focus="handleBlessingFocus"
        />
      </div>

      <!-- 总金额显示 -->
      <div v-if="amount > 0" class="total-amount-display">
        ¥{{ totalAmount.toFixed(2) }}
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- 发送按钮 -->
      <button
        class="send-button"
        :class="{ disabled: !canSend }"
        :disabled="!canSend || isSending"
        @click="handleSend"
      >
        {{ isSending ? '发送中...' : '塞钱进红包' }}
      </button>
    </div>

    <!-- 支付密码弹窗 -->
    <div v-if="showPaymentModal" class="payment-modal-overlay" @click="closePaymentModal">
      <div class="payment-modal" @click.stop>
        <!-- 关闭按钮 -->
        <button class="close-button" @click="closePaymentModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- 标题 -->
        <div class="modal-title">叶语红包</div>

        <!-- 金额显示 -->
        <div class="modal-amount">¥{{ totalAmount.toFixed(2) }}</div>

        <!-- 付款方式 -->
        <div class="payment-method" @click="showPaymentMethodPicker = true">
          <span class="method-label">付款方式</span>
          <div class="method-value">
            <span>{{ selectedPaymentMethod.name }}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 6l4 4 4-4z"/>
            </svg>
          </div>
        </div>

        <!-- 密码输入 -->
        <div class="password-section">
          <div class="password-label">请输入支付密码</div>
          <div class="password-dots">
            <div v-for="i in 6" :key="i" class="password-dot" :class="{ filled: paymentPassword.length >= i }">
              <div v-if="paymentPassword.length >= i" class="dot"></div>
            </div>
          </div>
        </div>

        <!-- 数字键盘 -->
        <div class="number-keyboard">
          <div class="keyboard-row" v-for="row in [['1','2','3'],['4','5','6'],['7','8','9']]" :key="row.join()">
            <button v-for="num in row" :key="num" class="key-button" @click="inputPassword(num)">
              {{ num }}
            </button>
          </div>
          <div class="keyboard-row">
            <button class="key-button empty"></button>
            <button class="key-button" @click="inputPassword('0')">0</button>
            <button class="key-button delete" @click="deletePassword">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 付款方式选择器 -->
    <div v-if="showPaymentMethodPicker" class="picker-overlay" @click="showPaymentMethodPicker = false">
      <div class="picker-modal" @click.stop>
        <div class="picker-header">
          <span>选择付款方式</span>
          <button @click="showPaymentMethodPicker = false">完成</button>
        </div>
        <div class="picker-list">
          <div
            v-for="method in paymentMethods"
            :key="method.id"
            class="picker-item"
            :class="{ selected: selectedPaymentMethod?.id === method.id }"
            @click="selectPaymentMethod(method)"
          >
            <span>{{ method.name }}</span>
            <svg v-if="selectedPaymentMethod?.id === method.id" width="20" height="20" viewBox="0 0 20 20" fill="#07C160">
              <path d="M7 10l2 2 4-4"/>
            </svg>
          </div>
          <!-- 添加银行账户按钮 -->
          <div class="picker-item add-card-btn" @click="addBankCard">
            <span style="color: #07C160;">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#07C160" style="vertical-align: middle; margin-right: 8px;">
                <path d="M10 4v12M4 10h12" stroke="#07C160" stroke-width="2" stroke-linecap="round"/>
              </svg>
              添加银行账户
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 密码错误弹窗 -->
    <div v-if="showPasswordError" class="error-overlay" @click="showPasswordError = false">
      <div class="error-dialog" @click.stop>
        <div class="error-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="28" stroke="#ff4d4f" stroke-width="3"/>
            <line x1="20" y1="20" x2="40" y2="40" stroke="#ff4d4f" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="20" x2="20" y2="40" stroke="#ff4d4f" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="error-title">支付密码错误</div>
        <div class="error-message">请重试</div>
        <div class="error-buttons">
          <button class="error-btn secondary" @click="forgotPassword">忘记密码</button>
          <button class="error-btn primary" @click="retryPassword">重试</button>
        </div>
      </div>
    </div>

    <!-- 红包封面 -->
    <div v-if="showRedPacketCover" class="redpacket-cover-overlay">
      <div class="redpacket-cover">
        <div class="cover-header">
          <div class="sender-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sender" alt="发送者头像" />
          </div>
          <div class="sender-name">我</div>
          <div class="cover-blessing">{{ displayBlessing }}</div>
        </div>
        <div class="cover-body">
          <div class="redpacket-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="#FFD700">
              <circle cx="40" cy="40" r="35"/>
              <text x="40" y="50" text-anchor="middle" font-size="40" fill="#D4380D">¥</text>
            </svg>
          </div>
          <div class="cover-amount">¥{{ totalAmount.toFixed(2) }}</div>
          <div class="cover-type">{{ redPacketType === 'normal' ? '普通红包' : '拼手气红包' }}</div>
        </div>
        <div class="cover-footer">
          <div class="success-text">红包已发送</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiClient } from '@/shared/services/apiClient'

const router = useRouter()
const route = useRoute()

// 路由参数
const receiverId = ref<string>('')
const receiverName = ref<string>('')
const chatId = ref<string>('')
const isGroup = ref(false)

// 表单数据
const redPacketType = ref<'normal' | 'lucky'>('normal')
const amount = ref<number>(0)
const count = ref<number>(1)
const customBlessing = ref<string>('') // 用户自定义的祝福语
const defaultBlessing = '恭喜发财，大吉大利'

// 状态
const isSending = ref(false)
const errorMessage = ref<string>('')
const balance = ref<number>(1000) // 模拟余额
const amountInput = ref<string>('0.00') // 金额输入字符串

// 支付相关
const showPaymentModal = ref<boolean>(false)
const showPaymentMethodPicker = ref<boolean>(false)
const showPasswordError = ref<boolean>(false)
const showRedPacketCover = ref<boolean>(false)
const paymentPassword = ref<string>('')
const paymentMethods = ref<any[]>([])
const selectedPaymentMethod = ref<any>(null)

// 显示的祝福语（用于发送）
const displayBlessing = computed(() => {
  return customBlessing.value || defaultBlessing
})

// 计算总金额
const totalAmount = computed(() => {
  if (redPacketType.value === 'normal') {
    return amount.value
  } else {
    return amount.value * count.value
  }
})

// 是否可以发送
const canSend = computed(() => {
  if (amount.value <= 0) return false
  if (redPacketType.value === 'lucky' && count.value < 1) return false
  if (totalAmount.value > balance.value) return false
  return true
})

// 返回
const handleBack = () => {
  router.back()
}

// 处理金额输入
const handleAmountInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value

  // 只允许数字和小数点
  value = value.replace(/[^\d.]/g, '')

  // 只允许一个小数点
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }

  // 限制小数点后两位
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2)
  }

  amountInput.value = value

  // 更新实际金额
  const num = parseFloat(value)
  amount.value = isNaN(num) ? 0 : num

  errorMessage.value = ''
}

// 处理金额输入框聚焦
const handleAmountFocus = (event: FocusEvent) => {
  const input = event.target as HTMLInputElement
  // 如果是默认值 0.00，聚焦时清空
  if (amountInput.value === '0.00' || amount.value === 0) {
    amountInput.value = ''
  } else {
    // 全选文本，方便直接替换
    setTimeout(() => {
      input.select()
    }, 0)
  }
}

// 处理祝福语输入框聚焦
const handleBlessingFocus = (event: FocusEvent) => {
  const input = event.target as HTMLInputElement
  // 聚焦时光标移到最左侧
  setTimeout(() => {
    input.setSelectionRange(0, 0)
  }, 0)
}

// 发送红包 - 打开支付弹窗
const handleSend = async () => {
  if (!canSend.value || isSending.value) return

  errorMessage.value = ''

  // ✅ 检查实名认证状态
  try {
    const response = await apiClient.get('/user/verification-status')
    if (!response.success || !response.data.isVerified) {
      const confirmed = confirm('使用红包功能需要先完成实名认证，是否立即认证？')
      if (confirmed) {
        router.push('/real-name-verification')
      }
      return
    }
  } catch (error) {
    console.error('❌ 检查实名认证状态失败:', error)
    errorMessage.value = '检查实名认证状态失败，请稍后重试'
    return
  }

  // 验证金额
  if (amount.value < 0.01) {
    errorMessage.value = '单个红包金额不能少于0.01元'
    return
  }

  if (totalAmount.value > 200) {
    errorMessage.value = '红包总金额不能超过200元'
    return
  }

  if (totalAmount.value > balance.value) {
    errorMessage.value = '余额不足'
    return
  }

  console.log('🧧 准备发送红包')
  showPaymentModal.value = true
  paymentPassword.value = ''
}

// 关闭支付弹窗
const closePaymentModal = () => {
  showPaymentModal.value = false
  paymentPassword.value = ''
}

// 选择付款方式
const selectPaymentMethod = (method: any) => {
  selectedPaymentMethod.value = method
  showPaymentMethodPicker.value = false
}

// 输入密码
const inputPassword = (num: string) => {
  if (paymentPassword.value.length < 6) {
    paymentPassword.value += num

    // 输入完6位自动提交
    if (paymentPassword.value.length === 6) {
      setTimeout(() => {
        submitPayment()
      }, 300)
    }
  }
}

// 删除密码
const deletePassword = () => {
  if (paymentPassword.value.length > 0) {
    paymentPassword.value = paymentPassword.value.slice(0, -1)
  }
}

// 提交支付
const submitPayment = async () => {
  console.log('🧧 提交支付', {
    type: redPacketType.value,
    amount: amount.value,
    count: count.value,
    totalAmount: totalAmount.value,
    blessing: displayBlessing.value,
    receiverId: receiverId.value,
    receiverName: receiverName.value,
    chatId: chatId.value,
    isGroup: isGroup.value,
    paymentMethod: selectedPaymentMethod.value?.id,
    password: '******'
  })

  isSending.value = true

  try {
    // 调用后端 API 验证密码并发送红包
    const response = await apiClient.post('/payment/send-redpacket', {
      type: redPacketType.value,
      amount: amount.value,
      count: count.value,
      blessing: displayBlessing.value,
      receiverId: receiverId.value,
      chatId: chatId.value,
      isGroup: isGroup.value,
      paymentMethod: selectedPaymentMethod.value?.id,
      paymentPassword: paymentPassword.value
    })

    console.log('📦 发送红包响应:', response)

    if (response.success) {
      // 密码正确，发送成功
      console.log('✅ 红包发送成功')
      isSending.value = false
      showPaymentModal.value = false

      // 保存红包信息到 sessionStorage，返回聊天页面后显示
      const redPacketData = {
        type: redPacketType.value,
        amount: amount.value,
        count: count.value,
        totalAmount: totalAmount.value,
        blessing: displayBlessing.value,
        receiverId: receiverId.value,
        receiverName: receiverName.value,
        timestamp: Date.now()
      }
      sessionStorage.setItem('sent_redpacket', JSON.stringify(redPacketData))

      // 直接返回聊天页面
      router.back()
    } else {
      // 密码错误或其他错误
      isSending.value = false
      showPasswordError.value = true
      console.log('❌ 发送失败:', response.message)
    }
  } catch (error: any) {
    isSending.value = false

    console.error('❌ 发送红包错误:', error)
    console.error('错误响应:', error.response)

    // 检查是否是密码错误
    if (error.code === 'WRONG_PASSWORD' || error.response?.data?.code === 'WRONG_PASSWORD') {
      showPasswordError.value = true
    } else {
      alert(error.message || error.response?.data?.message || '发送红包失败，请重试')
    }
  }
}

// 重试输入密码
const retryPassword = () => {
  showPasswordError.value = false
  paymentPassword.value = ''
}

// 忘记密码
const forgotPassword = () => {
  showPasswordError.value = false
  showPaymentModal.value = false
  alert('请前往"我"-"设置"-"支付设置"重置支付密码')
}

// 加载付款方式
const loadPaymentMethods = async () => {
  try {
    console.log('🔍 开始加载付款方式...')
    const response = await apiClient.get('/payment/methods')

    console.log('📦 API 响应:', response)
    console.log('📦 typeof response:', typeof response)
    console.log('📦 response.success:', response.success)
    console.log('📦 response.data:', response.data)

    // apiClient.get 返回的是 ApiResponse<T>，所以 success 在第一层
    if (response && response.success && response.data) {
      paymentMethods.value = response.data

      console.log('✅ 付款方式加载成功:', paymentMethods.value)

      // 默认选择叶语钱包
      const wallet = paymentMethods.value.find((m: any) => m.id === 'wallet')
      if (wallet) {
        selectedPaymentMethod.value = wallet
      } else if (paymentMethods.value.length > 0) {
        selectedPaymentMethod.value = paymentMethods.value[0]
      }
    } else {
      console.error('❌ API 返回格式错误，完整响应:', JSON.stringify(response, null, 2))
      throw new Error('API 返回格式错误')
    }
  } catch (error: any) {
    console.error('❌ 加载付款方式失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    console.error('完整错误对象:', error)

    // 使用默认值
    paymentMethods.value = [
      { id: 'wallet', name: '叶语钱包', balance: 1000 }
    ]
    selectedPaymentMethod.value = paymentMethods.value[0]
    console.log('ℹ️ 使用默认付款方式')
  }
}

// 添加银行账户
const addBankCard = () => {
  showPaymentMethodPicker.value = false
  alert('添加银行账户功能开发中...')
  // TODO: 跳转到添加银行卡页面
  // router.push('/add-bank-card')
}

onMounted(async () => {
  // 获取路由参数
  receiverId.value = route.query.receiverId as string || ''
  receiverName.value = route.query.receiverName as string || ''
  chatId.value = route.query.chatId as string || ''
  isGroup.value = route.query.isGroup === 'true'

  // 私聊只能发普通红包
  if (!isGroup.value) {
    redPacketType.value = 'normal'
  }

  // 加载付款方式
  await loadPaymentMethods()

  console.log('🧧 发红包页面参数:', {
    receiverId: receiverId.value,
    receiverName: receiverName.value,
    chatId: chatId.value,
    isGroup: isGroup.value,
    redPacketType: redPacketType.value,
    paymentMethods: paymentMethods.value
  })
})
</script>

<style scoped>
.send-redpacket-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 20px;
}

.content {
  padding: 24px 16px;
  max-width: 500px;
  margin: 0 auto;
}

.type-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.type-button {
  flex: 1;
  padding: 12px;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.type-button.active {
  background: #07C160;
  color: #fff;
  border-color: #07C160;
}

.input-group {
  margin-bottom: 20px;
}

.amount-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0 16px;
  height: 48px;
  transition: border-color 0.3s;
  position: relative;
}

.amount-wrapper:focus-within {
  border-color: #07C160;
}

.label-text {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

.amount-right {
  position: absolute;
  right: 16px;
  display: flex;
  align-items: center;
}

.currency {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-right: 4px;
}

.amount-input {
  border: none;
  outline: none;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  background: transparent;
  text-align: left;
  width: 100px;
  padding: 0;
  margin: 0;
}

.amount-input::placeholder {
  color: #ccc;
  text-align: left;
}

.input-wrapper {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  transition: border-color 0.3s;
}

.input-wrapper:focus-within {
  border-color: #07C160;
}

.count-input,
.blessing-input {
  width: 100%;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
  height: 48px;
  box-sizing: border-box;
}

.count-input:focus,
.blessing-input:focus {
  border-color: #07C160;
}

.count-input::placeholder,
.blessing-input::placeholder {
  color: #999;
}

.total-amount-display {
  text-align: center;
  padding: 20px 16px;
  font-size: 36px;
  font-weight: 600;
  color: #07C160;
  margin-bottom: 20px;
}

.error-message {
  background: #fff3f3;
  color: #f56c6c;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
  font-size: 14px;
  border: 1px solid #fde2e2;
}

.send-button {
  width: 100%;
  padding: 16px;
  background: #07C160;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 40px;
}

.send-button:hover:not(.disabled) {
  background: #06ad56;
}

.send-button:active:not(.disabled) {
  transform: scale(0.98);
}

.send-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #ccc;
}

/* 支付弹窗 */
.payment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}

.payment-modal {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  animation: slideUp 0.3s ease-out;
  position: relative;
  max-height: 80vh;
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

.close-button {
  position: absolute;
  top: 16px;
  left: 16px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #666;
  z-index: 1;
}

.modal-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-top: 10px;
}

.modal-amount {
  text-align: center;
  font-size: 36px;
  font-weight: 600;
  color: #07C160;
  margin-bottom: 30px;
}

.payment-method {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 30px;
  cursor: pointer;
}

.method-label {
  font-size: 16px;
  color: #333;
}

.method-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #666;
}

.password-section {
  margin-bottom: 30px;
}

.password-label {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.password-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.password-dot {
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
}

.password-dot.filled {
  border-color: #07C160;
  background: #fff;
}

.password-dot .dot {
  width: 12px;
  height: 12px;
  background: #333;
  border-radius: 50%;
}

.number-keyboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keyboard-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.key-button {
  height: 50px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 24px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}

.key-button:active {
  background: #e0e0e0;
}

.key-button.empty {
  background: transparent;
  cursor: default;
}

.key-button.delete {
  display: flex;
  align-items: center;
  justify-content: center;
}

.key-button.delete svg {
  width: 24px;
  height: 24px;
}

/* 付款方式选择器 */
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
}

.picker-modal {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease-out;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.picker-header span {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.picker-header button {
  background: none;
  border: none;
  color: #07C160;
  font-size: 16px;
  cursor: pointer;
}

.picker-list {
  max-height: 300px;
  overflow-y: auto;
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.picker-item:active {
  background: #f5f5f5;
}

.picker-item.selected {
  color: #07C160;
}

.picker-item span {
  font-size: 16px;
}

.add-card-btn {
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
  padding-top: 20px;
}

.add-card-btn:active {
  background: #f0f9ff;
}

/* 密码错误弹窗 */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 30px 20px 20px;
  width: 280px;
  text-align: center;
}

.error-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.error-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.error-buttons {
  display: flex;
  gap: 12px;
}

.error-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.error-btn.secondary {
  background: #f5f5f5;
  color: #666;
}

.error-btn.secondary:active {
  background: #e0e0e0;
}

.error-btn.primary {
  background: #07C160;
  color: #fff;
}

.error-btn.primary:active {
  background: #06ad56;
}

/* 红包封面 */
.redpacket-cover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10002;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.redpacket-cover {
  width: 320px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-radius: 16px;
  padding: 30px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.cover-header {
  text-align: center;
  margin-bottom: 30px;
}

.sender-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 10px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.sender-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sender-name {
  font-size: 16px;
  color: #fff;
  margin-bottom: 10px;
}

.cover-blessing {
  font-size: 18px;
  color: #fff;
  font-weight: 500;
}

.cover-body {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  margin-bottom: 20px;
}

.redpacket-icon {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.cover-amount {
  font-size: 36px;
  font-weight: 600;
  color: #D4380D;
  margin-bottom: 10px;
}

.cover-type {
  font-size: 14px;
  color: #999;
}

.cover-footer {
  text-align: center;
}

.success-text {
  font-size: 16px;
  color: #fff;
  font-weight: 500;
}
</style>

