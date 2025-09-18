<template>
  <div class="identity-verification">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1 class="nav-title">实名认证</h1>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 主要内容 -->
    <div class="content">
      <!-- 认证状态卡片 -->
      <div v-if="identityStatus" class="status-card" :class="statusClass">
        <div class="status-icon">
          <iconify-icon :icon="statusIcon" width="32"></iconify-icon>
        </div>
        <div class="status-info">
          <h3>{{ statusTitle }}</h3>
          <p>{{ identityStatus.message }}</p>
          <div v-if="identityStatus.submittedAt" class="status-time">
            提交时间: {{ formatTime(identityStatus.submittedAt) }}
          </div>
        </div>
      </div>

      <!-- OCR识别区域 -->
      <div v-if="!identityStatus || identityStatus.status === 'not_submitted' || identityStatus.status === 'rejected'" class="ocr-section">
        <h3>身份证识别</h3>
        <p class="ocr-tip">请上传身份证正面照片，系统将自动识别信息</p>
        
        <div class="upload-area" @click="selectImage" :class="{ 'has-image': previewUrl }">
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            @change="handleImageSelect" 
            style="display: none"
          />
          
          <div v-if="!previewUrl" class="upload-placeholder">
            <iconify-icon icon="heroicons:camera" width="48"></iconify-icon>
            <p>点击上传身份证正面照片</p>
          </div>
          
          <div v-else class="preview-area">
            <img :src="previewUrl" alt="身份证预览" class="preview-image" />
            <div class="preview-actions">
              <button @click.stop="retakePhoto" class="action-btn secondary">重新选择</button>
              <button @click.stop="startOCR" class="action-btn primary" :disabled="isProcessing">
                {{ isProcessing ? '识别中...' : '开始识别' }}
              </button>
            </div>
          </div>
        </div>

        <!-- OCR结果 -->
        <div v-if="ocrResult" class="ocr-result">
          <h4>识别结果</h4>
          <div class="result-grid">
            <div class="result-item">
              <label>姓名</label>
              <span>{{ ocrResult.realName }}</span>
            </div>
            <div class="result-item">
              <label>身份证号</label>
              <span>{{ ocrResult.idNumber }}</span>
            </div>
            <div class="result-item">
              <label>性别</label>
              <span>{{ ocrResult.gender }}</span>
            </div>
            <div class="result-item">
              <label>出生日期</label>
              <span>{{ ocrResult.birthDate }}</span>
            </div>
            <div class="result-item full-width">
              <label>地址</label>
              <span>{{ ocrResult.address }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 实名认证表单 -->
      <div v-if="ocrResult && (!identityStatus || identityStatus.status === 'not_submitted' || identityStatus.status === 'rejected')" class="identity-form">
        <h3>确认信息</h3>
        <p class="form-tip">请确认以下信息无误，并补充必要信息</p>
        
        <form @submit.prevent="submitIdentity">
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
              v-model="formData.idNumber" 
              type="text" 
              placeholder="请输入身份证号"
              required
            />
          </div>
          
          <div class="form-group">
            <label>父亲姓名 *</label>
            <input
              v-model="formData.fatherName"
              type="text"
              placeholder="请输入父亲姓名（用于族谱验证）"
              required
            />
          </div>

          <div class="form-group">
            <label>母亲姓名 *</label>
            <input
              v-model="formData.motherName"
              type="text"
              placeholder="请输入母亲姓名（用于族谱验证）"
              required
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              {{ isSubmitting ? '提交中...' : '提交认证' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()

// 响应式数据
const identityStatus = ref(null)
const previewUrl = ref('')
const selectedFile = ref(null)
const ocrResult = ref(null)
const isProcessing = ref(false)
const isSubmitting = ref(false)
const loadingText = ref('')

// 表单数据
const formData = reactive({
  realName: '',
  idNumber: '',
  fatherName: '',
  motherName: ''
})

// 计算属性
const statusClass = computed(() => {
  if (!identityStatus.value) return ''
  switch (identityStatus.value.status) {
    case 'pending': return 'status-pending'
    case 'verified': return 'status-verified'
    case 'rejected': return 'status-rejected'
    default: return ''
  }
})

const statusIcon = computed(() => {
  if (!identityStatus.value) return 'heroicons:identification'
  switch (identityStatus.value.status) {
    case 'pending': return 'heroicons:clock'
    case 'verified': return 'heroicons:check-circle'
    case 'rejected': return 'heroicons:x-circle'
    default: return 'heroicons:identification'
  }
})

const statusTitle = computed(() => {
  if (!identityStatus.value) return '未认证'
  switch (identityStatus.value.status) {
    case 'pending': return '审核中'
    case 'verified': return '已认证'
    case 'rejected': return '认证失败'
    default: return '未认证'
  }
})

// 方法
const goBack = () => {
  // 检查用户是否已实名认证
  const authStore = useAuthStore()
  const user = authStore.user

  if (!user || !user.verified) {
    // 未实名认证的用户返回到登录页面
    router.push('/login')
  } else {
    // 已实名认证的用户正常返回
    router.back()
  }
}

const formatTime = (timeStr) => {
  return new Date(timeStr).toLocaleString('zh-CN')
}

// 获取认证状态
const getIdentityStatus = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const response = await fetch('/api/identity/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        identityStatus.value = result.data
      }
    }
  } catch (error) {
    console.error('获取认证状态失败:', error)
  }
}

// 选择图片
const fileInput = ref(null)
const selectImage = () => {
  fileInput.value?.click()
}

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file
  
  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const retakePhoto = () => {
  selectedFile.value = null
  previewUrl.value = ''
  ocrResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// OCR识别
const startOCR = async () => {
  if (!selectedFile.value) return

  isProcessing.value = true
  loadingText.value = '正在识别身份证信息...'

  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)

    const response = await fetch('/api/ocr/idcard', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      ocrResult.value = result.data
      
      // 自动填充表单
      Object.assign(formData, {
        realName: result.data.realName || '',
        idNumber: result.data.idNumber || '',
        gender: result.data.gender === '男' ? 'male' : result.data.gender === '女' ? 'female' : '',
        birthDate: result.data.birthDate || '',
        address: result.data.address || ''
      })
      
      console.log('✅ OCR识别成功')
    } else {
      throw new Error(result.message || 'OCR识别失败')
    }
  } catch (error) {
    console.error('❌ OCR识别失败:', error)
    alert('身份证识别失败: ' + error.message)
  } finally {
    isProcessing.value = false
  }
}

// 提交实名认证
const submitIdentity = async () => {
  if (!formData.realName || !formData.idNumber || !formData.fatherName || !formData.motherName) {
    alert('请填写所有必填项')
    return
  }

  // 验证姓氏匹配
  const userSurname = formData.realName.charAt(0)
  const fatherSurname = formData.fatherName.charAt(0)

  if (userSurname !== fatherSurname) {
    alert('身份证姓氏必须与父亲姓氏相同')
    return
  }

  isSubmitting.value = true

  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const response = await fetch('/api/users/identity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })

    const result = await response.json()
    
    if (result.success) {
      alert('实名认证提交成功，请等待审核')
      await getIdentityStatus() // 刷新状态
    } else {
      throw new Error(result.message || '提交失败')
    }
  } catch (error) {
    console.error('❌ 提交实名认证失败:', error)
    alert('提交失败: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

// 生命周期
onMounted(() => {
  getIdentityStatus()
})
</script>

<style scoped>
.identity-verification {
  min-height: 100vh;
  background: #f5f5f5;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.nav-placeholder {
  width: 40px;
}

.content {
  padding: 16px;
}

.status-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-card.status-pending {
  border-left: 4px solid #ffa500;
}

.status-card.status-verified {
  border-left: 4px solid #07c160;
}

.status-card.status-rejected {
  border-left: 4px solid #ff4757;
}

.status-icon {
  color: #666;
}

.status-pending .status-icon {
  color: #ffa500;
}

.status-verified .status-icon {
  color: #07c160;
}

.status-rejected .status-icon {
  color: #ff4757;
}

.status-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.status-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.status-time {
  font-size: 12px;
  color: #999;
}

.ocr-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.ocr-section h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.ocr-tip {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #07c160;
  background: #f8f9fa;
}

.upload-area.has-image {
  padding: 0;
  border: none;
}

.upload-placeholder {
  color: #999;
}

.upload-placeholder iconify-icon {
  margin-bottom: 12px;
  color: #ccc;
}

.preview-area {
  position: relative;
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
}

.preview-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.primary {
  background: #07c160;
  color: white;
}

.action-btn.primary:hover {
  background: #06ad56;
}

.action-btn.primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #333;
}

.action-btn.secondary:hover {
  background: #e5e5e5;
}

.ocr-result {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.ocr-result h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item.full-width {
  grid-column: 1 / -1;
}

.result-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.result-item span {
  font-size: 14px;
  color: #333;
}

.identity-form {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.identity-form h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.form-tip {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #07c160;
}

.form-actions {
  margin-top: 24px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover {
  background: #06ad56;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  min-width: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
