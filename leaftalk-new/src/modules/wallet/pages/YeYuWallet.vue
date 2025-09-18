<template>
  <div class="yeyu-wallet-page">

    <!-- 钱包余额卡片 -->
    <div class="wallet-balance-card">
      <div class="balance-header">
        <div class="wallet-icon">
          <iconify-icon icon="heroicons:wallet" width="32"></iconify-icon>
        </div>
        <div class="balance-info">
          <div class="balance-label">钱包余额</div>
          <div class="balance-amount">¥{{ walletBalance.toFixed(2) }}</div>
        </div>
        <button @click="toggleBalanceVisibility" class="visibility-btn">
          <iconify-icon :icon="balanceVisible ? 'heroicons:eye-slash' : 'heroicons:eye'" width="20"></iconify-icon>
        </button>
      </div>
      
      <div class="balance-actions">
        <button @click="showRechargeModal = true" class="action-btn primary">
          <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
          <span>充值</span>
        </button>
        <button @click="showWithdrawModal = true" class="action-btn">
          <iconify-icon icon="heroicons:minus" width="16"></iconify-icon>
          <span>提现</span>
        </button>
        <button @click="showTransferModal = true" class="action-btn">
          <iconify-icon icon="heroicons:arrow-right-left" width="16"></iconify-icon>
          <span>转账</span>
        </button>
      </div>
    </div>

    <!-- 叶语豆余额卡片 -->
    <div class="beans-balance-card">
      <div class="balance-header">
        <div class="beans-icon">
          <iconify-icon icon="heroicons:sparkles" width="32"></iconify-icon>
        </div>
        <div class="balance-info">
          <div class="balance-label">叶语豆余额</div>
          <div class="balance-amount">{{ beansBalance }}</div>
        </div>
        <button @click="showBeansExchange = true" class="exchange-btn">
          <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
          <span>兑换</span>
        </button>
      </div>
      
      <div class="beans-info">
        <div class="info-item">
          <iconify-icon icon="heroicons:information-circle" width="16"></iconify-icon>
          <span>叶语豆可用于购买虚拟商品，价格为钱包的10倍</span>
        </div>
        <div class="info-item">
          <iconify-icon icon="heroicons:gift" width="16"></iconify-icon>
          <span>通过签到、推广等方式获得叶语豆</span>
        </div>
      </div>
    </div>

    <!-- 快捷功能 -->
    <div class="quick-functions">
      <div class="section-title">快捷功能</div>
      <div class="function-grid">
        <div class="function-item" @click="goToVirtualStore">
          <div class="function-icon">
            <iconify-icon icon="heroicons:shopping-bag" width="24"></iconify-icon>
          </div>
          <div class="function-name">虚拟商城</div>
        </div>
        
        <div class="function-item" @click="goToSignIn">
          <div class="function-icon">
            <iconify-icon icon="heroicons:calendar-days" width="24"></iconify-icon>
          </div>
          <div class="function-name">每日签到</div>
        </div>
        
        <div class="function-item" @click="goToInvite">
          <div class="function-icon">
            <iconify-icon icon="heroicons:user-plus" width="24"></iconify-icon>
          </div>
          <div class="function-name">邀请好友</div>
        </div>
        
        <div class="function-item" @click="goToTasks">
          <div class="function-icon">
            <iconify-icon icon="heroicons:trophy" width="24"></iconify-icon>
          </div>
          <div class="function-name">任务中心</div>
        </div>
      </div>
    </div>

    <!-- 最近交易 -->
    <div class="recent-transactions">
      <div class="section-title">
        <span>最近交易</span>
        <button @click="showTransactionHistory = true" class="view-all-btn">查看全部</button>
      </div>
      
      <div class="transaction-list">
        <div 
          v-for="transaction in recentTransactions" 
          :key="transaction.id"
          class="transaction-item"
        >
          <div class="transaction-icon" :class="transaction.type">
            <iconify-icon :icon="getTransactionIcon(transaction.type)" width="20"></iconify-icon>
          </div>
          <div class="transaction-info">
            <div class="transaction-title">{{ transaction.title }}</div>
            <div class="transaction-time">{{ formatTime(transaction.createdAt) }}</div>
          </div>
          <div class="transaction-amount" :class="transaction.type">
            {{ transaction.type === 'income' ? '+' : '-' }}
            {{ transaction.currency === 'wallet' ? '¥' : '' }}{{ transaction.amount }}
            {{ transaction.currency === 'beans' ? '豆' : '' }}
          </div>
        </div>
        
        <div v-if="recentTransactions.length === 0" class="empty-transactions">
          <iconify-icon icon="heroicons:banknotes" width="48"></iconify-icon>
          <p>暂无交易记录</p>
        </div>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <div v-if="showRechargeModal" class="modal-overlay" @click="showRechargeModal = false">
      <div class="recharge-modal" @click.stop>
        <div class="modal-header">
          <h3>钱包充值</h3>
          <button @click="showRechargeModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="amount-selection">
            <div class="amount-title">选择充值金额</div>
            <div class="amount-grid">
              <div 
                v-for="amount in rechargeAmounts" 
                :key="amount"
                class="amount-item"
                :class="{ active: selectedRechargeAmount === amount }"
                @click="selectedRechargeAmount = amount"
              >
                ¥{{ amount }}
              </div>
            </div>
            
            <div class="custom-amount">
              <input 
                type="number" 
                v-model="customRechargeAmount" 
                placeholder="自定义金额"
                class="amount-input"
                @input="selectedRechargeAmount = null"
              />
            </div>
          </div>
          
          <div class="payment-methods">
            <div class="payment-title">选择支付方式</div>
            <div class="payment-list">
              <label 
                v-for="method in paymentMethods" 
                :key="method.id"
                class="payment-method"
              >
                <input type="radio" v-model="selectedPaymentMethod" :value="method.id" />
                <div class="method-content">
                  <iconify-icon :icon="method.icon" width="24"></iconify-icon>
                  <span>{{ method.name }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showRechargeModal = false" class="cancel-btn">取消</button>
          <button @click="processRecharge" class="confirm-btn" :disabled="!canRecharge">
            确认充值 ¥{{ finalRechargeAmount }}
          </button>
        </div>
      </div>
    </div>

    <!-- 提现弹窗 -->
    <div v-if="showWithdrawModal" class="modal-overlay" @click="showWithdrawModal = false">
      <div class="withdraw-modal" @click.stop>
        <div class="modal-header">
          <h3>钱包提现</h3>
          <button @click="showWithdrawModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="balance-info">
            <div class="available-balance">可提现余额: ¥{{ walletBalance.toFixed(2) }}</div>
          </div>
          
          <div class="withdraw-amount">
            <label>提现金额</label>
            <input 
              type="number" 
              v-model="withdrawAmount" 
              placeholder="请输入提现金额"
              class="amount-input"
              :max="walletBalance"
            />
          </div>
          
          <div class="withdraw-account">
            <label>提现账户</label>
            <select v-model="selectedWithdrawAccount" class="account-select">
              <option value="">选择提现账户</option>
              <option 
                v-for="account in withdrawAccounts" 
                :key="account.id"
                :value="account.id"
              >
                {{ account.name }} ({{ account.account }})
              </option>
            </select>
            <button @click="showAddAccountModal = true" class="add-account-btn">
              <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
              添加账户
            </button>
          </div>
          
          <div class="withdraw-fee">
            <div class="fee-info">
              <span>手续费: ¥{{ withdrawFee.toFixed(2) }}</span>
              <span>实际到账: ¥{{ (withdrawAmount - withdrawFee).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showWithdrawModal = false" class="cancel-btn">取消</button>
          <button @click="processWithdraw" class="confirm-btn" :disabled="!canWithdraw">
            确认提现
          </button>
        </div>
      </div>
    </div>

    <!-- 转账弹窗 -->
    <div v-if="showTransferModal" class="modal-overlay" @click="showTransferModal = false">
      <div class="transfer-modal" @click.stop>
        <div class="modal-header">
          <h3>转账</h3>
          <button @click="showTransferModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="transfer-target">
            <label>转账对象</label>
            <input 
              type="text" 
              v-model="transferTarget" 
              placeholder="输入叶语ID或手机号"
              class="target-input"
            />
          </div>
          
          <div class="transfer-amount">
            <label>转账金额</label>
            <input 
              type="number" 
              v-model="transferAmount" 
              placeholder="请输入转账金额"
              class="amount-input"
              :max="walletBalance"
            />
          </div>
          
          <div class="transfer-message">
            <label>转账留言（可选）</label>
            <input 
              type="text" 
              v-model="transferMessage" 
              placeholder="写点什么..."
              class="message-input"
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showTransferModal = false" class="cancel-btn">取消</button>
          <button @click="processTransfer" class="confirm-btn" :disabled="!canTransfer">
            确认转账
          </button>
        </div>
      </div>
    </div>

    <!-- 叶语豆兑换弹窗 -->
    <div v-if="showBeansExchange" class="modal-overlay" @click="showBeansExchange = false">
      <div class="exchange-modal" @click.stop>
        <div class="modal-header">
          <h3>叶语豆兑换</h3>
          <button @click="showBeansExchange = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="exchange-info">
            <div class="exchange-rate">
              <iconify-icon icon="heroicons:information-circle" width="16"></iconify-icon>
              <span>兑换比例: 1元 = 10叶语豆</span>
            </div>
          </div>
          
          <div class="exchange-amount">
            <label>兑换金额</label>
            <input 
              type="number" 
              v-model="exchangeAmount" 
              placeholder="请输入兑换金额"
              class="amount-input"
              :max="walletBalance"
            />
            <div class="exchange-result">
              可获得 {{ exchangeAmount * 10 }} 叶语豆
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showBeansExchange = false" class="cancel-btn">取消</button>
          <button @click="processExchange" class="confirm-btn" :disabled="!canExchange">
            确认兑换
          </button>
        </div>
      </div>
    </div>

    <!-- 交易历史弹窗 -->
    <div v-if="showTransactionHistory" class="modal-overlay" @click="showTransactionHistory = false">
      <div class="history-modal" @click.stop>
        <div class="modal-header">
          <h3>交易记录</h3>
          <button @click="showTransactionHistory = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="history-filters">
          <div class="filter-tabs">
            <div 
              v-for="filter in transactionFilters" 
              :key="filter.id"
              class="filter-tab"
              :class="{ active: selectedTransactionFilter === filter.id }"
              @click="selectedTransactionFilter = filter.id"
            >
              {{ filter.name }}
            </div>
          </div>
        </div>
        
        <div class="history-list">
          <div 
            v-for="transaction in filteredTransactions" 
            :key="transaction.id"
            class="history-item"
          >
            <div class="transaction-icon" :class="transaction.type">
              <iconify-icon :icon="getTransactionIcon(transaction.type)" width="20"></iconify-icon>
            </div>
            <div class="transaction-details">
              <div class="transaction-title">{{ transaction.title }}</div>
              <div class="transaction-desc">{{ transaction.description }}</div>
              <div class="transaction-time">{{ formatDateTime(transaction.createdAt) }}</div>
            </div>
            <div class="transaction-amount" :class="transaction.type">
              {{ transaction.type === 'income' ? '+' : '-' }}
              {{ transaction.currency === 'wallet' ? '¥' : '' }}{{ transaction.amount }}
              {{ transaction.currency === 'beans' ? '豆' : '' }}
            </div>
          </div>
          
          <div v-if="filteredTransactions.length === 0" class="empty-history">
            <iconify-icon icon="heroicons:document-text" width="48"></iconify-icon>
            <p>暂无交易记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const router = useRouter()
const appStore = useAppStore()

// 余额状态
const walletBalance = ref(0)
const beansBalance = ref(0)
const balanceVisible = ref(true)

// 弹窗状态
const showRechargeModal = ref(false)
const showWithdrawModal = ref(false)
const showTransferModal = ref(false)
const showBeansExchange = ref(false)
const showTransactionHistory = ref(false)
const showAddAccountModal = ref(false)

// 充值相关
const rechargeAmounts = ref([10, 50, 100, 200, 500, 1000])
const selectedRechargeAmount = ref(null)
const customRechargeAmount = ref('')
const selectedPaymentMethod = ref('wechat')

// 提现相关
const withdrawAmount = ref('')
const selectedWithdrawAccount = ref('')
const withdrawAccounts = ref([])

// 转账相关
const transferTarget = ref('')
const transferAmount = ref('')
const transferMessage = ref('')

// 兑换相关
const exchangeAmount = ref('')

// 交易记录
const recentTransactions = ref([])
const allTransactions = ref([])
const selectedTransactionFilter = ref('all')

// 支付方式
const paymentMethods = ref([
  { id: 'wechat', name: '微信支付', icon: 'ri:wechat-pay-line' },
  { id: 'alipay', name: '支付宝', icon: 'ri:alipay-line' },
  { id: 'bank', name: '银行卡', icon: 'heroicons:credit-card' }
])

// 交易筛选
const transactionFilters = ref([
  { id: 'all', name: '全部' },
  { id: 'income', name: '收入' },
  { id: 'expense', name: '支出' },
  { id: 'wallet', name: '钱包' },
  { id: 'beans', name: '叶语豆' }
])

// 计算属性
const finalRechargeAmount = computed(() => {
  return selectedRechargeAmount.value || parseFloat(customRechargeAmount.value) || 0
})

const canRecharge = computed(() => {
  return finalRechargeAmount.value > 0 && selectedPaymentMethod.value
})

const withdrawFee = computed(() => {
  const amount = parseFloat(withdrawAmount.value) || 0
  return Math.max(amount * 0.001, 2) // 最低2元手续费
})

const canWithdraw = computed(() => {
  const amount = parseFloat(withdrawAmount.value) || 0
  return amount > 0 && amount <= walletBalance.value && selectedWithdrawAccount.value
})

const canTransfer = computed(() => {
  const amount = parseFloat(transferAmount.value) || 0
  return amount > 0 && amount <= walletBalance.value && transferTarget.value
})

const canExchange = computed(() => {
  const amount = parseFloat(exchangeAmount.value) || 0
  return amount > 0 && amount <= walletBalance.value
})

const filteredTransactions = computed(() => {
  if (selectedTransactionFilter.value === 'all') {
    return allTransactions.value
  }
  
  return allTransactions.value.filter(transaction => {
    if (selectedTransactionFilter.value === 'income' || selectedTransactionFilter.value === 'expense') {
      return transaction.type === selectedTransactionFilter.value
    }
    return transaction.currency === selectedTransactionFilter.value
  })
})

// 生命周期
onMounted(() => {
  loadWalletData()
  loadTransactions()
  loadWithdrawAccounts()
})

// 方法
const loadWalletData = async () => {
  try {
    const response = await fetch('/api/user/wallet', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        walletBalance.value = result.data.walletBalance
        beansBalance.value = result.data.beansBalance
      }
    }
  } catch (error) {
    console.error('加载钱包数据失败:', error)
  }
}

const loadTransactions = async () => {
  try {
    const response = await fetch('/api/user/transactions', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        allTransactions.value = result.data
        recentTransactions.value = result.data.slice(0, 5)
      }
    }
  } catch (error) {
    console.error('加载交易记录失败:', error)
  }
}

const loadWithdrawAccounts = async () => {
  try {
    const response = await fetch('/api/user/withdraw-accounts', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        withdrawAccounts.value = result.data
      }
    }
  } catch (error) {
    console.error('加载提现账户失败:', error)
  }
}

const toggleBalanceVisibility = () => {
  balanceVisible.value = !balanceVisible.value
}

const processRecharge = async () => {
  try {
    appStore.showLoading('处理中...')
    
    const rechargeData = {
      amount: finalRechargeAmount.value,
      paymentMethod: selectedPaymentMethod.value
    }
    
    const response = await fetch('/api/wallet/recharge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(rechargeData)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('充值成功', 'success')
        showRechargeModal.value = false
        loadWalletData()
        loadTransactions()
      } else {
        appStore.showToast(result.message || '充值失败', 'error')
      }
    } else {
      appStore.showToast('充值请求失败', 'error')
    }
  } catch (error) {
    console.error('充值失败:', error)
    appStore.showToast('充值失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

const processWithdraw = async () => {
  try {
    appStore.showLoading('处理中...')
    
    const withdrawData = {
      amount: parseFloat(withdrawAmount.value),
      accountId: selectedWithdrawAccount.value
    }
    
    const response = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(withdrawData)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('提现申请已提交', 'success')
        showWithdrawModal.value = false
        loadWalletData()
        loadTransactions()
      } else {
        appStore.showToast(result.message || '提现失败', 'error')
      }
    } else {
      appStore.showToast('提现请求失败', 'error')
    }
  } catch (error) {
    console.error('提现失败:', error)
    appStore.showToast('提现失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

const processTransfer = async () => {
  try {
    appStore.showLoading('处理中...')
    
    const transferData = {
      target: transferTarget.value,
      amount: parseFloat(transferAmount.value),
      message: transferMessage.value
    }
    
    const response = await fetch('/api/wallet/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(transferData)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('转账成功', 'success')
        showTransferModal.value = false
        loadWalletData()
        loadTransactions()
      } else {
        appStore.showToast(result.message || '转账失败', 'error')
      }
    } else {
      appStore.showToast('转账请求失败', 'error')
    }
  } catch (error) {
    console.error('转账失败:', error)
    appStore.showToast('转账失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

const processExchange = async () => {
  try {
    appStore.showLoading('处理中...')
    
    const exchangeData = {
      amount: parseFloat(exchangeAmount.value)
    }
    
    const response = await fetch('/api/wallet/exchange-beans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(exchangeData)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('兑换成功', 'success')
        showBeansExchange.value = false
        loadWalletData()
        loadTransactions()
      } else {
        appStore.showToast(result.message || '兑换失败', 'error')
      }
    } else {
      appStore.showToast('兑换请求失败', 'error')
    }
  } catch (error) {
    console.error('兑换失败:', error)
    appStore.showToast('兑换失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 导航方法
const goToVirtualStore = () => {
  router.push('/virtual-store')
}

const goToSignIn = () => {
  router.push('/daily-signin')
}

const goToInvite = () => {
  router.push('/invite-friends')
}

const goToTasks = () => {
  router.push('/task-center')
}

// 辅助方法
const getTransactionIcon = (type) => {
  const icons = {
    income: 'heroicons:arrow-down-left',
    expense: 'heroicons:arrow-up-right',
    recharge: 'heroicons:plus-circle',
    withdraw: 'heroicons:minus-circle',
    transfer: 'heroicons:arrow-right-left',
    exchange: 'heroicons:arrow-path'
  }
  return icons[type] || 'heroicons:banknotes'
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.yeyu-wallet-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .history-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  border-radius: 50%;
}

.back-btn:hover, .history-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

/* 钱包余额卡片 */
.wallet-balance-card {
  background: rgba(255, 255, 255, 0.95);
  margin: 16px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.balance-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.wallet-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.balance-info {
  flex: 1;
}

.balance-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.balance-amount {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.visibility-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.balance-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 叶语豆余额卡片 */
.beans-balance-card {
  background: rgba(255, 255, 255, 0.95);
  margin: 0 16px 16px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.beans-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.exchange-btn {
  height: 32px;
  border: 1px solid #FFD700;
  border-radius: 6px;
  background: rgba(255, 215, 0, 0.1);
  color: #FFD700;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  cursor: pointer;
}

.beans-info {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

/* 快捷功能 */
.quick-functions {
  background: rgba(255, 255, 255, 0.95);
  margin: 0 16px 16px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.function-item:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.function-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.function-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

/* 最近交易 */
.recent-transactions {
  background: rgba(255, 255, 255, 0.95);
  margin: 0 16px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.view-all-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.transaction-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.transaction-icon.income {
  background: #4CAF50;
}

.transaction-icon.expense {
  background: #f44336;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.transaction-time {
  font-size: 12px;
  color: #666;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 600;
}

.transaction-amount.income {
  color: #4CAF50;
}

.transaction-amount.expense {
  color: #f44336;
}

.empty-transactions {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-transactions iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}

/* 弹窗样式 */
.modal-overlay {
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
  padding: 20px;
}

.recharge-modal,
.withdraw-modal,
.transfer-modal,
.exchange-modal,
.history-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 充值弹窗 */
.amount-selection {
  margin-bottom: 20px;
}

.amount-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.amount-item {
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.amount-item.active {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.custom-amount {
  margin-top: 12px;
}

.amount-input,
.target-input,
.message-input,
.account-select {
  width: 100%;
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
}

.payment-methods {
  margin-bottom: 20px;
}

.payment-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method:hover {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

.payment-method input[type="radio"] {
  accent-color: #4CAF50;
}

.method-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  flex: 1;
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.confirm-btn {
  flex: 2;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #4CAF50;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 提现弹窗特殊样式 */
.available-balance {
  font-size: 14px;
  color: #4CAF50;
  margin-bottom: 16px;
}

.withdraw-amount,
.withdraw-account {
  margin-bottom: 16px;
}

.withdraw-account label,
.transfer-target label,
.transfer-amount label,
.transfer-message label,
.exchange-amount label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.add-account-btn {
  margin-top: 8px;
  height: 32px;
  border: 1px solid #4CAF50;
  border-radius: 6px;
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  cursor: pointer;
}

.withdraw-fee {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
}

.fee-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

/* 兑换弹窗 */
.exchange-info {
  margin-bottom: 20px;
}

.exchange-rate {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  background: #f0f8ff;
  padding: 12px;
  border-radius: 8px;
}

.exchange-result {
  margin-top: 8px;
  font-size: 14px;
  color: #4CAF50;
  font-weight: 500;
}

/* 交易历史弹窗 */
.history-filters {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.filter-tabs {
  display: flex;
  gap: 16px;
}

.filter-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.filter-tab.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

.history-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-details {
  flex: 1;
}

.transaction-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-history iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}
</style>
