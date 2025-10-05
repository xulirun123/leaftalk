<template>
  <div class="payment-qr-page">
    <div class="payment-qr-content">
      <div class="placeholder">
        <iconify-icon icon="heroicons:qr-code" width="64" class="placeholder-icon"></iconify-icon>
        <h3>收付款功能</h3>
        <p>收付款功能正在开发中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面逻辑
</script>

<style scoped>
.payment-qr-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.payment-qr-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.placeholder {
  text-align: center;
  color: #666;
}

.placeholder-icon {
  color: #07C160;
  margin-bottom: 16px;
}

.placeholder h3 {
  font-size: 18px;
  margin: 0 0 8px 0;
}

.placeholder p {
  font-size: 14px;
  margin: 0;
}
</style>
