<template>
  <div class="product-detail">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">商品详情</div>
      <div class="header-actions">
        <button class="cart-btn" @click="goToCart">
          <iconify-icon icon="heroicons:shopping-cart" width="20" style="color: #333;"></iconify-icon>
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </button>
        <button class="share-btn" @click="shareStore">
          <iconify-icon icon="heroicons:share" width="20" style="color: #333;"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 商品图片 -->
    <div class="product-images">
      <div class="image-container">
        <img :src="product.image" :alt="product.name" class="main-image" />
      </div>
    </div>

    <!-- 商品信息 -->
    <div class="product-info">
      <div class="price-section">
        <div class="current-price">¥{{ product.price }}</div>
        <div v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice }}</div>
      </div>
      <div class="product-name">{{ product.name }}</div>
      <div class="product-subtitle">{{ product.subtitle }}</div>
      
      <!-- 销量和评价 -->
      <div class="stats-section">
        <span class="sales-count">已售{{ product.sales }}件</span>
        <span class="rating">
          <iconify-icon icon="heroicons:star" width="14" style="color: #ffc107;"></iconify-icon>
          {{ product.rating }} ({{ product.reviewCount }}条评价)
        </span>
      </div>
    </div>

    <!-- 商品详情 -->
    <div class="product-details">
      <div class="section-title">商品详情</div>
      <div class="detail-content">
        <p>{{ product.description }}</p>
        <div class="detail-images">
          <img 
            v-for="(img, index) in product.detailImages"
            :key="index"
            :src="img"
            :alt="`详情图${index + 1}`"
            class="detail-image"
          />
        </div>
      </div>
    </div>

    <!-- 商品评价 -->
    <div class="product-reviews">
      <div class="section-title">
        商品评价 ({{ product.reviewCount }})
        <button class="view-all-btn">查看全部</button>
      </div>
      <div class="review-list">
        <div 
          v-for="review in product.reviews.slice(0, 3)"
          :key="review.id"
          class="review-item"
        >
          <div class="review-header">
            <img :src="review.avatar" :alt="review.username" class="review-avatar" />
            <div class="review-info">
              <div class="review-username">{{ review.username }}</div>
              <div class="review-rating">
                <iconify-icon 
                  v-for="i in 5"
                  :key="i"
                  icon="heroicons:star"
                  width="12"
                  :style="{ color: i <= review.rating ? '#ffc107' : '#e0e0e0' }"
                ></iconify-icon>
              </div>
            </div>
            <div class="review-date">{{ formatDate(review.date) }}</div>
          </div>
          <div class="review-content">{{ review.content }}</div>
        </div>
      </div>
    </div>

    <!-- 保障信息 -->
    <div class="guarantee-section">
      <div class="section-title">购买保障</div>
      <div class="guarantee-list">
        <div class="guarantee-item">
          <iconify-icon icon="heroicons:shield-check" width="16" style="color: #07C160;"></iconify-icon>
          <span>7天无理由退货</span>
        </div>
        <div class="guarantee-item">
          <iconify-icon icon="heroicons:truck" width="16" style="color: #07C160;"></iconify-icon>
          <span>全国包邮</span>
        </div>
        <div class="guarantee-item">
          <iconify-icon icon="heroicons:check-badge" width="16" style="color: #07C160;"></iconify-icon>
          <span>正品保证</span>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <button class="contact-btn" @click="contactSeller">
        <iconify-icon icon="heroicons:chat-bubble-left-right" width="20" style="color: #666;"></iconify-icon>
        <span>客服</span>
      </button>
      <button class="add-cart-btn" @click="addToCart">
        加入购物车
      </button>
      <button class="buy-now-btn" @click="buyNow">
        立即购买
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const cartCount = ref(2)

// 商品数据
const product = ref({
  id: route.params.id as string,
  name: '精选咖啡豆 500g',
  subtitle: '来自云南高原的优质阿拉比卡咖啡豆',
  price: 128,
  originalPrice: 168,
  image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23d4a574"/><text x="150" y="150" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dy=".3em">精选咖啡豆</text></svg>',
  sales: 256,
  rating: 4.8,
  reviewCount: 89,
  description: '这款咖啡豆来自云南高原海拔1500米的优质产区，采用传统日晒工艺处理，保留了咖啡豆的天然香味。口感醇厚，带有淡淡的果香和坚果味，适合手冲、意式等多种冲泡方式。',
  detailImages: [
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23d4a574"/><text x="200" y="150" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">咖啡豆细节图</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23a0845c"/><text x="200" y="150" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">包装展示图</text></svg>'
  ],
  reviews: [
    {
      id: '1',
      username: '咖啡爱好者',
      avatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23ff9500"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14">咖</text></svg>',
      rating: 5,
      content: '咖啡豆品质很好，香味浓郁，口感醇厚，值得推荐！',
      date: Date.now() - 86400000
    },
    {
      id: '2',
      username: '品味生活',
      avatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%235856d6"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14">品</text></svg>',
      rating: 4,
      content: '包装精美，咖啡豆新鲜，冲泡后香味很棒。',
      date: Date.now() - 172800000
    }
  ]
})

// 方法
const goBack = () => {
  router.back()
}

const goToCart = () => {
  router.push('/cart')
}

const shareStore = () => {
  console.log('分享小店')
  // 分享功能
}

const contactSeller = () => {
  console.log('联系客服')
  // 跳转到客服聊天
}

const addToCart = () => {
  cartCount.value++
  console.log('加入购物车')
}

const buyNow = () => {
  console.log('立即购买')
  // 跳转到订单页面
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.product-detail {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
  padding-bottom: 80px;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.cart-btn,
.share-btn {
  position: relative;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.product-images {
  margin-top: 60px;
  background: white;
}

.image-container {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  background: white;
  padding: 20px 16px;
  margin-bottom: 8px;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.current-price {
  font-size: 24px;
  font-weight: 600;
  color: #ff4444;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.product-name {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.product-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.stats-section {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-details,
.product-reviews,
.guarantee-section {
  background: white;
  margin-bottom: 8px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-all-btn {
  font-size: 12px;
  color: #07C160;
  border: none;
  background: transparent;
  cursor: pointer;
}

.detail-content p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-images {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-image {
  width: 100%;
  border-radius: 8px;
}

.review-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
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
  border-radius: 16px;
}

.review-info {
  flex: 1;
}

.review-username {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.review-rating {
  display: flex;
  gap: 2px;
}

.review-date {
  font-size: 12px;
  color: #999;
}

.review-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.guarantee-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guarantee-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  border-top: 1px solid #f0f0f0;
}

.contact-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  padding: 8px;
}

.add-cart-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid #07C160;
  border-radius: 20px;
  background: transparent;
  color: #07C160;
  font-size: 16px;
  cursor: pointer;
}

.buy-now-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 20px;
  background: #07C160;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
</style>
