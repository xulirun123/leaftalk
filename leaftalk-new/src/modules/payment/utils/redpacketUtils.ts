/**
 * 红包工具函数
 * 提供红包相关的计算和验证功能
 */

import type { RedPacket, RedPacketClaim } from '../types/redpacket'

/**
 * 计算拼手气红包金额
 * 使用二倍均值法，确保公平性
 */
export function calculateLuckyAmount(
  remainingAmount: number,
  remainingCount: number
): number {
  // 最后一个红包，返回剩余金额
  if (remainingCount === 1) {
    return remainingAmount
  }

  // 最小金额 0.01 元
  const minAmount = 0.01
  
  // 最大金额为剩余平均值的2倍
  const maxAmount = (remainingAmount / remainingCount) * 2
  
  // 随机金额
  let amount = Math.random() * maxAmount
  
  // 确保不小于最小金额
  amount = Math.max(minAmount, amount)
  
  // 确保不超过剩余金额
  amount = Math.min(amount, remainingAmount - (remainingCount - 1) * minAmount)
  
  // 保留两位小数
  return Math.round(amount * 100) / 100
}

/**
 * 计算普通红包金额
 * 平均分配
 */
export function calculateNormalAmount(
  totalAmount: number,
  totalCount: number
): number {
  const amount = totalAmount / totalCount
  return Math.round(amount * 100) / 100
}

/**
 * 验证红包金额
 */
export function validateRedPacketAmount(
  totalAmount: number,
  totalCount: number
): { valid: boolean; message?: string } {
  // 金额必须大于0
  if (totalAmount <= 0) {
    return { valid: false, message: '红包金额必须大于0' }
  }

  // 个数必须大于0
  if (totalCount <= 0) {
    return { valid: false, message: '红包个数必须大于0' }
  }

  // 单个红包最小金额 0.01 元
  const minSingleAmount = 0.01
  if (totalAmount < minSingleAmount * totalCount) {
    return { valid: false, message: `红包总金额不能少于 ${minSingleAmount * totalCount} 元` }
  }

  // 单个红包最大金额 200 元
  const maxSingleAmount = 200
  if (totalAmount / totalCount > maxSingleAmount) {
    return { valid: false, message: `单个红包金额不能超过 ${maxSingleAmount} 元` }
  }

  // 红包总金额最大 200 元
  const maxTotalAmount = 200
  if (totalAmount > maxTotalAmount) {
    return { valid: false, message: `红包总金额不能超过 ${maxTotalAmount} 元` }
  }

  // 红包个数最多 100 个
  const maxCount = 100
  if (totalCount > maxCount) {
    return { valid: false, message: `红包个数不能超过 ${maxCount} 个` }
  }

  return { valid: true }
}

/**
 * 检查红包是否过期
 */
export function isRedPacketExpired(redPacket: RedPacket): boolean {
  return Date.now() > redPacket.expiresAt
}

/**
 * 检查红包是否已领完
 */
export function isRedPacketClaimed(redPacket: RedPacket): boolean {
  return redPacket.remainingCount === 0
}

/**
 * 检查用户是否已领取红包
 */
export function hasUserClaimedRedPacket(
  redPacket: RedPacket,
  userId: string
): boolean {
  return redPacket.claims.some(claim => claim.userId === userId)
}

/**
 * 获取手气最佳
 */
export function getLuckyKing(claims: RedPacketClaim[]): RedPacketClaim | null {
  if (claims.length === 0) return null
  
  return claims.reduce((max, claim) => {
    return claim.amount > max.amount ? claim : max
  })
}

/**
 * 格式化红包金额
 */
export function formatRedPacketAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * 格式化红包时间
 */
export function formatRedPacketTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 1小时内
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }
  
  // 24小时内
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }
  
  // 超过24小时，显示日期
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  
  return `${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

/**
 * 获取红包状态文本
 */
export function getRedPacketStatusText(redPacket: RedPacket): string {
  if (redPacket.status === 'expired') {
    return '已过期'
  }
  
  if (redPacket.status === 'refunded') {
    return '已退款'
  }
  
  if (redPacket.remainingCount === 0) {
    return '已领完'
  }
  
  return `剩余${redPacket.remainingCount}/${redPacket.totalCount}个`
}

/**
 * 获取红包类型文本
 */
export function getRedPacketTypeText(type: 'normal' | 'lucky'): string {
  return type === 'normal' ? '普通红包' : '拼手气红包'
}

/**
 * 生成默认祝福语
 */
export function getDefaultBlessing(): string {
  const blessings = [
    '恭喜发财，大吉大利',
    '新年快乐，万事如意',
    '心想事成，财源广进',
    '身体健康，阖家欢乐',
    '工作顺利，步步高升'
  ]
  
  return blessings[Math.floor(Math.random() * blessings.length)]
}

