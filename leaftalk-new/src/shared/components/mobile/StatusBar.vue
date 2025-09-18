<template>
  <div class="status-bar">
    <div class="status-left">
      <span class="time">{{ currentTime }}</span>
    </div>
    <div class="status-center">
      <!-- 运营商信息或其他居中内容 -->
    </div>
    <div class="status-right">
      <iconify-icon icon="lucide:signal" width="16" class="status-icon"></iconify-icon>
      <iconify-icon icon="lucide:wifi" width="16" class="status-icon"></iconify-icon>
      <span class="battery">100%</span>
      <iconify-icon icon="lucide:battery" width="20" class="status-icon"></iconify-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 当前时间
const currentTime = ref('')

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

// 组件挂载时开始更新时间
onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
})
</script>

<style scoped>
.status-bar {
  height: 25px;
  background: #e5e5e5;
  color: #333333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 12px;
  position: relative;
  z-index: 1000;
  padding-top: env(safe-area-inset-top);
}

.status-left {
  display: flex;
  align-items: center;
}

.status-center {
  flex: 1;
  text-align: center;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-icon {
  color: #333333;
}

.time {
  font-weight: normal;
}

.battery {
  font-size: 11px;
}
</style>
