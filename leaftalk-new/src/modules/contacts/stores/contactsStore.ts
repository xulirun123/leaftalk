import { defineStore } from 'pinia'

export interface Contact {
  id: string
  name: string
  nickname?: string
  username?: string
  avatar?: string
  phone?: string
  email?: string
  status?: 'online' | 'offline' | 'away'
  lastSeen?: number
  isBlocked?: boolean
  isFriend?: boolean
  addedTime?: number
  remark?: string
}

// 从localStorage加载联系人数据
const loadContactsFromStorage = (): Contact[] => {
  try {
    const stored = localStorage.getItem('yeyu_contacts')
    if (stored) {
      const contacts = JSON.parse(stored)
      console.log('📱 从localStorage加载联系人数据:', contacts.length, '个联系人')
      return contacts
    }
  } catch (error) {
    console.error('加载联系人数据失败:', error)
  }

  // 返回真正的空联系人列表，用户需要通过添加好友来建立联系人
  return []
}

export const useContactStore = defineStore('contact', {
  state: () => ({
    contacts: loadContactsFromStorage(),
    currentContact: null as Contact | null,
    searchQuery: '',
    isLoading: false
  }),

  actions: {
    // 保存联系人到localStorage
    saveContactsToStorage() {
      try {
        localStorage.setItem('yeyu_contacts', JSON.stringify(this.contacts))
        console.log('💾 联系人数据已保存到localStorage')
      } catch (error) {
        console.error('保存联系人数据失败:', error)
      }
    },

    // 添加联系人
    addContact(contact: Contact) {
      const existingIndex = this.contacts.findIndex(c => c.id === contact.id)
      if (existingIndex >= 0) {
        // 更新现有联系人
        this.contacts[existingIndex] = { ...this.contacts[existingIndex], ...contact }
        console.log('📱 更新联系人:', contact.name)
      } else {
        // 添加新联系人
        this.contacts.unshift(contact)
        console.log('📱 添加新联系人:', contact.name)
      }
      this.saveContactsToStorage()
    },

    // 删除联系人
    removeContact(contactId: string) {
      const index = this.contacts.findIndex(c => c.id === contactId)
      if (index >= 0) {
        const contact = this.contacts[index]
        this.contacts.splice(index, 1)
        console.log('📱 删除联系人:', contact.name)
        this.saveContactsToStorage()
      }
    },

    // 更新联系人信息
    updateContact(contactId: string, updates: Partial<Contact>) {
      const contact = this.contacts.find(c => c.id === contactId)
      if (contact) {
        Object.assign(contact, updates)
        console.log('📱 更新联系人信息:', contact.name)
        this.saveContactsToStorage()
      }
    },

    // 设置当前联系人
    setCurrentContact(contact: Contact | null) {
      this.currentContact = contact
    },

    // 搜索联系人
    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    // 获取联系人
    getContact(contactId: string): Contact | undefined {
      return this.contacts.find(c => c.id === contactId)
    },

    // 检查是否为好友
    isFriend(contactId: string): boolean {
      const contact = this.getContact(contactId)
      return contact?.isFriend === true
    },

    // 拉黑联系人
    blockContact(contactId: string) {
      this.updateContact(contactId, { isBlocked: true })
    },

    // 取消拉黑
    unblockContact(contactId: string) {
      this.updateContact(contactId, { isBlocked: false })
    }
  },

  getters: {
    // 好友列表
    friends: (state) => state.contacts.filter(c => c.isFriend && !c.isBlocked),
    
    // 被拉黑的联系人
    blockedContacts: (state) => state.contacts.filter(c => c.isBlocked),
    
    // 搜索结果
    searchResults: (state) => {
      if (!state.searchQuery) return state.contacts
      
      const query = state.searchQuery.toLowerCase()
      return state.contacts.filter(contact => 
        contact.name.toLowerCase().includes(query) ||
        contact.nickname?.toLowerCase().includes(query) ||
        contact.username?.toLowerCase().includes(query)
      )
    },
    
    // 在线好友
    onlineFriends: (state) => state.contacts.filter(c => 
      c.isFriend && !c.isBlocked && c.status === 'online'
    ),
    
    // 联系人总数
    totalContacts: (state) => state.contacts.length,
    
    // 好友总数
    totalFriends: (state) => state.contacts.filter(c => c.isFriend && !c.isBlocked).length
  }
})
