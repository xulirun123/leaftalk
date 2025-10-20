<template>
  <div class="red-packet-page">
    <!-- 金额输入区域 -->
    <div class="amount-section">
      <div class="amount-input-wrapper" @click="showAmountKeyboard = true">
        <div class="amount-label">金额</div>
        <div class="amount-value">
          <span class="currency-symbol">¥</span>
          <input
            v-model="packetAmount"
            type="text"
            placeholder="0.00"
            class="amount-input"
            readonly
            inputmode="none"
          >
        </div>
      </div>
    </div>

    <!-- 祝福语输入区域 -->
    <div class="blessing-section">
      <input
        v-model="blessing"
        type="text"
        placeholder="恭喜发财，大吉大利"
        class="blessing-input"
        maxlength="50"
      >
    </div>

    <!-- 塞钱进红包按钮 -->
    <div class="action-section">
      <button
        class="send-btn"
        :disabled="!canSend"
        @click="handleSendRedPacket"
      >
        塞钱进红包
      </button>
    </div>

    <!-- 余额信息 -->
    <div class="balance-info">
      <div class="balance-text">可用余额 ¥{{ paymentStore.availableBalance.toFixed(2) }}</div>
    </div>

    <!-- 数字键盘 -->
    <NumericKeyboard
      v-model="packetAmount"
      :visible="showAmountKeyboard"
      :max-length="10"
      :max-decimal-places="2"
      :allow-decimal="true"
      confirm-text="确认"
      @confirm="showAmountKeyboard = false"
      @close="showAmountKeyboard = false"
    />

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-if="showConfirmDialog"
      :visible="showConfirmDialog"
      title="确认发送红包"
      :message="`确定要发送 ¥${packetAmount} 的红包吗？`"
      confirm-text="确定"
      cancel-text="取消"
      @confirm="confirmSend"
      @cancel="showConfirmDialog = false"
    />

    <!-- 结果对话框 -->
    <ConfirmDialog
      v-if="showResultDialog"
      :visible="showResultDialog"
      :title="sendResult.success ? '发送成功' : '发送失败'"
      :message="sendResult.message"
      :confirm-text="sendResult.success ? '完成' : '重试'"
      :show-cancel="false"
      @confirm="handleResultClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentStore } from '../stores/paymentStore'
import ConfirmDialog from '../../../shared/components/common/ConfirmDialog.vue'
import NumericKeyboard from '../../../shared/components/common/NumericKeyboard.vue'

const router = useRouter()
const paymentStore = usePaymentStore()

// 响应式数据
const packetAmount = ref('')
const blessing = ref('')
const showAmountKeyboard = ref(false)
const showConfirmDialog = ref(false)
const showResultDialog = ref(false)
const sendResult = ref<any>({})

// 计算属性
const canSend = computed(() => {
  const amount = parseFloat(packetAmount.value)
  return amount > 0 && amount <= paymentStore.availableBalance
})

const handleSendRedPacket = async () => {
  if (!canSend.value) return
  showConfirmDialog.value = true
}

const confirmSend = async () => {
  try {
    const result = await paymentStore.sendRedPacket(
      'normal',
      parseFloat(packetAmount.value),
      1,
      blessing.value || '恭喜发财，大吉大利',
      'target_user',
      undefined,
      '123456' // 默认密码
    )

    sendResult.value = {
      success: true,
      packetId: result.redPacket?.id || 'unknown',
      message: '红包发送成功'
    }

    showConfirmDialog.value = false
    showResultDialog.value = true

  } catch (error) {
    sendResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '红包发送失败'
    }

    showConfirmDialog.value = false
    showResultDialog.value = true
  }
}

const handleResultClose = () => {
  showResultDialog.value = false

  if (sendResult.value.success) {
    router.back()
  }
}

// 生命周期
onMounted(async () => {
  paymentStore.loadWallet()
})
</script>

<style scoped lang="scss">
.red-packet-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5515f 0%, #e73827 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.amount-section {
  margin-top: 60px;
  margin-bottom: 32px;
}

.amount-input-wrapper {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
}

.amount-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  font-weight: 500;
}

.amount-value {
  display: flex;
  align-items: center;
}

.currency-symbol {
  font-size: 48px;
  color: #fff;
  font-weight: 300;
  margin-right: 8px;
}

.amount-input {
  flex: 1;
  font-size: 48px;
  color: #fff;
  background: transparent;
  border: none;
  outline: none;
  font-weight: 300;
  cursor: pointer;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.blessing-section {
  margin-bottom: 32px;
}

.blessing-input {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
}

.action-section {
  margin-bottom: 24px;
}

.send-btn {
  width: 100%;
  padding: 16px;
  background: #fff;
  color: #e73827;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.balance-info {
  text-align: center;
}

.balance-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

// 键盘样式已移至 NumericKeyboard 组件
</style>