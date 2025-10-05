<template>
  <i class="simple-icon" :class="iconClass" :style="iconStyle">
    {{ iconText }}
  </i>
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
  size: '16px',
  color: 'currentColor',
  className: ''
})

// 简单图标映射（使用Unicode字符）
const iconMap: { [key: string]: string } = {
  // 基础图标
  'home': '⌂',
  'user': '👤',
  'users': '👥',
  'settings': '⚙',
  'search': '🔍',
  'add': '+',
  'plus': '+',
  'minus': '-',
  'edit': '✎',
  'delete': '×',
  'remove': '×',
  'close': '×',
  'check': '✓',
  'checkmark': '✓',
  'cross': '×',
  'warning': '⚠',
  'alert': '⚠',
  'error': '⚠',
  'info': 'ⓘ',
  'question': '?',
  'help': '?',
  
  // 导航图标
  'arrow-left': '←',
  'arrow-right': '→',
  'arrow-up': '↑',
  'arrow-down': '↓',
  'chevron-left': '‹',
  'chevron-right': '›',
  'chevron-up': '⌃',
  'chevron-down': '⌄',
  'back': '←',
  'forward': '→',
  'up': '↑',
  'down': '↓',
  'menu': '☰',
  'hamburger': '☰',
  'more': '⋯',
  'dots': '⋯',
  
  // 媒体图标
  'play': '▶',
  'pause': '⏸',
  'stop': '⏹',
  'record': '⏺',
  'next': '⏭',
  'previous': '⏮',
  'fast-forward': '⏩',
  'rewind': '⏪',
  'volume': '🔊',
  'mute': '🔇',
  
  // 文件图标
  'file': '📄',
  'folder': '📁',
  'image': '🖼',
  'video': '🎥',
  'audio': '🎵',
  'document': '📄',
  'pdf': '📄',
  'zip': '📦',
  
  // 通信图标
  'phone': '📞',
  'email': '✉',
  'mail': '✉',
  'message': '💬',
  'chat': '💬',
  'comment': '💬',
  'notification': '🔔',
  'bell': '🔔',
  
  // 状态图标
  'online': '●',
  'offline': '○',
  'busy': '●',
  'away': '○',
  'loading': '⟳',
  'refresh': '⟳',
  'sync': '⟳',
  'spinner': '⟳',
  
  // 操作图标
  'save': '💾',
  'download': '⬇',
  'upload': '⬆',
  'share': '📤',
  'export': '📤',
  'import': '📥',
  'copy': '📋',
  'paste': '📋',
  'cut': '✂',
  
  // 社交图标
  'heart': '♥',
  'like': '♥',
  'star': '★',
  'favorite': '★',
  'bookmark': '🔖',
  'tag': '🏷',
  'flag': '🚩',
  
  // 系统图标
  'power': '⏻',
  'battery': '🔋',
  'wifi': '📶',
  'signal': '📶',
  'bluetooth': '🔵',
  'usb': '🔌',
  'printer': '🖨',
  
  // 叶语特色
  'leaf': '🍃',
  'tree': '🌳',
  'family': '👪',
  'genealogy': '📜',
  'ancestor': '👴',
  'memorial': '🕯',
  'blessing': '🙏',
  'tradition': '🏮',
  'chinese': '中',
  'culture': '🏛'
}

const iconText = computed(() => {
  return iconMap[props.name] || props.name.charAt(0).toUpperCase()
})

const iconClass = computed(() => {
  return [
    'simple-icon',
    `simple-icon-${props.name}`,
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
    verticalAlign: 'middle',
    fontStyle: 'normal',
    fontWeight: 'normal',
    textAlign: 'center',
    width: size,
    height: size
  }
})
</script>

<style scoped>
.simple-icon {
  display: inline-block;
  line-height: 1;
  vertical-align: middle;
  font-style: normal;
  font-weight: normal;
  text-align: center;
  user-select: none;
  transition: all 0.2s ease;
}

.simple-icon:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

/* 特殊动画效果 */
.simple-icon-loading,
.simple-icon-refresh,
.simple-icon-sync,
.simple-icon-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 脉冲效果 */
.simple-icon-online,
.simple-icon-busy {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 心跳效果 */
.simple-icon-heart,
.simple-icon-like {
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
