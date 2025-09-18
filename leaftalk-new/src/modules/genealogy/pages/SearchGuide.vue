<template>
  <div class="search-guide-page">
    <MobileTopBar 
      title="寻亲指南"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="search-guide-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="guide" class="guide-container">
        <div class="guide-header">
          <h1>{{ guide.title }}</h1>
          <div class="guide-meta">
            <span class="category">{{ guide.category }}</span>
            <span class="read-count">
              <iconify-icon icon="heroicons:eye" width="14"></iconify-icon>
              {{ guide.readCount }}
            </span>
          </div>
        </div>

        <div class="guide-content">
          <div v-html="guide.content"></div>
        </div>

        <div class="guide-actions">
          <button @click="shareToMoments" class="action-btn">
            <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
            分享到朋友圈
          </button>
          <button @click="contactSupport" class="action-btn">
            <iconify-icon icon="heroicons:chat-bubble-left" width="16"></iconify-icon>
            联系客服
          </button>
        </div>

        <div class="related-guides">
          <h3>相关指南</h3>
          <div class="related-list">
            <div 
              v-for="related in relatedGuides" 
              :key="related.id"
              class="related-item"
              @click="viewRelatedGuide(related)"
            >
              <h4>{{ related.title }}</h4>
              <p>{{ related.summary }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>指南不存在</p>
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
const guide = ref(null)
const relatedGuides = ref([
  {
    id: 2,
    title: '如何提高寻亲成功率',
    summary: '掌握这些技巧，让寻亲更有效果'
  },
  {
    id: 3,
    title: '寻亲信息发布注意事项',
    summary: '发布寻亲信息时需要注意的要点'
  },
  {
    id: 4,
    title: 'DNA比对寻亲指南',
    summary: '通过DNA技术进行亲属关系确认'
  }
])

// 生命周期
onMounted(() => {
  loadGuideData()
})

// 方法
const goBack = () => {
  router.back()
}

const loadGuideData = async () => {
  loading.value = true
  try {
    // 模拟加载指南数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    guide.value = {
      id: route.params.guideId,
      title: '寻亲基础指南',
      category: '基础知识',
      readCount: 1256,
      content: `
        <h2>寻亲前的准备工作</h2>
        <p>在开始寻亲之前，您需要做好以下准备：</p>
        <ul>
          <li><strong>收集信息</strong>：尽可能多地收集要寻找人员的基本信息，包括姓名、年龄、最后已知地址等</li>
          <li><strong>整理照片</strong>：准备清晰的照片，包括近期照片和特征明显的照片</li>
          <li><strong>联系方式</strong>：确保您的联系方式准确无误，方便他人联系</li>
        </ul>

        <h2>寻亲渠道</h2>
        <p>目前主要的寻亲渠道包括：</p>
        <ol>
          <li><strong>网络平台</strong>：通过叶语等专业寻亲平台发布信息</li>
          <li><strong>社交媒体</strong>：利用微信、微博等社交平台扩散信息</li>
          <li><strong>传统媒体</strong>：通过电视、报纸等传统媒体发布寻人启事</li>
          <li><strong>公安部门</strong>：向当地公安部门报案，寻求官方帮助</li>
        </ol>

        <h2>注意事项</h2>
        <div class="warning-box">
          <p><strong>重要提醒：</strong></p>
          <ul>
            <li>保护个人隐私，不要泄露过多敏感信息</li>
            <li>谨防诈骗，对主动联系的陌生人要保持警惕</li>
            <li>保持耐心，寻亲是一个长期过程</li>
            <li>寻找到疑似目标后，建议通过DNA检测确认关系</li>
          </ul>
        </div>

        <h2>成功案例分享</h2>
        <p>通过叶语平台，已有数千个家庭成功团聚。坚持不懈，相信您也能找到失散的亲人。</p>

        <h2>需要帮助？</h2>
        <p>如果您在寻亲过程中遇到困难，可以：</p>
        <ul>
          <li>联系叶语客服团队，我们将为您提供专业指导</li>
          <li>加入寻亲互助群，与其他寻亲者交流经验</li>
          <li>关注叶语公众号，获取最新寻亲资讯</li>
        </ul>
      `
    }
  } catch (error) {
    console.error('加载指南失败:', error)
    appStore.showToast('加载指南失败', 'error')
  } finally {
    loading.value = false
  }
}

const shareToMoments = () => {
  appStore.showToast('正在分享到叶语朋友圈...', 'info')
  // 跳转到朋友圈发布页面
  setTimeout(() => {
    router.push(`/moments/publish?content=寻亲指南分享：${guide.value.title}&type=guide`)
  }, 1000)
}

const contactSupport = () => {
  appStore.showToast('正在联系客服...', 'info')
  // 可以跳转到客服页面或打开客服对话
}

const viewRelatedGuide = (relatedGuide) => {
  router.push(`/genealogy/${route.params.id}/search-guide/${relatedGuide.id}`)
}
</script>

<style scoped>
.search-guide-page {
  height: 100vh;
  background: #f5f5f5;
}

.search-guide-content {
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

.guide-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.guide-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.guide-header h1 {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.category {
  background: #07C160;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.read-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 14px;
}

.guide-content {
  margin-bottom: 24px;
  line-height: 1.6;
}

.guide-content :deep(h2) {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 24px 0 12px 0;
}

.guide-content :deep(p) {
  color: #666;
  margin-bottom: 12px;
}

.guide-content :deep(ul),
.guide-content :deep(ol) {
  margin: 12px 0;
  padding-left: 20px;
}

.guide-content :deep(li) {
  color: #666;
  margin-bottom: 8px;
}

.guide-content :deep(strong) {
  color: #333;
  font-weight: bold;
}

.guide-content :deep(.warning-box) {
  background: #fff3e0;
  border: 1px solid #ffcc02;
  border-radius: 6px;
  padding: 16px;
  margin: 16px 0;
}

.guide-content :deep(.warning-box p) {
  color: #f57c00;
  font-weight: bold;
  margin-bottom: 8px;
}

.guide-content :deep(.warning-box ul) {
  margin: 0;
}

.guide-content :deep(.warning-box li) {
  color: #f57c00;
}

.guide-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.action-btn:hover {
  background: #e0e0e0;
}

.related-guides h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.related-item:hover {
  background: #e9ecef;
}

.related-item h4 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.related-item p {
  font-size: 12px;
  color: #666;
  margin: 0;
}
</style>
