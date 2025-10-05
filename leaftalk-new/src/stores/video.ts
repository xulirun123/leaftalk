import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  duration: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  authorId: string
  authorName: string
  authorAvatar: string
  publishedAt: string
  status: 'published' | 'draft' | 'reviewing' | 'rejected'
  tags: string[]
  category: string
  isLiked?: boolean
  isFavorited?: boolean
}

export interface VideoComment {
  id: string
  videoId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  likeCount: number
  replyCount: number
  createdAt: string
  isLiked?: boolean
  replies?: VideoComment[]
}

export interface VideoChannel {
  id: string
  name: string
  description: string
  avatar: string
  cover: string
  followerCount: number
  videoCount: number
  totalViews: number
  isFollowing?: boolean
  isVerified: boolean
}

export const useVideoStore = defineStore('video', () => {
  const videos = ref<Video[]>([])
  const currentVideo = ref<Video | null>(null)
  const comments = ref<VideoComment[]>([])
  const channels = ref<VideoChannel[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const publishedVideos = computed(() => {
    return videos.value.filter(video => video.status === 'published')
  })

  const draftVideos = computed(() => {
    return videos.value.filter(video => video.status === 'draft')
  })

  const totalViews = computed(() => {
    return videos.value.reduce((total, video) => total + video.viewCount, 0)
  })

  const totalLikes = computed(() => {
    return videos.value.reduce((total, video) => total + video.likeCount, 0)
  })

  // 初始化视频数据
  function initializeVideos() {
    videos.value = [
      {
        id: 'video_001',
        title: '家族春节聚会',
        description: '2024年春节家族大聚会，四代同堂共庆新年',
        thumbnail: '/images/video-thumb-1.jpg',
        videoUrl: '/videos/family-spring-festival.mp4',
        duration: 180,
        viewCount: 2500,
        likeCount: 180,
        commentCount: 45,
        shareCount: 12,
        authorId: 'user_001',
        authorName: '张家长',
        authorAvatar: '👨‍🦳',
        publishedAt: '2024-02-10T10:00:00Z',
        status: 'published',
        tags: ['春节', '聚会', '家族'],
        category: '生活',
        isLiked: false,
        isFavorited: false
      },
      {
        id: 'video_002',
        title: '祖辈故事分享',
        description: '爷爷讲述家族历史和传统故事',
        thumbnail: '/images/video-thumb-2.jpg',
        videoUrl: '/videos/ancestor-stories.mp4',
        duration: 300,
        viewCount: 1800,
        likeCount: 150,
        commentCount: 32,
        shareCount: 8,
        authorId: 'user_002',
        authorName: '李奶奶',
        authorAvatar: '👵',
        publishedAt: '2024-01-25T15:30:00Z',
        status: 'published',
        tags: ['故事', '传统', '历史'],
        category: '文化',
        isLiked: true,
        isFavorited: true
      }
    ]

    channels.value = [
      {
        id: 'channel_001',
        name: '叶语家族频道',
        description: '分享家族故事，传承文化传统',
        avatar: '🍃',
        cover: '/images/channel-cover.jpg',
        followerCount: 1250,
        videoCount: 45,
        totalViews: 125000,
        isFollowing: false,
        isVerified: true
      }
    ]
  }

  // 获取视频列表
  async function fetchVideos(page = 1, limit = 20) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      // videos.value = response.data.videos
    } catch (err) {
      error.value = '获取视频列表失败'
      console.error('获取视频列表失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 获取视频详情
  async function fetchVideoDetail(videoId: string) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const video = videos.value.find(v => v.id === videoId)
      if (video) {
        currentVideo.value = video
        // 增加播放次数
        video.viewCount++
      }
    } catch (err) {
      error.value = '获取视频详情失败'
      console.error('获取视频详情失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 点赞视频
  async function likeVideo(videoId: string) {
    try {
      const video = videos.value.find(v => v.id === videoId)
      if (video) {
        if (video.isLiked) {
          video.likeCount--
          video.isLiked = false
        } else {
          video.likeCount++
          video.isLiked = true
        }
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '点赞失败'
      console.error('点赞失败:', err)
    }
  }

  // 收藏视频
  async function favoriteVideo(videoId: string) {
    try {
      const video = videos.value.find(v => v.id === videoId)
      if (video) {
        video.isFavorited = !video.isFavorited
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '收藏失败'
      console.error('收藏失败:', err)
    }
  }

  // 分享视频
  async function shareVideo(videoId: string) {
    try {
      const video = videos.value.find(v => v.id === videoId)
      if (video) {
        video.shareCount++
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      error.value = '分享失败'
      console.error('分享失败:', err)
    }
  }

  // 获取视频评论
  async function fetchVideoComments(videoId: string) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // 模拟评论数据
      comments.value = [
        {
          id: 'comment_001',
          videoId,
          userId: 'user_003',
          userName: '王小明',
          userAvatar: '👦',
          content: '太温馨了，家族聚会真的很有意义！',
          likeCount: 15,
          replyCount: 3,
          createdAt: '2024-02-11T09:30:00Z',
          isLiked: false
        },
        {
          id: 'comment_002',
          videoId,
          userId: 'user_004',
          userName: '李小红',
          userAvatar: '👧',
          content: '看到这个视频想起了我们家的聚会，满满的回忆',
          likeCount: 8,
          replyCount: 1,
          createdAt: '2024-02-11T14:20:00Z',
          isLiked: true
        }
      ]
    } catch (err) {
      error.value = '获取评论失败'
      console.error('获取评论失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 添加评论
  async function addComment(videoId: string, content: string) {
    try {
      const newComment: VideoComment = {
        id: `comment_${Date.now()}`,
        videoId,
        userId: 'current_user',
        userName: '当前用户',
        userAvatar: '👤',
        content,
        likeCount: 0,
        replyCount: 0,
        createdAt: new Date().toISOString(),
        isLiked: false
      }

      comments.value.unshift(newComment)

      // 更新视频评论数
      const video = videos.value.find(v => v.id === videoId)
      if (video) {
        video.commentCount++
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (err) {
      error.value = '发表评论失败'
      console.error('发表评论失败:', err)
    }
  }

  // 点赞评论
  async function likeComment(commentId: string) {
    try {
      const comment = comments.value.find(c => c.id === commentId)
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

  // 关注频道
  async function followChannel(channelId: string) {
    try {
      const channel = channels.value.find(c => c.id === channelId)
      if (channel) {
        if (channel.isFollowing) {
          channel.followerCount--
          channel.isFollowing = false
        } else {
          channel.followerCount++
          channel.isFollowing = true
        }
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (err) {
      error.value = '关注失败'
      console.error('关注失败:', err)
    }
  }

  // 搜索视频
  async function searchVideos(query: string, page = 1, limit = 20) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // 模拟搜索结果
      const filteredVideos = videos.value.filter(video =>
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.description.toLowerCase().includes(query.toLowerCase()) ||
        video.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )

      return {
        videos: filteredVideos.slice((page - 1) * limit, page * limit),
        total: filteredVideos.length
      }
    } catch (err) {
      error.value = '搜索失败'
      console.error('搜索失败:', err)
      return { videos: [], total: 0 }
    } finally {
      isLoading.value = false
    }
  }

  // 上传视频
  async function uploadVideo(videoData: Omit<Video, 'id' | 'viewCount' | 'likeCount' | 'commentCount' | 'shareCount' | 'publishedAt'>) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟上传过程
      await new Promise(resolve => setTimeout(resolve, 3000))

      const newVideo: Video = {
        ...videoData,
        id: `video_${Date.now()}`,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        publishedAt: new Date().toISOString(),
        isLiked: false,
        isFavorited: false
      }

      videos.value.unshift(newVideo)
      return newVideo
    } catch (err) {
      error.value = '上传视频失败'
      console.error('上传视频失败:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    videos,
    currentVideo,
    comments,
    channels,
    isLoading,
    error,

    // 计算属性
    publishedVideos,
    draftVideos,
    totalViews,
    totalLikes,

    // 方法
    initializeVideos,
    fetchVideos,
    fetchVideoDetail,
    likeVideo,
    favoriteVideo,
    shareVideo,
    fetchVideoComments,
    addComment,
    likeComment,
    followChannel,
    searchVideos,
    uploadVideo
  }
})
