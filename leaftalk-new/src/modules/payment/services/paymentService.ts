export interface PaymentResult {
  success: boolean
  transactionId?: string
  error?: string
}

export class PaymentService {
  static async processPayment(amount: number, method: string): Promise<PaymentResult> {
    try {
      // 模拟支付处理
      await new Promise(resolve => setTimeout(resolve, 1000))

      return {
        success: true,
        transactionId: 'tx_' + Date.now()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      }
    }
  }
}