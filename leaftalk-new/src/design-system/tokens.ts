/**
 * 设计系统 - 设计令牌
 * 定义应用的颜色、字体、间距等设计规范
 */

// 颜色系统
export const colors = {
  // 主色调 - 微信绿
  primary: {
    50: '#f0f9f4',
    100: '#dcf2e3',
    200: '#bbe5ca',
    300: '#8dd3a8',
    400: '#5bb87f',
    500: '#07C160', // 微信主绿色
    600: '#059649',
    700: '#047a3b',
    800: '#046230',
    900: '#035127',
  },
  
  // 辅助色
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // 背景色
  background: {
    primary: '#e5e5e5',
    secondary: '#e5e5e5',
    tertiary: '#e5e5e5', // 微信背景灰
    dark: '#1a1a1a',
  },
  
  // 文本色
  text: {
    primary: '#191919',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#FFFFFF',
    link: '#576B95', // 微信链接蓝
  },
  
  // 状态色
  status: {
    success: '#07C160',
    warning: '#FA9D3B',
    error: '#FA5151',
    info: '#10AEFF',
  },
  
  // 边框色
  border: {
    light: '#E5E5E5',
    medium: '#D1D1D1',
    dark: '#CCCCCC',
  }
}

// 字体系统
export const typography = {
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
}

// 间距系统 (8px 网格系统)
export const spacing = {
  0: '0',
  1: '4px',   // 0.5 * 8px
  2: '8px',   // 1 * 8px
  3: '12px',  // 1.5 * 8px
  4: '16px',  // 2 * 8px
  5: '20px',  // 2.5 * 8px
  6: '24px',  // 3 * 8px
  8: '32px',  // 4 * 8px
  10: '40px', // 5 * 8px
  12: '48px', // 6 * 8px
  16: '64px', // 8 * 8px
  20: '80px', // 10 * 8px
  24: '96px', // 12 * 8px
}

// 圆角系统
export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
}

// 阴影系统
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}

// Z-index 层级
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
}

// 断点系统
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// 动画系统
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  }
}

// 生成CSS变量
export function generateCSSVariables() {
  const cssVars: Record<string, string> = {}
  
  // 颜色变量
  Object.entries(colors).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        cssVars[`--color-${category}-${key}`] = value
      })
    } else {
      cssVars[`--color-${category}`] = values
    }
  })
  
  // 字体变量
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value
  })
  
  // 间距变量
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })
  
  // 圆角变量
  Object.entries(borderRadius).forEach(([key, value]) => {
    cssVars[`--border-radius-${key}`] = value
  })
  
  // 阴影变量
  Object.entries(shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value
  })
  
  return cssVars
}

// 导出所有设计令牌
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  breakpoints,
  animations,
}

export default tokens
