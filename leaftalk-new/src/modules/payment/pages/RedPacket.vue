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

    <!-- 支付密码弹窗 -->
    <PaymentPasswordModal
      :visible="showPasswordModal"
      :amount="packetAmount"
      @update:visible="showPasswordModal = $event"
      @confirm="handlePasswordConfirm"
      @cancel="showPasswordModal = false"
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
import PaymentPasswordModal from '../components/PaymentPasswordModal.vue'

const router = useRouter()
const paymentStore = usePaymentStore()

// 响应式数据
const packetAmount = ref('')
const blessing = ref('')
const showAmountKeyboard = ref(false)
const showPasswordModal = ref(false)
const showResultDialog = ref(false)
const sendResult = ref<any>({})

// 计算属性
const canSend = computed(() => {
  const amount = parseFloat(packetAmount.value)
  return amount > 0 && amount <= paymentStore.availableBalance
})

// 点击塞钱进红包按钮
const handleSendRedPacket = async () => {
  if (!canSend.value) return
  // 直接弹出支付密码弹窗
  showPasswordModal.value = true
}

// 支付密码确认后发送红包
const handlePasswordConfirm = async (password: string, paymentMethodId: string) => {
  try {
    console.log('使用付款方式:', paymentMethodId)

    const result = await paymentStore.sendRedPacket(
      'normal',
      parseFloat(packetAmount.value),
      1,
      blessing.value || '恭喜发财，大吉大利',
      'target_user',
      undefined,
      password
    )

    sendResult.value = {
      success: true,
      packetId: result.redPacket?.id || 'unknown',
      message: '红包发送成功'
    }

    showPasswordModal.value = false
    showResultDialog.value = true

  } catch (error) {
    sendResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '红包发送失败'
    }

    showPasswordModal.value = false
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
  background: #EDEDED;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.amount-section {
  margin-top: 60px;
  margin-bottom: 32px;
}

.amount-input-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:active {
    background: #f8f8f8;
  }
}

.amount-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
  font-weight: 500;
}

.amount-value {
  display: flex;
  align-items: center;
}

.currency-symbol {
  font-size: 48px;
  color: #333;
  font-weight: 300;
  margin-right: 8px;
}

.amount-input {
  flex: 1;
  font-size: 48px;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
  font-weight: 300;
  cursor: pointer;

  &::placeholder {
    color: #ccc;
  }
}

.blessing-section {
  margin-bottom: 32px;
}

.blessing-input {
  width: 100%;
  padding: 16px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  color: #333;
  font-size: 16px;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &::placeholder {
    color: #ccc;
  }

  &:focus {
    border-color: #07C160;
  }
}

.action-section {
  margin-bottom: 24px;
}

.send-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #f5515f 0%, #e73827 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(231, 56, 39, 0.3);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(231, 56, 39, 0.3);
  }
}

// 键盘样式已移至 NumericKeyboard 组件
</style>