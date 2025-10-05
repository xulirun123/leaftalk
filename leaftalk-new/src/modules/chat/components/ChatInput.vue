<template>
  <div class="wechat-input" :class="{
    'emoji-panel-open': showEmojiPanel,
    'more-panel-open': showMorePanel,
    'input-method-panel-open': showInputMethodPanel,
    'voice-mode': currentInputMode === 'voice'
  }">
    <!-- 主输入区域 -->
    <div class="input-main">
      <!-- 语音/文本切换按钮 -->
      <button
        class="voice-toggle-btn"
        @click="toggleVoiceText"
        :disabled="disabled"
      >
        <iconify-icon
          :icon="currentInputMode === 'voice' ? 'heroicons:pencil-square' : 'heroicons:microphone'"
          width="22"
        />
      </button>

      <!-- 文字输入框 -->
      <div v-if="currentInputMode === 'text' || currentInputMode === 'emoji'"
           class="text-input-container"
           :class="{ 'input-with-panel': currentInputMode === 'text' }">
        <textarea
          v-model="inputText"
          :placeholder="placeholder"
          class="text-input"
          rows="1"
          :disabled="disabled"
          @keydown.enter.prevent="handleEnter"
          @input="adjustTextareaHeight"
          @focus="handleFocus"
          @blur="handleBlur"
          ref="textInput"
          :style="{ imeMode: 'active' }"
          lang="zh-CN"
        ></textarea>


      </div>

      <!-- 语音输入按钮 -->
      <div v-else-if="currentInputMode === 'voice'" class="voice-input-container">
        <button
          class="voice-input-btn"
          :class="{ recording: isRecording }"
          @touchstart="startRecording"
          @touchend="stopRecording"
          @mousedown="startRecording"
          @mouseup="stopRecording"
          :disabled="disabled"
        >
          {{ isRecording ? '松开 结束' : '按住 说话' }}
        </button>
      </div>

      <!-- 表情/文本切换按钮 -->
      <button
        class="emoji-btn"
        @click="toggleEmojiText"
        :disabled="disabled"
        :class="{ active: currentInputMode === 'emoji' }"
      >
        <iconify-icon
          :icon="currentInputMode === 'emoji' ? 'heroicons:chat-bubble-left-right' : 'heroicons:face-smile'"
          width="22"
        />
      </button>

      <!-- 发送按钮或更多功能按钮 -->
      <button
        v-if="canSend"
        class="send-btn"
        @click.stop="handleSend"
        :disabled="disabled"
      >
        发送
      </button>
      <button
        v-else
        class="more-btn"
        @click.stop="toggleMore"
        :disabled="disabled"
        :class="{ active: showMorePanel }"
      >
        <iconify-icon icon="heroicons:plus" width="22" />
      </button>
    </div>

    <!-- 临时输入框 - 显示在主输入区域外面 -->
    <div v-if="tempInput && tempInput.length > 0" class="temp-input-external">
      {{ tempInput }}
    </div>

    <!-- 表情面板 -->
    <div v-if="showEmojiPanel" class="emoji-panel" @click.stop>
      <EmojiPicker
        @select="insertEmoji"
        @upload="handleEmojiUpload"
      />
    </div>

    <!-- 输入法面板 -->
    <InputMethodPanel
      v-if="showInputMethodPanel"
      :visible="showInputMethodPanel"
      @input="handleInputMethodInput"
      @temp-input="handleTempInput"
      @close="handleInputMethodClose"
    />

    <!-- 更多功能面板 -->
    <div v-if="showMorePanel" class="more-panel" @click.stop>
      <div class="more-content">
        <div class="more-grid">
          <button class="more-item" @click="selectPhoto">
            <div class="more-icon photo">
              <iconify-icon icon="heroicons:photo" width="28" />
            </div>
            <span>照片</span>
          </button>
          <button class="more-item" @click="takePhoto">
            <div class="more-icon camera">
              <iconify-icon icon="heroicons:camera" width="28" />
            </div>
            <span>拍摄</span>
          </button>
          <button class="more-item" @click="videoCall">
            <div class="more-icon video-call">
              <iconify-icon icon="heroicons:video-camera" width="28" />
            </div>
            <span>视频通话</span>
          </button>
          <button class="more-item" @click="shareLocation">
            <div class="more-icon location">
              <iconify-icon icon="heroicons:map-pin" width="28" />
            </div>
            <span>位置</span>
          </button>
          <button class="more-item" @click="sendRedPacket">
            <div class="more-icon red-packet">
              <iconify-icon icon="heroicons:gift" width="28" />
            </div>
            <span>红包</span>
          </button>
          <button class="more-item" @click="transfer">
            <div class="more-icon transfer">
              <iconify-icon icon="heroicons:banknotes" width="28" />
            </div>
            <span>转账</span>
          </button>
          <button class="more-item" @click="shareContact">
            <div class="more-icon contact">
              <iconify-icon icon="heroicons:user" width="28" />
            </div>
            <span>名片</span>
          </button>
          <button class="more-item" @click="selectFile">
            <div class="more-icon file">
              <iconify-icon icon="heroicons:document" width="28" />
            </div>
            <span>文件</span>
          </button>
        </div>
      </div>
    </div>




    <!-- 隐藏的文件输入 -->
    <input
      type="file"
      ref="photoInput"
      accept="image/*,video/*"
      style="display: none"
      @change="handlePhotoSelect"
      multiple
    />
    <input
      type="file"
      ref="videoInput"
      accept="video/*"
      style="display: none"
      @change="handleVideoSelect"
    />
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      @change="handleFileSelect"
    />




  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import InputMethodPanel from './InputMethodPanel.vue'
import EmojiPicker from './EmojiPicker.vue'

// Props
interface Props {
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  autoFocus?: boolean
  chatId?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入消息...',
  disabled: false,
  maxLength: 1000,
  autoFocus: false,
  chatId: ''
})

const router = useRouter()

// Emits
interface Emits {
  (e: 'send', message: { type: 'text' | 'image' | 'voice' | 'video' | 'file', content: string | File }): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'typing', isTyping: boolean): void
  (e: 'contact'): void
  (e: 'video-call'): void
  (e: 'red-packet'): void
  (e: 'transfer'): void
  (e: 'keyboard-height-change', height: number): void
  (e: 'panel-change', data: { type: 'emoji' | 'more' | 'input-method' | 'none', height: number }): void
}

const emit = defineEmits<Emits>()

// 响应式数据



const inputText = ref('')
const textInput = ref<HTMLTextAreaElement>()
const photoInput = ref<HTMLInputElement>()
const videoInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()

// 面板状态
const showEmojiPanel = ref(false)
const showMorePanel = ref(false)
const showInputMethodPanel = ref(false)

// 输入模式枚举
type InputMode = 'voice' | 'text' | 'emoji'

// 输入模式
const currentInputMode = ref<InputMode>('voice') // 默认语音模式
const isRecording = ref(false)

// 临时输入（拼音、笔画、五笔字根等）
const tempInput = ref('')

// 表情相关
const currentEmojiTab = ref('smile')
const emojiTabs = [
  { name: 'smile', icon: '😊' },
  { name: 'people', icon: '👨' },
  { name: 'nature', icon: '🌿' },
  { name: 'food', icon: '🍎' },
  { name: 'activity', icon: '⚽' },
  { name: 'travel', icon: '🚗' },
  { name: 'objects', icon: '💡' },
  { name: 'symbols', icon: '❤️' }
]

// 表情数据
const emojiData: Record<string, string[]> = {
  smile: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
  people: ['👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴', '👵', '👱', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦲', '👩‍🦲', '👨‍🦳', '👩‍🦳', '🧔', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦'],
  nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞'],
  activity: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞'],
  objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐']
}

// 计算属性
const canSend = computed(() => {
  return !props.disabled && inputText.value.trim().length > 0
})

const currentEmojis = computed(() => {
  return emojiData[currentEmojiTab.value] || []
})

// 方法
const toggleVoiceText = () => {
  if (currentInputMode.value === 'voice') {
    // 从语音模式切换到文本模式
    currentInputMode.value = 'text'
    showEmojiPanel.value = false
    showMorePanel.value = false
    showInputMethodPanel.value = true  // 显示输入法面板
    // 聚焦到输入框
    nextTick(() => {
      textInput.value?.focus()
    })
  } else {
    // 从文本/表情模式切换到语音模式
    currentInputMode.value = 'voice'
    showEmojiPanel.value = false
    showMorePanel.value = false
    showInputMethodPanel.value = false
  }
}

const toggleEmojiText = () => {
  console.log('🎭 表情按钮点击，当前模式:', currentInputMode.value)

  if (currentInputMode.value === 'emoji') {
    // 从表情模式切换到文本模式
    currentInputMode.value = 'text'
    showEmojiPanel.value = false
    showMorePanel.value = false
    showInputMethodPanel.value = true  // 显示输入法面板
    console.log('🎭 切换到文本模式，显示输入法面板')
    emit('panel-change', { type: 'input-method', height: 250 })
  } else {
    // 从语音/文本模式切换到表情模式
    currentInputMode.value = 'emoji'
    showEmojiPanel.value = true
    showMorePanel.value = false
    showInputMethodPanel.value = false  // 关闭输入法面板
    console.log('🎭 切换到表情模式，显示表情面板')
    emit('panel-change', { type: 'emoji', height: 250 })
  }
}

const closePanels = () => {
  isClosingPanels = true

  showEmojiPanel.value = false
  showMorePanel.value = false
  showInputMethodPanel.value = false

  // 通知面板关闭
  emit('panel-change', { type: 'none', height: 0 })

  // 确保输入框回到底部
  const inputElement = document.querySelector('.wechat-input') as HTMLElement
  if (inputElement) {
    inputElement.style.bottom = '0px'
    inputElement.style.transition = 'bottom 0.2s ease'
  }
  console.log('🔒 所有面板已关闭，输入框回到底部')

  // 延迟重置标志，避免立即重新打开
  setTimeout(() => {
    isClosingPanels = false
    console.log('🔒 关闭面板标志已重置')
  }, 200)
}

// 点击外部关闭面板
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  const chatInput = document.querySelector('.wechat-input')
  const emojiPanel = document.querySelector('.emoji-panel')
  const morePanel = document.querySelector('.more-panel')

  // 如果点击的不是输入组件或面板内部，则关闭所有面板
  // 注意：输入法面板是虚拟键盘，没有DOM元素，不需要检查
  if (chatInput && !chatInput.contains(target) &&
      (!emojiPanel || !emojiPanel.contains(target)) &&
      (!morePanel || !morePanel.contains(target))) {

    console.log('🖱️ 点击外部，关闭所有面板')
    closePanels()

    // 如果当前是表情模式，切换回文本模式
    if (currentInputMode.value === 'emoji') {
      currentInputMode.value = 'text'
    }
  }
}

const adjustTextareaHeight = () => {
  if (!textInput.value) return

  textInput.value.style.height = 'auto'
  const scrollHeight = textInput.value.scrollHeight
  const maxHeight = 100
  textInput.value.style.height = Math.min(scrollHeight, maxHeight) + 'px'
}

const handleEnter = (event: KeyboardEvent) => {
  if (event.shiftKey) return
  event.preventDefault()
  handleSend()
}

// 防止重复发送的标志
let isSending = false

const handleSend = () => {
  if (!canSend.value || isSending) return

  const message = inputText.value.trim()
  if (message) {
    isSending = true
    emit('send', { type: 'text', content: message })
    inputText.value = ''
    nextTick(() => {
      adjustTextareaHeight()
      // 短暂延迟后重置发送标志
      setTimeout(() => {
        isSending = false
      }, 100)
    })
  }
}

// 处理表情面板上传
const handleEmojiUpload = (file: File) => {
  console.log('📷 表情面板上传图片:', file.name)
  emit('send', { type: 'image', content: file })
}

// 防止重复触发的标志
let isClosingPanels = false

// 输入法面板处理函数
const handleInputMethodInput = (text: string) => {
  if (text === 'BACKSPACE') {
    // 处理退格键
    if (inputText.value.length > 0) {
      inputText.value = inputText.value.slice(0, -1)
    }
  } else if (text === '\n') {
    // 处理换行
    handleSend()
  } else {
    // 普通文本输入
    inputText.value += text
  }
  adjustTextareaHeight()
}

const handleTempInput = (tempText: string) => {
  // 处理临时输入（如拼音输入过程中的显示）
  console.log('临时输入:', tempText)
  // 可以在这里显示拼音输入状态
}

const handleInputMethodClose = () => {
  showInputMethodPanel.value = false
}

const handleFocus = () => {
  emit('focus')
  console.log('📝 输入框获得焦点，当前模式:', currentInputMode.value, '关闭面板中:', isClosingPanels)

  // 如果正在关闭面板，不要立即显示输入法面板
  if (isClosingPanels) {
    console.log('📝 正在关闭面板，跳过焦点处理')
    return
  }

  // 点击输入框时，切换到输入法面板
  setTimeout(() => {
    if (!isClosingPanels) {
      currentInputMode.value = 'text'
      showInputMethodPanel.value = true
      showEmojiPanel.value = false
      showMorePanel.value = false
      console.log('📝 切换到输入法面板')
    }
  }, 100)
}

const handleBlur = () => {
  emit('blur')
  // 输入框失去焦点时不自动关闭面板，由点击外部区域控制
}

const toggleMore = () => {
  console.log('➕ 点击+号按钮，当前状态:', showMorePanel.value)
  showMorePanel.value = !showMorePanel.value
  console.log('➕ 切换后状态:', showMorePanel.value)

  if (showMorePanel.value) {
    // 打开更多面板时，关闭其他面板
    showEmojiPanel.value = false
    showInputMethodPanel.value = false
    currentInputMode.value = 'text'
    console.log('➕ 打开更多面板，关闭其他面板')
    emit('panel-change', { type: 'more', height: 250 })
  } else {
    console.log('➕ 关闭更多面板')
    emit('panel-change', { type: 'none', height: 0 })
  }
}

const insertEmoji = (emoji: string) => {
  console.log('😀 插入表情:', emoji)
  // 直接插入表情，不改变面板状态
  insertEmojiToText(emoji)
}

const insertEmojiToText = (emoji: string) => {
  const cursorPosition = textInput.value?.selectionStart || inputText.value.length
  const textBefore = inputText.value.substring(0, cursorPosition)
  const textAfter = inputText.value.substring(cursorPosition)

  inputText.value = textBefore + emoji + textAfter

  nextTick(() => {
    if (textInput.value) {
      const newPosition = cursorPosition + emoji.length
      textInput.value.setSelectionRange(newPosition, newPosition)
    }
    adjustTextareaHeight()
  })
}

// 语音录制
const startRecording = () => {
  if (props.disabled) return
  isRecording.value = true
}

const stopRecording = () => {
  if (!isRecording.value) return
  isRecording.value = false
}

// 文件选择
const selectPhoto = () => {
  photoInput.value?.click()
  // 不关闭面板，让用户可以连续选择功能
}

const takePhoto = () => {
  closePanels()
  // 明确传递空的 query 对象，确保不会携带之前的参数
  router.push({
    path: '/chat-camera',
    query: {} // 空的 query，不传递 mode 参数，允许拍照和录像
  })
}

const selectVideo = () => {
  videoInput.value?.click()
  // 不关闭面板，让用户可以连续选择功能
}

const selectFile = () => {
  fileInput.value?.click()
  // 不关闭面板，让用户可以连续选择功能
}

const shareLocation = () => {
  // 直接跳转到位置页面，传递chatId参数
  closePanels()
  const query = props.chatId ? { chatId: props.chatId } : {}
  router.push({ path: '/location-picker', query })
}

const shareContact = () => {
  emit('contact')
  // 不关闭面板，让用户可以连续选择功能
}

const videoCall = () => {
  emit('video-call')
  // 不关闭更多功能面板，保持面板开启
}

const sendRedPacket = () => {
  emit('red-packet')
  closePanels()
}

const transfer = () => {
  emit('transfer')
  closePanels()
}

const handlePhotoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i]

      // 检查文件大小限制（100MB）
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (f.size > maxSize) {
        alert(`文件 "${f.name}" 太大了！\n文件大小: ${(f.size / 1024 / 1024).toFixed(1)}MB\n最大支持: 100MB`)
        continue
      }

      if (f.type && f.type.startsWith('video/')) {
        emit('send', { type: 'video', content: f })
      } else {
        emit('send', { type: 'image', content: f })
      }
    }
  }
  target.value = ''
}

const handleVideoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    emit('send', { type: 'video', content: file })
  }
  target.value = ''
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    emit('send', { type: 'file', content: file })
  }
  target.value = ''
}



const handleCandidateSelect = (text: string) => {
  // 候选字选择后的处理
  console.log('选择候选字:', text)
}

// 监听输入变化
let typingTimer: any = null
watch(inputText, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    emit('typing', true)

    if (typingTimer) {
      clearTimeout(typingTimer)
    }

    typingTimer = setTimeout(() => {
      emit('typing', false)
    }, 1000)
  }
})

// 自动聚焦
if (props.autoFocus) {
  nextTick(() => {
    textInput.value?.focus()
  })
}

// 暴露方法
defineExpose({
  focus: () => textInput.value?.focus(),
  blur: () => textInput.value?.blur(),
  clear: () => {
    inputText.value = ''
    adjustTextareaHeight()
  },
  insertText: (text: string) => {
    inputText.value += text
    adjustTextareaHeight()
  }
})

// 更新输入框位置
const updateInputPosition = () => {
  const inputElement = document.querySelector('.wechat-input') as HTMLElement
  if (!inputElement) return

  console.log('📍 更新输入框位置 - 面板状态:', {
    emoji: showEmojiPanel.value,
    more: showMorePanel.value,
    input: showInputMethodPanel.value
  })

  if (showInputMethodPanel.value) {
    // 输入法面板显示时，获取真实面板高度
    const inputMethodPanel = document.querySelector('.input-method-panel') as HTMLElement
    if (inputMethodPanel) {
      const panelHeight = inputMethodPanel.offsetHeight
      inputElement.style.bottom = `${panelHeight}px`
      console.log('📍 输入法面板：输入框在面板上方，面板高度:', panelHeight)
    } else {
      // 面板还没渲染，使用默认高度
      inputElement.style.bottom = '280px'
      console.log('📍 输入法面板：使用默认高度280px')
    }
  } else if (showEmojiPanel.value) {
    // 表情面板显示
    inputElement.style.bottom = '250px'
    console.log('📍 表情面板：输入框在面板上方')
  } else if (showMorePanel.value) {
    // 更多面板显示
    inputElement.style.bottom = '180px'
    console.log('📍 更多面板：输入框在面板上方')
  } else {
    // 所有面板关闭
    inputElement.style.bottom = '0px'
    console.log('📍 无面板：输入框在底部')
  }
  inputElement.style.transition = 'bottom 0.2s ease'
}

// 监听面板状态变化
watch([showEmojiPanel, showMorePanel, showInputMethodPanel], () => {
  nextTick(() => {
    updateInputPosition()
  })
})

// 生命周期钩子
onMounted(() => {
  // 添加全局点击监听器
  document.addEventListener('click', handleClickOutside)

  // 监听视口变化（用于检测虚拟键盘）
  if ('visualViewport' in window) {
    window.visualViewport?.addEventListener('resize', handleVisualViewportResize)
  }
})

// 处理视口变化（虚拟键盘检测）
const handleVisualViewportResize = () => {
  if (!window.visualViewport) return

  const viewport = window.visualViewport
  const windowHeight = window.innerHeight
  const viewportHeight = viewport.height

  // 计算键盘高度
  const keyboardHeight = windowHeight - viewportHeight

  console.log('🎹 视口变化:', {
    windowHeight,
    viewportHeight,
    keyboardHeight,
    showEmojiPanel: showEmojiPanel.value,
    showMorePanel: showMorePanel.value,
    showInputMethodPanel: showInputMethodPanel.value
  })

  // 发送键盘高度变化事件
  emit('keyboard-height-change', keyboardHeight)
}

onUnmounted(() => {
  // 移除全局点击监听器
  document.removeEventListener('click', handleClickOutside)
})

// 移除重复的代码块
</script>

<style scoped>
/* 微信风格聊天输入组件 */
.wechat-input {
  background: #f7f7f7;
  border-top: 1px solid #d9d9d9;
  position: fixed;
  left: 0;
  right: 0;
  min-height: 42px;
  z-index: 1000; /* 确保输入框在消息容器上面，但在头部下面 */
  bottom: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}



/* 当表情面板显示时，输入框在面板上方 */
.wechat-input.emoji-panel-open {
  bottom: 250px !important;
}

/* 当更多功能面板显示时，输入框在面板上方 */
.wechat-input.more-panel-open {
  bottom: 180px !important;
}

/* 当输入法面板显示时，由JavaScript动态调整位置 */
.wechat-input.input-method-panel-open {
  /* 位置由JavaScript动态设置，不使用固定值 */
}

/* 主输入区域 */
.input-main {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 8px;
  background: #f7f7f7;
  min-height: 52px;           /* 增加最小高度以适应新的输入框 */
  box-sizing: border-box;
  position: relative;
  z-index: 100;
}

/* 语音/键盘切换按钮 */
.voice-toggle-btn {
  width: 30px;
  height: 30px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  flex-shrink: 0;
}

.voice-toggle-btn:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #07C160;
  color: #07C160;
}

.voice-toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 文字输入容器 */
.text-input-container {
  flex: 1;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 4px 12px;          /* 减少padding确保30px最小高度 */
  height: 30px;               /* 固定高度30px */
  min-height: 30px;           /* 最小高度30px */
  max-height: 70px;           /* 最大3行高度 */
  overflow: hidden;
  display: flex;
  align-items: center;        /* 单行时居中对齐 */
  position: relative;
  box-sizing: border-box;
}

/* 当显示输入法面板时，输入框与面板重合 */
.text-input-container.input-with-panel {
  border-bottom: 1px solid #d9d9d9;  /* 保留底部边框作为分割线 */
  border-bottom-left-radius: 0;      /* 移除底部左圆角 */
  border-bottom-right-radius: 0;     /* 移除底部右圆角 */
}

/* 临时输入框 - 显示在主输入框容器下方左侧 */
.temp-input-external {
  background: rgba(0, 0, 0, 0.8);  /* 深色背景 */
  color: white;                    /* 白色文字 */
  padding: 2px 8px;                /* 小padding */
  border-radius: 3px;
  font-size: 12px;                 /* 小字体 */
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: -16px;               /* 向上移动16px，紧贴麦克风按钮底部 */
  margin-left: 12px;               /* 左边距12px */
  height: 20px;                    /* 固定高度20px */
  display: inline-block;           /* 行内块元素 */
  width: auto;                     /* 宽度自动 */
  max-width: calc(100% - 24px);    /* 最大宽度 */
}

.text-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;           /* 字体大小改为14px */
  line-height: 22px;
  height: 22px;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  overflow: hidden;
  max-height: 58.8px;        /* 最大3行高度: 14px * 1.4 * 3 = 58.8px */
  overflow-y: auto;          /* 超过3行时显示滚动条 */
  caret-color: #333;         /* 光标颜色 */
  flex: 1;                   /* 占据剩余空间 */
}

.text-input::placeholder {
  color: #999;
}

/* 光标样式 */
.text-input:focus {
  caret-color: #333;
}

/* 通过伪元素控制光标高度 */
.text-input {
  /* 使用CSS变量控制光标高度 */
  --caret-height: 16px;
}

/* 针对WebKit浏览器的光标高度控制 */
@supports (-webkit-appearance: none) {
  .text-input {
    line-height: 12px;        /* 光标高度改为12px */
    padding-top: 2px;         /* 微调垂直对齐 */
    padding-bottom: 2px;
  }
}

/* 语音输入容器 */
.voice-input-container {
  flex: 1;
}

.voice-input-btn {
  width: 100%;
  height: 36px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.voice-input-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.voice-input-btn.recording {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.voice-input-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 表情按钮 */
.emoji-btn {
  width: 30px;
  height: 30px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  flex-shrink: 0;
}

.emoji-btn:hover:not(:disabled),
.emoji-btn.active {
  background: #f0f0f0;
  border-color: #07C160;
  color: #07C160;
}

.emoji-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 发送按钮 */
.send-btn {
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0 16px;
  height: 30px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #06AD56;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 更多功能按钮 */
.more-btn {
  width: 30px;
  height: 30px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  flex-shrink: 0;
}

.more-btn:hover:not(:disabled),
.more-btn.active {
  background: #f0f0f0;
  border-color: #07C160;
  color: #07C160;
}

.more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 表情面板 */
.emoji-panel {
  background: white;
  border-top: 1px solid #e5e5e5;
  height: 250px;
  overflow: hidden;
  position: fixed;
  bottom: 0 !important;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.emoji-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.emoji-tabs {
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  background: #f7f7f7;
  padding: 0 12px;
}

.emoji-tab {
  padding: 8px 12px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
}

.emoji-tab:hover {
  background: #f0f0f0;
}

.emoji-tab.active {
  background: white;
  border-bottom: 2px solid #07C160;
}

.emoji-grid {
  flex: 1;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.emoji-grid::-webkit-scrollbar {
  display: none;
}

.emoji-item {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

/* 更多功能面板 */
.more-panel {
  background: white;
  border-top: 1px solid #e5e5e5;
  height: 180px;
  overflow: visible;
  position: fixed;
  bottom: 0 !important;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.more-content {
  height: 100%;
  padding: 5px 15px;
  box-sizing: border-box;
  overflow: visible;
}

.more-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, minmax(70px, 1fr));
  gap: 8px;
  height: 100%;
  width: 100%;
  max-width: 100%;
  align-items: stretch;
}

.more-item {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  padding: 8px 4px 4px 4px;
  transition: all 0.2s ease;
  color: #000;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  min-height: 70px;
  overflow: visible;
  /* 优化渲染性能和清晰度 */
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}

.more-item:hover {
  transform: scale(0.95);
}

.more-item:hover .more-icon {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.more-item:active {
  transform: scale(0.9);
}

.more-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 4px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  /* 优化图标渲染 */
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 图标背景样式 - 更鲜明的颜色对比 */
.more-icon.photo {
  background: linear-gradient(135deg, #5b73e8 0%, #6c5ce7 100%);
  box-shadow: 0 2px 8px rgba(91, 115, 232, 0.3);
}

.more-icon.camera {
  background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
  box-shadow: 0 2px 8px rgba(253, 121, 168, 0.3);
}

.more-icon.video-call {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  box-shadow: 0 2px 8px rgba(0, 184, 148, 0.3);
}

.more-icon.location {
  background: linear-gradient(135deg, #00b894 0%, #55efc4 100%);
  box-shadow: 0 2px 8px rgba(0, 184, 148, 0.3);
}

.more-icon.red-packet {
  background: linear-gradient(135deg, #e17055 0%, #d63031 100%);
  box-shadow: 0 2px 8px rgba(225, 112, 85, 0.3);
}

.more-icon.transfer {
  background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
  box-shadow: 0 2px 8px rgba(253, 203, 110, 0.3);
}

.more-icon.contact {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  box-shadow: 0 2px 8px rgba(116, 185, 255, 0.3);
}

.more-icon.file {
  background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
  box-shadow: 0 2px 8px rgba(162, 155, 254, 0.3);
}

.more-item span {
  font-size: 12px;
  color: #000;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  overflow: visible;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.4;
  display: block;
  width: 100%;
  flex-shrink: 0;
  /* 优化文字渲染清晰度 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga" 1;
  /* 确保像素对齐 */
  transform: translateZ(0);
  backface-visibility: hidden;
}



/* 响应式设计 */
@media (max-width: 480px) {
  .wechat-input {
    /* 在小屏幕设备上保持42px最小高度 */
    min-height: 42px;
  }

  .wechat-input.emoji-panel-open {
    bottom: 250px;
  }

  .wechat-input.more-panel-open {
    bottom: 180px;
  }

  .wechat-input.input-method-panel-open {
    bottom: 230px;  /* 与主样式保持一致 */
  }

  .input-main {
    padding: 6px 8px;
    gap: 6px;
  }

  .voice-toggle-btn,
  .emoji-btn,
  .more-btn {
    width: 30px;
    height: 30px;
  }

  .text-input-container {
    padding: 6px 10px;
    min-height: 32px;
  }

  .voice-input-btn {
    height: 32px;
    font-size: 14px;
  }

  .send-btn {
    height: 30px;
    padding: 0 12px;
    font-size: 14px;
  }

  .emoji-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }

  .emoji-item {
    width: 28px;
    height: 28px;
    font-size: 18px;
  }

  .more-content {
    padding: 4px 8px;
  }

  .more-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, minmax(65px, 1fr));
    gap: 6px;
  }

  .more-item {
    min-height: 65px;
    padding: 6px 2px 2px 2px;
    overflow: visible;
  }

  .more-icon {
    width: 40px;
    height: 40px;
  }

  .more-item span {
    font-size: 11px;
    color: #000;
    font-weight: 500;
    display: block;
    width: 100%;
    overflow: visible;
    flex-shrink: 0;
    /* 移动端文字清晰度优化 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    transform: translateZ(0);
  }
}



/* 针对有刘海屏或底部手势条的设备 */
@supports (padding: max(0px)) {
  .wechat-input {
    bottom: env(safe-area-inset-bottom);
  }

  .wechat-input.emoji-panel-open {
    bottom: calc(250px + env(safe-area-inset-bottom));
  }

  .wechat-input.more-panel-open {
    bottom: calc(180px + env(safe-area-inset-bottom));
  }

  .wechat-input.input-method-panel-open {
    bottom: calc(230px + env(safe-area-inset-bottom));  /* 与主样式保持一致 */
  }

  .emoji-panel {
    bottom: env(safe-area-inset-bottom);
  }

  .more-panel {
    bottom: env(safe-area-inset-bottom);
  }
}
</style>
