import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PaymentMethod {
  id: string
  type: 'bank_card' | 'alipay' | 'wechat' | 'yeyu_coin'
  name: string
  icon: string
  cardNumber?: string
  bankName?: string
  isDefault: boolean
  isEnabled: boolean
  balance?: number
  createdAt: number
}

export interface Transaction {
  id: string
  type: 'transfer' | 'red_packet' | 'recharge' | 'withdraw' | 'payment' | 'refund'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  amount: number
  currency: 'CNY' | 'YYC' // CNY: 人民币, YYC: 叶语币
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  toUserId: string
  toUserName: string
  toUserAvatar: string
  description: string
  remark?: string
  paymentMethodId?: string
  transactionFee: number
  createdAt: number
  completedAt?: number
  failureReason?: string
}

export interface RedPacket {
  id: string
  type: 'normal' | 'lucky' | 'group'
  status: 'pending' | 'claimed' | 'expired' | 'refunded'
  senderId: string
  senderName: string
  senderAvatar: string
  receiverId?: string
  receiverName?: string
  receiverAvatar?: string
  groupId?: string
  totalAmount: number
  claimedAmount: number
  remainingAmount: number
  totalCount: number
  claimedCount: number
  remainingCount: number
  blessing: string
  cover: string
  password?: string
  expiresAt: number
  createdAt: number
  claimedAt?: number
  claims: RedPacketClaim[]
}

export interface RedPacketClaim {
  id: string
  redPacketId: string
  userId: string
  userName: string
  userAvatar: string
  amount: number
  claimedAt: number
  isLucky?: boolean
}

export interface Wallet {
  id: string
  userId: string
  balance: number
  frozenAmount: number
  availableAmount: number
  yeyuCoinBalance: number
  totalIncome: number
  totalExpense: number
  currency: 'CNY'
  lastUpdatedAt: number
}

export interface PaymentSettings {
  paymentPassword: string
  fingerprintEnabled: boolean
  faceIdEnabled: boolean
  autoPayLimit: number
  transferLimit: number
  dailyLimit: number
  monthlyLimit: number
  requirePasswordForTransfer: boolean
  requirePasswordForRedPacket: boolean
  allowReceiveFromStrangers: boolean
  notificationEnabled: boolean
}

export const usePaymentStore = defineStore('payment', () => {
  // 状态
  const wallet = ref<Wallet | null>(null)
  const paymentMethods = ref<PaymentMethod[]>([])
  const transactions = ref<Transaction[]>([])
  const redPackets = ref<RedPacket[]>([])
  const settings = ref<PaymentSettings>({
    paymentPassword: '',
    fingerprintEnabled: false,
    faceIdEnabled: false,
    autoPayLimit: 200,
    transferLimit: 5000,
    dailyLimit: 20000,
    monthlyLimit: 100000,
    requirePasswordForTransfer: true,
    requirePasswordForRedPacket: true,
    allowReceiveFromStrangers: true,
    notificationEnabled: true
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const availableBalance = computed(() => wallet.value?.availableAmount || 0)
  const totalBalance = computed(() => wallet.value?.balance || 0)
  const yeyuCoinBalance = computed(() => wallet.value?.yeyuCoinBalance || 0)

  const defaultPaymentMethod = computed(() => 
    paymentMethods.value.find(method => method.isDefault)
  )

  const enabledPaymentMethods = computed(() => 
    paymentMethods.value.filter(method => method.isEnabled)
  )

  const pendingTransactions = computed(() => 
    transactions.value.filter(tx => tx.status === 'pending' || tx.status === 'processing')
  )

  const todayTransactions = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return transactions.value.filter(tx => tx.createdAt >= today.getTime())
  })

  const todayExpense = computed(() => 
    todayTransactions.value
      .filter(tx => tx.type === 'transfer' || tx.type === 'red_packet' || tx.type === 'payment')
      .reduce((sum, tx) => sum + tx.amount, 0)
  )

  // 钱包管理
  const loadWallet = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await fetch('/api/wallet')
      
      if (!response.ok) {
        throw new Error('获取钱包信息失败')
      }

      const data = await response.json()
      wallet.value = data.wallet || getMockWallet()

    } catch (err) {
      console.error('加载钱包失败:', err)
      error.value = err instanceof Error ? err.message : '加载失败'
      
      // 使用模拟数据
      wallet.value = getMockWallet()
    } finally {
      loading.value = false
    }
  }

  const rechargeWallet = async (amount: number, paymentMethodId: string) => {
    try {
      loading.value = true

      const response = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethodId })
      })

      if (!response.ok) {
        throw new Error('充值失败')
      }

      const data = await response.json()
      
      // 更新钱包余额
      if (wallet.value) {
        wallet.value.balance += amount
        wallet.value.availableAmount += amount
        wallet.value.totalIncome += amount
        wallet.value.lastUpdatedAt = Date.now()
      }

      // 添加交易记录
      const transaction: Transaction = {
        id: data.transactionId || `tx_${Date.now()}`,
        type: 'recharge',
        status: 'completed',
        amount,
        currency: 'CNY',
        fromUserId: 'system',
        fromUserName: '系统',
        fromUserAvatar: '',
        toUserId: 'current_user',
        toUserName: '我',
        toUserAvatar: '',
        description: '钱包充值',
        paymentMethodId,
        transactionFee: 0,
        createdAt: Date.now(),
        completedAt: Date.now()
      }

      transactions.value.unshift(transaction)

      return { success: true, transaction }

    } catch (err) {
      console.error('充值失败:', err)
      error.value = err instanceof Error ? err.message : '充值失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const withdrawWallet = async (amount: number, paymentMethodId: string) => {
    try {
      loading.value = true

      if (amount > availableBalance.value) {
        throw new Error('余额不足')
      }

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethodId })
      })

      if (!response.ok) {
        throw new Error('提现失败')
      }

      const data = await response.json()
      
      // 更新钱包余额
      if (wallet.value) {
        wallet.value.balance -= amount
        wallet.value.availableAmount -= amount
        wallet.value.totalExpense += amount
        wallet.value.lastUpdatedAt = Date.now()
      }

      // 添加交易记录
      const transaction: Transaction = {
        id: data.transactionId || `tx_${Date.now()}`,
        type: 'withdraw',
        status: 'processing',
        amount,
        currency: 'CNY',
        fromUserId: 'current_user',
        fromUserName: '我',
        fromUserAvatar: '',
        toUserId: 'system',
        toUserName: '银行卡',
        toUserAvatar: '',
        description: '钱包提现',
        paymentMethodId,
        transactionFee: amount * 0.001, // 0.1% 手续费
        createdAt: Date.now()
      }

      transactions.value.unshift(transaction)

      return { success: true, transaction }

    } catch (err) {
      console.error('提现失败:', err)
      error.value = err instanceof Error ? err.message : '提现失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 转账功能
  const sendTransfer = async (
    toUserId: string, 
    amount: number, 
    remark?: string,
    paymentPassword?: string
  ) => {
    try {
      loading.value = true

      // 验证余额
      if (amount > availableBalance.value) {
        throw new Error('余额不足')
      }

      // 验证限额
      if (amount > settings.value.transferLimit) {
        throw new Error(`单笔转账限额为${settings.value.transferLimit}元`)
      }

      if (todayExpense.value + amount > settings.value.dailyLimit) {
        throw new Error(`今日支付限额为${settings.value.dailyLimit}元`)
      }

      const response = await fetch('/api/payment/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          toUserId, 
          amount, 
          remark,
          paymentPassword 
        })
      })

      if (!response.ok) {
        throw new Error('转账失败')
      }

      const data = await response.json()
      
      // 更新钱包余额
      if (wallet.value) {
        wallet.value.balance -= amount
        wallet.value.availableAmount -= amount
        wallet.value.totalExpense += amount
        wallet.value.lastUpdatedAt = Date.now()
      }

      // 添加交易记录
      const transaction: Transaction = {
        id: data.transactionId || `tx_${Date.now()}`,
        type: 'transfer',
        status: 'completed',
        amount,
        currency: 'CNY',
        fromUserId: 'current_user',
        fromUserName: '我',
        fromUserAvatar: '',
        toUserId,
        toUserName: data.toUserName || '对方',
        toUserAvatar: data.toUserAvatar || '',
        description: '转账',
        remark,
        transactionFee: 0,
        createdAt: Date.now(),
        completedAt: Date.now()
      }

      transactions.value.unshift(transaction)

      return { success: true, transaction }

    } catch (err) {
      console.error('转账失败:', err)
      error.value = err instanceof Error ? err.message : '转账失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 红包功能
  const sendRedPacket = async (
    type: 'normal' | 'lucky' | 'group',
    amount: number,
    count: number,
    blessing: string,
    receiverId?: string,
    groupId?: string,
    paymentPassword?: string
  ) => {
    try {
      loading.value = true

      // 验证余额
      if (amount > availableBalance.value) {
        throw new Error('余额不足')
      }

      const response = await fetch('/api/payment/red-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount,
          count,
          blessing,
          receiverId,
          groupId,
          paymentPassword
        })
      })

      if (!response.ok) {
        throw new Error('发送红包失败')
      }

      const data = await response.json()
      
      // 更新钱包余额
      if (wallet.value) {
        wallet.value.balance -= amount
        wallet.value.availableAmount -= amount
        wallet.value.totalExpense += amount
        wallet.value.lastUpdatedAt = Date.now()
      }

      // 创建红包记录
      const redPacket: RedPacket = {
        id: data.redPacketId || `rp_${Date.now()}`,
        type,
        status: 'pending',
        senderId: 'current_user',
        senderName: '我',
        senderAvatar: '',
        receiverId,
        groupId,
        totalAmount: amount,
        claimedAmount: 0,
        remainingAmount: amount,
        totalCount: count,
        claimedCount: 0,
        remainingCount: count,
        blessing,
        cover: 'red_packet_cover_1',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
        createdAt: Date.now(),
        claims: []
      }

      redPackets.value.unshift(redPacket)

      // 添加交易记录
      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'red_packet',
        status: 'completed',
        amount,
        currency: 'CNY',
        fromUserId: 'current_user',
        fromUserName: '我',
        fromUserAvatar: '',
        toUserId: receiverId || groupId || 'group',
        toUserName: type === 'group' ? '群红包' : '红包',
        toUserAvatar: '',
        description: `${type === 'group' ? '群' : ''}红包`,
        remark: blessing,
        transactionFee: 0,
        createdAt: Date.now(),
        completedAt: Date.now()
      }

      transactions.value.unshift(transaction)

      return { success: true, redPacket, transaction }

    } catch (err) {
      console.error('发送红包失败:', err)
      error.value = err instanceof Error ? err.message : '发送红包失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const claimRedPacket = async (redPacketId: string) => {
    try {
      loading.value = true

      const response = await fetch(`/api/payment/red-packet/${redPacketId}/claim`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('领取红包失败')
      }

      const data = await response.json()
      
      // 更新红包状态
      const redPacket = redPackets.value.find(rp => rp.id === redPacketId)
      if (redPacket) {
        redPacket.claimedAmount += data.amount
        redPacket.remainingAmount -= data.amount
        redPacket.claimedCount += 1
        redPacket.remainingCount -= 1
        
        if (redPacket.remainingCount === 0) {
          redPacket.status = 'claimed'
        }

        // 添加领取记录
        redPacket.claims.push({
          id: `claim_${Date.now()}`,
          redPacketId,
          userId: 'current_user',
          userName: '我',
          userAvatar: '',
          amount: data.amount,
          claimedAt: Date.now(),
          isLucky: data.isLucky
        })
      }

      // 更新钱包余额
      if (wallet.value) {
        wallet.value.balance += data.amount
        wallet.value.availableAmount += data.amount
        wallet.value.totalIncome += data.amount
        wallet.value.lastUpdatedAt = Date.now()
      }

      return { success: true, amount: data.amount, isLucky: data.isLucky }

    } catch (err) {
      console.error('领取红包失败:', err)
      error.value = err instanceof Error ? err.message : '领取红包失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 支付方式管理
  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment/methods')
      
      if (!response.ok) {
        throw new Error('获取支付方式失败')
      }

      const data = await response.json()
      paymentMethods.value = data.methods || getMockPaymentMethods()

    } catch (err) {
      console.error('加载支付方式失败:', err)
      // 使用模拟数据
      paymentMethods.value = getMockPaymentMethods()
    }
  }

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/payment/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method)
      })

      if (!response.ok) {
        throw new Error('添加支付方式失败')
      }

      const data = await response.json()
      
      const newMethod: PaymentMethod = {
        ...method,
        id: data.methodId || `pm_${Date.now()}`,
        createdAt: Date.now()
      }

      paymentMethods.value.push(newMethod)

      return { success: true, method: newMethod }

    } catch (err) {
      console.error('添加支付方式失败:', err)
      throw err
    }
  }

  // 交易记录管理
  const loadTransactions = async (page = 1, limit = 20, type?: string) => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString() 
      })
      
      if (type) params.append('type', type)

      const response = await fetch(`/api/payment/transactions?${params}`)
      
      if (!response.ok) {
        throw new Error('获取交易记录失败')
      }

      const data = await response.json()
      
      if (page === 1) {
        transactions.value = data.transactions || getMockTransactions()
      } else {
        transactions.value.push(...(data.transactions || []))
      }

    } catch (err) {
      console.error('加载交易记录失败:', err)
      // 使用模拟数据
      if (page === 1) {
        transactions.value = getMockTransactions()
      }
    }
  }

  // 模拟数据生成
  const getMockWallet = (): Wallet => ({
    id: 'wallet_001',
    userId: 'current_user',
    balance: 1580.50,
    frozenAmount: 0,
    availableAmount: 1580.50,
    yeyuCoinBalance: 2500,
    totalIncome: 5680.30,
    totalExpense: 4099.80,
    currency: 'CNY',
    lastUpdatedAt: Date.now()
  })

  const getMockPaymentMethods = (): PaymentMethod[] => [
    {
      id: 'pm_001',
      type: 'yeyu_coin',
      name: '叶语币',
      icon: 'yeyu-coin',
      isDefault: true,
      isEnabled: true,
      balance: 2500,
      createdAt: Date.now() - 86400000
    },
    {
      id: 'pm_002',
      type: 'bank_card',
      name: '招商银行储蓄卡',
      icon: 'bank-card',
      cardNumber: '**** **** **** 8888',
      bankName: '招商银行',
      isDefault: false,
      isEnabled: true,
      createdAt: Date.now() - 172800000
    }
  ]

  const getMockTransactions = (): Transaction[] => [
    {
      id: 'tx_001',
      type: 'transfer',
      status: 'completed',
      amount: 100.00,
      currency: 'CNY',
      fromUserId: 'current_user',
      fromUserName: '我',
      fromUserAvatar: '',
      toUserId: 'user_002',
      toUserName: '张三',
      toUserAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      description: '转账',
      remark: '还款',
      transactionFee: 0,
      createdAt: Date.now() - 3600000,
      completedAt: Date.now() - 3600000
    }
  ]

  // 清理错误状态
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    wallet,
    paymentMethods,
    transactions,
    redPackets,
    settings,
    loading,
    error,

    // 计算属性
    availableBalance,
    totalBalance,
    yeyuCoinBalance,
    defaultPaymentMethod,
    enabledPaymentMethods,
    pendingTransactions,
    todayTransactions,
    todayExpense,

    // 方法
    loadWallet,
    rechargeWallet,
    withdrawWallet,
    sendTransfer,
    sendRedPacket,
    claimRedPacket,
    loadPaymentMethods,
    addPaymentMethod,
    loadTransactions,
    clearError
  }
})
