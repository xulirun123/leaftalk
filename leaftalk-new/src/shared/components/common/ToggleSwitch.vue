<template>
  <div 
    class="toggle-switch" 
    :class="{ 
      active: modelValue,
      disabled: disabled,
      small: size === 'small',
      large: size === 'large'
    }" 
    @click="handleToggle"
  >
    <div class="toggle-thumb"></div>
    <div class="toggle-text">
      <span class="toggle-off">{{ offText }}</span>
      <span class="toggle-on">{{ onText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  disabled?: boolean
  size?: 'small' | 'normal' | 'large'
  onText?: string
  offText?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'normal',
  onText: 'ON',
  offText: 'OFF'
})

const emit = defineEmits<Emits>()

const handleToggle = () => {
  if (props.disabled) return
  
  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>

<style scoped lang="scss">
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #d0d0d0;
  user-select: none;
  
  &:hover:not(.disabled) {
    background: #d5d5d5;
  }
  
  &.active {
    background: #07C160;
    border-color: #06a552;
    box-shadow: 0 0 0 2px rgba(7, 193, 96, 0.2);
    
    &:hover {
      background: #06a552;
    }
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  // 小尺寸
  &.small {
    width: 36px;
    height: 20px;
    border-radius: 10px;
    
    .toggle-thumb {
      width: 16px;
      height: 16px;
      border-radius: 8px;
      top: 1px;
      left: 1px;
    }
    
    &.active .toggle-thumb {
      transform: translateX(16px);
    }
    
    .toggle-text {
      font-size: 8px;
      
      .toggle-off {
        right: 4px;
      }
      
      .toggle-on {
        left: 4px;
      }
    }
  }
  
  // 大尺寸
  &.large {
    width: 52px;
    height: 28px;
    border-radius: 14px;
    
    .toggle-thumb {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      top: 1px;
      left: 1px;
    }
    
    &.active .toggle-thumb {
      transform: translateX(24px);
    }
    
    .toggle-text {
      font-size: 11px;
      
      .toggle-off {
        right: 8px;
      }
      
      .toggle-on {
        left: 8px;
      }
    }
  }
}

.toggle-thumb {
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  top: 1px;
  left: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(20px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.toggle-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  font-size: 9px;
  font-weight: 600;
  pointer-events: none;
  z-index: 1;
  
  .toggle-off,
  .toggle-on {
    position: absolute;
    transition: all 0.3s ease;
    opacity: 0;
  }
  
  .toggle-off {
    right: 6px;
    color: #999;
  }
  
  .toggle-on {
    left: 6px;
    color: white;
  }
}

.toggle-switch:not(.active) .toggle-off {
  opacity: 1;
}

.toggle-switch.active .toggle-on {
  opacity: 1;
}

// 动画效果
.toggle-switch {
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 14px;
    background: transparent;
    transition: all 0.3s ease;
    z-index: 0;
  }
  
  &:active:not(.disabled)::before {
    background: rgba(7, 193, 96, 0.1);
  }
  
  &.active:active:not(.disabled)::before {
    background: rgba(7, 193, 96, 0.2);
  }
}

// 无障碍支持
.toggle-switch:focus-visible {
  outline: 2px solid #07C160;
  outline-offset: 2px;
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .toggle-switch {
    background: #3a3a3a;
    border-color: #555;
    
    &:hover:not(.disabled) {
      background: #4a4a4a;
    }
    
    .toggle-thumb {
      background: #f0f0f0;
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .toggle-text .toggle-off {
      color: #ccc;
    }
  }
}
</style>
