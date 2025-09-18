<template>
  <div class="services-page">
    <!-- 顶部导航栏 -->
    <MobileTopBar 
      title="服务" 
      :show-back="true" 
      @back="goBack"
    />

    <!-- 叶语豆和钱包按钮区域 -->
    <div class="service-buttons-container">
      <div class="service-button" @click="goToYeyuBeans">
        <iconify-icon icon="heroicons:sparkles" width="24" class="service-icon"></iconify-icon>
        <span class="service-text">叶语豆</span>
      </div>
      <div class="service-button" @click="goToWallet">
        <iconify-icon icon="heroicons:wallet" width="24" class="service-icon"></iconify-icon>
        <span class="service-text">钱包</span>
      </div>
    </div>

    <!-- 其他服务内容 -->
    <div class="services-content">
      <div class="service-section">
        <h3 class="section-title">常用服务</h3>
        <div class="service-grid">
          <div class="service-item" @click="goToTransfer">
            <iconify-icon icon="heroicons:arrow-right-circle" width="32" class="item-icon"></iconify-icon>
            <span class="item-text">转账</span>
          </div>
          <div class="service-item" @click="goToRedPacket">
            <iconify-icon icon="heroicons:gift" width="32" class="item-icon"></iconify-icon>
            <span class="item-text">红包</span>
          </div>
          <div class="service-item" @click="goToPayment">
            <iconify-icon icon="heroicons:credit-card" width="32" class="item-icon"></iconify-icon>
            <span class="item-text">收付款</span>
          </div>
          <div class="service-item" @click="goToBills">
            <iconify-icon icon="heroicons:document-text" width="32" class="item-icon"></iconify-icon>
            <span class="item-text">账单</span>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到叶语豆页面
const goToYeyuBeans = () => {
  router.push('/yeyu-beans')
}

// 跳转到钱包页面
const goToWallet = () => {
  router.push('/wallet')
}

// 其他服务功能
const goToTransfer = () => {
  router.push('/transfer')
}

const goToRedPacket = () => {
  router.push('/red-packet')
}

const goToPayment = () => {
  router.push('/payment-qr')
}

const goToBills = () => {
  router.push('/bills')
}
</script>

<style scoped>
.services-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 叶语豆和钱包按钮区域 */
.service-buttons-container {
  height: 100px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 40px;
  position: fixed;
  top: 67px; /* 顶部导航栏高度 */
  left: 0;
  right: 0;
  z-index: 100;
}

.service-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.service-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.service-button:active {
  transform: translateY(0);
}

.service-icon {
  color: white;
  margin-bottom: 8px;
}

.service-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

/* 服务内容区域 */
.services-content {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
  margin-top: 100px; /* 为固定的按钮区域留出空间 */
}

.service-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.service-item:hover {
  background: #f8f8f8;
}

.service-item:active {
  background: #f0f0f0;
  transform: scale(0.98);
}

.item-icon {
  color: #07C160;
  margin-bottom: 8px;
}

.item-text {
  font-size: 12px;
  color: #333;
  text-align: center;
}
</style>
