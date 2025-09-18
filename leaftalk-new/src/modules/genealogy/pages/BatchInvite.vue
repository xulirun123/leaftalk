<template>
  <div class="batch-invite-page">
    <!-- 顶部导航 -->
    <MobileTopBar
      title="批量邀请"
      :showBack="true"
      @back="goBack"
    />

    <!-- 主要内容 -->
    <div class="invite-content">
      <!-- 导入方式选择 -->
      <div class="import-methods">
        <h3>导入方式</h3>
        <div class="method-cards">
          <div class="method-card" @click="showFileUpload">
            <div class="method-icon">
              <iconify-icon icon="heroicons:document-arrow-up" width="24" color="#07c160"></iconify-icon>
            </div>
            <div class="method-info">
              <h4>文件导入</h4>
              <p>上传Excel或CSV文件批量导入联系人</p>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>

          <div class="method-card" @click="showManualInput">
            <div class="method-icon">
              <iconify-icon icon="heroicons:pencil-square" width="24" color="#3742fa"></iconify-icon>
            </div>
            <div class="method-info">
              <h4>手动输入</h4>
              <p>手动输入多个联系人信息</p>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>

          <div class="method-card" @click="showContactsImport">
            <div class="method-icon">
              <iconify-icon icon="heroicons:address-book" width="24" color="#ff6b6b"></iconify-icon>
            </div>
            <div class="method-info">
              <h4>通讯录导入</h4>
              <p>从手机通讯录选择联系人</p>
            </div>
            <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 模板下载 -->
      <div class="template-section">
        <h3>模板下载</h3>
        <div class="template-card">
          <div class="template-info">
            <iconify-icon icon="heroicons:document-text" width="20" color="#07c160"></iconify-icon>
            <span>批量邀请模板.xlsx</span>
          </div>
          <button @click="downloadTemplate" class="download-btn">
            <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
            <span>下载</span>
          </button>
        </div>
        <p class="template-tip">请按照模板格式填写联系人信息，支持姓名、手机号、邮箱、备注等字段</p>
      </div>

      <!-- 导入历史 -->
      <div class="import-history">
        <h3>导入历史</h3>
        <div v-if="importHistory.length === 0" class="empty-history">
          <iconify-icon icon="heroicons:clock" width="48" color="#ccc"></iconify-icon>
          <p>暂无导入记录</p>
        </div>
        <div v-else class="history-list">
          <div
            v-for="record in importHistory"
            :key="record.id"
            class="history-item"
            @click="viewImportDetail(record)"
          >
            <div class="history-icon" :class="record.status">
              <iconify-icon :icon="getStatusIcon(record.status)" width="20"></iconify-icon>
            </div>
            <div class="history-info">
              <h4>{{ record.fileName || '手动输入' }}</h4>
              <p>{{ formatDate(record.createdAt) }}</p>
              <div class="history-stats">
                <span class="stat-item">总数: {{ record.totalCount }}</span>
                <span class="stat-item success">成功: {{ record.successCount }}</span>
                <span class="stat-item error">失败: {{ record.failedCount }}</span>
              </div>
            </div>
            <div class="history-status" :class="record.status">
              {{ getStatusText(record.status) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件上传弹窗 -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="upload-modal" @click.stop>
        <div class="modal-header">
          <h3>文件导入</h3>
          <button @click="closeUploadModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="upload-area" :class="{ 'drag-over': isDragOver }"
               @drop="handleFileDrop"
               @dragover.prevent="isDragOver = true"
               @dragleave="isDragOver = false"
               @click="triggerFileInput">
            <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" @change="handleFileSelect" style="display: none" />
            <iconify-icon icon="heroicons:cloud-arrow-up" width="48" color="#07c160"></iconify-icon>
            <h4>拖拽文件到此处或点击选择</h4>
            <p>支持 .xlsx, .xls, .csv 格式文件</p>
            <p class="file-limit">文件大小不超过 10MB</p>
          </div>

          <div v-if="selectedFile" class="file-preview">
            <div class="file-info">
              <iconify-icon icon="heroicons:document" width="20"></iconify-icon>
              <span>{{ selectedFile.name }}</span>
              <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
            </div>
            <button @click="removeFile" class="remove-file-btn">
              <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
            </button>
          </div>

          <div class="upload-options">
            <div class="form-group">
              <label>邀请消息</label>
              <textarea
                v-model="batchInviteMessage"
                placeholder="请输入邀请消息"
                rows="3"
                maxlength="200"
              ></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeUploadModal" class="cancel-btn">取消</button>
            <button @click="uploadFile" :disabled="!selectedFile || uploading" class="upload-btn">
              {{ uploading ? '处理中...' : '开始导入' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 手动输入弹窗 -->
    <div v-if="showManualModal" class="modal-overlay" @click="closeManualModal">
      <div class="manual-modal" @click.stop>
        <div class="modal-header">
          <h3>手动输入联系人</h3>
          <button @click="closeManualModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="manual-contacts">
            <div
              v-for="(contact, index) in manualContacts"
              :key="index"
              class="contact-form"
            >
              <div class="contact-header">
                <h4>联系人 {{ index + 1 }}</h4>
                <button v-if="manualContacts.length > 1" @click="removeContact(index)" class="remove-contact-btn">
                  <iconify-icon icon="heroicons:trash" width="16"></iconify-icon>
                </button>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>姓名 *</label>
                  <input v-model="contact.name" type="text" placeholder="请输入姓名" />
                </div>
                <div class="form-group">
                  <label>手机号 *</label>
                  <input v-model="contact.phone" type="tel" placeholder="请输入手机号" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>邮箱</label>
                  <input v-model="contact.email" type="email" placeholder="请输入邮箱" />
                </div>
                <div class="form-group">
                  <label>备注</label>
                  <input v-model="contact.remark" type="text" placeholder="请输入备注" />
                </div>
              </div>
            </div>
          </div>

          <button @click="addContact" class="add-contact-btn">
            <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
            <span>添加联系人</span>
          </button>

          <div class="form-group">
            <label>邀请消息</label>
            <textarea
              v-model="batchInviteMessage"
              placeholder="请输入邀请消息"
              rows="3"
              maxlength="200"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button @click="closeManualModal" class="cancel-btn">取消</button>
            <button @click="submitManualContacts" :disabled="!isManualContactsValid || submitting" class="submit-btn">
              {{ submitting ? '发送中...' : '发送邀请' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入结果弹窗 -->
    <div v-if="showResultModal" class="modal-overlay" @click="closeResultModal">
      <div class="result-modal" @click.stop>
        <div class="modal-header">
          <h3>导入结果</h3>
          <button @click="closeResultModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="result-summary">
            <div class="result-stats">
              <div class="stat-card total">
                <div class="stat-number">{{ importResult.totalCount }}</div>
                <div class="stat-label">总数</div>
              </div>
              <div class="stat-card success">
                <div class="stat-number">{{ importResult.successCount }}</div>
                <div class="stat-label">成功</div>
              </div>
              <div class="stat-card error">
                <div class="stat-number">{{ importResult.failedCount }}</div>
                <div class="stat-label">失败</div>
              </div>
            </div>
          </div>

          <div v-if="importResult.errors && importResult.errors.length > 0" class="error-details">
            <h4>失败详情</h4>
            <div class="error-list">
              <div v-for="(error, index) in importResult.errors" :key="index" class="error-item">
                <span class="error-row">第{{ error.row }}行:</span>
                <span class="error-message">{{ error.message }}</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeResultModal" class="close-btn-primary">确定</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.id)
const importHistory = ref([])

// 弹窗状态
const showUploadModal = ref(false)
const showManualModal = ref(false)
const showResultModal = ref(false)

// 文件上传相关
const selectedFile = ref(null)
const isDragOver = ref(false)
const uploading = ref(false)
const fileInput = ref(null)

// 手动输入相关
const manualContacts = ref([
  { name: '', phone: '', email: '', remark: '' }
])
const submitting = ref(false)

// 邀请消息
const batchInviteMessage = ref('邀请您加入我们的家族族谱，一起记录和传承家族历史！')

// 导入结果
const importResult = ref({
  totalCount: 0,
  successCount: 0,
  failedCount: 0,
  errors: []
})

// 计算属性
const isManualContactsValid = computed(() => {
  return manualContacts.value.some(contact =>
    contact.name.trim() && contact.phone.trim()
  )
})

// 生命周期
onMounted(() => {
  loadImportHistory()
})

// 方法
const goBack = () => {
  router.back()
}

const loadImportHistory = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/batch-invites/history`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        importHistory.value = result.data || []
      }
    }
  } catch (error) {
    console.error('加载导入历史失败:', error)
  }
}

// 文件上传相关方法
const showFileUpload = () => {
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  selectedFile.value = null
  isDragOver.value = false
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleFileDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false

  const file = event.dataTransfer.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const validateAndSetFile = (file) => {
  // 验证文件类型
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]

  if (!allowedTypes.includes(file.type)) {
    appStore.showToast('请选择 Excel 或 CSV 文件', 'error')
    return
  }

  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    appStore.showToast('文件大小不能超过 10MB', 'error')
    return
  }

  selectedFile.value = file
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('message', batchInviteMessage.value)

    const response = await fetch(`/api/genealogy/${genealogyId.value}/batch-invites/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      },
      body: formData
    })

    const result = await response.json()
    if (result.success) {
      importResult.value = result.data
      closeUploadModal()
      showResultModal.value = true
      loadImportHistory()
    } else {
      appStore.showToast(result.message || '导入失败', 'error')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    appStore.showToast('文件上传失败', 'error')
  } finally {
    uploading.value = false
  }
}

// 手动输入相关方法
const showManualInput = () => {
  showManualModal.value = true
}

const closeManualModal = () => {
  showManualModal.value = false
  manualContacts.value = [{ name: '', phone: '', email: '', remark: '' }]
}

const addContact = () => {
  manualContacts.value.push({ name: '', phone: '', email: '', remark: '' })
}

const removeContact = (index) => {
  manualContacts.value.splice(index, 1)
}

const submitManualContacts = async () => {
  const validContacts = manualContacts.value.filter(contact =>
    contact.name.trim() && contact.phone.trim()
  )

  if (validContacts.length === 0) {
    appStore.showToast('请至少填写一个有效联系人', 'error')
    return
  }

  submitting.value = true

  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/batch-invites/manual`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contacts: validContacts,
        message: batchInviteMessage.value
      })
    })

    const result = await response.json()
    if (result.success) {
      importResult.value = result.data
      closeManualModal()
      showResultModal.value = true
      loadImportHistory()
    } else {
      appStore.showToast(result.message || '发送失败', 'error')
    }
  } catch (error) {
    console.error('手动邀请失败:', error)
    appStore.showToast('发送邀请失败', 'error')
  } finally {
    submitting.value = false
  }
}

// 通讯录导入
const showContactsImport = () => {
  appStore.showToast('通讯录导入功能开发中', 'info')
}

// 模板下载
const downloadTemplate = () => {
  const link = document.createElement('a')
  link.href = '/templates/batch-invite-template.xlsx'
  link.download = '批量邀请模板.xlsx'
  link.click()
  appStore.showToast('模板下载中...', 'success')
}

// 结果弹窗
const closeResultModal = () => {
  showResultModal.value = false
}

// 查看导入详情
const viewImportDetail = (record) => {
  importResult.value = {
    totalCount: record.totalCount,
    successCount: record.successCount,
    failedCount: record.failedCount,
    errors: record.errors || []
  }
  showResultModal.value = true
}

// 工具方法
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusIcon = (status) => {
  const iconMap = {
    'processing': 'heroicons:clock',
    'completed': 'heroicons:check-circle',
    'failed': 'heroicons:x-circle',
    'partial': 'heroicons:exclamation-triangle'
  }
  return iconMap[status] || iconMap.processing
}

const getStatusText = (status) => {
  const textMap = {
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败',
    'partial': '部分成功'
  }
  return textMap[status] || status
}
</script>

<style scoped>
.batch-invite-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.invite-content {
  padding: 95px 20px 20px;
}

/* 导入方式选择 */
.import-methods {
  margin-bottom: 24px;
}

.import-methods h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.method-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.method-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.method-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.method-info {
  flex: 1;
}

.method-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.method-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.arrow {
  color: #ccc;
}

/* 模板下载 */
.template-section {
  margin-bottom: 24px;
}

.template-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.template-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #333;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.download-btn:hover {
  background: #06a552;
}

.template-tip {
  margin: 0;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

/* 导入历史 */
.import-history h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  color: #666;
}

.empty-history p {
  margin: 12px 0 0 0;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.history-icon.processing {
  background: #fff3e0;
  color: #f57c00;
}

.history-icon.completed {
  background: #e8f5e8;
  color: #388e3c;
}

.history-icon.failed {
  background: #ffebee;
  color: #d32f2f;
}

.history-icon.partial {
  background: #fff3e0;
  color: #f57c00;
}

.history-info {
  flex: 1;
}

.history-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.history-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #999;
}

.history-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  font-size: 12px;
  color: #666;
}

.stat-item.success {
  color: #388e3c;
}

.stat-item.error {
  color: #d32f2f;
}

.history-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.history-status.processing {
  background: #fff3e0;
  color: #f57c00;
}

.history-status.completed {
  background: #e8f5e8;
  color: #388e3c;
}

.history-status.failed {
  background: #ffebee;
  color: #d32f2f;
}

.history-status.partial {
  background: #fff3e0;
  color: #f57c00;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-modal,
.manual-modal,
.result-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 文件上传样式 */
.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #07c160;
  background: #f0f9ff;
}

.upload-area h4 {
  margin: 12px 0 8px 0;
  font-size: 16px;
  color: #333;
}

.upload-area p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.file-limit {
  color: #999 !important;
  font-size: 12px !important;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.file-size {
  color: #999;
  font-size: 12px;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #ff4757;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

/* 手动输入样式 */
.manual-contacts {
  margin-bottom: 20px;
}

.contact-form {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.contact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.contact-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.remove-contact-btn {
  background: none;
  border: none;
  color: #ff4757;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #07c160;
}

.add-contact-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #f8f9fa;
  color: #07c160;
  border: 1px dashed #07c160;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
  width: 100%;
  justify-content: center;
}

.add-contact-btn:hover {
  background: #e8f5e8;
}

/* 弹窗操作按钮 */
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn,
.upload-btn,
.submit-btn,
.close-btn-primary {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
}

.upload-btn,
.submit-btn,
.close-btn-primary {
  background: #07c160;
  color: white;
}

.upload-btn:disabled,
.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.upload-btn:hover:not(:disabled),
.submit-btn:hover:not(:disabled),
.close-btn-primary:hover {
  background: #06a552;
}

/* 结果弹窗样式 */
.result-summary {
  margin-bottom: 20px;
}

.result-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  text-align: center;
  padding: 16px 12px;
  border-radius: 8px;
}

.stat-card.total {
  background: #f8f9fa;
  color: #333;
}

.stat-card.success {
  background: #e8f5e8;
  color: #388e3c;
}

.stat-card.error {
  background: #ffebee;
  color: #d32f2f;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.error-details {
  margin-top: 20px;
}

.error-details h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.error-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.error-item {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #f8f9fa;
  font-size: 12px;
}

.error-item:last-child {
  border-bottom: none;
}

.error-row {
  color: #666;
  min-width: 60px;
}

.error-message {
  color: #d32f2f;
  flex: 1;
}
</style>