<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-icon">
        <iconify-icon icon="heroicons:exclamation-triangle" width="64"></iconify-icon>
      </div>
      
      <h1 class="error-title">页面未找到</h1>
      <p class="error-message">抱歉，您访问的页面不存在或已被移除</p>
      
      <div class="error-actions">
        <button @click="goHome" class="action-btn primary">
          <iconify-icon icon="heroicons:home" width="20"></iconify-icon>
          返回首页
        </button>
        
        <button @click="goBack" class="action-btn secondary">
          <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
          返回上页
        </button>
      </div>
      
      <div class="error-code">
        错误代码: 404
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.not-found-content {
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.error-icon {
  color: #ff6b6b;
  margin-bottom: 24px;
}

.error-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 40px;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.primary {
  background: #07c160;
  color: white;
}

.action-btn.primary:hover {
  background: #06a552;
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #333;
}

.action-btn.secondary:hover {
  background: #e5e5e5;
  transform: translateY(-2px);
}

.error-code {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

@media (max-width: 480px) {
  .not-found-content {
    padding: 40px 20px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-message {
    font-size: 14px;
  }
}
</style>
