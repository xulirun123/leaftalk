<template>
  <div class="quick-worship-modal">
    <div class="modal-overlay" @click="$emit('close')"></div>
    
    <div class="modal-content">
      <!-- 头部 -->
      <div class="modal-header">
        <div class="cemetery-info">
          <h3>{{ cemetery.name }}</h3>
          <p>{{ cemetery.deceasedName }}</p>
        </div>
        
        <button @click="$emit('close')" class="close-btn">
          <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
        </button>
      </div>
      
      <!-- 快速祭拜选项 -->
      <div class="quick-worship-options">
        <h4>快速祭拜</h4>
        
        <div class="worship-templates">
          <div 
            v-for="template in worshipTemplates" 
            :key="template.id"
            @click="selectTemplate(template)"
            :class="{ selected: selectedTemplate?.id === template.id }"
            class="worship-template"
          >
            <div class="template-icon">
              <iconify-icon :icon="template.icon" width="24"></iconify-icon>
            </div>
            
            <div class="template-info">
              <h5>{{ template.name }}</h5>
              <p>{{ template.description }}</p>
            </div>
            
            <div class="template-offerings">
              <span v-for="offering in template.offerings" :key="offering" class="offering-tag">
                {{ offering }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 祈福话语 -->
      <div class="prayer-section">
        <h4>祈福话语</h4>
        <div class="prayer-input">
          <textarea 
            v-model="prayerText"
            placeholder="写下您的祈福话语..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="prayer-templates">
          <button 
            v-for="prayer in prayerTemplates" 
            :key="prayer.id"
            @click="addPrayer(prayer.text)"
            class="prayer-template-btn"
          >
            {{ prayer.text }}
          </button>
        </div>
      </div>
      
      <!-- 祭拜时长 -->
      <div class="duration-section">
        <h4>祭拜时长</h4>
        <div class="duration-options">
          <button 
            v-for="duration in durationOptions" 
            :key="duration.value"
            @click="selectedDuration = duration.value"
            :class="{ selected: selectedDuration === duration.value }"
            class="duration-btn"
          >
            {{ duration.label }}
          </button>
        </div>
      </div>
      
      <!-- 操作按钮 */
      <div class="modal-actions">
        <button @click="$emit('close')" class="cancel-btn">
          取消
        </button>
        
        <button @click="startQuickWorship" :disabled="!selectedTemplate" class="worship-btn">
          <iconify-icon icon="heroicons:hand-raised" width="16"></iconify-icon>
          <span>开始祭拜</span>
        </button>
      </div>
      
      <!-- 祭拜进行中 -->
      <div v-if="isWorshipping" class="worship-progress">
        <div class="progress-content">
          <div class="worship-animation">
            <div class="candle-flame"></div>
            <div class="incense-smoke"></div>
          </div>
          
          <h4>正在祭拜中...</h4>
          <p>{{ selectedTemplate.name }}</p>
          
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          
          <div class="progress-time">
            {{ formatTime(remainingTime) }} / {{ formatTime(selectedDuration * 60) }}
          </div>
          
          <button @click="completeWorship" class="complete-btn">
            提前完成
          </button>
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
const emit = defineEmits(['close', 'complete'])

// 状态管理
const selectedTemplate = ref(null)
const prayerText = ref('')
const selectedDuration = ref(3) // 默认3分钟
const isWorshipping = ref(false)
const worshipTimer = ref(null)
const remainingTime = ref(0)

// 祭拜模板
const worshipTemplates = ref([
  {
    id: 1,
    name: '传统祭拜',
    description: '鞠躬、上香、献花的传统仪式',
    icon: 'heroicons:gift',
    offerings: ['鲜花', '香烛', '水果'],
    actions: ['bow', 'offer_incense', 'place_flowers']
  },
  {
    id: 2,
    name: '简约祭拜',
    description: '简单的鞠躬和祈福',
    icon: 'heroicons:hand-raised',
    offerings: ['鲜花'],
    actions: ['bow', 'pray']
  },
  {
    id: 3,
    name: '节日祭拜',
    description: '适合清明、中元等节日',
    icon: 'heroicons:cake',
    offerings: ['鲜花', '香烛', '糕点', '水果'],
    actions: ['bow', 'offer_incense', 'place_flowers', 'pray']
  },
  {
    id: 4,
    name: '生日纪念',
    description: '逝者生日的特别纪念',
    icon: 'heroicons:gift-top',
    offerings: ['生日蛋糕', '鲜花', '蜡烛'],
    actions: ['bow', 'light_candle', 'place_flowers', 'pray']
  }
])

// 祈福模板
const prayerTemplates = ref([
  { id: 1, text: '愿您在天堂安息' },
  { id: 2, text: '保佑家人身体健康' },
  { id: 3, text: '感谢您的养育之恩' },
  { id: 4, text: '愿家族兴旺发达' },
  { id: 5, text: '永远怀念您' }
])

// 时长选项
const durationOptions = ref([
  { value: 1, label: '1分钟' },
  { value: 3, label: '3分钟' },
  { value: 5, label: '5分钟' },
  { value: 10, label: '10分钟' }
])

// 计算属性
const progressPercentage = computed(() => {
  if (!isWorshipping.value || selectedDuration.value === 0) return 0
  const totalTime = selectedDuration.value * 60
  const elapsed = totalTime - remainingTime.value
  return Math.min((elapsed / totalTime) * 100, 100)
})

// 生命周期
onUnmounted(() => {
  if (worshipTimer.value) {
    clearInterval(worshipTimer.value)
  }
})

// 方法
const selectTemplate = (template) => {
  selectedTemplate.value = template
}

const addPrayer = (prayer) => {
  if (prayerText.value) {
    prayerText.value += '\n' + prayer
  } else {
    prayerText.value = prayer
  }
}

const startQuickWorship = () => {
  if (!selectedTemplate.value) return
  
  isWorshipping.value = true
  remainingTime.value = selectedDuration.value * 60
  
  // 开始倒计时
  worshipTimer.value = setInterval(() => {
    remainingTime.value--
    
    if (remainingTime.value <= 0) {
      completeWorship()
    }
  }, 1000)
  
  // 播放祭拜音效
  playWorshipSound()
}

const completeWorship = () => {
  isWorshipping.value = false
  
  if (worshipTimer.value) {
    clearInterval(worshipTimer.value)
    worshipTimer.value = null
  }
  
  // 计算实际祭拜时长
  const actualDuration = selectedDuration.value * 60 - remainingTime.value
  
  // 构建祭拜数据
  const worshipData = {
    cemeteryId: props.cemetery.id,
    template: selectedTemplate.value,
    prayer: prayerText.value,
    duration: actualDuration,
    offerings: selectedTemplate.value.offerings,
    actions: selectedTemplate.value.actions,
    timestamp: new Date().toISOString()
  }
  
  // 发送完成事件
  emit('complete', worshipData)
  
  // 显示完成提示
  appStore.showToast('祭拜完成，愿逝者安息', 'success')
}

const playWorshipSound = () => {
  // 播放祭拜相关的背景音乐或音效
  console.log('播放祭拜音效')
}

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.quick-worship-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
}

.modal-content {
  position: relative;
  background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  color: white;
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cemetery-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #FFD700;
}

.cemetery-info p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.close-btn {
  width: 32px;
  height: 32px;
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

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.quick-worship-options {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-worship-options h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.worship-templates {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.worship-template {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.worship-template:hover {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
}

.worship-template.selected {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.2);
}

.template-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFD700;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
}

.template-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.template-info p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.template-offerings {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.offering-tag {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
}

.prayer-section {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.prayer-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.prayer-input textarea {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  resize: none;
  margin-bottom: 12px;
}

.prayer-input textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.prayer-templates {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prayer-template-btn {
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
}

.prayer-template-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #FFD700;
}

.duration-section {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.duration-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFD700;
}

.duration-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.duration-btn {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.duration-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.duration-btn.selected {
  background: #FFD700;
  color: #333;
  border-color: #FFD700;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
}

.cancel-btn {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.worship-btn {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.worship-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.worship-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.worship-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.progress-content {
  text-align: center;
  padding: 40px;
}

.worship-animation {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
}

.candle-flame {
  width: 20px;
  height: 30px;
  background: radial-gradient(ellipse at center, #FFD700 0%, #FF4500 70%, transparent 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  margin: 0 auto;
  animation: flame-flicker 2s ease-in-out infinite alternate;
}

@keyframes flame-flicker {
  0% { transform: scale(1) rotate(-2deg); }
  100% { transform: scale(1.1) rotate(2deg); }
}

.incense-smoke {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 60px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 50%;
  animation: smoke-rise 3s ease-in-out infinite;
}

@keyframes smoke-rise {
  0% { transform: translateX(-50%) translateY(0) scale(1); opacity: 0.6; }
  100% { transform: translateX(-50%) translateY(-20px) scale(1.5); opacity: 0; }
}

.progress-content h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #FFD700;
}

.progress-content p {
  margin: 0 0 20px 0;
  color: rgba(255, 255, 255, 0.8);
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 0 auto 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FF8C00);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-time {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
}

.complete-btn {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-size: 12px;
}
</style>
