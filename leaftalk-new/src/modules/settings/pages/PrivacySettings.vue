<template>
  <div class="rivacysettings">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <iconify-icon icon="mdi:arrow-left"></iconify-icon>
      </button>
      <h1>隐私设置</h1>
    </div>

    <div class="content">
      <div class="placeholder">
        <iconify-icon icon="mdi:construction" class="placeholder-icon"></iconify-icon>
        <h2>隐私设置</h2>
        <p>此功能正在开发中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.rivacysettings {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  margin-right: 15px;
  cursor: pointer;
  color: #333;
}

.header h1 {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.content {
  padding: 40px 20px;
}

.placeholder {
  text-align: center;
  padding: 60px 20px;
}

.placeholder-icon {
  font-size: 64px;
  color: #ccc;
  margin-bottom: 20px;
}

.placeholder h2 {
  color: #666;
  margin-bottom: 10px;
}

.placeholder p {
  color: #999;
  font-size: 14px;
}
</style>