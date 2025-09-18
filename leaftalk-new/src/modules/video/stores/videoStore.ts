import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  duration: number
  views: number
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  isFollowed: boolean
  tags: string[]
  author: {
    id: string
    name: string
    avatar: string
    isVerified?: boolean
  }
  privacy: 'public' | 'friends' | 'private'
  location?: string
  allowComments: boolean
  allowDownload: boolean
  allowShare: boolean
  createdAt: number
  updatedAt: number
  category: string
  status: 'published' | 'processing' | 'draft' | 'deleted'
}

export interface VideoComment {
  id: string
  videoId: string
  content: string
  user: {
    id: string
    name: string
    avatar: string
  }
  likes: number
  isLiked: boolean
  replies: VideoComment[]
  createdAt: number
}

export interface VideoUploadProgress {
  videoId: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  message?: string
}

export const useVideoStore = defineStore('video', () => {
  // 状态
  const videos = ref<Video[]>([])
  const myVideos = ref<Video[]>([])
  const followingVideos = ref<Video[]>([])
  const trendingVideos = ref<Video[]>([])
  const comments = ref<Map<string, VideoComment[]>>(new Map())
  const uploadProgress = ref<Map<string, VideoUploadProgress>>(new Map())

  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(1)

  // 计算属性
  const publishedVideos = computed(() =>
    videos.value.filter(video => video.status === 'published')
  )

  const processingVideos = computed(() =>
    videos.value.filter(video => video.status === 'processing')
  )

  const totalViews = computed(() =>
    myVideos.value.reduce((total, video) => total + video.views, 0)
  )

  const totalLikes = computed(() =>
    myVideos.value.reduce((total, video) => total + video.likes, 0)
  )

  // 视频管理
  const loadVideos = async (category = 'all', page = 1, limit = 20) => {
    try {
      loading.value = true
      error.value = null

      // 模拟API调用
      const response = await fetch(`/api/videos?category=${category}&page=${page}&limit=${limit}`)

      if (!response.ok) {
        throw new Error('获取视频列表失败')
      }

      const data = await response.json()

      if (page === 1) {
        videos.value = data.videos || []
      } else {
        videos.value.push(...(data.videos || []))
      }

      hasMore.value = data.hasMore ?? false
      currentPage.value = page

    } catch (err) {
      console.error('加载视频失败:', err)
      error.value = err instanceof Error ? err.message : '加载失败'

      // 使用模拟数据
      if (page === 1) {
        videos.value = []
      }
    } finally {
      loading.value = false
    }
  }

  // 保存视频到localStorage
  const saveVideosToStorage = () => {
    try {
      localStorage.setItem('yeyu_my_videos', JSON.stringify(myVideos.value))
      console.log('💾 视频数据已保存到localStorage')
    } catch (error) {
      console.error('保存视频数据失败:', error)
    }
  }

  // 添加视频
  const addVideo = (videoData: Partial<Video>) => {
    const video: Video = {
      id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      title: videoData.title || '',
      description: videoData.description || '',
      thumbnail: videoData.thumbnail || '',
      videoUrl: videoData.videoUrl || '',
      duration: videoData.duration || 0,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isFollowed: false,
      tags: videoData.tags || [],
      author: {
        id: 'current-user',
        name: '我',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me'
      },
      privacy: videoData.privacy || 'public',
      location: videoData.location,
      allowComments: true,
      allowDownload: true,
      allowShare: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category: videoData.category || 'general',
      status: videoData.status || 'published'
    }

    myVideos.value.unshift(video)
    saveVideosToStorage()
    console.log('📹 添加视频:', video.title)
    return video
  }

  // 删除视频
  const removeVideo = (videoId: string) => {
    const index = myVideos.value.findIndex(v => v.id === videoId)
    if (index >= 0) {
      const video = myVideos.value[index]
      myVideos.value.splice(index, 1)
      saveVideosToStorage()
        console.log('📹 删除视频:', video.title)

      // 清理视频文件URL
      if (video.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(video.videoUrl)
      }
      if (video.thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(video.thumbnail)
      }
    }
  }

  // 更新视频信息
  const updateVideo = (videoId: string, updates: Partial<Video>) => {
    const video = myVideos.value.find(v => v.id === videoId)
    if (video) {
      Object.assign(video, updates)
      saveVideosToStorage()
      console.log('📹 更新视频信息:', video.title)
    }
  }

  // 增加播放量
  const incrementViews = (videoId: string) => {
    const video = myVideos.value.find(v => v.id === videoId)
    if (video) {
      video.views++
      saveVideosToStorage()
    }
  }

  // 点赞/取消点赞
  const toggleLike = (videoId: string) => {
    const video = myVideos.value.find(v => v.id === videoId)
    if (video) {
      // 这里应该检查用户是否已点赞，简化处理
      video.likes++
      saveVideosToStorage()
    }
  }

  // 设置当前视频
  const setCurrentVideo = (_video: Video | null) => {
    // currentVideo.value = video // 需要定义 currentVideo 变量
  }

  // 发布视频
  const publishVideo = async (videoData: {
    title: string
    description: string
    videoUrl: string
    videoBlob: Blob
    thumbnail: string
    duration: string
    tags: string[]
    privacy: 'public' | 'friends' | 'private'
    location?: string
  }) => {
    loading.value = true
    // uploadProgress.value = 0 // 需要修复类型问题

    try {
      // 模拟上传进度
      for (let i = 0; i <= 100; i += 10) {
        // uploadProgress.value = i // 需要修复类型问题
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 创建视频记录
      const video = addVideo({
          title: videoData.title,
          description: videoData.description,
          thumbnail: videoData.thumbnail,
          videoUrl: videoData.videoUrl,
          duration: Number(videoData.duration) || 0,
          tags: videoData.tags,
          privacy: videoData.privacy,
          location: videoData.location,
          // 移除不存在的属性
        })

        console.log('✅ 视频发布成功:', video.title)
        return video

      } catch (error) {
        console.error('❌ 视频发布失败:', error)
        throw error
      } finally {
        loading.value = false
        uploadProgress.value.clear()
      }
    }

  // 生成视频缩略图
  const generateThumbnail = async (videoBlob: Blob): Promise<string> => {
      return new Promise((resolve) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          video.currentTime = 1 // 获取第1秒的帧
        }

        video.onseeked = () => {
          ctx.drawImage(video, 0, 0)
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
          URL.revokeObjectURL(video.src)
          resolve(thumbnailUrl)
        }

        video.src = URL.createObjectURL(videoBlob)
      })
  }

  // 清理所有视频数据
  const clearAllVideos = () => {
    // 清理blob URLs
    myVideos.value.forEach(video => {
      if (video.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(video.videoUrl)
      }
      if (video.thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(video.thumbnail)
      }
    })

    myVideos.value = []
    saveVideosToStorage()
    console.log('🗑️ 已清理所有视频数据')
  }

  // 计算属性（getters）
  const publicVideos = computed(() =>
    myVideos.value.filter(v => v.privacy === 'public')
  )

  const friendsVideos = computed(() =>
    myVideos.value.filter(v => v.privacy === 'friends')
  )

  const privateVideos = computed(() =>
    myVideos.value.filter(v => v.privacy === 'private')
  )

  const recentVideos = computed(() =>
    myVideos.value.slice(0, 6)
  )

  const totalVideosCount = computed(() =>
    myVideos.value.length
  )

  const videosByTag = computed(() => {
    const tagMap: { [key: string]: Video[] } = {}
    myVideos.value.forEach(video => {
      video.tags.forEach(tag => {
        if (!tagMap[tag]) {
          tagMap[tag] = []
        }
        tagMap[tag].push(video)
      })
    })
    return tagMap
  })

  // 返回所有状态和方法
  return {
    // 状态
    videos,
    myVideos,
    followingVideos,
    trendingVideos,
    comments,
    uploadProgress,
    loading,
    error,
    hasMore,
    currentPage,

    // 计算属性
    publishedVideos,
    processingVideos,
    totalViews,
    totalLikes,
    publicVideos,
    friendsVideos,
    privateVideos,
    recentVideos,
    totalVideosCount,
    videosByTag,

    // 方法
    loadVideos,
    addVideo,
    removeVideo,
    updateVideo,
    incrementViews,
    toggleLike,
    setCurrentVideo,
    publishVideo,
    generateThumbnail,
    saveVideosToStorage,
    clearAllVideos
  }
})
