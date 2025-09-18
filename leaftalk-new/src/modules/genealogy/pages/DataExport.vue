<template>
  <div class="data-export-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">数据导出</h1>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 导出选项 -->
    <div class="export-options">
      <div class="section-title">
        <iconify-icon icon="heroicons:document-arrow-down" width="20"></iconify-icon>
        <span>选择导出内容</span>
      </div>

      <div class="option-group">
        <label class="option-item">
          <input type="checkbox" v-model="exportOptions.members" />
          <div class="option-content">
            <div class="option-title">家族成员信息</div>
            <div class="option-desc">包含所有成员的基本信息、关系等</div>
          </div>
          <iconify-icon icon="heroicons:users" width="20" class="option-icon"></iconify-icon>
        </label>

        <label class="option-item">
          <input type="checkbox" v-model="exportOptions.relationships" />
          <div class="option-content">
            <div class="option-title">家族关系图</div>
            <div class="option-desc">完整的家族关系结构和族谱图</div>
          </div>
          <iconify-icon icon="heroicons:share" width="20" class="option-icon"></iconify-icon>
        </label>

        <label class="option-item">
          <input type="checkbox" v-model="exportOptions.activities" />
          <div class="option-content">
            <div class="option-title">家族活动</div>
            <div class="option-desc">活动记录、照片、参与者信息</div>
          </div>
          <iconify-icon icon="heroicons:calendar-days" width="20" class="option-icon"></iconify-icon>
        </label>

        <label class="option-item">
          <input type="checkbox" v-model="exportOptions.stories" />
          <div class="option-content">
            <div class="option-title">家族故事</div>
            <div class="option-desc">家族故事、照片、评论等内容</div>
          </div>
          <iconify-icon icon="heroicons:book-open" width="20" class="option-icon"></iconify-icon>
        </label>

        <label class="option-item">
          <input type="checkbox" v-model="exportOptions.albums" />
          <div class="option-content">
            <div class="option-title">家族相册</div>
            <div class="option-desc">所有相册和照片文件</div>
          </div>
          <iconify-icon icon="heroicons:photo" width="20" class="option-icon"></iconify-icon>
        </label>
      </div>
    </div>

    <!-- 导出格式 -->
    <div class="export-formats">
      <div class="section-title">
        <iconify-icon icon="heroicons:document" width="20"></iconify-icon>
        <span>选择导出格式</span>
      </div>

      <div class="format-grid">
        <div 
          class="format-item" 
          :class="{ active: selectedFormat === 'json' }"
          @click="selectedFormat = 'json'"
        >
          <iconify-icon icon="heroicons:code-bracket" width="24"></iconify-icon>
          <div class="format-name">JSON</div>
          <div class="format-desc">结构化数据</div>
        </div>

        <div 
          class="format-item" 
          :class="{ active: selectedFormat === 'excel' }"
          @click="selectedFormat = 'excel'"
        >
          <iconify-icon icon="heroicons:table-cells" width="24"></iconify-icon>
          <div class="format-name">Excel</div>
          <div class="format-desc">表格格式</div>
        </div>

        <div 
          class="format-item" 
          :class="{ active: selectedFormat === 'pdf' }"
          @click="selectedFormat = 'pdf'"
        >
          <iconify-icon icon="heroicons:document-text" width="24"></iconify-icon>
          <div class="format-name">PDF</div>
          <div class="format-desc">文档格式</div>
        </div>

        <div 
          class="format-item" 
          :class="{ active: selectedFormat === 'backup' }"
          @click="selectedFormat = 'backup'"
        >
          <iconify-icon icon="heroicons:archive-box" width="24"></iconify-icon>
          <div class="format-name">完整备份</div>
          <div class="format-desc">包含所有文件</div>
        </div>
      </div>
    </div>

    <!-- 导出设置 -->
    <div class="export-settings">
      <div class="section-title">
        <iconify-icon icon="heroicons:cog-6-tooth" width="20"></iconify-icon>
        <span>导出设置</span>
      </div>

      <div class="setting-group">
        <div class="setting-item">
          <label>包含照片</label>
          <input type="checkbox" v-model="exportSettings.includePhotos" class="toggle-switch" />
        </div>

        <div class="setting-item">
          <label>包含私密信息</label>
          <input type="checkbox" v-model="exportSettings.includePrivate" class="toggle-switch" />
        </div>

        <div class="setting-item">
          <label>数据压缩</label>
          <input type="checkbox" v-model="exportSettings.compress" class="toggle-switch" />
        </div>

        <div class="setting-item">
          <label>密码保护</label>
          <input type="checkbox" v-model="exportSettings.passwordProtect" class="toggle-switch" />
        </div>

        <div v-if="exportSettings.passwordProtect" class="password-input">
          <input 
            type="password" 
            v-model="exportSettings.password" 
            placeholder="设置导出文件密码"
            class="password-field"
          />
        </div>
      </div>
    </div>

    <!-- 导出历史 -->
    <div class="export-history">
      <div class="section-title">
        <iconify-icon icon="heroicons:clock" width="20"></iconify-icon>
        <span>导出历史</span>
      </div>

      <div class="history-list">
        <div v-for="record in exportHistory" :key="record.id" class="history-item">
          <div class="history-info">
            <div class="history-title">{{ record.name }}</div>
            <div class="history-meta">
              <span>{{ record.format.toUpperCase() }}</span>
              <span>{{ formatFileSize(record.size) }}</span>
              <span>{{ formatDate(record.createdAt) }}</span>
            </div>
          </div>
          <div class="history-actions">
            <button @click="downloadExport(record)" class="download-btn">
              <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
            </button>
            <button @click="deleteExport(record.id)" class="delete-btn">
              <iconify-icon icon="heroicons:trash" width="16"></iconify-icon>
            </button>
          </div>
        </div>

        <div v-if="exportHistory.length === 0" class="empty-history">
          <iconify-icon icon="heroicons:document-arrow-down" width="48"></iconify-icon>
          <p>暂无导出记录</p>
        </div>
      </div>
    </div>

    <!-- 导出按钮 -->
    <div class="export-actions">
      <button 
        class="export-btn" 
        @click="startExport"
        :disabled="!canExport || isExporting"
      >
        <iconify-icon v-if="isExporting" icon="heroicons:arrow-path" width="20" class="spinning"></iconify-icon>
        <iconify-icon v-else icon="heroicons:arrow-down-tray" width="20"></iconify-icon>
        <span>{{ isExporting ? '导出中...' : '开始导出' }}</span>
      </button>
    </div>

    <!-- 导出进度弹窗 -->
    <div v-if="showProgressModal" class="modal-overlay" @click="closeProgressModal">
      <div class="progress-modal" @click.stop>
        <div class="modal-header">
          <h3>导出进度</h3>
          <button @click="closeProgressModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="progress-content">
          <div class="progress-info">
            <div class="current-task">{{ exportProgress.currentTask }}</div>
            <div class="progress-percent">{{ exportProgress.percent }}%</div>
          </div>
          
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: exportProgress.percent + '%' }"></div>
          </div>
          
          <div class="progress-details">
            <div>已处理: {{ exportProgress.processed }} / {{ exportProgress.total }}</div>
            <div>预计剩余: {{ exportProgress.estimatedTime }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const appStore = useAppStore()

// 族谱ID
const genealogyId = ref(route.params.id as string)

// 导出选项
const exportOptions = ref({
  members: true,
  relationships: true,
  activities: false,
  stories: false,
  albums: false
})

// 导出格式
const selectedFormat = ref('json')

// 导出设置
const exportSettings = ref({
  includePhotos: true,
  includePrivate: false,
  compress: true,
  passwordProtect: false,
  password: ''
})

// 导出状态
const isExporting = ref(false)
const showProgressModal = ref(false)

// 导出进度
const exportProgress = ref({
  percent: 0,
  currentTask: '',
  processed: 0,
  total: 0,
  estimatedTime: ''
})

// 导出历史
const exportHistory = ref([])

// 计算属性
const canExport = computed(() => {
  return Object.values(exportOptions.value).some(option => option)
})

// 生命周期
onMounted(() => {
  loadExportHistory()
})

// 方法
const startExport = async () => {
  if (!canExport.value) {
    appStore.showToast('请至少选择一项导出内容', 'error')
    return
  }

  if (exportSettings.value.passwordProtect && !exportSettings.value.password) {
    appStore.showToast('请设置导出文件密码', 'error')
    return
  }

  isExporting.value = true
  showProgressModal.value = true

  try {
    const exportData = {
      genealogyId: genealogyId.value,
      options: exportOptions.value,
      format: selectedFormat.value,
      settings: exportSettings.value
    }

    const response = await fetch('/api/genealogy/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(exportData)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // 开始轮询导出进度
        pollExportProgress(result.data.taskId)
      } else {
        throw new Error(result.message)
      }
    } else {
      throw new Error('导出请求失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    appStore.showToast('导出失败: ' + error.message, 'error')
    isExporting.value = false
    showProgressModal.value = false
  }
}

const pollExportProgress = async (taskId: string) => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/genealogy/export/progress/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${appStore.token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          exportProgress.value = result.data

          if (result.data.status === 'completed') {
            clearInterval(interval)
            isExporting.value = false
            showProgressModal.value = false
            appStore.showToast('导出完成！', 'success')
            loadExportHistory()
            
            // 自动下载
            if (result.data.downloadUrl) {
              window.open(result.data.downloadUrl, '_blank')
            }
          } else if (result.data.status === 'failed') {
            clearInterval(interval)
            isExporting.value = false
            showProgressModal.value = false
            appStore.showToast('导出失败: ' + result.data.error, 'error')
          }
        }
      }
    } catch (error) {
      console.error('获取导出进度失败:', error)
    }
  }, 2000)
}

const loadExportHistory = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/export/history`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        exportHistory.value = result.data
      }
    }
  } catch (error) {
    console.error('加载导出历史失败:', error)
  }
}

const downloadExport = (record: any) => {
  window.open(record.downloadUrl, '_blank')
}

const deleteExport = async (exportId: string) => {
  try {
    const response = await fetch(`/api/genealogy/export/${exportId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('删除成功', 'success')
        loadExportHistory()
      }
    }
  } catch (error) {
    console.error('删除导出记录失败:', error)
    appStore.showToast('删除失败', 'error')
  }
}

const closeProgressModal = () => {
  if (!isExporting.value) {
    showProgressModal.value = false
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.data-export-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.nav-placeholder {
  width: 40px;
}

/* 通用区块样式 */
.export-options,
.export-formats,
.export-settings,
.export-history {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

/* 导出选项 */
.option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.option-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #07c160;
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 12px;
  color: #666;
}

.option-icon {
  color: #07c160;
}

/* 导出格式 */
.format-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.format-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.format-item.active {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.format-item:hover {
  border-color: #07c160;
}

.format-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 8px 0 4px;
}

.format-desc {
  font-size: 12px;
  color: #666;
}

/* 导出设置 */
.setting-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-item label {
  font-size: 14px;
  color: #333;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  appearance: none;
  background: #ddd;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-switch:checked {
  background: #07c160;
}

.toggle-switch::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: all 0.2s;
}

.toggle-switch:checked::before {
  left: 22px;
}

.password-input {
  margin-top: 8px;
}

.password-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

/* 导出历史 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.history-info {
  flex: 1;
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.history-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.download-btn,
.delete-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn {
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
}

.download-btn:hover {
  background: rgba(7, 193, 96, 0.2);
}

.delete-btn {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.delete-btn:hover {
  background: rgba(255, 59, 48, 0.2);
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-history iconify-icon {
  color: #ccc;
  margin-bottom: 12px;
}

/* 导出按钮 */
.export-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #eee;
}

.export-btn {
  width: 100%;
  height: 48px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.export-btn:not(:disabled):hover {
  background: #06a552;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 进度弹窗 */
.modal-overlay {
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
  padding: 20px;
}

.progress-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.progress-content {
  padding: 20px;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.current-task {
  font-size: 14px;
  color: #333;
}

.progress-percent {
  font-size: 16px;
  font-weight: 600;
  color: #07c160;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: #07c160;
  transition: width 0.3s ease;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}
</style>
