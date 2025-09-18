<template>
  <div class="test-redirect">
    <h2>跳转测试页面</h2>
    
    <div class="test-section">
      <h3>身份认证状态</h3>
      <p>已认证: {{ identityStore.isVerified ? '是' : '否' }}</p>
      <p>缓存有效: {{ identityStore.isCacheValid ? '是' : '否' }}</p>
      <p>最后检查时间: {{ lastCheckTimeText }}</p>
      
      <button @click="checkIdentity" :disabled="isChecking">
        {{ isChecking ? '检查中...' : '检查身份认证状态' }}
      </button>
      
      <button @click="refreshIdentity" :disabled="isRefreshing">
        {{ isRefreshing ? '刷新中...' : '强制刷新状态' }}
      </button>
    </div>

    <div class="test-section">
      <h3>跳转测试</h3>
      <button @click="testRouterPush">测试 router.push('/')</button>
      <button @click="testLocationHref">测试 location.href = '/'</button>
      <button @click="testRouterReplace">测试 router.replace('/')</button>
    </div>

    <div class="test-section">
      <h3>路由信息</h3>
      <p>当前路径: {{ $route.path }}</p>
      <p>当前名称: {{ $route.name }}</p>
      <p>需要认证: {{ $route.meta.requiresAuth ? '是' : '否' }}</p>
    </div>

    <div class="test-section">
      <h3>用户信息</h3>
      <p>Token: {{ hasToken ? '存在' : '不存在' }}</p>
      <p>用户信息: {{ hasUserInfo ? '存在' : '不存在' }}</p>
    </div>

    <div class="log-section">
      <h3>操作日志</h3>
      <div class="log-content">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
      <button @click="clearLogs">清除日志</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useIdentityStore } from './stores/identityStore'

const router = useRouter()
const route = useRoute()
const identityStore = useIdentityStore()

const isChecking = ref(false)
const isRefreshing = ref(false)
const logs = ref<string[]>([])

const hasToken = computed(() => !!localStorage.getItem('yeyu_auth_token'))
const hasUserInfo = computed(() => !!localStorage.getItem('yeyu_user_info'))
const lastCheckTimeText = computed(() => {
  if (identityStore.lastCheckTime === 0) return '从未检查'
  return new Date(identityStore.lastCheckTime).toLocaleString()
})

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.unshift(`[${timestamp}] ${message}`)
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
  console.log(message)
}

const checkIdentity = async () => {
  isChecking.value = true
  addLog('开始检查身份认证状态...')
  
  try {
    const result = await identityStore.checkIdentityStatus()
    addLog(`身份认证状态: ${result.verified ? '已认证' : '未认证'}`)
    if (result.verified) {
      addLog(`认证用户: ${result.name}`)
    }
  } catch (error: any) {
    addLog(`检查失败: ${error.message}`)
  } finally {
    isChecking.value = false
  }
}

const refreshIdentity = async () => {
  isRefreshing.value = true
  addLog('强制刷新身份认证状态...')
  
  try {
    const result = await identityStore.refreshIdentityStatus()
    addLog(`刷新结果: ${result.verified ? '已认证' : '未认证'}`)
  } catch (error: any) {
    addLog(`刷新失败: ${error.message}`)
  } finally {
    isRefreshing.value = false
  }
}

const testRouterPush = async () => {
  addLog('测试 router.push(\'/\')...')
  try {
    await router.push('/')
    addLog('router.push 成功')
  } catch (error: any) {
    addLog(`router.push 失败: ${error.message}`)
  }
}

const testLocationHref = () => {
  addLog('测试 location.href = \'/\'...')
  try {
    window.location.href = '/'
    addLog('location.href 执行成功')
  } catch (error: any) {
    addLog(`location.href 失败: ${error.message}`)
  }
}

const testRouterReplace = async () => {
  addLog('测试 router.replace(\'/\')...')
  try {
    await router.replace('/')
    addLog('router.replace 成功')
  } catch (error: any) {
    addLog(`router.replace 失败: ${error.message}`)
  }
}

const clearLogs = () => {
  logs.value = []
  addLog('日志已清除')
}

onMounted(() => {
  addLog('测试页面已加载')
  addLog(`当前路径: ${route.path}`)
  addLog(`身份认证状态: ${identityStore.isVerified ? '已认证' : '未认证'}`)
})
</script>

<style scoped>
.test-redirect {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.test-section h3 {
  margin-top: 0;
  color: #333;
}

.test-section button {
  margin: 5px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.test-section button:hover {
  background: #f0f0f0;
}

.test-section button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.log-section {
  margin-top: 30px;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background: white;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  margin-bottom: 2px;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}
</style>
