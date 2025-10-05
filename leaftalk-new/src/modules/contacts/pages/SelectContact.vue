<template>
  <div class="select-contact">

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

        <div
          class="contact-item"
          :class="{ disabled: isDisabled(contact) }"
          @click="isMultiMode ? toggleSelect(contact) : selectContact(contact)"
        >
          <template v-if="isMultiMode">
            <span class="select-circle" :class="{ active: selectedIds.includes(contact.id), disabled: isDisabled(contact) }"></span>
          </template>
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
          <div class="contact-action" v-if="!isMultiMode">
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

    <!-- 字母索引 -->
    <div class="letter-index" v-if="!loading && filteredContacts.length > 0">
      <div
        v-for="letter in alphabet"
        :key="letter"
        class="index-item"
        @click="scrollToLetter(letter)"
      >
        {{ letter }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { contactsApi } from '../services/contactsApi'
import { getRealAvatarUrl } from '../../../shared/utils/avatar'
import { useAppStore } from '../../../shared/stores/appStore'
import { callManager } from '../../call'



const router = useRouter()
const route = useRoute()

// 响应式数据
const searchText = ref('')

// 多选模式
const isMultiMode = computed(() => (route.query.mode as string) === 'multi' && (route.query.from as string) === 'callInvite')
const maxSelect = computed(() => parseInt(route.query.max as string) || 7)
const selectedIds = ref<string[]>([])

// 联系人数据
const contacts = ref([])
const loading = ref(true)

// 全局状态与事件总线
const appStore = useAppStore()
const eventBus = inject('eventBus') as any

// 禁用选择：已在通话中的联系人、自己
const disabledIds = computed(() => {
  const ids = new Set<string>()
  const me = appStore.user?.id
  if (me) ids.add(String(me))
  const current = (callManager as any)?.currentCall?.value
  if (current?.targetUserId) ids.add(String(current.targetUserId))
  if (Array.isArray(current?.participants)) {
    try { current.participants.forEach((p: any) => ids.add(String(p.id))) } catch {}
  }
  return ids
})
const isDisabled = (c: any) => disabledIds.value.has(String(c.id))

// 过滤联系人
const filteredContacts = computed(() => {
  const list = (contacts.value || []) as any[]
  if (!searchText.value.trim()) return list
  return list.filter((c: any) => (c.name || '').toLowerCase().includes(searchText.value.toLowerCase()))
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
        avatar: getRealAvatarUrl(contact.id),
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
const getAvatarText = (name: string) => name.charAt(0)

const toggleSelect = (contact: any) => {
  if (isDisabled(contact)) return
  const idx = selectedIds.value.indexOf(contact.id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    if (selectedIds.value.length >= maxSelect.value) return
    selectedIds.value.push(contact.id)
  }
}

const selectContact = (contact: any) => {
  if (isMultiMode.value) {
    toggleSelect(contact)
    return
  }
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

const confirmInvite = () => {
  const userIds = selectedIds.value.slice(0, maxSelect.value)
  const callId = route.query.callId as string
  sessionStorage.setItem('call_invite_selection', JSON.stringify({ callId, userIds }))
  // 关闭覆盖层标记并返回通话页
  callManager.setInviteOverlayActive(false)
  router.push({ path: '/call', query: { action: 'active' } })
}

// 通话结束时，自动关闭选择联系人页
const handleCallEndedFromSelect = () => {
  try {
    callManager.setInviteOverlayActive(false)
    if ((route.name as any) === 'SelectContact') {
      router.replace('/contacts')
    }
  } catch {}
}

const handleTopBarConfirm = () => {
  if (!isMultiMode.value) return
  if (selectedIds.value.length === 0) return
  confirmInvite()
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
  const storageKey = `leaftalk_chat_${chatId}`
  const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]')
  existingMessages.push(cardMessage)
  localStorage.setItem(storageKey, JSON.stringify(existingMessages))
  router.push(`/chat/${chatId}`)
}

onMounted(() => {
  loadContacts()
  if (eventBus) {
    eventBus.on('selectContact:confirm', handleTopBarConfirm)
  }
  // 监听通话结束，自动关闭本页
  callManager.on('call:ended' as any, handleCallEndedFromSelect as any)
})

onUnmounted(() => {
  // 防止后退或异常情况下残留覆盖层标记
  callManager.setInviteOverlayActive(false)
  if (eventBus) {
    eventBus.off('selectContact:confirm', handleTopBarConfirm)
  }
  callManager.off('call:ended' as any, handleCallEndedFromSelect as any)
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
  background: #ffffff;
  height: 42px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #EDEDED;
  margin-top: 0; /* 与顶部导航栏间距为0 */
}

.search-box {
  display: flex;
  align-items: center;
  background: #E5E5E5;
  height: 30px;
  border-radius: 6px;
  padding: 0 12px;
  gap: 8px;
  width: 100%; /* 左右适配屏幕宽度 */
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 16px;
  color: #333;
  height: 30px;
  line-height: 30px;
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
  height: 48px;
  padding: 0 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #EDEDED;
}
.contact-item.disabled {
  pointer-events: none;
  opacity: 0.6;
  cursor: default;
}

.contact-item:hover {
  background: #f8f8f8;
}

.contact-item:active {
  background: #f0f0f0;
}

.contact-avatar {
  width: 36px;
  height: 36px;
  margin-right: 12px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  object-fit: cover;
}

.avatar-card {
  width: 100%;
  height: 100%;
  border-radius: 2px;
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

/* 多选底部栏 */
.multi-footer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #ffffff;
  border-top: 1px solid #eee;
}
.counter { color: #666; font-size: 14px; }
.confirm-btn {
  background: #07C160;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
}
.confirm-btn:disabled { opacity: .5; }

.select-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #CCCCCC;
  margin-right: 12px;
}
.select-circle.active {
  background: #07C160;
  border-color: #07C160;
}
.select-circle.disabled {
  border-color: #E0E0E0;
  background: #F5F5F5;
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
