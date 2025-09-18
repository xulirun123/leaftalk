<template>
  <div class="add-friend">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      title="添加好友"
      :show-back="true"
      @back="goBack"
    />

    <!-- 搜索框区域 -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <iconify-icon icon="heroicons:magnifying-glass" width="16" class="search-icon"></iconify-icon>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="叶语号/手机号"
            class="search-input"
            @input="debouncedSearch"
            @keyup.enter="handleSearch"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-btn"
          >
            <iconify-icon icon="heroicons:x-mark" width="14"></iconify-icon>
          </button>
        </div>
        <button
          v-if="searchQuery"
          @click="handleSearch"
          class="search-btn"
          :disabled="isSearching"
        >
          {{ isSearching ? '搜索中' : '搜索' }}
        </button>
      </div>
    </div>



    <!-- 添加方式 -->
    <div class="add-methods">
      <div class="method-item" @click="goToQRScanner">
        <div class="method-icon">
          <iconify-icon icon="heroicons:qr-code" width="24" style="color: #07c160;"></iconify-icon>
        </div>
        <div class="method-info">
          <div class="method-title">扫一扫</div>
          <div class="method-desc">扫描二维码添加好友</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>

      <div class="method-item compact-item nearby-item" @click="goToNearby">
        <div class="method-icon nearby-icon">
          <iconify-icon icon="heroicons:map-pin" width="24" style="color: white;"></iconify-icon>
        </div>
        <div class="method-info">
          <div class="method-title">附近的人</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>

      <div class="method-item compact-item qr-item" @click="goToMyQR">
        <div class="method-icon qr-icon">
          <iconify-icon icon="heroicons:qr-code" width="24" style="color: white;"></iconify-icon>
        </div>
        <div class="method-info">
          <div class="method-title">我的二维码</div>
        </div>
        <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchQuery" class="search-results">
      <div v-if="isSearching" class="loading">
        <iconify-icon icon="heroicons:arrow-path" width="20" class="animate-spin"></iconify-icon>
        <span>搜索中...</span>
      </div>
      
      <div v-else-if="searchResults.length === 0 && hasSearched" class="no-results">
        <iconify-icon icon="heroicons:user-minus" width="48" style="color: #ccc;"></iconify-icon>
        <p>未找到相关用户</p>
        <p class="search-tip">请检查叶语号或手机号是否正确</p>
      </div>
      
      <div v-else-if="searchResults.length > 0" class="results-list">
        <div class="results-header">
          <span>搜索结果 ({{ searchResults.length }})</span>
        </div>
        <div
          v-for="user in searchResults"
          :key="user.id"
          class="user-item"
        >
          <img
            :src="user.avatar"
            :alt="user.nickname || user.name"
            class="user-avatar"
            @click="viewUserProfile(user)"
          />
          <div class="user-info" @click="viewUserProfile(user)">
            <div class="user-name">{{ user.nickname || user.name }}</div>
            <div class="user-id">叶语号: {{ user.yeyu_id || user.yeyuId }}</div>
          </div>
          <button
            class="add-btn"
            :class="{ 'added': user.isFriend }"
            :disabled="user.isFriend"
            @click.stop="addFriend(user)"
          >
            {{ user.isFriend ? '已添加' : '添加' }}
          </button>
        </div>
      </div>
    </div>



    <!-- 我的二维码弹窗 -->
    <div v-if="showMyQRDialog" class="qr-overlay" @click="hideMyQR">
      <div class="qr-dialog" @click.stop>
        <div class="qr-header">
          <h3>我的二维码</h3>
          <button class="close-btn" @click="hideMyQR">
            <iconify-icon icon="heroicons:x-mark" width="24" style="color: white;"></iconify-icon>
          </button>
        </div>

        <div class="qr-content">
          <div class="qr-avatar">
            <img :src="currentUserAvatar" alt="我的头像" />
          </div>
          <div class="qr-name">{{ currentUserName }}</div>
          <div class="qr-code-container">
            <div class="qr-code-placeholder">
              <iconify-icon icon="heroicons:qr-code" width="120" style="color: #333;"></iconify-icon>
            </div>
          </div>
          <div class="qr-tip">扫一扫上面的二维码，加我为好友</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { contactsApi } from '../services/contactsApi'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const searchQuery = ref('')
const isSearching = ref(false)
const hasSearched = ref(false)
const searchResults = ref<any[]>([])

// 弹窗相关
const showMyQRDialog = ref(false)

// 当前用户信息
const currentUserName = ref('叶语用户')
const currentUserAvatar = ref('https://api.dicebear.com/7.x/avataaars/svg?seed=default')

// 方法
const goBack = () => {
  console.log('添加好友页面返回')
  router.back()
}

const handleSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  // 验证输入格式：只允许叶语号和手机号
  const isYeyuId = /^[a-zA-Z0-9]{6,20}$/.test(query) // 叶语号：6-20位字母数字
  const isPhone = /^1[3-9]\d{9}$/.test(query) // 手机号：11位，1开头

  if (!isYeyuId && !isPhone) {
    appStore.showToast('请输入正确的叶语号（6-20位字母数字）或手机号', 'error')
    return
  }

  isSearching.value = true
  hasSearched.value = true

  try {
    console.log('🔍 搜索用户:', query, isYeyuId ? '(叶语号)' : '(手机号)')

    // 使用新的API服务搜索用户
    const response = await contactsApi.searchUsers(query)

    if (response.success && response.data) {
      searchResults.value = response.data.map((user: any) => ({
        id: user.id,
        nickname: user.name,
        yeyuId: user.yeyuId,
        phone: user.phone,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        isFriend: false // 这里可以检查是否已经是好友
      }))
    } else {
      searchResults.value = []

      // 特殊处理搜索自己的情况
      if (response.code === 400 && response.data?.searchingSelf) {
        appStore.showToast('不能添加自己为好友', 'warning')
      } else {
        appStore.showToast(response.message || '未找到匹配的用户', 'error')
      }
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
    appStore.showToast('搜索失败，请检查网络连接', 'error')
  } finally {
    isSearching.value = false
  }
}

const addFriend = async (user: any) => {
  try {
    console.log('添加好友:', user)

    // 直接调用后端API添加好友
    const token = localStorage.getItem('yeyu_auth_token') || localStorage.getItem('token') || ''
    const response = await fetch('http://127.0.0.1:8893/api/contacts/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: user.id,
        remark: user.nickname || user.name
      })
    });

    const result = await response.json();

    if (result.success) {
      appStore.showToast(`已成功添加 ${user.nickname || user.name} 为好友`, 'success')
      user.isFriend = true

      // 添加到本地通讯录
      addToLocalContacts(user)

      // 触发通讯录更新事件
      window.dispatchEvent(new CustomEvent('contacts:updated'))

      // 如果有eventBus，也触发事件
      if (window.eventBus) {
        window.eventBus.emit('CONTACTS_REFRESH')
        window.eventBus.emit('CONTACT_ADDED', user)
      }
    } else {
      appStore.showToast(result.message || '添加好友失败', 'error')
    }
  } catch (error) {
    console.error('添加好友失败:', error)
    // 如果API失败，仍然添加到本地（离线模式）
    appStore.showToast(`已成功添加 ${user.nickname || user.name} 为好友`, 'success')
    user.isFriend = true
    addToLocalContacts(user)

    // 触发通讯录更新事件
    window.dispatchEvent(new CustomEvent('contacts:updated'))
  }
}

// 检查用户的验证设置
const checkUserVerificationSetting = async (userId: string) => {
  try {
    const response = await fetch(`http://127.0.0.1:8893/api/users/${userId}/verification-setting`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('yeyu_token') || ''}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data.needVerification || false
    }
  } catch (error) {
    console.error('获取用户验证设置失败:', error)
  }

  // 默认不需要验证
  return false
}

// 添加到本地通讯录
const addToLocalContacts = (user: any) => {
  try {
    const contacts = JSON.parse(localStorage.getItem('yeyu_contacts') || '[]')

    // 检查是否已存在
    const exists = contacts.find((c: any) => c.id === user.id)
    if (!exists) {
      contacts.push({
        id: user.id,
        name: user.nickname,
        avatar: user.avatar,
        yeyuId: user.yeyu_id || user.yeyuId,
        phone: user.phone,
        addedAt: Date.now(),
        status: 'accepted'
      })

      localStorage.setItem('yeyu_contacts', JSON.stringify(contacts))
      console.log('✅ 已添加到本地通讯录:', user.nickname)

      // 触发通讯录更新事件
      window.dispatchEvent(new CustomEvent('contacts:updated'))

      // 如果有eventBus，也触发事件
      if (window.eventBus) {
        window.eventBus.emit('CONTACTS_REFRESH')
        window.eventBus.emit('CONTACT_ADDED', user)
      }
    }
  } catch (error) {
    console.error('添加到本地通讯录失败:', error)
  }
}

// 添加到好友申请记录
const addToFriendRequests = (user: any) => {
  try {
    const requests = JSON.parse(localStorage.getItem('yeyu_friend_requests') || '[]')

    // 检查是否已存在
    const exists = requests.find((r: any) => r.id === user.id)
    if (!exists) {
      requests.push({
        id: user.id,
        name: user.nickname,
        avatar: user.avatar,
        yeyuId: user.yeyu_id || user.yeyuId,
        phone: user.phone,
        requestedAt: Date.now(),
        status: 'pending',
        type: 'sent' // 我发送的申请
      })

      localStorage.setItem('yeyu_friend_requests', JSON.stringify(requests))
      console.log('✅ 已添加到好友申请记录:', user.nickname)
    }
  } catch (error) {
    console.error('添加到好友申请记录失败:', error)
  }
}

const goToQRScanner = () => {
  router.push('/scan')
}

const goToNearby = () => {
  router.push('/nearby')
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
}

// 防抖搜索
let searchTimeout: number | null = null
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim()) {
      handleSearch()
    } else {
      searchResults.value = []
      hasSearched.value = false
    }
  }, 500)
}

const goToMyQR = () => {
  showMyQRDialog.value = true
}

// 查看用户资料
const viewUserProfile = (user: any) => {
  console.log('🔍 查看用户资料:', user.nickname, user.id)

  // 跳转到好友资料页面，标记来源为搜索
  const userId = user.id || user.yeyu_id || user.yeyuId
  if (userId) {
    router.push(`/friend-profile/${userId}?from=search`)
  } else {
    console.error('❌ 无法获取用户ID:', user)
    appStore.showToast('无法查看用户资料', 'error')
  }
}



// 隐藏我的二维码弹窗
const hideMyQR = () => {
  showMyQRDialog.value = false
}
</script>

<style scoped>
.add-friend {
  min-height: 100vh;
  background: #f8f8f8;
}

.search-section {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 75px; /* 顶部导航栏高度 */
  z-index: 10;
}

.search-container {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  max-width: 100%;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
  gap: 8px;
  min-height: 40px;
  min-width: 0; /* 允许收缩 */
}

.search-icon {
  color: #999;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 16px;
  color: #333;
  line-height: 1.4;
  min-width: 0; /* 允许收缩 */
  width: 100%;
}

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  background: none;
  border: none;
  padding: 4px;
  color: #999;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.search-btn {
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0 16px;
  height: 40px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 60px;
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .search-section {
    padding: 8px 12px;
  }

  .search-container {
    gap: 6px;
  }

  .search-input-wrapper {
    padding: 8px 10px;
    min-height: 36px;
  }

  .search-input {
    font-size: 14px;
  }

  .search-btn {
    padding: 0 12px;
    height: 36px;
    font-size: 13px;
    min-width: 50px;
  }
}



.add-methods {
  background: white;
  margin-top: 0;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.method-item:hover {
  background: #f8f8f8;
}

.method-item:last-child {
  border-bottom: none;
}

/* 紧凑项目样式 - 让容器重合 */
.method-item.compact-item {
  padding: 8px 16px;
  border-bottom: none;
  margin: 0;
}

/* 附近的人项目 - 去掉下边距 */
.method-item.nearby-item {
  margin-bottom: -1px;
}

/* 二维码项目 - 去掉上边距 */
.method-item.qr-item {
  margin-top: -1px;
}

.method-icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  position: relative;
}

/* 附近的人图标 - 绿色背景 */
.nearby-icon {
  background: #07c160;
}

/* 二维码图标 - 蓝色背景 */
.qr-icon {
  background: #1989fa;
}

.method-info {
  flex: 1;
}

.method-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}



.search-results {
  background: white;
  margin-top: 8px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 8px;
  color: #999;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-results p {
  margin: 8px 0;
}

.search-tip {
  font-size: 12px;
  color: #ccc;
}

.results-header {
  padding: 12px 16px;
  background: #f8f8f8;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #e5e5e5;
}

.results-list {
  background: white;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f8f8f8;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: 12px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-id, .user-phone {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}

.add-btn {
  padding: 6px 16px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:disabled,
.add-btn.added {
  background: #ccc;
  cursor: not-allowed;
}

.search-tips {
  background: white;
  margin-top: 8px;
  padding: 16px;
}

.tips-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.tip-item:last-child {
  border-bottom: none;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.tip-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.tips-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
}

.bottom-search-note {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  text-align: center;
  z-index: 10;
}

.bottom-search-note p {
  margin: 0;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  line-height: 1.4;
}

/* 个人资料弹窗 */
.profile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.profile-dialog {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  width: 100%;
  max-width: 320px;
  overflow: hidden;
  color: white;
}

.profile-header {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-content {
  padding: 0 20px 30px;
  text-align: center;
}

.profile-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.profile-id, .profile-phone, .profile-signature {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 6px;
}

.profile-actions {
  margin-top: 24px;
}

.profile-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.profile-btn.primary {
  background: #07C160;
  color: white;
}

.profile-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 我的二维码弹窗 */
.qr-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.qr-dialog {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 320px;
  overflow: hidden;
}

.qr-header {
  background: #07C160;
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qr-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.qr-content {
  padding: 30px 20px;
  text-align: center;
}

.qr-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid #f0f0f0;
  margin-bottom: 16px;
}

.qr-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.qr-code-container {
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: white;
  border-radius: 4px;
}

.qr-tip {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
</style>
