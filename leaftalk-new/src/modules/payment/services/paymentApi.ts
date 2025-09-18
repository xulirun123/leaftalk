// 支付API模块
import { apiClient } from '../apiClient'
import type { ApiResponse, PaymentOrder } from './types'

class PaymentApi {
  // 创建转账订单
  async createTransfer(data: {
    toUserId: string
    amount: number
    description?: string
  }): Promise<ApiResponse<PaymentOrder>> {
    return apiClient.post<ApiResponse<PaymentOrder>>('/payment/transfer', data)
  }

  // 创建红包
  async createRedPacket(data: {
    amount: number
    count: number
    message?: string
    chatId?: string
  }): Promise<ApiResponse<PaymentOrder>> {
    return apiClient.post<ApiResponse<PaymentOrder>>('/payment/redpacket', data)
  }

  // 获取支付记录
  async getPaymentHistory(): Promise<ApiResponse<PaymentOrder[]>> {
    return apiClient.get<ApiResponse<PaymentOrder[]>>('/payment/history')
  }
}

export const paymentApi = new PaymentApi()
export default paymentApi
