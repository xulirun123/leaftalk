<template>
  <div class="search-friend-page">
    <!-- 搜索框区域 -->
    <div class="search-header">
      <div class="search-input-wrapper">
        <iconify-icon icon="heroicons:magnifying-glass" width="18" class="search-icon"></iconify-icon>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="叶语号/手机号"
          class="search-input"
          @input="onSearchInput"
          @keydown.enter="handleSearch"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
          <iconify-icon icon="heroicons:x-circle-solid" width="18"></iconify-icon>
        </button>
      </div>
      <button class="cancel-btn" @click="goBack">取消</button>
    </div>

    <!-- 搜索建议项 -->
    <div v-if="searchQuery.trim() && !hasSearched && !isSearching" class="search-suggestions">
      <div class="suggestion-item" @click="handleSearch">
        <div class="add-user-avatar">
          <iconify-icon icon="heroicons:user-solid" width="20" class="user-icon"></iconify-icon>
          <div class="plus-badge">+</div>
        </div>
        <span class="suggestion-text">搜索：</span>
        <span class="suggestion-query">{{ searchQuery }}</span>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-content">
      <!-- 加载中 -->
      <div v-if="isSearching" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">搜索中...</div>
      </div>

      <!-- 搜索结果 -->
      <div v-else-if="hasSearched && searchResults.length > 0" class="results-container">
        <!-- 联系人标题 -->
        <div class="section-title">联系人</div>

        <!-- 联系人列表 -->
        <div class="results-list">
          <div
            v-for="user in searchResults"
            :key="user.id"
            class="user-item"
            @click="viewUserProfile(user)"
          >
            <img :src="user.avatar" :alt="user.nickname" class="user-avatar" />
            <div class="user-info">
              <div class="user-nickname">{{ user.nickname }}</div>
              <div class="user-signature">{{ user.signature || '暂无签名' }}</div>
            </div>
            <button
              v-if="!user.isFriend"
              class="add-btn"
              @click.stop="addFriend(user)"
            >
              添加
            </button>
            <div v-else class="friend-tag">已添加</div>
          </div>
        </div>
      </div>

      <!-- 无结果 - 只显示"用户不存在"文字 -->
      <div v-else-if="hasSearched && searchResults.length === 0" class="no-result-container">
        <div class="no-result-text">用户不存在</div>
      </div>

      <!-- 初始状态 - 不显示任何内容 -->
      <div v-else class="initial-state">
        <!-- 空白状态，不显示任何文字和图标 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { userApi } from '../../../shared/services/userApi'
import contactsApi from '../services/contactsApi'

const router = useRouter()
const appStore = useAppStore()

const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const isSearching = ref(false)
const hasSearched = ref(false)
const searchResults = ref<any[]>([])

// 返回
const goBack = () => {
  router.back()
}

// 清空搜索
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  searchInput.value?.focus()
}

// 搜索输入
const onSearchInput = () => {
  // 当输入框内容改变时，重置搜索状态，重新显示搜索建议项
  hasSearched.value = false
  searchResults.value = []
}

// 执行搜索
const handleSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  // 验证输入格式
  const isYeyuId = /^[a-zA-Z0-9]{6,20}$/.test(query)
  const isPhone = /^1[3-9]\d{9}$/.test(query)

  if (!isYeyuId && !isPhone) {
    appStore.showToast('请输入正确的叶语号（6-20位字母数字）或手机号', 'error')
    return
  }

  isSearching.value = true
  hasSearched.value = true

  try {
    console.log('🔍 搜索用户:', query, isYeyuId ? '(叶语号)' : '(手机号)')

    const response = await userApi.searchUsers(query)

    if (response.success && response.data) {
      searchResults.value = response.data.map((user: any) => ({
        id: user.id,
        nickname: user.name || user.nickname,
        yeyuId: user.yeyuId || user.yeyu_id,
        phone: user.phone,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        signature: user.signature || '',
        isFriend: user.isFriend || false
      }))
    } else {
      searchResults.value = []

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

// 查看用户资料 - 跳转到朋友资料页面
const viewUserProfile = (user: any) => {
  console.log('查看用户资料:', user)
  // 跳转到朋友资料页面，使用与通讯录相同的路由格式
  router.push(`/friend-profile/${user.id}`)
}

// 添加好友
const addFriend = async (user: any) => {
  try {
    console.log('添加好友:', user)

    const response = await contactsApi.addFriend(user.id, `你好，我是${appStore.user?.nickname || '叶语用户'}`)

    if (response.success) {
      appStore.showToast('好友请求已发送', 'success')
      user.isFriend = true
    } else {
      appStore.showToast(response.message || '添加好友失败', 'error')
    }
  } catch (error) {
    console.error('添加好友失败:', error)
    appStore.showToast('添加好友失败，请稍后重试', 'error')
  }
}

onMounted(() => {
  // 自动聚焦搜索框
  setTimeout(() => {
    searchInput.value?.focus()
  }, 100)
})
</script>

<style scoped>
.search-friend-page {
  min-height: 100vh;
  background: #EDEDED;
  display: flex;
  flex-direction: column;
}

/* 搜索头部 */
.search-header {
  background: #FFFFFF;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 8px;
  padding: 8px 12px;
}

.search-icon {
  color: #999;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 15px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
}

.cancel-btn {
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  color: #333;
  font-size: 15px;
  font-weight: 400;
}

/* 搜索建议 */
.search-suggestions {
  background: #FFFFFF;
  margin-top: 8px;
  border-top: 1px solid #E5E5E5;
}

.suggestion-item {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
  background: #FFFFFF;
}

.suggestion-item:active {
  background: #F5F5F5;
}

.suggestion-item.no-result {
  cursor: default;
}

.suggestion-item.no-result:active {
  background: #FFFFFF;
}

/* 添加用户头像（人头像+加号） */
.add-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-icon {
  color: #FFFFFF;
}

.plus-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background: #FFFFFF;
  border: 1px solid #07C160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: #07C160;
  line-height: 1;
}

.suggestion-text {
  font-size: 15px;
  color: #999;
  margin-right: 4px;
}

.suggestion-query {
  font-size: 15px;
  color: #333;
  font-weight: 400;
  flex: 1;
}

.not-found-text {
  font-size: 13px;
  color: #999;
  margin-left: auto;
}

/* 搜索内容区域 */
.search-content {
  flex: 1;
  overflow-y: auto;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #EDEDED;
  border-top-color: #07C160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #999;
}

/* 搜索结果容器 */
.results-container {
  background: #FFFFFF;
}

/* 联系人标题 */
.section-title {
  height: 25px;
  line-height: 25px;
  padding: 0 16px;
  font-size: 13px;
  color: #999;
  background: #EDEDED;
}

/* 结果列表 */
.results-list {
  background: #FFFFFF;
}

.user-item {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #EDEDED;
  cursor: pointer;
  transition: background 0.2s;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:active {
  background: #F5F5F5;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  margin-right: 12px;
  flex-shrink: 0;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-nickname {
  font-size: 15px;
  color: #333;
  font-weight: 400;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-signature {
  font-size: 12px;
  color: #999;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.add-btn {
  background: #07C160;
  color: #FFFFFF;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  height: 28px;
  line-height: 20px;
}

.add-btn:active {
  background: #06AD56;
}

.friend-tag {
  color: #999;
  font-size: 13px;
  flex-shrink: 0;
}

/* 初始状态 - 空白，不显示任何内容 */
.initial-state {
  /* 空白状态，不需要任何样式 */
}

/* 无结果容器 */
.no-result-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 16px;
}

.no-result-text {
  font-size: 14px;
  color: #999;
}
</style>

