<template>
  <IconifyIcon :icon="iconName" :width="width" :height="height" :style="iconStyle" />
</template>

<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'
import { computed } from 'vue'

interface Props {
  icon: string
  width?: string | number
  height?: string | number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '24',
  height: '24'
})

// 转换图标名称格式
const iconName = computed(() => {
  // 将 heroicons:name 转换为 heroicons-outline:name
  if (props.icon.startsWith('heroicons:')) {
    return props.icon.replace('heroicons:', 'heroicons-outline:')
  }
  return props.icon
})

// 图标样式
const iconStyle = computed(() => ({
  color: props.color || 'currentColor',
  verticalAlign: 'middle'
}))
</script>

<style scoped>
/* Icon 组件的样式由 @iconify/vue 处理 */
</style>

