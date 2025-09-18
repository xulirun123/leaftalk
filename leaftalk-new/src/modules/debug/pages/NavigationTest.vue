<template>
  <div class="navigation-test">
    <div class="header">
      <h2>🧭 导航测试页面</h2>
    </div>
    
    <div class="content">
      <div class="section">
        <h3>当前路由信息</h3>
        <div class="info-card">
          <p><strong>当前路径:</strong> {{ route.path }}</p>
          <p><strong>路由名称:</strong> {{ route.name }}</p>
          <p><strong>查询参数:</strong> {{ JSON.stringify(route.query) }}</p>
          <p><strong>路由参数:</strong> {{ JSON.stringify(route.params) }}</p>
        </div>
      </div>

      <div class="section">
        <h3>导航测试</h3>
        <div class="button-grid">
          <button @click="testNavigation('/contacts')" class="test-btn">
            测试导航到通讯录
          </button>
          <button @click="testNavigation('/')" class="test-btn">
            测试导航到首页
          </button>
          <button @click="testNavigation('/discover')" class="test-btn">
            测试导航到发现
          </button>
          <button @click="testNavigation('/profile')" class="test-btn">
            测试导航到我的
          </button>
        </div>
      </div>

      <div class="section">
        <h3>路由历史</h3>
        <div class="history-list">
          <div v-for="(entry, index) in navigationHistory" :key="index" class="history-item">
            <span class="timestamp">{{ entry.timestamp }}</span>
            <span class="action">{{ entry.action }}</span>
            <span class="path">{{ entry.path }}</span>
            <span class="status" :class="entry.success ? 'success' : 'error'">
              {{ entry.success ? '成功' : '失败' }}
            </span>
          </div>
        </div>
        <button @click="clearHistory" class="clear-btn">清除历史</button>
      </div>

      <div class="section">
        <h3>底部导航栏测试</h3>
        <div class="tab-test">
          <div class="mock-tab-bar">
            <div
              v-for="tab in tabs"
              :key="tab.key"
              class="mock-tab"
              :class="{ active: currentTab === tab.key }"
              @click="testTabChange(tab.key)"
            >
              <span>{{ tab.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>路由守卫日志</h3>
        <div class="log-container">
          <div v-for="(log, index) in routerLogs" :key="index" class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
        <button @click="clearLogs" class="clear-btn">清除日志</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const currentTab = ref('chats')
const navigationHistory = ref<any[]>([])
const routerLogs = ref<any[]>([])

const tabs = [
  { key: 'chats', label: '叶语', path: '/' },
  { key: 'contacts', label: '通讯录', path: '/contacts' },
  { key: 'discover', label: '发现', path: '/discover' },
  { key: 'profile', label: '我', path: '/profile' }
]

// 添加导航历史记录
const addNavigationHistory = (action: string, path: string, success: boolean) => {
  navigationHistory.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    action,
    path,
    success
  })
  
  // 只保留最近20条记录
  if (navigationHistory.value.length > 20) {
    navigationHistory.value = navigationHistory.value.slice(0, 20)
  }
}

// 添加路由日志
const addRouterLog = (message: string) => {
  routerLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  
  // 只保留最近50条日志
  if (routerLogs.value.length > 50) {
    routerLogs.value = routerLogs.value.slice(0, 50)
  }
}

// 测试导航
const testNavigation = async (path: string) => {
  try {
    addRouterLog(`开始导航到: ${path}`)
    console.log('🧭 测试导航到:', path)
    
    const startTime = Date.now()
    await router.push(path)
    const endTime = Date.now()
    
    addNavigationHistory('router.push', path, true)
    addRouterLog(`导航成功，耗时: ${endTime - startTime}ms`)
    console.log('✅ 导航成功')
  } catch (error) {
    addNavigationHistory('router.push', path, false)
    addRouterLog(`导航失败: ${error.message}`)
    console.error('❌ 导航失败:', error)
  }
}

// 测试标签切换
const testTabChange = async (tabKey: string) => {
  try {
    addRouterLog(`标签切换: ${tabKey}`)
    console.log('🧭 测试标签切换:', tabKey)
    
    const tab = tabs.find(t => t.key === tabKey)
    if (tab) {
      currentTab.value = tabKey
      await testNavigation(tab.path)
    }
  } catch (error) {
    addRouterLog(`标签切换失败: ${error.message}`)
    console.error('❌ 标签切换失败:', error)
  }
}

// 清除历史
const clearHistory = () => {
  navigationHistory.value = []
}

// 清除日志
const clearLogs = () => {
  routerLogs.value = []
}

// 监听路由变化
router.beforeEach((to, from, next) => {
  addRouterLog(`路由守卫: ${from.path} -> ${to.path}`)
  next()
})

router.afterEach((to, from) => {
  addRouterLog(`路由完成: ${from.path} -> ${to.path}`)
})

onMounted(() => {
  addRouterLog('导航测试页面已加载')
  console.log('🧭 导航测试页面已加载')
  
  // 根据当前路径设置活动标签
  const currentPath = route.path
  const activeTab = tabs.find(tab => tab.path === currentPath)
  if (activeTab) {
    currentTab.value = activeTab.key
  }
})
</script>

<style scoped>
.navigation-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.section h3 {
  margin-top: 0;
  color: #333;
}

.info-card {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-top: 10px;
}

.info-card p {
  margin: 8px 0;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.test-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.test-btn:hover {
  background: #06a552;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 15px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.timestamp {
  color: #666;
  font-size: 12px;
}

.action {
  font-weight: bold;
}

.path {
  color: #1989fa;
}

.status.success {
  color: #07C160;
}

.status.error {
  color: #ff4444;
}

.clear-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 10px;
}

.mock-tab-bar {
  display: flex;
  background: #f8f8f8;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 15px;
}

.mock-tab {
  flex: 1;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  background: #f8f8f8;
  border-right: 1px solid #ddd;
}

.mock-tab:last-child {
  border-right: none;
}

.mock-tab.active {
  background: #07C160;
  color: white;
}

.mock-tab:hover {
  background: #e8e8e8;
}

.mock-tab.active:hover {
  background: #06a552;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 10px;
  margin-top: 15px;
}

.log-item {
  display: flex;
  margin-bottom: 5px;
  font-size: 12px;
  font-family: monospace;
}

.log-time {
  color: #666;
  margin-right: 10px;
  min-width: 80px;
}

.log-message {
  color: #333;
}
</style>
