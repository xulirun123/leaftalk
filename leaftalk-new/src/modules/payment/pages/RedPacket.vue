<template>
  <div class="red-packet-page">
    <!-- 金额输入区域 -->
    <div class="amount-section">
      <div class="amount-label">金额</div>
      <div class="amount-input-wrapper" @click="showAmountKeyboard = true">
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

    <!-- 红包金额显示 -->
    <div class="amount-display">
      <div class="amount-display-label">红包金额</div>
      <div class="amount-display-value">¥{{ displayAmount }}</div>
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
    <div v-if="showAmountKeyboard" class="keyboard-overlay" @click="showAmountKeyboard = false">
      <div class="keyboard-panel" @click.stop>
        <div class="keyboard-grid">
          <button
            v-for="(key, index) in keyboardKeys"
            :key="index"
            class="keyboard-key"
            :class="{
              'key-delete': key === 'delete',
              'key-dot': key === '.',
              'key-zero': key === '0',
              'key-confirm': key === 'confirm',
              'key-empty': key === ''
            }"
            @click="key && handleKeyPress(key)"
            :disabled="!key"
          >
            <iconify-icon v-if="key === 'delete'" icon="heroicons:backspace" width="24"></iconify-icon>
            <span v-else-if="key === 'confirm'">确认</span>
            <span v-else>{{ key }}</span>
          </button>
        </div>
      </div>
    </div>

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

const router = useRouter()
const paymentStore = usePaymentStore()

// 响应式数据
const packetAmount = ref('')
const blessing = ref('')
const showAmountKeyboard = ref(false)
const showConfirmDialog = ref(false)
const showResultDialog = ref(false)
const sendResult = ref<any>({})

// 数字键盘按键 (4行4列)
// 布局:
// 第1行: [1] [2] [3] [删除]
// 第2行: [4] [5] [6] [确认(开始,占3行)]
// 第3行: [7] [8] [9] [确认(继续)]
// 第4行: [0(占2列)] [.] [确认(结束)]
// 确认键使用 grid-row: span 3 从第2行开始占3行
const keyboardKeys = [
  '1', '2', '3', 'delete',
  '4', '5', '6', 'confirm',  // confirm 从这里开始占3行
  '7', '8', '9',              // 第3行只有3个按键，第4列被confirm占用
  '0', '.'                    // 第4行只有2个按键（0占2列，.占1列），第4列被confirm占用
]

// 计算属性
const displayAmount = computed(() => {
  return packetAmount.value || '0.00'
})

const canSend = computed(() => {
  const amount = parseFloat(packetAmount.value)
  return amount > 0 && amount <= paymentStore.availableBalance
})

// 方法
const handleKeyPress = (key: string) => {
  if (key === 'confirm') {
    // 确认按钮，关闭键盘
    showAmountKeyboard.value = false
  } else if (key === 'delete') {
    packetAmount.value = packetAmount.value.slice(0, -1)
  } else if (key === '.') {
    // 只允许一个小数点
    if (!packetAmount.value.includes('.')) {
      packetAmount.value += key
    }
  } else {
    // 限制小数点后两位
    if (packetAmount.value.includes('.')) {
      const parts = packetAmount.value.split('.')
      if (parts[1] && parts[1].length < 2) {
        packetAmount.value += key
      }
    } else {
      packetAmount.value += key
    }
  }
}

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

.amount-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  font-weight: 500;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  background: transparent;
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
  padding: 8px 0;
  cursor: pointer;
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

.amount-display {
  margin-bottom: 32px;
  text-align: center;
}

.amount-display-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.amount-display-value {
  font-size: 32px;
  color: #fff;
  font-weight: 500;
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

.keyboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.keyboard-panel {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 60px);
  gap: 12px;
}

.keyboard-key {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;

  // 立体感阴影
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);

  // 按下效果
  &:active {
    background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.1),
      inset 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateY(1px);
  }

  &.key-delete {
    background: linear-gradient(180deg, #ff7b7b 0%, #ff5252 100%);
    border-color: #ff4444;
    color: #fff;
    box-shadow:
      0 2px 4px rgba(255, 82, 82, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);

    &:active {
      background: linear-gradient(180deg, #ff5252 0%, #ff3838 100%);
      box-shadow:
        0 1px 2px rgba(255, 82, 82, 0.2),
        inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  &.key-dot {
    font-size: 32px;
  }

  &.key-zero {
    grid-column: span 2;  // 横着占2列
  }

  &.key-confirm {
    grid-row: span 3;  // 竖着占3行
    background: linear-gradient(180deg, #09d66f 0%, #07C160 100%);
    border-color: #06ad56;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    box-shadow:
      0 3px 6px rgba(7, 193, 96, 0.3),
      0 1px 3px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);

    &:active {
      background: linear-gradient(180deg, #07C160 0%, #06ad56 100%);
      box-shadow:
        0 1px 3px rgba(7, 193, 96, 0.2),
        inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  &.key-empty {
    background: transparent;
    border: none;
    box-shadow: none;
    cursor: default;

    &:active {
      background: transparent;
      box-shadow: none;
      transform: none;
    }
  }
}
</style>