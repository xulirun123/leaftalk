<template>
  <div class="virtual-store-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">虚拟商城</h1>
      <button @click="goToCart" class="cart-btn">
        <iconify-icon icon="heroicons:shopping-cart" width="20"></iconify-icon>
        <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
      </button>
    </div>

    <!-- 用户余额显示 -->
    <div class="balance-bar">
      <div class="balance-item">
        <iconify-icon icon="heroicons:wallet" width="16"></iconify-icon>
        <span>¥{{ userBalance.wallet.toFixed(2) }}</span>
      </div>
      <div class="balance-item">
        <iconify-icon icon="heroicons:sparkles" width="16"></iconify-icon>
        <span>{{ userBalance.beans }}豆</span>
      </div>
    </div>

    <!-- 商品分类 -->
    <div class="category-tabs">
      <div 
        v-for="category in categories" 
        :key="category.id"
        class="category-tab"
        :class="{ active: selectedCategory === category.id }"
        @click="selectedCategory = category.id"
      >
        <iconify-icon :icon="category.icon" width="20"></iconify-icon>
        <span>{{ category.name }}</span>
      </div>
    </div>

    <!-- 节日特惠横幅 -->
    <div v-if="festivalBanner" class="festival-banner">
      <div class="banner-content">
        <div class="banner-icon">
          <iconify-icon :icon="festivalBanner.icon" width="32"></iconify-icon>
        </div>
        <div class="banner-info">
          <div class="banner-title">{{ festivalBanner.title }}</div>
          <div class="banner-desc">{{ festivalBanner.description }}</div>
        </div>
        <div class="banner-discount">{{ festivalBanner.discount }}</div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="product-list">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id"
        class="product-card"
        @click="viewProduct(product)"
      >
        <div class="product-image">
          <img :src="product.image" :alt="product.name" />
          <div v-if="product.isHot" class="hot-badge">热门</div>
          <div v-if="product.isNew" class="new-badge">新品</div>
          <div v-if="product.discount" class="discount-badge">{{ product.discount }}折</div>
        </div>
        
        <div class="product-info">
          <div class="product-name">{{ product.name }}</div>
          <div class="product-desc">{{ product.description }}</div>
          
          <div class="product-pricing">
            <div class="price-row">
              <div class="price-label">叶语豆</div>
              <div class="price-value beans">{{ product.beansPrice }}豆</div>
            </div>
            <div class="price-row">
              <div class="price-label">钱包</div>
              <div class="price-value wallet">¥{{ product.walletPrice }}</div>
            </div>
          </div>
          
          <div class="product-actions">
            <button @click.stop="addToCart(product, 'beans')" class="add-cart-btn beans">
              <iconify-icon icon="heroicons:sparkles" width="14"></iconify-icon>
              <span>豆购买</span>
            </button>
            <button @click.stop="addToCart(product, 'wallet')" class="add-cart-btn wallet">
              <iconify-icon icon="heroicons:wallet" width="14"></iconify-icon>
              <span>钱包购买</span>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="filteredProducts.length === 0" class="empty-products">
        <iconify-icon icon="heroicons:shopping-bag" width="48"></iconify-icon>
        <p>暂无商品</p>
      </div>
    </div>

    <!-- 商品详情弹窗 -->
    <div v-if="showProductDetail" class="modal-overlay" @click="showProductDetail = false">
      <div class="product-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>商品详情</h3>
          <button @click="showProductDetail = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="product-gallery">
            <img :src="selectedProduct?.image" :alt="selectedProduct?.name" />
          </div>
          
          <div class="product-details">
            <h4>{{ selectedProduct?.name }}</h4>
            <p>{{ selectedProduct?.description }}</p>
            
            <div class="product-features">
              <div class="feature-title">商品特色</div>
              <ul>
                <li v-for="feature in selectedProduct?.features" :key="feature">{{ feature }}</li>
              </ul>
            </div>
            
            <div class="product-usage">
              <div class="usage-title">使用说明</div>
              <p>{{ selectedProduct?.usage }}</p>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <div class="pricing-options">
            <div class="price-option">
              <div class="option-label">叶语豆购买</div>
              <div class="option-price">{{ selectedProduct?.beansPrice }}豆</div>
              <button @click="purchaseProduct('beans')" class="purchase-btn beans">
                立即购买
              </button>
            </div>
            <div class="price-option">
              <div class="option-label">钱包购买</div>
              <div class="option-price">¥{{ selectedProduct?.walletPrice }}</div>
              <button @click="purchaseProduct('wallet')" class="purchase-btn wallet">
                立即购买
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 购买确认弹窗 -->
    <div v-if="showPurchaseConfirm" class="modal-overlay" @click="showPurchaseConfirm = false">
      <div class="purchase-confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>确认购买</h3>
          <button @click="showPurchaseConfirm = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="purchase-item">
            <img :src="selectedProduct?.image" :alt="selectedProduct?.name" />
            <div class="item-info">
              <div class="item-name">{{ selectedProduct?.name }}</div>
              <div class="item-price">
                {{ purchaseMethod === 'beans' ? selectedProduct?.beansPrice + '豆' : '¥' + selectedProduct?.walletPrice }}
              </div>
            </div>
          </div>
          
          <div class="balance-check">
            <div class="current-balance">
              当前余额: 
              {{ purchaseMethod === 'beans' ? userBalance.beans + '豆' : '¥' + userBalance.wallet.toFixed(2) }}
            </div>
            <div class="after-purchase">
              购买后余额: 
              {{ purchaseMethod === 'beans' 
                ? (userBalance.beans - selectedProduct?.beansPrice) + '豆' 
                : '¥' + (userBalance.wallet - selectedProduct?.walletPrice).toFixed(2) }}
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showPurchaseConfirm = false" class="cancel-btn">取消</button>
          <button @click="confirmPurchase" class="confirm-btn" :disabled="!canPurchase">
            确认购买
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const router = useRouter()
const appStore = useAppStore()

// 状态
const selectedCategory = ref('memorial')
const showProductDetail = ref(false)
const showPurchaseConfirm = ref(false)
const selectedProduct = ref(null)
const purchaseMethod = ref('beans')
const cartCount = ref(0)

// 用户余额
const userBalance = ref({
  wallet: 0,
  beans: 0
})

// 商品分类
const categories = ref([
  { id: 'memorial', name: '祭奠用品', icon: 'mdi:flower-lotus' },
  { id: 'festival', name: '节日商品', icon: 'mdi:gift' },
  { id: 'opening', name: '开业庆典', icon: 'mdi:firework' },
  { id: 'blessing', name: '祈福用品', icon: 'mdi:hands-pray' }
])

// 节日横幅
const festivalBanner = ref({
  title: '清明节特惠',
  description: '祭奠用品全场8折',
  discount: '8折',
  icon: 'mdi:flower-lotus'
})

// 商品列表
const products = ref([
  // 祭奠用品
  {
    id: 1,
    category: 'memorial',
    name: '白菊花束',
    description: '纯洁的白菊花，表达对逝者的哀思',
    image: '/products/white-chrysanthemum.jpg',
    beansPrice: 50,
    walletPrice: 5,
    isHot: true,
    features: ['精选白菊花', '寓意纯洁', '表达哀思'],
    usage: '适用于清明祭扫、追思仪式等场合'
  },
  {
    id: 2,
    category: 'memorial',
    name: '莲花蜡烛',
    description: '莲花造型蜡烛，象征重生与希望',
    image: '/products/lotus-candle.jpg',
    beansPrice: 80,
    walletPrice: 8,
    isNew: true,
    features: ['莲花造型', '长时间燃烧', '象征重生'],
    usage: '点燃后放置在祭台上，营造庄严氛围'
  },
  {
    id: 3,
    category: 'memorial',
    name: '檀香',
    description: '高品质檀香，清香淡雅',
    image: '/products/sandalwood.jpg',
    beansPrice: 120,
    walletPrice: 12,
    features: ['天然檀香', '清香持久', '净化心灵'],
    usage: '点燃后插在香炉中，让香气缓缓飘散'
  },
  
  // 节日商品
  {
    id: 4,
    category: 'festival',
    name: '春节福字',
    description: '传统春节装饰，寓意福气满堂',
    image: '/products/spring-fu.jpg',
    beansPrice: 30,
    walletPrice: 3,
    discount: 8,
    features: ['传统设计', '寓意吉祥', '节日装饰'],
    usage: '贴在门上或墙上，增添节日氛围'
  },
  {
    id: 5,
    category: 'festival',
    name: '中秋月饼',
    description: '精美月饼礼盒，团圆美满',
    image: '/products/mooncake.jpg',
    beansPrice: 200,
    walletPrice: 20,
    features: ['多种口味', '精美包装', '团圆寓意'],
    usage: '中秋节与家人分享，表达团圆之意'
  },
  
  // 开业庆典
  {
    id: 6,
    category: 'opening',
    name: '开业花篮',
    description: '豪华开业花篮，祝贺生意兴隆',
    image: '/products/opening-basket.jpg',
    beansPrice: 300,
    walletPrice: 30,
    isHot: true,
    features: ['豪华设计', '寓意兴隆', '庆典专用'],
    usage: '放置在店铺门口，表达祝贺之意'
  },
  {
    id: 7,
    category: 'opening',
    name: '庆典烟花',
    description: '绚烂烟花效果，增添庆典气氛',
    image: '/products/fireworks.jpg',
    beansPrice: 500,
    walletPrice: 50,
    features: ['绚烂效果', '安全环保', '庆典必备'],
    usage: '在开业庆典时燃放，营造热烈氛围'
  },
  
  // 祈福用品
  {
    id: 8,
    category: 'blessing',
    name: '平安符',
    description: '传统平安符，保佑平安健康',
    image: '/products/peace-charm.jpg',
    beansPrice: 100,
    walletPrice: 10,
    features: ['传统工艺', '保佑平安', '随身携带'],
    usage: '随身携带或放在家中，祈求平安'
  },
  {
    id: 9,
    category: 'blessing',
    name: '招财猫',
    description: '可爱招财猫，招财进宝',
    image: '/products/lucky-cat.jpg',
    beansPrice: 150,
    walletPrice: 15,
    features: ['可爱造型', '招财寓意', '装饰摆件'],
    usage: '放在家中或办公室，寓意招财进宝'
  }
])

// 计算属性
const filteredProducts = computed(() => {
  return products.value.filter(product => product.category === selectedCategory.value)
})

const canPurchase = computed(() => {
  if (!selectedProduct.value) return false
  
  if (purchaseMethod.value === 'beans') {
    return userBalance.value.beans >= selectedProduct.value.beansPrice
  } else {
    return userBalance.value.wallet >= selectedProduct.value.walletPrice
  }
})

// 生命周期
onMounted(() => {
  loadUserBalance()
  loadCartCount()
})

// 方法
const loadUserBalance = async () => {
  try {
    const response = await fetch('/api/user/balance', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        userBalance.value = result.data
      }
    }
  } catch (error) {
    console.error('加载用户余额失败:', error)
  }
}

const loadCartCount = async () => {
  try {
    const response = await fetch('/api/cart/count', {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        cartCount.value = result.data.count
      }
    }
  } catch (error) {
    console.error('加载购物车数量失败:', error)
  }
}

const viewProduct = (product) => {
  selectedProduct.value = product
  showProductDetail.value = true
}

const addToCart = async (product, method) => {
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        productId: product.id,
        paymentMethod: method,
        quantity: 1
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('已添加到购物车', 'success')
        loadCartCount()
      } else {
        appStore.showToast(result.message || '添加失败', 'error')
      }
    } else {
      appStore.showToast('添加请求失败', 'error')
    }
  } catch (error) {
    console.error('添加到购物车失败:', error)
    appStore.showToast('添加失败', 'error')
  }
}

const purchaseProduct = (method) => {
  purchaseMethod.value = method
  showPurchaseConfirm.value = true
  showProductDetail.value = false
}

const confirmPurchase = async () => {
  try {
    appStore.showLoading('购买中...')
    
    const purchaseData = {
      productId: selectedProduct.value.id,
      paymentMethod: purchaseMethod.value,
      amount: purchaseMethod.value === 'beans' 
        ? selectedProduct.value.beansPrice 
        : selectedProduct.value.walletPrice
    }
    
    const response = await fetch('/api/products/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(purchaseData)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('购买成功', 'success')
        showPurchaseConfirm.value = false
        loadUserBalance()
      } else {
        appStore.showToast(result.message || '购买失败', 'error')
      }
    } else {
      appStore.showToast('购买请求失败', 'error')
    }
  } catch (error) {
    console.error('购买失败:', error)
    appStore.showToast('购买失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

const goToCart = () => {
  router.push('/cart')
}
</script>

<style scoped>
.virtual-store-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .cart-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
  position: relative;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 18px;
  height: 18px;
  background: #f44336;
  color: white;
  font-size: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 余额栏 */
.balance-bar {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
}

.balance-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #333;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
  padding: 0 8px;
}

.category-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.category-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
}

.category-tab span {
  font-size: 12px;
}

/* 节日横幅 */
.festival-banner {
  margin: 16px;
  background: linear-gradient(45deg, #ff9a9e, #fad0c4);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.banner-content {
  display: flex;
  align-items: center;
  padding: 16px;
  color: white;
}

.banner-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.banner-info {
  flex: 1;
}

.banner-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.banner-desc {
  font-size: 12px;
  opacity: 0.8;
}

.banner-discount {
  font-size: 20px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
}

/* 商品列表 */
.product-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 150px;
  position: relative;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hot-badge, .new-badge, .discount-badge {
  position: absolute;
  top: 8px;
  padding: 2px 6px;
  font-size: 10px;
  color: white;
  border-radius: 4px;
}

.hot-badge {
  left: 8px;
  background: #f44336;
}

.new-badge {
  left: 8px;
  background: #2196f3;
}

.discount-badge {
  right: 8px;
  background: #ff9800;
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.product-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-pricing {
  margin-bottom: 8px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.price-label {
  font-size: 12px;
  color: #666;
}

.price-value {
  font-size: 14px;
  font-weight: 600;
}

.price-value.beans {
  color: #ff9800;
}

.price-value.wallet {
  color: #4caf50;
}

.product-actions {
  display: flex;
  gap: 8px;
}

.add-cart-btn {
  flex: 1;
  height: 32px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}

.add-cart-btn.beans {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
  border: 1px solid #ff9800;
}

.add-cart-btn.wallet {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border: 1px solid #4caf50;
}

.empty-products {
  grid-column: span 2;
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-products iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
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

.product-detail-modal,
.purchase-confirm-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 商品详情 */
.product-gallery {
  margin-bottom: 20px;
}

.product-gallery img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.product-details h4 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.product-details p {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.product-features, .product-usage {
  margin-bottom: 16px;
}

.feature-title, .usage-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.product-features ul {
  padding-left: 20px;
  margin: 0;
}

.product-features li {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.product-usage p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.modal-actions {
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.pricing-options {
  display: flex;
  gap: 16px;
}

.price-option {
  flex: 1;
  text-align: center;
}

.option-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.option-price {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.purchase-btn {
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.purchase-btn.beans {
  background: #ff9800;
  color: white;
}

.purchase-btn.wallet {
  background: #4caf50;
  color: white;
}

/* 购买确认 */
.purchase-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.purchase-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.item-price {
  font-size: 14px;
  color: #666;
}

.balance-check {
  background: #f0f8ff;
  border-radius: 8px;
  padding: 16px;
}

.current-balance, .after-purchase {
  font-size: 14px;
  margin-bottom: 8px;
}

.current-balance {
  color: #333;
}

.after-purchase {
  color: #4caf50;
}

.cancel-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.confirm-btn {
  flex: 2;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #4caf50;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
