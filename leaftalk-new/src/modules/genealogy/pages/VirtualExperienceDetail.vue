<template>
  <div class="virtual-experience-page">
    <MobileTopBar 
      :title="experience?.title || '虚拟体验'"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="virtual-experience-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadExperienceDetail" class="retry-btn">重试</button>
      </div>
      
      <div v-else-if="experience" class="experience-content">
        <div class="experience-header">
          <h1 class="experience-title">{{ experience.title }}</h1>
          <div class="experience-meta">
            <div class="meta-item">
              <span class="meta-label">类型：</span>
              <span class="meta-value">{{ experience.type }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">时长：</span>
              <span class="meta-value">{{ experience.duration }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">难度：</span>
              <span class="meta-value">{{ experience.difficulty }}</span>
            </div>
          </div>
        </div>
        
        <div class="experience-description">
          <h3>体验介绍</h3>
          <p>{{ experience.description }}</p>
        </div>
        
        <div class="experience-features">
          <h3>体验特色</h3>
          <div class="features-list">
            <div v-for="(feature, index) in experience.features" :key="index" class="feature-item">
              <iconify-icon icon="heroicons:check-circle" width="20" class="feature-icon"></iconify-icon>
              <span>{{ feature }}</span>
            </div>
          </div>
        </div>
        
        <div class="experience-actions">
          <button @click="startExperience" class="action-btn primary">开始体验</button>
          <button @click="shareExperience" class="action-btn secondary">分享</button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>体验不存在</p>
      </div>
    </div>

    <!-- VR体验界面 -->
    <div v-if="showVRExperience" class="vr-experience-overlay">
      <div class="vr-experience-container">
        <div class="vr-header">
          <h3>VR虚拟祠堂体验</h3>
          <button @click="exitVRExperience" class="exit-btn">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
        </div>

        <div class="vr-viewport">
          <div class="vr-scene" :class="vrCurrentScene">
            <div class="scene-content">
              <div class="scene-title">{{ getSceneName(vrCurrentScene) }}</div>
              <div class="scene-description">
                <span v-if="vrCurrentScene === 'entrance'">欢迎来到家族祠堂，这里承载着家族的历史与传承...</span>
                <span v-else-if="vrCurrentScene === 'main-hall'">主殿供奉着家族祖先的牌位，香火缭绕...</span>
                <span v-else-if="vrCurrentScene === 'ancestor-hall'">这里陈列着家族历代先祖的画像和事迹...</span>
                <span v-else-if="vrCurrentScene === 'garden'">后花园环境清幽，是家族成员休憩的地方...</span>
              </div>
            </div>

            <!-- 360度视角指示器 -->
            <div class="vr-controls">
              <div class="rotation-hint">
                <iconify-icon icon="heroicons:arrow-path" width="20"></iconify-icon>
                <span>拖拽查看360°全景</span>
              </div>
            </div>
          </div>
        </div>

        <div class="vr-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: vrProgress + '%' }"></div>
          </div>
          <div class="progress-text">体验进度: {{ Math.round(vrProgress) }}%</div>
        </div>

        <div class="vr-navigation">
          <div class="scene-indicators">
            <div
              v-for="(scene, index) in vrScenes"
              :key="scene.id"
              class="scene-indicator"
              :class="{ active: scene.id === vrCurrentScene, completed: vrScenes.findIndex(s => s.id === vrCurrentScene) > index }"
            >
              <div class="indicator-dot"></div>
              <span class="indicator-label">{{ scene.name }}</span>
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
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const experienceId = ref(route.params.experienceId)
const experience = ref(null)
const loading = ref(false)
const error = ref('')

// 生命周期
onMounted(() => {
  loadExperienceDetail()
})

// 方法
const goBack = () => {
  router.back()
}

const loadExperienceDetail = async () => {
  if (!genealogyId.value || !experienceId.value) {
    error.value = '参数错误'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 模拟数据
    experience.value = {
      id: experienceId.value,
      title: '虚拟祠堂参观',
      description: '通过VR技术，身临其境地参观家族祠堂，了解家族历史和文化传承。',
      type: 'VR体验',
      duration: '15分钟',
      difficulty: '简单',
      features: [
        '360度全景参观',
        '历史文物介绍',
        '语音导览服务',
        '互动体验环节',
        '家族故事讲述'
      ]
    }

  } catch (err) {
    console.error('加载体验详情失败:', err)
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const startExperience = () => {
  // 显示VR体验界面
  showVRExperience.value = true
  startVRExperience()
}

// VR体验相关
const showVRExperience = ref(false)
const vrProgress = ref(0)
const vrCurrentScene = ref('entrance')
const vrScenes = [
  { id: 'entrance', name: '祠堂入口', duration: 3000 },
  { id: 'main-hall', name: '主殿', duration: 4000 },
  { id: 'ancestor-hall', name: '祖先堂', duration: 5000 },
  { id: 'garden', name: '后花园', duration: 3000 }
]

const startVRExperience = async () => {
  vrProgress.value = 0

  for (const scene of vrScenes) {
    vrCurrentScene.value = scene.id

    // 模拟场景加载和体验过程
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / scene.duration) * 100, 100)
      vrProgress.value = progress

      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 50)

    // 等待场景完成
    await new Promise(resolve => setTimeout(resolve, scene.duration))
  }

  // 体验完成
  appStore.showToast('VR体验完成！', 'success')
  setTimeout(() => {
    showVRExperience.value = false
    vrProgress.value = 0
  }, 1000)
}

const exitVRExperience = () => {
  showVRExperience.value = false
  vrProgress.value = 0
  appStore.showToast('已退出VR体验', 'info')
}

const getSceneName = (sceneId: string) => {
  const scene = vrScenes.find(s => s.id === sceneId)
  return scene?.name || sceneId
}

const shareExperience = () => {
  appStore.showToast('正在分享到叶语朋友圈...', 'info')
  // 跳转到叶语朋友圈发布页面
  setTimeout(() => {
    const content = `刚刚体验了${experience.value?.title}，科技让传统文化更生动！🏛️✨`
    router.push(`/moments/publish?content=${encodeURIComponent(content)}&type=vr`)
  }, 1000)
}
</script>

<style scoped>
.virtual-experience-page {
  height: 100vh;
  background: #f5f5f5;
}

.virtual-experience-content {
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

.experience-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.experience-header {
  margin-bottom: 24px;
}

.experience-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.experience-meta {
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

.experience-description, .experience-features {
  margin-bottom: 24px;
}

.experience-description h3, .experience-features h3 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.experience-description p {
  color: #666;
  line-height: 1.6;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  color: #07C160;
  flex-shrink: 0;
}

.experience-actions {
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

/* VR体验样式 */
.vr-experience-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.vr-experience-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.vr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.vr-header h3 {
  font-size: 18px;
  margin: 0;
}

.exit-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
}

.vr-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.vr-scene {
  width: 100%;
  height: 100%;
  position: relative;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease;
}

.vr-scene.entrance {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.vr-scene.main-hall {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.vr-scene.ancestor-hall {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.vr-scene.garden {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.scene-content {
  position: absolute;
  bottom: 80px;
  left: 20px;
  right: 20px;
  color: white;
  text-align: center;
}

.scene-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.scene-description {
  font-size: 16px;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.vr-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
}

.rotation-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.8;
}

.rotation-hint span {
  font-size: 14px;
}

.vr-progress {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #07C160;
  transition: width 0.1s ease;
}

.progress-text {
  font-size: 14px;
  text-align: center;
}

.vr-navigation {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.9);
}

.scene-indicators {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scene-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.scene-indicator.active .indicator-dot {
  background: #07C160;
  transform: scale(1.2);
}

.scene-indicator.completed .indicator-dot {
  background: #07C160;
}

.indicator-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.scene-indicator.active .indicator-label {
  color: white;
  font-weight: bold;
}
</style>
