/**
 * 支付管理器
 * 处理叶语支付、叶语钱包、转账、红包等支付功能
 */

export interface PaymentAccount {
  id: string
  userId: string
  balance: number // 叶语钱包余额（分）
  beans: number // 叶语豆余额
  frozenAmount: number // 冻结金额
  currency: string
  status: 'active' | 'frozen' | 'closed'
  createdAt: number
  updatedAt: number
}

export interface PaymentTransaction {
  id: string
  type: 'transfer' | 'redpacket' | 'payment' | 'recharge' | 'withdraw' | 'refund'
  fromUserId: string
  toUserId?: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  description: string
  metadata?: Record<string, any>
  createdAt: number
  completedAt?: number
  failureReason?: string
}

export interface RedPacket {
  id: string
  senderId: string
  senderName: string
  type: 'single' | 'group'
  totalAmount: number
  totalCount: number
  remainingAmount: number
  remainingCount: number
  message: string
  groupId?: string
  recipients: RedPacketRecipient[]
  status: 'active' | 'expired' | 'completed'
  createdAt: number
  expiredAt: number
}

export interface RedPacketRecipient {
  userId: string
  userName: string
  amount: number
  receivedAt: number
}

export interface PaymentMethod {
  id: string
  type: 'wallet' | 'bank' | 'alipay' | 'wechat'
  name: string
  identifier: string // 卡号、账号等
  isDefault: boolean
  status: 'active' | 'inactive'
}

export interface PaymentRequest {
  amount: number
  currency: string
  description: string
  paymentMethod: string
  metadata?: Record<string, any>
}

export class PaymentManager {
  private account: PaymentAccount | null = null
  private paymentMethods: PaymentMethod[] = []
  private transactions: PaymentTransaction[] = []
  private redPackets: RedPacket[] = []
  private eventListeners: Map<string, Function[]> = new Map()

  // 汇率配置（叶语豆与叶语钱包的兑换比例）
  private readonly BEANS_TO_WALLET_RATE = 10 // 10叶语豆 = 1叶语钱包

  constructor() {
    this.loadAccountData()
  }

  // 初始化账户
  async initializeAccount(userId: string): Promise<PaymentAccount> {
    try {
      // 检查是否已有账户
      if (this.account && this.account.userId === userId) {
        return this.account
      }

      // 创建新账户或加载现有账户
      this.account = await this.loadOrCreateAccount(userId)
      this.emit('accountInitialized', this.account)

      return this.account

    } catch (error) {
      console.error('初始化支付账户失败:', error)
      throw error
    }
  }

  // 获取账户信息
  getAccount(): PaymentAccount | null {
    return this.account
  }

  // 获取余额
  getBalance(): { wallet: number; beans: number } {
    if (!this.account) {
      return { wallet: 0, beans: 0 }
    }

    return {
      wallet: this.account.balance / 100, // 转换为元
      beans: this.account.beans
    }
  }

  // 充值
  async recharge(amount: number, paymentMethod: string): Promise<PaymentTransaction> {
    if (!this.account) {
      throw new Error('账户未初始化')
    }

    if (amount <= 0) {
      throw new Error('充值金额必须大于0')
    }

    try {
      const transaction: PaymentTransaction = {
        id: this.generateTransactionId(),
        type: 'recharge',
        fromUserId: 'system',
        toUserId: this.account.userId,
        amount: amount * 100, // 转换为分
        currency: 'CNY',
        status: 'pending',
        description: `充值 ¥${amount}`,
        metadata: { paymentMethod },
        createdAt: Date.now()
      }

      // 模拟支付处理
      await this.processPayment(transaction)

      this.transactions.unshift(transaction)
      this.saveTransactions()
      this.emit('transactionCreated', transaction)

      return transaction

    } catch (error) {
      console.error('充值失败:', error)
      throw error
    }
  }

  // 转账
  async transfer(toUserId: string, amount: number, description: string = ''): Promise<PaymentTransaction> {
    if (!this.account) {
      throw new Error('账户未初始化')
    }

    if (amount <= 0) {
      throw new Error('转账金额必须大于0')
    }

    const amountInCents = amount * 100
    if (this.account.balance < amountInCents) {
      throw new Error('余额不足')
    }

    try {
      const transaction: PaymentTransaction = {
        id: this.generateTransactionId(),
        type: 'transfer',
        fromUserId: this.account.userId,
        toUserId,
        amount: amountInCents,
        currency: 'CNY',
        status: 'pending',
        description: description || `转账 ¥${amount}`,
        createdAt: Date.now()
      }

      // 冻结金额
      this.account.frozenAmount += amountInCents
      this.account.balance -= amountInCents

      // 处理转账
      await this.processTransfer(transaction)

      this.transactions.unshift(transaction)
      this.saveAccountData()
      this.saveTransactions()
      this.emit('transactionCreated', transaction)

      return transaction

    } catch (error) {
      console.error('转账失败:', error)
      throw error
    }
  }

  // 发送红包
  async sendRedPacket(
    type: 'single' | 'group',
    totalAmount: number,
    totalCount: number,
    message: string,
    groupId?: string
  ): Promise<RedPacket> {
    if (!this.account) {
      throw new Error('账户未初始化')
    }

    if (totalAmount <= 0 || totalCount <= 0) {
      throw new Error('红包金额和数量必须大于0')
    }

    const amountInCents = totalAmount * 100
    if (this.account.balance < amountInCents) {
      throw new Error('余额不足')
    }

    try {
      const redPacket: RedPacket = {
        id: this.generateRedPacketId(),
        senderId: this.account.userId,
        senderName: '我', // 应该从用户信息获取
        type,
        totalAmount: amountInCents,
        totalCount,
        remainingAmount: amountInCents,
        remainingCount: totalCount,
        message,
        groupId,
        recipients: [],
        status: 'active',
        createdAt: Date.now(),
        expiredAt: Date.now() + 24 * 60 * 60 * 1000 // 24小时后过期
      }

      // 扣除余额
      this.account.balance -= amountInCents
      this.account.frozenAmount += amountInCents

      this.redPackets.unshift(redPacket)
      this.saveAccountData()
      this.saveRedPackets()
      this.emit('redPacketSent', redPacket)

      return redPacket

    } catch (error) {
      console.error('发送红包失败:', error)
      throw error
    }
  }

  // 抢红包
  async grabRedPacket(redPacketId: string): Promise<{ success: boolean; amount?: number; message?: string }> {
    if (!this.account) {
      throw new Error('账户未初始化')
    }

    const redPacket = this.redPackets.find(rp => rp.id === redPacketId)
    if (!redPacket) {
      return { success: false, message: '红包不存在' }
    }

    if (redPacket.status !== 'active') {
      return { success: false, message: '红包已过期或已被抢完' }
    }

    if (redPacket.remainingCount <= 0) {
      return { success: false, message: '红包已被抢完' }
    }

    // 检查是否已经抢过
    const alreadyGrabbed = redPacket.recipients.some(r => r.userId === this.account!.userId)
    if (alreadyGrabbed) {
      return { success: false, message: '您已经抢过这个红包了' }
    }

    try {
      // 计算红包金额
      const amount = this.calculateRedPacketAmount(redPacket)

      // 添加到接收者列表
      redPacket.recipients.push({
        userId: this.account.userId,
        userName: '我',
        amount,
        receivedAt: Date.now()
      })

      // 更新红包状态
      redPacket.remainingAmount -= amount
      redPacket.remainingCount -= 1

      if (redPacket.remainingCount === 0) {
        redPacket.status = 'completed'
      }

      // 增加账户余额
      this.account.balance += amount

      this.saveAccountData()
      this.saveRedPackets()
      this.emit('redPacketGrabbed', { redPacket, amount: amount / 100 })

      return { success: true, amount: amount / 100 }

    } catch (error) {
      console.error('抢红包失败:', error)
      return { success: false, message: '抢红包失败，请稍后再试' }
    }
  }

  // 计算红包金额
  private calculateRedPacketAmount(redPacket: RedPacket): number {
    if (redPacket.remainingCount === 1) {
      // 最后一个红包，返回剩余金额
      return redPacket.remainingAmount
    }

    if (redPacket.type === 'single') {
      // 单个红包，返回全部金额
      return redPacket.remainingAmount
    }

    // 群红包，随机分配
    const minAmount = 1 // 最少1分
    const maxAmount = Math.floor(redPacket.remainingAmount / redPacket.remainingCount * 2)
    
    return Math.max(minAmount, Math.floor(Math.random() * maxAmount))
  }

  // 叶语豆兑换叶语钱包
  async exchangeBeansToWallet(beansAmount: number): Promise<boolean> {
    if (!this.account) {
      throw new Error('账户未初始化')
    }

    if (beansAmount <= 0) {
      throw new Error('兑换数量必须大于0')
    }

    if (this.account.beans < beansAmount) {
      throw new Error('叶语豆余额不足')
    }

    try {
      const walletAmount = Math.floor(beansAmount / this.BEANS_TO_WALLET_RATE) * 100 // 转换为分

      this.account.beans -= beansAmount
      this.account.balance += walletAmount

      this.saveAccountData()
      this.emit('beansExchanged', { beansAmount, walletAmount: walletAmount / 100 })

      return true

    } catch (error) {
      console.error('叶语豆兑换失败:', error)
      throw error
    }
  }

  // 获取交易记录
  getTransactions(limit: number = 20, offset: number = 0): PaymentTransaction[] {
    return this.transactions.slice(offset, offset + limit)
  }

  // 获取红包记录
  getRedPackets(limit: number = 20, offset: number = 0): RedPacket[] {
    return this.redPackets.slice(offset, offset + limit)
  }

  // 添加支付方式
  addPaymentMethod(method: Omit<PaymentMethod, 'id'>): PaymentMethod {
    const paymentMethod: PaymentMethod = {
      id: this.generatePaymentMethodId(),
      ...method
    }

    this.paymentMethods.push(paymentMethod)
    this.savePaymentMethods()
    this.emit('paymentMethodAdded', paymentMethod)

    return paymentMethod
  }

  // 获取支付方式列表
  getPaymentMethods(): PaymentMethod[] {
    return [...this.paymentMethods]
  }

  // 设置默认支付方式
  setDefaultPaymentMethod(methodId: string): boolean {
    const method = this.paymentMethods.find(m => m.id === methodId)
    if (!method) {
      return false
    }

    // 取消其他默认设置
    this.paymentMethods.forEach(m => {
      m.isDefault = m.id === methodId
    })

    this.savePaymentMethods()
    this.emit('defaultPaymentMethodChanged', method)

    return true
  }

  // 处理支付
  private async processPayment(transaction: PaymentTransaction): Promise<void> {
    // 模拟支付处理延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟支付成功/失败
    const success = Math.random() > 0.1 // 90%成功率

    if (success) {
      transaction.status = 'completed'
      transaction.completedAt = Date.now()

      // 增加账户余额
      if (this.account) {
        this.account.balance += transaction.amount
        this.saveAccountData()
      }
    } else {
      transaction.status = 'failed'
      transaction.failureReason = '支付失败，请稍后重试'
    }

    this.emit('transactionUpdated', transaction)
  }

  // 处理转账
  private async processTransfer(transaction: PaymentTransaction): Promise<void> {
    // 模拟转账处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟转账成功
    transaction.status = 'completed'
    transaction.completedAt = Date.now()

    // 解冻金额
    if (this.account) {
      this.account.frozenAmount -= transaction.amount
    }

    this.emit('transactionUpdated', transaction)
  }

  // 加载或创建账户
  private async loadOrCreateAccount(userId: string): Promise<PaymentAccount> {
    // 尝试从本地存储加载
    const saved = localStorage.getItem(`leaftalk_payment_account_${userId}`)
    if (saved) {
      return JSON.parse(saved)
    }

    // 创建新账户
    const account: PaymentAccount = {
      id: this.generateAccountId(),
      userId,
      balance: 0,
      beans: 100, // 新用户赠送100叶语豆
      frozenAmount: 0,
      currency: 'CNY',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    return account
  }

  // 保存账户数据
  private saveAccountData(): void {
    if (this.account) {
      this.account.updatedAt = Date.now()
      localStorage.setItem(
        `leaftalk_payment_account_${this.account.userId}`,
        JSON.stringify(this.account)
      )
    }
  }

  // 加载账户数据
  private loadAccountData(): void {
    // 这里可以加载当前用户的账户数据
    // 现在先留空，等用户登录后再初始化
  }

  // 保存交易记录
  private saveTransactions(): void {
    localStorage.setItem('leaftalk_payment_transactions', JSON.stringify(this.transactions))
  }

  // 加载交易记录
  private loadTransactions(): void {
    try {
      const saved = localStorage.getItem('leaftalk_payment_transactions')
      if (saved) {
        this.transactions = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载交易记录失败:', error)
      this.transactions = []
    }
  }

  // 保存红包记录
  private saveRedPackets(): void {
    localStorage.setItem('leaftalk_payment_redpackets', JSON.stringify(this.redPackets))
  }

  // 加载红包记录
  private loadRedPackets(): void {
    try {
      const saved = localStorage.getItem('leaftalk_payment_redpackets')
      if (saved) {
        this.redPackets = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载红包记录失败:', error)
      this.redPackets = []
    }
  }

  // 保存支付方式
  private savePaymentMethods(): void {
    localStorage.setItem('leaftalk_payment_methods', JSON.stringify(this.paymentMethods))
  }

  // 加载支付方式
  private loadPaymentMethods(): void {
    try {
      const saved = localStorage.getItem('leaftalk_payment_methods')
      if (saved) {
        this.paymentMethods = JSON.parse(saved)
      } else {
        // 添加默认支付方式
        this.paymentMethods = [
          {
            id: 'wallet',
            type: 'wallet',
            name: '叶语钱包',
            identifier: 'wallet',
            isDefault: true,
            status: 'active'
          }
        ]
      }
    } catch (error) {
      console.error('加载支付方式失败:', error)
      this.paymentMethods = []
    }
  }

  // 生成ID
  private generateAccountId(): string {
    return `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRedPacketId(): string {
    return `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generatePaymentMethodId(): string {
    return `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 事件监听
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('支付事件处理错误:', error)
        }
      })
    }
  }

  // 销毁实例
  destroy(): void {
    this.eventListeners.clear()
    this.account = null
    this.transactions = []
    this.redPackets = []
    this.paymentMethods = []
  }
}

// 创建全局实例
export const paymentManager = new PaymentManager()

export default PaymentManager
