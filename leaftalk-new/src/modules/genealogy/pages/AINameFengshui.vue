<template>
  <div class="ai-name-fengshui-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="AI取名风水" 
      :showBack="true"
      @back="goBack"
    />

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
    <div class="ai-content">
      <!-- AI取名 -->
      <div v-if="currentFunction === 'naming'" class="naming-section">
        <div class="service-intro">
          <div class="intro-card">
            <iconify-icon icon="heroicons:sparkles" width="32" class="intro-icon"></iconify-icon>
            <h3>AI智能取名</h3>
            <p>基于传统文化和现代算法，为您的孩子推荐寓意美好的名字</p>
          </div>
        </div>

        <div class="naming-form">
          <div class="form-card">
            <h4>基本信息</h4>
            <div class="form-group">
              <label>姓氏</label>
              <input 
                v-model="namingForm.surname"
                type="text"
                placeholder="请输入姓氏"
                required
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>性别</label>
                <select v-model="namingForm.gender" required>
                  <option value="">请选择</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div class="form-group">
                <label>出生日期</label>
                <input 
                  v-model="namingForm.birthDate"
                  type="date"
                  required
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>出生时间</label>
                <input 
                  v-model="namingForm.birthTime"
                  type="time"
                  required
                />
              </div>
              <div class="form-group">
                <label>出生地点</label>
                <input 
                  v-model="namingForm.birthPlace"
                  type="text"
                  placeholder="请输入出生地点"
                  required
                />
              </div>
            </div>
          </div>

          <div class="form-card">
            <h4>取名偏好</h4>
            <div class="form-group">
              <label>期望寓意</label>
              <div class="meaning-options">
                <div 
                  v-for="meaning in meaningOptions" 
                  :key="meaning.value"
                  class="meaning-option"
                  :class="{ active: namingForm.meanings.includes(meaning.value) }"
                  @click="toggleMeaning(meaning.value)"
                >
                  <iconify-icon :icon="meaning.icon" width="16"></iconify-icon>
                  <span>{{ meaning.label }}</span>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>字数偏好</label>
              <div class="length-options">
                <div 
                  v-for="length in lengthOptions" 
                  :key="length.value"
                  class="length-option"
                  :class="{ active: namingForm.nameLength === length.value }"
                  @click="namingForm.nameLength = length.value"
                >
                  {{ length.label }}
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>避讳字符</label>
              <input 
                v-model="namingForm.avoidChars"
                type="text"
                placeholder="请输入需要避开的字符（可选）"
              />
            </div>
          </div>

          <button @click="generateNames" class="generate-btn" :disabled="isGenerating">
            <iconify-icon icon="heroicons:sparkles" width="16"></iconify-icon>
            {{ isGenerating ? '生成中...' : 'AI智能取名' }}
          </button>
        </div>

        <!-- 取名结果 -->
        <div v-if="nameResults.length > 0" class="name-results">
          <h4>推荐名字</h4>
          <div class="names-list">
            <div 
              v-for="name in nameResults" 
              :key="name.id"
              class="name-card"
              @click="viewNameDetail(name)"
            >
              <div class="name-header">
                <h5>{{ name.fullName }}</h5>
                <div class="name-score" :class="getScoreClass(name.score)">
                  {{ name.score }}分
                </div>
              </div>
              <div class="name-meaning">{{ name.meaning }}</div>
              <div class="name-analysis">
                <div class="analysis-item">
                  <span class="label">五行：</span>
                  <span>{{ name.wuxing }}</span>
                </div>
                <div class="analysis-item">
                  <span class="label">笔画：</span>
                  <span>{{ name.strokes }}</span>
                </div>
                <div class="analysis-item">
                  <span class="label">音律：</span>
                  <span>{{ name.phonetics }}</span>
                </div>
              </div>
              <div class="name-actions">
                <button @click.stop="saveName(name)" class="action-btn">
                  <iconify-icon icon="heroicons:heart" width="14"></iconify-icon>
                  收藏
                </button>
                <button @click.stop="shareName(name)" class="action-btn">
                  <iconify-icon icon="heroicons:share" width="14"></iconify-icon>
                  分享
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 风水建议 -->
      <div v-if="currentFunction === 'fengshui'" class="fengshui-section">
        <div class="service-intro">
          <div class="intro-card">
            <iconify-icon icon="heroicons:home" width="32" class="intro-icon"></iconify-icon>
            <h3>AI风水建议</h3>
            <p>基于传统风水理论，为您的居住环境提供专业建议</p>
          </div>
        </div>

        <div class="fengshui-services">
          <div 
            v-for="service in fengShuiServices" 
            :key="service.id"
            class="service-card"
            @click="selectService(service)"
          >
            <div class="service-icon">
              <iconify-icon :icon="service.icon" width="32"></iconify-icon>
            </div>
            <div class="service-info">
              <h4>{{ service.title }}</h4>
              <p>{{ service.description }}</p>
              <div class="service-price">
                <span v-if="service.price === 0" class="free">免费咨询</span>
                <span v-else class="paid">¥{{ service.price }}</span>
              </div>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 历史记录 -->
      <div v-if="currentFunction === 'history'" class="history-section">
        <div class="history-tabs">
          <div 
            v-for="tab in historyTabs" 
            :key="tab.value"
            class="history-tab"
            :class="{ active: currentHistoryTab === tab.value }"
            @click="setHistoryTab(tab.value)"
          >
            <iconify-icon :icon="tab.icon" width="16"></iconify-icon>
            <span>{{ tab.label }}</span>
          </div>
        </div>

        <div class="history-list">
          <div 
            v-for="record in filteredHistory" 
            :key="record.id"
            class="history-card"
            @click="viewHistoryDetail(record)"
          >
            <div class="history-header">
              <div class="history-info">
                <h4>{{ record.title }}</h4>
                <p class="history-type">{{ getHistoryTypeText(record.type) }}</p>
              </div>
              <div class="history-time">{{ formatDate(record.createTime) }}</div>
            </div>
            <div class="history-content">{{ record.content }}</div>
            <div class="history-actions">
              <button @click.stop="viewHistoryDetail(record)" class="action-btn primary">
                <iconify-icon icon="heroicons:eye" width="14"></iconify-icon>
                查看详情
              </button>
              <button @click.stop="deleteHistory(record)" class="action-btn">
                <iconify-icon icon="heroicons:trash" width="14"></iconify-icon>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 专家咨询 -->
      <div v-if="currentFunction === 'expert'" class="expert-section">
        <div class="expert-intro">
          <div class="intro-card">
            <iconify-icon icon="heroicons:user-group" width="32" class="intro-icon"></iconify-icon>
            <h3>专家在线咨询</h3>
            <p>与资深命理师和风水大师一对一咨询</p>
          </div>
        </div>

        <div class="experts-list">
          <div 
            v-for="expert in experts" 
            :key="expert.id"
            class="expert-card"
            @click="consultExpert(expert)"
          >
            <div class="expert-avatar">
              <img :src="expert.avatar" :alt="expert.name" />
              <div class="expert-status" :class="expert.status">
                {{ expert.status === 'online' ? '在线' : '离线' }}
              </div>
            </div>
            <div class="expert-info">
              <h4>{{ expert.name }}</h4>
              <p class="expert-title">{{ expert.title }}</p>
              <div class="expert-specialties">
                <span 
                  v-for="specialty in expert.specialties" 
                  :key="specialty"
                  class="specialty-tag"
                >
                  {{ specialty }}
                </span>
              </div>
              <div class="expert-stats">
                <div class="stat-item">
                  <iconify-icon icon="heroicons:star" width="12"></iconify-icon>
                  <span>{{ expert.rating }}</span>
                </div>
                <div class="stat-item">
                  <iconify-icon icon="heroicons:users" width="12"></iconify-icon>
                  <span>{{ expert.consultCount }}次咨询</span>
                </div>
                <div class="stat-item">
                  <iconify-icon icon="heroicons:clock" width="12"></iconify-icon>
                  <span>{{ expert.experience }}年经验</span>
                </div>
              </div>
            </div>
            <div class="expert-price">
              <span class="price">¥{{ expert.price }}/次</span>
              <button @click.stop="consultExpert(expert)" class="consult-btn" :disabled="expert.status === 'offline'">
                {{ expert.status === 'online' ? '立即咨询' : '预约咨询' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="shouldShowEmpty" class="empty-state">
        <iconify-icon :icon="getEmptyIcon()" width="48" class="empty-icon"></iconify-icon>
        <h3>{{ getEmptyTitle() }}</h3>
        <p>{{ getEmptyDesc() }}</p>
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
const currentFunction = ref('naming')
const currentHistoryTab = ref('naming')
const isGenerating = ref(false)

const functionTabs = ref([
  { label: 'AI取名', value: 'naming', icon: 'heroicons:sparkles' },
  { label: '风水建议', value: 'fengshui', icon: 'heroicons:home' },
  { label: '历史记录', value: 'history', icon: 'heroicons:clock' },
  { label: '专家咨询', value: 'expert', icon: 'heroicons:user-group' }
])

const historyTabs = ref([
  { label: '取名记录', value: 'naming', icon: 'heroicons:sparkles' },
  { label: '风水记录', value: 'fengshui', icon: 'heroicons:home' }
])

const namingForm = ref({
  surname: '',
  gender: '',
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  meanings: [],
  nameLength: 2,
  avoidChars: ''
})

const meaningOptions = ref([
  { label: '聪明智慧', value: 'wisdom', icon: 'heroicons:light-bulb' },
  { label: '健康平安', value: 'health', icon: 'heroicons:heart' },
  { label: '事业成功', value: 'career', icon: 'heroicons:trophy' },
  { label: '财富富贵', value: 'wealth', icon: 'heroicons:banknotes' },
  { label: '品德高尚', value: 'virtue', icon: 'heroicons:academic-cap' },
  { label: '美丽优雅', value: 'beauty', icon: 'heroicons:sparkles' }
])

const lengthOptions = ref([
  { label: '两字', value: 2 },
  { label: '三字', value: 3 },
  { label: '不限', value: 0 }
])

const nameResults = ref([])

const fengShuiServices = ref([
  {
    id: 1,
    title: '住宅风水分析',
    description: '分析住宅格局，提供风水改善建议',
    icon: 'heroicons:home',
    price: 0
  },
  {
    id: 2,
    title: '办公室风水布局',
    description: '优化办公环境，提升事业运势',
    icon: 'heroicons:building-office',
    price: 99
  },
  {
    id: 3,
    title: '商铺选址建议',
    description: '选择旺财旺运的商铺位置',
    icon: 'heroicons:building-storefront',
    price: 199
  }
])

const historyRecords = ref([
  {
    id: 1,
    title: '张小宝取名咨询',
    type: 'naming',
    content: '为男孩张小宝推荐了5个寓意美好的名字',
    createTime: new Date('2024-01-15')
  }
])

const experts = ref([
  {
    id: 1,
    name: '李大师',
    title: '资深命理师',
    avatar: '/experts/master-li.jpg',
    status: 'online',
    specialties: ['八字命理', '姓名学', '风水布局'],
    rating: 4.9,
    consultCount: 1256,
    experience: 20,
    price: 299
  }
])

// 计算属性
const filteredHistory = computed(() => {
  return historyRecords.value.filter(record => record.type === currentHistoryTab.value)
})

const shouldShowEmpty = computed(() => {
  if (currentFunction.value === 'history') return filteredHistory.value.length === 0
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
    // 加载AI取名风水数据
    console.log('加载AI取名风水数据')
  } catch (error) {
    console.error('加载数据失败:', error)
    appStore.showToast('加载数据失败', 'error')
  }
}

const setFunction = (func: string) => {
  currentFunction.value = func
}

const setHistoryTab = (tab: string) => {
  currentHistoryTab.value = tab
}

const toggleMeaning = (meaning: string) => {
  const index = namingForm.value.meanings.indexOf(meaning)
  if (index > -1) {
    namingForm.value.meanings.splice(index, 1)
  } else {
    namingForm.value.meanings.push(meaning)
  }
}

const generateNames = async () => {
  if (!namingForm.value.surname || !namingForm.value.gender || !namingForm.value.birthDate) {
    appStore.showToast('请填写完整的基本信息', 'error')
    return
  }

  isGenerating.value = true
  try {
    // 模拟AI取名过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    nameResults.value = [
      {
        id: 1,
        fullName: `${namingForm.value.surname}子轩`,
        meaning: '子：有学问、有德行的人；轩：气宇轩昂，寓意孩子将来有学问有品德',
        wuxing: '水木',
        strokes: '3+10',
        phonetics: '平仄',
        score: 95
      },
      {
        id: 2,
        fullName: `${namingForm.value.surname}梓涵`,
        meaning: '梓：生机勃勃，茁壮成长；涵：包容，涵养，寓意孩子心胸宽广',
        wuxing: '木水',
        strokes: '11+12',
        phonetics: '仄平',
        score: 92
      }
    ]
    
    appStore.showToast('取名完成', 'success')
  } catch (error) {
    appStore.showToast('取名失败', 'error')
  } finally {
    isGenerating.value = false
  }
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'fair'
  return 'poor'
}

const viewNameDetail = (name: any) => {
  router.push(`/genealogy/${genealogyId.value}/ai-naming/detail/${name.id}`)
}

const saveName = (name: any) => {
  appStore.showToast('已收藏到我的取名记录', 'success')
}

const shareName = (name: any) => {
  if (navigator.share) {
    navigator.share({
      title: `推荐名字：${name.fullName}`,
      text: name.meaning
    })
  } else {
    appStore.showToast('分享功能开发中', 'info')
  }
}

const selectService = (service: any) => {
  if (service.price === 0) {
    router.push(`/genealogy/${genealogyId.value}/fengshui/${service.id}`)
  } else {
    router.push(`/genealogy/${genealogyId.value}/fengshui/order/${service.id}`)
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const getHistoryTypeText = (type: string) => {
  const typeMap = {
    naming: 'AI取名',
    fengshui: '风水建议'
  }
  return typeMap[type] || type
}

const viewHistoryDetail = (record: any) => {
  router.push(`/genealogy/${genealogyId.value}/ai-history/${record.id}`)
}

const deleteHistory = (record: any) => {
  const index = historyRecords.value.indexOf(record)
  if (index > -1) {
    historyRecords.value.splice(index, 1)
    appStore.showToast('已删除', 'success')
  }
}

const consultExpert = (expert: any) => {
  if (expert.status === 'online') {
    router.push(`/genealogy/${genealogyId.value}/expert-consult/${expert.id}`)
  } else {
    router.push(`/genealogy/${genealogyId.value}/expert-appointment/${expert.id}`)
  }
}

const getEmptyIcon = () => {
  const iconMap = {
    naming: 'heroicons:sparkles',
    fengshui: 'heroicons:home',
    history: 'heroicons:clock',
    expert: 'heroicons:user-group'
  }
  return iconMap[currentFunction.value] || 'heroicons:exclamation-triangle'
}

const getEmptyTitle = () => {
  const titleMap = {
    naming: '开始AI取名',
    fengshui: '选择风水服务',
    history: '暂无历史记录',
    expert: '暂无专家信息'
  }
  return titleMap[currentFunction.value] || '暂无数据'
}

const getEmptyDesc = () => {
  const descMap = {
    naming: '填写基本信息，开始AI智能取名',
    fengshui: '选择您需要的风水咨询服务',
    history: '您还没有任何咨询记录',
    expert: '专家信息加载中'
  }
  return descMap[currentFunction.value] || '请稍后再试'
}
</script>

<style scoped>
.ai-name-fengshui-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
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
.ai-content {
  padding: 16px;
}

/* 服务介绍 */
.service-intro {
  margin-bottom: 20px;
}

.intro-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: white;
}

.intro-icon {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.intro-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.intro-card p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* AI取名表单 */
.naming-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.form-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
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
.form-group select {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #07c160;
}

.meaning-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.meaning-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.meaning-option.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.length-options {
  display: flex;
  gap: 8px;
}

.length-option {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.length-option.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 取名结果 */
.name-results {
  margin-top: 20px;
}

.name-results h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.names-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.name-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.name-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.name-header h5 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.name-score {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.name-score.excellent {
  background: #07c160;
}

.name-score.good {
  background: #ff9500;
}

.name-score.fair {
  background: #ffcc00;
}

.name-score.poor {
  background: #ff3b30;
}

.name-meaning {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12px;
}

.name-analysis {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.analysis-item {
  display: flex;
  font-size: 12px;
  color: #666;
}

.analysis-item .label {
  font-weight: 500;
  margin-right: 4px;
}

.name-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 6px 12px;
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

/* 风水服务 */
.fengshui-services {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.service-icon {
  color: #07c160;
  flex-shrink: 0;
}

.service-info {
  flex: 1;
}

.service-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.service-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.service-price .free {
  color: #07c160;
  font-weight: 600;
  font-size: 14px;
}

.service-price .paid {
  color: #ff9500;
  font-weight: 600;
  font-size: 14px;
}

.arrow-icon {
  color: #ccc;
}

/* 历史记录 */
.history-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: white;
  border-radius: 12px;
  padding: 4px;
}

.history-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #666;
}

.history-tab.active {
  background: #07c160;
  color: white;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.history-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.history-type {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.history-time {
  font-size: 12px;
  color: #999;
}

.history-content {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12px;
}

.history-actions {
  display: flex;
  gap: 8px;
}

/* 专家咨询 */
.expert-intro {
  margin-bottom: 20px;
}

.experts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.expert-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.expert-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.expert-avatar {
  position: relative;
  flex-shrink: 0;
}

.expert-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.expert-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  font-size: 0;
}

.expert-status.online {
  background: #07c160;
}

.expert-status.offline {
  background: #999;
}

.expert-info {
  flex: 1;
}

.expert-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.expert-title {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.expert-specialties {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.specialty-tag {
  padding: 2px 6px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
}

.expert-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #999;
}

.expert-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.price {
  font-size: 16px;
  color: #ff9500;
  font-weight: 600;
}

.consult-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.consult-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.consult-btn:hover:not(:disabled) {
  background: #06a552;
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
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .meaning-options {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .function-tab {
    padding: 10px 4px;
  }

  .function-tab span {
    font-size: 10px;
  }

  .name-analysis {
    flex-direction: column;
    gap: 4px;
  }

  .expert-card {
    flex-direction: column;
    text-align: center;
  }

  .expert-price {
    align-items: center;
  }
}
</style>
