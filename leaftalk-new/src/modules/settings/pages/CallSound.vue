<template>
  <div class="call-sound">
    <!-- 顶部导航 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <div class="header-title">语音和视频通话提示音</div>
    </div>

    <!-- 提示音列表 -->
    <div class="sound-list">
      <div class="section-title">选择通话提示音</div>

      <div class="sound-list-simple">
        <div
          v-for="sound in ringtoneLibrary"
          :key="sound.id"
          class="sound-item-simple"
        >
          <div class="sound-name">{{ sound.name }}</div>

          <div class="sound-actions">
            <button
              class="action-btn preview-btn"
              @click="playSound(sound)"
              :class="{ playing: playingSound === sound.id }"
            >
              <iconify-icon
                :icon="playingSound === sound.id ? 'heroicons:pause' : 'heroicons:play'"
                width="16"
              ></iconify-icon>
              {{ playingSound === sound.id ? '停止' : '试听' }}
            </button>

            <button
              class="action-btn select-btn"
              @click="selectSound(sound.id)"
              :class="{ selected: currentSoundId === sound.id }"
            >
              <iconify-icon
                :icon="currentSoundId === sound.id ? 'heroicons:check-circle' : 'heroicons:plus-circle'"
                width="16"
              ></iconify-icon>
              {{ currentSoundId === sound.id ? '已选择' : '选择' }}
            </button>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../../../stores/notification'

const router = useRouter()
const notificationStore = useNotificationStore()

// 铃声库（真实音频文件）
const ringtoneLibrary = ref([
  {
    id: 'classic_phone',
    name: '经典电话铃声',
    file: '/sounds/call-ringtones/classic_phone.wav'
  },
  {
    id: 'gentle_chime',
    name: '温柔钟声',
    file: '/sounds/call-ringtones/gentle_chime.wav'
  },
  {
    id: 'modern_tone',
    name: '现代音调',
    file: '/sounds/call-ringtones/modern_tone.wav'
  },
  {
    id: 'peaceful_bells',
    name: '宁静铃声',
    file: '/sounds/call-ringtones/peaceful_bells.wav'
  },
  {
    id: 'happy_melody',
    name: '欢快旋律',
    file: '/sounds/call-ringtones/happy_melody.wav'
  },
  {
    id: 'soft_piano',
    name: '柔和钢琴',
    file: '/sounds/call-ringtones/soft_piano.wav'
  },
  {
    id: 'nature_sound',
    name: '自然之音',
    file: '/sounds/call-ringtones/nature_sound.wav'
  },
  {
    id: 'elegant_harp',
    name: '优雅竖琴',
    file: '/sounds/call-ringtones/elegant_harp.wav'
  }
])

// 当前选中的提示音
const currentSoundId = computed({
  get: () => notificationStore.settings.callSoundType || 'classic_phone',
  set: (value) => notificationStore.updateSetting('callSoundType', value)
})

// 当前播放的音频
const currentAudio = ref<HTMLAudioElement | null>(null)
const playingSound = ref<string | null>(null)

const goBack = () => {
  try {
    // 强制停止所有播放的音频
    stopAllCurrentSounds()
    playingSound.value = null

    // 清除所有定时器
    clearAllTimers()

    console.log('🔙 返回上一页')

    // 使用setTimeout确保音频停止后再返回
    setTimeout(() => {
      router.back()
    }, 100)
  } catch (error) {
    console.error('返回页面失败:', error)
    // 如果router.back()失败，尝试直接跳转到设置页面
    router.push('/settings')
  }
}

// 清除所有定时器
const clearAllTimers = () => {
  // 清除播放状态重置定时器
  if (window.playingSoundTimer) {
    clearTimeout(window.playingSoundTimer)
    window.playingSoundTimer = null
  }
}

const selectSound = (soundId: string) => {
  currentSoundId.value = soundId
  console.log('选择通话提示音:', soundId)
}

const playSound = (sound: any) => {
  // 如果正在播放同一个音频，则停止播放
  if (playingSound.value === sound.id) {
    stopAllCurrentSounds()
    playingSound.value = null
    return
  }

  // 停止当前播放的所有音频
  stopAllCurrentSounds()

  try {
    // 创建音频对象
    const audio = new Audio(sound.file)
    currentAudio.value = audio

    // 设置音量
    audio.volume = 0.7

    // 设置事件监听
    audio.onended = () => {
      if (playingSound.value === sound.id) {
        playingSound.value = null
      }
    }

    audio.onerror = (error) => {
      console.warn('🔊 铃声播放失败:', error)
      playingSound.value = null
    }

    // 播放音频
    audio.play().then(() => {
      playingSound.value = sound.id
      console.log('🔊 开始播放通话提示音:', sound.name)
    }).catch(error => {
      console.warn('🔊 铃声播放失败:', error)
      playingSound.value = null
    })

  } catch (error) {
    console.error('🔊 铃声播放错误:', error)
    playingSound.value = null
  }
}

// 停止所有当前播放的声音
const stopAllCurrentSounds = () => {
  // 停止HTML音频
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
    currentAudio.value = null
  }
}



// 生命周期
onMounted(() => {
  notificationStore.init()
})




// 活泼音效 - 快速变化音调
const playLivelyEffect = (audioContext: AudioContext) => {
  const { oscillator, gainNode } = createOscillator(audioContext, 600, 'triangle', 0.35)

  // 频率快速变化：600Hz → 900Hz → 750Hz → 1100Hz
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.1)
  oscillator.frequency.setValueAtTime(750, audioContext.currentTime + 0.2)
  oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.3)

  // 音量包络
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.35, audioContext.currentTime + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

// 主要的音效生成函数
const generateDefaultSound = (audioContext: AudioContext) => {
  playDefaultEffect(audioContext)
}

// 播放简单音效的通用函数
const playSimpleSound = (audioContext: AudioContext, soundType: string) => {
  switch (soundType) {
    case 'default':
      playDefaultEffect(audioContext)
      break
    case 'ding':
      playDingEffect(audioContext)
      break
    case 'bell':
      playBellEffect(audioContext)
      break
    case 'chime':
      playChimeEffect(audioContext)
      break
    case 'pop':
      playPopEffect(audioContext)
      break
    case 'crisp':
      playCrispEffect(audioContext)
      break
    case 'gentle':
      playGentleEffect(audioContext)
      break
    case 'lively':
      playLivelyEffect(audioContext)
      break
    default:
      playDefaultEffect(audioContext)
  }
}

// 创建简单振荡器的辅助函数
const createOscillator = (audioContext: AudioContext, frequency: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  // 添加到当前振荡器列表
  currentOscillators.value.push(oscillator)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  return { oscillator, gainNode }
}

// 默认音效 - 双音调
const playDefaultEffect = (audioContext: AudioContext) => {
  const { oscillator, gainNode } = createOscillator(audioContext, 800, 'sine', 0.3)

  // 频率变化：800Hz → 600Hz → 800Hz
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.4)
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.8)

  // 音量包络
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 1.2)
}

// 叮咚音效 - 高低音快速切换
const playDingEffect = (audioContext: AudioContext) => {
  const { oscillator, gainNode } = createOscillator(audioContext, 1200, 'triangle', 0.4)

  // 频率变化：1200Hz → 800Hz
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)

  // 音量包络
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
}

// 铃声音效 - 连续音调
const playBellEffect = (audioContext: AudioContext) => {
  const { oscillator, gainNode } = createOscillator(audioContext, 880, 'sine', 0.35)

  // 频率变化：880Hz → 1100Hz → 880Hz
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.2)
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.4)

  // 音量包络
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.35, audioContext.currentTime + 0.05)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.8)
}

// 风铃音效 - 和弦音
const playChimeEffect = (audioContext: AudioContext) => {
  const frequencies = [523, 659, 784] // C, E, G 和弦

  frequencies.forEach((freq, index) => {
    const { oscillator, gainNode } = createOscillator(audioContext, freq, 'triangle', 0.2)

    const startTime = audioContext.currentTime + index * 0.1
    const duration = 1.0

    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  })
}

const generateDingSound = (audioContext: AudioContext) => {
  playDingEffect(audioContext)
}

const generateBellSound = (audioContext: AudioContext) => {
  playBellEffect(audioContext)
}

const generateChimeSound = (audioContext: AudioContext) => {
  playChimeEffect(audioContext)
}

const generatePopSound = (audioContext: AudioContext) => {
  playPopEffect(audioContext)
}

const generateCrispSound = (audioContext: AudioContext) => {
  playCrispEffect(audioContext)
}

const generateGentleSound = (audioContext: AudioContext) => {
  playGentleEffect(audioContext)
}

const generateLivelySound = (audioContext: AudioContext) => {
  playLivelyEffect(audioContext)
}





const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const clearSearch = () => {
  searchQuery.value = ''
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
      id: `custom_call_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      file: URL.createObjectURL(file),
      category: 'custom',
      isCustom: true
    }

    // 添加到音乐列表（这里应该保存到store中）
    console.log('添加自定义通话音乐:', customSound)
    
    // 选择这个音乐
    selectSound(customSound.id)
    
    alert('自定义通话音乐添加成功！')
  }
}

onMounted(() => {
  notificationStore.init()
})
</script>

<style scoped>
.call-sound {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: #f0f0f0;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.search-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
}

.search-box input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
}

.search-box input::placeholder {
  color: #999;
}

.clear-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
}

.clear-btn:hover {
  background: #e0e0e0;
}

.category-tabs {
  display: flex;
  background: white;
  padding: 0 16px;
  gap: 8px;
  overflow-x: auto;
}

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
}

.category-tab:hover {
  background: #e0e0e0;
}

.category-tab.active {
  background: #07C160;
  color: white;
}

.sound-list {
  background: white;
  margin-top: 8px;
}

.sound-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sound-item:hover {
  background: #f9f9f9;
}

.sound-item.active {
  background: #f0f9ff;
}

.sound-info {
  flex: 1;
}

.sound-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 2px;
}

.sound-artist {
  font-size: 12px;
  color: #999;
}

.sound-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-btn {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.play-btn:hover {
  background: #e0e0e0;
}

.play-btn.playing {
  background: #07C160;
  color: white;
  animation: pulse 1.5s ease-in-out;
}

.play-btn:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.sound-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-upload-section {
  background: white;
  padding: 16px;
  margin-top: 8px;
}

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
}

.upload-area:hover {
  border-color: #07C160;
  background: #f9f9f9;
}

.upload-area span {
  font-size: 16px;
  color: #333;
  margin: 8px 0 4px 0;
}

.upload-area p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* 简化音乐列表样式 */
.sound-list-simple {
  background: white;
  border-radius: 12px;
  margin: 0 16px;
  overflow: hidden;
}

.sound-item-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.sound-item-simple:last-child {
  border-bottom: none;
}

.sound-item-simple:hover {
  background-color: #f8f9fa;
}

.sound-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.sound-actions {
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

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  padding: 16px 20px 8px;
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px 12px 0 0;
}
</style>
