<template>
  <div class="settings">
    <!-- 使用统一的顶部导航栏 -->
    <MobileTopBar
      :title="$t('settings.title')"
      :show-back="true"
      @back="goBack"
    />

    <!-- 设置列表 -->
    <div class="settings-content">
      <!-- 主要设置项 -->
      <div class="settings-group">
        <div class="setting-item" @click="goToPersonalInfo">
          <span class="setting-text">{{ $t('settings.personalInfo') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
        <div class="setting-item" @click="goToAccountSecurity">
          <span class="setting-text">{{ $t('settings.accountSecurity') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
        <div class="setting-item" @click="goToYouthMode">
          <span class="setting-text">{{ $t('settings.youthMode') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
        <div class="setting-item" @click="goToNotifications">
          <span class="setting-text">{{ $t('settings.notifications') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
        <div class="setting-item" @click="goToGeneral">
          <span class="setting-text">{{ $t('settings.general') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 隐私分组标题 -->
      <div class="section-header">{{ $t('settings.privacy') }}</div>

      <!-- 隐私设置项 -->
      <div class="settings-group">
        <div class="setting-item" @click="goToFriendPermissions">
          <span class="setting-text">{{ $t('settings.friendPermissions') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 退出登录按钮 -->
      <div class="logout-section">
        <button class="logout-btn" @click="showLogoutDialog">
          {{ $t('settings.logout') }}
        </button>
      </div>
    </div>

    <!-- 退出登录确认对话框 -->
    <div v-if="showLogoutConfirm" class="dialog-overlay" @click="hideLogoutDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ $t('settings.logout') }}</h3>
        </div>
        <div class="dialog-content">
          <p>{{ $t('settings.logoutConfirm') }}</p>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="hideLogoutDialog">{{ $t('settings.cancel') }}</button>
          <button class="confirm-btn" @click="confirmLogout">{{ $t('settings.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const showLogoutConfirm = ref(false)

const goBack = () => {
  router.back()
}

const goToPersonalInfo = () => {
  console.log('点击个人资料')
  router.push('/settings/personal-info')
}

const goToAccountSecurity = () => {
  console.log('点击账号安全')
  router.push('/settings/account-security')
}

const goToYouthMode = () => {
  console.log('点击未成年模式')
  router.push('/settings/youth-mode')
}

const goToNotifications = () => {
  console.log('点击消息通知')
  router.push('/settings/notifications')
}

const goToGeneral = () => {
  console.log('点击通用')
  router.push('/settings/general')
}

const goToFriendPermissions = () => {
  console.log('点击朋友权限')
  router.push('/settings/friend-permissions')
}

// 退出登录相关方法
const showLogoutDialog = () => {
  showLogoutConfirm.value = true
}

const hideLogoutDialog = () => {
  showLogoutConfirm.value = false
}

const confirmLogout = async () => {
  try {
    appStore.showToast('正在退出登录...', 'info')

    // 调用退出登录API
    await authStore.logout()

    // 清除本地数据
    localStorage.clear()

    appStore.showToast('已退出登录', 'success')

    // 跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  } catch (error) {
    console.error('❌ 退出登录失败:', error)
    appStore.showToast('退出失败，请重试', 'error')
  } finally {
    hideLogoutDialog()
  }
}
</script>

<style scoped>
.settings {
  height: 100vh;
  background: #e5e5e5;
  overflow-y: auto;
  margin: 0;
  padding: 0;
}

.settings-content {
  position: absolute;
  top: 65px; /* MobileTopBar总高度：状态栏25px + 导航栏40px = 65px */
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0;
  margin: 0;
}

.settings-group {
  background: white;
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #e0e0e0;
}

.setting-item:last-child {
  border-bottom: 1px solid #e0e0e0;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-text {
  font-size: 13px;
  color: #333;
}

.arrow-icon {
  color: #ccc;
}

.section-header {
  height: 25px;
  background: #e5e5e5;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 13px;
  color: #666;
  margin-top: 0; /* 移除间隙 */
}

.logout-section {
  margin-top: 20px; /* 与朋友权限项间距20px */
  padding: 0; /* 移除左右padding */
}

.logout-btn {
  width: 100%;
  height: 44px;
  background: white;
  color: #333;
  border: none;
  border-radius: 0;
  font-size: 13px;
  font-weight: normal;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
  text-align: center; /* 文本居中 */
  padding: 0 16px;
}

.logout-btn:hover {
  background: #f8f8f8;
}

.logout-btn:active {
  background: #f0f0f0;
}

/* 对话框样式 */
.dialog-overlay {
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

.dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.dialog-header {
  padding: 20px 20px 0 20px;
  text-align: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.dialog-content {
  padding: 20px;
  color: #666;
  line-height: 1.5;
  text-align: center;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
}

.cancel-btn {
  color: #666;
  border-right: 1px solid #f0f0f0;
}

.confirm-btn {
  color: #ff4757;
  font-weight: 600;
}

.cancel-btn:hover {
  background: #f8f8f8;
}

.confirm-btn:hover {
  background: #fff5f5;
}
</style>