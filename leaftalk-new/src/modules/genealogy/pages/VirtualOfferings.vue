<template>
  <div class="virtual-offerings-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="虚拟祭祀商品" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button @click="showCart" class="cart-btn">
          <iconify-icon icon="heroicons:shopping-cart" width="20"></iconify-icon>
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </button>
      </template>
    </MobileTopBar>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <div 
        v-for="category in categories" 
        :key="category.value"
        class="category-tab"
        :class="{ active: currentCategory === category.value }"
        @click="setCategory(category.value)"
      >
        <iconify-icon :icon="category.icon" width="16"></iconify-icon>
        <span>{{ category.label }}</span>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="offerings-content">
      <!-- 商品网格 -->
      <div class="offerings-grid">
        <div 
          v-for="offering in filteredOfferings" 
          :key="offering.id"
          class="offering-card"
          @click="viewOffering(offering)"
        >
          <!-- 商品图片 -->
          <div class="offering-image">
            <img :src="offering.image" :alt="offering.name" />
            <div v-if="offering.isPremium" class="premium-badge">
              <iconify-icon icon="heroicons:star" width="12"></iconify-icon>
              高级
            </div>
            <div v-if="offering.hasAnimation" class="animation-badge">
              <iconify-icon icon="heroicons:play" width="12"></iconify-icon>
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="offering-info">
            <h3>{{ offering.name }}</h3>
            <p class="offering-desc">{{ offering.description }}</p>
            <div class="offering-meta">
              <div class="price">
                <span v-if="offering.price === 0" class="free">免费</span>
                <span v-else class="paid">{{ offering.price }}元</span>
              </div>
              <div class="usage-count">
                已使用 {{ offering.usageCount }}次
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="offering-actions">
            <button 
              v-if="offering.price === 0 || offering.isPurchased"
              @click.stop="addToCart(offering)"
              class="action-btn primary"
            >
              <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
              添加
            </button>
            <button 
              v-else
              @click.stop="purchaseOffering(offering)"
              class="action-btn purchase"
            >
              <iconify-icon icon="heroicons:shopping-bag" width="16"></iconify-icon>
              购买
            </button>
            <button @click.stop="previewOffering(offering)" class="action-btn">
              <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
              预览
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredOfferings.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:gift" width="48" class="empty-icon"></iconify-icon>
        <h3>暂无商品</h3>
        <p>该分类下暂无可用的祭祀商品</p>
      </div>
    </div>

    <!-- 购物车弹窗 -->
    <div v-if="showCartModal" class="modal-overlay" @click="closeCart">
      <div class="cart-modal" @click.stop>
        <div class="modal-header">
          <h3>祭祀清单</h3>
          <button @click="closeCart" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div v-if="cartItems.length === 0" class="empty-cart">
            <iconify-icon icon="heroicons:shopping-cart" width="48" class="empty-icon"></iconify-icon>
            <p>祭祀清单为空</p>
          </div>
          <div v-else class="cart-items">
            <div 
              v-for="item in cartItems" 
              :key="item.id"
              class="cart-item"
            >
              <img :src="item.image" :alt="item.name" class="item-image" />
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p>{{ item.message || '默认祝福' }}</p>
              </div>
              <div class="item-actions">
                <button @click="editMessage(item)" class="edit-btn">
                  <iconify-icon icon="heroicons:pencil" width="14"></iconify-icon>
                </button>
                <button @click="removeFromCart(item)" class="remove-btn">
                  <iconify-icon icon="heroicons:trash" width="14"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="cartItems.length > 0" class="modal-footer">
          <button @click="startOffering" class="start-offering-btn">
            <iconify-icon icon="heroicons:fire" width="16"></iconify-icon>
            开始祭祀
          </button>
        </div>
      </div>
    </div>

    <!-- 商品详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetail">
      <div class="detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedOffering?.name }}</h3>
          <button @click="closeDetail" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div v-if="selectedOffering" class="offering-detail">
            <div class="detail-image">
              <img :src="selectedOffering.image" :alt="selectedOffering.name" />
            </div>
            <div class="detail-info">
              <p class="detail-desc">{{ selectedOffering.fullDescription }}</p>
              <div class="detail-features">
                <div v-if="selectedOffering.hasAnimation" class="feature-item">
                  <iconify-icon icon="heroicons:play" width="16"></iconify-icon>
                  <span>包含动画效果</span>
                </div>
                <div v-if="selectedOffering.hasSound" class="feature-item">
                  <iconify-icon icon="heroicons:speaker-wave" width="16"></iconify-icon>
                  <span>包含音效</span>
                </div>
                <div v-if="selectedOffering.customizable" class="feature-item">
                  <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
                  <span>支持自定义寄语</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            v-if="selectedOffering?.price === 0 || selectedOffering?.isPurchased"
            @click="addToCartFromDetail"
            class="detail-action-btn primary"
          >
            添加到清单
          </button>
          <button 
            v-else
            @click="purchaseFromDetail"
            class="detail-action-btn purchase"
          >
            购买 ({{ selectedOffering?.price }}元)
          </button>
        </div>
      </div>
    </div>

    <!-- 自定义寄语弹窗 -->
    <div v-if="showMessageModal" class="modal-overlay" @click="closeMessage">
      <div class="message-modal" @click.stop>
        <div class="modal-header">
          <h3>自定义寄语</h3>
          <button @click="closeMessage" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="message-form">
            <div class="form-group">
              <label>寄语内容</label>
              <textarea 
                v-model="customMessage"
                placeholder="请输入您想对先人说的话..."
                rows="4"
                maxlength="200"
              ></textarea>
              <div class="char-count">{{ customMessage.length }}/200</div>
            </div>
            <div class="message-templates">
              <h4>常用寄语</h4>
              <div class="template-list">
                <button 
                  v-for="template in messageTemplates" 
                  :key="template"
                  @click="selectTemplate(template)"
                  class="template-btn"
                >
                  {{ template }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeMessage" class="cancel-btn">取消</button>
          <button @click="saveMessage" class="save-btn">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.genealogyId)
const currentCategory = ref('all')
const showCartModal = ref(false)
const showDetailModal = ref(false)
const showMessageModal = ref(false)
const selectedOffering = ref(null)
const editingItem = ref(null)
const customMessage = ref('')

const categories = ref([
  { label: '全部', value: 'all', icon: 'heroicons:squares-2x2' },
  { label: '名车', value: 'cars', icon: 'heroicons:truck' },
  { label: '名酒', value: 'wine', icon: 'heroicons:beaker' },
  { label: '烟花', value: 'fireworks', icon: 'heroicons:fire' },
  { label: '香烛', value: 'incense', icon: 'heroicons:light-bulb' },
  { label: '其他', value: 'others', icon: 'heroicons:gift' }
])

const offerings = ref([
  {
    id: 1,
    name: '御驾龙车',
    description: '金碧辉煌的龙车，象征尊贵',
    fullDescription: '精美的御驾龙车，采用传统工艺制作，金碧辉煌，象征着对先人的无上敬意。',
    category: 'cars',
    price: 99,
    isPremium: true,
    isPurchased: false,
    hasAnimation: true,
    hasSound: true,
    customizable: true,
    usageCount: 1256,
    image: '/offerings/dragon-car.jpg'
  },
  {
    id: 2,
    name: '灵灯长明',
    description: '永不熄灭的心灯',
    fullDescription: '象征着对先人永恒的思念，灯火长明，照亮归途。',
    category: 'incense',
    price: 0,
    isPremium: false,
    isPurchased: true,
    hasAnimation: true,
    hasSound: false,
    customizable: true,
    usageCount: 5678,
    image: '/offerings/eternal-lamp.jpg'
  },
  {
    id: 3,
    name: '茅台酒',
    description: '上等好酒敬先人',
    fullDescription: '精选茅台美酒，以表对先人的敬意和思念。',
    category: 'wine',
    price: 58,
    isPremium: false,
    isPurchased: false,
    hasAnimation: false,
    hasSound: true,
    customizable: true,
    usageCount: 2345,
    image: '/offerings/maotai.jpg'
  }
])

const cartItems = ref([])

const messageTemplates = ref([
  '愿您在天之灵安息',
  '思念您，永远爱您',
  '您的恩情永远铭记在心',
  '愿您保佑家人平安健康',
  '感谢您的养育之恩'
])

// 计算属性
const filteredOfferings = computed(() => {
  if (currentCategory.value === 'all') {
    return offerings.value
  }
  return offerings.value.filter(offering => offering.category === currentCategory.value)
})

const cartCount = computed(() => {
  return cartItems.value.length
})

// 生命周期
onMounted(() => {
  loadOfferings()
})

// 方法
const goBack = () => {
  router.back()
}

const loadOfferings = async () => {
  try {
    // 加载祭祀商品数据
    console.log('加载祭祀商品数据')
  } catch (error) {
    console.error('加载祭祀商品失败:', error)
    appStore.showToast('加载祭祀商品失败', 'error')
  }
}

const setCategory = (category: string) => {
  currentCategory.value = category
}

const viewOffering = (offering: any) => {
  selectedOffering.value = offering
  showDetailModal.value = true
}

const addToCart = (offering: any) => {
  if (offering.price > 0 && !offering.isPurchased) {
    appStore.showToast('请先购买该商品', 'error')
    return
  }
  
  const cartItem = {
    ...offering,
    message: '愿您在天之灵安息'
  }
  cartItems.value.push(cartItem)
  appStore.showToast('已添加到祭祀清单', 'success')
}

const purchaseOffering = async (offering: any) => {
  try {
    appStore.showToast('购买中...', 'info')
    // 实现购买逻辑
    setTimeout(() => {
      offering.isPurchased = true
      appStore.showToast('购买成功', 'success')
    }, 1000)
  } catch (error) {
    appStore.showToast('购买失败', 'error')
  }
}

const previewOffering = (offering: any) => {
  // 预览商品效果
  appStore.showToast('预览功能开发中', 'info')
}

const showCart = () => {
  showCartModal.value = true
}

const closeCart = () => {
  showCartModal.value = false
}

const closeDetail = () => {
  showDetailModal.value = false
  selectedOffering.value = null
}

const addToCartFromDetail = () => {
  if (selectedOffering.value) {
    addToCart(selectedOffering.value)
    closeDetail()
  }
}

const purchaseFromDetail = () => {
  if (selectedOffering.value) {
    purchaseOffering(selectedOffering.value)
  }
}

const editMessage = (item: any) => {
  editingItem.value = item
  customMessage.value = item.message || ''
  showMessageModal.value = true
}

const removeFromCart = (item: any) => {
  const index = cartItems.value.findIndex(cartItem => cartItem.id === item.id)
  if (index > -1) {
    cartItems.value.splice(index, 1)
    appStore.showToast('已从清单中移除', 'success')
  }
}

const closeMessage = () => {
  showMessageModal.value = false
  editingItem.value = null
  customMessage.value = ''
}

const selectTemplate = (template: string) => {
  customMessage.value = template
}

const saveMessage = () => {
  if (editingItem.value) {
    editingItem.value.message = customMessage.value
    appStore.showToast('寄语已保存', 'success')
  }
  closeMessage()
}

const startOffering = () => {
  // 开始祭祀仪式
  router.push(`/genealogy/${genealogyId.value}/offering-ceremony`)
}
</script>

<style scoped>
.virtual-offerings-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.cart-btn {
  position: relative;
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.cart-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ff3b30;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 75px;
  overflow-x: auto;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 16px;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tab.active {
  background: #07c160;
  color: white;
}

/* 商品内容 */
.offerings-content {
  padding: 16px;
}

.offerings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.offering-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.offering-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.offering-image {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.offering-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.premium-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.animation-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.offering-info {
  padding: 12px;
}

.offering-info h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.offering-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.3;
}

.offering-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price .free {
  color: #07c160;
  font-weight: 600;
  font-size: 12px;
}

.price .paid {
  color: #ff9500;
  font-weight: 600;
  font-size: 12px;
}

.usage-count {
  font-size: 10px;
  color: #999;
}

.offering-actions {
  display: flex;
  gap: 6px;
  padding: 0 12px 12px 12px;
}

.action-btn {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.action-btn.purchase {
  background: #ff9500;
  color: white;
  border-color: #ff9500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-modal,
.detail-modal,
.message-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 120px);
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

/* 购物车 */
.empty-cart {
  text-align: center;
  padding: 40px 20px;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.item-image {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.item-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.edit-btn,
.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: #f0f0f0;
  color: #666;
}

.remove-btn {
  background: #ff3b30;
  color: white;
}

.start-offering-btn {
  width: 100%;
  padding: 12px;
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 商品详情 */
.detail-image {
  margin-bottom: 16px;
}

.detail-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.detail-desc {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.detail-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.detail-action-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.detail-action-btn.primary {
  background: #07c160;
  color: white;
}

.detail-action-btn.purchase {
  background: #ff9500;
  color: white;
}

/* 自定义寄语 */
.message-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group textarea {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 80px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
}

.message-templates h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.template-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.template-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  background: #f5f5f5;
  border-color: #07c160;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  margin-right: 8px;
}

.save-btn {
  background: #07c160;
  color: white;
  border: 1px solid #07c160;
}
</style>
