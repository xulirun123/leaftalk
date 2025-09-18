import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface PrivacySetting {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface MomentsPrivacy {
  visibility: 'public' | 'friends' | 'private'
  allowComments: boolean
  allowLikes: boolean
  hiddenFromUsers: string[]
  visibleToUsers: string[]
}

export const usePrivacyStore = defineStore('privacy', () => {
  // 状态
  const phoneVisibility = ref<'public' | 'friends' | 'private'>('friends')
  const avatarVisibility = ref<'public' | 'friends' | 'private'>('public')
  const momentsVisibility = ref<'public' | 'friends' | 'private'>('friends')
  const onlineStatusVisible = ref<boolean>(true)
  const allowFriendRequests = ref<boolean>(true)
  const allowGroupInvites = ref<boolean>(true)
  const dataCollection = ref<boolean>(false)
  const locationSharing = ref<boolean>(false)

  // 朋友圈隐私设置
  const momentsPrivacy = ref<MomentsPrivacy>({
    visibility: 'friends',
    allowComments: true,
    allowLikes: true,
    hiddenFromUsers: [],
    visibleToUsers: []
  })

  // 隐私设置列表
  const privacySettings = ref<PrivacySetting[]>([
    {
      id: 'phone_visibility',
      name: '手机号可见性',
      description: '控制谁可以看到您的手机号',
      enabled: true
    },
    {
      id: 'online_status',
      name: '在线状态',
      description: '是否显示在线状态给其他用户',
      enabled: true
    },
    {
      id: 'friend_requests',
      name: '好友请求',
      description: '是否允许接收好友请求',
      enabled: true
    },
    {
      id: 'group_invites',
      name: '群组邀请',
      description: '是否允许被邀请加入群组',
      enabled: true
    },
    {
      id: 'data_collection',
      name: '数据收集',
      description: '是否允许收集使用数据以改善服务',
      enabled: false
    },
    {
      id: 'location_sharing',
      name: '位置共享',
      description: '是否允许共享位置信息',
      enabled: false
    }
  ])

  // 方法
  const updatePhoneVisibility = (visibility: 'public' | 'friends' | 'private') => {
    phoneVisibility.value = visibility
    // 这里可以添加保存到API的逻辑
  }

  const updateAvatarVisibility = (visibility: 'public' | 'friends' | 'private') => {
    avatarVisibility.value = visibility
    // 这里可以添加保存到API的逻辑
  }

  const updateMomentsVisibility = (visibility: 'public' | 'friends' | 'private') => {
    momentsVisibility.value = visibility
    // 这里可以添加保存到API的逻辑
  }

  const toggleOnlineStatus = (visible: boolean) => {
    onlineStatusVisible.value = visible
    // 这里可以添加保存到API的逻辑
  }

  const toggleFriendRequests = (allow: boolean) => {
    allowFriendRequests.value = allow
    // 这里可以添加保存到API的逻辑
  }

  const toggleGroupInvites = (allow: boolean) => {
    allowGroupInvites.value = allow
    // 这里可以添加保存到API的逻辑
  }

  const toggleDataCollection = (allow: boolean) => {
    dataCollection.value = allow
    // 这里可以添加保存到API的逻辑
  }

  const toggleLocationSharing = (allow: boolean) => {
    locationSharing.value = allow
    // 这里可以添加保存到API的逻辑
  }

  const updateMomentsPrivacy = (privacy: Partial<MomentsPrivacy>) => {
    momentsPrivacy.value = { ...momentsPrivacy.value, ...privacy }
    // 这里可以添加保存到API的逻辑
  }

  const addHiddenUser = (userId: string) => {
    if (!momentsPrivacy.value.hiddenFromUsers.includes(userId)) {
      momentsPrivacy.value.hiddenFromUsers.push(userId)
    }
  }

  const removeHiddenUser = (userId: string) => {
    const index = momentsPrivacy.value.hiddenFromUsers.indexOf(userId)
    if (index > -1) {
      momentsPrivacy.value.hiddenFromUsers.splice(index, 1)
    }
  }

  const addVisibleUser = (userId: string) => {
    if (!momentsPrivacy.value.visibleToUsers.includes(userId)) {
      momentsPrivacy.value.visibleToUsers.push(userId)
    }
  }

  const removeVisibleUser = (userId: string) => {
    const index = momentsPrivacy.value.visibleToUsers.indexOf(userId)
    if (index > -1) {
      momentsPrivacy.value.visibleToUsers.splice(index, 1)
    }
  }

  const updatePrivacySetting = (settingId: string, enabled: boolean) => {
    const setting = privacySettings.value.find(s => s.id === settingId)
    if (setting) {
      setting.enabled = enabled
    }
  }

  return {
    // 状态
    phoneVisibility,
    avatarVisibility,
    momentsVisibility,
    onlineStatusVisible,
    allowFriendRequests,
    allowGroupInvites,
    dataCollection,
    locationSharing,
    momentsPrivacy,
    privacySettings,
    
    // 方法
    updatePhoneVisibility,
    updateAvatarVisibility,
    updateMomentsVisibility,
    toggleOnlineStatus,
    toggleFriendRequests,
    toggleGroupInvites,
    toggleDataCollection,
    toggleLocationSharing,
    updateMomentsPrivacy,
    addHiddenUser,
    removeHiddenUser,
    addVisibleUser,
    removeVisibleUser,
    updatePrivacySetting
  }
})
