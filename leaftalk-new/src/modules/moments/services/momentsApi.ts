// 朋友圈API模块
import { apiClient } from '../apiClient'
import type { ApiResponse, Moment, Comment } from './types'

class MomentsApi {
  // 获取朋友圈动态
  async getMoments(): Promise<ApiResponse<Moment[]>> {
    return apiClient.get<ApiResponse<Moment[]>>('/moments')
  }

  // 发布动态
  async createMoment(data: {
    content: string
    images?: File[]
    visibility: 'public' | 'friends' | 'private'
  }): Promise<ApiResponse<Moment>> {
    return apiClient.post<ApiResponse<Moment>>('/moments', data)
  }

  // 点赞动态
  async likeMoment(momentId: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(`/moments/${momentId}/like`)
  }

  // 评论动态
  async commentMoment(momentId: string, content: string): Promise<ApiResponse<Comment>> {
    return apiClient.post<ApiResponse<Comment>>(`/moments/${momentId}/comments`, { content })
  }
}

export const momentsApi = new MomentsApi()
export default momentsApi
