<template>
  <span class="local-icon" :class="iconClass" :style="iconStyle">
    {{ iconText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  size?: string | number
  color?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: '24px',
  color: 'currentColor',
  className: ''
})

// 本地图标映射
const iconMap: { [key: string]: string } = {
  // 基础图标
  'home': '🏠',
  'user': '👤',
  'settings': '⚙️',
  'search': '🔍',
  'add': '➕',
  'edit': '✏️',
  'delete': '🗑️',
  'save': '💾',
  'close': '❌',
  'check': '✅',
  'warning': '⚠️',
  'error': '❌',
  'info': 'ℹ️',
  'success': '✅',
  
  // 导航图标
  'back': '⬅️',
  'forward': '➡️',
  'up': '⬆️',
  'down': '⬇️',
  'menu': '☰',
  'more': '⋯',
  
  // 社交图标
  'chat': '💬',
  'message': '📧',
  'phone': '📞',
  'video': '📹',
  'camera': '📷',
  'image': '🖼️',
  'file': '📄',
  'folder': '📁',
  
  // 功能图标
  'heart': '❤️',
  'star': '⭐',
  'bookmark': '🔖',
  'share': '📤',
  'download': '⬇️',
  'upload': '⬆️',
  'refresh': '🔄',
  'sync': '🔄',
  
  // 状态图标
  'online': '🟢',
  'offline': '🔴',
  'busy': '🟡',
  'away': '🟠',
  
  // 叶语特色图标
  'leaf': '🍃',
  'tree': '🌳',
  'family': '👨‍👩‍👧‍👦',
  'genealogy': '📜',
  'ancestor': '👴',
  'memorial': '🕯️',
  'blessing': '🙏',
  'tradition': '🏮'
}

const iconText = computed(() => {
  return iconMap[props.name] || '❓'
})

const iconClass = computed(() => {
  return [
    'local-icon',
    props.className
  ].filter(Boolean).join(' ')
})

const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  
  return {
    fontSize: size,
    color: props.color,
    display: 'inline-block',
    lineHeight: '1',
    verticalAlign: 'middle'
  }
})
</script>

<style scoped>
.local-icon {
  display: inline-block;
  line-height: 1;
  vertical-align: middle;
  user-select: none;
  transition: all 0.2s ease;
}

.local-icon:hover {
  transform: scale(1.1);
}
</style>
