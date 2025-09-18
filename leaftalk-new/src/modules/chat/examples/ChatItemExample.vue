<template>
  <div class="chat-item-example">
    <h2>聊天项自动创建示例</h2>
    
    <!-- 当前聊天列表 -->
    <div class="chat-list-section">
      <h3>当前聊天列表 ({{ chatStore.sessions.length }})</h3>
      <div class="chat-items">
        <div 
          v-for="session in chatStore.sessions" 
          :key="session.id"
          class="chat-item-preview"
        >
          <div class="avatar">
            <img :src="session.avatar || '/default-avatar.png'" :alt="session.name" />
          </div>
          <div class="info">
            <div class="name">{{ session.name }}</div>
            <div class="last-message">{{ getLastMessageText(session.lastMessage) }}</div>
            <div class="meta">
              <span class="time">{{ formatTime(session.updatedAt) }}</span>
              <span v-if="session.unreadCount > 0" class="unread">{{ session.unreadCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试按钮 -->
    <div class="test-section">
      <h3>测试功能</h3>
      
      <div class="test-group">
        <h4>发送消息测试</h4>
        <input v-model="testMessage" placeholder="输入测试消息" />
        <select v-model="selectedReceiver">
          <option value="">选择接收者</option>
          <option v-for="user in testUsers" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
        <button @click="testSendMessage" :disabled="!testMessage || !selectedReceiver">
          发送消息
        </button>
      </div>

      <div class="test-group">
        <h4>接收消息测试</h4>
        <input v-model="receiveMessage" placeholder="输入接收的消息" />
        <select v-model="selectedSender">
          <option value="">选择发送者</option>
          <option v-for="user in testUsers" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
        <button @click="testReceiveMessage" :disabled="!receiveMessage || !selectedSender">
          接收消息
        </button>
      </div>

      <div class="test-group">
        <h4>快速测试</h4>
        <button @click="quickTest">一键测试对话</button>
        <button @click="clearAllChats">清空所有聊天</button>
      </div>
    </div>

    <!-- 日志 -->
    <div class="log-section">
      <h3>操作日志</h3>
      <div class="logs">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <span class="time">{{ log.time }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore } from '../stores/chatStore'
import { useChatItemManager } from '../composables/useChatItemManager'

const chatStore = useChatStore()
const { sendTextMessage, simulateReceiveMessage } = useChatItemManager()

// 测试数据
const testMessage = ref('')
const receiveMessage = ref('')
const selectedReceiver = ref('')
const selectedSender = ref('')
const logs = ref<Array<{ time: string, message: string }>>([])

const currentUserId = 'current_user'

const testUsers = [
  { id: 'user_001', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan' },
  { id: 'user_002', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi' },
  { id: 'user_003', name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu' },
  { id: 'user_004', name: '赵六', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu' }
]

// 添加日志
const addLog = (message: string) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

// 测试发送消息
const testSendMessage = async () => {
  if (!testMessage.value || !selectedReceiver.value) return
  
  const receiverInfo = testUsers.find(u => u.id === selectedReceiver.value)
  if (!receiverInfo) return

  try {
    await sendTextMessage(
      testMessage.value,
      selectedReceiver.value,
      currentUserId,
      receiverInfo
    )
    
    addLog(`发送消息给 ${receiverInfo.name}: ${testMessage.value}`)
    testMessage.value = ''
  } catch (error) {
    addLog(`发送消息失败: ${error}`)
  }
}

// 测试接收消息
const testReceiveMessage = async () => {
  if (!receiveMessage.value || !selectedSender.value) return
  
  const senderInfo = testUsers.find(u => u.id === selectedSender.value)
  if (!senderInfo) return

  try {
    await simulateReceiveMessage(
      receiveMessage.value,
      selectedSender.value,
      currentUserId,
      senderInfo
    )
    
    addLog(`接收到 ${senderInfo.name} 的消息: ${receiveMessage.value}`)
    receiveMessage.value = ''
  } catch (error) {
    addLog(`接收消息失败: ${error}`)
  }
}

// 快速测试
const quickTest = async () => {
  addLog('开始快速测试...')
  
  // 发送消息给张三
  await sendTextMessage('你好张三！', 'user_001', currentUserId, testUsers[0])
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 张三回复
  await simulateReceiveMessage('你好！很高兴认识你', 'user_001', currentUserId, testUsers[0])
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 发送消息给李四
  await sendTextMessage('李四，在吗？', 'user_002', currentUserId, testUsers[1])
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 李四回复
  await simulateReceiveMessage('在的，有什么事吗？', 'user_002', currentUserId, testUsers[1])
  
  addLog('快速测试完成！')
}

// 清空所有聊天
const clearAllChats = () => {
  chatStore.sessions.splice(0, chatStore.sessions.length)
  chatStore.messages.clear()
  addLog('已清空所有聊天')
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 获取最后消息文本
const getLastMessageText = (lastMessage: any) => {
  if (typeof lastMessage === 'string') return lastMessage
  if (lastMessage && lastMessage.content) return lastMessage.content
  return '暂无消息'
}

onMounted(() => {
  addLog('聊天项管理示例已加载')
})
</script>

<style scoped>
.chat-item-example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.chat-list-section {
  margin-bottom: 30px;
}

.chat-items {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.chat-item-preview {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.chat-item-preview:last-child {
  border-bottom: none;
}

.avatar img {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  margin-right: 12px;
}

.info {
  flex: 1;
}

.name {
  font-weight: 500;
  margin-bottom: 4px;
}

.last-message {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  color: #999;
  font-size: 12px;
}

.unread {
  background: #ff4757;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.test-section {
  margin-bottom: 30px;
}

.test-group {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.test-group h4 {
  margin: 0 0 10px 0;
}

.test-group input,
.test-group select {
  margin-right: 10px;
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.test-group button {
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.log-section {
  margin-top: 30px;
}

.logs {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: #f9f9f9;
}

.log-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-family: monospace;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item .time {
  color: #666;
  margin-right: 10px;
}
</style>
