<template>
  <div class="edit-profile-page">
    <MobileTopBar
      title="个人信息"
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button class="save-btn" @click="saveProfile">保存</button>
      </template>
    </MobileTopBar>
    
    <!-- 头像区域 -->
    <div class="profile-header">
      <div class="profile-info" @click="goToPersonalInfo">
        <img :src="userInfo.avatar" alt="头像" class="profile-avatar" />
        <div class="profile-details">
          <h3 class="profile-name">{{ userInfo.name || '未设置昵称' }}</h3>
          <p class="profile-id">叶语号: {{ userInfo.yeyuId || '未设置' }}</p>
        </div>
        <div class="profile-actions">
          <button class="qr-btn" @click.stop="showMyQRCode" title="我的二维码">
            <iconify-icon icon="heroicons:qr-code" width="20"></iconify-icon>
          </button>
          <iconify-icon icon="heroicons:chevron-right" width="16" class="arrow-icon"></iconify-icon>
        </div>
      </div>
    </div>

    <div class="page-content scroll-container">

      <!-- 昵称 -->
      <div class="edit-item-container">
        <div class="edit-item">
          <span class="item-label">昵称</span>
          <input
            v-model="userInfo.name"
            type="text"
            placeholder="请输入昵称"
            class="item-input"
          />
        </div>
      </div>

      <!-- 叶语号 -->
      <div class="edit-item-container">
        <div class="edit-item">
          <span class="item-label">叶语号</span>
          <input
            v-model="userInfo.yeyuId"
            type="text"
            placeholder="叶语号"
            class="item-input"
            readonly
          />
        </div>
      </div>

      <!-- 手机号 -->
      <div class="edit-item-container">
        <div class="edit-item">
          <span class="item-label">手机号</span>
          <input
            v-model="userInfo.phone"
            type="tel"
            placeholder="请输入手机号"
            class="item-input"
          />
        </div>
      </div>

      <!-- 性别 -->
      <div class="edit-item-container">
        <div class="edit-item">
          <span class="item-label">性别</span>
          <select v-model="userInfo.gender" class="item-select">
            <option value="">请选择性别</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
      </div>

      <!-- 生日 -->
      <div class="edit-item-container">
        <div class="edit-item">
          <span class="item-label">生日</span>
          <input
            v-model="userInfo.birthday"
            type="date"
            class="item-input"
          />
        </div>
      </div>

      <!-- 地区 -->
      <div class="edit-item-container">
        <div class="edit-item">
          <span class="item-label">地区</span>
          <input
            v-model="userInfo.region"
            type="text"
            placeholder="请输入所在地区"
            class="item-input"
          />
        </div>
      </div>

      <!-- 个性签名 -->
      <div class="edit-item-container signature-container">
        <div class="edit-item signature-item">
          <span class="item-label">个性签名</span>
        </div>
        <div class="signature-content">
          <textarea
            v-model="userInfo.signature"
            placeholder="写点什么介绍一下自己吧..."
            class="item-textarea"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- 允许通过手机号搜索 -->
      <div class="edit-item-container">
        <div class="edit-item">
          <span class="item-label">允许通过手机号搜索到我</span>
          <input
            v-model="userInfo.allowPhoneSearch"
            type="checkbox"
            class="item-switch"
          />
        </div>
      </div>

      <!-- 允许通过叶语号搜索 -->
      <div class="edit-item-container">
        <div class="edit-item">
          <span class="item-label">允许通过叶语号搜索到我</span>
          <input
            v-model="userInfo.allowYeyuIdSearch"
            type="checkbox"
            class="item-switch"
          />
        </div>
      </div>
    </div>

    <!-- 相机组件 -->
    <WeChatCamera
      v-if="showCamera"
      @close="showCamera = false"
      @capture="handleCameraCapture"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'
import { useAuthStore } from '../../../stores/auth'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'
import WeChatCamera from '../../chat/components/WeChatCamera.vue'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 相机相关状态
const showCamera = ref(false)

// 用户信息
const userInfo = ref({
  name: '',
  yeyuId: '',
  phone: '',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4',
  gender: '',
  birthday: '',
  region: '',
  signature: '',
  allowPhoneSearch: true,
  allowYeyuIdSearch: true
})

// 生命周期
onMounted(() => {
  loadUserInfo()
})

// 方法
const goBack = () => {
  router.back()
}

// 跳转到个人信息页面
const goToPersonalInfo = () => {
  router.push('/settings/personal-info')
}

// 显示我的二维码
const showMyQRCode = () => {
  router.push('/my-qr-code')
}

const loadUserInfo = () => {
  // 从认证store和localStorage加载用户信息
  const user = authStore.userInfo
  const localUser = localStorage.getItem('yeyu_user_info')

  let userData = user
  if (localUser) {
    try {
      const parsedUser = JSON.parse(localUser)
      userData = { ...user, ...parsedUser }
    } catch (error) {
      console.error('解析本地用户信息失败:', error)
    }
  }

  // 默认头像
  const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4'

  if (userData) {
    userInfo.value = {
      name: userData.name || userData.nickname || '',
      yeyuId: userData.yeyuId || userData.yeyu_id || '',
      phone: userData.phone || '',
      avatar: userData.avatar || defaultAvatar,
      gender: userData.gender || '',
      birthday: userData.birthday || '',
      region: userData.region || '',
      signature: userData.signature || '',
      allowPhoneSearch: userData.allowPhoneSearch !== false,
      allowYeyuIdSearch: userData.allowYeyuIdSearch !== false
    }
    console.log('✅ 加载用户信息成功:', userInfo.value)
  } else {
    // 如果没有用户数据，使用默认值
    userInfo.value.avatar = defaultAvatar
    console.log('⚠️ 未找到用户数据，使用默认头像')
  }
}

// 拍照功能
const takePhoto = () => {
  showCamera.value = true
}

// 从相册选择图片
const selectFromAlbum = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      await handleImageFile(file)
    }
  }
  input.click()
}

// 处理拍照结果
const handleCameraCapture = async (mediaData: { type: string, blob: Blob, url: string }) => {
  if (mediaData.type === 'photo') {
    await uploadAvatar(mediaData.blob)
  }
  showCamera.value = false
}

// 处理图片文件
const handleImageFile = async (file: File) => {
  // 检查文件大小（限制为5MB）
  if (file.size > 5 * 1024 * 1024) {
    appStore.showToast('图片大小不能超过5MB', 'error')
    return
  }

  await uploadAvatar(file)
}

// 上传头像
const uploadAvatar = async (file: Blob | File) => {
  try {
    appStore.showToast('正在上传头像...', 'info')

    const formData = new FormData()
    formData.append('avatar', file)

    const response = await fetch('http://localhost:8893/api/user/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token')}`
      },
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      // 更新头像
      userInfo.value.avatar = result.data.avatar

      // 更新认证store
      const currentUser = authStore.getCurrentUser()
      if (currentUser) {
        currentUser.avatar = result.data.avatar
        authStore.setUser(currentUser)
        localStorage.setItem('yeyu_user_info', JSON.stringify(currentUser))
      }

      appStore.showToast('头像上传成功！', 'success')
    } else {
      throw new Error(result.error || '头像上传失败')
    }
  } catch (error) {
    console.error('❌ 头像上传失败:', error)
    appStore.showToast('头像上传失败', 'error')
  }
}

const changeAvatar = () => {
  // 这个方法保留作为备用
  selectFromAlbum()
}

const saveProfile = async () => {
  try {
    appStore.showToast('正在保存...', 'info')

    // 验证必填字段
    if (!userInfo.value.name.trim()) {
      appStore.showToast('请输入昵称', 'error')
      return
    }

    // 模拟保存到服务器
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 保存到localStorage
    const currentUser = JSON.parse(localStorage.getItem('yeyu_user_info') || '{}')
    const updatedUser = { ...currentUser, ...userInfo.value }
    localStorage.setItem('yeyu_user_info', JSON.stringify(updatedUser))

    // 更新认证store中的用户信息
    authStore.updateUserInfo(updatedUser)

    console.log('✅ 用户信息保存成功:', updatedUser)
    appStore.showToast('保存成功！', 'success')

    // 延迟返回
    setTimeout(() => {
      goBack()
    }, 1000)
  } catch (error) {
    console.error('❌ 保存失败:', error)
    appStore.showToast('保存失败，请重试', 'error')
  }
}
</script>

<style scoped>
.edit-profile-page {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 头像区域样式 */
.profile-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.profile-info {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 88px; /* 确保容器高度 */
}

.profile-info:hover {
  background: #f8f9fa;
}

.profile-info:active {
  background: #f0f1f2;
}

/* 左侧头像 */
.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 16px;
  border: 1px solid #e5e5e5;
  flex-shrink: 0; /* 防止头像被压缩 */
}

/* 中间用户信息区域 */
.profile-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 56px;
  min-width: 0; /* 允许文本截断 */
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 6px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-id {
  font-size: 14px;
  color: #666666;
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧操作区域 */
.profile-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 4px 0;
  flex-shrink: 0; /* 防止被压缩 */
}

.qr-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #666666;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.qr-btn:hover {
  background: #f0f1f2;
  color: #333333;
  transform: scale(1.05);
}

.qr-btn:active {
  transform: scale(0.95);
}

.arrow-icon {
  color: #cccccc;
  transition: color 0.2s ease;
}

.profile-info:hover .arrow-icon {
  color: #999999;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .profile-info {
    padding: 12px 16px;
  }

  .profile-avatar {
    width: 48px;
    height: 48px;
    margin-right: 12px;
  }

  .profile-details {
    height: 48px;
  }

  .profile-name {
    font-size: 16px;
  }

  .profile-id {
    font-size: 13px;
  }

  .profile-actions {
    height: 48px;
  }

  .qr-btn {
    width: 28px;
    height: 28px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .profile-header {
    background: #1a1a1a;
    border-bottom-color: #333333;
  }

  .profile-info:hover {
    background: #2a2a2a;
  }

  .profile-name {
    color: #ffffff;
  }

  .profile-id {
    color: #cccccc;
  }

  .qr-btn {
    color: #cccccc;
  }

  .qr-btn:hover {
    background: #333333;
    color: #ffffff;
  }

  .arrow-icon {
    color: #666666;
  }
}

.page-content {
  height: calc(100vh - 75px - 90px); /* 减去导航栏(75px)和头像区域(90px)的高度 */
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
}

.save-btn {
  background: #07C160;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.save-btn:hover {
  background: #06a552;
}

.profile-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.section-title {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

/* 统一的编辑项容器样式 */
.edit-item-container {
  background: white;
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
}

.edit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0 16px;
  transition: background-color 0.2s;
}

.edit-item:hover {
  background: #f8f8f8;
}

/* 头像项特殊样式 */
.edit-item-container:first-child .edit-item {
  height: 68px;
  cursor: pointer;
}

.item-label {
  font-size: 16px;
  color: #333;
  min-width: 80px;
}

/* 头像相关样式 */
.avatar-container {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.avatar-img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
}

.camera-btn {
  background: #07C160;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  color: white;
}

.camera-btn:hover {
  background: #06a552;
}



/* 输入框样式 */
.item-input,
.item-select {
  flex: 1;
  margin-left: 12px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
  text-align: right;
  color: #333;
}

.item-input[readonly] {
  color: #999;
}

.item-input::placeholder,
.item-select::placeholder {
  color: #999;
}

.item-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 32px;
}

/* 个性签名特殊样式 */
.signature-container {
  padding: 0;
}

.signature-item {
  height: 36px;
  border-bottom: 1px solid #f0f0f0;
}

.signature-content {
  padding: 12px 16px;
}

.item-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.item-textarea:focus {
  border-color: #07C160;
}

/* 开关样式 */
.item-switch {
  width: 44px;
  height: 24px;
  appearance: none;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
}

.item-switch:checked {
  background: #07C160;
}

.item-switch::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.item-switch:checked::before {
  transform: translateX(20px);
}

.form-note {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-item label {
  margin-bottom: 0;
  flex: 1;
}

.form-switch {
  width: auto;
  margin: 0;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}
</style>

<!-- 编辑资料页面 - 修复动态导入问题 -->
