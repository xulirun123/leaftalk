<template>
  <div class="notifications">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">新消息通知</div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 接收新消息通知 -->
      <div class="settings-section">
        <div class="setting-item">
          <div class="setting-info">
            <span>接收新消息通知</span>
            <span class="setting-desc">关闭后，将无法正常接收消息通知</span>
          </div>
          <ToggleSwitch
            :model-value="receiveNotifications"
            @update:model-value="toggleReceiveNotifications"
          />
        </div>
      </div>

      <!-- 通知显示消息详情 -->
      <div class="settings-section">
        <div class="setting-item">
          <div class="setting-info">
            <span>通知显示消息详情</span>
            <span class="setting-desc">关闭后，新消息通知将不显示发送人和内容摘要</span>
          </div>
          <ToggleSwitch
            :model-value="showMessageDetails"
            @update:model-value="toggleShowMessageDetails"
          />
        </div>
      </div>

      <!-- 声音 -->
      <div class="settings-section">
        <div class="section-title">声音</div>
        <div class="setting-item" @click="goToEnhancedNotificationSound">
          <div class="setting-info">
            <span>消息提示音</span>
            <span class="new-badge">增强版</span>
            <span class="setting-value">{{ currentSound }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="setNotificationSound">
          <div class="setting-info">
            <span>经典提示音</span>
            <span class="setting-value">{{ currentSound }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="setCallSound">
          <div class="setting-info">
            <span>语音和视频通话提示音</span>
            <span class="setting-value">{{ callSoundLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="goToCallMusic">
          <div class="setting-info">
            <span>通话背景音乐</span>
            <span class="new-badge">新功能</span>
            <span class="setting-value">{{ callMusicLabel }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 震动 -->
      <div class="settings-section">
        <div class="section-title">震动</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>震动</span>
          </div>
          <ToggleSwitch
            :model-value="vibrationEnabled"
            @update:model-value="toggleVibration"
          />
        </div>
      </div>

      <!-- 免打扰 -->
      <div class="settings-section">
        <div class="section-title">免打扰</div>
        <div class="setting-item" @click="setDoNotDisturbTime">
          <div class="setting-info">
            <span>免打扰时间</span>
            <span class="setting-value">{{ doNotDisturbTime }}</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>群聊免打扰</span>
            <span class="setting-desc">开启后，群聊消息将不会发送通知</span>
          </div>
          <ToggleSwitch
            :model-value="groupChatMuted"
            @update:model-value="toggleGroupChatMute"
          />
        </div>
      </div>

      <!-- 朋友圈更新 -->
      <div class="settings-section">
        <div class="section-title">朋友圈更新</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>朋友圈照片更新</span>
          </div>
          <ToggleSwitch
            :model-value="momentsPhotoUpdates"
            @update:model-value="toggleMomentsPhotoUpdates"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>朋友圈视频更新</span>
          </div>
          <ToggleSwitch
            :model-value="momentsVideoUpdates"
            @update:model-value="toggleMomentsVideoUpdates"
          />
        </div>
      </div>

      <!-- 功能消息免打扰 -->
      <div class="settings-section">
        <div class="section-title">功能消息免打扰</div>
        <div class="setting-item">
          <div class="setting-info">
            <span>QQ邮箱提醒</span>
          </div>
          <ToggleSwitch
            :model-value="emailNotifications"
            @update:model-value="toggleEmailNotifications"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>叶语运动</span>
          </div>
          <ToggleSwitch
            :model-value="sportsNotifications"
            @update:model-value="toggleSportsNotifications"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span>叶语支付</span>
          </div>
          <ToggleSwitch
            :model-value="paymentNotifications"
            @update:model-value="togglePaymentNotifications"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../../../../stores/notification'
import ToggleSwitch from '../../../../shared/components/common/ToggleSwitch.vue'

const router = useRouter()
const notificationStore = useNotificationStore()

// 使用通知store
const receiveNotifications = computed({
  get: () => notificationStore.settings.receiveNotifications,
  set: (value) => notificationStore.updateSetting('receiveNotifications', value)
})

const showMessageDetails = computed({
  get: () => notificationStore.settings.showMessageDetails,
  set: (value) => notificationStore.updateSetting('showMessageDetails', value)
})

const callSoundEnabled = computed({
  get: () => notificationStore.settings.callSoundEnabled,
  set: (value) => notificationStore.updateSetting('callSoundEnabled', value)
})

const vibrationEnabled = computed({
  get: () => notificationStore.settings.vibrationEnabled,
  set: (value) => notificationStore.updateSetting('vibrationEnabled', value)
})

const groupChatMuted = computed({
  get: () => notificationStore.settings.groupChatMuted,
  set: (value) => notificationStore.updateSetting('groupChatMuted', value)
})

const momentsPhotoUpdates = computed({
  get: () => notificationStore.settings.momentsPhotoUpdates,
  set: (value) => notificationStore.updateSetting('momentsPhotoUpdates', value)
})

const momentsVideoUpdates = computed({
  get: () => notificationStore.settings.momentsVideoUpdates,
  set: (value) => notificationStore.updateSetting('momentsVideoUpdates', value)
})

const emailNotifications = computed({
  get: () => notificationStore.settings.emailNotifications,
  set: (value) => notificationStore.updateSetting('emailNotifications', value)
})

const sportsNotifications = computed({
  get: () => notificationStore.settings.sportsNotifications,
  set: (value) => notificationStore.updateSetting('sportsNotifications', value)
})

const paymentNotifications = computed({
  get: () => notificationStore.settings.paymentNotifications,
  set: (value) => notificationStore.updateSetting('paymentNotifications', value)
})

// 计算属性
const currentSound = computed(() => notificationStore.currentSoundName)
const doNotDisturbTime = computed(() => notificationStore.doNotDisturbTimeDisplay)

const callSoundLabel = computed(() => {
  const sound = notificationStore.NOTIFICATION_SOUNDS.find(s => s.id === notificationStore.settings.callSoundType)
  return sound ? sound.name : '默认'
})

const callMusicLabel = computed(() => {
  if (notificationStore.settings.callMusicEnabled) {
    const musicName = getMusicName(notificationStore.settings.callMusicId)
    return musicName || '已开启'
  }
  return '已关闭'
})

const getMusicName = (musicId: string) => {
  const musicMap: Record<string, string> = {
    'classical_1': '月光奏鸣曲',
    'classical_2': '小夜曲',
    'classical_3': '春天',
    'modern_1': '轻柔旋律',
    'modern_2': '温暖时光',
    'modern_3': '静谧夜晚',
    'nature_1': '森林鸟鸣',
    'nature_2': '海浪声',
    'nature_3': '雨声'
  }
  return musicMap[musicId] || '自定义音乐'
}

const goBack = () => {
  router.back()
}

// 切换开关
const toggleReceiveNotifications = () => {
  receiveNotifications.value = !receiveNotifications.value
}

const toggleShowMessageDetails = () => {
  showMessageDetails.value = !showMessageDetails.value
}

const toggleCallSound = () => {
  callSoundEnabled.value = !callSoundEnabled.value
}

const toggleVibration = () => {
  vibrationEnabled.value = !vibrationEnabled.value
}

const toggleGroupChatMute = () => {
  groupChatMuted.value = !groupChatMuted.value
}

const toggleMomentsPhotoUpdates = () => {
  momentsPhotoUpdates.value = !momentsPhotoUpdates.value
}

const toggleMomentsVideoUpdates = () => {
  momentsVideoUpdates.value = !momentsVideoUpdates.value
}

const toggleEmailNotifications = () => {
  emailNotifications.value = !emailNotifications.value
}

const toggleSportsNotifications = () => {
  sportsNotifications.value = !sportsNotifications.value
}

const togglePaymentNotifications = () => {
  paymentNotifications.value = !paymentNotifications.value
}

// 页面跳转
const setNotificationSound = () => {
  router.push('/settings/notification-sound')
}

const goToEnhancedNotificationSound = () => {
  router.push('/settings/enhanced-notification-sound')
}

const setCallSound = () => {
  router.push('/settings/call-sound')
}

const goToCallMusic = () => {
  router.push('/settings/call-music')
}

const setDoNotDisturbTime = () => {
  router.push('/settings/do-not-disturb')
}

// 初始化
onMounted(() => {
  notificationStore.init()
})
</script>

<style scoped>
.notifications {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.settings-content {
  margin-top: 60px;
  padding: 16px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-info span:first-child {
  font-size: 16px;
  color: #333;
}

.setting-value {
  font-size: 14px;
  color: #666;
}

.new-badge {
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  margin: 0 8px;
  font-weight: 500;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.setting-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.new-badge {
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  margin-left: 8px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 开关样式已移至 ToggleSwitch 组件 */
</style>
