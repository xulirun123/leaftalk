<template>
  <div class="ritual-detail-page">
    <MobileTopBar 
      :title="ritual?.title || '仪式详情'"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="ritual-detail-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadRitualDetail" class="retry-btn">重试</button>
      </div>
      
      <div v-else-if="ritual" class="ritual-content">
        <div class="ritual-header">
          <h1 class="ritual-title">{{ ritual.title }}</h1>
          <div class="ritual-meta">
            <div class="meta-item">
              <span class="meta-label">类型：</span>
              <span class="meta-value">{{ ritual.type }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">时长：</span>
              <span class="meta-value">{{ ritual.duration }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">难度：</span>
              <span class="meta-value">{{ ritual.difficulty }}</span>
            </div>
          </div>
        </div>
        
        <div class="ritual-description">
          <h3>仪式说明</h3>
          <p>{{ ritual.description }}</p>
        </div>
        
        <div class="ritual-steps">
          <h3>仪式步骤</h3>
          <div class="steps-list">
            <div v-for="(step, index) in ritual.steps" :key="index" class="step-item">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">{{ step }}</div>
            </div>
          </div>
        </div>
        
        <div class="ritual-actions">
          <button @click="startRitual" class="action-btn primary">开始仪式</button>
          <button @click="shareRitual" class="action-btn secondary">分享</button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>仪式不存在</p>
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
const ritualId = ref(route.params.ritualId)
const ritual = ref(null)
const loading = ref(false)
const error = ref('')

// 生命周期
onMounted(() => {
  loadRitualDetail()
})

// 方法
const goBack = () => {
  router.back()
}

const loadRitualDetail = async () => {
  if (!genealogyId.value || !ritualId.value) {
    error.value = '参数错误'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 模拟数据
    ritual.value = {
      id: ritualId.value,
      title: '传统祭祖仪式',
      description: '按照家族传统进行的祭祖仪式，包含上香、献花、诵读祭文等环节。',
      type: '传统仪式',
      duration: '30分钟',
      difficulty: '简单',
      steps: [
        '准备祭品：鲜花、香烛、水果',
        '整理仪容，保持庄重',
        '点燃香烛，向先祖行礼',
        '献上鲜花和祭品',
        '诵读祭文，表达敬意',
        '默哀三分钟，缅怀先人',
        '收拾祭品，结束仪式'
      ]
    }

  } catch (err) {
    console.error('加载仪式详情失败:', err)
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const startRitual = () => {
  appStore.showToast('仪式功能开发中', 'info')
}

const shareRitual = () => {
  appStore.showToast('分享功能开发中', 'info')
}
</script>

<style scoped>
.ritual-detail-page {
  height: 100vh;
  background: #f5f5f5;
}

.ritual-detail-content {
  padding: 16px;
  height: calc(100vh - 75px);
  overflow-y: auto;
}

.loading-state, .error-state, .empty-state {
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

.retry-btn {
  padding: 8px 16px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 4px;
  margin-top: 16px;
}

.ritual-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.ritual-header {
  margin-bottom: 24px;
}

.ritual-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.ritual-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: 500;
  color: #666;
  min-width: 60px;
}

.meta-value {
  color: #333;
}

.ritual-description, .ritual-steps {
  margin-bottom: 24px;
}

.ritual-description h3, .ritual-steps h3 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.ritual-description p {
  color: #666;
  line-height: 1.6;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-number {
  width: 24px;
  height: 24px;
  background: #07C160;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  color: #333;
  line-height: 1.5;
}

.ritual-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
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
