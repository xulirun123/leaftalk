<template>
  <div class="verify-identity">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1 class="nav-title">实名认证</h1>
    </div>

    <!-- 主要内容 -->
    <div class="content">
      <!-- 认证说明 -->
      <div class="info-section">
        <div class="info-icon">
          <iconify-icon icon="heroicons:identification" width="48" style="color: #07C160;"></iconify-icon>
        </div>
        <h2>完善实名信息</h2>
        <p>为了保障您的账户安全，请完成实名认证</p>
      </div>

      <!-- 认证表单 -->
      <div class="form-section">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label>真实姓名 *</label>
            <input 
              v-model="formData.realName" 
              type="text" 
              placeholder="请输入真实姓名"
              required
            />
          </div>

          <div class="form-group">
            <label>身份证号 *</label>
            <input 
              v-model="formData.idCard" 
              type="text" 
              placeholder="请输入18位身份证号"
              maxlength="18"
              required
            />
          </div>

          <div class="form-group">
            <label>父亲姓名 *</label>
            <input 
              v-model="formData.fatherName" 
              type="text" 
              placeholder="请输入父亲姓名"
              required
            />
          </div>

          <div class="form-group">
            <label>母亲姓名 *</label>
            <input 
              v-model="formData.motherName" 
              type="text" 
              placeholder="请输入母亲姓名"
              required
            />
          </div>

          <div class="form-group">
            <label>手机号码</label>
            <input 
              v-model="formData.phone" 
              type="tel" 
              placeholder="请输入手机号码"
            />
          </div>

          <!-- 提交按钮 -->
          <button 
            type="submit" 
            class="submit-btn"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '提交中...' : '提交认证' }}
          </button>
        </form>
      </div>

      <!-- 温馨提示 -->
      <div class="tips-section">
        <h3>温馨提示</h3>
        <ul>
          <li>请确保填写的信息真实有效</li>
          <li>身份证号将用于身份验证</li>
          <li>父母姓名用于族谱关联</li>
          <li>认证信息提交后不可修改</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// 表单数据
const formData = reactive({
  realName: '',
  idCard: '',
  fatherName: '',
  motherName: '',
  phone: ''
})

const isSubmitting = ref(false)

// 返回上一页
const goBack = () => {
  router.back()
}

// 验证身份证号
const validateIdCard = (idCard: string): boolean => {
  const regex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
  return regex.test(idCard)
}

// 提交表单
const submitForm = async () => {
  // 验证必填字段
  if (!formData.realName || !formData.idCard || !formData.fatherName || !formData.motherName) {
    appStore.showToast('请填写所有必填信息', 'error')
    return
  }

  // 验证身份证号
  if (!validateIdCard(formData.idCard)) {
    appStore.showToast('请输入正确的身份证号', 'error')
    return
  }

  // 验证姓氏匹配
  if (formData.realName.charAt(0) !== formData.fatherName.charAt(0)) {
    appStore.showToast('您的姓氏应与父亲姓氏一致', 'error')
    return
  }

  isSubmitting.value = true

  try {
    // 模拟提交认证信息
    console.log('🔐 提交实名认证信息:', formData)
    
    // 这里应该调用后端API
    // const response = await authAPI.submitIdentityVerification(formData)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 更新用户状态
    const currentUser = authStore.user
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        real_name: formData.realName,
        id_card: formData.idCard,
        verified: true
      }
      authStore.setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }

    appStore.showToast('实名认证提交成功！', 'success')
    
    // 跳转到主页
    setTimeout(() => {
      router.push('/')
    }, 1500)

  } catch (error) {
    console.error('❌ 实名认证提交失败:', error)
    appStore.showToast('提交失败，请重试', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.verify-identity {
  min-height: 100vh;
  background: #f5f5f5;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #07C160;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.content {
  padding: 20px 16px;
}

.info-section {
  text-align: center;
  padding: 30px 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
}

.info-icon {
  margin-bottom: 16px;
}

.info-section h2 {
  font-size: 20px;
  color: #333;
  margin: 0 0 8px 0;
}

.info-section p {
  color: #666;
  margin: 0;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #07C160;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover {
  background: #06AD56;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.tips-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.tips-section h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 12px 0;
}

.tips-section ul {
  margin: 0;
  padding-left: 20px;
}

.tips-section li {
  color: #666;
  margin-bottom: 8px;
  font-size: 14px;
}
</style>
