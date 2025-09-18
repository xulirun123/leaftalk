<template>
  <div class="api-test">
    <div class="test-header">
      <h1>API连接测试</h1>
      <button @click="goBack" class="back-btn">返回</button>
    </div>

    <div class="test-section">
      <h2>无需认证的API测试</h2>
      
      <div class="test-item">
        <button @click="testBasicAPI" :disabled="loading">测试基础API</button>
        <div v-if="basicResult" class="result" :class="basicResult.success ? 'success' : 'error'">
          {{ JSON.stringify(basicResult, null, 2) }}
        </div>
      </div>

      <div class="test-item">
        <button @click="testChatAPI" :disabled="loading">测试聊天API</button>
        <div v-if="chatResult" class="result" :class="chatResult.success ? 'success' : 'error'">
          {{ JSON.stringify(chatResult, null, 2) }}
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>需要认证的API测试</h2>
      
      <div class="test-item">
        <input v-model="testToken" placeholder="输入测试Token（可选）" class="token-input">
        <button @click="setTestToken">设置Token</button>
      </div>

      <div class="test-item">
        <button @click="testAuthAPI" :disabled="loading">测试认证API</button>
        <div v-if="authResult" class="result" :class="authResult.success ? 'success' : 'error'">
          {{ JSON.stringify(authResult, null, 2) }}
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>当前配置</h2>
      <div class="config-info">
        <p><strong>代理API:</strong> /api</p>
        <p><strong>直接API:</strong> http://localhost:8893/api</p>
        <p><strong>当前Token:</strong> {{ currentToken ? '已设置' : '未设置' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const basicResult = ref(null)
const chatResult = ref(null)
const authResult = ref(null)
const testToken = ref('')
const currentToken = ref(localStorage.getItem('token') || localStorage.getItem('yeyu_auth_token'))

const goBack = () => {
  router.back()
}

const testBasicAPI = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/test')
    basicResult.value = response.data
  } catch (error) {
    basicResult.value = {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    }
  } finally {
    loading.value = false
  }
}

const testChatAPI = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/test/chats')
    chatResult.value = response.data
  } catch (error) {
    chatResult.value = {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    }
  } finally {
    loading.value = false
  }
}

const setTestToken = () => {
  if (testToken.value) {
    localStorage.setItem('token', testToken.value)
    currentToken.value = testToken.value
    alert('Token已设置')
  } else {
    localStorage.removeItem('token')
    localStorage.removeItem('yeyu_auth_token')
    currentToken.value = null
    alert('Token已清除')
  }
}

const testAuthAPI = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('yeyu_auth_token')
    const response = await axios.get('/api/chats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    authResult.value = response.data
  } catch (error) {
    authResult.value = {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.api-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.back-btn {
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.test-section h2 {
  margin-top: 0;
  color: #333;
}

.test-item {
  margin-bottom: 20px;
}

.test-item button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

.test-item button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.token-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
  margin-right: 10px;
}

.result {
  margin-top: 10px;
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 12px;
}

.result.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.result.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.config-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.config-info p {
  margin: 5px 0;
}
</style>
