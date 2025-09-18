<template>
  <div class="wallet">
    <!-- 顶部导航栏 -->
    <MobileTopBar 
      :title="$t('payment.wallet')"
      :show-back="true"
      @back="goBack"
    >
      <template #right>
        <button @click="showTransactionHistory" class="history-btn">
          <iconify-icon icon="heroicons:clock" width="20" style="color: white;" />
        </button>
      </template>
    </MobileTopBar>

    <!-- 钱包余额卡片 -->
    <div class="balance-card">
      <div class="balance-header">
        <div class="balance-title">{{ $t('payment.totalBalance') }}</div>
        <button @click="toggleBalanceVisibility" class="visibility-btn">
          <iconify-icon 
            :icon="showBalance ? 'heroicons:eye' : 'heroicons:eye-slash'" 
            width="20" 
            style="color: white;" 
          />
        </button>
      </div>
      
      <div class="balance-amount">
        {{ showBalance ? `¥${totalBalance.toFixed(2)}` : '****' }}
      </div>
      
      <div class="balance-breakdown">
        <div class="balance-item">
          <span>{{ $t('payment.yeyuWallet') }}</span>
          <span>{{ showBalance ? `¥${walletBalance.toFixed(2)}` : '****' }}</span>
        </div>
        <div class="balance-item">
          <span>{{ $t('payment.yeyuBeans') }}</span>
          <span>{{ showBalance ? `${beansBalance}豆` : '****' }}</span>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <button @click="showRechargeDialog" class="action-btn recharge">
          <iconify-icon icon="heroicons:plus" width="20" />
          <span>{{ $t('payment.recharge') }}</span>
        </button>
        <button @click="showWithdrawDialog" class="action-btn withdraw">
          <iconify-icon icon="heroicons:minus" width="20" />
          <span>{{ $t('payment.withdraw') }}</span>
        </button>
        <button @click="showTransferDialog" class="action-btn transfer">
          <iconify-icon icon="heroicons:arrow-right" width="20" />
          <span>{{ $t('payment.transfer') }}</span>
        </button>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="feature-menu">
      <div class="menu-item" @click="goToCards">
        <div class="menu-icon">
          <iconify-icon icon="heroicons:credit-card" width="24" style="color: #07c160;" />
        </div>
        <div class="menu-info">
          <div class="menu-title">{{ $t('payment.bankCards') }}</div>
          <div class="menu-desc">{{ $t('payment.manageCards') }}</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow" />
      </div>

      <div class="menu-item" @click="goToSecurity">
        <div class="menu-icon">
          <iconify-icon icon="heroicons:shield-check" width="24" style="color: #07c160;" />
        </div>
        <div class="menu-info">
          <div class="menu-title">{{ $t('payment.paymentSecurity') }}</div>
          <div class="menu-desc">{{ $t('payment.securitySettings') }}</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow" />
      </div>

      <div class="menu-item" @click="goToTransactions">
        <div class="menu-icon">
          <iconify-icon icon="heroicons:document-text" width="24" style="color: #07c160;" />
        </div>
        <div class="menu-info">
          <div class="menu-title">{{ $t('payment.transactionHistory') }}</div>
          <div class="menu-desc">{{ $t('payment.viewAllTransactions') }}</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow" />
      </div>

      <div class="menu-item" @click="goToHelp">
        <div class="menu-icon">
          <iconify-icon icon="heroicons:question-mark-circle" width="24" style="color: #07c160;" />
        </div>
        <div class="menu-info">
          <div class="menu-title">{{ $t('payment.help') }}</div>
          <div class="menu-desc">{{ $t('payment.paymentHelp') }}</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow" />
      </div>
    </div>

    <!-- 最近交易 -->
    <div class="recent-transactions">
      <div class="section-title">{{ $t('payment.recentTransactions') }}</div>
      <div class="transaction-list">
        <div 
          v-for="transaction in recentTransactions"
          :key="transaction.id"
          class="transaction-item"
          @click="viewTransaction(transaction)"
        >
          <div class="transaction-icon">
            <iconify-icon 
              :icon="getTransactionIcon(transaction.type)" 
              width="20" 
              :style="{ color: getTransactionColor(transaction.type) }"
            />
          </div>
          <div class="transaction-info">
            <div class="transaction-title">{{ transaction.title }}</div>
            <div class="transaction-time">{{ formatTime(transaction.timestamp) }}</div>
          </div>
          <div class="transaction-amount" :class="{ positive: transaction.amount > 0 }">
            {{ transaction.amount > 0 ? '+' : '' }}¥{{ Math.abs(transaction.amount).toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <div v-if="showRecharge" class="recharge-overlay" @click="closeRechargeDialog">
      <div class="recharge-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ $t('payment.recharge') }}</h3>
          <button @click="closeRechargeDialog" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>
        
        <div class="modal-content">
          <!-- 充值金额 -->
          <div class="amount-section">
            <div class="amount-label">{{ $t('payment.rechargeAmount') }}</div>
            <div class="amount-input-wrapper">
              <span class="currency">¥</span>
              <input 
                v-model="rechargeAmount"
                type="number"
                step="0.01"
                min="1"
                max="50000"
                :placeholder="$t('payment.enterAmount')"
                class="amount-input"
              />
            </div>
          </div>

          <!-- 快捷金额 -->
          <div class="quick-amounts">
            <button 
              v-for="amount in quickRechargeAmounts"
              :key="amount"
              class="amount-btn"
              @click="rechargeAmount = amount.toString()"
            >
              ¥{{ amount }}
            </button>
          </div>

          <!-- 支付方式 -->
          <div class="payment-methods">
            <div class="method-label">{{ $t('payment.paymentMethod') }}</div>
            <div 
              v-for="method in paymentMethods"
              :key="method.id"
              class="method-item"
              :class="{ selected: selectedPaymentMethod === method.id }"
              @click="selectedPaymentMethod = method.id"
            >
              <div class="method-icon">
                <iconify-icon :icon="method.icon" width="24" :style="{ color: method.color }" />
              </div>
              <div class="method-info">
                <div class="method-name">{{ method.name }}</div>
                <div class="method-desc">{{ method.description }}</div>
              </div>
              <div class="method-radio">
                <div class="radio-dot" :class="{ active: selectedPaymentMethod === method.id }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeRechargeDialog" class="cancel-btn">
            {{ $t('common.cancel') }}
          </button>
          <button 
            @click="confirmRecharge" 
            class="confirm-btn"
            :disabled="!canRecharge"
          >
            {{ $t('payment.confirmRecharge') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 提现弹窗 -->
    <div v-if="showWithdraw" class="withdraw-overlay" @click="closeWithdrawDialog">
      <div class="withdraw-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ $t('payment.withdraw') }}</h3>
          <button @click="closeWithdrawDialog" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20" />
          </button>
        </div>
        
        <div class="modal-content">
          <div class="withdraw-info">
            <div class="info-item">
              <span>{{ $t('payment.availableBalance') }}</span>
              <span>¥{{ walletBalance.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <span>{{ $t('payment.withdrawFee') }}</span>
              <span>{{ $t('payment.freeWithdraw') }}</span>
            </div>
          </div>

          <div class="amount-section">
            <div class="amount-label">{{ $t('payment.withdrawAmount') }}</div>
            <div class="amount-input-wrapper">
              <span class="currency">¥</span>
              <input 
                v-model="withdrawAmount"
                type="number"
                step="0.01"
                min="1"
                :max="walletBalance"
                :placeholder="$t('payment.enterAmount')"
                class="amount-input"
              />
            </div>
            <div class="amount-hint">
              {{ $t('payment.withdrawRange', { min: 1, max: walletBalance.toFixed(2) }) }}
            </div>
          </div>

          <div class="withdraw-to">
            <div class="withdraw-label">{{ $t('payment.withdrawTo') }}</div>
            <div class="bank-card">
              <iconify-icon icon="heroicons:credit-card" width="24" style="color: #07c160;" />
              <span>{{ $t('payment.defaultBankCard') }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeWithdrawDialog" class="cancel-btn">
            {{ $t('common.cancel') }}
          </button>
          <button 
            @click="confirmWithdraw" 
            class="confirm-btn"
            :disabled="!canWithdraw"
          >
            {{ $t('payment.confirmWithdraw') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../../shared/stores/appStore'
import { usePaymentStore } from '../../stores/payment'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()
const paymentStore = usePaymentStore()

// 响应式数据
const showBalance = ref(true)
const showRecharge = ref(false)
const showWithdraw = ref(false)
const rechargeAmount = ref('')
const withdrawAmount = ref('')
const selectedPaymentMethod = ref('wechat')

// 计算属性
const totalBalance = computed(() => {
  return paymentStore.totalBalance
})

const walletBalance = computed(() => paymentStore.availableBalance)
const beansBalance = computed(() => paymentStore.yeyuCoinBalance)

const canRecharge = computed(() => {
  const amount = parseFloat(rechargeAmount.value)
  return amount >= 1 && amount <= 50000
})

const canWithdraw = computed(() => {
  const amount = parseFloat(withdrawAmount.value)
  return amount >= 1 && amount <= walletBalance.value
})

// 快捷充值金额
const quickRechargeAmounts = ref([50, 100, 200, 500, 1000, 2000])

// 支付方式
const paymentMethods = ref([
  {
    id: 'wechat',
    name: t('payment.wechatPay'),
    description: t('payment.wechatPayDesc'),
    icon: 'heroicons:device-phone-mobile',
    color: '#07c160'
  },
  {
    id: 'alipay',
    name: t('payment.alipay'),
    description: t('payment.alipayDesc'),
    icon: 'heroicons:credit-card',
    color: '#1677ff'
  },
  {
    id: 'bank',
    name: t('payment.bankCard'),
    description: t('payment.bankCardDesc'),
    icon: 'heroicons:building-library',
    color: '#722ed1'
  }
])

// 最近交易
const recentTransactions = ref([
  {
    id: '1',
    type: 'recharge',
    title: '充值',
    amount: 100,
    timestamp: Date.now() - 3600000
  },
  {
    id: '2',
    type: 'transfer',
    title: '转账给张三',
    amount: -50,
    timestamp: Date.now() - 7200000
  },
  {
    id: '3',
    type: 'redpacket',
    title: '收到红包',
    amount: 8.88,
    timestamp: Date.now() - 86400000
  }
])

// 方法
const goBack = () => {
  router.back()
}

const toggleBalanceVisibility = () => {
  showBalance.value = !showBalance.value
}

const showRechargeDialog = () => {
  showRecharge.value = true
}

const closeRechargeDialog = () => {
  showRecharge.value = false
  rechargeAmount.value = ''
}

const showWithdrawDialog = () => {
  showWithdraw.value = true
}

const closeWithdrawDialog = () => {
  showWithdraw.value = false
  withdrawAmount.value = ''
}

const showTransferDialog = () => {
  router.push('/transfer')
}

const showTransactionHistory = () => {
  router.push('/wallet/transactions')
}

const confirmRecharge = async () => {
  if (!canRecharge.value) return

  try {
    const amount = parseFloat(rechargeAmount.value)
    await paymentStore.rechargeWallet(amount, selectedPaymentMethod.value)

    appStore.showToast(t('payment.rechargeSuccess'), 'success')
    closeRechargeDialog()
  } catch (error) {
    console.error('充值失败:', error)
    appStore.showToast(paymentStore.error || '充值失败', 'error')
  }
}

const confirmWithdraw = async () => {
  if (!canWithdraw.value) return

  try {
    const amount = parseFloat(withdrawAmount.value)
    await paymentStore.withdrawWallet(amount, 'default_bank_card')

    appStore.showToast(t('payment.withdrawSuccess'), 'success')
    closeWithdrawDialog()
  } catch (error) {
    console.error('提现失败:', error)
    appStore.showToast(paymentStore.error || '提现失败', 'error')
  }
}

const goToCards = () => {
  router.push('/wallet/cards')
}

const goToSecurity = () => {
  router.push('/wallet/security')
}

const goToTransactions = () => {
  router.push('/wallet/transactions')
}

const goToHelp = () => {
  router.push('/wallet/help')
}

const viewTransaction = (transaction: any) => {
  router.push(`/wallet/transaction/${transaction.id}`)
}

const getTransactionIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    recharge: 'heroicons:plus-circle',
    withdraw: 'heroicons:minus-circle',
    transfer: 'heroicons:arrow-right-circle',
    redpacket: 'heroicons:gift',
    payment: 'heroicons:credit-card'
  }
  return iconMap[type] || 'heroicons:banknotes'
}

const getTransactionColor = (type: string) => {
  const colorMap: Record<string, string> = {
    recharge: '#07c160',
    withdraw: '#ff6b6b',
    transfer: '#1677ff',
    redpacket: '#faad14',
    payment: '#722ed1'
  }
  return colorMap[type] || '#666'
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 86400000) { // 24小时内
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

onMounted(async () => {
  // 初始化支付系统
  await paymentStore.loadWallet()
  await paymentStore.loadPaymentMethods()
  await paymentStore.loadTransactions(1, 10)
  console.log('钱包页面已加载')
})
</script>

<style scoped>
.wallet {
  min-height: 100vh;
  background: #f8f8f8;
}

.history-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.balance-card {
  background: linear-gradient(135deg, #07c160 0%, #06a552 100%);
  color: white;
  padding: 24px;
  margin: 16px;
  border-radius: 16px;
}

.balance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.balance-title {
  font-size: 14px;
  opacity: 0.9;
}

.visibility-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.balance-amount {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
}

.balance-breakdown {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.balance-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.feature-menu {
  background: white;
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

/* 功能菜单保留最后一项的分隔线 */

.menu-item:hover {
  background: #f8f9fa;
}

.menu-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f8f0;
  border-radius: 8px;
  margin-right: 12px;
}

.menu-info {
  flex: 1;
}

.menu-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.menu-desc {
  font-size: 14px;
  color: #666;
}

.arrow {
  color: #ccc;
}

.recent-transactions {
  background: white;
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.section-title {
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-list {
  max-height: 300px;
  overflow-y: auto;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-item:hover {
  background: #f8f9fa;
}

.transaction-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 50%;
  margin-right: 12px;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.transaction-time {
  font-size: 12px;
  color: #999;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 500;
  color: #ff6b6b;
}

.transaction-amount.positive {
  color: #07c160;
}

/* 弹窗样式 */
.recharge-overlay, .withdraw-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.recharge-modal, .withdraw-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-content {
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.amount-section {
  margin-bottom: 24px;
}

.amount-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
}

.currency {
  font-size: 20px;
  font-weight: bold;
  color: #07c160;
  margin-right: 8px;
}

.amount-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 20px;
  font-weight: bold;
  color: #07c160;
  outline: none;
}

.amount-hint {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.amount-btn {
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.amount-btn:hover {
  border-color: #07c160;
  color: #07c160;
}

.payment-methods {
  margin-bottom: 24px;
}

.method-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-item:last-child {
  margin-bottom: 0;
}

.method-item.selected {
  border-color: #07c160;
  background: #f0f8f0;
}

.method-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  margin-right: 12px;
}

.method-info {
  flex: 1;
}

.method-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.method-desc {
  font-size: 12px;
  color: #666;
}

.method-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e5e5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.2s;
}

.radio-dot.active {
  background: #07c160;
}

.method-item.selected .method-radio {
  border-color: #07c160;
}

.withdraw-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.withdraw-to {
  margin-bottom: 24px;
}

.withdraw-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.bank-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #f8f9fa;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e5e5;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #07c160;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #06a552;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
