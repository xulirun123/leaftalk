<template>
  <div class="notification-sound">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">新消息提示音</div>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass" width="16" style="color: #999;"></iconify-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索音乐名称或歌手"
          @input="handleSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
          <iconify-icon icon="heroicons:x-mark" width="14" style="color: #999;"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-tab"
        :class="{ active: selectedCategory === category.id }"
        @click="selectCategory(category.id)"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- 提示音列表 -->
    <div class="sound-list">
      <div
        v-for="sound in filteredSounds"
        :key="sound.id"
        class="sound-item"
        :class="{ active: currentSoundId === sound.id }"
        @click="selectSound(sound.id)"
      >
        <div class="sound-info">
          <div class="sound-name">{{ sound.name }}</div>
          <div v-if="sound.artist" class="sound-artist">{{ sound.artist }}</div>
        </div>
        <div class="sound-actions">
          <button
            class="play-btn"
            :class="{ playing: playingSound === sound.id }"
            @click.stop="playSound(sound)"
            :disabled="playingSound === sound.id"
          >
            <iconify-icon
              :icon="playingSound === sound.id ? 'heroicons:speaker-wave' : 'heroicons:play'"
              width="16"
            ></iconify-icon>
          </button>
          <div class="sound-check" v-if="currentSoundId === sound.id">
            <iconify-icon icon="heroicons:check" width="16" style="color: #07C160;"></iconify-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义音乐上传 -->
    <div class="custom-upload-section">
      <div class="upload-area" @click="selectCustomMusic">
        <iconify-icon icon="heroicons:musical-note" width="24" style="color: #07C160;"></iconify-icon>
        <span>上传自定义音乐</span>
        <p>支持MP3、WAV格式，最大5MB</p>
      </div>
    </div>

    <!-- 文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept="audio/*"
      style="display: none"
      @change="onCustomMusicSelected"
    />

    <!-- 说明文字 -->
    <div class="sound-description">
      <p>选择你喜欢的新消息提示音。点击播放按钮可以预览提示音效果。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore, SOUND_CATEGORIES } from '../../../stores/notification'

const router = useRouter()
const notificationStore = useNotificationStore()

// 搜索和分类
const searchQuery = ref('')
const selectedCategory = ref('system')
const fileInput = ref<HTMLInputElement>()

// 分类列表
const categories = SOUND_CATEGORIES

// 当前选中的提示音
const currentSoundId = computed({
  get: () => notificationStore.settings.soundType,
  set: (value) => notificationStore.updateSetting('soundType', value)
})

// 过滤后的音乐列表
const filteredSounds = computed(() => {
  let sounds = notificationStore.NOTIFICATION_SOUNDS

  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    sounds = sounds.filter(sound => sound.category === selectedCategory.value)
  }

  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    sounds = sounds.filter(sound =>
      sound.name.toLowerCase().includes(query) ||
      (sound.artist && sound.artist.toLowerCase().includes(query))
    )
  }

  return sounds
})

// 当前播放的音频
const currentAudio = ref<HTMLAudioElement | null>(null)
const playingSound = ref<string | null>(null)
const currentOscillators = ref<OscillatorNode[]>([]) // 存储当前播放的振荡器

const goBack = () => {
  try {
    // 停止所有播放的音频
    stopAllCurrentSounds()
    playingSound.value = null

    // 返回上一页
    router.back()
  } catch (error) {
    console.error('返回页面失败:', error)
    // 如果router.back()失败，尝试直接跳转到设置页面
    router.push('/settings')
  }
}

const selectSound = (soundId: string) => {
  currentSoundId.value = soundId
  
  // 自动播放选中的提示音（除了无声音）
  const sound = notificationStore.NOTIFICATION_SOUNDS.find(s => s.id === soundId)
  if (sound && sound.file) {
    playSound(sound)
  }
}

const playSound = (sound: any) => {
  try {
    // 停止当前播放的所有音频和振荡器
    stopAllCurrentSounds()

    // 设置当前播放的音乐ID
    playingSound.value = sound.id

    // 直接播放系统提示音，因为音频文件不存在
    console.log('🔊 播放新消息提示音:', sound.name)
    playSystemSound(sound)

    // 0.5秒后重置播放状态（新消息提示音较短）
    setTimeout(() => {
      if (playingSound.value === sound.id) {
        playingSound.value = null
        stopAllCurrentSounds()
      }
    }, 500)
  } catch (error) {
    console.warn('播放提示音失败:', error)
    playSystemSound(sound)
    playingSound.value = null
  }
}

// 停止所有当前播放的声音
const stopAllCurrentSounds = () => {
  // 停止HTML音频
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
  }

  // 停止所有振荡器
  currentOscillators.value.forEach(oscillator => {
    try {
      oscillator.stop()
    } catch (error) {
      // 忽略已经停止的振荡器错误
    }
  })
  currentOscillators.value = []
}

const playSystemSound = (sound: any) => {
  // 使用Web Audio API播放不同类型的提示音
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // 根据音乐名称生成不同的音效
    const soundType = getSoundType(sound.name)
    generateNotificationSoundByType(audioContext, soundType)
  } catch (error) {
    console.warn('播放系统提示音失败:', error)
  }
}

// 根据音乐名称确定音效类型
const getSoundType = (name: string) => {
  if (name.includes('默认') || name.includes('default')) return 'default'
  if (name.includes('叮咚') || name.includes('ding')) return 'ding'
  if (name.includes('铃声') || name.includes('bell')) return 'bell'
  if (name.includes('风铃') || name.includes('chime')) return 'chime'
  if (name.includes('泡泡') || name.includes('pop')) return 'pop'
  if (name.includes('清脆') || name.includes('crisp')) return 'crisp'
  if (name.includes('温和') || name.includes('gentle')) return 'gentle'
  if (name.includes('活泼') || name.includes('lively')) return 'lively'
  return 'default'
}

// 根据类型生成不同的新消息提示音效
const generateNotificationSoundByType = (audioContext: AudioContext, type: string) => {
  switch (type) {
    case 'default':
      generateDefaultNotification(audioContext)
      break
    case 'ding':
      generateDingNotification(audioContext)
      break
    case 'bell':
      generateBellNotification(audioContext)
      break
    case 'chime':
      generateChimeNotification(audioContext)
      break
    case 'pop':
      generatePopNotification(audioContext)
      break
    case 'crisp':
      generateCrispNotification(audioContext)
      break
    case 'gentle':
      generateGentleNotification(audioContext)
      break
    case 'lively':
      generateLivelyNotification(audioContext)
      break
    default:
      generateDefaultNotification(audioContext)
  }
}

// 默认新消息提示音
const generateDefaultNotification = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
}

// 叮咚新消息提示音
const generateDingNotification = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05)

  gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)
}

// 铃声新消息提示音
const generateBellNotification = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(880, audioContext.currentTime)

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.4)
}

// 风铃新消息提示音
const generateChimeNotification = (audioContext: AudioContext) => {
  const frequencies = [659, 784, 988] // E, G, B

  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + index * 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3 + index * 0.05)

    oscillator.start(audioContext.currentTime + index * 0.05)
    oscillator.stop(audioContext.currentTime + 0.3 + index * 0.05)
  })
}

// 泡泡新消息提示音
const generatePopNotification = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(500, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.08)

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.15)
}

// 清脆新消息提示音
const generateCrispNotification = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(1500, audioContext.currentTime)

  gainNode.gain.setValueAtTime(0.35, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

// 温和新消息提示音
const generateGentleNotification = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.15)

  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.4)
}

// 活泼新消息提示音
const generateLivelyNotification = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(700, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.06)
  oscillator.frequency.setValueAtTime(850, audioContext.currentTime + 0.12)

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.25)
}

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const clearSearch = () => {
  searchQuery.value = ''
}

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

const selectCustomMusic = () => {
  fileInput.value?.click()
}

const onCustomMusicSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // 检查文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过5MB')
      return
    }

    // 检查文件类型
    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件')
      return
    }

    // 创建自定义音乐条目
    const customSound = {
      id: `custom_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      file: URL.createObjectURL(file),
      category: 'custom',
      isCustom: true
    }

    // 添加到音乐列表（这里应该保存到store中）
    console.log('添加自定义音乐:', customSound)

    // 选择这个音乐
    selectSound(customSound.id)

    alert('自定义音乐添加成功！')
  }
}

onMounted(() => {
  notificationStore.init()
})
</script>

<style scoped lang="scss">
.notification-sound {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  
  .back-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    margin-right: 12px;
    
    &:hover {
      background: #f0f0f0;
    }
  }
  
  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.search-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;

  .search-box {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 8px 12px;
    gap: 8px;

    input {
      flex: 1;
      border: none;
      background: none;
      outline: none;
      font-size: 14px;

      &::placeholder {
        color: #999;
      }
    }

    .clear-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      border-radius: 4px;

      &:hover {
        background: #e0e0e0;
      }
    }
  }
}

.category-tabs {
  display: flex;
  background: white;
  padding: 0 16px;
  gap: 8px;
  overflow-x: auto;

  .category-tab {
    padding: 8px 16px;
    border: none;
    background: #f5f5f5;
    border-radius: 16px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover {
      background: #e0e0e0;
    }

    &.active {
      background: #07C160;
      color: white;
    }
  }
}

.sound-list {
  background: white;
  margin-top: 8px;
}

.sound-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f8f8f8;
  }
  
  &.active {
    background: #f0f9f0;
  }
  
  .sound-info {
    flex: 1;

    .sound-name {
      font-size: 16px;
      color: #333;
      margin-bottom: 2px;
    }

    .sound-artist {
      font-size: 12px;
      color: #999;
    }
  }
  
  .sound-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .play-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #666;
      transition: all 0.2s;
      
      &:hover {
        border-color: #07C160;
        color: #07C160;
        background: #f0f9f0;
      }

      &.playing {
        background: #07C160;
        border-color: #07C160;
        color: white;
        animation: pulse 0.5s ease-in-out;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.8;
      }
    }
    
    .sound-check {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.custom-upload-section {
  background: white;
  padding: 16px;
  margin-top: 8px;

  .upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    border: 2px dashed #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #07C160;
      background: #f9f9f9;
    }

    span {
      font-size: 16px;
      color: #333;
      margin: 8px 0 4px 0;
    }

    p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }
  }
}

.sound-description {
  padding: 16px;
  background: white;
  margin-top: 8px;

  p {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
