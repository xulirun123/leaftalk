<template>
  <div class="chat-url-test">
    <h2>聊天URL统一性测试</h2>
    
    <!-- 问题说明 -->
    <div class="problem-description">
      <h3>问题描述</h3>
      <p>之前从不同入口进入聊天页面时，URL格式不一致：</p>
      <ul>
        <li><strong>聊天列表</strong>: <code>http://127.0.0.1:5173/chat/chat_1_2_2</code></li>
        <li><strong>通讯录</strong>: <code>http://127.0.0.1:5173/chat/2_1</code></li>
      </ul>
      <p>现在使用统一的URL生成器，确保URL格式一致。</p>
    </div>

    <!-- URL生成测试 -->
    <div class="test-section">
      <h3>URL生成测试</h3>
      <div class="input-group">
        <label>当前用户ID:</label>
        <input v-model="currentUserId" placeholder="输入当前用户ID" />
      </div>
      <div class="input-group">
        <label>对方用户ID:</label>
        <input v-model="otherUserId" placeholder="输入对方用户ID" />
      </div>
      <div class="result">
        <strong>生成的URL:</strong>
        <code>{{ generateTestUrl() }}</code>
      </div>
    </div>

    <!-- 不同场景测试 -->
    <div class="test-section">
      <h3>不同场景URL测试</h3>
      <div class="scenario-tests">
        <div class="scenario">
          <h4>场景1: 从聊天列表进入</h4>
          <p>用户1 (ID: 1) 点击与用户2 (ID: 2) 的聊天</p>
          <div class="url-result">
            <strong>生成URL:</strong> <code>{{ generateChatUrl('1', '2') }}</code>
          </div>
        </div>

        <div class="scenario">
          <h4>场景2: 从通讯录进入</h4>
          <p>用户1 (ID: 1) 在通讯录点击用户2 (ID: 2) 的"发送消息"</p>
          <div class="url-result">
            <strong>生成URL:</strong> <code>{{ generateChatUrl('1', '2') }}</code>
          </div>
        </div>

        <div class="scenario">
          <h4>场景3: 反向测试</h4>
          <p>用户2 (ID: 2) 点击与用户1 (ID: 1) 的聊天</p>
          <div class="url-result">
            <strong>生成URL:</strong> <code>{{ generateChatUrl('2', '1') }}</code>
          </div>
        </div>

        <div class="scenario">
          <h4>场景4: 更大的用户ID</h4>
          <p>用户10 (ID: 10) 与用户5 (ID: 5) 的聊天</p>
          <div class="url-result">
            <strong>生成URL:</strong> <code>{{ generateChatUrl('10', '5') }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- URL解析测试 -->
    <div class="test-section">
      <h3>URL解析测试</h3>
      <div class="input-group">
        <label>输入聊天URL或ID:</label>
        <input v-model="testUrl" placeholder="例如: /chat/1_2 或 1_2" />
      </div>
      <div class="parse-result">
        <strong>解析结果:</strong>
        <pre>{{ parseTestUrl() }}</pre>
      </div>
    </div>

    <!-- 兼容性测试 -->
    <div class="test-section">
      <h3>兼容性测试</h3>
      <div class="compatibility-tests">
        <div class="test-item">
          <strong>旧格式:</strong> <code>chat_1_2_2</code>
          <div>迁移后: <code>{{ migrateChatId('chat_1_2_2', '1') }}</code></div>
        </div>
        <div class="test-item">
          <strong>简单格式:</strong> <code>2_1</code>
          <div>迁移后: <code>{{ migrateChatId('2_1', '1') }}</code></div>
        </div>
        <div class="test-item">
          <strong>单用户ID:</strong> <code>5</code>
          <div>迁移后: <code>{{ migrateChatId('5', '1') }}</code></div>
        </div>
      </div>
    </div>

    <!-- 实际跳转测试 -->
    <div class="test-section">
      <h3>实际跳转测试</h3>
      <div class="jump-tests">
        <button @click="jumpToChat('1', '2')">
          跳转到用户1与用户2的聊天
        </button>
        <button @click="jumpToChat('2', '1')">
          跳转到用户2与用户1的聊天
        </button>
        <button @click="jumpToChat('1', '5')">
          跳转到用户1与用户5的聊天
        </button>
      </div>
    </div>

    <!-- 测试日志 -->
    <div class="test-section">
      <h3>测试日志</h3>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  generateChatUrl, 
  parseChatUrl, 
  getOtherUserId, 
  migrateChatId,
  isValidChatUrl 
} from '../utils/chatUrlGenerator'

const router = useRouter()

// 测试数据
const currentUserId = ref('1')
const otherUserId = ref('2')
const testUrl = ref('/chat/1_2')
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

// 生成测试URL
const generateTestUrl = () => {
  if (!currentUserId.value || !otherUserId.value) {
    return '请输入用户ID'
  }
  return generateChatUrl(currentUserId.value, otherUserId.value)
}

// 解析测试URL
const parseTestUrl = () => {
  if (!testUrl.value) {
    return '请输入URL'
  }
  
  try {
    const result = parseChatUrl(testUrl.value)
    return JSON.stringify(result, null, 2)
  } catch (error) {
    return `解析失败: ${error}`
  }
}

// 跳转到聊天
const jumpToChat = (userId1: string, userId2: string) => {
  const chatUrl = generateChatUrl(userId1, userId2)
  addLog(`跳转到聊天: ${chatUrl}`)
  router.push(chatUrl)
}

// 初始化
addLog('聊天URL测试页面已加载')
</script>

<style scoped>
.chat-url-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.problem-description {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.problem-description ul {
  margin: 10px 0;
  padding-left: 20px;
}

.problem-description li {
  margin: 5px 0;
}

.test-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-section h3 {
  padding: 15px 20px;
  margin: 0;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #333;
}

.input-group {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.input-group:last-child {
  border-bottom: none;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.input-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.result,
.url-result,
.parse-result {
  padding: 15px 20px;
  background: #f8f9fa;
  border-left: 4px solid #07c160;
}

.result code,
.url-result code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.scenario-tests {
  padding: 20px;
}

.scenario {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.scenario h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.scenario p {
  margin: 5px 0;
  color: #666;
}

.compatibility-tests {
  padding: 20px;
}

.test-item {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.jump-tests {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.jump-tests button {
  padding: 10px 20px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.jump-tests button:hover {
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

pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
