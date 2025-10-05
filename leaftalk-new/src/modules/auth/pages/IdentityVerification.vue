<template>
  <div class="identity-container">
    <!-- 主要内容 -->
    <div class="content">
      <!-- 步骤指示器 -->
      <div class="steps">
        <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-text">上传身份证</div>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-text">完成认证</div>
        </div>
      </div>

      <!-- 步骤1: 上传身份证 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="upload-section">
          <h3>上传身份证照片</h3>
          <p class="tip">请上传身份证正面照片，确保信息清晰可见</p>
          
          <div class="upload-area">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              capture="environment"
              @change="handleFileSelect"
              style="display: none"
            />

            <div v-if="!selectedFile" class="upload-placeholder">
              <iconify-icon icon="heroicons:camera" width="48" class="upload-icon"></iconify-icon>
              <p>请上传身份证照片</p>
              <p class="upload-hint">请选择拍照方式</p>

              <div class="upload-buttons">
                <button @click="takePhoto" class="upload-btn camera" title="拍摄身份证照片" aria-label="拍摄身份证照片">
                  <iconify-icon icon="heroicons:camera" width="20"></iconify-icon>
                  拍照
                </button>
                <button @click="selectFromAlbum" class="upload-btn album" title="从相册选择身份证照片" aria-label="从相册选择身份证照片">
                  <iconify-icon icon="heroicons:photo" width="20"></iconify-icon>
                  相册
                </button>
              </div>

              <!-- 隐私说明 -->
              <div class="privacy-notice">
                <div class="notice-content">
                  <iconify-icon icon="heroicons:shield-check" width="20" class="notice-icon"></iconify-icon>
                  <div class="notice-text">
                    <p><strong>身份信息用途说明</strong></p>
                    <p>身份信息仅供实名注册族谱使用，不会泄露隐私。</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="preview-area">
              <img :src="previewUrl" alt="身份证预览" class="preview-image" />
              
              <!-- OCR处理状态 -->
              <div v-if="isProcessing" class="preview-status processing-status">
                <iconify-icon icon="heroicons:arrow-path" width="16" class="spinning"></iconify-icon>
                正在识别身份证信息...
              </div>
              
              <div v-else-if="ocrSuccess" class="preview-status success-status">
                <iconify-icon icon="heroicons:check-circle" width="16"></iconify-icon>
                身份证识别成功
              </div>
              
              <div v-else-if="ocrFailed" class="preview-status error-status">
                <iconify-icon icon="heroicons:exclamation-triangle" width="16"></iconify-icon>
                识别失败，请重新上传
              </div>

              <div class="preview-actions">
                <button @click="retakePhoto" class="action-btn secondary">重新上传</button>
                <button v-if="ocrSuccess" @click="currentStep = 2" class="action-btn primary">下一步</button>
                <button v-else-if="ocrFailed" @click="startOCR" class="action-btn primary">重新识别</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2: 填写父母信息 -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="form-section">
          <h3>填写父母信息</h3>
          <p class="form-tip">请填写父母姓名和婚姻状况信息</p>

          <div class="form-group">
            <label>父亲姓名 <span class="required">*</span></label>
            <input
              v-model="identityData.fatherName"
              type="text"
              class="form-input"
              placeholder="请输入父亲姓名"
            />
          </div>

          <div class="form-group">
            <label>母亲姓名 <span class="required">*</span></label>
            <input
              v-model="identityData.motherName"
              type="text"
              class="form-input"
              placeholder="请输入母亲姓名"
            />
          </div>



          <div class="form-group">
            <label>婚姻状况</label>
            <select v-model="identityData.maritalStatus" class="form-input" title="选择婚姻状况" aria-label="婚姻状况选择">
              <option value="single">未婚</option>
              <option value="married">已婚</option>
              <option value="divorced">离异</option>
              <option value="widowed">丧偶</option>
            </select>
          </div>

          <div v-if="['married', 'divorced', 'widowed'].includes(identityData.maritalStatus)" class="form-group">
            <label>配偶姓名 <span class="required">*</span></label>
            <input
              v-model="identityData.spouseName"
              type="text"
              class="form-input"
              placeholder="请输入配偶姓名"
            />
          </div>

          <div class="form-actions">
            <button @click="currentStep = 1" class="action-btn secondary">上一步</button>
            <button @click="submitIdentity" class="action-btn primary" :disabled="!canFillParents || isProcessing">
              {{ isProcessing ? '处理中...' : '确认识别' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 步骤3: 完成认证 -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="success-section">
          <iconify-icon icon="heroicons:check-circle" width="64" class="success-icon"></iconify-icon>
          <h3>实名认证成功！</h3>
          <p>您的身份信息已通过验证并录入族谱</p>

          <div class="action-buttons">
            <button @click="goToHome" class="action-btn primary">
              {{ sessionStorage.getItem('verification_return_path') ? '返回' : '进入叶语首页' }}
              <iconify-icon icon="heroicons:arrow-right" width="16"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 相机拍摄界面 -->
    <div v-if="showCamera" class="camera-overlay">
      <div class="camera-container">
        <div class="camera-header">
          <button @click="stopCamera" class="camera-close">
            <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
          </button>
          <h2>拍摄身份证</h2>
          <div></div>
        </div>
        
        <div class="camera-content">
          <video ref="videoRef" class="camera-video" autoplay playsinline></video>
          <div class="camera-guide">
            <div class="guide-frame"></div>
            <p class="guide-text">请将身份证放在框内</p>
          </div>
        </div>
        
        <div class="camera-controls">
          <button @click="stopCamera" class="camera-btn cancel">取消</button>
          <button @click="capturePhoto" class="camera-btn capture">
            <iconify-icon icon="heroicons:camera" width="32"></iconify-icon>
          </button>
          <div class="camera-btn-placeholder"></div>
        </div>
      </div>
      
      <canvas ref="canvasRef" style="display: none;"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const currentStep = ref(1)
const selectedFile = ref(null)
const previewUrl = ref('')
const isProcessing = ref(false)
const fileInput = ref(null)

// 相机拍摄相关
const showCamera = ref(false)
const videoRef = ref(null)
const canvasRef = ref(null)
const stream = ref(null)

// OCR识别状态
const ocrSuccess = ref(false)
const ocrFailed = ref(false)

// 自动跳转倒计时
const autoRedirectCountdown = ref(2)
const autoRedirectText = ref('')

// 身份信息
const identityData = ref({
  name: '',
  idNumber: '',
  gender: '',
  birthDate: '',
  address: '',
  // 新增族谱相关信息
  fatherName: '',
  motherName: '',
  maritalStatus: 'single', // single, married, divorced, widowed
  spouseName: ''
})



// 计算属性
const canSubmit = computed(() => {
  const basic = identityData.value.name &&
                identityData.value.idNumber &&
                identityData.value.fatherName &&
                identityData.value.motherName

  // 如果已婚、离异或丧偶，需要填写配偶姓名
  const needsSpouseName = ['married', 'divorced', 'widowed'].includes(identityData.value.maritalStatus)
  if (needsSpouseName) {
    return basic && identityData.value.spouseName
  }

  return basic
})

// 父母信息填写验证
const canFillParents = computed(() => {
  const basic = identityData.value.fatherName && identityData.value.motherName

  // 如果已婚、离异或丧偶，需要填写配偶姓名
  const needsSpouseName = ['married', 'divorced', 'widowed'].includes(identityData.value.maritalStatus)
  if (needsSpouseName) {
    return basic && identityData.value.spouseName
  }

  return basic
})

// 跳转到确认步骤
const goToConfirmStep = () => {
  if (canFillParents.value) {
    currentStep.value = 3
  }
}

// 获取婚姻状况文本
const getMaritalStatusText = (status) => {
  const statusMap = {
    single: '未婚',
    married: '已婚',
    divorced: '离异',
    widowed: '丧偶'
  }
  return statusMap[status] || status
}

// 跳转到首页或返回原页面
const goToHome = () => {
  // 检查是否有返回路径
  const returnPath = sessionStorage.getItem('verification_return_path')

  if (returnPath) {
    sessionStorage.removeItem('verification_return_path')
    router.push(returnPath)
  } else {
    router.push('/')
  }
}

// 安全的Toast显示
const safeShowToast = async (message, type = 'info') => {
  try {
    if (appStore && typeof appStore.showToast === 'function') {
      appStore.showToast(message, type)
    } else {
      console.log(`Toast (${type}): ${message}`)
      const { showAlert } = await import('../utils/dialog')
      await showAlert(message, '提示')
    }
  } catch (error) {
    console.error('Toast显示失败:', error)
    const { showAlert } = await import('../utils/dialog')
    await showAlert(message, '提示')
  }
}

// 移除goBack函数，使用全局导航栏的返回功能



// 真正的相机拍摄功能
const takePhoto = async () => {
  try {
    // 检查是否支持相机API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // 降级到文件选择
      const cameraInput = document.createElement('input')
      cameraInput.type = 'file'
      cameraInput.accept = 'image/*'
      cameraInput.capture = 'environment'
      cameraInput.style.display = 'none'

      cameraInput.onchange = (event) => {
        const file = event.target.files[0]
        if (file) {
          handleFileSelection(file)
        }
        document.body.removeChild(cameraInput)
      }

      document.body.appendChild(cameraInput)
      cameraInput.click()
      return
    }

    // 启动相机拍摄
    startCameraCapture()

  } catch (error) {
    console.error('相机启动失败:', error)
    safeShowToast('相机启动失败，请使用相册选择', 'error')
  }
}

// 从相册选择
const selectFromAlbum = () => {
  // 创建一个专门用于相册选择的input元素
  const albumInput = document.createElement('input')
  albumInput.type = 'file'
  albumInput.accept = 'image/*'
  albumInput.style.display = 'none'

  albumInput.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      handleFileSelection(file)
    }
    document.body.removeChild(albumInput)
  }

  document.body.appendChild(albumInput)
  albumInput.click()
}

// 统一的文件处理函数
const handleFileSelection = (file) => {
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    safeShowToast('请选择图片文件', 'error')
    return
  }

  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    safeShowToast('图片大小不能超过5MB', 'error')
    return
  }

  selectedFile.value = file

  // 创建预览URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)

  // 重置OCR状态
  ocrSuccess.value = false
  ocrFailed.value = false

  console.log('📷 文件选择成功:', {
    name: file.name,
    size: file.size,
    type: file.type
  })

  // 自动开始OCR识别
  setTimeout(() => {
    startOCR()
  }, 500)
}

// 处理文件选择（兼容原有的input）
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  handleFileSelection(file)
}

// 重新拍摄
const retakePhoto = () => {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }

  // 重置OCR状态
  ocrSuccess.value = false
  ocrFailed.value = false
  isProcessing.value = false

  // 重置身份信息（保留用户输入的父母姓名等）
  identityData.value.name = ''
  identityData.value.idNumber = ''
  identityData.value.gender = ''
  identityData.value.birthDate = ''
  identityData.value.address = ''
}

// 开始OCR识别
const startOCR = async () => {
  console.log('🚀 startOCR函数被调用')
  console.log('🚀 selectedFile:', selectedFile.value)

  if (!selectedFile.value) {
    console.log('❌ 没有选择文件，退出OCR')
    return
  }

  isProcessing.value = true
  ocrSuccess.value = false
  ocrFailed.value = false

  try {
    console.log('📷 开始OCR识别...')
    console.log('🔍 文件信息:', {
      name: selectedFile.value.name,
      size: selectedFile.value.size,
      type: selectedFile.value.type
    })

    // 直接调用后端OCR API，使用正确的字段名
    const formData = new FormData()
    formData.append('image', selectedFile.value) // production-server.js期望的字段名

    console.log('🔍 调用OCR API: http://localhost:8893/api/ocr/idcard')
    console.log('🔍 文件字段名: image')

    const response = await fetch('http://localhost:8893/api/ocr/idcard', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      },
      body: formData
    })

    console.log('🔍 响应状态:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OCR API错误响应:', errorText)
      throw new Error(`OCR API调用失败: HTTP ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    console.log('✅ OCR识别结果:', result)

    console.log('📝 OCR识别结果:', result)

    if (result.success && result.data) {
      // 填充识别结果
      identityData.value.name = result.data.name
      identityData.value.idNumber = result.data.idNumber
      identityData.value.gender = result.data.gender
      identityData.value.birthDate = result.data.birthDate
      identityData.value.address = result.data.address

      ocrSuccess.value = true
      safeShowToast('身份证识别成功', 'success')

      // 自动跳转到填写父母信息步骤
      console.log('🔄 自动跳转到填写父母信息步骤')
      currentStep.value = 2

    } else {
      throw new Error(result.message || '识别失败')
    }

  } catch (error) {
    console.error('❌ OCR识别失败:', error)
    ocrFailed.value = true

    // 简单的错误处理
    let errorMessage = '身份证识别失败，请重新上传清晰的身份证照片'

    if (error.message.includes('Failed to fetch')) {
      errorMessage = '网络连接失败，请检查后端服务是否启动'
    } else if (error.message.includes('HTTP 400')) {
      errorMessage = '图片格式不正确，请上传JPG或PNG格式的身份证照片'
    } else if (error.message.includes('HTTP 500')) {
      errorMessage = '服务器内部错误，请稍后重试'
    } else if (error.message.includes('格式')) {
      errorMessage = '图片格式不支持，请上传JPG或PNG格式'
    } else if (error.message.includes('清晰')) {
      errorMessage = '图片不够清晰，请重新拍摄'
    }

    safeShowToast(errorMessage, 'error')
  } finally {
    isProcessing.value = false
  }
}

// 提交身份认证
const submitIdentity = async () => {
  if (!canFillParents.value) return

  try {
    console.log('📝 提交身份认证...')
    isProcessing.value = true

    // 1. 检查当前用户是否已经认证过
    const token = localStorage.getItem('yeyu_auth_token')
    if (token) {
      try {
        const userCheckResponse = await fetch('http://localhost:8893/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const userResult = await userCheckResponse.json()

        if (userResult.success && userResult.data && userResult.data.verified) {
          safeShowToast('您已完成实名认证，无需重复认证', 'warning')
          isProcessing.value = false
          router.push('/')
          return
        }
      } catch (error) {
        console.log('🔍 用户状态检查失败，继续认证流程')
      }
    }

    // 2. 检查身份证号是否已被其他用户使用
    try {
      const idCheckResponse = await fetch(`http://localhost:8893/api/users/check-identity?idNumber=${encodeURIComponent(identityData.value.idNumber)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const idCheckResult = await idCheckResponse.json()

      if (idCheckResult.success && idCheckResult.data && idCheckResult.data.exists) {
        safeShowToast('该身份证号已被其他用户使用，请联系客服', 'error')
        isProcessing.value = false
        return
      }
    } catch (error) {
      console.log('🔍 身份证检查失败，继续认证流程')
    }

    // 3. 验证姓氏匹配
    const userSurname = identityData.value.name.charAt(0)
    const fatherSurname = identityData.value.fatherName.charAt(0)
    const motherSurname = identityData.value.motherName.charAt(0)

    if (userSurname !== fatherSurname && userSurname !== motherSurname) {
      safeShowToast('身份证姓氏必须与父母任意一方姓氏相同', 'error')
      isProcessing.value = false
      return
    }

    console.log('✅ 姓氏验证通过:', userSurname)

    // 转换gender字段为英文
    const convertGender = (gender) => {
      console.log('🔍 原始gender值:', gender, '类型:', typeof gender)
      if (gender === '男' || gender === 'male') return 'male'
      if (gender === '女' || gender === 'female') return 'female'
      console.log('⚠️ 未识别的gender值，使用默认值male')
      return 'male' // 默认值
    }

    // 检查是否有登录token
    const authToken = localStorage.getItem('yeyu_auth_token')
    console.log('🔍 检查token:', authToken ? '存在' : '不存在')

    if (!authToken) {
      // 如果没有token，先创建一个临时用户
      console.log('⚠️ 没有登录token，创建临时用户')
      const tempUserResponse = await fetch('/api/auth/temp-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (tempUserResponse.ok) {
        const tempUserResult = await tempUserResponse.json()
        if (tempUserResult.success) {
          localStorage.setItem('yeyu_auth_token', tempUserResult.token)
          console.log('✅ 临时用户创建成功')
        }
      }
    }

    // 先尝试代理，失败则直接调用后端
    let response
    let result

    try {
      response = await fetch('http://localhost:8893/api/users/identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token')}`
        },
        body: JSON.stringify({
          ...identityData.value,
          realName: identityData.value.name, // 后端期望的字段名
          gender: convertGender(identityData.value.gender), // 转换gender字段
          // 添加额外的验证信息
          uploadedFile: selectedFile.value ? selectedFile.value.name : null,
          verificationTime: new Date().toISOString()
        })
      })
      result = await response.json()
    } catch (proxyError) {
      console.log('🔄 代理失败，尝试直接调用后端API')
      response = await fetch('http://localhost:8893/api/users/identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token')}`
        },
        body: JSON.stringify({
          ...identityData.value,
          realName: identityData.value.name, // 后端期望的字段名
          gender: convertGender(identityData.value.gender), // 转换gender字段
          // 添加额外的验证信息
          uploadedFile: selectedFile.value ? selectedFile.value.name : null,
          verificationTime: new Date().toISOString()
        })
      })
      result = await response.json()
    }

    console.log('📝 身份认证结果:', result)
    console.log('🔍 响应状态码:', response.status)
    console.log('🔍 响应headers:', Object.fromEntries(response.headers.entries()))

    if (result.success) {
      // 更新本地用户信息
      const userInfo = JSON.parse(localStorage.getItem('yeyu_user_info') || '{}')
      userInfo.verified = true
      userInfo.realName = identityData.value.name
      userInfo.idNumber = identityData.value.idNumber
      userInfo.address = identityData.value.address
      userInfo.fatherName = identityData.value.fatherName
      userInfo.motherName = identityData.value.motherName
      userInfo.maritalStatus = identityData.value.maritalStatus
      userInfo.spouseName = identityData.value.spouseName
      userInfo.spouseStatus = identityData.value.spouseStatus
      localStorage.setItem('yeyu_user_info', JSON.stringify(userInfo))

      // 更新store
      if (authStore) {
        authStore.setUser(userInfo)
      }

      safeShowToast('实名认证成功，正在创建族谱...', 'success')

      // 自动创建族谱
      try {
        console.log('🌳 开始自动创建族谱...')

        const genealogyResponse = await fetch('/api/genealogy/auto-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token')}`
          },
          body: JSON.stringify({
            surname: userSurname,
            fullName: identityData.value.name,
            gender: identityData.value.gender,
            address: identityData.value.address,
            fatherName: identityData.value.fatherName,
            motherName: identityData.value.motherName,
            maritalStatus: identityData.value.maritalStatus,
            spouseName: identityData.value.spouseName
          })
        })

        const genealogyResult = await genealogyResponse.json()

        if (genealogyResult.success) {
          console.log('✅ 族谱创建成功:', genealogyResult)
          safeShowToast('族谱创建成功！', 'success')
        } else {
          console.warn('⚠️ 族谱创建失败:', genealogyResult.message)
          safeShowToast('族谱创建失败，请稍后手动创建', 'warning')
        }
      } catch (genealogyError) {
        console.error('❌ 族谱创建异常:', genealogyError)
        safeShowToast('族谱创建失败，请稍后手动创建', 'warning')
      }

      currentStep.value = 3

      // 更新身份认证状态缓存
      try {
        const { useIdentityStore } = await import('../stores/identity')
        const identityStore = useIdentityStore()
        identityStore.updateIdentityStatus({
          verified: true,
          name: identityData.value.name,
          gender: identityData.value.gender,
          birthDate: identityData.value.birthDate,
          address: identityData.value.address,
          fatherName: identityData.value.fatherName,
          motherName: identityData.value.motherName,
          idNumber: identityData.value.idNumber,
          verifiedAt: new Date().toISOString()
        })
        console.log('✅ 身份认证状态缓存已更新')
      } catch (error) {
        console.warn('⚠️ 更新身份认证状态缓存失败:', error)
      }

      // 自动创建族谱
      await createOrJoinGenealogy()

      // 开始自动跳转倒计时
      startAutoRedirect()

    } else {
      console.error('❌ 身份认证失败详情:', {
        status: response.status,
        message: result.message,
        error: result.error,
        data: result.data,
        fullResult: result
      })
      throw new Error(result.message || '身份认证失败')
    }

  } catch (error) {
    console.error('❌ 身份认证失败:', error)

    // 如果是认证相关错误，提示用户重新登录
    if (error.message.includes('认证令牌无效') || error.message.includes('未提供认证令牌')) {
      safeShowToast('登录已过期，请重新登录', 'error')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      safeShowToast(error.message || '身份认证失败，请重试', 'error')
    }
  }
}

// 创建或加入族谱
const createOrJoinGenealogy = async () => {
  try {
    console.log('🌳 自动创建族谱...')

    const surname = identityData.value.name.charAt(0)

    // 先尝试代理，失败则直接调用后端
    let response
    let result

    try {
      response = await fetch('http://localhost:8893/api/genealogy/create-or-join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token')}`
        },
        body: JSON.stringify({
          surname: surname,
          fullName: identityData.value.name,
          gender: identityData.value.gender || 'other',
          birthDate: identityData.value.birthDate || '',
          address: identityData.value.address || '',
          fatherName: identityData.value.fatherName || '',
          motherName: identityData.value.motherName || '',
          idNumber: identityData.value.idNumber || ''
        })
      })
      result = await response.json()
    } catch (proxyError) {
      console.log('🔄 代理失败，尝试直接调用后端API')
      response = await fetch('http://localhost:8893/api/genealogies/auto-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token')}`
        },
        body: JSON.stringify({
          surname: surname,
          fullName: identityData.value.name,
          gender: identityData.value.gender || 'other',
          birthDate: identityData.value.birthDate || '',
          address: identityData.value.address || '',
          fatherName: identityData.value.fatherName || '',
          motherName: identityData.value.motherName || '',
          idNumber: identityData.value.idNumber || ''
        })
      })
      result = await response.json()
    }

    console.log('🌳 族谱创建结果:', result)

    if (result.success) {
      console.log('✅ 族谱创建成功')
    } else {
      console.warn('⚠️ 族谱创建失败:', result.message)
    }

  } catch (error) {
    console.error('❌ 族谱创建失败:', error)
  }
}

// 开始自动跳转倒计时
const startAutoRedirect = () => {
  autoRedirectCountdown.value = 3
  autoRedirectText.value = `${autoRedirectCountdown.value}秒后自动进入主页`

  const timer = setInterval(() => {
    autoRedirectCountdown.value--
    if (autoRedirectCountdown.value > 0) {
      autoRedirectText.value = `${autoRedirectCountdown.value}秒后自动进入主页`
    } else {
      autoRedirectText.value = '正在跳转...'
      clearInterval(timer)

      // 延迟一下确保状态更新完成
      setTimeout(async () => {
        try {
          console.log('🔄 开始跳转到主页...')
          await router.push('/')
          console.log('✅ 跳转到主页成功')
        } catch (error) {
          console.error('❌ 跳转到主页失败:', error)
          // 如果跳转失败，尝试直接修改location
          window.location.href = '/'
        }
      }, 500)
    }
  }, 1000)
}

// 启动相机拍摄
const startCameraCapture = async () => {
  try {
    showCamera.value = true

    // 请求相机权限
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // 后置摄像头
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })

    // 等待DOM更新
    await nextTick()

    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      videoRef.value.play()
    }

  } catch (error) {
    console.error('相机启动失败:', error)
    safeShowToast('无法访问相机，请检查权限设置', 'error')
    showCamera.value = false
  }
}

// 拍摄照片
const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  const context = canvas.getContext('2d')

  // 设置canvas尺寸
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // 绘制当前视频帧到canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  // 转换为Blob
  canvas.toBlob((blob) => {
    if (blob) {
      // 创建File对象
      const file = new File([blob], 'idcard-photo.jpg', { type: 'image/jpeg' })
      handleFileSelection(file)
      stopCamera()
    }
  }, 'image/jpeg', 0.8)
}

// 停止相机
const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
  showCamera.value = false
}

// 监听婚姻状态变化，自动设置配偶状态
watch(() => identityData.value.maritalStatus, (newStatus) => {
  // 根据婚姻状态自动设置配偶状态
  switch (newStatus) {
    case 'married':
      identityData.value.spouseStatus = 'current'
      break
    case 'divorced':
      identityData.value.spouseStatus = 'divorced'
      break
    case 'widowed':
      identityData.value.spouseStatus = 'deceased'
      break
    case 'single':
      identityData.value.spouseName = ''
      identityData.value.spouseStatus = 'current'
      break
  }
})

// 组件卸载时清理URL和相机
onMounted(() => {
  return () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    stopCamera()
  }
})
</script>

<style scoped>
.identity-container {
  min-height: 100vh;
  background: #f5f5f5;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
}

/* 移除自创导航栏样式，使用全局导航栏 */

.content {
  flex: 1;
  padding: 20px;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.5;
}

.step.active {
  opacity: 1;
}

.step.completed {
  opacity: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ddd;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 8px;
}

.step.active .step-number {
  background: #07c160;
}

.step.completed .step-number {
  background: #07c160;
}

.step-text {
  font-size: 12px;
  color: #666;
}

.step-line {
  width: 60px;
  height: 2px;
  background: #ddd;
  margin: 0 20px;
  margin-bottom: 20px;
}

.step-content {
  max-width: 400px;
  margin: 0 auto;
}

.upload-section h3,
.form-section h3,
.success-section h3 {
  text-align: center;
  color: #333;
  margin-bottom: 8px;
}

.form-tip {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 24px;
}

.required {
  color: #ff4757;
}

.tip {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 30px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #07c160;
}

.upload-placeholder {
  color: #666;
}

.upload-icon {
  color: #07c160;
  margin-bottom: 16px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
  margin: 8px 0 20px 0;
}

.upload-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.privacy-notice {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #07C160;
}

.notice-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notice-icon {
  color: #07C160;
  margin-top: 2px;
  flex-shrink: 0;
}

.notice-text p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.notice-text p:first-child {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.notice-text p:last-child {
  color: #666;
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: 2px solid #07c160;
  border-radius: 12px;
  background: white;
  color: #07c160;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  min-width: 80px;
}

.upload-btn:hover {
  background: #07c160;
  color: white;
  transform: translateY(-2px);
}

.upload-btn.camera {
  border-color: #07c160;
}

.upload-btn.album {
  border-color: #1890ff;
  color: #1890ff;
}

.upload-btn.album:hover {
  background: #1890ff;
  color: white;
}

.preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview-status {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.processing-status {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.success-status {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.error-status {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #07c160;
}

.form-input[readonly] {
  background: #f5f5f5;
  color: #666;
}

.address-input {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.action-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.action-btn.primary {
  background: #07c160;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #06a552;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #333;
}

.action-btn.secondary:hover {
  background: #e5e5e5;
}

.action-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.action-btn.large {
  padding: 16px 32px;
  font-size: 18px;
}

.success-section {
  text-align: center;
  padding: 40px 20px;
}

.success-icon {
  color: #07c160;
  margin-bottom: 20px;
}

.success-detail {
  color: #666;
  font-size: 14px;
  margin: 16px 0 40px 0;
}

.auto-redirect {
  color: #07c160;
  font-size: 14px;
  font-weight: 500;
  margin-top: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 相机拍摄样式 */
.camera-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.camera-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.camera-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.camera-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
}

.camera-content {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.guide-frame {
  width: 300px;
  height: 180px;
  border: 2px solid #07c160;
  border-radius: 12px;
  background: rgba(7, 193, 96, 0.1);
  margin-bottom: 16px;
}

.guide-text {
  color: white;
  font-size: 16px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.camera-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px;
  background: rgba(0, 0, 0, 0.8);
}

.camera-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  transition: background 0.3s;
}

.camera-btn.cancel {
  background: rgba(255, 255, 255, 0.2);
}

.camera-btn.capture {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-btn.capture:hover {
  background: #06a552;
}

.camera-btn-placeholder {
  width: 80px;
}

@media (max-width: 480px) {
  .guide-frame {
    width: 250px;
    height: 150px;
  }

  .camera-controls {
    padding: 20px;
  }
}
</style>
