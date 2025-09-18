<template>
  <div class="pay-password-style">
    <!-- 支付密码输入样式选择 -->
    <div class="style-list">
      <!-- 数字键盘样式 -->
      <div 
        class="style-item" 
        :class="{ 'selected': selectedStyle === 'numeric' }"
        @click="selectStyle('numeric')"
      >
        <div class="style-info">
          <div class="style-title">数字键盘</div>
          <div class="style-desc">使用数字键盘输入6位数字密码</div>
        </div>
        <div class="style-preview">
          <div class="numeric-preview">
            <div class="dot-container">
              <div class="dot filled"></div>
              <div class="dot filled"></div>
              <div class="dot filled"></div>
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>
        </div>
        <div class="check-icon" v-if="selectedStyle === 'numeric'">
          <iconify-icon icon="heroicons:check-circle" width="20" style="color: #07C160;"></iconify-icon>
        </div>
      </div>

      <!-- 手势密码样式 -->
      <div 
        class="style-item" 
        :class="{ 'selected': selectedStyle === 'gesture' }"
        @click="selectStyle('gesture')"
      >
        <div class="style-info">
          <div class="style-title">手势密码</div>
          <div class="style-desc">通过连接9个点绘制手势密码</div>
        </div>
        <div class="style-preview">
          <div class="gesture-preview">
            <div class="gesture-grid">
              <div class="gesture-dot" v-for="i in 9" :key="i" :class="{ 'active': [1,2,5,8,9].includes(i) }"></div>
            </div>
          </div>
        </div>
        <div class="check-icon" v-if="selectedStyle === 'gesture'">
          <iconify-icon icon="heroicons:check-circle" width="20" style="color: #07C160;"></iconify-icon>
        </div>
      </div>

      <!-- 指纹识别样式 -->
      <div 
        class="style-item" 
        :class="{ 'selected': selectedStyle === 'fingerprint', 'disabled': !fingerprintAvailable }"
        @click="selectStyle('fingerprint')"
      >
        <div class="style-info">
          <div class="style-title">指纹识别</div>
          <div class="style-desc">{{ fingerprintAvailable ? '使用指纹快速验证支付' : '设备不支持指纹识别' }}</div>
        </div>
        <div class="style-preview">
          <div class="fingerprint-preview">
            <iconify-icon icon="heroicons:finger-print" width="32" style="color: #999;"></iconify-icon>
          </div>
        </div>
        <div class="check-icon" v-if="selectedStyle === 'fingerprint'">
          <iconify-icon icon="heroicons:check-circle" width="20" style="color: #07C160;"></iconify-icon>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-section">
      <button 
        class="save-btn"
        :class="{ 'disabled': !hasChanged || isLoading }"
        :disabled="!hasChanged || isLoading"
        @click="saveStyle"
      >
        {{ isLoading ? '保存中...' : '保存设置' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 当前选择的样式
const selectedStyle = ref('numeric')
const originalStyle = ref('numeric')

// 设备能力
const fingerprintAvailable = ref(false)

// 加载状态
const isLoading = ref(false)

// 是否有变化
const hasChanged = computed(() => {
  return selectedStyle.value !== originalStyle.value
})

// 选择样式
const selectStyle = (style: string) => {
  if (style === 'fingerprint' && !fingerprintAvailable.value) {
    return
  }
  selectedStyle.value = style
}

// 检查设备能力
const checkDeviceCapabilities = async () => {
  try {
    // 检查是否支持指纹识别
    if ('navigator' in window && 'credentials' in navigator) {
      fingerprintAvailable.value = true
    }
  } catch (error) {
    console.error('检查设备能力失败:', error)
  }
}

// 加载当前设置
const loadCurrentStyle = async () => {
  try {
    const response = await fetch('http://localhost:8893/api/payment/password-style', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      selectedStyle.value = result.style || 'numeric'
      originalStyle.value = result.style || 'numeric'
    } else {
      console.warn('密码样式API不可用，使用默认值')
      selectedStyle.value = 'numeric'
      originalStyle.value = 'numeric'
    }
  } catch (error) {
    console.error('加载支付密码样式失败:', error)
    // 使用默认值
    selectedStyle.value = 'numeric'
    originalStyle.value = 'numeric'
  }
}

// 保存设置
const saveStyle = async () => {
  if (!hasChanged.value) {
    return
  }

  isLoading.value = true

  try {
    const response = await fetch('http://localhost:8893/api/payment/password-style', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        style: selectedStyle.value
      })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      originalStyle.value = selectedStyle.value

      // 检查是否有警告信息
      if (result.warning && result.warning.needSetup) {
        const confirmMessage = result.warning.message + '，是否现在去设置？'
        if (confirm(confirmMessage)) {
          if (result.warning.setupType === 'numeric') {
            router.push('/settings/change-pay-password')
          } else if (result.warning.setupType === 'gesture') {
            router.push('/settings/change-gesture-password')
          }
        } else {
          alert('支付密码输入样式设置成功')
          router.back()
        }
      } else {
        alert('支付密码输入样式设置成功')
        router.back()
      }
    } else {
      alert(result.error || '设置失败')
    }
  } catch (error) {
    console.error('保存支付密码样式失败:', error)
    alert('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  checkDeviceCapabilities()
  loadCurrentStyle()
})
</script>

<style scoped>
.pay-password-style {
  height: 100vh;
  background: #e5e5e5;
  display: flex;
  flex-direction: column;
}

.style-list {
  flex: 1;
  padding: 16px;
}

.style-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
}

.style-item.selected {
  border-color: #07C160;
}

.style-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.style-item:active:not(.disabled) {
  background: #f5f5f5;
}

.style-info {
  flex: 1;
}

.style-title {
  font-size: 13px;
  color: #333;
  font-weight: normal;
  margin-bottom: 4px;
}

.style-desc {
  font-size: 13px;
  color: #666;
}

.style-preview {
  margin: 0 16px;
}

.numeric-preview {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-container {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: white;
}

.dot.filled {
  background: #333;
  border-color: #333;
}

.gesture-preview {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gesture-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 36px;
  height: 36px;
}

.gesture-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
}

.gesture-dot.active {
  background: #07C160;
}

.fingerprint-preview {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  position: absolute;
  top: 12px;
  right: 12px;
}

.save-section {
  padding: 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.save-btn {
  width: 100%;
  height: 44px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: normal;
  cursor: pointer;
}

.save-btn:hover {
  background: #06AD56;
}

.save-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
