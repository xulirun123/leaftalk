<template>
  <div class="yeyu-beans-page">
    <!-- 顶部导航栏 -->
    <MobileTopBar 
      title="叶语豆" 
      :show-back="true" 
      @back="goBack"
    />

    <!-- 叶语豆余额卡片 -->
    <div class="balance-card">
      <div class="balance-header">
        <iconify-icon icon="heroicons:sparkles" width="32" class="beans-icon"></iconify-icon>
        <h2 class="balance-title">叶语豆余额</h2>
      </div>
      <div class="balance-amount">
        <span class="amount-number">{{ beansBalance }}</span>
        <span class="amount-unit">豆</span>
      </div>
      <p class="balance-description">叶语豆可用于购买表情包、主题等增值服务</p>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="action-btn primary" @click="goToRecharge">
        <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        <span>充值</span>
      </button>
      <button class="action-btn secondary" @click="goToHistory">
        <iconify-icon icon="heroicons:clock" width="20"></iconify-icon>
        <span>明细</span>
      </button>
    </div>

    <!-- 使用说明 -->
    <div class="usage-info">
      <h3 class="info-title">叶语豆使用说明</h3>
      <div class="info-list">
        <div class="info-item">
          <iconify-icon icon="heroicons:face-smile" width="20" class="info-icon"></iconify-icon>
          <span>购买表情包和贴纸</span>
        </div>
        <div class="info-item">
          <iconify-icon icon="heroicons:paint-brush" width="20" class="info-icon"></iconify-icon>
          <span>购买聊天主题</span>
        </div>
        <div class="info-item">
          <iconify-icon icon="heroicons:gift" width="20" class="info-icon"></iconify-icon>
          <span>购买虚拟礼品</span>
        </div>
        <div class="info-item">
          <iconify-icon icon="heroicons:star" width="20" class="info-icon"></iconify-icon>
          <span>开通会员服务</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()

// 叶语豆余额
const beansBalance = ref(1280)

// 返回上一页
const goBack = () => {
  router.back()
}

// 充值叶语豆
const goToRecharge = () => {
  router.push('/yeyu-beans/recharge')
}

// 查看明细
const goToHistory = () => {
  router.push('/yeyu-beans/history')
}

// 加载叶语豆余额
const loadBeansBalance = async () => {
  try {
    // 这里应该调用API获取真实余额
    // const response = await walletAPI.getBeansBalance()
    // beansBalance.value = response.data.balance
    console.log('加载叶语豆余额')
  } catch (error) {
    console.error('加载叶语豆余额失败:', error)
  }
}

onMounted(() => {
  loadBeansBalance()
})
</script>

<style scoped>
.yeyu-beans-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  margin: 67px 16px 20px 16px;
  border-radius: 16px;
  padding: 24px;
  color: white;
  text-align: center;
}

.balance-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.beans-icon {
  margin-right: 8px;
}

.balance-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.balance-amount {
  margin-bottom: 12px;
}

.amount-number {
  font-size: 36px;
  font-weight: 700;
}

.amount-unit {
  font-size: 18px;
  font-weight: 500;
  margin-left: 4px;
}

.balance-description {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 24px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: #07C160;
  color: white;
}

.action-btn.primary:hover {
  background: #06AD56;
}

.action-btn.secondary {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

.action-btn.secondary:hover {
  background: #f8f8f8;
}

/* 使用说明 */
.usage-info {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px;
}

.info-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.info-icon {
  color: #07C160;
}

.info-item span {
  font-size: 14px;
  color: #666;
}
</style>
