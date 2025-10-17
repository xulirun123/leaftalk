<template>
  <transition name="dialog-fade">
    <div v-if="visible" class="confirm-dialog-overlay" @click="handleCancel">
      <div class="confirm-dialog" @click.stop>
        <div class="dialog-content">
          <div class="dialog-message">{{ message }}</div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn" @click="handleCancel">取消</button>
          <button class="dialog-btn confirm-btn" @click="handleConfirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  message: string
  confirmText?: string
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确定'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const visible = ref(false)

const show = () => {
  visible.value = true
}

const hide = () => {
  visible.value = false
}

const handleConfirm = () => {
  emit('confirm')
  hide()
}

const handleCancel = () => {
  emit('cancel')
  hide()
}

defineExpose({
  show,
  hide
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
}

.confirm-dialog {
  background: #FFFFFF;
  border-radius: 12px;
  width: 280px;
  overflow: hidden;
}

.dialog-content {
  padding: 24px 20px;
}

.dialog-message {
  font-size: 16px;
  color: #000000;
  text-align: center;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  border-top: 0.5px solid #E5E5E5;
}

.dialog-btn {
  flex: 1;
  height: 48px;
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dialog-btn:active {
  background-color: #F5F5F5;
}

.cancel-btn {
  color: #000000;
  border-right: 0.5px solid #E5E5E5;
}

.confirm-btn {
  color: #07C160;
  font-weight: 500;
}

/* 动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .confirm-dialog,
.dialog-fade-leave-active .confirm-dialog {
  transition: transform 0.2s;
}

.dialog-fade-enter-from .confirm-dialog,
.dialog-fade-leave-to .confirm-dialog {
  transform: scale(0.9);
}
</style>

