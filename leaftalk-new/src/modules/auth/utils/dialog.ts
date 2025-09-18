/**
 * 对话框工具函数
 */

// 显示警告对话框
export const showAlert = async (message: string, title: string = '提示'): Promise<void> => {
  return new Promise((resolve) => {
    // 使用浏览器原生alert作为降级方案
    alert(`${title}: ${message}`)
    resolve()
  })
}

// 显示确认对话框
export const showConfirm = async (message: string, title: string = '确认'): Promise<boolean> => {
  return new Promise((resolve) => {
    // 使用浏览器原生confirm作为降级方案
    const result = confirm(`${title}: ${message}`)
    resolve(result)
  })
}

// 显示输入对话框
export const showPrompt = async (message: string, defaultValue: string = '', title: string = '输入'): Promise<string | null> => {
  return new Promise((resolve) => {
    // 使用浏览器原生prompt作为降级方案
    const result = prompt(`${title}: ${message}`, defaultValue)
    resolve(result)
  })
}

// 显示Toast消息（简单实现）
export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void => {
  // 创建简单的toast元素
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${getToastColor(type)};
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease;
  `
  
  document.body.appendChild(toast)
  
  // 3秒后自动移除
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

// 获取Toast颜色
const getToastColor = (type: string): string => {
  switch (type) {
    case 'success':
      return '#07C160'
    case 'error':
      return '#FA5151'
    case 'warning':
      return '#FF976A'
    case 'info':
    default:
      return '#576B95'
  }
}

// 显示加载对话框
export const showLoading = (message: string = '加载中...'): (() => void) => {
  const loading = document.createElement('div')
  loading.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    ">
      <div style="
        background: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        min-width: 120px;
      ">
        <div style="
          width: 20px;
          height: 20px;
          border: 2px solid #07C160;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        "></div>
        <div style="color: #333; font-size: 14px;">${message}</div>
      </div>
    </div>
  `
  
  // 添加旋转动画
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
  document.body.appendChild(loading)
  
  // 返回关闭函数
  return () => {
    if (loading.parentNode) {
      loading.parentNode.removeChild(loading)
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style)
    }
  }
}
