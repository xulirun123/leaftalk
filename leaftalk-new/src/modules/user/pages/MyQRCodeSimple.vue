<template>
  <div class="my-qr-code-page">
    <div class="page-content">
      <!-- 二维码区域 -->
      <div class="qr-main-section">
        <!-- 用户信息 -->
        <div class="user-info-section">
          <img :src="userInfo.avatar" :alt="userInfo.name" class="user-avatar" />
          <div class="user-details">
            <div class="user-name">{{ userInfo.name }}</div>
            <div class="user-region">{{ userInfo.region || '未设置地区' }}</div>
          </div>
        </div>

        <!-- 二维码 -->
        <div class="qr-code-container">
          <div ref="qrCodeRef" class="qr-code" :style="{ width: qrSize + 'px', height: qrSize + 'px' }">
            <!-- 艺术二维码图案 -->
            <div class="qr-pattern" :class="currentQRStyle"></div>
            <!-- 中心方形图标 -->
            <div class="qr-center-logo">
              <iconify-icon icon="mdi:leaf" :width="centerIconSize" :style="{ color: currentIconColor }"></iconify-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="bottom-actions">
        <button @click="scanQRCode" class="action-btn">扫一扫</button>
        <button @click="changeStyle" class="action-btn">换个样式</button>
        <button @click="saveImage" class="action-btn">保存图片</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 移除goBack方法，使用全局导航栏的返回功能

// 响应式数据
const qrCodeRef = ref(null)
const userInfo = ref({
  name: '',
  yeyuId: '',
  region: '',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4'
})

// 二维码样式相关
const qrStyles = [
  { name: 'gradient', pattern: 'gradient', color: '#000000', iconColor: '#07C160' },
  { name: 'dots', pattern: 'dots', color: '#1890ff', iconColor: '#ff6b6b' },
  { name: 'waves', pattern: 'waves', color: '#722ed1', iconColor: '#ffd93d' },
  { name: 'geometric', pattern: 'geometric', color: '#52c41a', iconColor: '#ff6b6b' },
  { name: 'mosaic', pattern: 'mosaic', color: '#ff4757', iconColor: '#3742fa' }
]
const currentStyleIndex = ref(0)
const currentQRStyle = computed(() => qrStyles[currentStyleIndex.value].pattern)
const currentIconColor = computed(() => qrStyles[currentStyleIndex.value].iconColor)

// 计算二维码尺寸：屏幕宽度 - 80px
const qrSize = ref(0)
const centerIconSize = computed(() => Math.floor(qrSize.value * 0.15)) // 中心图标为二维码的15%

// 生命周期
onMounted(async () => {
  // 确保用户数据已加载
  if (!authStore.user && authStore.token) {
    console.log('🔄 二维码页面：获取用户信息...')
    await authStore.fetchUserInfo()
  }

  loadUserInfo()
  calculateQRSize()
  window.addEventListener('resize', calculateQRSize)
})

// 计算二维码尺寸
const calculateQRSize = () => {
  const screenWidth = window.innerWidth
  qrSize.value = screenWidth - 80
}

// 方法

const loadUserInfo = () => {
  const user = authStore.user
  console.log('🔍 二维码页面加载用户信息:', user)

  if (user) {
    userInfo.value = {
      name: user.nickname || user.username || '叶语用户',
      yeyuId: user.yeyu_id || user.username || 'yeyu_user',
      region: user.region || '未设置地区',
      avatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4'
    }

    console.log('✅ 二维码页面用户信息已设置:', userInfo.value)
  } else {
    console.warn('⚠️ 二维码页面未找到用户信息')
  }
}

// 扫一扫功能
const scanQRCode = () => {
  // 跳转到扫一扫页面
  router.push('/scan')
}

// 换个样式功能
const changeStyle = () => {
  currentStyleIndex.value = (currentStyleIndex.value + 1) % qrStyles.length
  // 不显示提示信息，直接切换样式
}

// 保存图片功能
const saveImage = () => {
  try {
    // 创建canvas来生成图片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = qrSize.value

    canvas.width = size
    canvas.height = size

    // 绘制二维码背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // 绘制二维码图案
    const currentStyle = qrStyles[currentStyleIndex.value]
    ctx.fillStyle = currentStyle.color

    // 简单的二维码图案
    const dotSize = size / 25
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * dotSize, j * dotSize, dotSize, dotSize)
        }
      }
    }

    // 转换为图片并下载
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `叶语二维码_${userInfo.value.name}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      appStore.showToast('二维码已保存到下载文件夹', 'success')
    }, 'image/png')

  } catch (error) {
    console.error('保存图片失败:', error)
    appStore.showToast('保存失败，请稍后重试', 'error')
  }
}
</script>

<style scoped>
.my-qr-code-page {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  padding-bottom: 100px; /* 为底部固定按钮留出空间 */
}

/* 主要二维码区域 */
.qr-main-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 40px;
  margin-bottom: 20px;
}

/* 用户信息区域 - 在二维码上方 */
.user-info-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  align-self: flex-start;
  width: 100%;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
}

.user-details {
  text-align: left;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-region {
  font-size: 14px;
  color: #666;
}

/* 二维码容器 */
.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.qr-code {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 艺术二维码图案 */
.qr-pattern {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

/* 不同样式的艺术二维码 */
.qr-pattern.gradient {
  background:
    linear-gradient(45deg, #000 25%, transparent 25%),
    linear-gradient(-45deg, #000 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #000 75%),
    linear-gradient(-45deg, transparent 75%, #000 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.qr-pattern.dots {
  background:
    radial-gradient(circle at 50% 50%, #1890ff 2px, transparent 2px),
    radial-gradient(circle at 25% 25%, #1890ff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #1890ff 1px, transparent 1px);
  background-size: 12px 12px, 6px 6px, 6px 6px;
  background-position: 0 0, 3px 3px, 9px 9px;
}

.qr-pattern.waves {
  background:
    repeating-linear-gradient(
      0deg,
      #722ed1 0px, #722ed1 2px,
      transparent 2px, transparent 6px
    ),
    repeating-linear-gradient(
      90deg,
      #722ed1 0px, #722ed1 2px,
      transparent 2px, transparent 6px
    ),
    repeating-linear-gradient(
      45deg,
      rgba(114, 46, 209, 0.5) 0px, rgba(114, 46, 209, 0.5) 1px,
      transparent 1px, transparent 4px
    );
  background-size: 8px 8px, 8px 8px, 6px 6px;
}

.qr-pattern.geometric {
  background:
    conic-gradient(from 0deg at 50% 50%, #52c41a 0deg 90deg, transparent 90deg 180deg, #52c41a 180deg 270deg, transparent 270deg 360deg),
    repeating-linear-gradient(
      45deg,
      #52c41a 0px, #52c41a 1px,
      transparent 1px, transparent 8px
    );
  background-size: 16px 16px, 12px 12px;
}

.qr-pattern.mosaic {
  background:
    linear-gradient(90deg, #ff4757 50%, transparent 50%),
    linear-gradient(0deg, #ff4757 50%, transparent 50%),
    radial-gradient(circle at 25% 25%, #ff4757 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #ff4757 1px, transparent 1px);
  background-size: 10px 10px, 10px 10px, 5px 5px, 5px 5px;
  background-position: 0 0, 0 0, 2.5px 2.5px, 7.5px 7.5px;
}

/* 中心方形图标 */
.qr-center-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* 底部操作按钮 */
.bottom-actions {
  display: flex;
  gap: 12px;
  padding: 0 20px;
  margin-bottom: 20px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #eee;
  padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.action-btn {
  flex: 1;
  padding: 16px 12px;
  background: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

.action-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 375px) {
  .qr-main-section {
    padding: 30px 20px;
  }

  .action-btn {
    font-size: 14px;
    padding: 14px 8px;
  }

  .bottom-actions {
    padding: 0 16px;
    gap: 8px;
  }
}
</style>
