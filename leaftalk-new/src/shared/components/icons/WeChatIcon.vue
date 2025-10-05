<template>
  <span class="wechat-icon" :class="iconClass" :style="iconStyle">
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

// WeChat风格图标映射
const iconMap: { [key: string]: string } = {
  // 基础图标
  'home': '🏠',
  'user': '👤',
  'users': '👥',
  'settings': '⚙️',
  'search': '🔍',
  'add': '➕',
  'plus': '➕',
  'minus': '➖',
  'edit': '✏️',
  'delete': '🗑️',
  'remove': '❌',
  'close': '❌',
  'check': '✅',
  'checkmark': '✅',
  'cross': '❌',
  'warning': '⚠️',
  'alert': '⚠️',
  'error': '❌',
  'info': 'ℹ️',
  'question': '❓',
  'help': '❓',
  
  // 导航图标
  'arrow-left': '⬅️',
  'arrow-right': '➡️',
  'arrow-up': '⬆️',
  'arrow-down': '⬇️',
  'chevron-left': '‹',
  'chevron-right': '›',
  'chevron-up': '⌃',
  'chevron-down': '⌄',
  'back': '⬅️',
  'forward': '➡️',
  'up': '⬆️',
  'down': '⬇️',
  'menu': '☰',
  'hamburger': '☰',
  'more': '⋯',
  'dots': '⋯',
  
  // 通信图标
  'chat': '💬',
  'message': '💬',
  'comment': '💬',
  'phone': '📞',
  'call': '📞',
  'video-call': '📹',
  'voice': '🎤',
  'microphone': '🎤',
  'speaker': '🔊',
  'volume': '🔊',
  'mute': '🔇',
  'email': '✉️',
  'mail': '✉️',
  'notification': '🔔',
  'bell': '🔔',
  
  // 媒体图标
  'camera': '📷',
  'photo': '📷',
  'image': '🖼️',
  'picture': '🖼️',
  'video': '🎥',
  'film': '🎥',
  'music': '🎵',
  'audio': '🎵',
  'play': '▶️',
  'pause': '⏸️',
  'stop': '⏹️',
  'record': '⏺️',
  'next': '⏭️',
  'previous': '⏮️',
  'fast-forward': '⏩',
  'rewind': '⏪',
  
  // 文件图标
  'file': '📄',
  'document': '📄',
  'folder': '📁',
  'pdf': '📄',
  'zip': '📦',
  'attachment': '📎',
  'link': '🔗',
  'url': '🔗',
  
  // 操作图标
  'save': '💾',
  'download': '⬇️',
  'upload': '⬆️',
  'share': '📤',
  'export': '📤',
  'import': '📥',
  'copy': '📋',
  'paste': '📋',
  'cut': '✂️',
  'refresh': '🔄',
  'reload': '🔄',
  'sync': '🔄',
  'loading': '⟳',
  'spinner': '⟳',
  
  // 社交图标
  'heart': '❤️',
  'like': '❤️',
  'love': '❤️',
  'star': '⭐',
  'favorite': '⭐',
  'bookmark': '🔖',
  'tag': '🏷️',
  'flag': '🚩',
  'thumbs-up': '👍',
  'thumbs-down': '👎',
  
  // 状态图标
  'online': '🟢',
  'offline': '🔴',
  'busy': '🟡',
  'away': '🟠',
  'invisible': '⚫',
  'success': '✅',
  'failed': '❌',
  'pending': '🟡',
  'completed': '✅',
  
  // 系统图标
  'power': '⏻',
  'battery': '🔋',
  'wifi': '📶',
  'signal': '📶',
  'bluetooth': '🔵',
  'usb': '🔌',
  'printer': '🖨️',
  'keyboard': '⌨️',
  'mouse': '🖱️',
  'monitor': '🖥️',
  'mobile': '📱',
  'tablet': '📱',
  'laptop': '💻',
  'desktop': '🖥️',
  
  // 位置图标
  'location': '📍',
  'map': '🗺️',
  'navigation': '🧭',
  'compass': '🧭',
  'gps': '📍',
  
  // 时间图标
  'clock': '🕐',
  'time': '🕐',
  'calendar': '📅',
  'date': '📅',
  'schedule': '📅',
  'timer': '⏰',
  'alarm': '⏰',
  
  // 购物图标
  'shopping': '🛒',
  'cart': '🛒',
  'bag': '🛍️',
  'gift': '🎁',
  'present': '🎁',
  'money': '💰',
  'coin': '🪙',
  'credit-card': '💳',
  'payment': '💳',
  
  // 天气图标
  'sun': '☀️',
  'moon': '🌙',
  'cloud': '☁️',
  'rain': '🌧️',
  'snow': '❄️',
  'thunder': '⛈️',
  'wind': '💨',
  
  // 叶语特色图标
  'leaf': '🍃',
  'tree': '🌳',
  'family': '👨‍👩‍👧‍👦',
  'genealogy': '📜',
  'ancestor': '👴',
  'memorial': '🕯️',
  'blessing': '🙏',
  'tradition': '🏮',
  'culture': '🏛️',
  'chinese': '中',
  'yeyu': '🍃',
  
  // 表情图标
  'smile': '😊',
  'happy': '😊',
  'sad': '😢',
  'angry': '😠',
  'surprised': '😲',
  'confused': '😕',
  'thinking': '🤔',
  'wink': '😉',
  'laugh': '😂',
  'cry': '😭'
}

const iconText = computed(() => {
  return iconMap[props.name] || '❓'
})

const iconClass = computed(() => {
  return [
    'wechat-icon',
    `wechat-icon-${props.name}`,
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
.wechat-icon {
  display: inline-block;
  line-height: 1;
  vertical-align: middle;
  font-style: normal;
  font-weight: normal;
  text-align: center;
  user-select: none;
  transition: all 0.2s ease;
}

.wechat-icon:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

/* 特殊动画效果 */
.wechat-icon-loading,
.wechat-icon-refresh,
.wechat-icon-sync,
.wechat-icon-spinner {
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
.wechat-icon-online,
.wechat-icon-busy,
.wechat-icon-notification {
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
.wechat-icon-heart,
.wechat-icon-like,
.wechat-icon-love {
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

/* 摇摆效果 */
.wechat-icon-bell,
.wechat-icon-alarm {
  animation: swing 2s ease-in-out infinite;
}

@keyframes swing {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(5deg);
  }
  75% {
    transform: rotate(-5deg);
  }
}

/* 弹跳效果 */
.wechat-icon-success,
.wechat-icon-completed {
  animation: bounce 1s ease-in-out;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
</style>
