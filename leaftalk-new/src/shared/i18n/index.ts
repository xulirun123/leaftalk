import { createI18n } from 'vue-i18n'

// 导入语言包
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import en from './locales/en.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import ms from './locales/ms.json'

// 其他语言文件暂时使用空对象，避免导入错误
const vi = {}
const th = {}
const id = {}

// 支持的语言列表
export const supportedLocales = [
  {
    code: 'zh-CN',
    name: '简体中文',
    nativeName: '简体中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: 'zh-CN',
    currency: 'CNY',
    genealogyFormat: 'chinese-traditional'
  },
  {
    code: 'zh-TW',
    name: '繁體中文',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    rtl: false,
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: 'zh-TW',
    currency: 'TWD',
    genealogyFormat: 'chinese-traditional'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
    currency: 'USD',
    genealogyFormat: 'western'
  },
  {
    code: 'ja',
    name: '日本語',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: 'ja-JP',
    currency: 'JPY',
    genealogyFormat: 'japanese'
  },
  {
    code: 'ko',
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    dateFormat: 'YYYY년 MM월 DD일',
    numberFormat: 'ko-KR',
    currency: 'KRW',
    genealogyFormat: 'korean'
  },
  {
    code: 'vi',
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'vi-VN',
    currency: 'VND',
    genealogyFormat: 'vietnamese'
  },
  {
    code: 'th',
    name: 'ไทย',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'th-TH',
    currency: 'THB',
    genealogyFormat: 'thai'
  },
  {
    code: 'ms',
    name: 'Bahasa Melayu',
    nativeName: 'Bahasa Melayu',
    flag: '🇲🇾',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'ms-MY',
    currency: 'MYR',
    genealogyFormat: 'malay'
  },
  {
    code: 'id',
    name: 'Bahasa Indonesia',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'id-ID',
    currency: 'IDR',
    genealogyFormat: 'indonesian'
  }
]

// 获取浏览器语言
const getBrowserLocale = (): string => {
  const navigatorLocale = navigator.language || (navigator as any).userLanguage
  
  // 检查是否支持完整的语言代码
  if (supportedLocales.some(locale => locale.code === navigatorLocale)) {
    return navigatorLocale
  }
  
  // 检查是否支持语言的主要部分
  const languageCode = navigatorLocale.split('-')[0]
  const matchedLocale = supportedLocales.find(locale => 
    locale.code.split('-')[0] === languageCode
  )
  
  return matchedLocale?.code || 'zh-CN'
}

// 获取保存的语言设置
const getSavedLocale = (): string => {
  const saved = localStorage.getItem('user-locale')
  if (saved && supportedLocales.some(locale => locale.code === saved)) {
    return saved
  }
  return getBrowserLocale()
}

// 创建i18n实例
const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'zh': zhCN,  // 添加 'zh' 作为 'zh-CN' 的别名
    'zh-TW': zhTW,
    'en': en,
    'ja': ja,
    'ko': ko,
    'vi': vi,
    'th': th,
    'ms': ms,
    'id': id
  },
  numberFormats: {
    'zh-CN': {
      currency: {
        style: 'currency',
        currency: 'CNY',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        useGrouping: false
      }
    },
    'zh': {  // 添加 'zh' 作为 'zh-CN' 的别名
      currency: {
        style: 'currency',
        currency: 'CNY',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        useGrouping: false
      }
    },
    'zh-TW': {
      currency: {
        style: 'currency',
        currency: 'TWD',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        useGrouping: false
      }
    },
    'en': {
      currency: {
        style: 'currency',
        currency: 'USD',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        useGrouping: false
      }
    },
    'ja': {
      currency: {
        style: 'currency',
        currency: 'JPY',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      },
      percent: {
        style: 'percent',
        useGrouping: false
      }
    },
    'ko': {
      currency: {
        style: 'currency',
        currency: 'KRW',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      },
      percent: {
        style: 'percent',
        useGrouping: false
      }
    }
  },
  datetimeFormats: {
    'zh-CN': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    'zh': {  // 添加 'zh' 作为 'zh-CN' 的别名
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    'zh-TW': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    'en': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }
    },
    'ja': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    'ko': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    }
  }
})

// 切换语言
export const setLocale = (locale: string) => {
  if (supportedLocales.some(l => l.code === locale)) {
    i18n.global.locale.value = locale as any
    localStorage.setItem('user-locale', locale)
    
    // 更新HTML lang属性
    document.documentElement.lang = locale
    
    // 更新页面方向
    const localeConfig = supportedLocales.find(l => l.code === locale)
    if (localeConfig) {
      document.documentElement.dir = localeConfig.rtl ? 'rtl' : 'ltr'
    }
    
    return true
  }
  return false
}

// 获取当前语言配置
export const getCurrentLocaleConfig = () => {
  const currentLocale = i18n.global.locale.value
  return supportedLocales.find(locale => locale.code === currentLocale)
}

// 格式化日期
export const formatDate = (date: Date | string, format: 'short' | 'long' = 'short') => {
  const d = typeof date === 'string' ? new Date(date) : date
  const locale = i18n.global.locale.value
  const formats = (i18n.global.datetimeFormats.value as any)[locale]
  return new Intl.DateTimeFormat(locale, formats?.[format] || {}).format(d)
}

// 格式化数字
export const formatNumber = (number: number, format: 'decimal' | 'currency' | 'percent' = 'decimal') => {
  const locale = i18n.global.locale.value
  const formats = (i18n.global.numberFormats.value as any)[locale]
  return new Intl.NumberFormat(locale, formats?.[format] || {}).format(number)
}

// 格式化货币
export const formatCurrency = (amount: number) => {
  return formatNumber(amount, 'currency')
}

// 格式化百分比
export const formatPercent = (value: number) => {
  return formatNumber(value / 100, 'percent')
}

// 获取相对时间
export const getRelativeTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const locale = i18n.global.locale.value
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  
  const now = new Date()
  const diffInSeconds = Math.floor((d.getTime() - now.getTime()) / 1000)
  
  const intervals = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 }
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds)
    if (count >= 1) {
      return rtf.format(diffInSeconds < 0 ? -count : count, interval.unit as Intl.RelativeTimeFormatUnit)
    }
  }
  
  return rtf.format(0, 'second')
}

// 检测RTL语言
export const isRTL = () => {
  const currentConfig = getCurrentLocaleConfig()
  return currentConfig?.rtl || false
}

// 获取族谱格式
export const getGenealogyFormat = () => {
  const currentConfig = getCurrentLocaleConfig()
  return currentConfig?.genealogyFormat || 'chinese-traditional'
}

export default i18n
