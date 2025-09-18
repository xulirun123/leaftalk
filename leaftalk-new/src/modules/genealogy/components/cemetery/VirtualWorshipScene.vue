<template>
  <div class="virtual-worship-scene">
    <!-- 3D场景容器 -->
    <div class="scene-container" ref="sceneContainer">
      <!-- 3D渲染区域 -->
      <div class="scene-canvas" ref="sceneCanvas">
        <!-- 背景环境 -->
        <div class="scene-background" :class="cemetery.scene3D.environment">
          <img :src="getEnvironmentImage()" :alt="cemetery.name" />
          
          <!-- 天气效果 -->
          <div class="weather-effects" :class="cemetery.scene3D.weather">
            <div v-if="cemetery.scene3D.weather === 'rain'" class="rain-effect">
              <div v-for="n in 50" :key="n" class="raindrop" :style="getRainStyle(n)"></div>
            </div>
            
            <div v-if="cemetery.scene3D.weather === 'snow'" class="snow-effect">
              <div v-for="n in 30" :key="n" class="snowflake" :style="getSnowStyle(n)">❄</div>
            </div>
            
            <div v-if="cemetery.scene3D.weather === 'fog'" class="fog-effect"></div>
          </div>
          
          <!-- 光照效果 -->
          <div class="lighting-effects" :class="cemetery.scene3D.lighting">
            <div class="light-rays"></div>
            <div class="ambient-glow"></div>
          </div>
        </div>
        
        <!-- 墓碑/纪念碑 -->
        <div class="memorial-stone" :class="getMemorialStyle()">
          <div class="stone-surface">
            <div class="inscription">
              <div class="deceased-name">{{ cemetery.deceasedName }}</div>
              <div class="life-dates">{{ formatLifeDates() }}</div>
              <div class="epitaph" v-if="cemetery.epitaph">{{ cemetery.epitaph }}</div>
            </div>
            
            <!-- 照片 -->
            <div v-if="cemetery.portraitPhoto" class="portrait-photo">
              <img :src="cemetery.portraitPhoto" :alt="cemetery.deceasedName" />
            </div>
          </div>
        </div>
        
        <!-- 装饰物品 -->
        <div class="decorations">
          <div 
            v-for="decoration in cemetery.scene3D.decorations" 
            :key="decoration"
            class="decoration-item"
            :class="decoration"
          >
            <!-- 香炉 -->
            <div v-if="decoration === 'incense_burner'" class="incense-burner">
              <div class="burner-body"></div>
              <div class="incense-sticks">
                <div v-for="n in 3" :key="n" class="incense-stick">
                  <div class="smoke" v-if="isIncenseBurning"></div>
                </div>
              </div>
            </div>
            
            <!-- 花瓶 -->
            <div v-if="decoration === 'flower_vase'" class="flower-vase">
              <div class="vase-body"></div>
              <div class="flowers">
                <div v-for="flower in currentOfferings.flowers" :key="flower.id" class="flower" :class="flower.type">
                  <div class="stem"></div>
                  <div class="bloom"></div>
                </div>
              </div>
            </div>
            
            <!-- 供品台 -->
            <div v-if="decoration === 'offering_table'" class="offering-table">
              <div class="table-surface">
                <div 
                  v-for="offering in currentOfferings.items" 
                  :key="offering.id"
                  class="offering-item"
                  :class="offering.type"
                >
                  <img :src="offering.image" :alt="offering.name" />
                </div>
              </div>
            </div>
            
            <!-- 蜡烛 -->
            <div v-if="decoration === 'candles'" class="candles">
              <div v-for="n in 2" :key="n" class="candle">
                <div class="candle-body"></div>
                <div class="flame" v-if="isCandleLit"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 虚拟人物 -->
        <div class="virtual-person" :class="currentAction">
          <div class="person-body">
            <div class="head"></div>
            <div class="torso"></div>
            <div class="arms">
              <div class="arm left"></div>
              <div class="arm right"></div>
            </div>
            <div class="legs">
              <div class="leg left"></div>
              <div class="leg right"></div>
            </div>
          </div>
          
          <!-- 动作效果 -->
          <div v-if="currentAction === 'praying'" class="prayer-aura"></div>
          <div v-if="currentAction === 'offering'" class="offering-glow"></div>
        </div>
        
        <!-- 音效可视化 -->
        <div v-if="isPlayingAudio" class="audio-visualization">
          <div v-for="n in 20" :key="n" class="audio-bar" :style="getAudioBarStyle(n)"></div>
        </div>
      </div>
      
      <!-- 控制界面 -->
      <div class="worship-controls">
        <!-- 顶部信息 -->
        <div class="scene-header">
          <button @click="$emit('close')" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
          
          <div class="scene-info">
            <h3>{{ cemetery.name }}</h3>
            <p>{{ cemetery.deceasedName }}</p>
          </div>
          
          <button @click="toggleFullscreen" class="fullscreen-btn">
            <iconify-icon icon="heroicons:arrows-pointing-out" width="20"></iconify-icon>
          </button>
        </div>
        
        <!-- 祭拜动作 -->
        <div class="worship-actions">
          <h4>祭拜动作</h4>
          <div class="action-buttons">
            <button 
              v-for="action in availableActions" 
              :key="action.id"
              @click="performAction(action)"
              :class="{ active: currentAction === action.id, disabled: action.disabled }"
              class="action-btn"
            >
              <iconify-icon :icon="action.icon" width="20"></iconify-icon>
              <span>{{ action.name }}</span>
              <div v-if="action.duration" class="action-duration">{{ action.duration }}s</div>
            </button>
          </div>
        </div>
        
        <!-- 供品选择 -->
        <div class="offerings-section">
          <h4>供品祭品</h4>
          <div class="offering-categories">
            <button 
              v-for="category in offeringCategories" 
              :key="category.id"
              @click="activeOfferingCategory = category.id"
              :class="{ active: activeOfferingCategory === category.id }"
              class="category-btn"
            >
              <iconify-icon :icon="category.icon" width="16"></iconify-icon>
              <span>{{ category.name }}</span>
            </button>
          </div>
          
          <div class="offering-items">
            <div 
              v-for="item in getCurrentOfferingItems()" 
              :key="item.id"
              @click="addOffering(item)"
              class="offering-item"
              :class="{ selected: isOfferingSelected(item) }"
            >
              <img :src="item.image" :alt="item.name" />
              <span>{{ item.name }}</span>
              <div v-if="item.cost" class="item-cost">{{ item.cost }}叶语豆</div>
            </div>
          </div>
        </div>
        
        <!-- 祈福祷告 -->
        <div class="prayer-section">
          <h4>祈福祷告</h4>
          <div class="prayer-templates">
            <button 
              v-for="prayer in prayerTemplates" 
              :key="prayer.id"
              @click="selectPrayer(prayer)"
              class="prayer-btn"
            >
              {{ prayer.text }}
            </button>
          </div>
          
          <div class="custom-prayer">
            <textarea 
              v-model="customPrayerText"
              placeholder="写下您的祈福话语..."
              rows="3"
            ></textarea>
            <button @click="addCustomPrayer" class="add-prayer-btn">
              <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
              <span>添加祈福</span>
            </button>
          </div>
        </div>
        
        <!-- AI祖先对话 -->
        <div class="ai-conversation-section">
          <h4>与祖先对话</h4>
          <div class="ai-conversation-controls">
            <button
              @click="toggleAIConversation"
              :class="{ active: isAIConversationActive }"
              class="ai-toggle-btn"
            >
              <iconify-icon :icon="isAIConversationActive ? 'heroicons:phone-x-mark' : 'heroicons:phone'" width="16"></iconify-icon>
              <span>{{ isAIConversationActive ? '结束对话' : '开始对话' }}</span>
            </button>

            <button
              v-if="isAIConversationActive"
              @click="toggleMicrophone"
              :class="{ active: isMicrophoneActive, recording: isRecording }"
              class="microphone-btn"
            >
              <iconify-icon :icon="isMicrophoneActive ? 'heroicons:microphone' : 'heroicons:microphone-slash'" width="16"></iconify-icon>
            </button>
          </div>

          <!-- AI对话界面 -->
          <div v-if="isAIConversationActive" class="ai-conversation-panel">
            <!-- 祖先头像和状态 -->
            <div class="ancestor-avatar">
              <img :src="cemetery.portraitPhoto || '/default-ancestor.jpg'" :alt="cemetery.deceasedName" />
              <div class="speaking-indicator" :class="{ active: isAISpeaking }">
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
              </div>
            </div>

            <!-- 对话记录 -->
            <div class="conversation-history" ref="conversationHistory">
              <div
                v-for="message in conversationMessages"
                :key="message.id"
                class="message"
                :class="message.sender"
              >
                <div class="message-content">
                  <div class="message-text">{{ message.text }}</div>
                  <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
                </div>
              </div>

              <!-- 正在输入指示器 -->
              <div v-if="isAITyping" class="message ai typing">
                <div class="message-content">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 快速回复建议 -->
            <div class="quick-replies">
              <button
                v-for="reply in worshipQuickReplies"
                :key="reply.id"
                @click="sendQuickReply(reply)"
                class="quick-reply-btn"
              >
                {{ reply.text }}
              </button>
            </div>

            <!-- 语音输入状态 -->
            <div v-if="isRecording" class="voice-input-status">
              <div class="recording-animation">
                <div class="pulse"></div>
              </div>
              <div class="recording-text">正在聆听您的话语...</div>
              <div class="recording-timer">{{ recordingDuration }}s</div>
            </div>

            <!-- 文本输入 -->
            <div class="text-input-section">
              <div class="input-container">
                <input
                  v-model="textInput"
                  type="text"
                  placeholder="输入您想说的话..."
                  @keypress.enter="sendTextMessage"
                  :disabled="isRecording"
                />
                <button @click="sendTextMessage" :disabled="!textInput.trim()" class="send-btn">
                  <iconify-icon icon="heroicons:paper-airplane" width="16"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 音乐氛围 -->
        <div class="atmosphere-section">
          <h4>音乐氛围</h4>
          <div class="music-controls">
            <button
              v-for="music in atmosphereMusic"
              :key="music.id"
              @click="playMusic(music)"
              :class="{ active: currentMusic?.id === music.id }"
              class="music-btn"
            >
              <iconify-icon :icon="music.icon" width="16"></iconify-icon>
              <span>{{ music.name }}</span>
            </button>
          </div>

          <div class="volume-control">
            <iconify-icon icon="heroicons:speaker-wave" width="16"></iconify-icon>
            <input
              type="range"
              v-model="musicVolume"
              min="0"
              max="100"
              @input="adjustVolume"
            />
          </div>
        </div>
        
        <!-- 完成祭拜 -->
        <div class="worship-completion">
          <button @click="completeWorship" class="complete-btn" :disabled="!canCompleteWorship">
            <iconify-icon icon="heroicons:heart" width="16"></iconify-icon>
            <span>完成祭拜</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 祭拜记录弹窗 -->
    <div v-if="showWorshipRecord" class="worship-record-modal">
      <div class="record-content">
        <h3>祭拜记录</h3>
        <div class="record-summary">
          <div class="worship-time">祭拜时间：{{ formatWorshipTime() }}</div>
          <div class="worship-duration">祭拜时长：{{ worshipDuration }}分钟</div>
          <div class="offerings-count">供品数量：{{ selectedOfferings.length }}件</div>
          <div class="prayers-count">祈福次数：{{ selectedPrayers.length }}次</div>
        </div>
        
        <div class="record-actions">
          <button @click="saveWorshipRecord" class="save-btn">保存记录</button>
          <button @click="shareWorshipRecord" class="share-btn">分享祭拜</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../../shared/stores/appStore'

const appStore = useAppStore()

// Props
const props = defineProps({
  cemetery: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'worship-complete'])

// 状态管理
const sceneContainer = ref(null)
const sceneCanvas = ref(null)
const conversationHistory = ref(null)
const currentAction = ref('standing')
const activeOfferingCategory = ref('flowers')
const customPrayerText = ref('')
const currentMusic = ref(null)
const musicVolume = ref(50)
const isIncenseBurning = ref(false)
const isCandleLit = ref(false)
const isPlayingAudio = ref(false)
const showWorshipRecord = ref(false)
const worshipStartTime = ref(null)
const worshipDuration = ref(0)

// AI对话相关状态
const isAIConversationActive = ref(false)
const isMicrophoneActive = ref(false)
const isRecording = ref(false)
const isAISpeaking = ref(false)
const isAITyping = ref(false)
const textInput = ref('')
const recordingDuration = ref(0)
const conversationMessages = ref([])
const recordingTimer = ref(null)
const speechRecognition = ref(null)
const speechSynthesis = ref(null)

// 选中的物品
const selectedOfferings = ref([])
const selectedPrayers = ref([])
const currentOfferings = reactive({
  flowers: [],
  items: []
})

// 可用动作
const availableActions = ref([
  { id: 'bow', name: '鞠躬', icon: 'heroicons:user', duration: 3 },
  { id: 'kneel', name: '跪拜', icon: 'heroicons:user-minus', duration: 5 },
  { id: 'pray', name: '祈祷', icon: 'heroicons:hand-raised', duration: 10 },
  { id: 'offer_incense', name: '上香', icon: 'heroicons:fire', duration: 8 },
  { id: 'place_flowers', name: '献花', icon: 'heroicons:gift', duration: 5 },
  { id: 'light_candle', name: '点烛', icon: 'heroicons:light-bulb', duration: 3 }
])

// 供品分类
const offeringCategories = ref([
  { id: 'flowers', name: '鲜花', icon: 'heroicons:gift' },
  { id: 'fruits', name: '水果', icon: 'heroicons:gift-top' },
  { id: 'incense', name: '香烛', icon: 'heroicons:fire' },
  { id: 'food', name: '食品', icon: 'heroicons:cake' }
])

// 祈福模板
const prayerTemplates = ref([
  { id: 1, text: '愿您在天堂安息' },
  { id: 2, text: '保佑家人身体健康' },
  { id: 3, text: '愿家族兴旺发达' },
  { id: 4, text: '感谢您的养育之恩' },
  { id: 5, text: '永远怀念您' }
])

// 氛围音乐
const atmosphereMusic = ref([
  { id: 1, name: '静心', icon: 'heroicons:musical-note', url: '/music/meditation.mp3' },
  { id: 2, name: '佛音', icon: 'heroicons:musical-note', url: '/music/buddhist.mp3' },
  { id: 3, name: '自然', icon: 'heroicons:musical-note', url: '/music/nature.mp3' },
  { id: 4, name: '无声', icon: 'heroicons:speaker-x-mark', url: null }
])

// 祭拜场景专用快速回复
const worshipQuickReplies = ref([
  { id: 1, text: '我来看您了' },
  { id: 2, text: '为您献上鲜花' },
  { id: 3, text: '请您保佑家人' },
  { id: 4, text: '我很想念您' },
  { id: 5, text: '向您汇报近况' },
  { id: 6, text: '请您指点迷津' },
  { id: 7, text: '愿您安息' },
  { id: 8, text: '感谢您的养育之恩' }
])

// 计算属性
const canCompleteWorship = computed(() => {
  return selectedOfferings.value.length > 0 || selectedPrayers.value.length > 0
})

// 生命周期
onMounted(() => {
  initWorshipScene()
  worshipStartTime.value = new Date()
  startWorshipTimer()
})

onUnmounted(() => {
  stopWorshipTimer()
  stopMusic()
})

// 方法
const initWorshipScene = () => {
  // 初始化3D场景
  console.log('初始化虚拟祭拜场景')
}

const getEnvironmentImage = () => {
  const environments = {
    traditional_chinese: '/scenes/traditional-chinese.jpg',
    modern_garden: '/scenes/modern-garden.jpg',
    forest_memorial: '/scenes/forest-memorial.jpg',
    seaside_cliff: '/scenes/seaside-cliff.jpg'
  }
  return environments[props.cemetery.scene3D.environment] || environments.traditional_chinese
}

const getMemorialStyle = () => {
  return props.cemetery.scene3D.environment
}

const formatLifeDates = () => {
  const birth = new Date(props.cemetery.birthDate).getFullYear()
  const death = new Date(props.cemetery.deathDate).getFullYear()
  return `${birth} - ${death}`
}

const performAction = async (action) => {
  if (action.disabled) return
  
  currentAction.value = action.id
  
  // 播放动作动画
  await playActionAnimation(action)
  
  // 特殊动作处理
  switch (action.id) {
    case 'offer_incense':
      isIncenseBurning.value = true
      break
    case 'light_candle':
      isCandleLit.value = true
      break
  }
  
  // 动作完成后回到站立状态
  setTimeout(() => {
    currentAction.value = 'standing'
  }, action.duration * 1000)
}

const playActionAnimation = (action) => {
  return new Promise(resolve => {
    // 这里应该实现真实的3D动画
    console.log(`执行动作: ${action.name}`)
    setTimeout(resolve, action.duration * 1000)
  })
}

const getCurrentOfferingItems = () => {
  const items = {
    flowers: [
      { id: 1, name: '白菊花', image: '/offerings/white-chrysanthemum.jpg', cost: 10 },
      { id: 2, name: '黄菊花', image: '/offerings/yellow-chrysanthemum.jpg', cost: 10 },
      { id: 3, name: '康乃馨', image: '/offerings/carnation.jpg', cost: 15 },
      { id: 4, name: '百合花', image: '/offerings/lily.jpg', cost: 20 }
    ],
    fruits: [
      { id: 5, name: '苹果', image: '/offerings/apple.jpg', cost: 5 },
      { id: 6, name: '橙子', image: '/offerings/orange.jpg', cost: 5 },
      { id: 7, name: '香蕉', image: '/offerings/banana.jpg', cost: 8 }
    ],
    incense: [
      { id: 8, name: '檀香', image: '/offerings/sandalwood.jpg', cost: 12 },
      { id: 9, name: '沉香', image: '/offerings/agarwood.jpg', cost: 25 },
      { id: 10, name: '蜡烛', image: '/offerings/candle.jpg', cost: 8 }
    ],
    food: [
      { id: 11, name: '糕点', image: '/offerings/cake.jpg', cost: 15 },
      { id: 12, name: '茶水', image: '/offerings/tea.jpg', cost: 10 }
    ]
  }
  return items[activeOfferingCategory.value] || []
}

const addOffering = (item) => {
  if (!isOfferingSelected(item)) {
    selectedOfferings.value.push(item)
    
    // 添加到场景中
    if (item.name.includes('花')) {
      currentOfferings.flowers.push({
        id: item.id,
        type: item.name.includes('菊') ? 'chrysanthemum' : 'other'
      })
    } else {
      currentOfferings.items.push(item)
    }
  }
}

const isOfferingSelected = (item) => {
  return selectedOfferings.value.some(offering => offering.id === item.id)
}

const selectPrayer = (prayer) => {
  if (!selectedPrayers.value.some(p => p.id === prayer.id)) {
    selectedPrayers.value.push(prayer)
  }
}

const addCustomPrayer = () => {
  if (customPrayerText.value.trim()) {
    selectedPrayers.value.push({
      id: Date.now(),
      text: customPrayerText.value.trim(),
      custom: true
    })
    customPrayerText.value = ''
  }
}

const playMusic = (music) => {
  if (currentMusic.value?.id === music.id) {
    stopMusic()
    return
  }
  
  currentMusic.value = music
  if (music.url) {
    // 播放音乐
    isPlayingAudio.value = true
    console.log(`播放音乐: ${music.name}`)
  }
}

const stopMusic = () => {
  currentMusic.value = null
  isPlayingAudio.value = false
}

const adjustVolume = () => {
  // 调整音量
  console.log(`音量调整为: ${musicVolume.value}%`)
}

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    sceneContainer.value?.requestFullscreen()
  }
}

const startWorshipTimer = () => {
  const timer = setInterval(() => {
    if (worshipStartTime.value) {
      const now = new Date()
      worshipDuration.value = Math.floor((now - worshipStartTime.value) / 60000)
    }
  }, 60000)
  
  // 保存timer引用以便清理
  window.worshipTimer = timer
}

const stopWorshipTimer = () => {
  if (window.worshipTimer) {
    clearInterval(window.worshipTimer)
    window.worshipTimer = null
  }
}

const completeWorship = () => {
  showWorshipRecord.value = true
}

const saveWorshipRecord = () => {
  const worshipData = {
    cemeteryId: props.cemetery.id,
    duration: worshipDuration.value,
    offerings: selectedOfferings.value,
    prayers: selectedPrayers.value,
    timestamp: new Date().toISOString()
  }
  
  emit('worship-complete', worshipData)
  showWorshipRecord.value = false
}

const shareWorshipRecord = () => {
  const shareText = `我在叶语平台为${props.cemetery.deceasedName}进行了虚拟祭拜，献上了${selectedOfferings.value.length}件供品，祈福${selectedPrayers.value.length}次。愿逝者安息。`
  
  if (navigator.share) {
    navigator.share({
      title: '虚拟祭拜记录',
      text: shareText,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(shareText)
    appStore.showToast('祭拜记录已复制', 'success')
  }
}

const formatWorshipTime = () => {
  return worshipStartTime.value?.toLocaleString('zh-CN') || ''
}

// 动画效果辅助方法
const getRainStyle = (index) => {
  return {
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 2 + 's',
    animationDuration: (Math.random() * 1 + 0.5) + 's'
  }
}

const getSnowStyle = (index) => {
  return {
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 3 + 's',
    animationDuration: (Math.random() * 3 + 2) + 's'
  }
}

const getAudioBarStyle = (index) => {
  return {
    height: Math.random() * 100 + '%',
    animationDelay: index * 0.1 + 's'
  }
}

// AI对话相关方法
const toggleAIConversation = () => {
  if (isAIConversationActive.value) {
    endAIConversation()
  } else {
    startAIConversation()
  }
}

const startAIConversation = async () => {
  isAIConversationActive.value = true

  // 初始化语音识别
  initSpeechRecognition()

  // 初始化语音合成
  initSpeechSynthesis()

  // 添加开场白
  const welcomeMessage = {
    id: Date.now(),
    sender: 'ai',
    text: `孩子，我感受到了你的到来。很高兴你能来看我，有什么想对我说的吗？`,
    timestamp: new Date()
  }

  conversationMessages.value.push(welcomeMessage)

  // 播放AI语音
  speakMessage(welcomeMessage.text)

  // 滚动到底部
  setTimeout(scrollToBottom, 100)
}

const endAIConversation = () => {
  isAIConversationActive.value = false
  isMicrophoneActive.value = false
  isRecording.value = false
  isAISpeaking.value = false
  isAITyping.value = false

  // 停止录音
  stopRecording()

  // 停止语音合成
  if (speechSynthesis.value) {
    speechSynthesis.value.cancel()
  }

  // 保存对话记录
  saveConversationRecord()
}

const initSpeechRecognition = () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    speechRecognition.value = new SpeechRecognition()

    speechRecognition.value.continuous = false
    speechRecognition.value.interimResults = false
    speechRecognition.value.lang = 'zh-CN'

    speechRecognition.value.onstart = () => {
      isRecording.value = true
      startRecordingTimer()
    }

    speechRecognition.value.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      sendVoiceMessage(transcript)
    }

    speechRecognition.value.onend = () => {
      isRecording.value = false
      stopRecordingTimer()
    }

    speechRecognition.value.onerror = (event) => {
      console.error('语音识别错误:', event.error)
      isRecording.value = false
      stopRecordingTimer()
      appStore.showToast('语音识别失败', 'error')
    }
  }
}

const initSpeechSynthesis = () => {
  if ('speechSynthesis' in window) {
    speechSynthesis.value = window.speechSynthesis
  }
}

const toggleMicrophone = () => {
  if (isMicrophoneActive.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

const startRecording = () => {
  if (speechRecognition.value && !isRecording.value) {
    isMicrophoneActive.value = true
    speechRecognition.value.start()
  } else {
    appStore.showToast('您的浏览器不支持语音识别', 'error')
  }
}

const stopRecording = () => {
  if (speechRecognition.value && isRecording.value) {
    speechRecognition.value.stop()
  }
  isMicrophoneActive.value = false
}

const startRecordingTimer = () => {
  recordingDuration.value = 0
  recordingTimer.value = setInterval(() => {
    recordingDuration.value++
    if (recordingDuration.value >= 60) {
      stopRecording()
    }
  }, 1000)
}

const stopRecordingTimer = () => {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
  recordingDuration.value = 0
}

const sendQuickReply = (reply) => {
  sendMessage(reply.text, 'user')
}

const sendTextMessage = () => {
  if (textInput.value.trim()) {
    sendMessage(textInput.value.trim(), 'user')
    textInput.value = ''
  }
}

const sendVoiceMessage = (transcript) => {
  sendMessage(transcript, 'user')
}

const sendMessage = async (text, sender) => {
  const message = {
    id: Date.now(),
    sender: sender,
    text: text,
    timestamp: new Date()
  }

  conversationMessages.value.push(message)
  scrollToBottom()

  if (sender === 'user') {
    // 获取AI回复
    await getAIResponse(text)
  }
}

const getAIResponse = async (userMessage) => {
  isAITyping.value = true

  try {
    // 构建祭拜场景的上下文
    const worshipContext = {
      scene: 'worship',
      deceased: props.cemetery.deceasedName,
      location: props.cemetery.name,
      relationship: '后代',
      currentOfferings: selectedOfferings.value,
      currentPrayers: selectedPrayers.value
    }

    const response = await fetch('/api/ai-ancestor/worship-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify({
        message: userMessage,
        context: worshipContext,
        conversationHistory: conversationMessages.value.slice(-10)
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        const aiMessage = {
          id: Date.now(),
          sender: 'ai',
          text: result.data.response,
          timestamp: new Date()
        }

        conversationMessages.value.push(aiMessage)
        scrollToBottom()

        // 播放AI语音
        speakMessage(aiMessage.text)
      }
    }
  } catch (error) {
    console.error('获取AI回复失败:', error)
    const errorMessage = {
      id: Date.now(),
      sender: 'ai',
      text: '孩子，我现在听不太清楚，稍后再试试吧。',
      timestamp: new Date()
    }
    conversationMessages.value.push(errorMessage)
    scrollToBottom()
  } finally {
    isAITyping.value = false
  }
}

const speakMessage = (text) => {
  if (speechSynthesis.value) {
    // 停止当前播放
    speechSynthesis.value.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.8 // 稍慢的语速，更庄重
    utterance.pitch = 0.9 // 稍低的音调
    utterance.volume = musicVolume.value / 100

    utterance.onstart = () => {
      isAISpeaking.value = true
    }

    utterance.onend = () => {
      isAISpeaking.value = false
    }

    utterance.onerror = () => {
      isAISpeaking.value = false
    }

    speechSynthesis.value.speak(utterance)
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (conversationHistory.value) {
      conversationHistory.value.scrollTop = conversationHistory.value.scrollHeight
    }
  }, 100)
}

const formatMessageTime = (timestamp) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const saveConversationRecord = async () => {
  if (conversationMessages.value.length > 1) { // 除了开场白
    try {
      await fetch('/api/ai-ancestor/worship-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${appStore.token}`
        },
        body: JSON.stringify({
          cemeteryId: props.cemetery.id,
          messages: conversationMessages.value,
          duration: worshipDuration.value
        })
      })
    } catch (error) {
      console.error('保存对话记录失败:', error)
    }
  }
}
</script>

<style scoped>
.virtual-worship-scene {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

/* 场景容器 */
.scene-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.scene-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  perspective: 1000px;
}

/* 背景环境 */
.scene-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.scene-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.8) contrast(1.1);
}

/* 天气效果 */
.weather-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.rain-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.raindrop {
  position: absolute;
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.6));
  animation: rain-fall linear infinite;
}

@keyframes rain-fall {
  from {
    transform: translateY(-100vh);
  }
  to {
    transform: translateY(100vh);
  }
}

.snow-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.snowflake {
  position: absolute;
  color: white;
  font-size: 14px;
  animation: snow-fall linear infinite;
}

@keyframes snow-fall {
  from {
    transform: translateY(-100vh) rotate(0deg);
  }
  to {
    transform: translateY(100vh) rotate(360deg);
  }
}

.fog-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  animation: fog-drift 10s ease-in-out infinite;
}

@keyframes fog-drift {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* 光照效果 */
.lighting-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.lighting-effects.soft_golden .light-rays {
  background: radial-gradient(
    ellipse at center top,
    rgba(255, 215, 0, 0.3) 0%,
    rgba(255, 215, 0, 0.1) 50%,
    transparent 100%
  );
  height: 100%;
}

.lighting-effects.natural_daylight .ambient-glow {
  background: linear-gradient(
    to bottom,
    rgba(135, 206, 235, 0.2) 0%,
    transparent 50%
  );
  height: 100%;
}

/* 纪念碑/墓碑 */
.memorial-stone {
  position: absolute;
  bottom: 30%;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 280px;
  perspective: 800px;
}

.stone-surface {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #e0e0e0, #c0c0c0);
  border-radius: 8px 8px 0 0;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  position: relative;
}

.memorial-stone.traditional_chinese .stone-surface {
  background: linear-gradient(145deg, #8B4513, #654321);
  border-radius: 12px 12px 0 0;
}

.memorial-stone.modern_garden .stone-surface {
  background: linear-gradient(145deg, #2F4F4F, #1C1C1C);
  border-radius: 4px;
}

.inscription {
  text-align: center;
  color: #333;
  margin-bottom: 16px;
}

.memorial-stone.traditional_chinese .inscription {
  color: #FFD700;
}

.memorial-stone.modern_garden .inscription {
  color: #E0E0E0;
}

.deceased-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.life-dates {
  font-size: 12px;
  margin-bottom: 8px;
  opacity: 0.8;
}

.epitaph {
  font-size: 10px;
  font-style: italic;
  opacity: 0.7;
  line-height: 1.4;
}

.portrait-photo {
  width: 60px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.portrait-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 装饰物品 */
.decorations {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  align-items: flex-end;
}

.decoration-item {
  position: relative;
}

/* 香炉 */
.incense-burner {
  width: 40px;
  height: 30px;
  position: relative;
}

.burner-body {
  width: 100%;
  height: 20px;
  background: linear-gradient(145deg, #8B4513, #654321);
  border-radius: 50% 50% 20% 20%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.incense-sticks {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 3px;
}

.incense-stick {
  width: 2px;
  height: 15px;
  background: #8B4513;
  position: relative;
}

.smoke {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 20px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.6), transparent);
  border-radius: 50%;
  animation: smoke-rise 3s ease-in-out infinite;
}

@keyframes smoke-rise {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translateX(-50%) translateY(-20px) scale(1.5);
    opacity: 0;
  }
}

/* 花瓶 */
.flower-vase {
  width: 30px;
  height: 40px;
  position: relative;
}

.vase-body {
  width: 100%;
  height: 25px;
  background: linear-gradient(145deg, #4169E1, #1E90FF);
  border-radius: 0 0 50% 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.flowers {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
}

.flower {
  width: 6px;
  height: 20px;
  position: relative;
}

.stem {
  width: 2px;
  height: 15px;
  background: #228B22;
  margin: 0 auto;
}

.bloom {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.flower.chrysanthemum .bloom {
  background: #FFD700;
}

.flower.other .bloom {
  background: #FF69B4;
}

/* 供品台 */
.offering-table {
  width: 60px;
  height: 20px;
  background: linear-gradient(145deg, #8B4513, #654321);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  position: relative;
}

.table-surface {
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  display: flex;
  gap: 4px;
  justify-content: center;
}

.offering-item {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  overflow: hidden;
}

.offering-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 蜡烛 */
.candles {
  display: flex;
  gap: 8px;
}

.candle {
  width: 8px;
  height: 25px;
  position: relative;
}

.candle-body {
  width: 100%;
  height: 20px;
  background: linear-gradient(145deg, #FFF8DC, #F5DEB3);
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.flame {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 8px;
  background: radial-gradient(ellipse at center, #FFD700 0%, #FF4500 70%, transparent 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: flame-flicker 1s ease-in-out infinite alternate;
}

@keyframes flame-flicker {
  0% {
    transform: translateX(-50%) scale(1) rotate(-2deg);
  }
  100% {
    transform: translateX(-50%) scale(1.1) rotate(2deg);
  }
}

/* 虚拟人物 */
.virtual-person {
  position: absolute;
  bottom: 15%;
  right: 30%;
  width: 60px;
  height: 120px;
  transition: all 0.5s ease;
}

.person-body {
  width: 100%;
  height: 100%;
  position: relative;
}

.head {
  width: 20px;
  height: 20px;
  background: #FDBCB4;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.torso {
  width: 30px;
  height: 40px;
  background: #4A90E2;
  position: absolute;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 4px 4px 0 0;
}

.arms {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 30px;
}

.arm {
  width: 15px;
  height: 25px;
  background: #FDBCB4;
  border-radius: 8px;
  position: absolute;
  top: 0;
}

.arm.left {
  left: 0;
  transform-origin: top center;
}

.arm.right {
  right: 0;
  transform-origin: top center;
}

.legs {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 35px;
}

.leg {
  width: 12px;
  height: 35px;
  background: #2C3E50;
  border-radius: 6px;
  position: absolute;
  bottom: 0;
}

.leg.left {
  left: 2px;
}

.leg.right {
  right: 2px;
}

/* 动作状态 */
.virtual-person.bow .torso {
  transform: translateX(-50%) rotateX(30deg);
}

.virtual-person.bow .head {
  transform: translateX(-50%) rotateX(45deg);
}

.virtual-person.kneel .legs {
  height: 20px;
}

.virtual-person.kneel .torso {
  top: 40px;
}

.virtual-person.pray .arm.left,
.virtual-person.pray .arm.right {
  transform: rotateZ(-45deg);
}

.virtual-person.pray .arms {
  top: 25px;
}

.virtual-person.offering .arm.right {
  transform: rotateZ(-90deg) translateY(-10px);
}

/* 动作效果 */
.prayer-aura {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: prayer-pulse 2s ease-in-out infinite;
}

@keyframes prayer-pulse {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateX(-50%) scale(1.2);
    opacity: 0.6;
  }
}

.offering-glow {
  position: absolute;
  top: 10px;
  right: -10px;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: offering-sparkle 1s ease-in-out infinite;
}

@keyframes offering-sparkle {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

/* 音效可视化 */
.audio-visualization {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 40px;
}

.audio-bar {
  width: 3px;
  background: linear-gradient(to top, #07c160, #4CAF50);
  border-radius: 2px;
  animation: audio-bounce 0.5s ease-in-out infinite alternate;
}

@keyframes audio-bounce {
  0% {
    height: 10%;
  }
  100% {
    height: 100%;
  }
}

/* 控制界面 */
.worship-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
  backdrop-filter: blur(10px);
  color: white;
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
  border-radius: 20px 20px 0 0;
}

.scene-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.close-btn, .fullscreen-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover, .fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.scene-info {
  text-align: center;
  flex: 1;
}

.scene-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.scene-info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

/* 祭拜动作 */
.worship-actions {
  margin-bottom: 24px;
}

.worship-actions h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #FFD700;
  transform: translateY(-2px);
}

.action-btn.active {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  border-color: #FFD700;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn span {
  font-size: 12px;
  font-weight: 500;
}

.action-duration {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 8px;
}

/* 供品选择 */
.offerings-section {
  margin-bottom: 24px;
}

.offerings-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.offering-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-size: 12px;
}

.category-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.category-btn.active {
  background: #07c160;
  border-color: #07c160;
}

.offering-items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.offering-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.offering-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.offering-item.selected {
  background: rgba(7, 193, 96, 0.3);
  border-color: #07c160;
}

.offering-item img {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  object-fit: cover;
}

.offering-item span {
  font-size: 10px;
  text-align: center;
  color: white;
}

.item-cost {
  font-size: 8px;
  color: #FFD700;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 4px;
  border-radius: 4px;
}

/* AI祖先对话 */
.ai-conversation-section {
  margin-bottom: 24px;
}

.ai-conversation-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.ai-conversation-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
}

.ai-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #FFD700;
}

.ai-toggle-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.microphone-btn {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.microphone-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.microphone-btn.active {
  background: #07c160;
  border-color: #07c160;
}

.microphone-btn.recording {
  background: #FF4444;
  border-color: #FF4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.ai-conversation-panel {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ancestor-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
}

.ancestor-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #FFD700;
}

.speaking-indicator {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.speaking-indicator.active {
  opacity: 1;
}

.speaking-indicator .wave {
  width: 2px;
  height: 8px;
  background: white;
  margin: 0 1px;
  border-radius: 1px;
  animation: wave 1s infinite ease-in-out;
}

.speaking-indicator .wave:nth-child(2) {
  animation-delay: 0.1s;
}

.speaking-indicator .wave:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes wave {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

.conversation-history {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.message {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
}

.message.user .message-content {
  background: #07c160;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.ai .message-content {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-bottom-left-radius: 4px;
}

.message-text {
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.message-time {
  font-size: 10px;
  opacity: 0.7;
  text-align: right;
}

.message.ai .message-time {
  text-align: left;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.quick-reply-btn {
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 10px;
}

.quick-reply-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #FFD700;
}

.voice-input-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;
}

.recording-animation {
  position: relative;
  width: 40px;
  height: 40px;
}

.pulse {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #FF4444;
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.recording-text {
  font-size: 12px;
  color: #FFD700;
  text-align: center;
}

.recording-timer {
  font-size: 14px;
  font-weight: bold;
  color: #FF4444;
}

.text-input-section {
  margin-top: 8px;
}

.input-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-container input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  color: white;
  font-size: 12px;
}

.input-container input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-container input:focus {
  outline: none;
  border-color: #FFD700;
  background: rgba(255, 255, 255, 0.15);
}

.send-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #07c160;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover {
  background: #06a552;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 祈福祷告 */
.prayer-section {
  margin-bottom: 24px;
}

.prayer-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.prayer-templates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.prayer-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.prayer-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #FFD700;
}

.custom-prayer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-prayer textarea {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 8px;
  font-size: 12px;
  resize: none;
}

.custom-prayer textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.add-prayer-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  align-self: flex-start;
}

/* 音乐氛围 */
.atmosphere-section {
  margin-bottom: 24px;
}

.atmosphere-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.music-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.music-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-size: 12px;
}

.music-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.music-btn.active {
  background: #4A90E2;
  border-color: #4A90E2;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-control input[type="range"] {
  flex: 1;
  accent-color: #07c160;
}

/* 完成祭拜 */
.worship-completion {
  text-align: center;
}

.complete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.complete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
}

.complete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 祭拜记录弹窗 */
.worship-record-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.record-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 300px;
  width: 90%;
  text-align: center;
  color: #333;
}

.record-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.record-summary {
  margin-bottom: 20px;
  text-align: left;
}

.record-summary > div {
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.record-actions {
  display: flex;
  gap: 12px;
}

.save-btn, .share-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.save-btn {
  background: #07c160;
  color: white;
}

.share-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .worship-controls {
    max-height: 50vh;
  }

  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .offering-items {
    grid-template-columns: repeat(3, 1fr);
  }

  .memorial-stone {
    width: 150px;
    height: 210px;
  }

  .virtual-person {
    width: 45px;
    height: 90px;
  }
}

@media (max-width: 480px) {
  .worship-controls {
    padding: 16px;
  }

  .action-buttons {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .offering-items {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
