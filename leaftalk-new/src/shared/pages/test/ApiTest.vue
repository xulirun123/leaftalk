<template>
  <div class="api-test">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="mdi:arrow-left"></iconify-icon>
      </button>
      <h1>API测试</h1>
    </div>

    <div class="test-content">
      <!-- API 测试区域 -->
      <div class="test-section">
        <h2>认证相关API</h2>
        <div class="api-group">
          <button @click="testLogin" class="test-btn">测试登录</button>
          <button @click="testRegister" class="test-btn">测试注册</button>
          <button @click="testProfile" class="test-btn">获取用户信息</button>
          <button @click="testLogout" class="test-btn">测试登出</button>
        </div>
      </div>

      <div class="test-section">
        <h2>聊天相关API</h2>
        <div class="api-group">
          <button @click="testGetChats" class="test-btn">获取聊天列表</button>
          <button @click="testSendMessage" class="test-btn">发送消息</button>
          <button @click="testGetMessages" class="test-btn">获取消息历史</button>
        </div>
      </div>

      <div class="test-section">
        <h2>族谱相关API</h2>
        <div class="api-group">
          <button @click="testGetGenealogies" class="test-btn">获取族谱列表</button>
          <button @click="testCreateGenealogy" class="test-btn">创建族谱</button>
          <button @click="testJoinGenealogy" class="test-btn">加入族谱</button>
        </div>
      </div>

      <div class="test-section">
        <h2>系统API</h2>
        <div class="api-group">
          <button @click="testHealth" class="test-btn">健康检查</button>
          <button @click="testUpload" class="test-btn">文件上传</button>
          <button @click="testOCR" class="test-btn">OCR识别</button>
        </div>
      </div>

      <!-- 结果显示区域 -->
      <div class="result-section">
        <h2>测试结果</h2>
        <div class="result-container">
          <div v-if="loading" class="loading">
            <iconify-icon icon="mdi:loading" class="spin"></iconify-icon>
            <span>请求中...</span>
          </div>
          <div v-else-if="result" class="result">
            <div class="result-header">
              <span class="method">{{ result.method }}</span>
              <span class="url">{{ result.url }}</span>
              <span :class="['status', result.success ? 'success' : 'error']">
                {{ result.status }}
              </span>
            </div>
            <div class="result-body">
              <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
            </div>
          </div>
          <div v-else class="no-result">
            <iconify-icon icon="mdi:test-tube"></iconify-icon>
            <p>选择一个API进行测试</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const result = ref(null)

const goBack = () => {
  router.back()
}

const makeApiCall = async (method: string, url: string, data?: any) => {
  loading.value = true
  result.value = null

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const token = localStorage.getItem('yeyu_auth_token')
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, options)
    const responseData = await response.json()

    result.value = {
      method,
      url,
      status: response.status,
      success: response.ok,
      data: responseData
    }
  } catch (error) {
    result.value = {
      method,
      url,
      status: 'ERROR',
      success: false,
      data: { error: error.message }
    }
  } finally {
    loading.value = false
  }
}

// 认证相关API测试
const testLogin = () => {
  makeApiCall('POST', '/api/auth/login', {
    username: 'testuser1',
    password: '123456'
  })
}

const testRegister = () => {
  makeApiCall('POST', '/api/auth/register', {
    username: 'newuser',
    password: '123456',
    email: 'newuser@example.com'
  })
}

const testProfile = () => {
  makeApiCall('GET', '/api/users/profile')
}

const testLogout = () => {
  makeApiCall('POST', '/api/auth/logout')
}

// 聊天相关API测试
const testGetChats = () => {
  makeApiCall('GET', '/api/chats')
}

const testSendMessage = () => {
  makeApiCall('POST', '/api/messages', {
    chatId: 'test-chat-1',
    content: '这是一条测试消息',
    type: 'text'
  })
}

const testGetMessages = () => {
  makeApiCall('GET', '/api/chats/test-chat-1/messages')
}

// 族谱相关API测试
const testGetGenealogies = () => {
  makeApiCall('GET', '/api/genealogies')
}

const testCreateGenealogy = () => {
  makeApiCall('POST', '/api/genealogies', {
    surname: '测试',
    region: '测试地区',
    description: '这是一个测试族谱'
  })
}

const testJoinGenealogy = () => {
  makeApiCall('POST', '/api/genealogies/test-genealogy-1/join')
}

// 系统API测试
const testHealth = () => {
  makeApiCall('GET', '/api/health')
}

const testUpload = () => {
  makeApiCall('POST', '/api/upload', {
    file: 'test-file-data'
  })
}

const testOCR = () => {
  makeApiCall('POST', '/api/ocr/id-card', {
    image: 'test-image-data'
  })
}
</script>

<style scoped>
.api-test {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  margin-right: 15px;
  cursor: pointer;
  color: #333;
}

.header h1 {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.test-content {
  padding: 20px;
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
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #07C160;
  padding-bottom: 5px;
}

.api-group {
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
  font-size: 14px;
}

.test-btn:hover {
  background: #06a552;
}

.result-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.result-section h2 {
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #07C160;
  padding-bottom: 5px;
}

.result-container {
  min-height: 200px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
}

.loading .spin {
  animation: spin 1s linear infinite;
  margin-right: 10px;
  font-size: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.result {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.result-header {
  background: #f8f9fa;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.method {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
}

.url {
  font-family: monospace;
  color: #666;
  flex: 1;
}

.status {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
}

.status.success {
  background: #28a745;
  color: white;
}

.status.error {
  background: #dc3545;
  color: white;
}

.result-body {
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.result-body pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.no-result {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.no-result iconify-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}
</style>
