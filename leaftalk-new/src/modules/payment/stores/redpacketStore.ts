/**
 * 红包 Store
 * 管理红包状态和业务逻辑
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { redPacketApi } from '../services/redpacketApi'
import type {
  RedPacket,
  SendRedPacketRequest,
  ClaimRedPacketRequest
} from '../types/redpacket'

export const useRedPacketStore = defineStore('redpacket', () => {
  // 状态
  const sentRedPackets = ref<RedPacket[]>([])        // 我发送的红包
  const claimedRedPackets = ref<RedPacket[]>([])     // 我领取的红包
  const currentRedPacket = ref<RedPacket | null>(null)  // 当前查看的红包
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const activeSentRedPackets = computed(() => {
    return sentRedPackets.value.filter(rp => rp.status === 'active')
  })

  const totalSentAmount = computed(() => {
    return sentRedPackets.value.reduce((sum, rp) => sum + rp.totalAmount, 0)
  })

  const totalClaimedAmount = computed(() => {
    return claimedRedPackets.value.reduce((sum, rp) => {
      const myClaim = rp.claims.find(c => c.userId === 'current_user') // TODO: 使用真实用户ID
      return sum + (myClaim?.amount || 0)
    }, 0)
  })

  /**
   * 发送红包
   */
  async function sendRedPacket(request: SendRedPacketRequest): Promise<{ success: boolean; redPacket?: RedPacket; message?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const response = await redPacketApi.sendRedPacket(request)
      
      if (response.success && response.redPacket) {
        // 添加到已发送列表
        sentRedPackets.value.unshift(response.redPacket)
        return { success: true, redPacket: response.redPacket }
      } else {
        error.value = response.message || '发送红包失败'
        return { success: false, message: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '发送红包失败'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 领取红包
   */
  async function claimRedPacket(request: ClaimRedPacketRequest): Promise<{ success: boolean; amount?: number; isLucky?: boolean; message?: string }> {
    isLoading.value = true
    error.value = null

    try {
      const response = await redPacketApi.claimRedPacket(request)
      
      if (response.success && response.redPacket) {
        // 更新红包信息
        const index = sentRedPackets.value.findIndex(rp => rp.id === response.redPacket!.id)
        if (index !== -1) {
          sentRedPackets.value[index] = response.redPacket
        }

        // 添加到已领取列表
        const claimedIndex = claimedRedPackets.value.findIndex(rp => rp.id === response.redPacket!.id)
        if (claimedIndex === -1) {
          claimedRedPackets.value.unshift(response.redPacket)
        } else {
          claimedRedPackets.value[claimedIndex] = response.redPacket
        }

        return {
          success: true,
          amount: response.amount,
          isLucky: response.isLucky
        }
      } else {
        error.value = response.message || '领取红包失败'
        return { success: false, message: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '领取红包失败'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取红包详情
   */
  async function getRedPacketDetail(redPacketId: string): Promise<RedPacket | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await redPacketApi.getRedPacketDetail({ redPacketId })
      
      if (response.success && response.redPacket) {
        currentRedPacket.value = response.redPacket
        return response.redPacket
      } else {
        error.value = response.message || '获取红包详情失败'
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取红包详情失败'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载我发送的红包列表
   */
  async function loadMySentRedPackets(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await redPacketApi.getMySentRedPackets()
      
      if (response.success && response.redPackets) {
        sentRedPackets.value = response.redPackets
      } else {
        error.value = response.message || '加载红包列表失败'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载红包列表失败'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载我领取的红包列表
   */
  async function loadMyClaimedRedPackets(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await redPacketApi.getMyClaimedRedPackets()
      
      if (response.success && response.redPackets) {
        claimedRedPackets.value = response.redPackets
      } else {
        error.value = response.message || '加载红包列表失败'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载红包列表失败'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清空错误信息
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * 重置状态
   */
  function reset(): void {
    sentRedPackets.value = []
    claimedRedPackets.value = []
    currentRedPacket.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // 状态
    sentRedPackets,
    claimedRedPackets,
    currentRedPacket,
    isLoading,
    error,

    // 计算属性
    activeSentRedPackets,
    totalSentAmount,
    totalClaimedAmount,

    // 方法
    sendRedPacket,
    claimRedPacket,
    getRedPacketDetail,
    loadMySentRedPackets,
    loadMyClaimedRedPackets,
    clearError,
    reset
  }
})

