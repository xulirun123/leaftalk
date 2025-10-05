import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PaymentMethod {
  id: string
  type: 'bank_card' | 'alipay' | 'wechat' | 'yeyu_wallet'
  name: string
  icon: string
  isDefault: boolean
  isEnabled: boolean
  balance?: number
}

export interface PaymentRecord {
  id: string
  type: 'red_packet' | 'transfer' | 'recharge' | 'withdraw'
  amount: number
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  fromUser?: string
  toUser?: string
  description: string
  createdAt: string
  completedAt?: string
  paymentMethod: string
}

export interface RedPacket {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  amount: number
  count: number
  message: string
  type: 'random' | 'fixed'
  status: 'active' | 'expired' | 'completed'
  createdAt: string
  expiresAt: string
  receivedCount: number
  receivedAmount: number
  receivers: RedPacketReceiver[]
}

export interface RedPacketReceiver {
  userId: string
  userName: string
  userAvatar: string
  amount: number
  receivedAt: string
}

export const usePaymentStore = defineStore('payment', () => {
  const balance = ref(1000.00)
  const paymentMethods = ref<PaymentMethod[]>([])
  const paymentRecords = ref<PaymentRecord[]>([])
  const redPackets = ref<RedPacket[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const formattedBalance = computed(() => {
    return `¥${balance.value.toFixed(2)}`
  })

  const recentRecords = computed(() => {
    return paymentRecords.value
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  })

  const activeRedPackets = computed(() => {
    return redPackets.value.filter(packet => packet.status === 'active')
  })

  // 初始化支付数据
  function initializePayment() {
    paymentMethods.value = [
      {
        id: 'yeyu_wallet',
        type: 'yeyu_wallet',
        name: '叶语钱包',
        icon: '🍃',
        isDefault: true,
        isEnabled: true,
        balance: balance.value
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

    // 模拟一些支付记录
    paymentRecords.value = [
      {
        id: 'pay_001',
        type: 'red_packet',
        amount: 88.88,
        status: 'success',
        toUser: '张三',
        description: '新年红包',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: 'yeyu_wallet'
      },
      {
        id: 'pay_002',
        type: 'transfer',
        amount: 200.00,
        status: 'success',
        toUser: '李四',
        description: '转账',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 172800000).toISOString(),
        paymentMethod: 'yeyu_wallet'
      }
    ]
  }

  // 发送红包
  async function sendRedPacket(
    amount: number,
    count: number,
    message: string,
    type: 'random' | 'fixed' = 'random',
    recipients?: string[]
  ): Promise<RedPacket | null> {
    if (amount > balance.value) {
      error.value = '余额不足'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const redPacket: RedPacket = {
        id: `rp_${Date.now()}`,
        senderId: 'current_user',
        senderName: '当前用户',
        senderAvatar: '👤',
        amount,
        count,
        message,
        type,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后过期
        receivedCount: 0,
        receivedAmount: 0,
        receivers: []
      }

      redPackets.value.push(redPacket)
      balance.value -= amount

      // 创建支付记录
      const record: PaymentRecord = {
        id: `pay_${Date.now()}`,
        type: 'red_packet',
        amount,
        status: 'success',
        description: `发送红包: ${message}`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        paymentMethod: 'yeyu_wallet'
      }

      paymentRecords.value.push(record)

      return redPacket
    } catch (err) {
      error.value = '发送红包失败'
      console.error('发送红包失败:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 抢红包
  async function grabRedPacket(redPacketId: string): Promise<number | null> {
    isLoading.value = true
    error.value = null

    try {
      const redPacket = redPackets.value.find(rp => rp.id === redPacketId)
      if (!redPacket) {
        throw new Error('红包不存在')
      }

      if (redPacket.status !== 'active') {
        throw new Error('红包已过期或已抢完')
      }

      if (redPacket.receivedCount >= redPacket.count) {
        throw new Error('红包已抢完')
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      // 计算抢到的金额
      let grabAmount: number
      if (redPacket.type === 'fixed') {
        grabAmount = redPacket.amount / redPacket.count
      } else {
        // 随机红包算法
        const remainingAmount = redPacket.amount - redPacket.receivedAmount
        const remainingCount = redPacket.count - redPacket.receivedCount
        
        if (remainingCount === 1) {
          grabAmount = remainingAmount
        } else {
          const maxAmount = remainingAmount / remainingCount * 2
          grabAmount = Math.random() * maxAmount
          grabAmount = Math.max(0.01, Math.min(grabAmount, remainingAmount))
        }
      }

      grabAmount = Math.round(grabAmount * 100) / 100

      // 更新红包状态
      const receiver: RedPacketReceiver = {
        userId: 'current_user',
        userName: '当前用户',
        userAvatar: '👤',
        amount: grabAmount,
        receivedAt: new Date().toISOString()
      }

      redPacket.receivers.push(receiver)
      redPacket.receivedCount++
      redPacket.receivedAmount += grabAmount

      if (redPacket.receivedCount >= redPacket.count) {
        redPacket.status = 'completed'
      }

      // 更新余额
      balance.value += grabAmount

      // 创建支付记录
      const record: PaymentRecord = {
        id: `pay_${Date.now()}`,
        type: 'red_packet',
        amount: grabAmount,
        status: 'success',
        fromUser: redPacket.senderName,
        description: `收到红包: ${redPacket.message}`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        paymentMethod: 'yeyu_wallet'
      }

      paymentRecords.value.push(record)

      return grabAmount
    } catch (err) {
      error.value = err instanceof Error ? err.message : '抢红包失败'
      console.error('抢红包失败:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 转账
  async function transfer(
    toUser: string,
    amount: number,
    description: string = '转账'
  ): Promise<boolean> {
    if (amount > balance.value) {
      error.value = '余额不足'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      balance.value -= amount

      // 创建支付记录
      const record: PaymentRecord = {
        id: `pay_${Date.now()}`,
        type: 'transfer',
        amount,
        status: 'success',
        toUser,
        description,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        paymentMethod: 'yeyu_wallet'
      }

      paymentRecords.value.push(record)

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
  async function recharge(amount: number, paymentMethodId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))

      balance.value += amount

      const paymentMethod = paymentMethods.value.find(pm => pm.id === paymentMethodId)

      // 创建支付记录
      const record: PaymentRecord = {
        id: `pay_${Date.now()}`,
        type: 'recharge',
        amount,
        status: 'success',
        description: `通过${paymentMethod?.name || '未知方式'}充值`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        paymentMethod: paymentMethodId
      }

      paymentRecords.value.push(record)

      return true
    } catch (err) {
      error.value = '充值失败'
      console.error('充值失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 提现
  async function withdraw(amount: number, paymentMethodId: string): Promise<boolean> {
    if (amount > balance.value) {
      error.value = '余额不足'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))

      balance.value -= amount

      const paymentMethod = paymentMethods.value.find(pm => pm.id === paymentMethodId)

      // 创建支付记录
      const record: PaymentRecord = {
        id: `pay_${Date.now()}`,
        type: 'withdraw',
        amount,
        status: 'success',
        description: `提现到${paymentMethod?.name || '未知方式'}`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        paymentMethod: paymentMethodId
      }

      paymentRecords.value.push(record)

      return true
    } catch (err) {
      error.value = '提现失败'
      console.error('提现失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 获取支付记录
  async function fetchPaymentRecords() {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      // paymentRecords.value = response.data.records
    } catch (err) {
      error.value = '获取支付记录失败'
      console.error('获取支付记录失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    balance,
    paymentMethods,
    paymentRecords,
    redPackets,
    isLoading,
    error,

    // 计算属性
    formattedBalance,
    recentRecords,
    activeRedPackets,

    // 方法
    initializePayment,
    sendRedPacket,
    grabRedPacket,
    transfer,
    recharge,
    withdraw,
    fetchPaymentRecords
  }
})
