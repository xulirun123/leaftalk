<template>
  <div class="settings">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ $t('pages.settings') }}</div>
    </div>

    <!-- 设置列表 -->
    <div class="settings-content">
      <!-- 账户与安全 -->
      <div class="settings-section">
        <div class="setting-item" @click="goToAccountSecurity">
          <div class="setting-info">
            <iconify-icon icon="heroicons:shield-check" width="20" style="color: #666;"></iconify-icon>
            <span>{{ $t('settings.accountSecurity') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 隐私 -->
      <div class="settings-section">
        <div class="setting-item" @click="goToPrivacy">
          <div class="setting-info">
            <iconify-icon icon="heroicons:eye-slash" width="20" style="color: #666;"></iconify-icon>
            <span>{{ $t('settings.privacy') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 通用 -->
      <div class="settings-section">
        <div class="setting-item" @click="goToGeneral">
          <div class="setting-info">
            <iconify-icon icon="heroicons:cog-6-tooth" width="20" style="color: #666;"></iconify-icon>
            <span>{{ $t('settings.general') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 新消息通知 -->
      <div class="settings-section">
        <div class="setting-item" @click="goToNotifications">
          <div class="setting-info">
            <iconify-icon icon="heroicons:bell" width="20" style="color: #666;"></iconify-icon>
            <span>{{ $t('settings.notifications') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 个人资料 -->
      <div class="settings-section">
        <div class="setting-item" @click="goToPersonalInfo">
          <div class="setting-info">
            <iconify-icon icon="heroicons:user" width="20" style="color: #666;"></iconify-icon>
            <span>{{ $t('profile.editProfile') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 配偶管理 -->
      <div class="settings-section">
        <div class="setting-item" @click="goToSpouseManagement">
          <div class="setting-info">
            <iconify-icon icon="heroicons:heart" width="20" style="color: #666;"></iconify-icon>
            <span>配偶关联管理</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="goToSpouseVerification">
          <div class="setting-info">
            <iconify-icon icon="heroicons:shield-check" width="20" style="color: #666;"></iconify-icon>
            <span>配偶关系确认</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 关于叶语 -->
      <div class="settings-section">
        <div class="setting-item" @click="goToAbout">
          <div class="setting-info">
            <iconify-icon icon="heroicons:information-circle" width="20" style="color: #666;"></iconify-icon>
            <span>{{ $t('settings.about') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 帮助与反馈 -->
      <div class="settings-section">
        <div class="setting-item" @click="goToHelp">
          <div class="setting-info">
            <iconify-icon icon="heroicons:question-mark-circle" width="20" style="color: #666;"></iconify-icon>
            <span>{{ $t('settings.help') }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 注销用户 -->
      <div class="settings-section">
        <div class="setting-item danger" @click="showDeleteAccountDialog">
          <div class="setting-info">
            <iconify-icon icon="heroicons:trash" width="20" style="color: #ff4757;"></iconify-icon>
            <span style="color: #ff4757;">注销用户</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 注销确认对话框 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="hideDeleteAccountDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>注销用户</h3>
        </div>
        <div class="dialog-content">
          <p>注销用户将会：</p>
          <ul>
            <li>删除您的个人资料和聊天记录</li>
            <li>保留族谱数据供其他族人查看</li>
            <li>无法恢复已删除的数据</li>
          </ul>
          <p style="color: #ff4757; font-weight: bold;">此操作不可逆，请谨慎操作！</p>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="hideDeleteAccountDialog">取消</button>
          <button class="confirm-btn" @click="confirmDeleteAccount">确认注销</button>
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

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const showDeleteDialog = ref(false)

const goBack = () => {
  router.back()
}

const goToAccountSecurity = () => {
  console.log('点击账户与安全')
  router.push('/settings/account-security')
}

const goToPrivacy = () => {
  console.log('点击隐私')
  router.push('/settings/privacy')
}

const goToGeneral = () => {
  console.log('点击通用')
  router.push('/settings/general')
}

const goToNotifications = () => {
  console.log('点击新消息通知')
  router.push('/settings/notifications')
}

const goToPersonalInfo = () => {
  console.log('点击个人资料')
  router.push('/edit-profile')
}

const goToSpouseManagement = () => {
  console.log('点击配偶关联管理')
  router.push('/spouse/management')
}

const goToSpouseVerification = () => {
  console.log('点击配偶关系确认')
  router.push('/spouse/verification')
}

const goToAbout = () => {
  console.log('点击关于叶语')
  router.push('/settings/about')
}

const goToHelp = () => {
  console.log('点击帮助与反馈')
  router.push('/settings/help')
}

// 注销用户相关方法
const showDeleteAccountDialog = () => {
  showDeleteDialog.value = true
}

const hideDeleteAccountDialog = () => {
  showDeleteDialog.value = false
}

const confirmDeleteAccount = async () => {
  try {
    appStore.showToast('正在注销用户...', 'info')

    // 调用注销API
    const response = await fetch('/api/users/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (result.success) {
      appStore.showToast('用户注销成功', 'success')

      // 清除本地数据
      authStore.logout()
      localStorage.clear()

      // 跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      appStore.showToast(result.message || '注销失败', 'error')
    }
  } catch (error) {
    console.error('❌ 注销用户失败:', error)
    appStore.showToast('注销失败，请重试', 'error')
  } finally {
    hideDeleteAccountDialog()
  }
}
</script>

<style scoped>
.settings {
  height: 100%;
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
  padding: 80px 16px 16px 16px; /* 为固定导航栏留出空间 */
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #333;
}

.setting-item.danger:hover {
  background: #fff5f5;
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
  max-height: 80vh;
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
}

.dialog-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.dialog-content li {
  margin: 8px 0;
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
