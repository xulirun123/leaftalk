<template>
  <div class="transfer">



    <div class="recipient-info">
      <div class="recipient-row">
        <div class="recipient-avatar">
          <img v-if="!isGroupChat && recipientAvatar" :src="recipientAvatar" :alt="recipientName" class="avatar-img" />
          <iconify-icon v-else icon="heroicons:user-circle" width="48" style="color: #07C160;"></iconify-icon>
        </div>
        <div class="recipient-name">
          <span v-if="isGroupChat">群聊转账</span>
          <span v-else>转账给 {{ recipientName || chatName }}</span>
        </div>
      </div>
      <div v-if="isGroupChat" class="group-notice">
        <iconify-icon icon="heroicons:exclamation-triangle" width="16" style="color: #FF9500;"></iconify-icon>
        <span>群聊不支持转账功能</span>
      </div>
      <!-- 转账封面 -->
      <div v-if="!isGroupChat" class="transfer-cover-card">
        <div class="transfer-bg">
          <div class="transfer-icon">💰</div>
          <div class="transfer-text">转账</div>
          <div v-if="amount && amount !== '0.00'" class="transfer-amount">¥{{ amount }}</div>
        </div>
      </div>
    </div>

    <div v-if="!isGroupChat" class="transfer-form">
      <div class="amount-section">
        <div class="amount-row">
          <span class="amount-label">转账金额</span>
          <div class="amount-input">
            <span class="currency">¥</span>
            <input
              v-model="amount"
              type="text"
              placeholder="0.00"
              readonly
              @click="showAmountKeyboard"
              class="amount-display"
            />
          </div>
        </div>
        <div class="amount-limit">单笔转账限额 ¥50,000</div>
      </div>

      <div class="note-section">
        <div class="note-label">转账说明</div>
        <input v-model="note" type="text" placeholder="添加转账说明" maxlength="50" class="note-input" />
      </div>

      <div class="arrival-section">
        <div class="arrival-label">到账时间</div>
        <div class="arrival-options">
          <label class="arrival-option">
            <input type="radio" v-model="arrivalTime" value="instant" />
            <span class="option-text">
              <div class="option-title">实时到账</div>
              <div class="option-desc">立即到账</div>
            </span>
          </label>
          <label class="arrival-option">
            <input type="radio" v-model="arrivalTime" value="delay" />
            <span class="option-text">
              <div class="option-title">延时到账</div>
              <div class="option-desc">2小时后到账，可撤回</div>
            </span>
          </label>
        </div>
      </div>


    </div>

    <div v-if="!isGroupChat" class="transfer-actions">
      <button class="transfer-btn" :disabled="!canTransfer" @click="confirmTransfer">
        转账
      </button>
    </div>



    <div v-if="showSuccessDialog" class="success-overlay">
      <div class="success-dialog">
        <div class="success-icon">
          <iconify-icon icon="heroicons:check-circle" width="64" style="color: #07C160;"></iconify-icon>
        </div>
        <div class="success-title">转账成功</div>
        <div class="success-amount">¥{{ amount }}</div>
        <div class="success-recipient">已转账给 {{ chatName }}</div>
        <div class="success-time">{{ arrivalTime === 'instant' ? '已实时到账' : '将在2小时后到账' }}</div>
        <button class="success-btn" @click="closeSuccess">完成</button>
      </div>
    </div>

    <!-- 支付密码弹窗 -->
    <div v-if="showPaymentDialog" class="payment-overlay">
      <div class="payment-dialog">
        <div class="payment-header">
          <div class="payment-title">叶语转账</div>
          <div class="payment-amount">¥{{ amount }}</div>
          <div class="payment-source">叶语钱包支付</div>
        </div>

        <div class="password-section">
          <div class="password-label">请输入支付密码</div>
          <div class="password-input">
            <div class="password-boxes">
              <div
                v-for="i in 6"
                :key="i"
                class="password-box"
                :class="{ filled: password.length >= i }"
              >
                {{ password.length >= i ? '●' : '' }}
              </div>
            </div>
          </div>
        </div>

        <div class="number-keyboard">
          <div class="keyboard-row" v-for="row in keyboard" :key="row.join('')">
            <button
              v-for="key in row"
              :key="key"
              class="keyboard-btn"
              :class="{
                'delete-btn': key === 'delete',
                'confirm-btn': key === 'confirm'
              }"
              @click="handleKeyboard(key)"
            >
              <iconify-icon v-if="key === 'delete'" icon="heroicons:backspace" width="20"></iconify-icon>
              <span v-else>{{ key === 'confirm' ? '确认' : key }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 金额输入键盘 -->
    <div v-if="showAmountKeyboardDialog" class="amount-keyboard-overlay">
      <div class="amount-keyboard-dialog">
        <div class="amount-display">
          <div class="amount-label">转账金额</div>
          <div class="amount-value">¥{{ tempAmount || '0.00' }}</div>
        </div>

        <div class="amount-keyboard">
          <div class="keyboard-row" v-for="row in amountKeyboard" :key="row.join('')">
            <button
              v-for="key in row"
              :key="key"
              class="amount-key-btn"
              :class="{
                'delete-btn': key === 'delete',
                'confirm-btn': key === 'confirm'
              }"
              @click="handleAmountKeyboard(key)"
            >
              <iconify-icon v-if="key === 'delete'" icon="heroicons:backspace" width="20"></iconify-icon>
              <span v-else>{{ key === 'confirm' ? '确认' : key }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useChatStore } from '../chat/stores/chatStore'
import { useContactStore } from './stores/contactStore'
import { useAuthStore } from '../../../stores/auth'
import { usePaymentStore } from '../../stores/payment'
import { useSmartAuth } from '../composables/useSmartAuth'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()
const contactStore = useContactStore()
const authStore = useAuthStore()
const paymentStore = usePaymentStore()

// 智能验证
const { useAuthFlow } = useSmartAuth()

const chatId = ref('')
const chatType = ref('private')
const chatName = ref('')
const isGroupChat = computed(() => chatType.value === 'group')

// 收款人信息
const recipientId = ref('')
const recipientName = computed(() => {
  if (isGroupChat.value) return ''
  const contact = contactStore.getContact(recipientId.value)
  return contact?.nickname || contact?.name || chatName.value || '未知用户'
})

const recipientAvatar = computed(() => {
  if (isGroupChat.value) return ''
  const contact = contactStore.getContact(recipientId.value)
  return contact?.avatar || '/default-avatar.png'
})

const amount = ref('')
const note = ref('')
const arrivalTime = ref('instant')
const balance = ref(1000.00)

const showSuccessDialog = ref(false)
const showPaymentDialog = ref(false)
const showAmountKeyboardDialog = ref(false)
const password = ref('')
const tempAmount = ref('')

// 支付密码（默认123456）
const correctPassword = '123456'

// 键盘配置
const keyboard = ref([
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['delete', '0', 'confirm']
])

// 金额输入键盘
const amountKeyboard = ref([
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'delete'],
  ['confirm']
])

const canTransfer = computed(() => {
  const value = parseFloat(amount.value) || 0
  return value > 0 && value <= balance.value && value <= 50000 && !isGroupChat.value
})

// 智能验证流程
const { isAuthReturn, triggerAuth } = useAuthFlow(
  '转账服务',
  {},
  () => {
    // 验证成功后执行转账
    executeTransferDirectly()
  },
  ['chatId', 'chatType', 'chatName'] // 保留这些参数
)

onMounted(() => {
  chatId.value = route.query.chatId as string || ''
  chatType.value = route.query.chatType as string || 'private'
  chatName.value = decodeURIComponent(route.query.chatName as string || '')

  // 如果是私聊，设置收款人ID（通常是chatId）
  if (!isGroupChat.value) {
    recipientId.value = chatId.value
  }

  // 如果不是验证返回，则进行正常初始化
  if (!isAuthReturn) {
    // 检查延时转账（仅在页面加载时检查一次）
    checkDelayedTransfers()
  }

  // 注释掉定时检查，避免频繁修改转账状态
  // setInterval(checkDelayedTransfers, 60000)
})

// 移除goBack函数，使用全局导航栏的返回功能

const confirmTransfer = async () => {
  if (!canTransfer.value) return

  // 使用智能验证流程
  await triggerAuth()
}

// 直接执行转账（验证成功后调用）
const executeTransferDirectly = () => {
  const transferAmount = parseFloat(amount.value)

  // 执行转账（跳过密码验证）
  const success = walletStore.transfer(
    transferAmount,
    recipientId.value,
    recipientName.value,
    note.value
  )

  if (success) {
    // 创建转账消息并发送到聊天
    const transferMessage = {
      id: Date.now().toString(),
      chatId: chatId.value,
      content: `[转账] ¥${transferAmount.toFixed(2)}${note.value ? ` - ${note.value}` : ''}`,
      type: 'transfer',
      timestamp: Date.now(),
      isSelf: true,
      senderId: authStore.user?.id || 'user_002',
      senderName: authStore.user?.nickname || '我',
      senderAvatar: authStore.user?.avatar || '',
      sender: authStore.user?.nickname || '我',
      avatar: authStore.user?.avatar || '',
      transfer: {
        id: Date.now().toString(),
        amount: transferAmount,
        recipient: recipientName.value,
        remark: note.value,
        status: 'pending',
        timestamp: Date.now(),
        arrivalTime: arrivalTime.value,
        arrivalTimestamp: arrivalTime.value === 'instant' ? null : Date.now() + (2 * 60 * 60 * 1000),
        fromUserId: authStore.user?.id || 'user_002',
        fromUserName: authStore.user?.nickname || '我',
        toUserName: recipientName.value
      }
    }

    // 直接将完整的转账消息添加到localStorage
    const storageKey = `leaftalk_chat_${chatId.value}`
    const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]')
    existingMessages.push(transferMessage)
    localStorage.setItem(storageKey, JSON.stringify(existingMessages))

    console.log('💰 转账消息已添加到localStorage:', transferMessage)

    balance.value -= transferAmount
    showSuccessDialog.value = true
  } else {
    alert('转账失败，请重试')
  }
}

const processTransfer = () => {
  const transferAmount = parseFloat(amount.value)

  // 验证支付密码
  if (!walletStore.verifyPaymentPassword(password.value)) {
    alert('支付密码错误，请重新输入')
    password.value = ''
    return
  }

  // 执行转账
  const success = walletStore.transfer(
    transferAmount,
    recipientId.value,
    recipientName.value,
    note.value
  )

  if (success) {
    // 创建转账消息并发送到聊天
    const transferMessage = {
      id: Date.now().toString(),
      chatId: chatId.value,
      content: `[转账] ¥${transferAmount.toFixed(2)}${note.value ? ` - ${note.value}` : ''}`,
      type: 'transfer',
      timestamp: Date.now(),
      isSelf: true,
      senderId: authStore.user?.id || 'user_002',
      senderName: authStore.user?.nickname || '我',
      senderAvatar: authStore.user?.avatar || '',
      sender: authStore.user?.nickname || '我',
      avatar: authStore.user?.avatar || '',
      transfer: {
        id: Date.now().toString(),
        amount: transferAmount,
        recipient: recipientName.value,
        remark: note.value,
        status: 'pending', // 转账初始状态始终为pending，等待对方接收
        timestamp: Date.now(), // 转账创建时间
        arrivalTime: arrivalTime.value,
        arrivalTimestamp: arrivalTime.value === 'instant' ? null : Date.now() + (2 * 60 * 60 * 1000), // 实时转账不设置时间戳，延时转账2小时后
        fromUserId: authStore.user?.id || 'user_002',
        fromUserName: authStore.user?.nickname || '我',
        toUserName: recipientName.value // 添加接收方名称
      }
    }

    // 直接将完整的转账消息添加到localStorage
    const storageKey = `leaftalk_chat_${chatId.value}`
    const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]')
    existingMessages.push(transferMessage)
    localStorage.setItem(storageKey, JSON.stringify(existingMessages))

    console.log('💰 转账消息已添加到localStorage:', transferMessage)

    balance.value -= transferAmount
    showPaymentDialog.value = false
    showSuccessDialog.value = true
  } else {
    alert('余额不足，转账失败')
    showPaymentDialog.value = false
  }
}

const closeSuccess = () => {
  showSuccessDialog.value = false
  router.back()
}

// 检查并处理延时到账
const checkDelayedTransfers = () => {
  const now = Date.now()
  const storageKey = `leaftalk_chat_${chatId.value}`
  const messages = JSON.parse(localStorage.getItem(storageKey) || '[]')
  let hasUpdates = false

  messages.forEach((message: any) => {
    if (message.type === 'transfer' &&
        message.transfer?.status === 'pending' &&
        message.transfer?.arrivalTime === 'delay' &&
        message.transfer?.arrivalTimestamp &&
        message.transfer?.arrivalTimestamp <= now) {
      // 只有延时转账才会自动到账，实时转账需要手动接收
      message.transfer.status = 'completed'
      hasUpdates = true
      console.log('💰 延时转账已到账:', message.transfer)
    }
  })

  if (hasUpdates) {
    localStorage.setItem(storageKey, JSON.stringify(messages))
  }
}

// 撤回延时转账
const cancelDelayedTransfer = (transferId: string) => {
  const storageKey = `leaftalk_chat_${chatId.value}`
  const messages = JSON.parse(localStorage.getItem(storageKey) || '[]')

  const transferMessage = messages.find((msg: any) =>
    msg.type === 'transfer' && msg.transfer?.id === transferId
  )

  if (transferMessage &&
      transferMessage.transfer?.status === 'pending' &&
      transferMessage.transfer?.arrivalTime === 'delay') {

    // 退还金额
    const transferAmount = transferMessage.transfer.amount
    balance.value += transferAmount

    // 更新转账状态为已撤回
    transferMessage.transfer.status = 'cancelled'
    transferMessage.content = `[转账已撤回] ¥${transferAmount.toFixed(2)}`

    localStorage.setItem(storageKey, JSON.stringify(messages))
    console.log('💰 延时转账已撤回:', transferMessage.transfer)

    return true
  }

  return false
}

// 密码键盘处理
const handleKeyboard = (key: string) => {
  if (key === 'delete') {
    password.value = password.value.slice(0, -1)
  } else if (key === 'confirm') {
    if (password.value.length === 6) {
      processTransfer()
    }
  } else if (password.value.length < 6) {
    password.value += key

    // 自动验证
    if (password.value.length === 6) {
      setTimeout(() => {
        processTransfer()
      }, 300)
    }
  }
}

// 金额键盘相关方法
const showAmountKeyboard = () => {
  tempAmount.value = amount.value
  showAmountKeyboardDialog.value = true
}

const handleAmountKeyboard = (key: string) => {
  if (key === 'delete') {
    tempAmount.value = tempAmount.value.slice(0, -1)
  } else if (key === 'confirm') {
    amount.value = tempAmount.value || '0.00'
    showAmountKeyboardDialog.value = false
  } else if (key === '.') {
    if (!tempAmount.value.includes('.')) {
      tempAmount.value += key
    }
  } else {
    // 限制金额格式
    if (tempAmount.value.includes('.')) {
      const parts = tempAmount.value.split('.')
      if (parts[1].length < 2) {
        tempAmount.value += key
      }
    } else {
      if (tempAmount.value.length < 6) { // 限制最大6位整数
        tempAmount.value += key
      }
    }
  }
}
</script>

<style scoped>
.transfer {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 移除自创导航栏样式，使用全局导航栏 */

.recipient-info {
  background: white;
  padding: 12px 20px;
  margin-bottom: 4px;
}

.recipient-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.recipient-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}

/* 蓝色转账封面 */
.transfer-cover-card {
  margin: 12px auto 8px auto;
  width: 100%;
  max-width: 320px;
}

.transfer-bg {
  background: linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 2/1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.transfer-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.transfer-text {
  font-size: 18px;
  font-weight: 600;
}

.transfer-amount {
  font-size: 24px;
  font-weight: 700;
  color: #FFD700;
  margin-top: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.recipient-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.group-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #FF9500;
  font-size: 14px;
}

.transfer-form {
  flex: 1;
  margin-top: 2px;
}

.amount-section {
  background: white;
  padding: 8px 20px;
  margin-bottom: 4px;
}

.amount-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.amount-label {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-right: 16px;
  min-width: 80px;
}

.amount-input {
  display: flex;
  align-items: center;
  flex: 1;
}

.currency {
  font-size: 28px;
  color: #07C160;
  font-weight: 600;
  margin-right: 6px;
}

.amount-input input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 28px;
  color: #333;
  background: transparent;
}

.amount-limit {
  font-size: 11px;
  color: #999;
  margin-top: 0px;
}

.note-section {
  background: white;
  padding: 10px 20px;
  margin-bottom: 4px;
}

.note-label {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 500;
}

.note-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  color: #333;
  background: transparent;
}

.arrival-section {
  background: white;
  padding: 10px 20px;
  margin-bottom: 4px;
}

.arrival-label {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
  font-weight: 500;
}

.arrival-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.arrival-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.arrival-option input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #07C160;
}

.option-text {
  flex: 1;
}

.option-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 12px;
  color: #666;
}



.transfer-actions {
  padding: 8px 20px;
}

.transfer-btn {
  width: 100%;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.transfer-btn:hover:not(:disabled) {
  background: #06A84F;
}

.transfer-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.confirm-overlay,
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog,
.success-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 320px;
  overflow: hidden;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.confirm-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
}

.confirm-content {
  padding: 24px 20px;
  text-align: center;
}

.confirm-amount {
  font-size: 32px;
  font-weight: 600;
  color: #07C160;
  margin-bottom: 8px;
}

.confirm-recipient {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.confirm-note {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.confirm-arrival {
  font-size: 14px;
  color: #999;
}

.confirm-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
}

.cancel-btn {
  color: #666;
  border-right: 1px solid #f0f0f0;
}

.confirm-btn {
  color: #07C160;
  font-weight: 500;
}

.success-dialog {
  padding: 32px 20px;
  text-align: center;
}

.success-icon {
  margin-bottom: 16px;
}

.success-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.success-amount {
  font-size: 24px;
  font-weight: 600;
  color: #07C160;
  margin-bottom: 8px;
}

.success-recipient {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.success-time {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

.success-btn {
  width: 100%;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
}

/* 转账封面样式 */
.transfer-cover {
  margin-bottom: 16px;
}

.cover-bg {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  padding: 24px 20px;
  position: relative;
  overflow: hidden;
}

.cover-content {
  text-align: center;
  color: white;
  position: relative;
  z-index: 2;
}

.cover-decoration {
  position: relative;
}

.cover-pattern {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/><circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></svg>');
  opacity: 0.3;
}

.cover-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.cover-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.cover-subtitle {
  font-size: 12px;
  opacity: 0.8;
}

/* 支付弹窗样式 */
.payment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.payment-dialog {
  background: white;
  width: 100%;
  border-radius: 16px 16px 0 0;
  padding: 0;
}

.payment-header {
  text-align: center;
  padding: 24px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.payment-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.payment-amount {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.payment-source {
  font-size: 14px;
  color: #666;
}

.password-section {
  padding: 20px;
  text-align: center;
}

.password-label {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
}

.password-input {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.password-boxes {
  display: flex;
  gap: 12px;
}

.password-box {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  transition: all 0.2s;
}

.password-box.filled {
  border-color: #4A90E2;
  color: #333;
}

.number-keyboard {
  padding: 0 20px 20px;
}

.keyboard-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.keyboard-btn {
  flex: 1;
  height: 48px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.keyboard-btn:hover {
  background: #f8f8f8;
}

.delete-btn {
  background: #f8f8f8 !important;
}

.confirm-btn {
  background: #4A90E2 !important;
  color: white !important;
  border-color: #4A90E2 !important;
}

/* 金额输入键盘 */
.amount-keyboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1001;
}

.amount-keyboard-dialog {
  background: white;
  width: 100%;
  border-radius: 16px 16px 0 0;
  padding: 0;
}

.amount-display {
  text-align: center;
  padding: 24px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.amount-label {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.amount-keyboard {
  padding: 20px;
}

.amount-key-btn {
  flex: 1;
  height: 48px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.amount-key-btn:hover {
  background: #f8f8f8;
}

.amount-key-btn.confirm-btn {
  background: #4A90E2 !important;
  color: white !important;
  border-color: #4A90E2 !important;
}

.amount-display-input {
  cursor: pointer;
}
</style>
