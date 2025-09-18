<template>
  <div v-if="visible" class="gesture-password-modal" @click="handleBackdropClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="close-btn" @click="close">
          <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="modal-description">{{ description }}</p>
        
        <!-- 手势绘制区域 -->
        <div class="gesture-container">
          <canvas
            ref="gestureCanvas"
            class="gesture-canvas"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
          ></canvas>
          
          <!-- 手势点 -->
          <div class="gesture-dots">
            <div
              v-for="(dot, index) in gestureDots"
              :key="index"
              class="gesture-dot"
              :class="{ active: dot.active, connected: dot.connected }"
              :style="{ left: dot.x + 'px', top: dot.y + 'px' }"
            ></div>
          </div>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <!-- 操作提示 -->
        <div class="gesture-tips">
          <p v-if="currentPath.length === 0">请绘制手势密码</p>
          <p v-else-if="currentPath.length < 4">至少连接4个点 (已连接{{ currentPath.length }}个)</p>
          <p v-else>手势绘制完成，松开手指验证</p>
          <button class="reset-btn" @click="resetGesture">重新绘制</button>
        </div>

        <!-- 演示提示 -->
        <div class="demo-tips">
          <p class="demo-text">演示手势：Z字形 (0→1→2→5→8) 或 (0→4→5→7→8)</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  visible: boolean
  title?: string
  description?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', gesture: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '手势验证',
  description: '请绘制手势密码进行验证'
})

const emit = defineEmits<Emits>()

const gestureCanvas = ref<HTMLCanvasElement>()
const errorMessage = ref('')
const isDrawing = ref(false)
const currentPath = ref<number[]>([])

// 手势点配置
const gestureDots = ref([
  { x: 60, y: 60, active: false, connected: false },
  { x: 150, y: 60, active: false, connected: false },
  { x: 240, y: 60, active: false, connected: false },
  { x: 60, y: 150, active: false, connected: false },
  { x: 150, y: 150, active: false, connected: false },
  { x: 240, y: 150, active: false, connected: false },
  { x: 60, y: 240, active: false, connected: false },
  { x: 150, y: 240, active: false, connected: false },
  { x: 240, y: 240, active: false, connected: false }
])

// 初始化画布
const initCanvas = () => {
  nextTick(() => {
    if (gestureCanvas.value) {
      const canvas = gestureCanvas.value
      canvas.width = 300
      canvas.height = 300
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#07C160'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  })
}

// 获取触摸/鼠标位置
const getPosition = (event: TouchEvent | MouseEvent) => {
  const canvas = gestureCanvas.value
  if (!canvas) return { x: 0, y: 0 }
  
  const rect = canvas.getBoundingClientRect()
  let clientX, clientY
  
  if (event instanceof TouchEvent) {
    clientX = event.touches[0]?.clientX || event.changedTouches[0]?.clientX
    clientY = event.touches[0]?.clientY || event.changedTouches[0]?.clientY
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

// 检查是否在点上
const checkDotHit = (x: number, y: number) => {
  for (let i = 0; i < gestureDots.value.length; i++) {
    const dot = gestureDots.value[i]
    const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2)
    if (distance <= 25 && !dot.active) { // 25px 半径
      return i
    }
  }
  return -1
}

// 触摸开始
const handleTouchStart = (event: TouchEvent) => {
  event.preventDefault()
  const pos = getPosition(event)
  startDrawing(pos.x, pos.y)
}

const handleMouseDown = (event: MouseEvent) => {
  const pos = getPosition(event)
  startDrawing(pos.x, pos.y)
}

const startDrawing = (x: number, y: number) => {
  isDrawing.value = true
  const hitDot = checkDotHit(x, y)
  if (hitDot !== -1) {
    gestureDots.value[hitDot].active = true
    currentPath.value.push(hitDot)
  }
}

// 触摸移动
const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault()
  if (!isDrawing.value) return
  const pos = getPosition(event)
  continueDrawing(pos.x, pos.y)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDrawing.value) return
  const pos = getPosition(event)
  continueDrawing(pos.x, pos.y)
}

const continueDrawing = (x: number, y: number) => {
  const hitDot = checkDotHit(x, y)
  if (hitDot !== -1 && !currentPath.value.includes(hitDot)) {
    gestureDots.value[hitDot].active = true
    gestureDots.value[hitDot].connected = true
    currentPath.value.push(hitDot)
    drawLine()
  }
}

// 触摸结束
const handleTouchEnd = (event: TouchEvent) => {
  event.preventDefault()
  endDrawing()
}

const handleMouseUp = () => {
  endDrawing()
}

const endDrawing = () => {
  isDrawing.value = false
  if (currentPath.value.length >= 4) {
    verifyGesture()
  } else {
    errorMessage.value = '手势密码至少需要连接4个点'
    setTimeout(resetGesture, 1000)
  }
}

// 绘制连线
const drawLine = () => {
  const canvas = gestureCanvas.value
  if (!canvas || currentPath.value.length < 2) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.beginPath()
  
  for (let i = 0; i < currentPath.value.length; i++) {
    const dotIndex = currentPath.value[i]
    const dot = gestureDots.value[dotIndex]
    
    if (i === 0) {
      ctx.moveTo(dot.x, dot.y)
    } else {
      ctx.lineTo(dot.x, dot.y)
    }
  }
  
  ctx.stroke()
}

// 验证手势
const verifyGesture = () => {
  const gesturePattern = currentPath.value.join('')

  // 获取已设置的手势密码
  const savedGesture = localStorage.getItem('yeyu_gesture_password')

  // 这里应该调用API验证手势密码
  // 暂时用localStorage存储的手势或固定手势模拟
  if (gesturePattern === savedGesture || gesturePattern === '01258' || gesturePattern === '04578') {
    emit('confirm', gesturePattern)
    close()
  } else {
    errorMessage.value = '手势密码错误，请重新绘制'
    setTimeout(resetGesture, 1000)
  }
}

// 重置手势
const resetGesture = () => {
  currentPath.value = []
  errorMessage.value = ''
  gestureDots.value.forEach(dot => {
    dot.active = false
    dot.connected = false
  })
  
  const canvas = gestureCanvas.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}

// 关闭弹窗
const close = () => {
  resetGesture()
  emit('update:visible', false)
  emit('cancel')
}

// 点击背景关闭
const handleBackdropClick = () => {
  close()
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetGesture()
    initCanvas()
  }
})
</script>

<style scoped>
.gesture-password-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  padding: 0;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 0 20px 20px 20px;
}

.modal-description {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 0 0 24px 0;
}

.gesture-container {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto 20px auto;
  background: #f8f8f8;
  border-radius: 12px;
}

.gesture-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.gesture-dots {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.gesture-dot {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  background: white;
  transform: translate(-50%, -50%);
  transition: all 0.2s ease;
}

.gesture-dot.active {
  border-color: #07C160;
  background: #07C160;
}

.gesture-dot.connected {
  background: #07C160;
  border-color: #07C160;
}

.error-message {
  text-align: center;
  color: #ff4757;
  font-size: 14px;
  margin-bottom: 16px;
  min-height: 20px;
}

.gesture-tips {
  text-align: center;
}

.gesture-tips p {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.reset-btn {
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.reset-btn:hover {
  background: #e0e0e0;
}

.demo-tips {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #07C160;
}

.demo-text {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}
</style>
