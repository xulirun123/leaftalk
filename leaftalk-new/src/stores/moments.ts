import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MomentImage {
  id: string
  url: string
  thumbnail: string
  width: number
  height: number
}

export interface MomentVideo {
  id: string
  url: string
  thumbnail: string
  duration: number
  width: number
  height: number
}

export interface MomentLocation {
  name: string
  address: string
  latitude: number
  longitude: number
}

export interface MomentComment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: string
  likeCount: number
  isLiked?: boolean
  replies?: MomentComment[]
}

export interface MomentLike {
  userId: string
  userName: string
  userAvatar: string
  createdAt: string
}

export interface Moment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  images: MomentImage[]
  videos: MomentVideo[]
  location?: MomentLocation
  createdAt: string
  updatedAt: string
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number
  isLiked?: boolean
  isFavorited?: boolean
  visibility: 'public' | 'friends' | 'family' | 'private'
  tags: string[]
  mentions: string[]
  likes: MomentLike[]
  comments: MomentComment[]
}

export const useMomentsStore = defineStore('moments', () => {
  const moments = ref<Moment[]>([])
  const currentMoment = ref<Moment | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const publicMoments = computed(() => {
    return moments.value.filter(moment => moment.visibility === 'public')
  })

  const friendsMoments = computed(() => {
    return moments.value.filter(moment => 
      moment.visibility === 'friends' || moment.visibility === 'public'
    )
  })

  const myMoments = computed(() => {
    return moments.value.filter(moment => moment.userId === 'current_user')
  })

  const totalLikes = computed(() => {
    return moments.value.reduce((total, moment) => total + moment.likeCount, 0)
  })

  // 初始化朋友圈数据
  function initializeMoments() {
    moments.value = [
      {
        id: 'moment_001',
        userId: 'user_001',
        userName: '张家长',
        userAvatar: '👨‍🦳',
        content: '今天家族聚会，四代同堂，其乐融融！感谢叶语平台让我们的家族更加紧密。',
        images: [
          {
            id: 'img_001',
            url: '/images/family-gathering-1.jpg',
            thumbnail: '/images/family-gathering-1-thumb.jpg',
            width: 800,
            height: 600
          },
          {
            id: 'img_002',
            url: '/images/family-gathering-2.jpg',
            thumbnail: '/images/family-gathering-2-thumb.jpg',
            width: 800,
            height: 600
          }
        ],
        videos: [],
        location: {
          name: '张家大院',
          address: '北京市朝阳区某某街道',
          latitude: 39.9042,
          longitude: 116.4074
        },
        createdAt: '2024-02-10T10:00:00Z',
        updatedAt: '2024-02-10T10:00:00Z',
        likeCount: 25,
        commentCount: 8,
        shareCount: 3,
        viewCount: 120,
        isLiked: false,
        isFavorited: false,
        visibility: 'public',
        tags: ['家族聚会', '春节'],
        mentions: [],
        likes: [],
        comments: []
      },
      {
        id: 'moment_002',
        userId: 'user_002',
        userName: '李奶奶',
        userAvatar: '👵',
        content: '分享一个家族传统菜谱，传承了三代的红烧肉做法，希望年轻人也能学会。',
        images: [
          {
            id: 'img_003',
            url: '/images/traditional-dish.jpg',
            thumbnail: '/images/traditional-dish-thumb.jpg',
            width: 600,
            height: 800
          }
        ],
        videos: [],
        createdAt: '2024-02-08T15:30:00Z',
        updatedAt: '2024-02-08T15:30:00Z',
        likeCount: 18,
        commentCount: 12,
        shareCount: 5,
        viewCount: 85,
        isLiked: true,
        isFavorited: true,
        visibility: 'friends',
        tags: ['传统菜谱', '家族传承'],
        mentions: [],
        likes: [],
        comments: []
      }
    ]
  }

  // 获取朋友圈列表
  async function fetchMoments(page = 1, limit = 20) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      // moments.value = response.data.moments
    } catch (err) {
      error.value = '获取朋友圈失败'
      console.error('获取朋友圈失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 发布朋友圈
  async function publishMoment(momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt' | 'likeCount' | 'commentCount' | 'shareCount' | 'viewCount' | 'likes' | 'comments'>) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newMoment: Moment = {
        ...momentData,
        id: `moment_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
        likes: [],
        comments: []
      }

      moments.value.unshift(newMoment)
      return newMoment
    } catch (err) {
      error.value = '发布朋友圈失败'
      console.error('发布朋友圈失败:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 点赞朋友圈
  async function likeMoment(momentId: string) {
    try {
      const moment = moments.value.find(m => m.id === momentId)
      if (moment) {
        if (moment.isLiked) {
          moment.likeCount--
          moment.isLiked = false
          // 移除点赞记录
          moment.likes = moment.likes.filter(like => like.userId !== 'current_user')
        } else {
          moment.likeCount++
          moment.isLiked = true
          // 添加点赞记录
          moment.likes.push({
            userId: 'current_user',
            userName: '当前用户',
            userAvatar: '👤',
            createdAt: new Date().toISOString()
          })
        }
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '点赞失败'
      console.error('点赞失败:', err)
    }
  }

  // 收藏朋友圈
  async function favoriteMoment(momentId: string) {
    try {
      const moment = moments.value.find(m => m.id === momentId)
      if (moment) {
        moment.isFavorited = !moment.isFavorited
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '收藏失败'
      console.error('收藏失败:', err)
    }
  }

  // 分享朋友圈
  async function shareMoment(momentId: string) {
    try {
      const moment = moments.value.find(m => m.id === momentId)
      if (moment) {
        moment.shareCount++
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '分享失败'
      console.error('分享失败:', err)
    }
  }

  // 评论朋友圈
  async function commentMoment(momentId: string, content: string, replyToId?: string) {
    try {
      const moment = moments.value.find(m => m.id === momentId)
      if (!moment) return null

      const newComment: MomentComment = {
        id: `comment_${Date.now()}`,
        userId: 'current_user',
        userName: '当前用户',
        userAvatar: '👤',
        content,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        isLiked: false
      }

      if (replyToId) {
        // 回复评论
        const parentComment = moment.comments.find(c => c.id === replyToId)
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = []
          }
          parentComment.replies.push(newComment)
        }
      } else {
        // 直接评论
        moment.comments.push(newComment)
        moment.commentCount++
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      return newComment
    } catch (err) {
      error.value = '评论失败'
      console.error('评论失败:', err)
      return null
    }
  }

  // 点赞评论
  async function likeComment(momentId: string, commentId: string) {
    try {
      const moment = moments.value.find(m => m.id === momentId)
      if (!moment) return

      const comment = moment.comments.find(c => c.id === commentId)
      if (comment) {
        if (comment.isLiked) {
          comment.likeCount--
          comment.isLiked = false
        } else {
          comment.likeCount++
          comment.isLiked = true
        }
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '点赞评论失败'
      console.error('点赞评论失败:', err)
    }
  }

  // 删除朋友圈
  async function deleteMoment(momentId: string) {
    try {
      const index = moments.value.findIndex(m => m.id === momentId)
      if (index > -1) {
        moments.value.splice(index, 1)
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      return true
    } catch (err) {
      error.value = '删除朋友圈失败'
      console.error('删除朋友圈失败:', err)
      return false
    }
  }

  // 搜索朋友圈
  async function searchMoments(query: string, page = 1, limit = 20) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 600))

      const filteredMoments = moments.value.filter(moment =>
        moment.content.toLowerCase().includes(query.toLowerCase()) ||
        moment.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        moment.userName.toLowerCase().includes(query.toLowerCase())
      )

      return {
        moments: filteredMoments.slice((page - 1) * limit, page * limit),
        total: filteredMoments.length
      }
    } catch (err) {
      error.value = '搜索失败'
      console.error('搜索失败:', err)
      return { moments: [], total: 0 }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    moments,
    currentMoment,
    isLoading,
    error,

    // 计算属性
    publicMoments,
    friendsMoments,
    myMoments,
    totalLikes,

    // 方法
    initializeMoments,
    fetchMoments,
    publishMoment,
    likeMoment,
    favoriteMoment,
    shareMoment,
    commentMoment,
    likeComment,
    deleteMoment,
    searchMoments
  }
})
