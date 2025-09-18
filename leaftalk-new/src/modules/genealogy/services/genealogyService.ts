// 族谱API模块
import { apiClient } from '../apiClient'
import type { ApiResponse, GenealogyTree, GenealogyMember } from './types'

class GenealogyApi {
  // 获取我的族谱
  async getMyGenealogy(): Promise<ApiResponse<GenealogyTree[]>> {
    return apiClient.get<ApiResponse<GenealogyTree[]>>('/genealogy/my')
  }

  // 创建族谱
  async createGenealogy(data: {
    name: string
    surname: string
    description?: string
  }): Promise<ApiResponse<GenealogyTree>> {
    return apiClient.post<ApiResponse<GenealogyTree>>('/genealogy', data)
  }

  // 添加族谱成员
  async addMember(genealogyId: string, data: Partial<GenealogyMember>): Promise<ApiResponse<GenealogyMember>> {
    return apiClient.post<ApiResponse<GenealogyMember>>(`/genealogy/${genealogyId}/members`, data)
  }
}

export const genealogyApi = new GenealogyApi()
export default genealogyApi
