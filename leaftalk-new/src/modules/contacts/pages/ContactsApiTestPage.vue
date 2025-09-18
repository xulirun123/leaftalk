<template>
  <div class="contacts-api-test-page">
    <div class="test-header">
      <h2>联系人API测试</h2>
      <p>测试联系人API连接和数据获取</p>
    </div>

    <div class="test-sections">
      <!-- API测试结果 -->
      <div class="test-section">
        <h3>API测试结果</h3>
        <div class="test-results">
          <div class="result-item" :class="testResults.apiConnection.success ? 'success' : 'error'">
            <span class="label">API连接:</span>
            <span class="status">{{ testResults.apiConnection.success ? '✅ 成功' : '❌ 失败' }}</span>
            <div v-if="testResults.apiConnection.error" class="error-detail">
              {{ testResults.apiConnection.error }}
            </div>
          </div>
          
          <div class="result-item" :class="testResults.contactsApi.success ? 'success' : 'error'">
            <span class="label">联系人API:</span>
            <span class="status">{{ testResults.contactsApi.success ? '✅ 成功' : '❌ 失败' }}</span>
            <div v-if="testResults.contactsApi.error" class="error-detail">
              {{ testResults.contactsApi.error }}
            </div>
          </div>

          <div class="result-item" :class="testResults.dataFormat.success ? 'success' : 'error'">
            <span class="label">数据格式:</span>
            <span class="status">{{ testResults.dataFormat.success ? '✅ 正确' : '❌ 错误' }}</span>
            <div v-if="testResults.dataFormat.error" class="error-detail">
              {{ testResults.dataFormat.error }}
            </div>
          </div>
        </div>
      </div>

      <!-- 联系人数据 -->
      <div class="test-section">
        <h3>联系人数据 ({{ contactsData.length }}个)</h3>
        <div v-if="contactsData.length > 0" class="contacts-list">
          <div v-for="contact in contactsData" :key="contact.id" class="contact-item">
            <img :src="contact.avatar" :alt="contact.nickname" class="contact-avatar">
            <div class="contact-info">
              <div class="contact-name">{{ contact.nickname }}</div>
              <div class="contact-details">
                <span>叶语号: {{ contact.yeyu_id }}</span>
                <span v-if="contact.phone">手机: {{ contact.phone }}</span>
              </div>
              <div v-if="contact.remark_name" class="contact-remark">
                备注: {{ contact.remark_name }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          暂无联系人数据
        </div>
      </div>

      <!-- 原始响应数据 -->
      <div class="test-section">
        <h3>原始响应数据</h3>
        <pre class="raw-data">{{ JSON.stringify(rawResponse, null, 2) }}</pre>
      </div>

      <!-- 操作按钮 -->
      <div class="test-section">
        <h3>操作</h3>
        <div class="action-buttons">
          <button @click="testContactsApi" :disabled="testing" class="btn-primary">
            {{ testing ? '测试中...' : '测试联系人API' }}
          </button>
          <button @click="testHealthCheck" :disabled="testing" class="btn-secondary">
            测试健康检查
          </button>
          <button @click="clearResults" class="btn-danger">
            清除结果
          </button>
        </div>
      </div>

      <!-- 测试日志 -->
      <div v-if="logs.length > 0" class="test-section">
        <h3>测试日志</h3>
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
import { contactsApi } from '../services/contactsApi'

// 响应式数据
const testing = ref(false)
const contactsData = ref<any[]>([])
const rawResponse = ref<any>(null)

const testResults = ref({
  apiConnection: { success: false, error: '' },
  contactsApi: { success: false, error: '' },
  dataFormat: { success: false, error: '' }
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
  
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}

const testHealthCheck = async () => {
  testing.value = true
  addLog('开始健康检查测试...', 'info')
  
  try {
    const response = await fetch('http://localhost:8893/health')
    const data = await response.json()
    
    if (response.ok) {
      testResults.value.apiConnection.success = true
      testResults.value.apiConnection.error = ''
      addLog('健康检查成功', 'success')
      addLog(`服务器状态: ${data.status}`, 'info')
    } else {
      testResults.value.apiConnection.success = false
      testResults.value.apiConnection.error = `HTTP ${response.status}`
      addLog(`健康检查失败: HTTP ${response.status}`, 'error')
    }
  } catch (error) {
    testResults.value.apiConnection.success = false
    testResults.value.apiConnection.error = String(error)
    addLog(`健康检查异常: ${error}`, 'error')
  } finally {
    testing.value = false
  }
}

const testContactsApi = async () => {
  testing.value = true
  addLog('开始联系人API测试...', 'info')
  
  try {
    // 重置结果
    testResults.value = {
      apiConnection: { success: false, error: '' },
      contactsApi: { success: false, error: '' },
      dataFormat: { success: false, error: '' }
    }
    contactsData.value = []
    rawResponse.value = null

    // 测试API调用
    addLog('调用联系人API...', 'info')
    const response = await contactsApi.getContacts()
    
    rawResponse.value = response
    addLog('API调用完成', 'info')

    // 检查响应格式
    if (response && typeof response === 'object') {
      testResults.value.apiConnection.success = true
      addLog('API连接成功', 'success')

      if (response.success) {
        testResults.value.contactsApi.success = true
        addLog('联系人API调用成功', 'success')

        // 检查数据格式
        if (Array.isArray(response.data)) {
          testResults.value.dataFormat.success = true
          contactsData.value = response.data
          addLog(`获取到 ${response.data.length} 个联系人`, 'success')
          
          // 验证数据结构
          if (response.data.length > 0) {
            const firstContact = response.data[0]
            const requiredFields = ['id', 'nickname', 'yeyu_id']
            const missingFields = requiredFields.filter(field => !firstContact[field])
            
            if (missingFields.length === 0) {
              addLog('联系人数据结构验证通过', 'success')
            } else {
              addLog(`联系人数据缺少字段: ${missingFields.join(', ')}`, 'warning')
            }
          }
        } else {
          testResults.value.dataFormat.success = false
          testResults.value.dataFormat.error = '数据不是数组格式'
          addLog('数据格式错误: 期望数组格式', 'error')
        }
      } else {
        testResults.value.contactsApi.success = false
        testResults.value.contactsApi.error = response.message || '未知错误'
        addLog(`联系人API调用失败: ${response.message || '未知错误'}`, 'error')
      }
    } else {
      testResults.value.apiConnection.success = false
      testResults.value.apiConnection.error = '响应格式无效'
      addLog('API响应格式无效', 'error')
    }

  } catch (error) {
    testResults.value.apiConnection.success = false
    testResults.value.apiConnection.error = String(error)
    addLog(`联系人API测试异常: ${error}`, 'error')
    
    // 详细错误信息
    if (error instanceof Error) {
      addLog(`错误详情: ${error.message}`, 'error')
      if (error.stack) {
        console.error('错误堆栈:', error.stack)
      }
    }
  } finally {
    testing.value = false
    addLog('联系人API测试完成', 'info')
  }
}

const clearResults = () => {
  testResults.value = {
    apiConnection: { success: false, error: '' },
    contactsApi: { success: false, error: '' },
    dataFormat: { success: false, error: '' }
  }
  contactsData.value = []
  rawResponse.value = null
  logs.value = []
  addLog('测试结果已清除', 'info')
}

// 生命周期
onMounted(() => {
  addLog('联系人API测试页面已加载', 'info')
})
</script>

<style scoped>
.contacts-api-test-page {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
}

.test-header h2 {
  color: #333;
  margin-bottom: 8px;
}

.test-header p {
  color: #666;
  margin: 0;
}

.test-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
}

.result-item.success {
  background: #d4edda;
  border-color: #28a745;
}

.result-item.error {
  background: #f8d7da;
  border-color: #dc3545;
}

.label {
  font-weight: 500;
  min-width: 100px;
}

.status {
  font-weight: 600;
}

.error-detail {
  flex: 1;
  font-size: 12px;
  color: #721c24;
  margin-left: auto;
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.contact-details {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 12px;
}

.contact-remark {
  font-size: 12px;
  color: #007bff;
  margin-top: 4px;
}

.no-data {
  text-align: center;
  color: #666;
  padding: 20px;
}

.raw-data {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logs {
  max-height: 400px;
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
  min-width: 80px;
}

.message {
  flex: 1;
}
</style>
