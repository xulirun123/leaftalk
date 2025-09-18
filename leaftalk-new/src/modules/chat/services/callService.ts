// 通话API模块
import { apiClient } from '../apiClient'
import type { ApiResponse, CallSession } from './types'

class CallApi {
  // 发起通话
  async initiateCall(data: {
    toUserId: string
    type: 'voice' | 'video'
  }): Promise<ApiResponse<CallSession>> {
    return apiClient.post<ApiResponse<CallSession>>('/call/initiate', data)
  }

  // 接听通话
  async answerCall(callId: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(`/call/${callId}/answer`)
  }

  // 挂断通话
  async endCall(callId: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(`/call/${callId}/end`)
  }

  // 获取通话记录
  async getCallHistory(): Promise<ApiResponse<CallSession[]>> {
    return apiClient.get<ApiResponse<CallSession[]>>('/call/history')
  }
}

export const callApi = new CallApi()
export default callApi
