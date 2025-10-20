<template>
  <div class="red-packet-page">
    <!-- 金额输入区域 -->
    <div class="amount-section">
      <div class="amount-input-wrapper">
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

    <!-- 数字键盘（固定在页面底部） -->
    <div class="keyboard-section">
      <div class="keyboard-grid">
        <button
          v-for="(key, index) in keyboardKeys"
          :key="index"
          class="keyboard-key"
          :class="{
            'key-delete': key === 'delete',
            'key-dot': key === '.',
            'key-confirm': key === 'confirm'
          }"
          @click="handleKeyPress(key)"
        >
          <iconify-icon v-if="key === 'delete'" icon="heroicons:backspace" width="24"></iconify-icon>
          <span v-else-if="key === 'confirm'">确认</span>
          <span v-else>{{ key }}</span>
        </button>
      </div>
    </div>

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
import PaymentPasswordModal from '../components/PaymentPasswordModal.vue'

const router = useRouter()
const paymentStore = usePaymentStore()

// 响应式数据
const packetAmount = ref('')
const blessing = ref('')
const showPasswordModal = ref(false)
const showResultDialog = ref(false)
const sendResult = ref<any>({})

// 数字键盘按键 (4行4列)
const keyboardKeys = [
  '1', '2', '3', 'delete',
  '4', '5', '6', 'confirm',
  '7', '8', '9',
  '0', '.'
]

// 处理按键
const handleKeyPress = (key: string) => {
  if (key === 'confirm') {
    // 确认按钮：不做任何操作，金额已经输入完成
    return
  } else if (key === 'delete') {
    // 删除按钮
    if (packetAmount.value.length > 0) {
      packetAmount.value = packetAmount.value.slice(0, -1)
    }
  } else if (key === '.') {
    // 小数点
    if (!packetAmount.value.includes('.')) {
      packetAmount.value += key
    }
  } else {
    // 数字键
    // 限制最多10位数字
    if (packetAmount.value.replace('.', '').length >= 10) {
      return
    }

    // 限制小数点后最多2位
    if (packetAmount.value.includes('.')) {
      const parts = packetAmount.value.split('.')
      if (parts[1] && parts[1].length >= 2) {
        return
      }
    }

    packetAmount.value += key
  }
}

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
  padding: 20px 20px 0 20px;
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

/* 数字键盘 */
.keyboard-section {
  margin-top: auto;
  padding: 16px 0 0 0;
  background: #EDEDED;
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 56px);
  gap: 10px;
}

.keyboard-key {
  background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
  border: none;
  border-radius: 8px;
  font-size: 24px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    transform: translateY(2px);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.1),
      inset 0 1px 3px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%);
  }
}

.key-delete {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  box-shadow:
    0 2px 4px rgba(238, 90, 82, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);

  &:active {
    background: linear-gradient(135deg, #ee5a52 0%, #dc4a41 100%);
    box-shadow:
      0 1px 2px rgba(238, 90, 82, 0.3),
      inset 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

.key-dot {
  font-size: 32px;
  font-weight: 600;
}

.key-confirm {
  grid-column: 4;
  grid-row: 2 / 5;
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  color: white;
  font-size: 18px;
  font-weight: 600;
  box-shadow:
    0 2px 4px rgba(7, 193, 96, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);

  &:active {
    background: linear-gradient(135deg, #06AD56 0%, #059A4C 100%);
    box-shadow:
      0 1px 2px rgba(7, 193, 96, 0.3),
      inset 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}
</style>