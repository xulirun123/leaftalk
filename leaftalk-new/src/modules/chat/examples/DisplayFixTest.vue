<template>
  <div class="display-fix-test">
    <h2>显示问题修复测试</h2>
    
    <!-- 问题描述 -->
    <div class="problem-section">
      <h3>修复的问题</h3>
      <ul>
        <li>✅ 聊天项刷新后昵称和消息显示像日志一样的问题</li>
        <li>✅ 底部导航栏按钮文字颜色与背景色相同的问题</li>
      </ul>
    </div>

    <!-- 聊天项显示测试 -->
    <div class="test-section">
      <h3>聊天项显示测试</h3>
      <div class="test-actions">
        <button @click="refreshChatData">刷新聊天数据</button>
        <button @click="addTestChat">添加测试聊天</button>
        <button @click="clearChatData">清除聊天数据</button>
      </div>
      
      <div class="mock-chat-list">
        <h4>模拟聊天列表</h4>
        <div class="chat-list">
          <div class="chat-item" v-for="chat in testChats" :key="chat.id">
            <div class="chat-user-info">
              <div class="user-avatar">
                <div class="optimized-avatar">
                  <img :src="chat.avatar" :alt="chat.name" />
                </div>
                <div v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</div>
              </div>
              <div class="user-details">
                <div class="user-name">{{ getDisplayName(chat) }}</div>
                <div class="message-time-row">
                  <div class="last-message">{{ getDisplayMessage(chat) }}</div>
                  <div class="chat-time">{{ formatTime(chat.updatedAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏测试 -->
    <div class="test-section">
      <h3>底部导航栏测试</h3>
      <div class="nav-test-container">
        <h4>导航栏预览</h4>
        <div class="mobile-tab-bar-preview">
          <div class="tab-container">
            <div
              v-for="tab in testTabs"
              :key="tab.key"
              class="tab-item"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <div class="tab-icon" :style="{ color: activeTab === tab.key ? '#07C160' : '#999999' }">
                {{ tab.icon }}
              </div>
              <span class="tab-label" :class="{ 'active-label': activeTab === tab.key }">{{ tab.label }}</span>
              <div v-if="tab.badge && tab.badge > 0" class="tab-badge">{{ tab.badge }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 颜色对比测试 -->
    <div class="test-section">
      <h3>颜色对比测试</h3>
      <div class="color-test-grid">
        <div class="color-test-item">
          <div class="color-sample" style="background: #2c2c2c; color: #ffffff;">
            <span>白色文字 (#ffffff)</span>
          </div>
          <p>原来的配色 - 可能看不清</p>
        </div>
        <div class="color-test-item">
          <div class="color-sample" style="background: #2c2c2c; color: #999999;">
            <span>灰色文字 (#999999)</span>
          </div>
          <p>修复后的配色 - 清晰可见</p>
        </div>
        <div class="color-test-item">
          <div class="color-sample" style="background: #2c2c2c; color: #07C160;">
            <span>激活状态 (#07C160)</span>
          </div>
          <p>激活状态 - 绿色突出</p>
        </div>
      </div>
    </div>

    <!-- 数据格式测试 -->
    <div class="test-section">
      <h3>数据格式测试</h3>
      <div class="data-format-tests">
        <h4>不同消息格式测试</h4>
        <div v-for="(test, index) in messageTests" :key="index" class="format-test-item">
          <div class="test-input">
            <strong>输入:</strong> <code>{{ JSON.stringify(test.input) }}</code>
          </div>
          <div class="test-output">
            <strong>输出:</strong> <span>{{ getDisplayMessage({ lastMessage: test.input }) }}</span>
          </div>
        </div>
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
import { ref } from 'vue'

// 测试数据
const activeTab = ref('chats')
const testChats = ref([
  {
    id: 'test1',
    name: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    lastMessage: '你好，最近怎么样？',
    updatedAt: Date.now() - 1000 * 60 * 5,
    unreadCount: 2
  },
  {
    id: 'test2',
    name: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    lastMessage: { type: 'image', content: 'photo.jpg' },
    updatedAt: Date.now() - 1000 * 60 * 30,
    unreadCount: 0
  },
  {
    id: 'test3',
    name: '',
    participants: ['1', '5'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
    lastMessage: null,
    updatedAt: Date.now() - 1000 * 60 * 60,
    unreadCount: 1
  }
])

const testTabs = ref([
  { key: 'chats', label: '叶语', icon: '💬', badge: 3 },
  { key: 'contacts', label: '通讯录', icon: '👥', badge: 0 },
  { key: 'discover', label: '发现', icon: '🔍', badge: 0 },
  { key: 'genealogy', label: '族谱', icon: '🌳', badge: 1 }
])

const messageTests = ref([
  { input: '普通文本消息' },
  { input: '带表情的消息 :) [微笑]' },
  { input: { type: 'image', content: 'photo.jpg' } },
  { input: { type: 'voice', content: 'voice.mp3' } },
  { input: null },
  { input: undefined },
  { input: '' },
  { input: { type: 'text', content: '对象格式的文本消息' } }
])

const logs = ref<Array<{ time: string, level: string, message: string }>>([])

// 添加日志
const addLog = (level: string, message: string) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    level,
    message
  })
  if (logs.value.length > 10) {
    logs.value = logs.value.slice(0, 10)
  }
}

// 显示函数（复制自主组件）
const getDisplayName = (chat: any): string => {
  if (!chat) return '未知聊天'
  
  if (chat.name && typeof chat.name === 'string' && chat.name.trim()) {
    return chat.name.trim()
  }
  
  if (chat.participants && chat.participants.length >= 2) {
    const currentUserId = '1'
    const otherUserId = chat.participants.find((p: string) => p !== currentUserId) || chat.participants[0]
    return `用户${otherUserId}`
  }
  
  return '未知聊天'
}

const getDisplayMessage = (chat: any): string => {
  if (!chat) return '暂无消息'
  
  let message = chat.lastMessage
  
  if (!message) {
    return '暂无消息'
  }
  
  if (typeof message === 'string') {
    return formatMessageToText(message)
  }
  
  if (typeof message === 'object') {
    switch (message.type) {
      case 'text':
        return formatMessageToText(message.content || message.text || '')
      case 'image':
        return '[图片]'
      case 'voice':
        return '[语音]'
      case 'video':
        return '[视频]'
      case 'file':
        return '[文件]'
      case 'location':
        return '[位置]'
      default:
        return formatMessageToText(message.content || message.text || '未知消息')
    }
  }
  
  return '暂无消息'
}

const formatMessageToText = (text: string): string => {
  if (!text) return ''
  
  let formattedText = text.toString()
  
  // 移除HTML标签
  formattedText = formattedText.replace(/<[^>]*>/g, '')
  
  // 处理表情符号
  const emojiMap: Record<string, string> = {
    ':)': '😊',
    ':D': '😃',
    ';)': '😉'
  }
  
  Object.entries(emojiMap).forEach(([textEmoji, emoji]) => {
    const regex = new RegExp(textEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    formattedText = formattedText.replace(regex, emoji)
  })
  
  // 处理自定义表情
  formattedText = formattedText.replace(/\[([^\]]+)\]/g, (match, emojiName) => {
    const customEmojiMap: Record<string, string> = {
      '微笑': '😊',
      '大笑': '😂'
    }
    return customEmojiMap[emojiName] || match
  })
  
  if (formattedText.length > 30) {
    formattedText = formattedText.substring(0, 30) + '...'
  }
  
  return formattedText
}

const formatTime = (timestamp: number): string => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now.getTime() - time.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return time.toLocaleTimeString().slice(0, 5)
  return time.toLocaleDateString()
}

// 操作方法
const refreshChatData = () => {
  addLog('INFO', '刷新聊天数据')
  // 模拟数据刷新
  testChats.value.forEach(chat => {
    chat.updatedAt = Date.now() - Math.random() * 3600000
  })
}

const addTestChat = () => {
  const newChat = {
    id: `test${Date.now()}`,
    name: `测试用户${testChats.value.length + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=test${testChats.value.length}`,
    lastMessage: '新的测试消息',
    updatedAt: Date.now(),
    unreadCount: Math.floor(Math.random() * 5)
  }
  testChats.value.unshift(newChat)
  addLog('INFO', `添加测试聊天: ${newChat.name}`)
}

const clearChatData = () => {
  testChats.value = []
  addLog('INFO', '清除聊天数据')
}

const clearLogs = () => {
  logs.value = []
}

// 初始化
addLog('INFO', '显示修复测试页面已加载')
</script>

<style scoped>
/* 引入聊天项样式 */
@import '../styles/ChatItemStyles.css';

.display-fix-test {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.problem-section,
.test-section,
.log-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

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

.mock-chat-list {
  border: 1px solid #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.mobile-tab-bar-preview {
  background: #2c2c2c;
  border-radius: 8px;
  padding: 10px;
  margin-top: 10px;
}

.mobile-tab-bar-preview .tab-container {
  display: flex;
  height: 60px;
}

.mobile-tab-bar-preview .tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  padding: 8px 4px;
  color: #999999;
}

.mobile-tab-bar-preview .tab-item.active {
  color: #07C160;
}

.mobile-tab-bar-preview .tab-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.mobile-tab-bar-preview .tab-label {
  font-size: 12px;
  color: #999999;
  font-weight: 400;
}

.mobile-tab-bar-preview .tab-label.active-label {
  color: #07C160 !important;
  font-weight: 500;
}

.mobile-tab-bar-preview .tab-badge {
  position: absolute;
  top: 4px;
  right: 20%;
  background: #ff4757;
  color: white;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  padding: 0 4px;
}

.color-test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.color-test-item {
  text-align: center;
}

.color-sample {
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-weight: 500;
}

.format-test-item {
  margin: 15px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.test-input,
.test-output {
  margin: 5px 0;
}

.test-input code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
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
