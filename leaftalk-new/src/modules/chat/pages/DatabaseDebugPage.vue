<template>
  <div class="database-debug-page">
    <div class="debug-header">
      <h2>数据库调试工具</h2>
      <p>诊断和修复IndexedDB问题</p>
    </div>

    <div class="debug-sections">
      <!-- 数据库状态 -->
      <div class="debug-section">
        <h3>数据库状态</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">存在:</span>
            <span class="value" :class="dbStatus.exists ? 'success' : 'error'">
              {{ dbStatus.exists ? '是' : '否' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">版本:</span>
            <span class="value">{{ dbStatus.version }}</span>
          </div>
          <div class="status-item">
            <span class="label">对象存储:</span>
            <span class="value">{{ dbStatus.objectStores.join(', ') || '无' }}</span>
          </div>
          <div v-if="dbStatus.error" class="status-item">
            <span class="label">错误:</span>
            <span class="value error">{{ dbStatus.error }}</span>
          </div>
        </div>
      </div>

      <!-- 诊断结果 -->
      <div class="debug-section">
        <h3>诊断结果</h3>
        <div class="diagnosis-result" :class="diagnosis.status">
          <div class="status-badge">{{ getStatusText(diagnosis.status) }}</div>
          <div v-if="diagnosis.issues.length > 0" class="issues">
            <h4>问题:</h4>
            <ul>
              <li v-for="issue in diagnosis.issues" :key="issue">{{ issue }}</li>
            </ul>
          </div>
          <div v-if="diagnosis.recommendations.length > 0" class="recommendations">
            <h4>建议:</h4>
            <ul>
              <li v-for="rec in diagnosis.recommendations" :key="rec">{{ rec }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="debug-section">
        <h3>数据统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="number">{{ stats.messageCount }}</span>
            <span class="label">消息</span>
          </div>
          <div class="stat-item">
            <span class="number">{{ stats.sessionCount }}</span>
            <span class="label">会话</span>
          </div>
          <div class="stat-item">
            <span class="number">{{ stats.mediaCount }}</span>
            <span class="label">媒体</span>
          </div>
        </div>
        <div v-if="stats.error" class="error-message">
          统计错误: {{ stats.error }}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="debug-section">
        <h3>操作</h3>
        <div class="action-buttons">
          <button @click="refreshStatus" :disabled="loading" class="btn-primary">
            {{ loading ? '检查中...' : '重新检查' }}
          </button>
          <button @click="autoFix" :disabled="loading" class="btn-warning">
            {{ loading ? '修复中...' : '自动修复' }}
          </button>
          <button @click="clearData" :disabled="loading" class="btn-danger">
            {{ loading ? '清理中...' : '清空数据' }}
          </button>
          <button @click="exportReport" class="btn-secondary">
            导出报告
          </button>
        </div>
      </div>

      <!-- 操作日志 -->
      <div v-if="logs.length > 0" class="debug-section">
        <h3>操作日志</h3>
        <div class="logs">
          <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
            <span class="timestamp">{{ log.timestamp }}</span>
            <span class="message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DBDebugger } from '../utils/dbDebugger'

// 响应式数据
const loading = ref(false)
const dbStatus = ref({
  exists: false,
  version: 0,
  objectStores: [] as string[],
  error: ''
})

const diagnosis = ref({
  status: 'missing' as 'healthy' | 'corrupted' | 'missing' | 'version_mismatch',
  issues: [] as string[],
  recommendations: [] as string[]
})

const stats = ref({
  messageCount: 0,
  sessionCount: 0,
  mediaCount: 0,
  error: ''
})

const logs = ref<Array<{
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}>>([])

// 方法
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  logs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  })
  
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    healthy: '健康',
    corrupted: '损坏',
    missing: '缺失',
    version_mismatch: '版本不匹配'
  }
  return statusMap[status] || status
}

const refreshStatus = async () => {
  loading.value = true
  addLog('开始检查数据库状态...', 'info')
  
  try {
    // 获取数据库状态
    const status = await DBDebugger.checkDatabaseStatus()
    dbStatus.value = status
    addLog(`数据库状态: ${status.exists ? '存在' : '不存在'}`, status.exists ? 'success' : 'warning')

    // 诊断问题
    const diag = await DBDebugger.diagnoseProblem()
    diagnosis.value = diag
    addLog(`诊断结果: ${getStatusText(diag.status)}`, diag.status === 'healthy' ? 'success' : 'warning')

    // 获取统计
    const statistics = await DBDebugger.getStats()
    stats.value = statistics
    addLog(`数据统计: ${statistics.messageCount}条消息, ${statistics.sessionCount}个会话`, 'info')

  } catch (error) {
    addLog(`检查失败: ${error}`, 'error')
  } finally {
    loading.value = false
  }
}

const autoFix = async () => {
  loading.value = true
  addLog('开始自动修复数据库...', 'info')
  
  try {
    const result = await DBDebugger.autoFix()
    
    if (result.success) {
      addLog('数据库修复成功', 'success')
      result.actions.forEach(action => addLog(action, 'info'))
      
      // 重新检查状态
      await refreshStatus()
    } else {
      addLog(`修复失败: ${result.error}`, 'error')
      result.actions.forEach(action => addLog(action, 'warning'))
    }
  } catch (error) {
    addLog(`修复异常: ${error}`, 'error')
  } finally {
    loading.value = false
  }
}

const clearData = async () => {
  if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    return
  }
  
  loading.value = true
  addLog('开始清空数据库...', 'warning')
  
  try {
    const result = await DBDebugger.cleanup()
    
    if (result.success) {
      addLog('数据清空成功', 'success')
      await refreshStatus()
    } else {
      addLog(`清空失败: ${result.message}`, 'error')
    }
  } catch (error) {
    addLog(`清空异常: ${error}`, 'error')
  } finally {
    loading.value = false
  }
}

const exportReport = async () => {
  try {
    const report = await DBDebugger.generateReport()
    
    // 创建下载链接
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `yeyu-db-report-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    addLog('诊断报告已导出', 'success')
  } catch (error) {
    addLog(`导出失败: ${error}`, 'error')
  }
}

// 生命周期
onMounted(() => {
  refreshStatus()
})
</script>

<style scoped>
.database-debug-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.debug-header {
  text-align: center;
  margin-bottom: 30px;
}

.debug-header h2 {
  color: #333;
  margin-bottom: 8px;
}

.debug-header p {
  color: #666;
  margin: 0;
}

.debug-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.debug-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.debug-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: 600;
}

.value.success {
  color: #28a745;
}

.value.error {
  color: #dc3545;
}

.diagnosis-result {
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid;
}

.diagnosis-result.healthy {
  background: #d4edda;
  border-color: #28a745;
}

.diagnosis-result.corrupted {
  background: #f8d7da;
  border-color: #dc3545;
}

.diagnosis-result.missing {
  background: #fff3cd;
  border-color: #ffc107;
}

.diagnosis-result.version_mismatch {
  background: #d1ecf1;
  border-color: #17a2b8;
}

.status-badge {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
}

.issues, .recommendations {
  margin-top: 12px;
}

.issues h4, .recommendations h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.issues ul, .recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-item .number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 4px;
}

.stat-item .label {
  font-size: 14px;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f3f4;
  font-size: 14px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.info {
  background: #f8f9fa;
}

.log-item.success {
  background: #d4edda;
}

.log-item.warning {
  background: #fff3cd;
}

.log-item.error {
  background: #f8d7da;
}

.timestamp {
  color: #666;
  font-family: monospace;
  white-space: nowrap;
}

.message {
  flex: 1;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 8px;
}
</style>
