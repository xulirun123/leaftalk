<template>
  <div 
    class="cached-avatar"
    :class="[
      `size-${size}`,
      { 'loading': isLoading, 'error': hasError, 'rounded': rounded }
    ]"
    :style="{ width: `${actualSize}px`, height: `${actualSize}px` }"
  >
    <!-- 加载状态 -->
    <div v-if="isLoading" class="avatar-loading">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="avatar-error">
      <div class="error-icon">👤</div>
    </div>
    
    <!-- 头像图片 -->
    <img
      v-else
      :src="displayUrl"
      :alt="alt"
      class="avatar-image"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- 在线状态指示器 -->
    <div 
      v-if="showOnlineStatus && onlineStatus" 
      class="online-indicator"
      :class="`status-${onlineStatus}`"
    ></div>
    
    <!-- 角标 -->
    <div v-if="badge" class="avatar-badge">
      {{ badge }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, readonly } from 'vue'

interface Props {
  // 头像URL
  src: string
  // 替代文本
  alt?: string
  // 尺寸预设
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  // 自定义尺寸
  customSize?: number
  // 是否圆形
  rounded?: boolean
  // 在线状态
  onlineStatus?: 'online' | 'offline' | 'away' | 'busy'
  // 是否显示在线状态
  showOnlineStatus?: boolean
  // 角标内容
  badge?: string | number
  // 是否启用缓存
  enableCache?: boolean
  // 是否懒加载
  lazy?: boolean
  // 占位符URL
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '头像',
  size: 'md',
  rounded: true,
  enableCache: true,
  lazy: false,
  showOnlineStatus: false
})

// 响应式状态
const isLoading = ref(false)
const hasError = ref(false)
const displayUrl = ref('')

// 尺寸映射
const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  xxl: 80
}

// 计算实际尺寸
const actualSize = computed(() => {
  return props.customSize || sizeMap[props.size]
})

// 简化的加载头像逻辑
const loadAvatar = () => {
  if (!props.src) {
    displayUrl.value = props.placeholder || ''
    isLoading.value = false
    hasError.value = true
    return
  }

  // 直接设置URL
  displayUrl.value = props.src
  isLoading.value = false
  hasError.value = false
}

// 处理图片加载成功
const handleLoad = () => {
  isLoading.value = false
  hasError.value = false
}

// 处理图片加载失败
const handleError = () => {
  isLoading.value = false
  hasError.value = true

  // 如果有占位符，使用占位符
  if (props.placeholder && displayUrl.value !== props.placeholder) {
    displayUrl.value = props.placeholder
    hasError.value = false
  }
}

// 监听src变化
watch(() => props.src, () => {
  loadAvatar()
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  loadAvatar()
})

// 暴露方法给父组件
defineExpose({
  reload: loadAvatar,
  isLoading: readonly(isLoading),
  hasError: readonly(hasError)
})
</script>

<style scoped>
.cached-avatar {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: #f5f5f5;
  transition: all 0.3s ease;
}

.cached-avatar.rounded {
  border-radius: 50%;
}

.cached-avatar:not(.rounded) {
  border-radius: 6px;
}

.cached-avatar.loading {
  background-color: #f0f0f0;
}

.cached-avatar.error {
  background-color: #fafafa;
  border: 1px solid #e0e0e0;
}

/* 头像图片 */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 加载状态 */
.avatar-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 50%;
  height: 50%;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.avatar-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon {
  font-size: 50%;
  color: #999;
}

/* 在线状态指示器 */
.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 25%;
  height: 25%;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

.status-online {
  background-color: #52c41a;
}

.status-offline {
  background-color: #d9d9d9;
}

.status-away {
  background-color: #faad14;
}

.status-busy {
  background-color: #ff4d4f;
}

/* 角标 */
.avatar-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background-color: #ff4d4f;
  color: white;
  font-size: 10px;
  font-weight: bold;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

/* 尺寸变体 */
.size-xs .loading-spinner {
  border-width: 1px;
}

.size-xs .online-indicator {
  width: 6px;
  height: 6px;
  border-width: 1px;
}

.size-xs .avatar-badge {
  min-width: 12px;
  height: 12px;
  font-size: 8px;
  border-radius: 6px;
}

.size-sm .online-indicator {
  border-width: 1px;
}

.size-sm .avatar-badge {
  min-width: 14px;
  height: 14px;
  font-size: 9px;
  border-radius: 7px;
}

.size-lg .online-indicator {
  border-width: 3px;
}

.size-lg .avatar-badge {
  min-width: 18px;
  height: 18px;
  font-size: 11px;
  border-radius: 9px;
}

.size-xl .online-indicator {
  border-width: 3px;
}

.size-xl .avatar-badge {
  min-width: 20px;
  height: 20px;
  font-size: 12px;
  border-radius: 10px;
}

.size-xxl .online-indicator {
  border-width: 4px;
}

.size-xxl .avatar-badge {
  min-width: 24px;
  height: 24px;
  font-size: 14px;
  border-radius: 12px;
}

/* 悬停效果 */
.cached-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cached-avatar:hover {
    transform: none;
    box-shadow: none;
  }
}
</style>
