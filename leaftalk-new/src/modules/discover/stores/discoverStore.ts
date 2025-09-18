import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FriendRequest {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  message: string
  timestamp: number
  status: 'pending' | 'accepted' | 'rejected'
}

export interface MomentsNotification {
  id: string
  type: 'like' | 'comment' | 'new_post'
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  content: string
  timestamp: number
  isRead: boolean
}

export interface VideoNotification {
  id: string
  type: 'new_video' | 'like' | 'comment'
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  content: string
  timestamp: number
  isRead: boolean
}

export const useDiscoverStore = defineStore('discover', () => {
  // 好友申请（从localStorage加载，默认为空）
  const friendRequests = ref<FriendRequest[]>([])

  // 朋友圈通知（从localStorage加载，默认为空）
  const momentsNotifications = ref<MomentsNotification[]>([])

  // 视频通知（从localStorage加载，默认为空）
  const videoNotifications = ref<VideoNotification[]>([])

  // 计算属性
  const pendingFriendRequests = computed(() => {
    return friendRequests.value.filter(req => req.status === 'pending')
  })

  const unreadMomentsCount = computed(() => {
    return momentsNotifications.value.filter(notif => !notif.isRead).length
  })

  const unreadVideoCount = computed(() => {
    return videoNotifications.value.filter(notif => !notif.isRead).length
  })

  const hasNewFriendRequests = computed(() => {
    return pendingFriendRequests.value.length > 0
  })

  const hasNewMoments = computed(() => {
    return momentsNotifications.value.some(notif => !notif.isRead && notif.type === 'new_post')
  })

  const hasNewVideos = computed(() => {
    return videoNotifications.value.some(notif => !notif.isRead && notif.type === 'new_video')
  })

  const hasMomentsInteractions = computed(() => {
    return momentsNotifications.value.some(notif => !notif.isRead && (notif.type === 'like' || notif.type === 'comment'))
  })

  // 发现页面是否有红点（新朋友申请、新朋友圈、新视频）
  const hasDiscoverRedDot = computed(() => {
    return hasNewFriendRequests.value || hasNewMoments.value || hasNewVideos.value
  })

  // 发现页面未读数（朋友圈互动）
  const discoverUnreadCount = computed(() => {
    return hasMomentsInteractions.value ? unreadMomentsCount.value : 0
  })

  // 方法
  const addFriendRequest = (request: Omit<FriendRequest, 'id'>) => {
    const newRequest: FriendRequest = {
      ...request,
      id: Date.now().toString()
    }
    friendRequests.value.unshift(newRequest)
    saveToStorage()
  }

  const acceptFriendRequest = (requestId: string) => {
    const request = friendRequests.value.find(req => req.id === requestId)
    if (request) {
      request.status = 'accepted'
      saveToStorage()
    }
  }

  const rejectFriendRequest = (requestId: string) => {
    const request = friendRequests.value.find(req => req.id === requestId)
    if (request) {
      request.status = 'rejected'
      saveToStorage()
    }
  }

  const markMomentsAsRead = (notificationId?: string) => {
    if (notificationId) {
      const notification = momentsNotifications.value.find(notif => notif.id === notificationId)
      if (notification) {
        notification.isRead = true
      }
    } else {
      // 标记所有为已读
      momentsNotifications.value.forEach(notif => {
        notif.isRead = true
      })
    }
    saveToStorage()
  }

  // 查看朋友圈时清零未读数
  const clearMomentsUnread = () => {
    momentsNotifications.value.forEach(notif => {
      // 清除所有类型的朋友圈通知：新发布、点赞、评论
      notif.isRead = true
    })
    saveToStorage()
    console.log('✅ 朋友圈未读数已清零')
  }

  const markVideoAsRead = (notificationId?: string) => {
    if (notificationId) {
      const notification = videoNotifications.value.find(notif => notif.id === notificationId)
      if (notification) {
        notification.isRead = true
      }
    } else {
      // 标记所有为已读
      videoNotifications.value.forEach(notif => {
        notif.isRead = true
      })
    }
    saveToStorage()
  }

  // 查看视频号时清零未读数
  const clearVideoUnread = () => {
    videoNotifications.value.forEach(notif => {
      if (notif.type === 'new_video') {
        notif.isRead = true
      }
    })
    saveToStorage()
    console.log('✅ 视频号未读数已清零')
  }

  // 保存到localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('yeyu_friend_requests', JSON.stringify(friendRequests.value))
      localStorage.setItem('yeyu_moments_notifications', JSON.stringify(momentsNotifications.value))
      localStorage.setItem('yeyu_video_notifications', JSON.stringify(videoNotifications.value))
    } catch (error) {
      console.error('保存发现数据失败:', error)
    }
  }

  // 从localStorage加载
  const loadFromStorage = () => {
    try {
      const savedRequests = localStorage.getItem('yeyu_friend_requests')
      if (savedRequests) {
        friendRequests.value = JSON.parse(savedRequests)
      }

      const savedMoments = localStorage.getItem('yeyu_moments_notifications')
      if (savedMoments) {
        momentsNotifications.value = JSON.parse(savedMoments)
      }

      const savedVideos = localStorage.getItem('yeyu_video_notifications')
      if (savedVideos) {
        videoNotifications.value = JSON.parse(savedVideos)
      }
    } catch (error) {
      console.error('加载发现数据失败:', error)
    }
  }

  // 初始化时加载数据
  loadFromStorage()

  return {
    friendRequests,
    momentsNotifications,
    videoNotifications,
    pendingFriendRequests,
    unreadMomentsCount,
    unreadVideoCount,
    hasNewFriendRequests,
    hasNewMoments,
    hasNewVideos,
    hasMomentsInteractions,
    hasDiscoverRedDot,
    discoverUnreadCount,
    addFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    markMomentsAsRead,
    markVideoAsRead,
    clearMomentsUnread,
    clearVideoUnread,
    saveToStorage,
    loadFromStorage
  }
})
