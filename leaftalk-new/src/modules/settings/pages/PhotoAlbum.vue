<template>
  <div class="photo-album">
    <!-- 相册网格 -->
    <div class="photo-grid">
      <div
        v-for="(photo, index) in photos"
        :key="index"
        class="photo-item"
        :class="{ selected: selectedPhoto === index }"
        @click="selectPhoto(index)"
      >
        <img :src="photo.url" :alt="photo.name" />
        <div class="check-icon" v-if="selectedPhoto === index">
          <iconify-icon icon="heroicons:check-circle-solid" width="24" style="color: #07c160;"></iconify-icon>
        </div>
      </div>
    </div>

    <!-- 底部确认按钮 -->
    <div class="bottom-actions">
      <button class="confirm-button" @click="confirmSelection" :disabled="selectedPhoto === null">
        确定
      </button>
    </div>

    <!-- 文件输入（隐藏） -->
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
const fileInput = ref<HTMLInputElement | null>(null)

// 相册照片列表（模拟数据）
const photos = ref<Array<{ url: string; name: string }>>([])

// 当前选中的照片
const selectedPhoto = ref<number | null>(null)

// 选择照片
const selectPhoto = (index: number) => {
  selectedPhoto.value = index
}

// 确认选择
const confirmSelection = async () => {
  if (selectedPhoto.value === null) return

  try {
    const photo = photos.value[selectedPhoto.value]
    
    // 保存背景设置
    const { useGeneralStore } = await import('../stores/settingsStore')
    const generalStore = useGeneralStore()
    generalStore.updateSetting('chatBackground', `custom:${photo.url}`)

    console.log('✅ 背景设置成功')
    
    // 返回聊天背景页面
    router.push('/settings/chat-background')
  } catch (error) {
    console.error('❌ 保存背景设置失败:', error)
  }
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件大小不能超过5MB')
      return
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      
      // 添加到相册列表
      photos.value.unshift({
        url: imageUrl,
        name: file.name
      })
      
      // 自动选中新添加的照片
      selectedPhoto.value = 0
    }
    reader.onerror = () => {
      alert('图片读取失败，请重试')
    }
    reader.readAsDataURL(file)
  }
}

// 打开文件选择器
const openFileSelector = () => {
  fileInput.value?.click()
}

// 页面加载时，由于浏览器限制，直接打开文件选择器
onMounted(() => {
  // 直接打开文件选择器
  openFileSelector()
})
</script>

<style scoped>
.photo-album {
  min-height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
}

.photo-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  padding: 2px;
  overflow-y: auto;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-item.selected::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(7, 193, 96, 0.3);
  pointer-events: none;
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-actions {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
}

.confirm-button {
  width: 100%;
  height: 48px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.confirm-button:active:not(:disabled) {
  background: #06AD56;
}
</style>

