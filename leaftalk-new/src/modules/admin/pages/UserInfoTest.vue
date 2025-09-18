<template>
  <div class="user-info-test">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="mdi:arrow-left"></iconify-icon>
      </button>
      <h1>用户信息测试</h1>
    </div>

    <div class="test-content">
      <!-- 当前用户信息 -->
      <div class="info-section">
        <h2>当前用户信息</h2>
        <div class="user-card">
          <div class="avatar-section">
            <img :src="userInfo.avatar" :alt="userInfo.name" class="avatar" />
            <button @click="changeAvatar" class="change-avatar-btn">
              <iconify-icon icon="mdi:camera"></iconify-icon>
            </button>
          </div>
          <div class="user-details">
            <div class="detail-item">
              <label>用户名:</label>
              <span>{{ userInfo.username }}</span>
            </div>
            <div class="detail-item">
              <label>姓名:</label>
              <span>{{ userInfo.name }}</span>
            </div>
            <div class="detail-item">
              <label>手机号:</label>
              <span>{{ userInfo.phone }}</span>
            </div>
            <div class="detail-item">
              <label>邮箱:</label>
              <span>{{ userInfo.email }}</span>
            </div>
            <div class="detail-item">
              <label>叶语ID:</label>
              <span>{{ userInfo.yeyuId }}</span>
            </div>
            <div class="detail-item">
              <label>注册时间:</label>
              <span>{{ formatDate(userInfo.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <label>认证状态:</label>
              <span :class="['status', userInfo.verified ? 'verified' : 'unverified']">
                {{ userInfo.verified ? '已认证' : '未认证' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <h2>用户操作测试</h2>
        <div class="action-buttons">
          <button @click="refreshUserInfo" class="action-btn">
            <iconify-icon icon="mdi:refresh"></iconify-icon>
            刷新用户信息
          </button>
          <button @click="editProfile" class="action-btn">
            <iconify-icon icon="mdi:account-edit"></iconify-icon>
            编辑资料
          </button>
          <button @click="changePassword" class="action-btn">
            <iconify-icon icon="mdi:lock-reset"></iconify-icon>
            修改密码
          </button>
          <button @click="verifyIdentity" class="action-btn">
            <iconify-icon icon="mdi:card-account-details"></iconify-icon>
            身份认证
          </button>
          <button @click="exportData" class="action-btn">
            <iconify-icon icon="mdi:download"></iconify-icon>
            导出数据
          </button>
          <button @click="deleteAccount" class="action-btn danger">
            <iconify-icon icon="mdi:account-remove"></iconify-icon>
            删除账户
          </button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div class="result-section">
        <h2>操作结果</h2>
        <div class="result-container">
          <div v-if="loading" class="loading">
            <iconify-icon icon="mdi:loading" class="spin"></iconify-icon>
            <span>处理中...</span>
          </div>
          <div v-else-if="result" class="result">
            <div :class="['result-status', result.success ? 'success' : 'error']">
              {{ result.success ? '✅ 成功' : '❌ 失败' }}
            </div>
            <div class="result-message">{{ result.message }}</div>
            <div v-if="result.data" class="result-data">
              <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
            </div>
          </div>
          <div v-else class="no-result">
            <iconify-icon icon="mdi:information-outline"></iconify-icon>
            <p>执行操作后将显示结果</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const result = ref(null)

const userInfo = ref({
  username: 'testuser1',
  name: '测试用户',
  phone: '13800138000',
  email: 'testuser@example.com',
  yeyuId: 'YY12345678',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
  verified: true,
  createdAt: new Date('2024-01-01')
})

const goBack = () => {
  router.back()
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const showResult = (success: boolean, message: string, data?: any) => {
  result.value = { success, message, data }
}

const refreshUserInfo = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟更新用户信息
    userInfo.value.name = '更新后的用户名'
    
    showResult(true, '用户信息已刷新')
  } catch (error) {
    showResult(false, '刷新用户信息失败')
  } finally {
    loading.value = false
  }
}

const editProfile = () => {
  showResult(true, '跳转到编辑资料页面')
  // router.push('/profile/edit')
}

const changePassword = () => {
  showResult(true, '跳转到修改密码页面')
  // router.push('/profile/change-password')
}

const verifyIdentity = () => {
  showResult(true, '跳转到身份认证页面')
  // router.push('/profile/verify')
}

const changeAvatar = () => {
  showResult(true, '打开头像选择器')
}

const exportData = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const exportData = {
      userInfo: userInfo.value,
      exportTime: new Date().toISOString(),
      dataSize: '2.5MB'
    }
    
    showResult(true, '数据导出成功', exportData)
  } catch (error) {
    showResult(false, '数据导出失败')
  } finally {
    loading.value = false
  }
}

const deleteAccount = () => {
  if (confirm('确定要删除账户吗？此操作不可恢复！')) {
    showResult(false, '账户删除功能已禁用（测试环境）')
  }
}

onMounted(() => {
  console.log('用户信息测试页面已加载')
  
  // 从localStorage获取用户信息
  const storedUserInfo = localStorage.getItem('yeyu_user_info')
  if (storedUserInfo) {
    try {
      const parsed = JSON.parse(storedUserInfo)
      userInfo.value = { ...userInfo.value, ...parsed }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
})
</script>

<style scoped>
.user-info-test {
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

.info-section,
.action-section,
.result-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.info-section h2,
.action-section h2,
.result-section h2 {
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #07C160;
  padding-bottom: 5px;
}

.user-card {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.avatar-section {
  position: relative;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #e0e0e0;
}

.change-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #07C160;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.user-details {
  flex: 1;
  display: grid;
  gap: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-item label {
  width: 80px;
  font-weight: 500;
  color: #666;
}

.detail-item span {
  color: #333;
}

.status.verified {
  color: #28a745;
  font-weight: 500;
}

.status.unverified {
  color: #dc3545;
  font-weight: 500;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  background: #07C160;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 14px;
}

.action-btn:hover {
  background: #06a552;
}

.action-btn.danger {
  background: #dc3545;
}

.action-btn.danger:hover {
  background: #c82333;
}

.result-container {
  min-height: 100px;
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
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.result-status {
  font-weight: 600;
  margin-bottom: 10px;
}

.result-status.success {
  color: #28a745;
}

.result-status.error {
  color: #dc3545;
}

.result-message {
  margin-bottom: 10px;
  color: #333;
}

.result-data {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
}

.result-data pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.no-result {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-result iconify-icon {
  font-size: 32px;
  margin-bottom: 10px;
  opacity: 0.5;
}
</style>
