/**
 * 平台检测工具
 * 支持Web、Android、iOS平台识别
 */

export type Platform = 'web' | 'android' | 'ios' | 'unknown'

export interface PlatformInfo {
  platform: Platform
  isWeb: boolean
  isMobile: boolean
  isAndroid: boolean
  isIOS: boolean
  userAgent: string
}

/**
 * 检测当前运行平台
 */
export function detectPlatform(): PlatformInfo {
  const userAgent = navigator.userAgent.toLowerCase()
  
  let platform: Platform = 'unknown'
  
  // 检测是否在App内（通过自定义User-Agent）
  if (userAgent.includes('yeyu-android')) {
    platform = 'android'
  } else if (userAgent.includes('yeyu-ios')) {
    platform = 'ios'
  } else if (userAgent.includes('android')) {
    platform = 'android'
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    platform = 'ios'
  } else {
    platform = 'web'
  }
  
  return {
    platform,
    isWeb: platform === 'web',
    isMobile: platform === 'android' || platform === 'ios',
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    userAgent
  }
}

/**
 * 获取当前平台的地图API Key
 */
export function getMapApiKey(): string {
  const { platform } = detectPlatform()
  
  switch (platform) {
    case 'web':
      return import.meta.env.VITE_AMAP_WEB_KEY || 'demo_key'
    case 'android':
      return import.meta.env.VITE_AMAP_ANDROID_KEY || 'demo_key'
    case 'ios':
      return import.meta.env.VITE_AMAP_IOS_KEY || 'demo_key'
    default:
      return import.meta.env.VITE_AMAP_WEB_KEY || 'demo_key'
  }
}

/**
 * 检测是否支持地理定位
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator
}

/**
 * 检测是否支持设备方向
 */
export function isOrientationSupported(): boolean {
  return 'DeviceOrientationEvent' in window
}

/**
 * 检测是否在PWA模式下运行
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

/**
 * 获取设备信息
 */
export function getDeviceInfo() {
  const { platform, userAgent } = detectPlatform()
  
  return {
    platform,
    userAgent,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    features: {
      geolocation: isGeolocationSupported(),
      orientation: isOrientationSupported(),
      pwa: isPWA()
    }
  }
}
