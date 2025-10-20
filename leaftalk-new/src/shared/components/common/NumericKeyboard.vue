<template>
  <div v-if="visible" class="keyboard-overlay" @click="handleOverlayClick">
    <div class="keyboard-panel" @click.stop>
      <div class="keyboard-grid">
        <button 
          v-for="(key, index) in keyboardKeys" 
          :key="index"
          class="keyboard-key"
          :class="{ 
            'key-delete': key === 'delete', 
            'key-dot': key === '.', 
            'key-zero': key === '0',
            'key-confirm': key === 'confirm',
            'key-empty': key === ''
          }"
          @click="key && handleKeyPress(key)"
          :disabled="!key"
        >
          <iconify-icon v-if="key === 'delete'" icon="heroicons:backspace" width="24"></iconify-icon>
          <span v-else-if="key === 'confirm'">{{ confirmText }}</span>
          <span v-else>{{ key }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
  modelValue: string
  maxLength?: number
  maxDecimalPlaces?: number
  allowDecimal?: boolean
  confirmText?: string
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxLength: 10,
  maxDecimalPlaces: 2,
  allowDecimal: true,
  confirmText: '确认',
  closeOnOverlay: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'confirm': []
  'close': []
}>()

// 数字键盘按键 (4行4列)
// 布局:
// 第1行: [1] [2] [3] [删除]
// 第2行: [4] [5] [6] [确认(开始,占3行)]
// 第3行: [7] [8] [9] [确认(继续)]
// 第4行: [0(占2列)] [.] [确认(结束)]
const keyboardKeys = [
  '1', '2', '3', 'delete',
  '4', '5', '6', 'confirm',
  '7', '8', '9',
  '0', '.'
]

const handleKeyPress = (key: string) => {
  let newValue = props.modelValue

  if (key === 'confirm') {
    emit('confirm')
    emit('close')
  } else if (key === 'delete') {
    newValue = newValue.slice(0, -1)
    emit('update:modelValue', newValue)
  } else if (key === '.') {
    // 只允许一个小数点
    if (props.allowDecimal && !newValue.includes('.')) {
      newValue += key
      emit('update:modelValue', newValue)
    }
  } else {
    // 数字键
    // 检查最大长度
    if (newValue.length >= props.maxLength) {
      return
    }

    // 限制小数点后位数
    if (newValue.includes('.')) {
      const parts = newValue.split('.')
      if (parts[1] && parts[1].length >= props.maxDecimalPlaces) {
        return
      }
    }

    newValue += key
    emit('update:modelValue', newValue)
  }
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('close')
  }
}
</script>

<style scoped lang="scss">
.keyboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    background: rgba(0, 0, 0, 0);
  }
  to {
    background: rgba(0, 0, 0, 0.4);
  }
}

.keyboard-panel {
  width: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 60px);
  gap: 12px;
}

.keyboard-key {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  
  // 立体感阴影
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  
  // 按下效果
  &:active {
    background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
    box-shadow: 
      0 1px 2px rgba(0, 0, 0, 0.1),
      inset 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateY(1px);
  }
  
  &.key-delete {
    background: linear-gradient(180deg, #ff7b7b 0%, #ff5252 100%);
    border-color: #ff4444;
    color: #fff;
    box-shadow: 
      0 2px 4px rgba(255, 82, 82, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    
    &:active {
      background: linear-gradient(180deg, #ff5252 0%, #ff3838 100%);
      box-shadow: 
        0 1px 2px rgba(255, 82, 82, 0.2),
        inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }
  
  &.key-dot {
    font-size: 32px;
  }
  
  &.key-zero {
    grid-column: span 2;  // 横着占2列
  }
  
  &.key-confirm {
    grid-row: span 3;  // 竖着占3行
    background: linear-gradient(180deg, #09d66f 0%, #07C160 100%);
    border-color: #06ad56;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    box-shadow: 
      0 3px 6px rgba(7, 193, 96, 0.3),
      0 1px 3px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    
    &:active {
      background: linear-gradient(180deg, #07C160 0%, #06ad56 100%);
      box-shadow: 
        0 1px 3px rgba(7, 193, 96, 0.2),
        inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }
  
  &.key-empty {
    background: transparent;
    border: none;
    box-shadow: none;
    cursor: default;
    
    &:active {
      background: transparent;
      box-shadow: none;
      transform: none;
    }
  }
}
</style>

