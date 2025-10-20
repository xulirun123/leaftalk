<template>
  <div class="redpacket-detail-page">
    <!-- 顶部导航栏 -->
    <MobileTopBar title="红包详情" @back="handleBack" />

    <div v-if="redPacket" class="detail-content">
      <!-- 红包头部 -->
      <div class="detail-header">
        <div class="header-bg"></div>
        <div class="header-content">
          <OptimizedAvatar
            :src="redPacket.senderAvatar"
            :size="56"
            class="sender-avatar"
          />
          <div class="sender-info">
            <div class="sender-name">{{ redPacket.senderName }}</div>
            <div class="blessing">{{ redPacket.blessing }}</div>
          </div>
        </div>
      </div>

      <!-- 红包统计 -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-label">红包金额</div>
          <div class="stat-value">¥{{ redPacket.totalAmount.toFixed(2) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">红包类型</div>
          <div class="stat-value">{{ getRedPacketTypeText(redPacket.type) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">红包状态</div>
          <div class="stat-value">{{ getRedPacketStatusText(redPacket) }}</div>
        </div>
      </div>

      <!-- 领取记录 -->
      <div class="claims-section">
        <div class="section-title">
          领取记录 ({{ redPacket.claims.length }}/{{ redPacket.totalCount }})
        </div>
        
        <div v-if="redPacket.claims.length > 0" class="claims-list">
          <div
            v-for="claim in sortedClaims"
            :key="claim.id"
            class="claim-item"
          >
            <OptimizedAvatar
              :src="claim.userAvatar"
              :size="40"
              class="claim-avatar"
            />
            <div class="claim-info">
              <div class="claim-name">
                {{ claim.userName }}
                <span v-if="claim.isLucky" class="lucky-badge">手气最佳</span>
              </div>
              <div class="claim-time">{{ formatRedPacketTime(claim.claimedAt) }}</div>
            </div>
            <div class="claim-amount">¥{{ claim.amount.toFixed(2) }}</div>
          </div>
        </div>
        
        <div v-else class="empty-claims">
          <div class="empty-icon">📭</div>
          <div class="empty-text">还没有人领取</div>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRedPacketStore } from '../stores/redpacketStore'
import { useAppStore } from '../../../shared/stores/appStore'
import {
  getRedPacketTypeText,
  getRedPacketStatusText,
  formatRedPacketTime,
  getLuckyKing
} from '../utils/redpacketUtils'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'
import OptimizedAvatar from '../../../shared/components/common/OptimizedAvatar.vue'
import type { RedPacket } from '../types/redpacket'

const router = useRouter()
const route = useRoute()
const redPacketStore = useRedPacketStore()
const appStore = useAppStore()

const redPacketId = ref<string>('')
const redPacket = ref<RedPacket | null>(null)
const isLoading = ref(false)

// 排序后的领取记录（手气最佳在前）
const sortedClaims = computed(() => {
  if (!redPacket.value) return []
  
  const claims = [...redPacket.value.claims]
  const luckyKing = getLuckyKing(claims)
  
  // 标记手气最佳
  if (luckyKing) {
    claims.forEach(claim => {
      claim.isLucky = claim.id === luckyKing.id
    })
  }
  
  // 按领取时间排序
  return claims.sort((a, b) => a.claimedAt - b.claimedAt)
})

// 返回
const handleBack = () => {
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
      handleBack()
    }
  } catch (error) {
    appStore.showToast('加载红包详情失败', 'error')
    handleBack()
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  redPacketId.value = route.query.id as string || ''
  
  if (!redPacketId.value) {
    appStore.showToast('红包ID不存在', 'error')
    handleBack()
    return
  }
  
  await loadRedPacketDetail()
})
</script>

<style scoped>
.redpacket-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.detail-content {
  padding-bottom: 24px;
}

.detail-header {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, #f5515f 0%, #e73827 100%);
}

.header-content {
  position: relative;
  padding: 24px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.sender-avatar {
  flex-shrink: 0;
}

.sender-info {
  flex: 1;
  color: #fff;
}

.sender-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.blessing {
  font-size: 14px;
  opacity: 0.9;
}

.stats-section {
  background: #fff;
  margin: -80px 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.claims-section {
  background: #fff;
  margin: 0 16px;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.claims-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.claim-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.claim-avatar {
  flex-shrink: 0;
}

.claim-info {
  flex: 1;
  min-width: 0;
}

.claim-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lucky-badge {
  font-size: 12px;
  color: #ff6b00;
  background: #fff3e0;
  padding: 2px 8px;
  border-radius: 4px;
}

.claim-time {
  font-size: 12px;
  color: #999;
}

.claim-amount {
  font-size: 16px;
  font-weight: 600;
  color: #e73827;
  flex-shrink: 0;
}

.empty-claims {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #07C160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 14px;
  color: #999;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

