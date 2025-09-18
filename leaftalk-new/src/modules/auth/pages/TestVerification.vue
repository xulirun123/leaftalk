<template>
  <div class="test-verification">
    <div class="header">
      <h2>🔍 用户认证状态测试</h2>
    </div>
    
    <div class="content">
      <div class="section">
        <h3>当前用户信息</h3>
        <div class="info-card" v-if="currentUser">
          <p><strong>用户ID:</strong> {{ currentUser.id }}</p>
          <p><strong>叶语号:</strong> {{ currentUser.yeyu_id }}</p>
          <p><strong>用户名:</strong> {{ currentUser.username }}</p>
          <p><strong>昵称:</strong> {{ currentUser.nickname }}</p>
          <p><strong>手机号:</strong> {{ currentUser.phone }}</p>
        </div>
        <div v-else class="info-card">
          <p>未登录</p>
        </div>
      </div>

      <div class="section">
        <h3>认证状态检查</h3>
        <button @click="checkVerificationStatus" :disabled="loading" class="check-btn">
          {{ loading ? '检查中...' : '检查认证状态' }}
        </button>
        
        <div class="info-card" v-if="verificationStatus">
          <p><strong>认证状态:</strong> 
            <span :class="verificationStatus.isVerified ? 'verified' : 'unverified'">
              {{ verificationStatus.verificationStatusText }}
            </span>
          </p>
          <p><strong>真实姓名:</strong> {{ verificationStatus.realName || '未填写' }}</p>
          <p><strong>身份证:</strong> {{ verificationStatus.idCard || '未填写' }}</p>
          <p><strong>性别:</strong> {{ verificationStatus.gender || '未知' }}</p>
          <p><strong>出生日期:</strong> {{ verificationStatus.birthDate ? new Date(verificationStatus.birthDate).toLocaleDateString() : '未填写' }}</p>
          <p><strong>地区:</strong> {{ verificationStatus.region || '未填写' }}</p>
          <p><strong>父亲姓名:</strong> {{ verificationStatus.fatherName || '未填写' }}</p>
          <p><strong>母亲姓名:</strong> {{ verificationStatus.motherName || '未填写' }}</p>
        </div>
      </div>

      <div class="section">
        <h3>测试用户列表</h3>
        <div class="user-list">
          <div v-for="user in testUsers" :key="user.id" class="user-card">
            <h4>{{ user.nickname }}</h4>
            <p>叶语号: {{ user.yeyu_id }}</p>
            <p>手机号: {{ user.phone }}</p>
            <button @click="checkUserVerification(user.id)" class="check-user-btn">
              检查此用户认证状态
            </button>
          </div>
        </div>
      </div>

      <div class="section" v-if="selectedUserStatus">
        <h3>选中用户认证状态</h3>
        <div class="info-card">
          <p><strong>用户:</strong> {{ selectedUserStatus.nickname }}</p>
          <p><strong>认证状态:</strong> 
            <span :class="selectedUserStatus.isVerified ? 'verified' : 'unverified'">
              {{ selectedUserStatus.verificationStatusText }}
            </span>
          </p>
          <p><strong>真实姓名:</strong> {{ selectedUserStatus.realName || '未填写' }}</p>
          <p><strong>身份证:</strong> {{ selectedUserStatus.idCard || '未填写' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(false)
const currentUser = ref<any>(null)
const verificationStatus = ref<any>(null)
const selectedUserStatus = ref<any>(null)
const testUsers = ref<any[]>([])

// 获取当前用户信息
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('yeyu_user_info')
  if (userInfo) {
    try {
      currentUser.value = JSON.parse(userInfo)
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
}

// 获取测试用户列表
const getTestUsers = async () => {
  try {
    const response = await fetch('http://localhost:8893/api/dev/users')
    const result = await response.json()
    if (result.success) {
      testUsers.value = result.data
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

// 检查当前用户认证状态
const checkVerificationStatus = async () => {
  if (!currentUser.value) {
    alert('请先登录')
    return
  }

  loading.value = true
  try {
    const response = await fetch(`http://localhost:8893/api/dev/user-verification/${currentUser.value.id}`)
    const result = await response.json()
    
    if (result.success) {
      verificationStatus.value = result.data
      console.log('认证状态:', result.data)
    } else {
      alert('检查失败: ' + result.error)
    }
  } catch (error) {
    console.error('检查认证状态失败:', error)
    alert('检查失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 检查指定用户认证状态
const checkUserVerification = async (userId: number) => {
  try {
    const response = await fetch(`http://localhost:8893/api/dev/user-verification/${userId}`)
    const result = await response.json()
    
    if (result.success) {
      selectedUserStatus.value = result.data
      console.log('用户认证状态:', result.data)
    } else {
      alert('检查失败: ' + result.error)
    }
  } catch (error) {
    console.error('检查用户认证状态失败:', error)
    alert('检查失败: ' + error.message)
  }
}

onMounted(() => {
  getCurrentUser()
  getTestUsers()
})
</script>

<style scoped>
.test-verification {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.section h3 {
  margin-top: 0;
  color: #333;
}

.info-card {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-top: 10px;
}

.info-card p {
  margin: 8px 0;
}

.check-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.check-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.verified {
  color: #07C160;
  font-weight: bold;
}

.unverified {
  color: #ff4444;
  font-weight: bold;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.user-card {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.user-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.user-card p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.check-user-btn {
  background: #1989fa;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 10px;
}

.check-user-btn:hover {
  background: #0d7ce8;
}
</style>
