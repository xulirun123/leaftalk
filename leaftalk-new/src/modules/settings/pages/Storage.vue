<template>
  <div class="storage-settings">
    <!-- 存储信息 -->
    <div class="settings-content">
      <!-- 存储概览 -->
      <div class="storage-overview">
        <div class="storage-chart">
          <div class="chart-container">
            <div class="usage-circle">
              <div class="usage-text">
                <div class="usage-percent">{{ generalStore.storageUsagePercent }}%</div>
                <div class="usage-label">已使用</div>
              </div>
            </div>
          </div>
        </div>
        <div class="storage-info">
          <div class="storage-total">
            <span>总容量: {{ generalStore.storageTotalGB }}GB</span>
          </div>
          <div class="storage-used">
            <span>已使用: {{ generalStore.storageUsedGB }}GB</span>
          </div>
          <div class="storage-free">
            <span>可用: {{ (parseFloat(generalStore.storageTotalGB) - parseFloat(generalStore.storageUsedGB)).toFixed(1) }}GB</span>
          </div>
        </div>
      </div>

      <!-- 存储详情 -->
      <div class="settings-section">
        <div class="section-title">存储详情</div>
        <div class="storage-item">
          <div class="storage-item-info">
            <iconify-icon icon="heroicons:photo" width="20" style="color: #07c160;"></iconify-icon>
            <span>图片</span>
          </div>
          <span class="storage-size">{{ (generalStore.storageInfo.breakdown.images / 1024).toFixed(1) }}GB</span>
        </div>
        <div class="storage-item">
          <div class="storage-item-info">
            <iconify-icon icon="heroicons:video-camera" width="20" style="color: #ff6b35;"></iconify-icon>
            <span>视频</span>
          </div>
          <span class="storage-size">{{ (generalStore.storageInfo.breakdown.videos / 1024).toFixed(1) }}GB</span>
        </div>
        <div class="storage-item">
          <div class="storage-item-info">
            <iconify-icon icon="heroicons:document" width="20" style="color: #4285f4;"></iconify-icon>
            <span>文件</span>
          </div>
          <span class="storage-size">{{ (generalStore.storageInfo.breakdown.files / 1024).toFixed(1) }}GB</span>
        </div>
        <div class="storage-item">
          <div class="storage-item-info">
            <iconify-icon icon="heroicons:archive-box" width="20" style="color: #9e9e9e;"></iconify-icon>
            <span>缓存</span>
          </div>
          <span class="storage-size">{{ (generalStore.storageInfo.breakdown.cache / 1024).toFixed(1) }}GB</span>
        </div>
        <div class="storage-item">
          <div class="storage-item-info">
            <iconify-icon icon="heroicons:ellipsis-horizontal" width="20" style="color: #666;"></iconify-icon>
            <span>其他</span>
          </div>
          <span class="storage-size">{{ (generalStore.storageInfo.breakdown.other / 1024).toFixed(1) }}GB</span>
        </div>
      </div>

      <!-- 清理选项 -->
      <div class="settings-section">
        <div class="section-title">清理选项</div>
        <div class="cleanup-item" @click="cleanupCache">
          <div class="cleanup-info">
            <iconify-icon icon="heroicons:trash" width="20" style="color: #fa5151;"></iconify-icon>
            <div>
              <div class="cleanup-title">清理缓存</div>
              <div class="cleanup-desc">清理临时文件和缓存数据</div>
            </div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="cleanup-item" @click="cleanupOldFiles">
          <div class="cleanup-info">
            <iconify-icon icon="heroicons:clock" width="20" style="color: #ff9500;"></iconify-icon>
            <div>
              <div class="cleanup-title">清理过期文件</div>
              <div class="cleanup-desc">清理7天前的临时文件</div>
            </div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 自动清理设置 -->
      <div class="settings-section">
        <div class="section-title">自动清理</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>自动清理过期文件</span>
            <span class="setting-desc">自动清理超过设定天数的临时文件</span>
          </div>
          <div class="setting-toggle" :class="{ active: generalStore.settings.autoCleanup }" @click="toggleAutoCleanup">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item" @click="setCleanupDays">
          <div class="setting-info">
            <span>清理周期</span>
            <span class="setting-value">{{ generalStore.settings.cleanupDays }}天</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>

    <!-- 清理进度对话框 -->
    <div v-if="showCleanupDialog" class="cleanup-dialog">
      <div class="dialog-content">
        <div class="dialog-title">正在清理...</div>
        <div class="dialog-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: cleanupProgress + '%' }"></div>
          </div>
          <div class="progress-text">{{ cleanupProgress }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneralStore } from '../stores/settingsStore'

const router = useRouter()
const generalStore = useGeneralStore()

// 清理对话框状态
const showCleanupDialog = ref(false)
const cleanupProgress = ref(0)

const goBack = () => {
  router.back()
}

// 清理缓存
const cleanupCache = async () => {
  if (confirm('确定要清理缓存吗？这将删除所有临时文件和缓存数据。')) {
    showCleanupDialog.value = true
    cleanupProgress.value = 0
    
    try {
      // 模拟清理进度
      const interval = setInterval(() => {
        cleanupProgress.value += 10
        if (cleanupProgress.value >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            showCleanupDialog.value = false
            alert('缓存清理完成')
            generalStore.calculateStorageUsage()
          }, 500)
        }
      }, 200)
      
      await generalStore.cleanupStorage(['cache', 'temp'])
    } catch (error) {
      showCleanupDialog.value = false
      alert('清理失败，请重试')
    }
  }
}

// 清理过期文件
const cleanupOldFiles = async () => {
  if (confirm(`确定要清理${generalStore.settings.cleanupDays}天前的文件吗？`)) {
    showCleanupDialog.value = true
    cleanupProgress.value = 0
    
    try {
      // 模拟清理进度
      const interval = setInterval(() => {
        cleanupProgress.value += 15
        if (cleanupProgress.value >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            showCleanupDialog.value = false
            alert('过期文件清理完成')
            generalStore.calculateStorageUsage()
          }, 500)
        }
      }, 300)
      
      await generalStore.cleanupStorage(['old_files'])
    } catch (error) {
      showCleanupDialog.value = false
      alert('清理失败，请重试')
    }
  }
}

// 切换自动清理
const toggleAutoCleanup = () => {
  generalStore.updateSetting('autoCleanup', !generalStore.settings.autoCleanup)
}

// 设置清理周期
const setCleanupDays = () => {
  const days = prompt('请输入清理周期（天）:', generalStore.settings.cleanupDays.toString())
  if (days && !isNaN(parseInt(days))) {
    const numDays = parseInt(days)
    if (numDays >= 1 && numDays <= 30) {
      generalStore.updateSetting('cleanupDays', numDays)
    } else {
      alert('清理周期必须在1-30天之间')
    }
  }
}

onMounted(() => {
  generalStore.calculateStorageUsage()
})
</script>

<style scoped>
.storage-settings {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.settings-content {
  position: absolute;
  top: 0; /* 让第一项与导航栏重合 */
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0; /* 移除padding，让第一项与导航栏重合 */
  overflow-y: auto;
}

.storage-overview {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.chart-container {
  width: 80px;
  height: 80px;
  position: relative;
}

.usage-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(#07c160 0deg, #07c160 var(--usage-angle, 120deg), #f0f0f0 var(--usage-angle, 120deg));
  display: flex;
  align-items: center;
  justify-content: center;
}

.usage-text {
  text-align: center;
}

.usage-percent {
  font-size: 13px;
  font-weight: normal;
  color: #333;
}

.usage-label {
  font-size: 12px;
  color: #666;
}

.storage-info {
  flex: 1;
}

.storage-total,
.storage-used,
.storage-free {
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 13px;
  color: #666;
  font-weight: normal;
}

.storage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.storage-item:last-child {
  border-bottom: none;
}

.storage-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #333;
}

.storage-size {
  font-size: 13px;
  color: #666;
}

.cleanup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.cleanup-item:last-child {
  border-bottom: none;
}

.cleanup-item:hover {
  background: #f8f8f8;
}

.cleanup-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.cleanup-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 2px;
}

.cleanup-desc {
  font-size: 12px;
  color: #999;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-info span:first-child {
  font-size: 13px;
  color: #333;
}

.setting-desc {
  font-size: 12px;
  color: #999;
}

.setting-value {
  font-size: 13px;
  color: #666;
}

.setting-toggle {
  width: 44px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.3s;
  cursor: pointer;
}

.setting-toggle.active {
  background: #07C160;
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-toggle.active .toggle-thumb {
  transform: translateX(20px);
}

/* 清理对话框 */
.cleanup-dialog {
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

.dialog-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 280px;
  text-align: center;
}

.dialog-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 20px;
}

.dialog-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #07c160;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #666;
}
</style>
