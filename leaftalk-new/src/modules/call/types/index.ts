/**
 * 仿微信通话系统 - 类型定义
 */

// 通话类型
export type CallType = 'voice' | 'video'

// 通话状态
export type CallStatus = 
  | 'idle'           // 空闲
  | 'calling'        // 呼叫中
  | 'ringing'        // 响铃中
  | 'connecting'     // 连接中
  | 'connected'      // 已连接
  | 'ending'         // 结束中
  | 'ended'          // 已结束

// 通话结束原因
export type CallEndReason = 
  | 'normal'         // 正常挂断
  | 'rejected'       // 拒绝接听
  | 'timeout'        // 超时
  | 'busy'           // 忙线
  | 'network_error'  // 网络错误
  | 'unknown'        // 未知错误

// 媒体状态
export interface MediaState {
  audio: {
    enabled: boolean
    muted: boolean
    volume: number
  }
  video: {
    enabled: boolean
    muted: boolean
    facingMode: 'user' | 'environment'
  }
}

// 通话配置
export interface CallConfig {
  callId: string
  type: CallType
  isInitiator: boolean
  targetUserId: string
  targetUserInfo: {
    id: string
    name: string
    avatar: string
    nickname?: string
    remark?: string
    ringtoneUrl?: string
  }
}

// 通话事件
export interface CallEvents {
  'call:incoming': (data: IncomingCallData) => void
  'call:accepted': (data: CallAcceptedData) => void
  'call:rejected': (data: CallRejectedData) => void
  'call:ended': (data: CallEndedData) => void
  'call:connected': (data: CallConnectedData) => void
  'media:stream': (stream: MediaStream, type: 'local' | 'remote') => void
  'media:state': (state: MediaState) => void
  'network:quality': (quality: NetworkQuality) => void
}

// 来电数据
export interface IncomingCallData {
  callId: string
  type: CallType
  fromUserId: string
  fromUserInfo: {
    id: string
    name: string
    avatar: string
    nickname?: string
    remark?: string
    ringtoneUrl?: string
  }
  timestamp: number
}

// 通话接受数据
export interface CallAcceptedData {
  callId: string
  timestamp: number
}

// 通话拒绝数据
export interface CallRejectedData {
  callId: string
  reason: string
  timestamp: number
}

// 通话结束数据
export interface CallEndedData {
  callId: string
  reason: CallEndReason
  duration: number
  timestamp: number
}

// 通话连接数据
export interface CallConnectedData {
  callId: string
  timestamp: number
}

// 网络质量
export interface NetworkQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor'
  rtt: number
  packetLoss: number
  bandwidth: number
}

// WebRTC配置
export interface RTCConfig {
  iceServers: RTCIceServer[]
  iceCandidatePoolSize?: number
  bundlePolicy?: RTCBundlePolicy
  rtcpMuxPolicy?: RTCRtcpMuxPolicy
}

// 设备信息
export interface DeviceInfo {
  deviceId: string
  label: string
  kind: MediaDeviceKind
  groupId: string
}

// 通话统计
export interface CallStats {
  duration: number
  bytesReceived: number
  bytesSent: number
  packetsReceived: number
  packetsSent: number
  packetsLost: number
  jitter: number
  rtt: number
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

// 通话API请求
export interface InitiateCallRequest {
  targetUserId: string
  type: CallType
}

export interface AcceptCallRequest {
  callId: string
}

export interface RejectCallRequest {
  callId: string
  reason?: string
}

export interface EndCallRequest {
  callId: string
}

// 通话API响应
export interface InitiateCallResponse {
  callId: string
  type: CallType
  targetUserId: string
}

// Socket事件数据
export interface SocketCallData {
  callId: string
  fromUserId: string
  targetUserId: string
  type: CallType
  timestamp: number
}

export interface SocketOfferData {
  callId: string
  fromUserId: string
  offer: RTCSessionDescriptionInit
  type: CallType
}

export interface SocketAnswerData {
  callId: string
  fromUserId: string
  answer: RTCSessionDescriptionInit
}

export interface SocketIceCandidateData {
  callId: string
  fromUserId: string
  candidate: RTCIceCandidateInit
}

export interface SocketCallStatusData {
  callId: string
  fromUserId: string
  status: CallStatus
  data?: any
}
