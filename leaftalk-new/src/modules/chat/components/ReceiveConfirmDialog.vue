<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <!-- 头部 -->
      <div class="dialog-header">
        <div class="dialog-title">{{ title }}</div>
      </div>

      <!-- 内容 -->
      <div class="dialog-content">
        <div class="amount-display">¥{{ amount.toFixed(2) }}</div>
        <div v-if="note" class="note-display">{{ note }}</div>
        <div class="sender-info">来自 {{ senderName }}</div>
      </div>

      <!-- 按钮 -->
      <div class="dialog-actions">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-confirm" @click="handleConfirm">确认领取</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
  type: 'transfer' | 'redpacket'
  amount: number
  note?: string
  senderName: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const title = props.type === 'transfer' ? '确认收款' : '领取红包'

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleOverlayClick = () => {
  emit('cancel')
}
</script>

<style scoped>
.dialog-overlay {
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

.dialog-container {
  background: white;
  border-radius: 12px;
  width: 280px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  padding: 20px 20px 16px;
  text-align: center;
  border-bottom: 1px solid #EDEDED;
}

.dialog-title {
  font-size: 17px;
  font-weight: 500;
  color: #333;
}

.dialog-content {
  padding: 24px 20px;
  text-align: center;
}

.amount-display {
  font-size: 36px;
  font-weight: 500;
  color: #FF9500;
  margin-bottom: 12px;
}

.note-display {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  word-break: break-all;
}

.sender-info {
  font-size: 13px;
  color: #999;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid #EDEDED;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel {
  color: #666;
  border-right: 1px solid #EDEDED;
}

.btn-cancel:hover {
  background: #F5F5F5;
}

.btn-confirm {
  color: #07C160;
  font-weight: 500;
}

.btn-confirm:hover {
  background: #F0F9FF;
}

.btn-cancel:active,
.btn-confirm:active {
  opacity: 0.7;
}
</style>

