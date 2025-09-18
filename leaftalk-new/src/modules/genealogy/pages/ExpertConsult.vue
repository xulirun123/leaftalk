<template>
  <div class="expert-consult-page">
    <MobileTopBar 
      title="专家咨询"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="expert-consult-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="expert" class="consult-container">
        <!-- 专家信息 -->
        <div class="expert-info-card">
          <div class="expert-header">
            <img :src="expert.avatar" :alt="expert.name" class="expert-avatar">
            <div class="expert-details">
              <h1>{{ expert.name }}</h1>
              <p>{{ expert.title }}</p>
              <div class="expert-stats">
                <span class="stat-item">
                  <iconify-icon icon="heroicons:star" width="14"></iconify-icon>
                  {{ expert.rating }}
                </span>
                <span class="stat-item">从业{{ expert.experience }}年</span>
                <span class="stat-item">{{ expert.consultCount }}+咨询</span>
              </div>
            </div>
            <div class="expert-status" :class="expert.status">
              {{ getStatusText(expert.status) }}
            </div>
          </div>
          
          <div class="expert-intro">
            <h3>专家介绍</h3>
            <p>{{ expert.introduction }}</p>
          </div>
          
          <div class="expert-specialties">
            <h3>擅长领域</h3>
            <div class="specialties-list">
              <span v-for="specialty in expert.specialties" :key="specialty" class="specialty-tag">
                {{ specialty }}
              </span>
            </div>
          </div>
        </div>

        <!-- 咨询服务 -->
        <div class="consult-services-card">
          <h3>咨询服务</h3>
          <div class="services-list">
            <div v-for="service in expert.services" :key="service.id" class="service-item">
              <div class="service-info">
                <h4>{{ service.name }}</h4>
                <p>{{ service.description }}</p>
                <div class="service-meta">
                  <span class="duration">{{ service.duration }}</span>
                  <span class="price">¥{{ service.price }}</span>
                </div>
              </div>
              <button @click="selectService(service)" class="select-service-btn">
                选择
              </button>
            </div>
          </div>
        </div>

        <!-- 用户评价 -->
        <div class="reviews-card">
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

        <!-- 咨询须知 -->
        <div class="consult-notice-card">
          <h3>咨询须知</h3>
          <div class="notice-list">
            <div class="notice-item">
              <iconify-icon icon="heroicons:clock" width="16"></iconify-icon>
              <span>咨询时间：每日9:00-21:00</span>
            </div>
            <div class="notice-item">
              <iconify-icon icon="heroicons:chat-bubble-left-right" width="16"></iconify-icon>
              <span>支持语音、视频、文字咨询</span>
            </div>
            <div class="notice-item">
              <iconify-icon icon="heroicons:shield-check" width="16"></iconify-icon>
              <span>咨询内容严格保密</span>
            </div>
            <div class="notice-item">
              <iconify-icon icon="heroicons:document-text" width="16"></iconify-icon>
              <span>提供详细咨询报告</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>专家信息不存在</p>
      </div>
    </div>

    <!-- 服务选择弹窗 -->
    <div v-if="showServiceModal" class="modal-overlay" @click="closeServiceModal">
      <div class="service-modal" @click.stop>
        <div class="modal-header">
          <h3>预约咨询</h3>
          <button @click="closeServiceModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="selected-service-info">
          <h4>{{ selectedService?.name }}</h4>
          <p>{{ selectedService?.description }}</p>
          <div class="service-price">
            <span>咨询费用：¥{{ selectedService?.price }}</span>
          </div>
        </div>
        
        <div class="booking-form">
          <div class="form-group">
            <label>咨询问题 *</label>
            <textarea 
              v-model="consultForm.question" 
              placeholder="请详细描述您的问题"
              rows="4"
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>联系电话 *</label>
            <input 
              v-model="consultForm.phone" 
              type="tel" 
              placeholder="请输入联系电话"
              required
            />
          </div>
          
          <div class="form-group">
            <label>预约时间</label>
            <select v-model="consultForm.timeSlot">
              <option value="">请选择时间段</option>
              <option value="morning">上午 9:00-12:00</option>
              <option value="afternoon">下午 14:00-17:00</option>
              <option value="evening">晚上 19:00-21:00</option>
            </select>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeServiceModal" class="cancel-btn">取消</button>
          <button @click="submitConsult" class="confirm-btn" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认预约' }}
          </button>
        </div>
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
const expert = ref(null)
const reviews = ref([
  {
    id: 1,
    user: { name: '王先生', avatar: '/default-avatar.png' },
    rating: 5,
    content: '大师很专业，分析准确，给出的建议很实用。',
    date: '2024-01-10'
  },
  {
    id: 2,
    user: { name: '李女士', avatar: '/default-avatar.png' },
    rating: 4,
    content: '咨询过程很详细，解答了我的疑问。',
    date: '2024-01-08'
  }
])

const showServiceModal = ref(false)
const selectedService = ref(null)
const submitting = ref(false)
const consultForm = ref({
  question: '',
  phone: '',
  timeSlot: ''
})

// 生命周期
onMounted(() => {
  loadExpertInfo()
})

// 方法
const goBack = () => {
  router.back()
}

const loadExpertInfo = async () => {
  loading.value = true
  try {
    // 模拟加载专家信息
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    expert.value = {
      id: route.params.consultId,
      name: '王大师',
      title: '高级命名师 / 风水顾问',
      avatar: '/default-avatar.png',
      rating: 4.9,
      experience: 15,
      consultCount: 5000,
      status: 'online',
      introduction: '从事传统文化研究15年，精通八字命理、姓名学、风水学等。曾为数千家庭提供专业咨询服务，深受客户信赖。',
      specialties: ['八字命理', '姓名学', '风水布局', '择日选时', '婚姻配对'],
      services: [
        {
          id: 1,
          name: '文字咨询',
          description: '通过文字详细解答您的问题',
          duration: '24小时内回复',
          price: 99
        },
        {
          id: 2,
          name: '语音咨询',
          description: '30分钟语音通话咨询',
          duration: '30分钟',
          price: 199
        },
        {
          id: 3,
          name: '视频咨询',
          description: '面对面视频咨询，更直观',
          duration: '30分钟',
          price: 299
        }
      ]
    }
  } catch (error) {
    console.error('加载专家信息失败:', error)
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
    online: '在线',
    busy: '忙碌',
    offline: '离线'
  }
  return statusMap[status] || status
}

const selectService = (service) => {
  selectedService.value = service
  showServiceModal.value = true
}

const closeServiceModal = () => {
  showServiceModal.value = false
  selectedService.value = null
  consultForm.value = {
    question: '',
    phone: '',
    timeSlot: ''
  }
}

const submitConsult = async () => {
  if (!consultForm.value.question || !consultForm.value.phone) {
    appStore.showToast('请填写必填信息', 'error')
    return
  }

  submitting.value = true
  try {
    // 模拟提交咨询
    appStore.showToast('正在提交咨询...', 'info')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    appStore.showToast('咨询预约成功！专家将尽快联系您', 'success')
    closeServiceModal()
    
    // 可以跳转到咨询记录页面
    setTimeout(() => {
      router.back()
    }, 1000)
    
  } catch (error) {
    console.error('提交咨询失败:', error)
    appStore.showToast('提交失败，请重试', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.expert-consult-page {
  height: 100vh;
  background: #f5f5f5;
}

.expert-consult-content {
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

.consult-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.expert-info-card,
.consult-services-card,
.reviews-card,
.consult-notice-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.expert-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.expert-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.expert-details {
  flex: 1;
}

.expert-details h1 {
  font-size: 18px;
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
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.expert-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  height: fit-content;
}

.expert-status.online {
  background: #e8f5e8;
  color: #388e3c;
}

.expert-status.busy {
  background: #fff3e0;
  color: #f57c00;
}

.expert-status.offline {
  background: #fafafa;
  color: #666;
}

.expert-intro h3,
.expert-specialties h3,
.consult-services-card h3,
.reviews-card h3,
.consult-notice-card h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.expert-intro p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.expert-specialties {
  margin-top: 16px;
}

.specialties-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.specialty-tag {
  background: #f0f0f0;
  color: #666;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.service-info h4 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.service-info p {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px 0;
}

.service-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.price {
  color: #ff4757;
  font-weight: bold;
}

.select-service-btn {
  padding: 6px 12px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
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

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.notice-item iconify-icon {
  color: #07C160;
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

.service-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.selected-service-info {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.selected-service-info h4 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.selected-service-info p {
  color: #666;
  margin: 0 0 12px 0;
}

.service-price {
  color: #ff4757;
  font-weight: bold;
}

.booking-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #07C160;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;
}

.confirm-btn {
  background: #07C160;
  color: white;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
