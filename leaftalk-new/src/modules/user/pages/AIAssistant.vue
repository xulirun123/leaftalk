<template>
  <div class="ai-assistant">
    <!-- 顶部导航栏 -->
    <MobileTopBar 
      :title="$t('discover.aiAssistant')"
      :show-back="true"
      @back="goBack"
    />

    <!-- 聊天区域 -->
    <div class="chat-container" ref="chatContainer">
      <div class="messages-list">
        <!-- 欢迎消息 -->
        <div v-if="messages && messages.length === 0" class="welcome-message">
          <div class="ai-avatar">
            <iconify-icon icon="heroicons:sparkles" width="32" style="color: #667eea;" />
          </div>
          <div class="welcome-text">
            <h3>你好！我是叶语AI智能助手</h3>
            <p>我具备智能体能力，可以执行复杂任务</p>
          </div>

          <!-- 功能介绍 -->
          <div class="feature-grid">
            <div class="feature-category">
              <h4>🤖 智能对话</h4>
              <div class="feature-list">
                <div class="feature-item">
                  <iconify-icon icon="heroicons:language" width="14" />
                  <span>翻译文本</span>
                </div>
                <div class="feature-item">
                  <iconify-icon icon="heroicons:cloud-sun" width="14" />
                  <span>查询天气</span>
                </div>
                <div class="feature-item">
                  <iconify-icon icon="heroicons:calculator" width="14" />
                  <span>数学计算</span>
                </div>
              </div>
            </div>

            <div class="feature-category">
              <h4>🎯 智能操作</h4>
              <div class="feature-list">
                <div class="feature-item">
                  <iconify-icon icon="heroicons:arrow-top-right-on-square" width="14" />
                  <span>快速跳转</span>
                </div>
                <div class="feature-item">
                  <iconify-icon icon="heroicons:chart-bar" width="14" />
                  <span>数据查询</span>
                </div>
                <div class="feature-item">
                  <iconify-icon icon="heroicons:cog-6-tooth" width="14" />
                  <span>设置管理</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <button class="quick-btn" @click="sendQuickMessage('叶语功能介绍')">
              <iconify-icon icon="heroicons:information-circle" width="16" />
              功能介绍
            </button>
            <button class="quick-btn" @click="sendQuickMessage('打开聊天')">
              <iconify-icon icon="heroicons:chat-bubble-left-right" width="16" />
              打开聊天
            </button>
            <button class="quick-btn" @click="sendQuickMessage('查看数据')">
              <iconify-icon icon="heroicons:chart-pie" width="16" />
              查看数据
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div 
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }"
        >
          <div class="message-avatar">
            <img v-if="message.isUser" :src="userAvatar" alt="User" />
            <div v-else class="ai-avatar-small">
              <iconify-icon icon="heroicons:cpu-chip" width="20" style="color: #667eea;" />
            </div>
          </div>
          
          <div class="message-content">
            <div class="message-bubble">
              <div v-if="message.type === 'text'" class="message-text">
                {{ message.content }}
              </div>
              
              <div v-else-if="message.type === 'typing'" class="typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              
              <div v-else-if="message.type === 'suggestions'" class="suggestions">
                <div class="suggestion-text">{{ message.content }}</div>
                <div class="suggestion-buttons">
                  <button
                    v-for="suggestion in (message.suggestions || [])"
                    :key="suggestion"
                    class="suggestion-btn"
                    @click="sendMessage(suggestion)"
                  >
                    {{ suggestion }}
                  </button>
                </div>
              </div>
            </div>
            
            <div class="message-time">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-container">
        <button class="voice-btn" @click="toggleVoiceInput">
          <iconify-icon 
            :icon="isVoiceMode ? 'heroicons:keyboard' : 'heroicons:microphone'" 
            width="20" 
            style="color: #666;" 
          />
        </button>
        
        <div v-if="!isVoiceMode" class="text-input-wrapper">
          <textarea
            v-model="inputText"
            :placeholder="$t('ai.inputPlaceholder')"
            class="message-input"
            rows="1"
            @keydown="handleKeyDown"
            @input="adjustTextareaHeight"
            ref="textInput"
          ></textarea>
        </div>
        
        <div v-else class="voice-input-wrapper">
          <button 
            class="voice-record-btn"
            :class="{ recording: isRecording }"
            @touchstart="startVoiceRecording"
            @touchend="stopVoiceRecording"
            @mousedown="startVoiceRecording"
            @mouseup="stopVoiceRecording"
          >
            <iconify-icon 
              icon="heroicons:microphone" 
              width="24" 
              :style="{ color: isRecording ? '#ff4444' : '#07c160' }" 
            />
          </button>
        </div>
        
        <button 
          class="send-btn"
          :disabled="!canSend"
          @click="sendMessage()"
        >
          <iconify-icon icon="heroicons:paper-airplane" width="20" style="color: white;" />
        </button>
      </div>
    </div>

    <!-- 语音录制提示 -->
    <div v-if="isRecording" class="voice-recording-overlay">
      <div class="recording-modal">
        <div class="recording-animation">
          <iconify-icon icon="heroicons:microphone" width="32" style="color: white;" />
        </div>
        <div class="recording-text">{{ $t('ai.recording') }}</div>
        <div class="recording-hint">{{ $t('ai.releaseToSend') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSafeNavigation } from '../../../shared/utils/safeNavigation'
// import { useI18n } from '../../../shared/composables/useI18n'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import { useChatStore } from '../chat/stores/chatStore'
import { useVideoStore } from '../../stores/video'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

const router = useRouter()
const { safeBack, safePush } = useSafeNavigation()
// 使用全局翻译函数 $t
const authStore = useAuthStore()
const appStore = useAppStore()
const chatStore = useChatStore()
const videoStore = useVideoStore()

// 响应式数据
const messages = ref<any[]>([])
const inputText = ref('')
const isVoiceMode = ref(false)
const isRecording = ref(false)
const isTyping = ref(false)
const chatContainer = ref<HTMLElement>()
const textInput = ref<HTMLTextAreaElement>()

// 用户头像
const userAvatar = computed(() => {
  return authStore.user?.avatar || generateAvatar(authStore.user?.name || '用户')
})

// 是否可以发送
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !isTyping.value
})

// 快捷操作
const quickActions = ref([
  {
    id: 'translate',
    label: '翻译',
    message: '请帮我翻译以下内容',
    icon: 'heroicons:language',
    color: '#07c160'
  },
  {
    id: 'weather',
    label: '天气',
    message: '今天的天气怎么样？',
    icon: 'heroicons:sun',
    color: '#faad14'
  },
  {
    id: 'schedule',
    label: '日程',
    message: '帮我安排今天的日程',
    icon: 'heroicons:calendar',
    color: '#1890ff'
  },
  {
    id: 'help',
    label: '帮助',
    message: '我需要一些帮助',
    icon: 'heroicons:question-mark-circle',
    color: '#722ed1'
  }
])

// 方法
const goBack = () => {
  // 确保返回到发现页面
  safeBack('/mobile/discover')
}

// 生成头像
const generateAvatar = (name: string) => {
  const colors = ['#07C160', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7']
  const color = colors[name.length % colors.length]
  const initial = name.charAt(0)
  const svgContent = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${color}"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="14">${initial}</text></svg>`)
  return `data:image/svg+xml,${svgContent}`
}

// 发送消息
const sendMessage = async (text?: string) => {
  const messageText = text || inputText.value.trim()
  if (!messageText) return

  // 添加用户消息
  const userMessage = {
    id: Date.now(),
    content: messageText,
    isUser: true,
    type: 'text',
    timestamp: Date.now()
  }
  messages.value.push(userMessage)

  // 清空输入
  inputText.value = ''
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 显示AI正在输入
  showTypingIndicator()

  // 模拟AI回复
  setTimeout(() => {
    hideTypingIndicator()
    addAIResponse(messageText)
  }, 1500)
}

// 发送快捷消息
const sendQuickMessage = (message: string) => {
  sendMessage(message)
}

// 显示输入指示器
const showTypingIndicator = () => {
  isTyping.value = true
  const typingMessage = {
    id: Date.now() + 1,
    content: '',
    isUser: false,
    type: 'typing',
    timestamp: Date.now()
  }
  messages.value.push(typingMessage)
  scrollToBottom()
}

// 隐藏输入指示器
const hideTypingIndicator = () => {
  isTyping.value = false
  messages.value = messages.value.filter(msg => msg.type !== 'typing')
}

// 智能AI回复系统
const addAIResponse = (userMessage: string) => {
  let response = ''
  let suggestions: string[] = []

  // 获取聊天历史上下文（用于连续对话）
  const recentMessages = messages.value.slice(-6).filter(msg => msg.type !== 'typing')
  const context = recentMessages.map(msg => msg.content).join(' ')

  // 主要基于当前用户消息进行智能回复
  const message = userMessage.toLowerCase()

  // 翻译功能
  if (message.includes('翻译') || message.includes('translate')) {
    // 检测具体翻译内容
    if (message.includes('hello') || message.includes('thank you') || message.includes('goodbye')) {
      const translations = {
        'hello': '你好',
        'thank you': '谢谢',
        'goodbye': '再见',
        'how are you': '你好吗',
        'good morning': '早上好',
        'good night': '晚安'
      }

      let translatedText = ''
      Object.keys(translations).forEach(key => {
        if (message.includes(key)) {
          translatedText = translations[key as keyof typeof translations]
        }
      })

      if (translatedText) {
        response = `翻译结果：${translatedText}`
        suggestions = ['继续翻译', '翻译其他内容', '语言学习']
      } else {
        response = '请提供需要翻译的英文内容，我来帮您翻译成中文。'
        suggestions = ['Hello', 'Thank you', 'How are you']
      }
    } else if (message.includes('你好') || message.includes('谢谢') || message.includes('再见')) {
      const translations = {
        '你好': 'Hello',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '早上好': 'Good morning',
        '晚安': 'Good night',
        '对不起': 'Sorry'
      }

      let translatedText = ''
      Object.keys(translations).forEach(key => {
        if (message.includes(key)) {
          translatedText = translations[key as keyof typeof translations]
        }
      })

      if (translatedText) {
        response = `Translation: ${translatedText}`
        suggestions = ['继续翻译', '学习更多', '语法解释']
      } else {
        response = '请提供需要翻译的中文内容，我来帮您翻译成英文。'
        suggestions = ['翻译：你好', '翻译：谢谢', '翻译：再见']
      }
    } else {
      response = '我可以帮您进行中英文互译。请直接发送需要翻译的内容，或者说"翻译：[内容]"。'
      suggestions = ['翻译：Hello', '翻译：你好', '翻译技巧']
    }
  }

  // 天气查询
  else if (message.includes('天气') || message.includes('weather')) {
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '南京', '武汉', '重庆']
    const mentionedCity = cities.find(city => message.includes(city))

    if (mentionedCity) {
      const weatherData = {
        temperature: Math.floor(Math.random() * 15) + 15, // 15-30度
        condition: ['晴朗', '多云', '小雨', '阴天'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        wind: ['微风', '小风', '中风'][Math.floor(Math.random() * 3)]
      }

      response = `${mentionedCity}今天天气${weatherData.condition}，气温${weatherData.temperature}°C，湿度${weatherData.humidity}%，${weatherData.wind}。\n\n建议：${weatherData.condition === '小雨' ? '记得带伞' : weatherData.temperature > 25 ? '注意防晒' : '适合外出活动'}。`
      suggestions = [`${mentionedCity}明天天气`, `${mentionedCity}一周预报`, '其他城市']
    } else {
      response = '请告诉我您想查询哪个城市的天气，我来为您提供详细的天气信息。'
      suggestions = ['北京天气', '上海天气', '广州天气', '当前位置天气']
    }
  }

  // 时间和日程
  else if (message.includes('时间') || message.includes('日程') || message.includes('安排')) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false })
    const dateStr = now.toLocaleDateString('zh-CN')

    if (message.includes('现在') || message.includes('当前')) {
      response = `现在时间：${dateStr} ${timeStr}\n\n今天是${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]}，${now.getHours() < 12 ? '上午' : now.getHours() < 18 ? '下午' : '晚上'}好！`
      suggestions = ['查看日程', '添加提醒', '设置闹钟']
    } else if (message.includes('添加') || message.includes('新增')) {
      response = '我来帮您添加日程安排。请告诉我：\n📅 日期和时间\n📝 事件内容\n📍 地点（可选）\n⏰ 提醒时间（可选）'
      suggestions = ['明天9点会议', '下周五聚餐', '每天8点运动']
    } else {
      response = '我可以帮您管理时间和日程。您想要查看当前时间、添加新日程，还是查看已有安排？'
      suggestions = ['查看当前时间', '添加新日程', '查看今日安排']
    }
  }

  // 叶语功能介绍
  else if (message.includes('叶语') || message.includes('功能') || message.includes('怎么用')) {
    if (message.includes('聊天')) {
      response = '叶语聊天功能：\n💬 文字、语音、图片消息\n📞 语音和视频通话\n📍 位置共享\n🎁 表情和贴纸\n🔄 消息撤回和转发\n🔇 消息静音和置顶'
      suggestions = ['发起通话', '分享位置', '发送表情', '消息设置']
    } else if (message.includes('红包') || message.includes('转账')) {
      response = '叶语支付功能：\n🧧 发送红包（普通/拼手气）\n💸 转账给好友\n🔐 支付密码保护\n📊 交易记录查询\n💰 叶语豆和钱包系统'
      suggestions = ['发红包教程', '转账步骤', '设置支付密码', '查看余额']
    } else if (message.includes('朋友圈')) {
      response = '叶语朋友圈功能：\n📸 发布图片和文字\n❤️ 点赞和评论\n🔒 隐私设置\n📍 位置标记\n👥 @好友功能\n🕐 动态时间线'
      suggestions = ['发布动态', '查看朋友圈', '隐私设置', '互动技巧']
    } else {
      response = '叶语主要功能：\n💬 即时聊天通讯\n👥 联系人管理\n🧧 红包转账支付\n📱 朋友圈社交\n🎥 视频号创作\n📍 位置服务\n🤖 AI智能助手\n🎮 小程序游戏'
      suggestions = ['聊天功能', '支付功能', '朋友圈', '视频号']
    }
  }

  // 计算和数学
  else if (message.includes('计算') || message.includes('算') || /\d+[\+\-\*\/]\d+/.test(message)) {
    const mathMatch = message.match(/(\d+)\s*[\+\-\*\/]\s*(\d+)/)
    if (mathMatch) {
      const num1 = parseInt(mathMatch[1])
      const num2 = parseInt(mathMatch[2])
      const operator = message.match(/[\+\-\*\/]/)?.[0]

      let result = 0
      let operation = ''

      switch (operator) {
        case '+':
          result = num1 + num2
          operation = '加法'
          break
        case '-':
          result = num1 - num2
          operation = '减法'
          break
        case '*':
          result = num1 * num2
          operation = '乘法'
          break
        case '/':
          result = num2 !== 0 ? num1 / num2 : NaN
          operation = '除法'
          break
      }

      if (!isNaN(result)) {
        response = `计算结果：${num1} ${operator} ${num2} = ${result}\n\n${operation}运算完成！还需要计算其他内容吗？`
        suggestions = ['继续计算', '科学计算', '单位换算']
      } else {
        response = '除数不能为零哦！请重新输入计算表达式。'
        suggestions = ['10 + 5', '20 - 8', '6 * 7']
      }
    } else {
      response = '我可以帮您进行基本的数学计算。请输入算式，例如：10 + 5 或者 20 * 3'
      suggestions = ['10 + 5', '100 - 25', '8 * 9', '36 / 6']
    }
  }

  // 问候语
  else if (message.includes('你好') || message.includes('hello') || message.includes('hi')) {
    const hour = new Date().getHours()
    let greeting = ''
    let timeAdvice = ''

    if (hour < 6) {
      greeting = '深夜好'
      timeAdvice = '这么晚还没休息，注意身体哦！'
    } else if (hour < 12) {
      greeting = '早上好'
      timeAdvice = '新的一天开始了，祝您今天愉快！'
    } else if (hour < 14) {
      greeting = '中午好'
      timeAdvice = '午餐时间到了，记得好好吃饭！'
    } else if (hour < 18) {
      greeting = '下午好'
      timeAdvice = '下午时光，适合处理重要事务。'
    } else if (hour < 22) {
      greeting = '晚上好'
      timeAdvice = '晚上时光，可以放松一下了。'
    } else {
      greeting = '夜深了'
      timeAdvice = '夜深了，早点休息对身体好哦！'
    }

    response = `${greeting}！我是叶语AI助手，很高兴为您服务。${timeAdvice}\n\n有什么我可以帮助您的吗？`
    suggestions = ['叶语功能介绍', '今天天气', '当前时间', '使用帮助']
  }

  // 智能体功能 - 执行具体操作
  else if (message.includes('打开') || message.includes('跳转') || message.includes('进入')) {
    if (message.includes('聊天') || message.includes('消息')) {
      response = '正在为您打开聊天页面...'
      suggestions = ['查看聊天列表', '发送消息', '语音通话']
      // 执行跳转操作
      setTimeout(() => {
        safePush('/mobile/home')
      }, 1000)
    } else if (message.includes('朋友圈')) {
      response = '正在为您打开朋友圈...'
      suggestions = ['查看动态', '发布朋友圈', '点赞评论']
      setTimeout(() => {
        safePush('/moments')
      }, 1000)
    } else if (message.includes('视频号')) {
      response = '正在为您打开视频号...'
      suggestions = ['观看视频', '发布视频', '我的视频']
      setTimeout(() => {
        safePush('/my-video-channel')
      }, 1000)
    } else if (message.includes('直播')) {
      response = '正在为您打开直播大厅...'
      suggestions = ['观看直播', '开始直播', '直播设置']
      setTimeout(() => {
        safePush('/douyin-live')
      }, 1000)
    } else {
      response = '请告诉我您想打开哪个功能页面，我可以帮您快速跳转到：\n• 聊天页面\n• 朋友圈\n• 视频号\n• 直播大厅\n• 联系人\n• 发现页面'
      suggestions = ['打开聊天', '打开朋友圈', '打开视频号', '打开直播']
    }
  }

  // 数据查询智能体
  else if (message.includes('查看') || message.includes('统计') || message.includes('数据')) {
    if (message.includes('聊天') || message.includes('消息')) {
      const chatCount = chatStore.chats.length
      const messageCount = chatStore.messages.length
      response = `您的聊天数据统计：\n💬 聊天会话：${chatCount} 个\n📝 消息总数：${messageCount} 条\n📊 今日活跃度：${Math.floor(Math.random() * 50 + 10)}%`
      suggestions = ['查看聊天记录', '清理聊天', '导出数据']
    } else if (message.includes('视频')) {
      const videoCount = videoStore.totalVideos
      const totalViews = videoStore.totalViews
      const totalLikes = videoStore.totalLikes
      response = `您的视频数据统计：\n🎥 视频总数：${videoCount} 个\n👀 总播放量：${totalViews} 次\n❤️ 总点赞数：${totalLikes} 个\n📈 平均播放：${videoCount > 0 ? Math.floor(totalViews / videoCount) : 0} 次/视频`
      suggestions = ['查看视频', '发布新视频', '数据分析']
    } else {
      response = '我可以为您查看以下数据：\n📊 聊天统计\n🎥 视频数据\n👥 好友信息\n💰 钱包余额\n📱 使用情况'
      suggestions = ['查看聊天数据', '查看视频数据', '查看好友', '查看钱包']
    }
  }

  // 操作执行智能体
  else if (message.includes('发送') || message.includes('创建') || message.includes('新建')) {
    if (message.includes('消息') || message.includes('聊天')) {
      response = '我可以帮您快速发送消息。请告诉我：\n👤 发送给谁\n💬 消息内容\n\n例如："发送消息给张三：你好"'
      suggestions = ['发送给好友', '群发消息', '定时发送']
    } else if (message.includes('朋友圈') || message.includes('动态')) {
      response = '正在为您打开朋友圈发布页面...'
      suggestions = ['拍照发布', '选择图片', '纯文字动态']
      setTimeout(() => {
        safePush('/moments/new')
      }, 1000)
    } else if (message.includes('视频')) {
      response = '正在为您打开视频发布页面...'
      suggestions = ['录制视频', '选择本地视频', '视频编辑']
      setTimeout(() => {
        safePush('/video-publish')
      }, 1000)
    } else {
      response = '我可以帮您创建：\n📝 新消息\n📱 朋友圈动态\n🎥 视频内容\n📅 日程安排\n🧧 红包转账'
      suggestions = ['发送消息', '发布朋友圈', '发布视频', '创建日程']
    }
  }

  // 设置管理智能体
  else if (message.includes('设置') || message.includes('配置') || message.includes('修改')) {
    if (message.includes('头像')) {
      response = '头像设置功能：\n📸 拍照设置头像\n🖼️ 从相册选择\n🎨 使用默认头像\n✂️ 裁剪和编辑'
      suggestions = ['拍照设置', '选择图片', '默认头像']
    } else if (message.includes('昵称') || message.includes('名字')) {
      response = '昵称修改功能：\n✏️ 修改显示昵称\n🆔 修改叶语ID\n🔒 隐私设置\n📝 个性签名'
      suggestions = ['修改昵称', '修改ID', '隐私设置']
    } else if (message.includes('密码')) {
      response = '密码安全设置：\n🔐 修改登录密码\n💰 设置支付密码\n🔒 启用指纹解锁\n📱 设备管理'
      suggestions = ['修改密码', '支付密码', '指纹解锁']
    } else {
      response = '设置管理功能：\n👤 个人信息设置\n🔔 消息通知设置\n🔒 隐私安全设置\n🎨 主题外观设置\n📱 应用偏好设置'
      suggestions = ['个人设置', '通知设置', '隐私设置', '主题设置']
    }
  }

  // 默认智能回复
  else {
    // 分析用户消息的关键词
    const keywords = {
      '问题': '我来帮您解决问题',
      '帮助': '我很乐意为您提供帮助',
      '谢谢': '不客气！很高兴能帮到您',
      '再见': '再见！随时欢迎您回来',
      '不会': '没关系，我来教您',
      '学习': '学习是很好的习惯',
      '工作': '工作加油！有什么需要协助的吗',
      '生活': '生活中有什么需要帮助的吗'
    }

    let foundKeyword = false
    for (const [keyword, reply] of Object.entries(keywords)) {
      if (message.includes(keyword)) {
        response = `${reply}！请告诉我具体需要什么帮助，我会尽力为您解答。`
        foundKeyword = true
        break
      }
    }

    if (!foundKeyword) {
      // 根据消息长度和复杂度给出不同回复
      if (userMessage.length > 50) {
        response = '您的问题很详细，我正在分析中。虽然我可能无法完全理解所有细节，但我会尽力为您提供有用的建议。请问您最希望我帮您解决什么问题？'
      } else if (userMessage.length > 20) {
        response = '我理解您的问题。作为AI助手，我可以在翻译、天气查询、时间管理、叶语功能介绍等方面为您提供帮助。请告诉我您具体需要什么服务？'
      } else {
        response = '我在这里为您服务！您可以问我关于叶语功能、天气查询、翻译、时间安排等问题，我会尽力帮助您。'
      }
    }

    suggestions = ['叶语功能', '翻译文本', '查询天气', '时间管理', '计算器', '使用帮助']
  }

  const aiMessage = {
    id: Date.now() + 2,
    content: response,
    isUser: false,
    type: (suggestions && suggestions.length > 0) ? 'suggestions' : 'text',
    suggestions: suggestions || [],
    timestamp: Date.now()
  }

  messages.value.push(aiMessage)
  scrollToBottom()
}

// 切换语音输入模式
const toggleVoiceInput = () => {
  isVoiceMode.value = !isVoiceMode.value
}

// 开始语音录制
const startVoiceRecording = () => {
  isRecording.value = true
  // 这里应该启动语音识别
}

// 停止语音录制
const stopVoiceRecording = () => {
  isRecording.value = false
  // 这里应该停止语音识别并处理结果
  // 模拟语音识别结果
  setTimeout(() => {
    const voiceText = '这是语音识别的结果'
    sendMessage(voiceText)
  }, 500)
}

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 调整文本框高度
const adjustTextareaHeight = () => {
  if (textInput.value) {
    textInput.value.style.height = 'auto'
    textInput.value.style.height = Math.min(textInput.value.scrollHeight, 120) + 'px'
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

onMounted(() => {
  // 初始化时聚焦输入框
  if (textInput.value) {
    textInput.value.focus()
  }
})
</script>

<style scoped>
.ai-assistant {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f8f8;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
}

.ai-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.welcome-text h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.welcome-text p {
  margin: 0 0 30px 0;
  color: #666;
  line-height: 1.5;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 300px;
  margin: 0 auto;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.quick-action span {
  margin-top: 8px;
  font-size: 14px;
  color: #333;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  margin: 0 8px;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.ai-avatar-small {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.user-message .message-content {
  text-align: right;
}

.message-bubble {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
}

.user-message .message-bubble {
  background: #07c160;
  color: white;
}

.message-text {
  line-height: 1.4;
  white-space: pre-wrap;
}

.typing-indicator {
  display: flex;
  align-items: center;
  height: 20px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #ccc;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.suggestions {
  text-align: left;
}

.suggestion-text {
  margin-bottom: 12px;
  line-height: 1.4;
}

.suggestion-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  padding: 6px 12px;
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-btn:hover {
  background: #e0e0e0;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.user-message .message-time {
  text-align: right;
}

.input-area {
  background: white;
  border-top: 1px solid #e5e5e5;
  padding: 12px 16px;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.voice-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.text-input-wrapper {
  flex: 1;
}

.message-input {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 16px;
  resize: none;
  outline: none;
  max-height: 120px;
  min-height: 36px;
}

.voice-input-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
}

.voice-record-btn {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.voice-record-btn.recording {
  background: #ff4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.voice-recording-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.recording-modal {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  color: white;
}

.recording-animation {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: wave 1.5s infinite;
}

@keyframes wave {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0.3;
  }
}

.recording-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.recording-hint {
  font-size: 14px;
  opacity: 0.8;
}

/* 智能体功能样式 */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 20px 0;
}

.feature-category {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
}

.feature-category h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
  text-align: center;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.feature-item iconify-icon {
  flex-shrink: 0;
}

/* 快捷操作按钮 */
.quick-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 500;
}

.quick-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.quick-btn iconify-icon {
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .quick-actions {
    flex-direction: column;
    align-items: center;
  }

  .quick-btn {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }
}
</style>
