<template>
  <div class="voice-recorder">
    <!-- 录音按钮 -->
    <div class="record-button-container">
      <button 
        @touchstart.passive="startRecording"
        @touchend.passive="stopRecording"
        @touchcancel.passive="cancelRecording"
        @mousedown="startRecording"
        @mouseup="stopRecording"
        @mouseleave="handleMouseLeave"
        class="record-btn"
        :class="{ 
          recording: isRecording,
          disabled: !canRecord
        }"
        :disabled="!canRecord"
      >
        <div class="record-icon">
          <iconify-icon 
            :icon="isRecording ? 'heroicons:stop' : 'heroicons:microphone'" 
            :width="isRecording ? 24 : 20"
          ></iconify-icon>
        </div>
        <span class="record-text">
          {{ getRecordButtonText() }}
        </span>
      </button>
    </div>

    <!-- 录音状态显示 -->
    <div v-if="isRecording" class="recording-status">
      <div class="recording-info">
        <div class="recording-time">{{ formatTime(recordingTime) }}</div>
        <div class="recording-waves">
          <span v-for="i in 5" :key="i" class="wave-bar" :style="getWaveStyle(i)"></span>
        </div>
        <div class="recording-hint">{{ getRecordingHint() }}</div>
      </div>
      
      <!-- 取消录音区域 -->
      <div class="cancel-zone" :class="{ active: showCancelZone }">
        <iconify-icon icon="heroicons:trash" width="24" color="#ff4757"></iconify-icon>
        <span>松开取消</span>
      </div>
    </div>

    <!-- 录音完成预览 -->
    <div v-if="recordedAudio && !isRecording" class="audio-preview">
      <div class="preview-controls">
        <button @click="playRecording" class="play-btn" :disabled="isPlaying">
          <iconify-icon 
            :icon="isPlaying ? 'heroicons:pause' : 'heroicons:play'" 
            width="16"
          ></iconify-icon>
        </button>
        
        <div class="audio-info">
          <div class="audio-duration">{{ formatTime(recordingDuration) }}</div>
          <div class="audio-waveform">
            <div 
              v-for="i in 20" 
              :key="i" 
              class="waveform-bar"
              :style="{ height: Math.random() * 100 + '%' }"
            ></div>
          </div>
        </div>
        
        <button @click="deleteRecording" class="delete-btn">
          <iconify-icon icon="heroicons:trash" width="16" color="#ff4757"></iconify-icon>
        </button>
      </div>
      
      <div class="preview-actions">
        <button @click="deleteRecording" class="cancel-btn">重录</button>
        <button @click="sendRecording" class="send-btn">发送</button>
      </div>
    </div>

    <!-- 权限请求提示 -->
    <div v-if="showPermissionTip" class="permission-tip">
      <iconify-icon icon="heroicons:microphone" width="24" color="#ff9500"></iconify-icon>
      <span>需要麦克风权限才能录音</span>
      <button @click="requestPermission" class="permission-btn">授权</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  maxDuration?: number // 最大录音时长（秒）
  minDuration?: number // 最小录音时长（秒）
}

const props = withDefaults(defineProps<Props>(), {
  maxDuration: 60,
  minDuration: 1
})

// Emits
const emit = defineEmits<{
  'recording-start': []
  'recording-stop': [audioBlob: Blob, duration: number]
  'recording-cancel': []
  'send': [audioBlob: Blob, duration: number]
}>()

// 响应式数据
const isRecording = ref(false)
const isPlaying = ref(false)
const recordingTime = ref(0)
const recordingDuration = ref(0)
const recordedAudio = ref<Blob | null>(null)
const showCancelZone = ref(false)
const showPermissionTip = ref(false)
const canRecord = ref(false)

// 录音相关
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let recordingTimer: number | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let microphone: MediaStreamAudioSourceNode | null = null
let dataArray: Uint8Array | null = null
let animationFrame: number | null = null

// 计算属性
const getRecordButtonText = () => {
  if (!canRecord.value) return '需要麦克风权限'
  if (isRecording.value) return '松开发送'
  return '按住说话'
}

const getRecordingHint = () => {
  if (recordingTime.value < props.minDuration) {
    return `至少录制${props.minDuration}秒`
  }
  if (recordingTime.value > props.maxDuration - 10) {
    return `还能录制${props.maxDuration - recordingTime.value}秒`
  }
  return '正在录音...'
}

// 方法
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getWaveStyle = (index: number) => {
  if (!dataArray) return { height: '20%' }
  
  const value = dataArray[index * 10] || 0
  const height = Math.max(20, (value / 255) * 100)
  return { height: `${height}%` }
}

const requestPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    canRecord.value = true
    showPermissionTip.value = false
    
    // 初始化音频上下文
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    // 停止流
    stream.getTracks().forEach(track => track.stop())
  } catch (error) {
    console.error('获取麦克风权限失败:', error)
    showPermissionTip.value = true
    canRecord.value = false
  }
}

const startRecording = async () => {
  if (!canRecord.value) {
    await requestPermission()
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // 创建MediaRecorder
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      recordedAudio.value = audioBlob
      recordingDuration.value = recordingTime.value
      
      // 停止所有音轨
      stream.getTracks().forEach(track => track.stop())
      
      emit('recording-stop', audioBlob, recordingTime.value)
    }
    
    // 设置音频分析
    if (audioContext && analyser) {
      microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      startVisualization()
    }
    
    // 开始录音
    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    
    // 开始计时
    recordingTimer = setInterval(() => {
      recordingTime.value++
      
      // 检查最大时长
      if (recordingTime.value >= props.maxDuration) {
        stopRecording()
      }
    }, 1000)
    
    emit('recording-start')
    
  } catch (error) {
    console.error('开始录音失败:', error)
    showPermissionTip.value = true
  }
}

const stopRecording = () => {
  if (!isRecording.value || !mediaRecorder) return
  
  // 检查最小时长
  if (recordingTime.value < props.minDuration) {
    cancelRecording()
    return
  }
  
  mediaRecorder.stop()
  isRecording.value = false
  showCancelZone.value = false
  
  // 清理计时器
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
  
  // 停止可视化
  stopVisualization()
}

const cancelRecording = () => {
  if (!isRecording.value) return
  
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
  }
  
  isRecording.value = false
  showCancelZone.value = false
  recordingTime.value = 0
  recordedAudio.value = null
  
  // 清理计时器
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
  
  // 停止可视化
  stopVisualization()
  
  emit('recording-cancel')
}

const handleMouseLeave = () => {
  if (isRecording.value) {
    showCancelZone.value = true
  }
}

const playRecording = () => {
  if (!recordedAudio.value || isPlaying.value) return
  
  const audio = new Audio(URL.createObjectURL(recordedAudio.value))
  isPlaying.value = true
  
  audio.onended = () => {
    isPlaying.value = false
  }
  
  audio.play()
}

const deleteRecording = () => {
  recordedAudio.value = null
  recordingDuration.value = 0
  isPlaying.value = false
}

const sendRecording = () => {
  if (!recordedAudio.value) return
  
  emit('send', recordedAudio.value, recordingDuration.value)
  deleteRecording()
}

const startVisualization = () => {
  if (!analyser || !dataArray) return
  
  const updateVisualization = () => {
    analyser!.getByteFrequencyData(dataArray!)
    animationFrame = requestAnimationFrame(updateVisualization)
  }
  
  updateVisualization()
}

const stopVisualization = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

// 生命周期
onMounted(() => {
  // 检查浏览器支持
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('浏览器不支持录音功能')
    return
  }
  
  // 检查权限
  requestPermission()
})

onUnmounted(() => {
  // 清理资源
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
  
  stopVisualization()
  
  if (audioContext) {
    audioContext.close()
  }
})
</script>

<style scoped>
.voice-recorder {
  width: 100%;
}

.record-button-container {
  width: 100%;
}

.record-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.record-btn:hover:not(.disabled) {
  border-color: #07C160;
}

.record-btn.recording {
  background: #ff4757;
  color: white;
  border-color: #ff4757;
  animation: pulse 1s infinite;
}

.record-btn.disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.record-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-text {
  font-size: 14px;
  font-weight: 500;
}

.recording-status {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  z-index: 1000;
  min-width: 200px;
}

.recording-info {
  margin-bottom: 16px;
}

.recording-time {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.recording-waves {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-bottom: 12px;
  height: 30px;
  align-items: end;
}

.wave-bar {
  width: 3px;
  background: #07C160;
  border-radius: 2px;
  transition: height 0.1s;
  min-height: 4px;
}

.recording-hint {
  font-size: 12px;
  opacity: 0.8;
}

.cancel-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.2);
  opacity: 0.6;
  transition: opacity 0.2s;
}

.cancel-zone.active {
  opacity: 1;
  background: rgba(255,71,87,0.2);
}

.audio-preview {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.play-btn,
.delete-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:hover {
  border-color: #07C160;
  background: #f0f8f0;
}

.delete-btn:hover {
  border-color: #ff4757;
  background: #fff0f0;
}

.audio-info {
  flex: 1;
}

.audio-duration {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.audio-waveform {
  display: flex;
  gap: 1px;
  height: 20px;
  align-items: end;
}

.waveform-bar {
  width: 2px;
  background: #07C160;
  border-radius: 1px;
  min-height: 2px;
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.send-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.cancel-btn {
  background: white;
  color: #666;
}

.cancel-btn:hover {
  border-color: #999;
  background: #f5f5f5;
}

.send-btn {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.send-btn:hover {
  background: #06a552;
}

.permission-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff9e6;
  border: 1px solid #ffd700;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
}

.permission-btn {
  background: #ff9500;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.permission-btn:hover {
  background: #e6850e;
}
</style>
