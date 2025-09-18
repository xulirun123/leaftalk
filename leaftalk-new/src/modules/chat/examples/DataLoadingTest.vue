<template>
  <div class="data-loading-test">
    <h2>聊天数据加载测试</h2>
    
    <!-- 问题描述 -->
    <div class="problem-section">
      <h3>问题描述</h3>
      <p>刷新页面后聊天列表显示不正常，但切换页面后又正常了。</p>
      <p>这通常是数据加载时机或响应式更新的问题。</p>
    </div>

    <!-- 数据状态监控 -->
    <div class="status-section">
      <h3>数据状态监控</h3>
      <div class="status-grid">
        <div class="status-item">
          <strong>认证状态:</strong>
          <span :class="authStatus.class">{{ authStatus.text }}</span>
        </div>
        <div class="status-item">
          <strong>聊天数据数量:</strong>
          <span>{{ chatStore.sessions.length }}</span>
        </div>
        <div class="status-item">
          <strong>数据加载状态:</strong>
          <span :class="loadingStatus.class">{{ loadingStatus.text }}</span>
        </div>
        <div class="status-item">
          <strong>缓存状态:</strong>
          <span :class="cacheStatus.class">{{ cacheStatus.text }}</span>
        </div>
      </div>
    </div>

    <!-- 聊天数据详情 -->
    <div class="data-section">
      <h3>聊天数据详情</h3>
      <div class="data-actions">
        <button @click="refreshData">刷新数据</button>
        <button @click="clearCache">清除缓存</button>
        <button @click="initTestData">初始化测试数据</button>
        <button @click="exportData">导出数据</button>
      </div>
      
      <div class="data-display">
        <h4>当前聊天列表 ({{ chatStore.sessions.length }} 项)</h4>
        <div v-if="chatStore.sessions.length === 0" class="empty-state">
          <p>没有聊天数据</p>
        </div>
        <div v-else class="chat-items">
          <div v-for="(session, index) in chatStore.sessions" :key="session.id" class="chat-item-debug">
            <div class="item-header">
              <strong>{{ index + 1 }}. {{ session.name || '未命名' }}</strong>
              <span class="item-id">ID: {{ session.id }}</span>
            </div>
            <div class="item-details">
              <div><strong>最后消息:</strong> {{ session.lastMessage || '无' }}</div>
              <div><strong>更新时间:</strong> {{ formatTimestamp(session.updatedAt || session.lastMessageTime) }}</div>
              <div><strong>未读数:</strong> {{ session.unreadCount || 0 }}</div>
              <div><strong>参与者:</strong> {{ session.participants ? session.participants.join(', ') : '无' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 缓存数据检查 -->
    <div class="cache-section">
      <h3>缓存数据检查</h3>
      <div class="cache-info">
        <div><strong>缓存键:</strong> yeyu_chat_sessions</div>
        <div><strong>缓存大小:</strong> {{ cacheSize }}</div>
        <div><strong>缓存时间:</strong> {{ cacheTime }}</div>
      </div>
      <div class="cache-content">
        <h4>缓存内容预览</h4>
        <pre>{{ cacheContent }}</pre>
      </div>
    </div>

    <!-- 操作日志 -->
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
import { ref, computed, onMounted, watch } from 'vue'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../../../stores/auth'

const chatStore = useChatStore()
const authStore = useAuthStore()

// 日志系统
const logs = ref<Array<{ time: string, level: string, message: string }>>([])

const addLog = (level: string, message: string) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    level,
    message
  })
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 状态计算
const authStatus = computed(() => {
  if (authStore.user) {
    return { text: '已登录', class: 'status-success' }
  } else {
    return { text: '未登录', class: 'status-error' }
  }
})

const loadingStatus = computed(() => {
  return { text: '正常', class: 'status-success' }
})

const cacheStatus = computed(() => {
  const cacheData = localStorage.getItem('yeyu_chat_sessions')
  if (cacheData) {
    return { text: '有缓存', class: 'status-success' }
  } else {
    return { text: '无缓存', class: 'status-warning' }
  }
})

const cacheSize = computed(() => {
  const cacheData = localStorage.getItem('yeyu_chat_sessions')
  if (cacheData) {
    return `${(cacheData.length / 1024).toFixed(2)} KB`
  }
  return '0 KB'
})

const cacheTime = computed(() => {
  try {
    const cacheData = localStorage.getItem('yeyu_chat_sessions')
    if (cacheData) {
      const parsed = JSON.parse(cacheData)
      if (parsed.timestamp) {
        return new Date(parsed.timestamp).toLocaleString()
      }
    }
  } catch (error) {
    return '解析失败'
  }
  return '无'
})

const cacheContent = computed(() => {
  try {
    const cacheData = localStorage.getItem('yeyu_chat_sessions')
    if (cacheData) {
      const parsed = JSON.parse(cacheData)
      return JSON.stringify(parsed, null, 2).substring(0, 500) + '...'
    }
  } catch (error) {
    return '缓存数据解析失败'
  }
  return '无缓存数据'
})

// 操作方法
const refreshData = () => {
  addLog('INFO', '手动刷新数据')
  if (typeof chatStore.loadFromCache === 'function') {
    chatStore.loadFromCache()
  }
}

const clearCache = () => {
  addLog('INFO', '清除缓存')
  localStorage.removeItem('yeyu_chat_sessions')
}

const initTestData = () => {
  addLog('INFO', '初始化测试数据')
  const testSessions = [
    {
      id: 'test_1_2',
      participants: ['1', '2'],
      name: '测试用户1',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test1',
      lastMessage: '这是测试消息',
      updatedAt: Date.now(),
      unreadCount: 1,
      type: 'private'
    },
    {
      id: 'test_1_3',
      participants: ['1', '3'],
      name: '测试用户2',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test2',
      lastMessage: '另一条测试消息',
      updatedAt: Date.now() - 1000 * 60 * 30,
      unreadCount: 0,
      type: 'private'
    }
  ]
  
  chatStore.sessions.splice(0, chatStore.sessions.length, ...testSessions)
  
  if (typeof chatStore.saveToCache === 'function') {
    chatStore.saveToCache()
  }
}

const exportData = () => {
  const data = {
    sessions: chatStore.sessions,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-data-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  addLog('INFO', '数据已导出')
}

const clearLogs = () => {
  logs.value = []
}

const formatTimestamp = (timestamp: number | undefined): string => {
  if (!timestamp) return '无'
  return new Date(timestamp).toLocaleString()
}

// 监听数据变化
watch(() => chatStore.sessions.length, (newLength, oldLength) => {
  addLog('INFO', `聊天数据数量变化: ${oldLength} -> ${newLength}`)
})

// 初始化
onMounted(() => {
  addLog('INFO', '数据加载测试页面已加载')
  addLog('INFO', `当前聊天数据数量: ${chatStore.sessions.length}`)
})
</script>

<style scoped>
.data-loading-test {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.problem-section,
.status-section,
.data-section,
.cache-section,
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

.data-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.data-actions button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.data-actions button:hover {
  background: #0056b3;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.chat-item-debug {
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-bottom: 10px;
  padding: 15px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-id {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.item-details div {
  margin: 5px 0;
  font-size: 14px;
}

.cache-info {
  margin-bottom: 15px;
}

.cache-info div {
  margin: 5px 0;
}

.cache-content pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.log-actions {
  margin-bottom: 15px;
}

.logs {
  max-height: 400px;
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
