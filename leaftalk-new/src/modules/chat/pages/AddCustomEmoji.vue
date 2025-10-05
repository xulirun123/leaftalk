<template>
  <div class="add-custom-emoji-page">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1 class="title">添加表情</h1>
      <button 
        v-if="!isManaging" 
        class="manage-btn" 
        @click="toggleManage"
      >
        管理
      </button>
      <button 
        v-else 
        class="done-btn" 
        @click="toggleManage"
      >
        完成
      </button>
    </div>

    <!-- 表情网格 -->
    <div class="emoji-grid-container">
      <div class="emoji-grid">
        <!-- 添加按钮（第一个位置） -->
        <div class="emoji-item add-btn" @click="handleAddEmoji">
          <iconify-icon icon="heroicons:plus" width="32" color="#07C160"></iconify-icon>
        </div>

        <!-- 自定义表情列表 -->
        <div
          v-for="(emoji, index) in customEmojis"
          :key="emoji.code"
          class="emoji-item"
          :class="{ 
            'selected': isManaging && selectedEmojis.includes(index),
            'managing': isManaging
          }"
          @click="handleEmojiClick(emoji, index)"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover.prevent
          @drop="handleDrop($event, index)"
        >
          <img :src="emoji.char" :alt="emoji.name" class="custom-emoji-img" />
          
          <!-- 选中标记 -->
          <div v-if="isManaging && selectedEmojis.includes(index)" class="selected-mark">
            <iconify-icon icon="heroicons:check-circle-solid" width="20" color="#07C160"></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏（管理模式） -->
    <div v-if="isManaging && selectedEmojis.length > 0" class="bottom-actions">
      <button class="delete-btn" @click="handleDelete">
        删除 ({{ selectedEmojis.length }})
      </button>
    </div>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fileInput = ref<HTMLInputElement>()
const customEmojis = ref<any[]>([])
const isManaging = ref(false)
const selectedEmojis = ref<number[]>([])
const draggedIndex = ref<number | null>(null)

// 加载自定义表情
onMounted(() => {
  const saved = localStorage.getItem('custom_emojis')
  if (saved) {
    try {
      customEmojis.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载自定义表情失败:', e)
    }
  }
})

// 保存自定义表情
const saveCustomEmojis = () => {
  localStorage.setItem('custom_emojis', JSON.stringify(customEmojis.value))
}

// 返回
const goBack = () => {
  router.back()
}

// 切换管理模式
const toggleManage = () => {
  isManaging.value = !isManaging.value
  if (!isManaging.value) {
    selectedEmojis.value = []
  }
}

// 添加表情
const handleAddEmoji = () => {
  if (customEmojis.value.length >= 30) {
    alert('自定义表情最多添加30个')
    return
  }
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      const newCustomEmoji = {
        code: `custom_${Date.now()}`,
        char: imageUrl,
        name: file.name.replace(/\.[^/.]+$/, ''),
        isCustom: true
      }
      
      customEmojis.value.push(newCustomEmoji)
      saveCustomEmojis()
    }
    reader.readAsDataURL(file)
    
    target.value = ''
  }
}

// 处理表情点击
const handleEmojiClick = (emoji: any, index: number) => {
  if (isManaging.value) {
    // 管理模式：选择/取消选择
    const selectedIndex = selectedEmojis.value.indexOf(index)
    if (selectedIndex > -1) {
      selectedEmojis.value.splice(selectedIndex, 1)
    } else {
      selectedEmojis.value.push(index)
    }
  }
  // 非管理模式：不做任何操作（在表情面板中点击才发送）
}

// 删除选中的表情
const handleDelete = () => {
  if (confirm(`确定要删除选中的 ${selectedEmojis.value.length} 个表情吗？`)) {
    // 从大到小排序，避免删除时索引变化
    const sortedIndexes = [...selectedEmojis.value].sort((a, b) => b - a)
    sortedIndexes.forEach(index => {
      customEmojis.value.splice(index, 1)
    })
    
    saveCustomEmojis()
    selectedEmojis.value = []
  }
}

// 拖动开始
const handleDragStart = (event: DragEvent, index: number) => {
  if (!isManaging.value) return
  draggedIndex.value = index
  event.dataTransfer!.effectAllowed = 'move'
}

// 拖动放下
const handleDrop = (event: DragEvent, dropIndex: number) => {
  if (!isManaging.value || draggedIndex.value === null) return
  
  event.preventDefault()
  
  const dragIndex = draggedIndex.value
  if (dragIndex === dropIndex) return
  
  // 移动表情
  const draggedEmoji = customEmojis.value[dragIndex]
  customEmojis.value.splice(dragIndex, 1)
  customEmojis.value.splice(dropIndex, 0, draggedEmoji)
  
  saveCustomEmojis()
  draggedIndex.value = null
}
</script>

<style scoped>
.add-custom-emoji-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  z-index: 2000;
}

.top-bar {
  height: 56px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.manage-btn,
.done-btn {
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  color: #07C160;
  font-size: 16px;
}

.emoji-grid-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.emoji-item {
  aspect-ratio: 1;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 2px solid transparent;
}

.emoji-item.add-btn {
  border: 2px dashed #07C160;
  background: #f0f8f0;
}

.emoji-item.add-btn:active {
  transform: scale(0.95);
}

.emoji-item.managing {
  cursor: pointer;
}

.emoji-item.selected {
  border-color: #07C160;
  background: #f0f8f0;
}

.custom-emoji-img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

.selected-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  background: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-actions {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  flex-shrink: 0;
}

.delete-btn {
  width: 100%;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:active {
  transform: scale(0.98);
  background: #dd3333;
}
</style>

