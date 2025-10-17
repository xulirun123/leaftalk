<template>
  <div class="redpacket-card" :class="{ 'claimed': isClaimed }" @click="handleClick">
    <!-- 蒙层效果（已领取时显示） -->
    <div v-if="isClaimed" class="redpacket-overlay"></div>

    <!-- 左侧红包图标区域 -->
    <div class="redpacket-left">
      <div class="redpacket-icon">
        <svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
          <!-- 红包外框（长方形） -->
          <rect x="4" y="8" width="32" height="44" rx="2" fill="#E74C3C"/>
          <!-- 金色圆圈 -->
          <circle cx="20" cy="30" r="10" fill="#F6D365"/>
          <!-- 金色内圈 -->
          <circle cx="20" cy="30" r="7" fill="#FDB44B"/>
          <!-- ¥符号 -->
          <text x="20" y="34" font-size="10" font-weight="bold" fill="#E74C3C" text-anchor="middle" font-family="Arial">¥</text>
        </svg>
      </div>
      <div class="redpacket-footer">叶语红包</div>
    </div>

    <!-- 右侧祝福语 -->
    <div class="redpacket-content">
      <div class="redpacket-blessing">{{ blessing }}</div>
      <div v-if="isClaimed" class="redpacket-claimed-text">{{ claimedStatusText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  content: string
  isOwn?: boolean
  messageId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'open', data: any): void
}>()

// 是否已领取
const isClaimed = ref(false)

// 解析红包数据
const redPacketData = computed(() => {
  try {
    return JSON.parse(props.content)
  } catch {
    return {
      blessing: '恭喜发财，大吉大利',
      type: 'normal',
      amount: 0
    }
  }
})

const blessing = computed(() => redPacketData.value.blessing || '恭喜发财，大吉大利')

// 已领取状态文字
const claimedStatusText = computed(() => {
  if (!isClaimed.value) return ''

  // 如果是自己发送的红包，显示"已领取"
  if (props.isOwn) {
    return '已领取'
  }

  // 如果是对方发送的红包，显示"已被领取"
  return '已被领取'
})

// 检查红包是否已领取
const checkClaimedStatus = () => {
  if (props.messageId) {
    const claimedKey = `redpacket_claimed_${props.messageId}`
    const claimedValue = localStorage.getItem(claimedKey)
    isClaimed.value = claimedValue === 'true'
    console.log('🧧 RedPacketCard 检查领取状态:', {
      messageId: props.messageId,
      claimedKey,
      claimedValue,
      isClaimed: isClaimed.value,
      isOwn: props.isOwn
    })
  }
}

// 监听红包领取事件
const handleRedPacketClaimed = (event: CustomEvent) => {
  console.log('🧧 RedPacketCard 收到红包领取事件:', event.detail)

  // 检查是否是当前红包
  if (event.detail.messageId === props.messageId) {
    console.log('✅ 当前红包已被领取，更新状态')
    isClaimed.value = true

    // 保存到localStorage
    if (props.messageId) {
      const claimedKey = `redpacket_claimed_${props.messageId}`
      localStorage.setItem(claimedKey, 'true')
    }
  }
}

onMounted(() => {
  checkClaimedStatus()

  // 监听红包领取事件
  window.addEventListener('redpacket-claimed', handleRedPacketClaimed as EventListener)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('redpacket-claimed', handleRedPacketClaimed as EventListener)
})

const handleClick = () => {
  emit('open', { ...redPacketData.value, isClaimed: isClaimed.value, messageId: props.messageId })
}
</script>

<style scoped>
.redpacket-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 0 16px 0 10px;
  background: linear-gradient(135deg, #FA9D3B 0%, #F76260 100%);
  border-radius: 4px;
  width: calc(100vw - 130px);
  max-width: calc(100vw - 130px);
  height: 70px;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px rgba(247, 98, 96, 0.3);
  position: relative;
  overflow: hidden;
}

.redpacket-card:active {
  transform: scale(0.98);
}

/* 已领取状态的蒙层 - 纱布效果 */
.redpacket-overlay {
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

/* 左侧红包图标区域 */
.redpacket-left {
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

/* 红包图标（长方形） */
.redpacket-icon {
  width: 36px;
  height: 48px;
}

.redpacket-icon svg {
  width: 100%;
  height: 100%;
}

/* 叶语红包文字 */
.redpacket-footer {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

/* 右侧祝福语 */
.redpacket-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 16px;
  position: relative;
  z-index: 2;
}

/* 祝福语 */
.redpacket-blessing {
  color: white;
  font-size: 14px;
  font-weight: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 已领取/已被领取文字 */
.redpacket-claimed-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  margin-top: 0px;
  font-weight: 500;
}
</style>

