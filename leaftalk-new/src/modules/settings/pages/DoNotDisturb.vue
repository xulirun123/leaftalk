<template>
  <div class="do-not-disturb">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">免打扰时间</div>
      <button class="save-btn" @click="saveSettings" :disabled="!hasChanges">
        保存
      </button>
    </div>

    <!-- 免打扰开关 -->
    <div class="settings-section">
      <div class="setting-item">
        <div class="setting-info">
          <span>启用免打扰</span>
          <span class="setting-desc">在设定时间内不接收消息通知</span>
        </div>
        <div class="setting-toggle" :class="{ active: doNotDisturbEnabled }" @click="toggleDoNotDisturb">
          <div class="toggle-thumb"></div>
        </div>
      </div>
    </div>

    <!-- 时间设置 -->
    <div v-if="doNotDisturbEnabled" class="time-settings">
      <div class="settings-section">
        <div class="section-title">免打扰时间段</div>
        
        <div class="time-picker-section">
          <div class="time-item">
            <label>开始时间</label>
            <div class="time-picker" @click="showStartTimePicker = true">
              <span>{{ startTime }}</span>
              <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
            </div>
          </div>
          
          <div class="time-item">
            <label>结束时间</label>
            <div class="time-picker" @click="showEndTimePicker = true">
              <span>{{ endTime }}</span>
              <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前状态显示 -->
      <div class="status-section">
        <div class="status-info">
          <iconify-icon 
            :icon="isCurrentlyInDoNotDisturb ? 'heroicons:moon' : 'heroicons:sun'" 
            width="20" 
            :style="{ color: isCurrentlyInDoNotDisturb ? '#666' : '#07C160' }"
          ></iconify-icon>
          <span>{{ statusText }}</span>
        </div>
      </div>
    </div>

    <!-- 说明文字 -->
    <div class="description-section">
      <p>免打扰期间，您将不会收到新消息的推送通知，但仍可以正常接收和查看消息。</p>
    </div>

    <!-- 时间选择器弹窗 -->
    <div v-if="showStartTimePicker || showEndTimePicker" class="time-picker-overlay" @click="closeTimePicker">
      <div class="time-picker-dialog" @click.stop>
        <div class="time-picker-header">
          <button @click="closeTimePicker">取消</button>
          <span>{{ showStartTimePicker ? '开始时间' : '结束时间' }}</span>
          <button @click="confirmTime">确定</button>
        </div>
        <div class="time-picker-content">
          <div class="time-wheels">
            <div class="time-wheel">
              <div class="wheel-label">时</div>
              <div class="wheel-options">
                <div 
                  v-for="hour in hours" 
                  :key="hour"
                  class="wheel-option"
                  :class="{ active: selectedHour === hour }"
                  @click="selectedHour = hour"
                >
                  {{ hour.toString().padStart(2, '0') }}
                </div>
              </div>
            </div>
            <div class="time-wheel">
              <div class="wheel-label">分</div>
              <div class="wheel-options">
                <div 
                  v-for="minute in minutes" 
                  :key="minute"
                  class="wheel-option"
                  :class="{ active: selectedMinute === minute }"
                  @click="selectedMinute = minute"
                >
                  {{ minute.toString().padStart(2, '0') }}
                </div>
              </div>
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
import { useNotificationStore } from '../../../stores/notification'

const router = useRouter()
const notificationStore = useNotificationStore()

// 状态
const doNotDisturbEnabled = ref(false)
const startTime = ref('22:00')
const endTime = ref('08:00')
const originalSettings = ref({})

// 时间选择器状态
const showStartTimePicker = ref(false)
const showEndTimePicker = ref(false)
const selectedHour = ref(22)
const selectedMinute = ref(0)

// 时间选项
const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 }, (_, i) => i).filter(m => m % 5 === 0) // 5分钟间隔

// 计算属性
const hasChanges = computed(() => {
  return doNotDisturbEnabled.value !== notificationStore.settings.doNotDisturbEnabled ||
         startTime.value !== notificationStore.settings.doNotDisturbStart ||
         endTime.value !== notificationStore.settings.doNotDisturbEnd
})

const isCurrentlyInDoNotDisturb = computed(() => {
  return notificationStore.isInDoNotDisturbTime
})

const statusText = computed(() => {
  if (!doNotDisturbEnabled.value) {
    return '免打扰已关闭'
  }
  
  if (isCurrentlyInDoNotDisturb.value) {
    return `免打扰中 (${startTime.value} - ${endTime.value})`
  } else {
    return `下次免打扰时间: ${startTime.value} - ${endTime.value}`
  }
})

// 方法
const goBack = () => {
  // 自动保存设置
  if (hasChanges.value) {
    saveSettings()
  }
  router.back()
}

const toggleDoNotDisturb = () => {
  doNotDisturbEnabled.value = !doNotDisturbEnabled.value
  // 立即保存设置
  if (doNotDisturbEnabled.value) {
    notificationStore.setDoNotDisturbTime(startTime.value, endTime.value)
  } else {
    notificationStore.disableDoNotDisturb()
  }
}

const showTimePicker = (isStart: boolean) => {
  const time = isStart ? startTime.value : endTime.value
  const [hour, minute] = time.split(':').map(Number)
  selectedHour.value = hour
  selectedMinute.value = minute
  
  if (isStart) {
    showStartTimePicker.value = true
  } else {
    showEndTimePicker.value = true
  }
}

const closeTimePicker = () => {
  showStartTimePicker.value = false
  showEndTimePicker.value = false
}

const confirmTime = () => {
  const timeString = `${selectedHour.value.toString().padStart(2, '0')}:${selectedMinute.value.toString().padStart(2, '0')}`

  if (showStartTimePicker.value) {
    startTime.value = timeString
  } else if (showEndTimePicker.value) {
    endTime.value = timeString
  }

  // 立即保存设置
  if (doNotDisturbEnabled.value) {
    notificationStore.setDoNotDisturbTime(startTime.value, endTime.value)
  }

  closeTimePicker()
}

const saveSettings = () => {
  if (doNotDisturbEnabled.value) {
    notificationStore.setDoNotDisturbTime(startTime.value, endTime.value)
  } else {
    notificationStore.disableDoNotDisturb()
  }
  
  router.back()
}

// 初始化
onMounted(() => {
  notificationStore.init().then(() => {
    doNotDisturbEnabled.value = notificationStore.settings.doNotDisturbEnabled
    startTime.value = notificationStore.settings.doNotDisturbStart
    endTime.value = notificationStore.settings.doNotDisturbEnd
    
    // 保存原始设置
    originalSettings.value = {
      doNotDisturbEnabled: doNotDisturbEnabled.value,
      startTime: startTime.value,
      endTime: endTime.value
    }
  })
})
</script>

<style scoped lang="scss">
.do-not-disturb {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  
  .back-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    
    &:hover {
      background: #f0f0f0;
    }
  }
  
  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .save-btn {
    padding: 6px 12px;
    background: #07C160;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    &:not(:disabled):hover {
      background: #06a552;
    }
  }
}

.settings-section {
  background: white;
  margin-bottom: 8px;
  
  .section-title {
    padding: 16px 16px 8px;
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  
  .setting-info {
    flex: 1;
    
    span:first-child {
      display: block;
      font-size: 16px;
      color: #333;
      margin-bottom: 4px;
    }
    
    .setting-desc {
      font-size: 14px;
      color: #666;
    }
  }
}

.setting-toggle {
  width: 44px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &.active {
    background: #07C160;
  }
  
  .toggle-thumb {
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 10px;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &.active .toggle-thumb {
    transform: translateX(20px);
  }
}

.time-settings {
  .time-picker-section {
    background: white;
    
    .time-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      label {
        font-size: 16px;
        color: #333;
      }
      
      .time-picker {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: #666;
        
        span {
          font-size: 16px;
        }
      }
    }
  }
}

.status-section {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
  
  .status-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666;
  }
}

.description-section {
  background: white;
  padding: 16px;
  
  p {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }
}

.time-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.time-picker-dialog {
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  max-height: 50vh;
  
  .time-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    
    button {
      background: none;
      border: none;
      color: #07C160;
      font-size: 16px;
      cursor: pointer;
    }
    
    span {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .time-picker-content {
    padding: 16px;
    
    .time-wheels {
      display: flex;
      gap: 32px;
      justify-content: center;
      
      .time-wheel {
        text-align: center;
        
        .wheel-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }
        
        .wheel-options {
          max-height: 200px;
          overflow-y: auto;
          
          .wheel-option {
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 6px;
            margin: 2px 0;
            
            &:hover {
              background: #f0f0f0;
            }
            
            &.active {
              background: #07C160;
              color: white;
            }
          }
        }
      }
    }
  }
}
</style>
