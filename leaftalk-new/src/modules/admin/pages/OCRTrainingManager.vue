<template>
  <div class="ocr-training-manager">
    <!-- 顶部导航 -->
    <MobileTopBar title="OCR模型训练" :show-back="true" />
    
    <!-- 主要内容 -->
    <div class="training-content">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ trainingStats.totalSamples }}</div>
          <div class="stat-label">训练样本</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ trainingStats.verifiedSamples }}</div>
          <div class="stat-label">已验证</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ modelStats.patternsCount }}</div>
          <div class="stat-label">字符模式</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ (modelAccuracy * 100).toFixed(1) }}%</div>
          <div class="stat-label">模型准确率</div>
        </div>
      </div>

      <!-- 训练进度 -->
      <div class="training-progress" v-if="trainingProgress.status !== 'idle'">
        <h3>训练进度</h3>
        <div class="progress-info">
          <div class="progress-status">{{ getStatusText(trainingProgress.status) }}</div>
          <div class="progress-details" v-if="trainingProgress.status === 'training'">
            轮次: {{ trainingProgress.epoch }}/{{ trainingProgress.totalEpochs }}
            准确率: {{ (trainingProgress.accuracy * 100).toFixed(2) }}%
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button 
          class="btn btn-primary" 
          @click="startTraining"
          :disabled="!canStartTraining || isTraining"
        >
          <iconify-icon icon="heroicons:play" width="20"></iconify-icon>
          {{ isTraining ? '训练中...' : '开始训练' }}
        </button>
        
        <button 
          class="btn btn-secondary" 
          @click="evaluateModel"
          :disabled="!modelStats.isLoaded || isEvaluating"
        >
          <iconify-icon icon="heroicons:chart-bar" width="20"></iconify-icon>
          {{ isEvaluating ? '评估中...' : '模型评估' }}
        </button>
        
        <button 
          class="btn btn-secondary" 
          @click="optimizeModel"
          :disabled="!modelStats.isLoaded || isOptimizing"
        >
          <iconify-icon icon="heroicons:cog-6-tooth" width="20"></iconify-icon>
          {{ isOptimizing ? '优化中...' : '模型优化' }}
        </button>
      </div>

      <!-- 训练数据列表 -->
      <div class="training-data-section">
        <h3>训练数据 ({{ trainingDataset.length }} 条)</h3>
        <div class="data-filters">
          <label>
            <input 
              type="checkbox" 
              v-model="showOnlyVerified"
              @change="loadTrainingDataset"
            >
            只显示已验证数据
          </label>
        </div>
        
        <div class="data-list">
          <div 
            v-for="sample in trainingDataset.slice(0, 20)" 
            :key="sample.sampleId"
            class="data-item"
            @click="viewSample(sample)"
          >
            <div class="sample-info">
              <div class="sample-id">{{ sample.sampleId }}</div>
              <div class="sample-label">{{ sample.ocrResult.data?.name || '未知' }}</div>
              <div class="sample-confidence">置信度: {{ (sample.ocrResult.confidence * 100).toFixed(1) }}%</div>
            </div>
            <div class="sample-status">
              <span :class="['status-badge', sample.verified ? 'verified' : 'unverified']">
                {{ sample.verified ? '已验证' : '未验证' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 评估结果 -->
      <div class="evaluation-results" v-if="evaluationResults">
        <h3>模型评估结果</h3>
        <div class="eval-stats">
          <div class="eval-item">
            <span class="eval-label">总样本数:</span>
            <span class="eval-value">{{ evaluationResults.totalSamples }}</span>
          </div>
          <div class="eval-item">
            <span class="eval-label">正确预测:</span>
            <span class="eval-value">{{ evaluationResults.correctPredictions }}</span>
          </div>
          <div class="eval-item">
            <span class="eval-label">准确率:</span>
            <span class="eval-value">{{ (evaluationResults.accuracy * 100).toFixed(2) }}%</span>
          </div>
          <div class="eval-item">
            <span class="eval-label">平均置信度:</span>
            <span class="eval-value">{{ (evaluationResults.averageConfidence * 100).toFixed(2) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 样本详情弹窗 -->
    <div class="sample-modal" v-if="selectedSample" @click="closeSampleModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>训练样本详情</h3>
          <button class="close-btn" @click="closeSampleModal">×</button>
        </div>
        <div class="modal-body">
          <div class="sample-details">
            <p><strong>样本ID:</strong> {{ selectedSample.sampleId }}</p>
            <p><strong>识别结果:</strong> {{ selectedSample.ocrResult.data?.name || '未知' }}</p>
            <p><strong>置信度:</strong> {{ (selectedSample.ocrResult.confidence * 100).toFixed(1) }}%</p>
            <p><strong>状态:</strong> {{ selectedSample.verified ? '已验证' : '未验证' }}</p>
            <p><strong>时间:</strong> {{ formatTime(selectedSample.timestamp) }}</p>
          </div>
          
          <div class="correction-section" v-if="!selectedSample.verified">
            <h4>标注修正</h4>
            <input 
              v-model="correctionText" 
              placeholder="输入正确的识别结果"
              class="correction-input"
            >
            <button 
              class="btn btn-primary" 
              @click="verifySample"
              :disabled="isVerifying"
            >
              {{ isVerifying ? '验证中...' : '确认验证' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'
import { apiClient } from '../../services/apiClient'

// 响应式数据
const trainingStats = ref({
  totalSamples: 0,
  verifiedSamples: 0,
  averageConfidence: 0,
  readyForTraining: false
})

const modelStats = ref({
  patternsCount: 0,
  characters: [],
  isLoaded: false
})

const trainingProgress = ref({
  status: 'idle',
  epoch: 0,
  totalEpochs: 0,
  accuracy: 0
})

const trainingDataset = ref([])
const evaluationResults = ref(null)
const selectedSample = ref(null)
const correctionText = ref('')

// 状态标志
const isTraining = ref(false)
const isEvaluating = ref(false)
const isOptimizing = ref(false)
const isVerifying = ref(false)
const showOnlyVerified = ref(false)

// 计算属性
const canStartTraining = computed(() => {
  return trainingStats.value.verifiedSamples >= 10
})

const progressPercentage = computed(() => {
  if (trainingProgress.value.totalEpochs === 0) return 0
  return (trainingProgress.value.epoch / trainingProgress.value.totalEpochs) * 100
})

const modelAccuracy = computed(() => {
  return evaluationResults.value?.accuracy || 0
})

// 方法
const loadTrainingStats = async () => {
  try {
    const response = await apiClient.get('/ocr/training/stats')
    if (response.data.success) {
      trainingStats.value = response.data.data
    }
  } catch (error) {
    console.error('加载训练统计失败:', error)
  }
}

const loadModelStats = async () => {
  try {
    const response = await apiClient.get('/ocr/training/model-stats')
    if (response.data.success) {
      modelStats.value = response.data.data
    }
  } catch (error) {
    console.error('加载模型统计失败:', error)
  }
}

const loadTrainingProgress = async () => {
  try {
    const response = await apiClient.get('/ocr/training/progress')
    if (response.data.success) {
      trainingProgress.value = response.data.data
      isTraining.value = response.data.data.status === 'training'
    }
  } catch (error) {
    console.error('加载训练进度失败:', error)
  }
}

const loadTrainingDataset = async () => {
  try {
    const response = await apiClient.get('/ocr/training/dataset', {
      params: { verified: showOnlyVerified.value }
    })
    if (response.data.success) {
      trainingDataset.value = response.data.data
    }
  } catch (error) {
    console.error('加载训练数据集失败:', error)
  }
}

const startTraining = async () => {
  try {
    isTraining.value = true
    const response = await apiClient.post('/ocr/training/start', {
      epochs: 20,
      batchSize: 8
    })
    
    if (response.data.success) {
      console.log('训练开始成功')
      // 定期检查训练进度
      const progressInterval = setInterval(async () => {
        await loadTrainingProgress()
        if (trainingProgress.value.status === 'completed' || trainingProgress.value.status === 'error') {
          clearInterval(progressInterval)
          isTraining.value = false
          await loadModelStats()
        }
      }, 2000)
    }
  } catch (error) {
    console.error('开始训练失败:', error)
    isTraining.value = false
  }
}

const evaluateModel = async () => {
  try {
    isEvaluating.value = true
    const response = await apiClient.post('/ocr/training/evaluate')
    if (response.data.success) {
      evaluationResults.value = response.data.data
    }
  } catch (error) {
    console.error('模型评估失败:', error)
  } finally {
    isEvaluating.value = false
  }
}

const optimizeModel = async () => {
  try {
    isOptimizing.value = true
    const response = await apiClient.post('/ocr/training/optimize')
    if (response.data.success) {
      console.log('模型优化完成:', response.data.data)
      await loadModelStats()
    }
  } catch (error) {
    console.error('模型优化失败:', error)
  } finally {
    isOptimizing.value = false
  }
}

const viewSample = (sample) => {
  selectedSample.value = sample
  correctionText.value = sample.ocrResult.data?.name || ''
}

const closeSampleModal = () => {
  selectedSample.value = null
  correctionText.value = ''
}

const verifySample = async () => {
  try {
    isVerifying.value = true
    const response = await apiClient.post(`/ocr/training/verify/${selectedSample.value.sampleId}`, {
      correctedData: correctionText.value ? { name: correctionText.value } : null
    })
    
    if (response.data.success) {
      console.log('样本验证成功')
      selectedSample.value.verified = true
      await loadTrainingStats()
      await loadTrainingDataset()
      closeSampleModal()
    }
  } catch (error) {
    console.error('验证样本失败:', error)
  } finally {
    isVerifying.value = false
  }
}

const getStatusText = (status) => {
  const statusMap = {
    'idle': '空闲',
    'preparing': '准备中',
    'training': '训练中',
    'completed': '已完成',
    'error': '错误',
    'stopped': '已停止'
  }
  return statusMap[status] || status
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadTrainingStats(),
    loadModelStats(),
    loadTrainingProgress(),
    loadTrainingDataset()
  ])
})
</script>
