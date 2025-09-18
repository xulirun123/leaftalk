<template>
  <div class="memorial-worship-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="祭奠祭扫" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button v-if="canOrganize" @click="createMemorial" class="create-btn">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <div class="page-content scroll-container">
      <!-- 功能分类标签 -->
      <div class="function-tabs">
        <div
          v-for="tab in functionTabs"
          :key="tab.value"
          class="function-tab"
          :class="{ active: currentFunction === tab.value }"
          @click="setFunction(tab.value)"
        >
          <iconify-icon :icon="tab.icon" width="18"></iconify-icon>
          <span>{{ tab.label }}</span>
        </div>
      </div>

      <!-- 主要内容 -->
    <div class="worship-content">
      <!-- 祭奠活动 -->
      <div v-if="currentFunction === 'activities'" class="activities-section">
        <div class="activities-list">
          <div 
            v-for="activity in memorialActivities" 
            :key="activity.id"
            class="activity-card"
            @click="viewActivityDetail(activity)"
          >
            <div class="activity-header">
              <div class="activity-info">
                <h4>{{ activity.title }}</h4>
                <p class="activity-type">
                  <iconify-icon :icon="getActivityIcon(activity.type)" width="12"></iconify-icon>
                  {{ getActivityTypeText(activity.type) }}
                </p>
              </div>
              <div class="activity-status" :class="activity.status">
                {{ getStatusText(activity.status) }}
              </div>
            </div>
            
            <div class="activity-meta">
              <div class="meta-item">
                <iconify-icon icon="heroicons:calendar-days" width="14"></iconify-icon>
                <span>{{ formatDate(activity.date) }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:clock" width="14"></iconify-icon>
                <span>{{ activity.time }}</span>
              </div>
              <div class="meta-item">
                <iconify-icon icon="heroicons:users" width="14"></iconify-icon>
                <span>{{ activity.participantCount }}人参与</span>
              </div>
            </div>
            
            <div class="activity-desc">
              {{ activity.description }}
            </div>
            
            <div class="memorial-target" v-if="activity.memorialTarget">
              <div class="target-avatar">
                <img :src="activity.memorialTarget.avatar || '/default-avatar.png'" :alt="activity.memorialTarget.name" />
              </div>
              <div class="target-info">
                <span class="target-name">{{ activity.memorialTarget.name }}</span>
                <span class="target-relation">{{ activity.memorialTarget.relation }}</span>
              </div>
            </div>
            
            <div class="activity-actions">
              <button 
                v-if="activity.status === 'upcoming' && !activity.isJoined"
                @click.stop="joinActivity(activity)"
                class="action-btn primary"
              >
                <iconify-icon icon="heroicons:user-plus" width="16"></iconify-icon>
                参加祭奠
              </button>
              <button 
                v-else-if="activity.status === 'upcoming' && activity.isJoined"
                @click.stop="leaveActivity(activity)"
                class="action-btn secondary"
              >
                <iconify-icon icon="heroicons:user-minus" width="16"></iconify-icon>
                退出活动
              </button>
              <button 
                v-else-if="activity.status === 'ongoing'"
                @click.stop="enterMemorial(activity)"
                class="action-btn primary"
              >
                <iconify-icon icon="heroicons:heart" width="16"></iconify-icon>
                进入祭奠
              </button>
              <button 
                @click.stop="viewActivityDetail(activity)"
                class="action-btn"
              >
                <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 虚拟祭奠 -->
      <div v-if="currentFunction === 'virtual'" class="virtual-section">
        <div class="virtual-intro">
          <div class="intro-card">
            <iconify-icon icon="heroicons:heart" width="32" class="intro-icon"></iconify-icon>
            <h3>虚拟祭奠</h3>
            <p>通过虚拟祭奠表达对逝者的思念和敬意</p>
          </div>
        </div>
        
        <div class="virtual-memorials">
          <div 
            v-for="memorial in virtualMemorials" 
            :key="memorial.id"
            class="memorial-card"
            @click="enterVirtualMemorial(memorial)"
          >
            <div class="memorial-image">
              <img :src="memorial.image" :alt="memorial.name" />
              <div class="memorial-overlay">
                <iconify-icon icon="heroicons:heart" width="24"></iconify-icon>
                <span>进入祭奠</span>
              </div>
            </div>
            
            <div class="memorial-info">
              <h4>{{ memorial.name }}</h4>
              <p class="memorial-relation">{{ memorial.relation }}</p>
              <div class="memorial-stats">
                <span class="memorial-count">
                  <iconify-icon icon="heroicons:heart" width="12"></iconify-icon>
                  {{ memorial.memorialCount }}次祭奠
                </span>
                <span class="last-memorial">
                  最近祭奠：{{ formatDate(memorial.lastMemorial) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 祭奠用品 -->
      <div v-if="currentFunction === 'supplies'" class="supplies-section">
        <div class="supplies-categories">
          <div 
            v-for="category in suppliesCategories" 
            :key="category.value"
            class="supplies-category"
            :class="{ active: currentSuppliesCategory === category.value }"
            @click="setSuppliesCategory(category.value)"
          >
            <iconify-icon :icon="category.icon" width="16"></iconify-icon>
            <span>{{ category.label }}</span>
          </div>
        </div>
        
        <div class="supplies-grid">
          <div 
            v-for="supply in filteredSupplies" 
            :key="supply.id"
            class="supply-card"
            @click="viewSupplyDetail(supply)"
          >
            <div class="supply-image">
              <img :src="supply.image" :alt="supply.name" />
              <div v-if="supply.isBlessed" class="blessed-badge">
                <iconify-icon icon="heroicons:sparkles" width="12"></iconify-icon>
                已开光
              </div>
            </div>
            
            <div class="supply-info">
              <h4>{{ supply.name }}</h4>
              <p class="supply-desc">{{ supply.description }}</p>
              <div class="supply-price">
                <span class="current-price">¥{{ supply.price }}</span>
                <span v-if="supply.originalPrice > supply.price" class="original-price">¥{{ supply.originalPrice }}</span>
              </div>
              
              <div class="supply-actions">
                <button @click.stop="addToCart(supply)" class="add-cart-btn">
                  <iconify-icon icon="heroicons:shopping-cart" width="14"></iconify-icon>
                  加购物车
                </button>
                <button @click.stop="buyNow(supply)" class="buy-now-btn">
                  立即购买
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 祭奠礼仪 -->
      <div v-if="currentFunction === 'ritual'" class="ritual-section">
        <div class="ritual-cards">
          <div 
            v-for="ritual in memorialRituals" 
            :key="ritual.id"
            class="ritual-card"
            @click="viewRitual(ritual)"
          >
            <div class="ritual-icon">
              <iconify-icon :icon="ritual.icon" width="32"></iconify-icon>
            </div>
            <div class="ritual-info">
              <h4>{{ ritual.title }}</h4>
              <p>{{ ritual.description }}</p>
              <div class="ritual-meta">
                <span class="ritual-type">{{ ritual.type }}</span>
                <span class="ritual-duration">{{ ritual.duration }}分钟</span>
              </div>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="shouldShowEmpty" class="empty-state">
        <iconify-icon :icon="getEmptyIcon()" width="48" class="empty-icon"></iconify-icon>
        <h3>{{ getEmptyTitle() }}</h3>
        <p>{{ getEmptyDesc() }}</p>
        <button v-if="canOrganize && currentFunction === 'activities'" @click="createMemorial" class="create-memorial-btn">
          创建祭奠活动
        </button>
      </div>
    </div>

    <!-- 创建祭奠弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="create-modal" @click.stop>
        <div class="modal-header">
          <h3>创建祭奠活动</h3>
          <button @click="closeCreateModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="submitMemorial" class="create-form">
            <div class="form-group">
              <label>活动标题</label>
              <input 
                v-model="newMemorial.title"
                type="text"
                placeholder="请输入活动标题"
                required
              />
            </div>
            <div class="form-group">
              <label>祭奠对象</label>
              <select v-model="newMemorial.memorialTargetId" required>
                <option value="">请选择祭奠对象</option>
                <option 
                  v-for="member in deceasedMembers" 
                  :key="member.id"
                  :value="member.id"
                >
                  {{ member.name }} ({{ member.relation }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>活动类型</label>
              <select v-model="newMemorial.type" required>
                <option value="">请选择</option>
                <option value="anniversary">忌日祭奠</option>
                <option value="birthday">生日纪念</option>
                <option value="festival">节日祭奠</option>
                <option value="special">特殊纪念</option>
              </select>
            </div>
            <div class="form-group">
              <label>活动描述</label>
              <textarea 
                v-model="newMemorial.description"
                placeholder="请输入活动描述"
                rows="3"
                required
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>活动日期</label>
                <input 
                  v-model="newMemorial.date"
                  type="date"
                  required
                />
              </div>
              <div class="form-group">
                <label>活动时间</label>
                <input 
                  v-model="newMemorial.time"
                  type="time"
                  required
                />
              </div>
            </div>
            <div class="form-group">
              <label>祭奠方式</label>
              <select v-model="newMemorial.mode" required>
                <option value="">请选择</option>
                <option value="online">线上祭奠</option>
                <option value="offline">线下祭奠</option>
                <option value="hybrid">线上线下结合</option>
              </select>
            </div>
            <div v-if="newMemorial.mode === 'offline' || newMemorial.mode === 'hybrid'" class="form-group">
              <label>祭奠地点</label>
              <input 
                v-model="newMemorial.location"
                type="text"
                placeholder="请输入祭奠地点"
                required
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="closeCreateModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="submit-btn">
                创建活动
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const currentFunction = ref('activities')
const currentSuppliesCategory = ref('all')
const showCreateModal = ref(false)

const functionTabs = ref([
  { label: '祭奠活动', value: 'activities', icon: 'heroicons:users' },
  { label: '虚拟祭奠', value: 'virtual', icon: 'heroicons:heart' },
  { label: '祭奠用品', value: 'supplies', icon: 'heroicons:gift' },
  { label: '祭奠礼仪', value: 'ritual', icon: 'heroicons:book-open' }
])

const memorialActivities = ref([
  {
    id: 1,
    title: '张三公忌日祭奠',
    description: '纪念张三公逝世三周年，缅怀先人恩德',
    type: 'anniversary',
    date: new Date('2024-03-15'),
    time: '10:00',
    status: 'upcoming',
    participantCount: 15,
    isJoined: false,
    memorialTarget: {
      id: 1,
      name: '张三',
      relation: '祖父',
      avatar: '/avatars/grandfather.jpg'
    }
  }
])

const virtualMemorials = ref([
  {
    id: 1,
    name: '张三',
    relation: '祖父',
    image: '/memorials/grandfather.jpg',
    memorialCount: 89,
    lastMemorial: new Date('2024-01-15')
  }
])

const suppliesCategories = ref([
  { label: '全部', value: 'all', icon: 'heroicons:squares-2x2' },
  { label: '鲜花', value: 'flowers', icon: 'heroicons:sparkles' },
  { label: '香烛', value: 'incense', icon: 'heroicons:fire' },
  { label: '供品', value: 'offerings', icon: 'heroicons:gift' },
  { label: '纸钱', value: 'paper', icon: 'heroicons:banknotes' }
])

const supplies = ref([
  {
    id: 1,
    name: '白玫瑰花束',
    description: '精选白玫瑰，表达对逝者的思念',
    category: 'flowers',
    price: 68,
    originalPrice: 98,
    image: '/supplies/white-roses.jpg',
    isBlessed: false
  }
])

const memorialRituals = ref([
  {
    id: 1,
    title: '传统祭奠礼仪',
    description: '了解传统祭奠的完整流程和注意事项',
    type: '传统礼仪',
    duration: 15,
    icon: 'heroicons:book-open'
  },
  {
    id: 2,
    title: '现代祭奠方式',
    description: '现代祭奠的创新形式和表达方式',
    type: '现代礼仪',
    duration: 10,
    icon: 'heroicons:heart'
  }
])

const deceasedMembers = ref([
  { id: 1, name: '张三', relation: '祖父' },
  { id: 2, name: '李四', relation: '祖母' }
])

const newMemorial = ref({
  title: '',
  memorialTargetId: '',
  type: '',
  description: '',
  date: '',
  time: '',
  mode: '',
  location: ''
})

// 计算属性
const canOrganize = computed(() => {
  return authStore.user?.role === 'patriarch' || authStore.user?.role === 'admin' || authStore.user?.role === 'member'
})

const filteredSupplies = computed(() => {
  if (currentSuppliesCategory.value === 'all') {
    return supplies.value
  }
  return supplies.value.filter(supply => supply.category === currentSuppliesCategory.value)
})

const shouldShowEmpty = computed(() => {
  if (currentFunction.value === 'activities') return memorialActivities.value.length === 0
  if (currentFunction.value === 'virtual') return virtualMemorials.value.length === 0
  if (currentFunction.value === 'supplies') return filteredSupplies.value.length === 0
  if (currentFunction.value === 'ritual') return memorialRituals.value.length === 0
  return false
})

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    // 加载祭奠相关数据
    console.log('加载祭奠数据')
  } catch (error) {
    console.error('加载数据失败:', error)
    appStore.showToast('加载数据失败', 'error')
  }
}

const setFunction = (func: string) => {
  currentFunction.value = func
}

const setSuppliesCategory = (category: string) => {
  currentSuppliesCategory.value = category
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })
}

const getActivityIcon = (type: string) => {
  const iconMap = {
    anniversary: 'heroicons:calendar-days',
    birthday: 'heroicons:cake',
    festival: 'heroicons:gift',
    special: 'heroicons:star'
  }
  return iconMap[type] || 'heroicons:heart'
}

const getActivityTypeText = (type: string) => {
  const typeMap = {
    anniversary: '忌日祭奠',
    birthday: '生日纪念',
    festival: '节日祭奠',
    special: '特殊纪念'
  }
  return typeMap[type] || type
}

const getStatusText = (status: string) => {
  const statusMap = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束'
  }
  return statusMap[status] || status
}

const getEmptyIcon = () => {
  const iconMap = {
    activities: 'heroicons:users',
    virtual: 'heroicons:heart',
    supplies: 'heroicons:gift',
    ritual: 'heroicons:book-open'
  }
  return iconMap[currentFunction.value] || 'heroicons:exclamation-triangle'
}

const getEmptyTitle = () => {
  const titleMap = {
    activities: '暂无祭奠活动',
    virtual: '暂无虚拟祭奠',
    supplies: '暂无祭奠用品',
    ritual: '暂无祭奠礼仪'
  }
  return titleMap[currentFunction.value] || '暂无数据'
}

const getEmptyDesc = () => {
  const descMap = {
    activities: '还没有创建任何祭奠活动',
    virtual: '还没有设置虚拟祭奠',
    supplies: '该分类下暂无商品',
    ritual: '祭奠礼仪即将上线'
  }
  return descMap[currentFunction.value] || '请稍后再试'
}

const viewActivityDetail = (activity: any) => {
  router.push(`/genealogy/${genealogyId.value}/memorial/${activity.id}`)
}

const joinActivity = async (activity: any) => {
  try {
    appStore.showToast('加入活动中...', 'info')
    activity.isJoined = true
    activity.participantCount += 1
    appStore.showToast('已加入祭奠活动', 'success')
  } catch (error) {
    appStore.showToast('加入失败', 'error')
  }
}

const leaveActivity = async (activity: any) => {
  try {
    appStore.showToast('退出活动中...', 'info')
    activity.isJoined = false
    activity.participantCount -= 1
    appStore.showToast('已退出祭奠活动', 'success')
  } catch (error) {
    appStore.showToast('退出失败', 'error')
  }
}

const enterMemorial = (activity: any) => {
  router.push(`/genealogy/${genealogyId.value}/memorial/${activity.id}/enter`)
}

const enterVirtualMemorial = (memorial: any) => {
  router.push(`/genealogy/${genealogyId.value}/virtual-memorial/${memorial.id}`)
}

const viewSupplyDetail = (supply: any) => {
  router.push(`/genealogy/${genealogyId.value}/memorial/supplies/${supply.id}`)
}

const addToCart = (supply: any) => {
  appStore.showToast('已添加到购物车', 'success')
}

const buyNow = (supply: any) => {
  router.push(`/genealogy/${genealogyId.value}/memorial/order/${supply.id}`)
}

const viewRitual = (ritual: any) => {
  router.push(`/genealogy/${genealogyId.value}/memorial/ritual/${ritual.id}`)
}

const createMemorial = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetForm()
}

const resetForm = () => {
  newMemorial.value = {
    title: '',
    memorialTargetId: '',
    type: '',
    description: '',
    date: '',
    time: '',
    mode: '',
    location: ''
  }
}

const submitMemorial = async () => {
  try {
    appStore.showToast('创建中...', 'info')
    // 实现创建祭奠活动逻辑
    const targetMember = deceasedMembers.value.find(m => m.id == newMemorial.value.memorialTargetId)
    const memorial = {
      id: Date.now(),
      ...newMemorial.value,
      date: new Date(newMemorial.value.date),
      status: 'upcoming',
      participantCount: 0,
      isJoined: false,
      memorialTarget: targetMember
    }
    memorialActivities.value.unshift(memorial)
    appStore.showToast('祭奠活动创建成功', 'success')
    closeCreateModal()
  } catch (error) {
    appStore.showToast('创建失败', 'error')
  }
}
</script>

<style scoped>
.memorial-worship-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

.create-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.create-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 功能标签 */
.function-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 75px;
}

.function-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.function-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.function-tab span {
  font-size: 11px;
  font-weight: 500;
}

/* 主要内容 */
.worship-content {
  padding: 16px;
}

/* 活动列表 */
.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.activity-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.activity-type {
  margin: 0;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.activity-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.activity-status.upcoming {
  background: #07c160;
}

.activity-status.ongoing {
  background: #ff9500;
}

.activity-status.completed {
  background: #999;
}

.activity-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.activity-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12px;
}

.memorial-target {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.target-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  filter: grayscale(100%);
  opacity: 0.8;
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.target-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.target-relation {
  font-size: 12px;
  color: #666;
}

.activity-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.primary {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.action-btn.secondary {
  background: #ff9500;
  color: white;
  border-color: #ff9500;
}

/* 虚拟祭奠 */
.virtual-intro {
  margin-bottom: 20px;
}

.intro-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.intro-icon {
  color: #ff6b6b;
  margin-bottom: 12px;
}

.intro-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.intro-card p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.virtual-memorials {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memorial-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.memorial-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.memorial-image {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.memorial-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(50%);
}

.memorial-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.memorial-card:hover .memorial-overlay {
  opacity: 1;
}

.memorial-overlay span {
  font-size: 12px;
}

.memorial-info {
  padding: 16px;
}

.memorial-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.memorial-relation {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #666;
}

.memorial-stats {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

.memorial-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 祭奠用品 */
.supplies-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.supplies-categories::-webkit-scrollbar {
  display: none;
}

.supplies-category {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f0f0f0;
}

.supplies-category.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.supplies-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.supply-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.supply-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.supply-image {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.supply-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blessed-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.supply-info {
  padding: 12px;
}

.supply-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.supply-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.supply-price {
  margin-bottom: 8px;
}

.current-price {
  color: #ff3b30;
  font-weight: bold;
  font-size: 14px;
}

.original-price {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
  margin-left: 4px;
}

.supply-actions {
  display: flex;
  gap: 6px;
}

.add-cart-btn,
.buy-now-btn {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.2s;
}

.add-cart-btn {
  background: white;
  color: #666;
}

.add-cart-btn:hover {
  background: #f5f5f5;
}

.buy-now-btn {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.buy-now-btn:hover {
  background: #06a552;
}

/* 祭奠礼仪 */
.ritual-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ritual-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.ritual-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ritual-icon {
  color: #ff6b6b;
  flex-shrink: 0;
}

.ritual-info {
  flex: 1;
}

.ritual-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.ritual-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.ritual-meta {
  display: flex;
  gap: 12px;
}

.ritual-type,
.ritual-duration {
  font-size: 12px;
  color: #999;
}

.arrow-icon {
  color: #ccc;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #666;
}

.create-memorial-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  cursor: pointer;
}

/* 创建祭奠弹窗 */
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

.create-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
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
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #07c160;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.submit-btn {
  background: #07c160;
  color: white;
  border: 1px solid #07c160;
}

.submit-btn:hover {
  background: #06a552;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .supplies-grid {
    grid-template-columns: 1fr;
  }

  .function-tab {
    padding: 10px 4px;
  }

  .function-tab span {
    font-size: 10px;
  }

  .activity-meta {
    flex-direction: column;
    gap: 8px;
  }

  .supply-actions {
    flex-direction: column;
  }

  .add-cart-btn,
  .buy-now-btn {
    padding: 8px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
