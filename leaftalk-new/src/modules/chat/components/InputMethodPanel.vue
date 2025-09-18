<template>
  <div class="input-method-panel" v-if="visible" @click.stop>
    <!-- 智能切换区域：候选字区域 / 输入法设置区域 -->
    <div class="smart-area">
      <!-- 候选字区域 -->
      <div v-if="candidates.length > 0" class="candidate-area">
        <div class="candidate-scroll">
          <button
            v-for="(candidate, index) in candidates"
            :key="index"
            class="candidate-item"
            @click="selectCandidate(candidate)"
          >
            {{ candidate }}
          </button>
        </div>
      </div>

      <!-- 输入法设置区域 -->
      <div v-else class="method-settings-bar">
        <button class="method-settings-btn" @click="showMethodSettings">
          <iconify-icon icon="heroicons:keyboard" width="18" />
        </button>

      </div>
    </div>

    <!-- 键盘区域 -->
    <div class="keyboard-area">
      <!-- 26键拼音输入法 -->
      <div v-if="currentMethod === 'pinyin26'" class="keyboard-26">
        <div class="keyboard-row" v-for="(row, rowIndex) in pinyin26Layout" :key="rowIndex">
          <button
            v-for="(key, keyIndex) in row"
            :key="keyIndex"
            class="key-button key-26"
            :class="{
              'key-wide': ['空格'].includes(typeof key === 'string' ? key : key.main),
              'key-function': ['删除', '换行', '大小写', '符号', '中英文', '，！', '。？', '数字'].includes(typeof key === 'string' ? key : key.main),
              'key-active': ((typeof key === 'string' ? key : key.main) === '大小写' && isUpperCase) || ((typeof key === 'string' ? key : key.main) === '中英文' && isEnglishMode),
              'key-symbol': ['，！', '。？'].includes(typeof key === 'string' ? key : key.main),
              'key-letter': typeof key === 'object' && key.main && key.sub,
              'key-long-pressing': currentPressedKey === (typeof key === 'string' ? key : key.main)
            }"
            @click="handleKeyClick($event, key)"
            @mousedown="startKeyLongPress($event, key)"
            @mouseup="endKeyLongPress"
            @mouseleave="endKeyLongPress"
            @touchstart="startKeyLongPress($event, key)"
            @touchend="endKeyLongPress"
            @touchcancel="endKeyLongPress"
          >
            <!-- 删除按钮 -->
            <iconify-icon v-if="(typeof key === 'string' ? key : key.main) === '删除'" icon="heroicons:backspace" width="16" />
            <!-- 换行按钮 -->
            <iconify-icon v-else-if="(typeof key === 'string' ? key : key.main) === '换行'" icon="heroicons:arrow-turn-down-left" width="16" />
            <!-- 大小写按钮 -->
            <div v-else-if="(typeof key === 'string' ? key : key.main) === '大小写'" class="caps-lock-icon">
              <iconify-icon :icon="isUpperCase ? 'heroicons:arrow-up-solid' : 'heroicons:arrow-up'" width="14" />
            </div>
            <!-- 符号按钮 -->
            <span v-else-if="(typeof key === 'string' ? key : key.main) === '符号'" class="key-text">符号</span>
            <!-- 中英文按钮 -->
            <div v-else-if="(typeof key === 'string' ? key : key.main) === '中英文'" class="lang-switch">
              <template v-if="!isEnglishMode">
                <!-- 中文状态：中/英 -->
                <span class="large">中</span>
                <span class="separator">/</span>
                <span class="small">英</span>
              </template>
              <template v-else>
                <!-- 英文状态：英/中 -->
                <span class="large">英</span>
                <span class="separator">/</span>
                <span class="small">中</span>
              </template>
            </div>
            <!-- 逗号感叹号按钮 -->
            <div v-else-if="(typeof key === 'string' ? key : key.main) === '，！'" class="symbol-stack">
              <span>！</span>
              <span>，</span>
            </div>
            <!-- 空格按钮 -->
            <div v-else-if="(typeof key === 'string' ? key : key.main) === '空格'" class="space-icon"></div>
            <!-- 句号问号按钮 -->
            <div v-else-if="(typeof key === 'string' ? key : key.main) === '。？'" class="symbol-stack">
              <span>？</span>
              <span>。</span>
            </div>
            <!-- 数字按钮 -->
            <span v-else-if="(typeof key === 'string' ? key : key.main) === '数字'" class="key-text">123</span>
            <!-- 字母按键（带数字/符号） -->
            <div v-else-if="typeof key === 'object' && key.main && key.sub" class="key-letter-content">
              <span class="sub-char">{{ key.sub }}</span>
              <span class="main-char" :style="{ fontSize: isUpperCase ? '16px' : '18px', fontWeight: isUpperCase ? '500' : '400' }">{{ getDisplayKey(key.main) }}</span>
            </div>
            <!-- 普通按键 -->
            <span v-else>{{ getDisplayKey(typeof key === 'string' ? key : key.main) }}</span>
          </button>
        </div>
      </div>

      <!-- T9键拼音输入法 -->
      <div v-if="currentMethod === 'pinyinT9'" class="keyboard-t9">
        <div class="keyboard-row" v-for="(row, rowIndex) in t9Layout" :key="rowIndex">
          <button
            v-for="key in row"
            :key="key.main"
            class="key-button t9-key"
            @click="handleT9Press(key)"
          >
            <div class="t9-main">{{ key.main }}</div>
            <div class="t9-letters">{{ key.letters }}</div>
          </button>
        </div>
        <div class="keyboard-row">
          <button class="key-button key-function" @click="handleKeyPress('删除')">
            <iconify-icon icon="heroicons:backspace" width="18" />
          </button>
          <button class="key-button key-wide" @click="handleKeyPress('空格')">空格</button>
          <button class="key-button key-function" @click="handleKeyPress('换行')">
            <iconify-icon icon="heroicons:arrow-turn-down-left" width="18" />
          </button>
        </div>
      </div>

      <!-- 五笔输入法 -->
      <div v-if="currentMethod === 'wubi'" class="keyboard-wubi">
        <div class="wubi-hint">
          <div class="wubi-input">{{ currentInput }}</div>
          <div class="wubi-help">{{ wubiHelp }}</div>
        </div>
        <div class="keyboard-row" v-for="(row, rowIndex) in wubiLayout" :key="rowIndex">
          <button
            v-for="key in row"
            :key="key.key"
            class="key-button wubi-key"
            @click="handleWubiPress(key)"
          >
            <div class="wubi-main">{{ key.key }}</div>
            <div class="wubi-radical">{{ key.radical }}</div>
          </button>
        </div>
      </div>

      <!-- 手写输入法 -->
      <div v-if="currentMethod === 'handwriting'" class="keyboard-handwriting">
        <div class="handwriting-area">
          <canvas
            ref="handwritingCanvas"
            class="handwriting-canvas"
            @touchstart="startDrawing"
            @touchmove="draw"
            @touchend="stopDrawing"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
          ></canvas>
          <div class="handwriting-controls">
            <button class="control-btn" @click="clearCanvas">
              <iconify-icon icon="heroicons:trash" width="18" />
              清除
            </button>
            <button class="control-btn" @click="recognizeHandwriting">
              <iconify-icon icon="heroicons:magnifying-glass" width="18" />
              识别
            </button>
          </div>
        </div>
      </div>

      <!-- 笔画输入法 -->
      <div v-if="currentMethod === 'stroke'" class="keyboard-stroke">
        <div class="stroke-input">
          <div class="stroke-display">{{ strokeInput }}</div>
          <div class="stroke-hint">{{ strokeHint }}</div>
        </div>
        <div class="stroke-keys">
          <button
            v-for="stroke in strokeKeys"
            :key="stroke.key"
            class="stroke-key"
            @click="handleStrokePress(stroke)"
          >
            <div class="stroke-symbol">{{ stroke.symbol }}</div>
            <div class="stroke-name">{{ stroke.name }}</div>
          </button>
        </div>
      </div>

      <!-- 双拼输入法 -->
      <div v-if="currentMethod === 'shuangpin'" class="keyboard-shuangpin">
        <div class="shuangpin-hint">
          <div class="shuangpin-input">{{ currentInput }}</div>
          <div class="shuangpin-scheme">{{ shuangpinScheme }}方案</div>
        </div>
        <div class="keyboard-row" v-for="(row, rowIndex) in shuangpinLayout" :key="rowIndex">
          <button
            v-for="key in row"
            :key="key.key"
            class="key-button shuangpin-key"
            @click="handleShuangpinPress(key)"
          >
            <div class="sp-main">{{ key.key }}</div>
            <div class="sp-mapping">{{ key.mapping }}</div>
          </button>
        </div>
      </div>
    </div>

    <!-- 功能按钮区域 -->
    <div class="function-area">
      <!-- 左侧：输入法选择按钮 -->
      <button
        class="function-btn input-method-btn"
        @click="quickSwitchMethod"
        @mousedown="startLongPress"
        @mouseup="endLongPress"
        @mouseleave="endLongPress"
        @touchstart="startLongPress"
        @touchend="endLongPress"
      >
        <iconify-icon icon="heroicons:globe-alt" width="18" />
      </button>

      <!-- 右侧：占位按钮 -->
      <button class="function-btn placeholder-btn">
        <iconify-icon icon="heroicons:squares-2x2" width="18" />
      </button>
    </div>

    <!-- 输入法选择框 -->
    <div v-if="showMethodSelector" class="method-selector" :style="methodSelectorStyle">
      <div class="method-list">
        <button
          v-for="method in inputMethods"
          :key="method.type"
          class="method-option"
          :class="{ active: currentMethod === method.type }"
          @click="selectMethod(method.type)"
        >
          <iconify-icon :icon="method.icon" width="16" />
          <span>{{ method.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { chineseDictService, type DictCandidate } from '../services/chineseDictService'

// Props
interface Props {
  visible?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  placeholder: '请输入...'
})

// Emits
interface Emits {
  (e: 'input', text: string): void
  (e: 'temp-input', text: string): void
  (e: 'close'): void
  (e: 'candidate-select', text: string): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const currentMethod = ref('pinyin26') // 默认26键中文拼音
const currentInput = ref('')
const candidates = ref<string[]>([])
const currentLanguage = ref('中文')
const shuangpinScheme = ref('小鹤')
const strokeInput = ref('')
const strokeHint = ref('请输入笔画')
const wubiHelp = ref('五笔输入提示')
const showMethodSelectorModal = ref(false)

// 26键输入法状态
const isUpperCase = ref(false) // 大小写状态
const isEnglishMode = ref(false) // 中英文模式
const isSymbolMode = ref(false) // 符号模式
const isNumberMode = ref(false) // 数字模式

// 输入法选择器状态
const showMethodSelector = ref(false)
const methodSelectorStyle = ref({})
const longPressTimer = ref<number | null>(null)
const isLongPressing = ref(false)

// 按键长按状态
const keyLongPressTimer = ref<number | null>(null)
const isKeyLongPressing = ref(false)
const currentPressedKey = ref<string | null>(null)

// 手写相关
const handwritingCanvas = ref<HTMLCanvasElement>()
const isDrawing = ref(false)
const lastPoint = ref({ x: 0, y: 0 })

// 输入法列表
const inputMethods = [
  { type: 'pinyin26', name: '中文26键', icon: 'heroicons:language' },
  { type: 'pinyinT9', name: '中文9键', icon: 'heroicons:phone' },
  { type: 'wubi', name: '中文五笔', icon: 'heroicons:squares-2x2' },
  { type: 'handwriting', name: '中文手写', icon: 'heroicons:pencil' },
  { type: 'stroke', name: '中文笔画', icon: 'heroicons:pencil-square' },
  { type: 'shuangpin', name: '中文双拼', icon: 'heroicons:rectangle-group' }
]

// 26键拼音布局
const pinyin26Layout = [
  [
    { main: 'Q', sub: '1' },
    { main: 'W', sub: '2' },
    { main: 'E', sub: '3' },
    { main: 'R', sub: '4' },
    { main: 'T', sub: '5' },
    { main: 'Y', sub: '6' },
    { main: 'U', sub: '7' },
    { main: 'I', sub: '8' },
    { main: 'O', sub: '9' },
    { main: 'P', sub: '0' }
  ],
  [
    { main: 'A', sub: '~' },
    { main: 'S', sub: '@' },
    { main: 'D', sub: '#' },
    { main: 'F', sub: '$' },
    { main: 'G', sub: '%' },
    { main: 'H', sub: '&' },
    { main: 'J', sub: '*' },
    { main: 'K', sub: '(' },
    { main: 'L', sub: ')' }
  ],
  [
    '大小写',
    { main: 'Z', sub: '\'' },
    { main: 'X', sub: '/' },
    { main: 'C', sub: '-' },
    { main: 'V', sub: '_' },
    { main: 'B', sub: ':' },
    { main: 'N', sub: ';' },
    { main: 'M', sub: '、' },
    '删除'
  ],
  ['符号', '中英文', '，！', '空格', '。？', '数字', '换行']
]

// T9键布局
const t9Layout = [
  [
    { main: '1', letters: '' },
    { main: '2', letters: 'abc' },
    { main: '3', letters: 'def' }
  ],
  [
    { main: '4', letters: 'ghi' },
    { main: '5', letters: 'jkl' },
    { main: '6', letters: 'mno' }
  ],
  [
    { main: '7', letters: 'pqrs' },
    { main: '8', letters: 'tuv' },
    { main: '9', letters: 'wxyz' }
  ],
  [
    { main: '*', letters: '' },
    { main: '0', letters: ' ' },
    { main: '#', letters: '' }
  ]
]

// 五笔布局
const wubiLayout = [
  [
    { key: 'q', radical: '手' },
    { key: 'w', radical: '人' },
    { key: 'e', radical: '月' },
    { key: 'r', radical: '白' },
    { key: 't', radical: '禾' },
    { key: 'y', radical: '言' },
    { key: 'u', radical: '立' },
    { key: 'i', radical: '水' },
    { key: 'o', radical: '火' },
    { key: 'p', radical: '之' }
  ],
  [
    { key: 'a', radical: '工' },
    { key: 's', radical: '木' },
    { key: 'd', radical: '大' },
    { key: 'f', radical: '土' },
    { key: 'g', radical: '王' },
    { key: 'h', radical: '目' },
    { key: 'j', radical: '日' },
    { key: 'k', radical: '口' },
    { key: 'l', radical: '田' }
  ],
  [
    { key: 'z', radical: '子' },
    { key: 'x', radical: '纟' },
    { key: 'c', radical: '又' },
    { key: 'v', radical: '女' },
    { key: 'b', radical: '子' },
    { key: 'n', radical: '已' },
    { key: 'm', radical: '山' }
  ]
]

// 笔画按键
const strokeKeys = [
  { key: '1', symbol: '一', name: '横' },
  { key: '2', symbol: '丨', name: '竖' },
  { key: '3', symbol: '丿', name: '撇' },
  { key: '4', symbol: '丶', name: '点' },
  { key: '5', symbol: '乛', name: '折' }
]

// 双拼布局（小鹤方案）
const shuangpinLayout = [
  [
    { key: 'q', mapping: 'iu' },
    { key: 'w', mapping: 'ei' },
    { key: 'e', mapping: 'e' },
    { key: 'r', mapping: 'uan' },
    { key: 't', mapping: 'ue' },
    { key: 'y', mapping: 'un' },
    { key: 'u', mapping: 'u' },
    { key: 'i', mapping: 'i' },
    { key: 'o', mapping: 'o' },
    { key: 'p', mapping: 'uo' }
  ],
  [
    { key: 'a', mapping: 'a' },
    { key: 's', mapping: 'ong' },
    { key: 'd', mapping: 'uai' },
    { key: 'f', mapping: 'en' },
    { key: 'g', mapping: 'eng' },
    { key: 'h', mapping: 'ang' },
    { key: 'j', mapping: 'an' },
    { key: 'k', mapping: 'ao' },
    { key: 'l', mapping: 'ai' }
  ],
  [
    { key: 'z', mapping: 'ou' },
    { key: 'x', mapping: 'ie' },
    { key: 'c', mapping: 'iao' },
    { key: 'v', mapping: 'ui' },
    { key: 'b', mapping: 'in' },
    { key: 'n', mapping: 'ing' },
    { key: 'm', mapping: 'ian' }
  ]
]

// 方法实现
const switchMethod = (method: string) => {
  currentMethod.value = method
  currentInput.value = ''
  candidates.value = []

  if (method === 'handwriting') {
    nextTick(() => {
      initHandwritingCanvas()
    })
  }
}

const handleKeyPress = (key: string) => {
  if (key === '删除') {
    if (currentInput.value.length > 0) {
      currentInput.value = currentInput.value.slice(0, -1)
      updateCandidates()
    }
  } else if (key === '空格') {
    if (candidates.value.length > 0) {
      selectCandidate(candidates.value[0])
    } else {
      emit('input', ' ')
    }
  } else if (key === '换行') {
    emit('input', '\n')
  } else {
    currentInput.value += key
    updateCandidates()
  }
}

// 按键长按处理
const startKeyLongPress = (event: MouseEvent | TouchEvent, key: string | any) => {
  // 不调用preventDefault，让点击事件正常触发
  const keyValue = typeof key === 'string' ? key : key.main
  currentPressedKey.value = keyValue

  keyLongPressTimer.value = window.setTimeout(() => {
    isKeyLongPressing.value = true
    handleKeyLongPress(key)
  }, 500) // 500ms长按触发
}

const endKeyLongPress = () => {
  // 防止重复调用
  if (!currentPressedKey.value) {
    return false
  }

  const wasLongPressing = isKeyLongPressing.value

  if (keyLongPressTimer.value) {
    clearTimeout(keyLongPressTimer.value)
    keyLongPressTimer.value = null
  }

  // 立即清理长按状态
  isKeyLongPressing.value = false

  // 强制清理按钮视觉状态
  currentPressedKey.value = null

  // 如果刚刚完成长按，设置标志防止短按触发
  if (wasLongPressing) {
    justFinishedLongPress = true
  }

  return wasLongPressing
}

// 处理长按事件
const handleKeyLongPress = (key: string | any) => {
  console.log('长按触发:', key)
  const keyValue = typeof key === 'string' ? key : key.main

  // 字母按键长按输出上方的数字/符号
  if (typeof key === 'object' && key.sub) {
    console.log('长按输出副字符:', key.sub)
    emit('input', key.sub)
    return
  }

  // 标点符号按键长按输出上方符号
  if (keyValue === '，！') {
    console.log('长按输出感叹号')
    emit('input', isEnglishMode.value ? '!' : '！') // 长按输出感叹号
  } else if (keyValue === '。？') {
    console.log('长按输出问号')
    emit('input', isEnglishMode.value ? '?' : '？') // 长按输出问号
  }
}

// 记录是否刚刚完成长按
let justFinishedLongPress = false

// 统一的按键点击处理
const handleKeyClick = (event: MouseEvent | TouchEvent, key: string | any) => {
  // 延迟检查，确保mouseup事件已经处理完成
  setTimeout(() => {
    // 如果刚刚完成长按，不执行短按逻辑
    if (!justFinishedLongPress) {
      const keyValue = typeof key === 'string' ? key : key.main
      handle26KeyPress(keyValue)
    }
    // 重置标志
    justFinishedLongPress = false
  }, 10)
}

// 26键输入法按键处理
const handle26KeyPress = (key: string) => {
  if (key === '删除') {
    // 优先删除临时输入，如果没有临时输入则删除输入框内容
    if (currentInput.value.length > 0) {
      currentInput.value = currentInput.value.slice(0, -1)
      updateCandidates()
    } else {
      // 删除输入框的最后一个字符
      emit('input', 'BACKSPACE')
    }
  } else if (key === '空格') {
    if (candidates.value.length > 0 && !isEnglishMode.value) {
      selectCandidate(candidates.value[0])
    } else {
      emit('input', ' ')
    }
  } else if (key === '换行') {
    emit('input', '\n')
  } else if (key === '大小写') {
    isUpperCase.value = !isUpperCase.value
  } else if (key === '中英文') {
    isEnglishMode.value = !isEnglishMode.value
    currentInput.value = ''
    candidates.value = []
  } else if (key === '符号') {
    isSymbolMode.value = !isSymbolMode.value
    // TODO: 显示符号面板
  } else if (key === '数字') {
    isNumberMode.value = !isNumberMode.value
    // TODO: 显示数字面板
  } else if (key === '，！') {
    // 短按输出逗号/逗号
    emit('input', isEnglishMode.value ? ',' : '，')
  } else if (key === '。？') {
    // 短按输出句号/句号
    emit('input', isEnglishMode.value ? '.' : '。')
  } else {
    // 普通字母按键 - 短按输出字母
    const displayKey = getDisplayKey(key)
    if (isEnglishMode.value || isUpperCase.value) {
      // 英文模式或大写状态直接输出字母
      emit('input', displayKey)
    } else {
      // 中文模式且小写状态 - 拼音输入到临时区域
      currentInput.value += displayKey.toLowerCase()
      updateCandidates()
    }
  }
}

// 获取按键显示文本
const getDisplayKey = (key: string | any) => {
  // 如果是对象，返回main属性
  if (typeof key === 'object' && key.main) {
    return key.main
  }

  // 如果不是字符串，直接返回
  if (typeof key !== 'string') {
    return key
  }

  if (['，！', '。？', '符号', '中英文', '数字', '大小写', '删除', '换行', '空格'].includes(key)) {
    return key
  }

  // 字母按键根据大小写状态显示
  if (key.match(/^[A-Z]$/)) {
    return isUpperCase.value ? key : key.toLowerCase()
  }

  // 兼容小写字母（如果有的话）
  if (key.match(/^[a-z]$/)) {
    return isUpperCase.value ? key.toUpperCase() : key
  }

  return key
}

const handleT9Press = (key: any) => {
  currentInput.value += key.main
  updateT9Candidates()
}

const handleWubiPress = (key: any) => {
  if (currentInput.value.length < 4) {
    currentInput.value += key.key
    updateWubiCandidates()
  }
}

const handleStrokePress = (stroke: any) => {
  strokeInput.value += stroke.symbol
  updateStrokeCandidates()
}

const handleShuangpinPress = (key: any) => {
  currentInput.value += key.key
  updateShuangpinCandidates()
}

const selectCandidate = (candidate: string) => {
  emit('input', candidate)
  emit('candidate-select', candidate)
  currentInput.value = ''
  candidates.value = []
  strokeInput.value = ''
  emit('temp-input', '') // 清空临时输入
}

const updateCandidates = async () => {
  if (!currentInput.value) {
    candidates.value = []
    emit('temp-input', '') // 清空临时输入
    chineseDictService.clear()
    return
  }

  // 发射临时输入事件
  emit('temp-input', currentInput.value)

  try {
    // 使用中文词库服务获取候选字
    const candidateResults = await chineseDictService.getCandidates(currentInput.value)
    candidates.value = candidateResults.map(c => c.text)
  } catch (error) {
    console.error('获取候选字失败:', error)
    candidates.value = []
  }
}

const updateT9Candidates = () => {
  // T9候选字逻辑
  const t9Map: Record<string, string[]> = {
    '2': ['a', 'b', 'c'],
    '3': ['d', 'e', 'f'],
    '4': ['g', 'h', 'i'],
    '5': ['j', 'k', 'l'],
    '6': ['m', 'n', 'o'],
    '7': ['p', 'q', 'r', 's'],
    '8': ['t', 'u', 'v'],
    '9': ['w', 'x', 'y', 'z']
  }

  // 简单的T9候选字生成
  candidates.value = ['候选字1', '候选字2', '候选字3']
}

const updateWubiCandidates = () => {
  // 五笔候选字逻辑
  const wubiMap: Record<string, string[]> = {
    'a': ['工', '式', '戒'],
    'aa': ['工', '恭', '蚣'],
    'aaa': ['工', '贡', '攻']
  }

  candidates.value = wubiMap[currentInput.value] || []
  wubiHelp.value = `已输入: ${currentInput.value}`
}

const updateStrokeCandidates = () => {
  // 笔画候选字逻辑
  const strokeMap: Record<string, string[]> = {
    '一': ['一', '二', '三', '七', '丁'],
    '一丨': ['十', '干', '土', '士', '王'],
    '一丨一': ['工', '土', '王', '干', '士']
  }

  candidates.value = strokeMap[strokeInput.value] || []
  strokeHint.value = strokeInput.value ? `笔画: ${strokeInput.value}` : '请输入笔画'
}

const updateShuangpinCandidates = () => {
  // 双拼候选字逻辑
  const shuangpinMap: Record<string, string[]> = {
    'ni': ['你', '尼', '泥'],
    'hk': ['好', '号', '豪'],
    'wo': ['我', '握', '沃']
  }

  candidates.value = shuangpinMap[currentInput.value] || []
}





const closePanel = () => {
  emit('close')
}

// 获取当前输入法信息
const getCurrentMethodIcon = () => {
  const method = inputMethods.find(m => m.type === currentMethod.value)
  return method?.icon || 'heroicons:language'
}

const getCurrentMethodName = () => {
  const method = inputMethods.find(m => m.type === currentMethod.value)
  return method?.name || '拼音'
}

// 长按处理
const startLongPress = (event: MouseEvent | TouchEvent) => {
  // 只对可取消的事件调用preventDefault
  if (event.cancelable) {
    event.preventDefault()
  }
  isLongPressing.value = true

  longPressTimer.value = window.setTimeout(() => {
    if (isLongPressing.value) {
      showMethodSelectorPanel(event)
    }
  }, 500) // 500ms长按触发
}

const endLongPress = () => {
  isLongPressing.value = false
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// 快速切换输入法（点击）
const quickSwitchMethod = () => {
  if (!isLongPressing.value) {
    // 短按：在常用输入法间快速切换
    const commonMethods = ['pinyin26', 'pinyinT9', 'wubi']
    const currentIndex = commonMethods.indexOf(currentMethod.value)
    const nextIndex = (currentIndex + 1) % commonMethods.length
    switchMethod(commonMethods[nextIndex])
  }
}

// 显示输入法选择器
const showMethodSelectorPanel = (event: MouseEvent | TouchEvent) => {
  // 计算选择器位置（贴左侧，贴底部）
  methodSelectorStyle.value = {
    position: 'fixed',
    bottom: '0px',
    left: '0px',
    zIndex: 1001
  }

  showMethodSelector.value = true

  // 点击其他地方关闭选择器
  setTimeout(() => {
    document.addEventListener('click', hideMethodSelector, { once: true })
  }, 100)
}

// 隐藏输入法选择器
const hideMethodSelector = () => {
  showMethodSelector.value = false
}

// 选择输入法
const selectMethod = (methodType: string) => {
  switchMethod(methodType)
  hideMethodSelector()
}

// 显示输入法设置
const showMethodSettings = () => {
  console.log('显示输入法设置')
  // TODO: 实现输入法设置功能
}

onMounted(() => {
  if (currentMethod.value === 'handwriting') {
    nextTick(() => {
      initHandwritingCanvas()
    })
  }
})

// 手写功能
const initHandwritingCanvas = () => {
  if (!handwritingCanvas.value) return

  const canvas = handwritingCanvas.value
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * 2
  canvas.height = rect.height * 2

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(2, 2)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
  }
}

const startDrawing = (e: MouseEvent | TouchEvent) => {
  e.preventDefault()
  isDrawing.value = true

  const canvas = handwritingCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  lastPoint.value = {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value) return
  e.preventDefault()

  const canvas = handwritingCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  const currentPoint = {
    x: clientX - rect.left,
    y: clientY - rect.top
  }

  ctx.beginPath()
  ctx.moveTo(lastPoint.value.x, lastPoint.value.y)
  ctx.lineTo(currentPoint.x, currentPoint.y)
  ctx.stroke()

  lastPoint.value = currentPoint
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearCanvas = () => {
  const canvas = handwritingCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

const recognizeHandwriting = () => {
  // 模拟手写识别
  const mockResults = ['手', '写', '识', '别', '测', '试']
  candidates.value = mockResults
}

// 监听面板显示状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 面板显示时只在必要时清理状态
    // 不自动清理状态，让用户的输入保持
  } else {
    // 面板隐藏时清理状态
    currentInput.value = ''
    candidates.value = []
    strokeInput.value = ''
    emit('temp-input', '')
  }
})

// 生命周期
onMounted(() => {
  if (currentMethod.value === 'handwriting') {
    nextTick(() => {
      initHandwritingCanvas()
    })
  }
})
</script>

<style scoped>
/* 输入法面板主容器 */
.input-method-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f7f7f7;
  border-top: 1px solid #d9d9d9;    /* 添加顶部边框，与输入框底部边框重合 */
  z-index: 1100;          /* 提高z-index，确保在ChatInput之上 */
  height: auto;       /* 自动高度，跟随内部内容 */
  /* 移除max-height限制，让面板高度完全跟随内部三个区域 */
  overflow: visible;   /* 改为visible，不裁剪内容 */
  box-shadow: none;    /* 移除阴影，避免与输入框阴影冲突 */
  display: flex;
  flex-direction: column;
}

/* 候选字区域 */
.candidate-area {
  background: white;
  border-bottom: none; /* 移除下边框，与键盘容器重合 */
  border-top: none;    /* 移除上边框，与输入框容器重合 */
  padding: 0;         /* 移除所有padding */
  display: flex;
  align-items: center;
  height: 30px;       /* 减少到30px */
  margin: 0;          /* 移除外边距 */
  box-sizing: border-box;
  position: relative;
  z-index: 10;        /* 确保候选字区域在上层 */
}

.candidate-scroll {
  flex: 1;
  display: flex;
  overflow-x: auto;
  padding: 0 12px;
  gap: 8px;
  height: 26px;        /* 减少内部容器高度为26px */
  align-items: center;
  box-sizing: border-box;
}

.candidate-scroll::-webkit-scrollbar {
  display: none;
}

.candidate-item {
  background: none;
  border: none;
  padding: 0 12px;     /* 移除上下padding，保留左右padding */
  font-size: 16px;
  color: #333;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
  height: 26px;        /* 在30px容器内适配的高度 */
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.candidate-item:hover {
  background: #f0f0f0;
}

.candidate-item:active {
  background: #e0e0e0;
}





/* 键盘区域 */
.keyboard-area {
  background: #f7f7f7;
  padding: 8px;       /* 恢复原始padding */
  border-top: none;   /* 移除上边框，与候选字/设置区域重合 */
  margin: 0;
}

/* 26键键盘 */
.keyboard-26 {
  display: flex;
  flex-direction: column;
  gap: 4px;    /* 减少行间距 */
  /* 定义按钮宽度变量 */
  --button-width: calc((100% - 24px - 36px) / 10);  /* (容器宽度 - 左右边距 - 9个间距) / 10个按钮 */
}

.keyboard-row {
  display: flex;
  gap: 4px;
}

/* 第1排：基准排，左右边距12px */
.keyboard-row:nth-child(1) {
  padding: 0 12px;
  box-sizing: border-box;
  justify-content: space-between;
}

/* 第2排：水平居中 */
.keyboard-row:nth-child(2) {
  justify-content: center;
  padding: 0;
}

/* 第3排：左右边距12px，调整功能键宽度 */
.keyboard-row:nth-child(3) {
  padding: 0 12px;
  box-sizing: border-box;
  justify-content: flex-start;
}

/* 第4排：左右边距12px */
.keyboard-row:nth-child(4) {
  padding: 0 12px;
  box-sizing: border-box;
  justify-content: space-between;
}

.key-button {
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border: 1px solid #d0d0d0;
  border-top: 1px solid #e8e8e8;
  border-left: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px 8px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 立体键盘效果 */
  box-shadow:
    0 3px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  /* 改善触摸体验 */
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 26键专用按钮样式 */
.key-26 {
  height: 42px;
  padding: 0 4px;
  font-size: 15px;
  font-weight: 500;
  box-sizing: border-box;
}

/* 第1排按钮宽度计算基准 */
.keyboard-row:nth-child(1) .key-26 {
  width: var(--button-width);
  flex: none;
}

/* 第2排按钮与第1排宽度完全相等 */
.keyboard-row:nth-child(2) .key-26 {
  width: var(--button-width);
  flex: none;
}

/* 第3排字母键与第1排宽度相等 */
.keyboard-row:nth-child(3) .key-26:not(.key-function) {
  width: var(--button-width);
  flex: none;
}

/* 第3排功能键宽度调整 */
.keyboard-row:nth-child(3) .key-function {
  flex: 1.5;
  min-width: 0;
}

/* 第4排功能键宽度 */
.keyboard-row:nth-child(4) .key-26 {
  flex: 1;
  min-width: 0;
}

/* 符号按钮与字母按钮宽度相同 */
.keyboard-row:nth-child(4) .key-symbol {
  width: var(--button-width);
  flex: none;
}

/* 空格按钮特殊宽度 */
.keyboard-row:nth-child(4) .key-wide {
  flex: 3;
}

.key-button:hover {
  background: linear-gradient(145deg, #f8f8f8, #e8e8e8);
  border-color: #c8c8c8;
  transform: translateY(-1px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.key-button:active {
  background: #c0c0c0 !important;
  border-color: #a0a0a0 !important;
  transform: translateY(2px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: none;
}

/* 按钮点击后立即清除灰色效果 */
.key-button {
  transition: all 0.15s ease;
}

/* 长按状态样式 */
.key-long-pressing {
  background: #b8e6b8 !important;
  border-color: #07c160 !important;
  transform: scale(1.05) !important;
  box-shadow: 0 4px 8px rgba(7, 193, 96, 0.3) !important;
}

/* 确保非长按状态的按钮恢复正常 */
.key-button:not(.key-long-pressing) {
  background: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  transform: none !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

/* 大小写图标样式 */
.caps-lock-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 10;              /* 确保图标在最上层 */
}

.caps-lock-icon iconify-icon {
  display: block !important;  /* 强制显示图标 */
  opacity: 1 !important;      /* 确保不透明 */
  visibility: visible !important;  /* 确保可见 */
}

.key-wide {
  flex: 1;
  max-width: 120px;
}

.key-function {
  background: #e8e8e8;
  color: #666;
}

.key-26.key-function {
  font-size: 18px !important;
}

.key-function:hover {
  background: #d8d8d8;
}

/* 激活状态的按钮 */
.key-active {
  background: #07c160 !important;
  color: white !important;
  border-color: #07c160 !important;
}

.key-active:hover {
  background: #06a552 !important;
}

/* 符号按钮 */
.key-symbol {
  background: #f0f0f0;
  color: #333;
  font-weight: 600;
}

.key-symbol:hover {
  background: #e0e0e0;
}

/* 空格按钮特殊样式 */
.key-wide {
  flex: 2;
  min-width: 80px;
}

.space-icon {
  width: 50px;
  height: 7px;
  border: 2px solid #333;
  border-top: none;
  display: inline-block;
  margin-top: 8px;
}

.space-icon {
  font-size: 16px;
  color: #333;
  font-weight: 400;
}

/* 按钮文本样式 */
.key-text {
  font-size: 12px !important;
  font-weight: 400;
  color: #333;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

/* 中英文切换按钮 */
.lang-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-weight: 400;
  width: 100%;
  height: 100%;
}

.lang-switch .large {
  font-size: 12px !important;
  color: #333;
  font-weight: 500;
}

.lang-switch .small {
  font-size: 8px !important;
  color: #666;
  font-weight: 400;
}

.lang-switch .separator {
  font-size: 9px;
  color: #555;
  font-weight: 400;
}

/* 符号堆叠样式 */
.symbol-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 0.9;
  gap: 0;
  width: 100%;
  height: 100%;
}

.symbol-stack span {
  font-size: 16px;
  font-weight: 400;
  color: #333;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

/* 字母按键样式 */
.key-letter-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  line-height: 1;
}

.key-letter-content .sub-char {
  font-size: 12px;
  color: #666;
  font-weight: 400;
  margin-bottom: 3px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.key-letter-content .main-char {
  font-size: 20px;          /* 进一步增大字体，特别是小写时 */
  color: #333;
  font-weight: 500;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  transition: font-size 0.2s ease;  /* 添加过渡动画 */
}

/* T9键盘 */
.keyboard-t9 {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.t9-key {
  flex-direction: column;
  padding: 8px;
  min-height: 60px;
  min-width: 80px;
}

.t9-main {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.t9-letters {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

/* 五笔键盘 */
.keyboard-wubi {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wubi-hint {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wubi-input {
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

.wubi-help {
  font-size: 12px;
  color: #666;
}

.wubi-key {
  flex-direction: column;
  padding: 8px;
  min-height: 50px;
  min-width: 60px;
}

.wubi-main {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.wubi-radical {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

/* 手写键盘 */
.keyboard-handwriting {
  background: white;
  border-radius: 8px;
  padding: 12px;
}

.handwriting-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.handwriting-canvas {
  width: 100%;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: crosshair;
  background: white;
}

.handwriting-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.control-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background: #06a552;
}

.control-btn:active {
  background: #059048;
}

/* 笔画键盘 */
.keyboard-stroke {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stroke-input {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stroke-display {
  font-size: 18px;
  color: #333;
  font-weight: bold;
}

.stroke-hint {
  font-size: 12px;
  color: #666;
}

.stroke-keys {
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.stroke-key {
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stroke-key:hover {
  background: #f0f0f0;
  border-color: #bbb;
}

.stroke-key:active {
  background: #e0e0e0;
  transform: translateY(1px);
}

.stroke-symbol {
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

.stroke-name {
  font-size: 12px;
  color: #666;
}

/* 双拼键盘 */
.keyboard-shuangpin {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shuangpin-hint {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shuangpin-input {
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

.shuangpin-scheme {
  font-size: 12px;
  color: #666;
}

.shuangpin-key {
  flex-direction: column;
  padding: 8px;
  min-height: 50px;
  min-width: 60px;
}

.sp-main {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.sp-mapping {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

/* 功能按钮区域 */
.function-area {
  background: #e8e8e8;
  border-top: 1px solid #d9d9d9;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

/* 功能按钮通用样式 */
.function-btn {
  background: transparent;
  border: none;
  border-radius: 4px;
  width: 42px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  /* 改善触摸体验 */
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.function-btn:hover {
  background: #e0e0e0;
  border-color: #c0c0c0;
}

.function-btn:active {
  background: #d0d0d0;
  transform: scale(0.95);
}

/* 输入法选择按钮 */
.input-method-btn {
  background: transparent;
  border: none;
  color: #666;
}

.input-method-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.input-method-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

/* 占位按钮 */
.placeholder-btn {
  opacity: 0.6;
}

/* 智能切换区域 */
.smart-area {
  /* 移除min-height限制，让高度完全由子元素决定 */
  background: #f0f0f0;
  border-bottom: none; /* 移除下边框，让子元素控制边框 */
  border-top: none;    /* 移除上边框，与输入框容器重合 */
  margin: 0;
  padding: 0;
}

/* 输入法设置栏 */
.method-settings-bar {
  background: #f0f0f0;
  border-bottom: none; /* 移除下边框，与键盘容器重合 */
  border-top: none;    /* 移除上边框，与输入框容器重合 */
  padding: 0 12px;     /* 移除上下padding，保留左右padding */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;        /* 减少到30px，与候选字区域一致 */
  margin: 0;
  box-sizing: border-box;
  position: relative;
  z-index: 10;         /* 确保设置按钮在上层 */
}

.method-settings-btn {
  background: transparent;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.method-settings-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.method-settings-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

/* 输入法选择器 */
.method-selector {
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideInLeft 0.2s ease-out;
}

.method-list {
  padding: 8px 0;
  min-width: 120px;
}

.method-option {
  background: none;
  border: none;
  width: 100%;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  color: #333;
  text-align: left;
}

.method-option:hover {
  background: #f0f0f0;
}

.method-option.active {
  background: #e8f5e8;
  color: #07c160;
}

.method-option.active iconify-icon {
  color: #07c160;
}

/* 选择器动画 */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}



/* 响应式设计 */
@media (max-width: 768px) {
  .input-method-panel {
    max-height: 50vh;
  }

  .key-button {
    padding: 10px 6px;
    font-size: 14px;
    min-width: 28px;
  }

  .keyboard-26 {
    --button-width: calc((100% - 20px - 32px) / 10);  /* 平板版按钮宽度 */
  }

  .key-26 {
    height: 38px;
    padding: 0 3px;
    font-size: 13px;
  }

  .keyboard-row:nth-child(1) {
    padding: 0 10px;
    box-sizing: border-box;
    justify-content: space-between;
  }

  .keyboard-row:nth-child(3) {
    padding: 0 10px;
    box-sizing: border-box;
    justify-content: flex-start;
  }

  .keyboard-row:nth-child(4) {
    padding: 0 10px;
    box-sizing: border-box;
    justify-content: space-between;
  }

  .key-text {
    font-size: 10px;
  }

  .lang-switch .large {
    font-size: 12px;
  }

  .lang-switch .small {
    font-size: 8px;
  }

  .symbol-stack span {
    font-size: 9px;
  }

  .key-letter-content .sub-char {
    font-size: 11px;
    margin-bottom: 2px;
  }

  .key-letter-content .main-char {
    font-size: 14px;
  }

  .t9-key {
    min-height: 50px;
    min-width: 70px;
  }

  .t9-main {
    font-size: 18px;
  }

  .wubi-key,
  .shuangpin-key {
    min-height: 45px;
    min-width: 50px;
  }

  .stroke-key {
    padding: 10px 6px;
  }

  .stroke-symbol {
    font-size: 20px;
  }

  .handwriting-canvas {
    height: 150px;
  }

  .candidate-item {
    font-size: 14px;
    padding: 6px 10px;
  }

  .method-tab {
    padding: 6px 8px;
    font-size: 11px;
  }

  .function-area {
    padding: 10px;
  }

  .function-btn {
    width: 36px;
    height: 16px;
  }

  .method-option {
    padding: 8px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .keyboard-row {
    gap: 2px;
  }

  .key-button {
    padding: 8px 4px;
    font-size: 12px;
    min-width: 24px;
  }

  .keyboard-26 {
    --button-width: calc((100% - 16px - 32px) / 10);  /* 手机版按钮宽度 */
  }

  .key-26 {
    height: 36px;
    padding: 0 2px;
    font-size: 12px;
  }

  .keyboard-row:nth-child(1) {
    padding: 0 8px;
    box-sizing: border-box;
    justify-content: space-between;
  }

  .keyboard-row:nth-child(3) {
    padding: 0 8px;
    box-sizing: border-box;
    justify-content: flex-start;
  }

  .keyboard-row:nth-child(4) {
    padding: 0 8px;
    box-sizing: border-box;
    justify-content: space-between;
  }

  .key-text {
    font-size: 9px;
  }

  .lang-switch .large {
    font-size: 11px;
  }

  .lang-switch .small {
    font-size: 7px;
  }

  .symbol-stack span {
    font-size: 8px;
  }

  .key-letter-content .sub-char {
    font-size: 10px;
    margin-bottom: 2px;
  }

  .key-letter-content .main-char {
    font-size: 12px;
  }

  .t9-key {
    min-height: 45px;
    min-width: 60px;
  }

  .stroke-keys {
    gap: 4px;
  }

  .function-area {
    padding: 8px;
  }

  .function-btn {
    width: 32px;
    height: 14px;
  }

  .method-option {
    padding: 6px 10px;
    font-size: 12px;
  }

  .candidate-scroll {
    padding: 0 8px;
    gap: 4px;
  }
}

/* 动画效果 */
.input-method-panel {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 文字渲染优化 */
.input-method-panel * {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .key-button,
  .candidate-item,
  .method-tab,
  .func-btn,
  .control-btn,
  .stroke-key {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .key-button:active,
  .candidate-item:active,
  .method-tab:active,
  .func-btn:active,
  .control-btn:active,
  .stroke-key:active {
    transform: scale(0.95);
  }
}
</style>
