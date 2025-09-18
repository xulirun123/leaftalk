<template>
  <div class="payment-main-page">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1 class="title">收付款</h1>
      <div class="header-spacer"></div>
    </div>

    <!-- 收付款内容 -->
    <div class="payment-content">
      <!-- 模式切换 -->
      <div class="mode-switch">
        <button 
          :class="['mode-btn', { active: isReceive }]" 
          @click="switchToReceive"
        >
          收款
        </button>
        <button 
          :class="['mode-btn', { active: !isReceive }]" 
          @click="switchToPayment"
        >
          付款
        </button>
      </div>

      <!-- 收款模式 -->
      <div v-if="isReceive" class="receive-section">
        <div class="qr-container">
          <div class="qr-code" ref="receiveQrRef"></div>
        </div>
      </div>

      <!-- 付款模式 -->
      <div v-else class="payment-section">
        <div class="qr-container">
          <div class="qr-code" ref="paymentQrRef"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/appStore'
import QRCode from 'qrcode'

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const isReceive = ref(true)
const receiveQrRef = ref<HTMLElement>()
const paymentQrRef = ref<HTMLElement>()

// 用户信息
const userInfo = ref({
  name: '测试用户',
  yeyuId: 'YY123456',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
})

// 方法
const goBack = () => {
  router.back()
}

// 模式切换方法
const switchToReceive = () => {
  isReceive.value = true
  setTimeout(() => {
    generateReceiveQRCode()
  }, 100)
}

const switchToPayment = () => {
  isReceive.value = false
  setTimeout(() => {
    generatePaymentQRCode()
  }, 100)
}

// 生成收款二维码
const generateReceiveQRCode = async () => {
  if (!receiveQrRef.value) return

  try {
    const qrData = {
      type: 'payment_receive',
      userId: userInfo.value.yeyuId,
      userName: userInfo.value.name,
      timestamp: Date.now()
    }

    const qrString = `yeyu://payment?data=${encodeURIComponent(JSON.stringify(qrData))}`

    // 清空容器
    receiveQrRef.value.innerHTML = ''

    // 创建canvas元素
    const canvas = document.createElement('canvas')

    // 生成彩色收款二维码
    await QRCode.toCanvas(canvas, qrString, {
      width: 150,
      margin: 2,
      color: {
        dark: '#07c160',  // 绿色收款码
        light: '#FFFFFF'
      }
    })

    // 将canvas添加到容器中
    receiveQrRef.value.appendChild(canvas)
  } catch (error) {
    console.error('生成收款二维码失败:', error)
    appStore.showToast('生成二维码失败', 'error')
  }
}

// 生成付款二维码
const generatePaymentQRCode = async () => {
  if (!paymentQrRef.value) return

  try {
    const qrData = {
      type: 'payment_pay',
      userId: userInfo.value.yeyuId,
      userName: userInfo.value.name,
      timestamp: Date.now()
    }

    const qrString = `yeyu://payment?data=${encodeURIComponent(JSON.stringify(qrData))}`

    // 清空容器
    paymentQrRef.value.innerHTML = ''

    // 创建canvas元素
    const canvas = document.createElement('canvas')

    // 生成彩色付款二维码
    await QRCode.toCanvas(canvas, qrString, {
      width: 150,
      margin: 2,
      color: {
        dark: '#1989fa',  // 蓝色付款码
        light: '#FFFFFF'
      }
    })

    // 将canvas添加到容器中
    paymentQrRef.value.appendChild(canvas)
  } catch (error) {
    console.error('生成付款二维码失败:', error)
    appStore.showToast('生成二维码失败', 'error')
  }
}





// 生命周期
onMounted(() => {
  // 延迟生成二维码，确保DOM已渲染
  setTimeout(() => {
    if (isReceive.value) {
      generateReceiveQRCode()
    } else {
      generatePaymentQRCode()
    }
  }, 100)
})
</script>

<style scoped>
.payment-main-page {
  height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  color: #333;
  height: 60px;
  box-sizing: border-box;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.header-spacer {
  width: 40px;
}

.payment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 模式切换 */
.mode-switch {
  display: flex;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 4px;
  margin: 20px;
}

.mode-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 20px;
  background: transparent;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: white;
  color: #07c160;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 收款区域 */
.receive-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.qr-container {
  text-align: center;
}

.qr-code {
  margin-bottom: 16px;
}

/* 付款区域 */
.payment-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.scan-area {
  text-align: center;
}

.scan-icon {
  margin-bottom: 20px;
}

.scan-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.scan-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.scan-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.scan-btn:hover {
  background: #06a552;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
}
</style>
