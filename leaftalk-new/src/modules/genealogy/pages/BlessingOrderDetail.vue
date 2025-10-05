<template>
  <div class="blessing-order-page">
    <MobileTopBar 
      :title="order?.title || '祈福订单'"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="blessing-order-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadOrderDetail" class="retry-btn">重试</button>
      </div>
      
      <div v-else-if="order" class="order-content">
        <div class="order-header">
          <h1 class="order-title">{{ order.title }}</h1>
          <div class="order-meta">
            <div class="meta-item">
              <span class="meta-label">订单号：</span>
              <span class="meta-value">{{ order.orderNo }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">状态：</span>
              <span class="meta-value" :class="order.status">{{ getStatusText(order.status) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">金额：</span>
              <span class="meta-value price">¥{{ order.amount }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">下单时间：</span>
              <span class="meta-value">{{ formatDate(order.createTime) }}</span>
            </div>
          </div>
        </div>
        
        <div class="order-description">
          <h3>祈福内容</h3>
          <p>{{ order.description }}</p>
        </div>
        
        <div class="blessing-details">
          <h3>祈福详情</h3>
          <div class="details-list">
            <div class="detail-item">
              <span class="detail-label">祈福类型：</span>
              <span class="detail-value">{{ order.blessingType }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">祈福对象：</span>
              <span class="detail-value">{{ order.blessingTarget }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">祈福期限：</span>
              <span class="detail-value">{{ order.duration }}</span>
            </div>
          </div>
        </div>
        
        <div class="order-actions">
          <button 
            v-if="order.status === 'pending'" 
            @click="payOrder" 
            class="action-btn primary"
          >
            立即支付
          </button>
          <button 
            v-if="order.status === 'pending'" 
            @click="cancelOrder" 
            class="action-btn secondary"
          >
            取消订单
          </button>
          <button 
            v-if="order.status === 'completed'" 
            @click="viewCertificate" 
            class="action-btn primary"
          >
            查看证书
          </button>
          <button @click="shareOrder" class="action-btn secondary">分享</button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>订单不存在</p>
      </div>
    </div>

    <!-- 支付弹窗 -->
    <div v-if="showPaymentDialog" class="payment-overlay" @click="cancelPayment">
      <div class="payment-dialog" @click.stop>
        <div class="payment-header">
          <h3>选择支付方式</h3>
          <button @click="cancelPayment" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="payment-amount">
          <span class="amount-label">支付金额</span>
          <span class="amount-value">¥{{ order?.amount }}</span>
        </div>

        <div class="payment-methods">
          <div
            class="payment-method"
            :class="{ active: selectedPaymentMethod === 'wallet' }"
            @click="selectedPaymentMethod = 'wallet'"
          >
            <div class="method-icon wallet">
              <iconify-icon icon="heroicons:wallet" width="24"></iconify-icon>
            </div>
            <div class="method-info">
              <span class="method-name">叶语钱包</span>
              <span class="method-balance">余额：¥{{ userBalance.wallet.toFixed(2) }}</span>
            </div>
            <div class="method-radio">
              <div v-if="selectedPaymentMethod === 'wallet'" class="radio-checked"></div>
            </div>
          </div>

          <div
            class="payment-method"
            :class="{ active: selectedPaymentMethod === 'beans' }"
            @click="selectedPaymentMethod = 'beans'"
          >
            <div class="method-icon beans">
              <iconify-icon icon="heroicons:sparkles" width="24"></iconify-icon>
            </div>
            <div class="method-info">
              <span class="method-name">叶语豆</span>
              <span class="method-balance">余额：{{ userBalance.beans }}豆 (需要{{ Math.ceil((order?.amount || 0) * 10) }}豆)</span>
            </div>
            <div class="method-radio">
              <div v-if="selectedPaymentMethod === 'beans'" class="radio-checked"></div>
            </div>
          </div>
        </div>

        <div class="payment-actions">
          <button @click="cancelPayment" class="cancel-btn">取消</button>
          <button @click="confirmPayment" class="confirm-btn">确认支付</button>
        </div>
      </div>
    </div>

    <!-- 余额不足弹窗 -->
    <div v-if="showInsufficientBalance" class="payment-overlay" @click="closeInsufficientDialog">
      <div class="payment-dialog" @click.stop>
        <div class="payment-header">
          <h3>余额不足</h3>
          <button @click="closeInsufficientDialog" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="insufficient-content">
          <div class="insufficient-icon">
            <iconify-icon icon="heroicons:exclamation-triangle" width="48" color="#ff9500"></iconify-icon>
          </div>

          <div class="insufficient-message">
            <p v-if="selectedPaymentMethod === 'wallet'">
              叶语钱包余额不足，当前余额：¥{{ userBalance.wallet.toFixed(2) }}
            </p>
            <p v-else-if="selectedPaymentMethod === 'beans'">
              叶语豆余额不足，当前余额：{{ userBalance.beans }}豆，需要：{{ Math.ceil((order?.amount || 0) * 10) }}豆
            </p>
            <p class="insufficient-tip">请先充值后再进行支付</p>
          </div>
        </div>

        <div class="payment-actions">
          <button @click="closeInsufficientDialog" class="cancel-btn">取消</button>
          <button @click="goToRecharge" class="confirm-btn">去充值</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const orderId = ref(route.params.orderId)
const order = ref(null)
const loading = ref(false)
const error = ref('')

// 生命周期
onMounted(() => {
  loadOrderDetail()
})

// 方法
const goBack = () => {
  router.back()
}

const loadOrderDetail = async () => {
  if (!genealogyId.value || !orderId.value) {
    error.value = '参数错误'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 模拟数据
    order.value = {
      id: orderId.value,
      orderNo: 'BL' + Date.now(),
      title: '家族平安祈福',
      description: '为家族成员祈求平安健康，事业顺利，家庭和睦。',
      amount: 99.00,
      status: 'pending',
      blessingType: '平安祈福',
      blessingTarget: '全家族成员',
      duration: '一年',
      createTime: new Date().toISOString()
    }

  } catch (err) {
    console.error('加载订单详情失败:', err)
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待支付',
    paid: '已支付',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const payOrder = () => {
  // 显示支付选择弹窗
  showPaymentDialog.value = true
}

// 支付相关
const showPaymentDialog = ref(false)
const selectedPaymentMethod = ref('wallet')
const userBalance = ref({ wallet: 299.50, beans: 1580 }) // 模拟用户余额
const showInsufficientBalance = ref(false)

const confirmPayment = async () => {
  try {
    // 检查余额是否足够
    const amount = order.value?.amount || 0

    if (selectedPaymentMethod.value === 'wallet') {
      if (userBalance.value.wallet < amount) {
        showInsufficientBalance.value = true
        return
      }
    } else if (selectedPaymentMethod.value === 'beans') {
      const beansNeeded = Math.ceil(amount * 10) // 1元 = 10叶语豆
      if (userBalance.value.beans < beansNeeded) {
        showInsufficientBalance.value = true
        return
      }
    }

    // 模拟支付过程
    appStore.showToast('正在处理支付...', 'info')

    // 模拟支付延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 扣除余额
    if (selectedPaymentMethod.value === 'wallet') {
      userBalance.value.wallet -= amount
      appStore.showToast(`支付成功！叶语钱包余额：¥${userBalance.value.wallet.toFixed(2)}`, 'success')
    } else if (selectedPaymentMethod.value === 'beans') {
      const beansUsed = Math.ceil(amount * 10)
      userBalance.value.beans -= beansUsed
      appStore.showToast(`支付成功！叶语豆余额：${userBalance.value.beans}豆`, 'success')
    }

    if (order.value) {
      order.value.status = 'paid'
      showPaymentDialog.value = false
    }
  } catch (error) {
    appStore.showToast('支付失败，请重试', 'error')
  }
}

const cancelPayment = () => {
  showPaymentDialog.value = false
}

const closeInsufficientDialog = () => {
  showInsufficientBalance.value = false
}

const goToRecharge = () => {
  showInsufficientBalance.value = false
  showPaymentDialog.value = false
  appStore.showToast('跳转到充值页面', 'info')
  // 这里可以跳转到充值页面
  // router.push('/wallet/recharge')
}

const cancelOrder = () => {
  if (order.value) {
    order.value.status = 'cancelled'
    appStore.showToast('订单已取消', 'success')
  }
}

const viewCertificate = () => {
  appStore.showToast('证书查看功能开发中', 'info')
}

const shareOrder = () => {
  appStore.showToast('正在分享到叶语朋友圈...', 'info')
  // 跳转到叶语朋友圈发布页面
  setTimeout(() => {
    const content = `我刚刚完成了${order.value?.title}的祈福订单，为家族祈福平安！🙏`
    router.push(`/moments/publish?content=${encodeURIComponent(content)}&type=blessing`)
  }, 1000)
}
</script>

<style scoped>
.blessing-order-page {
  height: 100vh;
  background: #f5f5f5;
}

.blessing-order-content {
  padding: 16px;
  height: calc(100vh - 75px);
  overflow-y: auto;
}

.loading-state, .error-state, .empty-state {
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

.retry-btn {
  padding: 8px 16px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 4px;
  margin-top: 16px;
}

.order-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.order-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.order-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.meta-value {
  color: #333;
}

.meta-value.pending {
  color: #ff9500;
}

.meta-value.paid {
  color: #07C160;
}

.meta-value.completed {
  color: #07C160;
}

.meta-value.cancelled {
  color: #999;
}

.meta-value.price {
  color: #ff4757;
  font-weight: bold;
  font-size: 18px;
}

.order-description, .blessing-details {
  margin-bottom: 24px;
}

.order-description h3, .blessing-details h3 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.order-description p {
  color: #666;
  line-height: 1.6;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.detail-value {
  color: #333;
}

.order-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.action-btn.primary {
  background: #07C160;
  color: white;
}

.action-btn.secondary {
  background: #f0f0f0;
  color: #333;
}

/* 支付弹窗样式 */
.payment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.payment-dialog {
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.payment-header h3 {
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

.payment-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.amount-label {
  color: #666;
  font-size: 14px;
}

.amount-value {
  color: #ff4757;
  font-size: 20px;
  font-weight: bold;
}

.payment-methods {
  margin-bottom: 24px;
}

.payment-method {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method:last-child {
  margin-bottom: 0;
}

.payment-method.active {
  border-color: #07C160;
  background: #f0f9f4;
}

.method-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.method-icon.wallet {
  background: #07C160;
  color: white;
}

.method-icon.beans {
  background: #ff9500;
  color: white;
}

.method-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.method-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.method-balance {
  font-size: 14px;
  color: #666;
}

.method-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-method.active .method-radio {
  border-color: #07C160;
}

.radio-checked {
  width: 10px;
  height: 10px;
  background: #07C160;
  border-radius: 50%;
}

.payment-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn, .confirm-btn {
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

/* 余额不足弹窗样式 */
.insufficient-content {
  text-align: center;
  padding: 20px 0;
}

.insufficient-icon {
  margin-bottom: 16px;
}

.insufficient-message {
  margin-bottom: 20px;
}

.insufficient-message p {
  margin: 8px 0;
  color: #333;
  line-height: 1.5;
}

.insufficient-tip {
  color: #666;
  font-size: 14px;
}
</style>
