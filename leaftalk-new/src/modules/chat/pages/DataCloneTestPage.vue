<template>
  <div class="data-clone-test-page">
    <div class="test-header">
      <h2>数据克隆测试</h2>
      <p>测试IndexedDB数据序列化问题</p>
    </div>

    <div class="test-sections">
      <!-- 测试结果 -->
      <div class="test-section">
        <h3>测试结果</h3>
        <div class="test-results">
          <div class="result-item" :class="testResults.sessionTest.success ? 'success' : 'error'">
            <span class="label">会话数据测试:</span>
            <span class="status">{{ testResults.sessionTest.success ? '✅ 通过' : '❌ 失败' }}</span>
            <div v-if="testResults.sessionTest.error" class="error-detail">
              {{ testResults.sessionTest.error }}
            </div>
          </div>
          
          <div class="result-item" :class="testResults.messageTest.success ? 'success' : 'error'">
            <span class="label">消息数据测试:</span>
            <span class="status">{{ testResults.messageTest.success ? '✅ 通过' : '❌ 失败' }}</span>
            <div v-if="testResults.messageTest.error" class="error-detail">
              {{ testResults.messageTest.error }}
            </div>
          </div>

          <div class="result-item" :class="testResults.persistenceTest.success ? 'success' : 'error'">
            <span class="label">持久化测试:</span>
            <span class="status">{{ testResults.persistenceTest.success ? '✅ 通过' : '❌ 失败' }}</span>
            <div v-if="testResults.persistenceTest.error" class="error-detail">
              {{ testResults.persistenceTest.error }}
            </div>
          </div>
        </div>
      </div>

      <!-- 测试数据 -->
      <div class="test-section">
        <h3>测试数据</h3>
        <div class="test-data">
          <h4>原始会话数据:</h4>
          <pre>{{ JSON.stringify(testSession, null, 2) }}</pre>
          
          <h4>清理后的会话数据:</h4>
          <pre>{{ JSON.stringify(cleanedSession, null, 2) }}</pre>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="test-section">
        <h3>操作</h3>
        <div class="action-buttons">
          <button @click="runTests" :disabled="testing" class="btn-primary">
            {{ testing ? '测试中...' : '运行测试' }}
          </button>
          <button @click="testRealData" :disabled="testing" class="btn-secondary">
            测试真实数据
          </button>
          <button @click="clearTestData" class="btn-danger">
            清除测试数据
          </button>
        </div>
      </div>

      <!-- 日志 -->
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
import { DataValidator } from '../utils/dataValidator'
import { messagePersistenceService } from '../services/messagePersistenceService'
import { useChatStore } from '../stores/chatStore'

// 响应式数据
const testing = ref(false)
const testResults = ref({
  sessionTest: { success: false, error: '' },
  messageTest: { success: false, error: '' },
  persistenceTest: { success: false, error: '' }
})

const testSession = ref<any>(null)
const cleanedSession = ref<any>(null)

const logs = ref<Array<{
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}>>([])

// 聊天Store
const chatStore = useChatStore()

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

const createTestSession = () => {
  return {
    id: 'test_session_1',
    participants: ['user1', 'user2'],
    name: '测试会话',
    avatar: 'https://example.com/avatar.jpg',
    lastMessage: {
      id: 'test_msg_1',
      sessionId: 'test_session_1',
      senderId: 'user1',
      receiverId: 'user2',
      content: '这是一条测试消息',
      type: 'text',
      timestamp: Date.now(),
      status: 'sent',
      isOwn: false,
      metadata: {
        platform: 'web',
        version: '1.0.0'
      }
    },
    lastMessageTime: Date.now(),
    unreadCount: 1,
    type: 'private',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

const runTests = async () => {
  testing.value = true
  addLog('开始运行数据克隆测试...', 'info')
  
  try {
    // 重置测试结果
    testResults.value = {
      sessionTest: { success: false, error: '' },
      messageTest: { success: false, error: '' },
      persistenceTest: { success: false, error: '' }
    }

    // 创建测试数据
    testSession.value = createTestSession()
    addLog('创建测试会话数据', 'info')

    // 测试会话数据验证
    try {
      const sessionValidation = DataValidator.validateSession(testSession.value)
      if (sessionValidation.isValid) {
        testResults.value.sessionTest.success = true
        cleanedSession.value = sessionValidation.sanitized
        addLog('会话数据验证通过', 'success')
      } else {
        testResults.value.sessionTest.error = sessionValidation.errors.join(', ')
        addLog(`会话数据验证失败: ${testResults.value.sessionTest.error}`, 'error')
      }
    } catch (error) {
      testResults.value.sessionTest.error = String(error)
      addLog(`会话数据验证异常: ${error}`, 'error')
    }

    // 测试消息数据验证
    try {
      const messageValidation = DataValidator.validateMessage(testSession.value.lastMessage)
      if (messageValidation.isValid) {
        testResults.value.messageTest.success = true
        addLog('消息数据验证通过', 'success')
      } else {
        testResults.value.messageTest.error = messageValidation.errors.join(', ')
        addLog(`消息数据验证失败: ${testResults.value.messageTest.error}`, 'error')
      }
    } catch (error) {
      testResults.value.messageTest.error = String(error)
      addLog(`消息数据验证异常: ${error}`, 'error')
    }

    // 测试持久化
    try {
      await messagePersistenceService.saveSession(cleanedSession.value || testSession.value)
      testResults.value.persistenceTest.success = true
      addLog('数据持久化测试通过', 'success')
    } catch (error) {
      testResults.value.persistenceTest.error = String(error)
      addLog(`数据持久化测试失败: ${error}`, 'error')
    }

  } catch (error) {
    addLog(`测试过程异常: ${error}`, 'error')
  } finally {
    testing.value = false
    addLog('测试完成', 'info')
  }
}

const testRealData = async () => {
  testing.value = true
  addLog('开始测试真实聊天数据...', 'info')
  
  try {
    const sessions = chatStore.sessions
    if (sessions.length === 0) {
      addLog('没有找到真实聊天数据', 'warning')
      return
    }

    addLog(`找到 ${sessions.length} 个会话，开始验证...`, 'info')

    let validCount = 0
    let invalidCount = 0

    for (const session of sessions) {
      try {
        const validation = DataValidator.validateSession(session)
        if (validation.isValid) {
          validCount++
          addLog(`会话 ${session.id} 验证通过`, 'success')
        } else {
          invalidCount++
          addLog(`会话 ${session.id} 验证失败: ${validation.errors.join(', ')}`, 'error')
        }
      } catch (error) {
        invalidCount++
        addLog(`会话 ${session.id} 验证异常: ${error}`, 'error')
      }
    }

    addLog(`真实数据验证完成: ${validCount} 个有效, ${invalidCount} 个无效`, 'info')

  } catch (error) {
    addLog(`真实数据测试异常: ${error}`, 'error')
  } finally {
    testing.value = false
  }
}

const clearTestData = async () => {
  try {
    await messagePersistenceService.clearAllData()
    addLog('测试数据已清除', 'success')
  } catch (error) {
    addLog(`清除测试数据失败: ${error}`, 'error')
  }
}

// 生命周期
onMounted(() => {
  addLog('数据克隆测试页面已加载', 'info')
})
</script>

<style scoped>
.data-clone-test-page {
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
  min-width: 120px;
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

.test-data pre {
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
