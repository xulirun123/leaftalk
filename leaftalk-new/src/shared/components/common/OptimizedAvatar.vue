<template>
  <div 
    class="optimized-avatar"
    :class="[
      `size-${size}`,
      `shape-${shape}`,
      { 
        'has-badge': badge,
        'clickable': clickable,
        'online': isOnline
      }
    ]"
    :style="{ width: `${avatarSize}px`, height: `${avatarSize}px` }"
    @click="handleClick"
  >
    <!-- 预加载的头像图片 -->
    <img 
      v-if="!isGroup"
      :src="avatarUrl" 
      :alt="name"
      class="avatar-image"
      @error="handleImageError"
      @load="handleImageLoad"
      :style="{ opacity: imageLoaded ? 1 : 0 }"
    />
    
    <!-- 群聊头像 -->
    <div v-else class="group-avatar">
      <div 
        v-for="(member, index) in groupMembers.slice(0, 4)"
        :key="member.id"
        class="group-member"
        :class="`member-${index + 1}`"
      >
        <img 
          :src="member.avatar" 
          :alt="member.name"
          @error="handleMemberImageError(index)"
        />
      </div>
    </div>

    <!-- 占位符（在图片加载时显示） -->
    <div v-if="!imageLoaded && !isGroup" class="avatar-placeholder">
      {{ getInitials(name) }}
    </div>

    <!-- 在线状态指示器 -->
    <div v-if="showOnlineStatus && isOnline" class="online-indicator"></div>

    <!-- 徽章 -->
    <div v-if="badge" class="avatar-badge" :class="badgeType">
      <span v-if="typeof badge === 'number' && badge > 0">
        {{ badge > 99 ? '99+' : badge }}
      </span>
      <div v-else-if="badge === 'dot'" class="badge-dot"></div>
      <iconify-icon v-else-if="typeof badge === 'string'" :icon="badge" :size="12" />
    </div>

    <!-- 角标 -->
    <div v-if="corner" class="avatar-corner">
      <iconify-icon :icon="corner" :size="cornerSize" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface GroupMember {
  id: string
  name: string
  avatar: string
}

interface Props {
  src?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  shape?: 'circle' | 'square' | 'rounded'
  isGroup?: boolean
  groupMembers?: GroupMember[]
  badge?: number | string | 'dot'
  badgeType?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  corner?: string
  isOnline?: boolean
  showOnlineStatus?: boolean
  clickable?: boolean
  fallback?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  name: '',
  size: 'md',
  shape: 'rounded',
  isGroup: false,
  groupMembers: () => [],
  badgeType: 'danger',
  isOnline: false,
  showOnlineStatus: false,
  clickable: false,
  fallback: ''
})

interface Emits {
  (e: 'click'): void
  (e: 'load'): void
  (e: 'error'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const imageLoaded = ref(false)
const hasError = ref(false)
const imageCache = new Map<string, boolean>()

// 计算属性
const avatarSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80
  }
  return sizeMap[props.size]
})

const cornerSize = computed(() => {
  return Math.floor(avatarSize.value * 0.3)
})

const avatarUrl = computed(() => {
  if (hasError.value && props.fallback) {
    return props.fallback
  }
  
  if (props.src) {
    return props.src
  }
  
  // 生成默认头像
  const size = avatarSize.value
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(props.name)}&size=${size}`
})

// 方法
const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

const handleImageLoad = () => {
  imageLoaded.value = true
  hasError.value = false
  
  // 缓存加载成功的图片
  if (props.src) {
    imageCache.set(props.src, true)
  }
  
  emit('load')
}

const handleImageError = () => {
  imageLoaded.value = true
  hasError.value = true
  emit('error')
}

const handleMemberImageError = (index: number) => {
  // 处理群成员头像加载错误
  console.warn(`群成员头像加载失败 ${index}`)
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  
  const words = name.trim().split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

// 预加载图片
const preloadImage = (url: string) => {
  if (!url || imageCache.has(url)) {
    imageLoaded.value = true
    return
  }
  
  const img = new Image()
  img.onload = () => {
    imageCache.set(url, true)
    imageLoaded.value = true
    hasError.value = false
  }
  img.onerror = () => {
    imageLoaded.value = true
    hasError.value = true
  }
  img.src = url
}

// 监听src变化，预加载新图片
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    imageLoaded.value = false
    hasError.value = false
    preloadImage(newSrc)
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 如果没有图片源且不是群聊，直接设置为已加载
  if (!props.src && !props.isGroup) {
    imageLoaded.value = true
  }
})
</script>

<style scoped>
.optimized-avatar {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background: #f5f5f5;
  transition: all 0.2s ease;
}

/* 尺寸 */
.size-xs { border-radius: 4px; }
.size-sm { border-radius: 6px; }
.size-md { border-radius: 8px; }
.size-lg { border-radius: 10px; }
.size-xl { border-radius: 12px; }

/* 形状 */
.shape-circle {
  border-radius: 50% !important;
}

.shape-square {
  border-radius: 0 !important;
}

.shape-rounded {
  border-radius: 8px;
}

/* 可点击状态 */
.clickable {
  cursor: pointer;
}

.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.clickable:active {
  transform: scale(0.98);
}

/* 在线状态 */
.online {
  box-shadow: 0 0 0 2px #07c160;
}

/* 头像图片 */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.2s ease;
}

/* 占位符 */
.avatar-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 50%;
}

/* 群聊头像 */
.group-avatar {
  width: 100%;
  height: 100%;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  background: #fff;
}

.group-member {
  overflow: hidden;
  background: #f5f5f5;
}

.group-member img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-1 {
  border-radius: 8px 0 0 0;
}

.member-2 {
  border-radius: 0 8px 0 0;
}

.member-3 {
  border-radius: 0 0 0 8px;
}

.member-4 {
  border-radius: 0 0 8px 0;
}

/* 在线指示器 */
.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 25%;
  height: 25%;
  background: #07c160;
  border: 2px solid #fff;
  border-radius: 50%;
  min-width: 8px;
  min-height: 8px;
}

/* 徽章 */
.avatar-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  border: 2px solid #fff;
  box-sizing: border-box;
}

.avatar-badge.default {
  background: #999;
}

.avatar-badge.primary {
  background: #576b95;
}

.avatar-badge.success {
  background: #07c160;
}

.avatar-badge.warning {
  background: #ff9500;
}

.avatar-badge.danger {
  background: #ff4757;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* 角标 */
.avatar-corner {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #fff;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .clickable:hover {
    transform: none;
    box-shadow: none;
  }
}
</style>
