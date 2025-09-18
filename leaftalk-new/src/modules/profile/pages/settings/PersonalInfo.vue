<template>
  <div class="personal-info">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">个人资料</div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 头像 -->
      <div class="settings-section">
        <div class="setting-item" @click="changeAvatar">
          <div class="setting-info">
            <span>头像</span>
          </div>
          <div class="avatar-preview">
            <img :src="userInfo.avatar" alt="头像" class="avatar-image" />
            <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="settings-section">
        <div class="section-title">基本信息</div>
        <div class="setting-item" @click="changeNickname">
          <div class="setting-info">
            <span>昵称</span>
            <span class="setting-value">{{ userInfo.nickname || userInfo.name }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item readonly-item">
          <div class="setting-info">
            <span>真实姓名</span>
            <span class="setting-value readonly-value">{{ userInfo.realName || '未验证' }}</span>
          </div>
          <div class="verification-status">
            <iconify-icon icon="heroicons:shield-check" width="16" style="color: #17a2b8;"></iconify-icon>
            <span class="status-text">需身份证验证</span>
          </div>
        </div>
        <div class="setting-item" @click="changeWechatId">
          <div class="setting-info">
            <span>叶语号</span>
            <span class="setting-value">{{ userInfo.wechatId }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="changeQRCode">
          <div class="setting-info">
            <span>我的二维码</span>
            <span class="setting-desc">包含我的叶语号</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 详细资料 -->
      <div class="settings-section">
        <div class="section-title">详细资料</div>
        <div class="setting-item" @click="changeGender">
          <div class="setting-info">
            <span>性别</span>
            <span class="setting-value">{{ userInfo.gender }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="changeRegion">
          <div class="setting-info">
            <span>地区</span>
            <span class="setting-value">{{ userInfo.region }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="changeSignature">
          <div class="setting-info">
            <span>个性签名</span>
            <span class="setting-value">{{ userInfo.signature || '未设置' }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 更多信息 -->
      <div class="settings-section">
        <div class="section-title">更多信息</div>
        <div class="setting-item" @click="changePhone">
          <div class="setting-info">
            <span>手机号</span>
            <span class="setting-value">{{ userInfo.phone }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="changeEmail">
          <div class="setting-info">
            <span>邮箱地址</span>
            <span class="setting-value">{{ userInfo.email || '未绑定' }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="changeAddress">
          <div class="setting-info">
            <span>我的地址</span>
            <span class="setting-value">{{ userInfo.addresses.length }}个地址</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 个人相册 -->
      <div class="settings-section">
        <div class="section-title">个人相册</div>
        <div class="setting-item" @click="managePhotos">
          <div class="setting-info">
            <span>个人相册</span>
            <span class="setting-desc">设置朋友查看的照片</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useMomentsStore } from '../../../stores/moments'
import { getUserInfo, saveUserInfo, userInfoEmitter } from '../../../utils/userInfo'

const router = useRouter()
const authStore = useAuthStore()
const momentsStore = useMomentsStore()

// 用户信息 - 使用当前登录用户数据
const userInfo = computed(() => {
  const currentUser = authStore.getCurrentUser()
  return {
    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
    name: currentUser?.name || '用户',
    wechatId: currentUser?.username || 'user123',
    gender: currentUser?.gender || '未设置',
    region: currentUser?.region || '中国大陆',
    signature: currentUser?.signature || '使用叶语，连接世界',
    phone: currentUser?.phone || '138****8888',
    email: '',
    addresses: []
  }
})

// 我的朋友圈数据
const myMoments = computed(() => {
  const currentUser = authStore.getCurrentUser()
  if (currentUser) {
    return momentsStore.getUserMoments(currentUser.id)
  }
  return []
})

const goBack = () => {
  router.back()
}

// 修改信息方法
const changeAvatar = async () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      // 检查文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }

      try {
        console.log('🖼️ 开始上传头像...', file.name)

        // 显示加载状态
        const loadingToast = { message: '正在上传头像...', type: 'loading' }
        // 这里可以添加loading提示

        // 调用头像上传API
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
          // 更新用户头像
          const currentUser = authStore.getCurrentUser()
          if (currentUser) {
            currentUser.avatar = result.data.avatar
            authStore.setUser(currentUser)

            // 更新localStorage
            localStorage.setItem('yeyu_user_info', JSON.stringify(currentUser))
          }

          console.log('✅ 头像上传成功:', result.data.avatar)
          alert('头像上传成功！')
        } else {
          throw new Error(result.error || '头像上传失败')
        }
      } catch (error) {
        console.error('❌ 头像上传失败:', error)
        alert('头像上传失败: ' + error.message)
      }
    }
  }
      reader.readAsDataURL(file)
    }
  }

  // 触发文件选择
  input.click()
}

// 图片压缩函数
const compressImage = (base64: string, callback: (compressed: string) => void) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  img.onload = () => {
    // 设置目标尺寸（头像通常是正方形，200x200足够）
    const maxSize = 200
    let { width, height } = img

    // 保持宽高比，但限制最大尺寸
    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width
        width = maxSize
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height
        height = maxSize
      }
    }

    canvas.width = width
    canvas.height = height

    // 绘制压缩后的图片
    ctx?.drawImage(img, 0, 0, width, height)

    // 转换为base64（质量0.8）
    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)
    callback(compressedBase64)
  }

  img.src = base64
}

const changeNickname = () => {
  console.log('修改昵称')
  router.push('/settings/change-name')
}

const changeWechatId = () => {
  console.log('修改叶语号')
}

const changeQRCode = () => {
  console.log('查看二维码')
}

const changeGender = () => {
  console.log('修改性别')
}

const changeRegion = () => {
  console.log('修改地区')
}

const changeSignature = () => {
  console.log('修改个性签名')
}

const changePhone = () => {
  console.log('修改手机号')
}

const changeEmail = () => {
  console.log('绑定邮箱')
}

const changeAddress = () => {
  console.log('管理地址')
}

const managePhotos = () => {
  console.log('管理个人相册')
}
</script>

<style scoped>
.personal-info {
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

.setting-value {
  font-size: 14px;
  color: #666;
}

.setting-desc {
  font-size: 12px;
  color: #999;
}

/* 只读项样式 */
.readonly-item {
  cursor: default;
}

.readonly-item:hover {
  background: white;
}

.readonly-value {
  color: #999;
}

.verification-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-text {
  font-size: 12px;
  color: #17a2b8;
}

.avatar-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-image {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
}
</style>
