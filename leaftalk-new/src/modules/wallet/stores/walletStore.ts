import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Transaction {
  id: string
  type: 'redpacket_send' | 'redpacket_receive' | 'transfer_send' | 'transfer_receive' | 'recharge' | 'withdraw' | 'income' | 'expense'
  amount: number
  currency: 'CNY' | 'BEANS' // 货币类型：人民币或叶语豆
  description: string
  timestamp: number
  status: 'success' | 'pending' | 'failed'
  fromUser?: string
  toUser?: string
  targetUserId?: string
  targetUserName?: string
  redpacketId?: string
}

export interface BeansTransaction {
  id: string
  type: 'earn' | 'spend' | 'exchange'
  amount: number
  description: string
  timestamp: number
  status: 'success' | 'pending' | 'failed'
  source?: string // 获得来源：签到、分享、推荐等
}

export interface RedPacket {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  chatId: string
  type: 'normal' | 'lucky' // 普通红包 | 拼手气红包
  totalAmount: number
  totalCount: number
  remainingAmount: number
  remainingCount: number
  blessing: string
  timestamp: number
  expireTime: number
  receivers: {
    userId: string
    userName: string
    userAvatar: string
    amount: number
    timestamp: number
  }[]
  status: 'active' | 'expired' | 'finished' | 'refunded'
}

export const useWalletStore = defineStore('wallet', () => {
  // 叶语钱包余额（人民币）
  const balance = ref(1000.00) // 默认余额1000元

  // 叶语豆余额
  const beansBalance = ref(500) // 默认500个叶语豆

  // 红包数据
  const redpackets = ref<RedPacket[]>([])

  // 支付密码
  const paymentPassword = ref('123456') // 默认支付密码

  // 钱包交易记录
  const transactions = ref<Transaction[]>([
    {
      id: '1',
      type: 'income',
      amount: 100.00,
      currency: 'CNY',
      description: '收到转账',
      timestamp: Date.now() - 86400000,
      status: 'success',
      fromUser: '张三'
    },
    {
      id: '2',
      type: 'expense',
      amount: 50.00,
      currency: 'CNY',
      description: '发送红包',
      timestamp: Date.now() - 43200000,
      status: 'success',
      toUser: '李四'
    }
  ])

  // 叶语豆交易记录
  const beansTransactions = ref<BeansTransaction[]>([
    {
      id: 'b1',
      type: 'earn',
      amount: 10,
      description: '每日签到奖励',
      timestamp: Date.now() - 86400000,
      status: 'success',
      source: '签到'
    },
    {
      id: 'b2',
      type: 'spend',
      amount: 5,
      description: '购买虚拟礼物',
      timestamp: Date.now() - 43200000,
      status: 'success'
    }
  ])

  // 计算属性
  const formattedBalance = computed(() => {
    return balance.value.toFixed(2)
  })

  const formattedBeansBalance = computed(() => {
    return beansBalance.value.toLocaleString()
  })

  const recentTransactions = computed(() => {
    return transactions.value
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
  })

  const recentBeansTransactions = computed(() => {
    return beansTransactions.value
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
  })

  // 叶语豆兑换率：1元 = 10叶语豆
  const exchangeRate = computed(() => 10)

  // 核心钱包功能方法

  // 验证支付密码
  const verifyPaymentPassword = (password: string): boolean => {
    return password === paymentPassword.value
  }

  // 检查余额是否足够
  const checkBalance = (amount: number): boolean => {
    return balance.value >= amount
  }

  // 扣除余额
  const deductBalance = (amount: number, description: string, targetUserId?: string, targetUserName?: string): boolean => {
    if (!checkBalance(amount)) {
      console.warn('💰 余额不足，当前余额:', balance.value, '需要:', amount)
      return false
    }

    balance.value -= amount

    // 记录交易
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: description.includes('红包') ? 'redpacket_send' : 'transfer_send',
      amount: amount,
      currency: 'CNY',
      description,
      timestamp: Date.now(),
      targetUserId,
      targetUserName,
      status: 'success'
    }

    transactions.value.unshift(transaction)
    saveToStorage()

    console.log('💸 扣除余额:', amount, '元，剩余:', balance.value, '元')
    return true
  }

  // 增加余额
  const addBalance = (amount: number, description: string, fromUserId?: string, fromUserName?: string) => {
    balance.value += amount

    // 记录交易
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: description.includes('红包') ? 'redpacket_receive' : 'transfer_receive',
      amount: amount,
      currency: 'CNY',
      description,
      timestamp: Date.now(),
      fromUser: fromUserName,
      targetUserId: fromUserId,
      targetUserName: fromUserName,
      status: 'success'
    }

    transactions.value.unshift(transaction)
    saveToStorage()

    console.log('💰 增加余额:', amount, '元，当前:', balance.value, '元')
  }

  // 方法
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString()
    }
    transactions.value.unshift(newTransaction)

    // 更新余额
    if (transaction.status === 'success') {
      if (transaction.currency === 'CNY') {
        if (transaction.type === 'income') {
          balance.value += transaction.amount
        } else {
          balance.value -= transaction.amount
        }
      }
    }

    // 保存到localStorage
    saveToStorage()

    return newTransaction
  }

  // 发送红包
  const sendRedPacket = (redpacketData: Omit<RedPacket, 'id' | 'timestamp' | 'expireTime' | 'receivers' | 'status'>): RedPacket | null => {
    if (!checkBalance(redpacketData.totalAmount)) {
      console.warn('💰 余额不足，无法发送红包')
      return null
    }

    // 扣除余额
    if (!deductBalance(redpacketData.totalAmount, `发送红包：${redpacketData.blessing}`, redpacketData.chatId)) {
      return null
    }

    // 创建红包
    const newRedPacket: RedPacket = {
      ...redpacketData,
      id: Date.now().toString(),
      timestamp: Date.now(),
      expireTime: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
      remainingAmount: redpacketData.totalAmount,
      remainingCount: redpacketData.totalCount,
      receivers: [],
      status: 'active'
    }

    redpackets.value.unshift(newRedPacket)
    saveToStorage()

    console.log('🧧 红包发送成功:', newRedPacket.blessing, newRedPacket.totalAmount, '元')
    return newRedPacket
  }

  // 抢红包
  const grabRedPacket = (redpacketId: string, userId: string, userName: string, userAvatar: string): number | null => {
    const redpacket = redpackets.value.find(rp => rp.id === redpacketId)

    if (!redpacket) {
      console.warn('🧧 红包不存在')
      return null
    }

    if (redpacket.status !== 'active') {
      console.warn('🧧 红包已过期或已抢完')
      return null
    }

    if (redpacket.remainingCount <= 0 || redpacket.remainingAmount <= 0) {
      console.warn('🧧 红包已抢完')
      redpacket.status = 'finished'
      saveToStorage()
      return null
    }

    // 检查是否已经抢过
    if (redpacket.receivers.find(r => r.userId === userId)) {
      console.warn('🧧 已经抢过这个红包了')
      return null
    }

    let amount = 0

    if (redpacket.type === 'normal') {
      // 普通红包：平均分配
      amount = Math.round((redpacket.remainingAmount / redpacket.remainingCount) * 100) / 100
    } else {
      // 拼手气红包：随机分配
      if (redpacket.remainingCount === 1) {
        // 最后一个红包，给剩余的所有金额
        amount = redpacket.remainingAmount
      } else {
        // 随机金额，确保剩余的人至少能分到0.01元
        const minRemaining = (redpacket.remainingCount - 1) * 0.01
        const maxAmount = redpacket.remainingAmount - minRemaining
        amount = Math.max(0.01, Math.min(maxAmount, Math.random() * (redpacket.remainingAmount / redpacket.remainingCount * 2)))
        amount = Math.round(amount * 100) / 100
      }
    }

    // 更新红包状态
    redpacket.remainingAmount -= amount
    redpacket.remainingCount -= 1
    redpacket.receivers.push({
      userId,
      userName,
      userAvatar,
      amount,
      timestamp: Date.now()
    })

    // 检查红包是否抢完
    if (redpacket.remainingCount <= 0 || redpacket.remainingAmount <= 0.01) {
      redpacket.status = 'finished'
    }

    // 增加用户余额
    addBalance(amount, `收到红包：${redpacket.blessing}`, redpacket.senderId, redpacket.senderName)

    console.log('🧧 抢红包成功:', amount, '元')
    return amount
  }

  // 转账
  const transfer = (amount: number, targetUserId: string, targetUserName: string, remark: string = ''): boolean => {
    const description = `转账给${targetUserName}${remark ? `：${remark}` : ''}`

    if (!deductBalance(amount, description, targetUserId, targetUserName)) {
      return false
    }

    console.log('💸 转账成功:', amount, '元给', targetUserName)
    return true
  }

  // 接收转账
  const receiveTransfer = (amount: number, fromUserId: string, fromUserName: string, remark: string = ''): boolean => {
    const description = `收到${fromUserName}的转账${remark ? `：${remark}` : ''}`

    addBalance(amount, description, fromUserId, fromUserName)

    console.log('💰 转账接收成功:', amount, '元来自', fromUserName)
    return true
  }

  // 退回红包
  const refundRedPacket = (redpacketId: string, amount: number): boolean => {
    try {
      // 退回金额到余额
      balance.value += amount

      // 添加退回交易记录
      addTransaction({
        type: 'income',
        amount: amount,
        currency: 'CNY',
        description: '红包退回',
        status: 'success',
        timestamp: Date.now(),
        redpacketId: redpacketId
      })

      console.log('🧧 红包退回成功:', amount, '元')
      return true
    } catch (error) {
      console.error('❌ 红包退回失败:', error)
      return false
    }
  }

  // 退回转账
  const refundTransfer = (_transferId: string, amount: number): boolean => {
    try {
      // 退回金额到余额
      balance.value += amount

      // 添加退回交易记录
      addTransaction({
        type: 'income',
        amount: amount,
        currency: 'CNY',
        description: '转账退回',
        status: 'success',
        timestamp: Date.now()
      })

      console.log('💰 转账退回成功:', amount, '元')
      return true
    } catch (error) {
      console.error('❌ 转账退回失败:', error)
      return false
    }
  }

  const addBeansTransaction = (transaction: Omit<BeansTransaction, 'id'>) => {
    const newTransaction: BeansTransaction = {
      ...transaction,
      id: Date.now().toString()
    }
    beansTransactions.value.unshift(newTransaction)

    // 更新叶语豆余额
    if (transaction.status === 'success') {
      if (transaction.type === 'earn') {
        beansBalance.value += transaction.amount
      } else if (transaction.type === 'spend') {
        beansBalance.value -= transaction.amount
      }
    }

    // 保存到localStorage
    saveToStorage()

    return newTransaction
  }



  const processPayment = (amount: number, description: string, toUser?: string): { success: boolean; message: string } => {
    // 检查余额
    if (!checkBalance(amount)) {
      return {
        success: false,
        message: '余额不足，请充值后再试'
      }
    }

    // 支付成功
    deductBalance(amount, description, toUser)

    return {
      success: true,
      message: '支付成功'
    }
  }

  const processReceive = (amount: number, description: string, fromUser?: string): void => {
    addBalance(amount, description, fromUser)
  }

  // 叶语豆相关方法
  const checkBeansBalance = (amount: number): boolean => {
    return beansBalance.value >= amount
  }

  const spendBeans = (amount: number, description: string): boolean => {
    if (!checkBeansBalance(amount)) {
      return false
    }

    addBeansTransaction({
      type: 'spend',
      amount,
      description,
      timestamp: Date.now(),
      status: 'success'
    })

    return true
  }

  const earnBeans = (amount: number, description: string, source?: string): void => {
    addBeansTransaction({
      type: 'earn',
      amount,
      description,
      timestamp: Date.now(),
      status: 'success',
      source
    })
  }

  // 叶语钱包充值叶语豆
  const exchangeToBeansFromWallet = (walletAmount: number): { success: boolean; message: string; beansAmount?: number } => {
    if (!checkBalance(walletAmount)) {
      return {
        success: false,
        message: '叶语钱包余额不足'
      }
    }

    const beansAmount = walletAmount * exchangeRate.value

    // 扣除钱包余额
    deductBalance(walletAmount, `充值${beansAmount}个叶语豆`)

    // 增加叶语豆
    addBeansTransaction({
      type: 'exchange',
      amount: beansAmount,
      description: `钱包充值${beansAmount}个叶语豆`,
      timestamp: Date.now(),
      status: 'success',
      source: '钱包充值'
    })

    return {
      success: true,
      message: `成功充值${beansAmount}个叶语豆`,
      beansAmount
    }
  }

  // 购买虚拟商品
  const purchaseVirtualItem = (itemName: string, beansPrice: number): { success: boolean; message: string } => {
    if (!checkBeansBalance(beansPrice)) {
      return {
        success: false,
        message: '叶语豆不足，请充值后再试'
      }
    }

    spendBeans(beansPrice, `购买${itemName}`)

    return {
      success: true,
      message: `成功购买${itemName}`
    }
  }

  // 每日签到奖励
  const dailyCheckIn = (): { success: boolean; message: string; reward?: number } => {
    const today = new Date().toDateString()
    const lastCheckIn = localStorage.getItem('last_check_in')

    if (lastCheckIn === today) {
      return {
        success: false,
        message: '今日已签到'
      }
    }

    const reward = Math.floor(Math.random() * 10) + 5 // 5-14个叶语豆
    earnBeans(reward, '每日签到奖励', '签到')
    localStorage.setItem('last_check_in', today)

    return {
      success: true,
      message: `签到成功，获得${reward}个叶语豆`,
      reward
    }
  }

  // 保存到localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('leaftalk_wallet_balance', balance.value.toString())
      localStorage.setItem('leaftalk_wallet_transactions', JSON.stringify(transactions.value))
      localStorage.setItem('leaftalk_beans_balance', beansBalance.value.toString())
      localStorage.setItem('leaftalk_beans_transactions', JSON.stringify(beansTransactions.value))
    } catch (error) {
      console.error('保存钱包数据失败:', error)
    }
  }

  // 从localStorage加载
  const loadFromStorage = () => {
    try {
      const savedBalance = localStorage.getItem('leaftalk_wallet_balance')
      if (savedBalance) {
        balance.value = parseFloat(savedBalance)
      }

      const savedTransactions = localStorage.getItem('leaftalk_wallet_transactions')
      if (savedTransactions) {
        transactions.value = JSON.parse(savedTransactions)
      }

      const savedBeansBalance = localStorage.getItem('leaftalk_beans_balance')
      if (savedBeansBalance) {
        beansBalance.value = parseInt(savedBeansBalance)
      }

      const savedBeansTransactions = localStorage.getItem('leaftalk_beans_transactions')
      if (savedBeansTransactions) {
        beansTransactions.value = JSON.parse(savedBeansTransactions)
      }
    } catch (error) {
      console.error('加载钱包数据失败:', error)
    }
  }

  // 初始化方法
  const init = () => {
    console.log('🔄 初始化钱包store...')
    loadFromStorage()
    console.log('✅ 钱包store初始化完成')
  }

  // 初始化时加载数据
  loadFromStorage()

  return {
    // 基础数据
    balance,
    transactions,
    formattedBalance,
    recentTransactions,

    // 基础方法
    addBalance,
    deductBalance,
    addTransaction,
    checkBalance,
    processPayment,
    processReceive,

    // 红包和转账数据
    redpackets,
    paymentPassword,
    verifyPaymentPassword,

    // 红包相关
    sendRedPacket,
    grabRedPacket,

    // 转账相关
    transfer,
    receiveTransfer,

    // 退回红包
    refundRedPacket,

    // 退回转账
    refundTransfer,

    // 叶语豆相关
    beansBalance,
    beansTransactions,
    formattedBeansBalance,
    recentBeansTransactions,
    exchangeRate,
    addBeansTransaction,
    checkBeansBalance,
    spendBeans,
    earnBeans,
    exchangeToBeansFromWallet,
    purchaseVirtualItem,
    dailyCheckIn,

    // 通用方法
    init,
    saveToStorage,
    loadFromStorage
  }
})
