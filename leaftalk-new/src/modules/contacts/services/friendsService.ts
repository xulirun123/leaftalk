/**
 * 朋友数据服务
 */

import { contactsApi } from './contactsApi'

export interface Friend {
  id: string
  name: string
  nickname?: string
  avatar?: string
  phone?: string
  yeyuId?: string
  status?: string
  signature?: string
  region?: string
  friendSince?: string
}

export class FriendsService {
  private static instance: FriendsService
  private friendsCache: Friend[] = []
  private lastFetchTime = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {}

  static getInstance(): FriendsService {
    if (!FriendsService.instance) {
      FriendsService.instance = new FriendsService()
    }
    return FriendsService.instance
  }

  /**
   * 获取朋友列表
   */
  async getFriends(forceRefresh = false): Promise<Friend[]> {
    const now = Date.now()
    
    // 如果缓存有效且不强制刷新，返回缓存数据
    if (!forceRefresh && this.friendsCache.length > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      console.log('📋 返回缓存的朋友列表:', this.friendsCache.length, '个朋友')
      return this.friendsCache
    }

    try {
      console.log('🔄 从API获取朋友列表...')
      const response = await contactsApi.getContacts()
      console.log('🔍 朋友列表API响应:', response)

      if (response && response.success) {
        const apiContacts = response.data || []

        // 调试：显示API返回的原始数据
        console.log('🔍 API原始联系人数据:', apiContacts)

        // 转换API数据格式
        this.friendsCache = apiContacts.map((contact: any) => {
          console.log('🔍 处理联系人:', contact)
          return {
            id: contact.id,
            name: contact.name || contact.nickname || contact.username,
            nickname: contact.nickname,
            avatar: contact.avatar,
            phone: contact.phone,
            yeyuId: contact.yeyuId,
            status: this.getRandomStatus(), // 模拟在线状态
            signature: contact.signature,
            region: contact.region,
            friendSince: contact.friend_since || contact.created_at
          }
        })

        this.lastFetchTime = now
        console.log('✅ 朋友列表获取成功:', this.friendsCache.length, '个朋友')
        return this.friendsCache
      } else {
        console.warn('⚠️ API返回失败:', response)
        return []
      }
    } catch (error) {
      console.error('❌ 获取朋友列表失败:', error)
      
      // 如果有缓存数据，返回缓存
      if (this.friendsCache.length > 0) {
        console.log('📋 API失败，返回缓存数据:', this.friendsCache.length, '个朋友')
        return this.friendsCache
      }
      
      // 否则返回空数组
      return []
    }
  }

  /**
   * 搜索朋友
   */
  async searchFriends(query: string): Promise<Friend[]> {
    const friends = await this.getFriends()
    
    if (!query.trim()) {
      return friends
    }

    const searchTerm = query.toLowerCase()
    return friends.filter(friend => 
      friend.name.toLowerCase().includes(searchTerm) ||
      (friend.nickname && friend.nickname.toLowerCase().includes(searchTerm)) ||
      (friend.phone && friend.phone.includes(searchTerm)) ||
      (friend.yeyuId && friend.yeyuId.toLowerCase().includes(searchTerm))
    )
  }

  /**
   * 根据ID获取朋友信息
   */
  async getFriendById(friendId: string | number | undefined): Promise<Friend | null> {
    // 处理undefined或null的情况
    if (friendId === undefined || friendId === null) {
      console.warn('⚠️ getFriendById: friendId is undefined or null')
      return null
    }

    const friends = await this.getFriends()

    // 支持字符串和数字ID的匹配
    return friends.find(friend => {
      const fId = friend.id
      const searchId = friendId

      // 确保两个值都不是undefined/null
      if (fId === undefined || fId === null || searchId === undefined || searchId === null) {
        return false
      }

      // 尝试多种匹配方式
      return fId === searchId ||                    // 直接匹配
             fId == searchId ||                     // 类型转换匹配
             String(fId) === String(searchId)       // 强制字符串匹配
    }) || null
  }

  /**
   * 根据ID列表获取朋友信息
   */
  async getFriendsByIds(friendIds: string[]): Promise<Friend[]> {
    const friends = await this.getFriends()
    return friends.filter(friend => friendIds.includes(friend.id))
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.friendsCache = []
    this.lastFetchTime = 0
    console.log('🗑️ 朋友列表缓存已清除')
  }

  /**
   * 刷新朋友列表
   */
  async refreshFriends(): Promise<Friend[]> {
    return this.getFriends(true)
  }

  /**
   * 获取随机在线状态（模拟）
   */
  private getRandomStatus(): string {
    const statuses = ['在线', '离线', '忙碌', '离开', '隐身']
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  /**
   * 检查是否为朋友
   */
  async isFriend(userId: string): Promise<boolean> {
    const friends = await this.getFriends()
    return friends.some(friend => friend.id === userId)
  }

  /**
   * 获取朋友数量
   */
  async getFriendsCount(): Promise<number> {
    const friends = await this.getFriends()
    return friends.length
  }

  /**
   * 获取在线朋友数量
   */
  async getOnlineFriendsCount(): Promise<number> {
    const friends = await this.getFriends()
    return friends.filter(friend => friend.status === '在线').length
  }
}

// 导出单例实例
export const friendsService = FriendsService.getInstance()

// 导出默认实例
export default friendsService
