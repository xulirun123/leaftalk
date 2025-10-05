<template>
  <div v-if="isVisible" class="music-player-overlay" @click="close">
    <div class="music-player" @click.stop>
      <!-- 封面 -->
      <div class="music-cover">
        <img :src="musicInfo.cover || '/images/default-music-cover.png'" :alt="musicInfo.name" />
      </div>
      
      <!-- 音乐信息 -->
      <div class="music-info">
        <div class="music-name">{{ musicInfo.name || '未知音乐' }}</div>
        <div class="music-artist">{{ musicInfo.artist || '未知艺术家' }}</div>
      </div>
      
      <!-- 进度条 -->
      <div class="music-progress">
        <span class="time-current">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar" @click="seekTo">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="time-total">{{ formatTime(duration) }}</span>
      </div>
      
      <!-- 控制按钮 -->
      <div class="music-controls">
        <button class="control-btn" @click="togglePlay">
          <iconify-icon :icon="isPlaying ? 'heroicons:pause-solid' : 'heroicons:play-solid'" width="32"></iconify-icon>
        </button>
      </div>
      
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="close">
        <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
      </button>
    </div>
    
    <!-- 音频元素 -->
    <audio
      ref="audioElement"
      :src="musicInfo.url"
      @timeupdate="updateTime"
      @loadedmetadata="updateDuration"
      @ended="onEnded"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface MusicInfo {
  name: string
  artist?: string
  cover?: string
  url?: string
}

const props = defineProps<{
  visible: boolean
  musicInfo: MusicInfo
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const audioElement = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const isVisible = computed(() => props.visible)

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 播放/暂停
const togglePlay = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
    isPlaying.value = false
  } else {
    audioElement.value.play()
    isPlaying.value = true
  }
}

// 更新当前时间
const updateTime = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

// 更新总时长
const updateDuration = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration
  }
}

// 跳转到指定位置
const seekTo = (event: MouseEvent) => {
  if (!audioElement.value) return
  
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  audioElement.value.currentTime = percent * duration.value
}

// 播放结束
const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
}

// 关闭播放器
const close = () => {
  if (audioElement.value) {
    audioElement.value.pause()
    isPlaying.value = false
  }
  emit('close')
}

// 监听音乐信息变化，自动播放
watch(() => props.musicInfo, (newInfo) => {
  if (newInfo.url && audioElement.value) {
    audioElement.value.load()
    audioElement.value.play()
    isPlaying.value = true
  }
}, { deep: true })
</script>

<style scoped>
.music-player-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.music-player {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 32px 24px;
  width: 90%;
  max-width: 400px;
  position: relative;
}

.music-cover {
  width: 200px;
  height: 200px;
  margin: 0 auto 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-info {
  text-align: center;
  margin-bottom: 24px;
}

.music-name {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.music-artist {
  font-size: 14px;
  color: #999;
}

.music-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.time-current,
.time-total {
  font-size: 12px;
  color: #999;
  min-width: 40px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #E5E5E5;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #07C160;
  border-radius: 2px;
  transition: width 0.1s;
}

.music-controls {
  display: flex;
  justify-content: center;
}

.control-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #07C160;
  border: none;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:active {
  transform: scale(0.95);
  background: #06AD56;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #F5F5F5;
  border: none;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:active {
  background: #E5E5E5;
}
</style>

