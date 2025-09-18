<template>
  <div class="search-detail-page">
    <MobileTopBar 
      :title="searchInfo?.targetName ? `寻找${searchInfo.targetName}` : '寻亲详情'"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="search-detail-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="searchInfo" class="detail-container">
        <!-- 寻找对象信息 -->
        <div class="target-info-card">
          <div class="card-header">
            <h2>寻找对象信息</h2>
            <span class="status-badge" :class="searchInfo.status">{{ getStatusText(searchInfo.status) }}</span>
          </div>
          
          <div class="target-details">
            <div class="detail-row">
              <span class="label">姓名：</span>
              <span class="value">{{ searchInfo.targetName }}</span>
            </div>
            <div class="detail-row">
              <span class="label">关系：</span>
              <span class="value">{{ searchInfo.relationship }}</span>
            </div>
            <div class="detail-row" v-if="searchInfo.gender">
              <span class="label">性别：</span>
              <span class="value">{{ searchInfo.gender }}</span>
            </div>
            <div class="detail-row" v-if="searchInfo.birthYear">
              <span class="label">出生年份：</span>
              <span class="value">{{ searchInfo.birthYear }}年</span>
            </div>
            <div class="detail-row" v-if="searchInfo.lostDate">
              <span class="label">失联时间：</span>
              <span class="value">{{ formatDate(searchInfo.lostDate) }}</span>
            </div>
          </div>
        </div>

        <!-- 地址信息 -->
        <div class="address-info-card">
          <h3>最后已知地址</h3>
          <div class="address-content">
            <div class="address-main">
              {{ searchInfo.province }} {{ searchInfo.city }} {{ searchInfo.district }}
            </div>
            <div v-if="searchInfo.detailAddress" class="address-detail">
              {{ searchInfo.detailAddress }}
            </div>
          </div>
        </div>

        <!-- 详细描述 -->
        <div class="description-card" v-if="searchInfo.description">
          <h3>详细描述</h3>
          <p>{{ searchInfo.description }}</p>
        </div>

        <!-- 发布者信息 -->
        <div class="publisher-info-card">
          <h3>发布者信息</h3>
          <div class="publisher-details">
            <img :src="searchInfo.publisher.avatar" :alt="searchInfo.publisher.name" class="publisher-avatar">
            <div class="publisher-text">
              <h4>{{ searchInfo.publisher.name }}</h4>
              <p>{{ searchInfo.publisher.relation }}</p>
              <div class="publish-meta">
                <span class="publish-date">发布于 {{ formatDate(searchInfo.publishDate) }}</span>
                <span class="view-count">{{ searchInfo.viewCount }} 次查看</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="contactPublisher" class="contact-btn">
            <iconify-icon icon="heroicons:chat-bubble-left-right" width="20"></iconify-icon>
            联系发布者
          </button>
          <button @click="shareToMoments" class="share-btn">
            <iconify-icon icon="heroicons:share" width="20"></iconify-icon>
            分享到朋友圈
          </button>
        </div>

        <!-- 相关寻亲 -->
        <div class="related-searches">
          <h3>相关寻亲信息</h3>
          <div class="related-list">
            <div 
              v-for="related in relatedSearches" 
              :key="related.id"
              class="related-item"
              @click="viewRelatedSearch(related)"
            >
              <div class="related-info">
                <h4>寻找：{{ related.targetName }}</h4>
                <p>{{ related.description.substring(0, 50) }}...</p>
                <span class="related-location">{{ related.province }} {{ related.city }}</span>
              </div>
              <div class="related-meta">
                <span class="related-date">{{ formatDate(related.publishDate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>寻亲信息不存在</p>
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
const searchInfo = ref(null)
const relatedSearches = ref([
  {
    id: 2,
    targetName: '李明',
    description: '寻找失散多年的兄弟，最后在广州见过',
    province: '广东省',
    city: '广州市',
    publishDate: '2024-01-10'
  },
  {
    id: 3,
    targetName: '王芳',
    description: '寻找母亲，1990年在上海失联',
    province: '上海市',
    city: '上海市',
    publishDate: '2024-01-08'
  }
])

// 生命周期
onMounted(() => {
  loadSearchDetail()
})

// 方法
const goBack = () => {
  router.back()
}

const loadSearchDetail = async () => {
  loading.value = true
  try {
    // 模拟加载寻亲详情数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    searchInfo.value = {
      id: route.params.searchId,
      targetName: '张三',
      relationship: '兄弟',
      gender: '男',
      birthYear: '1985',
      lostDate: '2020-01-01',
      province: '湖南省',
      city: '长沙市',
      district: '岳麓区',
      detailAddress: '某某街道某某小区',
      description: '身高约170cm，左手有胎记，说话带有湖南口音。最后一次见面是在2020年春节，之后就失去了联系。',
      status: 'searching',
      publisher: {
        name: '李四',
        avatar: '/default-avatar.png',
        relation: '寻找兄弟'
      },
      publishDate: '2024-01-15',
      viewCount: 156
    }
  } catch (error) {
    console.error('加载寻亲详情失败:', error)
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
    searching: '寻找中',
    found: '已找到',
    closed: '已关闭'
  }
  return statusMap[status] || status
}

const contactPublisher = () => {
  appStore.showToast('正在联系发布者...', 'info')
  // 可以打开联系弹窗或跳转到聊天页面
}

const shareToMoments = () => {
  // 直接发布到朋友圈，不需要跳转到编辑页面
  const shareContent = {
    type: 'search',
    targetName: searchInfo.value.targetName,
    targetGender: searchInfo.value.targetGender,
    targetAge: searchInfo.value.targetAge,
    lastLocation: searchInfo.value.lastLocation,
    description: searchInfo.value.description,
    publisherName: searchInfo.value.publisherName
  }

  appStore.showToast('正在分享到朋友圈...', 'info')

  // 模拟直接发布到朋友圈
  setTimeout(() => {
    appStore.showToast('已成功分享到朋友圈！', 'success')
  }, 1500)
}

const viewRelatedSearch = (related) => {
  router.push(`/genealogy/${route.params.id}/search/${related.id}`)
}
</script>

<style scoped>
.search-detail-page {
  height: 100vh;
  background: #f5f5f5;
}

.search-detail-content {
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

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.target-info-card,
.address-info-card,
.description-card,
.publisher-info-card,
.related-searches {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h2 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.searching {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.found {
  background: #e8f5e8;
  color: #388e3c;
}

.status-badge.closed {
  background: #fafafa;
  color: #666;
}

.target-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: center;
}

.detail-row .label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.detail-row .value {
  color: #333;
  font-weight: 500;
}

.address-info-card h3,
.description-card h3,
.publisher-info-card h3,
.related-searches h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.address-content {
  color: #333;
}

.address-main {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.address-detail {
  font-size: 14px;
  color: #666;
}

.description-card p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.publisher-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.publisher-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.publisher-text h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.publisher-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.publish-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin: 8px 0;
}

.contact-btn,
.share-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.contact-btn {
  background: #07C160;
  color: white;
}

.share-btn {
  background: #f0f0f0;
  color: #333;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.related-item:hover {
  background: #e9ecef;
}

.related-info h4 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.related-info p {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px 0;
}

.related-location {
  font-size: 12px;
  color: #999;
}

.related-date {
  font-size: 12px;
  color: #999;
}
</style>
