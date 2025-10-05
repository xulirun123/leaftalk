import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FavoriteItem {
  id: string
  type: 'message' | 'image' | 'video' | 'file' | 'link' | 'contact' | 'moment'
  title: string
  content?: string
  url?: string
  thumbnail?: string
  metadata?: any
  createdAt: string
  updatedAt: string
  tags?: string[]
  category?: string
}

export interface FavoriteCategory {
  id: string
  name: string
  icon: string
  count: number
  color?: string
}

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FavoriteItem[]>([])
  const categories = ref<FavoriteCategory[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const favoritesByType = computed(() => {
    const grouped: { [key: string]: FavoriteItem[] } = {}
    favorites.value.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = []
      }
      grouped[item.type].push(item)
    })
    return grouped
  })

  const favoritesByCategory = computed(() => {
    const grouped: { [key: string]: FavoriteItem[] } = {}
    favorites.value.forEach(item => {
      const category = item.category || 'uncategorized'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(item)
    })
    return grouped
  })

  const totalCount = computed(() => favorites.value.length)

  // 初始化收藏夹数据
  function initializeFavorites() {
    categories.value = [
      {
        id: 'all',
        name: '全部',
        icon: '📋',
        count: 0
      },
      {
        id: 'messages',
        name: '消息',
        icon: '💬',
        count: 0,
        color: '#07C160'
      },
      {
        id: 'images',
        name: '图片',
        icon: '🖼️',
        count: 0,
        color: '#FF6B6B'
      },
      {
        id: 'videos',
        name: '视频',
        icon: '🎥',
        count: 0,
        color: '#4ECDC4'
      },
      {
        id: 'files',
        name: '文件',
        icon: '📄',
        count: 0,
        color: '#45B7D1'
      },
      {
        id: 'links',
        name: '链接',
        icon: '🔗',
        count: 0,
        color: '#96CEB4'
      },
      {
        id: 'contacts',
        name: '联系人',
        icon: '👥',
        count: 0,
        color: '#FFEAA7'
      }
    ]

    // 模拟一些收藏数据
    favorites.value = [
      {
        id: 'fav_001',
        type: 'message',
        title: '重要消息',
        content: '这是一条重要的家族通知消息',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'messages',
        tags: ['重要', '通知']
      },
      {
        id: 'fav_002',
        type: 'image',
        title: '家族合影',
        url: '/images/family-photo.jpg',
        thumbnail: '/images/family-photo-thumb.jpg',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        category: 'images',
        tags: ['家族', '合影']
      }
    ]

    updateCategoryCounts()
  }

  // 更新分类计数
  function updateCategoryCounts() {
    const typeCounts: { [key: string]: number } = {}
    favorites.value.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
    })

    categories.value.forEach(category => {
      if (category.id === 'all') {
        category.count = favorites.value.length
      } else {
        const type = category.id.slice(0, -1) // 移除复数形式的's'
        category.count = typeCounts[type] || 0
      }
    })
  }

  // 获取收藏列表
  async function fetchFavorites() {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      // favorites.value = response.data.favorites
      updateCategoryCounts()
    } catch (err) {
      error.value = '获取收藏失败'
      console.error('获取收藏失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 添加收藏
  async function addFavorite(item: Omit<FavoriteItem, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true
    error.value = null
    
    try {
      const favoriteItem: FavoriteItem = {
        ...item,
        id: `fav_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      
      favorites.value.unshift(favoriteItem)
      updateCategoryCounts()
      
      return favoriteItem
    } catch (err) {
      error.value = '添加收藏失败'
      console.error('添加收藏失败:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 移除收藏
  async function removeFavorite(favoriteId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const index = favorites.value.findIndex(item => item.id === favoriteId)
      if (index > -1) {
        favorites.value.splice(index, 1)
        updateCategoryCounts()
      }
      
      return true
    } catch (err) {
      error.value = '移除收藏失败'
      console.error('移除收藏失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 更新收藏
  async function updateFavorite(favoriteId: string, updates: Partial<FavoriteItem>) {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const index = favorites.value.findIndex(item => item.id === favoriteId)
      if (index > -1) {
        favorites.value[index] = {
          ...favorites.value[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        updateCategoryCounts()
      }
      
      return true
    } catch (err) {
      error.value = '更新收藏失败'
      console.error('更新收藏失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 搜索收藏
  function searchFavorites(query: string): FavoriteItem[] {
    if (!query.trim()) return favorites.value
    
    const lowerQuery = query.toLowerCase()
    return favorites.value.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content?.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // 按类型筛选
  function getFavoritesByType(type: string): FavoriteItem[] {
    if (type === 'all') return favorites.value
    return favorites.value.filter(item => item.type === type)
  }

  // 按分类筛选
  function getFavoritesByCategory(category: string): FavoriteItem[] {
    if (category === 'all') return favorites.value
    return favorites.value.filter(item => item.category === category)
  }

  // 检查是否已收藏
  function isFavorited(itemId: string, type: string): boolean {
    return favorites.value.some(item => 
      item.metadata?.originalId === itemId && item.type === type
    )
  }

  // 清空收藏
  async function clearFavorites() {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      favorites.value = []
      updateCategoryCounts()
      
      return true
    } catch (err) {
      error.value = '清空收藏失败'
      console.error('清空收藏失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    favorites,
    categories,
    isLoading,
    error,
    
    // 计算属性
    favoritesByType,
    favoritesByCategory,
    totalCount,
    
    // 方法
    initializeFavorites,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    updateFavorite,
    searchFavorites,
    getFavoritesByType,
    getFavoritesByCategory,
    isFavorited,
    clearFavorites
  }
})
