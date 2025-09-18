<template>
  <div class="ecommerce-center">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <h1 class="header-title">带货中心</h1>
      <button class="help-btn" @click="showHelp">
        <iconify-icon icon="heroicons:question-mark-circle" width="24" style="color: #333;"></iconify-icon>
      </button>
    </div>

    <!-- 带货概览 -->
    <div class="ecommerce-overview">
      <div class="overview-header">
        <div class="shop-info">
          <div class="shop-avatar">
            <iconify-icon icon="heroicons:shopping-bag" width="32" style="color: #07c160;"></iconify-icon>
          </div>
          <div class="shop-details">
            <h2 class="shop-name">{{ shopInfo.name }}</h2>
            <p class="shop-status">{{ shopInfo.status }}</p>
          </div>
        </div>
        <button class="setup-btn" @click="setupShop" v-if="!shopInfo.isSetup">
          开通
        </button>
      </div>

      <!-- 今日带货数据 -->
      <div class="today-stats">
        <h3>今日数据</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(todayStats.orders) }}</div>
            <div class="stat-label">订单数</div>
            <div class="stat-change" :class="{ positive: todayStats.ordersChange > 0 }">
              <iconify-icon 
                :icon="todayStats.ordersChange > 0 ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'" 
                width="12"
              ></iconify-icon>
              {{ Math.abs(todayStats.ordersChange) }}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">¥{{ formatNumber(todayStats.sales) }}</div>
            <div class="stat-label">销售额</div>
            <div class="stat-change" :class="{ positive: todayStats.salesChange > 0 }">
              <iconify-icon 
                :icon="todayStats.salesChange > 0 ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'" 
                width="12"
              ></iconify-icon>
              {{ Math.abs(todayStats.salesChange) }}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">¥{{ formatNumber(todayStats.commission) }}</div>
            <div class="stat-label">佣金收入</div>
            <div class="stat-change" :class="{ positive: todayStats.commissionChange > 0 }">
              <iconify-icon 
                :icon="todayStats.commissionChange > 0 ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'" 
                width="12"
              ></iconify-icon>
              {{ Math.abs(todayStats.commissionChange) }}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(todayStats.conversion) }}%</div>
            <div class="stat-label">转化率</div>
            <div class="stat-change" :class="{ positive: todayStats.conversionChange > 0 }">
              <iconify-icon 
                :icon="todayStats.conversionChange > 0 ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'" 
                width="12"
              ></iconify-icon>
              {{ Math.abs(todayStats.conversionChange) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h3>快捷操作</h3>
      <div class="actions-grid">
        <button class="action-item" @click="addProduct">
          <div class="action-icon">
            <iconify-icon icon="heroicons:plus-circle" width="32" style="color: #07c160;"></iconify-icon>
          </div>
          <span class="action-label">添加商品</span>
        </button>
        <button class="action-item" @click="startLiveSelling">
          <div class="action-icon">
            <iconify-icon icon="heroicons:tv" width="32" style="color: #ff4757;"></iconify-icon>
          </div>
          <span class="action-label">直播带货</span>
        </button>
        <button class="action-item" @click="manageOrders">
          <div class="action-icon">
            <iconify-icon icon="heroicons:clipboard-document-list" width="32" style="color: #5352ed;"></iconify-icon>
          </div>
          <span class="action-label">订单管理</span>
        </button>
        <button class="action-item" @click="viewAnalytics">
          <div class="action-icon">
            <iconify-icon icon="heroicons:chart-bar" width="32" style="color: #ffa502;"></iconify-icon>
          </div>
          <span class="action-label">数据分析</span>
        </button>
      </div>
    </div>

    <!-- 商品橱窗 -->
    <div class="product-showcase">
      <div class="section-header">
        <h3>商品橱窗</h3>
        <button class="manage-btn" @click="manageProducts">
          管理
        </button>
      </div>
      
      <div v-if="products.length === 0" class="empty-showcase">
        <iconify-icon icon="heroicons:shopping-bag" width="64" style="color: #ccc;"></iconify-icon>
        <h4>还没有商品</h4>
        <p>添加商品到橱窗，开始你的带货之旅</p>
        <button class="add-first-btn" @click="addProduct">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
          添加第一个商品
        </button>
      </div>

      <div v-else class="products-grid">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-item"
          @click="viewProduct(product)"
        >
          <div class="product-image">
            <img :src="product.image" :alt="product.name" />
            <div class="product-status" :class="product.status">
              {{ getStatusText(product.status) }}
            </div>
          </div>
          
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <div class="product-price">
              <span class="current-price">¥{{ product.price }}</span>
              <span v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice }}</span>
            </div>
            <div class="product-stats">
              <span class="stat">
                <iconify-icon icon="heroicons:eye" width="14"></iconify-icon>
                {{ formatNumber(product.views) }}
              </span>
              <span class="stat">
                <iconify-icon icon="heroicons:shopping-cart" width="14"></iconify-icon>
                {{ formatNumber(product.sales) }}
              </span>
              <span class="commission">佣金 {{ product.commission }}%</span>
            </div>
          </div>

          <div class="product-actions">
            <button class="action-btn" @click.stop="editProduct(product)" title="编辑">
              <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
            </button>
            <button class="action-btn" @click.stop="shareProduct(product)" title="分享">
              <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
            </button>
            <button class="action-btn" @click.stop="showProductMenu(product)" title="更多">
              <iconify-icon icon="heroicons:ellipsis-horizontal" width="16"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近订单 -->
    <div class="recent-orders">
      <div class="section-header">
        <h3>最近订单</h3>
        <button class="view-all-btn" @click="viewAllOrders">
          查看全部
        </button>
      </div>

      <div v-if="recentOrders.length === 0" class="empty-orders">
        <iconify-icon icon="heroicons:clipboard-document-list" width="48" style="color: #ccc;"></iconify-icon>
        <p>暂无订单</p>
      </div>

      <div v-else class="orders-list">
        <div
          v-for="order in recentOrders"
          :key="order.id"
          class="order-item"
          @click="viewOrder(order)"
        >
          <img :src="order.productImage" :alt="order.productName" class="order-image" />
          <div class="order-info">
            <h4 class="order-product">{{ order.productName }}</h4>
            <p class="order-details">数量: {{ order.quantity }} | 总价: ¥{{ order.totalPrice }}</p>
            <div class="order-meta">
              <span class="order-time">{{ formatTime(order.createdAt) }}</span>
              <span class="order-status" :class="order.status">{{ getOrderStatusText(order.status) }}</span>
            </div>
          </div>
          <div class="order-commission">
            <span class="commission-amount">+¥{{ order.commission }}</span>
            <span class="commission-label">佣金</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 带货工具 -->
    <div class="selling-tools">
      <h3>带货工具</h3>
      <div class="tools-grid">
        <div class="tool-item" @click="createPromotionVideo">
          <div class="tool-icon">
            <iconify-icon icon="heroicons:video-camera" width="24" style="color: #07c160;"></iconify-icon>
          </div>
          <div class="tool-info">
            <div class="tool-title">推广视频</div>
            <div class="tool-desc">制作商品推广视频</div>
          </div>
        </div>
        
        <div class="tool-item" @click="liveSellingTools">
          <div class="tool-icon">
            <iconify-icon icon="heroicons:tv" width="24" style="color: #ff4757;"></iconify-icon>
          </div>
          <div class="tool-info">
            <div class="tool-title">直播工具</div>
            <div class="tool-desc">直播带货助手</div>
          </div>
        </div>
        
        <div class="tool-item" @click="couponManagement">
          <div class="tool-icon">
            <iconify-icon icon="heroicons:ticket" width="24" style="color: #ffa502;"></iconify-icon>
          </div>
          <div class="tool-info">
            <div class="tool-title">优惠券</div>
            <div class="tool-desc">创建和管理优惠券</div>
          </div>
        </div>
        
        <div class="tool-item" @click="customerService">
          <div class="tool-icon">
            <iconify-icon icon="heroicons:chat-bubble-left-right" width="24" style="color: #5352ed;"></iconify-icon>
          </div>
          <div class="tool-info">
            <div class="tool-title">客服工具</div>
            <div class="tool-desc">客户咨询管理</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品操作菜单 -->
    <div v-if="showProductMenuDialog" class="product-menu-overlay" @click="hideProductMenu">
      <div class="product-menu-dialog" @click.stop>
        <div class="product-menu-option" @click="promoteProduct">
          <iconify-icon icon="heroicons:megaphone" width="20"></iconify-icon>
          <span>推广商品</span>
        </div>
        <div class="product-menu-option" @click="duplicateProduct">
          <iconify-icon icon="heroicons:document-duplicate" width="20"></iconify-icon>
          <span>复制商品</span>
        </div>
        <div class="product-menu-option" @click="hideProduct">
          <iconify-icon icon="heroicons:eye-slash" width="20"></iconify-icon>
          <span>隐藏商品</span>
        </div>
        <div class="product-menu-option danger" @click="removeProduct">
          <iconify-icon icon="heroicons:trash" width="20"></iconify-icon>
          <span>移除商品</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const showProductMenuDialog = ref(false)
const selectedProduct = ref(null)

// 店铺信息
const shopInfo = ref({
  name: '我的小店',
  status: '正常营业',
  isSetup: true
})

// 今日数据
const todayStats = ref({
  orders: 23,
  ordersChange: 15.2,
  sales: 3420,
  salesChange: 22.1,
  commission: 342,
  commissionChange: 18.5,
  conversion: 3.2,
  conversionChange: 5.8
})

// 商品列表
const products = ref([
  {
    id: '1',
    name: '时尚休闲运动鞋',
    price: 299,
    originalPrice: 399,
    image: '/images/products/shoes.jpg',
    views: 1520,
    sales: 45,
    commission: 15,
    status: 'active'
  },
  {
    id: '2',
    name: '护肤精华套装',
    price: 199,
    originalPrice: null,
    image: '/images/products/skincare.jpg',
    views: 890,
    sales: 23,
    commission: 20,
    status: 'active'
  }
])

// 最近订单
const recentOrders = ref([
  {
    id: '1',
    productName: '时尚休闲运动鞋',
    productImage: '/images/products/shoes.jpg',
    quantity: 1,
    totalPrice: 299,
    commission: 44.85,
    status: 'paid',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    productName: '护肤精华套装',
    productImage: '/images/products/skincare.jpg',
    quantity: 2,
    totalPrice: 398,
    commission: 79.6,
    status: 'shipped',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
])

// 方法
const goBack = () => {
  router.back()
}

const showHelp = () => {
  router.push('/help/ecommerce')
}

const setupShop = () => {
  router.push('/ecommerce/setup')
}

// 快捷操作
const addProduct = () => {
  console.log('🛍️ 添加商品')
  router.push('/ecommerce/add-product')
}

const startLiveSelling = () => {
  console.log('📺 开始直播带货')
  router.push('/live-stream/selling')
}

const manageOrders = () => {
  console.log('📋 管理订单')
  router.push('/ecommerce/orders')
}

const viewAnalytics = () => {
  console.log('📊 查看数据分析')
  router.push('/ecommerce/analytics')
}

// 商品管理
const manageProducts = () => {
  router.push('/ecommerce/products')
}

const viewProduct = (product: any) => {
  router.push(`/ecommerce/product/${product.id}`)
}

const editProduct = (product: any) => {
  router.push(`/ecommerce/edit-product/${product.id}`)
}

const shareProduct = (product: any) => {
  if (navigator.share) {
    navigator.share({
      title: product.name,
      text: `推荐商品：${product.name}，仅售¥${product.price}`,
      url: `${window.location.origin}/product/${product.id}`
    })
  }
}

const showProductMenu = (product: any) => {
  selectedProduct.value = product
  showProductMenuDialog.value = true
}

const hideProductMenu = () => {
  showProductMenuDialog.value = false
  selectedProduct.value = null
}

const promoteProduct = () => {
  console.log('推广商品:', selectedProduct.value)
  hideProductMenu()
}

const duplicateProduct = () => {
  console.log('复制商品:', selectedProduct.value)
  hideProductMenu()
}

const hideProduct = () => {
  console.log('隐藏商品:', selectedProduct.value)
  hideProductMenu()
}

const removeProduct = () => {
  if (confirm('确定要移除这个商品吗？')) {
    const index = products.value.findIndex(p => p.id === selectedProduct.value.id)
    if (index > -1) {
      products.value.splice(index, 1)
    }
  }
  hideProductMenu()
}

// 订单管理
const viewAllOrders = () => {
  router.push('/ecommerce/orders')
}

const viewOrder = (order: any) => {
  router.push(`/ecommerce/order/${order.id}`)
}

// 带货工具
const createPromotionVideo = () => {
  console.log('📹 制作推广视频')
  router.push('/video-create?type=promotion')
}

const liveSellingTools = () => {
  console.log('🛠️ 直播工具')
  router.push('/live-stream/tools')
}

const couponManagement = () => {
  console.log('🎫 优惠券管理')
  router.push('/ecommerce/coupons')
}

const customerService = () => {
  console.log('💬 客服工具')
  router.push('/ecommerce/customer-service')
}

// 工具函数
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

const getStatusText = (status: string): string => {
  const statusMap = {
    'active': '在售',
    'inactive': '下架',
    'pending': '审核中',
    'rejected': '未通过'
  }
  return statusMap[status] || status
}

const getOrderStatusText = (status: string): string => {
  const statusMap = {
    'pending': '待付款',
    'paid': '已付款',
    'shipped': '已发货',
    'delivered': '已送达',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 生命周期
onMounted(() => {
  console.log('🛒 带货中心加载完成')
})
</script>

<style scoped>
.ecommerce-center {
  min-height: 100vh;
  background: #f8f8f8;
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn,
.help-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

/* 带货概览 */
.ecommerce-overview {
  background: white;
  margin: 8px 16px 16px;
  border-radius: 12px;
  padding: 20px;
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.shop-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shop-avatar {
  width: 48px;
  height: 48px;
  background: rgba(7, 193, 96, 0.1);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shop-details h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.shop-status {
  margin: 0;
  font-size: 12px;
  color: #07c160;
}

.setup-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

/* 今日数据 */
.today-stats h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 10px;
  color: #ff4757;
}

.stat-change.positive {
  color: #07c160;
}

/* 快捷操作 */
.quick-actions {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
}

.quick-actions h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 12px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.action-item:hover {
  background: #f8f8f8;
}

.action-icon {
  width: 48px;
  height: 48px;
  background: rgba(7, 193, 96, 0.1);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-label {
  font-size: 12px;
  color: #333;
  text-align: center;
}

/* 商品橱窗 */
.product-showcase {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.manage-btn,
.view-all-btn {
  background: transparent;
  border: none;
  color: #07c160;
  font-size: 14px;
  cursor: pointer;
}

.empty-showcase {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-showcase h4 {
  margin: 16px 0 8px;
  font-size: 16px;
  color: #666;
}

.empty-showcase p {
  margin: 0 0 20px;
  font-size: 14px;
}

.add-first-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.product-item:hover {
  border-color: #07c160;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-image {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-status {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.product-status.active {
  background: #07c160;
}

.product-info {
  padding: 12px;
}

.product-name {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.current-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff4757;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  color: #999;
}

.stat {
  display: flex;
  align-items: center;
  gap: 2px;
}

.commission {
  color: #07c160;
  font-weight: 500;
}

.product-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.product-item:hover .product-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 最近订单 */
.recent-orders {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
}

.empty-orders {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.order-item:hover {
  border-color: #07c160;
}

.order-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-product {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-details {
  margin: 0 0 4px;
  font-size: 12px;
  color: #666;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-time {
  font-size: 10px;
  color: #999;
}

.order-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #666;
}

.order-status.paid {
  background: #e8f5e8;
  color: #07c160;
}

.order-status.shipped {
  background: #e3f2fd;
  color: #2196f3;
}

.order-commission {
  text-align: right;
}

.commission-amount {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #07c160;
}

.commission-label {
  font-size: 10px;
  color: #999;
}

/* 带货工具 */
.selling-tools {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
}

.selling-tools h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.tools-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-item:hover {
  border-color: #07c160;
  background: #f8f8f8;
}

.tool-icon {
  width: 40px;
  height: 40px;
  background: rgba(7, 193, 96, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-info {
  flex: 1;
}

.tool-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.tool-desc {
  font-size: 12px;
  color: #666;
}

/* 商品操作菜单 */
.product-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.product-menu-dialog {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  padding: 20px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.product-menu-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border: none;
  background: transparent;
  width: 100%;
  cursor: pointer;
  font-size: 16px;
  color: #333;
  transition: background-color 0.2s;
}

.product-menu-option:hover {
  background: #f8f8f8;
}

.product-menu-option.danger {
  color: #ff4757;
}

.product-menu-option:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .actions-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
