<template>
  <button 
    :class="buttonClass"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <LoadingSpinner 
      v-if="loading" 
      size="small" 
      :color="loadingColor"
    />
    <UnifiedIcon
      v-else-if="icon"
      category="common"
      :name="icon"
      :size="iconSize"
    />
    <span v-if="$slots.default" class="button-text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import UnifiedIcon from '../../shared/components/common/UnifiedIcon.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  icon?: string
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  loading: false,
  disabled: false,
  block: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClass = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  {
    'btn--block': props.block,
    'btn--loading': props.loading,
    'btn--icon-only': props.icon && !$slots.default
  }
])

const iconSize = computed(() => {
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  }
  return sizeMap[props.size]
})

const loadingColor = computed(() => {
  return props.variant === 'primary' ? '#ffffff' : '#07C160'
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 尺寸 */
.btn--small {
  padding: 6px 12px;
  font-size: 14px;
  min-height: 32px;
}

.btn--medium {
  padding: 8px 16px;
  font-size: 16px;
  min-height: 40px;
}

.btn--large {
  padding: 12px 20px;
  font-size: 18px;
  min-height: 48px;
}

/* 变体 */
.btn--primary {
  background: #07C160;
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #059649;
}

.btn--secondary {
  background: #f5f5f5;
  color: #333333;
}

.btn--secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn--outline {
  background: transparent;
  color: #07C160;
  border: 1px solid #07C160;
}

.btn--outline:hover:not(:disabled) {
  background: #07C160;
  color: white;
}

.btn--ghost {
  background: transparent;
  color: #666666;
}

.btn--ghost:hover:not(:disabled) {
  background: #f5f5f5;
}

.btn--danger {
  background: #ff4757;
  color: white;
}

.btn--danger:hover:not(:disabled) {
  background: #ff3838;
}

/* 块级按钮 */
.btn--block {
  width: 100%;
}

/* 仅图标按钮 */
.btn--icon-only {
  padding: 8px;
  min-width: 40px;
}

.btn--icon-only.btn--small {
  padding: 6px;
  min-width: 32px;
}

.btn--icon-only.btn--large {
  padding: 12px;
  min-width: 48px;
}

/* 加载状态 */
.btn--loading {
  pointer-events: none;
}

.button-text {
  display: inline-block;
}
</style>
