<template>
  <div class="mobile-page-content" :class="{ 'no-padding': noPadding }">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  noPadding?: boolean // 是否不使用默认内边距
}

withDefaults(defineProps<Props>(), {
  noPadding: false
})
</script>

<style scoped>
.mobile-page-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0; /* 统一的顶部间距标准 */
}

.mobile-page-content.no-padding {
  padding: 0;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .mobile-page-content {
    padding: 8px 0;
  }
}
</style>
