import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface NotificationSound {
  id: string
  name: string
  file: string
  duration?: number
  category?: string
}

export interface NotificationSettings {
  // 基本通知设置
  receiveNotifications: boolean
  showMessageDetails: boolean

  // 声音设置
  soundEnabled: boolean
  soundType: string
  callSoundEnabled: boolean
  callSoundType: string

  // 通话背景音乐设置
  callMusicEnabled: boolean
  callMusicId: string
  callMusicVolume: number
  callMusicLoop: boolean

  // 震动设置
  vibrationEnabled: boolean

  // 免打扰设置
  doNotDisturbEnabled: boolean
  doNotDisturbStart: string
  doNotDisturbEnd: string

  // 群聊设置
  groupChatMuted: boolean

  // 朋友圈设置
  momentsPhotoUpdates: boolean
  momentsVideoUpdates: boolean

  // 功能消息设置
  emailNotifications: boolean
  sportsNotifications: boolean
  paymentNotifications: boolean
}

// 声音分类常量
export const SOUND_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'system', name: '系统' },
  { id: 'classic', name: '经典' },
  { id: 'modern', name: '现代' },
  { id: 'nature', name: '自然' },
  { id: 'custom', name: '自定义' }
]

// 通知声音常量
export const NOTIFICATION_SOUNDS = [
  { id: 'default', name: '默认', file: 'default.mp3', category: 'system' },
  { id: 'ding', name: '叮咚', file: 'ding.mp3', category: 'classic' },
  { id: 'bell', name: '铃声', file: 'bell.mp3', category: 'classic' },
  { id: 'chime', name: '钟声', file: 'chime.mp3', category: 'classic' },
  { id: 'pop', name: '泡泡', file: 'pop.mp3', category: 'modern' },
  { id: 'whistle', name: '哨声', file: 'whistle.mp3', category: 'modern' },
  { id: 'notification', name: '通知', file: 'notification.mp3', category: 'system' },
  { id: 'birds', name: '鸟鸣', file: 'birds.mp3', category: 'nature' },
  { id: 'water', name: '流水', file: 'water.mp3', category: 'nature' },
  { id: 'wind', name: '风声', file: 'wind.mp3', category: 'nature' },
  { id: 'piano', name: '钢琴', file: 'piano.mp3', category: 'modern' },
  { id: 'guitar', name: '吉他', file: 'guitar.mp3', category: 'modern' }
]

// 默认设置
const defaultSettings: NotificationSettings = {
  receiveNotifications: true,
  showMessageDetails: true,
  soundEnabled: true,
  soundType: '默认',
  callSoundEnabled: true,
  callSoundType: 'default',
  callMusicEnabled: false,
  callMusicId: 'classical_1',
  callMusicVolume: 60,
  callMusicLoop: true,
  vibrationEnabled: true,
  doNotDisturbEnabled: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
  groupChatMuted: false,
  momentsPhotoUpdates: true,
  momentsVideoUpdates: true,
  emailNotifications: true,
  sportsNotifications: false,
  paymentNotifications: true
}

export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const settings = ref<NotificationSettings>({ ...defaultSettings })
  const isInitialized = ref(false)

  // 可用的通知声音
  const availableSounds = ref<NotificationSound[]>(NOTIFICATION_SOUNDS)

  // 计算属性
  const currentSoundName = computed(() => {
    const sound = availableSounds.value.find(s => s.id === settings.value.soundType)
    return sound?.name || '默认'
  })

  const doNotDisturbTimeDisplay = computed(() => {
    if (!settings.value.doNotDisturbEnabled) {
      return '未设置'
    }
    return `${settings.value.doNotDisturbStart} - ${settings.value.doNotDisturbEnd}`
  })

  // 初始化
  const init = async () => {
    if (isInitialized.value) return

    try {
      // 从本地存储加载设置
      const savedSettings = localStorage.getItem('notification_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        settings.value = { ...defaultSettings, ...parsed }
        console.log('✅ 通知设置已从本地存储加载')
      }

      // 请求通知权限
      await requestNotificationPermission()

      isInitialized.value = true
    } catch (error) {
      console.error('❌ 通知设置初始化失败:', error)
      settings.value = { ...defaultSettings }
    }
  }

  // 保存设置
  const saveSettings = async () => {
    try {
      // 保存到本地存储
      localStorage.setItem('notification_settings', JSON.stringify(settings.value))
      console.log('✅ 通知设置已保存')
    } catch (error) {
      console.error('❌ 通知设置保存失败:', error)
    }
  }

  // 更新单个设置
  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    settings.value[key] = value
    saveSettings()
    applySettingChange(key, value)
  }

  // 批量更新设置
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    Object.assign(settings.value, newSettings)
    saveSettings()
  }

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      console.log('通知权限状态:', permission)
      return permission === 'granted'
    }
    return false
  }

  // 播放通知声音
  const playNotificationSound = () => {
    if (!settings.value.soundEnabled) return

    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('播放通知声音失败:', error)
    }
  }

  // 应用设置变更
  const applySettingChange = (key: keyof NotificationSettings, value: any) => {
    switch (key) {
      case 'receiveNotifications':
        if (value) {
          requestNotificationPermission()
        }
        break
      case 'soundType':
        // 预览新的提示音
        if (value !== 'none') {
          playNotificationSound()
        }
        break
    }
  }

  // 设置免打扰时间
  const setDoNotDisturbTime = (start: string, end: string) => {
    updateSettings({
      doNotDisturbEnabled: true,
      doNotDisturbStart: start,
      doNotDisturbEnd: end
    })
  }

  // 禁用免打扰
  const disableDoNotDisturb = () => {
    updateSetting('doNotDisturbEnabled', false)
  }

  return {
    // 状态
    settings,
    isInitialized,
    availableSounds,

    // 常量
    NOTIFICATION_SOUNDS,
    SOUND_CATEGORIES,

    // 计算属性
    currentSoundName,
    doNotDisturbTimeDisplay,

    // 方法
    init,
    saveSettings,
    updateSetting,
    updateSettings,
    requestNotificationPermission,
    playNotificationSound,
    setDoNotDisturbTime,
    disableDoNotDisturb
  }
})
