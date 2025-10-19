<template>
  <div class="create-group-page">
    <!-- 使用全局 MobileTopBar -->
    <MobileTopBar
      title="发起群聊"
      :showBack="true"
      :rightButtons="rightButtons"
      @back="goBack"
      @buttonClick="handleButtonClick"
    />

    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-box">
        <!-- 已选择的联系人头像 -->
        <div v-if="selectedMembers.length > 0" class="selected-avatars">
          <img
            v-for="member in selectedMembers"
            :key="member.id"
            :src="member.avatar"
            :alt="member.name"
            class="selected-avatar"
          />
        </div>

        <!-- 搜索输入框（无图标） -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索"
          class="search-input"
        />
      </div>
    </div>

    <!-- 面对面建群 -->
    <div class="face-to-face-item" @click="goToFaceToFace">
      <iconify-icon icon="heroicons:user-group" width="20" class="face-icon"></iconify-icon>
      <span class="face-text">面对面建群</span>
      <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
    </div>

    <!-- 联系人列表 -->
    <div class="contact-list" ref="contactListRef">
      <template v-for="(group, index) in groupedContacts" :key="group.letter">
        <!-- 字母分类项 -->
        <div class="letter-header" :data-letter="group.letter">
          {{ group.letter }}
        </div>

        <!-- 该字母下的联系人 -->
        <div
          v-for="contact in group.contacts"
          :key="contact.id"
          class="contact-item"
          :class="{ selected: isSelected(contact.id) }"
          @click="toggleMember(contact)"
        >
          <!-- 选择圆圈 -->
          <div class="select-indicator">
            <div v-if="isSelected(contact.id)" class="select-circle selected">
              <iconify-icon icon="heroicons:check" width="12" style="color: white;"></iconify-icon>
            </div>
            <div v-else class="select-circle"></div>
          </div>

          <!-- 头像 -->
          <img :src="contact.avatar" :alt="contact.name" class="contact-avatar" />

          <!-- 联系人信息 -->
          <div class="contact-info">
            <div class="contact-name">{{ contact.name }}</div>
          </div>
        </div>
      </template>
    </div>

    <!-- 字母索引 -->
    <div class="letter-index">
      <div
        v-if="hasStarred"
        class="index-item"
        @click="scrollToLetter('★')"
      >
        <iconify-icon icon="heroicons:star-solid" width="12" style="color: #666;"></iconify-icon>
      </div>
      <div
        v-for="letter in alphabet"
        :key="letter"
        class="index-item"
        @click="scrollToLetter(letter)"
      >
        {{ letter }}
      </div>
      <div class="index-item" @click="scrollToLetter('#')">#</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/shared/stores/appStore'
import { contactsApi } from '../../contacts/services/contactsApi'
import { GroupAvatarGenerator } from '@/shared/utils/groupAvatarGenerator'
import MobileTopBar from '@/shared/components/mobile/MobileTopBar.vue'
import pinyin from 'pinyin'

const router = useRouter()
const chatStore = useChatStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const eventBus = inject('eventBus')

// 响应式数据
const searchQuery = ref('')
const selectedMembers = ref([])
const contacts = ref([])
const loading = ref(false)
const contactListRef = ref(null)

// 字母表
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// 是否有星标朋友
const hasStarred = computed(() => {
  return contacts.value.some((c: any) => c.isStarred)
})

// 顶部导航栏右侧按钮
const rightButtons = computed(() => {
  const count = selectedMembers.value.length
  return [{
    text: count > 0 ? `完成(${count})` : '完成',
    action: 'confirm',
    disabled: !canCreate.value
  }]
})

// 返回上一页
const goBack = () => {
  console.log('🔙 发起群聊页面返回')
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/contacts')
  }
}

// 处理顶部导航栏按钮点击
const handleButtonClick = (button: any) => {
  if (button.action === 'confirm') {
    createGroup()
  }
}

// 跳转到面对面建群
const goToFaceToFace = () => {
  router.push('/face-to-face-add')
}

// 获取当前用户信息
const getCurrentUserInfo = () => {
  try {
    // 尝试多个可能的存储键名
    const keys = ['yeyu_user_info', 'yeyu_user', 'user', 'user_info']
    for (const key of keys) {
      const userInfo = localStorage.getItem(key)
      if (userInfo) {
        const user = JSON.parse(userInfo)
        if (user.id) {
          return {
            id: user.id.toString(),
            name: user.nickname || user.name || user.username || '当前用户',
            username: user.username || user.yeyu_id || 'current',
            avatar: user.avatar
          }
        }
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }

  // 如果都没有找到，返回默认值
  console.warn('⚠️ 未找到用户信息，使用默认值')
  return {
    id: 'user_' + Date.now(),
    name: '当前用户',
    username: 'current',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current'
  }
}

// 从API加载真实的联系人列表
const loadContacts = async () => {
  const currentUser = getCurrentUserInfo()
  console.log('👤 当前登录用户:', currentUser)

  try {
    loading.value = true
    console.log('🔄 从API获取联系人列表...')

    const response = await contactsApi.getContacts()
    console.log('📦 API响应:', response)

    if (response.success && response.data) {
      const apiContacts = response.data || []
      console.log('📋 原始联系人数据:', apiContacts)

      // 转换API数据格式并排除当前用户
      const formattedContacts = apiContacts
        .filter((contact: any) => contact.id !== currentUser.id)
        .map((contact: any) => ({
          id: contact.id,
          name: contact.remark || contact.nickname || contact.name || contact.username || '未知用户',
          avatar: contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name || contact.id}`,
          status: '在线',
          username: contact.username || contact.yeyu_id,
          isStarred: contact.is_starred || false
        }))

      contacts.value = formattedContacts
      console.log('✅ 联系人列表加载成功:', contacts.value.length, '个联系人')
      console.log('✅ 格式化后的联系人:', formattedContacts)

    } else {
      console.warn('⚠️ API返回失败，联系人列表为空')
      console.warn('⚠️ 响应数据:', response)
      contacts.value = []
    }
  } catch (error) {
    console.error('❌ 获取联系人列表失败:', error)
    contacts.value = []
  } finally {
    loading.value = false
  }
}

// 获取拼音首字母
const getPinyinFirstLetter = (name: string): string => {
  if (!name) return '#'

  try {
    const pinyinArray = pinyin(name, {
      style: pinyin.STYLE_FIRST_LETTER
    })

    if (pinyinArray && pinyinArray.length > 0 && pinyinArray[0].length > 0) {
      const firstLetter = pinyinArray[0][0].toUpperCase()
      // 检查是否是A-Z
      if (/^[A-Z]$/.test(firstLetter)) {
        return firstLetter
      }
    }
  } catch (error) {
    console.error('获取拼音失败:', error)
  }

  return '#'
}

// 分组联系人
const groupedContacts = computed(() => {
  const contactsToGroup = searchQuery.value
    ? contacts.value.filter((contact: any) =>
        contact.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    : contacts.value

  // 按字母分组
  const groups: Record<string, any[]> = {}

  // 星标朋友
  if (hasStarred.value) {
    groups['★'] = []
  }

  // A-Z
  alphabet.forEach(letter => {
    groups[letter] = []
  })

  // 其他
  groups['#'] = []

  // 分配联系人到各组
  contactsToGroup.forEach((contact: any) => {
    if (contact.isStarred) {
      groups['★'].push(contact)
    } else {
      const letter = getPinyinFirstLetter(contact.name)
      if (groups[letter]) {
        groups[letter].push(contact)
      } else {
        groups['#'].push(contact)
      }
    }
  })

  // 转换为数组并过滤空组
  const result = []

  if (hasStarred.value && groups['★'].length > 0) {
    result.push({ letter: '★', contacts: groups['★'] })
  }

  alphabet.forEach(letter => {
    if (groups[letter].length > 0) {
      result.push({ letter, contacts: groups[letter] })
    }
  })

  if (groups['#'].length > 0) {
    result.push({ letter: '#', contacts: groups['#'] })
  }

  return result
})

const canCreate = computed(() => {
  return selectedMembers.value.length >= 2
})

// 滚动到指定字母
const scrollToLetter = (letter: string) => {
  if (!contactListRef.value) return

  const letterHeader = contactListRef.value.querySelector(`[data-letter="${letter}"]`)
  if (letterHeader) {
    letterHeader.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 方法
const handleTopBarClick = (action: string) => {
  console.log('Top bar action:', action)
  if (action === 'create') {
    createGroup()
  }
}

// 监听事件总线
if (eventBus) {
  eventBus.on('createGroup:confirm', () => {
    createGroup()
  })
}



const isSelected = (contactId: string) => {
  return selectedMembers.value.some(member => member.id === contactId)
}

const toggleMember = (contact: any) => {
  const index = selectedMembers.value.findIndex(member => member.id === contact.id)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    selectedMembers.value.push(contact)
  }
}

const removeMember = (contactId: string) => {
  const index = selectedMembers.value.findIndex(member => member.id === contactId)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  }
}

const createGroup = async () => {
  if (!canCreate.value) return

  try {
    // 1️⃣ 生成群聊ID
    const groupId = 'group_' + Date.now()
    console.log('📝 生成群聊ID:', groupId)

    // 2️⃣ 获取当前用户信息
    const currentUser = getCurrentUserInfo()
    console.log('👤 当前用户:', currentUser)

    // 3️⃣ 生成群聊名称
    const memberNames = selectedMembers.value.slice(0, 3).map(m => m.name).join('、')
    const groupName = `${memberNames}${selectedMembers.value.length > 3 ? '等' : ''}的群聊`
    console.log('📛 群聊名称:', groupName)

    // 4️⃣ 生成群聊头像（异步操作）
    const groupAvatar = await generateGroupAvatar()
    console.log('🖼️ 群聊头像生成完成')

    // 5️⃣ 构建成员列表（包括当前用户）
    const members = [
      {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      ...selectedMembers.value
    ]
    console.log('👥 成员列表:', members)

    // 6️⃣ 调用后端API创建群聊
    console.log('📡 调用后端API创建群聊...')
    const response = await fetch('http://localhost:8893/api/groups/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        id: groupId,
        name: groupName,
        title: groupName,
        avatar: groupAvatar,
        creatorId: currentUser.id,
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          avatar: m.avatar
        }))
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '创建群聊失败')
    }

    const result = await response.json()
    console.log('✅ 后端创建群聊成功:', result)

    // 7️⃣ 创建本地聊天会话对象
    const participantIds = members.map(m => m.id)
    const chatSession = {
      id: groupId,
      type: 'group',
      name: groupName,
      avatar: groupAvatar,
      participants: participantIds,
      lastMessage: '你创建了群聊',
      lastMessageTime: Date.now(),
      unreadCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false
    }
    console.log('✅ 本地聊天会话对象:', chatSession)

    // 8️⃣ 保存到 chatStore
    if (chatStore && chatStore.sessions) {
      chatStore.sessions.unshift(chatSession)
      console.log('✅ 已添加到 chatStore.sessions')

      if (typeof chatStore.saveToCache === 'function') {
        chatStore.saveToCache()
        console.log('✅ 已保存到 chatStore 缓存')
      }
    }

    // 9️⃣ 保存到 localStorage（备份）
    try {
      const existingChats = JSON.parse(localStorage.getItem('leaftalk_chats') || '[]')
      existingChats.unshift(chatSession)
      localStorage.setItem('leaftalk_chats', JSON.stringify(existingChats))
      console.log('✅ 已保存到 localStorage')
    } catch (error) {
      console.error('⚠️ 保存到 localStorage 失败:', error)
    }

    // 🔟 跳转到群聊页面
    console.log('🚀 跳转到群聊页面:', `/group/${groupId}`)
    router.push(`/group/${groupId}`)

  } catch (error) {
    console.error('❌ 创建群聊失败:', error)
    appStore.showToast(error instanceof Error ? error.message : '创建群聊失败', 'error')
  }
}

// 生成群聊头像（组合成员头像）
const generateGroupAvatar = async () => {
  try {
    // 获取当前用户信息
    const currentUser = getCurrentUserInfo()

    // 构建成员列表（包括当前用户）
    const members = [
      {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        joinTime: Date.now()
      },
      ...selectedMembers.value.map((m: any) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        joinTime: Date.now()
      }))
    ]

    console.log('🎨 生成群聊头像，成员数:', members.length)

    // 使用 GroupAvatarGenerator 生成组合头像
    const groupAvatar = await GroupAvatarGenerator.generateGroupAvatar(members, {
      size: 36,
      backgroundColor: '#f0f0f0',
      borderColor: '#ffffff',
      borderWidth: 0
    })

    console.log('✅ 群聊头像生成成功')
    return groupAvatar
  } catch (error) {
    console.error('❌ 生成群聊头像失败:', error)
    // 返回默认头像
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=group'
  }
}

// 组件挂载时加载联系人
onMounted(() => {
  loadContacts()
})
</script>

<style scoped>
.create-group-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: white;
  position: relative;
}

/* 搜索框容器 */
.search-container {
  position: fixed;
  top: 65px; /* 状态栏25px + 导航栏40px = 65px，间距为0 */
  left: 0;
  right: 0;
  height: 42px; /* 容器高度42px */
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: white;
  z-index: 10;
  box-sizing: border-box;
}

/* 搜索框 */
.search-box {
  flex: 1;
  height: 30px; /* 搜索框高度30px */
  background: #F5F5F5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 6px;
}

/* 已选择的联系人头像 */
.selected-avatars {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.selected-avatar {
  width: 24px;
  height: 24px;
  border-radius: 2px; /* 方形，轻微圆角 */
  object-fit: cover;
}

.search-input {
  flex: 1;
  border: none;
  font-size: 14px;
  outline: none;
  background: transparent;
  height: 100%;
  min-width: 60px;
  padding-left: 8px;
}

/* 面对面建群 */
.face-to-face-item {
  position: fixed;
  top: 107px; /* 65px + 42px */
  left: 0;
  right: 0;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: white;
  border-top: 1px solid #E5E5E5;
  border-bottom: 1px solid #E5E5E5;
  cursor: pointer;
  z-index: 9;
  box-sizing: border-box;
}

.face-to-face-item:active {
  background: #f5f5f5;
}

.face-icon {
  color: #07C160;
  margin-right: 12px;
}

.face-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.arrow-icon {
  color: #999;
}

/* 联系人列表 */
.contact-list {
  position: fixed;
  top: 143px; /* 65px + 42px + 36px */
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding-right: 24px; /* 为字母索引留出空间 */
  box-sizing: border-box;
}

/* 字母分类项 */
.letter-header {
  height: 25px;
  line-height: 25px;
  padding-left: 16px;
  background: #f5f5f5;
  font-size: 13px;
  color: #999;
  font-weight: 500;
}

/* 联系人项 */
.contact-item {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  gap: 8px;
}

.contact-item:active {
  background: #f5f5f5;
}

/* 选择圆圈 */
.select-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.select-circle {
  width: 18px;
  height: 18px;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.select-circle.selected {
  background: #07C160;
  border-color: #07C160;
}

/* 头像 */
.contact-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
}

/* 联系人信息 */
.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 字母索引 */
.letter-index {
  position: fixed;
  right: 4px;
  top: calc(50% + 70px); /* 往下移动70px */
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 100;
}

.index-item {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
  cursor: pointer;
  user-select: none;
}

.index-item:active {
  color: #07C160;
}
</style>
