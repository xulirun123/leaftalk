<template>
  <div class="ai-ancestor-chat-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      :title="`与${memberInfo?.name}对话`" 
      :showBack="true"
      @back="goBack"
    >
      <template #right>
        <button @click="toggleVideoCall" class="video-btn" :class="{ active: isVideoCall }">
          <iconify-icon :icon="isVideoCall ? 'heroicons:video-camera' : 'heroicons:video-camera-slash'" width="20"></iconify-icon>
        </button>
      </template>
    </MobileTopBar>

    <!-- 主要内容 -->
    <div class="chat-content">
      <!-- AI模拟标识 -->
      <div class="ai-notice">
        <iconify-icon icon="heroicons:cpu-chip" width="16"></iconify-icon>
        <span>AI模拟对话 - 基于生前音视频资料生成</span>
        <div class="training-status" v-if="trainingStatus">
          <div class="status-indicator" :class="trainingStatus.status">
            <iconify-icon :icon="getTrainingIcon(trainingStatus.status)" width="12"></iconify-icon>
          </div>
          <span>{{ getTrainingText(trainingStatus.status) }}</span>
          <div v-if="trainingStatus.status === 'training'" class="progress-bar">
            <div class="progress-fill" :style="{ width: trainingStatus.progress + '%' }"></div>
          </div>
        </div>
        <button @click="showTrainingModal" class="training-btn">
          <iconify-icon icon="heroicons:academic-cap" width="14"></iconify-icon>
          <span>训练资料</span>
        </button>
      </div>

      <!-- 视频通话区域 -->
      <div v-if="isVideoCall" class="video-call-area">
        <div class="video-container">
          <!-- AI虚拟形象 -->
          <div class="ai-avatar-container" :class="aiActionState.currentAction">
            <div class="ai-avatar" :class="{
              speaking: aiSpeaking,
              performing: aiActionState.isPerforming,
              [aiActionState.currentAction]: true
            }">
              <img
                :src="memberInfo?.avatar || '/default-avatar.png'"
                :alt="memberInfo?.name"
                class="avatar-image"
              />
              <div class="ai-indicator">
                <iconify-icon icon="heroicons:cpu-chip" width="12"></iconify-icon>
              </div>

              <!-- 动作特效层 -->
              <div v-if="aiActionState.isPerforming" class="action-effects">
                <div v-if="aiActionState.currentAction === 'dancing'" class="dance-effects">
                  <div class="music-notes">♪ ♫ ♪ ♫</div>
                </div>
                <div v-if="aiActionState.currentAction === 'singing'" class="sing-effects">
                  <div class="sound-waves"></div>
                </div>
                <div v-if="aiActionState.currentAction === 'laughing'" class="laugh-effects">
                  <div class="laugh-bubbles">😄 😆 😂</div>
                </div>
              </div>
            </div>
            <div class="avatar-name">{{ memberInfo?.name }}</div>
            <div class="avatar-status">
              <span v-if="aiSpeaking">正在说话...</span>
              <span v-else-if="aiActionState.isPerforming">{{ getCurrentActionName() }}</span>
              <span v-else>等待中</span>
            </div>
          </div>

          <!-- 用户视频 -->
          <div class="user-video-container">
            <video ref="userVideo" class="user-video" muted autoplay></video>
            <div v-if="!cameraEnabled" class="camera-disabled-overlay">
              <iconify-icon icon="heroicons:video-camera-slash" width="32" color="#666"></iconify-icon>
              <span>摄像头已关闭</span>
            </div>
            <div class="user-controls">
              <button @click="toggleMicrophone" class="control-btn" :class="{ muted: !microphoneEnabled }">
                <iconify-icon :icon="microphoneEnabled ? 'heroicons:microphone' : 'heroicons:microphone-slash'" width="16"></iconify-icon>
              </button>
              <button @click="toggleCamera" class="control-btn" :class="{ disabled: !cameraEnabled }">
                <iconify-icon :icon="cameraEnabled ? 'heroicons:video-camera' : 'heroicons:video-camera-slash'" width="16"></iconify-icon>
              </button>
              <button @click="toggleVideoCall" class="control-btn end-call">
                <iconify-icon icon="heroicons:phone-x-mark" width="16"></iconify-icon>
              </button>
            </div>
          </div>

          <!-- AI智能动作提示 -->
          <div v-if="aiActionState.isPerforming" class="ai-action-hint">
            <div class="action-info">
              <span class="action-emoji">{{ getCurrentActionIcon() }}</span>
              <span class="action-text">{{ getCurrentActionName() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="messages-area" :class="{ 'with-video': isVideoCall }">
        <div class="messages-list" ref="messagesList">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message-item"
            :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }"
          >
            <div class="message-avatar">
              <img 
                :src="message.isUser ? (userInfo?.avatar || '/default-avatar.png') : (memberInfo?.avatar || '/default-avatar.png')"
                :alt="message.isUser ? userInfo?.name : memberInfo?.name"
              />
              <div v-if="!message.isUser" class="ai-badge">
                <iconify-icon icon="heroicons:cpu-chip" width="8"></iconify-icon>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <p>{{ message.content }}</p>
                <div v-if="message.audioUrl" class="audio-player">
                  <button @click="playAudio(message.audioUrl)" class="play-btn">
                    <iconify-icon icon="heroicons:play" width="16"></iconify-icon>
                  </button>
                  <span>语音消息</span>
                </div>
              </div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>

          <!-- AI思考中 -->
          <div v-if="aiThinking" class="message-item ai-message">
            <div class="message-avatar">
              <img :src="memberInfo?.avatar || '/default-avatar.png'" :alt="memberInfo?.name" />
              <div class="ai-badge">
                <iconify-icon icon="heroicons:cpu-chip" width="8"></iconify-icon>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble thinking">
                <div class="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-container">
          <button @click="toggleVoiceInput" class="voice-btn" :class="{ active: isVoiceInput }">
            <iconify-icon :icon="isVoiceInput ? 'heroicons:stop' : 'heroicons:microphone'" width="20"></iconify-icon>
          </button>
          <div class="text-input-container">
            <textarea 
              v-model="inputText"
              placeholder="输入消息..."
              class="message-input"
              rows="1"
              @keydown.enter.prevent="sendMessage"
              :disabled="isVoiceInput"
            ></textarea>
          </div>
          <button @click="sendMessage" class="send-btn" :disabled="!canSend">
            <iconify-icon icon="heroicons:paper-airplane" width="20"></iconify-icon>
          </button>
        </div>

        <!-- 语音输入状态 -->
        <div v-if="isVoiceInput" class="voice-input-status">
          <div class="voice-wave">
            <div class="wave-bar" v-for="i in 5" :key="i"></div>
          </div>
          <span>正在录音，点击停止</span>
        </div>

        <!-- 快捷问题 -->
        <div class="quick-questions">
          <button 
            v-for="question in quickQuestions" 
            :key="question"
            @click="askQuestion(question)"
            class="quick-question-btn"
          >
            {{ question }}
          </button>
        </div>
      </div>
    </div>

    <!-- AI能力说明弹窗 -->
    <div v-if="showAIInfo" class="modal-overlay" @click="closeAIInfo">
      <div class="ai-info-modal" @click.stop>
        <div class="modal-header">
          <h3>AI对话说明</h3>
          <button @click="closeAIInfo" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <div class="ai-capabilities">
            <div class="capability-item">
              <iconify-icon icon="heroicons:chat-bubble-left-right" width="24" class="capability-icon"></iconify-icon>
              <div class="capability-info">
                <h4>智能对话</h4>
                <p>基于生前语音数据训练的AI模型，能够模拟真实的对话风格</p>
              </div>
            </div>
            <div class="capability-item">
              <iconify-icon icon="heroicons:speaker-wave" width="24" class="capability-icon"></iconify-icon>
              <div class="capability-info">
                <h4>语音合成</h4>
                <p>使用先进的语音合成技术，还原生前的声音特征</p>
              </div>
            </div>
            <div class="capability-item">
              <iconify-icon icon="heroicons:face-smile" width="24" class="capability-icon"></iconify-icon>
              <div class="capability-info">
                <h4>表情同步</h4>
                <p>虚拟形象能够根据对话内容展现相应的表情和动作</p>
              </div>
            </div>
          </div>
          <div class="ai-limitations">
            <h4>使用说明</h4>
            <ul>
              <li>AI回复基于已有数据，可能与真实情况有差异</li>
              <li>建议将此功能用于情感慰藉和纪念目的</li>
              <li>对话内容会被记录用于改进AI模型</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 训练资料管理弹窗 -->
    <div v-if="showTrainingModalFlag" class="modal-overlay" @click="closeTrainingModal">
      <div class="training-modal" @click.stop>
        <div class="modal-header">
          <h3>AI训练资料管理</h3>
          <button @click="closeTrainingModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <!-- 训练状态概览 -->
          <div class="training-overview">
            <div class="overview-card">
              <div class="card-icon">
                <iconify-icon icon="heroicons:video-camera" width="24" color="#07c160"></iconify-icon>
              </div>
              <div class="card-info">
                <h4>视频资料</h4>
                <p>{{ trainingData.videos.length }} 个文件</p>
                <span class="status">{{ trainingData.videoStatus }}</span>
              </div>
            </div>
            <div class="overview-card">
              <div class="card-icon">
                <iconify-icon icon="heroicons:microphone" width="24" color="#3742fa"></iconify-icon>
              </div>
              <div class="card-info">
                <h4>语音资料</h4>
                <p>{{ trainingData.audios.length }} 个文件</p>
                <span class="status">{{ trainingData.audioStatus }}</span>
              </div>
            </div>
          </div>

          <!-- 上传区域 -->
          <div class="upload-section">
            <h4>上传训练资料</h4>
            <div class="upload-tabs">
              <button
                class="upload-tab"
                :class="{ active: uploadTab === 'video' }"
                @click="uploadTab = 'video'"
              >
                <iconify-icon icon="heroicons:video-camera" width="16"></iconify-icon>
                <span>视频资料</span>
              </button>
              <button
                class="upload-tab"
                :class="{ active: uploadTab === 'audio' }"
                @click="uploadTab = 'audio'"
              >
                <iconify-icon icon="heroicons:microphone" width="16"></iconify-icon>
                <span>语音资料</span>
              </button>
            </div>

            <!-- 视频上传 -->
            <div v-if="uploadTab === 'video'" class="upload-area">
              <div class="upload-tips">
                <iconify-icon icon="heroicons:information-circle" width="16" color="#ffa502"></iconify-icon>
                <span>建议上传清晰的正面视频，包含说话场景，时长1-5分钟</span>
              </div>
              <div class="file-upload" @click="uploadVideos">
                <iconify-icon icon="heroicons:cloud-arrow-up" width="32" color="#07c160"></iconify-icon>
                <h4>点击上传视频文件</h4>
                <p>支持 MP4, MOV, AVI 格式，单个文件不超过100MB</p>
              </div>
              <div v-if="trainingData.videos.length > 0" class="uploaded-files">
                <h5>已上传的视频</h5>
                <div
                  v-for="(video, index) in trainingData.videos"
                  :key="index"
                  class="file-item"
                >
                  <div class="file-info">
                    <iconify-icon icon="heroicons:video-camera" width="16"></iconify-icon>
                    <span>{{ video.name }}</span>
                    <span class="file-size">{{ formatFileSize(video.size) }}</span>
                  </div>
                  <div class="file-actions">
                    <span class="file-status" :class="video.status">{{ getFileStatusText(video.status) }}</span>
                    <button @click="removeFile('videos', index)" class="remove-btn">
                      <iconify-icon icon="heroicons:trash" width="14"></iconify-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 语音上传 -->
            <div v-if="uploadTab === 'audio'" class="upload-area">
              <div class="upload-tips">
                <iconify-icon icon="heroicons:information-circle" width="16" color="#ffa502"></iconify-icon>
                <span>建议上传清晰的语音录音，包含不同情绪和语调</span>
              </div>
              <div class="file-upload" @click="uploadAudios">
                <iconify-icon icon="heroicons:cloud-arrow-up" width="32" color="#3742fa"></iconify-icon>
                <h4>点击上传语音文件</h4>
                <p>支持 MP3, WAV, M4A 格式，单个文件不超过50MB</p>
              </div>
              <div v-if="trainingData.audios.length > 0" class="uploaded-files">
                <h5>已上传的语音</h5>
                <div
                  v-for="(audio, index) in trainingData.audios"
                  :key="index"
                  class="file-item"
                >
                  <div class="file-info">
                    <iconify-icon icon="heroicons:microphone" width="16"></iconify-icon>
                    <span>{{ audio.name }}</span>
                    <span class="file-size">{{ formatFileSize(audio.size) }}</span>
                  </div>
                  <div class="file-actions">
                    <span class="file-status" :class="audio.status">{{ getFileStatusText(audio.status) }}</span>
                    <button @click="removeFile('audios', index)" class="remove-btn">
                      <iconify-icon icon="heroicons:trash" width="14"></iconify-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 训练控制 -->
          <div class="training-control">
            <div class="training-info">
              <h4>AI模型训练</h4>
              <p>上传资料后，AI将在后台学习外貌、神态、语音特征</p>
              <div v-if="trainingStatus" class="current-status">
                <span>当前状态：</span>
                <span :class="'status-' + trainingStatus.status">{{ getTrainingText(trainingStatus.status) }}</span>
                <div v-if="trainingStatus.status === 'training'" class="training-progress">
                  <div class="progress-bar-large">
                    <div class="progress-fill" :style="{ width: trainingStatus.progress + '%' }"></div>
                  </div>
                  <span>{{ trainingStatus.progress }}%</span>
                </div>
              </div>
            </div>
            <div class="training-actions">
              <button
                @click="startTraining"
                :disabled="!canStartTraining || trainingStatus?.status === 'training'"
                class="start-training-btn"
              >
                <iconify-icon icon="heroicons:play" width="16"></iconify-icon>
                <span>{{ trainingStatus?.status === 'training' ? '训练中...' : '开始训练' }}</span>
              </button>
              <button
                v-if="trainingStatus?.status === 'training'"
                @click="stopTraining"
                class="stop-training-btn"
              >
                <iconify-icon icon="heroicons:stop" width="16"></iconify-icon>
                <span>停止训练</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { useAppStore } from '../../../shared/stores/appStore'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'

// 语音识别类型声明
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
    currentRecognition: any
  }
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.genealogyId)
const memberId = ref(route.params.memberId)
const isVideoCall = ref(false)
const isVoiceInput = ref(false)
const aiThinking = ref(false)
const aiSpeaking = ref(false)
const microphoneEnabled = ref(true)
const cameraEnabled = ref(true)
const inputText = ref('')

// 智能语音表达系统
const voiceExpressionSystem = ref({
  // 语音组合模式
  speechPatterns: {
    // 开场白模式
    openings: {
      casual: ['嗯', '那个', '你知道吗', '说起来', '对了'],
      formal: ['首先', '让我想想', '关于这个问题', '从我的经验来看'],
      emotional: ['哎呀', '天哪', '我的孩子', '亲爱的', '宝贝'],
      storytelling: ['从前啊', '那时候', '我记得', '有一次', '说来话长']
    },

    // 连接词模式
    connectors: {
      continuation: ['然后呢', '接着', '后来', '再说', '另外'],
      contrast: ['但是', '不过', '可是', '然而', '话说回来'],
      emphasis: ['特别是', '尤其是', '最重要的是', '关键是', '要知道'],
      conclusion: ['总之', '所以说', '这样看来', '最后', '归根结底']
    },

    // 结尾模式
    endings: {
      questioning: ['你觉得呢？', '是不是这样？', '你明白吗？', '对吧？'],
      caring: ['要记住啊', '一定要注意', '千万别忘了', '好好保重'],
      encouraging: ['加油！', '你一定可以的', '我相信你', '别放弃'],
      nostalgic: ['唉，时间过得真快', '想想都是往事了', '那些日子啊']
    }
  },

  // 语音修饰技巧
  speechModifiers: {
    // 停顿技巧
    pauses: {
      dramatic: '<break time="800ms"/>',
      thoughtful: '<break time="500ms"/>',
      natural: '<break time="300ms"/>',
      quick: '<break time="150ms"/>'
    },

    // 重音技巧
    emphasis: {
      strong: '<emphasis level="strong">',
      moderate: '<emphasis level="moderate">',
      reduced: '<emphasis level="reduced">'
    },

    // 语速变化
    rateChanges: {
      slow: '<prosody rate="slow">',
      fast: '<prosody rate="fast">',
      xslow: '<prosody rate="x-slow">',
      xfast: '<prosody rate="x-fast">'
    },

    // 音调变化
    pitchChanges: {
      high: '<prosody pitch="high">',
      low: '<prosody pitch="low">',
      xhigh: '<prosody pitch="x-high">',
      xlow: '<prosody pitch="x-low">'
    }
  },

  // 方言和口音特征
  dialectFeatures: {
    northern: {
      characteristics: ['儿化音', '卷舌音'],
      replacements: {
        '这里': '这儿',
        '那里': '那儿',
        '哪里': '哪儿',
        '一点': '一点儿'
      }
    },
    southern: {
      characteristics: ['软音', '平舌音'],
      replacements: {
        '什么': '啥子',
        '这样': '这样子',
        '那样': '那样子'
      }
    }
  }
})

// 场景化语言表达系统
const scenarioExpressions = ref({
  // 日常问候场景
  greeting: {
    morning: {
      happy: ['早上好啊，孩子！看你精神这么好，我就放心了。', '早啊！今天天气不错，心情也很好呢。'],
      neutral: ['早上好，你来了。', '早，昨晚睡得好吗？'],
      tired: ['早...我刚起来，还有点困呢。', '早上好，我年纪大了，起得有点晚。']
    },
    evening: {
      happy: ['晚上好！今天过得怎么样？', '晚上好，看到你我就高兴。'],
      neutral: ['晚上好。', '你来了，坐下聊聊吧。'],
      worried: ['晚上好，你看起来有些疲惫，是不是太累了？']
    }
  },

  // 家庭教育场景
  education: {
    encouraging: {
      proud: ['你做得很好！我为你感到骄傲。', '这就对了，继续努力！'],
      loving: ['孩子，你一直都很棒，要相信自己。', '我知道你能行的，加油！']
    },
    correcting: {
      stern: ['这样做是不对的，你要改正。', '年轻人，这个习惯不好，要改掉。'],
      patient: ['来，我们慢慢说，这件事应该这样做...', '没关系，犯错是正常的，重要的是要学会改正。']
    }
  },

  // 情感安慰场景
  comfort: {
    sadness: {
      gentle: ['孩子，别难过了，有什么事情告诉我。', '来，让我抱抱你，一切都会好起来的。'],
      understanding: ['我知道你现在很难受，但这些都会过去的。', '人生总有起起落落，重要的是要坚强。']
    },
    worry: {
      reassuring: ['别担心，有我在呢。', '这点困难算什么，我们家的人都很坚强。'],
      protective: ['不要怕，我会保护你的。', '有什么事情尽管告诉我，我们一起面对。']
    }
  },

  // 回忆分享场景
  memories: {
    nostalgic: {
      warm: ['说起这个，我想起了你小时候...', '那时候啊，我们虽然穷，但很幸福。'],
      detailed: ['我记得那是在1985年的春天，那时候你才5岁...', '让我想想，那件事发生在哪一年来着...']
    },
    storytelling: {
      engaging: ['我给你讲个故事吧，这是我小时候听过的。', '从前啊，有一个...'],
      mysterious: ['你知道吗？我们家族有一个秘密...', '这件事很少有人知道...']
    }
  },

  // 生气训斥场景
  anger: {
    mild: {
      disappointed: ['我对你很失望。', '你怎么能这样做呢？'],
      stern: ['这样不行，你必须改正。', '年轻人，你要为自己的行为负责。']
    },
    intense: {
      angry: ['你这是在做什么？！', '我怎么教出你这样的孩子！'],
      furious: ['太过分了！我绝对不能容忍！', '你给我站住！必须给我一个解释！']
    }
  }
})

// 智能动作触发关键词
const actionTriggers = ref({
  // 问候动作触发词
  greeting: {
    wave: ['你好', '见面', '打招呼', '挥手'],
    nod: ['对', '是的', '同意', '没错', '嗯'],
    shake_head: ['不对', '不是', '不同意', '错了']
  },
  // 情感动作触发词
  emotion: {
    laugh: ['哈哈', '好笑', '有趣', '搞笑', '开心', '高兴'],
    smile: ['微笑', '笑一下', '开心', '高兴'],
    think: ['想想', '思考', '考虑', '让我想想']
  },
  // 表演动作触发词
  performance: {
    dance_traditional: ['跳舞', '舞蹈', '传统舞', '民族舞'],
    dance_modern: ['现代舞', '跳个舞'],
    sing_folk: ['唱歌', '民歌', '唱首歌', '来首歌'],
    sing_opera: ['戏曲', '唱戏', '京剧', '豫剧'],
    tell_story: ['讲故事', '说故事', '故事', '从前']
  },
  // 运动动作触发词
  exercise: {
    tai_chi: ['太极', '太极拳', '打太极'],
    morning_exercise: ['运动', '锻炼', '健身', '晨练']
  },
  // 生活动作触发词
  life: {
    cooking_demo: ['做菜', '烹饪', '做饭', '厨艺'],
    gardening: ['种花', '园艺', '种菜', '花草']
  },
  // 艺术动作触发词
  art: {
    calligraphy: ['写字', '书法', '毛笔字'],
    painting: ['画画', '绘画', '作画']
  }
})
const showAIInfo = ref(false)

const userInfo = ref(authStore.user)
const memberInfo = ref({
  id: memberId.value,
  name: '张三',
  avatar: '',
  personality: '温和慈祥，喜欢讲故事',
  voiceModel: 'trained_model_v1'
})

const messages = ref([
  {
    id: 1,
    content: '你好，我的孩子。很高兴能够再次与你对话。',
    isUser: false,
    timestamp: new Date(),
    audioUrl: '/ai-voice-1.mp3'
  }
])

const quickQuestions = ref([
  '您最近过得怎么样？',
  '能给我讲讲您的故事吗？',
  '您有什么话想对我说？',
  '家族的历史是怎样的？'
])

// 训练相关状态
const showTrainingModalFlag = ref(false)
const uploadTab = ref('video')
const trainingStatus = ref({
  status: 'idle', // idle, training, completed, failed
  progress: 0,
  message: ''
})
const trainingData = ref({
  videos: [],
  audios: [],
  videoStatus: '未上传',
  audioStatus: '未上传'
})

// AI对话上下文状态
const conversationContext = ref({
  currentTopic: '', // 当前话题
  topicHistory: [], // 话题历史
  emotionalState: 'neutral', // 当前情感状态
  emotionalIntensity: 'medium', // 情感强度：low, medium, high
  conversationFlow: [], // 对话流程记录
  userPersonality: {}, // 用户性格分析
  relationshipContext: '', // 关系上下文（孙子、儿子等）
  lastTopicChange: null, // 最后话题变更时间
  conversationDepth: 0, // 对话深度
  currentMood: 'calm', // 当前心情状态
  personalityTraits: {} // AI个性特征
})

// AI情感状态系统
const emotionalStates = ref({
  // 基础情感状态
  happy: {
    name: '高兴',
    intensity: ['微笑', '开心', '兴奋', '狂欢'],
    voiceParams: { rate: 1.1, pitch: 0.9, volume: 0.9 },
    expressions: ['smile', 'laugh', 'excited_eyes'],
    bodyLanguage: ['upright_posture', 'animated_gestures', 'forward_lean']
  },
  sad: {
    name: '悲伤',
    intensity: ['失落', '难过', '伤心', '痛苦'],
    voiceParams: { rate: 0.8, pitch: 0.7, volume: 0.7 },
    expressions: ['frown', 'teary_eyes', 'downcast'],
    bodyLanguage: ['slumped_shoulders', 'slow_movements', 'withdrawn']
  },
  angry: {
    name: '生气',
    intensity: ['不满', '恼怒', '愤怒', '暴怒'],
    voiceParams: { rate: 1.2, pitch: 0.8, volume: 1.0 },
    expressions: ['furrowed_brow', 'stern_look', 'tight_lips'],
    bodyLanguage: ['tense_posture', 'sharp_gestures', 'crossed_arms']
  },
  surprised: {
    name: '惊讶',
    intensity: ['好奇', '意外', '震惊', '惊愕'],
    voiceParams: { rate: 1.0, pitch: 1.0, volume: 0.9 },
    expressions: ['wide_eyes', 'raised_eyebrows', 'open_mouth'],
    bodyLanguage: ['sudden_movement', 'forward_lean', 'alert_posture']
  },
  worried: {
    name: '担心',
    intensity: ['关心', '忧虑', '焦虑', '恐惧'],
    voiceParams: { rate: 0.9, pitch: 0.8, volume: 0.8 },
    expressions: ['concerned_look', 'furrowed_brow', 'tense_face'],
    bodyLanguage: ['protective_gesture', 'leaning_forward', 'fidgeting']
  },
  proud: {
    name: '骄傲',
    intensity: ['满意', '自豪', '骄傲', '得意'],
    voiceParams: { rate: 0.95, pitch: 0.85, volume: 0.9 },
    expressions: ['confident_smile', 'raised_chin', 'bright_eyes'],
    bodyLanguage: ['straight_posture', 'chest_out', 'steady_gestures']
  },
  nostalgic: {
    name: '怀念',
    intensity: ['回忆', '思念', '怀念', '眷恋'],
    voiceParams: { rate: 0.85, pitch: 0.75, volume: 0.8 },
    expressions: ['distant_look', 'soft_smile', 'gentle_eyes'],
    bodyLanguage: ['relaxed_posture', 'slow_gestures', 'contemplative']
  },
  loving: {
    name: '慈爱',
    intensity: ['关爱', '温暖', '慈爱', '深爱'],
    voiceParams: { rate: 0.9, pitch: 0.8, volume: 0.85 },
    expressions: ['warm_smile', 'kind_eyes', 'gentle_face'],
    bodyLanguage: ['open_arms', 'gentle_gestures', 'welcoming_posture']
  }
})

// AI动作和表演状态
const aiActionState = ref({
  currentAction: 'idle', // 当前动作：idle, talking, dancing, singing, gesturing, laughing
  actionQueue: [], // 动作队列
  isPerforming: false, // 是否正在表演
  performanceType: '', // 表演类型
  actionHistory: [], // 动作历史
  mood: 'neutral' // 当前心情
})

// 可用的AI动作列表
const availableActions = ref([
  { id: 'wave', name: '挥手', icon: '👋', category: 'greeting' },
  { id: 'nod', name: '点头', icon: '🙂', category: 'agreement' },
  { id: 'shake_head', name: '摇头', icon: '😐', category: 'disagreement' },
  { id: 'laugh', name: '大笑', icon: '😄', category: 'emotion' },
  { id: 'smile', name: '微笑', icon: '😊', category: 'emotion' },
  { id: 'think', name: '思考', icon: '🤔', category: 'emotion' },
  { id: 'dance_traditional', name: '传统舞蹈', icon: '💃', category: 'performance' },
  { id: 'dance_modern', name: '现代舞蹈', icon: '🕺', category: 'performance' },
  { id: 'sing_folk', name: '民歌演唱', icon: '🎵', category: 'performance' },
  { id: 'sing_opera', name: '戏曲演唱', icon: '🎭', category: 'performance' },
  { id: 'tell_story', name: '讲故事', icon: '📖', category: 'performance' },
  { id: 'play_instrument', name: '演奏乐器', icon: '🎻', category: 'performance' },
  { id: 'tai_chi', name: '太极拳', icon: '🥋', category: 'exercise' },
  { id: 'morning_exercise', name: '晨练', icon: '🏃', category: 'exercise' },
  { id: 'cooking_demo', name: '烹饪演示', icon: '👨‍🍳', category: 'life' },
  { id: 'gardening', name: '园艺活动', icon: '🌱', category: 'life' },
  { id: 'calligraphy', name: '书法展示', icon: '✍️', category: 'art' },
  { id: 'painting', name: '绘画展示', icon: '🎨', category: 'art' }
])

// 计算属性
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !aiThinking.value
})

const canStartTraining = computed(() => {
  return trainingData.value.videos.length > 0 || trainingData.value.audios.length > 0
})

// 生命周期
onMounted(() => {
  loadAIModel()
  showAIInfo.value = true
  initializeConversationContext()

  // 预加载语音合成
  if ('speechSynthesis' in window) {
    // 等待语音列表加载
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        console.log('语音合成已准备就绪')
      } else {
        setTimeout(loadVoices, 100)
      }
    }
    loadVoices()
  }
})

// 初始化对话上下文
const initializeConversationContext = () => {
  // 获取用户与AI的关系
  const relationship = determineRelationship()

  conversationContext.value = {
    currentTopic: '',
    topicHistory: [],
    emotionalState: 'neutral',
    conversationFlow: [],
    userPersonality: {},
    relationshipContext: relationship,
    lastTopicChange: null,
    conversationDepth: 0
  }
}

// 确定用户与AI的关系
const determineRelationship = () => {
  // 根据用户信息和成员信息确定关系
  if (!memberInfo.value) return '家人'

  const userAge = authStore.userInfo?.age || 30
  const memberAge = memberInfo.value.age || 70

  if (memberAge - userAge > 50) return '祖父/祖母'
  if (memberAge - userAge > 20) return '父亲/母亲'
  return '长辈'
}

// 更新对话上下文
const updateConversationContext = (userInput: string) => {
  const context = conversationContext.value

  // 记录用户消息
  context.conversationFlow.push({
    type: 'user',
    content: userInput,
    timestamp: new Date(),
    topic: analyzeCurrentTopic(userInput),
    emotion: analyzeUserEmotion(userInput)
  })

  // 更新当前话题
  const newTopic = analyzeCurrentTopic(userInput)
  if (newTopic && newTopic !== context.currentTopic) {
    if (context.currentTopic) {
      context.topicHistory.push({
        topic: context.currentTopic,
        endTime: new Date(),
        duration: Date.now() - (context.lastTopicChange?.getTime() || Date.now())
      })
    }
    context.currentTopic = newTopic
    context.lastTopicChange = new Date()
  }

  // 更新情感状态
  context.emotionalState = analyzeUserEmotion(userInput)

  // 更新对话深度
  context.conversationDepth = Math.min(10, context.conversationFlow.length / 2)
}

// 方法
const goBack = () => {
  router.back()
}

const loadAIModel = async () => {
  try {
    // 加载AI模型
    console.log('加载AI模型')
  } catch (error) {
    console.error('加载AI模型失败:', error)
    appStore.showToast('AI模型加载失败', 'error')
  }
}

const toggleVideoCall = async () => {
  if (!isVideoCall.value) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      const userVideo = document.querySelector('.user-video') as HTMLVideoElement
      if (userVideo) {
        userVideo.srcObject = stream
      }
      isVideoCall.value = true
    } catch (error) {
      appStore.showToast('无法访问摄像头', 'error')
    }
  } else {
    const userVideo = document.querySelector('.user-video') as HTMLVideoElement
    if (userVideo && userVideo.srcObject) {
      const stream = userVideo.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    isVideoCall.value = false
  }
}

const toggleMicrophone = () => {
  microphoneEnabled.value = !microphoneEnabled.value

  // 控制音频轨道
  const userVideo = document.querySelector('.user-video') as HTMLVideoElement
  if (userVideo && userVideo.srcObject) {
    const stream = userVideo.srcObject as MediaStream
    const audioTracks = stream.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = microphoneEnabled.value
    })
  }

  appStore.showToast(microphoneEnabled.value ? '麦克风已开启' : '麦克风已关闭', 'info')
}

const toggleCamera = () => {
  cameraEnabled.value = !cameraEnabled.value

  // 控制视频轨道
  const userVideo = document.querySelector('.user-video') as HTMLVideoElement
  if (userVideo && userVideo.srcObject) {
    const stream = userVideo.srcObject as MediaStream
    const videoTracks = stream.getVideoTracks()
    videoTracks.forEach(track => {
      track.enabled = cameraEnabled.value
    })
  }

  appStore.showToast(cameraEnabled.value ? '摄像头已开启' : '摄像头已关闭', 'info')
}

const toggleVoiceInput = () => {
  if (!isVoiceInput.value) {
    startVoiceInput()
  } else {
    stopVoiceInput()
  }
}

const startVoiceInput = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    appStore.showToast('您的浏览器不支持语音识别', 'error')
    return
  }

  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'zh-CN'

    recognition.onstart = () => {
      isVoiceInput.value = true
      appStore.showToast('请开始说话...', 'info')
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      inputText.value = transcript
      appStore.showToast('语音识别完成', 'success')
    }

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error)
      appStore.showToast('语音识别失败，请重试', 'error')
      isVoiceInput.value = false
    }

    recognition.onend = () => {
      isVoiceInput.value = false
    }

    recognition.start()
  } catch (error) {
    console.error('启动语音识别失败:', error)
    appStore.showToast('语音识别启动失败', 'error')
    isVoiceInput.value = false
  }
}

const stopVoiceInput = () => {
  isVoiceInput.value = false
  // 如果有正在进行的语音识别，停止它
  if (window.currentRecognition) {
    window.currentRecognition.stop()
  }
}

const sendMessage = async () => {
  if (!canSend.value) return

  const userMessage = {
    id: Date.now(),
    content: inputText.value.trim(),
    isUser: true,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  inputText.value = ''
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // AI思考
  aiThinking.value = true
  
  // 模拟AI回复 - 面对面聊天体验
  setTimeout(async () => {
    aiThinking.value = false
    aiSpeaking.value = true

    // 生成上下文相关的AI回复
    const aiResponse = generateContextualAIResponse(userMessage.content)

    const aiMessage = {
      id: Date.now() + 1,
      content: aiResponse.content,
      isUser: false,
      timestamp: new Date(),
      audioUrl: '/ai-voice-response.mp3',
      emotion: aiResponse.emotion,
      gesture: aiResponse.gesture
    }

    messages.value.push(aiMessage)

    // 记录到对话上下文
    conversationContext.value.conversationFlow.push({
      type: 'ai',
      content: aiResponse.content,
      timestamp: new Date(),
      topic: conversationContext.value.currentTopic,
      emotion: aiResponse.emotion
    })

    await nextTick()
    scrollToBottom()

    // 智能触发动作
    if (aiResponse.shouldPerformAction && aiResponse.action) {
      setTimeout(() => {
        triggerIntelligentAction(aiResponse.action)
      }, 1000) // 延迟1秒开始动作，让语音先开始
    }

    // 播放AI语音 - 面对面聊天时自动播放，使用情感化语音
    if (isVideoCall.value) {
      speakText(aiMessage.content, aiResponse.emotionData)
    }

    // 根据回复内容调整说话时长
    const speakingDuration = calculateSpeakingDuration(aiResponse.content)
    setTimeout(() => {
      aiSpeaking.value = false

      // 有时AI会主动继续话题（模拟真实对话）
      if (aiResponse.shouldContinue && Math.random() < 0.3) {
        setTimeout(() => {
          generateFollowUpResponse(aiResponse.content)
        }, 1000 + Math.random() * 2000)
      }
    }, speakingDuration)
  }, 1000 + Math.random() * 1500) // 更自然的思考时间
}

const askQuestion = (question: string) => {
  inputText.value = question
  sendMessage()
}

const generateAIResponse = (userInput: string) => {
  // 更新对话上下文
  updateConversationContext(userInput)

  // 分析当前话题和情感
  const currentTopic = analyzeCurrentTopic(userInput)
  const userEmotion = analyzeUserEmotion(userInput)
  const conversationIntent = analyzeConversationIntent(userInput)

  // 根据上下文生成回复
  return generateContextualResponse(userInput, currentTopic, userEmotion, conversationIntent)
}

// updateConversationContext 函数已在上面定义，删除重复声明

// 分析当前话题
const analyzeCurrentTopic = (input: string) => {
  const topicKeywords = {
    'family': ['家人', '家族', '亲人', '父母', '兄弟', '姐妹', '孩子', '孙子', '儿子', '女儿'],
    'health': ['身体', '健康', '病', '医院', '药', '锻炼', '养生'],
    'work': ['工作', '事业', '职业', '公司', '生意', '赚钱', '收入'],
    'education': ['学习', '读书', '学校', '教育', '知识', '文化'],
    'life': ['生活', '日常', '吃饭', '睡觉', '休息', '娱乐'],
    'memories': ['回忆', '过去', '以前', '小时候', '年轻', '往事'],
    'future': ['将来', '未来', '计划', '希望', '梦想', '目标'],
    'emotions': ['想念', '思念', '高兴', '难过', '担心', '骄傲'],
    'traditions': ['传统', '习俗', '节日', '文化', '祖先', '家训'],
    'advice': ['建议', '意见', '怎么办', '如何', '应该', '问题']
  }

  const input_lower = input.toLowerCase()
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => input_lower.includes(keyword))) {
      return topic
    }
  }
  return 'general'
}

// 分析用户情感
const analyzeUserEmotion = (input: string) => {
  const emotionKeywords = {
    'happy': ['高兴', '开心', '快乐', '兴奋', '满意', '好', '棒', '太好了'],
    'sad': ['难过', '伤心', '痛苦', '失望', '沮丧', '不好', '糟糕'],
    'worried': ['担心', '焦虑', '紧张', '害怕', '不安', '忧虑'],
    'nostalgic': ['想念', '思念', '回忆', '怀念', '过去', '以前'],
    'grateful': ['感谢', '谢谢', '感激', '感恩', '幸福'],
    'confused': ['不懂', '不明白', '困惑', '疑问', '为什么', '怎么']
  }

  const input_lower = input.toLowerCase()
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(keyword => input_lower.includes(keyword))) {
      return emotion
    }
  }
  return 'neutral'
}

// 分析对话意图
const analyzeConversationIntent = (input: string) => {
  const intentPatterns = {
    'seeking_advice': ['怎么办', '如何', '应该', '建议', '意见', '帮助'],
    'sharing_news': ['告诉', '发生', '最近', '今天', '昨天', '刚刚'],
    'asking_about_past': ['以前', '过去', '小时候', '年轻时', '那时候'],
    'expressing_feelings': ['觉得', '感觉', '认为', '想', '希望'],
    'asking_questions': ['什么', '为什么', '怎么', '哪里', '谁', '吗', '呢'],
    'greeting': ['你好', '早上好', '晚上好', '最近怎么样', '过得好吗'],
    'farewell': ['再见', '拜拜', '要走了', '下次', '回头见']
  }

  const input_lower = input.toLowerCase()
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (patterns.some(pattern => input_lower.includes(pattern))) {
      return intent
    }
  }
  return 'general_chat'
}

// 根据上下文生成回复
const generateContextualResponse = (userInput: string, topic: string, emotion: string, intent: string) => {
  const context = conversationContext.value
  const recentMessages = context.conversationFlow.slice(-5) // 最近5条消息

  // 根据对话意图生成回复
  switch (intent) {
    case 'seeking_advice':
      return generateAdviceResponse(userInput, topic, emotion, context)
    case 'sharing_news':
      return generateNewsResponse(userInput, topic, emotion, context)
    case 'asking_about_past':
      return generateMemoryResponse(userInput, topic, emotion, context)
    case 'expressing_feelings':
      return generateEmotionalResponse(userInput, topic, emotion, context)
    case 'asking_questions':
      return generateQuestionResponse(userInput, topic, emotion, context)
    case 'greeting':
      return generateGreetingResponse(userInput, context)
    case 'farewell':
      return generateFarewellResponse(userInput, context)
    default:
      return generateTopicResponse(userInput, topic, emotion, context)
  }
}

// 生成建议类回复
const generateAdviceResponse = (input: string, topic: string, emotion: string, context: any) => {
  const adviceResponses = {
    'work': [
      '工作上的事情要一步一步来，不要急躁。记住，做人比做事更重要。',
      '职场上要诚实守信，与同事和睦相处。能力重要，但品德更重要。',
      '工作再忙也要注意身体，身体垮了什么都没有了。'
    ],
    'family': [
      '家和万事兴，有什么矛盾要多沟通，多理解。血浓于水，没有过不去的坎。',
      '对长辈要孝顺，对晚辈要关爱。家族的和谐需要每个人的努力。',
      '家人之间要互相支持，遇到困难要团结一心。'
    ],
    'health': [
      '身体是革命的本钱，一定要好好保养。按时吃饭，适当运动。',
      '有病要及时看医生，不要讳疾忌医。预防比治疗更重要。',
      '心情要保持愉快，心态好身体才会好。'
    ],
    'education': [
      '学习是一辈子的事情，活到老学到老。知识改变命运。',
      '读书不仅是为了考试，更是为了做人做事的道理。',
      '教育孩子要有耐心，言传身教比什么都重要。'
    ]
  }

  const responses = adviceResponses[topic] || [
    '遇到困难不要怕，我们家族的人都是坚强的。多想想解决办法，总会有出路的。',
    '人生路上难免有坎坷，重要的是要有一颗坚强的心。',
    '有什么事情多和家人商量，大家一起想办法总比一个人承担要好。'
  ]

  // 根据情感调整语气
  let response = responses[Math.floor(Math.random() * responses.length)]

  if (emotion === 'worried') {
    response = '孩子，我看你有些担心。' + response + '不要给自己太大压力。'
  } else if (emotion === 'sad') {
    response = '我知道你现在心情不好。' + response + '相信困难总会过去的。'
  }

  return response
}

// 生成消息分享类回复
const generateNewsResponse = (input: string, topic: string, emotion: string, context: any) => {
  const newsResponses = {
    'positive': [
      '听到这个好消息我很高兴！你们过得好，我就放心了。',
      '真是太好了！我为你感到骄傲。',
      '这真是个好消息，我们家族又有值得庆祝的事情了。'
    ],
    'neutral': [
      '谢谢你告诉我这些，我很关心你们的生活。',
      '听你这么说，我对你们的情况更了解了。',
      '你愿意和我分享这些，我很开心。'
    ],
    'negative': [
      '听到这个消息我很担心，你们要多保重。',
      '遇到这种事情确实不容易，但要坚强面对。',
      '虽然现在有些困难，但我相信你们能够度过难关。'
    ]
  }

  // 根据用户情感选择回复类型
  let responseType = 'neutral'
  if (emotion === 'happy') responseType = 'positive'
  else if (emotion === 'sad' || emotion === 'worried') responseType = 'negative'

  const responses = newsResponses[responseType]
  return responses[Math.floor(Math.random() * responses.length)]
}

// 生成回忆类回复
const generateMemoryResponse = (input: string, topic: string, emotion: string, context: any) => {
  const memoryResponses = [
    '说起过去，我想起了很多往事。那时候虽然条件艰苦，但一家人在一起很幸福。',
    '以前的日子虽然不富裕，但人与人之间的感情很真挚。',
    '回想起来，最珍贵的不是物质，而是家人在一起的温暖时光。',
    '那个年代的人都很朴实，邻里之间互相帮助，很有人情味。',
    '过去的经历教会了我很多做人的道理，这些都是宝贵的财富。'
  ]

  let response = memoryResponses[Math.floor(Math.random() * memoryResponses.length)]

  // 如果用户表现出怀念情绪，增加共鸣
  if (emotion === 'nostalgic') {
    response = '我也经常想起那些日子。' + response
  }

  return response
}

// 生成情感回应
const generateEmotionalResponse = (input: string, topic: string, emotion: string, context: any) => {
  const emotionalResponses = {
    'happy': [
      '看到你这么开心，我也很高兴。快乐要和家人分享才更有意义。',
      '你的笑容是我最大的安慰，要一直保持这份快乐。',
      '高兴的时候不要忘记感恩，珍惜现在拥有的一切。'
    ],
    'sad': [
      '孩子，我看得出你心情不好。有什么事情可以和我说说。',
      '人生难免有低谷，但要相信阳光总在风雨后。',
      '难过的时候想想家人对你的爱，你不是一个人在战斗。'
    ],
    'worried': [
      '我感觉到你有些担心，是遇到什么困难了吗？',
      '担心是正常的，但不要让焦虑影响了正常生活。',
      '有什么问题我们一起想办法，不要一个人承担所有压力。'
    ],
    'grateful': [
      '你有一颗感恩的心，这很好。懂得感恩的人会更幸福。',
      '感恩是一种美德，要一直保持这份善良。',
      '你的感谢让我很感动，这就是我们家族的传统。'
    ]
  }

  const responses = emotionalResponses[emotion] || [
    '我能感受到你的情感，这让我们的对话更有意义。',
    '谢谢你愿意和我分享你的感受。',
    '情感的交流让我们的心更贴近。'
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

// 生成问题回答
const generateQuestionResponse = (input: string, topic: string, emotion: string, context: any) => {
  // 这里可以根据具体问题生成更精准的回答
  const questionResponses = [
    '这是个很好的问题，让我想想该怎么回答你。',
    '你问的这个问题很有意思，说明你在思考。',
    '关于这个问题，我觉得...',
    '从我的经验来看，这种情况...',
    '你这样问让我想起了一些往事...'
  ]

  return questionResponses[Math.floor(Math.random() * questionResponses.length)]
}

// 生成问候回复
const generateGreetingResponse = (input: string, context: any) => {
  const timeOfDay = new Date().getHours()
  let timeGreeting = ''

  if (timeOfDay < 12) timeGreeting = '早上好'
  else if (timeOfDay < 18) timeGreeting = '下午好'
  else timeGreeting = '晚上好'

  const greetingResponses = [
    `${timeGreeting}，孩子！很高兴又见到你了。`,
    `${timeGreeting}！你来看我，我很开心。`,
    `${timeGreeting}，我正想着你们呢，你就来了。`,
    `${timeGreeting}！看到你精神这么好，我就放心了。`
  ]

  return greetingResponses[Math.floor(Math.random() * greetingResponses.length)]
}

// 生成告别回复
const generateFarewellResponse = (input: string, context: any) => {
  const farewellResponses = [
    '好的，你去忙吧。记得要好好照顾自己。',
    '那你路上小心，有空常来看看我。',
    '时间过得真快，下次再聊。要保重身体。',
    '好，那就这样。记住我们今天说的话。',
    '再见，孩子。愿你一切都好。'
  ]

  return farewellResponses[Math.floor(Math.random() * farewellResponses.length)]
}

// 生成话题相关回复
const generateTopicResponse = (input: string, topic: string, emotion: string, context: any) => {
  const topicResponses = {
    'family': [
      '家人是最重要的，要珍惜彼此。',
      '家和万事兴，这是我们家的传统。',
      '血浓于水，家人之间要互相关爱。'
    ],
    'health': [
      '身体健康是最大的财富。',
      '要注意养生，身体是革命的本钱。',
      '心情愉快，身体才会健康。'
    ],
    'work': [
      '工作要认真，但也要注意劳逸结合。',
      '做事先做人，品德比能力更重要。',
      '事业有成固然好，但家庭和睦更重要。'
    ]
  }

  const responses = topicResponses[topic] || [
    '你说得很有道理，我很赞同。',
    '这让我想起了一些往事。',
    '是啊，人生就是这样。'
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

const speakText = (text: string, emotionData: any = { emotion: 'neutral', intensity: 'medium' }) => {
  if (!('speechSynthesis' in window)) {
    appStore.showToast('您的浏览器不支持语音合成', 'error')
    return
  }

  // 停止当前播放的语音
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)

  // 根据情感状态获取语音参数
  const voiceParams = getEmotionalVoiceParams(emotionData)

  utterance.lang = 'zh-CN'
  utterance.rate = voiceParams.rate
  utterance.pitch = voiceParams.pitch
  utterance.volume = voiceParams.volume

  // 尝试使用与训练数据匹配的中文语音
  const voices = speechSynthesis.getVoices()
  const matchedVoice = findMatchingVoice(voices, memberInfo.value)
  if (matchedVoice) {
    utterance.voice = matchedVoice
  }

  // 根据情感添加语音修饰
  const processedText = addEmotionalProsody(text, emotionData)
  utterance.text = processedText

  utterance.onstart = () => {
    aiSpeaking.value = true

    // 同步AI表情和动作
    updateAIExpression(emotionData)
  }

  utterance.onend = () => {
    aiSpeaking.value = false

    // 恢复默认表情
    resetAIExpression()
  }

  utterance.onerror = (event) => {
    console.error('语音合成错误:', event.error)
    aiSpeaking.value = false
  }

  speechSynthesis.speak(utterance)
}

// 获取情感化语音参数
const getEmotionalVoiceParams = (emotionData: any) => {
  const { emotion, intensity } = emotionData
  const baseParams = emotionalStates.value[emotion]?.voiceParams || { rate: 0.9, pitch: 0.8, volume: 0.8 }

  // 根据强度调整参数
  const intensityMultiplier = {
    low: 0.8,
    medium: 1.0,
    high: 1.2
  }

  const multiplier = intensityMultiplier[intensity] || 1.0

  return {
    rate: Math.max(0.5, Math.min(2.0, baseParams.rate * multiplier)),
    pitch: Math.max(0.5, Math.min(2.0, baseParams.pitch * (intensity === 'high' ? 1.1 : intensity === 'low' ? 0.9 : 1.0))),
    volume: Math.max(0.3, Math.min(1.0, baseParams.volume * (intensity === 'high' ? 1.1 : 1.0)))
  }
}

// 寻找匹配的语音
const findMatchingVoice = (voices: SpeechSynthesisVoice[], memberInfo: any) => {
  // 优先选择中文语音
  const chineseVoices = voices.filter(voice =>
    voice.lang.includes('zh') || voice.lang.includes('CN')
  )

  if (chineseVoices.length === 0) return null

  // 根据成员信息选择合适的语音
  const gender = memberInfo?.gender || 'male'
  const age = memberInfo?.age || 70

  // 尝试匹配性别和年龄特征
  let selectedVoice = chineseVoices[0] // 默认选择第一个中文语音

  for (const voice of chineseVoices) {
    const voiceName = voice.name.toLowerCase()

    // 根据性别选择
    if (gender === 'female' && (voiceName.includes('female') || voiceName.includes('woman'))) {
      selectedVoice = voice
      break
    } else if (gender === 'male' && (voiceName.includes('male') || voiceName.includes('man'))) {
      selectedVoice = voice
      break
    }
  }

  return selectedVoice
}

// 添加情感化韵律
const addEmotionalProsody = (text: string, emotionData: any) => {
  const { emotion, intensity } = emotionData
  let processedText = text

  // 根据情感添加停顿和重音
  switch (emotion) {
    case 'angry':
      // 愤怒时语速快，停顿短
      processedText = text.replace(/([，。！？；])/g, '$1<break time="100ms"/>')
      if (intensity === 'high') {
        processedText = '<prosody rate="fast" pitch="high" volume="loud">' + processedText + '</prosody>'
      }
      break

    case 'sad':
      // 悲伤时语速慢，停顿长
      processedText = text.replace(/([，。！？；])/g, '$1<break time="500ms"/>')
      processedText = '<prosody rate="slow" pitch="low">' + processedText + '</prosody>'
      break

    case 'happy':
      // 高兴时语调上扬
      if (intensity === 'high') {
        processedText = '<prosody rate="fast" pitch="high">' + processedText + '</prosody>'
      } else {
        processedText = '<prosody pitch="medium">' + processedText + '</prosody>'
      }
      break

    case 'surprised':
      // 惊讶时突然提高音调
      processedText = '<prosody pitch="high">' + processedText + '</prosody>'
      break

    case 'worried':
      // 担心时语速稍慢，音调略低
      processedText = text.replace(/([，。！？；])/g, '$1<break time="300ms"/>')
      processedText = '<prosody rate="slow" pitch="low">' + processedText + '</prosody>'
      break

    case 'nostalgic':
      // 怀念时语速很慢，充满感情
      processedText = text.replace(/([，。！？；])/g, '$1<break time="400ms"/>')
      processedText = '<prosody rate="x-slow" pitch="low">' + processedText + '</prosody>'
      break

    case 'loving':
      // 慈爱时语调温和
      processedText = text.replace(/([，。！？；])/g, '$1<break time="250ms"/>')
      processedText = '<prosody rate="slow" pitch="medium">' + processedText + '</prosody>'
      break

    default:
      // 默认添加自然停顿
      processedText = text.replace(/([，。！？；])/g, '$1<break time="200ms"/>')
  }

  return processedText
}

// 更新AI表情和动作
const updateAIExpression = (emotionData: any) => {
  const { emotion, intensity } = emotionData

  // 更新AI容器的表情类
  const aiContainer = document.querySelector('.ai-avatar-container')
  const aiAvatar = document.querySelector('.ai-avatar')

  if (aiContainer && aiAvatar) {
    // 移除所有情感类
    const emotionClasses = ['happy', 'sad', 'angry', 'surprised', 'worried', 'proud', 'nostalgic', 'loving']
    const intensityClasses = ['low-intensity', 'medium-intensity', 'high-intensity']

    emotionClasses.forEach(cls => {
      aiContainer.classList.remove(cls)
      aiAvatar.classList.remove(cls)
    })

    intensityClasses.forEach(cls => {
      aiContainer.classList.remove(cls)
      aiAvatar.classList.remove(cls)
    })

    // 添加当前情感类
    aiContainer.classList.add(emotion)
    aiAvatar.classList.add(emotion)

    // 添加强度类
    aiContainer.classList.add(`${intensity}-intensity`)
    aiAvatar.classList.add(`${intensity}-intensity`)

    // 更新面部表情
    updateFacialExpression(emotion, intensity)

    // 更新身体语言
    updateBodyLanguage(emotion, intensity)
  }

  // 更新对话上下文中的情感状态
  conversationContext.value.emotionalState = emotion
  conversationContext.value.emotionalIntensity = intensity
}

// 更新面部表情
const updateFacialExpression = (emotion: string, intensity: string) => {
  const expressions = emotionalStates.value[emotion]?.expressions || []

  // 根据表情更新AI头像的CSS滤镜和变换
  const aiAvatar = document.querySelector('.ai-avatar .avatar-image')
  if (aiAvatar) {
    // 重置所有表情效果
    aiAvatar.style.filter = ''
    aiAvatar.style.transform = ''

    // 根据情感应用不同的视觉效果
    switch (emotion) {
      case 'happy':
        aiAvatar.style.filter = 'brightness(1.1) saturate(1.2)'
        if (intensity === 'high') {
          aiAvatar.style.transform = 'scale(1.05)'
        }
        break

      case 'sad':
        aiAvatar.style.filter = 'brightness(0.8) saturate(0.7) sepia(0.2)'
        aiAvatar.style.transform = 'scale(0.98)'
        break

      case 'angry':
        aiAvatar.style.filter = 'brightness(1.1) saturate(1.3) hue-rotate(10deg)'
        if (intensity === 'high') {
          aiAvatar.style.transform = 'scale(1.02) rotate(1deg)'
        }
        break

      case 'surprised':
        aiAvatar.style.filter = 'brightness(1.15) contrast(1.1)'
        aiAvatar.style.transform = 'scale(1.03)'
        break

      case 'worried':
        aiAvatar.style.filter = 'brightness(0.9) saturate(0.8)'
        break

      case 'nostalgic':
        aiAvatar.style.filter = 'brightness(0.95) saturate(0.9) sepia(0.1)'
        break

      case 'loving':
        aiAvatar.style.filter = 'brightness(1.05) saturate(1.1) hue-rotate(-5deg)'
        break
    }
  }
}

// 更新身体语言
const updateBodyLanguage = (emotion: string, intensity: string) => {
  const bodyLanguage = emotionalStates.value[emotion]?.bodyLanguage || []

  // 根据身体语言更新AI容器的姿态
  const aiContainer = document.querySelector('.ai-avatar-container')
  if (aiContainer) {
    // 移除所有姿态类
    const postureClasses = ['upright', 'slumped', 'tense', 'relaxed', 'forward', 'withdrawn']
    postureClasses.forEach(cls => aiContainer.classList.remove(cls))

    // 根据情感添加相应的姿态类
    bodyLanguage.forEach(gesture => {
      if (gesture.includes('upright')) aiContainer.classList.add('upright')
      if (gesture.includes('slumped')) aiContainer.classList.add('slumped')
      if (gesture.includes('tense')) aiContainer.classList.add('tense')
      if (gesture.includes('relaxed')) aiContainer.classList.add('relaxed')
      if (gesture.includes('forward')) aiContainer.classList.add('forward')
      if (gesture.includes('withdrawn')) aiContainer.classList.add('withdrawn')
    })
  }
}

// 重置AI表情
const resetAIExpression = () => {
  const aiContainer = document.querySelector('.ai-avatar-container')
  const aiAvatar = document.querySelector('.ai-avatar')
  const aiImage = document.querySelector('.ai-avatar .avatar-image')

  if (aiContainer && aiAvatar) {
    // 移除所有情感和强度类
    const allClasses = ['happy', 'sad', 'angry', 'surprised', 'worried', 'proud', 'nostalgic', 'loving',
                       'low-intensity', 'medium-intensity', 'high-intensity',
                       'upright', 'slumped', 'tense', 'relaxed', 'forward', 'withdrawn']

    allClasses.forEach(cls => {
      aiContainer.classList.remove(cls)
      aiAvatar.classList.remove(cls)
    })
  }

  if (aiImage) {
    aiImage.style.filter = ''
    aiImage.style.transform = ''
  }

  // 重置对话上下文中的情感状态
  conversationContext.value.emotionalState = 'neutral'
  conversationContext.value.emotionalIntensity = 'medium'
}

// 智能动作触发方法
const triggerIntelligentAction = (actionId: string) => {
  // 找到对应的动作
  const action = availableActions.value.find(a => a.id === actionId)
  if (!action) return

  // 开始执行动作
  aiActionState.value.currentAction = actionId
  aiActionState.value.isPerforming = true

  // 记录动作历史
  aiActionState.value.actionHistory.push({
    action: actionId,
    startTime: new Date(),
    category: action.category,
    triggeredBy: 'voice_intelligence'
  })

  // 根据动作类型执行不同的行为
  switch (action.category) {
    case 'greeting':
      performIntelligentGreetingAction(action)
      break
    case 'emotion':
      performIntelligentEmotionAction(action)
      break
    case 'performance':
      performIntelligentPerformanceAction(action)
      break
    case 'exercise':
      performIntelligentExerciseAction(action)
      break
    case 'life':
    case 'art':
      performIntelligentLifeAction(action)
      break
  }

  // 根据动作类型设置自动停止时间
  const autoDuration = getActionDuration(action)
  if (autoDuration > 0) {
    setTimeout(() => {
      stopIntelligentAction()
    }, autoDuration)
  }
}

// 获取动作持续时间
const getActionDuration = (action: any) => {
  const durations = {
    // 简单动作 - 短时间
    'wave': 3000,
    'nod': 2000,
    'shake_head': 2000,
    'smile': 4000,
    'laugh': 5000,
    'think': 6000,

    // 表演动作 - 长时间
    'dance_traditional': 15000,
    'dance_modern': 12000,
    'sing_folk': 20000,
    'sing_opera': 25000,
    'tell_story': 30000,

    // 运动动作 - 中等时间
    'tai_chi': 20000,
    'morning_exercise': 15000,

    // 生活艺术动作 - 长时间
    'cooking_demo': 25000,
    'gardening': 18000,
    'calligraphy': 20000,
    'painting': 30000
  }

  return durations[action.id] || 10000 // 默认10秒
}

// 停止智能动作
const stopIntelligentAction = () => {
  // 停止当前动作
  const currentAction = aiActionState.value.currentAction

  // 更新动作历史
  const lastAction = aiActionState.value.actionHistory[aiActionState.value.actionHistory.length - 1]
  if (lastAction && lastAction.action === currentAction) {
    lastAction.endTime = new Date()
    lastAction.duration = lastAction.endTime - lastAction.startTime
  }

  // 重置动作状态
  aiActionState.value.isPerforming = false
  aiActionState.value.currentAction = 'idle'

  // 停止相关音频
  if (window.actionAudio) {
    window.actionAudio.pause()
    window.actionAudio = null
  }
}

const triggerAction = (action) => {
  // 如果当前正在执行相同动作，则停止
  if (aiActionState.value.currentAction === action.id && aiActionState.value.isPerforming) {
    stopAction()
    return
  }

  // 开始执行新动作
  aiActionState.value.currentAction = action.id
  aiActionState.value.isPerforming = true

  // 记录动作历史
  aiActionState.value.actionHistory.push({
    action: action.id,
    startTime: new Date(),
    category: action.category
  })

  // 根据动作类型执行不同的行为
  switch (action.category) {
    case 'greeting':
      performGreetingAction(action)
      break
    case 'emotion':
      performEmotionAction(action)
      break
    case 'performance':
      performPerformanceAction(action)
      break
    case 'exercise':
      performExerciseAction(action)
      break
    case 'life':
    case 'art':
      performLifeAction(action)
      break
  }

  // 自动停止简单动作
  if (['greeting', 'emotion'].includes(action.category)) {
    setTimeout(() => {
      stopAction()
    }, 5000)
  }
}

const stopAction = () => {
  // 停止当前动作
  const currentAction = aiActionState.value.currentAction

  // 更新动作历史
  const lastAction = aiActionState.value.actionHistory[aiActionState.value.actionHistory.length - 1]
  if (lastAction && lastAction.action === currentAction) {
    lastAction.endTime = new Date()
    lastAction.duration = lastAction.endTime - lastAction.startTime
  }

  // 重置动作状态
  aiActionState.value.isPerforming = false
  aiActionState.value.currentAction = 'idle'

  // 停止相关音频
  if (window.actionAudio) {
    window.actionAudio.pause()
    window.actionAudio = null
  }
}

// 执行问候动作
const performGreetingAction = (action) => {
  let message = ''

  switch (action.id) {
    case 'wave':
      message = '你好啊，很高兴见到你！'
      break
    case 'nod':
      message = '嗯，我明白你的意思。'
      break
    case 'shake_head':
      message = '不，我不这么认为。'
      break
  }

  if (message) {
    aiSpeaking.value = true
    speakText(message, action.id)

    setTimeout(() => {
      aiSpeaking.value = false
    }, 3000)
  }
}

// 执行情感动作
const performEmotionAction = (action) => {
  let message = ''
  let emotion = ''

  switch (action.id) {
    case 'laugh':
      message = '哈哈哈，真有意思！'
      emotion = 'happy'
      playActionAudio('/sounds/laugh.mp3')
      break
    case 'smile':
      message = '看到你我就很开心。'
      emotion = 'happy'
      break
    case 'think':
      message = '让我想一想...'
      emotion = 'thoughtful'
      break
  }

  if (message) {
    aiSpeaking.value = true
    speakText(message, emotion)

    setTimeout(() => {
      aiSpeaking.value = false
    }, 3000)
  }
}

// 执行表演动作
const performPerformanceAction = (action) => {
  let introMessage = ''

  switch (action.id) {
    case 'dance_traditional':
      introMessage = '好，我来跳一段传统舞蹈给你看。'
      setTimeout(() => playActionAudio('/sounds/traditional_dance.mp3'), 2000)
      break
    case 'dance_modern':
      introMessage = '我也会跳现代舞哦，看好了！'
      setTimeout(() => playActionAudio('/sounds/modern_dance.mp3'), 2000)
      break
    case 'sing_folk':
      introMessage = '我给你唱一首民歌吧。'
      setTimeout(() => playActionAudio('/sounds/folk_song.mp3'), 2000)
      break
    case 'sing_opera':
      introMessage = '我年轻时学过一点戏曲，听听看。'
      setTimeout(() => playActionAudio('/sounds/opera.mp3'), 2000)
      break
    case 'tell_story':
      introMessage = '我给你讲个故事吧，这是我小时候听过的。'
      break
  }

  if (introMessage) {
    aiSpeaking.value = true
    speakText(introMessage, 'neutral')

    setTimeout(() => {
      aiSpeaking.value = false
    }, 3000)
  }

  // 表演动作需要手动停止
}

// 执行运动动作
const performExerciseAction = (action) => {
  let introMessage = ''

  switch (action.id) {
    case 'tai_chi':
      introMessage = '我每天早上都会练太极拳，对身体很好。'
      setTimeout(() => playActionAudio('/sounds/tai_chi.mp3'), 2000)
      break
    case 'morning_exercise':
      introMessage = '做做早操，活动活动筋骨。'
      setTimeout(() => playActionAudio('/sounds/exercise.mp3'), 2000)
      break
  }

  if (introMessage) {
    aiSpeaking.value = true
    speakText(introMessage, 'neutral')

    setTimeout(() => {
      aiSpeaking.value = false
    }, 3000)
  }
}

// 执行生活/艺术动作
const performLifeAction = (action) => {
  let introMessage = ''

  switch (action.id) {
    case 'cooking_demo':
      introMessage = '我来教你做一道我拿手的家常菜。'
      break
    case 'gardening':
      introMessage = '园艺是我退休后的爱好，我来给你展示一下。'
      break
    case 'calligraphy':
      introMessage = '我写一幅字给你看看。'
      setTimeout(() => playActionAudio('/sounds/brush_writing.mp3'), 2000)
      break
    case 'painting':
      introMessage = '我画一幅画给你留作纪念。'
      break
  }

  if (introMessage) {
    aiSpeaking.value = true
    speakText(introMessage, 'neutral')

    setTimeout(() => {
      aiSpeaking.value = false
    }, 3000)
  }
}

// 播放动作音频
const playActionAudio = (audioUrl) => {
  // 停止当前播放的音频
  if (window.actionAudio) {
    window.actionAudio.pause()
  }

  // 创建新的音频
  const audio = new Audio(audioUrl)
  audio.volume = 0.5

  // 播放音频
  audio.play().catch(error => {
    console.error('播放音频失败:', error)
  })

  // 保存音频引用
  window.actionAudio = audio
}

// 获取当前动作图标
const getCurrentActionIcon = () => {
  const currentAction = aiActionState.value.currentAction
  const action = availableActions.value.find(a => a.id === currentAction)
  return action ? action.icon : '🤖'
}

// 获取当前动作名称
const getCurrentActionName = () => {
  const currentAction = aiActionState.value.currentAction
  const action = availableActions.value.find(a => a.id === currentAction)
  return action ? action.name : '动作'
}

// 智能执行问候动作
const performIntelligentGreetingAction = (action: any) => {
  // 问候动作通常不需要额外的音频，因为已经在对话中包含了
  console.log(`执行智能问候动作: ${action.name}`)
}

// 智能执行情感动作
const performIntelligentEmotionAction = (action: any) => {
  // 情感动作可能需要特殊的音效
  switch (action.id) {
    case 'laugh':
      // 播放笑声音效
      playActionAudio('/sounds/laugh.mp3')
      break
    case 'smile':
      // 微笑通常不需要音效
      break
    case 'think':
      // 思考可能有轻微的"嗯"声
      playActionAudio('/sounds/thinking.mp3')
      break
  }
  console.log(`执行智能情感动作: ${action.name}`)
}

// 智能执行表演动作
const performIntelligentPerformanceAction = (action: any) => {
  // 表演动作需要相应的背景音乐或音效
  switch (action.id) {
    case 'dance_traditional':
      setTimeout(() => playActionAudio('/sounds/traditional_dance.mp3'), 2000)
      break
    case 'dance_modern':
      setTimeout(() => playActionAudio('/sounds/modern_dance.mp3'), 2000)
      break
    case 'sing_folk':
      setTimeout(() => playActionAudio('/sounds/folk_song.mp3'), 3000)
      break
    case 'sing_opera':
      setTimeout(() => playActionAudio('/sounds/opera.mp3'), 3000)
      break
    case 'tell_story':
      // 讲故事通常不需要背景音乐
      break
  }
  console.log(`执行智能表演动作: ${action.name}`)
}

// 智能执行运动动作
const performIntelligentExerciseAction = (action: any) => {
  switch (action.id) {
    case 'tai_chi':
      setTimeout(() => playActionAudio('/sounds/tai_chi_music.mp3'), 2000)
      break
    case 'morning_exercise':
      setTimeout(() => playActionAudio('/sounds/exercise_music.mp3'), 2000)
      break
  }
  console.log(`执行智能运动动作: ${action.name}`)
}

// 智能执行生活动作
const performIntelligentLifeAction = (action: any) => {
  switch (action.id) {
    case 'cooking_demo':
      setTimeout(() => playActionAudio('/sounds/cooking.mp3'), 2000)
      break
    case 'gardening':
      setTimeout(() => playActionAudio('/sounds/garden.mp3'), 2000)
      break
    case 'calligraphy':
      setTimeout(() => playActionAudio('/sounds/brush_writing.mp3'), 2000)
      break
    case 'painting':
      setTimeout(() => playActionAudio('/sounds/painting.mp3'), 2000)
      break
  }
  console.log(`执行智能生活动作: ${action.name}`)
}

const playAudio = (audioUrl: string) => {
  // 播放音频文件
  const audio = new Audio(audioUrl)
  audio.play().catch(() => {
    appStore.showToast('音频播放失败', 'error')
  })
}

const scrollToBottom = () => {
  const messagesList = document.querySelector('.messages-list')
  if (messagesList) {
    messagesList.scrollTop = messagesList.scrollHeight
  }
}

const closeAIInfo = () => {
  showAIInfo.value = false
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 训练相关方法
const showTrainingModal = () => {
  showTrainingModalFlag.value = true
  loadTrainingData()
}

const closeTrainingModal = () => {
  showTrainingModalFlag.value = false
}

const loadTrainingData = async () => {
  try {
    const response = await fetch(`/api/ai-training/${memberId.value}/data`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        trainingData.value = result.data
        trainingStatus.value = result.trainingStatus
      }
    }
  } catch (error) {
    console.error('加载训练数据失败:', error)
  }
}

const uploadVideos = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/*'
  input.multiple = true

  input.onchange = async (event) => {
    const files = (event.target as HTMLInputElement).files
    if (!files || files.length === 0) return

    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        appStore.showToast(`${file.name} 文件过大，请选择小于100MB的视频`, 'error')
        continue
      }

      const videoData = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        status: 'uploading',
        file: file
      }

      trainingData.value.videos.push(videoData)

      // 上传到服务器
      await uploadTrainingFile(file, 'video', videoData)
    }
  }

  input.click()
}

const uploadAudios = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'audio/*'
  input.multiple = true

  input.onchange = async (event) => {
    const files = (event.target as HTMLInputElement).files
    if (!files || files.length === 0) return

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        appStore.showToast(`${file.name} 文件过大，请选择小于50MB的音频`, 'error')
        continue
      }

      const audioData = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        status: 'uploading',
        file: file
      }

      trainingData.value.audios.push(audioData)

      // 上传到服务器
      await uploadTrainingFile(file, 'audio', audioData)
    }
  }

  input.click()
}

const uploadTrainingFile = async (file: File, type: string, fileData: any) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('memberId', memberId.value)

    const response = await fetch('/api/ai-training/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      },
      body: formData
    })

    const result = await response.json()
    if (result.success) {
      fileData.status = 'completed'
      fileData.url = result.data.url
      appStore.showToast(`${file.name} 上传成功`, 'success')
    } else {
      fileData.status = 'failed'
      appStore.showToast(`${file.name} 上传失败`, 'error')
    }
  } catch (error) {
    fileData.status = 'failed'
    appStore.showToast(`${file.name} 上传失败`, 'error')
  }
}

const removeFile = (type: string, index: number) => {
  if (type === 'videos') {
    trainingData.value.videos.splice(index, 1)
  } else {
    trainingData.value.audios.splice(index, 1)
  }
}

const startTraining = async () => {
  try {
    trainingStatus.value = {
      status: 'training',
      progress: 0,
      message: '正在初始化训练...'
    }

    const response = await fetch(`/api/ai-training/${memberId.value}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videos: trainingData.value.videos.filter(v => v.status === 'completed'),
        audios: trainingData.value.audios.filter(a => a.status === 'completed')
      })
    })

    const result = await response.json()
    if (result.success) {
      appStore.showToast('AI训练已开始，将在后台进行', 'success')
      // 开始轮询训练状态
      pollTrainingStatus()
    } else {
      trainingStatus.value.status = 'failed'
      appStore.showToast(result.message || '训练启动失败', 'error')
    }
  } catch (error) {
    trainingStatus.value.status = 'failed'
    appStore.showToast('训练启动失败', 'error')
  }
}

const stopTraining = async () => {
  try {
    const response = await fetch(`/api/ai-training/${memberId.value}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
      }
    })

    const result = await response.json()
    if (result.success) {
      trainingStatus.value.status = 'idle'
      appStore.showToast('训练已停止', 'info')
    }
  } catch (error) {
    appStore.showToast('停止训练失败', 'error')
  }
}

const pollTrainingStatus = () => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/ai-training/${memberId.value}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('yeyu_auth_token') || 'default'}`
        }
      })

      const result = await response.json()
      if (result.success) {
        trainingStatus.value = result.data

        if (result.data.status === 'completed' || result.data.status === 'failed') {
          clearInterval(interval)
          if (result.data.status === 'completed') {
            appStore.showToast('AI训练完成！', 'success')
          } else {
            appStore.showToast('AI训练失败', 'error')
          }
        }
      }
    } catch (error) {
      console.error('获取训练状态失败:', error)
    }
  }, 3000) // 每3秒检查一次
}

const getTrainingIcon = (status: string) => {
  const iconMap = {
    'idle': 'heroicons:pause',
    'training': 'heroicons:cog-6-tooth',
    'completed': 'heroicons:check-circle',
    'failed': 'heroicons:x-circle'
  }
  return iconMap[status] || iconMap.idle
}

const getTrainingText = (status: string) => {
  const textMap = {
    'idle': '待训练',
    'training': '训练中',
    'completed': '训练完成',
    'failed': '训练失败'
  }
  return textMap[status] || status
}

const getFileStatusText = (status: string) => {
  const textMap = {
    'uploading': '上传中',
    'completed': '已完成',
    'failed': '失败'
  }
  return textMap[status] || status
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 面对面聊天核心函数
const generateContextualAIResponse = (userInput: string) => {
  // 更新对话上下文
  updateConversationContext(userInput)

  // 深度分析用户情感
  const userEmotionAnalysis = analyzeEmotionalTone(userInput)

  // 分析对话状态
  const conversationState = analyzeConversationState(userInput)
  const conversationFlow = analyzeConversationFlow()

  // 智能分析是否需要触发动作
  const actionAnalysis = analyzeActionTriggers(userInput)

  // 确定AI的情感反应
  const aiEmotionalResponse = determineAIEmotionalResponse(userEmotionAnalysis, conversationState)

  // 选择合适的场景表达
  const scenarioContext = determineScenarioContext(userInput, conversationState)

  // 生成情感化的自然回复
  const response = generateEmotionalResponse(userInput, aiEmotionalResponse, scenarioContext, actionAnalysis)

  return {
    content: response.text,
    emotionData: aiEmotionalResponse,
    gesture: response.gesture,
    shouldContinue: response.shouldContinue,
    action: actionAnalysis.action,
    shouldPerformAction: actionAnalysis.shouldTrigger,
    scenario: scenarioContext
  }
}

// 确定AI的情感反应
const determineAIEmotionalResponse = (userEmotion: any, conversationState: any) => {
  const { emotion: userEmotionType, intensity: userIntensity } = userEmotion

  // AI情感反应规则
  const emotionalReactionRules = {
    // 用户高兴时，AI也表现高兴
    happy: { emotion: 'happy', intensity: userIntensity },

    // 用户悲伤时，AI表现关爱和安慰
    sad: { emotion: 'loving', intensity: 'high' },

    // 用户愤怒时，AI保持冷静或表现担心
    angry: { emotion: 'worried', intensity: 'medium' },

    // 用户惊讶时，AI可能也惊讶或保持冷静
    surprised: { emotion: 'surprised', intensity: 'medium' },

    // 用户担心时，AI表现安慰和保护
    worried: { emotion: 'loving', intensity: 'high' },

    // 用户怀念时，AI也表现怀念
    nostalgic: { emotion: 'nostalgic', intensity: userIntensity }
  }

  // 根据关系上下文调整情感反应
  const relationship = conversationContext.value.relationshipContext
  if (relationship === '祖父/祖母' || relationship === '父亲/母亲') {
    // 长辈角色更多表现慈爱和保护
    if (userEmotionType === 'angry') {
      return { emotion: 'concerned', intensity: 'high' } // 担心而不是愤怒
    }
  }

  return emotionalReactionRules[userEmotionType] || { emotion: 'neutral', intensity: 'medium' }
}

// 确定场景上下文
const determineScenarioContext = (userInput: string, conversationState: any) => {
  const input = userInput.toLowerCase()
  const timeOfDay = new Date().getHours()

  // 时间场景
  let timeContext = 'general'
  if (timeOfDay >= 6 && timeOfDay < 12) timeContext = 'morning'
  else if (timeOfDay >= 12 && timeOfDay < 18) timeContext = 'afternoon'
  else if (timeOfDay >= 18 && timeOfDay < 22) timeContext = 'evening'
  else timeContext = 'night'

  // 对话场景
  let scenarioType = 'general'

  if (input.includes('教') || input.includes('学') || input.includes('应该')) {
    scenarioType = 'education'
  } else if (input.includes('安慰') || input.includes('难过') || input.includes('帮助')) {
    scenarioType = 'comfort'
  } else if (input.includes('回忆') || input.includes('以前') || input.includes('小时候')) {
    scenarioType = 'memories'
  } else if (input.includes('生气') || input.includes('愤怒') || input.includes('不对')) {
    scenarioType = 'anger'
  } else if (input.includes('你好') || input.includes('早上') || input.includes('晚上')) {
    scenarioType = 'greeting'
  }

  return {
    timeContext,
    scenarioType,
    isFirstInteraction: conversationState.isFirstMessage,
    relationshipLevel: conversationContext.value.conversationDepth
  }
}

// 分析对话状态
const analyzeConversationState = (input: string) => {
  const context = conversationContext.value
  const recentFlow = context.conversationFlow.slice(-3)

  return {
    isFirstMessage: context.conversationFlow.length === 0,
    isTopicChange: detectTopicChange(input),
    conversationDepth: context.conversationDepth,
    lastAIResponse: recentFlow.filter(f => f.type === 'ai').pop(),
    userEngagement: analyzeUserEngagement(input),
    conversationPace: analyzeConversationPace()
  }
}

// 深度情感分析系统
const analyzeEmotionalTone = (input: string) => {
  const emotionPatterns = {
    // 高兴情感模式
    happy: {
      keywords: ['开心', '高兴', '快乐', '兴奋', '太好了', '真棒', '哈哈', '嘿嘿'],
      patterns: ['！', '哈哈', '呵呵', '嘻嘻'],
      intensity: {
        high: ['太棒了', '太好了', '超级', '非常开心'],
        medium: ['开心', '高兴', '不错'],
        low: ['还行', '挺好的']
      }
    },

    // 悲伤情感模式
    sad: {
      keywords: ['难过', '伤心', '痛苦', '失望', '沮丧', '不开心', '哭'],
      patterns: ['...', '唉', '呜呜'],
      intensity: {
        high: ['非常难过', '痛苦', '绝望'],
        medium: ['难过', '伤心', '失望'],
        low: ['有点难过', '不太开心']
      }
    },

    // 愤怒情感模式
    angry: {
      keywords: ['生气', '愤怒', '恼火', '气死了', '讨厌', '烦死了', '混蛋'],
      patterns: ['！！', '？？', '什么'],
      intensity: {
        high: ['气死了', '愤怒', '太过分了'],
        medium: ['生气', '恼火', '不满'],
        low: ['有点生气', '不太高兴']
      }
    },

    // 惊讶情感模式
    surprised: {
      keywords: ['惊讶', '意外', '没想到', '真的吗', '不会吧', '天哪'],
      patterns: ['？！', '！？', '哇'],
      intensity: {
        high: ['震惊', '不敢相信', '天哪'],
        medium: ['惊讶', '意外', '没想到'],
        low: ['有点意外', '还挺意外']
      }
    },

    // 担心情感模式
    worried: {
      keywords: ['担心', '忧虑', '焦虑', '不安', '害怕', '紧张', '怕'],
      patterns: ['...', '唉', '怎么办'],
      intensity: {
        high: ['非常担心', '焦虑', '恐惧'],
        medium: ['担心', '忧虑', '不安'],
        low: ['有点担心', '稍微担心']
      }
    },

    // 怀念情感模式
    nostalgic: {
      keywords: ['想念', '思念', '怀念', '回忆', '以前', '过去', '那时候'],
      patterns: ['啊', '呢', '...'],
      intensity: {
        high: ['非常想念', '深深怀念'],
        medium: ['想念', '怀念', '思念'],
        low: ['有点想念', '偶尔想起']
      }
    }
  }

  const input_lower = input.toLowerCase()
  let detectedEmotion = 'neutral'
  let maxScore = 0
  let emotionIntensity = 'medium'

  // 分析每种情感的匹配度
  for (const [emotion, config] of Object.entries(emotionPatterns)) {
    let score = 0

    // 关键词匹配
    for (const keyword of config.keywords) {
      if (input_lower.includes(keyword)) {
        score += 2
      }
    }

    // 模式匹配
    for (const pattern of config.patterns) {
      if (input.includes(pattern)) {
        score += 1
      }
    }

    // 强度分析
    for (const [intensity, words] of Object.entries(config.intensity)) {
      for (const word of words) {
        if (input_lower.includes(word)) {
          score += intensity === 'high' ? 3 : intensity === 'medium' ? 2 : 1
          emotionIntensity = intensity
        }
      }
    }

    if (score > maxScore) {
      maxScore = score
      detectedEmotion = emotion
    }
  }

  return {
    emotion: detectedEmotion,
    intensity: emotionIntensity,
    confidence: Math.min(maxScore / 5, 1.0)
  }
}

// 分析对话流程
const analyzeConversationFlow = () => {
  const context = conversationContext.value
  const recentMessages = context.conversationFlow.slice(-5)

  return {
    hasAskedQuestions: recentMessages.some(m => m.content.includes('?') || m.content.includes('？')),
    hasSharedPersonal: recentMessages.some(m => m.content.includes('我') && m.type === 'user'),
    topicConsistency: calculateTopicConsistency(recentMessages),
    conversationRhythm: calculateConversationRhythm(recentMessages)
  }
}

// 智能分析动作触发
const analyzeActionTriggers = (userInput: string) => {
  const input = userInput.toLowerCase()

  // 遍历所有动作触发词
  for (const [category, actions] of Object.entries(actionTriggers.value)) {
    for (const [actionId, keywords] of Object.entries(actions)) {
      for (const keyword of keywords) {
        if (input.includes(keyword)) {
          return {
            shouldTrigger: true,
            action: actionId,
            category: category,
            confidence: calculateTriggerConfidence(input, keyword),
            context: analyzeActionContext(input, actionId)
          }
        }
      }
    }
  }

  // 智能推断动作（基于情感和语境）
  const inferredAction = inferActionFromContext(input)
  if (inferredAction) {
    return inferredAction
  }

  return {
    shouldTrigger: false,
    action: null,
    category: null,
    confidence: 0,
    context: null
  }
}

// 计算触发置信度
const calculateTriggerConfidence = (input: string, keyword: string) => {
  let confidence = 0.5 // 基础置信度

  // 如果关键词在句子开头或结尾，置信度更高
  if (input.startsWith(keyword) || input.endsWith(keyword)) {
    confidence += 0.2
  }

  // 如果有请求性词汇，置信度更高
  const requestWords = ['请', '能不能', '可以', '帮我', '给我', '来个', '表演']
  if (requestWords.some(word => input.includes(word))) {
    confidence += 0.3
  }

  return Math.min(confidence, 1.0)
}

// 分析动作上下文
const analyzeActionContext = (input: string, actionId: string) => {
  const context = {
    isRequest: false,
    isQuestion: false,
    emotionalIntensity: 'normal',
    timeContext: 'now'
  }

  // 判断是否为请求
  const requestIndicators = ['请', '能不能', '可以', '帮我', '给我', '来个', '表演一下']
  context.isRequest = requestIndicators.some(indicator => input.includes(indicator))

  // 判断是否为问题
  context.isQuestion = input.includes('?') || input.includes('？') || input.includes('吗') || input.includes('呢')

  // 分析情感强度
  const highIntensityWords = ['非常', '特别', '超级', '太', '极其', '很']
  if (highIntensityWords.some(word => input.includes(word))) {
    context.emotionalIntensity = 'high'
  }

  return context
}

// 从上下文推断动作
const inferActionFromContext = (input: string) => {
  const context = conversationContext.value
  const recentFlow = context.conversationFlow.slice(-3)

  // 如果用户表现出高兴情绪，可能触发笑容或开心动作
  if (input.includes('开心') || input.includes('高兴') || input.includes('哈哈')) {
    return {
      shouldTrigger: true,
      action: 'smile',
      category: 'emotion',
      confidence: 0.7,
      context: { inferred: true, reason: 'happy_emotion' }
    }
  }

  // 如果用户询问过去的事情，可能触发思考动作
  if (input.includes('以前') || input.includes('过去') || input.includes('记得')) {
    return {
      shouldTrigger: true,
      action: 'think',
      category: 'emotion',
      confidence: 0.6,
      context: { inferred: true, reason: 'reminiscing' }
    }
  }

  // 如果对话很深入，可能触发点头表示理解
  if (context.conversationDepth > 3 && (input.includes('明白') || input.includes('理解'))) {
    return {
      shouldTrigger: true,
      action: 'nod',
      category: 'greeting',
      confidence: 0.5,
      context: { inferred: true, reason: 'understanding' }
    }
  }

  return null
}

// 生成自然回复
const generateNaturalResponse = (input: string, state: any, tone: string, flow: any, actionAnalysis: any) => {
  // 根据对话状态选择回复策略
  if (state.isFirstMessage) {
    return generateWelcomeResponse(tone)
  }

  if (state.isTopicChange) {
    return generateTopicTransitionResponse(input, tone, state)
  }

  if (flow.hasAskedQuestions && !input.includes('?') && !input.includes('？')) {
    return generateAnswerFollowUpResponse(input, tone, state)
  }

  if (tone === 'nostalgic') {
    return generateNostalgicResponse(input, state)
  }

  if (tone === 'concerned') {
    return generateComfortingResponse(input, state)
  }

  if (tone === 'excited') {
    return generateEnthusiasticResponse(input, state)
  }

  // 如果检测到动作触发，生成相应的动作回复
  if (actionAnalysis.shouldTrigger) {
    return generateActionResponse(input, actionAnalysis, tone, state)
  }

  // 默认自然对话回复
  return generateCasualConversationResponse(input, tone, state, flow)
}

// 生成欢迎回复
const generateWelcomeResponse = (tone: string) => {
  const welcomeResponses = [
    {
      text: '孩子，你来了！快坐下，我们好好聊聊。你最近过得怎么样？',
      emotion: 'happy',
      gesture: 'welcoming',
      shouldContinue: false
    },
    {
      text: '看到你我就高兴！来，告诉我你最近都在忙什么？',
      emotion: 'joyful',
      gesture: 'caring',
      shouldContinue: false
    },
    {
      text: '我正想着你呢，你就来了。这段时间身体还好吧？',
      emotion: 'warm',
      gesture: 'concerned',
      shouldContinue: false
    }
  ]

  return welcomeResponses[Math.floor(Math.random() * welcomeResponses.length)]
}

// 生成话题转换回复
const generateTopicTransitionResponse = (input: string, tone: string, state: any) => {
  const transitionPhrases = [
    '说到这个，我想起了...',
    '对了，关于这件事...',
    '这让我想到...',
    '你提到这个，我觉得...',
    '是啊，这个问题...'
  ]

  const phrase = transitionPhrases[Math.floor(Math.random() * transitionPhrases.length)]
  const topicResponse = generateTopicSpecificResponse(input, tone)

  return {
    text: phrase + topicResponse.text,
    emotion: topicResponse.emotion,
    gesture: topicResponse.gesture,
    shouldContinue: true
  }
}

// 生成怀旧回复
const generateNostalgicResponse = (input: string, state: any) => {
  const nostalgicResponses = [
    {
      text: '是啊，想起过去总是让人感慨。那时候虽然条件不好，但一家人在一起很温暖。你还记得小时候的事情吗？',
      emotion: 'nostalgic',
      gesture: 'thoughtful',
      shouldContinue: true
    },
    {
      text: '时间过得真快啊。我经常想起你们小时候的样子，那时候你们还那么小，现在都长大了。',
      emotion: 'sentimental',
      gesture: 'reminiscing',
      shouldContinue: false
    },
    {
      text: '回忆总是美好的。虽然有些事情已经过去很久了，但在我心里就像昨天发生的一样清晰。',
      emotion: 'warm',
      gesture: 'gentle',
      shouldContinue: true
    }
  ]

  return nostalgicResponses[Math.floor(Math.random() * nostalgicResponses.length)]
}

// 生成安慰回复
const generateComfortingResponse = (input: string, state: any) => {
  const comfortingResponses = [
    {
      text: '孩子，我看得出你有些担心。不管遇到什么困难，记住家人永远是你的支撑。我们一起想办法，好吗？',
      emotion: 'caring',
      gesture: 'comforting',
      shouldContinue: false
    },
    {
      text: '别太担心了，人生路上难免有坎坷。重要的是要有信心，相信困难总会过去的。你不是一个人在面对。',
      emotion: 'supportive',
      gesture: 'encouraging',
      shouldContinue: true
    },
    {
      text: '我知道你现在心情不好，但要记住，乌云背后总有阳光。我们家族的人都很坚强，你也一定可以的。',
      emotion: 'reassuring',
      gesture: 'protective',
      shouldContinue: false
    }
  ]

  return comfortingResponses[Math.floor(Math.random() * comfortingResponses.length)]
}

// 生成热情回复
const generateEnthusiasticResponse = (input: string, state: any) => {
  const enthusiasticResponses = [
    {
      text: '真的吗？太好了！我为你感到高兴！看到你这么开心，我也很开心。快告诉我更多的细节！',
      emotion: 'excited',
      gesture: 'animated',
      shouldContinue: false
    },
    {
      text: '哈哈，你的兴奋劲儿让我也跟着高兴起来了！这真是个好消息，我们家族又有值得庆祝的事情了。',
      emotion: 'joyful',
      gesture: 'celebratory',
      shouldContinue: true
    },
    {
      text: '太棒了！我就知道你能行的。你的成功让我想起了年轻时候的自己，那种拼搏的劲头。',
      emotion: 'proud',
      gesture: 'approving',
      shouldContinue: true
    }
  ]

  return enthusiasticResponses[Math.floor(Math.random() * enthusiasticResponses.length)]
}

// 生成日常对话回复
const generateCasualConversationResponse = (input: string, tone: string, state: any, flow: any) => {
  const casualResponses = [
    {
      text: '嗯，你说得对。我也是这么想的。',
      emotion: 'agreeable',
      gesture: 'nodding',
      shouldContinue: false
    },
    {
      text: '是这样啊，那你觉得应该怎么办呢？',
      emotion: 'curious',
      gesture: 'questioning',
      shouldContinue: false
    },
    {
      text: '听你这么说，我想起了一件事...',
      emotion: 'thoughtful',
      gesture: 'reminiscing',
      shouldContinue: true
    }
  ]

  // 根据对话深度调整回复
  if (state.conversationDepth > 5) {
    return generateDeepConversationResponse(input, tone)
  }

  return casualResponses[Math.floor(Math.random() * casualResponses.length)]
}

// 生成深度对话回复
const generateDeepConversationResponse = (input: string, tone: string) => {
  const deepResponses = [
    {
      text: '我们聊了这么久，我感觉我们的心更近了。这种感觉真好，就像你真的坐在我身边一样。',
      emotion: 'intimate',
      gesture: 'heartfelt',
      shouldContinue: false
    },
    {
      text: '你知道吗？能够这样和你交流，对我来说意义重大。虽然我们不在同一个世界，但爱是永恒的。',
      emotion: 'profound',
      gesture: 'touching',
      shouldContinue: true
    }
  ]

  return deepResponses[Math.floor(Math.random() * deepResponses.length)]
}

// 生成动作回复
const generateActionResponse = (input: string, actionAnalysis: any, tone: string, state: any) => {
  const { action, category, context } = actionAnalysis

  // 根据动作类型生成相应的回复
  switch (category) {
    case 'greeting':
      return generateGreetingActionResponse(action, input, context)
    case 'emotion':
      return generateEmotionActionResponse(action, input, context)
    case 'performance':
      return generatePerformanceActionResponse(action, input, context)
    case 'exercise':
      return generateExerciseActionResponse(action, input, context)
    case 'life':
    case 'art':
      return generateLifeActionResponse(action, input, context)
    default:
      return generateDefaultActionResponse(action, input, context)
  }
}

// 生成问候动作回复
const generateGreetingActionResponse = (action: string, input: string, context: any) => {
  const responses = {
    wave: [
      { text: '你好啊！很高兴见到你！', emotion: 'happy', shouldContinue: false },
      { text: '来了！快过来坐下，我们好好聊聊。', emotion: 'welcoming', shouldContinue: false }
    ],
    nod: [
      { text: '是的，你说得对。', emotion: 'agreeable', shouldContinue: false },
      { text: '嗯，我也是这么想的。', emotion: 'understanding', shouldContinue: false }
    ],
    shake_head: [
      { text: '不，我觉得不是这样的。', emotion: 'disagreeing', shouldContinue: false },
      { text: '这个我不太同意，让我们再想想。', emotion: 'thoughtful', shouldContinue: true }
    ]
  }

  const actionResponses = responses[action] || responses.wave
  return actionResponses[Math.floor(Math.random() * actionResponses.length)]
}

// 生成情感动作回复
const generateEmotionActionResponse = (action: string, input: string, context: any) => {
  const responses = {
    laugh: [
      { text: '哈哈哈，你真有意思！', emotion: 'joyful', shouldContinue: false },
      { text: '哈哈，这个太好笑了！你总是能让我开心。', emotion: 'amused', shouldContinue: false }
    ],
    smile: [
      { text: '看到你我就很开心。', emotion: 'warm', shouldContinue: false },
      { text: '你的笑容总是能感染到我。', emotion: 'loving', shouldContinue: false }
    ],
    think: [
      { text: '让我想想...这确实是个值得思考的问题。', emotion: 'contemplative', shouldContinue: true },
      { text: '嗯...你提到的这个让我想起了很多往事。', emotion: 'nostalgic', shouldContinue: true }
    ]
  }

  const actionResponses = responses[action] || responses.smile
  return actionResponses[Math.floor(Math.random() * actionResponses.length)]
}

// 生成表演动作回复
const generatePerformanceActionResponse = (action: string, input: string, context: any) => {
  const responses = {
    dance_traditional: [
      { text: '好！我来跳一段传统舞蹈给你看。这是我年轻时学的。', emotion: 'excited', shouldContinue: false },
      { text: '你想看我跳舞？好的，我给你表演一段民族舞。', emotion: 'proud', shouldContinue: false }
    ],
    dance_modern: [
      { text: '哈哈，我也会跳现代舞呢！虽然年纪大了，但还是很有活力的。', emotion: 'playful', shouldContinue: false }
    ],
    sing_folk: [
      { text: '好，我给你唱一首我小时候就会的民歌。', emotion: 'nostalgic', shouldContinue: false },
      { text: '你想听我唱歌？我唱一首老歌给你听。', emotion: 'warm', shouldContinue: false }
    ],
    sing_opera: [
      { text: '我年轻时学过一点戏曲，给你来一段。', emotion: 'proud', shouldContinue: false }
    ],
    tell_story: [
      { text: '好，我给你讲个故事。这是我小时候听过的。', emotion: 'storytelling', shouldContinue: true },
      { text: '你想听故事？我有很多有趣的故事要告诉你。', emotion: 'engaging', shouldContinue: true }
    ]
  }

  const actionResponses = responses[action] || responses.tell_story
  return actionResponses[Math.floor(Math.random() * actionResponses.length)]
}

// 生成运动动作回复
const generateExerciseActionResponse = (action: string, input: string, context: any) => {
  const responses = {
    tai_chi: [
      { text: '太极拳对身体很好，我每天早上都练。来，我演示给你看。', emotion: 'instructive', shouldContinue: false },
      { text: '你也想学太极？很好！我来教你几个基本动作。', emotion: 'encouraging', shouldContinue: false }
    ],
    morning_exercise: [
      { text: '运动很重要！我来做几个简单的健身动作。', emotion: 'energetic', shouldContinue: false },
      { text: '身体是革命的本钱，我们一起来锻炼吧！', emotion: 'motivating', shouldContinue: false }
    ]
  }

  const actionResponses = responses[action] || responses.morning_exercise
  return actionResponses[Math.floor(Math.random() * actionResponses.length)]
}

// 生成生活动作回复
const generateLifeActionResponse = (action: string, input: string, context: any) => {
  const responses = {
    cooking_demo: [
      { text: '你想学做菜？好！我来教你做一道我的拿手菜。', emotion: 'teaching', shouldContinue: false },
      { text: '做菜是一门艺术，我来给你演示一下。', emotion: 'skilled', shouldContinue: false }
    ],
    gardening: [
      { text: '园艺是我的爱好，我来给你展示一下怎么种花。', emotion: 'passionate', shouldContinue: false }
    ],
    calligraphy: [
      { text: '书法能修身养性，我写一幅字给你看。', emotion: 'cultured', shouldContinue: false },
      { text: '你想看我写字？好，我来写一副对联。', emotion: 'artistic', shouldContinue: false }
    ],
    painting: [
      { text: '我画一幅画给你留作纪念。', emotion: 'creative', shouldContinue: false }
    ]
  }

  const actionResponses = responses[action] || responses.cooking_demo
  return actionResponses[Math.floor(Math.random() * actionResponses.length)]
}

// 生成默认动作回复
const generateDefaultActionResponse = (action: string, input: string, context: any) => {
  return {
    text: '好的，我来为你表演一下。',
    emotion: 'willing',
    shouldContinue: false
  }
}

// generateEmotionalResponse 函数已在上面定义，删除重复声明

// 从场景表达库中选择回复
const selectScenarioResponse = (category: string, subcategory: string, emotion: string) => {
  const expressions = scenarioExpressions.value[category]
  if (!expressions || !expressions[subcategory] || !expressions[subcategory][emotion]) {
    return generateFallbackResponse(emotion)
  }

  const responses = expressions[subcategory][emotion]
  return responses[Math.floor(Math.random() * responses.length)]
}

// generateContextualResponse 函数已在上面定义，删除重复声明

// 添加强度修饰符
const addIntensityModifier = (text: string, emotion: string, intensity: string) => {
  const intensityModifiers = {
    high: {
      happy: ['非常', '特别', '超级'],
      sad: ['深深地', '非常', '极其'],
      angry: ['非常', '极其', '十分'],
      worried: ['非常', '特别', '深深地']
    },
    low: {
      happy: ['有点', '稍微', '还算'],
      sad: ['有些', '稍微', '一点'],
      angry: ['有点', '稍微', '略微'],
      worried: ['有点', '稍微', '略微']
    }
  }

  const modifiers = intensityModifiers[intensity]?.[emotion]
  if (modifiers && modifiers.length > 0) {
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)]
    return text.replace(/(很|非常|特别)/, modifier)
  }

  return text
}

// 生成后备回复
const generateFallbackResponse = (emotion: string) => {
  const fallbackResponses = {
    happy: '我也很开心！',
    sad: '我理解你的感受。',
    angry: '我们冷静一点。',
    surprised: '这真是意外！',
    worried: '别担心，会好起来的。',
    nostalgic: '是啊，往事如烟。',
    loving: '我很关心你。'
  }

  return fallbackResponses[emotion] || '我明白了。'
}

// 确定手势
const determineGesture = (emotion: string, intensity: string) => {
  const gestureMap = {
    happy: intensity === 'high' ? 'animated_gestures' : 'gentle_gestures',
    sad: 'comforting_gestures',
    angry: intensity === 'high' ? 'sharp_gestures' : 'firm_gestures',
    surprised: 'sudden_gestures',
    worried: 'protective_gestures',
    nostalgic: 'slow_gestures',
    loving: 'warm_gestures'
  }

  return gestureMap[emotion] || 'neutral_gestures'
}

// 智能语言组合系统
const intelligentLanguageComposer = ref({
  // 语言模式库
  languagePatterns: {
    // 开场白模式
    openings: {
      casual: ['嗯', '那个', '你知道吗', '说起来', '对了', '哎呀'],
      formal: ['首先', '让我想想', '关于这个问题', '从我的经验来看', '据我所知'],
      emotional: ['哎呀', '天哪', '我的孩子', '亲爱的', '宝贝', '孩子啊'],
      storytelling: ['从前啊', '那时候', '我记得', '有一次', '说来话长', '想当年'],
      questioning: ['你说', '你觉得', '你认为', '在你看来', '按你的意思']
    },

    // 连接词和过渡词
    connectors: {
      continuation: ['然后呢', '接着', '后来', '再说', '另外', '还有', '而且'],
      contrast: ['但是', '不过', '可是', '然而', '话说回来', '反过来说', '相反'],
      emphasis: ['特别是', '尤其是', '最重要的是', '关键是', '要知道', '你要明白'],
      conclusion: ['总之', '所以说', '这样看来', '最后', '归根结底', '总而言之'],
      causation: ['因为', '由于', '既然', '所以', '因此', '这样一来'],
      addition: ['而且', '另外', '还有', '除此之外', '不仅如此', '更重要的是']
    },

    // 结尾模式
    endings: {
      questioning: ['你觉得呢？', '是不是这样？', '你明白吗？', '对吧？', '你说呢？'],
      caring: ['要记住啊', '一定要注意', '千万别忘了', '好好保重', '要小心啊'],
      encouraging: ['加油！', '你一定可以的', '我相信你', '别放弃', '坚持下去'],
      nostalgic: ['唉，时间过得真快', '想想都是往事了', '那些日子啊', '如今想来'],
      affectionate: ['我爱你', '你是我的宝贝', '永远记住这一点', '你在我心里最重要']
    },

    // 情感修饰词
    emotionalModifiers: {
      happy: {
        adjectives: ['开心的', '愉快的', '美好的', '快乐的', '高兴的', '欢乐的'],
        adverbs: ['开心地', '高兴地', '愉快地', '兴奋地', '欢快地'],
        exclamations: ['哈哈', '嘿嘿', '呵呵', '哎呀', '太好了']
      },
      sad: {
        adjectives: ['难过的', '伤心的', '痛苦的', '沉重的', '悲伤的'],
        adverbs: ['难过地', '伤心地', '痛苦地', '沉重地'],
        exclamations: ['唉', '哎呀', '哎', '呜呜']
      },
      angry: {
        adjectives: ['生气的', '愤怒的', '恼火的', '气愤的', '不满的'],
        adverbs: ['生气地', '愤怒地', '恼火地', '严厉地'],
        exclamations: ['哼', '气死我了', '真是的', '太过分了']
      },
      loving: {
        adjectives: ['亲爱的', '可爱的', '宝贝的', '心爱的', '珍贵的'],
        adverbs: ['温柔地', '慈爱地', '关切地', '疼爱地'],
        exclamations: ['哎呀', '我的天', '宝贝', '亲爱的']
      }
    }
  },

  // 语言风格配置
  styleSettings: {
    verbosity: 'medium', // low, medium, high
    formality: 'casual', // formal, casual, intimate
    emotiveness: 'high', // low, medium, high
    storytelling: 'medium', // low, medium, high
    dialect: 'standard' // standard, northern, southern
  },

  // 个性化语言特征
  personalityTraits: {
    talkative: 0.7, // 健谈程度 0-1
    wise: 0.8, // 智慧程度 0-1
    humorous: 0.6, // 幽默程度 0-1
    caring: 0.9, // 关爱程度 0-1
    nostalgic: 0.8, // 怀旧程度 0-1
    authoritative: 0.7 // 权威程度 0-1
  }
})

// 智能语言组合生成器
const generateIntelligentSpeech = (baseText: string, emotionData: any, context: any) => {
  const { emotion, intensity } = emotionData
  const { scenarioType, relationshipLevel, timeContext } = context

  // 分析基础文本的语言特征
  const textAnalysis = analyzeTextCharacteristics(baseText)

  // 确定语言组合策略
  const compositionStrategy = determineCompositionStrategy(emotion, intensity, scenarioType, textAnalysis)

  // 生成智能组合的语言
  const composedSpeech = composeIntelligentLanguage(baseText, compositionStrategy, emotionData, context)

  return composedSpeech
}

// 分析文本特征
const analyzeTextCharacteristics = (text: string) => {
  return {
    length: text.length,
    sentenceCount: (text.match(/[。！？]/g) || []).length,
    questionCount: (text.match(/[？]/g) || []).length,
    exclamationCount: (text.match(/[！]/g) || []).length,
    hasPersonalPronouns: /[我你他她它们]/.test(text),
    hasEmotionalWords: /[开心|难过|生气|高兴|伤心|愤怒]/.test(text),
    complexity: text.length > 50 ? 'high' : text.length > 20 ? 'medium' : 'low'
  }
}

// 确定组合策略
const determineCompositionStrategy = (emotion: string, intensity: string, scenarioType: string, textAnalysis: any) => {
  let strategy = {
    useOpening: false,
    openingType: 'casual',
    useConnectors: false,
    connectorType: 'continuation',
    useEnding: false,
    endingType: 'questioning',
    addEmotionalModifiers: false,
    expandContent: false,
    addPersonalTouch: false
  }

  // 根据文本复杂度决定是否需要扩展
  if (textAnalysis.complexity === 'low' && intelligentLanguageComposer.value.personalityTraits.talkative > 0.6) {
    strategy.expandContent = true
  }

  // 根据情感强度决定修饰程度
  if (intensity === 'high' || intelligentLanguageComposer.value.personalityTraits.caring > 0.7) {
    strategy.addEmotionalModifiers = true
  }

  // 根据场景类型决定开场白
  if (['greeting', 'storytelling', 'comfort'].includes(scenarioType)) {
    strategy.useOpening = true
    strategy.openingType = scenarioType === 'storytelling' ? 'storytelling' :
                          scenarioType === 'comfort' ? 'emotional' : 'casual'
  }

  // 根据句子数量决定是否使用连接词
  if (textAnalysis.sentenceCount > 1) {
    strategy.useConnectors = true
    strategy.connectorType = scenarioType === 'education' ? 'emphasis' : 'continuation'
  }

  // 根据关系亲密度决定结尾
  if (intelligentLanguageComposer.value.personalityTraits.caring > 0.8) {
    strategy.useEnding = true
    strategy.endingType = emotion === 'loving' ? 'affectionate' : 'caring'
  }

  // 根据个性特征添加个人色彩
  if (intelligentLanguageComposer.value.personalityTraits.wise > 0.7 ||
      intelligentLanguageComposer.value.personalityTraits.nostalgic > 0.7) {
    strategy.addPersonalTouch = true
  }

  // 应用个性化学习设置
  strategy = applyPersonalizedSettings(strategy)

  return strategy
}

// 智能语言组合核心函数
const composeIntelligentLanguage = (baseText: string, strategy: any, emotionData: any, context: any) => {
  let composedText = baseText
  const { emotion, intensity } = emotionData

  // 第一步：添加开场白
  if (strategy.useOpening) {
    const opening = selectIntelligentOpening(strategy.openingType, emotion, context)
    if (opening) {
      composedText = opening + '，' + composedText
    }
  }

  // 第二步：扩展内容
  if (strategy.expandContent) {
    composedText = expandContentIntelligently(composedText, emotion, context)
  }

  // 第三步：添加情感修饰
  if (strategy.addEmotionalModifiers) {
    composedText = addIntelligentEmotionalModifiers(composedText, emotion, intensity)
  }

  // 第四步：添加连接词
  if (strategy.useConnectors) {
    composedText = addIntelligentConnectors(composedText, strategy.connectorType, emotion)
  }

  // 第五步：添加个人色彩
  if (strategy.addPersonalTouch) {
    composedText = addPersonalTouch(composedText, emotion, context)
  }

  // 第六步：添加结尾
  if (strategy.useEnding) {
    const ending = selectIntelligentEnding(strategy.endingType, emotion, context)
    if (ending) {
      composedText = composedText + ending
    }
  }

  // 第七步：语言润色和优化
  composedText = polishLanguage(composedText, emotion, context)

  return composedText
}

// 选择智能开场白
const selectIntelligentOpening = (type: string, emotion: string, context: any) => {
  const openings = intelligentLanguageComposer.value.languagePatterns.openings[type] || []

  if (openings.length === 0) return ''

  // 根据情感和上下文智能选择
  let selectedOpening = openings[Math.floor(Math.random() * openings.length)]

  // 根据时间上下文调整
  if (context.timeContext === 'morning' && type === 'casual') {
    const morningOpenings = ['嗯', '那个', '早上好啊']
    selectedOpening = morningOpenings[Math.floor(Math.random() * morningOpenings.length)]
  }

  // 根据情感调整语气
  if (emotion === 'loving' && type === 'emotional') {
    const lovingOpenings = ['我的孩子', '亲爱的', '宝贝']
    selectedOpening = lovingOpenings[Math.floor(Math.random() * lovingOpenings.length)]
  }

  return selectedOpening
}

// 智能扩展内容
const expandContentIntelligently = (text: string, emotion: string, context: any) => {
  const expansions = {
    happy: [
      '真的让我很开心',
      '这让我想起了美好的回忆',
      '看到你这样我就放心了'
    ],
    sad: [
      '这让我心里也很难受',
      '我能理解你的感受',
      '我们一起面对这个困难'
    ],
    loving: [
      '你知道我有多爱你吗',
      '你永远是我心中最重要的',
      '我会一直陪伴着你'
    ],
    nostalgic: [
      '这让我想起了过去的日子',
      '那时候的情景仿佛就在昨天',
      '时光荏苒，但有些东西永远不变'
    ]
  }

  const emotionExpansions = expansions[emotion] || []

  if (emotionExpansions.length > 0 && Math.random() < 0.6) {
    const expansion = emotionExpansions[Math.floor(Math.random() * emotionExpansions.length)]
    return text + '，' + expansion
  }

  return text
}

// 添加智能情感修饰
const addIntelligentEmotionalModifiers = (text: string, emotion: string, intensity: string) => {
  const modifiers = intelligentLanguageComposer.value.languagePatterns.emotionalModifiers[emotion]

  if (!modifiers) return text

  let modifiedText = text

  // 根据强度选择修饰程度
  const modificationChance = intensity === 'high' ? 0.8 : intensity === 'medium' ? 0.5 : 0.3

  if (Math.random() < modificationChance) {
    // 添加感叹词
    if (modifiers.exclamations && Math.random() < 0.4) {
      const exclamation = modifiers.exclamations[Math.floor(Math.random() * modifiers.exclamations.length)]
      modifiedText = exclamation + '，' + modifiedText
    }

    // 添加形容词修饰
    if (modifiers.adjectives && Math.random() < 0.3) {
      const adjective = modifiers.adjectives[Math.floor(Math.random() * modifiers.adjectives.length)]
      modifiedText = modifiedText.replace(/这/, adjective + '这')
    }

    // 添加副词修饰
    if (modifiers.adverbs && Math.random() < 0.3) {
      const adverb = modifiers.adverbs[Math.floor(Math.random() * modifiers.adverbs.length)]
      modifiedText = modifiedText.replace(/说/, adverb + '说')
    }
  }

  return modifiedText
}

// 添加智能连接词
const addIntelligentConnectors = (text: string, connectorType: string, emotion: string) => {
  const connectors = intelligentLanguageComposer.value.languagePatterns.connectors[connectorType] || []

  if (connectors.length === 0) return text

  // 分割句子
  const sentences = text.split(/[，。！？]/).filter(s => s.trim().length > 0)

  if (sentences.length > 1) {
    const connector = connectors[Math.floor(Math.random() * connectors.length)]

    // 在适当位置插入连接词
    const insertPosition = Math.floor(sentences.length / 2)
    sentences[insertPosition] = connector + '，' + sentences[insertPosition]

    return sentences.join('，') + '。'
  }

  return text
}

// 添加个人色彩
const addPersonalTouch = (text: string, emotion: string, context: any) => {
  const personalTouches = {
    wise: [
      '从我这么多年的经验来看',
      '我活了这么久，深深地知道',
      '人生的道理告诉我们',
      '智慧告诉我'
    ],
    nostalgic: [
      '想当年我们那个时候',
      '回想起过去的日子',
      '那些年的经历让我明白',
      '岁月教会了我'
    ],
    caring: [
      '作为你的长辈',
      '我最关心的就是你',
      '你的幸福是我最大的心愿',
      '我希望你能明白'
    ]
  }

  const traits = intelligentLanguageComposer.value.personalityTraits
  let selectedTouch = ''

  if (traits.wise > 0.7 && Math.random() < 0.3) {
    selectedTouch = personalTouches.wise[Math.floor(Math.random() * personalTouches.wise.length)]
  } else if (traits.nostalgic > 0.7 && Math.random() < 0.3) {
    selectedTouch = personalTouches.nostalgic[Math.floor(Math.random() * personalTouches.nostalgic.length)]
  } else if (traits.caring > 0.8 && Math.random() < 0.4) {
    selectedTouch = personalTouches.caring[Math.floor(Math.random() * personalTouches.caring.length)]
  }

  if (selectedTouch) {
    return selectedTouch + '，' + text
  }

  return text
}

// 选择智能结尾
const selectIntelligentEnding = (type: string, emotion: string, context: any) => {
  const endings = intelligentLanguageComposer.value.languagePatterns.endings[type] || []

  if (endings.length === 0) return ''

  let selectedEnding = endings[Math.floor(Math.random() * endings.length)]

  // 根据情感调整结尾
  if (emotion === 'loving' && type === 'affectionate') {
    selectedEnding = endings[Math.floor(Math.random() * endings.length)]
  }

  return selectedEnding
}

// 语言润色和优化
const polishLanguage = (text: string, emotion: string, context: any) => {
  let polishedText = text

  // 去除重复的标点符号
  polishedText = polishedText.replace(/[，。！？]{2,}/g, (match) => match[0])

  // 优化语言流畅性
  polishedText = polishedText.replace(/，，/g, '，')
  polishedText = polishedText.replace(/。。/g, '。')

  // 确保句子以适当的标点结尾
  if (!polishedText.match(/[。！？]$/)) {
    if (emotion === 'happy' || emotion === 'surprised') {
      polishedText += '！'
    } else if (polishedText.includes('吗') || polishedText.includes('呢')) {
      polishedText += '？'
    } else {
      polishedText += '。'
    }
  }

  // 根据方言特征调整
  if (intelligentLanguageComposer.value.styleSettings.dialect !== 'standard') {
    polishedText = applyDialectFeatures(polishedText)
  }

  return polishedText
}

// 应用方言特征
const applyDialectFeatures = (text: string) => {
  const dialect = intelligentLanguageComposer.value.styleSettings.dialect

  if (dialect === 'northern') {
    // 北方方言特征：儿化音
    text = text.replace(/这里/g, '这儿')
    text = text.replace(/那里/g, '那儿')
    text = text.replace(/哪里/g, '哪儿')
    text = text.replace(/一点/g, '一点儿')
  } else if (dialect === 'southern') {
    // 南方方言特征
    text = text.replace(/什么/g, '啥子')
    text = text.replace(/这样/g, '这样子')
    text = text.replace(/那样/g, '那样子')
  }

  return text
}

// 个性化语言学习系统
const personalizedLanguageLearning = ref({
  // 用户偏好学习
  userPreferences: {
    preferredGreetings: [],
    favoriteTopics: [],
    communicationStyle: 'balanced', // formal, casual, intimate, balanced
    responseLength: 'medium', // short, medium, long
    emotionalExpressiveness: 'high' // low, medium, high
  },

  // 对话历史分析
  conversationAnalytics: {
    totalInteractions: 0,
    averageResponseTime: 0,
    mostUsedEmotions: {},
    preferredScenarios: {},
    successfulResponses: [],
    unsuccessfulResponses: []
  },

  // 语言模式学习
  learnedPatterns: {
    successfulOpenings: {},
    effectiveConnectors: {},
    preferredEndings: {},
    emotionalTriggers: {}
  }
})

// 学习用户偏好
const learnFromUserInteraction = (userInput: string, aiResponse: string, userReaction: string) => {
  const learning = personalizedLanguageLearning.value

  // 更新交互统计
  learning.conversationAnalytics.totalInteractions++

  // 分析用户反应
  const reactionAnalysis = analyzeUserReaction(userReaction)

  if (reactionAnalysis.isPositive) {
    // 记录成功的回复模式
    learning.conversationAnalytics.successfulResponses.push({
      userInput,
      aiResponse,
      timestamp: new Date(),
      emotion: conversationContext.value.emotionalState,
      scenario: determineScenarioContext(userInput, {}).scenarioType
    })

    // 学习成功的语言模式
    learnSuccessfulPatterns(aiResponse, reactionAnalysis)
  } else if (reactionAnalysis.isNegative) {
    // 记录不成功的回复
    learning.conversationAnalytics.unsuccessfulResponses.push({
      userInput,
      aiResponse,
      timestamp: new Date(),
      reason: reactionAnalysis.reason
    })
  }

  // 更新个性化设置
  updatePersonalizedSettings(userInput, reactionAnalysis)
}

// 分析用户反应
const analyzeUserReaction = (userReaction: string) => {
  const positiveIndicators = ['好的', '谢谢', '对的', '是的', '哈哈', '开心', '喜欢']
  const negativeIndicators = ['不对', '不是', '不喜欢', '无聊', '重复', '太长', '太短']

  const reaction = userReaction.toLowerCase()

  let isPositive = positiveIndicators.some(indicator => reaction.includes(indicator))
  let isNegative = negativeIndicators.some(indicator => reaction.includes(indicator))

  let reason = ''
  if (isNegative) {
    if (reaction.includes('太长')) reason = 'too_long'
    else if (reaction.includes('太短')) reason = 'too_short'
    else if (reaction.includes('重复')) reason = 'repetitive'
    else if (reaction.includes('无聊')) reason = 'boring'
    else reason = 'general_negative'
  }

  return {
    isPositive,
    isNegative,
    isNeutral: !isPositive && !isNegative,
    reason,
    sentiment: isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'
  }
}

// 学习成功的语言模式
const learnSuccessfulPatterns = (aiResponse: string, reactionAnalysis: any) => {
  const learning = personalizedLanguageLearning.value.learnedPatterns

  // 提取开场白模式
  const openingMatch = aiResponse.match(/^([^，。！？]+)[，。]/)
  if (openingMatch) {
    const opening = openingMatch[1]
    learning.successfulOpenings[opening] = (learning.successfulOpenings[opening] || 0) + 1
  }

  // 提取连接词模式
  const connectorMatches = aiResponse.match(/[，。]([^，。！？]*[但是|然后|接着|另外|而且][^，。！？]*)[，。]/g)
  if (connectorMatches) {
    connectorMatches.forEach(match => {
      learning.effectiveConnectors[match] = (learning.effectiveConnectors[match] || 0) + 1
    })
  }

  // 提取结尾模式
  const endingMatch = aiResponse.match(/([^，。！？]+[？！。])$/)
  if (endingMatch) {
    const ending = endingMatch[1]
    learning.preferredEndings[ending] = (learning.preferredEndings[ending] || 0) + 1
  }
}

// 更新个性化设置
const updatePersonalizedSettings = (userInput: string, reactionAnalysis: any) => {
  const preferences = personalizedLanguageLearning.value.userPreferences

  // 根据用户反应调整回复长度偏好
  if (reactionAnalysis.reason === 'too_long') {
    if (preferences.responseLength === 'long') preferences.responseLength = 'medium'
    else if (preferences.responseLength === 'medium') preferences.responseLength = 'short'
  } else if (reactionAnalysis.reason === 'too_short') {
    if (preferences.responseLength === 'short') preferences.responseLength = 'medium'
    else if (preferences.responseLength === 'medium') preferences.responseLength = 'long'
  }

  // 根据用户输入学习偏好话题
  const topics = extractTopics(userInput)
  topics.forEach(topic => {
    if (!preferences.favoriteTopics.includes(topic)) {
      preferences.favoriteTopics.push(topic)
    }
  })

  // 学习沟通风格偏好
  if (userInput.includes('您') || userInput.includes('请')) {
    preferences.communicationStyle = 'formal'
  } else if (userInput.includes('亲爱的') || userInput.includes('宝贝')) {
    preferences.communicationStyle = 'intimate'
  }
}

// 提取话题
const extractTopics = (text: string) => {
  const topicKeywords = {
    family: ['家人', '家族', '亲人', '父母', '孩子'],
    health: ['身体', '健康', '病', '医院'],
    work: ['工作', '事业', '职业', '公司'],
    education: ['学习', '读书', '学校', '教育'],
    memories: ['回忆', '过去', '以前', '小时候']
  }

  const topics = []
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      topics.push(topic)
    }
  }

  return topics
}

// 应用个性化设置到语言组合
const applyPersonalizedSettings = (strategy: any) => {
  const preferences = personalizedLanguageLearning.value.userPreferences
  const learned = personalizedLanguageLearning.value.learnedPatterns

  // 根据用户偏好调整策略
  if (preferences.responseLength === 'short') {
    strategy.expandContent = false
    strategy.useOpening = false
  } else if (preferences.responseLength === 'long') {
    strategy.expandContent = true
    strategy.addPersonalTouch = true
  }

  // 根据沟通风格调整
  if (preferences.communicationStyle === 'formal') {
    strategy.openingType = 'formal'
    strategy.endingType = 'questioning'
  } else if (preferences.communicationStyle === 'intimate') {
    strategy.openingType = 'emotional'
    strategy.endingType = 'affectionate'
  }

  // 应用学习到的成功模式
  if (Object.keys(learned.successfulOpenings).length > 0) {
    // 优先使用成功率高的开场白
    const bestOpening = Object.entries(learned.successfulOpenings)
      .sort(([,a], [,b]) => b - a)[0][0]
    strategy.preferredOpening = bestOpening
  }

  return strategy
}

// generateIntelligentSpeech 函数已在上面定义，删除重复声明

// 选择开场白
const selectOpening = (emotion: string, scenarioType: string, relationshipLevel: number) => {
  const patterns = voiceExpressionSystem.value.speechPatterns.openings

  let selectedPattern = 'casual'

  // 根据情感选择开场白类型
  if (['nostalgic', 'storytelling'].includes(scenarioType)) {
    selectedPattern = 'storytelling'
  } else if (['loving', 'worried'].includes(emotion)) {
    selectedPattern = 'emotional'
  } else if (relationshipLevel > 5) {
    selectedPattern = 'casual'
  } else {
    selectedPattern = 'formal'
  }

  const options = patterns[selectedPattern]
  if (options && options.length > 0) {
    const selected = options[Math.floor(Math.random() * options.length)]
    return Math.random() < 0.7 ? selected + '，' : '' // 70%概率添加开场白
  }

  return ''
}

// 处理主要内容
const processMainContent = (text: string, emotion: string, intensity: string) => {
  let processedText = text

  // 根据情感强度调整表达方式
  if (intensity === 'high') {
    processedText = enhanceIntensity(processedText, emotion)
  } else if (intensity === 'low') {
    processedText = softenIntensity(processedText, emotion)
  }

  // 添加情感色彩词汇
  processedText = addEmotionalColoring(processedText, emotion)

  return processedText
}

// 增强强度表达
const enhanceIntensity = (text: string, emotion: string) => {
  const intensifiers = {
    happy: ['非常', '特别', '超级', '极其'],
    sad: ['深深地', '非常', '极其', '十分'],
    angry: ['非常', '极其', '十分', '相当'],
    surprised: ['非常', '极其', '十分', '相当'],
    worried: ['非常', '特别', '深深地', '十分']
  }

  const modifiers = intensifiers[emotion] || intensifiers.happy
  const modifier = modifiers[Math.floor(Math.random() * modifiers.length)]

  // 在适当位置插入强化词
  return text.replace(/(很|挺|还|比较)/, modifier)
}

// 软化强度表达
const softenIntensity = (text: string, emotion: string) => {
  const softeners = ['有点', '稍微', '还算', '比较', '略微']
  const softener = softeners[Math.floor(Math.random() * softeners.length)]

  return text.replace(/(很|非常|特别|超级)/, softener)
}

// 添加情感色彩词汇
const addEmotionalColoring = (text: string, emotion: string) => {
  const coloringWords = {
    happy: {
      adjectives: ['开心的', '愉快的', '美好的', '快乐的'],
      exclamations: ['哈哈', '嘿嘿', '呵呵'],
      particles: ['呢', '啊', '呀']
    },
    sad: {
      adjectives: ['难过的', '伤心的', '痛苦的', '沉重的'],
      exclamations: ['唉', '哎呀'],
      particles: ['啊', '呢', '...']
    },
    loving: {
      adjectives: ['亲爱的', '可爱的', '宝贝的', '心爱的'],
      exclamations: ['哎呀', '我的天'],
      particles: ['啊', '呢', '呀']
    }
  }

  const coloring = coloringWords[emotion]
  if (coloring && Math.random() < 0.4) { // 40%概率添加色彩词汇
    const type = Math.random() < 0.5 ? 'particles' : 'exclamations'
    const words = coloring[type]
    if (words && words.length > 0) {
      const word = words[Math.floor(Math.random() * words.length)]
      if (type === 'particles') {
        text = text + word
      } else {
        text = word + '，' + text
      }
    }
  }

  return text
}

// 添加连接词
const addConnectors = (text: string, emotion: string, scenarioType: string) => {
  const connectors = voiceExpressionSystem.value.speechPatterns.connectors

  // 根据场景选择连接词类型
  let connectorType = 'continuation'
  if (scenarioType === 'education') connectorType = 'emphasis'
  else if (scenarioType === 'comfort') connectorType = 'contrast'
  else if (scenarioType === 'memories') connectorType = 'continuation'

  // 分割文本为句子
  const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0)

  if (sentences.length > 1) {
    const connector = connectors[connectorType][Math.floor(Math.random() * connectors[connectorType].length)]
    // 在第二句前添加连接词
    sentences[1] = connector + '，' + sentences[1]
    return sentences.join('。') + '。'
  }

  return text
}

// 选择结尾
const selectEnding = (emotion: string, scenarioType: string, relationshipLevel: number) => {
  const endings = voiceExpressionSystem.value.speechPatterns.endings

  let endingType = 'questioning'

  // 根据情感和场景选择结尾类型
  if (emotion === 'loving' || scenarioType === 'comfort') {
    endingType = 'caring'
  } else if (emotion === 'happy' || scenarioType === 'education') {
    endingType = 'encouraging'
  } else if (emotion === 'nostalgic' || scenarioType === 'memories') {
    endingType = 'nostalgic'
  }

  const options = endings[endingType]
  if (options && options.length > 0 && Math.random() < 0.6) { // 60%概率添加结尾
    return options[Math.floor(Math.random() * options.length)]
  }

  return ''
}

// 组合完整语音
const combineFullSpeech = (opening: string, content: string, ending: string) => {
  let fullSpeech = ''

  if (opening) fullSpeech += opening
  fullSpeech += content
  if (ending) fullSpeech += ending

  return fullSpeech
}

// 生成后续回复（AI主动继续话题）
const generateFollowUpResponse = async (previousResponse: string) => {
  aiThinking.value = true

  setTimeout(async () => {
    aiThinking.value = false
    aiSpeaking.value = true

    const followUpResponses = [
      '对了，我还想说...',
      '另外，我觉得...',
      '说起这个，我想起...',
      '还有一件事...',
      '你知道吗？'
    ]

    const followUp = followUpResponses[Math.floor(Math.random() * followUpResponses.length)]
    const additionalContent = generateAdditionalContent(previousResponse)

    const aiMessage = {
      id: Date.now(),
      content: followUp + additionalContent,
      isUser: false,
      timestamp: new Date(),
      emotion: 'continuing'
    }

    messages.value.push(aiMessage)

    await nextTick()
    scrollToBottom()

    if (isVideoCall.value) {
      speakText(aiMessage.content, 'continuing')
    }

    setTimeout(() => {
      aiSpeaking.value = false
    }, calculateSpeakingDuration(aiMessage.content))
  }, 2000 + Math.random() * 3000)
}

// 计算说话时长
const calculateSpeakingDuration = (text: string) => {
  // 基于文字长度和语速计算说话时间
  const wordsPerMinute = 150 // 中文每分钟约150字
  const characters = text.length
  const baseDuration = (characters / wordsPerMinute) * 60 * 1000 // 转换为毫秒

  // 添加自然的停顿时间
  const pauseTime = (text.match(/[，。！？；]/g) || []).length * 300

  return Math.max(2000, baseDuration + pauseTime) // 最少2秒
}

// 生成额外内容
const generateAdditionalContent = (previousResponse: string) => {
  const additionalContents = [
    '人生就是这样，有起有落，重要的是要保持一颗平常心。',
    '我们家族的传统就是互相关爱，这个传统要一直传承下去。',
    '时间虽然会改变很多东西，但家人之间的感情是永远不会变的。',
    '每次和你们聊天，我都感到很幸福，这就是家的温暖。',
    '记住，不管走到哪里，家永远是你的港湾。'
  ]

  return additionalContents[Math.floor(Math.random() * additionalContents.length)]
}

// 辅助函数
const detectTopicChange = (input: string) => {
  const currentTopic = analyzeCurrentTopic(input)
  return currentTopic !== conversationContext.value.currentTopic
}

const analyzeUserEngagement = (input: string) => {
  const engagementIndicators = {
    high: input.length > 20 && (input.includes('?') || input.includes('！') || input.includes('真的')),
    medium: input.length > 10,
    low: input.length <= 10
  }

  if (engagementIndicators.high) return 'high'
  if (engagementIndicators.medium) return 'medium'
  return 'low'
}

const analyzeConversationPace = () => {
  const context = conversationContext.value
  const recentMessages = context.conversationFlow.slice(-3)

  if (recentMessages.length < 2) return 'normal'

  const timeDiffs = []
  for (let i = 1; i < recentMessages.length; i++) {
    const diff = recentMessages[i].timestamp.getTime() - recentMessages[i-1].timestamp.getTime()
    timeDiffs.push(diff)
  }

  const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length

  if (avgDiff < 5000) return 'fast'
  if (avgDiff > 30000) return 'slow'
  return 'normal'
}

const calculateTopicConsistency = (messages: any[]) => {
  if (messages.length < 2) return 1

  const topics = messages.map(m => analyzeCurrentTopic(m.content))
  const uniqueTopics = new Set(topics)

  return 1 - (uniqueTopics.size - 1) / messages.length
}

const calculateConversationRhythm = (messages: any[]) => {
  if (messages.length < 3) return 'establishing'

  const userMessages = messages.filter(m => m.type === 'user')
  const aiMessages = messages.filter(m => m.type === 'ai')

  if (userMessages.length > aiMessages.length) return 'user_driven'
  if (aiMessages.length > userMessages.length) return 'ai_driven'
  return 'balanced'
}

const generateTopicSpecificResponse = (input: string, tone: string) => {
  const topic = analyzeCurrentTopic(input)

  const topicResponses = {
    family: {
      text: '家人是最重要的，我们要珍惜彼此。',
      emotion: 'warm',
      gesture: 'caring'
    },
    health: {
      text: '身体健康确实很重要，要好好保养。',
      emotion: 'concerned',
      gesture: 'advising'
    },
    work: {
      text: '工作虽然重要，但不要忘记生活的平衡。',
      emotion: 'wise',
      gesture: 'thoughtful'
    }
  }

  return topicResponses[topic] || {
    text: '你说得很有道理。',
    emotion: 'agreeable',
    gesture: 'nodding'
  }
}
</script>

<style scoped>
.ai-ancestor-chat-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.video-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.video-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.video-btn.active {
  color: #07c160;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 75px;
}

/* AI标识 */
.ai-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 193, 7, 0.1);
  border-bottom: 1px solid rgba(255, 193, 7, 0.2);
  font-size: 12px;
  color: #856404;
}

.training-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.status-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator.idle {
  background: #f8f9fa;
  color: #6c757d;
}

.status-indicator.training {
  background: #fff3e0;
  color: #f57c00;
  animation: pulse 2s infinite;
}

.status-indicator.completed {
  background: #e8f5e8;
  color: #388e3c;
}

.status-indicator.failed {
  background: #ffebee;
  color: #d32f2f;
}

.progress-bar {
  width: 40px;
  height: 3px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #07c160;
  transition: width 0.3s ease;
}

.training-btn {
  background: none;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.training-btn:hover {
  background: #ffeaa7;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 视频通话区域 */
.video-call-area {
  background: #000;
  padding: 16px;
  position: relative;
}

.video-container {
  display: flex;
  gap: 12px;
  height: 200px;
}

.ai-avatar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.ai-avatar {
  position: relative;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.ai-avatar.speaking {
  transform: scale(1.05);
}

/* AI动作样式 */
.ai-avatar.performing {
  animation: performing 2s infinite;
}

.ai-avatar.dancing {
  animation: dancing 1.5s infinite;
}

.ai-avatar.singing {
  animation: singing 2s infinite;
}

.ai-avatar.laughing {
  animation: laughing 1s infinite;
}

.ai-avatar.wave {
  animation: wave 2s infinite;
}

.ai-avatar.nod {
  animation: nod 1s infinite;
}

.ai-avatar.shake_head {
  animation: shake-head 1s infinite;
}

.ai-avatar.tai_chi {
  animation: tai-chi 3s infinite;
}

@keyframes performing {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.02) rotate(1deg); }
  75% { transform: scale(1.02) rotate(-1deg); }
}

@keyframes dancing {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.05) rotate(5deg); }
  50% { transform: scale(1.1) rotate(0deg); }
  75% { transform: scale(1.05) rotate(-5deg); }
}

@keyframes singing {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes laughing {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(2deg); }
  75% { transform: scale(1.1) rotate(-2deg); }
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  75% { transform: rotate(-10deg); }
}

@keyframes nod {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

@keyframes shake-head {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
}

@keyframes tai-chi {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(5deg) scale(1.02); }
  50% { transform: rotate(0deg) scale(1.05); }
  75% { transform: rotate(-5deg) scale(1.02); }
}

/* 情感表达样式 */
.ai-avatar-container.happy {
  animation: happy-bounce 2s infinite ease-in-out;
}

.ai-avatar-container.sad {
  animation: sad-sway 3s infinite ease-in-out;
  filter: brightness(0.9);
}

.ai-avatar-container.angry {
  animation: angry-shake 0.5s infinite;
}

.ai-avatar-container.angry.high-intensity {
  animation: angry-intense 0.3s infinite;
}

.ai-avatar-container.surprised {
  animation: surprised-jump 1s ease-out;
}

.ai-avatar-container.worried {
  animation: worried-fidget 2s infinite ease-in-out;
}

.ai-avatar-container.nostalgic {
  animation: nostalgic-drift 4s infinite ease-in-out;
  filter: sepia(0.2) brightness(0.95);
}

.ai-avatar-container.loving {
  animation: loving-glow 3s infinite ease-in-out;
}

/* 强度修饰符 */
.ai-avatar-container.high-intensity {
  animation-duration: 0.8s;
  transform-origin: center;
}

.ai-avatar-container.low-intensity {
  animation-duration: 4s;
  opacity: 0.95;
}

/* 姿态样式 */
.ai-avatar-container.upright {
  transform: translateY(-2px);
}

.ai-avatar-container.slumped {
  transform: translateY(3px) scale(0.98);
}

.ai-avatar-container.tense {
  transform: scale(1.02);
}

.ai-avatar-container.relaxed {
  transform: scale(0.99);
}

.ai-avatar-container.forward {
  transform: translateZ(5px) scale(1.01);
}

.ai-avatar-container.withdrawn {
  transform: translateZ(-5px) scale(0.97);
}

/* 情感动画 */
@keyframes happy-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.02); }
}

@keyframes sad-sway {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-2px) rotate(-1deg); }
  75% { transform: translateX(2px) rotate(1deg); }
}

@keyframes angry-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px) rotate(-1deg); }
  75% { transform: translateX(2px) rotate(1deg); }
}

@keyframes angry-intense {
  0%, 100% { transform: translateX(0) scale(1); }
  25% { transform: translateX(-3px) rotate(-2deg) scale(1.02); }
  75% { transform: translateX(3px) rotate(2deg) scale(1.02); }
}

@keyframes surprised-jump {
  0% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-8px) scale(1.05); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes worried-fidget {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-1px) rotate(0.5deg); }
  50% { transform: translateY(1px) rotate(0deg); }
  75% { transform: translateY(-1px) rotate(-0.5deg); }
}

@keyframes nostalgic-drift {
  0%, 100% { transform: translateX(0) translateY(0); }
  25% { transform: translateX(-1px) translateY(-1px); }
  50% { transform: translateX(1px) translateY(1px); }
  75% { transform: translateX(-1px) translateY(1px); }
}

@keyframes loving-glow {
  0%, 100% {
    filter: brightness(1) saturate(1);
    box-shadow: 0 0 10px rgba(255, 182, 193, 0.3);
  }
  50% {
    filter: brightness(1.1) saturate(1.2);
    box-shadow: 0 0 20px rgba(255, 182, 193, 0.6);
  }
}

.avatar-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #07c160;
}

.ai-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid #000;
}

.avatar-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.avatar-status {
  color: #ccc;
  font-size: 12px;
}

.user-video-container {
  width: 120px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.user-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-disabled-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 12px;
  gap: 8px;
}

.user-controls {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn.muted {
  background: #ff3b30;
}

.control-btn.disabled {
  background: #999;
}

.control-btn.end-call {
  background: #ff4757;
}

.control-btn.end-call:hover {
  background: #ff3838;
}

/* 消息区域 */
.messages-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages-area.with-video {
  max-height: calc(100vh - 400px);
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 8px;
}

.message-item.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  position: relative;
  flex-shrink: 0;
}

.message-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.ai-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid white;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.user-message .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-bubble {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-message .message-bubble {
  background: #07c160;
  color: white;
}

.message-bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.message-bubble.thinking {
  background: #f0f0f0;
  padding: 16px;
}

.thinking-dots {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
  animation: thinking 1.4s infinite ease-in-out;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinking {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.play-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-time {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

.user-message .message-time {
  text-align: right;
}

/* 输入区域 */
.input-area {
  background: white;
  border-top: 1px solid #f0f0f0;
  padding: 16px;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.voice-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.voice-btn.active {
  background: #ff3b30;
  color: white;
}

.text-input-container {
  flex: 1;
}

.message-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  outline: none;
  resize: none;
  max-height: 80px;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #07c160;
}

.message-input:disabled {
  background: #f5f5f5;
  color: #999;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #07c160;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.voice-input-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.voice-wave {
  display: flex;
  gap: 2px;
  align-items: center;
}

.wave-bar {
  width: 3px;
  height: 16px;
  background: #07c160;
  border-radius: 2px;
  animation: wave 1s infinite ease-in-out;
}

.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }
.wave-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 40%, 100% { transform: scaleY(0.4); }
  20% { transform: scaleY(1); }
}

.quick-questions {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.quick-questions::-webkit-scrollbar {
  display: none;
}

.quick-question-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-question-btn:hover {
  background: #f5f5f5;
  border-color: #07c160;
}

/* AI信息弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-info-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.ai-capabilities {
  margin-bottom: 20px;
}

.capability-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.capability-icon {
  color: #07c160;
  flex-shrink: 0;
  margin-top: 2px;
}

.capability-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.capability-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.ai-limitations h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.ai-limitations ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.ai-limitations li {
  margin-bottom: 4px;
}

/* 训练弹窗样式 */
.training-modal {
  background: white;
  border-radius: 16px;
  width: 95%;
  max-width: 500px;
  max-height: 85vh;
  overflow: hidden;
}

.training-overview {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.overview-card {
  flex: 1;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.card-info p {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #666;
}

.card-info .status {
  font-size: 11px;
  color: #07c160;
}

.upload-section {
  margin-bottom: 20px;
}

.upload-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.upload-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.upload-tab {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.upload-tab.active {
  border-color: #07c160;
  background: #f0f9ff;
  color: #07c160;
}

.upload-area {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
}

.upload-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff3e0;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #f57c00;
}

.file-upload {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload:hover {
  border-color: #07c160;
  background: #f0f9ff;
}

.file-upload h4 {
  margin: 12px 0 8px 0;
  font-size: 16px;
  color: #333;
}

.file-upload p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.uploaded-files {
  margin-top: 16px;
}

.uploaded-files h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.file-info span:first-of-type {
  font-size: 14px;
  color: #333;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.file-status.uploading {
  background: #fff3e0;
  color: #f57c00;
}

.file-status.completed {
  background: #e8f5e8;
  color: #388e3c;
}

.file-status.failed {
  background: #ffebee;
  color: #d32f2f;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4757;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.training-control {
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.training-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.training-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.status-training {
  color: #f57c00;
}

.status-completed {
  color: #388e3c;
}

.status-failed {
  color: #d32f2f;
}

.training-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.progress-bar-large {
  width: 100px;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.training-actions {
  display: flex;
  gap: 12px;
}

.start-training-btn,
.stop-training-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.start-training-btn {
  background: #07c160;
  color: white;
}

.start-training-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.start-training-btn:hover:not(:disabled) {
  background: #06a552;
}

.stop-training-btn {
  background: #ff4757;
  color: white;
}

.stop-training-btn:hover {
  background: #ff3838;
}

/* 动作特效样式 */
.action-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.dance-effects .music-notes {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  color: #07c160;
  animation: float-notes 2s infinite;
}

.sing-effects .sound-waves {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 3px solid #3742fa;
  border-radius: 50%;
  animation: sound-wave 1.5s infinite;
}

.sing-effects .sound-waves::before,
.sing-effects .sound-waves::after {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border: 2px solid #3742fa;
  border-radius: 50%;
  animation: sound-wave 1.5s infinite 0.3s;
}

.sing-effects .sound-waves::after {
  animation-delay: 0.6s;
}

.laugh-effects .laugh-bubbles {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  animation: bubble-float 2s infinite;
}

@keyframes float-notes {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
  50% { transform: translateX(-50%) translateY(-20px); opacity: 0.7; }
}

@keyframes sound-wave {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

@keyframes bubble-float {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
  50% { transform: translateX(-50%) translateY(-30px); opacity: 0.8; }
}

/* AI动作提示样式 */
.ai-action-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(7, 193, 96, 0.2);
  border: 1px solid #07c160;
  border-radius: 20px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: fade-in 0.5s ease-in-out;
}

.action-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-emoji {
  font-size: 16px;
}

.action-text {
  color: white;
  font-size: 12px;
}

@keyframes fade-in {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
