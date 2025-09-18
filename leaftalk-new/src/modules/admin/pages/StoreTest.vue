<template>
  <div class="store-test">
    <div class="header">
      <h1>Store 测试页面</h1>
      <p>测试 Pinia Store 的功能</p>
    </div>

    <div class="test-sections">
      <!-- Auth Store 测试 -->
      <div class="test-section">
        <h2>Auth Store 测试</h2>
        <div class="test-content">
          <div class="info-item">
            <strong>登录状态:</strong> {{ authStore.isAuthenticated ? '已登录' : '未登录' }}
          </div>
          <div class="info-item">
            <strong>用户信息:</strong> {{ authStore.user ? authStore.user.name : '无' }}
          </div>
          <div class="info-item">
            <strong>Token:</strong> {{ authStore.token ? '已设置' : '未设置' }}
          </div>
          <div class="test-actions">
            <button @click="testLogin" class="test-btn">测试登录</button>
            <button @click="testLogout" class="test-btn">测试登出</button>
          </div>
        </div>
      </div>

      <!-- App Store 测试 -->
      <div class="test-section">
        <h2>App Store 测试</h2>
        <div class="test-content">
          <div class="info-item">
            <strong>应用状态:</strong> {{ appStore.isLoading ? '加载中' : '空闲' }}
          </div>
          <div class="info-item">
            <strong>网络状态:</strong> {{ appStore.isOnline ? '在线' : '离线' }}
          </div>
          <div class="test-actions">
            <button @click="testToast" class="test-btn">测试 Toast</button>
            <button @click="testLoading" class="test-btn">测试加载状态</button>
          </div>
        </div>
      </div>

      <!-- Chat Store 测试 -->
      <div class="test-section">
        <h2>Chat Store 测试</h2>
        <div class="test-content">
          <div class="info-item">
            <strong>聊天列表数量:</strong> {{ chatStore.chats.length }}
          </div>
          <div class="info-item">
            <strong>当前聊天:</strong> {{ chatStore.currentChat?.name || '无' }}
          </div>
          <div class="test-actions">
            <button @click="testAddChat" class="test-btn">添加测试聊天</button>
            <button @click="testSendMessage" class="test-btn">发送测试消息</button>
          </div>
        </div>
      </div>

      <!-- 存储持久化测试 -->
      <div class="test-section">
        <h2>存储持久化测试</h2>
        <div class="test-content">
          <div class="info-item">
            <strong>LocalStorage 数据:</strong>
          </div>
          <div class="storage-data">
            <pre>{{ localStorageData }}</pre>
          </div>
          <div class="test-actions">
            <button @click="refreshStorageData" class="test-btn">刷新存储数据</button>
            <button @click="clearAllStorage" class="test-btn danger">清空所有存储</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import { useChatStore } from '../chat/stores/chatStore'

const authStore = useAuthStore()
const appStore = useAppStore()
const chatStore = useChatStore()

const localStorageData = ref('')

// Auth Store 测试方法
const testLogin = async () => {
  try {
    const result = await authStore.login('testuser1', '123456')
    if (result.success) {
      appStore.showToast('登录测试成功', 'success')
    } else {
      appStore.showToast('登录测试失败', 'error')
    }
  } catch (error) {
    appStore.showToast('登录测试出错', 'error')
  }
}

const testLogout = () => {
  authStore.logout()
  appStore.showToast('已登出', 'info')
}

// App Store 测试方法
const testToast = () => {
  const messages = [
    { text: '这是一个成功消息', type: 'success' },
    { text: '这是一个错误消息', type: 'error' },
    { text: '这是一个警告消息', type: 'warning' },
    { text: '这是一个信息消息', type: 'info' }
  ]
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]
  appStore.showToast(randomMessage.text, randomMessage.type as any)
}

const testLoading = async () => {
  appStore.setLoading(true)
  appStore.showToast('开始加载...', 'info')
  
  setTimeout(() => {
    appStore.setLoading(false)
    appStore.showToast('加载完成', 'success')
  }, 2000)
}

// Chat Store 测试方法
const testAddChat = () => {
  const testChat = {
    id: `test_${Date.now()}`,
    name: `测试聊天 ${new Date().toLocaleTimeString()}`,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    lastMessage: '这是一条测试消息',
    lastMessageTime: new Date(),
    unreadCount: Math.floor(Math.random() * 10),
    type: 'private' as const
  }
  
  chatStore.addChat(testChat)
  appStore.showToast('添加测试聊天成功', 'success')
}

const testSendMessage = () => {
  if (chatStore.chats.length === 0) {
    appStore.showToast('请先添加聊天', 'warning')
    return
  }
  
  const firstChat = chatStore.chats[0]
  const testMessage = {
    id: `msg_${Date.now()}`,
    chatId: firstChat.id,
    senderId: 'test_user',
    senderName: '测试用户',
    content: `测试消息 ${new Date().toLocaleTimeString()}`,
    type: 'text' as const,
    timestamp: new Date(),
    status: 'sent' as const
  }
  
  chatStore.addMessage(testMessage)
  appStore.showToast('发送测试消息成功', 'success')
}

// 存储相关方法
const refreshStorageData = () => {
  const storage: Record<string, any> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      try {
        const value = localStorage.getItem(key)
        storage[key] = value ? JSON.parse(value) : value
      } catch {
        storage[key] = localStorage.getItem(key)
      }
    }
  }
  localStorageData.value = JSON.stringify(storage, null, 2)
}

const clearAllStorage = () => {
  if (confirm('确定要清空所有存储数据吗？这将清除登录状态和所有本地数据。')) {
    localStorage.clear()
    
    // 重置所有 store
    authStore.$reset()
    appStore.$reset()
    chatStore.$reset()
    
    refreshStorageData()
    appStore.showToast('所有存储数据已清空', 'success')
  }
}

onMounted(() => {
  refreshStorageData()
  console.log('Store 测试页面已加载')
})
</script>

<style scoped>
.store-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
}

.header p {
  color: #666;
}

.test-sections {
  display: grid;
  gap: 20px;
}

.test-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-section h2 {
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #07C160;
  padding-bottom: 5px;
}

.test-content {
  display: grid;
  gap: 15px;
}

.info-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #07C160;
}

.info-item strong {
  color: #333;
  margin-right: 10px;
}

.test-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.test-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #07C160;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

.test-btn:hover {
  background: #06a552;
}

.test-btn.danger {
  background: #ff4757;
}

.test-btn.danger:hover {
  background: #ff3838;
}

.storage-data {
  max-height: 300px;
  overflow-y: auto;
}

.storage-data pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
