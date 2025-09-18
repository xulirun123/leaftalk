<template>
  <div v-if="visible" class="confirm-dialog-overlay" @click="handleOverlayClick">
    <div class="confirm-dialog" @click.stop>
      <!-- 标题 -->
      <div v-if="title" class="dialog-title">
        {{ title }}
      </div>
      
      <!-- 内容 -->
      <div class="dialog-content">
        {{ content }}
      </div>
      
      <!-- 按钮组 -->
      <div class="dialog-actions">
        <button 
          v-if="showCancel"
          class="dialog-btn cancel-btn" 
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button 
          class="dialog-btn confirm-btn" 
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  visible?: boolean
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  content: '确定要执行此操作吗？',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  closeOnOverlay: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:visible': [value: boolean]
}>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleCancel()
  }
}

// 监听visible变化，处理body滚动
watch(() => props.visible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  min-width: 280px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-title {
  padding: 20px 20px 10px 20px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-content {
  padding: 20px;
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.dialog-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dialog-btn:not(:last-child) {
  border-right: 1px solid #f0f0f0;
}

.cancel-btn {
  color: #666;
}

.cancel-btn:hover {
  background: #f8f8f8;
}

.confirm-btn {
  color: #07C160;
  font-weight: 500;
}

.confirm-btn:hover {
  background: #f0f9f4;
}

.confirm-btn:active {
  background: #e6f7ea;
}

/* 单按钮样式 */
.dialog-actions:has(.dialog-btn:only-child) .dialog-btn {
  border-right: none;
}
</style>
