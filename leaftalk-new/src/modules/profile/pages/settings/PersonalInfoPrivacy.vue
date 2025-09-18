<template>
  <div class="personal-info-privacy">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">个人信息与权限</div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 个人信息可见性 -->
      <div class="settings-section">
        <div class="section-title">个人信息可见性</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>显示真实姓名</span>
            <span class="setting-desc">朋友可以看到您的真实姓名</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.showRealName }" @click="toggleRealName">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>显示手机号</span>
            <span class="setting-desc">朋友可以看到您的手机号</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.showPhone }" @click="togglePhone">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>显示邮箱</span>
            <span class="setting-desc">朋友可以看到您的邮箱地址</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.showEmail }" @click="toggleEmail">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>显示地区</span>
            <span class="setting-desc">朋友可以看到您的所在地区</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.showRegion }" @click="toggleRegion">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>显示个性签名</span>
            <span class="setting-desc">朋友可以看到您的个性签名</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.showSignature }" @click="toggleSignature">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <!-- 位置权限 -->
      <div class="settings-section">
        <div class="section-title">位置权限</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>允许分享位置</span>
            <span class="setting-desc">在聊天中可以分享您的位置信息</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.shareLocation }" @click="toggleLocation">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item" @click="setLocationAccuracy">
          <div class="setting-info">
            <span>位置精度</span>
            <span class="setting-value">{{ privacyStore.locationAccuracyLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 数据权限 -->
      <div class="settings-section">
        <div class="section-title">数据权限</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>允许数据收集</span>
            <span class="setting-desc">用于改善产品体验和服务质量</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.allowDataCollection }" @click="toggleDataCollection">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>允许个性化推荐</span>
            <span class="setting-desc">基于您的使用习惯提供个性化内容</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.allowPersonalization }" @click="togglePersonalization">
            <div class="toggle-thumb"></div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>允许第三方数据分享</span>
            <span class="setting-desc">与合作伙伴分享匿名化数据</span>
          </div>
          <div class="setting-toggle" :class="{ active: privacyStore.settings.allowThirdPartySharing }" @click="toggleThirdPartySharing">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <!-- 隐私说明 -->
      <div class="privacy-explanation">
        <h3>隐私保护说明</h3>
        <p>我们致力于保护您的个人隐私和数据安全。您可以随时调整这些设置来控制个人信息的可见性和数据的使用方式。</p>
        <p>关闭某些权限可能会影响部分功能的正常使用，但不会影响核心聊天功能。</p>
      </div>
    </div>

    <!-- 位置精度选择弹窗 -->
    <div v-if="showLocationModal" class="modal-overlay" @click="closeLocationModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>选择位置精度</h3>
          <button class="modal-close" @click="closeLocationModal">
            <iconify-icon icon="heroicons:x-mark" width="20" style="color: #666;"></iconify-icon>
          </button>
        </div>
        <div class="modal-body">
          <div 
            v-for="option in privacyStore.locationAccuracyOptions" 
            :key="option.value"
            class="option-item"
            @click="selectLocationAccuracy(option.value)"
          >
            <div class="option-info">
              <span class="option-label">{{ option.label }}</span>
              <span class="option-desc">{{ getLocationAccuracyDesc(option.value) }}</span>
            </div>
            <div class="option-check" v-if="privacyStore.settings.locationAccuracy === option.value">
              <iconify-icon icon="heroicons:check" width="20" style="color: #07c160;"></iconify-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrivacyStore } from '../../../stores/privacy'

const router = useRouter()
const privacyStore = usePrivacyStore()

// 弹窗状态
const showLocationModal = ref(false)

const goBack = () => {
  router.back()
}

// 切换开关方法
const toggleRealName = () => {
  privacyStore.updateSetting('showRealName', !privacyStore.settings.showRealName)
}

const togglePhone = () => {
  privacyStore.updateSetting('showPhone', !privacyStore.settings.showPhone)
}

const toggleEmail = () => {
  privacyStore.updateSetting('showEmail', !privacyStore.settings.showEmail)
}

const toggleRegion = () => {
  privacyStore.updateSetting('showRegion', !privacyStore.settings.showRegion)
}

const toggleSignature = () => {
  privacyStore.updateSetting('showSignature', !privacyStore.settings.showSignature)
}

const toggleLocation = () => {
  privacyStore.updateSetting('shareLocation', !privacyStore.settings.shareLocation)
}

const toggleDataCollection = () => {
  privacyStore.updateSetting('allowDataCollection', !privacyStore.settings.allowDataCollection)
}

const togglePersonalization = () => {
  privacyStore.updateSetting('allowPersonalization', !privacyStore.settings.allowPersonalization)
}

const toggleThirdPartySharing = () => {
  privacyStore.updateSetting('allowThirdPartySharing', !privacyStore.settings.allowThirdPartySharing)
}

// 位置精度设置
const setLocationAccuracy = () => {
  showLocationModal.value = true
}

const closeLocationModal = () => {
  showLocationModal.value = false
}

const selectLocationAccuracy = (accuracy: string) => {
  privacyStore.updateSetting('locationAccuracy', accuracy as any)
  closeLocationModal()
}

const getLocationAccuracyDesc = (accuracy: string) => {
  switch (accuracy) {
    case 'precise':
      return '精确到具体位置（误差约10米）'
    case 'approximate':
      return '大概位置（误差约1公里）'
    case 'city_only':
      return '仅显示城市信息'
    default:
      return ''
  }
}

onMounted(() => {
  privacyStore.init()
})
</script>

<style scoped>
.personal-info-privacy {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
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

.settings-content {
  margin-top: 60px;
  padding: 16px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
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
  font-size: 16px;
  color: #333;
}

.setting-desc {
  font-size: 12px;
  color: #999;
}

.setting-value {
  font-size: 14px;
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

.privacy-explanation {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.privacy-explanation h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
}

.privacy-explanation p {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
}

/* 弹窗样式 */
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.modal-close {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
}

.modal-body {
  max-height: 60vh;
  overflow-y: auto;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item:hover {
  background: #f8f8f8;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.option-label {
  font-size: 16px;
  color: #333;
}

.option-desc {
  font-size: 12px;
  color: #999;
}

.option-check {
  display: flex;
  align-items: center;
}
</style>
