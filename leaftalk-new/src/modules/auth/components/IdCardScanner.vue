<template>
  <div class="idcard-scanner">
    <!-- 扫描界面 -->
    <div v-if="!isScanning && !scanResult" class="scan-intro">
      <div class="scan-icon">📱</div>
      <h3>身份证扫描识别</h3>
      <p>使用摄像头扫描身份证，自动识别信息</p>
      <button @click="startScan" class="scan-button">
        📷 开始扫描
      </button>
      <div class="upload-option">
        <p>或者上传图片</p>
        <input 
          type="file" 
          @change="handleFileUpload" 
          accept="image/*"
          ref="fileInput"
          style="display: none"
        >
        <button @click="$refs.fileInput.click()" class="upload-button">
          📁 选择图片
        </button>
      </div>
    </div>

    <!-- 摄像头扫描界面 -->
    <div v-if="isScanning" class="camera-container">
      <div class="camera-header">
        <button @click="stopScan" class="close-button">✕</button>
        <h4>请将身份证放入框内</h4>
      </div>
      
      <div class="camera-view">
        <video ref="video" autoplay playsinline></video>
        <div class="scan-overlay">
          <div class="scan-frame"></div>
          <div class="scan-line"></div>
        </div>
      </div>
      
      <div class="camera-controls">
        <button @click="capturePhoto" class="capture-button">
          📸 拍照识别
        </button>
        <button @click="toggleFlash" class="flash-button">
          💡 {{ flashOn ? '关闭' : '开启' }}闪光灯
        </button>
      </div>
      
      <div class="scan-tips">
        <p>💡 拍摄提示：</p>
        <ul>
          <li>确保身份证完整在框内</li>
          <li>保持手机稳定</li>
          <li>光线充足，避免反光</li>
          <li>身份证正面朝上</li>
        </ul>
      </div>
    </div>

    <!-- 识别结果 -->
    <div v-if="scanResult" class="scan-result">
      <div class="result-header">
        <h4>识别结果</h4>
        <button @click="resetScan" class="reset-button">重新扫描</button>
      </div>
      
      <div class="result-preview">
        <img :src="capturedImage" alt="拍摄的身份证" class="captured-image">
      </div>
      
      <div class="result-info">
        <div class="info-item">
          <label>姓名：</label>
          <input v-model="scanResult.name" @input="updateResult">
        </div>
        <div class="info-item">
          <label>身份证号：</label>
          <input v-model="scanResult.idNumber" @input="updateResult">
        </div>
        <div class="info-item">
          <label>性别：</label>
          <select v-model="scanResult.gender" @change="updateResult">
            <option value="">请选择</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div class="info-item">
          <label>民族：</label>
          <input v-model="scanResult.nation" @input="updateResult">
        </div>
        <div class="info-item">
          <label>出生日期：</label>
          <input v-model="scanResult.birthDate" type="date" @input="updateResult">
        </div>
        <div class="info-item">
          <label>住址：</label>
          <textarea v-model="scanResult.address" @input="updateResult"></textarea>
        </div>
      </div>
      
      <div class="result-actions">
        <button @click="confirmResult" class="confirm-button">
          ✅ 确认信息
        </button>
        <button @click="editManually" class="edit-button">
          ✏️ 手动输入
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isProcessing" class="processing">
      <div class="spinner"></div>
      <p>正在识别身份证信息...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface IdCardInfo {
  name: string
  idNumber: string
  gender: string
  nation: string
  birthDate: string
  address: string
}

const emit = defineEmits<{
  result: [info: IdCardInfo]
  error: [message: string]
}>()

const isScanning = ref(false)
const isProcessing = ref(false)
const flashOn = ref(false)
const scanResult = ref<IdCardInfo | null>(null)
const capturedImage = ref('')

const video = ref<HTMLVideoElement>()
const fileInput = ref<HTMLInputElement>()
let stream: MediaStream | null = null

// 开始扫描
const startScan = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // 后置摄像头
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    })
    
    if (video.value) {
      video.value.srcObject = stream
      isScanning.value = true
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
    emit('error', '无法启动摄像头，请检查权限设置')
  }
}

// 停止扫描
const stopScan = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  isScanning.value = false
}

// 拍照
const capturePhoto = () => {
  if (!video.value) return
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  canvas.width = video.value.videoWidth
  canvas.height = video.value.videoHeight
  
  ctx.drawImage(video.value, 0, 0)
  
  const imageData = canvas.toDataURL('image/jpeg', 0.9)
  capturedImage.value = imageData
  
  stopScan()
  processImage(imageData)
}

// 处理图片 - 使用真实云OCR
const processImage = async (imageData: string) => {
  isProcessing.value = true

  try {
    console.log('☁️ 开始云OCR身份证识别...')

    // 将base64转换为File对象
    const response = await fetch(imageData)
    const blob = await response.blob()
    const file = new File([blob], 'idcard.jpg', { type: 'image/jpeg' })

    // 调用云OCR API
    const formData = new FormData()
    formData.append('image', file)

    const ocrResponse = await fetch('/api/ocr/idcard', {
      method: 'POST',
      body: formData
    })

    const result = await ocrResponse.json()

    if (result.success) {
      console.log('✅ 云OCR识别成功:', result.data)
      console.log('🔧 识别方法:', result.method)
      console.log('📊 置信度:', result.confidence)

      // 使用真实识别结果
      scanResult.value = {
        name: result.data.name || '',
        idNumber: result.data.idNumber || '',
        gender: result.data.gender || '',
        nation: result.data.nation || '汉族',
        birthDate: result.data.birthDate || '',
        address: result.data.address || ''
      }

      // 显示成功信息
      const method = result.method === 'baidu_cloud_ocr' ? '云OCR' : '本地OCR'
      emit('success', `身份证识别成功！(${method})`)
    } else {
      throw new Error(result.message || '身份证识别失败')
    }

    isProcessing.value = false
  } catch (error) {
    console.error('身份证识别失败:', error)
    isProcessing.value = false
    emit('error', '身份证识别失败：' + error.message + '，请重试')
  }
}

// 文件上传
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageData = e.target?.result as string
    capturedImage.value = imageData
    processImage(imageData)
  }
  reader.readAsDataURL(file)
}

// 切换闪光灯
const toggleFlash = async () => {
  if (!stream) return
  
  try {
    const track = stream.getVideoTracks()[0]
    const capabilities = track.getCapabilities()
    
    if (capabilities.torch) {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn.value }]
      })
      flashOn.value = !flashOn.value
    }
  } catch (error) {
    console.error('闪光灯控制失败:', error)
  }
}

// 更新结果
const updateResult = () => {
  // 实时更新结果
}

// 确认结果
const confirmResult = () => {
  if (scanResult.value) {
    emit('result', scanResult.value)
  }
}

// 手动输入
const editManually = () => {
  // 切换到手动输入模式
  scanResult.value = {
    name: '',
    idNumber: '',
    gender: '',
    nation: '汉族',
    birthDate: '',
    address: ''
  }
}

// 重新扫描
const resetScan = () => {
  scanResult.value = null
  capturedImage.value = ''
  isProcessing.value = false
}

// 清理资源
onUnmounted(() => {
  stopScan()
})
</script>

<style scoped>
.idcard-scanner {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.scan-intro {
  text-align: center;
  padding: 40px 20px;
}

.scan-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.scan-button, .upload-button {
  background: #07C160;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  margin: 10px;
  cursor: pointer;
}

.upload-option {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.camera-container {
  position: relative;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.camera-view {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
}

.camera-view video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-frame {
  width: 280px;
  height: 180px;
  border: 2px solid #07C160;
  border-radius: 8px;
  position: relative;
}

.scan-line {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 260px;
  height: 2px;
  background: #07C160;
  animation: scan 2s infinite;
}

@keyframes scan {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.camera-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 20px;
}

.capture-button {
  background: #07C160;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 16px;
  cursor: pointer;
}

.flash-button {
  background: #666;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
}

.scan-tips {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.scan-tips ul {
  margin: 10px 0;
  padding-left: 20px;
}

.scan-result {
  padding: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.captured-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 15px;
}

.info-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.info-item input,
.info-item select,
.info-item textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.info-item textarea {
  height: 60px;
  resize: vertical;
}

.result-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.confirm-button {
  flex: 1;
  background: #07C160;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
}

.edit-button {
  flex: 1;
  background: #666;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
}

.processing {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
