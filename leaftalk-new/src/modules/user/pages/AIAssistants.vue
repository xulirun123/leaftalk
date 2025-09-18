<template>
  <div class="ai-assistants">
    <!-- 顶部导航 -->
    <div class="assistants-header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24"></iconify-icon>
      </button>
      <h1>AI助手</h1>
      <button class="create-btn" @click="showCreateDialog = true">
        <iconify-icon icon="heroicons:plus" width="24"></iconify-icon>
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <iconify-icon icon="heroicons:magnifying-glass" width="20" class="search-icon"></iconify-icon>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="搜索助手..."
          class="search-input"
        >
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button 
        v-for="category in categories" 
        :key="category.key"
        :class="['category-tab', { active: activeCategory === category.key }]"
        @click="activeCategory = category.key"
      >
        {{ category.label }}
      </button>
    </div>

    <!-- 助手列表 -->
    <div class="assistants-list">
      <!-- 内置助手 -->
      <div v-if="filteredBuiltInAssistants.length > 0" class="assistants-section">
        <h3>内置助手</h3>
        <div class="assistants-grid">
          <div 
            v-for="assistant in filteredBuiltInAssistants" 
            :key="assistant.id"
            class="assistant-card"
            @click="openChat(assistant.id)"
          >
            <div class="card-header">
              <img :src="assistant.avatar" :alt="assistant.name" class="assistant-avatar">
              <div class="assistant-info">
                <h4>{{ assistant.name }}</h4>
                <p>{{ assistant.description }}</p>
              </div>
              <button class="more-btn" @click.stop="showAssistantMenu(assistant)">
                <iconify-icon icon="heroicons:ellipsis-horizontal" width="20"></iconify-icon>
              </button>
            </div>
            
            <div class="card-stats">
              <div class="stat-item">
                <iconify-icon icon="heroicons:chat-bubble-left-right" width="16"></iconify-icon>
                <span>{{ assistant.usage.totalConversations }}</span>
              </div>
              <div class="stat-item">
                <iconify-icon icon="heroicons:clock" width="16"></iconify-icon>
                <span>{{ formatLastUsed(assistant.usage.lastUsed) }}</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="model-tag">{{ getModelName(assistant.model) }}</div>
              <div :class="['status-indicator', { active: assistant.isActive }]">
                {{ assistant.isActive ? '可用' : '不可用' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义助手 -->
      <div v-if="filteredCustomAssistants.length > 0" class="assistants-section">
        <h3>自定义助手</h3>
        <div class="assistants-grid">
          <div 
            v-for="assistant in filteredCustomAssistants" 
            :key="assistant.id"
            class="assistant-card custom"
            @click="openChat(assistant.id)"
          >
            <div class="card-header">
              <img :src="assistant.avatar" :alt="assistant.name" class="assistant-avatar">
              <div class="assistant-info">
                <h4>{{ assistant.name }}</h4>
                <p>{{ assistant.description }}</p>
              </div>
              <button class="more-btn" @click.stop="showAssistantMenu(assistant)">
                <iconify-icon icon="heroicons:ellipsis-horizontal" width="20"></iconify-icon>
              </button>
            </div>
            
            <div class="card-stats">
              <div class="stat-item">
                <iconify-icon icon="heroicons:chat-bubble-left-right" width="16"></iconify-icon>
                <span>{{ assistant.usage.totalConversations }}</span>
              </div>
              <div class="stat-item">
                <iconify-icon icon="heroicons:clock" width="16"></iconify-icon>
                <span>{{ formatLastUsed(assistant.usage.lastUsed) }}</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="model-tag">{{ getModelName(assistant.model) }}</div>
              <div :class="['status-indicator', { active: assistant.isActive }]">
                {{ assistant.isActive ? '可用' : '不可用' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredAssistants.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:face-smile" width="64" style="color: #ccc;"></iconify-icon>
        <h3>暂无助手</h3>
        <p>{{ searchQuery ? '没有找到匹配的助手' : '创建你的第一个AI助手吧' }}</p>
        <button v-if="!searchQuery" class="create-first-btn" @click="showCreateDialog = true">
          创建助手
        </button>
      </div>
    </div>

    <!-- 创建助手对话框 -->
    <div v-if="showCreateDialog" class="create-dialog" @click="showCreateDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>创建AI助手</h3>
          <button class="close-btn" @click="showCreateDialog = false">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label>助手名称</label>
            <input 
              v-model="newAssistant.name"
              type="text" 
              placeholder="给你的助手起个名字"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>助手描述</label>
            <textarea 
              v-model="newAssistant.description"
              placeholder="描述一下这个助手的功能和特点"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>AI模型</label>
            <select v-model="newAssistant.model" class="form-select">
              <option v-for="model in aiStore.availableModels" :key="model.id" :value="model.id">
                {{ model.name }} - {{ model.description }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>系统提示词</label>
            <textarea 
              v-model="newAssistant.systemPrompt"
              placeholder="定义助手的角色和行为规则..."
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label>头像</label>
            <div class="avatar-selector">
              <div 
                v-for="avatar in avatarOptions" 
                :key="avatar"
                :class="['avatar-option', { selected: newAssistant.avatar === avatar }]"
                @click="newAssistant.avatar = avatar"
              >
                <img :src="avatar" :alt="avatar">
              </div>
            </div>
          </div>

          <div class="advanced-settings">
            <h4>高级设置</h4>
            
            <div class="setting-row">
              <label>创造性 ({{ newAssistant.settings.temperature }})</label>
              <input 
                v-model.number="newAssistant.settings.temperature" 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                class="range-input"
              >
            </div>

            <div class="setting-row">
              <label>最大回复长度</label>
              <select v-model.number="newAssistant.settings.maxTokens" class="form-select">
                <option :value="512">短回复 (512)</option>
                <option :value="1024">中等回复 (1024)</option>
                <option :value="2048">长回复 (2048)</option>
                <option :value="4096">超长回复 (4096)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="cancel-btn" @click="showCreateDialog = false">取消</button>
          <button class="create-btn" :disabled="!canCreate" @click="createAssistant">
            创建助手
          </button>
        </div>
      </div>
    </div>

    <!-- 助手菜单 -->
    <div v-if="showMenu" class="assistant-menu" @click="showMenu = false">
      <div class="menu-content" @click.stop>
        <div class="menu-header">
          <img :src="selectedAssistant?.avatar" :alt="selectedAssistant?.name" class="menu-avatar">
          <h4>{{ selectedAssistant?.name }}</h4>
        </div>
        
        <div class="menu-items">
          <div class="menu-item" @click="openChat(selectedAssistant!.id)">
            <iconify-icon icon="heroicons:chat-bubble-left-right" width="20"></iconify-icon>
            <span>开始对话</span>
          </div>
          
          <div v-if="!selectedAssistant?.isBuiltIn" class="menu-item" @click="editAssistant">
            <iconify-icon icon="heroicons:pencil" width="20"></iconify-icon>
            <span>编辑助手</span>
          </div>
          
          <div class="menu-item" @click="duplicateAssistant">
            <iconify-icon icon="heroicons:document-duplicate" width="20"></iconify-icon>
            <span>复制助手</span>
          </div>
          
          <div class="menu-item" @click="shareAssistant">
            <iconify-icon icon="heroicons:share" width="20"></iconify-icon>
            <span>分享助手</span>
          </div>
          
          <div v-if="!selectedAssistant?.isBuiltIn" class="menu-item danger" @click="deleteAssistant">
            <iconify-icon icon="heroicons:trash" width="20"></iconify-icon>
            <span>删除助手</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用统计弹窗 -->
    <div v-if="showStats" class="stats-modal" @click="showStats = false">
      <div class="stats-content" @click.stop>
        <div class="stats-header">
          <h3>使用统计</h3>
          <button class="close-btn" @click="showStats = false">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="stats-body">
          <div class="stats-cards">
            <div class="stats-card">
              <div class="stats-value">{{ aiStore.usageStats.today.messages }}</div>
              <div class="stats-label">今日消息</div>
            </div>
            <div class="stats-card">
              <div class="stats-value">{{ formatTokens(aiStore.usageStats.today.tokens) }}</div>
              <div class="stats-label">今日Token</div>
            </div>
            <div class="stats-card">
              <div class="stats-value">¥{{ aiStore.usageStats.today.cost.toFixed(2) }}</div>
              <div class="stats-label">今日费用</div>
            </div>
          </div>

          <div class="stats-chart">
            <!-- 这里可以添加图表组件 -->
            <div class="chart-placeholder">
              <iconify-icon icon="heroicons:chart-bar" width="48"></iconify-icon>
              <p>使用趋势图表</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAIStore } from '../../stores/ai'
import type { AIAssistant } from '../../stores/ai'

const router = useRouter()
const aiStore = useAIStore()

// 响应式数据
const searchQuery = ref('')
const activeCategory = ref('all')
const showCreateDialog = ref(false)
const showMenu = ref(false)
const showStats = ref(false)
const selectedAssistant = ref<AIAssistant | null>(null)

// 分类选项
const categories = [
  { key: 'all', label: '全部' },
  { key: 'builtin', label: '内置' },
  { key: 'custom', label: '自定义' },
  { key: 'recent', label: '最近使用' }
]

// 头像选项
const avatarOptions = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant6'
]

// 新助手表单
const newAssistant = ref({
  name: '',
  description: '',
  model: 'gpt-3.5-turbo',
  systemPrompt: '你是一个有帮助的AI助手，请用中文回答问题。',
  avatar: avatarOptions[0],
  isBuiltIn: false,
  isActive: true,
  settings: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: '',
    autoTitle: true,
    saveHistory: true
  }
})

// 计算属性
const filteredAssistants = computed(() => {
  let assistants = aiStore.assistants

  // 分类筛选
  if (activeCategory.value === 'builtin') {
    assistants = assistants.filter(a => a.isBuiltIn)
  } else if (activeCategory.value === 'custom') {
    assistants = assistants.filter(a => !a.isBuiltIn)
  } else if (activeCategory.value === 'recent') {
    assistants = assistants
      .filter(a => a.usage.lastUsed > 0)
      .sort((a, b) => b.usage.lastUsed - a.usage.lastUsed)
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    assistants = assistants.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    )
  }

  return assistants
})

const filteredBuiltInAssistants = computed(() => 
  filteredAssistants.value.filter(a => a.isBuiltIn)
)

const filteredCustomAssistants = computed(() => 
  filteredAssistants.value.filter(a => !a.isBuiltIn)
)

const canCreate = computed(() => {
  return newAssistant.value.name.trim() && 
         newAssistant.value.description.trim() &&
         newAssistant.value.systemPrompt.trim()
})

// 方法
const goBack = () => {
  router.back()
}

const openChat = (assistantId: string) => {
  router.push(`/ai/chat/${assistantId}`)
}

const showAssistantMenu = (assistant: AIAssistant) => {
  selectedAssistant.value = assistant
  showMenu.value = true
}

const createAssistant = async () => {
  try {
    await aiStore.createAssistant(newAssistant.value)
    
    // 重置表单
    newAssistant.value = {
      name: '',
      description: '',
      model: 'gpt-3.5-turbo',
      systemPrompt: '你是一个有帮助的AI助手，请用中文回答问题。',
      avatar: avatarOptions[0],
      isBuiltIn: false,
      isActive: true,
      settings: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        systemPrompt: '',
        autoTitle: true,
        saveHistory: true
      }
    }
    
    showCreateDialog.value = false

  } catch (error) {
    console.error('创建助手失败:', error)
  }
}

const editAssistant = () => {
  // 实现编辑助手功能
  showMenu.value = false
}

const duplicateAssistant = () => {
  if (!selectedAssistant.value) return
  
  // 复制助手
  newAssistant.value = {
    ...selectedAssistant.value,
    name: `${selectedAssistant.value.name} 副本`,
    isBuiltIn: false
  }
  
  showMenu.value = false
  showCreateDialog.value = true
}

const shareAssistant = () => {
  // 实现分享助手功能
  showMenu.value = false
}

const deleteAssistant = () => {
  if (!selectedAssistant.value || selectedAssistant.value.isBuiltIn) return
  
  // 实现删除助手功能
  showMenu.value = false
}

const getModelName = (modelId: string) => {
  const model = aiStore.models.find(m => m.id === modelId)
  return model?.name || modelId
}

const formatLastUsed = (timestamp: number) => {
  if (!timestamp) return '从未使用'
  
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const formatTokens = (tokens: number) => {
  if (tokens < 1000) return tokens.toString()
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`
  return `${(tokens / 1000000).toFixed(1)}M`
}

// 生命周期
onMounted(() => {
  aiStore.initialize()
})
</script>
