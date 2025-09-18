<template>
  <div class="new-friends">
    <div class="content">
      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-bar">
          <iconify-icon icon="heroicons:magnifying-glass" width="18"></iconify-icon>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索"
            @keydown.enter="searchFriend"
          />
          <button v-if="searchQuery" @click="searchFriend" class="search-btn">搜索</button>
        </div>
      </div>

      <!-- 手机联系人入口 -->
      <div class="phone-contacts-section">
        <div class="phone-contacts-entry" @click="goToPhoneContacts">
          <div class="entry-icon">
            <iconify-icon icon="heroicons:device-phone-mobile" width="20"></iconify-icon>
          </div>
          <div class="entry-text">手机联系人</div>
          <div class="entry-arrow">
            <iconify-icon icon="heroicons:chevron-right" width="14"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 好友申请和我的申请 -->
      <div class="friend-requests">
        <!-- 收到的好友申请 -->
        <div v-if="friendRequests.length === 0 && myRequests.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:user-plus" width="48"></iconify-icon>
          <div>暂无好友申请</div>
        </div>

        <!-- 收到的申请 -->
        <div v-if="friendRequests.length > 0" class="request-list">
          <div class="request-section-title">收到的申请</div>
          <div v-for="request in friendRequests" :key="request.id" class="request-item">
            <div class="request-avatar" @click="viewUserProfile(request)">
              <img :src="request.avatar" :alt="request.name" />
            </div>
            <div class="request-info">
              <div class="request-name">{{ request.name }}</div>
              <div class="request-message">{{ request.message }}</div>
            </div>
            <div class="request-actions">
              <button v-if="request.status === 'pending'" @click="acceptRequest(request)" class="accept-btn">接受</button>
              <button v-if="request.status === 'pending'" @click="rejectRequest(request)" class="reject-btn">拒绝</button>
              <div v-else class="status-text">{{ request.status === 'accepted' ? '已接受' : '已拒绝' }}</div>
            </div>
          </div>
        </div>

        <!-- 我发送的申请 -->
        <div v-if="myRequests.length > 0" class="request-list">
          <div class="request-section-title">我发送的申请</div>
          <div v-for="request in myRequests" :key="request.id" class="request-item">
            <div class="request-avatar" @click="viewUserProfile(request)">
              <img :src="request.avatar" :alt="request.name" />
            </div>
            <div class="request-info">
              <div class="request-name">{{ request.name }}</div>
              <div class="request-message">{{ request.message }}</div>
            </div>
            <div class="request-status">
              <div class="status-text">
                {{ getMyRequestStatusText(request.status) }}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../../chat/stores/chatStore'
import { useAppStore } from '../../../shared/stores/appStore'
import { contactsApi } from '../services/contactsApi'

const router = useRouter()
const chatStore = useChatStore()
const appStore = useAppStore()

const searchQuery = ref('')

// 好友申请数据
const friendRequests = ref([]) // 收到的申请
const myRequests = ref([]) // 我发送的申请
const isLoadingRequests = ref(false)

// 加载好友请求
const loadFriendRequests = async () => {
  try {
    isLoadingRequests.value = true
    console.log('📋 加载好友请求列表...')

    const response = await contactsApi.getFriendRequests()
    console.log('🔍 好友请求API响应:', response)

    // 检查响应结构，适配不同的API响应格式
    let requestsData = []

    if (response && response.data) {
      // 如果response.data是数组，直接使用
      if (Array.isArray(response.data)) {
        requestsData = response.data
      }
      // 如果response.data.data是数组，使用嵌套的data
      else if (response.data.data && Array.isArray(response.data.data)) {
        requestsData = response.data.data
      }
      // 如果response.data.success存在且为true
      else if (response.data.success && response.data.data) {
        requestsData = response.data.data
      }
    }

    friendRequests.value = requestsData.map((request: any) => ({
      id: request.id,
      name: request.name,
      avatar: request.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.name}`,
      message: request.message || '请求添加您为好友',
      status: request.status,
      requestTime: new Date(request.created_at),
      source: 'search',
      from_user_id: request.from_user_id,
      yeyu_id: request.yeyu_id,
      phone: request.phone
    }))

    console.log('✅ 好友请求加载成功:', friendRequests.value.length, '个请求')
    console.log('📋 好友请求详细数据:', friendRequests.value)
  } catch (error) {
    console.error('❌ 加载好友请求失败:', error)
    appStore.showToast('加载好友请求失败', 'error')
  } finally {
    isLoadingRequests.value = false
  }
}

// 加载我发送的申请
const loadMyRequests = async () => {
  try {
    console.log('📋 加载我发送的申请...')

    const response = await contactsApi.getMyFriendRequests()
    console.log('🔍 我的申请API响应:', response)

    // 检查响应结构，适配不同的API响应格式
    let requestsData = []

    if (response && response.data) {
      // 如果response.data是数组，直接使用
      if (Array.isArray(response.data)) {
        requestsData = response.data
      }
      // 如果response.data.data是数组，使用嵌套的data
      else if (response.data.data && Array.isArray(response.data.data)) {
        requestsData = response.data.data
      }
      // 如果response.data.success存在且为true
      else if (response.data.success && response.data.data) {
        requestsData = response.data.data
      }
    }

    myRequests.value = requestsData.map((request: any) => ({
      id: request.id,
      name: request.name,
      avatar: request.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.name}`,
      message: request.message || '请求添加您为好友',
      status: request.status,
      requestTime: new Date(request.created_at),
      to_user_id: request.to_user_id,
      yeyu_id: request.yeyu_id,
      phone: request.phone
    }))

    console.log('✅ 我的申请加载成功:', myRequests.value.length, '个申请')
  } catch (error) {
    console.error('❌ 加载我的申请失败:', error)
    myRequests.value = []
  }
}

// 跳转到手机联系人页面
const goToPhoneContacts = () => {
  console.log('📱 跳转到手机联系人页面')
  router.push('/phone-contacts')
}

// 获取我的申请状态文本
const getMyRequestStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '等待验证'
    case 'accepted':
      return '已同意'
    case 'rejected':
      return '已拒绝'
    default:
      return '未知状态'
  }
}

// 推荐好友（暂时为空，后续可从后端API获取）
const suggestions = ref([])

// 手机通讯录好友（暂时为空，后续可从后端API获取）
const phoneContacts = ref([])

const acceptRequest = async (request: any) => {
  try {
    console.log('✅ 接受好友申请:', request.name, request.id)

    // 调用后端API处理好友申请
    const response = await api.contacts.handleFriendRequest(request.id, 'accept')
    console.log('🔍 接受好友申请API响应:', response)

    if (response && response.success) {
      // 更新UI状态
      request.status = 'accepted'
      console.log('✅ 好友申请已接受，后端处理成功')
      appStore.showToast(`已接受 ${request.name} 的好友申请`, 'success')

    } else {
      console.warn('⚠️ 后端处理失败:', response?.message)
      appStore.showToast('处理好友申请失败', 'error')
    }

  } catch (error) {
    console.error('❌ 接受好友申请失败:', error)
    appStore.showToast('接受好友申请失败', 'error')
  }
}

const rejectRequest = async (request: any) => {
  try {
    console.log('❌ 拒绝好友申请:', request.name, request.id)

    // 调用后端API处理好友申请
    const response = await api.contacts.handleFriendRequest(request.id, 'reject')
    console.log('🔍 拒绝好友申请API响应:', response)

    if (response && response.success) {
      // 更新UI状态
      request.status = 'rejected'
      console.log('❌ 好友申请已拒绝，后端处理成功')
      appStore.showToast(`已拒绝 ${request.name} 的好友申请`, 'info')

    } else {
      console.warn('⚠️ 后端处理失败:', response?.message)
      appStore.showToast('处理好友申请失败', 'error')
    }

  } catch (error) {
    console.error('❌ 拒绝好友申请失败:', error)
    appStore.showToast('拒绝好友申请失败', 'error')
  }
}

// 查看用户资料
const viewUserProfile = (request: any) => {
  console.log('👤 查看用户资料:', request.name, request)
  // TODO: 跳转到用户资料页面
  appStore.showToast(`查看 ${request.name} 的资料`, 'info')
}

// 搜索好友
const searchFriend = () => {
  if (!searchQuery.value.trim()) {
    appStore.showToast('请输入搜索内容', 'warning')
    return
  }

  appStore.showToast(`搜索：${searchQuery.value}`, 'info')
  // 这里应该调用搜索API
}

// 发送好友申请
const sendFriendRequest = (user: any) => {
  user.isRequested = true
  appStore.showToast(`已向 ${user.name} 发送好友申请`, 'success')
}

// 忽略推荐
const ignoreSuggestion = (suggestion: any) => {
  const index = suggestions.value.findIndex(s => s.id === suggestion.id)
  if (index > -1) {
    suggestions.value.splice(index, 1)
    appStore.showToast('已忽略该推荐', 'info')
  }
}

// 切换手机通讯录显示
const togglePhoneContacts = () => {
  showPhoneContacts.value = !showPhoneContacts.value
}

// 移除goBack方法，使用统一导航栏

// 组件挂载时加载好友请求
onMounted(() => {
  loadFriendRequests()
  loadMyRequests()
})
</script>

<style scoped>
.new-friends {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  overflow-y: auto;
  padding-top: 65px; /* 为固定的顶部导航栏留出空间 (25px状态栏 + 40px导航栏) */
}

.search-section {
  background: white;
  padding: 3px 16px;
  height: 36px;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  padding: 3px 12px;
  gap: 8px;
  transition: border-color 0.2s;
  height: 30px;
  width: 100%;
  flex: 1;
}

.search-bar:focus-within {
  border-color: #07C160;
  background: #ffffff;
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
}

/* 手机联系人区域 */
.phone-contacts-section {
  background: white;
  margin-top: 0;
}

.phone-contacts-entry {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 42px;
}

.phone-contacts-entry:hover {
  background: #f8f8f8;
}

.entry-icon {
  width: 36px;
  height: 36px;
  background: #07C160;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 12px;
}

.entry-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.entry-arrow {
  color: #999;
}
.friend-requests {
  background: white;
  margin-top: 8px;
}
.section-title {
  padding: 16px;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
}

.request-section-title {
  padding: 12px 16px 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #999;
  gap: 16px;
}
.request-list {
  padding: 0 16px;
}
.request-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
}
.request-avatar {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.request-avatar:hover {
  transform: scale(1.05);
}
.request-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.request-info {
  flex: 1;
}
.request-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}
.request-message {
  font-size: 14px;
  color: #666;
}
.request-actions {
  display: flex;
  gap: 8px;
}

.request-status {
  display: flex;
  align-items: center;
}
.accept-btn, .reject-btn {
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
}
.accept-btn {
  background: #07C160;
  color: white;
}
.reject-btn {
  background: #f5f5f5;
  color: #666;
}
.status-text {
  padding: 6px 16px;
  font-size: 14px;
  color: #999;
}

/* 搜索按钮样式 */
.search-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
}

/* 推荐好友样式 */
.suggestions-section,
.phone-contacts-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px 16px;
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.suggestion-list,
.phone-contacts-list {
  padding: 0 16px 16px 16px;
}

.suggestion-item,
.phone-contact-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item:last-child,
.phone-contact-item:last-child {
  border-bottom: none;
}

.suggestion-avatar,
.contact-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
}

.suggestion-avatar img,
.contact-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.suggestion-info,
.contact-info {
  flex: 1;
}

.suggestion-name,
.contact-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.suggestion-reason,
.contact-phone {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.mutual-friends {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.add-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

.add-btn:hover {
  background: #06a552;
}

.add-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.ignore-btn {
  background: #f0f0f0;
  color: #666;
  border: none;
  padding: 6px 8px;
  border-radius: 12px;
  cursor: pointer;
}

.ignore-btn:hover {
  background: #e0e0e0;
}

.phone-contacts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.phone-contacts-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #07C160;
}
</style>
