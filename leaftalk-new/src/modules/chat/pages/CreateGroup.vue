<template>
  <div class="create-group-page">
    <!-- 搜索框 -->
    <div class="search-container">
      <iconify-icon icon="heroicons:magnifying-glass" width="16" class="search-icon"></iconify-icon>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索"
        class="search-input"
      />
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
import { contactsApi } from '../../contacts/services/contactsApi'
import pinyin from 'pinyin'

const router = useRouter()
const chatStore = useChatStore()
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

// 跳转到面对面建群
const goToFaceToFace = () => {
  router.push('/face-to-face-add')
}

// 获取当前用户信息
const getCurrentUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      return {
        id: user.id || 'current-user',
        name: user.name || '当前用户',
        username: user.username || 'current'
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
  return {
    id: 'current-user',
    name: '当前用户',
    username: 'current'
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

const createGroup = () => {
  if (!canCreate.value) return

  // 生成默认群聊名称
  const memberNames = selectedMembers.value.slice(0, 3).map(m => m.name).join('、')
  const defaultGroupName = `${memberNames}${selectedMembers.value.length > 3 ? '等' : ''}的群聊`

  // 生成群聊ID和头像
  const groupId = 'group_' + Date.now()

  // 创建群聊对象
  const newGroup = {
    id: groupId,
    name: defaultGroupName,
    members: [
      getCurrentUserInfo(), // 当前用户
      ...selectedMembers.value
    ],
    avatar: generateGroupAvatar(),
    createdAt: Date.now(),
    type: 'group'
  }

  console.log('创建群聊:', newGroup)

  // 保存群聊到localStorage（群组数据，不是聊天列表）
  try {
    const existingGroups = JSON.parse(localStorage.getItem('leaftalk_groups') || '[]')
    existingGroups.push(newGroup)
    localStorage.setItem('leaftalk_groups', JSON.stringify(existingGroups))
    console.log('✅ 群聊已保存到群组列表:', newGroup)
  } catch (error) {
    console.error('❌ 保存群聊失败:', error)
  }

  // 显示成功消息
  alert(`群聊 "${defaultGroupName}" 创建成功！请在通讯录-我的群组中查看。`)

  // 返回通讯录页面
  router.push('/contacts')
}

// 生成群聊头像（简单版本）
const generateGroupAvatar = () => {
  // 使用第一个成员的头像作为群聊头像
  const firstMember = selectedMembers.value[0]
  return firstMember?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=group'
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

/* 搜索框 */
.search-container {
  position: fixed;
  top: 65px; /* 状态栏25px + 导航栏40px，与顶部导航栏间距为0 */
  left: 0;
  right: 0;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: white;
  z-index: 10;
  box-sizing: border-box;
}

.search-icon {
  color: #999;
  flex-shrink: 0;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  font-size: 14px;
  outline: none;
  background: transparent;
  height: 100%;
}

/* 面对面建群 */
.face-to-face-item {
  position: fixed;
  top: 107px; /* 65px + 36px + 6px */
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
  top: 143px; /* 65px + 36px + 6px + 36px */
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
