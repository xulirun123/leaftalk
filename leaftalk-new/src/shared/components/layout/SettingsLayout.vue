<template>
  <div class="settings-layout">
    <!-- 统一导航栏 -->
    <div class="settings-header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">{{ title }}</div>
      <div class="header-action">
        <slot name="header-action"></slot>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="settings-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  title: string
  showBackButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBackButton: true
})

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.settings-layout {
  height: 100vh;
  background: #EDEDED; /* 统一的灰色背景 */
  display: flex;
  flex-direction: column;
}

/* 统一导航栏 - 48px高度 */
.settings-header {
  background: white;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
  height: 48px; /* 统一的导航栏高度 */
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.header-action {
  display: flex;
  align-items: center;
}

/* 内容区域 - 8px网格系统 */
.settings-content {
  margin-top: 48px; /* 为固定导航栏留出空间 */
  flex: 1;
  overflow-y: auto;
  padding: 8px; /* 8px网格系统 */
  background: #EDEDED; /* 确保内容区域也是灰色背景 */
}
</style>
