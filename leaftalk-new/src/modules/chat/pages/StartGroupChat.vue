<template>
  <div class="start-group-chat">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="20" style="color: #333;"></iconify-icon>
      </button>
      <h1>发起群聊</h1>
      <button class="confirm-btn" @click="createGroup" :disabled="selectedContacts.length === 0">
        完成({{ selectedContacts.length }})
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass" width="16" style="color: #999;"></iconify-icon>
        <input
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索联系人"
          class="search-input"
        />
      </div>
    </div>

    <!-- 已选择的联系人 -->
    <div v-if="selectedContacts.length > 0" class="selected-contacts">
      <div class="selected-list">
        <div 
          v-for="contact in selectedContacts" 
          :key="contact.id"
          class="selected-item"
          @click="removeContact(contact.id)"
        >
          <img :src="contact.avatar" :alt="contact.name" class="selected-avatar" />
          <span class="selected-name">{{ contact.name }}</span>
          <iconify-icon icon="heroicons:x-mark" width="12" class="remove-icon" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>

    <!-- 联系人列表 -->
    <div class="contacts-list">
      <div 
        v-for="contact in filteredContacts" 
        :key="contact.id"
        class="contact-item"
        @click="toggleContact(contact)"
      >
        <div class="contact-checkbox">
          <div 
            class="checkbox" 
            :class="{ checked: isSelected(contact.id) }"
          >
            <WeChatIcon v-if="isSelected(contact.id)" name="check" :size="12" />
          </div>
        </div>
        
        <img :src="contact.avatar" :alt="contact.name" class="contact-avatar" />
        
        <div class="contact-info">
          <h3 class="contact-name">{{ contact.name }}</h3>
          <p class="contact-status">{{ contact.status || '在线' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const selectedContacts = ref<any[]>([])

// 模拟联系人数据
const contacts = ref([
  {
    id: 'user1',
    name: '张三',
    avatar: 'https://picsum.photos/48/48?random=1',
    status: '在线'
  },
  {
    id: 'user2',
    name: '李四',
    avatar: 'https://picsum.photos/48/48?random=2',
    status: '忙碌'
  },
  {
    id: 'user3',
    name: '王五',
    avatar: 'https://picsum.photos/48/48?random=3',
    status: '离开'
  },
  {
    id: 'user4',
    name: '赵六',
    avatar: 'https://picsum.photos/48/48?random=4',
    status: '在线'
  },
  {
    id: 'user5',
    name: '钱七',
    avatar: 'https://picsum.photos/48/48?random=5',
    status: '在线'
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

// 方法
const goBack = () => {
  console.log('🔙 发起群聊页面返回')

  // 检查是否有历史记录
  if (window.history.length > 1) {
    router.back()
  } else {
    // 如果没有历史记录，跳转到通讯录页面
    router.push('/contacts')
  }
}

const toggleContact = (contact: any) => {
  const index = selectedContacts.value.findIndex(c => c.id === contact.id)
  if (index > -1) {
    selectedContacts.value.splice(index, 1)
  } else {
    selectedContacts.value.push(contact)
  }
}

const removeContact = (contactId: string) => {
  const index = selectedContacts.value.findIndex(c => c.id === contactId)
  if (index > -1) {
    selectedContacts.value.splice(index, 1)
  }
}

const isSelected = (contactId: string) => {
  return selectedContacts.value.some(c => c.id === contactId)
}

const createGroup = () => {
  if (selectedContacts.value.length === 0) return

  // 创建群聊逻辑
  const groupId = 'group_' + Date.now()
  const memberNames = selectedContacts.value.slice(0, 3).map(m => m.name).join('、')
  const defaultGroupName = `${memberNames}${selectedContacts.value.length > 3 ? '等' : ''}的群聊`

  // 创建群聊对象
  const newGroup = {
    id: groupId,
    name: defaultGroupName,
    members: selectedContacts.value,
    avatar: selectedContacts.value[0]?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=group',
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

  // 显示成功消息并返回通讯录
  alert(`群聊 "${defaultGroupName}" 创建成功！请在通讯录-我的群组中查看。`)
  router.push('/contacts')
}
</script>

<style scoped>
.start-group-chat {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.back-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.confirm-btn {
  padding: 8px 16px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.search-section {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
}

.selected-contacts {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f0f0f0;
  border-radius: 16px;
  cursor: pointer;
}

.selected-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.selected-name {
  font-size: 12px;
  color: #333;
}

.remove-icon {
  color: #999;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background: #f5f5f5;
}

.contact-checkbox {
  margin-right: 12px;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background: #07C160;
  border-color: #07C160;
  color: white;
}

.contact-avatar {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  margin-right: 12px;
}

.contact-info {
  flex: 1;
}

.contact-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.contact-status {
  margin: 0;
  font-size: 12px;
  color: #999;
}
</style>
