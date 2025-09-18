<template>
  <div class="ocr-management">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1 class="nav-title">OCR模型管理</h1>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 主要内容 -->
    <div class="content">
      <!-- 模型状态卡片 -->
      <div class="status-card">
        <h3>模型状态</h3>
        <div class="status-grid">
          <div class="status-item">
            <div class="status-label">自训练模型</div>
            <div class="status-value" :class="{ active: modelStats.custom_model?.loaded }">
              {{ modelStats.custom_model?.loaded ? '已加载' : '未加载' }}
            </div>
          </div>
          <div class="status-item">
            <div class="status-label">百度OCR</div>
            <div class="status-value" :class="{ active: modelStats.baidu_ocr?.available }">
              {{ modelStats.baidu_ocr?.available ? '可用' : '不可用' }}
            </div>
          </div>
          <div class="status-item">
            <div class="status-label">训练数据</div>
            <div class="status-value">{{ modelStats.training_data?.count || 0 }} 条</div>
          </div>
          <div class="status-item">
            <div class="status-label">缓存大小</div>
            <div class="status-value">{{ modelStats.cache?.size || 0 }}/{{ modelStats.cache?.max_size || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- 功能按钮 -->
      <div class="action-buttons">
        <button @click="refreshStatus" class="action-btn primary">
          <iconify-icon icon="heroicons:arrow-path" width="20"></iconify-icon>
          刷新状态
        </button>
        <button @click="viewTrainingData" class="action-btn secondary">
          <iconify-icon icon="heroicons:document-text" width="20"></iconify-icon>
          查看训练数据
        </button>
        <button @click="testOCR" class="action-btn secondary">
          <iconify-icon icon="heroicons:camera" width="20"></iconify-icon>
          测试识别
        </button>
      </div>

      <!-- 训练数据列表 -->
      <div v-if="showTrainingData" class="training-data-section">
        <h3>训练数据 ({{ trainingData.length }} 条)</h3>
        <div class="training-list">
          <div v-for="item in trainingData" :key="item.id" class="training-item">
            <div class="training-info">
              <div class="training-name">{{ item.data?.name || '未知' }}</div>
              <div class="training-meta">
                <span class="training-source">{{ item.source }}</span>
                <span class="training-confidence">置信度: {{ Math.round((item.confidence || 0) * 100) }}%</span>
                <span class="training-time">{{ formatTime(item.timestamp) }}</span>
              </div>
            </div>
            <button @click="viewTrainingItem(item)" class="view-btn">
              <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- OCR测试区域 -->
      <div v-if="showOCRTest" class="ocr-test-section">
        <h3>OCR识别测试</h3>
        <div class="test-upload">
          <input
            ref="testFileInput"
            type="file"
            accept="image/*"
            @change="handleTestFile"
            style="display: none"
          />
          <button @click="selectTestFile" class="upload-btn">
            <iconify-icon icon="heroicons:photo" width="24"></iconify-icon>
            选择测试图片
          </button>
        </div>

        <div v-if="testResult" class="test-result">
          <h4>识别结果</h4>
          <div class="result-info">
            <div class="result-item">
              <span class="label">来源:</span>
              <span class="value">{{ testResult.source }}</span>
            </div>
            <div class="result-item">
              <span class="label">置信度:</span>
              <span class="value">{{ Math.round((testResult.confidence || 0) * 100) }}%</span>
            </div>
            <div class="result-item">
              <span class="label">处理时间:</span>
              <span class="value">{{ testResult.processing_time }}秒</span>
            </div>
          </div>
          
          <div v-if="testResult.data" class="result-data">
            <div class="data-item">
              <span class="label">姓名:</span>
              <span class="value">{{ testResult.data.name }}</span>
            </div>
            <div class="data-item">
              <span class="label">性别:</span>
              <span class="value">{{ testResult.data.gender }}</span>
            </div>
            <div class="data-item">
              <span class="label">身份证号:</span>
              <span class="value">{{ testResult.data.idNumber }}</span>
            </div>
            <div class="data-item">
              <span class="label">出生日期:</span>
              <span class="value">{{ testResult.data.birthDate }}</span>
            </div>
            <div class="data-item">
              <span class="label">地址:</span>
              <span class="value">{{ testResult.data.address }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <iconify-icon icon="heroicons:arrow-path" width="32" class="spinning"></iconify-icon>
        <p>{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const modelStats = ref({})
const trainingData = ref([])
const showTrainingData = ref(false)
const showOCRTest = ref(false)
const testResult = ref(null)
const loading = ref(false)
const loadingText = ref('')
const testFileInput = ref(null)

// 返回上一页
const goBack = () => {
  router.back()
}

// 安全的Toast显示
const safeShowToast = (message, type = 'info') => {
  try {
    if (appStore && typeof appStore.showToast === 'function') {
      appStore.showToast(message, type)
    } else {
      console.log(`Toast (${type}): ${message}`)
    }
  } catch (error) {
    console.error('Toast显示失败:', error)
  }
}

// 获取模型状态
const getModelStatus = async () => {
  try {
    loading.value = true
    loadingText.value = '获取模型状态...'

    const response = await fetch('/api/ocr/status')
    const result = await response.json()

    if (result.success) {
      modelStats.value = result.data
      console.log('📊 模型状态:', result.data)
    } else {
      throw new Error(result.message || '获取模型状态失败')
    }
  } catch (error) {
    console.error('❌ 获取模型状态失败:', error)
    safeShowToast('获取模型状态失败', 'error')
  } finally {
    loading.value = false
  }
}

// 获取训练数据
const getTrainingData = async () => {
  try {
    loading.value = true
    loadingText.value = '获取训练数据...'

    const response = await fetch('/api/ocr/training-data')
    const result = await response.json()

    if (result.success) {
      trainingData.value = result.data
      console.log('📚 训练数据:', result.data)
    } else {
      throw new Error(result.message || '获取训练数据失败')
    }
  } catch (error) {
    console.error('❌ 获取训练数据失败:', error)
    safeShowToast('获取训练数据失败', 'error')
  } finally {
    loading.value = false
  }
}

// 刷新状态
const refreshStatus = async () => {
  await getModelStatus()
  safeShowToast('状态已刷新', 'success')
}

// 查看训练数据
const viewTrainingData = async () => {
  showOCRTest.value = false
  showTrainingData.value = !showTrainingData.value
  
  if (showTrainingData.value) {
    await getTrainingData()
  }
}

// 测试OCR
const testOCR = () => {
  showTrainingData.value = false
  showOCRTest.value = !showOCRTest.value
  testResult.value = null
}

// 选择测试文件
const selectTestFile = () => {
  testFileInput.value?.click()
}

// 处理测试文件
const handleTestFile = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    loading.value = true
    loadingText.value = 'OCR识别中...'

    const formData = new FormData()
    formData.append('idcard', file)

    const response = await fetch('/api/ocr/idcard', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      testResult.value = result
      safeShowToast('OCR识别成功', 'success')
    } else {
      throw new Error(result.message || 'OCR识别失败')
    }
  } catch (error) {
    console.error('❌ OCR测试失败:', error)
    safeShowToast('OCR测试失败', 'error')
  } finally {
    loading.value = false
  }
}

// 查看训练项目详情
const viewTrainingItem = (item) => {
  console.log('查看训练项目:', item)
  safeShowToast(`查看训练数据: ${item.data?.name}`, 'info')
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 组件挂载时获取数据
onMounted(() => {
  getModelStatus()
})
</script>

<style scoped>
.ocr-management {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.top-nav {
  background: white;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.nav-placeholder {
  width: 40px;
}

.content {
  flex: 1;
  padding: 20px;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-card h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.status-item {
  text-align: center;
}

.status-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.status-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.status-value.active {
  color: #07c160;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.primary {
  background: #07c160;
  color: white;
}

.action-btn.primary:hover {
  background: #06a552;
}

.action-btn.secondary {
  background: white;
  color: #333;
  border: 1px solid #ddd;
}

.action-btn.secondary:hover {
  background: #f5f5f5;
}

.training-data-section,
.ocr-test-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.training-data-section h3,
.ocr-test-section h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.training-list {
  max-height: 400px;
  overflow-y: auto;
}

.training-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.training-item:last-child {
  border-bottom: none;
}

.training-info {
  flex: 1;
}

.training-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.training-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.training-source {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
}

.view-btn {
  background: none;
  border: none;
  color: #07c160;
  cursor: pointer;
  padding: 8px;
}

.test-upload {
  text-align: center;
  margin-bottom: 20px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.upload-btn:hover {
  background: #06a552;
}

.test-result {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
}

.test-result h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.result-info,
.result-data {
  margin-bottom: 16px;
}

.result-item,
.data-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
}

.loading-overlay {
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
}

.loading-spinner {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .training-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
