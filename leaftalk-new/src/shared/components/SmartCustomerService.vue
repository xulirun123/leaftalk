<template>
  <div class="smart-customer-service">
    <!-- 客服聊天界面 -->
    <div class="service-chat">
      <div class="chat-header">
        <div class="service-info">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=service" alt="智能客服" class="service-avatar">
          <div class="service-details">
            <h3>叶语智能客服</h3>
            <span class="service-status">在线服务</span>
          </div>
        </div>
        <div class="service-actions">
          <button class="action-btn" @click="transferToHuman" title="转人工客服">
            <iconify-icon icon="heroicons:user" width="20"></iconify-icon>
          </button>
          <button class="action-btn" @click="closeService" title="结束对话">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <!-- 欢迎消息 -->
        <div class="message service-message">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=service" alt="客服" class="message-avatar">
          <div class="message-content">
            <div class="message-bubble">
              <p>您好！我是叶语智能客服，很高兴为您服务。</p>
              <p>您可以询问关于叶语企业版的任何问题，我会尽力为您解答。</p>
            </div>
            <span class="message-time">{{ formatTime(Date.now()) }}</span>
          </div>
        </div>

        <!-- 快捷问题 -->
        <div class="quick-questions" v-if="showQuickQuestions">
          <div class="quick-title">常见问题：</div>
          <div class="quick-buttons">
            <button 
              v-for="question in quickQuestions" 
              :key="question.id"
              class="quick-btn"
              @click="askQuestion(question.text)"
            >
              {{ question.text }}
            </button>
          </div>
        </div>

        <!-- 聊天消息 -->
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.type === 'user' ? 'user-message' : 'service-message']"
        >
          <img 
            :src="message.type === 'user' ? userAvatar : serviceAvatar" 
            :alt="message.type === 'user' ? '用户' : '客服'" 
            class="message-avatar"
          >
          <div class="message-content">
            <div class="message-bubble">
              <p v-html="message.content"></p>
              
              <!-- 建议操作 -->
              <div v-if="message.suggestions && message.suggestions.length > 0" class="message-suggestions">
                <button 
                  v-for="suggestion in message.suggestions" 
                  :key="suggestion"
                  class="suggestion-btn"
                  @click="askQuestion(suggestion)"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
        </div>

        <!-- 正在输入指示器 -->
        <div v-if="isTyping" class="message service-message typing-indicator">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=service" alt="客服" class="message-avatar">
          <div class="message-content">
            <div class="message-bubble">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <div class="input-container">
          <input 
            v-model="inputText"
            type="text" 
            placeholder="请输入您的问题..."
            @keyup.enter="sendMessage"
            :disabled="isTyping"
            class="input-field"
          >
          <button 
            @click="sendMessage" 
            :disabled="!inputText.trim() || isTyping"
            class="send-btn"
          >
            <iconify-icon icon="heroicons:paper-airplane" width="20"></iconify-icon>
          </button>
        </div>
        
        <!-- 满意度评价 -->
        <div v-if="showRating" class="rating-section">
          <span class="rating-label">请为本次服务评分：</span>
          <div class="rating-stars">
            <button 
              v-for="star in 5" 
              :key="star"
              :class="['star-btn', { active: star <= rating }]"
              @click="setRating(star)"
            >
              ⭐
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 转人工客服对话框 -->
    <div v-if="showTransferDialog" class="dialog-overlay" @click="showTransferDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>转接人工客服</h3>
          <button class="dialog-close" @click="showTransferDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <p>当前有 {{ humanServiceQueue }} 位用户在排队等待人工客服</p>
          <p>预计等待时间：{{ estimatedWaitTime }} 分钟</p>
          <div class="form-group">
            <label>请简述您的问题：</label>
            <textarea v-model="transferReason" placeholder="请描述您需要人工客服协助的具体问题..."></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showTransferDialog = false">取消</button>
          <button class="btn-primary" @click="confirmTransfer">确认转接</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from './stores/authStore'
import { smartCustomerService } from '../services/smartCustomerService'

interface Message {
  id: string
  type: 'user' | 'service'
  content: string
  timestamp: number
  suggestions?: string[]
}

interface QuickQuestion {
  id: string
  text: string
  category: string
}

const authStore = useAuthStore()

// 响应式数据
const messages = ref<Message[]>([])
const inputText = ref('')
const isTyping = ref(false)
const showQuickQuestions = ref(true)
const showTransferDialog = ref(false)
const showRating = ref(false)
const rating = ref(0)
const transferReason = ref('')
const messagesContainer = ref<HTMLElement>()

// 用户信息
const userAvatar = computed(() => authStore.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user')
const serviceAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=service'

// 人工客服状态
const humanServiceQueue = ref(3)
const estimatedWaitTime = ref(5)

// 快捷问题
const quickQuestions: QuickQuestion[] = [
  { id: '1', text: '如何添加好友？', category: 'basic' },
  { id: '2', text: '如何发送红包？', category: 'payment' },
  { id: '3', text: '如何创建群聊？', category: 'group' },
  { id: '4', text: '忘记密码怎么办？', category: 'account' },
  { id: '5', text: '如何设置隐私权限？', category: 'privacy' },
  { id: '6', text: '文件上传失败怎么办？', category: 'technical' }
]

// 方法
const sendMessage = async () => {
  if (!inputText.value.trim()) return

  const userMessage: Message = {
    id: `msg_${Date.now()}`,
    type: 'user',
    content: inputText.value,
    timestamp: Date.now()
  }

  messages.value.push(userMessage)
  const question = inputText.value
  inputText.value = ''
  showQuickQuestions.value = false

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 显示正在输入
  isTyping.value = true

  try {
    // 调用智能客服API
    const response = await smartCustomerService.getResponse(question, {
      userId: authStore.user?.id,
      conversationHistory: messages.value.slice(-5) // 最近5条消息作为上下文
    })

    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const serviceMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'service',
      content: response.answer,
      timestamp: Date.now(),
      suggestions: response.suggestions
    }

    messages.value.push(serviceMessage)

    // 如果置信度低，建议转人工
    if (response.confidence < 0.7) {
      setTimeout(() => {
        const transferSuggestion: Message = {
          id: `msg_${Date.now()}_transfer`,
          type: 'service',
          content: '如果我的回答没有解决您的问题，您可以选择转接人工客服获得更专业的帮助。',
          timestamp: Date.now(),
          suggestions: ['转接人工客服']
        }
        messages.value.push(transferSuggestion)
        scrollToBottom()
      }, 1000)
    }

  } catch (error) {
    console.error('智能客服响应失败:', error)
    
    const errorMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'service',
      content: '抱歉，我现在遇到了一些技术问题。请稍后再试，或者选择转接人工客服。',
      timestamp: Date.now(),
      suggestions: ['转接人工客服', '重新提问']
    }

    messages.value.push(errorMessage)
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()
  }
}

const askQuestion = (question: string) => {
  inputText.value = question
  sendMessage()
}

const transferToHuman = () => {
  showTransferDialog.value = true
}

const confirmTransfer = () => {
  showTransferDialog.value = false
  
  const transferMessage: Message = {
    id: `msg_${Date.now()}`,
    type: 'service',
    content: `已为您申请人工客服，当前排队人数：${humanServiceQueue.value}，预计等待时间：${estimatedWaitTime.value}分钟。请耐心等待，我们会尽快为您安排客服人员。`,
    timestamp: Date.now()
  }

  messages.value.push(transferMessage)
  scrollToBottom()
  
  // 显示评价
  setTimeout(() => {
    showRating.value = true
  }, 2000)
}

const setRating = (star: number) => {
  rating.value = star
  
  const ratingMessage: Message = {
    id: `msg_${Date.now()}`,
    type: 'service',
    content: `感谢您的${star}星评价！您的反馈对我们很重要，我们会持续改进服务质量。`,
    timestamp: Date.now()
  }

  messages.value.push(ratingMessage)
  showRating.value = false
  scrollToBottom()
}

const closeService = () => {
  // 发送关闭事件给父组件
  emit('close')
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 事件
const emit = defineEmits<{
  close: []
}>()

// 生命周期
onMounted(() => {
  // 初始化智能客服
  smartCustomerService.initialize()
})
</script>
