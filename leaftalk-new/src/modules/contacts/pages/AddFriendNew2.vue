<template>
  <div class="add-friend-wrapper">
    <div class="add-friend-page">
      <!-- 主内容区域 -->
      <div class="main-section">
      <!-- 搜索框 -->
      <div class="search-box" @click="goToSearch">
        <iconify-icon icon="heroicons:magnifying-glass" width="18" class="search-icon"></iconify-icon>
        <span class="search-placeholder">叶语号/手机号</span>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 添加方式列表 -->
      <div class="method-item" @click="goToQRScanner">
        <div class="method-icon scan">
          <iconify-icon icon="heroicons:qr-code" width="22"></iconify-icon>
        </div>
        <span class="method-text">扫一扫</span>
        <iconify-icon icon="heroicons:chevron-right" width="18" class="arrow"></iconify-icon>
      </div>

      <div class="method-item" @click="goToEnterpriseContacts">
        <div class="method-icon enterprise">
          <iconify-icon icon="heroicons:building-office" width="22"></iconify-icon>
        </div>
        <span class="method-text">企业叶语联系人</span>
        <iconify-icon icon="heroicons:chevron-right" width="18" class="arrow"></iconify-icon>
      </div>

      <div class="method-item" @click="goToFaceToFaceGroup">
        <div class="method-icon group">
          <iconify-icon icon="heroicons:user-group" width="22"></iconify-icon>
        </div>
        <span class="method-text">面对面建群</span>
        <iconify-icon icon="heroicons:chevron-right" width="18" class="arrow"></iconify-icon>
      </div>
    </div>

      <!-- 我的二维码 -->
      <div class="qr-section">
        <div class="qr-container">
          <canvas ref="qrCanvas" class="qr-canvas"></canvas>
          <!-- 叶语图标 - 放在二维码中央 -->
          <div class="qr-logo">
            <iconify-icon icon="mdi:leaf" width="28" class="leaf-icon"></iconify-icon>
          </div>
        </div>
        <div class="qr-id">叶语号：{{ currentUser.yeyuId || '加载中...' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import QRCode from 'qrcode'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 当前用户信息
const currentUser = ref({
  id: '',
  yeyuId: '',
  nickname: '',
  avatar: ''
})

// 二维码canvas引用
const qrCanvas = ref<HTMLCanvasElement | null>(null)

// 返回
const goBack = () => {
  router.back()
}

// 跳转到搜索好友页面
const goToSearch = () => {
  router.push('/search-friend')
}

// 扫一扫
const goToQRScanner = () => {
  router.push('/scan')
}

// 企业联系人
const goToEnterpriseContacts = () => {
  router.push('/enterprise-contacts')
}

// 面对面建群
const goToFaceToFaceGroup = () => {
  router.push('/face-to-face-add')
}

// 加载用户信息
const loadUserInfo = () => {
  const user = authStore.user
  if (user) {
    currentUser.value = {
      id: user.id?.toString() || '',
      yeyuId: user.yeyu_id || user.username || '',
      nickname: user.nickname || user.username || '叶语用户',
      avatar: user.avatar || ''
    }
    
    // 生成二维码
    generateQRCode()
  }
}

// 生成二维码
const generateQRCode = async () => {
  if (!qrCanvas.value || !currentUser.value.yeyuId) return

  try {
    const qrData = JSON.stringify({
      type: 'user',
      yeyuId: currentUser.value.yeyuId,
      nickname: currentUser.value.nickname
    })

    await QRCode.toCanvas(qrCanvas.value, qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
/* 外层包装器 - 使用固定高度和负边距抵消父容器padding */
.add-friend-wrapper {
  min-height: calc(100vh - 100px); /* 100vh - 顶部导航栏高度 */
  background: #EDEDED;
  margin: 0 !important;
  padding: 0 !important;
  /* 抵消父容器的 padding-bottom */
  margin-bottom: -75px !important;
  padding-bottom: 75px !important;
}

.add-friend-page {
  min-height: 100%;
  background: #EDEDED;
  display: flex;
  flex-direction: column;
  margin: 0 !important;
  padding: 0 !important;
}

/* 主内容区域 */
.main-section {
  background: #FFFFFF;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box;
}

/* 搜索框 */
.search-box {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  transition: background 0.2s;
  background: #FFFFFF;
}

.search-box:active {
  background: #ECECEC;
}

.search-icon {
  width: 36px;
  height: 36px;
  background: #F6F6F6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999999;
  margin-right: 12px;
  flex-shrink: 0;
}

.search-placeholder {
  font-size: 16px;
  color: #000000;
}

/* 分隔线 */
.divider {
  height: 8px;
  background: #EDEDED;
}

.method-item {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  border-bottom: 0.5px solid #E5E5E5;
  transition: background 0.2s;
}

.method-item:last-child {
  border-bottom: none;
}

.method-item:active {
  background: #ECECEC;
}

.method-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  color: #FFFFFF;
}

.method-icon.scan {
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
}

.method-icon.enterprise {
  background: linear-gradient(135deg, #F093FB 0%, #F5576C 100%);
}

.method-icon.group {
  background: linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%);
}

.method-text {
  flex: 1;
  font-size: 16px;
  color: #000000;
}

.arrow {
  color: #C7C7CC;
  flex-shrink: 0;
}

/* 二维码区域 */
.qr-section {
  background: #FFFFFF;
  padding: 24px 16px;
  margin-top: 58px; /* 50px + 8px 原有间距 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-container {
  width: 200px;
  height: 200px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  position: relative; /* 为中央图标定位 */
}

.qr-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* 二维码中央的叶语图标 */
.qr-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background: #FFFFFF;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  padding: 4px;
}

.leaf-icon {
  color: #07C160; /* 叶语青色 */
}

.qr-id {
  font-size: 14px;
  color: #999999;
}
</style>

