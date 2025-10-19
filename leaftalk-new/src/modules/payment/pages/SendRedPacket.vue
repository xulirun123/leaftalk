<template>
  <div class="send-red-packet">
    <!-- 顶部导航栏 -->
    <MobileTopBar title="发红包" @back="goBack" />

    <!-- 红包内容 -->
    <div class="red-packet-content">
      <!-- 红包封面 -->
      <div class="red-packet-cover">
        <div class="cover-decoration">
          <iconify-icon icon="heroicons:gift" width="80" style="color: #FFD700;"></iconify-icon>
        </div>
        <div class="blessing-text">{{ blessing || '恭喜发财，大吉大利' }}</div>
      </div>

      <!-- 金额输入 -->
      <div class="amount-section">
        <div class="amount-label">红包金额</div>
        <div class="amount-input-wrapper">
          <span class="currency-symbol">¥</span>
          <input
            v-model="amount"
            type="number"
            class="amount-input"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            max="200"
            @input="validateAmount"
          />
        </div>
        <div v-if="amountError" class="error-message">{{ amountError }}</div>
        <div class="amount-hint">单个红包金额不超过200元</div>
      </div>

      <!-- 祝福语输入 -->
      <div class="blessing-section">
        <div class="blessing-label">祝福语</div>
        <textarea
          v-model="blessing"
          class="blessing-input"
          placeholder="恭喜发财，大吉大利"
          maxlength="50"
          rows="3"
        ></textarea>
        <div class="char-count">{{ blessing.length }}/50</div>
      </div>

      <!-- 接收者信息 -->
      <div class="receiver-info">
        <iconify-icon icon="heroicons:user" width="20" style="color: #999;"></iconify-icon>
        <span>发给：{{ receiverName }}</span>
      </div>
    </div>

    <!-- 发送按钮 -->
    <div class="send-button-wrapper">
      <button
        class="send-button"
        :disabled="!canSend"
        @click="handleSend"
      >
        塞钱进红包
      </button>
      <div class="send-hint">
        <iconify-icon icon="heroicons:information-circle" width="16" style="color: #999;"></iconify-icon>
        <span>红包24小时内有效，过期自动退回</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/shared/stores/appStore'
import MobileTopBar from '@/components/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 接收者信息
const receiverId = ref('')
const receiverName = ref('')
const isGroup = ref(false)

// 红包数据
const amount = ref('')
const blessing = ref('恭喜发财，大吉大利')
const amountError = ref('')

// 初始化
onMounted(() => {
  receiverId.value = route.query.receiverId as string || ''
  receiverName.value = route.query.receiverName as string || '未知用户'
  isGroup.value = route.query.isGroup === 'true'

  console.log('🧧 发红包页面初始化:', {
    receiverId: receiverId.value,
    receiverName: receiverName.value,
    isGroup: isGroup.value
  })
})

// 验证金额
const validateAmount = () => {
  const value = parseFloat(amount.value)
  
  if (isNaN(value) || value <= 0) {
    amountError.value = '请输入有效金额'
    return false
  }
  
  if (value < 0.01) {
    amountError.value = '红包金额不能少于0.01元'
    return false
  }
  
  if (value > 200) {
    amountError.value = '单个红包金额不能超过200元'
    return false
  }
  
  amountError.value = ''
  return true
}

// 是否可以发送
const canSend = computed(() => {
  return amount.value && parseFloat(amount.value) > 0 && !amountError.value
})

// 发送红包
const handleSend = async () => {
  if (!validateAmount()) {
    return
  }

  try {
    console.log('🧧 发送红包:', {
      amount: amount.value,
      blessing: blessing.value,
      receiverId: receiverId.value,
      isGroup: isGroup.value
    })

    // TODO: 调用发送红包API
    appStore.showToast('红包发送成功', 'success')
    
    // 返回聊天页面
    setTimeout(() => {
      router.back()
    }, 1000)
  } catch (error) {
    console.error('发送红包失败:', error)
    appStore.showToast('发送红包失败', 'error')
  }
}

// 返回
const goBack = () => {
  router.back()
}
</script>

<style scoped>
.send-red-packet {
  min-height: 100vh;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  padding-top: 75px;
  padding-bottom: 20px;
}

.red-packet-content {
  padding: 20px;
}

/* 红包封面 */
.red-packet-cover {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cover-decoration {
  margin-bottom: 16px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.blessing-text {
  font-size: 18px;
  font-weight: 500;
  color: #FF6B6B;
  line-height: 1.5;
}

/* 金额输入 */
.amount-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.amount-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.currency-symbol {
  font-size: 32px;
  font-weight: 500;
  color: #333;
  margin-right: 8px;
}

.amount-input {
  flex: 1;
  font-size: 32px;
  font-weight: 500;
  color: #333;
  border: none;
  outline: none;
  background: transparent;
}

.amount-input::placeholder {
  color: #ccc;
}

.error-message {
  font-size: 12px;
  color: #FF6B6B;
  margin-top: 4px;
}

.amount-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

/* 祝福语输入 */
.blessing-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.blessing-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.blessing-input {
  width: 100%;
  font-size: 14px;
  color: #333;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  padding: 12px;
  outline: none;
  resize: none;
  font-family: inherit;
}

.blessing-input::placeholder {
  color: #ccc;
}

.char-count {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: 8px;
}

/* 接收者信息 */
.receiver-info {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 发送按钮 */
.send-button-wrapper {
  padding: 0 20px;
  margin-top: 32px;
}

.send-button {
  width: 100%;
  height: 48px;
  background: #FFD700;
  color: #8B4513;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.send-button:hover:not(:disabled) {
  background: #FFC700;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  background: #ccc;
  color: #999;
  cursor: not-allowed;
  box-shadow: none;
}

.send-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
</style>

