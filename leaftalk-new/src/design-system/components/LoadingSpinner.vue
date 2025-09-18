<template>
  <div class="loading-spinner" :class="sizeClass">
    <div class="spinner" :style="spinnerStyle"></div>
    <div v-if="text" class="loading-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
  color?: string
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  color: '#07C160'
})

const sizeClass = computed(() => `loading-spinner--${props.size}`)

const spinnerStyle = computed(() => ({
  borderTopColor: props.color
}))
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #07C160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner--small .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loading-spinner--medium .spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.loading-spinner--large .spinner {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666666;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
