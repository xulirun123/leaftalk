<template>
  <div v-if="showMonitor" class="performance-monitor">
    <div class="monitor-header">
      <h3>性能监控</h3>
      <button @click="toggleMonitor" class="close-btn">×</button>
    </div>
    
    <div class="monitor-content">
      <!-- 内存使用 -->
      <div class="metric-item">
        <span class="metric-label">内存使用:</span>
        <span class="metric-value" :class="getMemoryClass()">
          {{ memoryUsage.toFixed(1) }}%
        </span>
      </div>
      
      <!-- FPS -->
      <div class="metric-item">
        <span class="metric-label">FPS:</span>
        <span class="metric-value" :class="getFpsClass()">
          {{ currentFps }}
        </span>
      </div>
      
      <!-- 组件数量 -->
      <div class="metric-item">
        <span class="metric-label">组件数:</span>
        <span class="metric-value">{{ componentCount }}</span>
      </div>
      
      <!-- 错误计数 -->
      <div class="metric-item">
        <span class="metric-label">错误数:</span>
        <span class="metric-value" :class="getErrorClass()">
          {{ errorCount }}
        </span>
      </div>
      
      <!-- 操作按钮 -->
      <div class="monitor-actions">
        <button @click="forceGC" class="action-btn">强制GC</button>
        <button @click="clearErrors" class="action-btn">清除错误</button>
        <button @click="exportReport" class="action-btn">导出报告</button>
      </div>
    </div>
  </div>
  
  <!-- 触发按钮 -->
  <button 
    v-if="!showMonitor" 
    @click="toggleMonitor" 
    class="monitor-trigger"
    :class="{ 'warning': hasPerformanceIssues }"
  >
    📊
  </button>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 响应式数据
const showMonitor = ref(false)
const memoryUsage = ref(0)
const currentFps = ref(60)
const componentCount = ref(0)
const errorCount = ref(0)
const performanceData = ref([])

// 定时器
let memoryTimer = null
let fpsTimer = null
let fpsCounter = 0
let lastTime = performance.now()

// 计算属性
const hasPerformanceIssues = computed(() => {
  return memoryUsage.value > 80 || currentFps.value < 30 || errorCount.value > 5
})

// 方法
const toggleMonitor = () => {
  showMonitor.value = !showMonitor.value
}

const getMemoryClass = () => {
  if (memoryUsage.value > 90) return 'critical'
  if (memoryUsage.value > 70) return 'warning'
  return 'normal'
}

const getFpsClass = () => {
  if (currentFps.value < 20) return 'critical'
  if (currentFps.value < 40) return 'warning'
  return 'normal'
}

const getErrorClass = () => {
  if (errorCount.value > 10) return 'critical'
  if (errorCount.value > 5) return 'warning'
  return 'normal'
}

const updateMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = performance.memory
    memoryUsage.value = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  }
}

const updateFPS = () => {
  const now = performance.now()
  const delta = now - lastTime
  
  if (delta >= 1000) {
    currentFps.value = Math.round((fpsCounter * 1000) / delta)
    fpsCounter = 0
    lastTime = now
  }
  
  fpsCounter++
  requestAnimationFrame(updateFPS)
}

const updateComponentCount = () => {
  // 估算当前页面的Vue组件数量
  const elements = document.querySelectorAll('[data-v-]')
  componentCount.value = elements.length
}

const forceGC = () => {
  if ('gc' in window) {
    window.gc()
    console.log('🗑️ 强制垃圾回收完成')
  } else {
    console.warn('浏览器不支持手动垃圾回收')
  }
}

const clearErrors = () => {
  errorCount.value = 0
  console.log('🧹 错误计数已清零')
}

const exportReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    memoryUsage: memoryUsage.value,
    fps: currentFps.value,
    componentCount: componentCount.value,
    errorCount: errorCount.value,
    userAgent: navigator.userAgent,
    url: window.location.href,
    performanceData: performanceData.value
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  console.log('📊 性能报告已导出')
}

// 监听错误
const handleError = () => {
  errorCount.value++
}

// 生命周期
onMounted(() => {
  // 开始监控 - 降低频率减少性能开销
  memoryTimer = setInterval(updateMemoryUsage, 3000) // 3秒更新一次
  updateFPS()

  // 定期更新组件数量 - 降低频率
  setInterval(updateComponentCount, 10000) // 10秒更新一次

  // 监听错误
  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleError)

  console.log('📊 性能监控已启动')
})

onUnmounted(() => {
  // 清理定时器
  if (memoryTimer) {
    clearInterval(memoryTimer)
  }
  
  // 移除事件监听
  window.removeEventListener('error', handleError)
  window.removeEventListener('unhandledrejection', handleError)
  
  console.log('📊 性能监控已停止')
})

// 开发模式下自动显示
if (process.env.NODE_ENV === 'development') {
  // 检测到性能问题时自动显示
  setInterval(() => {
    if (hasPerformanceIssues.value && !showMonitor.value) {
      console.warn('⚠️ 检测到性能问题，自动显示监控器')
      showMonitor.value = true
    }
  }, 10000)
}
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 280px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
}

.monitor-header h3 {
  margin: 0;
  font-size: 14px;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.metric-label {
  color: #ccc;
}

.metric-value {
  font-weight: bold;
}

.metric-value.normal {
  color: #4CAF50;
}

.metric-value.warning {
  color: #FF9800;
}

.metric-value.critical {
  color: #F44336;
}

.monitor-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  background: #333;
  border: 1px solid #555;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  flex: 1;
  min-width: 60px;
}

.action-btn:hover {
  background: #555;
}

.monitor-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.monitor-trigger:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.monitor-trigger.warning {
  background: #FF9800;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .performance-monitor {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
  }
  
  .monitor-trigger {
    bottom: 80px;
    right: 10px;
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
}
</style>
