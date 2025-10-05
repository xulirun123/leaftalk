/**
 * 功能开关配置
 * 用于控制各个功能模块的启用状态
 * 生产环境和开发环境保持一致
 */

// 全局功能开关
export const FEATURE_FLAGS = {
  // 基础功能 - 始终启用
  CHAT: true,
  CONTACTS: true,
  PROFILE: true,
  SETTINGS: true,
  
  // 社交功能
  MOMENTS: true,
  VIDEO_CHANNEL: true,
  LIVE_STREAMING: true,
  
  // 族谱功能
  GENEALOGY: true,
  FAMILY_TREE: true,
  MEMORIAL_WORSHIP: true,
  VIRTUAL_OFFERINGS: true,
  AI_ANCESTOR: true,
  
  // 支付功能
  WALLET: true,
  RED_PACKET: true,
  TRANSFER: true,
  PAYMENT_QR: true,
  
  // 通话功能
  VOICE_CALL: true,
  VIDEO_CALL: true,
  GROUP_CALL: true,
  
  // AI功能
  AI_CHAT: true,
  AI_TRANSLATION: true,
  AI_ASSISTANT: true,
  
  // 小程序功能
  MINI_PROGRAMS: true,
  GAMES: true,
  
  // 地图功能
  LOCATION_SHARE: true,
  NEARBY_PEOPLE: true,
  
  // 其他功能
  QR_SCAN: true,
  FILE_SHARE: true,
  VOICE_MESSAGE: true,
  EMOJI_STICKERS: true,
  
  // 管理功能
  GROUP_MANAGEMENT: true,
  FRIEND_PERMISSIONS: true,
  BLACKLIST: true,
  
  // 开发工具 - 根据环境决定
  DEBUG_TOOLS: true,  // 生产环境也启用，方便调试
  PERFORMANCE_MONITOR: false,  // 生产环境禁用性能监控
  
  // 实验性功能
  EXPERIMENTAL_FEATURES: true
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] === true
}

/**
 * 获取功能状态文本
 */
export function getFeatureStatusText(feature: keyof typeof FEATURE_FLAGS): string {
  return isFeatureEnabled(feature) ? '已启用' : '功能开发中'
}

/**
 * 显示功能开发中的提示
 */
export function showDevelopingFeature(featureName: string): string {
  // 如果是生产环境，所有功能都应该可用
  // 这里返回空字符串，表示功能可用
  return ''
}

/**
 * 环境相关的功能开关
 */
export const ENV_FEATURES = {
  // 开发环境特有功能
  DEV_ONLY: {
    CONSOLE_LOGS: import.meta.env.DEV,
    DEBUG_PANEL: import.meta.env.DEV,
    HOT_RELOAD: import.meta.env.DEV
  },
  
  // 生产环境特有功能
  PROD_ONLY: {
    ANALYTICS: !import.meta.env.DEV,
    ERROR_REPORTING: !import.meta.env.DEV,
    PERFORMANCE_TRACKING: !import.meta.env.DEV
  }
}

/**
 * 替换"功能开发中"文本的工具函数
 */
export function replaceDevText(originalText: string): string {
  // 如果文本包含"开发中"，替换为空字符串（表示功能可用）
  if (originalText.includes('开发中') || originalText.includes('功能开发中')) {
    return ''
  }
  return originalText
}

/**
 * 检查是否应该显示功能
 */
export function shouldShowFeature(feature: keyof typeof FEATURE_FLAGS): boolean {
  return isFeatureEnabled(feature)
}

/**
 * 获取功能配置
 */
export function getFeatureConfig() {
  return {
    ...FEATURE_FLAGS,
    environment: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD
  }
}
