<template>
  <div class="change-gesture-password">
    <!-- 顶部导航栏 -->
    <MobileTopBar
      :show-back="true"
      @back="router.back()"
    />

    <!-- 内容区域 -->
    <div class="content">
      <!-- 当前步骤说明 -->
      <div class="step-info">
        <div class="step-title">{{ stepTitle }}</div>
        <div class="step-desc">{{ stepDescription }}</div>
      </div>

      <!-- 手势绘制区域 -->
      <div
        class="gesture-container"
        @touchstart.passive="false"
        @touchmove.passive="false"
        @touchend.passive="false"
      >
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
            :class="{ 
              active: dot.active, 
              connected: dot.connected,
              error: showError 
            }"
            :style="{ left: dot.x + 'px', top: dot.y + 'px' }"
          ></div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- 重新绘制按钮 -->
      <div class="action-buttons">
        <button 
          v-if="currentStep > 1" 
          class="reset-btn" 
          @click="resetGesture"
        >
          重新绘制
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const authStore = useAuthStore()

// 画布引用
const gestureCanvas = ref<HTMLCanvasElement>()

// 当前步骤 (1: 输入原密码, 2: 绘制新密码, 3: 确认新密码)
const currentStep = ref(1)

// 是否已有手势密码
const hasGesturePassword = ref(false)

// 手势数据
const gestureDots = ref<Array<{x: number, y: number, active: boolean, connected: boolean}>>([])
const gesturePattern = ref<number[]>([])
const originalPattern = ref<string>('')
const newPattern = ref<string>('')
const confirmPattern = ref<string>('')

// 绘制状态
const isDrawing = ref(false)
const showError = ref(false)
const errorMessage = ref('')

// 步骤标题和描述
const stepTitle = computed(() => {
  switch (currentStep.value) {
    case 1: return '验证原手势密码'
    case 2: return hasGesturePassword.value ? '绘制新手势密码' : '设置手势密码'
    case 3: return hasGesturePassword.value ? '确认新手势密码' : '确认手势密码'
    default: return ''
  }
})

const stepDescription = computed(() => {
  switch (currentStep.value) {
    case 1: return hasGesturePassword.value ? '请绘制当前的手势密码' : '您还没有设置手势密码，请先绘制一个手势密码'
    case 2: return hasGesturePassword.value ? '请绘制新的手势密码（至少连接4个点）' : '请绘制手势密码（至少连接4个点）'
    case 3: return hasGesturePassword.value ? '请再次绘制新手势密码确认' : '请再次绘制手势密码确认'
    default: return ''
  }
})

// 初始化手势点 - 使用固定坐标确保间距相等
const initGestureDots = () => {
  // 使用与现有组件一致的坐标，确保左右间距相等
  // 容器300px，点位置：60, 150, 240
  // 左边距60px，右边距60px，中间间距90px
  gestureDots.value = [
    { x: 60, y: 60, active: false, connected: false },    // 0
    { x: 150, y: 60, active: false, connected: false },   // 1
    { x: 240, y: 60, active: false, connected: false },   // 2
    { x: 60, y: 150, active: false, connected: false },   // 3
    { x: 150, y: 150, active: false, connected: false },  // 4
    { x: 240, y: 150, active: false, connected: false },  // 5
    { x: 60, y: 240, active: false, connected: false },   // 6
    { x: 150, y: 240, active: false, connected: false },  // 7
    { x: 240, y: 240, active: false, connected: false }   // 8
  ]
}

// 重置手势
const resetGesture = () => {
  gesturePattern.value = []
  showError.value = false
  errorMessage.value = ''
  
  gestureDots.value.forEach(dot => {
    dot.active = false
    dot.connected = false
  })
  
  if (gestureCanvas.value) {
    const ctx = gestureCanvas.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, gestureCanvas.value.width, gestureCanvas.value.height)
    }
  }
}

// 处理手势完成
const handleGestureComplete = async () => {
  if (gesturePattern.value.length < 4) {
    showError.value = true
    errorMessage.value = '至少需要连接4个点'
    setTimeout(() => {
      resetGesture()
    }, 1000)
    return
  }

  const patternString = gesturePattern.value.join(',')

  switch (currentStep.value) {
    case 1:
      // 验证原密码或首次设置
      if (hasGesturePassword.value) {
        // 有原密码，需要验证
        try {
          const isValid = await verifyOriginalGesture(patternString)
          if (isValid) {
            originalPattern.value = patternString
            currentStep.value = 2
            resetGesture()
          } else {
            showError.value = true
            errorMessage.value = '原手势密码错误'
            setTimeout(() => {
              resetGesture()
            }, 1000)
          }
        } catch (error) {
          showError.value = true
          errorMessage.value = '验证失败，请重试'
          setTimeout(() => {
            resetGesture()
          }, 1000)
        }
      } else {
        // 没有原密码，直接设置新密码
        originalPattern.value = '' // 没有原密码
        newPattern.value = patternString
        currentStep.value = 3
        resetGesture()
      }
      break

    case 2:
      // 设置新密码
      newPattern.value = patternString
      currentStep.value = 3
      resetGesture()
      break

    case 3:
      // 确认新密码
      if (patternString === newPattern.value) {
        try {
          await saveNewGesture(patternString)
          alert('手势密码修改成功')
          router.back()
        } catch (error) {
          showError.value = true
          errorMessage.value = '保存失败，请重试'
          setTimeout(() => {
            resetGesture()
          }, 1000)
        }
      } else {
        showError.value = true
        errorMessage.value = '两次手势不一致，请重新绘制'
        currentStep.value = 2
        newPattern.value = ''
        setTimeout(() => {
          resetGesture()
        }, 1000)
      }
      break
  }
}

// 验证原手势密码
const verifyOriginalGesture = async (pattern: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:8893/api/payment/verify-gesture-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ pattern })
    })

    if (!response.ok) {
      return false
    }

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('验证原手势密码失败:', error)
    return false
  }
}

// 检查手势密码状态
const checkGesturePasswordStatus = async () => {
  try {
    const response = await fetch('http://localhost:8893/api/payment/check-gesture-password', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      console.error('检查手势密码状态失败:', response.status)
      return
    }

    const result = await response.json()
    hasGesturePassword.value = result.hasGesturePassword || false

    // 始终从第一步开始，要求验证原密码
    // 如果没有手势密码，第一步会提示用户还没有设置手势密码
    currentStep.value = 1
  } catch (error) {
    console.error('检查手势密码状态失败:', error)
  }
}

// 保存新手势密码
const saveNewGesture = async (pattern: string): Promise<void> => {
  const response = await fetch('http://localhost:8893/api/payment/set-gesture-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    },
    body: JSON.stringify({
      oldPattern: hasGesturePassword.value ? originalPattern.value : undefined,
      newPattern: pattern
    })
  })

  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.error || '保存失败')
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '保存失败')
  }
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

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const pos = getPosition(e)
  startDrawing(pos.x, pos.y)
}

const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (!isDrawing.value) return
  const pos = getPosition(e)
  continueDrawing(pos.x, pos.y)
}

const handleTouchEnd = (e: TouchEvent) => {
  e.preventDefault()
  e.stopPropagation()
  endDrawing()
}

// 鼠标事件处理
const handleMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const pos = getPosition(e)
  startDrawing(pos.x, pos.y)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value) return
  e.preventDefault()
  e.stopPropagation()
  const pos = getPosition(e)
  continueDrawing(pos.x, pos.y)
}

const handleMouseUp = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  endDrawing()
}

// 开始绘制
const startDrawing = (x: number, y: number) => {
  if (!gestureCanvas.value) return

  isDrawing.value = true
  showError.value = false
  errorMessage.value = ''

  checkDotHit(x, y)
}

// 继续绘制
const continueDrawing = (x: number, y: number) => {
  if (!gestureCanvas.value) return

  const oldLength = gesturePattern.value.length
  checkDotHit(x, y)

  // 如果有新的点被连接，重新绘制所有连线
  if (gesturePattern.value.length > oldLength) {
    drawLine()
  }
}

// 结束绘制
const endDrawing = () => {
  isDrawing.value = false
  if (gesturePattern.value.length > 0) {
    handleGestureComplete()
  }
}

// 检查点击的点
const checkDotHit = (x: number, y: number) => {
  gestureDots.value.forEach((dot, index) => {
    const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2)
    if (distance < 40 && !dot.active) {
      dot.active = true
      dot.connected = true
      gesturePattern.value.push(index)
      console.log('点击了点:', index, '坐标:', x, y, '点坐标:', dot.x, dot.y, '距离:', distance)
    }
  })
}

// 绘制连线
const drawLine = () => {
  const canvas = gestureCanvas.value
  if (!canvas || gesturePattern.value.length < 2) {
    console.log('无法绘制连线:', !canvas ? '画布不存在' : '点数不足', gesturePattern.value.length)
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.log('无法获取画布上下文')
    return
  }

  console.log('开始绘制连线，点数:', gesturePattern.value.length, '模式:', gesturePattern.value)

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 设置线条样式
  ctx.strokeStyle = showError.value ? '#ff4444' : '#07C160'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 绘制连接线
  ctx.beginPath()
  for (let i = 0; i < gesturePattern.value.length; i++) {
    const dotIndex = gesturePattern.value[i]
    const dot = gestureDots.value[dotIndex]

    if (i === 0) {
      ctx.moveTo(dot.x, dot.y)
    } else {
      ctx.lineTo(dot.x, dot.y)
    }
  }
  ctx.stroke()
  console.log('连线绘制完成')
}

// 初始化画布
const initCanvas = () => {
  nextTick(() => {
    if (gestureCanvas.value) {
      const container = gestureCanvas.value.parentElement
      if (container) {
        gestureCanvas.value.width = container.offsetWidth
        gestureCanvas.value.height = container.offsetHeight
      } else {
        gestureCanvas.value.width = 300
        gestureCanvas.value.height = 300
      }

      // 确保画布上下文可用
      const ctx = gestureCanvas.value.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, gestureCanvas.value.width, gestureCanvas.value.height)
        console.log('画布初始化成功:', gestureCanvas.value.width, 'x', gestureCanvas.value.height)
      }
    }
  })
}

onMounted(() => {
  initGestureDots()
  initCanvas()
  checkGesturePasswordStatus()
})
</script>

<style scoped>
.change-gesture-password {
  height: 100vh;
  background: #e5e5e5;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}



.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
}

.step-info {
  text-align: center;
  margin-bottom: 32px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.step-desc {
  font-size: 14px;
  color: #666;
}

.gesture-container {
  position: relative;
  width: 300px;
  height: 300px;
  margin-bottom: 24px;
  touch-action: none;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.gesture-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  touch-action: none;
  pointer-events: auto;
  user-select: none;
}

.gesture-dots {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
}

.gesture-dot {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  border: 4px solid #999999;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}

.gesture-dot.active {
  background: #07C160;
  border-color: #07C160;
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
}

.gesture-dot.connected {
  background: #07C160;
  border-color: #07C160;
}

.gesture-dot.error {
  background: #ff4444;
  border-color: #ff4444;
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
}

.error-message {
  color: #ff4444;
  font-size: 14px;
  text-align: center;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.reset-btn {
  padding: 12px 24px;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.reset-btn:hover {
  background: #e5e5e5;
}
</style>
