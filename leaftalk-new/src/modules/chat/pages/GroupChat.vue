<template>
  <div class="group-chat">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="mdi:arrow-left"></iconify-icon>
      </button>
      <h1>群聊</h1>
      <button @click="showGroupInfo" class="info-btn">
        <iconify-icon icon="mdi:information-outline"></iconify-icon>
      </button>
    </div>

    <div class="chat-content">
      <div class="messages-container">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', { 'own': message.isOwn }]"
        >
          <div class="message-info">
            <img :src="message.avatar" :alt="message.senderName" class="avatar" />
            <span class="sender-name">{{ message.senderName }}</span>
          </div>
          <div class="message-content">
            {{ message.content }}
          </div>
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-container">
        <button class="voice-btn">
          <iconify-icon icon="mdi:microphone"></iconify-icon>
        </button>
        <input 
          v-model="inputMessage"
          @keyup.enter="sendMessage"
          type="text" 
          placeholder="输入消息..."
          class="message-input"
        />
        <button @click="sendMessage" class="send-btn" :disabled="!inputMessage.trim()">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const inputMessage = ref('')
const messages = ref([
  {
    id: '1',
    senderName: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    content: '大家好！',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isOwn: false
  },
  {
    id: '2',
    senderName: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    content: '欢迎新成员！',
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    isOwn: false
  },
  {
    id: '3',
    senderName: '我',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
    content: '谢谢大家！',
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
    isOwn: true
  }
])

const goBack = () => {
  router.back()
}

const showGroupInfo = () => {
  router.push(`/group-info/${route.params.id}`)
}

const sendMessage = () => {
  if (!inputMessage.value.trim()) return

  const newMessage = {
    id: Date.now().toString(),
    senderName: '我',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
    content: inputMessage.value.trim(),
    timestamp: new Date(),
    isOwn: true
  }

  messages.value.push(newMessage)
  inputMessage.value = ''
}

const formatTime = (time: Date) => {
  return time.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

onMounted(() => {
  console.log('群聊页面加载，群ID:', route.params.id)
})
</script>

<style scoped>
.group-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn,
.info-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
}

.header h1 {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 20px;
}

.message.own {
  text-align: right;
}

.message-info {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.message.own .message-info {
  justify-content: flex-end;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
}

.message.own .avatar {
  margin-right: 0;
  margin-left: 8px;
  order: 2;
}

.sender-name {
  font-size: 12px;
  color: #666;
}

.message.own .sender-name {
  order: 1;
}

.message-content {
  background: white;
  padding: 10px 15px;
  border-radius: 18px;
  display: inline-block;
  max-width: 70%;
  word-wrap: break-word;
  margin-bottom: 5px;
}

.message.own .message-content {
  background: #07C160;
  color: white;
}

.message-time {
  font-size: 10px;
  color: #999;
}

.input-area {
  background: white;
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.voice-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
}

.message-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 10px 15px;
  outline: none;
  font-size: 16px;
}

.send-btn {
  background: #07C160;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
