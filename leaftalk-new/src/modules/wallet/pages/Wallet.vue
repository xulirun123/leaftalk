<template>
  <div class="wallet-page">
    <!-- 顶部导航栏 -->
    <MobileTopBar 
      title="钱包" 
      :show-back="true" 
      @back="goBack"
    />

    <!-- 余额卡片 -->
    <div class="balance-card">
      <div class="balance-header">
        <iconify-icon icon="heroicons:wallet" width="32" class="wallet-icon"></iconify-icon>
        <h2 class="balance-title">钱包余额</h2>
      </div>
      <div class="balance-amount">
        <span class="currency">¥</span>
        <span class="amount-number">{{ walletBalance }}</span>
      </div>
      <p class="balance-description">可用于转账、红包、消费等</p>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <div class="action-item" @click="goToRecharge">
        <iconify-icon icon="heroicons:plus-circle" width="24" class="action-icon"></iconify-icon>
        <span class="action-text">充值</span>
      </div>
      <div class="action-item" @click="goToWithdraw">
        <iconify-icon icon="heroicons:minus-circle" width="24" class="action-icon"></iconify-icon>
        <span class="action-text">提现</span>
      </div>
      <div class="action-item" @click="goToTransfer">
        <iconify-icon icon="heroicons:arrow-right-circle" width="24" class="action-icon"></iconify-icon>
        <span class="action-text">转账</span>
      </div>
      <div class="action-item" @click="goToRedPacket">
        <iconify-icon icon="heroicons:gift" width="24" class="action-icon"></iconify-icon>
        <span class="action-text">红包</span>
      </div>
    </div>

    <!-- 功能列表 -->
    <div class="function-list">
      <div class="function-item" @click="goToBills">
        <iconify-icon icon="heroicons:document-text" width="24" class="function-icon"></iconify-icon>
        <span class="function-text">账单</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
      </div>
      <div class="function-item" @click="goToCards">
        <iconify-icon icon="heroicons:credit-card" width="24" class="function-icon"></iconify-icon>
        <span class="function-text">银行卡</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
      </div>
      <div class="function-item" @click="goToSecurity">
        <iconify-icon icon="heroicons:shield-check" width="24" class="function-icon"></iconify-icon>
        <span class="function-text">安全中心</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
      </div>
      <div class="function-item" @click="goToHelp">
        <iconify-icon icon="heroicons:question-mark-circle" width="24" class="function-icon"></iconify-icon>
        <span class="function-text">帮助中心</span>
        <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()

// 钱包余额
const walletBalance = ref('2,580.00')

// 返回上一页
const goBack = () => {
  router.back()
}

// 充值
const goToRecharge = () => {
  router.push('/wallet/recharge')
}

// 提现
const goToWithdraw = () => {
  router.push('/wallet/withdraw')
}

// 转账
const goToTransfer = () => {
  router.push('/transfer')
}

// 红包
const goToRedPacket = () => {
  router.push('/red-packet')
}

// 账单
const goToBills = () => {
  router.push('/bills')
}

// 银行卡
const goToCards = () => {
  router.push('/cards')
}

// 安全中心
const goToSecurity = () => {
  router.push('/wallet/security')
}

// 帮助中心
const goToHelp = () => {
  router.push('/wallet/help')
}

// 加载钱包余额
const loadWalletBalance = async () => {
  try {
    // 这里应该调用API获取真实余额
    // const response = await walletAPI.getBalance()
    // walletBalance.value = response.data.balance
    console.log('加载钱包余额')
  } catch (error) {
    console.error('加载钱包余额失败:', error)
  }
}

onMounted(() => {
  loadWalletBalance()
})
</script>

<style scoped>
.wallet-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
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

.wallet-icon {
  margin-right: 8px;
}

.balance-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.balance-amount {
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.currency {
  font-size: 24px;
  font-weight: 500;
  margin-right: 4px;
}

.amount-number {
  font-size: 36px;
  font-weight: 700;
}

.balance-description {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

/* 快捷操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 0 16px;
  margin-bottom: 24px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  padding: 16px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-item:hover {
  background: #f8f8f8;
  transform: translateY(-2px);
}

.action-icon {
  color: #07C160;
  margin-bottom: 8px;
}

.action-text {
  font-size: 12px;
  color: #333;
  text-align: center;
}

/* 功能列表 */
.function-list {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
}

.function-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.function-item:last-child {
  border-bottom: none;
}

.function-item:hover {
  background: #f8f8f8;
}

.function-icon {
  color: #07C160;
  margin-right: 12px;
}

.function-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.arrow-icon {
  color: #ccc;
}
</style>
