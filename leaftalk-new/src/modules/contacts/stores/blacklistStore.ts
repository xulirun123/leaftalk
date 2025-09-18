import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient, type ApiResponse } from '../../../shared/services/apiClient'

export interface BlacklistUser {
  id: string
  name: string
  avatar: string
  yeyuId: string
  addTime: number
  reason?: string
}

export const useBlacklistStore = defineStore('blacklist', () => {
  const blacklist = ref<BlacklistUser[]>([])

  // 从localStorage加载黑名单
  const loadBlacklist = () => {
    try {
      const stored = localStorage.getItem('yeyu_blacklist')
      if (stored) {
        blacklist.value = JSON.parse(stored)
        console.log('📋 黑名单加载完成:', blacklist.value.length, '个用户')
      }
    } catch (error) {
      console.error('❌ 加载黑名单失败:', error)
      blacklist.value = []
    }
  }
  // 从服务器加载黑名单（真实头像与昵称）
  const loadFromServer = async () => {
    try {
      const res = await apiClient.get<any>('/user/blacklist')
      if (res.success) {
        const list = Array.isArray(res.data?.blacklist) ? res.data.blacklist : (Array.isArray(res.data) ? res.data : [])
        blacklist.value = list.map((u: any) => ({
          id: String(u.blocked_user_id ?? u.id ?? ''),
          name: u.nickname || u.real_name || u.yeyu_id || '用户',
          avatar: u.avatar || '',
          yeyuId: u.yeyu_id || '',
          addTime: u.created_at ? Date.parse(u.created_at) : Date.now(),
          reason: u.reason || ''
        })).filter(u => !!u.id)
        console.log('📋 黑名单(服务器)加载完成:', blacklist.value.length, '个用户')
        saveBlacklist()
      } else {
        console.warn('⚠️ 获取黑名单失败:', res.message)
      }
    } catch (error: any) {
      console.error('❌ 从服务器加载黑名单失败:', error?.message || error)
    }
  }


  // 保存黑名单到localStorage
  const saveBlacklist = () => {
    try {
      localStorage.setItem('yeyu_blacklist', JSON.stringify(blacklist.value))
      console.log('💾 黑名单已保存:', blacklist.value.length, '个用户')
    } catch (error) {
      console.error('❌ 保存黑名单失败:', error)
    }
  }

  // 添加用户到黑名单
  const addToBlacklist = (user: Omit<BlacklistUser, 'addTime'>) => {
    // 检查是否已在黑名单中
    if (isInBlacklist(user.id)) {
      console.warn('⚠️ 用户已在黑名单中:', user.name)
      return false
    }

    const blacklistUser: BlacklistUser = {
      ...user,
      addTime: Date.now()
    }

    blacklist.value.push(blacklistUser)
    saveBlacklist()

    console.log('🚫 已添加到黑名单:', user.name)
    return true
  }

  // 从黑名单移除用户
  const removeFromBlacklist = (userId: string) => {
    const index = blacklist.value.findIndex(user => user.id === userId)
    if (index > -1) {
      const removedUser = blacklist.value.splice(index, 1)[0]
      saveBlacklist()
      console.log('✅ 已从黑名单移除:', removedUser.name)
      return true
    }
    return false
  }

  // 检查用户是否在黑名单中
  const isInBlacklist = (userId: string): boolean => {
    return blacklist.value.some(user => user.id === userId)
  }

  // 获取黑名单用户信息
  const getBlacklistUser = (userId: string): BlacklistUser | null => {
    return blacklist.value.find(user => user.id === userId) || null
  }

  // 清空黑名单
  const clearBlacklist = () => {
    blacklist.value = []
    saveBlacklist()
    console.log('🗑️ 黑名单已清空')
  }

  // 检查消息是否应该被拒收
  const shouldRejectMessage = (senderId: string): boolean => {
    const isBlocked = isInBlacklist(senderId)
    if (isBlocked) {
      console.log('🚫 拒收黑名单用户消息:', senderId)
    }
    return isBlocked
  }

  // 获取黑名单统计信息
  const getBlacklistStats = () => {
    return {
      total: blacklist.value.length,
      recentlyAdded: blacklist.value.filter(user =>
        Date.now() - user.addTime < 7 * 24 * 60 * 60 * 1000 // 7天内添加的
      ).length
    }
  }

  // 初始化
  loadBlacklist()

  return {
    blacklist,
    loadBlacklist,
    loadFromServer,
    saveBlacklist,
    addToBlacklist,
    removeFromBlacklist,
    isInBlacklist,
    getBlacklistUser,
    clearBlacklist,
    shouldRejectMessage,
    getBlacklistStats
  }
})
