import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface DiscoverItem {
  id: string
  title: string
  description: string
  icon: string
  path: string
  category: 'service' | 'game' | 'tool' | 'social'
  isNew?: boolean
  isHot?: boolean
}

export interface ServiceCategory {
  id: string
  name: string
  icon: string
  items: DiscoverItem[]
}

export const useDiscoverStore = defineStore('discover', () => {
  const services = ref<ServiceCategory[]>([
    {
      id: 'ai',
      name: 'AI助手',
      icon: 'robot',
      items: [
        {
          id: 'ai-assistant',
          title: 'AI助手',
          description: '智能对话助手',
          icon: 'robot',
          path: '/ai-assistant',
          category: 'service',
          isNew: true
        }
      ]
    },
    {
      id: 'entertainment',
      name: '娱乐',
      icon: 'game-controller',
      items: [
        {
          id: 'games',
          title: '游戏',
          description: '休闲小游戏',
          icon: 'game-controller',
          path: '/games',
          category: 'game'
        }
      ]
    },
    {
      id: 'tools',
      name: '工具',
      icon: 'wrench',
      items: [
        {
          id: 'scan',
          title: '扫一扫',
          description: '扫描二维码',
          icon: 'qr-code',
          path: '/scan',
          category: 'tool'
        }
      ]
    }
  ])

  const recentlyUsed = ref<DiscoverItem[]>([])
  const favorites = ref<DiscoverItem[]>([])

  // 获取所有服务
  const allServices = computed(() => {
    return services.value.flatMap(category => category.items)
  })

  // 获取新服务
  const newServices = computed(() => {
    return allServices.value.filter(item => item.isNew)
  })

  // 获取热门服务
  const hotServices = computed(() => {
    return allServices.value.filter(item => item.isHot)
  })

  // 添加到最近使用
  function addToRecentlyUsed(item: DiscoverItem) {
    const existingIndex = recentlyUsed.value.findIndex(i => i.id === item.id)
    if (existingIndex >= 0) {
      recentlyUsed.value.splice(existingIndex, 1)
    }
    recentlyUsed.value.unshift(item)
    
    // 限制最近使用的数量
    if (recentlyUsed.value.length > 10) {
      recentlyUsed.value = recentlyUsed.value.slice(0, 10)
    }
  }

  // 添加到收藏
  function addToFavorites(item: DiscoverItem) {
    const existingIndex = favorites.value.findIndex(i => i.id === item.id)
    if (existingIndex < 0) {
      favorites.value.push(item)
    }
  }

  // 从收藏中移除
  function removeFromFavorites(itemId: string) {
    const index = favorites.value.findIndex(i => i.id === itemId)
    if (index >= 0) {
      favorites.value.splice(index, 1)
    }
  }

  // 检查是否已收藏
  function isFavorite(itemId: string): boolean {
    return favorites.value.some(i => i.id === itemId)
  }

  // 搜索服务
  function searchServices(query: string): DiscoverItem[] {
    const lowerQuery = query.toLowerCase()
    return allServices.value.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    )
  }

  // 根据分类获取服务
  function getServicesByCategory(category: string): DiscoverItem[] {
    return allServices.value.filter(item => item.category === category)
  }

  return {
    services,
    recentlyUsed,
    favorites,
    allServices,
    newServices,
    hotServices,
    addToRecentlyUsed,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    searchServices,
    getServicesByCategory
  }
})
