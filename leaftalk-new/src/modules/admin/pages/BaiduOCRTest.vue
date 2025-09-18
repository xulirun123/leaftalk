<template>
  <div class="baidu-ocr-test">

    <!-- 主要内容 -->
    <div class="content">
      <!-- 状态卡片 -->
      <div class="status-card">
        <h3>🔍 百度OCR身份证识别测试</h3>
        <p class="description">
          使用真实的百度OCR API进行身份证识别测试。
          <br>支持正面身份证的姓名、性别、民族、出生日期、住址、身份证号等信息识别。
        </p>
        
        <div class="api-status">
          <div class="status-item">
            <span class="label">API状态:</span>
            <span class="value success">✅ 已配置</span>
          </div>
          <div class="status-item">
            <span class="label">APP_ID:</span>
            <span class="value">116426134</span>
          </div>
          <div class="status-item">
            <span class="label">服务类型:</span>
            <span class="value">百度智能云OCR</span>
          </div>
        </div>
      </div>

      <!-- 上传区域 -->
      <div class="upload-section">
        <h3>📷 上传身份证图片</h3>
        <div class="upload-area" @click="selectFile">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            style="display: none"
          />
          
          <div v-if="!selectedFile" class="upload-placeholder">
            <iconify-icon icon="heroicons:camera" width="48" class="upload-icon"></iconify-icon>
            <p>点击选择身份证图片</p>
            <p class="upload-hint">支持 JPG、PNG、BMP 格式，最大 10MB</p>
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
      </div>

      <!-- 识别结果 -->
      <div v-if="ocrResult" class="result-section">
        <h3>📋 识别结果</h3>
        
        <!-- 识别信息 -->
        <div class="result-meta">
          <div class="meta-item">
            <span class="label">识别来源:</span>
            <span class="value">{{ ocrResult.source || 'baidu' }}</span>
          </div>
          <div class="meta-item">
            <span class="label">置信度:</span>
            <span class="value">{{ Math.round((ocrResult.confidence || 0) * 100) }}%</span>
          </div>
          <div class="meta-item">
            <span class="label">处理时间:</span>
            <span class="value">{{ ocrResult.processing_time }}秒</span>
          </div>
        </div>

        <!-- 识别数据 -->
        <div v-if="ocrResult.success && ocrResult.data" class="result-data">
          <div class="data-grid">
            <div class="data-item">
              <span class="label">姓名:</span>
              <span class="value">{{ ocrResult.data.name || '未识别' }}</span>
            </div>
            <div class="data-item">
              <span class="label">性别:</span>
              <span class="value">{{ ocrResult.data.gender || '未识别' }}</span>
            </div>
            <div class="data-item">
              <span class="label">民族:</span>
              <span class="value">{{ ocrResult.data.nation || '未识别' }}</span>
            </div>
            <div class="data-item">
              <span class="label">出生日期:</span>
              <span class="value">{{ ocrResult.data.birthDate || '未识别' }}</span>
            </div>
            <div class="data-item">
              <span class="label">身份证号:</span>
              <span class="value">{{ ocrResult.data.idNumber || '未识别' }}</span>
            </div>
            <div class="data-item full-width">
              <span class="label">住址:</span>
              <span class="value">{{ ocrResult.data.address || '未识别' }}</span>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="!ocrResult.success" class="error-info">
          <iconify-icon icon="heroicons:exclamation-triangle" width="24" class="error-icon"></iconify-icon>
          <p>{{ ocrResult.error || '识别失败' }}</p>
        </div>

        <!-- 原始结果（调试用） -->
        <div v-if="showRawResult && ocrResult.raw_result" class="raw-result">
          <h4>原始API返回结果:</h4>
          <pre>{{ JSON.stringify(ocrResult.raw_result, null, 2) }}</pre>
        </div>

        <div class="result-actions">
          <button @click="showRawResult = !showRawResult" class="action-btn secondary">
            {{ showRawResult ? '隐藏' : '显示' }}原始结果
          </button>
          <button @click="saveResult" class="action-btn primary">保存结果</button>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="help-section">
        <h3>💡 使用说明</h3>
        <ul class="help-list">
          <li>请上传清晰的身份证正面照片</li>
          <li>确保身份证信息完整可见，无遮挡</li>
          <li>建议在光线充足的环境下拍摄</li>
          <li>支持的图片格式：JPG、PNG、BMP</li>
          <li>图片大小限制：最大 10MB</li>
          <li>识别结果会自动保存为训练数据</li>
        </ul>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-spinner">
        <iconify-icon icon="heroicons:arrow-path" width="32" class="spinning"></iconify-icon>
        <p>{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const selectedFile = ref(null)
const previewUrl = ref('')
const ocrResult = ref(null)
const isProcessing = ref(false)
const loadingText = ref('')
const showRawResult = ref(false)
const fileInput = ref(null)

// 移除goBack函数，使用全局导航栏的返回功能

// 安全的Toast显示
const safeShowToast = (message, type = 'info') => {
  try {
    if (appStore && typeof appStore.showToast === 'function') {
      appStore.showToast(message, type)
    } else {
      console.log(`Toast (${type}): ${message}`)
    }
  } catch (error) {
    console.error('Toast显示失败:', error)
  }
}

// 选择文件
const selectFile = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    safeShowToast('请选择图片文件', 'error')
    return
  }

  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    safeShowToast('图片大小不能超过10MB', 'error')
    return
  }

  selectedFile.value = file

  // 创建预览URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)

  // 重置结果
  ocrResult.value = null

  console.log('📷 文件选择成功:', {
    name: file.name,
    size: file.size,
    type: file.type
  })
}

// 重新选择照片
const retakePhoto = () => {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  ocrResult.value = null
}

// 开始OCR识别
const startOCR = async () => {
  if (!selectedFile.value) return

  isProcessing.value = true
  loadingText.value = '正在调用百度OCR API识别...'

  try {
    console.log('🔍 开始百度OCR识别...')

    const formData = new FormData()
    formData.append('idcard', selectedFile.value)

    // 先尝试代理，失败则直接调用生产服务器
    let response
    try {
      response = await fetch('/api/ocr/idcard', {
        method: 'POST',
        body: formData
      })
    } catch (proxyError) {
      console.log('🔄 代理失败，尝试直接调用生产服务器API')
      response = await fetch('http://localhost:8893/api/ocr/idcard', {
        method: 'POST',
        body: formData
      })
    }

    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`)
    }

    // 检查响应内容类型
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ 非JSON响应:', text)
      throw new Error('服务器返回非JSON格式响应')
    }

    const result = await response.json()
    console.log('🔍 百度OCR识别结果:', result)

    ocrResult.value = result

    if (result.success) {
      safeShowToast(`识别成功！来源: ${result.source}`, 'success')
    } else {
      safeShowToast('识别失败: ' + (result.error || result.message || '未知错误'), 'error')
    }

  } catch (error) {
    console.error('❌ OCR识别失败:', error)
    ocrResult.value = {
      success: false,
      error: error.message || '网络错误'
    }
    safeShowToast('识别失败: ' + error.message, 'error')
  } finally {
    isProcessing.value = false
  }
}

// 保存结果
const saveResult = () => {
  if (!ocrResult.value) return
  
  const resultData = {
    timestamp: new Date().toISOString(),
    filename: selectedFile.value?.name,
    result: ocrResult.value
  }
  
  // 这里可以实现保存到本地存储或发送到服务器
  console.log('💾 保存识别结果:', resultData)
  safeShowToast('识别结果已保存', 'success')
}
</script>

<style scoped>
.baidu-ocr-test {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.top-nav {
  background: white;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
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
  flex: 1;
  padding: 20px;
}

.status-card,
.upload-section,
.result-section,
.help-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-card h3,
.upload-section h3,
.result-section h3,
.help-section h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.api-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
}

.value.success {
  color: #07c160;
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
  margin: 8px 0 0 0;
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

.preview-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
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

.result-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.data-item.full-width {
  grid-column: 1 / -1;
}

.error-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.error-icon {
  flex-shrink: 0;
}

.raw-result {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.raw-result h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.raw-result pre {
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.help-list {
  margin: 0;
  padding-left: 20px;
  color: #666;
  line-height: 1.6;
}

.help-list li {
  margin-bottom: 8px;
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

.loading-spinner {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .data-grid {
    grid-template-columns: 1fr;
  }
  
  .result-actions {
    flex-direction: column;
  }
  
  .api-status {
    font-size: 14px;
  }
}
</style>
