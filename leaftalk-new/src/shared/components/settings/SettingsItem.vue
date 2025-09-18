<template>
  <div
    :class="[
      'settings-item',
      {
        'clickable': clickable,
        'text-item': type === 'text',
        'normal-item': type === 'normal'
      }
    ]"
    :data-type="type"
    @click="handleClick"
  >
    <!-- 左侧图标或表情符号 -->
    <div v-if="icon" class="item-icon">
      <span v-if="isEmoji(icon)" class="emoji-icon">{{ icon }}</span>
      <iconify-icon v-else :icon="icon" :width="iconSize" :style="{ color: iconColor }"></iconify-icon>
    </div>

    <!-- 主要内容 -->
    <div class="item-content">
      <div class="item-title yy-function-item-text">{{ title }}</div>
      <div v-if="subtitle" class="item-subtitle">{{ subtitle }}</div>
    </div>

    <!-- 右侧内容 -->
    <div class="item-right">
      <!-- 值显示 -->
      <span v-if="value" class="item-value">{{ value }}</span>
      
      <!-- 开关组件 -->
      <ToggleSwitch 
        v-if="type === 'switch'"
        :modelValue="switchValue"
        @update:modelValue="handleSwitchChange"
      />
      
      <!-- 选中状态图标 -->
      <iconify-icon
        v-if="showCheck"
        icon="heroicons:check"
        width="20"
        style="color: #07C160;"
      ></iconify-icon>

      <!-- 右侧箭头图标 -->
      <iconify-icon
        v-if="showArrow"
        icon="heroicons:chevron-right"
        width="16"
        style="color: #c8c8c8;"
      ></iconify-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'

interface Props {
  type?: 'normal' | 'text' | 'switch'
  title: string
  subtitle?: string
  value?: string
  icon?: string
  iconColor?: string
  iconSize?: number
  showArrow?: boolean
  showCheck?: boolean
  clickable?: boolean
  switchValue?: boolean
}

interface Emits {
  (e: 'click'): void
  (e: 'switch-change', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'normal',
  iconColor: '#666',
  iconSize: 20,
  showArrow: false,
  showCheck: false,
  clickable: true,
  switchValue: false
})

const emit = defineEmits<Emits>()

// 判断是否为表情符号
const isEmoji = (str: string) => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  return emojiRegex.test(str)
}

const handleClick = () => {
  if (props.clickable && props.type !== 'switch') {
    emit('click')
  }
}

const handleSwitchChange = (value: boolean) => {
  emit('switch-change', value)
}
</script>

<style scoped>
.settings-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

/* 文本项：高度25px，背景灰色 */
.text-item {
  height: 25px;
  background: #e5e5e5;
  border-bottom: 1px solid #d0d0d0;
}

.text-item .item-title {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* 正常项：高度48px，背景白色 */
.normal-item {
  height: 48px;
  background: white;
}

.normal-item .item-title {
  font-size: var(--yy-function-item-font-size);
  color: var(--yy-function-item-text-color);
  font-weight: 400;
}

/* 开关项也是48px高度 */
.settings-item:has(ToggleSwitch) {
  height: 48px;
  background: white;
}

/* 确保所有包含开关的项都是48px */
.settings-item[data-type="switch"] {
  height: 48px;
  background: white;
}

/* 可点击项的悬停效果 */
.clickable:hover {
  background: #f8f8f8;
}

.text-item.clickable:hover {
  background: #ddd;
}

/* 左侧图标 */
.item-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.emoji-icon {
  font-size: 18px;
  line-height: 1;
}

/* 主要内容 */
.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-title {
  line-height: 1.2;
}

.item-subtitle {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
  line-height: 1.2;
}

/* 右侧内容 */
.item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.item-value {
  font-size: 14px;
  color: #999;
}

/* 移除最后一项的边框 */
.settings-item:last-child {
  border-bottom: none;
}
</style>
