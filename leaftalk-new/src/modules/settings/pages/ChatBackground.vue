<template>
  <div class="chat-background-page">
    <!-- 页面内容 -->
    <div class="page-content">
      <!-- 功能项列表 -->
      <div class="settings-section">
        <div class="setting-item" @click="selectFromGallery">
          <span>选择聊天背景</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>

        <div class="setting-item" @click="selectFromAlbum">
          <span>从手机相册选择</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>

        <div class="setting-item" @click="takePhoto">
          <span>拍一张</span>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { saveChatBackground, getCurrentChatId } from '../../chat/utils/chatBackgroundManager'

const router = useRouter()
const eventBus = inject('eventBus') as any

// 选择聊天背景（跳转到背景选择页面，显示9个预设背景）
const selectFromGallery = () => {
  console.log('🎨 跳转到背景选择页面')
  router.push('/settings/chat-background-gallery')
}

// 从手机相册选择（直接打开文件选择器）
const selectFromAlbum = () => {
  console.log('📱 从手机相册选择背景')
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      // 检查文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片文件大小不能超过5MB')
        return
      }

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        console.log('✅ 自定义背景已选择')

        const chatId = getCurrentChatId()
        console.log('📝 当前聊天ID:', chatId)

        // 保存自定义背景设置到当前聊天
        saveChatBackground(chatId, `custom:${imageUrl}`)

        console.log('✅ 背景设置成功')

        // 触发事件通知聊天页面更新背景
        if (eventBus) {
          eventBus.emit('chatBackground:updated', {
            chatId,
            background: `custom:${imageUrl}`
          })
          console.log('📢 已触发 chatBackground:updated 事件')
        }

        // 跳转到聊天页面
        router.push(`/chat/${chatId}`)
      }
      reader.onerror = () => {
        alert('图片读取失败，请重试')
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// 拍一张（跳转到拍摄页面，只允许拍照）
const takePhoto = () => {
  console.log('📷 跳转到拍摄页面')
  const chatId = getCurrentChatId()
  console.log('📝 传递聊天ID到拍照页面:', chatId)
  // 跳转到拍摄页面，传递参数表示只允许拍照，并传递 chatId
  router.push({
    path: '/chat-camera',
    query: {
      mode: 'photo-only',
      from: 'chat-background',
      chatId: chatId
    }
  })
}
</script>

<style scoped>
.chat-background-page {
  min-height: 100vh;
  background: #E5E5E5;
}

.page-content {
  padding: 0;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 2px; /* 项与项之间的间距为2px */
  background: #E5E5E5;
  margin-top: 0; /* 第一项与顶部导航栏的间距为0 */
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-item:active {
  background: #f5f5f5;
}

.setting-item span {
  font-size: 16px;
  color: #333;
}
</style>
