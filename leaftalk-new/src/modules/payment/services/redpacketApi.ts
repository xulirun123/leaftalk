/**
 * 红包 API 服务
 * 处理红包相关的所有 API 调用
 */

import apiClient from '../../../shared/services/apiClient'
import type {
  RedPacket,
  SendRedPacketRequest,
  SendRedPacketResponse,
  ClaimRedPacketRequest,
  ClaimRedPacketResponse,
  GetRedPacketDetailRequest,
  GetRedPacketDetailResponse
} from '../types/redpacket'

class RedPacketApi {
  /**
   * 发送红包
   */
  async sendRedPacket(data: SendRedPacketRequest): Promise<SendRedPacketResponse> {
    try {
      const response = await apiClient.post('/payment/redpacket/send', data)
      if (response.success && response.data) {
        return {
          success: true,
          redPacket: response.data as RedPacket
        }
      }
      return {
        success: false,
        message: response.message || '发送红包失败'
      }
    } catch (error) {
      console.error('发送红包失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送红包失败'
      }
    }
  }

  /**
   * 领取红包
   */
  async claimRedPacket(data: ClaimRedPacketRequest): Promise<ClaimRedPacketResponse> {
    try {
      const response = await apiClient.post('/payment/redpacket/claim', data)
      if (response.success && response.data) {
        return {
          success: true,
          amount: response.data.amount,
          isLucky: response.data.isLucky,
          redPacket: response.data.redPacket
        }
      }
      return {
        success: false,
        message: response.message || '领取红包失败'
      }
    } catch (error) {
      console.error('领取红包失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '领取红包失败'
      }
    }
  }

  /**
   * 获取红包详情
   */
  async getRedPacketDetail(data: GetRedPacketDetailRequest): Promise<GetRedPacketDetailResponse> {
    try {
      const response = await apiClient.get(`/payment/redpacket/${data.redPacketId}`)
      if (response.success && response.data) {
        return {
          success: true,
          redPacket: response.data as RedPacket
        }
      }
      return {
        success: false,
        message: response.message || '获取红包详情失败'
      }
    } catch (error) {
      console.error('获取红包详情失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取红包详情失败'
      }
    }
  }

  /**
   * 获取我发送的红包列表
   */
  async getMySentRedPackets(): Promise<{ success: boolean; redPackets?: RedPacket[]; message?: string }> {
    try {
      const response = await apiClient.get('/payment/redpacket/sent')
      if (response.success && response.data) {
        return {
          success: true,
          redPackets: response.data as RedPacket[]
        }
      }
      return {
        success: false,
        message: response.message || '获取红包列表失败'
      }
    } catch (error) {
      console.error('获取发送的红包列表失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取红包列表失败'
      }
    }
  }

  /**
   * 获取我领取的红包列表
   */
  async getMyClaimedRedPackets(): Promise<{ success: boolean; redPackets?: RedPacket[]; message?: string }> {
    try {
      const response = await apiClient.get('/payment/redpacket/claimed')
      if (response.success && response.data) {
        return {
          success: true,
          redPackets: response.data as RedPacket[]
        }
      }
      return {
        success: false,
        message: response.message || '获取红包列表失败'
      }
    } catch (error) {
      console.error('获取领取的红包列表失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取红包列表失败'
      }
    }
  }
}

export const redPacketApi = new RedPacketApi()
export default redPacketApi

