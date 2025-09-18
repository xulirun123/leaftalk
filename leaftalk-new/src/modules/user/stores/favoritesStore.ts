/**
 * 收藏功能数据存储
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FavoriteItem {
  id: string
  type: 'text' | 'image' | 'video' | 'voice' | 'file' | 'link' | 'location' | 'contact'
  title: string
  preview: string
  content?: string
  url?: string
  filePath?: string
  fileSize?: number
  fileName?: string
  chatId?: string
  messageId?: string
  senderId?: string
  senderName?: string
  createTime: number
  tags?: string[]
  note?: string
}

export const useFavoritesStore = defineStore('favorites', () => {
  // 收藏列表
  const favorites = ref<FavoriteItem[]>([])
  
  // 是否已初始化
  const isInitialized = ref(false)

  // 计算属性
  const favoriteCount = computed(() => favorites.value.length)
  
  const favoritesByType = computed(() => {
    const grouped: Record<string, FavoriteItem[]> = {}
    favorites.value.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = []
      }
      grouped[item.type].push(item)
    })
    return grouped
  })

  const recentFavorites = computed(() => {
    return [...favorites.value]
      .sort((a, b) => b.createTime - a.createTime)
      .slice(0, 10)
  })

  // 初始化
  const init = () => {
    if (isInitialized.value) return
    
    loadFromStorage()
    isInitialized.value = true
    console.log('✅ 收藏功能初始化完成')
  }

  // 从localStorage加载收藏数据
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('yeyu_favorites')
      if (saved) {
        const data = JSON.parse(saved)
        favorites.value = data || []
        console.log('📚 从本地存储加载收藏:', favorites.value.length, '个')
      }
    } catch (error) {
      console.error('❌ 加载收藏数据失败:', error)
      favorites.value = []
    }
  }

  // 保存到localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('yeyu_favorites', JSON.stringify(favorites.value))
      console.log('💾 收藏数据已保存')
    } catch (error) {
      console.error('❌ 保存收藏数据失败:', error)
    }
  }

  // 添加收藏
  const addFavorite = (item: Omit<FavoriteItem, 'id' | 'createTime'>) => {
    const newFavorite: FavoriteItem = {
      ...item,
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createTime: Date.now()
    }
    
    favorites.value.unshift(newFavorite)
    saveToStorage()
    
    console.log('⭐ 添加收藏:', newFavorite.title)
    return newFavorite
  }

  // 删除收藏
  const removeFavorite = (favoriteId: string) => {
    const index = favorites.value.findIndex(item => item.id === favoriteId)
    if (index !== -1) {
      const removed = favorites.value.splice(index, 1)[0]
      saveToStorage()
      console.log('🗑️ 删除收藏:', removed.title)
      return removed
    }
    return null
  }

  // 检查是否已收藏
  const isFavorited = (messageId: string, chatId: string) => {
    return favorites.value.some(item => 
      item.messageId === messageId && item.chatId === chatId
    )
  }

  // 根据消息ID查找收藏
  const findByMessage = (messageId: string, chatId: string) => {
    return favorites.value.find(item => 
      item.messageId === messageId && item.chatId === chatId
    )
  }

  // 搜索收藏
  const searchFavorites = (query: string) => {
    if (!query.trim()) return favorites.value
    
    const lowerQuery = query.toLowerCase()
    return favorites.value.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.preview.toLowerCase().includes(lowerQuery) ||
      (item.content && item.content.toLowerCase().includes(lowerQuery)) ||
      (item.note && item.note.toLowerCase().includes(lowerQuery)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    )
  }

  // 按类型过滤收藏
  const filterByType = (type: FavoriteItem['type']) => {
    return favorites.value.filter(item => item.type === type)
  }

  // 更新收藏备注
  const updateNote = (favoriteId: string, note: string) => {
    const item = favorites.value.find(f => f.id === favoriteId)
    if (item) {
      item.note = note
      saveToStorage()
      console.log('📝 更新收藏备注:', item.title)
    }
  }

  // 添加标签
  const addTag = (favoriteId: string, tag: string) => {
    const item = favorites.value.find(f => f.id === favoriteId)
    if (item) {
      if (!item.tags) item.tags = []
      if (!item.tags.includes(tag)) {
        item.tags.push(tag)
        saveToStorage()
        console.log('🏷️ 添加标签:', tag, '到', item.title)
      }
    }
  }

  // 删除标签
  const removeTag = (favoriteId: string, tag: string) => {
    const item = favorites.value.find(f => f.id === favoriteId)
    if (item && item.tags) {
      const index = item.tags.indexOf(tag)
      if (index !== -1) {
        item.tags.splice(index, 1)
        saveToStorage()
        console.log('🗑️ 删除标签:', tag, '从', item.title)
      }
    }
  }

  // 清空所有收藏
  const clearAll = () => {
    favorites.value = []
    saveToStorage()
    console.log('🗑️ 清空所有收藏')
  }

  // 导出收藏数据
  const exportFavorites = () => {
    const data = {
      version: '1.0',
      exportTime: Date.now(),
      count: favorites.value.length,
      favorites: favorites.value
    }
    return JSON.stringify(data, null, 2)
  }

  // 导入收藏数据
  const importFavorites = (jsonData: string, merge = true) => {
    try {
      const data = JSON.parse(jsonData)
      if (data.favorites && Array.isArray(data.favorites)) {
        if (merge) {
          // 合并模式：添加不重复的收藏
          data.favorites.forEach((item: FavoriteItem) => {
            const exists = favorites.value.some(f => 
              f.messageId === item.messageId && f.chatId === item.chatId
            )
            if (!exists) {
              favorites.value.push(item)
            }
          })
        } else {
          // 替换模式：完全替换
          favorites.value = data.favorites
        }
        saveToStorage()
        console.log('📥 导入收藏数据:', data.favorites.length, '个')
        return true
      }
    } catch (error) {
      console.error('❌ 导入收藏数据失败:', error)
    }
    return false
  }

  return {
    // 状态
    favorites,
    isInitialized,
    
    // 计算属性
    favoriteCount,
    favoritesByType,
    recentFavorites,
    
    // 方法
    init,
    loadFromStorage,
    saveToStorage,
    addFavorite,
    removeFavorite,
    isFavorited,
    findByMessage,
    searchFavorites,
    filterByType,
    updateNote,
    addTag,
    removeTag,
    clearAll,
    exportFavorites,
    importFavorites
  }
})
