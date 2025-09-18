<template>
  <div class="chat-background-settings">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ $t('settings.chatBackground') }}</div>
    </div>

    <!-- 背景设置内容 -->
    <div class="settings-content">
      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-title">预览</div>
        <div class="chat-preview" :style="{ backgroundImage: previewBackground }">
          <div class="message-bubble received">
            <span>{{ $t('chat.sampleMessage') }}</span>
          </div>
          <div class="message-bubble sent">
            <span>好的，谢谢！</span>
          </div>
        </div>
      </div>

      <!-- 背景选项 -->
      <div class="settings-section">
        <div class="section-title">选择背景</div>
        
        <!-- 默认背景 -->
        <div 
          class="background-item"
          :class="{ active: generalStore.settings.chatBackground === 'default' }"
          @click="selectBackground('default')"
        >
          <div class="background-preview default-bg"></div>
          <span>默认</span>
          <div class="check-icon" v-if="generalStore.settings.chatBackground === 'default'">
            <iconify-icon icon="heroicons:check" width="20" style="color: #07c160;"></iconify-icon>
          </div>
        </div>

        <!-- 纯色背景 -->
        <div 
          v-for="color in colorBackgrounds" 
          :key="color.id"
          class="background-item"
          :class="{ active: generalStore.settings.chatBackground === color.id }"
          @click="selectBackground(color.id)"
        >
          <div class="background-preview" :style="{ backgroundColor: color.value }"></div>
          <span>{{ color.name }}</span>
          <div class="check-icon" v-if="generalStore.settings.chatBackground === color.id">
            <iconify-icon icon="heroicons:check" width="20" style="color: #07c160;"></iconify-icon>
          </div>
        </div>

        <!-- 图片背景 -->
        <div 
          v-for="image in imageBackgrounds" 
          :key="image.id"
          class="background-item"
          :class="{ active: generalStore.settings.chatBackground === image.id }"
          @click="selectBackground(image.id)"
        >
          <div class="background-preview" :style="{ backgroundImage: `url(${image.url})` }"></div>
          <span>{{ image.name }}</span>
          <div class="check-icon" v-if="generalStore.settings.chatBackground === image.id">
            <iconify-icon icon="heroicons:check" width="20" style="color: #07c160;"></iconify-icon>
          </div>
        </div>

        <!-- 当前自定义背景 -->
        <div
          v-if="generalStore.settings.chatBackground.startsWith('custom:')"
          class="background-item"
          :class="{ active: generalStore.settings.chatBackground.startsWith('custom:') }"
          @click="selectBackground(generalStore.settings.chatBackground)"
        >
          <div
            class="background-preview"
            :style="{
              backgroundImage: `url(${generalStore.settings.chatBackground.replace('custom:', '')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }"
          ></div>
          <span>当前自定义</span>
          <div class="check-icon" v-if="generalStore.settings.chatBackground.startsWith('custom:')">
            <iconify-icon icon="heroicons:check" width="20" style="color: #07c160;"></iconify-icon>
          </div>
        </div>

        <!-- 选择新的自定义背景 -->
        <div class="background-item" @click="selectCustomBackground">
          <div class="background-preview custom-bg">
            <iconify-icon icon="heroicons:plus" width="24" style="color: #666;"></iconify-icon>
          </div>
          <span>{{ generalStore.settings.chatBackground.startsWith('custom:') ? '更换自定义' : '自定义' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneralStore } from '../../../stores/general'

const router = useRouter()
const generalStore = useGeneralStore()

// 纯色背景选项
const colorBackgrounds = [
  { id: 'white', name: '白色', value: '#ffffff' },
  { id: 'light-gray', name: '浅灰', value: '#f5f5f5' },
  { id: 'dark-gray', name: '深灰', value: '#333333' },
  { id: 'blue', name: '蓝色', value: '#4a90e2' },
  { id: 'green', name: '绿色', value: '#7ed321' },
  { id: 'purple', name: '紫色', value: '#9013fe' }
]

// 图片背景选项
const imageBackgrounds = [
  { 
    id: 'nature1', 
    name: '自然1', 
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop'
  },
  { 
    id: 'nature2', 
    name: '自然2', 
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop'
  },
  { 
    id: 'abstract1', 
    name: '抽象1', 
    url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=600&fit=crop'
  },
  { 
    id: 'abstract2', 
    name: '抽象2', 
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=600&fit=crop'
  }
]

// 预览背景
const previewBackground = computed(() => {
  const current = generalStore.settings.chatBackground

  if (current === 'default') {
    return 'none'
  }

  // 处理自定义背景
  if (current.startsWith('custom:')) {
    const imageUrl = current.replace('custom:', '')
    return `url(${imageUrl})`
  }

  const colorBg = colorBackgrounds.find(bg => bg.id === current)
  if (colorBg) {
    return `linear-gradient(${colorBg.value}, ${colorBg.value})`
  }

  const imageBg = imageBackgrounds.find(bg => bg.id === current)
  if (imageBg) {
    return `url(${imageBg.url})`
  }

  return 'none'
})

const goBack = () => {
  router.back()
}

const selectBackground = (backgroundId: string) => {
  generalStore.updateSetting('chatBackground', backgroundId)
}

const selectCustomBackground = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (event) => {
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

        // 保存自定义背景设置
        generalStore.updateSetting('chatBackground', `custom:${imageUrl}`)

        // 显示成功提示
        const toast = document.createElement('div')
        toast.textContent = '背景设置成功'
        toast.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          z-index: 9999;
        `
        document.body.appendChild(toast)

        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 2000)
      }
      reader.onerror = () => {
        alert('图片读取失败，请重试')
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}
</script>

<style scoped>
.chat-background-settings {
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
  height: 48px;
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

.preview-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  font-weight: 500;
}

.chat-preview {
  height: 200px;
  background: #ededed;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.chat-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.message-bubble {
  position: relative;
  z-index: 1;
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.message-bubble.received {
  background: white;
  align-self: flex-start;
}

.message-bubble.sent {
  background: #95ec69;
  align-self: flex-end;
}

.settings-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.background-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.background-item:last-child {
  border-bottom: none;
}

.background-item:hover {
  background: #f8f8f8;
}

.background-item.active {
  background: #f0f9ff;
}

.background-preview {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
  background-size: cover;
  background-position: center;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.default-bg {
  background: linear-gradient(45deg, #ededed 25%, transparent 25%), 
              linear-gradient(-45deg, #ededed 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #ededed 75%), 
              linear-gradient(-45deg, transparent 75%, #ededed 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.custom-bg {
  background: #f8f8f8;
  border: 2px dashed #ccc;
}

.background-item span {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.check-icon {
  display: flex;
  align-items: center;
}
</style>
