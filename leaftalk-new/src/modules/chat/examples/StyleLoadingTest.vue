<template>
  <div class="style-loading-test">
    <h2>样式加载测试</h2>
    
    <!-- 问题描述 -->
    <div class="problem-section">
      <h3>问题描述</h3>
      <p>刷新页面后聊天列表和聊天页面显示不正常的样式，需要确保样式立即加载。</p>
    </div>

    <!-- 样式状态检查 -->
    <div class="status-section">
      <h3>样式状态检查</h3>
      <div class="status-grid">
        <div class="status-item">
          <strong>关键样式加载:</strong>
          <span :class="criticalStylesStatus.class">{{ criticalStylesStatus.text }}</span>
        </div>
        <div class="status-item">
          <strong>聊天项样式:</strong>
          <span :class="chatItemStylesStatus.class">{{ chatItemStylesStatus.text }}</span>
        </div>
        <div class="status-item">
          <strong>头像样式:</strong>
          <span :class="avatarStylesStatus.class">{{ avatarStylesStatus.text }}</span>
        </div>
        <div class="status-item">
          <strong>加载时间:</strong>
          <span>{{ loadTime }}ms</span>
        </div>
      </div>
    </div>

    <!-- 样式测试区域 -->
    <div class="test-section">
      <h3>样式测试区域</h3>
      <div class="test-actions">
        <button @click="testStyles">测试样式</button>
        <button @click="reloadStyles">重新加载样式</button>
        <button @click="forceRefresh">强制刷新</button>
        <button @click="clearCache">清除缓存</button>
      </div>
      
      <!-- 模拟聊天项 -->
      <div class="mock-chat-list">
        <h4>模拟聊天列表</h4>
        <div class="chat-list">
          <div class="chat-item" v-for="i in 3" :key="i">
            <div class="chat-user-info">
              <div class="user-avatar">
                <div class="optimized-avatar">
                  <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=test${i}`" alt="头像" />
                </div>
                <div v-if="i === 1" class="unread-badge">{{ i }}</div>
              </div>
              <div class="user-details">
                <div class="user-name">测试用户{{ i }}</div>
                <div class="message-time-row">
                  <div class="last-message">这是测试消息内容{{ i }}</div>
                  <div class="chat-time">{{ formatTime(i) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模拟聊天页面 -->
      <div class="mock-chat-page">
        <h4>模拟聊天页面</h4>
        <div class="chat-simple">
          <div class="chat-header">
            <span>测试聊天</span>
          </div>
          <div class="chat-messages">
            <div class="empty-chat">
              <p>开始聊天吧</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 样式检查结果 -->
    <div class="result-section">
      <h3>样式检查结果</h3>
      <div class="check-results">
        <div v-for="(result, index) in checkResults" :key="index" class="check-item">
          <span class="check-name">{{ result.name }}:</span>
          <span :class="result.passed ? 'check-pass' : 'check-fail'">
            {{ result.passed ? '✅ 通过' : '❌ 失败' }}
          </span>
          <span class="check-detail">{{ result.detail }}</span>
        </div>
      </div>
    </div>

    <!-- 性能监控 */
    <div class="performance-section">
      <h3>性能监控</h3>
      <div class="performance-metrics">
        <div><strong>DOM加载时间:</strong> {{ performanceMetrics.domLoaded }}ms</div>
        <div><strong>样式应用时间:</strong> {{ performanceMetrics.stylesApplied }}ms</div>
        <div><strong>首次渲染时间:</strong> {{ performanceMetrics.firstPaint }}ms</div>
        <div><strong>内容渲染时间:</strong> {{ performanceMetrics.contentPaint }}ms</div>
      </div>
    </div>

    <!-- 操作日志 */
    <div class="log-section">
      <h3>操作日志</h3>
      <div class="log-actions">
        <button @click="clearLogs">清除日志</button>
      </div>
      <div class="logs">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level" :class="log.level">{{ log.level }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  validateStylesApplied, 
  forceStyleRefresh, 
  preloadCriticalStyles,
  ensureStylesLoaded 
} from '../utils/stylePreloader'

// 状态数据
const loadTime = ref(0)
const checkResults = ref<Array<{ name: string, passed: boolean, detail: string }>>([])
const logs = ref<Array<{ time: string, level: string, message: string }>>([])
const performanceMetrics = ref({
  domLoaded: 0,
  stylesApplied: 0,
  firstPaint: 0,
  contentPaint: 0
})

// 添加日志
const addLog = (level: string, message: string) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    level,
    message
  })
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

// 状态计算
const criticalStylesStatus = computed(() => {
  const styleElement = document.getElementById('critical-chat-styles')
  if (styleElement) {
    return { text: '已加载', class: 'status-success' }
  } else {
    return { text: '未加载', class: 'status-error' }
  }
})

const chatItemStylesStatus = computed(() => {
  const isValid = validateStylesApplied()
  if (isValid) {
    return { text: '正常', class: 'status-success' }
  } else {
    return { text: '异常', class: 'status-error' }
  }
})

const avatarStylesStatus = computed(() => {
  try {
    const testElement = document.createElement('div')
    testElement.className = 'optimized-avatar'
    testElement.style.visibility = 'hidden'
    testElement.style.position = 'absolute'
    document.body.appendChild(testElement)
    
    const computedStyle = window.getComputedStyle(testElement)
    const isCorrect = computedStyle.width === '44px' && computedStyle.height === '44px'
    
    document.body.removeChild(testElement)
    
    if (isCorrect) {
      return { text: '正常', class: 'status-success' }
    } else {
      return { text: '异常', class: 'status-error' }
    }
  } catch (error) {
    return { text: '检查失败', class: 'status-error' }
  }
})

// 操作方法
const testStyles = () => {
  addLog('INFO', '开始测试样式')
  const startTime = performance.now()
  
  checkResults.value = []
  
  // 检查关键样式元素
  const criticalStyles = document.getElementById('critical-chat-styles')
  checkResults.value.push({
    name: '关键样式元素',
    passed: !!criticalStyles,
    detail: criticalStyles ? '存在' : '不存在'
  })
  
  // 检查聊天项样式
  const chatItemValid = validateStylesApplied()
  checkResults.value.push({
    name: '聊天项样式',
    passed: chatItemValid,
    detail: chatItemValid ? '样式正确' : '样式异常'
  })
  
  // 检查CSS变量
  const rootStyle = getComputedStyle(document.documentElement)
  const hasVars = rootStyle.getPropertyValue('--primary-color') !== ''
  checkResults.value.push({
    name: 'CSS变量',
    passed: hasVars,
    detail: hasVars ? '已设置' : '未设置'
  })
  
  const endTime = performance.now()
  loadTime.value = Math.round(endTime - startTime)
  
  addLog('INFO', `样式测试完成，耗时 ${loadTime.value}ms`)
}

const reloadStyles = async () => {
  addLog('INFO', '重新加载样式')
  await ensureStylesLoaded()
  testStyles()
}

const forceRefresh = () => {
  addLog('INFO', '强制刷新样式')
  forceStyleRefresh()
  testStyles()
}

const clearCache = () => {
  addLog('INFO', '清除样式缓存')
  const styleElement = document.getElementById('critical-chat-styles')
  if (styleElement) {
    styleElement.remove()
  }
  preloadCriticalStyles()
  testStyles()
}

const clearLogs = () => {
  logs.value = []
}

const formatTime = (i: number): string => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - i * 5)
  return now.toLocaleTimeString().slice(0, 5)
}

// 性能监控
const measurePerformance = () => {
  if (performance.timing) {
    const timing = performance.timing
    performanceMetrics.value = {
      domLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      stylesApplied: timing.loadEventEnd - timing.navigationStart,
      firstPaint: 0,
      contentPaint: 0
    }
  }
  
  // 获取Paint Timing
  if (performance.getEntriesByType) {
    const paintEntries = performance.getEntriesByType('paint')
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        performanceMetrics.value.firstPaint = Math.round(entry.startTime)
      } else if (entry.name === 'first-contentful-paint') {
        performanceMetrics.value.contentPaint = Math.round(entry.startTime)
      }
    })
  }
}

// 初始化
onMounted(() => {
  addLog('INFO', '样式加载测试页面已加载')
  measurePerformance()
  testStyles()
})
</script>

<style scoped>
.style-loading-test {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.problem-section,
.status-section,
.test-section,
.result-section,
.performance-section,
.log-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.status-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.status-success { color: #28a745; }
.status-warning { color: #ffc107; }
.status-error { color: #dc3545; }

.test-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.test-actions button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-actions button:hover {
  background: #0056b3;
}

.mock-chat-list,
.mock-chat-page {
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.mock-chat-page .chat-simple {
  height: 200px;
}

.check-results {
  margin-top: 15px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.check-name {
  font-weight: 500;
  min-width: 120px;
}

.check-pass { color: #28a745; }
.check-fail { color: #dc3545; }

.check-detail {
  color: #666;
  font-size: 14px;
}

.performance-metrics div {
  margin: 8px 0;
  padding: 5px;
  background: #f8f9fa;
  border-radius: 3px;
}

.log-actions {
  margin-bottom: 15px;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 4px;
}

.log-item {
  padding: 8px 15px;
  border-bottom: 1px solid #e9ecef;
  font-family: monospace;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  margin-right: 10px;
}

.log-level {
  margin-right: 10px;
  font-weight: bold;
  min-width: 50px;
  display: inline-block;
}

.log-message {
  color: #333;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
}

h4 {
  margin: 15px 0 10px 0;
  color: #555;
}
</style>
