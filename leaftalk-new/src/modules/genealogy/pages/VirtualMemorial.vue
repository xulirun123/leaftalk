<template>
  <div class="virtual-memorial-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">虚拟祭奠</h1>
      <button @click="showMemorialHistory = true" class="history-btn">
        <iconify-icon icon="heroicons:clock" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 祭奠场景 -->
    <div class="memorial-scene">
      <div class="scene-background">
        <img :src="currentScene.background" alt="祭奠场景" />
        
        <!-- 墓碑/灵位 -->
        <div class="memorial-altar">
          <div class="ancestor-photo">
            <img :src="memberInfo.avatar || '/default-avatar.png'" alt="遗像" />
          </div>
          <div class="ancestor-name">{{ memberInfo.name }}</div>
          <div class="ancestor-dates">
            {{ formatDate(memberInfo.birthDate) }} - {{ formatDate(memberInfo.deathDate) }}
          </div>
        </div>
        
        <!-- 祭品展示区 -->
        <div class="offerings-area">
          <!-- 鲜花 -->
          <div class="offering-group flowers">
            <div 
              v-for="flower in placedFlowers" 
              :key="flower.id"
              class="offering-item flower"
              :style="flower.style"
            >
              <img :src="flower.image" :alt="flower.name" />
            </div>
          </div>
          
          <!-- 蜡烛 -->
          <div class="offering-group candles">
            <div 
              v-for="candle in placedCandles" 
              :key="candle.id"
              class="offering-item candle"
              :class="{ lit: candle.isLit }"
              :style="candle.style"
            >
              <img :src="candle.image" :alt="candle.name" />
              <div v-if="candle.isLit" class="flame"></div>
            </div>
          </div>
          
          <!-- 香炉 -->
          <div class="offering-group incense">
            <div 
              v-for="incense in placedIncense" 
              :key="incense.id"
              class="offering-item incense"
              :class="{ burning: incense.isBurning }"
              :style="incense.style"
            >
              <img :src="incense.image" :alt="incense.name" />
              <div v-if="incense.isBurning" class="smoke"></div>
            </div>
          </div>
          
          <!-- 供品 -->
          <div class="offering-group food">
            <div 
              v-for="food in placedFood" 
              :key="food.id"
              class="offering-item food"
              :style="food.style"
            >
              <img :src="food.image" :alt="food.name" />
            </div>
          </div>
        </div>
        
        <!-- 特效层 -->
        <div class="effects-layer">
          <!-- 飘落的花瓣 -->
          <div v-if="showPetalEffect" class="petal-effect">
            <div v-for="i in 20" :key="i" class="petal" :style="getPetalStyle(i)"></div>
          </div>
          
          <!-- 光效 -->
          <div v-if="showLightEffect" class="light-effect"></div>
        </div>
      </div>
    </div>

    <!-- 祭奠工具栏 -->
    <div class="memorial-toolbar">
      <div class="tool-categories">
        <div 
          v-for="category in offeringCategories" 
          :key="category.id"
          class="category-tab"
          :class="{ active: selectedCategory === category.id }"
          @click="selectedCategory = category.id"
        >
          <iconify-icon :icon="category.icon" width="20"></iconify-icon>
          <span>{{ category.name }}</span>
        </div>
      </div>
      
      <div class="offering-items">
        <div 
          v-for="item in currentOfferings" 
          :key="item.id"
          class="offering-option"
          @click="selectOffering(item)"
        >
          <img :src="item.image" :alt="item.name" />
          <div class="item-name">{{ item.name }}</div>
          <div class="item-price">
            <iconify-icon icon="heroicons:sparkles" width="12"></iconify-icon>
            {{ item.price }}
          </div>
        </div>
      </div>
    </div>

    <!-- 祭奠留言 -->
    <div class="memorial-message">
      <div class="message-header">
        <iconify-icon icon="heroicons:chat-bubble-left-ellipsis" width="20"></iconify-icon>
        <span>祭奠留言</span>
      </div>
      <textarea 
        v-model="memorialMessage" 
        placeholder="写下您想对逝者说的话..."
        class="message-input"
        rows="3"
      ></textarea>
      <button @click="submitMemorial" class="submit-btn" :disabled="!canSubmit">
        <iconify-icon icon="heroicons:paper-airplane" width="16"></iconify-icon>
        <span>提交祭奠</span>
      </button>
    </div>

    <!-- 祭奠历史弹窗 -->
    <div v-if="showMemorialHistory" class="modal-overlay" @click="showMemorialHistory = false">
      <div class="history-modal" @click.stop>
        <div class="modal-header">
          <h3>祭奠记录</h3>
          <button @click="showMemorialHistory = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="history-list">
          <div 
            v-for="record in memorialHistory" 
            :key="record.id"
            class="history-item"
          >
            <div class="history-avatar">
              <img :src="record.userAvatar || '/default-avatar.png'" :alt="record.userName" />
            </div>
            <div class="history-content">
              <div class="history-user">{{ record.userName }}</div>
              <div class="history-offerings">
                <span 
                  v-for="offering in record.offerings" 
                  :key="offering.id"
                  class="offering-tag"
                >
                  {{ offering.name }}
                </span>
              </div>
              <div class="history-message">{{ record.message }}</div>
              <div class="history-time">{{ formatTime(record.createdAt) }}</div>
            </div>
          </div>
          
          <div v-if="memorialHistory.length === 0" class="empty-history">
            <iconify-icon icon="heroicons:heart" width="48"></iconify-icon>
            <p>暂无祭奠记录</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 购买确认弹窗 -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click="showPurchaseModal = false">
      <div class="purchase-modal" @click.stop>
        <div class="modal-header">
          <h3>购买祭品</h3>
          <button @click="showPurchaseModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="purchase-content">
          <div class="item-preview">
            <img :src="selectedOffering?.image" :alt="selectedOffering?.name" />
            <div class="item-info">
              <div class="item-name">{{ selectedOffering?.name }}</div>
              <div class="item-desc">{{ selectedOffering?.description }}</div>
            </div>
          </div>
          
          <div class="payment-options">
            <div class="payment-title">选择支付方式</div>
            <div class="payment-methods">
              <label class="payment-method">
                <input type="radio" v-model="paymentMethod" value="beans" />
                <div class="method-content">
                  <iconify-icon icon="heroicons:sparkles" width="20"></iconify-icon>
                  <span>叶语豆支付</span>
                  <div class="price">{{ selectedOffering?.price * 10 }} 豆</div>
                </div>
              </label>
              <label class="payment-method">
                <input type="radio" v-model="paymentMethod" value="wallet" />
                <div class="method-content">
                  <iconify-icon icon="heroicons:wallet" width="20"></iconify-icon>
                  <span>叶语钱包支付</span>
                  <div class="price">¥{{ selectedOffering?.price }}</div>
                </div>
              </label>
            </div>
          </div>
          
          <div class="user-balance">
            <div class="balance-item">
              <iconify-icon icon="heroicons:sparkles" width="16"></iconify-icon>
              <span>叶语豆余额: {{ userBalance.beans }}</span>
            </div>
            <div class="balance-item">
              <iconify-icon icon="heroicons:wallet" width="16"></iconify-icon>
              <span>钱包余额: ¥{{ userBalance.wallet }}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showPurchaseModal = false" class="cancel-btn">取消</button>
          <button @click="purchaseOffering" class="purchase-btn" :disabled="!canPurchase">
            确认购买
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID和成员ID
const genealogyId = ref(route.params.genealogyId as string)
const memberId = ref(route.params.memberId as string)

// 成员信息
const memberInfo = ref({
  name: '',
  avatar: '',
  birthDate: '',
  deathDate: ''
})

// 祭奠场景
const currentScene = ref({
  id: 'traditional',
  name: '传统祭台',
  background: '/memorial-scene-traditional.jpg'
})

// 弹窗状态
const showMemorialHistory = ref(false)
const showPurchaseModal = ref(false)

// 选择状态
const selectedCategory = ref('flowers')
const selectedOffering = ref(null)
const paymentMethod = ref('beans')

// 祭奠留言
const memorialMessage = ref('')

// 已放置的祭品
const placedFlowers = ref([])
const placedCandles = ref([])
const placedIncense = ref([])
const placedFood = ref([])

// 特效状态
const showPetalEffect = ref(false)
const showLightEffect = ref(false)

// 祭奠历史
const memorialHistory = ref([])

// 用户余额
const userBalance = ref({
  beans: 0,
  wallet: 0
})

// 祭品分类
const offeringCategories = ref([
  { id: 'flowers', name: '鲜花', icon: 'mdi:flower' },
  { id: 'candles', name: '蜡烛', icon: 'mdi:candle' },
  { id: 'incense', name: '香烛', icon: 'mdi:incense' },
  { id: 'food', name: '供品', icon: 'mdi:food-apple' }
])

// 祭品选项
const offeringItems = ref({
  flowers: [
    { id: 'rose', name: '玫瑰花', image: '/offerings/rose.png', price: 5, description: '表达深深的思念' },
    { id: 'lily', name: '百合花', image: '/offerings/lily.png', price: 8, description: '象征纯洁的灵魂' },
    { id: 'chrysanthemum', name: '菊花', image: '/offerings/chrysanthemum.png', price: 6, description: '传统祭奠花卉' },
    { id: 'carnation', name: '康乃馨', image: '/offerings/carnation.png', price: 4, description: '表达对母亲的爱' }
  ],
  candles: [
    { id: 'red-candle', name: '红蜡烛', image: '/offerings/red-candle.png', price: 3, description: '祈福平安' },
    { id: 'white-candle', name: '白蜡烛', image: '/offerings/white-candle.png', price: 3, description: '寄托哀思' },
    { id: 'lotus-candle', name: '莲花蜡烛', image: '/offerings/lotus-candle.png', price: 10, description: '佛教祭奠' }
  ],
  incense: [
    { id: 'sandalwood', name: '檀香', image: '/offerings/sandalwood.png', price: 15, description: '高级香料' },
    { id: 'jasmine', name: '茉莉香', image: '/offerings/jasmine.png', price: 8, description: '清香淡雅' },
    { id: 'traditional', name: '传统香', image: '/offerings/traditional-incense.png', price: 5, description: '经典祭奠香' }
  ],
  food: [
    { id: 'fruit', name: '水果拼盘', image: '/offerings/fruit.png', price: 12, description: '新鲜水果' },
    { id: 'cake', name: '生日蛋糕', image: '/offerings/cake.png', price: 20, description: '纪念生日' },
    { id: 'wine', name: '美酒', image: '/offerings/wine.png', price: 25, description: '敬献美酒' },
    { id: 'tea', name: '茶水', image: '/offerings/tea.png', price: 8, description: '清茶一杯' }
  ]
})

// 计算属性
const currentOfferings = computed(() => {
  return offeringItems.value[selectedCategory.value] || []
})

const canSubmit = computed(() => {
  return memorialMessage.value.trim().length > 0 && 
         (placedFlowers.value.length > 0 || placedCandles.value.length > 0 || 
          placedIncense.value.length > 0 || placedFood.value.length > 0)
})

const canPurchase = computed(() => {
  if (!selectedOffering.value) return false
  
  if (paymentMethod.value === 'beans') {
    return userBalance.value.beans >= selectedOffering.value.price * 10
  } else {
    return userBalance.value.wallet >= selectedOffering.value.price
  }
})

// 生命周期
onMounted(() => {
  loadMemberInfo()
  loadUserBalance()
  loadMemorialHistory()
})

// 方法
const loadMemberInfo = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/${memberId.value}`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        memberInfo.value = result.data
      }
    }
  } catch (error) {
    console.error('加载成员信息失败:', error)
  }
}

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

const loadMemorialHistory = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/${memberId.value}/memorials`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        memorialHistory.value = result.data
      }
    }
  } catch (error) {
    console.error('加载祭奠历史失败:', error)
  }
}

const selectOffering = (item) => {
  selectedOffering.value = item
  showPurchaseModal.value = true
}

const purchaseOffering = async () => {
  try {
    appStore.showLoading('购买中...')
    
    const purchaseData = {
      offeringId: selectedOffering.value.id,
      paymentMethod: paymentMethod.value,
      amount: paymentMethod.value === 'beans' ? selectedOffering.value.price * 10 : selectedOffering.value.price
    }
    
    const response = await fetch('/api/offerings/purchase', {
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
        // 添加祭品到场景
        addOfferingToScene(selectedOffering.value)
        
        // 更新余额
        loadUserBalance()
        
        appStore.showToast('购买成功', 'success')
        showPurchaseModal.value = false
      } else {
        appStore.showToast(result.message || '购买失败', 'error')
      }
    } else {
      appStore.showToast('购买请求失败', 'error')
    }
  } catch (error) {
    console.error('购买祭品失败:', error)
    appStore.showToast('购买失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

const addOfferingToScene = (offering) => {
  const newOffering = {
    id: Date.now(),
    ...offering,
    style: getRandomPosition()
  }
  
  switch (selectedCategory.value) {
    case 'flowers':
      placedFlowers.value.push(newOffering)
      triggerPetalEffect()
      break
    case 'candles':
      newOffering.isLit = true
      placedCandles.value.push(newOffering)
      triggerLightEffect()
      break
    case 'incense':
      newOffering.isBurning = true
      placedIncense.value.push(newOffering)
      break
    case 'food':
      placedFood.value.push(newOffering)
      break
  }
}

const getRandomPosition = () => {
  return {
    left: Math.random() * 60 + 20 + '%',
    bottom: Math.random() * 30 + 10 + '%'
  }
}

const triggerPetalEffect = () => {
  showPetalEffect.value = true
  setTimeout(() => {
    showPetalEffect.value = false
  }, 3000)
}

const triggerLightEffect = () => {
  showLightEffect.value = true
  setTimeout(() => {
    showLightEffect.value = false
  }, 2000)
}

const getPetalStyle = (index) => {
  return {
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 2 + 's',
    animationDuration: (Math.random() * 3 + 2) + 's'
  }
}

const submitMemorial = async () => {
  try {
    appStore.showLoading('提交中...')
    
    const memorialData = {
      memberId: memberId.value,
      message: memorialMessage.value,
      offerings: [
        ...placedFlowers.value,
        ...placedCandles.value,
        ...placedIncense.value,
        ...placedFood.value
      ]
    }
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/memorials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(memorialData)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('祭奠提交成功', 'success')
        
        // 重置表单
        memorialMessage.value = ''
        placedFlowers.value = []
        placedCandles.value = []
        placedIncense.value = []
        placedFood.value = []
        
        // 重新加载历史
        loadMemorialHistory()
      } else {
        appStore.showToast(result.message || '提交失败', 'error')
      }
    } else {
      appStore.showToast('提交请求失败', 'error')
    }
  } catch (error) {
    console.error('提交祭奠失败:', error)
    appStore.showToast('提交失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 辅助方法
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.virtual-memorial-page {
  min-height: 100vh;
  background: #1a1a1a;
  color: white;
  overflow-x: hidden;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .history-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

/* 祭奠场景 */
.memorial-scene {
  height: 400px;
  position: relative;
  overflow: hidden;
}

.scene-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.scene-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 祭台 */
.memorial-altar {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
}

.ancestor-photo {
  width: 120px;
  height: 120px;
  margin: 0 auto 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.ancestor-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ancestor-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

.ancestor-dates {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

/* 祭品展示区 */
.offerings-area {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  z-index: 5;
}

.offering-group {
  position: absolute;
  width: 100%;
  height: 100%;
}

.offering-item {
  position: absolute;
  width: 40px;
  height: 40px;
  transition: all 0.3s ease;
}

.offering-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 蜡烛火焰效果 */
.candle.lit .flame {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 12px;
  background: radial-gradient(circle, #ff6b35 0%, #f7931e 50%, #ffeb3b 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: flicker 1s ease-in-out infinite alternate;
}

@keyframes flicker {
  0% { transform: translateX(-50%) scale(1) rotate(-1deg); }
  100% { transform: translateX(-50%) scale(1.1) rotate(1deg); }
}

/* 香烟效果 */
.incense.burning .smoke {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 30px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.6), transparent);
  animation: smoke 2s ease-in-out infinite;
}

@keyframes smoke {
  0% { opacity: 0.6; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(2); }
}

/* 特效层 */
.effects-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 15;
}

/* 花瓣飘落效果 */
.petal-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.petal {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  background: #ff69b4;
  border-radius: 50%;
  animation: fall linear infinite;
}

@keyframes fall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(400px) rotate(360deg);
    opacity: 0;
  }
}

/* 光效 */
.light-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow 2s ease-in-out;
}

@keyframes glow {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
}

/* 祭奠工具栏 */
.memorial-toolbar {
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
}

.tool-categories {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.category-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.category-tab.active {
  color: #ffd700;
  border-bottom-color: #ffd700;
}

.category-tab span {
  font-size: 12px;
}

.offering-items {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.offering-option {
  flex-shrink: 0;
  width: 80px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.offering-option:hover {
  transform: scale(1.05);
}

.offering-option img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 4px;
}

.item-name {
  font-size: 12px;
  color: white;
  margin-bottom: 2px;
}

.item-price {
  font-size: 10px;
  color: #ffd700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

/* 祭奠留言 */
.memorial-message {
  background: rgba(0, 0, 0, 0.8);
  margin: 16px;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #ffd700;
  font-size: 14px;
  font-weight: 500;
}

.message-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
}

.message-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.submit-btn {
  width: 100%;
  height: 44px;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.history-modal,
.purchase-modal {
  background: #2a2a2a;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 祭奠历史 */
.history-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.history-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-content {
  flex: 1;
}

.history-user {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.history-offerings {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.offering-tag {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.history-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  margin-bottom: 4px;
}

.history-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-history iconify-icon {
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
}

/* 购买弹窗 */
.purchase-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.item-preview {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.item-preview img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 8px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.payment-options {
  margin-bottom: 20px;
}

.payment-title {
  font-size: 14px;
  color: white;
  margin-bottom: 12px;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method:hover {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.05);
}

.payment-method input[type="radio"] {
  accent-color: #ffd700;
}

.method-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.price {
  margin-left: auto;
  font-weight: 500;
  color: #ffd700;
}

.user-balance {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.balance-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  flex: 1;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
}

.purchase-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #333;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.purchase-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}
</style>
