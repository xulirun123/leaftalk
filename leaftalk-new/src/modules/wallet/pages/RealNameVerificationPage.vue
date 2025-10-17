<template>
  <div class="verification-page">
    <div class="verification-content">
      <!-- 步骤指示器 -->
      <div class="steps-indicator">
        <div class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-label">身份证认证</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>
        <div class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-label">人脸识别</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 2 }"></div>
        <div class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
          <div class="step-number">3</div>
          <div class="step-label">设置密码</div>
        </div>
      </div>

      <!-- 步骤1：身份证认证 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="step-title">请上传身份证照片</div>
        <div class="step-desc">系统将自动识别您的身份信息</div>

        <!-- 身份证正面 -->
        <div class="id-card-upload">
          <div class="upload-label">身份证正面</div>
          <div class="upload-box" @click="uploadIdCardFront">
            <img v-if="idCardFront" :src="idCardFront" class="preview-image" />
            <div v-else class="upload-placeholder">
              <Icon icon="heroicons:camera" class="camera-icon" />
              <div class="upload-text">点击拍摄身份证正面</div>
            </div>
          </div>
        </div>

        <!-- 身份证反面 -->
        <div class="id-card-upload">
          <div class="upload-label">身份证反面</div>
          <div class="upload-box" @click="uploadIdCardBack">
            <img v-if="idCardBack" :src="idCardBack" class="preview-image" />
            <div v-else class="upload-placeholder">
              <Icon icon="heroicons:camera" class="camera-icon" />
              <div class="upload-text">点击拍摄身份证反面</div>
            </div>
          </div>
        </div>

        <!-- 识别结果 -->
        <div v-if="ocrResult" class="ocr-result">
          <div class="result-title">识别结果</div>
          <div class="result-item">
            <span class="label">姓名：</span>
            <span class="value">{{ ocrResult.name }}</span>
          </div>
          <div class="result-item">
            <span class="label">身份证号：</span>
            <span class="value">{{ ocrResult.idCard }}</span>
          </div>
          <div class="result-item">
            <span class="label">性别：</span>
            <span class="value">{{ ocrResult.gender }}</span>
          </div>
          <div class="result-item">
            <span class="label">出生日期：</span>
            <span class="value">{{ ocrResult.birthDate }}</span>
          </div>
        </div>

        <button class="next-btn" :disabled="!canGoToStep2" @click="goToStep2">
          下一步
        </button>
      </div>

      <!-- 步骤2：人脸识别 -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="step-title">人脸识别验证</div>
        <div class="step-desc">请将面部对准摄像头，保持光线充足</div>

        <div class="face-recognition">
          <div class="face-frame">
            <video v-if="!faceImage" ref="videoRef" class="video-preview" autoplay></video>
            <img v-else :src="faceImage" class="face-preview" />
            <div class="face-guide"></div>
          </div>

          <div v-if="faceRecognitionStatus" class="recognition-status">
            {{ faceRecognitionStatus }}
          </div>
        </div>

        <div class="face-actions">
          <button v-if="!faceImage" class="capture-btn" @click="captureFace">
            <Icon icon="heroicons:camera" />
            拍摄
          </button>
          <button v-else class="retry-btn" @click="retryFace">
            <Icon icon="heroicons:arrow-path" />
            重新拍摄
          </button>
        </div>

        <button class="next-btn" :disabled="!faceImage" @click="goToStep3">
          下一步
        </button>
      </div>

      <!-- 步骤3：设置支付密码 -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="step-title">设置支付密码</div>
        <div class="step-desc">用于支付时验证身份</div>

        <div class="password-section">
          <div class="password-label">请输入6位数字密码</div>
          <div class="password-input">
            <input
              v-for="i in 6"
              :key="i"
              v-model="password[i - 1]"
              type="password"
              maxlength="1"
              class="password-digit"
              @input="handlePasswordInput(i - 1)"
              @keydown="handlePasswordKeydown($event, i - 1)"
            />
          </div>
        </div>

        <div class="password-section">
          <div class="password-label">请再次输入密码</div>
          <div class="password-input">
            <input
              v-for="i in 6"
              :key="i"
              v-model="confirmPassword[i - 1]"
              type="password"
              maxlength="1"
              class="password-digit"
              @input="handleConfirmPasswordInput(i - 1)"
            />
          </div>
        </div>

        <div v-if="passwordError" class="password-error">
          {{ passwordError }}
        </div>

        <button class="next-btn" :disabled="!canSubmit" @click="submitVerification">
          {{ submitting ? '提交中...' : '完成认证' }}
        </button>
      </div>

      <!-- 认证成功 -->
      <div v-if="currentStep === 4" class="step-content success-content">
        <Icon icon="heroicons:check-circle" class="success-icon" />
        <div class="success-title">实名认证成功！</div>
        <div class="success-desc">您已开通叶语支付功能</div>

        <div class="success-info">
          <div class="info-item">
            <span class="label">姓名：</span>
            <span class="value">{{ ocrResult?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">身份证号：</span>
            <span class="value">{{ maskIdCard(ocrResult?.idCard) }}</span>
          </div>
        </div>

        <button class="done-btn" @click="handleDone">
          开始使用
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import apiClient from '@/shared/services/apiClient'

const router = useRouter()

// 当前步骤
const currentStep = ref(1)

// 步骤1：身份证认证
const idCardFront = ref('')
const idCardBack = ref('')
const ocrResult = ref<any>(null)

// 步骤2：人脸识别
const videoRef = ref<HTMLVideoElement | null>(null)
const faceImage = ref('')
const faceRecognitionStatus = ref('')

// 步骤3：设置密码
const password = ref<string[]>(new Array(6).fill(''))
const confirmPassword = ref<string[]>(new Array(6).fill(''))
const passwordError = ref('')
const submitting = ref(false)

// 是否可以进入步骤2
const canGoToStep2 = computed(() => {
  return idCardFront.value && idCardBack.value && ocrResult.value
})

// 是否可以提交
const canSubmit = computed(() => {
  const pwd = password.value.join('')
  const confirmPwd = confirmPassword.value.join('')
  return pwd.length === 6 && confirmPwd.length === 6 && pwd === confirmPwd
})

// 上传身份证正面
const uploadIdCardFront = () => {
  // TODO: 调用相机或相册
  // 这里模拟上传
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (file) {
      // 上传到服务器并OCR识别
      await uploadAndOCR(file, 'front')
    }
  }
  input.click()
}

// 上传身份证反面
const uploadIdCardBack = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (file) {
      await uploadAndOCR(file, 'back')
    }
  }
  input.click()
}

// 上传并OCR识别
const uploadAndOCR = async (file: File, side: 'front' | 'back') => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('side', side)

    const response = await apiClient.post('/user/ocr-idcard', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (response.success) {
      // 将相对路径转换为完整URL
      const imageUrl = response.data.imageUrl.startsWith('http')
        ? response.data.imageUrl
        : `http://localhost:8893${response.data.imageUrl}`

      if (side === 'front') {
        idCardFront.value = imageUrl
        ocrResult.value = response.data.ocrResult
        console.log('✅ 身份证正面上传成功:', imageUrl)
        console.log('✅ OCR识别结果:', response.data.ocrResult)
      } else {
        idCardBack.value = imageUrl
        console.log('✅ 身份证反面上传成功:', imageUrl)
      }
    }
  } catch (error) {
    console.error('❌ OCR识别失败:', error)
    alert('身份证识别失败，请重试')
  }
}

// 进入步骤2
const goToStep2 = () => {
  currentStep.value = 2
  // 启动摄像头
  startCamera()
}

// 启动摄像头
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (error) {
    console.error('❌ 启动摄像头失败:', error)
    alert('无法访问摄像头，请检查权限')
  }
}

// 拍摄人脸
const captureFace = () => {
  // TODO: 实现人脸拍摄和识别
  // 这里模拟
  faceImage.value = 'data:image/png;base64,...'
  faceRecognitionStatus.value = '人脸识别成功'
}

// 重新拍摄
const retryFace = () => {
  faceImage.value = ''
  faceRecognitionStatus.value = ''
  startCamera()
}

// 进入步骤3
const goToStep3 = () => {
  currentStep.value = 3
}

// 处理密码输入
const handlePasswordInput = (index: number) => {
  if (password.value[index] && index < 5) {
    // 自动聚焦下一个输入框
    const inputs = document.querySelectorAll('.password-digit')
    ;(inputs[index + 1] as HTMLInputElement)?.focus()
  }
}

// 处理确认密码输入
const handleConfirmPasswordInput = (index: number) => {
  if (confirmPassword.value[index] && index < 5) {
    const inputs = document.querySelectorAll('.password-digit')
    ;(inputs[index + 7] as HTMLInputElement)?.focus()
  }
}

// 处理密码键盘事件
const handlePasswordKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'Backspace' && !password.value[index] && index > 0) {
    const inputs = document.querySelectorAll('.password-digit')
    ;(inputs[index - 1] as HTMLInputElement)?.focus()
  }
}

// 提交认证
const submitVerification = async () => {
  const pwd = password.value.join('')
  const confirmPwd = confirmPassword.value.join('')

  if (pwd !== confirmPwd) {
    passwordError.value = '两次输入的密码不一致'
    return
  }

  submitting.value = true

  try {
    const response = await apiClient.post('/user/real-name-verification', {
      realName: ocrResult.value.name,
      idCard: ocrResult.value.idCard,
      gender: ocrResult.value.gender,
      birthDate: ocrResult.value.birthDate,
      idCardFront: idCardFront.value,
      idCardBack: idCardBack.value,
      faceImage: faceImage.value,
      paymentPassword: pwd,
    })

    if (response.success) {
      currentStep.value = 4
    }
  } catch (error) {
    console.error('❌ 实名认证失败:', error)
    alert('实名认证失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 完成
const handleDone = () => {
  // 检查是否从开通页面跳转过来
  const fromActivate = router.options.history.state.back?.includes('activate-payment')
  if (fromActivate) {
    router.push('/activate-payment')
  } else {
    router.push('/wallet')
  }
}



// 隐藏身份证号
const maskIdCard = (idCard: string) => {
  if (!idCard) return ''
  return idCard.replace(/^(.{6})(.{8})(.{4})$/, '$1********$3')
}
</script>

<style scoped>
.verification-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.verification-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 步骤指示器 */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s;
}

.step-item.active .step-number {
  background: #07c160;
  color: white;
}

.step-item.completed .step-number {
  background: #07c160;
  color: white;
}

.step-label {
  font-size: 12px;
  color: #999;
}

.step-item.active .step-label {
  color: #07c160;
  font-weight: bold;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e0e0e0;
  margin: 0 8px;
  transition: all 0.3s;
}

.step-line.active {
  background: #07c160;
}

/* 步骤内容 */
.step-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.step-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  text-align: center;
}

.step-desc {
  font-size: 14px;
  color: #999;
  text-align: center;
  margin-bottom: 24px;
}

/* 身份证上传 */
.id-card-upload {
  margin-bottom: 20px;
}

.upload-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.upload-box {
  width: 100%;
  height: 180px;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.upload-box:active {
  transform: scale(0.98);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.camera-icon {
  font-size: 48px;
  color: #ccc;
}

.upload-text {
  font-size: 14px;
  color: #999;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* OCR识别结果 */
.ocr-result {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.result-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item .label {
  font-size: 14px;
  color: #666;
}

.result-item .value {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

/* 人脸识别 */
.face-recognition {
  margin-bottom: 24px;
}

.face-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.video-preview,
.face-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.face-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 260px;
  border: 3px solid #07c160;
  border-radius: 50%;
  pointer-events: none;
}

.recognition-status {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #07c160;
  font-weight: bold;
}

.face-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.capture-btn,
.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  background: #666;
}

.capture-btn:active,
.retry-btn:active {
  transform: scale(0.95);
}

/* 密码输入 */
.password-section {
  margin-bottom: 24px;
}

.password-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  text-align: center;
}

.password-input {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.password-digit {
  width: 44px;
  height: 44px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  outline: none;
  transition: all 0.2s;
}

.password-digit:focus {
  border-color: #07c160;
}

.password-error {
  text-align: center;
  color: #ff4d4f;
  font-size: 14px;
  margin-bottom: 16px;
}

/* 按钮 */
.next-btn,
.done-btn {
  width: 100%;
  height: 48px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.next-btn:active:not(:disabled),
.done-btn:active {
  transform: scale(0.98);
}

.next-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 成功页面 */
.success-content {
  text-align: center;
  padding: 40px 24px;
}

.success-icon {
  font-size: 80px;
  color: #07c160;
  margin-bottom: 20px;
}

.success-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 32px;
}

.success-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 32px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.info-item .label {
  font-size: 14px;
  color: #666;
}

.info-item .value {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}
</style>
```

