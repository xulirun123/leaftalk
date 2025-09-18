<template>
  <div class="member-detail-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      :title="memberName" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canEdit" @click="editMember" class="edit-btn">
          编辑
        </button>
      </template>
    </MobileTopBar>

    <!-- 主要内容 -->
    <div class="member-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载成员信息中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <iconify-icon icon="heroicons:exclamation-triangle" width="48" color="#ff4757"></iconify-icon>
        <p>{{ error }}</p>
        <button @click="loadMemberDetail" class="retry-btn">重试</button>
      </div>

      <!-- 成员信息 -->
      <div v-else-if="memberInfo" class="member-info">
        <!-- 头像和基本信息 -->
        <div class="member-header">
          <div class="avatar-container">
            <img 
              :src="memberInfo.avatar || defaultAvatar" 
              :alt="memberInfo.name"
              class="member-avatar"
              :class="{ deceased: !memberInfo.isAlive }"
            />
            <div class="gender-indicator" :class="memberInfo.gender">
              <iconify-icon 
                :icon="memberInfo.gender === 'male' ? 'heroicons:user' : 'heroicons:user'"
                width="16"
              ></iconify-icon>
            </div>
          </div>
          <div class="member-basic">
            <h2>{{ memberInfo.name }}</h2>
            <p class="generation">第{{ getChineseNumber(memberInfo.generation) }}世</p>
            <div class="status-badges">
              <span v-if="memberInfo.isPatriarch" class="badge patriarch">族长</span>
              <span v-if="memberInfo.canEdit" class="badge admin">管理员</span>
              <span v-if="!memberInfo.isAlive" class="badge deceased">已故</span>
            </div>
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="member-details">
          <div class="detail-section">
            <h3>基本信息</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>性别</label>
                <span>{{ memberInfo.gender === 'male' ? '男' : '女' }}</span>
              </div>
              <div class="detail-item" v-if="memberInfo.birthDate">
                <label>出生日期</label>
                <span>{{ formatDate(memberInfo.birthDate) }}</span>
              </div>
              <div class="detail-item" v-if="memberInfo.deathDate">
                <label>去世日期</label>
                <span>{{ formatDate(memberInfo.deathDate) }}</span>
              </div>
              <div class="detail-item" v-if="memberInfo.age">
                <label>年龄</label>
                <span>{{ memberInfo.age }}岁</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="memberInfo.fatherName || memberInfo.motherName">
            <h3>父母信息</h3>
            <div class="detail-grid">
              <div class="detail-item" v-if="memberInfo.fatherName">
                <label>父亲</label>
                <span>{{ memberInfo.fatherName }}</span>
              </div>
              <div class="detail-item" v-if="memberInfo.motherName">
                <label>母亲</label>
                <span>{{ memberInfo.motherName }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="memberInfo.spouseName">
            <h3>配偶信息</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>配偶</label>
                <span>{{ memberInfo.spouseName }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="children.length > 0">
            <h3>子女信息</h3>
            <div class="children-list">
              <div 
                v-for="child in children" 
                :key="child.id"
                class="child-item"
                @click="goToMember(child.id)"
              >
                <img 
                  :src="child.avatar || defaultAvatar" 
                  :alt="child.name"
                  class="child-avatar"
                />
                <div class="child-info">
                  <h4>{{ child.name }}</h4>
                  <p>{{ child.gender === 'male' ? '男' : '女' }} · 第{{ getChineseNumber(child.generation) }}世</p>
                </div>
                <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
              </div>
            </div>
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
const genealogyId = ref(route.params.genealogyId)
const memberId = ref(route.params.memberId)
const memberInfo = ref(null)
const children = ref([])
const loading = ref(false)
const error = ref('')
const canEdit = ref(false)

// 默认头像
const defaultAvatar = '/default-avatar.png'

// 计算属性
const memberName = computed(() => {
  return memberInfo.value?.name || '成员详情'
})

// 生命周期
onMounted(() => {
  loadMemberDetail()
})

// 方法
const goBack = () => {
  router.back()
}

const loadMemberDetail = async () => {
  if (!genealogyId.value || !memberId.value) {
    error.value = '参数错误'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 加载成员详情
    const response = await fetch(`/api/genealogy/${genealogyId.value}/member/${memberId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (!response.ok) {
      throw new Error('获取成员信息失败')
    }

    const result = await response.json()
    if (result.success) {
      memberInfo.value = result.data.member
      children.value = result.data.children || []
      canEdit.value = result.data.canEdit || false
    } else {
      throw new Error(result.message || '获取成员信息失败')
    }

  } catch (err: any) {
    console.error('加载成员详情失败:', err)
    error.value = err.message || '加载失败'
    appStore.showToast('加载成员详情失败', 'error')
  } finally {
    loading.value = false
  }
}

const editMember = () => {
  router.push(`/genealogy/${genealogyId.value}/member/${memberId.value}/edit`)
}

const goToMember = (childId: string) => {
  router.push(`/genealogy/${genealogyId.value}/member/${childId}`)
}

const getChineseNumber = (num: number) => {
  const chinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return chinese[num] || num.toString()
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style scoped>
.member-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.edit-btn {
  background: none;
  border: none;
  color: #07c160;
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
}

.member-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
}

/* 加载和错误状态样式（复用之前的） */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 75px);
  color: #666;
  text-align: center;
  padding: 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 16px;
}

/* 成员信息样式 */
.member-info {
  padding: 20px;
}

.member-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  text-align: center;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.member-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-avatar.deceased {
  filter: grayscale(100%);
  opacity: 0.7;
}

.gender-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.gender-indicator.male {
  background: #4A90E2;
  color: white;
}

.gender-indicator.female {
  background: #E24A90;
  color: white;
}

.member-basic h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.generation {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.status-badges {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.badge.patriarch {
  background: #FFD700;
  color: #8B4513;
}

.badge.admin {
  background: #07c160;
  color: white;
}

.badge.deceased {
  background: #666;
  color: white;
}

/* 详细信息样式 */
.member-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.detail-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.detail-item span {
  font-size: 14px;
  color: #333;
}

/* 子女列表样式 */
.children-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.child-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.child-item:hover {
  background: #f0f0f0;
}

.child-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.child-info {
  flex: 1;
}

.child-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.child-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.arrow {
  color: #ccc;
}
</style>
