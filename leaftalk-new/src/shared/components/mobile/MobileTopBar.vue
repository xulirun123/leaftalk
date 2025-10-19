<template>
  <div class="mobile-top-bar" :style="{ background: backgroundColor }">
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
          :class="{
            'action-btn-disabled': btn.disabled,
            'action-btn-text': btn.text,
            'action-btn-icon': !btn.text
          }"
          @click="handleButtonClick(btn)"
        >
          <template v-if="btn.text">
            <span class="action-text" :class="{ 'action-text-disabled': btn.disabled }">{{ btn.text }}</span>
          </template>
          <template v-else>
            <iconify-icon :icon="btn.icon" width="20"></iconify-icon>
          </template>
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
    icon?: string
    text?: string
    action: string
    disabled?: boolean
  }>
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '叶语',
  showBack: false,
  rightButtons: () => [],
  backgroundColor: '#e5e5e5'
})

const emit = defineEmits<{
  back: []
  buttonClick: [button: any]
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

const handleButtonClick = (button: any) => {
  if (button.disabled) {
    return
  }
  console.log('🔘 MobileTopBar handleButtonClick:', button)
  emit('buttonClick', button)
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 60000) // 每分钟更新
})
</script>

<style scoped>
.mobile-top-bar {
  /* background 通过 :style 动态设置，不在这里硬编码 */
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
  min-width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  border-radius: 4px;
  padding: 0;
  transition: background 0.2s;
}

/* 文字按钮样式 */
.action-btn-text {
  background: #07C160;
  height: 28px;
  padding: 0 12px;
}

.action-btn-text.action-btn-disabled {
  background: #E5E5E5;
  cursor: not-allowed;
}

/* 图标按钮样式 */
.action-btn-icon {
  background: none;
  width: 32px;
  height: 32px;
}

.action-text {
  font-size: 13px;
  color: #000;
  font-weight: normal;
}

.action-text-disabled {
  color: #999;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.action-btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-btn-text:hover:not(.action-btn-disabled) {
  background: #06AD56;
}
</style>
