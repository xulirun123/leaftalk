<template>
  <div class="settings-group">
    <!-- 分组标题（文本项） -->
    <SettingsItem
      v-if="title"
      type="text"
      :title="title"
      :clickable="false"
    />
    
    <!-- 分组内容 -->
    <div class="group-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import SettingsItem from './SettingsItem.vue'

interface Props {
  title?: string
}

defineProps<Props>()
</script>

<style scoped>
.settings-group {
  margin-bottom: 8px; /* 8px网格系统 */
}

.group-content {
  background: white;
  border-radius: 8px; /* 圆角卡片 */
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 第一个分组去掉上边距 */
.settings-group:first-child {
  margin-top: 0;
}

/* 最后一个分组增加底部边距，为底部导航栏留出空间 */
.settings-group:last-child {
  margin-bottom: 80px;
}
</style>
