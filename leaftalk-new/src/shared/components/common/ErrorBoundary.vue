<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <iconify-icon icon="heroicons:exclamation-triangle" width="48" style="color: #ff6b6b;"></iconify-icon>
      <h3>{{ $t('error.somethingWentWrong') }}</h3>
      <p>{{ $t('error.errorBoundaryMessage') }}</p>
      
      <div class="error-actions">
        <button @click="retry" class="retry-btn">
          {{ $t('common.retry') }}
        </button>
        <button @click="goHome" class="home-btn">
          {{ $t('nav.home') }}
        </button>
      </div>
      
      <details v-if="isDev" class="error-details">
        <summary>{{ $t('error.technicalDetails') }}</summary>
        <pre>{{ errorInfo }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hasError = ref(false)
const errorInfo = ref('')
const isDev = computed(() => process.env.NODE_ENV === 'development')

// 捕获子组件错误
onErrorCaptured((error: Error, instance, info) => {
  hasError.value = true
  errorInfo.value = `
Error: ${error.message}
Stack: ${error.stack}
Component: ${instance?.$options.name || 'Unknown'}
Info: ${info}
  `.trim()
  
  // 在生产环境中上报错误
  if (!isDev.value) {
    reportError(error, instance, info)
  }
  
  return false // 阻止错误继续传播
})

// 重试
const retry = () => {
  hasError.value = false
  errorInfo.value = ''
}

// 回到首页
const goHome = () => {
  hasError.value = false
  errorInfo.value = ''
  router.push('/')
}

// 错误上报
const reportError = (error: Error, instance: any, info: string) => {
  // 这里可以集成错误监控服务，如 Sentry
  console.error('ErrorBoundary captured error:', {
    message: error.message,
    stack: error.stack,
    component: instance?.$options.name,
    info
  })
}
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f8f9fa;
}

.error-content {
  text-align: center;
  max-width: 400px;
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.error-content h3 {
  margin: 20px 0 10px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.error-content p {
  color: #666;
  line-height: 1.5;
  margin-bottom: 30px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.retry-btn, .home-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  background: #07c160;
  color: white;
}

.retry-btn:hover {
  background: #06a552;
}

.home-btn {
  background: #f0f0f0;
  color: #333;
}

.home-btn:hover {
  background: #e0e0e0;
}

.error-details {
  text-align: left;
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 10px;
}

.error-details pre {
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
