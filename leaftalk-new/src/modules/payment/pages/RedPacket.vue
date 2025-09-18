<template>
  <div class="red-packet">
    <!-- 顶部导航 -->
    <div class="red-packet-header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1>发红包</h1>
    </div>

    <!-- 红包类型选择 -->
    <div class="packet-type-section">
      <div class="type-tabs">
        <button 
          v-for="type in packetTypes" 
          :key="type.key"
          :class="['type-tab', { active: selectedType === type.key }]"
          @click="selectedType = type.key"
        >
          <iconify-icon :icon="type.icon" width="24"></iconify-icon>
          <span>{{ type.label }}</span>
        </button>
      </div>
    </div>

    <!-- 红包配置 -->
    <div class="packet-config">
      <!-- 普通红包 -->
      <div v-if="selectedType === 'normal'" class="normal-packet">
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
              :max="paymentStore.availableBalance"
              @input="validateAmount"
            >
          </div>
          <div v-if="amountError" class="error-text">{{ amountError }}</div>
        </div>

        <div class="config-item">
          <label>祝福语</label>
          <textarea 
            v-model="blessing"
            placeholder="恭喜发财，大吉大利"
            class="blessing-input"
            maxlength="50"
            rows="2"
          ></textarea>
          <div class="char-count">{{ blessing.length }}/50</div>
        </div>
      </div>

      <!-- 拼手气红包 -->
      <div v-else-if="selectedType === 'lucky'" class="lucky-packet">
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
              :max="paymentStore.availableBalance"
              @input="validateAmount"
            >
          </div>
          <div v-if="amountError" class="error-text">{{ amountError }}</div>
        </div>

        <div class="config-item">
          <label>红包个数</label>
          <div class="count-input-container">
            <button class="count-btn" @click="decreaseCount" :disabled="packetCount <= 1">
              <iconify-icon icon="heroicons:minus" width="16"></iconify-icon>
            </button>
            <input 
              v-model.number="packetCount"
              type="number" 
              class="count-input"
              min="1"
              max="100"
              @input="validateCount"
            >
            <button class="count-btn" @click="increaseCount" :disabled="packetCount >= 100">
              <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
            </button>
          </div>
          <div class="count-info">
            <span>平均每个红包: ¥{{ averageAmount.toFixed(2) }}</span>
          </div>
        </div>

        <div class="config-item">
          <label>祝福语</label>
          <textarea 
            v-model="blessing"
            placeholder="恭喜发财，大吉大利"
            class="blessing-input"
            maxlength="50"
            rows="2"
          ></textarea>
          <div class="char-count">{{ blessing.length }}/50</div>
        </div>
      </div>

      <!-- 群红包 -->
      <div v-else-if="selectedType === 'group'" class="group-packet">
        <div class="config-item">
          <label>选择群聊</label>
          <div class="group-selector" @click="showGroupSelector = true">
            <div v-if="selectedGroup" class="selected-group">
              <img :src="selectedGroup.avatar" :alt="selectedGroup.name" class="group-avatar">
              <span class="group-name">{{ selectedGroup.name }}</span>
            </div>
            <div v-else class="placeholder">
              <iconify-icon icon="heroicons:users" width="20"></iconify-icon>
              <span>选择群聊</span>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="20"></iconify-icon>
          </div>
        </div>

        <div v-if="selectedGroup" class="config-item">
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
              :max="paymentStore.availableBalance"
              @input="validateAmount"
            >
          </div>
          <div v-if="amountError" class="error-text">{{ amountError }}</div>
        </div>

        <div v-if="selectedGroup" class="config-item">
          <label>红包个数</label>
          <div class="count-input-container">
            <button class="count-btn" @click="decreaseCount" :disabled="packetCount <= 1">
              <iconify-icon icon="heroicons:minus" width="16"></iconify-icon>
            </button>
            <input 
              v-model.number="packetCount"
              type="number" 
              class="count-input"
              min="1"
              :max="selectedGroup.memberCount"
              @input="validateCount"
            >
            <button class="count-btn" @click="increaseCount" :disabled="packetCount >= selectedGroup.memberCount">
              <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
            </button>
          </div>
          <div class="count-info">
            <span>群成员: {{ selectedGroup.memberCount }}人</span>
            <span>平均每个红包: ¥{{ averageAmount.toFixed(2) }}</span>
          </div>
        </div>

        <div v-if="selectedGroup" class="config-item">
          <label>祝福语</label>
          <textarea 
            v-model="blessing"
            placeholder="恭喜发财，大吉大利"
            class="blessing-input"
            maxlength="50"
            rows="2"
          ></textarea>
          <div class="char-count">{{ blessing.length }}/50</div>
        </div>
      </div>
    </div>

    <!-- 余额信息 -->
    <div class="balance-info">
      <div class="balance-item">
        <span class="label">可用余额:</span>
        <span class="value">¥{{ paymentStore.availableBalance.toFixed(2) }}</span>
      </div>
      <div class="balance-item">
        <span class="label">叶语币:</span>
        <span class="value">{{ paymentStore.yeyuCoinBalance }}</span>
      </div>
    </div>

    <!-- 发送按钮 -->
    <div class="send-actions">
      <button
        class="send-btn"
        :disabled="!canSend"
        @click="handleSendRedPacket"
      >
        塞钱进红包
      </button>
      
      <div class="send-tips">
        <iconify-icon icon="heroicons:information-circle" width="16"></iconify-icon>
        <span>红包24小时内有效，过期自动退回</span>
      </div>
    </div>

    <!-- 群聊选择器 -->
    <div v-if="showGroupSelector" class="group-selector-modal" @click="showGroupSelector = false">
      <div class="selector-content" @click.stop>
        <div class="selector-header">
          <h3>选择群聊</h3>
          <button class="close-btn" @click="showGroupSelector = false">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="group-list">
          <div 
            v-for="group in groups" 
            :key="group.id"
            class="group-item"
            @click="selectGroup(group)"
          >
            <img :src="group.avatar" :alt="group.name" class="group-avatar">
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-members">{{ group.memberCount }}人</div>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="20"></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认发送对话框 -->
    <div v-if="showConfirmDialog" class="confirm-dialog" @click="showConfirmDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>确认发红包</h3>
          <button class="dialog-close" @click="showConfirmDialog = false">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="dialog-body">
          <div class="packet-preview">
            <div class="preview-cover">
              <div class="cover-content">
                <iconify-icon icon="heroicons:gift" width="48" style="color: #fff;"></iconify-icon>
                <div class="cover-text">
                  <div class="cover-title">{{ getPacketTypeText() }}</div>
                  <div class="cover-amount">¥{{ parseFloat(packetAmount).toFixed(2) }}</div>
                </div>
              </div>
            </div>
            
            <div class="preview-info">
              <div class="info-item">
                <span class="label">类型:</span>
                <span class="value">{{ getPacketTypeText() }}</span>
              </div>
              <div v-if="selectedType !== 'normal'" class="info-item">
                <span class="label">个数:</span>
                <span class="value">{{ packetCount }}个</span>
              </div>
              <div class="info-item">
                <span class="label">祝福语:</span>
                <span class="value">{{ blessing || '恭喜发财，大吉大利' }}</span>
              </div>
            </div>
          </div>

          <!-- 支付密码输入 -->
          <div v-if="paymentStore.settings.requirePasswordForRedPacket" class="password-section">
            <label>请输入支付密码:</label>
            <input 
              v-model="paymentPassword"
              type="password" 
              placeholder="6位支付密码"
              class="password-input"
              maxlength="6"
            >
          </div>
        </div>

        <div class="dialog-actions">
          <button class="cancel-btn" @click="showConfirmDialog = false">取消</button>
          <button 
            class="confirm-btn" 
            :disabled="!canConfirmSend"
            @click="confirmSend"
          >
            {{ paymentStore.loading ? '发送中...' : '确认发送' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 发送结果对话框 -->
    <div v-if="showResultDialog" class="result-dialog" @click="showResultDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="result-content">
          <div :class="['result-icon', sendResult.success ? 'success' : 'error']">
            <iconify-icon 
              :icon="sendResult.success ? 'heroicons:check-circle' : 'heroicons:x-circle'" 
              width="64"
            ></iconify-icon>
          </div>
          
          <h3>{{ sendResult.success ? '红包发送成功' : '红包发送失败' }}</h3>
          
          <div v-if="sendResult.success" class="success-details">
            <p>已成功发送 {{ getPacketTypeText() }} ¥{{ parseFloat(packetAmount).toFixed(2) }}</p>
            <div class="packet-info">
              <div class="info-item">
                <span>发送时间:</span>
                <span>{{ formatTime(Date.now()) }}</span>
              </div>
              <div class="info-item">
                <span>红包编号:</span>
                <span>{{ sendResult.packetId }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="error-details">
            <p>{{ sendResult.message }}</p>
          </div>
        </div>

        <div class="result-actions">
          <button class="primary-btn" @click="handleResultClose">
            {{ sendResult.success ? '完成' : '重试' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentStore } from '../../stores/payment'
import { useSmartAuth } from '../composables/useSmartAuth'

const router = useRouter()
const paymentStore = usePaymentStore()

// 智能验证
const { useAuthFlow } = useSmartAuth()

// 响应式数据
const selectedType = ref('normal')
const packetAmount = ref('')
const packetCount = ref(1)
const blessing = ref('')
const amountError = ref('')
const selectedGroup = ref<any>(null)
const showGroupSelector = ref(false)
const showConfirmDialog = ref(false)
const showResultDialog = ref(false)
const paymentPassword = ref('')
const sendResult = ref<any>({})

// 智能验证流程
const { isAuthReturn, triggerAuth } = useAuthFlow(
  '红包服务',
  {},
  () => {
    // 验证成功后直接发送红包
    sendRedPacketDirectly()
  }
)

// 红包类型
const packetTypes = [
  { key: 'normal', label: '普通红包', icon: 'heroicons:gift' },
  { key: 'lucky', label: '拼手气红包', icon: 'heroicons:sparkles' },
  { key: 'group', label: '群红包', icon: 'heroicons:users' }
]

// 模拟群聊数据
const groups = ref([
  {
    id: 'group_001',
    name: '家庭群',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=family',
    memberCount: 8
  },
  {
    id: 'group_002',
    name: '同事群',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=work',
    memberCount: 15
  }
])

// 计算属性
const averageAmount = computed(() => {
  const amount = parseFloat(packetAmount.value) || 0
  return packetCount.value > 0 ? amount / packetCount.value : 0
})

const canSend = computed(() => {
  const amount = parseFloat(packetAmount.value)
  const hasValidAmount = amount > 0 && amount <= paymentStore.availableBalance && !amountError.value
  const hasValidCount = packetCount.value > 0
  const hasValidGroup = selectedType.value !== 'group' || selectedGroup.value
  
  return hasValidAmount && hasValidCount && hasValidGroup
})

const canConfirmSend = computed(() => {
  if (!paymentStore.settings.requirePasswordForRedPacket) return true
  return paymentPassword.value.length === 6
})

// 方法
const goBack = () => {
  router.back()
}

const validateAmount = () => {
  const amount = parseFloat(packetAmount.value)
  
  if (isNaN(amount) || amount <= 0) {
    amountError.value = '请输入有效金额'
    return
  }
  
  if (amount > paymentStore.availableBalance) {
    amountError.value = '余额不足'
    return
  }
  
  if (selectedType.value !== 'normal' && amount < packetCount.value * 0.01) {
    amountError.value = '每个红包至少0.01元'
    return
  }
  
  amountError.value = ''
}

const validateCount = () => {
  if (packetCount.value < 1) packetCount.value = 1
  if (selectedType.value === 'group' && selectedGroup.value) {
    if (packetCount.value > selectedGroup.value.memberCount) {
      packetCount.value = selectedGroup.value.memberCount
    }
  } else if (packetCount.value > 100) {
    packetCount.value = 100
  }
}

const decreaseCount = () => {
  if (packetCount.value > 1) {
    packetCount.value--
  }
}

const increaseCount = () => {
  const maxCount = selectedType.value === 'group' && selectedGroup.value 
    ? selectedGroup.value.memberCount 
    : 100
  
  if (packetCount.value < maxCount) {
    packetCount.value++
  }
}

const selectGroup = (group: any) => {
  selectedGroup.value = group
  showGroupSelector.value = false
  
  // 调整红包个数不超过群成员数
  if (packetCount.value > group.memberCount) {
    packetCount.value = group.memberCount
  }
}

const getPacketTypeText = () => {
  switch (selectedType.value) {
    case 'normal': return '普通红包'
    case 'lucky': return '拼手气红包'
    case 'group': return '群红包'
    default: return '红包'
  }
}

const confirmSend = async () => {
  try {
    const result = await paymentStore.sendRedPacket(
      selectedType.value as any,
      parseFloat(packetAmount.value),
      selectedType.value === 'normal' ? 1 : packetCount.value,
      blessing.value || '恭喜发财，大吉大利',
      selectedType.value === 'normal' ? 'target_user' : undefined,
      selectedType.value === 'group' ? selectedGroup.value?.id : undefined,
      paymentPassword.value
    )

    sendResult.value = {
      success: true,
      packetId: result.redPacket.id,
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

// 处理发送红包（智能验证入口）
const handleSendRedPacket = async () => {
  if (!canSend.value) return

  // 使用智能验证
  await triggerAuth()
}

// 直接发送红包（验证成功后调用）
const sendRedPacketDirectly = async () => {
  try {
    const result = await paymentStore.sendRedPacket(
      selectedType.value as any,
      parseFloat(packetAmount.value),
      selectedType.value === 'normal' ? 1 : packetCount.value,
      blessing.value,
      selectedGroup.value,
      '' // 不需要密码，已经验证过了
    )

    sendResult.value = {
      success: true,
      packetId: result.redPacket.id,
      message: '红包发送成功'
    }

    showResultDialog.value = true

  } catch (error) {
    sendResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '红包发送失败'
    }

    showResultDialog.value = true
  }
}

const handleResultClose = () => {
  showResultDialog.value = false

  if (sendResult.value.success) {
    // 发送成功，返回聊天页面或钱包页面
    router.back()
  } else {
    // 发送失败，重置密码
    paymentPassword.value = ''
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  paymentStore.loadWallet()
})
</script>
