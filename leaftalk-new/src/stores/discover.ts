import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface DiscoverItem {
  id: string
  type: 'article' | 'video' | 'activity' | 'service' | 'game' | 'tool'
  title: string
  description: string
  thumbnail: string
  url?: string
  author?: string
  publishedAt: string
  viewCount: number
  likeCount: number
  shareCount: number
  category: string
  tags: string[]
  isHot?: boolean
  isNew?: boolean
  isRecommended?: boolean
}

export interface DiscoverCategory {
  id: string
  name: string
  icon: string
  description: string
  itemCount: number
  color?: string
}

export interface DiscoverBanner {
  id: string
  title: string
  description: string
  image: string
  url: string
  type: 'internal' | 'external'
  startTime: string
  endTime: string
  isActive: boolean
}

export const useDiscoverStore = defineStore('discover', () => {
  const items = ref<DiscoverItem[]>([])
  const categories = ref<DiscoverCategory[]>([])
  const banners = ref<DiscoverBanner[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const hotItems = computed(() => {
    return items.value.filter(item => item.isHot).slice(0, 10)
  })

  const newItems = computed(() => {
    return items.value.filter(item => item.isNew).slice(0, 10)
  })

  const recommendedItems = computed(() => {
    return items.value.filter(item => item.isRecommended).slice(0, 10)
  })

  const activeBanners = computed(() => {
    const now = new Date().toISOString()
    return banners.value.filter(banner => 
      banner.isActive && 
      banner.startTime <= now && 
      banner.endTime >= now
    )
  })

  // 初始化发现页数据
  function initializeDiscover() {
    categories.value = [
      {
        id: 'articles',
        name: '文章',
        icon: '📄',
        description: '家族文化、传统故事、历史资料',
        itemCount: 25,
        color: '#4CAF50'
      },
      {
        id: 'videos',
        name: '视频',
        icon: '🎥',
        description: '家族视频、纪录片、教学视频',
        itemCount: 18,
        color: '#2196F3'
      },
      {
        id: 'activities',
        name: '活动',
        icon: '🎉',
        description: '家族聚会、节日庆典、文化活动',
        itemCount: 12,
        color: '#FF9800'
      },
      {
        id: 'services',
        name: '服务',
        icon: '🛠️',
        description: '家族服务、专业咨询、技能分享',
        itemCount: 8,
        color: '#9C27B0'
      },
      {
        id: 'games',
        name: '游戏',
        icon: '🎮',
        description: '家族小游戏、互动娱乐',
        itemCount: 6,
        color: '#E91E63'
      },
      {
        id: 'tools',
        name: '工具',
        icon: '🔧',
        description: '实用工具、计算器、查询工具',
        itemCount: 15,
        color: '#607D8B'
      }
    ]

    banners.value = [
      {
        id: 'banner_001',
        title: '春节家族聚会活动',
        description: '参与家族春节聚会，共享天伦之乐',
        image: '/images/spring-festival-banner.jpg',
        url: '/activities/spring-festival',
        type: 'internal',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-03-01T23:59:59Z',
        isActive: true
      },
      {
        id: 'banner_002',
        title: '家族族谱数字化服务',
        description: '专业的族谱数字化服务，永久保存家族历史',
        image: '/images/genealogy-service-banner.jpg',
        url: '/services/genealogy-digitization',
        type: 'internal',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-12-31T23:59:59Z',
        isActive: true
      }
    ]

    items.value = [
      {
        id: 'item_001',
        type: 'article',
        title: '家族传统文化的传承与发展',
        description: '探讨现代社会中如何更好地传承和发展家族传统文化',
        thumbnail: '/images/traditional-culture-thumb.jpg',
        url: '/articles/traditional-culture-inheritance',
        author: '文化研究专家',
        publishedAt: '2024-02-01T10:00:00Z',
        viewCount: 1250,
        likeCount: 89,
        shareCount: 23,
        category: 'articles',
        tags: ['传统文化', '家族传承', '现代发展'],
        isHot: true,
        isRecommended: true
      },
      {
        id: 'item_002',
        type: 'video',
        title: '如何制作家族族谱',
        description: '详细教程：从收集资料到制作完整的家族族谱',
        thumbnail: '/images/genealogy-tutorial-thumb.jpg',
        url: '/videos/genealogy-tutorial',
        author: '族谱专家',
        publishedAt: '2024-01-28T15:30:00Z',
        viewCount: 890,
        likeCount: 67,
        shareCount: 15,
        category: 'videos',
        tags: ['族谱制作', '教程', '家族历史'],
        isNew: true,
        isRecommended: true
      },
      {
        id: 'item_003',
        type: 'activity',
        title: '2024年春节家族大聚会',
        description: '诚邀所有家族成员参加春节大聚会，共度佳节',
        thumbnail: '/images/spring-gathering-thumb.jpg',
        url: '/activities/spring-gathering-2024',
        author: '活动组织委员会',
        publishedAt: '2024-01-15T09:00:00Z',
        viewCount: 2100,
        likeCount: 156,
        shareCount: 45,
        category: 'activities',
        tags: ['春节', '家族聚会', '2024'],
        isHot: true
      },
      {
        id: 'item_004',
        type: 'service',
        title: '专业家谱设计服务',
        description: '提供专业的家谱设计和制作服务，传承家族文化',
        thumbnail: '/images/genealogy-design-service-thumb.jpg',
        url: '/services/genealogy-design',
        author: '设计工作室',
        publishedAt: '2024-01-20T14:00:00Z',
        viewCount: 650,
        likeCount: 42,
        shareCount: 8,
        category: 'services',
        tags: ['家谱设计', '专业服务', '文化传承']
      },
      {
        id: 'item_005',
        type: 'game',
        title: '家族知识问答',
        description: '测试你对家族历史和传统文化的了解程度',
        thumbnail: '/images/family-quiz-thumb.jpg',
        url: '/games/family-quiz',
        author: '游戏开发团队',
        publishedAt: '2024-01-25T11:30:00Z',
        viewCount: 1800,
        likeCount: 134,
        shareCount: 28,
        category: 'games',
        tags: ['问答游戏', '家族知识', '互动娱乐'],
        isNew: true
      },
      {
        id: 'item_006',
        type: 'tool',
        title: '家族关系计算器',
        description: '快速计算复杂的家族关系，理清亲属称谓',
        thumbnail: '/images/relationship-calculator-thumb.jpg',
        url: '/tools/relationship-calculator',
        author: '工具开发团队',
        publishedAt: '2024-01-18T16:45:00Z',
        viewCount: 980,
        likeCount: 73,
        shareCount: 19,
        category: 'tools',
        tags: ['关系计算', '实用工具', '亲属称谓'],
        isRecommended: true
      }
    ]
  }

  // 获取发现页内容
  async function fetchDiscoverItems(category?: string, page = 1, limit = 20) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      let filteredItems = items.value
      if (category && category !== 'all') {
        filteredItems = items.value.filter(item => item.category === category)
      }

      return {
        items: filteredItems.slice((page - 1) * limit, page * limit),
        total: filteredItems.length
      }
    } catch (err) {
      error.value = '获取发现内容失败'
      console.error('获取发现内容失败:', err)
      return { items: [], total: 0 }
    } finally {
      isLoading.value = false
    }
  }

  // 搜索发现内容
  async function searchDiscoverItems(query: string, category?: string, page = 1, limit = 20) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 600))

      let filteredItems = items.value
      
      // 按分类筛选
      if (category && category !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === category)
      }

      // 按关键词搜索
      if (query.trim()) {
        const lowerQuery = query.toLowerCase()
        filteredItems = filteredItems.filter(item =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery) ||
          item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
          item.author?.toLowerCase().includes(lowerQuery)
        )
      }

      return {
        items: filteredItems.slice((page - 1) * limit, page * limit),
        total: filteredItems.length
      }
    } catch (err) {
      error.value = '搜索失败'
      console.error('搜索失败:', err)
      return { items: [], total: 0 }
    } finally {
      isLoading.value = false
    }
  }

  // 点赞内容
  async function likeItem(itemId: string) {
    try {
      const item = items.value.find(i => i.id === itemId)
      if (item) {
        item.likeCount++
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '点赞失败'
      console.error('点赞失败:', err)
    }
  }

  // 分享内容
  async function shareItem(itemId: string) {
    try {
      const item = items.value.find(i => i.id === itemId)
      if (item) {
        item.shareCount++
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '分享失败'
      console.error('分享失败:', err)
    }
  }

  // 增加浏览量
  async function viewItem(itemId: string) {
    try {
      const item = items.value.find(i => i.id === itemId)
      if (item) {
        item.viewCount++
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err) {
      console.error('更新浏览量失败:', err)
    }
  }

  // 获取推荐内容
  async function fetchRecommendedItems(limit = 10) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 400))

      return recommendedItems.value.slice(0, limit)
    } catch (err) {
      error.value = '获取推荐内容失败'
      console.error('获取推荐内容失败:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    items,
    categories,
    banners,
    isLoading,
    error,

    // 计算属性
    hotItems,
    newItems,
    recommendedItems,
    activeBanners,

    // 方法
    initializeDiscover,
    fetchDiscoverItems,
    searchDiscoverItems,
    likeItem,
    shareItem,
    viewItem,
    fetchRecommendedItems
  }
})
