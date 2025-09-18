<template>
  <div class="group-red-packet-page">
    <MobileTopBar
      title="发红包"
      :showBack="true"
      @back="goBack"
    />
    
    <div class="page-content">
      <!-- 红包类型提示 -->
      <div class="packet-type-info">
        <div class="type-icon">
          <iconify-icon icon="heroicons:sparkles" width="32" color="#ffd700"></iconify-icon>
        </div>
        <div class="type-text">
          <h3>拼手气红包</h3>
          <p>群聊只能发送拼手气红包</p>
        </div>
      </div>

      <!-- 群聊信息 -->
      <div class="group-info">
        <div class="group-avatar">
          <img :src="groupInfo.avatar" :alt="groupInfo.name" />
        </div>
        <div class="group-details">
          <h4>{{ groupInfo.name }}</h4>
          <span>{{ groupInfo.memberCount }}人</span>
        </div>
      </div>

      <!-- 红包配置 -->
      <div class="packet-config">
        <div class="config-item">
          <label>红包总金额</label>
          <div class="amount-input-container">
            <span class="currency">¥</span>
            <input 
              v-model="packetAmount"
              type="number" 
              placeholder="0.00"
              class="amount-input"
              step="0.01"
              min="0.01"
              @input="validateAmount"
            >
          </div>
          <div v-if="amountError" class="error-text">{{ amountError }}</div>
          <div class="amount-tips">
            <span>拼手气红包金额将随机分配给群成员</span>
          </div>
        </div>

        <div class="config-item">
          <label>红包个数</label>
          <div class="count-input-container">
            <button @click="decreaseCount" class="count-btn">-</button>
            <input 
              v-model="packetCount"
              type="number" 
              class="count-input"
              min="1"
              :max="groupInfo.memberCount"
              @input="validateCount"
            >
            <button @click="increaseCount" class="count-btn">+</button>
          </div>
          <div class="count-tips">
            <span>最多{{ groupInfo.memberCount }}个（群成员数量）</span>
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

      <!-- 红包预览 -->
      <div class="packet-preview">
        <div class="preview-title">红包预览</div>
        <div class="preview-content">
          <div class="preview-item">
            <span>总金额</span>
            <span class="preview-value">¥{{ parseFloat(packetAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="preview-item">
            <span>红包个数</span>
            <span class="preview-value">{{ packetCount }}个</span>
          </div>
          <div class="preview-item">
            <span>平均金额</span>
            <span class="preview-value">¥{{ averageAmount.toFixed(2) }}</span>
          </div>
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
          <div class="packet-preview-dialog">
            <div class="preview-icon">
              <iconify-icon icon="heroicons:sparkles" width="48" color="#ffd700"></iconify-icon>
            </div>
            <div class="preview-info">
              <div class="info-item">
                <span class="label">群聊:</span>
                <span class="value">{{ groupInfo.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">总金额:</span>
                <span class="value">¥{{ parseFloat(packetAmount).toFixed(2) }}</span>
              </div>
              <div class="info-item">
                <span class="label">红包个数:</span>
                <span class="value">{{ packetCount }}个</span>
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
            <p>已发送到 {{ groupInfo.name }}</p>
            <div class="result-details">
              <div class="result-amount">¥{{ parseFloat(packetAmount).toFixed(2) }}</div>
              <div class="result-count">{{ packetCount }}个红包</div>
            </div>
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
const packetCount = ref(1)
const blessing = ref('')
const amountError = ref('')
const showConfirm = ref(false)
const showResult = ref(false)
const paymentPassword = ref('')
const sendResult = ref<any>({})
const currentBalance = ref(1000.00) // 模拟余额

// 群聊信息
const groupInfo = ref({
  id: route.params.groupId,
  name: '家族群聊',
  avatar: '/group-avatar.jpg',
  memberCount: 15
})

// 计算属性
const averageAmount = computed(() => {
  const amount = parseFloat(packetAmount.value) || 0
  return amount / packetCount.value
})

const canSend = computed(() => {
  const amount = parseFloat(packetAmount.value)
  return amount > 0 && 
         amount <= currentBalance.value && 
         !amountError.value &&
         packetCount.value > 0 &&
         packetCount.value <= groupInfo.value.memberCount &&
         amount >= packetCount.value * 0.01 // 每个红包至少0.01元
})

const canConfirmSend = computed(() => {
  return canSend.value && paymentPassword.value.length === 6
})

// 生命周期
onMounted(() => {
  console.log('群聊红包页面加载:', route.params.groupId)
  loadGroupInfo()
})

// 方法
const goBack = () => {
  router.back()
}

const loadGroupInfo = () => {
  // 这里应该根据groupId加载群聊信息
  console.log('加载群聊信息:', route.params.groupId)
}

const validateAmount = () => {
  const amount = parseFloat(packetAmount.value)
  
  if (isNaN(amount) || amount <= 0) {
    amountError.value = '请输入有效金额'
    return
  }
  
  if (amount < packetCount.value * 0.01) {
    amountError.value = '每个红包至少0.01元'
    return
  }
  
  if (amount > currentBalance.value) {
    amountError.value = '余额不足'
    return
  }
  
  amountError.value = ''
}

const validateCount = () => {
  if (packetCount.value < 1) packetCount.value = 1
  if (packetCount.value > groupInfo.value.memberCount) {
    packetCount.value = groupInfo.value.memberCount
  }
  validateAmount() // 重新验证金额
}

const decreaseCount = () => {
  if (packetCount.value > 1) {
    packetCount.value--
    validateAmount()
  }
}

const increaseCount = () => {
  if (packetCount.value < groupInfo.value.memberCount) {
    packetCount.value++
    validateAmount()
  }
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
    console.log('发送群聊红包:', {
      groupId: groupInfo.value.id,
      type: 'lucky',
      totalAmount: parseFloat(packetAmount.value),
      totalCount: packetCount.value,
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
.group-red-packet-page {
  height: 100vh;
  background: linear-gradient(135deg, #ffd700, #ffb347);
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

.group-info {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.group-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
}

.group-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-details h4 {
  color: white;
  margin: 0 0 4px 0;
  font-size: 16px;
}

.group-details span {
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
  border-color: #ffd700;
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

.count-input-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.count-btn:hover {
  border-color: #ffd700;
  background: #ffd700;
  color: white;
}

.count-input {
  flex: 1;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}

.count-input:focus {
  border-color: #ffd700;
}

.error-text {
  color: #ff4757;
  font-size: 12px;
  margin-top: 4px;
}

.amount-tips,
.count-tips {
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
  border-color: #ffd700;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.packet-preview {
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.preview-title {
  color: white;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255,255,255,0.9);
  font-size: 14px;
}

.preview-value {
  font-weight: bold;
  color: white;
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
  background: #ff4757;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #ff3742;
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

.packet-preview-dialog {
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
  border-color: #ffd700;
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
  background: #ffd700;
  color: #333;
}

.result-btn {
  background: #07C160;
  color: white;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn:hover:not(:disabled) {
  background: #ffed4e;
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

.result-details {
  margin-top: 12px;
}

.result-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
}

.result-count {
  font-size: 14px;
  color: #666;
}
</style>
