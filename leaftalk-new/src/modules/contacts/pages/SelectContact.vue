<template>
  <div class="select-contact">
    <!-- 顶部导航 -->
    <MobileTopBar title="选择联系人" :show-back="true" />

    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass" width="16" style="color: #999;"></iconify-icon>
        <input 
          v-model="searchText" 
          type="text" 
          placeholder="搜索联系人" 
          class="search-input"
        />
      </div>
    </div>

    <!-- 联系人列表 -->
    <div class="contacts-list">
      <div
        v-for="(contact, index) in filteredContacts"
        :key="contact.id"
        class="contact-item-wrapper"
      >
        <!-- 分隔线 -->
        <div v-if="index > 0" class="contact-separator"></div>
        
        <div
          class="contact-item"
          @click="selectContact(contact)"
        >
          <div class="contact-avatar">
            <img
              v-if="contact.avatar"
              :src="contact.avatar"
              :alt="contact.name"
              class="avatar-image"
            />
            <div v-else class="avatar-card">
              <span class="avatar-text">{{ getAvatarText(contact.name) }}</span>
            </div>
          </div>
          <span class="contact-name">{{ contact.name }}</span>
          <div class="contact-action">
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <iconify-icon icon="heroicons:arrow-path" width="32" style="color: #07C160; animation: spin 1s linear infinite;"></iconify-icon>
      <p>正在加载联系人...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredContacts.length === 0" class="empty-state">
      <iconify-icon icon="heroicons:user-group" width="64" style="color: #cccccc;"></iconify-icon>
      <p>{{ searchText ? '未找到匹配的联系人' : '暂无联系人' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { contactsApi } from '../../services/contactsApi'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const searchText = ref('')

// 联系人数据
const contacts = ref([])
const loading = ref(true)

// 过滤联系人
const filteredContacts = computed(() => {
  if (!searchText.value.trim()) {
    return contacts.value
  }
  
  return contacts.value.filter(contact =>
    contact.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 加载联系人数据
const loadContacts = async () => {
  try {
    loading.value = true
    console.log('📱 开始加载联系人数据...')

    const response = await contactsApi.getContacts()
    if (response.success && response.data) {
      contacts.value = response.data.map((contact: any) => ({
        id: contact.id,
        name: contact.nickname || contact.name,
        avatar: contact.avatar,
        phone: contact.phone,
        yeyuId: contact.yeyuId
      }))
      console.log('✅ 联系人加载成功:', contacts.value.length, '个')
    } else {
      console.error('❌ 联系人加载失败:', response.message)
    }
  } catch (error) {
    console.error('❌ 联系人加载异常:', error)
  } finally {
    loading.value = false
  }
}

// 方法
const getAvatarText = (name: string) => {
  return name.charAt(0)
}

const selectContact = (contact: any) => {
  console.log('选择联系人:', contact)
  
  // 获取来源信息
  const from = route.query.from as string
  const chatId = route.query.chatId as string
  
  if (from === 'chat' && chatId) {
    // 发送名片到聊天
    sendContactCard(contact, chatId)
  } else {
    // 其他用途，比如查看联系人资料
    router.push(`/friend-profile/${contact.id}`)
  }
}

const sendContactCard = (contact: any, chatId: string) => {
  // 创建名片消息并保存到localStorage
  const cardMessage = {
    id: Date.now().toString(),
    senderId: 'current_user', // 当前用户ID
    senderName: '我',
    senderAvatar: '',
    content: `[名片] ${contact.name}`,
    type: 'card',
    timestamp: Date.now(),
    cardInfo: {
      contactId: contact.id,
      contactName: contact.name,
      contactAvatar: contact.avatar
    }
  }
  
  // 获取现有聊天记录
  const storageKey = `leaftalk_chat_${chatId}`
  const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]')
  
  // 添加新消息
  existingMessages.push(cardMessage)
  
  // 保存回localStorage
  localStorage.setItem(storageKey, JSON.stringify(existingMessages))
  
  console.log('名片已发送:', cardMessage)
  
  // 返回聊天页面
  router.push(`/chat/${chatId}`)
}

onMounted(() => {
  console.log('联系人选择页面加载完成')
  loadContacts()
})
</script>

<style scoped>
.select-contact {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.search-section {
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 16px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.contacts-list {
  flex: 1;
  background: white;
  overflow-y: auto;
}

.contact-item-wrapper {
  width: 100%;
}

.contact-separator {
  height: 1px;
  background: #e5e5e5;
  margin: 0 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background: #f8f8f8;
}

.contact-item:active {
  background: #f0f0f0;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  margin-right: 12px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-card {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  font-size: 16px;
}

.avatar-text {
  user-select: none;
}

.contact-name {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.contact-action {
  margin-left: 8px;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px;
  background: white;
}

.loading-state p {
  margin: 0;
  color: #07C160;
  font-size: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px;
  background: white;
}

.loading-state p {
  margin: 0;
  color: #07C160;
  font-size: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px;
  background: white;
}

.empty-state p {
  margin: 0;
  color: #999;
  font-size: 16px;
}
</style>
