<template>
  <div class="blacklist-management">

    <!-- 统计信息 -->
    <div class="stats-card" v-if="blacklist.length > 0">
      <div class="stat-item">
        <span class="stat-number">{{ blacklist.length }}</span>
        <span class="stat-label">已拉黑用户</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ recentlyAdded }}</span>
        <span class="stat-label">近7天新增</span>
      </div>
    </div>

    <!-- 黑名单列表 -->
    <div class="blacklist-container">
      <div v-if="blacklist.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:user-minus" width="64" style="color: #ccc;"></iconify-icon>
        <p class="empty-title">暂无黑名单用户</p>
        <p class="empty-desc">被拉黑的用户将无法向您发送消息</p>
      </div>

      <div v-else class="blacklist-list">
        <div 
          v-for="user in blacklist" 
          :key="user.id"
          class="blacklist-item"
        >
          <div class="user-info" @click="viewUserProfile(user.id)">
            <img 
              :src="user.avatar" 
              :alt="user.name"
              class="user-avatar"
              @error="handleAvatarError"
            />
            <div class="user-details">
              <h3 class="user-name">{{ user.name }}</h3>
              <p class="user-id">叶语号：{{ user.yeyuId }}</p>
              <p class="add-time">{{ formatAddTime(user.addTime) }}</p>
            </div>
          </div>
          <div class="user-actions">
            <button class="remove-btn" @click="removeFromBlacklist(user)">
              移除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 清空确认对话框 -->
    <div v-if="showClearDialog" class="dialog-overlay" @click="showClearDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>清空黑名单</h3>
        </div>
        <div class="dialog-content">
          <p>确定要清空所有黑名单用户吗？</p>
          <p class="warning">此操作不可撤销，清空后这些用户将能够重新向您发送消息。</p>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showClearDialog = false">取消</button>
          <button class="confirm-btn" @click="clearAllBlacklist">确定</button>
        </div>
      </div>
    </div>

    <!-- 移除确认对话框 -->
    <div v-if="showRemoveDialog" class="dialog-overlay" @click="showRemoveDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>移出黑名单</h3>
        </div>
        <div class="dialog-content">
          <p>确定要将 <strong>{{ selectedUser?.name }}</strong> 移出黑名单吗？</p>
          <p class="info">移出后，该用户将能够重新向您发送消息。</p>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showRemoveDialog = false">取消</button>
          <button class="confirm-btn" @click="confirmRemove">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlacklistStore, type BlacklistUser } from '../../../stores/blacklist'
import { generateDefaultAvatar } from '../../../shared/utils/userInfo'

const router = useRouter()
const blacklistStore = useBlacklistStore()

// 响应式数据
const showClearDialog = ref(false)
const showRemoveDialog = ref(false)
const selectedUser = ref<BlacklistUser | null>(null)

// 计算属性
const blacklist = computed(() => blacklistStore.blacklist)
const recentlyAdded = computed(() => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return blacklist.value.filter(user => user.addTime > sevenDaysAgo).length
})

// 方法
// 移除goBack函数，使用全局导航栏的返回功能

const viewUserProfile = (userId: string) => {
  router.push(`/friend-profile/${userId}?from=blacklist`)
}

const removeFromBlacklist = (user: BlacklistUser) => {
  selectedUser.value = user
  showRemoveDialog.value = true
}

const confirmRemove = () => {
  if (selectedUser.value) {
    blacklistStore.removeFromBlacklist(selectedUser.value.id)
    showRemoveDialog.value = false
    selectedUser.value = null
  }
}

const clearAllBlacklist = () => {
  blacklistStore.clearBlacklist()
  showClearDialog.value = false
}

const formatAddTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = generateDefaultAvatar('用户')
}

onMounted(() => {
  console.log('📋 黑名单管理页面加载，当前黑名单用户数:', blacklist.value.length)
})
</script>

<style scoped>
.blacklist-management {
  min-height: 100vh;
  background: #f5f5f5;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: #f0f0f0;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.clear-btn {
  background: none;
  border: none;
  color: #ff4444;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: #fff0f0;
}

.stats-card {
  display: flex;
  background: white;
  margin: 12px 16px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.blacklist-container {
  padding: 0 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  margin-top: 20px;
}

.empty-title {
  font-size: 16px;
  color: #333;
  margin: 16px 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.blacklist-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.blacklist-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.blacklist-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 12px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px;
}

.user-id {
  font-size: 12px;
  color: #666;
  margin: 0 0 2px;
}

.add-time {
  font-size: 11px;
  color: #999;
  margin: 0;
}

.remove-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background: #e63939;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.dialog-header {
  padding: 20px 20px 0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.dialog-content {
  padding: 16px 20px;
}

.dialog-content p {
  margin: 0 0 12px;
  color: #333;
  line-height: 1.5;
}

.dialog-content .warning {
  color: #ff4444;
  font-size: 14px;
}

.dialog-content .info {
  color: #666;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid #eee;
}

.dialog-actions button {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
}

.cancel-btn {
  color: #666;
  border-right: 1px solid #eee;
}

.confirm-btn {
  color: #ff4444;
  font-weight: 500;
}

.dialog-actions button:hover {
  background: #f8f8f8;
}
</style>
