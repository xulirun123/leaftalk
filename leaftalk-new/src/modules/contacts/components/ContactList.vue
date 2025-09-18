<template>
  <div class="contact-list">
    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索联系人"
        class="search-input"
      />
    </div>
    
    <!-- 联系人列表 -->
    <div class="contacts-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <div>加载中...</div>
      </div>
      
      <div v-else-if="filteredContacts.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <div class="empty-text">
          {{ searchQuery ? '未找到匹配的联系人' : '暂无联系人' }}
        </div>
      </div>
      
      <div v-else class="contacts-list">
        <ContactCard
          v-for="contact in filteredContacts"
          :key="contact.id"
          :contact="contact"
          :show-chat-button="showChatButton"
          :show-call-button="showCallButton"
          @click="handleContactClick"
          @chat="handleChatClick"
          @call="handleCallClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ContactCard from './ContactCard.vue'

interface Contact {
  id: string
  name: string
  nickname?: string
  avatar?: string
  status?: string
  isOnline?: boolean
}

interface Props {
  contacts: Contact[]
  loading?: boolean
  showSearch?: boolean
  showChatButton?: boolean
  showCallButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showSearch: true,
  showChatButton: true,
  showCallButton: true
})

const emit = defineEmits<{
  contactClick: [contact: Contact]
  chatClick: [contact: Contact]
  callClick: [contact: Contact]
}>()

const searchQuery = ref('')

const filteredContacts = computed(() => {
  if (!searchQuery.value) {
    return props.contacts
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.contacts.filter(contact => 
    contact.name.toLowerCase().includes(query) ||
    contact.nickname?.toLowerCase().includes(query)
  )
})

const handleContactClick = (contact: Contact) => {
  emit('contactClick', contact)
}

const handleChatClick = (contact: Contact) => {
  emit('chatClick', contact)
}

const handleCallClick = (contact: Contact) => {
  emit('callClick', contact)
}
</script>

<style scoped>
.contact-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-container {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #E5E5E5;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 16px;
  background-color: #F7F7F7;
}

.search-input:focus {
  outline: none;
  border-color: #07C160;
  background-color: white;
}

.contacts-container {
  flex: 1;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999999;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
}

.contacts-list {
  padding: 8px 0;
}

.contacts-list > * {
  margin-bottom: 1px;
}
</style>
