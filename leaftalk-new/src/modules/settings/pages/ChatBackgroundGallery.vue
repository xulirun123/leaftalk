<template>
  <div class="chat-background-gallery">
    <!-- 聊天预览区域 -->
    <div class="preview-section">
      <div class="preview-overlay" :style="{ background: previewBackground }">
        <div class="message-bubble received">
          <span>你好，这是聊天背景预览</span>
        </div>
        <div class="message-bubble sent">
          <span>好的，谢谢！</span>
        </div>
      </div>
    </div>

    <!-- 背景选择区域 -->
    <div class="background-list">
      <div class="section-title">选择背景</div>
      <div class="background-grid">
        <div
          v-for="bg in backgrounds"
          :key="bg.id"
          class="background-item"
          :class="{ active: selectedBackground === bg.id }"
          @click="selectBackground(bg.id)"
        >
          <div class="background-preview" :style="{ background: bg.value }"></div>
          <div class="background-name">{{ bg.name }}</div>
          <div class="check-icon" v-if="selectedBackground === bg.id">
            <iconify-icon icon="heroicons:check-circle-solid" width="20" style="color: #07c160;"></iconify-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { saveChatBackground, getCurrentChatId, getChatBackground, PRESET_BACKGROUNDS } from '../../chat/utils/chatBackgroundManager'

const router = useRouter()
const route = useRoute()
const eventBus = inject('eventBus') as any

// 移除重复的函数定义，使用导入的工具函数

// 预设的9个系统背景（使用导入的 PRESET_BACKGROUNDS）
const backgrounds = [
  { id: 'default', name: '默认', value: '#EDEDED' },
  { id: 'blue-light', name: '浅蓝', value: PRESET_BACKGROUNDS['blue-light'] },
  { id: 'green-light', name: '浅绿', value: PRESET_BACKGROUNDS['green-light'] },
  { id: 'pink-light', name: '浅粉', value: PRESET_BACKGROUNDS['pink-light'] },
  { id: 'purple-light', name: '浅紫', value: PRESET_BACKGROUNDS['purple-light'] },
  { id: 'orange-light', name: '浅橙', value: PRESET_BACKGROUNDS['orange-light'] },
  { id: 'yellow-light', name: '浅黄', value: PRESET_BACKGROUNDS['yellow-light'] },
  { id: 'cyan-light', name: '浅青', value: PRESET_BACKGROUNDS['cyan-light'] },
  { id: 'gray-light', name: '浅灰', value: PRESET_BACKGROUNDS['gray-light'] }
]

// 当前选中的背景
const selectedBackground = ref('default')

// 预览背景
const previewBackground = computed(() => {
  const bg = backgrounds.find(b => b.id === selectedBackground.value)
  return bg ? bg.value : '#EDEDED'
})

// 选择背景
const selectBackground = (id: string) => {
  selectedBackground.value = id
  console.log('🎨 选择背景:', id)
}

// 确认选择
const confirmSelection = () => {
  try {
    console.log('🎨 [ChatBackgroundGallery] 确认按钮被点击')
    console.log('🎨 开始保存背景设置:', selectedBackground.value)

    const chatId = getCurrentChatId()
    console.log('📝 当前聊天ID:', chatId)

    // 保存背景设置到当前聊天
    saveChatBackground(chatId, selectedBackground.value)

    console.log('✅ 背景设置成功:', selectedBackground.value)

    // 触发事件通知聊天页面更新背景
    if (eventBus) {
      eventBus.emit('chatBackground:updated', {
        chatId,
        background: selectedBackground.value
      })
      console.log('📢 已触发 chatBackground:updated 事件')
    }

    // 返回到聊天背景页面（返回一级）
    router.go(-1)
  } catch (error) {
    console.error('❌ 保存背景设置失败:', error)
  }
}

// 页面加载时读取当前设置
const loadCurrentSetting = async () => {
  try {
    const chatId = getCurrentChatId()
    console.log('📖 加载当前聊天背景设置, chatId:', chatId)

    // 读取当前聊天的背景设置
    const current = getChatBackground(chatId)

    console.log('📖 当前背景设置:', current)

    // 如果当前设置是预设背景之一，则选中它
    if (current && backgrounds.find(bg => bg.id === current)) {
      selectedBackground.value = current
      console.log('✅ 已选中当前背景:', current)
    }
  } catch (error) {
    console.error('❌ 加载当前设置失败:', error)
  }
}

// 监听事件总线的确认事件
onMounted(async () => {
  console.log('🔧 [ChatBackgroundGallery] 组件挂载')
  console.log('🔧 [ChatBackgroundGallery] eventBus:', eventBus)

  await loadCurrentSetting()

  // 监听顶部导航栏的确认按钮点击
  if (eventBus) {
    eventBus.on('chatBackground:confirm', confirmSelection)
    console.log('✅ ChatBackgroundGallery 页面已挂载，事件监听器已注册')
  } else {
    console.error('❌ [ChatBackgroundGallery] eventBus 未找到')
  }
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (eventBus) {
    eventBus.off('chatBackground:confirm', confirmSelection)
    console.log('🔧 [ChatBackgroundGallery] 事件监听器已移除')
  }
})
</script>

<style scoped>
.chat-background-gallery {
  min-height: 100vh;
  background: #E5E5E5;
  display: flex;
  flex-direction: column;
}

/* 预览区域 */
.preview-section {
  padding: 16px; /* 四周16px */
  background: #E5E5E5;
}

.preview-overlay {
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  background-size: cover;
  background-position: center;
}

.message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-bubble.received {
  background: white;
  align-self: flex-start;
  border-radius: 0 8px 8px 8px;
}

.message-bubble.sent {
  background: #95EC69;
  align-self: flex-end;
  border-radius: 8px 0 8px 8px;
}

/* 背景列表 */
.background-list {
  flex: 1;
  background: white;
  padding: 16px;
  overflow-y: auto;
}

.section-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  font-weight: 500;
}

.background-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.background-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.background-item.active {
  border-color: #07C160;
}

.background-preview {
  width: 100%;
  height: 100px;
  background-size: cover;
  background-position: center;
}

.background-name {
  padding: 6px;
  text-align: center;
  font-size: 12px;
  color: #333;
  background: white;
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

