<template>
  <div class="transfer-page">
    <div class="recipient-header">
      <div class="recipient-info">
        <div class="recipient-avatar-container">
          <img v-if="recipientAvatar" :src="recipientAvatar" :alt="recipientName" class="recipient-avatar" />
          <div v-else class="recipient-avatar-placeholder">{{ recipientName ? recipientName.charAt(0) : '?' }}</div>
        </div>
        <div class="recipient-details">
          <div class="recipient-name">{{ recipientName || '未知用户' }}</div>
          <div class="recipient-yeyu-id">叶语号：{{ recipientYeyuId || '未知' }}</div>
        </div>
      </div>
    </div>
    <div class="amount-section">
      <div class="amount-label">转账金额</div>
      <div class="amount-input-wrapper">
        <span class="currency-symbol">¥</span>
        <input v-model="amount" type="text" inputmode="decimal" placeholder="0.00" class="amount-input" @input="validateAmount" />
      </div>
      <div class="amount-limit">单笔转账限额 ¥50,000</div>
    </div>
    <div class="note-section">
      <input v-model="note" type="text" placeholder="添加转账说明（选填）" maxlength="50" class="note-input" />
    </div>
    <div class="transfer-button-wrapper">
      <button class="transfer-button" :disabled="!canTransfer" @click="handleTransfer">转账</button>
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
        <div class="modal-title">转账给{{ recipientName }}</div>

        <!-- 金额显示 -->
        <div class="modal-amount">¥{{ parseFloat(amount || 0).toFixed(2) }}</div>

        <!-- 付款方式 -->
        <div class="payment-method" @click="showPaymentMethodPicker = true">
          <span class="method-label">付款方式</span>
          <div class="method-value">
            <span>{{ selectedPaymentMethod?.name || '叶语钱包' }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContactStore } from '@/stores/contactStore'

const router = useRouter()
const route = useRoute()
const contactStore = useContactStore()

const recipientId = ref('')
const recipientName = ref('')
const recipientYeyuId = ref('')
const recipientAvatar = ref('')
const amount = ref('')
const note = ref('')

// 支付相关
const showPaymentModal = ref(false)
const showPaymentMethodPicker = ref(false)
const showPasswordError = ref(false)
const paymentPassword = ref('')
const paymentMethods = ref<any[]>([])
const selectedPaymentMethod = ref<any>(null)

const canTransfer = computed(() => {
  const value = parseFloat(amount.value) || 0
  return value > 0 && value <= 50000
})

const validateAmount = (e: Event) => {
  const input = e.target as HTMLInputElement
  let value = input.value
  value = value.replace(/[^\d.]/g, '')
  const parts = value.split('.')
  if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('')
  if (parts.length === 2 && parts[1].length > 2) value = parts[0] + '.' + parts[1].substring(0, 2)
  amount.value = value
}

const handleTransfer = () => {
  if (!canTransfer.value) return

  console.log('💰 点击转账按钮')
  // 显示支付密码弹窗
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
  try {
    // 验证密码（暂时使用固定密码123456）
    if (paymentPassword.value !== '123456') {
      showPasswordError.value = true
      showPaymentModal.value = false
      paymentPassword.value = ''
      return
    }

    const transferAmount = parseFloat(amount.value)

    console.log('💰 开始转账:', {
      recipientId: recipientId.value,
      recipientName: recipientName.value,
      amount: transferAmount,
      note: note.value,
      paymentMethod: selectedPaymentMethod.value?.id
    })

    // TODO: 调用转账API
    // 暂时模拟成功
    console.log('✅ 转账发送成功')
    showPaymentModal.value = false

    const currentTimestamp = Date.now()

    // 保存转账信息到 sessionStorage，返回聊天页面后显示
    const transferData = {
      amount: transferAmount,
      note: note.value,
      recipientId: recipientId.value,
      recipientName: recipientName.value,
      timestamp: currentTimestamp
    }
    sessionStorage.setItem('sent_transfer', JSON.stringify(transferData))

    // 直接返回聊天页面
    router.back()
  } catch (error) {
    console.error('转账失败:', error)
    showPasswordError.value = true
    showPaymentModal.value = false
    paymentPassword.value = ''
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
    // TODO: 从API加载付款方式
    // 暂时使用模拟数据
    paymentMethods.value = [
      { id: 'wallet', name: '叶语钱包', balance: 1000 }
    ]
    selectedPaymentMethod.value = paymentMethods.value[0]
  } catch (error) {
    console.error('加载付款方式失败:', error)
  }
}

onMounted(async () => {
  // 从路由参数获取收款人基本信息
  recipientId.value = route.query.recipientId as string || ''
  recipientName.value = route.query.recipientName as string || ''
  recipientAvatar.value = route.query.recipientAvatar as string || ''

  console.log('💰 转账页面初始化 - 路由参数:', {
    recipientId: recipientId.value,
    recipientName: recipientName.value,
    recipientAvatar: recipientAvatar.value
  })

  // 从 API 获取用户详细信息（包括叶语号、备注等）
  if (recipientId.value) {
    try {
      const token = localStorage.getItem('yeyu_auth_token')
      const response = await fetch(`http://localhost:8893/api/users/${recipientId.value}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const user = result.data

          // 优先使用备注，其次昵称，最后用户名
          recipientName.value = user.remark || user.nickname || user.username || recipientName.value
          recipientYeyuId.value = user.yeyu_id || user.yeyuId || ''

          // 头像优先使用真实头像API
          if (user.avatar && user.avatar.startsWith('http://localhost:8893/api/users/')) {
            recipientAvatar.value = user.avatar
          } else {
            recipientAvatar.value = `http://localhost:8893/api/users/${recipientId.value}/avatar`
          }

          console.log('✅ 从API获取用户信息:', {
            remark: user.remark,
            nickname: user.nickname,
            yeyuId: user.yeyu_id || user.yeyuId,
            avatar: recipientAvatar.value
          })
        }
      }
    } catch (error) {
      console.log('⚠️ 获取用户详细信息失败:', error)
    }
  }

  // 加载付款方式
  await loadPaymentMethods()

  console.log('💰 转账页面最终信息:', {
    recipientId: recipientId.value,
    recipientName: recipientName.value,
    recipientYeyuId: recipientYeyuId.value,
    recipientAvatar: recipientAvatar.value
  })
})
</script>

<style scoped>
.transfer-page { min-height: 100vh; background-color: #EDEDED; padding-bottom: 80px; }
.recipient-header { background: white; padding: 20px; margin-bottom: 8px; }
.recipient-info { display: flex; align-items: center; gap: 12px; }
.recipient-avatar-container { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.recipient-avatar { width: 48px; height: 48px; border-radius: 4px; object-fit: cover; }
.recipient-avatar-placeholder { width: 48px; height: 48px; border-radius: 4px; background: #07C160; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 500; }
.recipient-details { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.recipient-name { font-size: 17px; font-weight: 500; color: #000; line-height: 1.4; }
.recipient-yeyu-id { font-size: 14px; color: #888; line-height: 1.4; }
.amount-section { background: white; padding: 24px 20px; margin-bottom: 8px; }
.amount-label { font-size: 14px; color: #888; margin-bottom: 12px; }
.amount-input-wrapper { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.currency-symbol { font-size: 32px; font-weight: 500; color: #000; }
.amount-input { flex: 1; font-size: 32px; font-weight: 500; color: #000; border: none; outline: none; background: transparent; padding: 0; }
.amount-input::placeholder { color: #D0D0D0; }
.amount-limit { font-size: 12px; color: #888; }
.note-section { background: white; padding: 0 20px; margin-bottom: 8px; }
.note-input { width: 100%; height: 48px; font-size: 12px; color: #000; border: none; outline: none; background: transparent; }
.note-input::placeholder { color: #C0C0C0; }
.transfer-button-wrapper { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px 20px; background: white; border-top: 1px solid #E5E5E5; }
.transfer-button { width: 100%; height: 48px; background: #07C160; color: white; font-size: 17px; font-weight: 500; border: none; border-radius: 4px; cursor: pointer; transition: all 0.3s; }
.transfer-button:hover { background: #06AD56; }
.transfer-button:active { background: #059048; transform: scale(0.98); }
.transfer-button:disabled { background: #C0C0C0; cursor: not-allowed; transform: none; }

/* 支付弹窗 */
.payment-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 9999; display: flex; align-items: flex-end; }
.payment-modal { width: 100%; background: #fff; border-radius: 16px 16px 0 0; padding: 20px; animation: slideUp 0.3s ease-out; position: relative; max-height: 80vh; overflow-y: auto; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.close-button { position: absolute; top: 16px; left: 16px; background: none; border: none; padding: 8px; cursor: pointer; color: #666; z-index: 1; }
.modal-title { text-align: center; font-size: 18px; font-weight: 600; color: #333; margin-bottom: 20px; padding-top: 10px; }
.modal-amount { text-align: center; font-size: 36px; font-weight: 600; color: #07C160; margin-bottom: 30px; }
.payment-method { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f5f5f5; border-radius: 8px; margin-bottom: 30px; cursor: pointer; }
.method-label { font-size: 16px; color: #333; }
.method-value { display: flex; align-items: center; gap: 8px; font-size: 16px; color: #666; }
.password-section { margin-bottom: 30px; }
.password-label { text-align: center; font-size: 14px; color: #666; margin-bottom: 20px; }
.password-dots { display: flex; justify-content: center; gap: 12px; }
.password-dot { width: 40px; height: 40px; border: 1px solid #e0e0e0; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f9f9f9; }
.password-dot.filled { border-color: #07C160; background: #fff; }
.password-dot .dot { width: 12px; height: 12px; background: #333; border-radius: 50%; }
.number-keyboard { display: flex; flex-direction: column; gap: 12px; }
.keyboard-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.key-button { height: 50px; background: #f5f5f5; border: none; border-radius: 8px; font-size: 24px; font-weight: 500; color: #333; cursor: pointer; transition: background 0.2s; }
.key-button:active { background: #e0e0e0; }
.key-button.empty { background: transparent; cursor: default; }
.key-button.delete { display: flex; align-items: center; justify-content: center; }
.key-button.delete svg { width: 24px; height: 24px; }

/* 付款方式选择器 */
.picker-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 10000; display: flex; align-items: flex-end; }
.picker-modal { width: 100%; background: #fff; border-radius: 16px 16px 0 0; animation: slideUp 0.3s ease-out; }
.picker-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e0e0e0; }
.picker-header span { font-size: 16px; font-weight: 600; color: #333; }
.picker-header button { background: none; border: none; color: #07C160; font-size: 16px; cursor: pointer; }
.picker-list { max-height: 300px; overflow-y: auto; }
.picker-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; transition: background 0.2s; }
.picker-item:active { background: #f5f5f5; }
.picker-item.selected { color: #07C160; }
.picker-item span { font-size: 16px; }

/* 密码错误弹窗 */
.error-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); z-index: 10001; display: flex; align-items: center; justify-content: center; }
.error-dialog { background: #fff; border-radius: 16px; padding: 30px 20px 20px; width: 280px; text-align: center; }
.error-icon { margin-bottom: 20px; display: flex; justify-content: center; }
.error-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px; }
.error-message { font-size: 14px; color: #666; margin-bottom: 30px; }
.error-buttons { display: flex; gap: 12px; }
.error-btn { flex: 1; padding: 12px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.2s; }
.error-btn.secondary { background: #f5f5f5; color: #666; }
.error-btn.secondary:active { background: #e0e0e0; }
.error-btn.primary { background: #07C160; color: #fff; }
.error-btn.primary:active { background: #06ad56; }
</style>
