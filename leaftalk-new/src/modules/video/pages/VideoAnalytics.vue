<template>
  <div class="video-analytics">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <h1 class="title">数据分析</h1>
      <button class="export-btn" @click="exportData">
        <iconify-icon icon="heroicons:arrow-down-tray" width="24" style="color: #333;"></iconify-icon>
      </button>
    </div>

    <!-- 时间范围选择 -->
    <div class="time-range-selector">
      <div class="range-tabs">
        <button 
          v-for="range in timeRanges" 
          :key="range.key"
          :class="['range-tab', { active: activeRange === range.key }]"
          @click="activeRange = range.key"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <!-- 核心数据概览 -->
    <div class="overview-stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:eye" width="32" style="color: #07C160;"></iconify-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatNumber(overviewData.totalViews) }}</div>
            <div class="stat-label">总播放量</div>
            <div class="stat-change" :class="{ positive: overviewData.viewsChange > 0 }">
              {{ overviewData.viewsChange > 0 ? '+' : '' }}{{ overviewData.viewsChange }}%
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:heart" width="32" style="color: #FF6B6B;"></iconify-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatNumber(overviewData.totalLikes) }}</div>
            <div class="stat-label">总点赞数</div>
            <div class="stat-change" :class="{ positive: overviewData.likesChange > 0 }">
              {{ overviewData.likesChange > 0 ? '+' : '' }}{{ overviewData.likesChange }}%
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:user-plus" width="32" style="color: #4ECDC4;"></iconify-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatNumber(overviewData.newFollowers) }}</div>
            <div class="stat-label">新增粉丝</div>
            <div class="stat-change" :class="{ positive: overviewData.followersChange > 0 }">
              {{ overviewData.followersChange > 0 ? '+' : '' }}{{ overviewData.followersChange }}%
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <iconify-icon icon="heroicons:share" width="32" style="color: #FFD93D;"></iconify-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatNumber(overviewData.totalShares) }}</div>
            <div class="stat-label">总分享数</div>
            <div class="stat-change" :class="{ positive: overviewData.sharesChange > 0 }">
              {{ overviewData.sharesChange > 0 ? '+' : '' }}{{ overviewData.sharesChange }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div class="trend-charts">
      <div class="chart-section">
        <h3>播放量趋势</h3>
        <div class="chart-container">
          <canvas ref="viewsChart" class="chart-canvas"></canvas>
        </div>
      </div>
      
      <div class="chart-section">
        <h3>互动数据趋势</h3>
        <div class="chart-container">
          <canvas ref="engagementChart" class="chart-canvas"></canvas>
        </div>
      </div>
    </div>

    <!-- 热门视频排行 -->
    <div class="top-videos">
      <h3>热门视频排行</h3>
      <div class="videos-list">
        <div 
          v-for="(video, index) in topVideos" 
          :key="video.id"
          class="video-item"
          @click="viewVideoDetails(video)"
        >
          <div class="video-rank">{{ index + 1 }}</div>
          <div class="video-thumbnail">
            <img :src="video.thumbnailUrl" :alt="video.title" />
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
          </div>
          <div class="video-info">
            <h4 class="video-title">{{ video.title }}</h4>
            <div class="video-stats">
              <span class="stat">{{ formatNumber(video.views) }} 播放</span>
              <span class="stat">{{ formatNumber(video.likeCount) }} 赞</span>
              <span class="stat">{{ video.likeRate }}% 点赞率</span>
            </div>
            <div class="video-date">{{ formatDate(video.createdTime) }}</div>
          </div>
          <div class="video-trend">
            <iconify-icon 
              :icon="video.trend === 'up' ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'" 
              :style="{ color: video.trend === 'up' ? '#07C160' : '#ff4444' }"
              width="20"
            ></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 观众分析 -->
    <div class="audience-analysis">
      <h3>观众分析</h3>
      <div class="analysis-grid">
        <div class="analysis-card">
          <h4>年龄分布</h4>
          <div class="age-chart">
            <div 
              v-for="age in ageDistribution" 
              :key="age.range"
              class="age-bar"
            >
              <div class="age-label">{{ age.range }}</div>
              <div class="age-progress">
                <div class="age-fill" :style="{ width: age.percentage + '%' }"></div>
              </div>
              <div class="age-percentage">{{ age.percentage }}%</div>
            </div>
          </div>
        </div>
        
        <div class="analysis-card">
          <h4>性别分布</h4>
          <div class="gender-chart">
            <div class="gender-item">
              <div class="gender-icon male">♂</div>
              <div class="gender-info">
                <div class="gender-label">男性</div>
                <div class="gender-percentage">{{ genderDistribution.male }}%</div>
              </div>
            </div>
            <div class="gender-item">
              <div class="gender-icon female">♀</div>
              <div class="gender-info">
                <div class="gender-label">女性</div>
                <div class="gender-percentage">{{ genderDistribution.female }}%</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="analysis-card">
          <h4>地区分布</h4>
          <div class="region-chart">
            <div 
              v-for="region in regionDistribution" 
              :key="region.name"
              class="region-item"
            >
              <div class="region-name">{{ region.name }}</div>
              <div class="region-percentage">{{ region.percentage }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 收益分析 -->
    <div class="revenue-analysis">
      <h3>收益分析</h3>
      <div class="revenue-cards">
        <div class="revenue-card">
          <div class="revenue-icon">
            <iconify-icon icon="heroicons:currency-yen" width="24" style="color: #07C160;"></iconify-icon>
          </div>
          <div class="revenue-content">
            <div class="revenue-amount">¥{{ formatMoney(revenueData.totalRevenue) }}</div>
            <div class="revenue-label">总收益</div>
            <div class="revenue-change positive">+{{ revenueData.revenueChange }}%</div>
          </div>
        </div>
        
        <div class="revenue-card">
          <div class="revenue-icon">
            <iconify-icon icon="heroicons:gift" width="24" style="color: #FF6B6B;"></iconify-icon>
          </div>
          <div class="revenue-content">
            <div class="revenue-amount">¥{{ formatMoney(revenueData.giftRevenue) }}</div>
            <div class="revenue-label">礼物收益</div>
            <div class="revenue-change positive">+{{ revenueData.giftChange }}%</div>
          </div>
        </div>
        
        <div class="revenue-card">
          <div class="revenue-icon">
            <iconify-icon icon="heroicons:megaphone" width="24" style="color: #4ECDC4;"></iconify-icon>
          </div>
          <div class="revenue-content">
            <div class="revenue-amount">¥{{ formatMoney(revenueData.adRevenue) }}</div>
            <div class="revenue-label">广告收益</div>
            <div class="revenue-change positive">+{{ revenueData.adChange }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 建议和洞察 -->
    <div class="insights">
      <h3>数据洞察</h3>
      <div class="insights-list">
        <div 
          v-for="insight in dataInsights" 
          :key="insight.id"
          class="insight-item"
          :class="insight.type"
        >
          <div class="insight-icon">
            <iconify-icon :icon="insight.icon" width="24"></iconify-icon>
          </div>
          <div class="insight-content">
            <h4>{{ insight.title }}</h4>
            <p>{{ insight.description }}</p>
            <div class="insight-action" v-if="insight.action">
              <button class="action-btn" @click="handleInsightAction(insight)">
                {{ insight.action }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const activeRange = ref('7days')

const timeRanges = [
  { key: '7days', label: '7天' },
  { key: '30days', label: '30天' },
  { key: '90days', label: '90天' },
  { key: 'year', label: '1年' }
]

// 模拟数据
const overviewData = ref({
  totalViews: 125000,
  viewsChange: 15.2,
  totalLikes: 8500,
  likesChange: 8.5,
  newFollowers: 1250,
  followersChange: 12.3,
  totalShares: 450,
  sharesChange: 5.8
})

const topVideos = ref([
  {
    id: 'video_001',
    title: '叶语企业版使用教程',
    thumbnailUrl: '/images/video-thumb1.jpg',
    duration: 180,
    views: 25000,
    likeCount: 1200,
    likeRate: 4.8,
    createdTime: Date.now() - 86400000 * 3,
    trend: 'up'
  },
  {
    id: 'video_002',
    title: '新功能预览',
    thumbnailUrl: '/images/video-thumb2.jpg',
    duration: 120,
    views: 18000,
    likeCount: 890,
    likeRate: 4.9,
    createdTime: Date.now() - 86400000 * 7,
    trend: 'down'
  }
])

const ageDistribution = ref([
  { range: '18-24', percentage: 35 },
  { range: '25-34', percentage: 40 },
  { range: '35-44', percentage: 20 },
  { range: '45+', percentage: 5 }
])

const genderDistribution = ref({
  male: 45,
  female: 55
})

const regionDistribution = ref([
  { name: '北京', percentage: 25 },
  { name: '上海', percentage: 20 },
  { name: '深圳', percentage: 18 },
  { name: '广州', percentage: 15 },
  { name: '其他', percentage: 22 }
])

const revenueData = ref({
  totalRevenue: 12500,
  revenueChange: 18.5,
  giftRevenue: 8500,
  giftChange: 22.3,
  adRevenue: 4000,
  adChange: 12.8
})

const dataInsights = ref([
  {
    id: 'insight_001',
    type: 'positive',
    icon: 'heroicons:arrow-trending-up',
    title: '播放量增长强劲',
    description: '相比上周，您的视频播放量增长了15.2%，建议保持当前的内容策略。',
    action: '查看详情'
  },
  {
    id: 'insight_002',
    type: 'warning',
    icon: 'heroicons:exclamation-triangle',
    title: '互动率有所下降',
    description: '最近的视频互动率下降了3.2%，建议增加与观众的互动。',
    action: '优化建议'
  },
  {
    id: 'insight_003',
    type: 'info',
    icon: 'heroicons:light-bulb',
    title: '最佳发布时间',
    description: '数据显示，晚上8-10点发布的视频播放量最高。',
    action: '设置提醒'
  }
])

// Refs
const viewsChart = ref(null)
const engagementChart = ref(null)

// 方法
const goBack = () => {
  router.back()
}

const exportData = () => {
  console.log('导出数据')
  // 实现数据导出功能
}

const viewVideoDetails = (video: any) => {
  router.push(`/video-analytics/${video.id}`)
}

const handleInsightAction = (insight: any) => {
  console.log('处理洞察行动:', insight.title)
}

// 工具函数
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString()
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString()
}

// 初始化图表
const initCharts = () => {
  // 这里可以集成Chart.js或其他图表库
  console.log('初始化图表')
}

onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.video-analytics {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .export-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover, .export-btn:hover {
  background: #f0f0f0;
}

.title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.time-range-selector {
  background: white;
  padding: 16px;
  margin-bottom: 12px;
}

.range-tabs {
  display: flex;
  gap: 8px;
}

.range-tab {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.range-tab.active {
  background: #07C160;
  border-color: #07C160;
  color: white;
}

.overview-stats {
  background: white;
  padding: 20px 16px;
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.stat-change {
  font-size: 10px;
  color: #999;
}

.stat-change.positive {
  color: #07C160;
}

.trend-charts {
  background: white;
  padding: 20px 16px;
  margin-bottom: 12px;
}

.chart-section {
  margin-bottom: 24px;
}

.chart-section:last-child {
  margin-bottom: 0;
}

.chart-section h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px 0;
}

.chart-container {
  height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.top-videos {
  background: white;
  padding: 20px 16px;
  margin-bottom: 12px;
}

.top-videos h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px 0;
}

.videos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.video-item:hover {
  background: #f0f0f0;
}

.video-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #07C160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.video-thumbnail {
  position: relative;
  width: 60px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  background: #f0f0f0;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 8px;
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 2px;
}

.video-stats .stat {
  font-size: 10px;
  color: #999;
}

.video-date {
  font-size: 10px;
  color: #999;
}

.audience-analysis {
  background: white;
  padding: 20px 16px;
  margin-bottom: 12px;
}

.audience-analysis h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px 0;
}

.analysis-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.analysis-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.analysis-card h4 {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px 0;
}

.age-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.age-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.age-label {
  width: 50px;
  font-size: 12px;
  color: #666;
}

.age-progress {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.age-fill {
  height: 100%;
  background: #07C160;
}

.age-percentage {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #666;
}

.gender-chart {
  display: flex;
  gap: 16px;
}

.gender-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gender-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
}

.gender-icon.male {
  background: #4ECDC4;
}

.gender-icon.female {
  background: #FF6B6B;
}

.gender-info {
  flex: 1;
}

.gender-label {
  font-size: 12px;
  color: #666;
}

.gender-percentage {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.region-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.region-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.region-name {
  font-size: 12px;
  color: #666;
}

.region-percentage {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.revenue-analysis {
  background: white;
  padding: 20px 16px;
  margin-bottom: 12px;
}

.revenue-analysis h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px 0;
}

.revenue-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.revenue-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.revenue-content {
  flex: 1;
}

.revenue-amount {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.revenue-label {
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
}

.revenue-change {
  font-size: 8px;
  color: #999;
}

.revenue-change.positive {
  color: #07C160;
}

.insights {
  background: white;
  padding: 20px 16px;
}

.insights h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px 0;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #ccc;
}

.insight-item.positive {
  background: #f0f9f0;
  border-left-color: #07C160;
}

.insight-item.warning {
  background: #fff8e1;
  border-left-color: #FFD93D;
}

.insight-item.info {
  background: #e3f2fd;
  border-left-color: #4ECDC4;
}

.insight-content {
  flex: 1;
}

.insight-content h4 {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
}

.insight-content p {
  font-size: 12px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.insight-action {
  margin-top: 8px;
}

.action-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #06a552;
}
</style>
