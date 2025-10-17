<template>
  <div class="transfer-card" :class="{ 'received': isReceived }" @click="handleClick">
    <!-- 蒙层效果（已收款时显示） -->
    <div v-if="isReceived" class="transfer-overlay"></div>

    <!-- 左侧转账图标区域 -->
    <div class="transfer-left">
      <div class="transfer-icon">
        <svg viewBox="0 0 40 54" xmlns="http://www.w3.org/2000/svg">
          <!-- 转账图标 - 两个箭头交叉 -->
          <g>
            <!-- 背景圆 -->
            <circle cx="20" cy="27" r="18" fill="#FFD700"/>
            <!-- 内圆 -->
            <circle cx="20" cy="27" r="14" fill="#FFC700"/>

            <!-- 向右上箭头 -->
            <path d="M 14 30 L 22 22 L 22 26 L 26 26 L 26 18 L 22 18 L 22 22 L 14 30 Z" fill="#FF9500"/>

            <!-- 向左下箭头 -->
            <path d="M 26 24 L 18 32 L 18 28 L 14 28 L 14 36 L 18 36 L 18 32 L 26 24 Z" fill="#FF9500"/>
          </g>
        </svg>
      </div>
      <div class="transfer-footer">叶语转账</div>
    </div>

    <!-- 右侧转账信息 -->
    <div class="transfer-content">
      <div class="transfer-amount" :class="{ 'received': isReceived }">¥{{ amount.toFixed(2) }}</div>
      <div class="transfer-note" v-if="note && !isReceived">{{ note }}</div>
      <div v-if="isReceived" class="transfer-received-text">{{ receivedStatusText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

interface Props {
  content: string
  isOwn?: boolean
  messageId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'receive', data: any): void
}>()

const router = useRouter()
const authStore = useAuthStore()

// 是否已收款（直接从 content 中读取 received 字段）
const isReceived = computed(() => {
  try {
    const data = typeof props.content === 'string' ? JSON.parse(props.content) : props.content
    return data.received === true
  } catch {
    return false
  }
})

// 解析转账数据
const transferData = computed(() => {
  try {
    if (typeof props.content === 'object' && props.content !== null) {
      return props.content
    }
    return JSON.parse(props.content)
  } catch (error) {
    return {
      amount: 0,
      note: '',
      recipientId: '',
      recipientName: '',
      received: false
    }
  }
})

const amount = computed(() => transferData.value.amount || 0)
const note = computed(() => transferData.value.note || '')
const timestamp = computed(() => transferData.value.timestamp || Date.now())

// 已收款状态文字
const receivedStatusText = computed(() => {
  if (!isReceived.value) return ''
  return props.isOwn ? '已收款' : '已被领取'
})

const handleClick = () => {
  if (props.isOwn) {
    // 自己发送的转账，跳转到详情页
    router.push({
      path: '/transfer-detail',
      query: {
        amount: amount.value.toString(),
        note: note.value,
        recipientName: transferData.value.recipientName || '',
        timestamp: timestamp.value.toString(),
        messageId: props.messageId || '',
        received: isReceived.value ? 'true' : 'false'
      }
    })
  } else if (!isReceived.value) {
    // 对方发送的转账，点击收款
    emit('receive', {
      ...transferData.value,
      messageId: props.messageId
    })
  }
}

onMounted(() => {
  console.log('💰 TransferCard 挂载:', {
    messageId: props.messageId,
    isOwn: props.isOwn,
    isReceived: isReceived.value,
    content: props.content
  })
})

onUnmounted(() => {
  console.log('💰 TransferCard 卸载:', props.messageId)
})
</script>

<style scoped>
.transfer-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 0 16px 0 10px;
  background: linear-gradient(135deg, #FF9500 0%, #FFB340 100%);
  border-radius: 4px;
  width: calc(100vw - 130px);
  max-width: calc(100vw - 130px);
  height: 70px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

.transfer-card:active {
  transform: scale(0.98);
}

/* 已收款状态的蒙层 - 纱布效果 */
.transfer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(1px);
  pointer-events: none;
  z-index: 1;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
}

/* 左侧转账图标区域 */
.transfer-left {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding-top: 4px;
  width: 40px;
  position: relative;
  z-index: 2;
}

/* 转账图标 */
.transfer-icon {
  width: 36px;
  height: 48px;
}

.transfer-icon svg {
  width: 100%;
  height: 100%;
}

/* 转账文字 */
.transfer-footer {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

/* 右侧转账信息 */
.transfer-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 8px;
  position: relative;
  z-index: 2;
}

/* 转账金额 */
.transfer-amount {
  color: white;
  font-size: 18px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 转账说明 */
.transfer-note {
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  margin-top: 0px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 已收款/已领取/已被领取文字 */
.transfer-received-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  margin-top: 0px;
  font-weight: 500;
}
</style>

