<template>
  <div class="call-music">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <h1 class="header-title">通话背景音乐</h1>
      <button class="save-btn" @click="saveSettings" :disabled="!hasChanges">
        保存
      </button>
    </div>



    <!-- 音乐列表 -->
    <div class="music-list">
      <div class="section-title">选择通话背景音乐</div>

      <div class="music-list-simple">
        <div
          v-for="music in filteredMusic"
          :key="music.id"
          class="music-item-simple"
        >
          <div class="music-name">{{ music.name }}</div>

          <div class="music-actions">
            <button
              class="action-btn preview-btn"
              @click="togglePlayMusic(music.id)"
              :class="{ playing: playingMusicId === music.id }"
            >
              <iconify-icon
                :icon="playingMusicId === music.id ? 'heroicons:pause' : 'heroicons:play'"
                width="16"
              ></iconify-icon>
              {{ playingMusicId === music.id ? '停止' : '试听' }}
            </button>

            <button
              class="action-btn select-btn"
              @click="selectMusic(music.id)"
              :class="{ selected: selectedMusicId === music.id }"
            >
              <iconify-icon
                :icon="selectedMusicId === music.id ? 'heroicons:check-circle' : 'heroicons:plus-circle'"
                width="16"
              ></iconify-icon>
              {{ selectedMusicId === music.id ? '已选择' : '选择' }}
            </button>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../../../stores/notification'

const router = useRouter()
const notificationStore = useNotificationStore()

// 响应式数据
const selectedMusicId = ref('gentle_piano') // 默认选择第一首音乐
const playingMusicId = ref('')
const currentAudio = ref<HTMLAudioElement | null>(null)

const originalSettings = ref({
  musicId: 'gentle_piano'
})



// 预设音乐列表（背景音乐）
const musicLibrary = ref([
  {
    id: 'gentle_piano',
    name: '轻柔钢琴',
    file: '/sounds/call-music/gentle_piano.wav'
  },
  {
    id: 'warm_strings',
    name: '温暖弦乐',
    file: '/sounds/call-music/warm_strings.wav'
  },
  {
    id: 'peaceful_harp',
    name: '宁静竖琴',
    file: '/sounds/call-music/peaceful_harp.wav'
  },
  {
    id: 'soft_flute',
    name: '柔和长笛',
    file: '/sounds/call-music/soft_flute.wav'
  },
  {
    id: 'calm_bells',
    name: '平静铃声',
    file: '/sounds/call-music/calm_bells.wav'
  },
  {
    id: 'dreamy_pad',
    name: '梦幻音垫',
    file: '/sounds/call-music/dreamy_pad.wav'
  },
  {
    id: 'nature_ambient',
    name: '自然环境',
    file: '/sounds/call-music/nature_ambient.wav'
  },
  {
    id: 'meditation_tone',
    name: '冥想音调',
    file: '/sounds/call-music/meditation_tone.wav'
  }
])

// 计算属性
const filteredMusic = computed(() => {
  return musicLibrary.value
})

const hasChanges = computed(() => {
  return selectedMusicId.value !== originalSettings.value.musicId
})

// 方法
const goBack = () => {
  if (hasChanges.value) {
    if (confirm('您有未保存的更改，确定要离开吗？')) {
      stopCurrentMusic()
      router.back()
    }
  } else {
    stopCurrentMusic()
    router.back()
  }
}

const saveSettings = async () => {
  try {
    // 保存设置到notification store，默认启用背景音乐
    await notificationStore.updateSetting('callMusicEnabled', true)
    await notificationStore.updateSetting('callMusicVolume', 60)
    await notificationStore.updateSetting('callMusicLoop', true)
    await notificationStore.updateSetting('callMusicId', selectedMusicId.value)

    // 更新原始设置
    originalSettings.value = {
      musicId: selectedMusicId.value
    }

    stopCurrentMusic()
    router.back()
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存失败，请重试')
  }
}



const selectMusic = (musicId: string) => {
  selectedMusicId.value = musicId
  // 自动播放预览
  togglePlayMusic(musicId)
}

const togglePlayMusic = (musicId: string) => {
  if (playingMusicId.value === musicId) {
    stopCurrentMusic()
  } else {
    playMusic(musicId)
  }
}

const playMusic = (musicId: string) => {
  const music = musicLibrary.value.find(m => m.id === musicId)
  if (!music) return

  stopCurrentMusic()

  try {
    // 创建音频对象
    const audio = new Audio(music.file)
    currentAudio.value = audio

    // 设置默认音量和循环
    audio.volume = 0.6 // 60%音量
    audio.loop = true // 默认循环播放

    // 设置事件监听
    audio.onended = () => {
      if (playingMusicId.value === musicId) {
        playingMusicId.value = ''
      }
    }

    audio.onerror = (error) => {
      console.warn('🎵 音乐播放失败:', error)
      playingMusicId.value = ''
    }

    // 播放音乐
    audio.play().then(() => {
      playingMusicId.value = musicId
      console.log('🎵 开始播放:', music.name, 'by', music.artist)
    }).catch(error => {
      console.warn('🎵 音乐播放失败:', error)
      playingMusicId.value = ''
    })

  } catch (error) {
    console.error('🎵 音乐播放错误:', error)
    playingMusicId.value = ''
  }
}

const stopCurrentMusic = () => {
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
    currentAudio.value = null
  }
  playingMusicId.value = ''
}



// 生命周期
onMounted(() => {
  // 加载当前设置
  selectedMusicId.value = notificationStore.settings.callMusicId || 'gentle_piano'

  // 保存原始设置
  originalSettings.value = {
    musicId: selectedMusicId.value
  }
})

onUnmounted(() => {
  // 停止播放
  stopCurrentMusic()
})
</script>

<style scoped>
.call-music {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

/* 顶部导航栏 */
.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.save-btn {
  border: none;
  background: #07c160;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.save-btn:not(:disabled):hover {
  background: #06a552;
}

/* 功能说明 */
.info-section {
  margin-top: 60px;
  padding: 16px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-left: 4px solid #07c160;
}

.info-text h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.info-text p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 音乐设置 */
.music-settings {
  padding: 0 16px 16px;
}

.setting-group {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.setting-header {
  margin-bottom: 20px;
}

.setting-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item span {
  font-size: 14px;
  color: #333;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 200px;
}

.volume-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #f0f0f0;
  outline: none;
  -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #07c160;
  cursor: pointer;
}

.volume-value {
  font-size: 12px;
  color: #07c160;
  font-weight: 600;
  min-width: 35px;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #07c160;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* 音乐列表 */
.music-list {
  padding: 0 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 16px;
}

.music-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.category-tab.active {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.category-tab:hover:not(.active) {
  border-color: #07c160;
  color: #07c160;
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.music-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 2px solid transparent;
}

.music-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.music-item.active {
  border-color: #07c160;
  background: rgba(7,193,96,0.02);
}

.music-item.playing {
  background: rgba(7,193,96,0.05);
}

.music-cover {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(0,0,0,0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.music-cover:hover .play-overlay {
  opacity: 1;
}

.music-info {
  margin-bottom: 12px;
}

.music-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-artist {
  font-size: 14px;
  color: #666;
  margin: 0 0 4px;
}

.music-duration {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.music-controls {
  display: flex;
  justify-content: center;
}

.play-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 18px;
  background: #07c160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:hover {
  background: #06a552;
  transform: scale(1.05);
}

.play-btn.playing {
  background: #ff4757;
}

.selected-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 上传区域 */
.upload-section {
  padding: 0 16px 20px;
}

.upload-area {
  border: 2px dashed #07c160;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(7,193,96,0.02);
}

.upload-area:hover {
  background: rgba(7,193,96,0.05);
  border-color: #06a552;
}

.upload-area h3 {
  margin: 16px 0 8px;
  font-size: 16px;
  color: #333;
}

.upload-area p {
  margin: 0 0 20px;
  font-size: 14px;
  color: #666;
}

.upload-btn {
  background: #07c160;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: #06a552;
}

/* 底部操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  z-index: 99;
}

.test-btn, .reset-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:not(:disabled):hover {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn:hover {
  background: #ff4757;
  color: white;
  border-color: #ff4757;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-grid {
    grid-template-columns: 1fr;
  }

  .music-categories {
    justify-content: flex-start;
  }
}

/* 简化音乐列表样式 */
.music-list-simple {
  background: white;
  border-radius: 12px;
  margin: 0 16px;
  overflow: hidden;
}

.music-item-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.music-item-simple:last-child {
  border-bottom: none;
}

.music-item-simple:hover {
  background-color: #f8f9fa;
}

.music-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.music-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #f5f5f5;
}

.preview-btn.playing {
  background-color: #07c160;
  color: white;
  border-color: #07c160;
}

.select-btn.selected {
  background-color: #07c160;
  color: white;
  border-color: #07c160;
}

/* 动画效果 */
.music-item-simple {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
