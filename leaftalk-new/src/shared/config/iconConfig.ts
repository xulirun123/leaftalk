/**
 * 叶语统一图标配置
 * 管理整个应用的图标映射和样式
 */

// 图标映射配置
export const ICON_MAP = {
  // 底部导航图标
  nav: {
    chat: 'mdi:leaf', // 叶语使用叶子图标
    contacts: 'mdi:account-group',
    discover: 'mdi:compass',
    genealogy: 'mdi:family-tree', // 族谱使用族谱图标
    profile: 'mdi:account'
  },

  // 通用功能图标
  common: {
    search: 'heroicons:magnifying-glass-20-solid', // 更粗的搜索图标
    add: 'heroicons:plus-circle', // 带圆圈的加号
    back: 'heroicons:chevron-left',
    forward: 'heroicons:chevron-right',
    close: 'heroicons:x-mark',
    menu: 'heroicons:bars-3',
    more: 'heroicons:ellipsis-horizontal',
    edit: 'heroicons:pencil',
    delete: 'heroicons:trash',
    share: 'heroicons:share',
    download: 'heroicons:arrow-down-tray',
    upload: 'heroicons:arrow-up-tray',
    refresh: 'heroicons:arrow-path',
    settings: 'heroicons:cog-6-tooth',
    notification: 'heroicons:bell',
    star: 'heroicons:star',
    heart: 'heroicons:heart',
    bookmark: 'heroicons:bookmark',
    flag: 'heroicons:flag',
    eye: 'heroicons:eye',
    eyeOff: 'heroicons:eye-slash',
    leaf: 'heroicons:leaf' // 叶子图标
  },

  // 聊天相关图标
  chat: {
    send: 'heroicons:paper-airplane',
    voice: 'heroicons:microphone',
    emoji: 'heroicons:face-smile',
    image: 'heroicons:photo',
    file: 'heroicons:document',
    video: 'heroicons:video-camera',
    phone: 'heroicons:phone',
    group: 'heroicons:user-group'
  },

  // 联系人相关图标
  contacts: {
    user: 'heroicons:user',
    users: 'heroicons:users',
    userAdd: 'heroicons:user-plus',
    userRemove: 'heroicons:user-minus',
    phone: 'heroicons:device-phone-mobile',
    email: 'heroicons:envelope',
    location: 'heroicons:map-pin'
  },

  // 发现页面图标
  discover: {
    moments: 'heroicons:photo',
    video: 'heroicons:play-circle', // 视频号用播放图标
    live: 'heroicons:video-camera', // 直播用摄像头图标
    games: 'heroicons:puzzle-piece',
    shopping: 'heroicons:shopping-bag',
    news: 'heroicons:newspaper',
    weather: 'heroicons:sun',
    music: 'heroicons:musical-note',
    sports: 'heroicons:trophy'
  },

  // 个人中心图标
  profile: {
    avatar: 'heroicons:user-circle',
    qrcode: 'heroicons:qr-code',
    wallet: 'heroicons:credit-card',
    favorites: 'heroicons:heart',
    settings: 'heroicons:cog-6-tooth',
    help: 'heroicons:question-mark-circle',
    about: 'heroicons:information-circle',
    logout: 'heroicons:arrow-right-on-rectangle',
    security: 'heroicons:shield-check',
    privacy: 'heroicons:lock-closed',
    theme: 'heroicons:paint-brush',
    language: 'heroicons:language',
    notification: 'heroicons:bell',
    storage: 'heroicons:server',
    backup: 'heroicons:cloud-arrow-up'
  },

  // 族谱相关图标
  genealogy: {
    tree: 'heroicons:document-text',
    family: 'heroicons:users',
    member: 'heroicons:user',
    add: 'heroicons:user-plus',
    edit: 'heroicons:pencil',
    history: 'heroicons:clock',
    photo: 'heroicons:photo',
    document: 'heroicons:document',
    certificate: 'heroicons:academic-cap'
  },

  // 状态图标
  status: {
    success: 'heroicons:check-circle',
    error: 'heroicons:x-circle',
    warning: 'heroicons:exclamation-triangle',
    info: 'heroicons:information-circle',
    loading: 'heroicons:arrow-path'
  },

  // 媒体图标
  media: {
    play: 'heroicons:play',
    pause: 'heroicons:pause',
    stop: 'heroicons:stop',
    volume: 'heroicons:speaker-wave',
    volumeOff: 'heroicons:speaker-x-mark',
    camera: 'heroicons:camera',
    gallery: 'heroicons:photo'
  }
}

// 图标尺寸配置
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48
}

// 图标颜色配置
export const ICON_COLORS = {
  primary: '#07C160',
  secondary: '#666666',
  tertiary: '#999999',
  success: '#07C160',
  warning: '#FF9500',
  error: '#FA5151',
  info: '#10AEFF',
  white: '#FFFFFF',
  black: '#1A1A1A'
}

// 获取图标名称的辅助函数
export function getIcon(category: keyof typeof ICON_MAP, name: string): string {
  const categoryIcons = ICON_MAP[category] as Record<string, string>
  return categoryIcons?.[name] || 'heroicons:question-mark-circle'
}

// 获取图标尺寸的辅助函数
export function getIconSize(size: keyof typeof ICON_SIZES): number {
  return ICON_SIZES[size] || ICON_SIZES.md
}

// 获取图标颜色的辅助函数
export function getIconColor(color: keyof typeof ICON_COLORS): string {
  return ICON_COLORS[color] || ICON_COLORS.black
}
