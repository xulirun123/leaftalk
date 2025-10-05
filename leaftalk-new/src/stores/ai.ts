import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AIAssistant {
  id: string
  name: string
  description: string
  avatar: string
  category: string
  capabilities: string[]
  isOnline: boolean
  rating: number
  usageCount: number
  lastUsed?: string
}

export interface AIConversation {
  id: string
  assistantId: string
  title: string
  messages: AIMessage[]
  createdAt: string
  updatedAt: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  type?: 'text' | 'image' | 'file'
}

export const useAIStore = defineStore('ai', () => {
  const assistants = ref<AIAssistant[]>([])
  const conversations = ref<AIConversation[]>([])
  const currentConversation = ref<AIConversation | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const onlineAssistants = computed(() => 
    assistants.value.filter(assistant => assistant.isOnline)
  )

  const assistantsByCategory = computed(() => {
    const categories: { [key: string]: AIAssistant[] } = {}
    assistants.value.forEach(assistant => {
      if (!categories[assistant.category]) {
        categories[assistant.category] = []
      }
      categories[assistant.category].push(assistant)
    })
    return categories
  })

  // 初始化AI助手数据
  function initializeAssistants() {
    assistants.value = [
      {
        id: 'genealogy-expert',
        name: '族谱专家',
        description: '专业的家族族谱分析和建议',
        avatar: '👨‍🎓',
        category: '族谱服务',
        capabilities: ['族谱分析', '家族历史', '关系梳理'],
        isOnline: true,
        rating: 4.8,
        usageCount: 1250
      },
      {
        id: 'name-master',
        name: '起名大师',
        description: '传统文化起名和姓名分析',
        avatar: '👴',
        category: '文化服务',
        capabilities: ['起名建议', '姓名分析', '五行配置'],
        isOnline: true,
        rating: 4.9,
        usageCount: 890
      },
      {
        id: 'fengshui-consultant',
        name: '风水顾问',
        description: '专业风水咨询和建议',
        avatar: '🧙‍♂️',
        category: '风水服务',
        capabilities: ['风水分析', '布局建议', '吉凶判断'],
        isOnline: true,
        rating: 4.7,
        usageCount: 650
      },
      {
        id: 'history-researcher',
        name: '历史研究员',
        description: '家族历史研究和文献分析',
        avatar: '📚',
        category: '研究服务',
        capabilities: ['历史研究', '文献分析', '资料整理'],
        isOnline: true,
        rating: 4.6,
        usageCount: 420
      }
    ]
  }

  // 获取AI助手列表
  async function fetchAssistants() {
    isLoading.value = true
    error.value = null
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      initializeAssistants()
    } catch (err) {
      error.value = '获取AI助手失败'
      console.error('获取AI助手失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 开始与AI助手对话
  async function startConversation(assistantId: string) {
    const assistant = assistants.value.find(a => a.id === assistantId)
    if (!assistant) {
      error.value = 'AI助手不存在'
      return null
    }

    const conversation: AIConversation = {
      id: `conv_${Date.now()}`,
      assistantId,
      title: `与${assistant.name}的对话`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    conversations.value.push(conversation)
    currentConversation.value = conversation
    
    return conversation
  }

  // 发送消息
  async function sendMessage(content: string) {
    if (!currentConversation.value) {
      error.value = '没有活跃的对话'
      return
    }

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    currentConversation.value.messages.push(userMessage)
    currentConversation.value.updatedAt = new Date().toISOString()

    // 模拟AI回复
    setTimeout(() => {
      if (currentConversation.value) {
        const aiMessage: AIMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: generateAIResponse(content),
          timestamp: new Date().toISOString()
        }
        
        currentConversation.value.messages.push(aiMessage)
        currentConversation.value.updatedAt = new Date().toISOString()
      }
    }, 1000)
  }

  // 生成AI回复（模拟）
  function generateAIResponse(userMessage: string): string {
    const responses = [
      '感谢您的咨询，我正在为您分析相关信息...',
      '根据您提供的信息，我建议您考虑以下几个方面...',
      '这是一个很好的问题，让我为您详细解答...',
      '基于传统文化和现代理念，我的建议是...',
      '您的情况比较特殊，需要综合考虑多个因素...'
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // 获取对话历史
  function getConversationHistory() {
    return conversations.value.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  // 删除对话
  function deleteConversation(conversationId: string) {
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index > -1) {
      conversations.value.splice(index, 1)
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value = null
      }
    }
  }

  // 清空所有对话
  function clearAllConversations() {
    conversations.value = []
    currentConversation.value = null
  }

  return {
    // 状态
    assistants,
    conversations,
    currentConversation,
    isLoading,
    error,
    
    // 计算属性
    onlineAssistants,
    assistantsByCategory,
    
    // 方法
    fetchAssistants,
    startConversation,
    sendMessage,
    getConversationHistory,
    deleteConversation,
    clearAllConversations,
    initializeAssistants
  }
})
