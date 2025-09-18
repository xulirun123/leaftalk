<template>
  <div class="chat-page-example">
    <div class="header">
      <h2>聊天页面示例</h2>
      <p>发送消息后会自动在聊天列表中创建聊天项</p>
    </div>

    <!-- 聊天输入区域 -->
    <div class="chat-input-section">
      <h3>发送消息</h3>
      <div class="input-group">
        <label>接收者ID:</label>
        <input v-model="receiverId" placeholder="输入接收者ID" />
      </div>
      <div class="input-group">
        <label>接收者姓名:</label>
        <input v-model="receiverName" placeholder="输入接收者姓名" />
      </div>
      <div class="input-group">
        <label>消息内容:</label>
        <textarea v-model="messageContent" placeholder="输入消息内容"></textarea>
      </div>
      <button @click="sendTestMessage" :disabled="!canSend">
        发送消息
      </button>
    </div>

    <!-- 快速测试按钮 -->
    <div class="quick-test-section">
      <h3>快速测试</h3>
      <div class="test-buttons">
        <button @click="sendToZhangSan">发送给张三</button>
        <button @click="sendToLiSi">发送给李四</button>
        <button @click="sendToWangWu">发送给王五</button>
      </div>
    </div>

    <!-- 当前聊天列表预览 -->
    <div class="chat-list-preview">
      <h3>当前聊天列表 ({{ chatStore.sessions.length }})</h3>
      <div class="sessions">
        <div 
          v-for="session in sortedSessions" 
          :key="session.id"
          class="session-item"
          @click="openChat(session)"
        >
          <div class="avatar">
            <img :src="session.avatar || defaultAvatar" :alt="session.name" />
          </div>
          <div class="info">
            <div class="name">{{ session.name }}</div>
            <div class="last-message">{{ getLastMessageText(session.lastMessage) }}</div>
            <div class="time">{{ formatTime(session.updatedAt) }}</div>
          </div>
          <div v-if="session.unreadCount > 0" class="unread-count">
            {{ session.unreadCount }}
          </div>
        </div>
      </div>
    </div>

    <!-- 消息发送器组件 -->
    <MessageSender
      :receiver-id="receiverId"
      :receiver-name="receiverName"
      :receiver-avatar="receiverAvatar"
      @message-sent="onMessageSent"
      @chat-created="onChatCreated"
    />

    <!-- 操作日志 -->
    <div class="logs">
      <h3>操作日志</h3>
      <div class="log-list">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <span class="time">{{ log.time }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '../stores/chatStore'
import MessageSender from '../components/MessageSender.vue'

const chatStore = useChatStore()

// 表单数据
const receiverId = ref('')
const receiverName = ref('')
const receiverAvatar = ref('')
const messageContent = ref('')

// 日志
const logs = ref<Array<{ time: string, message: string }>>([])

// 默认头像
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

// 计算属性
const canSend = computed(() => {
  return receiverId.value.trim() && receiverName.value.trim() && messageContent.value.trim()
})

const sortedSessions = computed(() => {
  return [...chatStore.sessions].sort((a, b) => b.updatedAt - a.updatedAt)
})

// 添加日志
const addLog = (message: string) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  if (logs.value.length > 10) {
    logs.value = logs.value.slice(0, 10)
  }
}

// 发送测试消息
const sendTestMessage = async () => {
  if (!canSend.value) return

  try {
    // 使用 MessageSender 组件的方法
    const messageSender = document.querySelector('message-sender')
    if (messageSender) {
      await messageSender.sendMessage({
        type: 'text',
        content: messageContent.value
      })
    }
    
    addLog(`发送消息给 ${receiverName.value}: ${messageContent.value}`)
    messageContent.value = ''
  } catch (error) {
    addLog(`发送失败: ${error}`)
  }
}

// 快速测试方法
const sendToZhangSan = () => {
  receiverId.value = 'user_001'
  receiverName.value = '张三'
  receiverAvatar.value = 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'
  messageContent.value = '你好张三！'
  sendTestMessage()
}

const sendToLiSi = () => {
  receiverId.value = 'user_002'
  receiverName.value = '李四'
  receiverAvatar.value = 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi'
  messageContent.value = '李四，在吗？'
  sendTestMessage()
}

const sendToWangWu = () => {
  receiverId.value = 'user_003'
  receiverName.value = '王五'
  receiverAvatar.value = 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu'
  messageContent.value = '王五，周末一起吃饭吧！'
  sendTestMessage()
}

// 事件处理
const onMessageSent = (message: any) => {
  addLog(`消息已发送: ${message.content}`)
}

const onChatCreated = (chatId: string) => {
  addLog(`新聊天已创建: ${chatId}`)
}

// 打开聊天
const openChat = (session: any) => {
  addLog(`打开聊天: ${session.name}`)
  // 这里可以跳转到具体的聊天页面
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return new Date(timestamp).toLocaleDateString()
}

// 获取最后消息文本
const getLastMessageText = (lastMessage: any) => {
  if (typeof lastMessage === 'string') return lastMessage
  if (lastMessage && lastMessage.content) return lastMessage.content
  return '暂无消息'
}
</script>

<style scoped>
.chat-page-example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.chat-input-section,
.quick-test-section,
.chat-list-preview,
.logs {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.input-group input,
.input-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.input-group textarea {
  height: 80px;
  resize: vertical;
}

button {
  padding: 10px 20px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #06a552;
}

.test-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.test-buttons button {
  background: #1890ff;
}

.test-buttons button:hover {
  background: #1677cc;
}

.sessions {
  max-height: 300px;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.session-item:hover {
  background: #f8f9fa;
}

.session-item:last-child {
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
  margin-bottom: 2px;
}

.time {
  color: #999;
  font-size: 12px;
}

.unread-count {
  background: #ff4757;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
  background: #f9f9f9;
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 12px;
}

.log-item .time {
  color: #666;
  margin-right: 10px;
}
</style>
