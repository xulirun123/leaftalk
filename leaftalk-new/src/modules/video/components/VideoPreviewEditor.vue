<template>
  <div class="video-preview-editor">
    <!-- 顶部控制栏 -->
    <div class="editor-header">
      <button class="back-btn" @click="$emit('cancel')">
        <iconify-icon icon="material-symbols:arrow-back-ios" width="20" style="color: white;" />
      </button>

      <!-- 音乐控制 - 顶部中央 -->
      <div class="music-control-center">
        <button
          class="music-btn"
          :class="{ active: selectedMusic }"
          @click="toggleMusicPanel"
        >
          <iconify-icon icon="material-symbols:music-note" width="20" />
          <span>{{ selectedMusic ? selectedMusic.name : '音乐' }}</span>
        </button>
      </div>

      <div class="header-spacer"></div>
    </div>

    <!-- 视频预览区域 -->
    <div class="video-preview-container" @click="addTextAtClick">
      <video
        ref="videoRef"
        :src="videoUrl"
        class="preview-video"
        muted
        loop
        autoplay
        playsinline
        @loadedmetadata="handleVideoLoaded"
      ></video>

      <!-- 文字叠加层 -->
      <div class="text-overlay-container">
        <div
          v-for="textItem in textItems"
          :key="textItem.id"
          class="text-item"
          :style="textItem.style"
          @click.stop="selectTextItem(textItem)"
          @mousedown="startDragText($event, textItem)"
          @touchstart="startDragText($event, textItem)"
        >
          {{ textItem.content }}
        </div>
      </div>

      <!-- 默认提示文字 -->
      <div v-if="textItems.length === 0" class="text-hint">
        点击屏幕添加文字
      </div>
    </div>

    <!-- 编辑工具栏 - 只保留文字功能，靠左 -->
    <div class="editor-toolbar">
      <button
        class="tool-btn text-tool-btn"
        :class="{ active: currentTool === 'text' }"
        @click="currentTool = 'text'"
      >
        <iconify-icon icon="material-symbols:text-fields" width="20" />
        <span>文字</span>
      </button>
    </div>

    <!-- 音乐选择面板 -->
    <div v-if="currentTool === 'music'" class="music-panel">
      <div class="panel-header">
        <h4>选择背景音乐</h4>
      </div>
      <div class="music-list">
        <div
          v-for="music in musicList"
          :key="music.id"
          class="music-item"
          :class="{ active: selectedMusic?.id === music.id }"
          @click="selectMusic(music)"
        >
          <div class="music-info">
            <div class="music-name">{{ music.name }}</div>
            <div class="music-artist">{{ music.artist }}</div>
          </div>
          <button class="play-btn" @click.stop="playMusic(music)">
            <iconify-icon
              :icon="currentPlayingId === music.id && isPlaying ? 'material-symbols:pause' : 'material-symbols:play-arrow'"
              width="16"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- 文字编辑面板 -->
    <div v-if="currentTool === 'text'" class="text-panel">
      <div class="panel-header">
        <h4>添加文字</h4>
      </div>
      <div class="text-input-area">
        <input
          v-model="newTextContent"
          type="text"
          placeholder="输入文字..."
          class="text-input"
          @keyup.enter="() => addText()"
        />
        <button class="add-text-btn" @click="() => addText()">添加</button>
      </div>
      
      <!-- 文字样式控制 -->
      <div v-if="selectedTextItem" class="text-style-controls">
        <div class="style-group">
          <label>字体大小</label>
          <input
            v-model="selectedTextItem.fontSize"
            type="range"
            min="12"
            max="48"
            class="style-slider"
            @input="updateTextStyle"
          />
        </div>
        
        <div class="style-group">
          <label>字体颜色</label>
          <div class="color-picker">
            <div
              v-for="color in textColors"
              :key="color"
              class="color-option"
              :style="{ backgroundColor: color }"
              :class="{ active: selectedTextItem.color === color }"
              @click="changeTextColor(color)"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部发送按钮 -->
    <div class="bottom-send-area">
      <button class="send-btn-bottom" @click="handleSend" :disabled="!videoUrl">
        <span>发送</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Props & Emits
interface Props {
  videoUrl: string
  videoBlob: Blob
}

const props = defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  send: [data: { videoUrl: string, videoBlob: Blob, music?: any, textItems: any[] }]
}>()

// 响应式数据
const videoRef = ref<HTMLVideoElement>()
const currentTool = ref<'music' | 'text' | null>(null)
const selectedMusic = ref<any>(null)
const newTextContent = ref('')
const selectedTextItem = ref<any>(null)
const showMusicPanel = ref(false)

// 文字项目
const textItems = ref<any[]>([])

// 表情相关
const activeEmojiCategory = ref('faces')
const emojiItems = ref<any[]>([])
const selectedEmojiItem = ref<any>(null)

// 拖拽相关
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragItem = ref<any>(null)

// 文字颜色选项
const textColors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']

// 音乐列表
const musicList = ref([
  { id: 1, name: '轻快节拍', artist: '背景音乐', url: '/music/upbeat.mp3' },
  { id: 2, name: '温柔旋律', artist: '背景音乐', url: '/music/gentle.mp3' },
  { id: 3, name: '动感节奏', artist: '背景音乐', url: '/music/dynamic.mp3' },
  { id: 4, name: '清新自然', artist: '背景音乐', url: '/music/fresh.mp3' }
])

// 音乐控制方法
const toggleMusicPanel = () => {
  showMusicPanel.value = !showMusicPanel.value
  currentTool.value = showMusicPanel.value ? 'music' : null
}

// 表情数据 - 更丰富的表情库
const emojiData = {
  faces: [
    // 基础笑脸
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    // 更多表情
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    // 负面表情
    '😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
    // 特殊表情
    '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱'
  ],
  animals: [
    // 常见动物
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
    // 更多动物
    '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎',
    // 海洋动物
    '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦏', '🦛', '🐘', '🦒',
    // 更多可爱动物
    '🦘', '🐪', '🐫', '🦙', '🦥', '🦨', '🦡', '🐁', '🐀', '🦔'
  ],
  food: [
    // 水果
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑',
    // 蔬菜
    '🍆', '🥦', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀',
    // 主食和小食
    '🥞', '🧇', '🥓', '🍳', '🍔', '🍟', '🌭', '🍕', '🥪', '🌮', '🌯', '🥙', '🧆', '🥘', '🍝', '🍜',
    // 甜品和饮品
    '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '☕', '🍵',
    // 更多饮品
    '🧃', '🥤', '🧋', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃'
  ],
  activities: [
    // 运动
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
    // 更多运动
    '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '🤾', '🏌️', '🧘', '🏃',
    // 娱乐活动
    '🎮', '🕹️', '🎲', '🧩', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎹', '🪘'
  ],
  objects: [
    // 日常用品
    '💎', '🔔', '🎵', '🎶', '💰', '💳', '💸', '🔑', '🗝️', '🔨', '⚒️', '🛠️', '⚙️', '🔧', '🔩', '⚖️', '🦯', '🔗', '⛓️', '🪝',
    // 电子产品
    '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠',
    // 文具用品
    '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '📄', '📃', '📑', '📊', '📈', '📉', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐',
    // 更多物品
    '🎁', '🎀', '🎊', '🎉', '🎈', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🎨', '🎭', '🖼️', '🎯'
  ],
  symbols: [
    // 爱心系列
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    // 星星和符号
    '⭐', '🌟', '💫', '⚡', '💥', '💢', '💨', '💦', '💤', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💯', '💢', '💥', '💫',
    // 手势符号
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
    // 更多符号
    '🔥', '⚡', '💯', '✨', '🌈', '☀️', '⭐', '🌙', '☁️', '⛅', '🌤️', '⛈️', '🌩️', '❄️', '☃️', '⛄', '🌊', '💧', '☔', '⚡'
  ]
}

// 计算属性
const currentEmojiList = computed(() => {
  return emojiData[activeEmojiCategory.value as keyof typeof emojiData] || []
})

// 方法
const handleVideoLoaded = () => {
  console.log('📹 视频加载完成')
  // 确保视频自动播放
  if (videoRef.value) {
    videoRef.value.play().catch(error => {
      console.warn('视频自动播放失败:', error)
    })
  }
}

const selectMusic = (music: any) => {
  selectedMusic.value = music
  console.log('🎵 选择音乐:', music.name)
}

// 音频播放器
let currentAudio: HTMLAudioElement | null = null
const isPlaying = ref(false)
const currentPlayingId = ref<number | null>(null)

const playMusic = (music: any) => {
  console.log('▶️ 播放音乐:', music.name)

  // 如果正在播放同一首音乐，则停止
  if (currentPlayingId.value === music.id && isPlaying.value) {
    stopMusic()
    return
  }

  // 停止当前播放的音乐
  stopMusic()

  // 创建新的音频对象
  currentAudio = new Audio(music.url)
  currentAudio.volume = 0.5 // 设置音量为50%

  currentAudio.onplay = () => {
    isPlaying.value = true
    currentPlayingId.value = music.id
  }

  currentAudio.onpause = () => {
    isPlaying.value = false
    currentPlayingId.value = null
  }

  currentAudio.onended = () => {
    isPlaying.value = false
    currentPlayingId.value = null
  }

  currentAudio.onerror = () => {
    console.error('音乐播放失败:', music.name)
    isPlaying.value = false
    currentPlayingId.value = null
  }

  // 播放音乐
  currentAudio.play().catch(error => {
    console.error('音乐播放失败:', error)
  })
}

const stopMusic = () => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  isPlaying.value = false
  currentPlayingId.value = null
}

const addText = (clickX?: number, clickY?: number) => {
  if (!newTextContent.value.trim()) return

  // 如果有点击位置，使用点击位置；否则默认居中
  const left = clickX ? `${clickX}px` : '50%'
  const top = clickY ? `${clickY}px` : '50%'
  const transform = clickX ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)'

  const textItem = {
    id: Date.now(),
    content: newTextContent.value,
    fontSize: 24,
    color: '#ffffff',
    x: clickX || 0,
    y: clickY || 0,
    style: {
      position: 'absolute',
      left: left,
      top: top,
      transform: transform,
      fontSize: '24px',
      color: '#ffffff',
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      cursor: 'move',
      userSelect: 'none',
      zIndex: 10,
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: 'rgba(0,0,0,0.2)',
      minWidth: '20px',
      textAlign: 'center'
    }
  }

  textItems.value.push(textItem)
  newTextContent.value = ''
  selectedTextItem.value = textItem
  console.log('📝 添加文字:', textItem.content, '位置:', { left, top })
}

const selectTextItem = (item: any) => {
  selectedTextItem.value = item
}

const updateTextStyle = () => {
  if (!selectedTextItem.value) return
  
  selectedTextItem.value.style.fontSize = selectedTextItem.value.fontSize + 'px'
  selectedTextItem.value.style.color = selectedTextItem.value.color
}

const changeTextColor = (color: string) => {
  if (!selectedTextItem.value) return
  
  selectedTextItem.value.color = color
  selectedTextItem.value.style.color = color
}

const addEmoji = (emoji: string) => {
  const emojiItem = {
    id: Date.now(),
    content: emoji,
    x: Math.random() * 80 + 10, // 随机位置
    y: Math.random() * 80 + 10,
    style: {
      position: 'absolute',
      left: Math.random() * 80 + 10 + '%',
      top: Math.random() * 80 + 10 + '%',
      fontSize: '32px',
      cursor: 'pointer',
      userSelect: 'none'
    }
  }
  
  emojiItems.value.push(emojiItem)
  console.log('😀 添加表情:', emoji)
}

const selectEmojiItem = (item: any) => {
  selectedEmojiItem.value = item
}

// 点击视频区域添加文字
const addTextAtClick = (event: MouseEvent) => {
  if (isDragging.value || currentTool.value !== 'text') return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 设置默认文字内容并添加
  newTextContent.value = '双击编辑'
  addText(x, y)
}

// 开始拖拽文字
const startDragText = (event: MouseEvent | TouchEvent, textItem: any) => {
  event.preventDefault()
  event.stopPropagation()

  isDragging.value = true
  dragItem.value = textItem

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragStartX.value = clientX
  dragStartY.value = clientY

  // 添加全局事件监听
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  document.addEventListener('touchmove', handleDragMove, { passive: true })
  document.addEventListener('touchend', handleDragEnd, { passive: true })
}

// 处理拖拽移动
const handleDragMove = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !dragItem.value) return

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const deltaX = clientX - dragStartX.value
  const deltaY = clientY - dragStartY.value

  // 更新文字位置
  const currentLeft = parseInt(dragItem.value.style.left) || 0
  const currentTop = parseInt(dragItem.value.style.top) || 0

  dragItem.value.style.left = `${currentLeft + deltaX}px`
  dragItem.value.style.top = `${currentTop + deltaY}px`

  dragStartX.value = clientX
  dragStartY.value = clientY
}

// 结束拖拽
const handleDragEnd = () => {
  isDragging.value = false
  dragItem.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('touchmove', handleDragMove)
  document.removeEventListener('touchend', handleDragEnd)
}

const handleSend = () => {
  const data = {
    videoUrl: props.videoUrl,
    videoBlob: props.videoBlob,
    music: selectedMusic.value,
    textItems: textItems.value
  }

  console.log('📤 发送编辑后的视频:', data)
  emit('send', data)
}

// 生命周期
onMounted(() => {
  console.log('🎬 视频预览编辑器已加载')
})
</script>

<style scoped>
.video-preview-editor {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.editor-header {
  background: rgba(0, 0, 0, 0.8);
  padding: 20px 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
}

.editor-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.send-btn {
  background: #07C160;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.send-btn:disabled {
  background: #666;
  cursor: not-allowed;
}

.video-preview-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

.video-preview-container[data-tool="text"] {
  cursor: crosshair;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.text-overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.text-item {
  pointer-events: all;
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
}

.text-item:hover {
  transform: scale(1.05);
  background-color: rgba(0,0,0,0.4) !important;
}

.text-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  pointer-events: none;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.editor-toolbar {
  background: rgba(0, 0, 0, 0.8);
  padding: 16px;
  display: flex;
  justify-content: center;
  gap: 32px;
}

.tool-btn {
  background: none;
  border: none;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.tool-btn.active {
  background: rgba(7, 193, 96, 0.2);
  color: #07C160;
}

.tool-btn span {
  font-size: 12px;
}

.music-panel, .text-panel, .emoji-panel {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  max-height: 300px;
  overflow-y: auto;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
}

.music-list {
  padding: 16px;
}

.music-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.music-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.music-item.active {
  background: rgba(7, 193, 96, 0.2);
}

.music-info {
  flex: 1;
}

.music-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.music-artist {
  font-size: 12px;
  opacity: 0.7;
}

.play-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.text-input-area {
  padding: 16px;
  display: flex;
  gap: 12px;
}

.text-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  outline: none;
}

.add-text-btn {
  background: #07C160;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.text-style-controls {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.style-group {
  margin-bottom: 16px;
}

.style-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}

.style-slider {
  width: 100%;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option.active {
  border-color: white;
  transform: scale(1.1);
}

.emoji-categories {
  padding: 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.category-btn {
  background: none;
  border: none;
  font-size: 24px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.category-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.category-btn.active {
  background: rgba(7, 193, 96, 0.2);
}

.emoji-grid {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
}

.emoji-option {
  font-size: 24px;
  padding: 8px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.emoji-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 底部发送按钮样式 */
.bottom-send-area {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
}

.send-btn-bottom {
  background: #07C160;
  border: none;
  color: white;
  padding: 12px 32px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
  transition: all 0.2s;
}

.send-btn-bottom:hover {
  background: #06a84f;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(7, 193, 96, 0.4);
}

.send-btn-bottom:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 音乐控制中央样式 */
.music-control-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.music-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.music-btn.active {
  background: rgba(7, 193, 96, 0.8);
}

.music-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-spacer {
  width: 40px; /* 与返回按钮宽度相同，保持平衡 */
}

/* 文字工具按钮靠左 */
.editor-toolbar {
  background: rgba(0, 0, 0, 0.8);
  padding: 16px;
  display: flex;
  justify-content: flex-start; /* 改为靠左 */
  gap: 32px;
}

.text-tool-btn {
  background: none;
  border: none;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.text-tool-btn.active {
  background: rgba(7, 193, 96, 0.2);
  color: #07C160;
}
</style>
