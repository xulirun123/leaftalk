<template>
  <div class="data-statistics-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="数据统计" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 主要内容 -->
    <div class="statistics-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载统计数据中...</p>
      </div>

      <!-- 统计数据 -->
      <div v-else class="statistics-sections">
        <!-- 总体概览 -->
        <div class="overview-section">
          <h3>总体概览</h3>
          <div class="overview-grid">
            <div class="stat-card primary">
              <div class="stat-icon">
                <iconify-icon icon="heroicons:users" width="24"></iconify-icon>
              </div>
              <div class="stat-info">
                <h4>{{ statistics.totalMembers }}</h4>
                <p>总成员数</p>
                <span class="trend positive" v-if="statistics.memberGrowth > 0">
                  +{{ statistics.memberGrowth }}
                </span>
              </div>
            </div>
            <div class="stat-card secondary">
              <div class="stat-icon">
                <iconify-icon icon="heroicons:chart-bar" width="24"></iconify-icon>
              </div>
              <div class="stat-info">
                <h4>{{ statistics.totalGenerations }}</h4>
                <p>世代数</p>
              </div>
            </div>
            <div class="stat-card success">
              <div class="stat-icon">
                <iconify-icon icon="heroicons:calendar-days" width="24"></iconify-icon>
              </div>
              <div class="stat-info">
                <h4>{{ statistics.totalActivities }}</h4>
                <p>活动总数</p>
                <span class="trend positive" v-if="statistics.activityGrowth > 0">
                  +{{ statistics.activityGrowth }}
                </span>
              </div>
            </div>
            <div class="stat-card warning">
              <div class="stat-icon">
                <iconify-icon icon="heroicons:book-open" width="24"></iconify-icon>
              </div>
              <div class="stat-info">
                <h4>{{ statistics.totalStories }}</h4>
                <p>故事总数</p>
                <span class="trend positive" v-if="statistics.storyGrowth > 0">
                  +{{ statistics.storyGrowth }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 成员分析 -->
        <div class="analysis-section">
          <h3>成员分析</h3>
          <div class="analysis-cards">
            <!-- 性别分布 -->
            <div class="analysis-card">
              <h4>性别分布</h4>
              <div class="gender-chart">
                <div class="gender-item">
                  <div class="gender-bar male" :style="{ width: getMalePercentage() + '%' }"></div>
                  <span class="gender-label">男性 {{ statistics.maleCount }}人 ({{ getMalePercentage() }}%)</span>
                </div>
                <div class="gender-item">
                  <div class="gender-bar female" :style="{ width: getFemalePercentage() + '%' }"></div>
                  <span class="gender-label">女性 {{ statistics.femaleCount }}人 ({{ getFemalePercentage() }}%)</span>
                </div>
              </div>
            </div>

            <!-- 世代分布 -->
            <div class="analysis-card">
              <h4>世代分布</h4>
              <div class="generation-chart">
                <div 
                  v-for="gen in statistics.generationDistribution" 
                  :key="gen.generation"
                  class="generation-item"
                >
                  <span class="generation-label">第{{ getChineseNumber(gen.generation) }}世</span>
                  <div class="generation-bar">
                    <div 
                      class="generation-fill" 
                      :style="{ width: getGenerationPercentage(gen.count) + '%' }"
                    ></div>
                  </div>
                  <span class="generation-count">{{ gen.count }}人</span>
                </div>
              </div>
            </div>

            <!-- 年龄分布 -->
            <div class="analysis-card">
              <h4>年龄分布</h4>
              <div class="age-chart">
                <div 
                  v-for="age in statistics.ageDistribution" 
                  :key="age.range"
                  class="age-item"
                >
                  <span class="age-label">{{ age.range }}</span>
                  <div class="age-bar">
                    <div 
                      class="age-fill" 
                      :style="{ width: getAgePercentage(age.count) + '%' }"
                    ></div>
                  </div>
                  <span class="age-count">{{ age.count }}人</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 活跃度分析 -->
        <div class="activity-section">
          <h3>活跃度分析</h3>
          <div class="activity-stats">
            <div class="activity-card">
              <h4>活跃成员</h4>
              <div class="activity-number">{{ statistics.activeMembers }}</div>
              <p>最近30天内有活动</p>
            </div>
            <div class="activity-card">
              <h4>参与率</h4>
              <div class="activity-number">{{ getParticipationRate() }}%</div>
              <p>活动平均参与率</p>
            </div>
            <div class="activity-card">
              <h4>内容贡献</h4>
              <div class="activity-number">{{ statistics.contentContributors }}</div>
              <p>发布过故事或相册</p>
            </div>
          </div>
        </div>

        <!-- 增长趋势 -->
        <div class="growth-section">
          <h3>增长趋势</h3>
          <div class="growth-chart">
            <div class="chart-header">
              <h4>成员增长 (最近12个月)</h4>
            </div>
            <div class="chart-content">
              <div class="chart-bars">
                <div 
                  v-for="(month, index) in statistics.monthlyGrowth" 
                  :key="index"
                  class="chart-bar"
                >
                  <div 
                    class="bar-fill" 
                    :style="{ height: getMonthlyGrowthHeight(month.count) + '%' }"
                  ></div>
                  <span class="bar-label">{{ month.month }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 热门内容 -->
        <div class="popular-section">
          <h3>热门内容</h3>
          <div class="popular-items">
            <div class="popular-card">
              <h4>热门故事</h4>
              <div v-if="statistics.popularStories.length === 0" class="empty-content">
                <p>暂无故事</p>
              </div>
              <div v-else class="content-list">
                <div 
                  v-for="story in statistics.popularStories" 
                  :key="story.id"
                  class="content-item"
                  @click="viewStory(story)"
                >
                  <h5>{{ story.title }}</h5>
                  <div class="content-stats">
                    <span>👁 {{ story.viewCount }}</span>
                    <span>❤ {{ story.likeCount }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="popular-card">
              <h4>热门活动</h4>
              <div v-if="statistics.popularActivities.length === 0" class="empty-content">
                <p>暂无活动</p>
              </div>
              <div v-else class="content-list">
                <div 
                  v-for="activity in statistics.popularActivities" 
                  :key="activity.id"
                  class="content-item"
                  @click="viewActivity(activity)"
                >
                  <h5>{{ activity.title }}</h5>
                  <div class="content-stats">
                    <span>👥 {{ activity.participantCount }}人参与</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const loading = ref(false)
const statistics = ref({
  totalMembers: 0,
  totalGenerations: 0,
  totalActivities: 0,
  totalStories: 0,
  memberGrowth: 0,
  activityGrowth: 0,
  storyGrowth: 0,
  maleCount: 0,
  femaleCount: 0,
  activeMembers: 0,
  contentContributors: 0,
  generationDistribution: [],
  ageDistribution: [],
  monthlyGrowth: [],
  popularStories: [],
  popularActivities: []
})

// 生命周期
onMounted(() => {
  loadStatistics()
})

// 方法
const goBack = () => {
  router.back()
}

const loadStatistics = async () => {
  if (!genealogyId.value) return

  loading.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/statistics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        statistics.value = { ...statistics.value, ...result.data }
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    appStore.showToast('加载统计数据失败', 'error')
  } finally {
    loading.value = false
  }
}

const getMalePercentage = () => {
  const total = statistics.value.maleCount + statistics.value.femaleCount
  return total > 0 ? Math.round((statistics.value.maleCount / total) * 100) : 0
}

const getFemalePercentage = () => {
  const total = statistics.value.maleCount + statistics.value.femaleCount
  return total > 0 ? Math.round((statistics.value.femaleCount / total) * 100) : 0
}

const getGenerationPercentage = (count: number) => {
  const maxCount = Math.max(...statistics.value.generationDistribution.map(g => g.count))
  return maxCount > 0 ? (count / maxCount) * 100 : 0
}

const getAgePercentage = (count: number) => {
  const maxCount = Math.max(...statistics.value.ageDistribution.map(a => a.count))
  return maxCount > 0 ? (count / maxCount) * 100 : 0
}

const getMonthlyGrowthHeight = (count: number) => {
  const maxCount = Math.max(...statistics.value.monthlyGrowth.map(m => m.count))
  return maxCount > 0 ? (count / maxCount) * 100 : 0
}

const getParticipationRate = () => {
  if (statistics.value.totalMembers === 0 || statistics.value.totalActivities === 0) return 0
  return Math.round((statistics.value.activeMembers / statistics.value.totalMembers) * 100)
}

const getChineseNumber = (num: number) => {
  const chinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return chinese[num] || num.toString()
}

const viewStory = (story: any) => {
  router.push(`/genealogy/${genealogyId.value}/stories/${story.id}`)
}

const viewActivity = (activity: any) => {
  router.push(`/genealogy/${genealogyId.value}/activities/${activity.id}`)
}
</script>

<style scoped>
.data-statistics-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.statistics-content {
  padding-top: 75px;
  min-height: calc(100vh - 75px);
  padding: 95px 20px 20px;
}

/* 加载状态样式 */
.loading-container {
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

/* 统计区域样式 */
.statistics-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.statistics-sections h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

/* 概览区域样式 */
.overview-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  position: relative;
}

.stat-card.primary {
  background: linear-gradient(135deg, #07c160, #06a552);
  color: white;
}

.stat-card.secondary {
  background: linear-gradient(135deg, #3742fa, #2f3542);
  color: white;
}

.stat-card.success {
  background: linear-gradient(135deg, #2ed573, #1e90ff);
  color: white;
}

.stat-card.warning {
  background: linear-gradient(135deg, #ffa502, #ff6348);
  color: white;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info h4 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
}

.stat-info p {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.trend {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
}

/* 分析区域样式 */
.analysis-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analysis-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.analysis-card h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

/* 性别分布样式 */
.gender-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gender-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gender-bar {
  height: 8px;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.gender-bar.male {
  background: #3742fa;
}

.gender-bar.female {
  background: #ff6b6b;
}

.gender-label {
  font-size: 12px;
  color: #666;
}

/* 世代分布样式 */
.generation-chart, .age-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.generation-item, .age-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.generation-label, .age-label {
  width: 60px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.generation-bar, .age-bar {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.generation-fill {
  height: 100%;
  background: #07c160;
  transition: width 0.3s ease;
}

.age-fill {
  height: 100%;
  background: #ffa502;
  transition: width 0.3s ease;
}

.generation-count, .age-count {
  width: 40px;
  font-size: 12px;
  color: #666;
  text-align: right;
  flex-shrink: 0;
}

/* 活跃度分析样式 */
.activity-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.activity-card {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.activity-number {
  font-size: 24px;
  font-weight: 600;
  color: #07c160;
  margin-bottom: 4px;
}

.activity-card p {
  margin: 0;
  font-size: 10px;
  color: #999;
}

/* 增长趋势样式 */
.growth-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.growth-chart {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.chart-header h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 4px;
  height: 100px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bar-fill {
  width: 100%;
  background: #07c160;
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 8px;
  color: #999;
  transform: rotate(-45deg);
  white-space: nowrap;
}

/* 热门内容样式 */
.popular-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.popular-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.popular-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.popular-card h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.empty-content {
  text-align: center;
  padding: 20px;
  color: #666;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.content-item:hover {
  background: #e9ecef;
}

.content-item h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.content-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}
</style>
