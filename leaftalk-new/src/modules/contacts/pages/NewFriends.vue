<template>
  <div class="new-friends">
    <div class="content">
      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-bar" @click="goToSearchFriend">
          <iconify-icon icon="heroicons:magnifying-glass" width="18"></iconify-icon>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索"
            readonly
            @click="goToSearchFriend"
          />
        </div>
      </div>

      <!-- 好友申请记录（收到的和发送的合并显示） -->
      <div class="friend-requests">
        <!-- 空状态 -->
        <div v-if="allRequests.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:user-plus" width="48"></iconify-icon>
          <div>暂无好友申请</div>
        </div>

        <!-- 所有申请记录 -->
        <div v-if="allRequests.length > 0" class="request-list">
          <div v-for="request in allRequests" :key="request.id" class="request-item" @click="viewUserProfile(request)">
            <div class="request-avatar">
              <img :src="request.avatar" :alt="request.name" />
            </div>
            <div class="request-info">
              <div class="request-name">{{ request.name }}</div>
              <div class="request-message">{{ request.message }}</div>
            </div>
            <div class="request-actions" @click.stop>
              <!-- 收到的申请：待处理时显示接受/拒绝按钮 -->
              <template v-if="request.type === 'received'">
                <button v-if="request.status === 'pending'" @click="acceptRequest(request)" class="accept-btn">接受</button>
                <button v-if="request.status === 'pending'" @click="rejectRequest(request)" class="reject-btn">拒绝</button>
                <!-- 已接受或已拒绝时显示箭头 -->
                <div v-else class="status-text-with-icon">
                  <iconify-icon icon="heroicons:arrow-down-left" width="14" class="arrow-received"></iconify-icon>
                  <span>{{ request.status === 'accepted' ? '已添加' : '已拒绝' }}</span>
                </div>
              </template>
              <!-- 我发送的申请：显示状态文本 -->
              <template v-else>
                <!-- pending 状态不显示箭头 -->
                <div v-if="request.status === 'pending'" class="status-text">
                  <span>已申请</span>
                </div>
                <!-- 已接受或已拒绝时显示箭头 -->
                <div v-else class="status-text-with-icon">
                  <iconify-icon icon="heroicons:arrow-up-right" width="14" class="arrow-sent"></iconify-icon>
                  <span>{{ request.status === 'accepted' ? '已添加' : '已拒绝' }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../../chat/stores/chatStore'
import { useAppStore } from '../../../shared/stores/appStore'
import { contactsApi } from '../services/contactsApi'

const router = useRouter()
const chatStore = useChatStore()
const appStore = useAppStore()

const searchQuery = ref('')

// 好友申请数据
const friendRequests = ref([]) // 收到的所有申请
const myRequests = ref([]) // 我发送的所有申请
const isLoadingRequests = ref(false)

// 合并所有申请记录（收到的和发送的）
const allRequests = computed(() => {
  const received = friendRequests.value.map(req => ({
    ...req,
    type: 'received' // 标记为收到的申请
  }))

  const sent = myRequests.value.map(req => ({
    ...req,
    type: 'sent' // 标记为发送的申请
  }))

  // 合并并按时间倒序排序
  const combined = [...received, ...sent]
  const sorted = combined.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // 去重：同一个用户只保留最新的一条记录
  const uniqueMap = new Map()
  sorted.forEach(req => {
    const userId = req.user_id
    if (!uniqueMap.has(userId)) {
      uniqueMap.set(userId, req)
    }
  })

  return Array.from(uniqueMap.values())
})

// 过滤好友请求记录：保留近3天或50个记录
const filterFriendRequests = (requests: any[]) => {
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  // 按时间倒序排序
  const sorted = requests.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // 获取近3天的记录
  const recentThreeDays = sorted.filter(req =>
    new Date(req.created_at) >= threeDaysAgo
  )

  // 如果近3天的记录超过50个，保留所有近3天的记录
  if (recentThreeDays.length > 50) {
    return recentThreeDays
  }

  // 如果近3天的记录不足50个，取前50个记录
  if (sorted.length <= 50) {
    return sorted
  }

  // 取前50个记录
  return sorted.slice(0, 50)
}

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

    // 过滤记录
    const filteredData = filterFriendRequests(requestsData)

    friendRequests.value = filteredData.map((request: any) => ({
      id: request.id,
      name: request.remark || request.nickname || request.name || '未知用户', // 备注优先，其次昵称
      nickname: request.nickname, // 保留原始昵称
      remark: request.remark, // 保留备注
      avatar: request.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.nickname || request.name}`,
      message: request.message || '请求添加您为好友',
      status: request.status,
      requestTime: new Date(request.created_at),
      created_at: request.created_at,
      source: 'search',
      from_user_id: request.from_user_id,
      user_id: request.user_id,
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

    // 过滤记录
    const filteredData = filterFriendRequests(requestsData)

    myRequests.value = filteredData.map((request: any) => ({
      id: request.id,
      name: request.remark || request.nickname || request.name || '未知用户', // 备注优先，其次昵称
      nickname: request.nickname, // 保留原始昵称
      remark: request.remark, // 保留备注
      avatar: request.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.nickname || request.name}`,
      message: request.message || '请求添加您为好友',
      status: request.status,
      requestTime: new Date(request.created_at),
      created_at: request.created_at,
      to_user_id: request.to_user_id,
      user_id: request.user_id,
      yeyu_id: request.yeyu_id,
      phone: request.phone
    }))

    console.log('✅ 我的申请加载成功:', myRequests.value.length, '个申请')
  } catch (error) {
    console.error('❌ 加载我的申请失败:', error)
    myRequests.value = []
  }
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
    const response = await contactsApi.acceptFriend(request.id)
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
    const response = await contactsApi.rejectFriend(request.id)
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

  // 跳转到好友资料页面
  const userId = request.user_id || request.from_user_id || request.to_user_id
  if (userId) {
    console.log('🔗 跳转到好友资料页面，用户ID:', userId)
    router.push(`/friend-profile/${userId}`)
  } else {
    console.error('❌ 无法获取用户ID:', request)
    appStore.showToast('无法查看用户资料', 'error')
  }
}

// 跳转到搜索好友页面
const goToSearchFriend = () => {
  console.log('🔍 跳转到搜索好友页面')
  router.push('/search-friend')
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
  transition: all 0.2s;
  height: 30px;
  width: 100%;
  flex: 1;
  cursor: pointer;
}

.search-bar:hover {
  background: #f0f0f0;
}

.search-bar:active {
  background: #e8e8e8;
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  cursor: pointer;
  color: #999;
}

.friend-requests {
  background: white;
  margin-top: 0;
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
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #E5E5E5;
}

.request-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  min-height: 60px;
  gap: 12px;
  background: white;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.request-item:hover {
  background-color: #f7f7f7;
}

.request-avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.request-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.request-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 36px;
  gap: 2px;
}

.request-name {
  font-size: 15px;
  font-weight: normal;
  color: #333;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-message {
  font-size: 12px;
  color: #999;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.request-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.request-status {
  display: flex;
  align-items: center;
}

.accept-btn, .reject-btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.accept-btn:hover, .reject-btn:hover {
  opacity: 0.8;
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
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.status-text-with-icon {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.arrow-received {
  color: #07C160;
  flex-shrink: 0;
}

.arrow-sent {
  color: #576B95;
  flex-shrink: 0;
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
