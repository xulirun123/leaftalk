<template>
  <div class="mobile-top-bar">
    <!-- 状态栏 -->
    <div class="status-bar">
      <span class="time">{{ currentTime }}</span>
      <div class="status-icons">
        <iconify-icon icon="lucide:signal" width="16"></iconify-icon>
        <iconify-icon icon="lucide:wifi" width="16"></iconify-icon>
        <span class="battery">100%</span>
        <iconify-icon icon="lucide:battery" width="20"></iconify-icon>
      </div>
    </div>

    <!-- 导航栏 -->
    <div class="nav-bar">
      <button v-if="showBack" class="back-btn" @click="handleBack">
        <iconify-icon icon="heroicons:chevron-left" width="24"></iconify-icon>
      </button>
      <h1 class="nav-title">{{ title }}</h1>
      <div class="nav-actions">
        <button
          v-for="(btn, index) in rightButtons"
          :key="index"
          class="action-btn"
          @click="handleButtonClick(btn)"
        >
          <iconify-icon :icon="btn.icon" width="20"></iconify-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGlobalLanguage } from '../../composables/useGlobalLanguage'

// 使用全局语言管理
const { t } = useGlobalLanguage()

interface Props {
  title?: string
  showBack?: boolean
  rightButtons?: Array<{
    icon: string
    action: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  title: '叶语',
  showBack: false,
  rightButtons: () => []
})

const emit = defineEmits<{
  back: []
  buttonClick: [button: { icon: string; action: string }]
}>()

const currentTime = ref('')

const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

const handleBack = () => {
  emit('back')
}

const handleButtonClick = (button: { icon: string; action: string }) => {
  emit('buttonClick', button)
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 60000) // 每分钟更新
})
</script>

<style scoped>
.mobile-top-bar {
  background: #e5e5e5;
  flex-shrink: 0; /* 防止被压缩 */
  /* 移除 fixed 定位，使用正常文档流 */
}

/* 状态栏 */
.status-bar {
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 12px;
  color: #333;
  /* 移除 safe-area-inset-top，避免在桌面浏览器中产生意外高度 */
}

.time {
  font-weight: normal;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-icons iconify-icon {
  color: #333;
}

.battery {
  font-size: 11px;
  margin: 0 2px;
}

/* 导航栏 */
.nav-bar {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 8px;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: normal;
  color: #333;
  margin: 0;
  line-height: 1.2;
}

.nav-actions {
  position: absolute;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
}

.back-btn:hover,
.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
</style>
