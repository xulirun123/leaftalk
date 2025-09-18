<template>
  <div class="about">
    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 应用信息 -->
      <div class="app-info">
        <div class="app-logo">
          <div class="logo-icon">
            <iconify-icon icon="heroicons:leaf" width="64" style="color: #07C160;"></iconify-icon>
          </div>
          <h2 class="app-name">叶语</h2>
          <p class="app-version">版本 {{ appVersion }}</p>
        </div>
      </div>

      <!-- 功能介绍 -->
      <div class="settings-section">
        <div class="section-title">功能介绍</div>
        <div class="feature-list">
          <div class="feature-item">
            <iconify-icon icon="heroicons:chat-bubble-left-right" width="20" style="color: #07C160;"></iconify-icon>
            <span>即时通讯</span>
          </div>
          <div class="feature-item">
            <iconify-icon icon="heroicons:camera" width="20" style="color: #07C160;"></iconify-icon>
            <span>朋友圈</span>
          </div>
          <div class="feature-item">
            <iconify-icon icon="heroicons:video-camera" width="20" style="color: #07C160;"></iconify-icon>
            <span>视频号</span>
          </div>
          <div class="feature-item">
            <iconify-icon icon="heroicons:credit-card" width="20" style="color: #07C160;"></iconify-icon>
            <span>支付功能</span>
          </div>
        </div>
      </div>

      <!-- 应用信息 -->
      <div class="settings-section">
        <div class="setting-item" @click="checkUpdate">
          <div class="setting-info">
            <span>检查新版本</span>
            <span class="setting-value">当前已是最新版本</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewChangelog">
          <div class="setting-info">
            <span>版本更新日志</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewLicense">
          <div class="setting-info">
            <span>软件许可及服务协议</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewPrivacyPolicy">
          <div class="setting-info">
            <span>隐私政策</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 技术信息 -->
      <div class="settings-section">
        <div class="section-title">技术信息</div>
        <div class="tech-info">
          <div class="tech-item">
            <span class="tech-label">构建版本</span>
            <span class="tech-value">{{ buildVersion }}</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">构建时间</span>
            <span class="tech-value">{{ buildTime }}</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">技术栈</span>
            <span class="tech-value">Vue 3 + TypeScript</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">设备信息</span>
            <span class="tech-value">{{ deviceInfo }}</span>
          </div>
        </div>
      </div>

      <!-- 联系我们 -->
      <div class="settings-section">
        <div class="section-title">联系我们</div>
        <div class="setting-item" @click="contactSupport">
          <div class="setting-info">
            <span>客服支持</span>
            <span class="setting-desc">遇到问题？联系我们的客服团队</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="joinGroup">
          <div class="setting-info">
            <span>官方交流群</span>
            <span class="setting-desc">加入用户交流群，获取最新资讯</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="copyright">
        <p>© 2024 叶语团队</p>
        <p>保留所有权利</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 应用信息
const appVersion = ref('1.0.0')
const buildVersion = ref('20241201.001')
const buildTime = ref('2024-12-01 10:30:00')

// 设备信息
const deviceInfo = computed(() => {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'iOS'
  } else if (/Android/.test(ua)) {
    return 'Android'
  } else {
    return 'Web'
  }
})

const goBack = () => {
  router.back()
}

// 功能方法
const checkUpdate = () => {
  console.log('检查更新')
  // 这里可以实现检查更新逻辑
}

const viewChangelog = () => {
  console.log('查看更新日志')
}

const viewLicense = () => {
  console.log('查看软件许可协议')
}

const viewPrivacyPolicy = () => {
  console.log('查看隐私政策')
}

const contactSupport = () => {
  console.log('联系客服')
}

const joinGroup = () => {
  console.log('加入官方群')
}
</script>

<style scoped>
.about {
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
  font-size: 13px;
  font-weight: normal;
  color: #333;
}

.settings-content {
  margin-top: 0; /* 让第一项与导航栏重合 */
  padding: 0; /* 移除padding，让第一项与导航栏重合 */
}

.app-info {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  padding: 32px 16px;
  text-align: center;
}

.app-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: #f0f9f0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-name {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.app-version {
  font-size: 13px;
  color: #666;
  margin: 0;
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

.feature-list {
  padding: 8px 16px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
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

.setting-value {
  font-size: 13px;
  color: #666;
}

.setting-desc {
  font-size: 12px;
  color: #999;
}

.tech-info {
  padding: 8px 16px 16px;
}

.tech-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.tech-item:last-child {
  border-bottom: none;
}

.tech-label {
  font-size: 13px;
  color: #666;
}

.tech-value {
  font-size: 13px;
  color: #333;
}

.copyright {
  text-align: center;
  padding: 32px 16px;
  color: #999;
  font-size: 12px;
  line-height: 1.5;
}

.copyright p {
  margin: 0;
}
</style>
