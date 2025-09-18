<template>
  <div class="input-method" :class="{ visible: visible }">
    <!-- 候选词区域 -->
    <div v-if="candidates.length > 0" class="candidates-bar">
      <div class="candidates-scroll">
        <button
          v-for="(candidate, index) in candidates"
          :key="index"
          class="candidate-item"
          :class="{ selected: selectedCandidate === index }"
          @click="selectCandidate(candidate)"
        >
          {{ candidate }}
        </button>
      </div>
      <button v-if="candidates.length > 3" class="more-candidates" @click="showMoreCandidates">
        <iconify-icon icon="heroicons:chevron-right" width="16"></iconify-icon>
      </button>
    </div>

    <!-- 输入法切换标签 -->
    <div class="input-tabs">
      <button
        v-for="method in inputMethods"
        :key="method.id"
        class="input-tab"
        :class="{ active: currentMethod === method.id }"
        @click="switchMethod(method.id)"
      >
        <iconify-icon :icon="method.icon" width="18"></iconify-icon>
        <span>{{ method.name }}</span>
      </button>
    </div>

    <!-- 键盘区域 -->
    <div class="keyboard-container">
      <!-- 26键全键盘 -->
      <div v-if="currentMethod === 'qwerty'" class="qwerty-keyboard">
        <!-- 第一行 -->
        <div class="keyboard-row">
          <button
            v-for="key in qwertyLayout[0]"
            :key="key"
            class="key-btn letter-key"
            :class="{ 
              uppercase: isUppercase,
              active: pressedKey === key 
            }"
            @click="inputLetter(key)"
            @touchstart="keyPress(key)"
            @touchend="keyRelease"
          >
            {{ isUppercase ? key.toUpperCase() : key }}
          </button>
        </div>

        <!-- 第二行 -->
        <div class="keyboard-row">
          <button
            v-for="key in qwertyLayout[1]"
            :key="key"
            class="key-btn letter-key"
            :class="{ 
              uppercase: isUppercase,
              active: pressedKey === key 
            }"
            @click="inputLetter(key)"
            @touchstart="keyPress(key)"
            @touchend="keyRelease"
          >
            {{ isUppercase ? key.toUpperCase() : key }}
          </button>
        </div>

        <!-- 第三行 -->
        <div class="keyboard-row">
          <button
            class="key-btn shift-key"
            :class="{ active: isUppercase }"
            @click="toggleCase"
          >
            <iconify-icon icon="heroicons:arrow-up" width="16"></iconify-icon>
          </button>
          <button
            v-for="key in qwertyLayout[2]"
            :key="key"
            class="key-btn letter-key"
            :class="{ 
              uppercase: isUppercase,
              active: pressedKey === key 
            }"
            @click="inputLetter(key)"
            @touchstart="keyPress(key)"
            @touchend="keyRelease"
          >
            {{ isUppercase ? key.toUpperCase() : key }}
          </button>
          <button class="key-btn delete-key" @click="deleteChar" @touchstart="startLongPress" @touchend="stopLongPress">
            <iconify-icon icon="heroicons:backspace" width="16"></iconify-icon>
          </button>
        </div>

        <!-- 第四行 -->
        <div class="keyboard-row">
          <button class="key-btn symbol-key" @click="switchToSymbols">
            123
          </button>
          <button class="key-btn space-key" @click="inputSpace">
            空格
          </button>
          <button class="key-btn enter-key" @click="inputEnter">
            <iconify-icon icon="heroicons:arrow-turn-down-left" width="16"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- 9键键盘 -->
      <div v-else-if="currentMethod === 'nine'" class="nine-keyboard">
        <div class="keyboard-grid">
          <button
            v-for="key in nineKeyLayout"
            :key="key.main"
            class="nine-key"
            :class="{ active: pressedKey === key.main }"
            @click="inputNineKey(key)"
            @touchstart="keyPress(key.main)"
            @touchend="keyRelease"
          >
            <div class="main-char">{{ key.main }}</div>
            <div class="sub-chars">{{ key.letters }}</div>
          </button>
        </div>

        <!-- 9键底部控制栏 -->
        <div class="nine-controls">
          <button class="control-btn" @click="toggleNineKeyMode">
            {{ isT9Mode ? 'T9' : 'ABC' }}
          </button>
          <button class="control-btn" @click="switchToSymbols">符号</button>
          <button class="control-btn space-btn" @click="inputSpace">空格</button>
          <button class="control-btn" @click="deleteChar">
            <iconify-icon icon="heroicons:backspace" width="16"></iconify-icon>
          </button>
          <button class="control-btn" @click="inputEnter">
            <iconify-icon icon="heroicons:arrow-turn-down-left" width="16"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- 手写输入 -->
      <div v-else-if="currentMethod === 'handwrite'" class="handwrite-keyboard">
        <div class="handwrite-area">
          <canvas
            ref="handwriteCanvas"
            class="handwrite-canvas"
            @touchstart="startDrawing"
            @touchmove="draw"
            @touchend="stopDrawing"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
          ></canvas>
          <div class="handwrite-overlay">
            <div class="handwrite-hint">请在此区域手写</div>
          </div>
        </div>

        <div class="handwrite-controls">
          <button class="control-btn" @click="clearCanvas">清除</button>
          <button class="control-btn" @click="recognizeText">识别</button>
          <button class="control-btn space-btn" @click="inputSpace">空格</button>
          <button class="control-btn" @click="deleteChar">
            <iconify-icon icon="heroicons:backspace" width="16"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- 数字键盘 -->
      <div v-else-if="currentMethod === 'numbers'" class="numbers-keyboard">
        <div class="numbers-grid">
          <button v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" class="number-btn" @click="inputNumber(num.toString())">
            {{ num }}
          </button>
          <button class="number-btn" @click="inputSymbol('.')">.</button>
          <button class="number-btn" @click="inputNumber('0')">0</button>
          <button class="number-btn" @click="deleteChar">
            <iconify-icon icon="heroicons:backspace" width="16"></iconify-icon>
          </button>
        </div>

        <div class="numbers-controls">
          <button class="control-btn" @click="switchToSymbols">符号</button>
          <button class="control-btn" @click="switchToLetters">ABC</button>
          <button class="control-btn space-btn" @click="inputSpace">空格</button>
          <button class="control-btn" @click="inputEnter">
            <iconify-icon icon="heroicons:arrow-turn-down-left" width="16"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- 符号键盘 -->
      <div v-else-if="currentMethod === 'symbols'" class="symbols-keyboard">
        <div class="symbols-grid">
          <button
            v-for="symbol in currentSymbols"
            :key="symbol"
            class="symbol-btn"
            @click="inputSymbol(symbol)"
          >
            {{ symbol }}
          </button>
        </div>

        <div class="symbols-controls">
          <button class="control-btn" @click="switchSymbolPage">
            {{ symbolPage === 0 ? '更多' : '返回' }}
          </button>
          <button class="control-btn" @click="switchToLetters">ABC</button>
          <button class="control-btn space-btn" @click="inputSpace">空格</button>
          <button class="control-btn" @click="deleteChar">
            <iconify-icon icon="heroicons:backspace" width="16"></iconify-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { t9Engine, recognizeHandwriting } from '@/utils/t9Input'

// Props
interface Props {
  visible?: boolean
  value?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  value: ''
})

// Emits
const emit = defineEmits<{
  input: [value: string]
  enter: []
  close: []
}>()

// 响应式数据
const currentMethod = ref('qwerty')
const isUppercase = ref(false)
const pressedKey = ref('')
const candidates = ref<string[]>([])
const selectedCandidate = ref(0)
const symbolPage = ref(0)
const isDrawing = ref(false)
const lastPoint = ref<{ x: number; y: number } | null>(null)
const handwriteCanvas = ref<HTMLCanvasElement>()
const longPressTimer = ref<number>()

// 9键多次按键支持
const lastKeyPressed = ref('')
const keyPressCount = ref(0)
const keyPressTimer = ref<number>()
const isT9Mode = ref(true) // true: T9智能模式, false: 传统多次按键模式

// 输入法类型
const inputMethods = [
  { id: 'qwerty', name: '26键', icon: 'heroicons:keyboard' },
  { id: 'nine', name: '9键', icon: 'heroicons:calculator' },
  { id: 'handwrite', name: '手写', icon: 'heroicons:pencil' },
  { id: 'numbers', name: '数字', icon: 'heroicons:hashtag' }
]

// 26键布局
const qwertyLayout = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
]

// 9键布局
const nineKeyLayout = [
  { main: '1', letters: '' },
  { main: '2', letters: 'abc' },
  { main: '3', letters: 'def' },
  { main: '4', letters: 'ghi' },
  { main: '5', letters: 'jkl' },
  { main: '6', letters: 'mno' },
  { main: '7', letters: 'pqrs' },
  { main: '8', letters: 'tuv' },
  { main: '9', letters: 'wxyz' },
  { main: '*', letters: '' },
  { main: '0', letters: ' ' },
  { main: '#', letters: '' }
]

// 符号布局
const symbolLayouts = [
  // 第一页：常用符号
  ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
   '-', '_', '=', '+', '[', ']', '{', '}', '\\', '|',
   ';', ':', '"', "'", '<', '>', ',', '.', '?', '/'],
  // 第二页：更多符号
  ['~', '`', '¥', '€', '£', '¢', '§', '©', '®', '™',
   '°', '±', '×', '÷', '≠', '≤', '≥', '∞', '∑', '√',
   'α', 'β', 'γ', 'δ', 'π', 'Ω', '♠', '♣', '♥', '♦']
]

// 计算属性
const currentSymbols = computed(() => symbolLayouts[symbolPage.value])

// 方法
const switchMethod = (method: string) => {
  // 清除当前状态
  candidates.value = []
  selectedCandidate.value = 0
  t9Engine.clear()

  currentMethod.value = method

  if (method === 'handwrite') {
    nextTick(() => {
      initCanvas()
    })
  }
}

const inputLetter = (letter: string) => {
  const char = isUppercase.value ? letter.toUpperCase() : letter
  emit('input', props.value + char)
  
  // 自动切换大小写（首字母大写后自动切换为小写）
  if (isUppercase.value && props.value.length === 0) {
    isUppercase.value = false
  }
}

const inputNineKey = (key: any) => {
  if (key.main >= '2' && key.main <= '9') {
    if (isT9Mode.value) {
      // T9智能预测模式
      t9Engine.addKey(key.main)
      candidates.value = t9Engine.getCandidates()

      if (candidates.value.length > 0) {
        selectedCandidate.value = 0
      } else {
        // 没有候选词时，输入第一个字母
        const letters = key.letters
        if (letters && letters.length > 0) {
          emit('input', props.value + letters[0])
        }
      }
    } else {
      // 传统多次按键模式
      if (lastKeyPressed.value === key.main) {
        // 连续按同一个键，切换字母
        keyPressCount.value++
        if (keyPressTimer.value) {
          clearTimeout(keyPressTimer.value)
        }

        const letters = key.letters
        if (letters && letters.length > 0) {
          const letterIndex = (keyPressCount.value - 1) % letters.length
          const currentLetter = letters[letterIndex]

          // 替换最后输入的字符
          const newValue = props.value.slice(0, -1) + currentLetter
          emit('input', newValue)

          // 设置定时器，2秒后确认输入
          keyPressTimer.value = window.setTimeout(() => {
            resetKeyPress()
          }, 2000)
        }
      } else {
        // 新按键，重置计数并输入第一个字母
        resetKeyPress()
        lastKeyPressed.value = key.main
        keyPressCount.value = 1

        const letters = key.letters
        if (letters && letters.length > 0) {
          emit('input', props.value + letters[0])

          // 设置定时器，2秒后确认输入
          keyPressTimer.value = window.setTimeout(() => {
            resetKeyPress()
          }, 2000)
        }
      }
    }
  } else if (key.main === '0') {
    inputSpace()
    resetKeyPress()
  } else {
    emit('input', props.value + key.main)
    resetKeyPress()
  }
}

const resetKeyPress = () => {
  lastKeyPressed.value = ''
  keyPressCount.value = 0
  if (keyPressTimer.value) {
    clearTimeout(keyPressTimer.value)
    keyPressTimer.value = undefined
  }
}

const toggleNineKeyMode = () => {
  isT9Mode.value = !isT9Mode.value
  resetKeyPress()
  candidates.value = []
  t9Engine.clear()

  console.log(`切换到${isT9Mode.value ? 'T9智能' : '传统多次按键'}模式`)
}

const inputSymbol = (symbol: string) => {
  emit('input', props.value + symbol)
}

const inputNumber = (number: string) => {
  emit('input', props.value + number)
}

const inputSpace = () => {
  emit('input', props.value + ' ')
}

const inputEnter = () => {
  emit('enter')
}

const deleteChar = () => {
  // 如果有候选词正在显示，先清除候选词
  if (candidates.value.length > 0) {
    t9Engine.backspace()
    candidates.value = t9Engine.getCandidates()
    if (candidates.value.length === 0) {
      selectedCandidate.value = 0
    }
  } else if (props.value.length > 0) {
    // 删除输入框中的字符
    emit('input', props.value.slice(0, -1))
  }
}

const toggleCase = () => {
  isUppercase.value = !isUppercase.value
}

const switchToSymbols = () => {
  currentMethod.value = 'symbols'
  symbolPage.value = 0
}

const switchToLetters = () => {
  currentMethod.value = 'qwerty'
}

const switchSymbolPage = () => {
  symbolPage.value = symbolPage.value === 0 ? 1 : 0
}

const keyPress = (key: string) => {
  pressedKey.value = key
}

const keyRelease = () => {
  pressedKey.value = ''
}

const startLongPress = () => {
  longPressTimer.value = window.setInterval(() => {
    deleteChar()
  }, 100)
}

const stopLongPress = () => {
  if (longPressTimer.value) {
    clearInterval(longPressTimer.value)
    longPressTimer.value = undefined
  }
}

// 手写相关方法
const initCanvas = () => {
  if (!handwriteCanvas.value) return
  
  const canvas = handwriteCanvas.value
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * 2 // 高分辨率
  canvas.height = rect.height * 2
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(2, 2)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3
    ctx.strokeStyle = '#333'
  }
}

const getCanvasPoint = (e: TouchEvent | MouseEvent) => {
  if (!handwriteCanvas.value) return null
  
  const canvas = handwriteCanvas.value
  const rect = canvas.getBoundingClientRect()
  
  let clientX, clientY
  if (e instanceof TouchEvent) {
    if (e.touches.length === 0) return null
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const startDrawing = (e: TouchEvent | MouseEvent) => {
  e.preventDefault()
  isDrawing.value = true
  lastPoint.value = getCanvasPoint(e)
}

const draw = (e: TouchEvent | MouseEvent) => {
  if (!isDrawing.value || !handwriteCanvas.value) return
  
  e.preventDefault()
  const currentPoint = getCanvasPoint(e)
  if (!currentPoint || !lastPoint.value) return
  
  const ctx = handwriteCanvas.value.getContext('2d')
  if (ctx) {
    ctx.beginPath()
    ctx.moveTo(lastPoint.value.x, lastPoint.value.y)
    ctx.lineTo(currentPoint.x, currentPoint.y)
    ctx.stroke()
  }
  
  lastPoint.value = currentPoint
}

const stopDrawing = () => {
  isDrawing.value = false
  lastPoint.value = null
}

const clearCanvas = () => {
  if (!handwriteCanvas.value) return
  
  const ctx = handwriteCanvas.value.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, handwriteCanvas.value.width, handwriteCanvas.value.height)
  }
}

const recognizeText = () => {
  if (!handwriteCanvas.value) return

  // 获取画布数据用于识别
  const canvas = handwriteCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 检查是否有绘制内容
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const hasContent = imageData.data.some((pixel, index) =>
    index % 4 === 3 && pixel > 0 // 检查alpha通道
  )

  if (!hasContent) {
    console.log('没有手写内容')
    return
  }

  // 调用手写识别
  try {
    // 这里可以获取笔画数据传给识别引擎
    const strokes: any[] = [] // 实际应用中需要记录笔画数据
    const results = recognizeHandwriting(strokes)
    candidates.value = results
    selectedCandidate.value = 0

    console.log('手写识别结果:', results)
  } catch (error) {
    console.error('手写识别失败:', error)
  }
}

const selectCandidate = (candidate: string) => {
  emit('input', props.value + candidate)

  // 清除候选词和T9状态
  candidates.value = []
  selectedCandidate.value = 0
  t9Engine.clear()

  // 如果是手写模式，清除画布
  if (currentMethod.value === 'handwrite') {
    clearCanvas()
  }
}

const showMoreCandidates = () => {
  // 显示更多候选词
  console.log('显示更多候选词')
}

// 生命周期
onMounted(() => {
  if (currentMethod.value === 'handwrite') {
    nextTick(() => {
      initCanvas()
    })
  }
})

onUnmounted(() => {
  if (longPressTimer.value) {
    clearInterval(longPressTimer.value)
  }
})
</script>

<style scoped>
.input-method {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 1000;
  max-height: 60vh;
  overflow: hidden;
}

.input-method.visible {
  transform: translateY(0);
}

/* 候选词区域 */
.candidates-bar {
  display: flex;
  align-items: center;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 12px;
  min-height: 40px;
}

.candidates-scroll {
  flex: 1;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.candidates-scroll::-webkit-scrollbar {
  display: none;
}

.candidate-item {
  flex-shrink: 0;
  padding: 6px 12px;
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.candidate-item:hover,
.candidate-item.selected {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

.more-candidates {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  cursor: pointer;
}

/* 输入法切换标签 */
.input-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.input-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.input-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

/* 键盘容器 */
.keyboard-container {
  padding: 12px;
  background: #f5f5f5;
}

/* 26键键盘 */
.qwerty-keyboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.key-btn {
  min-width: 32px;
  height: 40px;
  border: none;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.key-btn:active,
.key-btn.active {
  background: #e0e0e0;
  transform: scale(0.95);
}

.letter-key {
  flex: 1;
  max-width: 36px;
}

.letter-key.uppercase {
  background: #e8f5e8;
  color: #07c160;
}

.shift-key,
.delete-key {
  width: 48px;
  background: #e0e0e0;
  color: #666;
}

.shift-key.active {
  background: #07c160;
  color: white;
}

.symbol-key {
  width: 60px;
  background: #e0e0e0;
  color: #666;
  font-size: 14px;
}

.space-key {
  flex: 1;
  background: #e0e0e0;
  color: #666;
  font-size: 14px;
}

.enter-key {
  width: 60px;
  background: #07c160;
  color: white;
}

/* 9键键盘 */
.nine-keyboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.nine-key {
  height: 60px;
  border: none;
  border-radius: 8px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.nine-key:active,
.nine-key.active {
  background: #e0e0e0;
  transform: scale(0.95);
}

.main-char {
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.sub-chars {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

.nine-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.control-btn:active {
  background: #e0e0e0;
  transform: scale(0.95);
}

.space-btn {
  flex: 1;
  background: #e0e0e0;
  color: #666;
}

/* 手写键盘 */
.handwrite-keyboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.handwrite-area {
  position: relative;
  height: 180px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.handwrite-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.handwrite-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0.5;
}

.handwrite-hint {
  font-size: 14px;
  color: #999;
  background: rgba(255,255,255,0.8);
  padding: 8px 16px;
  border-radius: 16px;
}

.handwrite-controls {
  display: flex;
  gap: 8px;
}

/* 符号键盘 */
.symbols-keyboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.symbols-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
}

.symbol-btn {
  height: 40px;
  border: none;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.symbol-btn:active {
  background: #e0e0e0;
  transform: scale(0.95);
}

.symbols-controls {
  display: flex;
  gap: 8px;
}

/* 数字键盘 */
.numbers-keyboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.numbers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.number-btn {
  height: 50px;
  border: none;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.number-btn:active {
  background: #e0e0e0;
  transform: scale(0.95);
}

.numbers-controls {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .keyboard-container {
    padding: 8px;
  }

  .key-btn {
    min-width: 28px;
    height: 36px;
    font-size: 14px;
  }

  .nine-key {
    height: 50px;
  }

  .main-char {
    font-size: 18px;
  }

  .symbols-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media (min-width: 414px) {
  .symbols-grid {
    grid-template-columns: repeat(12, 1fr);
  }
}

/* 触摸反馈 */
@media (hover: none) {
  .key-btn:hover,
  .nine-key:hover,
  .symbol-btn:hover,
  .control-btn:hover {
    background: initial;
  }
}

/* 防止文本选择 */
.input-method * {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 键盘动画 */
.keyboard-row {
  animation: slideInUp 0.3s ease-out;
}

.keyboard-row:nth-child(1) { animation-delay: 0.1s; }
.keyboard-row:nth-child(2) { animation-delay: 0.15s; }
.keyboard-row:nth-child(3) { animation-delay: 0.2s; }
.keyboard-row:nth-child(4) { animation-delay: 0.25s; }

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

/* 长按删除效果 */
.delete-key:active {
  background: #ff4757;
  color: white;
}

/* 输入法切换动画 */
.keyboard-container > div {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
