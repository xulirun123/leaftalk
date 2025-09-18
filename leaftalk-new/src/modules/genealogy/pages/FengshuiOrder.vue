<template>
  <div class="fengshui-order-page">
    <MobileTopBar 
      title="风水订单"
      :show-back="true"
      @back="goBack"
    />
    
    <div class="fengshui-order-content scroll-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else class="order-container">
        <!-- 服务信息 -->
        <div class="service-info-card">
          <h3>服务信息</h3>
          <div class="service-details">
            <div class="service-item">
              <span class="label">服务名称：</span>
              <span class="value">AI智能取名</span>
            </div>
            <div class="service-item">
              <span class="label">服务价格：</span>
              <span class="value price">¥199</span>
            </div>
            <div class="service-item">
              <span class="label">交付时间：</span>
              <span class="value">24小时内</span>
            </div>
          </div>
        </div>

        <!-- 填写信息表单 -->
        <div class="form-card">
          <h3>请填写相关信息</h3>
          <form @submit.prevent="submitOrder">
            <div class="form-group">
              <label>宝宝姓氏 *</label>
              <input 
                v-model="orderForm.surname" 
                type="text" 
                placeholder="请输入宝宝姓氏"
                required
              />
            </div>
            
            <div class="form-group">
              <label>宝宝性别 *</label>
              <div class="radio-group">
                <label class="radio-item">
                  <input type="radio" v-model="orderForm.gender" value="男" />
                  <span>男</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="orderForm.gender" value="女" />
                  <span>女</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label>出生日期 *</label>
              <input 
                v-model="orderForm.birthDate" 
                type="date"
                required
              />
            </div>
            
            <div class="form-group">
              <label>出生时间</label>
              <input 
                v-model="orderForm.birthTime" 
                type="time"
              />
            </div>
            
            <div class="form-group">
              <label>出生地点</label>
              <input 
                v-model="orderForm.birthPlace" 
                type="text" 
                placeholder="请输入出生地点"
              />
            </div>
            
            <div class="form-group">
              <label>父亲姓名</label>
              <input 
                v-model="orderForm.fatherName" 
                type="text" 
                placeholder="请输入父亲姓名"
              />
            </div>
            
            <div class="form-group">
              <label>母亲姓名</label>
              <input 
                v-model="orderForm.motherName" 
                type="text" 
                placeholder="请输入母亲姓名"
              />
            </div>
            
            <div class="form-group">
              <label>特殊要求</label>
              <textarea 
                v-model="orderForm.requirements" 
                placeholder="请输入特殊要求或期望（可选）"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>联系电话 *</label>
              <input 
                v-model="orderForm.phone" 
                type="tel" 
                placeholder="请输入联系电话"
                required
              />
            </div>
          </form>
        </div>

        <!-- 订单总结 -->
        <div class="order-summary-card">
          <h3>订单总结</h3>
          <div class="summary-details">
            <div class="summary-item">
              <span>服务费用</span>
              <span>¥199</span>
            </div>
            <div class="summary-item">
              <span>优惠折扣</span>
              <span class="discount">-¥0</span>
            </div>
            <div class="summary-item total">
              <span>总计</span>
              <span class="total-price">¥199</span>
            </div>
          </div>
        </div>

        <!-- 支付方式 -->
        <div class="payment-card">
          <h3>支付方式</h3>
          <div class="payment-methods">
            <label class="payment-method" :class="{ active: paymentMethod === 'wallet' }">
              <input type="radio" v-model="paymentMethod" value="wallet" />
              <div class="method-info">
                <iconify-icon icon="heroicons:wallet" width="24"></iconify-icon>
                <span>叶语钱包</span>
                <small>余额：¥299.50</small>
              </div>
            </label>
            
            <label class="payment-method" :class="{ active: paymentMethod === 'beans' }">
              <input type="radio" v-model="paymentMethod" value="beans" />
              <div class="method-info">
                <iconify-icon icon="heroicons:sparkles" width="24"></iconify-icon>
                <span>叶语豆</span>
                <small>余额：1580豆 (需要1990豆)</small>
              </div>
            </label>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="submit-section">
          <button @click="submitOrder" class="submit-btn" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交订单并支付' }}
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
const submitting = ref(false)
const paymentMethod = ref('wallet')
const orderForm = ref({
  surname: '',
  gender: '',
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  fatherName: '',
  motherName: '',
  requirements: '',
  phone: ''
})

// 生命周期
onMounted(() => {
  loadOrderData()
})

// 方法
const goBack = () => {
  router.back()
}

const loadOrderData = async () => {
  loading.value = true
  try {
    // 模拟加载订单数据
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('加载订单数据失败:', error)
    appStore.showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

const submitOrder = async () => {
  // 表单验证
  if (!orderForm.value.surname || !orderForm.value.gender || !orderForm.value.birthDate || !orderForm.value.phone) {
    appStore.showToast('请填写必填信息', 'error')
    return
  }

  submitting.value = true
  try {
    // 模拟提交订单
    appStore.showToast('正在提交订单...', 'info')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟支付
    appStore.showToast('正在处理支付...', 'info')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    appStore.showToast('订单提交成功！', 'success')
    
    // 跳转到订单详情或成功页面
    setTimeout(() => {
      router.push(`/genealogy/${route.params.id}/ai-name-fengshui`)
    }, 1000)
    
  } catch (error) {
    console.error('提交订单失败:', error)
    appStore.showToast('提交失败，请重试', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.fengshui-order-page {
  height: 100vh;
  background: #f5f5f5;
}

.fengshui-order-content {
  padding: 16px;
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding-bottom: 100px;
}

.loading-state {
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

.order-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-info-card,
.form-card,
.order-summary-card,
.payment-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.service-info-card h3,
.form-card h3,
.order-summary-card h3,
.payment-card h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.service-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-item .label {
  color: #666;
  font-size: 14px;
}

.service-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.service-item .value.price {
  color: #ff4757;
  font-size: 16px;
  font-weight: bold;
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
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #07C160;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-item input[type="radio"] {
  width: auto;
  margin: 0;
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.summary-item.total {
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  font-weight: bold;
  font-size: 16px;
}

.discount {
  color: #07C160;
}

.total-price {
  color: #ff4757;
  font-size: 18px;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method.active {
  border-color: #07C160;
  background: #f0f9f4;
}

.payment-method input[type="radio"] {
  margin: 0;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.method-info iconify-icon {
  color: #07C160;
}

.method-info span {
  font-weight: 500;
  color: #333;
}

.method-info small {
  color: #666;
  margin-left: auto;
}

.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
