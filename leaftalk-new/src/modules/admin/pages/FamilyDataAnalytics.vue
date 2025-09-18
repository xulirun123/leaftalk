<template>
  <div class="family-data-analytics">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">家族数据分析</h1>
      <button @click="exportReport" class="export-btn">
        <iconify-icon icon="heroicons:arrow-down-tray" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 分析概览 -->
    <div class="analytics-overview">
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-icon">
            <iconify-icon icon="heroicons:users" width="24"></iconify-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ familyStats.totalMembers }}</div>
            <div class="card-label">家族成员</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon">
            <iconify-icon icon="heroicons:map-pin" width="24"></iconify-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ familyStats.totalRegions }}</div>
            <div class="card-label">分布地区</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon">
            <iconify-icon icon="heroicons:academic-cap" width="24"></iconify-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ familyStats.avgEducation }}</div>
            <div class="card-label">平均学历</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon">
            <iconify-icon icon="heroicons:currency-dollar" width="24"></iconify-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ familyStats.avgIncome }}</div>
            <div class="card-label">平均收入</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析维度选择 -->
    <div class="analysis-tabs">
      <div class="tab-list">
        <button 
          v-for="tab in analysisTabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-btn"
        >
          <iconify-icon :icon="tab.icon" width="16"></iconify-icon>
          <span>{{ tab.name }}</span>
        </button>
      </div>
    </div>

    <!-- 分析内容 -->
    <div class="analysis-content">
      <!-- 人口结构分析 -->
      <div v-if="activeTab === 'population'" class="analysis-section">
        <div class="section-title">
          <h3>人口结构分析</h3>
          <div class="chart-controls">
            <select v-model="populationView" @change="updatePopulationChart">
              <option value="age">年龄分布</option>
              <option value="gender">性别比例</option>
              <option value="generation">世代分布</option>
              <option value="marital">婚姻状况</option>
            </select>
          </div>
        </div>
        
        <div class="chart-container">
          <canvas ref="populationChart" width="300" height="200"></canvas>
        </div>
        
        <div class="insights">
          <div class="insight-item">
            <iconify-icon icon="heroicons:light-bulb" width="16"></iconify-icon>
            <span>{{ populationInsights.primary }}</span>
          </div>
          <div class="insight-item">
            <iconify-icon icon="heroicons:exclamation-triangle" width="16"></iconify-icon>
            <span>{{ populationInsights.warning }}</span>
          </div>
        </div>
      </div>

      <!-- 地理分布分析 -->
      <div v-if="activeTab === 'geography'" class="analysis-section">
        <div class="section-title">
          <h3>地理分布分析</h3>
          <div class="chart-controls">
            <select v-model="geographyView" @change="updateGeographyChart">
              <option value="province">省份分布</option>
              <option value="city">城市分布</option>
              <option value="migration">迁移趋势</option>
            </select>
          </div>
        </div>
        
        <div class="geography-stats">
          <div 
            v-for="region in geographyData" 
            :key="region.name"
            class="region-item"
          >
            <div class="region-info">
              <div class="region-name">{{ region.name }}</div>
              <div class="region-count">{{ region.count }}人</div>
            </div>
            <div class="region-bar">
              <div 
                class="bar-fill" 
                :style="{ width: (region.count / geographyData[0].count * 100) + '%' }"
              ></div>
            </div>
            <div class="region-percentage">{{ region.percentage }}%</div>
          </div>
        </div>
        
        <div class="insights">
          <div class="insight-item">
            <iconify-icon icon="heroicons:light-bulb" width="16"></iconify-icon>
            <span>{{ geographyInsights.primary }}</span>
          </div>
          <div class="insight-item">
            <iconify-icon icon="heroicons:information-circle" width="16"></iconify-icon>
            <span>{{ geographyInsights.secondary }}</span>
          </div>
        </div>
      </div>

      <!-- 职业分布分析 -->
      <div v-if="activeTab === 'career'" class="analysis-section">
        <div class="section-title">
          <h3>职业分布分析</h3>
          <div class="chart-controls">
            <select v-model="careerView" @change="updateCareerChart">
              <option value="industry">行业分布</option>
              <option value="position">职位层级</option>
              <option value="income">收入水平</option>
            </select>
          </div>
        </div>
        
        <div class="career-grid">
          <div 
            v-for="career in careerData" 
            :key="career.id"
            class="career-card"
          >
            <div class="career-icon" :style="{ backgroundColor: career.color }">
              <iconify-icon :icon="career.icon" width="20"></iconify-icon>
            </div>
            <div class="career-info">
              <div class="career-name">{{ career.name }}</div>
              <div class="career-count">{{ career.count }}人</div>
              <div class="career-percentage">{{ career.percentage }}%</div>
            </div>
          </div>
        </div>
        
        <div class="insights">
          <div class="insight-item">
            <iconify-icon icon="heroicons:light-bulb" width="16"></iconify-icon>
            <span>{{ careerInsights.primary }}</span>
          </div>
          <div class="insight-item">
            <iconify-icon icon="heroicons:trending-up" width="16"></iconify-icon>
            <span>{{ careerInsights.trend }}</span>
          </div>
        </div>
      </div>

      <!-- 教育水平分析 -->
      <div v-if="activeTab === 'education'" class="analysis-section">
        <div class="section-title">
          <h3>教育水平分析</h3>
          <div class="chart-controls">
            <select v-model="educationView" @change="updateEducationChart">
              <option value="level">学历层次</option>
              <option value="field">专业领域</option>
              <option value="generation">世代对比</option>
            </select>
          </div>
        </div>
        
        <div class="education-pyramid">
          <div 
            v-for="level in educationData" 
            :key="level.id"
            class="education-level"
            :style="{ width: level.percentage + '%' }"
          >
            <div class="level-label">{{ level.name }}</div>
            <div class="level-count">{{ level.count }}人</div>
          </div>
        </div>
        
        <div class="insights">
          <div class="insight-item">
            <iconify-icon icon="heroicons:light-bulb" width="16"></iconify-icon>
            <span>{{ educationInsights.primary }}</span>
          </div>
          <div class="insight-item">
            <iconify-icon icon="heroicons:arrow-trending-up" width="16"></iconify-icon>
            <span>{{ educationInsights.trend }}</span>
          </div>
        </div>
      </div>

      <!-- 财富分析 -->
      <div v-if="activeTab === 'wealth'" class="analysis-section">
        <div class="section-title">
          <h3>财富分析</h3>
          <div class="chart-controls">
            <select v-model="wealthView" @change="updateWealthChart">
              <option value="income">收入分布</option>
              <option value="assets">资产状况</option>
              <option value="investment">投资偏好</option>
            </select>
          </div>
        </div>
        
        <div class="wealth-stats">
          <div class="wealth-summary">
            <div class="summary-item">
              <div class="summary-label">家族总资产</div>
              <div class="summary-value">¥{{ formatMoney(wealthStats.totalAssets) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">平均年收入</div>
              <div class="summary-value">¥{{ formatMoney(wealthStats.avgIncome) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">投资回报率</div>
              <div class="summary-value">{{ wealthStats.roi }}%</div>
            </div>
          </div>
          
          <div class="wealth-distribution">
            <canvas ref="wealthChart" width="300" height="200"></canvas>
          </div>
        </div>
        
        <div class="insights">
          <div class="insight-item">
            <iconify-icon icon="heroicons:light-bulb" width="16"></iconify-icon>
            <span>{{ wealthInsights.primary }}</span>
          </div>
          <div class="insight-item">
            <iconify-icon icon="heroicons:chart-bar" width="16"></iconify-icon>
            <span>{{ wealthInsights.recommendation }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 智能建议 -->
    <div class="smart-recommendations">
      <div class="section-title">
        <h3>智能建议</h3>
        <button @click="refreshRecommendations" class="refresh-btn">
          <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
        </button>
      </div>
      
      <div class="recommendation-list">
        <div 
          v-for="recommendation in recommendations" 
          :key="recommendation.id"
          class="recommendation-item"
          :class="recommendation.priority"
        >
          <div class="recommendation-icon">
            <iconify-icon :icon="recommendation.icon" width="20"></iconify-icon>
          </div>
          <div class="recommendation-content">
            <div class="recommendation-title">{{ recommendation.title }}</div>
            <div class="recommendation-desc">{{ recommendation.description }}</div>
            <div class="recommendation-action">
              <button @click="executeRecommendation(recommendation)" class="action-btn">
                {{ recommendation.actionText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出报告弹窗 -->
    <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
      <div class="export-modal" @click.stop>
        <div class="modal-header">
          <h3>导出分析报告</h3>
          <button @click="showExportModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="export-options">
            <div class="option-group">
              <label>报告格式</label>
              <div class="format-options">
                <label class="radio-option">
                  <input type="radio" v-model="exportFormat" value="pdf" />
                  <span>PDF报告</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="exportFormat" value="excel" />
                  <span>Excel表格</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="exportFormat" value="word" />
                  <span>Word文档</span>
                </label>
              </div>
            </div>
            
            <div class="option-group">
              <label>包含内容</label>
              <div class="content-options">
                <label class="checkbox-option">
                  <input type="checkbox" v-model="exportContent.overview" />
                  <span>概览统计</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" v-model="exportContent.charts" />
                  <span>图表分析</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" v-model="exportContent.insights" />
                  <span>智能洞察</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" v-model="exportContent.recommendations" />
                  <span>建议方案</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showExportModal = false" class="cancel-btn">取消</button>
          <button @click="confirmExport" class="export-btn">导出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.genealogyId as string)

// 状态
const activeTab = ref('population')
const showExportModal = ref(false)

// 视图选择
const populationView = ref('age')
const geographyView = ref('province')
const careerView = ref('industry')
const educationView = ref('level')
const wealthView = ref('income')

// DOM引用
const populationChart = ref<HTMLCanvasElement>()
const wealthChart = ref<HTMLCanvasElement>()

// 导出设置
const exportFormat = ref('pdf')
const exportContent = reactive({
  overview: true,
  charts: true,
  insights: true,
  recommendations: true
})

// 分析标签
const analysisTabs = ref([
  { id: 'population', name: '人口结构', icon: 'heroicons:users' },
  { id: 'geography', name: '地理分布', icon: 'heroicons:map-pin' },
  { id: 'career', name: '职业分布', icon: 'heroicons:briefcase' },
  { id: 'education', name: '教育水平', icon: 'heroicons:academic-cap' },
  { id: 'wealth', name: '财富分析', icon: 'heroicons:currency-dollar' }
])

// 家族统计
const familyStats = ref({
  totalMembers: 0,
  totalRegions: 0,
  avgEducation: '',
  avgIncome: ''
})

// 各维度数据
const geographyData = ref([])
const careerData = ref([])
const educationData = ref([])
const wealthStats = ref({
  totalAssets: 0,
  avgIncome: 0,
  roi: 0
})

// 洞察信息
const populationInsights = ref({
  primary: '',
  warning: ''
})

const geographyInsights = ref({
  primary: '',
  secondary: ''
})

const careerInsights = ref({
  primary: '',
  trend: ''
})

const educationInsights = ref({
  primary: '',
  trend: ''
})

const wealthInsights = ref({
  primary: '',
  recommendation: ''
})

// 智能建议
const recommendations = ref([])

// 生命周期
onMounted(() => {
  loadAnalyticsData()
})

// 方法
const loadAnalyticsData = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/analytics`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        familyStats.value = result.data.overview
        geographyData.value = result.data.geography
        careerData.value = result.data.career
        educationData.value = result.data.education
        wealthStats.value = result.data.wealth
        recommendations.value = result.data.recommendations
        
        // 更新洞察
        updateInsights(result.data.insights)
        
        // 绘制图表
        await nextTick()
        updatePopulationChart()
        updateWealthChart()
      }
    }
  } catch (error) {
    console.error('加载分析数据失败:', error)
    // 使用模拟数据
    loadMockData()
  }
}

const loadMockData = () => {
  familyStats.value = {
    totalMembers: 156,
    totalRegions: 12,
    avgEducation: '本科',
    avgIncome: '15万'
  }
  
  geographyData.value = [
    { name: '广东省', count: 45, percentage: 28.8 },
    { name: '北京市', count: 32, percentage: 20.5 },
    { name: '上海市', count: 28, percentage: 17.9 },
    { name: '浙江省', count: 25, percentage: 16.0 },
    { name: '其他地区', count: 26, percentage: 16.8 }
  ]
  
  careerData.value = [
    { id: 1, name: '科技行业', count: 42, percentage: 26.9, color: '#2196F3', icon: 'heroicons:computer-desktop' },
    { id: 2, name: '金融行业', count: 35, percentage: 22.4, color: '#4CAF50', icon: 'heroicons:banknotes' },
    { id: 3, name: '教育行业', count: 28, percentage: 17.9, color: '#FF9800', icon: 'heroicons:academic-cap' },
    { id: 4, name: '医疗行业', count: 22, percentage: 14.1, color: '#F44336', icon: 'heroicons:heart' },
    { id: 5, name: '其他行业', count: 29, percentage: 18.7, color: '#9C27B0', icon: 'heroicons:briefcase' }
  ]
  
  educationData.value = [
    { id: 1, name: '博士', count: 15, percentage: 9.6 },
    { id: 2, name: '硕士', count: 42, percentage: 26.9 },
    { id: 3, name: '本科', count: 68, percentage: 43.6 },
    { id: 4, name: '专科', count: 23, percentage: 14.7 },
    { id: 5, name: '高中及以下', count: 8, percentage: 5.2 }
  ]
  
  wealthStats.value = {
    totalAssets: 25000000,
    avgIncome: 180000,
    roi: 8.5
  }
  
  recommendations.value = [
    {
      id: 1,
      title: '加强年轻一代联系',
      description: '数据显示年轻成员参与度较低，建议组织更多适合年轻人的活动',
      priority: 'high',
      icon: 'heroicons:users',
      actionText: '查看详情'
    },
    {
      id: 2,
      title: '优化地域分布',
      description: '家族成员主要集中在一线城市，可考虑在其他地区建立联络点',
      priority: 'medium',
      icon: 'heroicons:map-pin',
      actionText: '制定计划'
    }
  ]
  
  updateInsights({
    population: {
      primary: '家族成员年龄结构相对年轻，30-50岁占比最高',
      warning: '需要关注老年成员的健康状况和传承工作'
    },
    geography: {
      primary: '家族成员主要分布在经济发达地区',
      secondary: '广东省是最大的聚集地，占比近30%'
    },
    career: {
      primary: '家族成员职业分布多元化，科技和金融行业占主导',
      trend: '新兴行业从业者比例逐年上升'
    },
    education: {
      primary: '家族整体教育水平较高，本科以上学历占80%',
      trend: '年轻一代教育水平持续提升'
    },
    wealth: {
      primary: '家族财富稳步增长，投资回报率良好',
      recommendation: '建议增加多元化投资，降低风险'
    }
  })
}

const updateInsights = (insights) => {
  populationInsights.value = insights.population
  geographyInsights.value = insights.geography
  careerInsights.value = insights.career
  educationInsights.value = insights.education
  wealthInsights.value = insights.wealth
}

const updatePopulationChart = () => {
  // 简化的图表绘制逻辑
  // 在实际项目中可以使用 Chart.js 或其他图表库
}

const updateGeographyChart = () => {
  // 地理分布图表更新
}

const updateCareerChart = () => {
  // 职业分布图表更新
}

const updateEducationChart = () => {
  // 教育水平图表更新
}

const updateWealthChart = () => {
  // 财富分析图表更新
}

const refreshRecommendations = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/analytics/recommendations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        recommendations.value = result.data
        appStore.showToast('建议已更新', 'success')
      }
    }
  } catch (error) {
    console.error('刷新建议失败:', error)
  }
}

const executeRecommendation = (recommendation) => {
  // 执行建议的具体操作
  appStore.showToast(`正在执行：${recommendation.title}`, 'info')
}

const exportReport = () => {
  showExportModal.value = true
}

const confirmExport = async () => {
  try {
    appStore.showLoading('生成报告中...')
    
    const exportData = {
      format: exportFormat.value,
      content: exportContent,
      genealogyId: genealogyId.value
    }
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/analytics/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(exportData)
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `家族分析报告.${exportFormat.value}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      appStore.showToast('报告导出成功', 'success')
      showExportModal.value = false
    }
  } catch (error) {
    console.error('导出报告失败:', error)
    appStore.showToast('导出失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 辅助方法
const formatMoney = (amount) => {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(1) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toLocaleString()
}
</script>

<style scoped>
.family-data-analytics {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
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

.back-btn, .export-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
}

.export-btn {
  background: #07c160;
  color: white;
  border-radius: 8px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 分析概览 */
.analytics-overview {
  margin: 16px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.card-label {
  font-size: 12px;
  color: #666;
}

/* 分析标签 */
.analysis-tabs {
  margin: 0 16px 16px;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.tab-list {
  display: flex;
  overflow-x: auto;
  gap: 4px;
}

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn.active {
  background: #07c160;
  color: white;
}

/* 分析内容 */
.analysis-content {
  margin: 0 16px 16px;
}

.analysis-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-controls select {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: #666;
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
}

/* 地理分布 */
.geography-stats {
  margin-bottom: 16px;
}

.region-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.region-info {
  min-width: 80px;
}

.region-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.region-count {
  font-size: 12px;
  color: #666;
}

.region-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 4px;
}

.region-percentage {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: right;
}

/* 职业分布 */
.career-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.career-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.career-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.career-info {
  flex: 1;
}

.career-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.career-count {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.career-percentage {
  font-size: 12px;
  color: #999;
}

/* 教育水平 */
.education-pyramid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.education-level {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border-radius: 4px;
  margin-left: auto;
}

.level-label {
  font-size: 14px;
  font-weight: 500;
}

.level-count {
  font-size: 12px;
}

/* 财富分析 */
.wealth-stats {
  margin-bottom: 16px;
}

.wealth-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  text-align: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.summary-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.wealth-distribution {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  border-radius: 8px;
}

/* 洞察信息 */
.insights {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: rgba(7, 193, 96, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: #333;
}

.insight-item iconify-icon {
  color: #07c160;
  margin-top: 2px;
}

/* 智能建议 */
.smart-recommendations {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.refresh-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #ddd;
}

.recommendation-item.high {
  border-left-color: #f44336;
  background: rgba(244, 67, 54, 0.05);
}

.recommendation-item.medium {
  border-left-color: #ff9800;
  background: rgba(255, 152, 0, 0.05);
}

.recommendation-item.low {
  border-left-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}

.recommendation-icon {
  width: 32px;
  height: 32px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  flex-shrink: 0;
}

.recommendation-content {
  flex: 1;
}

.recommendation-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.recommendation-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.recommendation-action {
  margin-top: 8px;
}

.action-btn {
  padding: 4px 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.export-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.format-options,
.content-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.radio-option input[type="radio"],
.checkbox-option input[type="checkbox"] {
  accent-color: #07c160;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.export-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}
</style>
