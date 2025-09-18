<template>
  <div class="unified-user-info" :class="[`layout-${layout}`, { clickable }]" @click="handleClick">
    <!-- 头像 -->
    <OptimizedAvatar
      :src="userAvatar"
      :name="userNickname"
      :size="avatarSizeValue"
      :badge="badge"
      class="user-avatar"
    />
    
    <!-- 用户信息 -->
    <div v-if="showInfo" class="user-details" :class="`details-${layout}`">
      <!-- 主要信息 -->
      <div class="user-main-info">
        <h3 v-if="showNickname" class="user-nickname">{{ userNickname }}</h3>
        <p v-if="showYeyuId" class="user-yeyu-id">叶语号: {{ userYeyuId }}</p>
      </div>
      
      <!-- 次要信息 -->
      <div v-if="showSecondaryInfo" class="user-secondary-info">
        <p v-if="secondaryText" class="secondary-text">{{ secondaryText }}</p>
        <span v-if="showTime && timeText" class="time-text">{{ timeText }}</span>
      </div>
    </div>
    
    <!-- 右侧操作区域 -->
    <div v-if="$slots.actions" class="user-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import OptimizedAvatar from './OptimizedAvatar.vue'

interface Props {
  // 用户ID
  userId: string
  // 备用用户信息（用于缓存）
  userInfo?: any
  // 布局方式
  layout?: 'horizontal' | 'vertical' | 'compact'
  // 头像尺寸
  avatarSize?: 'small' | 'medium' | 'large' | 'xlarge'
  // 是否可点击
  clickable?: boolean
  // 显示控制
  showInfo?: boolean
  showNickname?: boolean
  showYeyuId?: boolean
  showSecondaryInfo?: boolean
  showTime?: boolean
  // 内容
  secondaryText?: string
  timeText?: string
  // 徽章
  badge?: number
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'horizontal',
  avatarSize: 'medium',
  clickable: false,
  showInfo: true,
  showNickname: true,
  showYeyuId: false,
  showSecondaryInfo: false,
  showTime: false,
  badge: 0
})

const emit = defineEmits<{
  click: [userId: string]
}>()

// 计算属性
const userAvatar = computed(() => {
  return props.userInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${props.userInfo?.name || props.userId}`
})

const userNickname = computed(() => {
  return props.userInfo?.nickname || props.userInfo?.name || `用户${props.userId}`
})

const userYeyuId = computed(() => {
  return props.userInfo?.yeyuId || props.userInfo?.yeyu_id || ''
})

const avatarSizeValue = computed(() => {
  const sizeMap = {
    small: '32',
    medium: '40',
    large: '48',
    xlarge: '64'
  }
  return sizeMap[props.avatarSize]
})

// 方法
const handleClick = () => {
  if (props.clickable) {
    emit('click', props.userId)
  }
}
</script>

<style scoped>
.unified-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.unified-user-info.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.unified-user-info.clickable:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* 布局样式 */
.layout-horizontal {
  flex-direction: row;
}

.layout-vertical {
  flex-direction: column;
  text-align: center;
}

.layout-compact {
  flex-direction: row;
  gap: 8px;
}

/* 用户详情 */
.user-details {
  flex: 1;
  min-width: 0;
}

.details-horizontal {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.details-vertical {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.details-compact {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 主要信息 */
.user-main-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-nickname {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-yeyu-id {
  font-size: 12px;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 次要信息 */
.user-secondary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.secondary-text {
  font-size: 14px;
  color: #999;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.time-text {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

/* 操作区域 */
.user-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 紧凑布局调整 */
.layout-compact .user-nickname {
  font-size: 14px;
}

.layout-compact .secondary-text {
  font-size: 12px;
}

.layout-compact .time-text {
  font-size: 11px;
}

/* 垂直布局调整 */
.layout-vertical .user-secondary-info {
  flex-direction: column;
  gap: 4px;
}
</style>
