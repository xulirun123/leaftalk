<template>
  <div class="claim-redpacket-page">
    <!-- 红包封面 -->
    <div v-if="!claimed" class="redpacket-cover" @click="handleClaim">
      <div class="cover-header">
        <UnifiedAvatar
          :user-id="redPacket?.senderId || redPacket?.sender_id"
          :src="redPacket?.senderAvatar"
          :name="redPacket?.senderName"
          size="medium"
          class="sender-avatar"
        />
        <div class="sender-name">{{ redPacket?.senderName }}</div>
        <div class="blessing">{{ redPacket?.blessing }}</div>
      </div>
      
      <div class="open-button">
        <div class="button-text">开</div>
      </div>
      
      <div class="cover-footer">
        {{ getRedPacketTypeText(redPacket?.type || 'normal') }}
      </div>
    </div>

    <!-- 领取成功 -->
    <div v-else class="claim-success">
      <div class="success-header">
        <UnifiedAvatar
          :user-id="redPacket?.senderId || redPacket?.sender_id"
          :src="redPacket?.senderAvatar"
          :name="redPacket?.senderName"
          size="medium"
          class="sender-avatar"
        />
        <div class="sender-name">{{ redPacket?.senderName }}的红包</div>
      </div>
      
      <div class="amount-display">
        <div class="amount-value">¥{{ claimedAmount?.toFixed(2) }}</div>
        <div v-if="isLucky" class="lucky-badge">🎉 手气最佳</div>
      </div>
      
      <div class="blessing-text">{{ redPacket?.blessing }}</div>
      
      <div class="view-detail-button" @click="handleViewDetail">
        查看红包详情
      </div>
    </div>

    <!-- 关闭按钮 -->
    <div class="close-button" @click="handleClose">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRedPacketStore } from '../stores/redpacketStore'
import { useAppStore } from '../../../shared/stores/appStore'
import { getRedPacketTypeText } from '../utils/redpacketUtils'
import UnifiedAvatar from '../../../shared/components/common/UnifiedAvatar.vue'
import type { RedPacket } from '../types/redpacket'

const router = useRouter()
const route = useRoute()
const redPacketStore = useRedPacketStore()
const appStore = useAppStore()

const redPacketId = ref<string>('')
const redPacket = ref<RedPacket | null>(null)
const claimed = ref(false)
const claimedAmount = ref<number>(0)
const isLucky = ref(false)
const isLoading = ref(false)

// 领取红包
const handleClaim = async () => {
  if (isLoading.value || claimed.value) return
  
  isLoading.value = true
  
  try {
    const result = await redPacketStore.claimRedPacket({
      redPacketId: redPacketId.value
    })
    
    if (result.success) {
      claimed.value = true
      claimedAmount.value = result.amount || 0
      isLucky.value = result.isLucky || false
      
      // 重新加载红包详情
      await loadRedPacketDetail()
    } else {
      appStore.showToast(result.message || '领取红包失败', 'error')
    }
  } catch (error) {
    appStore.showToast(error instanceof Error ? error.message : '领取红包失败', 'error')
  } finally {
    isLoading.value = false
  }
}

// 查看详情
const handleViewDetail = () => {
  router.replace({
    path: '/redpacket-detail',
    query: { id: redPacketId.value }
  })
}

// 关闭
const handleClose = () => {
  router.back()
}

// 加载红包详情
const loadRedPacketDetail = async () => {
  isLoading.value = true
  
  try {
    const detail = await redPacketStore.getRedPacketDetail(redPacketId.value)
    if (detail) {
      redPacket.value = detail
    } else {
      appStore.showToast('红包不存在', 'error')
      handleClose()
    }
  } catch (error) {
    appStore.showToast('加载红包详情失败', 'error')
    handleClose()
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  redPacketId.value = route.query.id as string || ''
  
  if (!redPacketId.value) {
    appStore.showToast('红包ID不存在', 'error')
    handleClose()
    return
  }
  
  await loadRedPacketDetail()
})
</script>

<style scoped>
.claim-redpacket-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.redpacket-cover {
  width: 300px;
  background: linear-gradient(135deg, #f5515f 0%, #e73827 100%);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.redpacket-cover:active {
  transform: scale(0.98);
}

.cover-header {
  margin-bottom: 40px;
}

.sender-avatar {
  margin: 0 auto 12px;
}

.sender-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.blessing {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.open-button {
  width: 80px;
  height: 80px;
  margin: 0 auto 40px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.button-text {
  font-size: 32px;
  font-weight: 600;
  color: #e73827;
}

.cover-footer {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.claim-success {
  width: 300px;
  background: linear-gradient(135deg, #f5515f 0%, #e73827 100%);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
}

.success-header {
  margin-bottom: 32px;
}

.amount-display {
  margin-bottom: 24px;
}

.amount-value {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.lucky-badge {
  font-size: 14px;
  color: #ffd700;
  font-weight: 600;
}

.blessing-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
}

.view-detail-button {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-detail-button:active {
  transform: scale(0.98);
}

.close-button {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.close-button:active {
  transform: translateX(-50%) scale(0.95);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

