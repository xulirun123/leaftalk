<template>
  <div class="ai-history-page">
    <MobileTopBar 
      title="AI历史记录"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="ai-history-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="historyRecord" class="history-container">
        <!-- 记录头部 -->
        <div class="history-header">
          <div class="service-info">
            <h1>{{ historyRecord.serviceName }}</h1>
            <p>{{ historyRecord.description }}</p>
            <div class="record-meta">
              <span class="date">{{ formatDate(historyRecord.createDate) }}</span>
              <span class="status" :class="historyRecord.status">{{ getStatusText(historyRecord.status) }}</span>
            </div>
          </div>
        </div>

        <!-- 输入信息 -->
        <div class="input-info-card">
          <h3>输入信息</h3>
          <div class="input-details">
            <div v-for="(value, key) in historyRecord.inputData" :key="key" class="input-item">
              <span class="input-label">{{ getInputLabel(key) }}：</span>
              <span class="input-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- AI分析结果 -->
        <div class="result-card">
          <h3>AI分析结果</h3>
          <div class="result-content">
            <div v-if="historyRecord.results.names" class="names-section">
              <h4>推荐名字</h4>
              <div class="names-list">
                <div v-for="name in historyRecord.results.names" :key="name.name" class="name-item">
                  <div class="name-header">
                    <span class="name-text">{{ name.name }}</span>
                    <span class="name-score">评分：{{ name.score }}</span>
                  </div>
                  <p class="name-meaning">{{ name.meaning }}</p>
                  <div class="name-analysis">
                    <div class="analysis-item">
                      <span class="analysis-label">五行：</span>
                      <span class="analysis-value">{{ name.wuxing }}</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">寓意：</span>
                      <span class="analysis-value">{{ name.implication }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="historyRecord.results.analysis" class="analysis-section">
              <h4>八字分析</h4>
              <div class="analysis-content">
                <p>{{ historyRecord.results.analysis }}</p>
              </div>
            </div>

            <div v-if="historyRecord.results.suggestions" class="suggestions-section">
              <h4>专家建议</h4>
              <div class="suggestions-list">
                <div v-for="(suggestion, index) in historyRecord.results.suggestions" :key="index" class="suggestion-item">
                  <iconify-icon icon="heroicons:light-bulb" width="16"></iconify-icon>
                  <span>{{ suggestion }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="downloadReport" class="action-btn primary">
            <iconify-icon icon="heroicons:document-arrow-down" width="16"></iconify-icon>
            下载报告
          </button>
          <button @click="shareToMoments" class="action-btn secondary">
            <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
            分享到朋友圈
          </button>
          <button @click="reorderService" class="action-btn secondary">
            <iconify-icon icon="heroicons:arrow-path" width="16"></iconify-icon>
            重新下单
          </button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>记录不存在</p>
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
const loading = ref(false)
const historyRecord = ref(null)

// 生命周期
onMounted(() => {
  loadHistoryRecord()
})

// 方法
const goBack = () => {
  router.back()
}

const loadHistoryRecord = async () => {
  loading.value = true
  try {
    // 模拟加载历史记录
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    historyRecord.value = {
      id: route.params.historyId,
      serviceName: 'AI智能取名',
      description: '为宝宝取一个寓意美好的名字',
      createDate: '2024-01-15',
      status: 'completed',
      inputData: {
        surname: '张',
        gender: '男',
        birthDate: '2024-01-01',
        birthTime: '10:30',
        birthPlace: '北京市',
        fatherName: '张伟',
        motherName: '李娜'
      },
      results: {
        names: [
          {
            name: '张瑞轩',
            score: 95,
            meaning: '瑞表示吉祥如意，轩表示气宇轩昂',
            wuxing: '金土土',
            implication: '前程似锦，事业有成'
          },
          {
            name: '张浩然',
            score: 92,
            meaning: '浩表示广阔无边，然表示自然天成',
            wuxing: '水金金',
            implication: '胸怀宽广，自然洒脱'
          },
          {
            name: '张晨曦',
            score: 90,
            meaning: '晨表示清晨时光，曦表示阳光温暖',
            wuxing: '火火火',
            implication: '朝气蓬勃，温暖如阳'
          }
        ],
        analysis: '根据宝宝的出生时间分析，八字中水木较旺，需要金土来平衡。建议选择五行属金土的名字，有利于宝宝的运势发展。',
        suggestions: [
          '名字中宜用五行属金、土的字',
          '避免使用五行属水、木过多的字',
          '可考虑使用寓意吉祥的字词',
          '注意名字的音韵搭配和书写美观'
        ]
      }
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    appStore.showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const getStatusText = (status: string) => {
  const statusMap = {
    completed: '已完成',
    processing: '处理中',
    pending: '待处理'
  }
  return statusMap[status] || status
}

const getInputLabel = (key: string) => {
  const labelMap = {
    surname: '姓氏',
    gender: '性别',
    birthDate: '出生日期',
    birthTime: '出生时间',
    birthPlace: '出生地点',
    fatherName: '父亲姓名',
    motherName: '母亲姓名'
  }
  return labelMap[key] || key
}

const downloadReport = () => {
  appStore.showToast('正在生成报告...', 'info')
  // 模拟下载过程
  setTimeout(() => {
    appStore.showToast('报告已保存到相册', 'success')
  }, 2000)
}

const shareToMoments = () => {
  appStore.showToast('正在分享到叶语朋友圈...', 'info')
  // 跳转到朋友圈发布页面
  setTimeout(() => {
    const content = `刚刚完成了AI智能取名服务，为宝宝取了几个好名字！✨`
    router.push(`/moments/publish?content=${encodeURIComponent(content)}&type=naming`)
  }, 1000)
}

const reorderService = () => {
  // 跳转到服务页面重新下单
  router.push(`/genealogy/${route.params.id}/fengshui/1`)
}
</script>

<style scoped>
.ai-history-page {
  height: 100vh;
  background: #f5f5f5;
}

.ai-history-content {
  padding: 16px;
  height: calc(100vh - 75px);
  overflow-y: auto;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.history-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 20px;
  color: white;
}

.service-info h1 {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.service-info p {
  margin: 0 0 12px 0;
  opacity: 0.9;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date {
  font-size: 14px;
  opacity: 0.8;
}

.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status.completed {
  background: rgba(255, 255, 255, 0.2);
}

.input-info-card,
.result-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.input-info-card h3,
.result-card h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.input-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-item {
  display: flex;
  align-items: center;
}

.input-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.input-value {
  color: #333;
  font-weight: 500;
}

.result-content h4 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.names-section,
.analysis-section,
.suggestions-section {
  margin-bottom: 20px;
}

.names-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.name-item {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
}

.name-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.name-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.name-score {
  font-size: 14px;
  color: #07C160;
  font-weight: 500;
}

.name-meaning {
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.name-analysis {
  display: flex;
  gap: 16px;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.analysis-label {
  color: #999;
}

.analysis-value {
  color: #333;
  font-weight: 500;
}

.analysis-content p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.suggestion-item iconify-icon {
  color: #ff9500;
  margin-top: 2px;
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.action-btn.primary {
  background: #07C160;
  color: white;
}

.action-btn.secondary {
  background: #f0f0f0;
  color: #333;
}
</style>
