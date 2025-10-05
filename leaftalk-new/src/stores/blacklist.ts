import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface BlacklistUser {
  id: string
  yeyuId: string
  username: string
  nickname: string
  avatar: string
  addTime: string
  reason?: string
}

export const useBlacklistStore = defineStore('blacklist', () => {
  const blacklistUsers = ref<BlacklistUser[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const blacklistCount = computed(() => blacklistUsers.value.length)
  const isEmpty = computed(() => blacklistUsers.value.length === 0)

  // 获取黑名单列表
  async function fetchBlacklist() {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      // const response = await api.get('/api/contacts/blacklist')
      // blacklistUsers.value = response.data.data
      
      // 临时使用本地存储
      const stored = localStorage.getItem('yeyu_blacklist')
      if (stored) {
        blacklistUsers.value = JSON.parse(stored)
      }
    } catch (err) {
      error.value = '获取黑名单失败'
      console.error('获取黑名单失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 添加到黑名单
  async function addToBlacklist(user: Omit<BlacklistUser, 'addTime'>) {
    isLoading.value = true
    error.value = null
    
    try {
      const blacklistUser: BlacklistUser = {
        ...user,
        addTime: new Date().toISOString()
      }
      
      // 模拟API调用
      // await api.post('/api/contacts/blacklist', { userId: user.id })
      
      blacklistUsers.value.push(blacklistUser)
      
      // 保存到本地存储
      localStorage.setItem('yeyu_blacklist', JSON.stringify(blacklistUsers.value))
      
      return true
    } catch (err) {
      error.value = '添加到黑名单失败'
      console.error('添加到黑名单失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 从黑名单移除
  async function removeFromBlacklist(userId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      // await api.delete(`/api/contacts/blacklist/${userId}`)
      
      const index = blacklistUsers.value.findIndex(user => user.id === userId)
      if (index > -1) {
        blacklistUsers.value.splice(index, 1)
        
        // 保存到本地存储
        localStorage.setItem('yeyu_blacklist', JSON.stringify(blacklistUsers.value))
      }
      
      return true
    } catch (err) {
      error.value = '移除黑名单失败'
      console.error('移除黑名单失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 检查用户是否在黑名单中
  function isInBlacklist(userId: string): boolean {
    return blacklistUsers.value.some(user => user.id === userId)
  }

  // 清空黑名单
  async function clearBlacklist() {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      // await api.delete('/api/contacts/blacklist/all')
      
      blacklistUsers.value = []
      localStorage.removeItem('yeyu_blacklist')
      
      return true
    } catch (err) {
      error.value = '清空黑名单失败'
      console.error('清空黑名单失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 初始化
  function initBlacklist() {
    fetchBlacklist()
  }

  return {
    // 状态
    blacklistUsers,
    isLoading,
    error,
    
    // 计算属性
    blacklistCount,
    isEmpty,
    
    // 方法
    fetchBlacklist,
    addToBlacklist,
    removeFromBlacklist,
    isInBlacklist,
    clearBlacklist,
    initBlacklist
  }
})
