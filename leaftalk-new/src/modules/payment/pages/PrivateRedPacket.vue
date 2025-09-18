<template>
  <div class="private-red-packet-page">
    <MobileTopBar
      title="发红包"
      :showBack="true"
      @back="goBack"
    />
    
    <div class="page-content">
      <!-- 红包类型提示 -->
      <div class="packet-type-info">
        <div class="type-icon">
          <iconify-icon icon="heroicons:gift" width="32" color="#ff4757"></iconify-icon>
        </div>
        <div class="type-text">
          <h3>普通红包</h3>
          <p>私聊只能发送普通红包</p>
        </div>
      </div>

      <!-- 接收人信息 -->
      <div class="receiver-info">
        <div class="receiver-avatar">
          <img :src="receiverInfo.avatar" :alt="receiverInfo.name" />
        </div>
        <div class="receiver-details">
          <h4>{{ receiverInfo.name }}</h4>
          <span>接收红包</span>
        </div>
      </div>

      <!-- 红包配置 -->
      <div class="packet-config">
        <div class="config-item">
          <label>红包金额</label>
          <div class="amount-input-container">
            <span class="currency">¥</span>
            <input 
              v-model="packetAmount"
              type="number" 
              placeholder="0.00"
              class="amount-input"
              step="0.01"
              min="0.01"
              max="200"
              @input="validateAmount"
            >
          </div>
          <div v-if="amountError" class="error-text">{{ amountError }}</div>
          <div class="amount-tips">
            <span>单个红包金额限制：¥0.01 - ¥200.00</span>
          </div>
        </div>

        <div class="config-item">
          <label>祝福语</label>
          <textarea 
            v-model="blessing"
            placeholder="恭喜发财，大吉大利"
            class="blessing-input"
            maxlength="50"
            rows="3"
          ></textarea>
          <div class="char-count">{{ blessing.length }}/50</div>
        </div>
      </div>

      <!-- 余额信息 -->
      <div class="balance-info">
        <div class="balance-item">
          <span>当前余额</span>
          <span class="balance-amount">¥{{ currentBalance.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 发送按钮 -->
      <div class="send-section">
        <button 
          @click="showConfirmDialog" 
          :disabled="!canSend"
          class="send-btn"
        >
          塞钱进红包
        </button>
      </div>
    </div>

    <!-- 确认发送弹窗 -->
    <div v-if="showConfirm" class="confirm-overlay" @click="hideConfirmDialog">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-header">
          <h3>确认发送红包</h3>
        </div>
        
        <div class="confirm-content">
          <div class="packet-preview">
            <div class="preview-icon">
              <iconify-icon icon="heroicons:gift" width="48" color="#ff4757"></iconify-icon>
            </div>
            <div class="preview-info">
              <div class="info-item">
                <span class="label">接收人:</span>
                <span class="value">{{ receiverInfo.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">金额:</span>
                <span class="value">¥{{ parseFloat(packetAmount).toFixed(2) }}</span>
              </div>
              <div class="info-item">
                <span class="label">祝福语:</span>
                <span class="value">{{ blessing || '恭喜发财，大吉大利' }}</span>
              </div>
            </div>
          </div>
          
          <div class="payment-password">
            <label>支付密码</label>
            <input 
              v-model="paymentPassword"
              type="password" 
              placeholder="请输入支付密码"
              class="password-input"
              maxlength="6"
            >
          </div>
        </div>
        
        <div class="confirm-actions">
          <button @click="hideConfirmDialog" class="cancel-btn">取消</button>
          <button 
            @click="confirmSend" 
            :disabled="!canConfirmSend"
            class="confirm-btn"
          >
            确认发送
          </button>
        </div>
      </div>
    </div>

    <!-- 发送结果弹窗 -->
    <div v-if="showResult" class="result-overlay" @click="hideResultDialog">
      <div class="result-dialog" @click.stop>
        <div class="result-content">
          <div v-if="sendResult.success" class="success-result">
            <iconify-icon icon="heroicons:check-circle" width="64" color="#07C160"></iconify-icon>
            <h3>红包发送成功！</h3>
            <p>已发送给 {{ receiverInfo.name }}</p>
            <div class="result-amount">¥{{ parseFloat(packetAmount).toFixed(2) }}</div>
          </div>
          
          <div v-else class="error-result">
            <iconify-icon icon="heroicons:x-circle" width="64" color="#ff4757"></iconify-icon>
            <h3>发送失败</h3>
            <p>{{ sendResult.message || '网络错误，请重试' }}</p>
          </div>
        </div>
        
        <div class="result-actions">
          <button @click="hideResultDialog" class="result-btn">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const packetAmount = ref('')
const blessing = ref('')
const amountError = ref('')
const showConfirm = ref(false)
const showResult = ref(false)
const paymentPassword = ref('')
const sendResult = ref<any>({})
const currentBalance = ref(1000.00) // 模拟余额

// 接收人信息
const receiverInfo = ref({
  id: route.params.chatId,
  name: '张三',
  avatar: '/avatar1.jpg'
})

// 计算属性
const canSend = computed(() => {
  const amount = parseFloat(packetAmount.value)
  return amount > 0 && amount <= 200 && amount <= currentBalance.value && !amountError.value
})

const canConfirmSend = computed(() => {
  return canSend.value && paymentPassword.value.length === 6
})

// 生命周期
onMounted(() => {
  console.log('私聊红包页面加载:', route.params.chatId)
  loadReceiverInfo()
})

// 方法
const goBack = () => {
  router.back()
}

const loadReceiverInfo = () => {
  // 这里应该根据chatId加载接收人信息
  console.log('加载接收人信息:', route.params.chatId)
}

const validateAmount = () => {
  const amount = parseFloat(packetAmount.value)
  
  if (isNaN(amount) || amount <= 0) {
    amountError.value = '请输入有效金额'
    return
  }
  
  if (amount < 0.01) {
    amountError.value = '红包金额不能少于0.01元'
    return
  }
  
  if (amount > 200) {
    amountError.value = '单个红包不能超过200元'
    return
  }
  
  if (amount > currentBalance.value) {
    amountError.value = '余额不足'
    return
  }
  
  amountError.value = ''
}

const showConfirmDialog = () => {
  if (!canSend.value) return
  showConfirm.value = true
}

const hideConfirmDialog = () => {
  showConfirm.value = false
  paymentPassword.value = ''
}

const confirmSend = async () => {
  try {
    // 模拟发送红包API调用
    console.log('发送私聊红包:', {
      receiverId: receiverInfo.value.id,
      amount: parseFloat(packetAmount.value),
      blessing: blessing.value || '恭喜发财，大吉大利',
      password: paymentPassword.value
    })

    // 模拟API响应
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    sendResult.value = {
      success: true,
      message: '红包发送成功'
    }
    
    hideConfirmDialog()
    showResult.value = true
    
    // 更新余额
    currentBalance.value -= parseFloat(packetAmount.value)
    
  } catch (error) {
    console.error('发送红包失败:', error)
    sendResult.value = {
      success: false,
      message: '发送失败，请重试'
    }
    showResult.value = true
  }
}

const hideResultDialog = () => {
  showResult.value = false
  if (sendResult.value.success) {
    // 发送成功后返回聊天页面
    router.back()
  }
}
</script>

<style scoped>
.private-red-packet-page {
  height: 100vh;
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
}

.page-content {
  height: calc(100vh - 75px);
  overflow-y: auto;
  padding: 20px;
}

.packet-type-info {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.type-text h3 {
  color: white;
  margin: 0 0 4px 0;
  font-size: 18px;
}

.type-text p {
  color: rgba(255,255,255,0.8);
  margin: 0;
  font-size: 14px;
}

.receiver-info {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.receiver-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
}

.receiver-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.receiver-details h4 {
  color: white;
  margin: 0 0 4px 0;
  font-size: 16px;
}

.receiver-details span {
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}

.packet-config {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.config-item {
  margin-bottom: 20px;
}

.config-item:last-child {
  margin-bottom: 0;
}

.config-item label {
  display: block;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.amount-input-container {
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  transition: border-color 0.2s;
}

.amount-input-container:focus-within {
  border-color: #ff4757;
}

.currency {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-right: 8px;
}

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.error-text {
  color: #ff4757;
  font-size: 12px;
  margin-top: 4px;
}

.amount-tips {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.blessing-input {
  width: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.blessing-input:focus {
  border-color: #ff4757;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.balance-info {
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.balance-amount {
  font-size: 18px;
  font-weight: bold;
}

.send-section {
  margin-bottom: 20px;
}

.send-btn {
  width: 100%;
  background: #ffd700;
  color: #333;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #ffed4e;
  transform: translateY(-2px);
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 弹窗样式 */
.confirm-overlay,
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.confirm-dialog,
.result-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.confirm-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 16px 0;
  text-align: center;
}

.packet-preview {
  text-align: center;
  margin-bottom: 20px;
}

.preview-icon {
  margin-bottom: 12px;
}

.preview-info {
  text-align: left;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.payment-password {
  margin-bottom: 20px;
}

.payment-password label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.password-input {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.password-input:focus {
  border-color: #ff4757;
}

.confirm-actions,
.result-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.confirm-btn,
.result-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.confirm-btn {
  background: #ff4757;
  color: white;
}

.result-btn {
  background: #07C160;
  color: white;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn:hover:not(:disabled) {
  background: #ff3742;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-btn:hover {
  background: #06a552;
}

.result-content {
  text-align: center;
  margin-bottom: 20px;
}

.success-result h3,
.error-result h3 {
  font-size: 18px;
  margin: 16px 0 8px 0;
}

.success-result h3 {
  color: #07C160;
}

.error-result h3 {
  color: #ff4757;
}

.success-result p,
.error-result p {
  color: #666;
  margin: 0 0 12px 0;
}

.result-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ff4757;
}
</style>
