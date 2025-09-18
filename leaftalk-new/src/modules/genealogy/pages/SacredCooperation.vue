<template>
  <div class="sacred-cooperation-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="圣地合作" 
      :showBack="true"
      @back="goBack"
    />

    <div class="page-content scroll-container">
      <!-- 功能分类标签 -->
      <div class="function-tabs">
        <div
          v-for="tab in functionTabs"
          :key="tab.value"
          class="function-tab"
          :class="{ active: currentFunction === tab.value }"
          @click="setFunction(tab.value)"
        >
          <iconify-icon :icon="tab.icon" width="20"></iconify-icon>
          <span>{{ tab.label }}</span>
        </div>
      </div>

      <!-- 主要内容 -->
    <div class="cooperation-content">
      <!-- 合作圣地列表 -->
      <div v-if="currentFunction === 'temples'" class="temples-section">
        <div class="section-header">
          <h3>合作圣地</h3>
          <p>与全国知名寺庙、道观建立合作关系</p>
        </div>
        
        <div class="temples-list">
          <div 
            v-for="temple in temples" 
            :key="temple.id"
            class="temple-card"
            @click="viewTempleDetail(temple)"
          >
            <div class="temple-image">
              <img :src="temple.image" :alt="temple.name" />
              <div class="temple-badge" :class="temple.type">
                {{ getTempleTypeText(temple.type) }}
              </div>
            </div>
            
            <div class="temple-info">
              <h4>{{ temple.name }}</h4>
              <p class="temple-location">
                <iconify-icon icon="heroicons:map-pin" width="12"></iconify-icon>
                {{ temple.location }}
              </p>
              <p class="temple-desc">{{ temple.description }}</p>
              
              <div class="temple-services">
                <span 
                  v-for="service in temple.services" 
                  :key="service"
                  class="service-tag"
                >
                  {{ service }}
                </span>
              </div>
              
              <div class="temple-stats">
                <div class="stat-item">
                  <iconify-icon icon="heroicons:star" width="12"></iconify-icon>
                  <span>{{ temple.rating }}</span>
                </div>
                <div class="stat-item">
                  <iconify-icon icon="heroicons:users" width="12"></iconify-icon>
                  <span>{{ temple.cooperationCount }}次合作</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 虚拟体验 -->
      <div v-if="currentFunction === 'virtual'" class="virtual-section">
        <div class="section-header">
          <h3>虚拟宗教体验</h3>
          <p>足不出户体验各大圣地的宗教仪式</p>
        </div>
        
        <div class="virtual-experiences">
          <div 
            v-for="experience in virtualExperiences" 
            :key="experience.id"
            class="experience-card"
            @click="startExperience(experience)"
          >
            <div class="experience-preview">
              <img :src="experience.preview" :alt="experience.title" />
              <div class="play-overlay">
                <iconify-icon icon="heroicons:play" width="32"></iconify-icon>
              </div>
              <div class="experience-duration">{{ experience.duration }}分钟</div>
            </div>
            
            <div class="experience-info">
              <h4>{{ experience.title }}</h4>
              <p class="experience-temple">{{ experience.temple }}</p>
              <p class="experience-desc">{{ experience.description }}</p>
              
              <div class="experience-features">
                <div v-if="experience.hasVR" class="feature-tag vr">
                  <iconify-icon icon="heroicons:eye" width="12"></iconify-icon>
                  VR体验
                </div>
                <div v-if="experience.hasAudio" class="feature-tag audio">
                  <iconify-icon icon="heroicons:speaker-wave" width="12"></iconify-icon>
                  音频导览
                </div>
                <div v-if="experience.interactive" class="feature-tag interactive">
                  <iconify-icon icon="heroicons:hand-raised" width="12"></iconify-icon>
                  互动体验
                </div>
              </div>
              
              <div class="experience-price">
                <span v-if="experience.price === 0" class="free">免费体验</span>
                <span v-else class="paid">{{ experience.price }}元</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 开光器具商城 -->
      <div v-if="currentFunction === 'blessing'" class="blessing-section">
        <div class="section-header">
          <h3>开光器具商城</h3>
          <p>正宗开光法器，为家族祈福保平安</p>
        </div>
        
        <div class="blessing-categories">
          <div 
            v-for="category in blessingCategories" 
            :key="category.value"
            class="blessing-category"
            :class="{ active: currentBlessingCategory === category.value }"
            @click="setBlessingCategory(category.value)"
          >
            <iconify-icon :icon="category.icon" width="16"></iconify-icon>
            <span>{{ category.label }}</span>
          </div>
        </div>
        
        <div class="blessing-items">
          <div 
            v-for="item in filteredBlessingItems" 
            :key="item.id"
            class="blessing-item"
            @click="viewBlessingDetail(item)"
          >
            <div class="item-image">
              <img :src="item.image" :alt="item.name" />
              <div v-if="item.isBlessed" class="blessed-badge">
                <iconify-icon icon="heroicons:sparkles" width="12"></iconify-icon>
                已开光
              </div>
            </div>
            
            <div class="item-info">
              <h4>{{ item.name }}</h4>
              <p class="item-temple">{{ item.temple }}开光</p>
              <p class="item-desc">{{ item.description }}</p>
              
              <div class="item-price">
                <span class="current-price">¥{{ item.price }}</span>
                <span v-if="item.originalPrice > item.price" class="original-price">¥{{ item.originalPrice }}</span>
              </div>
              
              <div class="item-actions">
                <button @click.stop="addToCart(item)" class="add-cart-btn">
                  <iconify-icon icon="heroicons:shopping-cart" width="14"></iconify-icon>
                  加入购物车
                </button>
                <button @click.stop="buyNow(item)" class="buy-now-btn">
                  立即购买
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="shouldShowEmpty" class="empty-state">
        <iconify-icon :icon="getEmptyIcon()" width="48" class="empty-icon"></iconify-icon>
        <h3>{{ getEmptyTitle() }}</h3>
        <p>{{ getEmptyDesc() }}</p>
      </div>
    </div>

    <!-- 圣地详情弹窗 -->
    <div v-if="showTempleModal" class="modal-overlay" @click="closeTempleModal">
      <div class="temple-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedTemple?.name }}</h3>
          <button @click="closeTempleModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div v-if="selectedTemple" class="temple-detail">
            <div class="temple-gallery">
              <img :src="selectedTemple.image" :alt="selectedTemple.name" />
            </div>
            
            <div class="temple-info-detail">
              <div class="info-row">
                <label>地址</label>
                <span>{{ selectedTemple.address }}</span>
              </div>
              <div class="info-row">
                <label>建立时间</label>
                <span>{{ selectedTemple.established }}</span>
              </div>
              <div class="info-row">
                <label>主要神祇</label>
                <span>{{ selectedTemple.deity }}</span>
              </div>
              <div class="info-row">
                <label>开放时间</label>
                <span>{{ selectedTemple.openHours }}</span>
              </div>
              <div class="info-row">
                <label>联系电话</label>
                <span>{{ selectedTemple.phone }}</span>
              </div>
            </div>
            
            <div class="temple-services-detail">
              <h4>提供服务</h4>
              <div class="services-grid">
                <div 
                  v-for="service in selectedTemple.detailServices" 
                  :key="service.name"
                  class="service-item"
                >
                  <iconify-icon :icon="service.icon" width="20"></iconify-icon>
                  <div class="service-info">
                    <h5>{{ service.name }}</h5>
                    <p>{{ service.description }}</p>
                    <span class="service-price">{{ service.price }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="contactTemple" class="contact-btn">
            <iconify-icon icon="heroicons:phone" width="16"></iconify-icon>
            联系圣地
          </button>
          <button @click="bookService" class="book-btn">
            <iconify-icon icon="heroicons:calendar" width="16"></iconify-icon>
            预约服务
          </button>
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
const genealogyId = ref(route.params.id)
const currentFunction = ref('temples')
const currentBlessingCategory = ref('all')
const showTempleModal = ref(false)
const selectedTemple = ref(null)

const functionTabs = ref([
  { label: '合作圣地', value: 'temples', icon: 'heroicons:building-library' },
  { label: '虚拟体验', value: 'virtual', icon: 'heroicons:eye' },
  { label: '开光器具', value: 'blessing', icon: 'heroicons:gift' }
])

const temples = ref([
  {
    id: 1,
    name: '少林寺',
    location: '河南登封',
    address: '河南省郑州市登封市嵩山少林寺',
    type: 'buddhist',
    rating: 4.8,
    cooperationCount: 156,
    description: '中国佛教禅宗祖庭，武术发源地',
    image: '/temples/shaolin.jpg',
    services: ['祈福法会', '超度法事', '开光加持'],
    established: '北魏太和十九年（495年）',
    deity: '释迦牟尼佛',
    openHours: '8:00-17:30',
    phone: '0371-62745000',
    detailServices: [
      {
        name: '祈福法会',
        description: '为家族祈福平安，消灾解厄',
        price: '功德金随喜',
        icon: 'heroicons:heart'
      },
      {
        name: '超度法事',
        description: '为先人超度，往生净土',
        price: '功德金随喜',
        icon: 'heroicons:sparkles'
      }
    ]
  }
])

const virtualExperiences = ref([
  {
    id: 1,
    title: '少林寺晨钟暮鼓体验',
    temple: '少林寺',
    description: '体验千年古刹的晨钟暮鼓，感受禅宗文化',
    preview: '/virtual/shaolin-preview.jpg',
    duration: 30,
    price: 0,
    hasVR: true,
    hasAudio: true,
    interactive: true
  }
])

const blessingCategories = ref([
  { label: '全部', value: 'all', icon: 'heroicons:squares-2x2' },
  { label: '护身符', value: 'amulet', icon: 'heroicons:shield-check' },
  { label: '佛珠手串', value: 'beads', icon: 'heroicons:circle-stack' },
  { label: '平安扣', value: 'pendant', icon: 'heroicons:heart' },
  { label: '法器', value: 'instrument', icon: 'heroicons:musical-note' }
])

const blessingItems = ref([
  {
    id: 1,
    name: '少林寺开光平安符',
    temple: '少林寺',
    category: 'amulet',
    description: '少林寺方丈亲自开光，保佑平安健康',
    image: '/blessing/peace-amulet.jpg',
    price: 88,
    originalPrice: 128,
    isBlessed: true
  }
])

// 计算属性
const filteredBlessingItems = computed(() => {
  if (currentBlessingCategory.value === 'all') {
    return blessingItems.value
  }
  return blessingItems.value.filter(item => item.category === currentBlessingCategory.value)
})

const shouldShowEmpty = computed(() => {
  if (currentFunction.value === 'temples') return temples.value.length === 0
  if (currentFunction.value === 'virtual') return virtualExperiences.value.length === 0
  if (currentFunction.value === 'blessing') return filteredBlessingItems.value.length === 0
  return false
})

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    // 加载圣地合作数据
    console.log('加载圣地合作数据')
  } catch (error) {
    console.error('加载数据失败:', error)
    appStore.showToast('加载数据失败', 'error')
  }
}

const setFunction = (func: string) => {
  currentFunction.value = func
}

const setBlessingCategory = (category: string) => {
  currentBlessingCategory.value = category
}

const getTempleTypeText = (type: string) => {
  const typeMap = {
    buddhist: '佛教',
    taoist: '道教',
    confucian: '儒教'
  }
  return typeMap[type] || type
}

const getEmptyIcon = () => {
  const iconMap = {
    temples: 'heroicons:building-library',
    virtual: 'heroicons:eye',
    blessing: 'heroicons:gift'
  }
  return iconMap[currentFunction.value] || 'heroicons:exclamation-triangle'
}

const getEmptyTitle = () => {
  const titleMap = {
    temples: '暂无合作圣地',
    virtual: '暂无虚拟体验',
    blessing: '暂无开光器具'
  }
  return titleMap[currentFunction.value] || '暂无数据'
}

const getEmptyDesc = () => {
  const descMap = {
    temples: '我们正在与更多圣地建立合作关系',
    virtual: '虚拟体验功能即将上线',
    blessing: '该分类下暂无商品'
  }
  return descMap[currentFunction.value] || '请稍后再试'
}

const viewTempleDetail = (temple: any) => {
  selectedTemple.value = temple
  showTempleModal.value = true
}

const closeTempleModal = () => {
  showTempleModal.value = false
  selectedTemple.value = null
}

const contactTemple = () => {
  if (selectedTemple.value?.phone) {
    window.open(`tel:${selectedTemple.value.phone}`)
  }
}

const bookService = () => {
  appStore.showToast('预约服务功能开发中', 'info')
}

const startExperience = (experience: any) => {
  if (experience.price > 0) {
    appStore.showToast('请先购买体验', 'info')
  } else {
    router.push(`/genealogy/${genealogyId.value}/virtual-experience/${experience.id}`)
  }
}

const viewBlessingDetail = (item: any) => {
  router.push(`/genealogy/${genealogyId.value}/blessing-item/${item.id}`)
}

const addToCart = (item: any) => {
  appStore.showToast('已添加到购物车', 'success')
}

const buyNow = (item: any) => {
  router.push(`/genealogy/${genealogyId.value}/blessing-order/${item.id}`)
}
</script>

<style scoped>
.sacred-cooperation-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 16px;
}

/* 功能标签 */
.function-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 75px;
}

.function-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.function-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.function-tab span {
  font-size: 12px;
  font-weight: 500;
}

/* 主要内容 */
.cooperation-content {
  padding: 16px;
}

.section-header {
  text-align: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.section-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* 圣地列表 */
.temples-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.temple-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.temple-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.temple-image {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.temple-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.temple-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.temple-badge.buddhist {
  background: #FF6B35;
}

.temple-badge.taoist {
  background: #4A90E2;
}

.temple-badge.confucian {
  background: #9B59B6;
}

.temple-info {
  padding: 16px;
}

.temple-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.temple-location {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.temple-desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.temple-services {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.service-tag {
  padding: 2px 6px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
}

.temple-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

/* 虚拟体验 */
.virtual-experiences {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.experience-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.experience-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.experience-preview {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.experience-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.experience-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.experience-info {
  padding: 16px;
}

.experience-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.experience-temple {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #07c160;
  font-weight: 500;
}

.experience-desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.experience-features {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  color: white;
}

.feature-tag.vr {
  background: #E74C3C;
}

.feature-tag.audio {
  background: #3498DB;
}

.feature-tag.interactive {
  background: #9B59B6;
}

.experience-price {
  text-align: right;
}

.experience-price .free {
  color: #07c160;
  font-weight: 600;
  font-size: 14px;
}

.experience-price .paid {
  color: #ff9500;
  font-weight: 600;
  font-size: 14px;
}

/* 开光器具 */
.blessing-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.blessing-categories::-webkit-scrollbar {
  display: none;
}

.blessing-category {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f0f0f0;
}

.blessing-category.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.blessing-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.blessing-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.blessing-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-image {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blessed-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.item-info {
  padding: 12px;
}

.item-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.item-temple {
  margin: 0 0 6px 0;
  font-size: 10px;
  color: #07c160;
  font-weight: 500;
}

.item-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-price {
  margin-bottom: 8px;
}

.current-price {
  color: #ff3b30;
  font-weight: bold;
  font-size: 14px;
}

.original-price {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
  margin-left: 4px;
}

.item-actions {
  display: flex;
  gap: 6px;
}

.add-cart-btn,
.buy-now-btn {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.2s;
}

.add-cart-btn {
  background: white;
  color: #666;
}

.add-cart-btn:hover {
  background: #f5f5f5;
}

.buy-now-btn {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.buy-now-btn:hover {
  background: #06a552;
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

/* 圣地详情弹窗 */
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

.temple-modal {
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
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 120px);
  overflow-y: auto;
}

.temple-gallery img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
}

.temple-info-detail {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row label {
  width: 80px;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.info-row span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.temple-services-detail h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.services-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.service-item iconify-icon {
  color: #07c160;
  flex-shrink: 0;
  margin-top: 2px;
}

.service-info {
  flex: 1;
}

.service-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.service-info p {
  margin: 0 0 6px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.service-price {
  font-size: 12px;
  color: #07c160;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.contact-btn,
.book-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.contact-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.contact-btn:hover {
  background: #e9ecef;
}

.book-btn {
  background: #07c160;
  color: white;
  border: 1px solid #07c160;
}

.book-btn:hover {
  background: #06a552;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .blessing-items {
    grid-template-columns: 1fr;
  }

  .function-tab {
    padding: 12px 4px;
  }

  .function-tab span {
    font-size: 10px;
  }

  .blessing-categories {
    padding: 0 8px;
  }

  .item-actions {
    flex-direction: column;
  }

  .add-cart-btn,
  .buy-now-btn {
    padding: 8px;
  }
}
</style>
