import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MomentItem {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  images?: string[]
  video?: string
  location?: string
  timestamp: number
  likes: string[]
  comments: Comment[]
  isPrivate?: boolean
  visibleTo?: string[]
}

export interface Comment {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
  replyTo?: string
}

export interface VideoChannelItem {
  id: string
  userId: string
  userName: string
  userAvatar: string
  title: string
  description: string
  videoUrl: string
  coverImage: string
  duration: number
  viewCount: number
  likeCount: number
  timestamp: number
  tags: string[]
}

export const useMomentsStore = defineStore('moments', () => {
  // 从localStorage获取当前用户信息
  const getCurrentUserInfo = () => {
    try {
      const userInfo = localStorage.getItem('yeyu_user_info')
      if (userInfo) {
        const user = JSON.parse(userInfo)
        return {
          id: user.id || 'current-user',
          name: user.name || '我',
          avatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=current'
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
    return {
      id: 'current-user',
      name: '我',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current'
    }
  }

  // 当前用户信息
  const currentUser = ref(getCurrentUserInfo())

  // 更新当前用户信息
  const updateCurrentUser = () => {
    currentUser.value = getCurrentUserInfo()
  }

  // 朋友圈数据 - 从localStorage加载
  const moments = ref<MomentItem[]>([])
  // 我的朋友圈数据 - 从localStorage加载
  const myMoments = ref<MomentItem[]>([])

  // 视频号数据 - 从localStorage加载
  const videoChannels = ref<VideoChannelItem[]>([])

  // 我的视频号数据 - 从localStorage加载
  const myVideoChannels = ref<VideoChannelItem[]>([])

  // 好友信息 - 从localStorage加载
  const friends = ref([])

  // 加载朋友圈数据
  const loadMomentsData = () => {
    try {
      const momentsData = localStorage.getItem('moments_list')
      if (momentsData) {
        const allMomentsData = JSON.parse(momentsData)
        console.log('📋 加载朋友圈数据:', allMomentsData.length, '条')

        // 分离我的朋友圈和好友的朋友圈
        const currentUserId = currentUser.value.id
        myMoments.value = allMomentsData.filter((m: any) => m.userId === currentUserId)
        moments.value = allMomentsData.filter((m: any) => m.userId !== currentUserId)

        console.log('📋 我的朋友圈:', myMoments.value.length, '条')
        console.log('📋 好友朋友圈:', moments.value.length, '条')
      } else {
        console.log('📭 没有朋友圈数据')
      }
    } catch (error) {
      console.error('❌ 加载朋友圈数据失败:', error)
    }
  }

  // 计算属性
  const allMoments = computed(() => [...myMoments.value, ...moments.value].sort((a, b) => b.timestamp - a.timestamp))
  const allVideoChannels = computed(() => [...myVideoChannels.value, ...videoChannels.value].sort((a, b) => b.timestamp - a.timestamp))

  // 获取我的朋友圈
  const getMyMoments = () => {
    return myMoments.value
  }

  // 获取用户的朋友圈（包括自己和好友）
  const getUserMoments = (userId: string) => {
    console.log('🔍 获取用户朋友圈:', userId)
    // 如果是当前用户，返回我的朋友圈
    if (userId === currentUser.value.id) {
      console.log('📋 返回我的朋友圈数量:', myMoments.value.length)
      return myMoments.value
    }
    // 否则返回好友的朋友圈
    const userMoments = moments.value.filter(moment => moment.userId === userId)
    console.log('📋 返回好友朋友圈数量:', userMoments.length)
    return userMoments
  }

  // 获取好友的朋友圈
  const getFriendMoments = (userId: string) => {
    return moments.value.filter(moment => moment.userId === userId)
  }

  // 获取好友的视频号
  const getFriendVideoChannels = (userId: string) => {
    return videoChannels.value.filter(video => video.userId === userId)
  }

  // 点赞朋友圈
  const likeMoment = (momentId: string) => {
    const moment = [...moments.value, ...myMoments.value].find(m => m.id === momentId)
    if (moment) {
      const userIndex = moment.likes.indexOf(currentUser.value.id)
      if (userIndex > -1) {
        moment.likes.splice(userIndex, 1)
      } else {
        moment.likes.push(currentUser.value.id)
      }
      // 保存到localStorage
      saveMomentsData()
    }
  }

  // 添加评论
  const addComment = (momentId: string, comment: any) => {
    const moment = [...moments.value, ...myMoments.value].find(m => m.id === momentId)
    if (moment) {
      if (!moment.comments) {
        moment.comments = []
      }
      moment.comments.push(comment)
      // 保存到localStorage
      saveMomentsData()
    }
  }

  // 删除评论
  const deleteComment = (momentId: string, commentId: string) => {
    const moment = [...moments.value, ...myMoments.value].find(m => m.id === momentId)
    if (moment && moment.comments) {
      moment.comments = moment.comments.filter((c: any) => c.id !== commentId)
      // 保存到localStorage
      saveMomentsData()
    }
  }

  // 删除朋友圈
  const deleteMoment = (momentId: string) => {
    // 从我的朋友圈中删除
    myMoments.value = myMoments.value.filter(m => m.id !== momentId)
    // 从好友朋友圈中删除
    moments.value = moments.value.filter(m => m.id !== momentId)
    // 保存到localStorage
    saveMomentsData()
  }

  // 保存朋友圈数据到localStorage
  const saveMomentsData = () => {
    try {
      const allMomentsData = [...myMoments.value, ...moments.value]
      localStorage.setItem('moments_list', JSON.stringify(allMomentsData))
      console.log('💾 朋友圈数据已保存')
    } catch (error) {
      console.error('❌ 保存朋友圈数据失败:', error)
    }
  }

  // 评论朋友圈
  const commentMoment = (momentId: string, content: string) => {
    const moment = [...moments.value, ...myMoments.value].find(m => m.id === momentId)
    if (moment) {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: currentUser.value.id,
        userName: currentUser.value.name,
        content,
        timestamp: Date.now()
      }
      moment.comments.push(comment)
    }
  }

  // 发布朋友圈
  const publishMoment = (content: string, images?: string[], location?: string) => {
    const newMoment: MomentItem = {
      id: Date.now().toString(),
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      userAvatar: currentUser.value.avatar,
      content,
      images,
      location,
      timestamp: Date.now(),
      likes: [],
      comments: []
    }
    myMoments.value.unshift(newMoment)
  }

  // 发布视频号
  const publishVideo = (title: string, description: string, videoUrl: string, coverImage: string, duration: number, tags: string[]) => {
    const newVideo: VideoChannelItem = {
      id: Date.now().toString(),
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      userAvatar: currentUser.value.avatar,
      title,
      description,
      videoUrl,
      coverImage,
      duration,
      viewCount: 0,
      likeCount: 0,
      timestamp: Date.now(),
      tags
    }
    myVideoChannels.value.unshift(newVideo)
  }

  return {
    currentUser,
    moments,
    myMoments,
    videoChannels,
    myVideoChannels,
    friends,
    allMoments,
    allVideoChannels,
    loadMomentsData,
    getMyMoments,
    getUserMoments,
    getFriendMoments,
    getFriendVideoChannels,
    likeMoment,
    addComment,
    deleteComment,
    deleteMoment,
    saveMomentsData,
    commentMoment,
    publishMoment,
    publishVideo,
    updateCurrentUser
  }
})
