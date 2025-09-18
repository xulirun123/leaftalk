<template>
  <div class="tomb-sweeping-page">
    <MobileTopBar 
      title="清明扫墓" 
      :showBack="true"
      @back="goBack"
    />

    <div class="sweeping-content scroll-container">
      <!-- 清明节倒计时 -->
      <div class="countdown-section">
        <div class="countdown-card">
          <div class="countdown-header">
            <iconify-icon icon="heroicons:calendar-days" width="24"></iconify-icon>
            <h3>距离清明节还有</h3>
          </div>
          <div class="countdown-timer">
            <div class="time-unit">
              <span class="time-number">{{ countdown.days }}</span>
              <span class="time-label">天</span>
            </div>
            <div class="time-unit">
              <span class="time-number">{{ countdown.hours }}</span>
              <span class="time-label">时</span>
            </div>
            <div class="time-unit">
              <span class="time-number">{{ countdown.minutes }}</span>
              <span class="time-label">分</span>
            </div>
          </div>
          <p class="countdown-desc">传承孝道，缅怀先祖</p>
        </div>
      </div>

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
      <div class="main-content">
        <!-- 扫墓活动 -->
        <div v-if="currentFunction === 'activities'" class="activities-section">
          <h3>扫墓活动 ({{ sweepingActivities.length }})</h3>
          <div v-if="sweepingActivities.length > 0" class="activities-list">
            <div 
              v-for="activity in sweepingActivities" 
              :key="activity.id"
              class="activity-card"
            >
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.description }}</p>
              <p>地点: {{ activity.location }}</p>
              <p>状态: {{ getStatusText(activity.status) }}</p>
              <p>参与人数: {{ activity.participantCount }}</p>
              <p>组织者: {{ activity.organizer }}</p>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无扫墓活动</p>
          </div>
        </div>

        <!-- 虚拟扫墓 -->
        <div v-if="currentFunction === 'virtual'" class="virtual-section">
          <h3>虚拟扫墓 ({{ virtualTombs.length }})</h3>
          <div v-if="virtualTombs.length > 0" class="virtual-list">
            <div v-for="tomb in virtualTombs" :key="tomb.id" class="tomb-card">
              <h4>{{ tomb.name }}</h4>
              <p>地点: {{ tomb.location }}</p>
              <p>访问次数: {{ tomb.visitCount }}</p>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无虚拟墓地</p>
          </div>
        </div>

        <!-- 祭祖分析 -->
        <div v-if="currentFunction === 'analysis'" class="analysis-section">
          <h3>祭祖分析</h3>
          <div class="analysis-content">
            <div class="analysis-card">
              <h4>参与度分析</h4>
              <div class="score-display">
                <span class="score">92</span>
                <span class="score-label">分</span>
              </div>
              <p>家族成员参与祭祖活动的积极性很高</p>
            </div>
            
            <div class="analysis-card">
              <h4>传统保持度</h4>
              <div class="score-display">
                <span class="score">88</span>
                <span class="score-label">分</span>
              </div>
              <p>传统祭祖仪式保持较好</p>
            </div>
            
            <div class="analysis-card">
              <h4>地域分布</h4>
              <div class="score-display">
                <span class="score">75</span>
                <span class="score-label">分</span>
              </div>
              <p>家族成员分布较为分散</p>
            </div>
            
            <button @click="generateAnalysis" class="analysis-btn">生成详细报告</button>
          </div>
        </div>

        <!-- 扫墓用品 -->
        <div v-if="currentFunction === 'supplies'" class="supplies-section">
          <h3>扫墓用品 ({{ supplies.length }})</h3>
          <div v-if="supplies.length > 0" class="supplies-list">
            <div v-for="supply in supplies" :key="supply.id" class="supply-card">
              <h4>{{ supply.name }}</h4>
              <p>{{ supply.description }}</p>
              <p>分类: {{ supply.category }}</p>
              <p>价格: ¥{{ supply.price }}</p>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无扫墓用品</p>
          </div>
        </div>

        <!-- 扫墓指南 -->
        <div v-if="currentFunction === 'guide'" class="guide-section">
          <h3>扫墓指南 ({{ sweepingGuides.length }})</h3>
          <div v-if="sweepingGuides.length > 0" class="guide-list">
            <div v-for="guide in sweepingGuides" :key="guide.id" class="guide-card">
              <h4>{{ guide.title }}</h4>
              <p>{{ guide.description }}</p>
              <button @click="viewGuide(guide)" class="view-guide-btn">查看详情</button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无扫墓指南</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const currentFunction = ref('activities')
const countdownTimer = ref(null)

const functionTabs = ref([
  { label: '扫墓活动', value: 'activities', icon: 'heroicons:users' },
  { label: '虚拟扫墓', value: 'virtual', icon: 'heroicons:computer-desktop' },
  { label: '祭祖分析', value: 'analysis', icon: 'heroicons:chart-bar' },
  { label: '扫墓用品', value: 'supplies', icon: 'heroicons:shopping-bag' },
  { label: '扫墓指南', value: 'guide', icon: 'heroicons:book-open' }
])

const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0
})

const sweepingActivities = ref([
  {
    id: 1,
    title: '张氏家族清明扫墓活动',
    description: '组织家族成员集体扫墓，缅怀先祖，传承家风',
    location: '北京市昌平区天寿陵园',
    status: 'upcoming',
    participantCount: 25,
    organizer: '张伟'
  }
])

const virtualTombs = ref([
  {
    id: 1,
    name: '张三之墓',
    location: '北京市昌平区天寿陵园',
    visitCount: 156
  }
])

const supplies = ref([
  {
    id: 1,
    name: '白菊花束',
    description: '精选白菊花，表达对先人的哀思',
    category: '鲜花',
    price: 50
  },
  {
    id: 2,
    name: '香烛套装',
    description: '传统香烛，用于祭祀仪式',
    category: '香烛',
    price: 30
  }
])

const sweepingGuides = ref([
  {
    id: 1,
    title: '扫墓礼仪指南',
    description: '了解传统扫墓礼仪和注意事项'
  },
  {
    id: 2,
    title: '清明节习俗介绍',
    description: '深入了解清明节的历史文化背景'
  }
])

// 生命周期
onMounted(() => {
  updateCountdown()
  countdownTimer.value = setInterval(updateCountdown, 60000) // 每分钟更新一次
})

onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})

// 方法
const goBack = () => {
  router.back()
}

const setFunction = (func: string) => {
  currentFunction.value = func
}

const updateCountdown = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  let qingming = new Date(currentYear, 3, 4) // 4月4日（大概的清明节日期）
  
  // 如果今年的清明节已过，计算明年的
  if (now > qingming) {
    qingming = new Date(currentYear + 1, 3, 4)
  }
  
  const diff = qingming.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  countdown.value = { days, hours, minutes }
}

const getStatusText = (status: string) => {
  const statusMap = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束'
  }
  return statusMap[status] || status
}

const generateAnalysis = () => {
  appStore.showToast('正在生成详细分析报告...', 'info')
  // 可以跳转到详细分析页面
}

const viewGuide = (guide) => {
  appStore.showToast(`查看指南：${guide.title}`, 'info')
  // 可以跳转到指南详情页面
}
</script>

<style scoped>
.tomb-sweeping-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.sweeping-content {
  padding: 16px;
  height: calc(100vh - 75px);
  overflow-y: auto;
}

.countdown-section {
  margin-bottom: 16px;
}

.countdown-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  text-align: center;
}

.countdown-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.countdown-header h3 {
  margin: 0;
  font-size: 18px;
}

.countdown-timer {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-number {
  font-size: 24px;
  font-weight: bold;
}

.time-label {
  font-size: 12px;
  opacity: 0.8;
}

.countdown-desc {
  margin: 0;
  opacity: 0.9;
}

.function-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.function-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.function-tab.active {
  background: #07C160;
  color: white;
}

.function-tab span {
  font-size: 10px;
  text-align: center;
}

.main-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.main-content h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.activities-list,
.virtual-list,
.supplies-list,
.guide-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-card,
.tomb-card,
.supply-card,
.guide-card {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.activity-card h4,
.tomb-card h4,
.supply-card h4,
.guide-card h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
  font-weight: bold;
}

.activity-card p,
.tomb-card p,
.supply-card p,
.guide-card p {
  margin: 4px 0;
  color: #666;
  font-size: 12px;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.analysis-card h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
}

.score-display {
  margin-bottom: 8px;
}

.score {
  font-size: 32px;
  font-weight: bold;
  color: #07C160;
}

.score-label {
  font-size: 14px;
  color: #666;
  margin-left: 4px;
}

.analysis-card p {
  margin: 0;
  color: #666;
  font-size: 12px;
}

.analysis-btn,
.view-guide-btn {
  padding: 10px 20px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state p {
  margin: 0;
}
</style>
