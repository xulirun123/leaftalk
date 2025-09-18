<template>
  <div class="create-group-page">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      title="发起群聊"
      :show-back="true"
      :right-buttons="topBarButtons"
      @back="goBack"
      @button-click="handleTopBarClick"
    />

    <!-- 移除群聊名称设置，创建后在群管理中设置 -->

    <!-- 选择成员 -->
    <div class="member-section">
      <div class="section-header">
        <h3>选择群成员</h3>
        <span class="member-count">已选择 {{ selectedMembers.length }} 人</span>
      </div>

      <!-- 已选成员 -->
      <div v-if="selectedMembers.length > 0" class="selected-members">
        <div 
          v-for="member in selectedMembers"
          :key="member.id"
          class="selected-member"
          @click="removeMember(member.id)"
        >
          <img :src="member.avatar" :alt="member.name" class="member-avatar" />
          <span class="member-name">{{ member.name }}</span>
          <iconify-icon icon="heroicons:x-mark" width="16" class="remove-icon"></iconify-icon>
        </div>
      </div>

      <!-- 联系人列表 -->
      <div class="contacts-list">
        <div class="search-bar">
          <iconify-icon icon="heroicons:magnifying-glass" width="20" class="search-icon"></iconify-icon>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索联系人"
            class="search-input"
          />
        </div>

        <div class="contact-list">
          <div 
            v-for="contact in filteredContacts"
            :key="contact.id"
            class="contact-item"
            :class="{ selected: isSelected(contact.id) }"
            @click="toggleMember(contact)"
          >
            <img :src="contact.avatar" :alt="contact.name" class="contact-avatar" />
            <div class="contact-info">
              <div class="contact-name">{{ contact.name }}</div>
              <div class="contact-status">{{ contact.status || '在线' }}</div>
            </div>
            <div class="select-indicator">
              <iconify-icon 
                v-if="isSelected(contact.id)"
                icon="heroicons:check-circle" 
                width="24" 
                style="color: #07C160;"
              ></iconify-icon>
              <div v-else class="select-circle"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移除底部创建按钮，已移到顶部导航栏 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'
import { useChatStore } from '../stores/chatStore'
import { contactAPI } from '../../contacts/services/api'

const router = useRouter()
const chatStore = useChatStore()

// 返回上一页
const goBack = () => {
  router.back()
}

// 响应式数据
const searchQuery = ref('')
const selectedMembers = ref([])
const contacts = ref([])
const loading = ref(false)

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

    const response = await contactAPI.getContacts()

    if (response.data && response.data.success) {
      const apiContacts = response.data.data || []

      // 转换API数据格式并排除当前用户
      const formattedContacts = apiContacts
        .filter((contact: any) => contact.id !== currentUser.id)
        .map((contact: any) => ({
          id: contact.id,
          name: contact.name || contact.nickname || contact.username || '未知用户',
          avatar: contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name || contact.id}`,
          status: '在线',
          username: contact.username || contact.yeyuId
        }))

      contacts.value = formattedContacts
      console.log('✅ 联系人列表加载成功:', contacts.value.length, '个联系人')

    } else {
      console.warn('⚠️ API返回失败，使用备用数据')
      // 使用备用数据
      contacts.value = generateFallbackContacts(currentUser)
    }
  } catch (error) {
    console.error('❌ 获取联系人列表失败:', error)
    // 使用备用数据
    contacts.value = generateFallbackContacts(currentUser)
  } finally {
    loading.value = false
  }
}

// 生成备用联系人数据
const generateFallbackContacts = (currentUser: any) => {
  const fallbackUsers = [
    {
      id: 'test001',
      name: '测试用户1',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser1',
      status: '在线',
      username: 'testuser1'
    },
    {
      id: 'test002',
      name: '测试用户2',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser2',
      status: '在线',
      username: 'testuser2'
    },
    {
      id: 'test003',
      name: '测试用户3',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser3',
      status: '在线',
      username: 'testuser3'
    }
  ]

  // 过滤掉当前登录用户
  return fallbackUsers.filter(user => user.id !== currentUser.id)
}

// contacts已在上面定义

// 顶部导航栏按钮
const topBarButtons = computed(() => [
  {
    text: '完成',
    action: 'create',
    disabled: !canCreate.value
  }
])

// 计算属性
const filteredContacts = computed(() => {
  if (!searchQuery.value) {
    return contacts.value
  }
  return contacts.value.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const canCreate = computed(() => {
  return selectedMembers.value.length >= 2
})

// 方法
const handleTopBarClick = (action: string) => {
  console.log('Top bar action:', action)
  if (action === 'create') {
    createGroup()
  }
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding-top: 80px;
}

.form-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.form-item {
  margin-bottom: 24px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-item label {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
}

.form-input:focus {
  border-color: #07C160;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}



.member-section {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.member-count {
  font-size: 14px;
  color: #07C160;
}

.selected-members {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-member {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 16px;
  padding: 4px 8px 4px 4px;
  gap: 6px;
  cursor: pointer;
}

.member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.member-name {
  font-size: 14px;
  color: #333;
}

.remove-icon {
  color: #999;
}

.contacts-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
}

.search-icon {
  color: #999;
}

.search-input {
  flex: 1;
  border: none;
  font-size: 16px;
  outline: none;
}

.contact-list {
  flex: 1;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  gap: 12px;
}

.contact-item:hover {
  background: #f8f8f8;
}

.contact-item.selected {
  background: #f0f9ff;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.contact-status {
  font-size: 12px;
  color: #999;
}

.select-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-circle {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e5e5;
  border-radius: 50%;
}

.create-section {
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.create-btn {
  width: 100%;
  padding: 16px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.create-btn:not(:disabled):hover {
  background: #06a552;
}
</style>
