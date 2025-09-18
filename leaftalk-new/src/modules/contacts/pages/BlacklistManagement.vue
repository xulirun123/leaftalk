<template>
  <div class="blacklist-management">


    <!-- 搜索框（与顶部导航栏紧贴，圆角0） -->
    <div class="search-bar">
      <input
        v-model="keyword"
        type="text"
        class="search-input"
        placeholder="搜索黑名单：姓名/叶语号"
      />
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
          v-for="user in filteredBlacklist"
          :key="user.id"
          class="blacklist-item"
          @click="viewUserProfile(user.id)"
        >
          <img
            :src="user.avatar"
            :alt="user.name"
            class="user-avatar"
            @error="handleAvatarError"
          />
          <div class="user-name yy-function-item-text">{{ user.name }}</div>
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


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlacklistStore } from '../stores/blacklistStore'
import { generateDefaultAvatar } from '../../../shared/utils/userInfo'
import { eventBus } from '../../../shared/utils/eventBus'


const router = useRouter()
const blacklistStore = useBlacklistStore()

// 响应式数据
const showClearDialog = ref(false)

// 计算属性
const blacklist = computed(() => blacklistStore.blacklist)

// 搜索
const keyword = ref('')
const filteredBlacklist = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return blacklist.value
  return blacklist.value.filter(u =>
    (u.name || '').toLowerCase().includes(q) ||
    (u.yeyuId || '').toLowerCase().includes(q)
  )
})

// 方法
// 移除goBack函数，使用全局导航栏的返回功能

const viewUserProfile = (userId: string) => {
  router.push(`/friend-profile/${userId}?from=blacklist`)
}

const goBack = () => { router.back() }

const clearAllBlacklist = () => {
  blacklistStore.clearBlacklist()
  showClearDialog.value = false
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = generateDefaultAvatar('用户')
}

const onBlacklistUpdated = async () => {
  await blacklistStore.loadFromServer()
}

onMounted(async () => {
  console.log('📋 黑名单管理页面加载，当前黑名单用户数(本地):', blacklist.value.length)
  // 从服务器获取真实黑名单（真实头像与昵称）
  await blacklistStore.loadFromServer()
  console.log('📋 黑名单管理页面加载完成(服务器):', blacklist.value.length)
  // 监听黑名单更新事件
  eventBus.on('blacklist:updated', onBlacklistUpdated)
})

onUnmounted(() => {
  eventBus.off('blacklist:updated', onBlacklistUpdated)
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

.search-bar { padding: 0; background: #fff; }
.search-input { width: 100%; height: 36px; border: 1px solid #e5e5e5; border-radius: 0; padding: 0 14px; font-size: 14px; outline: none; background: #fff; }


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
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.blacklist-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  margin-right: 12px;
}

.user-name {
  font-size: 15px;
  color: #333;
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
