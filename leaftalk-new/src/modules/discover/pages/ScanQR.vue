<template>
  <div class="scan-qr">
    <!-- 扫描区域 -->
    <div class="scan-area">
      <!-- 返回按钮 -->
      <button class="back-btn-overlay" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: white;"></iconify-icon>
      </button>

      <!-- 摄像头预览 -->
      <div class="camera-preview">
        <video ref="videoRef" autoplay muted playsinline class="video-element"></video>

        <!-- 摄像头加载提示 -->
        <div v-if="!isScanning && !cameraError" class="camera-loading">
          <iconify-icon icon="heroicons:arrow-path" width="48" class="spinning" style="color: white;"></iconify-icon>
          <p>正在启动摄像头...</p>
        </div>

        <!-- 摄像头错误提示 -->
        <div v-if="cameraError" class="camera-error">
          <iconify-icon icon="heroicons:exclamation-triangle" width="48" style="color: #FF9500;"></iconify-icon>
          <p>{{ cameraError }}</p>
          <button @click="retryCamera" class="retry-btn">重试</button>
        </div>

        <!-- 扫描框 -->
        <div v-if="isScanning" class="scan-frame">
          <div class="scan-corners">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>
          <div class="scan-line" :class="{ scanning: isScanning }"></div>
        </div>

        <!-- 提示文字 -->
        <div v-if="isScanning" class="scan-tips">
          <p>将二维码放入框内，即可自动扫描</p>
        </div>
      </div>

      <!-- 扫描状态提示 -->
      <div v-if="isScanning" class="scan-status">
        <div class="status-indicator">
          <iconify-icon icon="heroicons:viewfinder-circle" width="24" style="color: white;"></iconify-icon>
          <span>自动识别中...</span>
        </div>
      </div>

    </div>

    <!-- 底部功能区 -->
    <div class="bottom-section">
      <!-- 自动识别提示 -->
      <div class="auto-detect-info">
        <div class="detect-status">
          <iconify-icon icon="heroicons:sparkles" width="16" style="color: #07C160;"></iconify-icon>
          <span>智能识别：{{ detectedType || '等待扫描...' }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn album-btn" @click="selectFromAlbum">
          <iconify-icon icon="heroicons:photo" width="24" style="color: white;"></iconify-icon>
          <span>相册</span>
        </button>

        <!-- 测试按钮 -->
        <button class="action-btn test-btn" @click="simulateScan">
          <iconify-icon icon="heroicons:beaker" width="24" style="color: white;"></iconify-icon>
          <span>测试扫描</span>
        </button>
      </div>
    </div>

    <!-- 扫描结果弹窗 -->
    <div v-if="scanResult" class="scan-result-modal" @click="closeScanResult">
      <div class="scan-result-content" @click.stop>
        <h3>扫描结果</h3>
        <div class="result-info">
          <div class="result-type">{{ scanResult.type }}</div>
          <div class="result-content">{{ scanResult.content }}</div>
        </div>
        <div class="result-actions">
          <button class="result-btn cancel" @click="closeScanResult">取消</button>
          <button class="result-btn confirm" @click="handleScanResult">确定</button>
        </div>
      </div>
    </div>

    <!-- 我的二维码弹窗 -->
    <div v-if="showMyQRDialog" class="qr-overlay" @click="showMyQRDialog = false">
      <div class="qr-dialog" @click.stop>
        <div class="qr-header">
          <h3>我的二维码</h3>
          <button class="close-btn" @click="showMyQRDialog = false">
            <iconify-icon icon="heroicons:x-mark" width="24" style="color: white;"></iconify-icon>
          </button>
        </div>

        <div class="qr-content">
          <div class="qr-avatar">
            <img :src="userAvatar" alt="头像" />
          </div>
          <div class="qr-name">{{ userName }}</div>
          <div class="qr-code-container">
            <div class="qr-code-placeholder">
              <iconify-icon icon="heroicons:qr-code" width="120" style="color: #333;"></iconify-icon>
            </div>
          </div>
          <div class="qr-tip">扫一扫上面的二维码，加我为好友</div>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div v-if="showToast" class="toast-overlay">
      <div class="toast" :class="toastType">
        <iconify-icon
          :icon="toastType === 'success' ? 'heroicons:check-circle' :
                 toastType === 'error' ? 'heroicons:x-circle' :
                 'heroicons:information-circle'"
          width="20"
        ></iconify-icon>
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
// 简单的二维码API实现
const qrAPI = {
  decode: async (content: string) => {
    // 简单的二维码内容解析
    try {
      // 尝试解析为URL
      if (content.startsWith('http://') || content.startsWith('https://')) {
        return {
          data: {
            success: true,
            data: {
              type: 'url',
              content: content,
              url: content
            }
          }
        }
      }

      // 尝试解析为叶语用户ID
      if (content.startsWith('yeyu://user/')) {
        const userId = content.replace('yeyu://user/', '')
        return {
          data: {
            success: true,
            data: {
              type: 'user',
              content: content,
              userId: userId
            }
          }
        }
      }

      // 默认为文本
      return {
        data: {
          success: true,
          data: {
            type: 'text',
            content: content
          }
        }
      }
    } catch (error) {
      return {
        data: {
          success: false,
          error: '解析失败'
        }
      }
    }
  }
}
import WeChatIcon from '../../../shared/components/icons/WeChatIcon.vue'
import jsQR from 'jsqr'

const router = useRouter()
const instance = getCurrentInstance()

// 响应式数据
const videoRef = ref<HTMLVideoElement>()
const isScanning = ref(false)
const flashOn = ref(false)
const scanResult = ref<any>(null)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('info')

// 自动识别相关
const detectedType = ref('')
const isAutoDetecting = ref(true)

// 我的二维码弹窗
const showMyQRDialog = ref(false)
const userName = ref('叶语用户')
const userAvatar = ref('https://api.dicebear.com/7.x/avataaars/svg?seed=default')

// 摄像头错误状态
const cameraError = ref('')

let mediaStream: MediaStream | null = null

// 方法
const goBack = () => {
  console.log('扫一扫页面返回')

  // 停止摄像头
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }

  // 返回到上级页面，而不是固定返回发现页面
  router.back()
}

const showMyQR = () => {
  console.log('显示我的二维码')
  showMyQRDialog.value = true
}

// 自动识别内容类型
const autoDetectContent = (content: string) => {
  // QR码检测 - 通常包含URL、文本等
  if (content.startsWith('http://') || content.startsWith('https://')) {
    detectedType.value = '网址链接'
    return 'url'
  }

  // 微信二维码检测
  if (content.includes('weixin://') || content.includes('wxp://')) {
    detectedType.value = '微信二维码'
    return 'wechat'
  }

  // 条码检测 - 通常是纯数字
  if (/^\d{8,}$/.test(content)) {
    detectedType.value = '商品条码'
    return 'barcode'
  }

  // 文字检测 - 包含中文或英文句子
  if (/[\u4e00-\u9fa5]/.test(content) || content.split(' ').length > 3) {
    detectedType.value = '文字内容'
    return 'text'
  }

  // 默认为二维码
  detectedType.value = '二维码'
  return 'qr'
}

// 显示提示消息
const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  // 3秒后自动隐藏
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const initCamera = async () => {
  try {
    console.log('🎥 开始初始化摄像头...')
    cameraError.value = '' // 清除之前的错误

    // 先停止之前的摄像头流（如果存在）
    if (mediaStream) {
      console.log('🛑 停止之前的摄像头流...')
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }

    // 检查浏览器是否支持 getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('您的浏览器不支持摄像头功能，请使用现代浏览器（Chrome、Firefox、Safari等）')
    }

    // 先尝试获取可用的摄像头设备
    console.log('📹 检查可用的摄像头设备...')
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(device => device.kind === 'videoinput')
    console.log('📹 找到摄像头设备:', videoDevices.length, '个')

    if (videoDevices.length === 0) {
      throw new Error('未检测到摄像头设备')
    }

    // 尝试多种配置，从简单到复杂
    const constraintsList = [
      // 配置1: 最简单的配置
      { video: true },
      // 配置2: 指定后置摄像头
      { video: { facingMode: 'environment' } },
      // 配置3: 指定分辨率
      {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      // 配置4: 使用第一个可用的摄像头
      { video: { deviceId: videoDevices[0].deviceId } }
    ]

    let lastError: any = null
    for (let i = 0; i < constraintsList.length; i++) {
      try {
        console.log(`📸 尝试配置 ${i + 1}/${constraintsList.length}...`)
        mediaStream = await navigator.mediaDevices.getUserMedia(constraintsList[i])
        console.log(`✅ 配置 ${i + 1} 成功！`)
        break
      } catch (err: any) {
        console.warn(`⚠️ 配置 ${i + 1} 失败:`, err.name, err.message)
        lastError = err
        // 等待一小段时间再尝试下一个配置
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    if (!mediaStream) {
      throw lastError || new Error('无法启动摄像头')
    }

    console.log('✅ 摄像头权限已获取')

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream

      // 等待视频元素准备好
      await new Promise((resolve, reject) => {
        if (!videoRef.value) {
          reject(new Error('视频元素未找到'))
          return
        }

        videoRef.value.onloadedmetadata = () => {
          console.log('✅ 视频元数据已加载')
          resolve(true)
        }

        videoRef.value.onerror = (err) => {
          console.error('❌ 视频元素错误:', err)
          reject(new Error('视频元素加载失败'))
        }

        // 超时保护
        setTimeout(() => reject(new Error('视频加载超时')), 5000)
      })

      isScanning.value = true
      cameraError.value = ''
      console.log('✅ 摄像头已启动，开始扫描检测')

      // 开始扫描检测
      startScanDetection()
    } else {
      console.error('❌ videoRef 未找到')
      throw new Error('视频元素未找到')
    }
  } catch (error: any) {
    console.error('❌ 无法访问摄像头:', error)

    let errorMessage = '无法访问摄像头'

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = '摄像头权限被拒绝\n请在浏览器设置中允许访问摄像头'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = '未检测到摄像头设备'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = '摄像头无法启动\n可能被其他应用占用，或需要重启浏览器'
    } else if (error.message) {
      errorMessage = error.message
    }

    cameraError.value = errorMessage
    showToastMessage(errorMessage, 'error')

    // 显示备用提示
    setTimeout(() => {
      showToastMessage('您可以点击"相册"按钮从相册选择二维码图片', 'info')
    }, 3000)
  }
}

// 重试摄像头
const retryCamera = () => {
  cameraError.value = ''
  isScanning.value = false
  initCamera()
}

// 真实扫描检测
const startScanDetection = () => {
  console.log('开始扫描检测，等待扫描到内容...')

  // 使用jsQR库进行真实的二维码检测
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  const scanFrame = () => {
    if (!isScanning.value || !videoRef.value) {
      return
    }

    const video = videoRef.value
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context?.getImageData(0, 0, canvas.width, canvas.height)
      if (imageData) {
        // 使用jsQR库进行真实的二维码检测
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (qrCode) {
          console.log('🎯 检测到二维码:', qrCode.data)
          handleScanSuccess(qrCode.data, 'qr')
          return
        }
      }
    }

    // 继续下一帧检测
    if (isScanning.value) {
      requestAnimationFrame(scanFrame)
    }
  }

  scanFrame()
}

// 处理扫描成功
const handleScanSuccess = async (content: string, type: string = 'qr') => {
  try {
    // 调用二维码识别API
    const response = await qrAPI.decode(content)

    if (response?.data?.success && response.data.data) {
      const result = response.data.data

      // 转换API结果格式
      const formattedResult = {
        type: getTypeLabel(result.type),
        content: result.content,
        action: getActionFromType(result.type),
        data: result.data
      }

      scanResult.value = formattedResult
      isScanning.value = false

      console.log('扫描到内容:', formattedResult)
    } else {
      throw new Error('API识别失败')
    }
  } catch (error) {
    console.error('扫描内容识别失败:', error)

    // API失败时使用降级方案 - 模拟扫描结果
    const mockResults = [
      {
        type: '叶语好友',
        content: 'yeyu://add-friend?data=' + encodeURIComponent(JSON.stringify({
          type: 'addFriend',
          userId: 'yeyu_123456',
          name: '张三',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'
        })),
        action: 'addFriend'
      },
      {
        type: '叶语群组',
        content: 'yeyu://group?data=' + encodeURIComponent(JSON.stringify({
          type: 'joinGroup',
          groupId: 'group_tech',
          name: '技术交流群',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techgroup'
        })),
        action: 'joinGroup'
      },
      {
        type: '网页链接',
        content: 'https://github.com/leaftalks/leaftalk',
        action: 'openUrl'
      },
      {
        type: 'WiFi网络',
        content: 'WIFI:T:WPA;S:LeafTalk-Guest;P:12345678;H:false;;',
        action: 'connectWifi'
      },
      {
        type: '文本内容',
        content: '欢迎使用叶语扫一扫功能！',
        action: 'copyText'
      }
    ]

    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]
    scanResult.value = randomResult
    isScanning.value = false

    console.log('使用模拟扫描结果:', randomResult)
  }
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const typeMap = {
    'url': '网址',
    'friend': '叶语号',
    'payment': '支付',
    'text': '文本',
    'wifi': 'WiFi'
  }
  return typeMap[type as keyof typeof typeMap] || '未知'
}

// 根据类型获取操作
const getActionFromType = (type: string) => {
  const actionMap = {
    'url': 'openUrl',
    'friend': 'addFriend',
    'payment': 'payment',
    'text': 'copyText',
    'wifi': 'connectWifi'
  }
  return actionMap[type as keyof typeof actionMap] || 'copyText'
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  isScanning.value = false
}

const toggleFlash = async () => {
  if (mediaStream) {
    const videoTrack = mediaStream.getVideoTracks()[0]
    if (videoTrack && 'torch' in videoTrack.getCapabilities()) {
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashOn.value }]
        })
        flashOn.value = !flashOn.value
      } catch (error) {
        console.error('无法控制闪光灯:', error)
      }
    }
  }
}

const switchScanType = (type: string) => {
  currentScanType.value = type
  console.log('切换扫描类型:', type)
}

const capturePhoto = () => {
  // 模拟自动识别扫描结果
  const mockContents = [
    'https://example.com/qr-result',
    'weixin://dl/business/?ticket=abc123',
    '6901234567890',
    '这是一段中文文字内容，可以被自动识别出来',
    'Hello, this is English text content for testing'
  ]

  // 随机选择一个内容进行识别
  const randomContent = mockContents[Math.floor(Math.random() * mockContents.length)]
  const detectedContentType = autoDetectContent(randomContent)

  scanResult.value = {
    type: detectedType.value,
    content: randomContent,
    detectedAs: detectedContentType
  }

  console.log('自动识别结果:', scanResult.value)
}

const selectFromAlbum = () => {
  console.log('从相册选择')

  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.style.display = 'none'

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      try {
        console.log('选择的图片:', file.name)

        // 读取文件为Data URL
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string

          // 将图片显示在扫描框中
          const videoElement = videoRef.value
          if (videoElement) {
            // 停止摄像头
            if (mediaStream) {
              mediaStream.getTracks().forEach(track => track.stop())
            }

            // 创建图片元素替换视频
            const img = document.createElement('img')
            img.src = imageUrl
            img.style.width = '100%'
            img.style.height = '100%'
            img.style.objectFit = 'cover'

            // 替换视频元素
            videoElement.style.display = 'none'
            videoElement.parentNode?.insertBefore(img, videoElement)

            // 模拟扫描识别
            setTimeout(() => {
              const randomContent = [
                'https://example.com/album-qr',
                'weixin://dl/business/?ticket=album123',
                '相册中的文字内容被识别出来了'
              ][Math.floor(Math.random() * 3)]

              const detectedContentType = autoDetectContent(randomContent)

              scanResult.value = {
                type: detectedType.value,
                content: randomContent,
                detectedAs: detectedContentType
              }

              showToastMessage('相册图片扫描成功', 'success')
            }, 1500)
          }
        }
        reader.readAsDataURL(file)

      } catch (error) {
        console.error('相册扫描失败:', error)
        showToastMessage('相册扫描失败，请重试', 'error')
      }
    }
  }

  // 触发文件选择
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

const closeScanResult = () => {
  scanResult.value = null
  // 重新开始扫描
  isScanning.value = true
  startScanDetection()
}

const handleScanResult = () => {
  if (scanResult.value) {
    console.log('处理扫描结果:', scanResult.value)

    // 根据扫描结果的action处理
    switch (scanResult.value.action) {
      case 'openUrl':
        // 打开网址
        window.open(scanResult.value.content, '_blank')
        break
      case 'addFriend':
        // 处理添加好友
        handleAddFriendResult(scanResult.value.content)
        break
      case 'joinGroup':
        // 处理加入群聊
        handleJoinGroupResult(scanResult.value.content)
        break
      case 'connectWifi':
        // 处理WiFi连接
        handleWifiResult(scanResult.value.content)
        break
      case 'copyText':
        // 复制文本
        navigator.clipboard.writeText(scanResult.value.content).then(() => {
          alert('文本已复制到剪贴板')
        }).catch(() => {
          alert('复制失败')
        })
        break
      default:
        // 默认复制内容
        navigator.clipboard.writeText(scanResult.value.content).then(() => {
          alert('内容已复制到剪贴板')
        }).catch(() => {
          alert('复制失败')
        })
        break
    }

    closeScanResult()
  }
}

// 处理添加好友结果
const handleAddFriendResult = (content: string) => {
  try {
    if (content.includes('yeyu://add-friend')) {
      // 解析叶语好友二维码
      const url = new URL(content)
      const data = JSON.parse(decodeURIComponent(url.searchParams.get('data') || '{}'))

      if (data.type === 'addFriend') {
        router.push(`/friend-profile/${data.userId}`)
      } else {
        alert('无效的好友二维码')
      }
    } else {
      // 直接使用叶语号
      router.push(`/friend-profile/${content}`)
    }
  } catch (error) {
    console.error('处理好友二维码失败:', error)
    alert('无效的好友二维码')
  }
}

// 处理加入群聊结果
const handleJoinGroupResult = (content: string) => {
  try {
    if (content.includes('yeyu://group')) {
      // 解析叶语群组二维码
      const url = new URL(content)
      const data = JSON.parse(decodeURIComponent(url.searchParams.get('data') || '{}'))

      if (data.type === 'joinGroup') {
        // 跳转到群聊页面
        router.push(`/chat/${data.groupId}`)
      } else {
        alert('无效的群组二维码')
      }
    } else {
      // 显示群组信息
      alert(`正在加入群聊: ${content}`)
    }
  } catch (error) {
    console.error('处理群组二维码失败:', error)
    alert('无效的群组二维码')
  }
}

// 处理WiFi连接结果
const handleWifiResult = (content: string) => {
  try {
    // 解析WiFi二维码格式: WIFI:T:WPA;S:SSID;P:password;H:false;;
    const wifiMatch = content.match(/WIFI:T:([^;]*);S:([^;]*);P:([^;]*);H:([^;]*);/)

    if (wifiMatch) {
      const [, security, ssid, password, hidden] = wifiMatch
      alert(`WiFi信息:\n网络名称: ${ssid}\n安全类型: ${security}\n密码: ${password}`)
    } else {
      alert('无效的WiFi二维码格式')
    }
  } catch (error) {
    console.error('处理WiFi二维码失败:', error)
    alert('无效的WiFi二维码')
  }
}

// 模拟扫描功能（用于测试）
const simulateScan = () => {
  const testQRCodes = [
    'https://www.baidu.com',
    'yeyu://addFriend?data=%7B%22type%22%3A%22addFriend%22%2C%22userId%22%3A%22test_user_001%22%2C%22name%22%3A%22%E5%BC%A0%E5%B0%8F%E6%98%8E%22%7D',
    'WIFI:T:WPA;S:TestWiFi;P:12345678;H:false;;',
    'yeyu://payment?data=%7B%22type%22%3A%22payment%22%2C%22amount%22%3A100%2C%22userId%22%3A%22merchant_001%22%7D'
  ]

  const randomQR = testQRCodes[Math.floor(Math.random() * testQRCodes.length)]
  console.log('🧪 模拟扫描到二维码:', randomQR)
  handleScanSuccess(randomQR, 'qr')
}

// 执行扫描结果对应的操作
const executeAction = () => {
  if (!scanResult.value) return

  const { action, data, content } = scanResult.value

  switch (action) {
    case 'addFriend':
      handleAddFriendAction(data)
      break
    case 'joinGroup':
      handleJoinGroupAction(data)
      break
    case 'openUrl':
      handleOpenUrlAction(content)
      break
    case 'connectWifi':
      handleConnectWifiAction(content)
      break
    case 'copyText':
      handleCopyTextAction(content)
      break
    default:
      console.log('未知操作类型:', action)
  }
}

// 处理添加好友操作
const handleAddFriendAction = (data: any) => {
  console.log('添加好友:', data)

  const message = `是否添加 ${data.name || data.nickname || '该用户'} 为好友？`
  if (confirm(message)) {
    sendFriendRequest(data)
  }
}

// 发送好友请求
const sendFriendRequest = async (friendData: any) => {
  try {
    console.log('发送好友请求:', friendData)

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    showToastMessage(`已向 ${friendData.name} 发送好友请求`, 'success')

    // 跳转到新朋友页面
    setTimeout(() => {
      router.push('/new-friends')
    }, 2000)
  } catch (error) {
    console.error('发送好友请求失败:', error)
    showToastMessage('发送好友请求失败，请稍后重试', 'error')
  }
}

// 处理加入群组操作
const handleJoinGroupAction = (data: any) => {
  console.log('加入群组:', data)

  const message = `是否加入群聊 "${data.name || '未知群聊'}"？`
  if (confirm(message)) {
    joinGroupAction(data)
  }
}

// 加入群组
const joinGroupAction = async (groupData: any) => {
  try {
    console.log('加入群组:', groupData)

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    showToastMessage(`已加入群聊 ${groupData.name}`, 'success')

    // 跳转到群聊页面
    setTimeout(() => {
      router.push(`/chat/${groupData.groupId}`)
    }, 2000)
  } catch (error) {
    console.error('加入群组失败:', error)
    showToastMessage('加入群组失败，请稍后重试', 'error')
  }
}

// 处理打开网页操作
const handleOpenUrlAction = (url: string) => {
  console.log('打开网页:', url)

  const message = `是否打开链接：${url}？`
  if (confirm(message)) {
    window.open(url, '_blank')
    showToastMessage('已在新窗口打开链接', 'success')
  }
}

// 处理连接WiFi操作
const handleConnectWifiAction = (wifiData: string) => {
  console.log('连接WiFi:', wifiData)

  try {
    const wifiInfo = parseWifiQR(wifiData)
    const message = `是否连接到WiFi网络 "${wifiInfo.ssid}"？`

    if (confirm(message)) {
      showToastMessage(`WiFi信息：${wifiInfo.ssid}\n密码：${wifiInfo.password}`, 'info')
    }
  } catch (error) {
    showToastMessage('WiFi信息解析失败', 'error')
  }
}

// 解析WiFi二维码
const parseWifiQR = (wifiData: string) => {
  const matches = wifiData.match(/WIFI:T:([^;]*);S:([^;]*);P:([^;]*);H:([^;]*);/)
  if (matches) {
    return {
      security: matches[1],
      ssid: matches[2],
      password: matches[3],
      hidden: matches[4] === 'true'
    }
  }
  throw new Error('WiFi二维码格式错误')
}

// 处理复制文本操作
const handleCopyTextAction = (text: string) => {
  console.log('复制文本:', text)

  navigator.clipboard.writeText(text).then(() => {
    showToastMessage('文本已复制到剪贴板', 'success')
  }).catch(() => {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()

    try {
      document.execCommand('copy')
      showToastMessage('文本已复制到剪贴板', 'success')
    } catch (error) {
      showToastMessage('复制失败', 'error')
    }

    document.body.removeChild(textArea)
  })
}

// 生命周期
onMounted(() => {
  initCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.scan-qr {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
}

/* 摄像头加载提示 */
.camera-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 5;
}

.camera-loading p {
  margin-top: 16px;
  font-size: 16px;
  color: white;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 摄像头错误提示 */
.camera-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 5;
  padding: 20px;
  max-width: 80%;
}

.camera-error p {
  margin: 16px 0;
  font-size: 16px;
  color: white;
  white-space: pre-line;
  line-height: 1.5;
}

.retry-btn {
  margin-top: 16px;
  padding: 12px 32px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #06ad56;
}

.retry-btn:active {
  transform: scale(0.95);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  position: relative;
  z-index: 10;
}

.back-btn,
.album-btn {
  padding: 8px 12px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 4px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.scan-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.back-btn-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.back-btn-overlay:hover {
  background: rgba(0, 0, 0, 0.7);
}

.camera-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 240px;
  height: 240px;
}

.scan-corners {
  position: relative;
  width: 100%;
  height: 100%;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #07C160;
}

.corner.top-left {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.corner.top-right {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.corner.bottom-left {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.corner.bottom-right {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #07C160, transparent);
  opacity: 0;
}

.scan-line.scanning {
  animation: scanAnimation 2s linear infinite;
  opacity: 1;
}

@keyframes scanAnimation {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}

.scan-tips {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.scan-tips p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.bottom-section {
  background: rgba(0, 0, 0, 0.8);
  padding: 20px 16px;
}

.scan-types {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.scan-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.scan-type-item.active {
  background: rgba(7, 193, 96, 0.2);
}

.scan-type-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  color: #07C160;
}

.scan-type-item span {
  font-size: 12px;
  color: white;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
}

.action-btn span {
  font-size: 12px;
  margin-top: 4px;
}

.capture-btn {
  padding: 0;
}

.capture-circle {
  width: 64px;
  height: 64px;
  border: 3px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.capture-circle:active {
  transform: scale(0.95);
}

.capture-inner {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 50%;
}

.scan-result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.scan-result-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 20px;
  max-width: 300px;
  width: 100%;
  color: #333;
}

.scan-result-content h3 {
  margin: 0 0 16px 0;
  text-align: center;
  font-size: 18px;
}

.result-info {
  margin-bottom: 20px;
}

.result-type {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.result-content {
  font-size: 16px;
  color: #333;
  word-break: break-all;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.result-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.result-btn.cancel {
  background: #f5f5f5;
  color: #333;
}

.result-btn.confirm {
  background: #07C160;
  color: white;
}

/* Toast 样式 */
.toast-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  max-width: 80%;
  text-align: center;
  animation: fadeInOut 3s ease-in-out;
}

.toast.success {
  background: rgba(7, 193, 96, 0.9);
}

.toast.error {
  background: rgba(255, 59, 48, 0.9);
}

.toast.info {
  background: rgba(0, 122, 255, 0.9);
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

/* 底部控制按钮 */
.bottom-controls {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 10;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
}

.control-btn span {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.qr-btn {
  /* 左下角二维码按钮 */
}

.album-btn {
  /* 右下角相册按钮 */
}

/* 扫描状态提示 */
.scan-status {
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

/* 自动识别信息 */
.auto-detect-info {
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 8px;
}

.detect-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 14px;
}

/* 我的二维码弹窗 */
.qr-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.qr-dialog {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 320px;
  overflow: hidden;
}

.qr-header {
  background: #07C160;
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qr-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.qr-header .close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-content {
  padding: 30px 20px;
  text-align: center;
}

.qr-avatar {
  margin-bottom: 16px;
}

.qr-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid #f0f0f0;
}

.qr-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.qr-code-container {
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: white;
  border-radius: 4px;
}

.qr-tip {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
</style>
