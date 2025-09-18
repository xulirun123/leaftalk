<template>
  <div class="youth-mode">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">
        <SmartTranslator text="未成年模式" :auto-translate="true" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <!-- 模式状态 -->
      <div class="status-section">
        <div class="status-card">
          <div class="status-icon">
            <iconify-icon 
              :icon="isYouthModeEnabled ? 'heroicons:shield-check' : 'heroicons:shield-exclamation'" 
              width="32" 
              :style="{ color: isYouthModeEnabled ? '#07c160' : '#ff4757' }"
            ></iconify-icon>
          </div>
          <div class="status-info">
            <h3>
              <SmartTranslator
                :text="isYouthModeEnabled ? '未成年模式已开启' : '未成年模式已关闭'"
                :auto-translate="true"
              />
            </h3>
            <p>
              <SmartTranslator
                :text="isYouthModeEnabled ? '当前处于保护状态' : '点击下方开关开启保护'"
                :auto-translate="true"
              />
            </p>
          </div>
        </div>
      </div>

      <!-- 开关控制 -->
      <div class="control-section">
        <div class="control-item">
          <div class="control-info">
            <span class="control-label">
              <SmartTranslator text="启用未成年模式" :auto-translate="true" />
            </span>
            <span class="control-desc">
              <SmartTranslator text="开启后将限制部分功能使用" :auto-translate="true" />
            </span>
          </div>
          <div class="control-switch">
            <input 
              type="checkbox" 
              id="youth-mode-switch" 
              v-model="isYouthModeEnabled"
              @change="toggleYouthMode"
            >
            <label for="youth-mode-switch" class="switch-label"></label>
          </div>
        </div>
      </div>

      <!-- 功能说明 -->
      <div class="info-section">
        <h4>未成年模式说明</h4>
        <div class="info-list">
          <div class="info-item">
            <iconify-icon icon="heroicons:clock" width="20" style="color: #666;"></iconify-icon>
            <span>限制使用时间段（22:00-06:00禁用）</span>
          </div>
          <div class="info-item">
            <iconify-icon icon="heroicons:currency-dollar" width="20" style="color: #666;"></iconify-icon>
            <span>限制支付功能和红包转账</span>
          </div>
          <div class="info-item">
            <iconify-icon icon="heroicons:user-group" width="20" style="color: #666;"></iconify-icon>
            <span>限制添加陌生人为好友</span>
          </div>
          <div class="info-item">
            <iconify-icon icon="heroicons:photo" width="20" style="color: #666;"></iconify-icon>
            <span>限制朋友圈发布和浏览</span>
          </div>
          <div class="info-item">
            <iconify-icon icon="heroicons:video-camera" width="20" style="color: #666;"></iconify-icon>
            <span>限制视频通话功能</span>
          </div>
        </div>
      </div>

      <!-- 监护人设置 -->
      <div class="guardian-section" v-if="isYouthModeEnabled">
        <h4>监护人设置</h4>
        <div class="guardian-item" @click="setGuardian">
          <div class="guardian-info">
            <span class="guardian-label">设置监护人</span>
            <span class="guardian-desc">{{ guardianPhone || '未设置' }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #ccc;"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import SmartTranslator from '../../../shared/components/translation/SmartTranslator.vue'

const router = useRouter()
const appStore = useAppStore()

const isYouthModeEnabled = ref(false)
const guardianPhone = ref('')

const goBack = () => {
  router.back()
}

const toggleYouthMode = async () => {
  try {
    // 这里应该调用API保存设置
    const newStatus = isYouthModeEnabled.value
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    appStore.showToast(
      newStatus ? '未成年模式已开启' : '未成年模式已关闭', 
      'success'
    )
    
    // 保存到本地存储
    localStorage.setItem('yeyu_youth_mode', newStatus.toString())
    
  } catch (error) {
    console.error('切换未成年模式失败:', error)
    appStore.showToast('设置失败，请重试', 'error')
    // 恢复原状态
    isYouthModeEnabled.value = !isYouthModeEnabled.value
  }
}

const setGuardian = () => {
  // 跳转到监护人设置页面
  router.push('/settings/guardian-setup')
}

const loadSettings = () => {
  // 从本地存储加载设置
  const savedMode = localStorage.getItem('yeyu_youth_mode')
  if (savedMode) {
    isYouthModeEnabled.value = savedMode === 'true'
  }
  
  // 加载监护人信息
  const savedGuardian = localStorage.getItem('yeyu_guardian_phone')
  if (savedGuardian) {
    guardianPhone.value = savedGuardian
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.youth-mode {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
  padding-top: 25px; /* 状态栏高度 */
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: fixed;
  top: 25px;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
  height: 50px;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.content {
  padding: 90px 16px 20px 16px;
}

.status-section {
  margin-bottom: 20px;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.status-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.control-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.control-label {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.control-desc {
  font-size: 14px;
  color: #666;
}

.control-switch {
  position: relative;
}

.control-switch input[type="checkbox"] {
  display: none;
}

.switch-label {
  display: block;
  width: 50px;
  height: 30px;
  background: #ddd;
  border-radius: 15px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative;
}

.switch-label::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.control-switch input[type="checkbox"]:checked + .switch-label {
  background: #07c160;
}

.control-switch input[type="checkbox"]:checked + .switch-label::after {
  transform: translateX(20px);
}

.info-section, .guardian-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.info-section h4, .guardian-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #666;
}

.guardian-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 0;
}

.guardian-label {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.guardian-desc {
  font-size: 14px;
  color: #666;
}
</style>
