<template>
  <div class="memorial-detail-page">
    <MobileTopBar 
      :title="memorial?.title || '祭奠详情'"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="memorial-detail-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadMemorialDetail" class="retry-btn">重试</button>
      </div>
      
      <div v-else-if="memorial" class="memorial-content">
        <div class="memorial-header">
          <h1 class="memorial-title">{{ memorial.title }}</h1>
          <div class="memorial-meta">
            <div class="meta-item">
              <span class="meta-label">时间：</span>
              <span class="meta-value">{{ memorial.date }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">地点：</span>
              <span class="meta-value">{{ memorial.location }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">类型：</span>
              <span class="meta-value">{{ memorial.type }}</span>
            </div>
          </div>
        </div>
        
        <div class="memorial-description">
          <h3>祭奠内容</h3>
          <p>{{ memorial.description }}</p>
        </div>
        
        <div class="memorial-actions">
          <button @click="joinMemorial" class="action-btn primary">参与祭奠</button>
          <button @click="shareMemorial" class="action-btn secondary">分享</button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>祭奠活动不存在</p>
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
const memorialId = ref(route.params.memorialId)
const memorial = ref(null)
const loading = ref(false)
const error = ref('')

// 生命周期
onMounted(() => {
  loadMemorialDetail()
})

// 方法
const goBack = () => {
  router.back()
}

const loadMemorialDetail = async () => {
  if (!genealogyId.value || !memorialId.value) {
    error.value = '参数错误'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 模拟数据
    memorial.value = {
      id: memorialId.value,
      title: '清明祭祖',
      description: '家族清明节祭祖活动，缅怀先人，传承家风。',
      date: '2024-04-05',
      location: '家族墓地',
      type: '传统祭奠'
    }

  } catch (err) {
    console.error('加载祭奠详情失败:', err)
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const joinMemorial = () => {
  appStore.showToast('参与祭奠功能开发中', 'info')
}

const shareMemorial = () => {
  appStore.showToast('分享功能开发中', 'info')
}
</script>

<style scoped>
.memorial-detail-page {
  height: 100vh;
  background: #f5f5f5;
}

.memorial-detail-content {
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

.memorial-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.memorial-header {
  margin-bottom: 24px;
}

.memorial-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.memorial-meta {
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

.memorial-description {
  margin-bottom: 24px;
}

.memorial-description h3 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.memorial-description p {
  color: #666;
  line-height: 1.6;
}

.memorial-actions {
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
