<template>
  <!-- 如果有背景，使用双图标结构 -->
  <div v-if="hasBackground" :class="containerClass" :style="containerStyle">
    <iconify-icon
      :icon="iconName"
      :width="innerIconSize"
      :height="innerIconSize"
      :style="innerIconStyle"
    />
  </div>

  <!-- 如果没有背景，直接显示图标 -->
  <iconify-icon
    v-else
    :icon="iconName"
    :width="iconSize"
    :height="iconSize"
    :style="iconStyle"
    :class="iconClass"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getIcon, getIconSize, getIconColor, ICON_MAP } from '../../config/iconConfig'

interface Props {
  // 图标类别和名称
  category: keyof typeof ICON_MAP
  name: string

  // 尺寸 (可以是预设尺寸或自定义数字)
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number

  // 颜色 (可以是预设颜色或自定义颜色)
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' | 'white' | 'black' | string

  // 背景颜色 (如果提供，将显示带背景的图标)
  backgroundColor?: string

  // 自定义类名
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'black',
  backgroundColor: '',
  class: ''
})

// 计算图标名称
const iconName = computed(() => {
  return getIcon(props.category, props.name)
})

// 计算图标尺寸
const iconSize = computed(() => {
  if (typeof props.size === 'number') {
    return props.size
  }
  return getIconSize(props.size)
})

// 计算图标样式
const iconStyle = computed(() => {
  let color = props.color
  
  // 如果是预设颜色，获取对应的颜色值
  if (['primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'info', 'white', 'black'].includes(props.color)) {
    color = getIconColor(props.color as any)
  }
  
  return {
    color: color
  }
})

// 计算图标类名
const iconClass = computed(() => {
  return `unified-icon ${props.class}`
})

// 是否有背景
const hasBackground = computed(() => {
  return !!props.backgroundColor
})

// 容器样式（背景）
const containerStyle = computed(() => {
  if (!hasBackground.value) return {}

  return {
    backgroundColor: props.backgroundColor,
    width: `${iconSize.value}px`,
    height: `${iconSize.value}px`,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

// 容器类名
const containerClass = computed(() => {
  return `unified-icon-container ${props.class}`
})

// 内部图标尺寸（背景模式下图标要小一些）
const innerIconSize = computed(() => {
  const baseSize = iconSize.value
  return Math.round(baseSize * 0.5) // 图标是容器的50%
})

// 内部图标样式（背景模式下图标是白色）
const innerIconStyle = computed(() => {
  return {
    color: 'white'
  }
})
</script>

<style scoped>
.unified-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
