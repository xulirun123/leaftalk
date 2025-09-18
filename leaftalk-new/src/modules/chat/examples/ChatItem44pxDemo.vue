<template>
  <div class="chat-item-demo">
    <h2>44px 聊天项样式演示</h2>
    
    <!-- 功能说明 -->
    <div class="demo-info">
      <h3>功能特性</h3>
      <ul>
        <li>✅ 44px 紧凑头像设计</li>
        <li>✅ 未读消息徽章显示</li>
        <li>✅ 免打扰红点提示</li>
        <li>✅ 在线状态指示器</li>
        <li>✅ 置顶和静音状态</li>
        <li>✅ 消息类型图标</li>
        <li>✅ 智能时间显示</li>
        <li>✅ 长按菜单支持</li>
      </ul>
    </div>

    <!-- 聊天项列表演示 -->
    <div class="demo-section">
      <h3>聊天项样式演示</h3>
      <div class="chat-list">
        <ChatItem44px
          v-for="chat in demoChats"
          :key="chat.id"
          :chat="chat"
          @click="onChatClick"
          @contextmenu="onChatContextMenu"
          @delete="onChatDelete"
        />
      </div>
    </div>

    <!-- 交互测试 -->
    <div class="demo-section">
      <h3>交互测试</h3>
      <div class="test-buttons">
        <button @click="addUnreadMessage">增加未读消息</button>
        <button @click="toggleMuteStatus">切换静音状态</button>
        <button @click="togglePinStatus">切换置顶状态</button>
        <button @click="toggleOnlineStatus">切换在线状态</button>
        <button @click="updateLastMessage">更新最后消息</button>
        <button @click="resetDemo">重置演示</button>
      </div>
    </div>

    <!-- 操作日志 -->
    <div class="demo-section">
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
import { ref, reactive } from 'vue'
import ChatItem44px from '../components/ChatItem44px.vue'

// 演示数据
const demoChats = reactive([
  {
    id: 'chat_001',
    name: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    lastMessage: '你好，最近怎么样？',
    updatedAt: Date.now() - 1000 * 60 * 5, // 5分钟前
    unreadCount: 3,
    isPinned: true,
    isMuted: false,
    isOnline: true,
    chatType: 'private'
  },
  {
    id: 'chat_002',
    name: '技术交流群',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group1',
    lastMessage: {
      content: '大家讨论一下新项目的技术方案',
      type: 'text'
    },
    updatedAt: Date.now() - 1000 * 60 * 30, // 30分钟前
    unreadCount: 12,
    isPinned: false,
    isMuted: true,
    isOnline: false,
    chatType: 'group',
    memberCount: 25
  },
  {
    id: 'chat_003',
    name: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    lastMessage: {
      content: '发送了一张图片',
      type: 'image'
    },
    updatedAt: Date.now() - 1000 * 60 * 60 * 2, // 2小时前
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isOnline: true,
    chatType: 'private'
  },
  {
    id: 'chat_004',
    name: '王五',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
    lastMessage: {
      content: '发送了一段语音',
      type: 'voice'
    },
    updatedAt: Date.now() - 1000 * 60 * 60 * 24, // 1天前
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    isOnline: false,
    chatType: 'private'
  },
  {
    id: 'chat_005',
    name: '家庭群',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=family',
    lastMessage: {
      content: '分享了一个文件',
      type: 'file'
    },
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2天前
    unreadCount: 5,
    isPinned: true,
    isMuted: false,
    isOnline: false,
    chatType: 'group',
    memberCount: 8
  },
  {
    id: 'chat_006',
    name: '赵六',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
    lastMessage: '周末一起吃饭吧',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1周前
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isOnline: true,
    chatType: 'private',
    draft: '好的，我们约个时间'
  }
])

// 操作日志
const logs = ref<Array<{ time: string, message: string }>>([])

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

// 事件处理
const onChatClick = (chat: any) => {
  addLog(`点击聊天: ${chat.name}`)
}

const onChatContextMenu = (chat: any) => {
  addLog(`长按聊天: ${chat.name}`)
}

const onChatDelete = (chat: any) => {
  const index = demoChats.findIndex(c => c.id === chat.id)
  if (index > -1) {
    demoChats.splice(index, 1)
    addLog(`删除聊天: ${chat.name}`)
  }
}

// 测试功能
const addUnreadMessage = () => {
  const randomChat = demoChats[Math.floor(Math.random() * demoChats.length)]
  randomChat.unreadCount = (randomChat.unreadCount || 0) + 1
  randomChat.updatedAt = Date.now()
  addLog(`为 ${randomChat.name} 增加未读消息`)
}

const toggleMuteStatus = () => {
  const randomChat = demoChats[Math.floor(Math.random() * demoChats.length)]
  randomChat.isMuted = !randomChat.isMuted
  addLog(`${randomChat.isMuted ? '静音' : '取消静音'}: ${randomChat.name}`)
}

const togglePinStatus = () => {
  const randomChat = demoChats[Math.floor(Math.random() * demoChats.length)]
  randomChat.isPinned = !randomChat.isPinned
  addLog(`${randomChat.isPinned ? '置顶' : '取消置顶'}: ${randomChat.name}`)
}

const toggleOnlineStatus = () => {
  const randomChat = demoChats[Math.floor(Math.random() * demoChats.length)]
  if (randomChat.chatType === 'private') {
    randomChat.isOnline = !randomChat.isOnline
    addLog(`${randomChat.isOnline ? '上线' : '离线'}: ${randomChat.name}`)
  }
}

const updateLastMessage = () => {
  const randomChat = demoChats[Math.floor(Math.random() * demoChats.length)]
  const messages = [
    '你好！',
    '最近怎么样？',
    '有空聊聊吗？',
    '晚上一起吃饭吧',
    '工作顺利吗？'
  ]
  randomChat.lastMessage = messages[Math.floor(Math.random() * messages.length)]
  randomChat.updatedAt = Date.now()
  addLog(`更新 ${randomChat.name} 的最后消息`)
}

const resetDemo = () => {
  // 重置所有状态
  demoChats.forEach(chat => {
    chat.unreadCount = Math.floor(Math.random() * 5)
    chat.isMuted = Math.random() > 0.7
    chat.isPinned = Math.random() > 0.8
    chat.isOnline = Math.random() > 0.5
  })
  addLog('重置演示数据')
}

// 初始化
addLog('44px 聊天项演示已加载')
</script>

<style scoped>
.chat-item-demo {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.demo-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.demo-info ul {
  margin: 10px 0;
  padding-left: 20px;
}

.demo-info li {
  margin: 5px 0;
  color: #333;
}

.demo-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.demo-section h3 {
  padding: 15px 20px;
  margin: 0;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #333;
}

.chat-list {
  background: white;
}

.test-buttons {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.test-buttons button {
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.test-buttons button:hover {
  background: #06a552;
}

.logs {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
}

.log-item {
  padding: 8px 20px;
  border-bottom: 1px solid #e9ecef;
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

.log-item .message {
  color: #333;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}
</style>
