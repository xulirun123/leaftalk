import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface WalletTransaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
  category?: string
}

export interface PaymentMethod {
  id: string
  type: 'bank_card' | 'alipay' | 'wechat' | 'yeyu_wallet'
  name: string
  icon: string
  isDefault: boolean
  isEnabled: boolean
}

export const useWalletStore = defineStore('wallet', () => {
  const balance = ref(0)
  const transactions = ref<WalletTransaction[]>([])
  const paymentMethods = ref<PaymentMethod[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const formattedBalance = computed(() => {
    return `¥${balance.value.toFixed(2)}`
  })

  const recentTransactions = computed(() => {
    return transactions.value
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  })

  const totalIncome = computed(() => {
    return transactions.value
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const totalExpense = computed(() => {
    return transactions.value
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  // 初始化钱包数据
  function initializeWallet() {
    balance.value = 1000.00 // 初始余额
    
    paymentMethods.value = [
      {
        id: 'yeyu_wallet',
        type: 'yeyu_wallet',
        name: '叶语钱包',
        icon: '🍃',
        isDefault: true,
        isEnabled: true
      },
      {
        id: 'alipay',
        type: 'alipay',
        name: '支付宝',
        icon: '💙',
        isDefault: false,
        isEnabled: true
      },
      {
        id: 'wechat',
        type: 'wechat',
        name: '微信支付',
        icon: '💚',
        isDefault: false,
        isEnabled: true
      }
    ]

    transactions.value = [
      {
        id: 'tx_001',
        type: 'income',
        amount: 100.00,
        description: '签到奖励',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        category: '奖励'
      },
      {
        id: 'tx_002',
        type: 'expense',
        amount: 50.00,
        description: '红包发送',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed',
        category: '社交'
      }
    ]
  }

  // 获取钱包余额
  async function fetchBalance() {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      // balance.value = response.data.balance
    } catch (err) {
      error.value = '获取余额失败'
      console.error('获取余额失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 获取交易记录
  async function fetchTransactions() {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      // transactions.value = response.data.transactions
    } catch (err) {
      error.value = '获取交易记录失败'
      console.error('获取交易记录失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 发送红包
  async function sendRedPacket(amount: number, recipient: string, message?: string) {
    if (amount > balance.value) {
      error.value = '余额不足'
      return false
    }

    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 创建交易记录
      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}`,
        type: 'expense',
        amount,
        description: `发送红包给 ${recipient}`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        category: '红包'
      }
      
      transactions.value.push(transaction)
      balance.value -= amount
      
      return true
    } catch (err) {
      error.value = '发送红包失败'
      console.error('发送红包失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 接收红包
  async function receiveRedPacket(amount: number, sender: string) {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 创建交易记录
      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}`,
        type: 'income',
        amount,
        description: `收到 ${sender} 的红包`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        category: '红包'
      }
      
      transactions.value.push(transaction)
      balance.value += amount
      
      return true
    } catch (err) {
      error.value = '接收红包失败'
      console.error('接收红包失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 转账
  async function transfer(amount: number, recipient: string, note?: string) {
    if (amount > balance.value) {
      error.value = '余额不足'
      return false
    }

    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 创建交易记录
      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}`,
        type: 'transfer',
        amount,
        description: `转账给 ${recipient}${note ? ` - ${note}` : ''}`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        category: '转账'
      }
      
      transactions.value.push(transaction)
      balance.value -= amount
      
      return true
    } catch (err) {
      error.value = '转账失败'
      console.error('转账失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 充值
  async function recharge(amount: number, paymentMethodId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const paymentMethod = paymentMethods.value.find(pm => pm.id === paymentMethodId)
      
      // 创建交易记录
      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}`,
        type: 'income',
        amount,
        description: `通过${paymentMethod?.name || '未知方式'}充值`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        category: '充值'
      }
      
      transactions.value.push(transaction)
      balance.value += amount
      
      return true
    } catch (err) {
      error.value = '充值失败'
      console.error('充值失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    balance,
    transactions,
    paymentMethods,
    isLoading,
    error,
    
    // 计算属性
    formattedBalance,
    recentTransactions,
    totalIncome,
    totalExpense,
    
    // 方法
    initializeWallet,
    fetchBalance,
    fetchTransactions,
    sendRedPacket,
    receiveRedPacket,
    transfer,
    recharge
  }
})
