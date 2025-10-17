/**
 * 红包系统类型定义
 * 简洁、清晰的红包数据结构
 */

// 红包类型
export type RedPacketType = 'normal' | 'lucky'  // 普通红包 | 拼手气红包

// 红包状态
export type RedPacketStatus = 'active' | 'claimed' | 'expired' | 'refunded'

// 红包接口
export interface RedPacket {
  id: string                    // 红包ID
  senderId: string              // 发送者ID
  senderName: string            // 发送者昵称
  senderAvatar: string          // 发送者头像
  receiverId?: string           // 接收者ID（单聊红包）
  receiverName?: string         // 接收者昵称
  chatId: string                // 聊天会话ID
  type: RedPacketType           // 红包类型
  totalAmount: number           // 红包总金额（元）
  totalCount: number            // 红包总个数
  remainingAmount: number       // 剩余金额（元）
  remainingCount: number        // 剩余个数
  blessing: string              // 祝福语
  status: RedPacketStatus       // 红包状态
  createdAt: number             // 创建时间戳
  expiresAt: number             // 过期时间戳（24小时）
  claims: RedPacketClaim[]      // 领取记录
}

// 红包领取记录
export interface RedPacketClaim {
  id: string                    // 领取记录ID
  redPacketId: string           // 红包ID
  userId: string                // 领取者ID
  userName: string              // 领取者昵称
  userAvatar: string            // 领取者头像
  amount: number                // 领取金额（元）
  claimedAt: number             // 领取时间戳
  isLucky?: boolean             // 是否是手气最佳
}

// 发送红包请求
export interface SendRedPacketRequest {
  receiverId?: string           // 接收者ID（单聊必填）
  chatId: string                // 聊天会话ID
  type: RedPacketType           // 红包类型
  totalAmount: number           // 红包总金额（元）
  totalCount: number            // 红包总个数（拼手气红包必填）
  blessing: string              // 祝福语
}

// 发送红包响应
export interface SendRedPacketResponse {
  success: boolean
  redPacket?: RedPacket
  message?: string
}

// 领取红包请求
export interface ClaimRedPacketRequest {
  redPacketId: string           // 红包ID
}

// 领取红包响应
export interface ClaimRedPacketResponse {
  success: boolean
  amount?: number               // 领取到的金额（元）
  isLucky?: boolean             // 是否是手气最佳
  message?: string
  redPacket?: RedPacket         // 更新后的红包信息
}

// 红包详情请求
export interface GetRedPacketDetailRequest {
  redPacketId: string           // 红包ID
}

// 红包详情响应
export interface GetRedPacketDetailResponse {
  success: boolean
  redPacket?: RedPacket
  message?: string
}

