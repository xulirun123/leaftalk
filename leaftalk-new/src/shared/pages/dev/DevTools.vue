<template>
  <div class="dev-tools">
    <div class="dev-header">
      <h1>开发工具</h1>
      <p>用于开发和调试的工具集合</p>
    </div>

    <div class="dev-sections">
      <!-- API 测试 -->
      <div class="dev-section">
        <h2>API 测试</h2>
        <div class="api-test">
          <button @click="testHealthCheck" class="test-btn">健康检查</button>
          <button @click="testLogin" class="test-btn">测试登录</button>
          <button @click="testUserProfile" class="test-btn">用户资料</button>
        </div>
        <div v-if="apiResult" class="api-result">
          <h3>API 响应:</h3>
          <pre>{{ apiResult }}</pre>
        </div>
      </div>

      <!-- 配置信息 -->
      <div class="dev-section">
        <h2>配置信息</h2>
        <div class="config-info">
          <div class="config-item">
            <strong>前端端口:</strong> {{ frontendPort }}
          </div>
          <div class="config-item">
            <strong>后端地址:</strong> {{ backendUrl }}
          </div>
          <div class="config-item">
            <strong>WebSocket地址:</strong> {{ wsUrl }}
          </div>
          <div class="config-item">
            <strong>环境:</strong> {{ environment }}
          </div>
        </div>
      </div>

      <!-- 存储信息 -->
      <div class="dev-section">
        <h2>本地存储</h2>
        <div class="storage-info">
          <button @click="showLocalStorage" class="test-btn">查看 LocalStorage</button>
          <button @click="clearStorage" class="test-btn danger">清空存储</button>
        </div>
        <div v-if="storageData" class="storage-result">
          <h3>存储内容:</h3>
          <pre>{{ storageData }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const apiResult = ref('')
const storageData = ref('')
const frontendPort = ref(window.location.port || '5173')
const backendUrl = ref('/api')
const wsUrl = ref('/ws')
const environment = ref(import.meta.env.MODE)

// API 测试方法
const testHealthCheck = async () => {
  try {
    const response = await fetch('/api/health')
    const data = await response.json()
    apiResult.value = JSON.stringify(data, null, 2)
  } catch (error) {
    apiResult.value = `错误: ${error.message}`
  }
}

const testLogin = async () => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser1',
        password: '123456'
      })
    })
    const data = await response.json()
    apiResult.value = JSON.stringify(data, null, 2)
  } catch (error) {
    apiResult.value = `错误: ${error.message}`
  }
}

const testUserProfile = async () => {
  try {
    const token = localStorage.getItem('yeyu_auth_token')
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    apiResult.value = JSON.stringify(data, null, 2)
  } catch (error) {
    apiResult.value = `错误: ${error.message}`
  }
}

// 存储相关方法
const showLocalStorage = () => {
  const storage = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      storage[key] = localStorage.getItem(key)
    }
  }
  storageData.value = JSON.stringify(storage, null, 2)
}

const clearStorage = () => {
  if (confirm('确定要清空所有本地存储吗？')) {
    localStorage.clear()
    storageData.value = '存储已清空'
  }
}

onMounted(() => {
  console.log('开发工具页面已加载')
})
</script>

<style scoped>
.dev-tools {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dev-header {
  text-align: center;
  margin-bottom: 30px;
}

.dev-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.dev-header p {
  color: #666;
}

.dev-sections {
  display: grid;
  gap: 30px;
}

.dev-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dev-section h2 {
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #07C160;
  padding-bottom: 5px;
}

.api-test, .storage-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
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

.api-result, .storage-result {
  margin-top: 15px;
}

.api-result h3, .storage-result h3 {
  color: #333;
  margin-bottom: 10px;
}

.api-result pre, .storage-result pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.config-info {
  display: grid;
  gap: 10px;
}

.config-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #07C160;
}

.config-item strong {
  color: #333;
  margin-right: 10px;
}
</style>
