<template>
  <div class="ai-chat">
    <!-- 顶部导航 -->
    <div class="chat-header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      
      <div class="header-info" @click="showAssistantInfo = true">
        <img :src="currentAssistant?.avatar" :alt="currentAssistant?.name" class="assistant-avatar">
        <div class="assistant-details">
          <h1>{{ currentAssistant?.name || 'AI助手' }}</h1>
          <p v-if="aiStore.isTyping" class="typing-indicator">正在输入...</p>
          <p v-else class="status">{{ getStatusText() }}</p>
        </div>
      </div>

      <div class="header-actions">
        <button class="action-btn" @click="showSettings = true">
          <iconify-icon icon="heroicons:cog-6-tooth" width="20"></iconify-icon>
        </button>
        <button class="action-btn" @click="showMore = !showMore">
          <iconify-icon icon="heroicons:ellipsis-horizontal" width="20"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div class="messages-list">
        <!-- 欢迎消息 -->
        <div v-if="!currentConversation?.messages.length" class="welcome-message">
          <div class="welcome-avatar">
            <img :src="currentAssistant?.avatar" :alt="currentAssistant?.name">
          </div>
          <div class="welcome-content">
            <h3>你好！我是{{ currentAssistant?.name }}</h3>
            <p>{{ currentAssistant?.description }}</p>
            <div class="quick-actions">
              <button 
                v-for="action in quickActions" 
                :key="action.text"
                class="quick-action-btn"
                @click="sendQuickMessage(action.text)"
              >
                {{ action.text }}
              </button>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div 
          v-for="message in currentConversation?.messages || []" 
          :key="message.id"
          :class="['message-item', message.type]"
        >
          <!-- 用户消息 -->
          <div v-if="message.type === 'user'" class="user-message">
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div v-if="message.attachments?.length" class="message-attachments">
                <div 
                  v-for="attachment in message.attachments" 
                  :key="attachment.id"
                  class="attachment-item"
                >
                  <img v-if="attachment.type === 'image'" :src="attachment.url" :alt="attachment.name">
                  <div v-else class="file-attachment">
                    <iconify-icon icon="heroicons:document" width="20"></iconify-icon>
                    <span>{{ attachment.name }}</span>
                  </div>
                </div>
              </div>
              <div class="message-meta">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <iconify-icon 
                  :icon="getMessageStatusIcon(message.status)" 
                  width="14"
                  :class="['status-icon', message.status]"
                ></iconify-icon>
              </div>
            </div>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=me" alt="我" class="user-avatar">
          </div>

          <!-- AI消息 -->
          <div v-else-if="message.type === 'assistant'" class="assistant-message">
            <img :src="currentAssistant?.avatar" :alt="currentAssistant?.name" class="assistant-avatar">
            <div class="message-content">
              <div class="message-text" v-html="formatMessageContent(message.content)"></div>
              <div class="message-meta">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <div class="message-actions">
                  <button class="action-btn" @click="copyMessage(message.content)" title="复制">
                    <iconify-icon icon="heroicons:clipboard" width="14"></iconify-icon>
                  </button>
                  <button class="action-btn" @click="regenerateResponse(message.id)" title="重新生成">
                    <iconify-icon icon="heroicons:arrow-path" width="14"></iconify-icon>
                  </button>
                  <button v-if="supportsTTS" class="action-btn" @click="speakMessage(message.content)" title="朗读">
                    <iconify-icon icon="heroicons:speaker-wave" width="14"></iconify-icon>
                  </button>
                </div>
              </div>
              <div v-if="message.metadata" class="message-metadata">
                <span class="model-info">{{ message.metadata.model }}</span>
                <span class="token-info">{{ message.metadata.tokens }} tokens</span>
                <span class="time-info">{{ message.metadata.responseTime }}ms</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入指示器 -->
        <div v-if="aiStore.isTyping" class="typing-message">
          <img :src="currentAssistant?.avatar" :alt="currentAssistant?.name" class="assistant-avatar">
          <div class="typing-content">
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
    <div class="input-area">
      <!-- 附件预览 -->
      <div v-if="attachments.length" class="attachments-preview">
        <div 
          v-for="(attachment, index) in attachments" 
          :key="index"
          class="attachment-preview"
        >
          <img v-if="attachment.type === 'image'" :src="attachment.url" :alt="attachment.name">
          <div v-else class="file-preview">
            <iconify-icon icon="heroicons:document" width="24"></iconify-icon>
            <span>{{ attachment.name }}</span>
          </div>
          <button class="remove-attachment" @click="removeAttachment(index)">
            <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
          </button>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-container">
        <button class="input-btn" @click="showAttachmentOptions = true">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
        </button>

        <div class="text-input-wrapper">
          <textarea
            v-model="inputText"
            ref="textInput"
            placeholder="输入消息..."
            class="text-input"
            rows="1"
            @keydown="handleKeyDown"
            @input="adjustTextareaHeight"
            :disabled="aiStore.loading"
          ></textarea>
        </div>

        <button 
          v-if="supportsSTT"
          :class="['input-btn', 'voice-btn', { recording: isRecording }]"
          @mousedown="startRecording"
          @mouseup="stopRecording"
          @touchstart="startRecording"
          @touchend="stopRecording"
        >
          <iconify-icon :icon="isRecording ? 'heroicons:stop' : 'heroicons:microphone'" width="20"></iconify-icon>
        </button>

        <button 
          class="send-btn"
          :disabled="!canSend"
          @click="sendMessage"
        >
          <iconify-icon icon="heroicons:paper-airplane" width="20"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 附件选项 -->
    <div v-if="showAttachmentOptions" class="attachment-options" @click="showAttachmentOptions = false">
      <div class="options-content" @click.stop>
        <div class="option-item" @click="selectImage">
          <iconify-icon icon="heroicons:photo" width="24"></iconify-icon>
          <span>图片</span>
        </div>
        <div class="option-item" @click="selectFile">
          <iconify-icon icon="heroicons:document" width="24"></iconify-icon>
          <span>文件</span>
        </div>
        <div class="option-item" @click="takePhoto">
          <iconify-icon icon="heroicons:camera" width="24"></iconify-icon>
          <span>拍照</span>
        </div>
      </div>
    </div>

    <!-- 助手信息弹窗 -->
    <div v-if="showAssistantInfo" class="assistant-info-modal" @click="showAssistantInfo = false">
      <div class="info-content" @click.stop>
        <div class="info-header">
          <img :src="currentAssistant?.avatar" :alt="currentAssistant?.name" class="large-avatar">
          <h3>{{ currentAssistant?.name }}</h3>
          <p>{{ currentAssistant?.description }}</p>
        </div>
        
        <div class="info-details">
          <div class="detail-item">
            <span class="label">模型:</span>
            <span class="value">{{ currentAssistant?.model }}</span>
          </div>
          <div class="detail-item">
            <span class="label">对话数:</span>
            <span class="value">{{ currentAssistant?.usage.totalConversations }}</span>
          </div>
          <div class="detail-item">
            <span class="label">消息数:</span>
            <span class="value">{{ currentAssistant?.usage.totalMessages }}</span>
          </div>
          <div class="detail-item">
            <span class="label">最后使用:</span>
            <span class="value">{{ formatTime(currentAssistant?.usage.lastUsed || 0) }}</span>
          </div>
        </div>

        <div class="info-actions">
          <button class="action-btn" @click="clearConversation">
            <iconify-icon icon="heroicons:trash" width="16"></iconify-icon>
            <span>清空对话</span>
          </button>
          <button class="action-btn" @click="exportConversation">
            <iconify-icon icon="heroicons:arrow-down-tray" width="16"></iconify-icon>
            <span>导出对话</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="settings-modal" @click="showSettings = false">
      <div class="settings-content" @click.stop>
        <div class="settings-header">
          <h3>对话设置</h3>
          <button class="close-btn" @click="showSettings = false">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="settings-body">
          <div class="setting-group">
            <label>AI模型</label>
            <select v-model="conversationSettings.model">
              <option v-for="model in aiStore.availableModels" :key="model.id" :value="model.id">
                {{ model.name }}
              </option>
            </select>
          </div>

          <div class="setting-group">
            <label>创造性 ({{ conversationSettings.temperature }})</label>
            <input 
              v-model.number="conversationSettings.temperature" 
              type="range" 
              min="0" 
              max="2" 
              step="0.1"
              class="range-input"
            >
            <div class="range-labels">
              <span>保守</span>
              <span>创新</span>
            </div>
          </div>

          <div class="setting-group">
            <label>最大回复长度</label>
            <select v-model.number="conversationSettings.maxTokens">
              <option :value="512">短回复 (512)</option>
              <option :value="1024">中等回复 (1024)</option>
              <option :value="2048">长回复 (2048)</option>
              <option :value="4096">超长回复 (4096)</option>
            </select>
          </div>

          <div class="setting-toggles">
            <label class="toggle-item">
              <input v-model="conversationSettings.autoTitle" type="checkbox">
              <span>自动生成标题</span>
            </label>
            <label class="toggle-item">
              <input v-model="conversationSettings.saveHistory" type="checkbox">
              <span>保存对话历史</span>
            </label>
          </div>
        </div>

        <div class="settings-actions">
          <button class="cancel-btn" @click="showSettings = false">取消</button>
          <button class="save-btn" @click="saveSettings">保存</button>
        </div>
      </div>
    </div>

    <!-- 更多菜单 -->
    <div v-if="showMore" class="more-menu" @click="showMore = false">
      <div class="more-content" @click.stop>
        <div class="more-item" @click="newConversation">
          <iconify-icon icon="heroicons:plus" width="20"></iconify-icon>
          <span>新对话</span>
        </div>
        <div class="more-item" @click="showConversationList = true">
          <iconify-icon icon="heroicons:chat-bubble-left-right" width="20"></iconify-icon>
          <span>对话历史</span>
        </div>
        <div class="more-item" @click="showUsageStats = true">
          <iconify-icon icon="heroicons:chart-bar" width="20"></iconify-icon>
          <span>使用统计</span>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input ref="imageInput" type="file" accept="image/*" @change="handleImageSelect" style="display: none;">
    <input ref="fileInput" type="file" @change="handleFileSelect" style="display: none;">
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAIStore } from '../../stores/ai'
import type { AIAttachment } from '../../stores/ai'

const router = useRouter()
const route = useRoute()
const aiStore = useAIStore()

// 响应式数据
const messagesContainer = ref<HTMLElement>()
const textInput = ref<HTMLTextAreaElement>()
const imageInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()

const inputText = ref('')
const attachments = ref<AIAttachment[]>([])
const isRecording = ref(false)
const showAttachmentOptions = ref(false)
const showAssistantInfo = ref(false)
const showSettings = ref(false)
const showMore = ref(false)
const showConversationList = ref(false)
const showUsageStats = ref(false)

const conversationSettings = ref({
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2048,
  autoTitle: true,
  saveHistory: true
})

// 快捷操作
const quickActions = [
  { text: '你好，请介绍一下自己' },
  { text: '今天天气怎么样？' },
  { text: '帮我写一份工作总结' },
  { text: '推荐一些学习资源' }
]

// 计算属性
const currentConversation = computed(() => aiStore.currentConversation)
const currentAssistant = computed(() => {
  const assistantId = route.params.assistantId as string
  return aiStore.assistants.find(a => a.id === assistantId) || aiStore.assistants[0]
})

const canSend = computed(() => {
  return (inputText.value.trim() || attachments.value.length > 0) && !aiStore.loading
})

const supportsSTT = computed(() => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
})

const supportsTTS = computed(() => {
  return 'speechSynthesis' in window
})

// 监听对话变化，滚动到底部
watch(() => currentConversation.value?.messages.length, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

// 方法
const goBack = () => {
  router.back()
}

const getStatusText = () => {
  if (aiStore.loading) return '思考中...'
  if (aiStore.error) return '连接异常'
  return '在线'
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getMessageStatusIcon = (status: string) => {
  switch (status) {
    case 'sending': return 'heroicons:clock'
    case 'sent': return 'heroicons:check'
    case 'delivered': return 'heroicons:check-circle'
    case 'failed': return 'heroicons:exclamation-triangle'
    default: return 'heroicons:check'
  }
}

const formatMessageContent = (content: string) => {
  // 简单的Markdown渲染
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

const sendMessage = async () => {
  if (!canSend.value) return

  try {
    await aiStore.sendMessage(inputText.value, attachments.value)
    
    // 清空输入
    inputText.value = ''
    attachments.value = []
    adjustTextareaHeight()

  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

const sendQuickMessage = async (text: string) => {
  inputText.value = text
  await sendMessage()
}

const regenerateResponse = async (messageId: string) => {
  try {
    await aiStore.regenerateResponse(messageId)
  } catch (error) {
    console.error('重新生成失败:', error)
  }
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // 显示复制成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const speakMessage = async (content: string) => {
  if (!supportsTTS.value) return

  try {
    const audioUrl = await aiStore.textToSpeech(content)
    const audio = new Audio(audioUrl)
    audio.play()
  } catch (error) {
    console.error('语音合成失败:', error)
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const adjustTextareaHeight = () => {
  if (!textInput.value) return
  
  textInput.value.style.height = 'auto'
  textInput.value.style.height = Math.min(textInput.value.scrollHeight, 120) + 'px'
}

const scrollToBottom = () => {
  if (!messagesContainer.value) return
  
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

// 语音录制
const startRecording = async () => {
  if (!supportsSTT.value || isRecording.value) return

  try {
    isRecording.value = true
    // 实现语音录制逻辑
  } catch (error) {
    console.error('开始录音失败:', error)
    isRecording.value = false
  }
}

const stopRecording = async () => {
  if (!isRecording.value) return

  try {
    isRecording.value = false
    // 实现语音识别逻辑
  } catch (error) {
    console.error('语音识别失败:', error)
  }
}

// 附件处理
const selectImage = () => {
  imageInput.value?.click()
  showAttachmentOptions.value = false
}

const selectFile = () => {
  fileInput.value?.click()
  showAttachmentOptions.value = false
}

const takePhoto = () => {
  // 实现拍照功能
  showAttachmentOptions.value = false
}

const handleImageSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files?.length) return

  Array.from(files).forEach(file => {
    const attachment: AIAttachment = {
      id: `att_${Date.now()}_${Math.random()}`,
      type: 'image',
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type
    }
    attachments.value.push(attachment)
  })
}

const handleFileSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files?.length) return

  Array.from(files).forEach(file => {
    const attachment: AIAttachment = {
      id: `att_${Date.now()}_${Math.random()}`,
      type: 'file',
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type
    }
    attachments.value.push(attachment)
  })
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

// 对话管理
const newConversation = async () => {
  try {
    await aiStore.createConversation(undefined, currentAssistant.value?.id)
    showMore.value = false
  } catch (error) {
    console.error('创建新对话失败:', error)
  }
}

const clearConversation = () => {
  if (currentConversation.value) {
    currentConversation.value.messages = []
  }
  showAssistantInfo.value = false
}

const exportConversation = () => {
  // 实现对话导出功能
  showAssistantInfo.value = false
}

const saveSettings = () => {
  if (currentConversation.value) {
    currentConversation.value.settings = { ...conversationSettings.value }
  }
  showSettings.value = false
}

// 生命周期
onMounted(async () => {
  await aiStore.initialize()
  
  // 如果没有当前对话，创建新对话
  if (!currentConversation.value) {
    await aiStore.createConversation(undefined, currentAssistant.value?.id)
  }
  
  // 设置当前设置
  if (currentConversation.value) {
    conversationSettings.value = { ...currentConversation.value.settings }
  }
  
  scrollToBottom()
})

onUnmounted(() => {
  // 清理资源
  attachments.value.forEach(att => {
    URL.revokeObjectURL(att.url)
  })
})
</script>
