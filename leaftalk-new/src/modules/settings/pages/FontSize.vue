<template>
  <div class="font-size-settings">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">字体大小</div>
    </div>

    <!-- 字体大小设置 -->
    <div class="settings-content">
      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-title">预览</div>
        <div class="preview-content" :style="{ fontSize: previewFontSize }">
          <div class="preview-text">这是一段示例文字，用于预览字体大小效果。</div>
          <div class="preview-chat">
            <div class="chat-message">你好，这是聊天消息的字体大小</div>
            <div class="chat-time">14:30</div>
          </div>
        </div>
      </div>

      <!-- 字体大小选项 -->
      <div class="settings-section">
        <div 
          v-for="size in fontSizes" 
          :key="size.value"
          class="font-size-item"
          @click="selectFontSize(size.value)"
        >
          <div class="font-size-info">
            <div class="font-size-name">{{ size.label }}</div>
            <div class="font-size-desc">{{ size.description }}</div>
          </div>
          <div class="font-size-check" v-if="generalStore.settings.fontSize === size.value">
            <iconify-icon icon="heroicons:check" width="20" style="color: #07c160;"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 说明文字 -->
      <div class="font-size-note">
        <p>字体大小设置将应用到聊天消息、朋友圈内容等文字显示。</p>
        <p>建议根据您的视力情况和使用习惯选择合适的字体大小。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneralStore } from '../stores/settingsStore'

const router = useRouter()
const generalStore = useGeneralStore()

// 字体大小选项
const fontSizes = [
  { 
    value: 'small', 
    label: '小', 
    description: '适合喜欢紧凑显示的用户',
    size: '14px'
  },
  { 
    value: 'standard', 
    label: '标准', 
    description: '推荐的默认字体大小',
    size: '16px'
  },
  { 
    value: 'large', 
    label: '大', 
    description: '适合需要更清晰显示的用户',
    size: '18px'
  },
  { 
    value: 'extra-large', 
    label: '特大', 
    description: '适合视力不佳的用户',
    size: '20px'
  }
]

// 预览字体大小
const previewFontSize = computed(() => {
  const currentSize = fontSizes.find(size => size.value === generalStore.settings.fontSize)
  return currentSize?.size || '16px'
})

const goBack = () => {
  router.back()
}

const selectFontSize = (fontSize: string) => {
  generalStore.updateSetting('fontSize', fontSize as any)
}
</script>

<style scoped>
.font-size-settings {
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

.preview-content {
  transition: font-size 0.3s ease;
}

.preview-text {
  color: #333;
  line-height: 1.5;
  margin-bottom: 16px;
}

.preview-chat {
  background: #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-message {
  color: #333;
  flex: 1;
}

.chat-time {
  color: #999;
  font-size: 0.9em;
  margin-left: 12px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.font-size-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.font-size-item:last-child {
  border-bottom: none;
}

.font-size-item:hover {
  background: #f8f8f8;
}

.font-size-info {
  flex: 1;
}

.font-size-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 2px;
}

.font-size-desc {
  font-size: 12px;
  color: #999;
}

.font-size-check {
  display: flex;
  align-items: center;
}

.font-size-note {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.font-size-note p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
</style>
