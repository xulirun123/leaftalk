<template>
  <div class="recharge-page">
    <!-- 顶部导航栏 -->
    <MobileTopBar 
      title="充值叶语豆" 
      :show-back="true" 
      @back="goBack"
    />

    <!-- 当前余额 -->
    <div class="current-balance">
      <div class="balance-info">
        <span class="balance-label">当前叶语豆</span>
        <span class="balance-amount">{{ currentBeans }}豆</span>
      </div>
    </div>

    <!-- 充值套餐 -->
    <div class="recharge-packages">
      <h3 class="section-title">选择充值套餐</h3>
      <div class="package-grid">
        <div 
          v-for="pkg in rechargePackages" 
          :key="pkg.id"
          class="package-item"
          :class="{ selected: selectedPackage?.id === pkg.id }"
          @click="selectPackage(pkg)"
        >
          <div class="package-beans">{{ pkg.beans }}豆</div>
          <div class="package-price">¥{{ pkg.price }}</div>
          <div v-if="pkg.bonus" class="package-bonus">送{{ pkg.bonus }}豆</div>
          <div v-if="pkg.popular" class="package-tag">热门</div>
        </div>
      </div>
    </div>

    <!-- 支付方式 -->
    <div class="payment-methods">
      <h3 class="section-title">支付方式</h3>
      <div class="method-list">
        <div 
          v-for="method in paymentMethods"
          :key="method.id"
          class="method-item"
          :class="{ selected: selectedMethod === method.id }"
          @click="selectedMethod = method.id"
        >
          <iconify-icon :icon="method.icon" width="24" class="method-icon"></iconify-icon>
          <span class="method-name">{{ method.name }}</span>
          <div class="method-radio">
            <div class="radio-dot" :class="{ active: selectedMethod === method.id }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 充值按钮 -->
    <div class="recharge-action">
      <button 
        class="recharge-btn" 
        :disabled="!selectedPackage"
        @click="confirmRecharge"
      >
        <span v-if="selectedPackage">
          立即支付 ¥{{ selectedPackage.price }}
        </span>
        <span v-else>请选择充值套餐</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()

// 当前叶语豆余额
const currentBeans = ref(1280)

// 选中的套餐和支付方式
const selectedPackage = ref(null)
const selectedMethod = ref('wallet')

// 充值套餐
const rechargePackages = ref([
  { id: 1, beans: 100, price: 10, bonus: 0 },
  { id: 2, beans: 300, price: 30, bonus: 30, popular: true },
  { id: 3, beans: 500, price: 50, bonus: 80 },
  { id: 4, beans: 1000, price: 100, bonus: 200 },
  { id: 5, beans: 2000, price: 200, bonus: 500 },
  { id: 6, beans: 5000, price: 500, bonus: 1500 }
])

// 支付方式
const paymentMethods = ref([
  {
    id: 'wallet',
    name: '叶语钱包',
    icon: 'heroicons:wallet'
  },
  {
    id: 'wechat',
    name: '微信支付',
    icon: 'heroicons:device-phone-mobile'
  },
  {
    id: 'alipay',
    name: '支付宝',
    icon: 'heroicons:credit-card'
  }
])

// 返回上一页
const goBack = () => {
  router.back()
}

// 选择套餐
const selectPackage = (pkg: any) => {
  selectedPackage.value = pkg
}

// 确认充值
const confirmRecharge = async () => {
  if (!selectedPackage.value) return

  try {
    // 这里应该调用充值API
    console.log('充值叶语豆:', {
      package: selectedPackage.value,
      method: selectedMethod.value
    })
    
    // 模拟充值成功
    alert(`充值成功！获得 ${selectedPackage.value.beans + (selectedPackage.value.bonus || 0)} 叶语豆`)
    router.back()
  } catch (error) {
    console.error('充值失败:', error)
    alert('充值失败，请重试')
  }
}

onMounted(() => {
  // 加载当前余额
  console.log('加载叶语豆余额')
})
</script>

<style scoped>
.recharge-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 当前余额 */
.current-balance {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  margin: 67px 16px 20px 16px;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.balance-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.balance-label {
  font-size: 14px;
  color: #8B4513;
  opacity: 0.8;
}

.balance-amount {
  font-size: 24px;
  font-weight: 700;
  color: #8B4513;
}

/* 充值套餐 */
.recharge-packages {
  margin: 0 16px 20px 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.package-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
  transition: all 0.2s ease;
}

.package-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.package-item.selected {
  border-color: #FFD700;
  background: #FFFBF0;
}

.package-beans {
  font-size: 18px;
  font-weight: 700;
  color: #FF6B35;
  margin-bottom: 4px;
}

.package-price {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.package-bonus {
  font-size: 12px;
  color: #07C160;
  font-weight: 500;
}

.package-tag {
  position: absolute;
  top: -1px;
  right: -1px;
  background: #FF6B35;
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 0 12px 0 8px;
}

/* 支付方式 */
.payment-methods {
  margin: 0 16px 20px 16px;
}

.method-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.method-item:last-child {
  border-bottom: none;
}

.method-item:hover {
  background: #f8f8f8;
}

.method-item.selected {
  background: #FFF8E1;
}

.method-icon {
  color: #FFD700;
  margin-right: 12px;
}

.method-name {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.method-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.method-item.selected .method-radio {
  border-color: #FFD700;
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.2s;
}

.radio-dot.active {
  background: #FFD700;
}

/* 充值按钮 */
.recharge-action {
  margin: auto 16px 32px 16px;
}

.recharge-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #8B4513;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recharge-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.recharge-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
