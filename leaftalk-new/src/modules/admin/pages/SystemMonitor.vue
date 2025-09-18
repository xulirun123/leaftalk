<template>
  <div class="system-monitor">
    <div class="monitor-header">
      <h1>📊 系统监控中心</h1>
      <button @click="goBack" class="back-btn">返回</button>
    </div>

    <!-- 系统状态概览 -->
    <div class="status-overview">
      <div class="status-card" :class="systemStatus.status">
        <div class="status-icon">
          {{ systemStatus.status === 'healthy' ? '✅' : systemStatus.status === 'warning' ? '⚠️' : '❌' }}
        </div>
        <div class="status-info">
          <h3>系统状态</h3>
          <p>{{ systemStatus.message }}</p>
          <small>最后更新: {{ formatTime(systemStatus.timestamp) }}</small>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <button @click="refreshAll" :disabled="loading" class="action-btn refresh">
        🔄 {{ loading ? '刷新中...' : '刷新数据' }}
      </button>
      <button @click="testLogin" :disabled="loading" class="action-btn test">
        🔑 测试登录
      </button>
      <button @click="runSecurityCheck" :disabled="loading" class="action-btn security">
        🔒 安全检查
      </button>
    </div>

    <!-- 性能监控 -->
    <div class="monitor-section">
      <h2>📈 性能监控</h2>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">{{ performance.uptime }}s</div>
          <div class="metric-label">运行时间</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ performance.requestCount }}</div>
          <div class="metric-label">总请求数</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ performance.averageResponseTime }}ms</div>
          <div class="metric-label">平均响应时间</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ performance.errorRate }}</div>
          <div class="metric-label">错误率</div>
        </div>
      </div>

      <div class="performance-details" v-if="performance.responseTimePercentiles">
        <h3>响应时间分布</h3>
        <div class="percentiles">
          <div class="percentile-item">
            <span class="percentile-label">P50:</span>
            <span class="percentile-value">{{ performance.responseTimePercentiles.p50 }}ms</span>
          </div>
          <div class="percentile-item">
            <span class="percentile-label">P90:</span>
            <span class="percentile-value">{{ performance.responseTimePercentiles.p90 }}ms</span>
          </div>
          <div class="percentile-item">
            <span class="percentile-label">P95:</span>
            <span class="percentile-value">{{ performance.responseTimePercentiles.p95 }}ms</span>
          </div>
          <div class="percentile-item">
            <span class="percentile-label">P99:</span>
            <span class="percentile-value">{{ performance.responseTimePercentiles.p99 }}ms</span>
          </div>
        </div>
      </div>
    </div>

    <!-- API端点统计 -->
    <div class="monitor-section" v-if="performance.apiEndpoints && performance.apiEndpoints.length > 0">
      <h2>🔗 API端点统计</h2>
      
      <div class="api-endpoints">
        <div v-for="endpoint in performance.apiEndpoints.slice(0, 10)" :key="endpoint.endpoint" class="endpoint-item">
          <div class="endpoint-info">
            <div class="endpoint-name">{{ endpoint.endpoint }}</div>
            <div class="endpoint-stats">
              <span class="stat">{{ endpoint.count }} 次调用</span>
              <span class="stat">平均 {{ endpoint.avgTime }}ms</span>
              <span class="stat">最大 {{ endpoint.maxTime }}ms</span>
            </div>
          </div>
          <div class="endpoint-bar">
            <div class="bar-fill" :style="{ width: (endpoint.avgTime / 1000 * 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全检查 -->
    <div class="monitor-section" v-if="security.securityScore !== null">
      <h2>🔒 安全状态</h2>
      
      <div class="security-score">
        <div class="score-circle" :class="security.status">
          <div class="score-value">{{ security.securityScore }}</div>
          <div class="score-label">安全评分</div>
        </div>
        <div class="security-summary">
          <div class="summary-item">
            <span class="summary-label">通过:</span>
            <span class="summary-value success">{{ security.summary.passed }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">警告:</span>
            <span class="summary-value warning">{{ security.summary.warnings }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">失败:</span>
            <span class="summary-value error">{{ security.summary.failed }}</span>
          </div>
        </div>
      </div>

      <div class="security-checks">
        <div v-for="(check, key) in security.checks" :key="key" class="check-item" :class="check.status">
          <div class="check-icon">
            {{ check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌' }}
          </div>
          <div class="check-info">
            <div class="check-name">{{ key }}</div>
            <div class="check-message">{{ check.message }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 慢请求监控 -->
    <div class="monitor-section" v-if="performance.slowRequests && performance.slowRequests.length > 0">
      <h2>🐌 慢请求监控</h2>
      
      <div class="slow-requests">
        <div v-for="request in performance.slowRequests" :key="request.timestamp" class="slow-request-item">
          <div class="request-info">
            <div class="request-endpoint">{{ request.endpoint }}</div>
            <div class="request-time">{{ request.responseTime }}ms</div>
          </div>
          <div class="request-timestamp">{{ formatTime(request.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="monitor-section" v-if="performance.memory">
      <h2>💾 系统资源</h2>
      
      <div class="memory-info">
        <div class="memory-item">
          <span class="memory-label">堆内存使用:</span>
          <span class="memory-value">{{ formatBytes(performance.memory.heapUsed) }} / {{ formatBytes(performance.memory.heapTotal) }}</span>
        </div>
        <div class="memory-item">
          <span class="memory-label">RSS内存:</span>
          <span class="memory-value">{{ formatBytes(performance.memory.rss) }}</span>
        </div>
        <div class="memory-item">
          <span class="memory-label">外部内存:</span>
          <span class="memory-value">{{ formatBytes(performance.memory.external) }}</span>
        </div>
      </div>
    </div>

    <!-- 错误信息显示 -->
    <div v-if="error" class="error-section">
      <h2>❌ 错误信息</h2>
      <div class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const error = ref(null)
const systemStatus = reactive({
  status: 'unknown',
  message: '正在检查系统状态...',
  timestamp: new Date().toISOString()
})

const performance = reactive({
  uptime: 0,
  requestCount: 0,
  averageResponseTime: 0,
  errorRate: '0%',
  responseTimePercentiles: null,
  apiEndpoints: [],
  slowRequests: [],
  memory: null
})

const security = reactive({
  securityScore: null,
  status: 'unknown',
  summary: {
    passed: 0,
    warnings: 0,
    failed: 0
  },
  checks: {}
})

let refreshInterval = null

// 方法
const goBack = () => {
  router.back()
}

const formatTime = (timeStr) => {
  return new Date(timeStr).toLocaleString('zh-CN')
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const checkSystemHealth = async () => {
  try {
    const response = await axios.get('/api/health')
    if (response.data.status === 'healthy') {
      systemStatus.status = 'healthy'
      systemStatus.message = '系统运行正常'
    } else {
      systemStatus.status = 'warning'
      systemStatus.message = '系统状态异常'
    }
    systemStatus.timestamp = new Date().toISOString()
  } catch (err) {
    systemStatus.status = 'error'
    systemStatus.message = '无法连接到服务器'
    systemStatus.timestamp = new Date().toISOString()
  }
}

const loadPerformanceData = async () => {
  try {
    const response = await axios.get('/api/performance')
    if (response.data.success) {
      Object.assign(performance, response.data.data)
    }
  } catch (err) {
    console.error('加载性能数据失败:', err)
  }
}

const runSecurityCheck = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      error.value = '请先登录以进行安全检查'
      return
    }

    const response = await axios.get('/api/security/check', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.success) {
      Object.assign(security, response.data.data)
      error.value = null
    }
  } catch (err) {
    error.value = '安全检查失败: ' + (err.response?.data?.message || err.message)
  } finally {
    loading.value = false
  }
}

const testLogin = async () => {
  loading.value = true
  try {
    const response = await axios.post('/api/auth/login', {
      phone: '13800138000',
      password: '123456'
    })
    
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token)
      alert('测试登录成功！')
      await runSecurityCheck() // 登录成功后自动进行安全检查
    }
  } catch (err) {
    error.value = '测试登录失败: ' + (err.response?.data?.message || err.message)
  } finally {
    loading.value = false
  }
}

const refreshAll = async () => {
  loading.value = true
  error.value = null
  
  try {
    await Promise.all([
      checkSystemHealth(),
      loadPerformanceData()
    ])
    
    // 如果有token，也刷新安全检查
    const token = localStorage.getItem('token')
    if (token) {
      await runSecurityCheck()
    }
  } catch (err) {
    error.value = '刷新数据失败: ' + err.message
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(async () => {
  await refreshAll()
  
  // 设置自动刷新（每30秒）
  refreshInterval = setInterval(async () => {
    await checkSystemHealth()
    await loadPerformanceData()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.system-monitor {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.monitor-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.back-btn {
  padding: 10px 20px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.status-overview {
  margin-bottom: 30px;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #ddd;
}

.status-card.healthy {
  border-left-color: #28a745;
}

.status-card.warning {
  border-left-color: #ffc107;
}

.status-card.error {
  border-left-color: #dc3545;
}

.status-icon {
  font-size: 32px;
  margin-right: 20px;
}

.status-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.status-info p {
  margin: 0 0 5px 0;
  color: #666;
}

.status-info small {
  color: #999;
  font-size: 12px;
}

.quick-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn.refresh {
  background: #007bff;
  color: white;
}

.action-btn.test {
  background: #28a745;
  color: white;
}

.action-btn.security {
  background: #dc3545;
  color: white;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.monitor-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.monitor-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.metric-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 14px;
  color: #666;
}

.percentiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.percentile-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.percentile-label {
  font-weight: 500;
  color: #666;
}

.percentile-value {
  font-weight: bold;
  color: #007bff;
}

.api-endpoints {
  space-y: 10px;
}

.endpoint-item {
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 10px;
}

.endpoint-name {
  font-family: monospace;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.endpoint-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.endpoint-bar {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
  transition: width 0.3s;
}

.security-score {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 25px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 4px solid #ddd;
}

.score-circle.good {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
}

.score-circle.warning {
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.1);
}

.score-circle.critical {
  border-color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.score-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.score-label {
  font-size: 12px;
  color: #666;
}

.security-summary {
  flex: 1;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.summary-value.success {
  color: #28a745;
  font-weight: bold;
}

.summary-value.warning {
  color: #ffc107;
  font-weight: bold;
}

.summary-value.error {
  color: #dc3545;
  font-weight: bold;
}

.security-checks {
  space-y: 10px;
}

.check-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.check-item.pass {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.check-item.warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.check-item.fail {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.check-icon {
  margin-right: 12px;
  font-size: 18px;
}

.check-name {
  font-weight: 500;
  color: #333;
  text-transform: capitalize;
}

.check-message {
  font-size: 14px;
  color: #666;
}

.slow-requests {
  space-y: 8px;
}

.slow-request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  margin-bottom: 8px;
}

.request-endpoint {
  font-family: monospace;
  font-weight: bold;
  color: #333;
}

.request-time {
  color: #dc3545;
  font-weight: bold;
}

.request-timestamp {
  font-size: 12px;
  color: #666;
}

.memory-info {
  space-y: 10px;
}

.memory-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.memory-label {
  color: #666;
}

.memory-value {
  font-weight: bold;
  color: #333;
}

.error-section {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.error-section h2 {
  color: #721c24;
  margin-bottom: 10px;
}

.error-message {
  color: #721c24;
  font-weight: 500;
}

@media (max-width: 768px) {
  .system-monitor {
    padding: 15px;
  }
  
  .monitor-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .quick-actions {
    justify-content: center;
  }
  
  .security-score {
    flex-direction: column;
    text-align: center;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>
