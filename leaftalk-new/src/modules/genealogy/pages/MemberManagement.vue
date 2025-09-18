<template>
  <div class="member-management-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="成员管理" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button @click="showSearchModal = true" class="search-btn">
          <iconify-icon icon="heroicons:magnifying-glass" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <!-- 主要内容 -->
    <div class="management-content">
      <!-- 筛选标签 -->
      <div class="filter-section">
        <div class="filter-tabs">
          <button 
            v-for="filter in filters" 
            :key="filter.key"
            class="filter-tab"
            :class="{ active: currentFilter === filter.key }"
            @click="switchFilter(filter.key)"
          >
            {{ filter.label }}
            <span v-if="filter.count > 0" class="count">{{ filter.count }}</span>
          </button>
        </div>
      </div>

      <!-- 成员列表 -->
      <div class="members-list">
        <div v-if="filteredMembers.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:users" width="64" color="#ccc"></iconify-icon>
          <h4>暂无成员</h4>
          <p>{{ getEmptyStateText() }}</p>
        </div>
        <div v-else class="member-cards">
          <div 
            v-for="member in filteredMembers" 
            :key="member.id"
            class="member-card"
            @click="viewMemberDetail(member)"
          >
            <div class="member-header">
              <img 
                :src="member.avatar || '/default-avatar.png'"
                :alt="member.name"
                class="member-avatar"
              />
              <div class="member-info">
                <h4>{{ member.name }}</h4>
                <p class="member-id">叶语号：{{ member.yeyuId || '未绑定' }}</p>
                <div class="member-tags">
                  <span v-if="member.isPatriarch" class="tag patriarch">族长</span>
                  <span v-if="member.canEdit" class="tag admin">管理员</span>
                  <span v-if="!member.isActive" class="tag inactive">已停用</span>
                  <span v-if="member.isSpouseRelation" class="tag spouse">配偶</span>
                </div>
              </div>
              <div class="member-actions">
                <button @click.stop="showMemberMenu(member)" class="action-btn">
                  <iconify-icon icon="heroicons:ellipsis-vertical" width="16"></iconify-icon>
                </button>
              </div>
            </div>
            <div class="member-details">
              <div class="detail-item">
                <span class="label">世代：</span>
                <span class="value">第{{ getChineseNumber(member.generation) }}世</span>
              </div>
              <div class="detail-item" v-if="member.phone">
                <span class="label">手机：</span>
                <span class="value">{{ member.phone }}</span>
              </div>
              <div class="detail-item">
                <span class="label">加入时间：</span>
                <span class="value">{{ formatDate(member.joinedAt) }}</span>
              </div>
              <div class="detail-item" v-if="member.lastActiveAt">
                <span class="label">最后活跃：</span>
                <span class="value">{{ formatTime(member.lastActiveAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索弹窗 -->
    <div v-if="showSearchModal" class="modal-overlay" @click="closeSearchModal">
      <div class="search-modal" @click.stop>
        <div class="modal-header">
          <h3>搜索成员</h3>
          <button @click="closeSearchModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="输入姓名、叶语号或手机号"
            class="search-input"
            @input="performSearch"
          />
          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="result in searchResults" 
              :key="result.id"
              class="search-result-item"
              @click="selectSearchResult(result)"
            >
              <img 
                :src="result.avatar || '/default-avatar.png'"
                :alt="result.name"
                class="result-avatar"
              />
              <div class="result-info">
                <h4>{{ result.name }}</h4>
                <p>{{ result.yeyuId }} · 第{{ getChineseNumber(result.generation) }}世</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成员操作菜单 -->
    <div v-if="showMemberMenuModal" class="modal-overlay" @click="closeMemberMenu">
      <div class="member-menu-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedMember?.name }}</h3>
          <button @click="closeMemberMenu" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="menu-actions">
            <button @click="editMemberPermissions" class="menu-action">
              <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
              <span>编辑成员</span>
            </button>
            <button @click="viewMemberProfile" class="menu-action">
              <iconify-icon icon="heroicons:user" width="16"></iconify-icon>
              <span>查看资料</span>
            </button>
            <button @click="sendMessage" class="menu-action">
              <iconify-icon icon="heroicons:chat-bubble-left" width="16"></iconify-icon>
              <span>发送消息</span>
            </button>
            <button 
              v-if="selectedMember && !selectedMember.isActive"
              @click="activateMember" 
              class="menu-action activate"
            >
              <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
              <span>激活成员</span>
            </button>
            <button 
              v-if="selectedMember && selectedMember.isActive"
              @click="deactivateMember" 
              class="menu-action deactivate"
            >
              <iconify-icon icon="heroicons:x-circle" width="16"></iconify-icon>
              <span>停用成员</span>
            </button>
            <button @click="removeMember" class="menu-action remove">
              <iconify-icon icon="heroicons:trash" width="16"></iconify-icon>
              <span>移除成员</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const members = ref([])
const currentFilter = ref('all')
const showSearchModal = ref(false)
const showMemberMenuModal = ref(false)
const selectedMember = ref(null)
const searchQuery = ref('')
const searchResults = ref([])

// 筛选选项
const filters = ref([
  { key: 'all', label: '全部', count: 0 },
  { key: 'active', label: '活跃', count: 0 },
  { key: 'admin', label: '管理员', count: 0 },
  { key: 'patriarch', label: '族长', count: 0 },
  { key: 'inactive', label: '停用', count: 0 }
])

// 计算属性
const filteredMembers = computed(() => {
  switch (currentFilter.value) {
    case 'active':
      return members.value.filter(m => m.isActive)
    case 'admin':
      return members.value.filter(m => m.canEdit)
    case 'patriarch':
      return members.value.filter(m => m.isPatriarch)
    case 'inactive':
      return members.value.filter(m => !m.isActive)
    default:
      return members.value
  }
})

// 生命周期
onMounted(() => {
  loadMembers()
})

// 方法
const goBack = () => {
  router.back()
}

const loadMembers = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        members.value = result.data
        updateFilterCounts()
      }
    }
  } catch (error) {
    console.error('加载成员失败:', error)
    appStore.showToast('加载成员失败', 'error')
  }
}

const updateFilterCounts = () => {
  filters.value[0].count = members.value.length
  filters.value[1].count = members.value.filter(m => m.isActive).length
  filters.value[2].count = members.value.filter(m => m.canEdit).length
  filters.value[3].count = members.value.filter(m => m.isPatriarch).length
  filters.value[4].count = members.value.filter(m => !m.isActive).length
}

const switchFilter = (filterKey: string) => {
  currentFilter.value = filterKey
}

const showMemberMenu = (member: any) => {
  selectedMember.value = member
  showMemberMenuModal.value = true
}

const closeMemberMenu = () => {
  showMemberMenuModal.value = false
  selectedMember.value = null
}

const closeSearchModal = () => {
  showSearchModal.value = false
  searchQuery.value = ''
  searchResults.value = []
}

const performSearch = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase()
  searchResults.value = members.value.filter(member => 
    member.name.toLowerCase().includes(query) ||
    (member.yeyuId && member.yeyuId.toLowerCase().includes(query)) ||
    (member.phone && member.phone.includes(query))
  )
}

const selectSearchResult = (result: any) => {
  closeSearchModal()
  viewMemberDetail(result)
}

const viewMemberDetail = (member: any) => {
  router.push(`/genealogy/${genealogyId.value}/member/${member.id}`)
}

const editMemberPermissions = () => {
  closeMemberMenu()
  router.push(`/genealogy/${genealogyId.value}/member/${selectedMember.value.id}/edit`)
}

const viewMemberProfile = () => {
  closeMemberMenu()
  viewMemberDetail(selectedMember.value)
}

const sendMessage = () => {
  closeMemberMenu()
  // 实现发送消息功能
  appStore.showToast('消息功能开发中', 'info')
}

const activateMember = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/member/${selectedMember.value.id}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('成员已激活', 'success')
      loadMembers()
    } else {
      appStore.showToast(result.message || '激活失败', 'error')
    }
  } catch (error) {
    console.error('激活成员失败:', error)
    appStore.showToast('激活成员失败', 'error')
  } finally {
    closeMemberMenu()
  }
}

const deactivateMember = async () => {
  if (!confirm('确定要停用此成员吗？')) return

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/member/${selectedMember.value.id}/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('成员已停用', 'success')
      loadMembers()
    } else {
      appStore.showToast(result.message || '停用失败', 'error')
    }
  } catch (error) {
    console.error('停用成员失败:', error)
    appStore.showToast('停用成员失败', 'error')
  } finally {
    closeMemberMenu()
  }
}

const removeMember = async () => {
  if (!confirm('确定要移除此成员吗？此操作不可撤销。')) return

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/member/${selectedMember.value.id}/remove`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('成员已移除', 'success')
      loadMembers()
    } else {
      appStore.showToast(result.message || '移除失败', 'error')
    }
  } catch (error) {
    console.error('移除成员失败:', error)
    appStore.showToast('移除成员失败', 'error')
  } finally {
    closeMemberMenu()
  }
}

const getEmptyStateText = () => {
  switch (currentFilter.value) {
    case 'active':
      return '暂无活跃成员'
    case 'admin':
      return '暂无管理员'
    case 'patriarch':
      return '暂无族长'
    case 'inactive':
      return '暂无停用成员'
    default:
      return '暂无成员'
  }
}

const getChineseNumber = (num: number) => {
  const chinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return chinese[num] || num.toString()
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatTime = (time: string | Date) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.member-management-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.management-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
  padding: 95px 20px 20px;
}

/* 筛选区域样式 */
.filter-section {
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.filter-tab {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.filter-tab.active {
  background: #07c160;
  color: white;
}

.filter-tab .count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}

/* 成员列表样式 */
.members-list {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h4 {
  margin: 16px 0 8px 0;
  font-size: 16px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.member-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.member-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.member-card:hover {
  border-color: #07c160;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.1);
}

.member-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
}

.member-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.member-id {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.member-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.tag.patriarch {
  background: #FFD700;
  color: #8B4513;
}

.tag.admin {
  background: #07c160;
  color: white;
}

.tag.inactive {
  background: #666;
  color: white;
}

.tag.spouse {
  background: #ff6b6b;
  color: white;
}

.member-actions {
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.action-btn:hover {
  background: #f0f0f0;
}

.member-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-item .label {
  color: #666;
  margin-right: 4px;
}

.detail-item .value {
  color: #333;
}

/* 弹窗样式 */
.modal-overlay {
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
}

.search-modal, .member-menu-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-content {
  padding: 20px;
}

/* 搜索样式 */
.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #f8f9fa;
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.result-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.result-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* 成员菜单样式 */
.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.menu-action:hover {
  background: #f8f9fa;
}

.menu-action.activate {
  color: #07c160;
}

.menu-action.deactivate {
  color: #ff9500;
}

.menu-action.remove {
  color: #ff4757;
}
</style>
