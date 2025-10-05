import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Contact {
  id: string
  name: string
  nickname?: string
  avatar: string
  phone?: string
  email?: string
  yeyuId: string
  status: 'online' | 'offline' | 'busy' | 'away'
  lastSeen?: string
  isBlocked: boolean
  isFriend: boolean
  isFamily: boolean
  relationship?: string
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ContactGroup {
  id: string
  name: string
  description?: string
  memberCount: number
  members: string[]
  createdAt: string
  updatedAt: string
}

export interface FriendRequest {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  toUserId: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}

export const useContactStore = defineStore('contact', () => {
  const contacts = ref<Contact[]>([])
  const groups = ref<ContactGroup[]>([])
  const friendRequests = ref<FriendRequest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const friends = computed(() => {
    return contacts.value.filter(contact => contact.isFriend && !contact.isBlocked)
  })

  const family = computed(() => {
    return contacts.value.filter(contact => contact.isFamily && !contact.isBlocked)
  })

  const blockedContacts = computed(() => {
    return contacts.value.filter(contact => contact.isBlocked)
  })

  const onlineContacts = computed(() => {
    return contacts.value.filter(contact => 
      contact.status === 'online' && !contact.isBlocked
    )
  })

  const pendingRequests = computed(() => {
    return friendRequests.value.filter(request => request.status === 'pending')
  })

  // 初始化联系人数据
  function initializeContacts() {
    contacts.value = [
      {
        id: 'contact_001',
        name: '张三',
        nickname: '小张',
        avatar: '👨',
        phone: '13800138001',
        yeyuId: 'zhangsan001',
        status: 'online',
        isBlocked: false,
        isFriend: true,
        isFamily: true,
        relationship: '堂兄',
        tags: ['家族', '朋友'],
        notes: '张家堂兄，在北京工作',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-10T15:30:00Z'
      },
      {
        id: 'contact_002',
        name: '李四',
        nickname: '小李',
        avatar: '👩',
        phone: '13800138002',
        yeyuId: 'lisi002',
        status: 'offline',
        lastSeen: '2024-02-10T12:00:00Z',
        isBlocked: false,
        isFriend: true,
        isFamily: false,
        tags: ['朋友', '同事'],
        notes: '大学同学，现在是同事',
        createdAt: '2024-01-20T14:00:00Z',
        updatedAt: '2024-02-09T09:15:00Z'
      },
      {
        id: 'contact_003',
        name: '王五',
        avatar: '👨‍🦳',
        yeyuId: 'wangwu003',
        status: 'busy',
        isBlocked: false,
        isFriend: true,
        isFamily: true,
        relationship: '叔叔',
        tags: ['家族', '长辈'],
        notes: '王家叔叔，退休教师',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-02-08T16:45:00Z'
      }
    ]

    groups.value = [
      {
        id: 'group_001',
        name: '张家大家庭',
        description: '张家所有成员的群组',
        memberCount: 15,
        members: ['contact_001', 'contact_003'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-02-10T10:00:00Z'
      },
      {
        id: 'group_002',
        name: '大学同学',
        description: '大学时期的同学群',
        memberCount: 8,
        members: ['contact_002'],
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-02-05T14:30:00Z'
      }
    ]

    friendRequests.value = [
      {
        id: 'request_001',
        fromUserId: 'user_004',
        fromUserName: '赵六',
        fromUserAvatar: '👦',
        toUserId: 'current_user',
        message: '你好，我是通过叶语号找到你的，希望能成为朋友',
        status: 'pending',
        createdAt: '2024-02-10T09:00:00Z',
        updatedAt: '2024-02-10T09:00:00Z'
      }
    ]
  }

  // 获取联系人列表
  async function fetchContacts() {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      // contacts.value = response.data.contacts
    } catch (err) {
      error.value = '获取联系人失败'
      console.error('获取联系人失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 搜索联系人
  async function searchContacts(query: string): Promise<Contact[]> {
    if (!query.trim()) return []

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))

      const lowerQuery = query.toLowerCase()
      return contacts.value.filter(contact =>
        contact.name.toLowerCase().includes(lowerQuery) ||
        contact.nickname?.toLowerCase().includes(lowerQuery) ||
        contact.yeyuId.toLowerCase().includes(lowerQuery) ||
        contact.phone?.includes(query)
      )
    } catch (err) {
      error.value = '搜索联系人失败'
      console.error('搜索联系人失败:', err)
      return []
    }
  }

  // 添加好友
  async function addFriend(userId: string, message: string = '') {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800))

      const request: FriendRequest = {
        id: `request_${Date.now()}`,
        fromUserId: 'current_user',
        fromUserName: '当前用户',
        fromUserAvatar: '👤',
        toUserId: userId,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      friendRequests.value.push(request)
      return true
    } catch (err) {
      error.value = '发送好友请求失败'
      console.error('发送好友请求失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 处理好友请求
  async function handleFriendRequest(requestId: string, action: 'accept' | 'reject') {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const request = friendRequests.value.find(r => r.id === requestId)
      if (request) {
        request.status = action === 'accept' ? 'accepted' : 'rejected'
        request.updatedAt = new Date().toISOString()

        if (action === 'accept') {
          // 添加到联系人列表
          const newContact: Contact = {
            id: `contact_${Date.now()}`,
            name: request.fromUserName,
            avatar: request.fromUserAvatar,
            yeyuId: `user_${request.fromUserId}`,
            status: 'offline',
            isBlocked: false,
            isFriend: true,
            isFamily: false,
            tags: ['朋友'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          contacts.value.push(newContact)
        }
      }

      return true
    } catch (err) {
      error.value = '处理好友请求失败'
      console.error('处理好友请求失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 删除好友
  async function deleteFriend(contactId: string) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 400))

      const contact = contacts.value.find(c => c.id === contactId)
      if (contact) {
        contact.isFriend = false
        contact.updatedAt = new Date().toISOString()
      }

      return true
    } catch (err) {
      error.value = '删除好友失败'
      console.error('删除好友失败:', err)
      return false
    }
  }

  // 拉黑联系人
  async function blockContact(contactId: string) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))

      const contact = contacts.value.find(c => c.id === contactId)
      if (contact) {
        contact.isBlocked = true
        contact.updatedAt = new Date().toISOString()
      }

      return true
    } catch (err) {
      error.value = '拉黑联系人失败'
      console.error('拉黑联系人失败:', err)
      return false
    }
  }

  // 取消拉黑
  async function unblockContact(contactId: string) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))

      const contact = contacts.value.find(c => c.id === contactId)
      if (contact) {
        contact.isBlocked = false
        contact.updatedAt = new Date().toISOString()
      }

      return true
    } catch (err) {
      error.value = '取消拉黑失败'
      console.error('取消拉黑失败:', err)
      return false
    }
  }

  // 更新联系人信息
  async function updateContact(contactId: string, updates: Partial<Contact>) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 400))

      const contact = contacts.value.find(c => c.id === contactId)
      if (contact) {
        Object.assign(contact, updates, { updatedAt: new Date().toISOString() })
      }

      return true
    } catch (err) {
      error.value = '更新联系人信息失败'
      console.error('更新联系人信息失败:', err)
      return false
    }
  }

  // 创建联系人分组
  async function createGroup(name: string, description?: string, memberIds: string[] = []) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 600))

      const group: ContactGroup = {
        id: `group_${Date.now()}`,
        name,
        description,
        memberCount: memberIds.length,
        members: memberIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      groups.value.push(group)
      return group
    } catch (err) {
      error.value = '创建分组失败'
      console.error('创建分组失败:', err)
      return null
    }
  }

  // 获取联系人详情
  function getContactById(contactId: string): Contact | null {
    return contacts.value.find(c => c.id === contactId) || null
  }

  // 根据叶语号查找联系人
  function getContactByYeyuId(yeyuId: string): Contact | null {
    return contacts.value.find(c => c.yeyuId === yeyuId) || null
  }

  return {
    // 状态
    contacts,
    groups,
    friendRequests,
    isLoading,
    error,

    // 计算属性
    friends,
    family,
    blockedContacts,
    onlineContacts,
    pendingRequests,

    // 方法
    initializeContacts,
    fetchContacts,
    searchContacts,
    addFriend,
    handleFriendRequest,
    deleteFriend,
    blockContact,
    unblockContact,
    updateContact,
    createGroup,
    getContactById,
    getContactByYeyuId
  }
})
