<template>
  <div 
    class="unified-avatar"
    :class="[
      `size-${size}`,
      { 
        'clickable': clickable,
        'loading': isLoading,
        'error': hasError
      }
    ]"
    :style="avatarStyle"
    @click="handleClick"
  >
    <!-- 主头像 -->
    <img
      v-if="!hasError"
      :src="finalAvatarUrl"
      :alt="displayName"
      class="avatar-image"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- 错误时的默认头像 -->
    <div v-else class="avatar-fallback">
      <iconify-icon 
        icon="heroicons:user-circle" 
        :width="iconSize"
        style="color: #ccc;"
      />
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="avatar-loading">
      <iconify-icon 
        icon="heroicons:arrow-path" 
        :width="iconSize / 2"
        class="loading-icon"
      />
    </div>
    
    <!-- 状态指示器 -->
    <div 
      v-if="showStatus && status" 
      class="status-indicator"
      :class="status"
    ></div>
    
    <!-- 徽章 -->
    <div 
      v-if="badge && badge > 0" 
      class="avatar-badge"
    >
      {{ badge > 99 ? '99+' : badge }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useUnifiedAvatar } from '../../composables/useUnifiedAvatar'

interface Props {
  // 用户ID - 如果是当前用户，会自动使用统一头像
  userId?: string
  // 头像URL - 对于非当前用户
  src?: string
  // 显示名称
  name?: string
  // 尺寸
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  // 是否可点击
  clickable?: boolean
  // 状态指示器
  showStatus?: boolean
  status?: 'online' | 'offline' | 'away' | 'busy'
  // 徽章数字
  badge?: number
  // 是否为当前用户（强制使用统一头像）
  isCurrentUser?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  clickable: false,
  showStatus: false,
  badge: 0,
  isCurrentUser: false
})

const emit = defineEmits<{
  click: []
  load: []
  error: []
}>()

const { currentUserAvatar, currentUserInfo, getUserAvatar } = useUnifiedAvatar()

// 状态
const isLoading = ref(true)
const hasError = ref(false)

// 显示名称
const displayName = computed(() => {
  if (props.isCurrentUser || props.userId === currentUserInfo.value?.id) {
    return currentUserInfo.value?.nickname || currentUserInfo.value?.name || '叶语用户'
  }
  return props.name || '用户'
})

// 最终头像URL
const finalAvatarUrl = computed(() => {
  // 如果是当前用户，使用统一头像
  if (props.isCurrentUser || props.userId === currentUserInfo.value?.id) {
    return currentUserAvatar.value
  }

  // 其他用户使用传入的头像或生成默认头像
  if (props.userId) {
    return getUserAvatar(props.userId, { name: props.name, avatar: props.src })
  }

  // 如果有传入的头像URL，使用它；否则生成默认头像
  if (props.src && props.src.trim()) {
    return props.src
  }

  // 生成基于名称的稳定头像
  const fallbackName = props.name || displayName.value || 'user'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}&backgroundColor=random`
})

// 尺寸映射
const sizeMap = {
  small: 32,
  medium: 48,
  large: 56,
  xlarge: 80
}

const avatarSize = computed(() => sizeMap[props.size])
const iconSize = computed(() => avatarSize.value)

// 样式
const avatarStyle = computed(() => ({
  width: `${avatarSize.value}px`,
  height: `${avatarSize.value}px`,
  borderRadius: '8px' // 小圆角，符合叶语设计风格
}))

// 事件处理
const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

const handleLoad = () => {
  isLoading.value = false
  hasError.value = false
  emit('load')
}

const handleError = () => {
  console.warn('🖼️ 头像加载失败:', finalAvatarUrl.value)
  isLoading.value = false
  hasError.value = true
  emit('error')

  // 如果是外部图片加载失败，自动切换到备用头像
  if (finalAvatarUrl.value && !finalAvatarUrl.value.includes('dicebear.com')) {
    console.log('🔄 切换到备用头像生成器')
    // 触发重新计算，使用备用头像
    nextTick(() => {
      hasError.value = false
      isLoading.value = true
    })
  }
}

// 监听头像变化
watch(finalAvatarUrl, () => {
  isLoading.value = true
  hasError.value = false
})

onMounted(() => {
  // 如果没有头像URL，直接显示错误状态
  if (!finalAvatarUrl.value) {
    isLoading.value = false
    hasError.value = true
  }
})
</script>

<style scoped>
.unified-avatar {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: #f5f5f5;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.unified-avatar.size-small {
  border-width: 1px;
}

.unified-avatar.size-medium {
  border-width: 1px;
}

.unified-avatar.size-large {
  border-width: 1.5px;
}

.unified-avatar.size-xlarge {
  border-width: 2px;
}

.unified-avatar.clickable {
  cursor: pointer;
}

.unified-avatar.clickable:hover {
  transform: scale(1.05);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}

.avatar-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.online {
  background-color: #52c41a;
}

.status-indicator.offline {
  background-color: #d9d9d9;
}

.status-indicator.away {
  background-color: #faad14;
}

.status-indicator.busy {
  background-color: #ff4d4f;
}

.avatar-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background-color: #ff4d4f;
  color: white;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* 尺寸特定样式 */
.size-small .status-indicator {
  width: 8px;
  height: 8px;
  bottom: 1px;
  right: 1px;
}

.size-small .avatar-badge {
  min-width: 14px;
  height: 14px;
  font-size: 10px;
  top: -2px;
  right: -2px;
}

.size-xlarge .status-indicator {
  width: 16px;
  height: 16px;
  bottom: 4px;
  right: 4px;
}

.size-xlarge .avatar-badge {
  min-width: 22px;
  height: 22px;
  font-size: 14px;
  top: -6px;
  right: -6px;
}
</style>
