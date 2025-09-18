/**
 * Toast 提示工具
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  duration?: number
  position?: 'top' | 'center' | 'bottom'
}

/**
 * 安全显示 Toast 提示
 * @param message 提示消息
 * @param type 提示类型
 * @param options 选项
 */
export function safeShowToast(
  message: string, 
  type: ToastType = 'info', 
  options: ToastOptions = {}
) {
  try {
    // 简单的 alert 实现，后续可以替换为更好的 toast 组件
    const typeEmoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }
    
    const displayMessage = `${typeEmoji[type]} ${message}`
    
    // 使用 console.log 在开发环境显示
    console.log(`[Toast ${type.toUpperCase()}]:`, message)
    
    // 在生产环境可以使用更好的 toast 库
    if (typeof window !== 'undefined') {
      // 简单的浏览器提示
      if (type === 'error') {
        alert(displayMessage)
      } else {
        // 对于非错误类型，只在控制台显示，避免过多弹窗
        console.info(displayMessage)
      }
    }
  } catch (error) {
    console.error('Toast 显示失败:', error)
  }
}

/**
 * 显示成功提示
 */
export function showSuccess(message: string, options?: ToastOptions) {
  safeShowToast(message, 'success', options)
}

/**
 * 显示错误提示
 */
export function showError(message: string, options?: ToastOptions) {
  safeShowToast(message, 'error', options)
}

/**
 * 显示警告提示
 */
export function showWarning(message: string, options?: ToastOptions) {
  safeShowToast(message, 'warning', options)
}

/**
 * 显示信息提示
 */
export function showInfo(message: string, options?: ToastOptions) {
  safeShowToast(message, 'info', options)
}
