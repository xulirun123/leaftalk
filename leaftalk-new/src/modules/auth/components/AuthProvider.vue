<template>
  <div class="auth-provider">
    <!-- 认证状态指示器 -->
    <div v-if="showAuthStatus" class="auth-status" :class="authStatusClass">
      <iconify-icon :icon="authStatusIcon"></iconify-icon>
      <span>{{ authStatusText }}</span>
    </div>
    
    <!-- 主要内容 -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../../../stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 响应式数据
const showAuthStatus = ref(false)
const authCheckInterval = ref<NodeJS.Timeout | null>(null)

// 计算属性
const authStatusClass = computed(() => {
  if (authStore.isLoggedIn) {
    return 'auth-status--success'
  } else {
    return 'auth-status--warning'
  }
})

const authStatusIcon = computed(() => {
  if (authStore.isLoggedIn) {
    return 'mdi:check-circle'
  } else {
    return 'mdi:account-alert'
  }
})

const authStatusText = computed(() => {
  if (authStore.isLoggedIn) {
    return `已登录: ${authStore.user?.name}`
  } else {
    return '未登录'
  }
})

// 方法
const checkAuthStatus = () => {
  const token = localStorage.getItem('yeyu_auth_token')
  const userInfo = localStorage.getItem('yeyu_user_info')
  
  // 如果本地有数据但store中没有，重新初始化
  if (token && userInfo && !authStore.isLoggedIn) {
    authStore.init()
  }
}

const showStatusTemporarily = () => {
  showAuthStatus.value = true
  setTimeout(() => {
    showAuthStatus.value = false
  }, 3000)
}

// 监听路由变化（仅在开发模式下显示状态）
watch(() => route.path, (newPath) => {
  // 在开发模式下显示认证状态
  if (import.meta.env.DEV) {
    showStatusTemporarily()
  }
})

// 监听认证状态变化
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  console.log('🔐 认证状态变化:', isLoggedIn)
  if (isLoggedIn) {
    console.log('✅ 用户已登录:', authStore.user?.name)
  } else {
    console.log('❌ 用户未登录')
  }
})

// 生命周期
onMounted(() => {
  console.log('🚀 AuthProvider 初始化')
  
  // 初始化认证状态
  authStore.init()
  checkAuthStatus()
  
  // 定期检查认证状态（每30秒）
  authCheckInterval.value = setInterval(checkAuthStatus, 30000)
  
  // 在开发模式下显示认证状态
  if (import.meta.env.DEV) {
    showStatusTemporarily()
  }
})

// 清理
const cleanup = () => {
  if (authCheckInterval.value) {
    clearInterval(authCheckInterval.value)
    authCheckInterval.value = null
  }
}

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(cleanup)
</script>

<style scoped>
.auth-provider {
  position: relative;
  width: 100%;
  height: 100%;
}

.auth-status {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.auth-status--success {
  background: rgba(7, 193, 96, 0.9);
  color: white;
}

.auth-status--warning {
  background: rgba(255, 149, 0, 0.9);
  color: white;
}

.auth-status iconify-icon {
  font-size: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .auth-status {
    top: 10px;
    right: 10px;
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>
