<template>
  <div class="personal-info">
    <!-- 内容区域 -->
    <div class="content-wrapper">
      <!-- 头像项 -->
      <div class="info-item avatar-item" @click="changeAvatar">
        <div class="item-label">{{ $t('settings.avatar') }}</div>
        <div class="item-content">
          <img :src="userInfo.avatar" :alt="$t('settings.avatar')" class="user-avatar" />
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 名字项 -->
      <div class="info-item" @click="changeName">
        <div class="item-label">{{ $t('settings.name') }}</div>
        <div class="item-content">
          <span class="item-value">{{ userInfo.name || $t('settings.notSet') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 手机号项 -->
      <div class="info-item" @click="changePhone">
        <div class="item-label">{{ $t('settings.phone') }}</div>
        <div class="item-content">
          <span class="item-value">{{ userInfo.phone || $t('settings.notSet') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 叶语号项 -->
      <div
        class="info-item"
        :class="{ 'disabled': !yeyuIdStatus.canModify }"
        @click="handleYeyuIdClick"
      >
        <div class="item-label">{{ $t('settings.yeyuId') }}</div>
        <div class="item-content">
          <span
            class="item-value"
            :class="{ 'disabled-text': !yeyuIdStatus.canModify }"
          >
            {{ userInfo.yeyuId || $t('settings.notSet') }}
          </span>
          <span v-if="!yeyuIdStatus.canModify" class="disabled-note">
            {{ yeyuIdStatus.nextModifyTime }}{{ $t('settings.canModifyAfter') }}
          </span>
          <iconify-icon
            v-if="yeyuIdStatus.canModify"
            icon="heroicons:chevron-right"
            width="16"
            class="arrow-icon"
          ></iconify-icon>
        </div>
      </div>

      <!-- 我的二维码项 -->
      <div class="info-item" @click="showMyQRCode">
        <div class="item-label">{{ $t('settings.myQRCode') }}</div>
        <div class="item-content">
          <iconify-icon icon="heroicons:qr-code" width="20" class="qr-icon"></iconify-icon>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 拍一拍项 -->
      <div class="info-item" @click="changePaiYiPai">
        <div class="item-label">{{ $t('settings.paiYiPai') }}</div>
        <div class="item-content">
          <span class="item-value">{{ userInfo.paiYiPai || $t('settings.notSet') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 性别项 -->
      <div class="info-item" @click="changeGender">
        <div class="item-label">{{ $t('settings.gender') }}</div>
        <div class="item-content">
          <span class="item-value">{{ formatGender(userInfo.gender) }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 地区项 -->
      <div class="info-item" @click="changeRegion">
        <div class="item-label">{{ $t('settings.region') }}</div>
        <div class="item-content">
          <span class="item-value">{{ userInfo.region || $t('settings.notSet') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>

      <!-- 个性签名项 -->
      <div class="info-item" @click="changeSignature">
        <div class="item-label">{{ $t('settings.signature') }}</div>
        <div class="item-content">
          <span class="item-value">{{ userInfo.signature || $t('settings.notSet') }}</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// 叶语号修改状态
const yeyuIdStatus = ref({
  canModify: true,
  modificationCount: 0,
  maxModifications: 1,
  lastModified: null,
  nextModifyTime: null,
  currentYear: new Date().getFullYear()
})

// 用户信息 - 从authStore获取真实数据
const userInfo = computed(() => {
  const currentUser = authStore.user

  console.log('📊 个人信息页面计算用户信息:', {
    currentUser,
    hasUser: !!currentUser,
    gender: currentUser?.gender,
    signature: currentUser?.signature
  })

  if (!currentUser) {
    return {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4',
      name: '叶语用户',
      phone: '138****8888',
      yeyuId: 'yeyu_user123',
      paiYiPai: '拍了拍你的头',
      gender: '未设置',
      region: '未设置',
      signature: '未设置'
    }
  }

  const result = {
    avatar: currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4',
    name: currentUser.nickname || currentUser.username || '叶语用户',
    phone: currentUser.phone || '138****8888',
    yeyuId: currentUser.yeyu_id || 'yeyu_user123',
    paiYiPai: '拍了拍你的头',
    gender: currentUser.gender || 'unknown', // 使用 'unknown' 而不是 '未设置'
    region: currentUser.region || '未设置',
    signature: currentUser.signature || '未设置'
  }

  console.log('📊 个人信息页面计算结果:', result)
  return result
})

// 获取叶语号修改状态
const fetchYeyuIdStatus = async () => {
  try {
    const response = await fetch('/api/user/yeyu-id-status', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        yeyuIdStatus.value = result.data
        console.log('📊 叶语号修改状态:', result.data)
      }
    }
  } catch (error) {
    console.error('获取叶语号修改状态失败:', error)
    // 默认允许修改，避免阻塞用户
    yeyuIdStatus.value.canModify = true
  }
}

// 生命周期
onMounted(async () => {
  // 确保用户数据已加载
  if (!authStore.user && authStore.token) {
    await authStore.fetchUserInfo()
  }

  // 获取叶语号修改状态
  await fetchYeyuIdStatus()

})

// 监听用户信息更新事件
const handleUserInfoUpdate = async (event: CustomEvent) => {
  console.log('📢 个人信息页面收到用户信息更新事件:', event.detail)
  console.log('📢 更新前的authStore.user:', authStore.user)
  console.log('📢 更新前的userInfo:', userInfo.value)

  // 重新获取用户信息
  await authStore.fetchUserInfo()

  console.log('📢 更新后的authStore.user:', authStore.user)
  console.log('📢 更新后的userInfo:', userInfo.value)

  // 如果是叶语号更新，重新获取修改状态
  if (event.detail?.type === 'yeyuId') {
    await fetchYeyuIdStatus()
  }
}

// 添加事件监听器
window.addEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener)

// 页面卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('userInfoUpdated', handleUserInfoUpdate as EventListener)
})

// 返回上级页面
const goBack = () => {
  console.log('🔙 个人信息页面返回')
  router.back()
}

// 各项功能方法
const changeAvatar = () => {
  router.push('/settings/avatar-view')
}

const changeName = () => {
  router.push('/settings/change-name')
}

const changePhone = () => {
  router.push('/settings/change-phone')
}

const changeYeyuId = () => {
  router.push('/settings/change-yeyu-id')
}

// 处理叶语号点击事件
const handleYeyuIdClick = () => {
  if (yeyuIdStatus.value.canModify) {
    changeYeyuId()
  } else {
    // 显示不可修改的提示
    appStore.showToast(`叶语号每年只能修改一次，下次可修改时间：${yeyuIdStatus.value.nextModifyTime}`, 'warning', 4000)
  }
}

const showMyQRCode = () => {
  router.push('/my-qr-code')
}

const changePaiYiPai = () => {
  console.log('拍一拍设置功能开发中')
}

const changeGender = () => {
  router.push('/settings/change-gender')
}

const changeRegion = () => {
  router.push('/settings/region-selector')
}

const changeSignature = () => {
  router.push('/settings/change-signature')
}

// 格式化性别显示
const formatGender = (gender: string) => {
  console.log('🔍 formatGender 被调用:', gender)
  const genderMap: Record<string, string> = {
    'male': t('settings.male'),
    'female': t('settings.female'),
    'unknown': t('settings.notSet')
  }
  const result = genderMap[gender] || t('settings.notSet')
  console.log('🔍 formatGender 结果:', result)
  return result
}
</script>

<style scoped>
.personal-info {
  height: 100vh;
  background: #EDEDED;
  overflow: hidden;
}

.content-wrapper {
  height: 100vh;
  background: #EDEDED;
  padding-top: 0; /* 移除padding，让第一项与导航栏重合 */
  box-sizing: border-box;
  overflow-y: auto;
}

/* 信息项容器 */
.info-item {
  height: 48px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #E5E5E5;
}

/* 头像项特殊高度 */
.avatar-item {
  height: 68px;
  margin-top: 0; /* 确保与顶部导航栏间距为0 */
}

/* 最后一项不显示分隔线 */
.info-item:last-child {
  border-bottom: none;
}

.info-item:active {
  background: #f0f0f0;
}

.item-label {
  font-size: 13px;
  color: #333;
  font-weight: normal;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-value {
  font-size: 13px;
  color: #666;
}

/* 头像样式 */
.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
}

/* 箭头图标 */
.arrow-icon {
  color: #999;
}

/* 二维码图标 */
.qr-icon {
  color: #666;
}

/* 禁用状态样式 */
.info-item.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.info-item.disabled:hover {
  background-color: transparent;
}

.disabled-text {
  color: #999 !important;
}

.disabled-note {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .info-item {
    padding: 0 12px;
  }
  
  .item-label {
    font-size: 13px;
  }

  .item-value {
    font-size: 13px;
  }
  
  .user-avatar {
    width: 52px;
    height: 52px;
  }
}
</style>
