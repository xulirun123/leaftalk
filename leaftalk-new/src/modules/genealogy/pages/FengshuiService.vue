<template>
  <div class="fengshui-service-page">
    <MobileTopBar 
      :title="service?.name || '风水服务'"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="fengshui-service-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="service" class="service-container">
        <!-- 服务头部 -->
        <div class="service-header">
          <div class="service-icon" :class="service.category">
            <iconify-icon :icon="service.icon" width="48"></iconify-icon>
          </div>
          <div class="service-info">
            <h1>{{ service.name }}</h1>
            <p>{{ service.description }}</p>
            <div class="service-meta">
              <span class="price">¥{{ service.price }}</span>
              <span class="rating">
                <iconify-icon icon="heroicons:star" width="14"></iconify-icon>
                {{ service.rating }}
              </span>
              <span class="orders">{{ service.orderCount }}人已购买</span>
            </div>
          </div>
        </div>

        <!-- 服务详情 -->
        <div class="service-details">
          <h3>服务详情</h3>
          <div class="details-content">
            <div class="detail-item">
              <iconify-icon icon="heroicons:clock" width="16"></iconify-icon>
              <span>服务时长：{{ service.duration }}</span>
            </div>
            <div class="detail-item">
              <iconify-icon icon="heroicons:user" width="16"></iconify-icon>
              <span>服务方式：{{ service.method }}</span>
            </div>
            <div class="detail-item">
              <iconify-icon icon="heroicons:document-text" width="16"></iconify-icon>
              <span>交付内容：{{ service.deliverable }}</span>
            </div>
          </div>
        </div>

        <!-- 服务流程 -->
        <div class="service-process">
          <h3>服务流程</h3>
          <div class="process-steps">
            <div v-for="(step, index) in service.process" :key="index" class="process-step">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <h4>{{ step.title }}</h4>
                <p>{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 专家介绍 -->
        <div class="expert-info">
          <h3>专家介绍</h3>
          <div class="expert-card">
            <img :src="service.expert.avatar" :alt="service.expert.name" class="expert-avatar">
            <div class="expert-details">
              <h4>{{ service.expert.name }}</h4>
              <p>{{ service.expert.title }}</p>
              <div class="expert-stats">
                <span>从业{{ service.expert.experience }}年</span>
                <span>服务{{ service.expert.clientCount }}+客户</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户评价 -->
        <div class="reviews-section">
          <h3>用户评价</h3>
          <div class="reviews-list">
            <div v-for="review in reviews" :key="review.id" class="review-item">
              <div class="review-header">
                <img :src="review.user.avatar" :alt="review.user.name" class="review-avatar">
                <div class="review-info">
                  <h5>{{ review.user.name }}</h5>
                  <div class="review-rating">
                    <iconify-icon 
                      v-for="i in 5" 
                      :key="i"
                      icon="heroicons:star" 
                      width="12"
                      :class="{ filled: i <= review.rating }"
                    ></iconify-icon>
                  </div>
                </div>
                <span class="review-date">{{ formatDate(review.date) }}</span>
              </div>
              <p class="review-content">{{ review.content }}</p>
            </div>
          </div>
        </div>

        <!-- 购买按钮 -->
        <div class="purchase-section">
          <div class="price-info">
            <span class="current-price">¥{{ service.price }}</span>
            <span v-if="service.originalPrice" class="original-price">¥{{ service.originalPrice }}</span>
          </div>
          <button @click="purchaseService" class="purchase-btn">
            立即购买
          </button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>服务不存在</p>
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
const service = ref(null)
const reviews = ref([
  {
    id: 1,
    user: { name: '张先生', avatar: '/default-avatar.png' },
    rating: 5,
    content: '大师分析很准确，给出的建议很实用，家里风水调整后确实有改善。',
    date: '2024-01-10'
  },
  {
    id: 2,
    user: { name: '李女士', avatar: '/default-avatar.png' },
    rating: 4,
    content: '服务很专业，解答详细，值得推荐。',
    date: '2024-01-08'
  }
])

// 生命周期
onMounted(() => {
  loadServiceDetail()
})

// 方法
const goBack = () => {
  router.back()
}

const loadServiceDetail = async () => {
  loading.value = true
  try {
    // 模拟加载服务详情
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    service.value = {
      id: route.params.serviceId,
      name: 'AI智能取名',
      description: '基于传统文化和现代AI技术，为您的宝宝取一个寓意美好的名字',
      category: 'naming',
      icon: 'heroicons:sparkles',
      price: 199,
      originalPrice: 299,
      rating: 4.8,
      orderCount: 1256,
      duration: '24小时内交付',
      method: '在线服务',
      deliverable: '3-5个精选名字+详细解析',
      process: [
        { title: '提交信息', description: '填写宝宝出生时间、父母姓名等基本信息' },
        { title: 'AI分析', description: '系统根据八字、五行等进行智能分析' },
        { title: '专家审核', description: '资深命名师对AI结果进行人工审核优化' },
        { title: '交付结果', description: '提供多个候选名字及详细寓意解析' }
      ],
      expert: {
        name: '王大师',
        title: '高级命名师',
        avatar: '/default-avatar.png',
        experience: 15,
        clientCount: 5000
      }
    }
  } catch (error) {
    console.error('加载服务详情失败:', error)
    appStore.showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const purchaseService = () => {
  // 跳转到订单页面
  router.push(`/genealogy/${route.params.id}/fengshui/order/${service.value.id}`)
}
</script>

<style scoped>
.fengshui-service-page {
  height: 100vh;
  background: #f5f5f5;
}

.fengshui-service-content {
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

.service-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 100px;
}

.service-header {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  gap: 16px;
}

.service-icon {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.service-icon.naming {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.service-info h1 {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.service-info p {
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.service-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #ff4757;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffa502;
  font-size: 14px;
}

.orders {
  font-size: 14px;
  color: #666;
}

.service-details,
.service-process,
.expert-info,
.reviews-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.service-details h3,
.service-process h3,
.expert-info h3,
.reviews-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.detail-item iconify-icon {
  color: #07C160;
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.process-step {
  display: flex;
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

.step-content h4 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.step-content p {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.expert-card {
  display: flex;
  gap: 12px;
}

.expert-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.expert-details h4 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.expert-details p {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.expert-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.review-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.review-info h5 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.review-rating {
  display: flex;
  gap: 2px;
}

.review-rating iconify-icon {
  color: #ddd;
}

.review-rating iconify-icon.filled {
  color: #ffa502;
}

.review-date {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.review-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.purchase-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff4757;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.purchase-btn {
  flex: 1;
  padding: 12px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
</style>
